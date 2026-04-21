import asyncio
import json
import os
from typing import AsyncGenerator
import anthropic
from tools.schemas import TOOLS
from tools.github import (
    github_get_repo, github_list_tree, github_read_file,
    github_search_code, github_list_issues, github_list_prs,
    github_get_languages, github_get_commits, parse_github_url
)
from tools.file import write_file

MAX_ITERATIONS = 20

SYSTEM_PROMPT = """You are a codebase analysis agent. The user will give you a GitHub repository URL and a request.
Use the available tools to explore the repository and fulfill the request.
Always start by getting basic repo info and the file tree to understand the structure.
Be thorough but focused — only call tools you need to answer the request.
The GitHub repository to analyze is: {github_url}"""


def dispatch_tool(name: str, args: dict) -> dict:
    tool_map = {
        "github_get_repo": github_get_repo,
        "github_list_tree": github_list_tree,
        "github_read_file": github_read_file,
        "github_search_code": github_search_code,
        "github_list_issues": github_list_issues,
        "github_list_prs": github_list_prs,
        "github_get_languages": github_get_languages,
        "github_get_commits": github_get_commits,
        "write_file": write_file,
    }
    fn = tool_map.get(name)
    if fn is None:
        return {"error": f"Unknown tool: {name}"}
    try:
        return fn(**args)
    except Exception as e:
        return {"error": str(e)}


async def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def run_agent_demo(github_url: str, user_request: str) -> AsyncGenerator[str, None]:
    """Demo mode: uses real GitHub API but scripted reasoning (no Claude API key needed)."""
    owner, repo = parse_github_url(github_url)

    async def emit(event: dict, delay: float = 0.6):
        await asyncio.sleep(delay)
        yield await _sse(event)

    # Step 1: Think
    async for chunk in emit({"type": "think", "content": f'I need to analyze "{owner}/{repo}". Let me start by fetching basic repo info and the file tree to understand what we\'re working with.'}, 0.5):
        yield chunk

    # Step 2: Act — get repo
    async for chunk in emit({"type": "act", "tool": "github_get_repo", "args": {"owner": owner, "repo": repo}}, 0.8):
        yield chunk

    repo_info = dispatch_tool("github_get_repo", {"owner": owner, "repo": repo})
    async for chunk in emit({"type": "observe", "content": json.dumps(repo_info)[:1500]}, 0.4):
        yield chunk

    # Step 3: Think
    lang = repo_info.get("language", "unknown")
    stars = repo_info.get("stars", 0)
    desc = repo_info.get("description") or "no description"
    async for chunk in emit({"type": "think", "content": f'This is a {lang} project with {stars:,} stars. Description: "{desc}". Now let me get the file tree to understand the structure.'}, 0.7):
        yield chunk

    # Step 4: Act — list tree
    async for chunk in emit({"type": "act", "tool": "github_list_tree", "args": {"owner": owner, "repo": repo}}, 0.8):
        yield chunk

    tree_info = dispatch_tool("github_list_tree", {"owner": owner, "repo": repo})
    files = tree_info.get("files", [])
    async for chunk in emit({"type": "observe", "content": f'{{"file_count": {tree_info.get("file_count", 0)}, "sample_files": {json.dumps(files[:20])}}}'}, 0.4):
        yield chunk

    # Step 5: Think
    async for chunk in emit({"type": "think", "content": f'I can see {tree_info.get("file_count", 0)} files. Let me check the language breakdown and recent commits to understand how active this project is.'}, 0.7):
        yield chunk

    # Step 6: Act — get languages
    async for chunk in emit({"type": "act", "tool": "github_get_languages", "args": {"owner": owner, "repo": repo}}, 0.8):
        yield chunk

    langs = dispatch_tool("github_get_languages", {"owner": owner, "repo": repo})
    async for chunk in emit({"type": "observe", "content": json.dumps(langs)}, 0.4):
        yield chunk

    # Step 7: Act — get commits
    async for chunk in emit({"type": "act", "tool": "github_get_commits", "args": {"owner": owner, "repo": repo}}, 0.6):
        yield chunk

    commits = dispatch_tool("github_get_commits", {"owner": owner, "repo": repo})
    recent = commits.get("commits", [])
    async for chunk in emit({"type": "observe", "content": json.dumps({"recent_commits": recent[:5]})}, 0.4):
        yield chunk

    # Step 8: Try to read README
    readme_path = next((f for f in files if f.lower() in ("readme.md", "readme.rst", "readme.txt", "readme")), None)
    if readme_path:
        async for chunk in emit({"type": "think", "content": f'Found a README at {readme_path}. Let me read it for a high-level summary.'}, 0.6):
            yield chunk

        async for chunk in emit({"type": "act", "tool": "github_read_file", "args": {"owner": owner, "repo": repo, "path": readme_path}}, 0.8):
            yield chunk

        readme = dispatch_tool("github_read_file", {"owner": owner, "repo": repo, "path": readme_path})
        preview = (readme.get("content") or "")[:500]
        async for chunk in emit({"type": "observe", "content": f'README preview: {preview}...'}, 0.4):
            yield chunk

    # Final answer
    total_bytes = sum(langs.values()) if isinstance(langs, dict) else 0
    lang_summary = ", ".join(f"{k} ({v/total_bytes*100:.0f}%)" for k, v in list(langs.items())[:3]) if total_bytes > 0 else lang

    last_commit = recent[0]["message"] if recent else "unknown"
    topics = ", ".join(repo_info.get("topics", [])) or "none"

    await asyncio.sleep(0.8)
    final = (
        f"**{owner}/{repo}** — {desc}\n\n"
        f"• Language: {lang_summary}\n"
        f"• {stars:,} stars · {repo_info.get('forks', 0):,} forks · {repo_info.get('open_issues', 0)} open issues\n"
        f"• {tree_info.get('file_count', 0)} files in repo\n"
        f"• Latest commit: \"{last_commit}\"\n"
        f"• Topics: {topics}\n\n"
        f"This project is {'actively maintained' if recent else 'less active'} and uses {lang} as its primary language."
    )
    yield await _sse({"type": "done", "result": final})


async def run_agent(github_url: str, user_request: str) -> AsyncGenerator[str, None]:
    if os.getenv("DEMO_MODE", "").lower() == "true":
        async for chunk in run_agent_demo(github_url, user_request):
            yield chunk
        return

    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    messages = [{"role": "user", "content": user_request}]
    system = SYSTEM_PROMPT.format(github_url=github_url)

    for _ in range(MAX_ITERATIONS):
        response = await client.messages.create(
            model="claude-opus-4-7",
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )

        think_text = " ".join(
            block.text for block in response.content
            if hasattr(block, "text") and block.text
        )
        if think_text:
            yield f"data: {json.dumps({'type': 'think', 'content': think_text})}\n\n"

        if response.stop_reason == "end_turn":
            yield f"data: {json.dumps({'type': 'done', 'result': think_text})}\n\n"
            return

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue

                tool_name = block.name
                tool_args = block.input

                yield f"data: {json.dumps({'type': 'act', 'tool': tool_name, 'args': tool_args})}\n\n"

                result = dispatch_tool(tool_name, tool_args)

                observe_payload = json.dumps(result)[:2000]
                yield f"data: {json.dumps({'type': 'observe', 'content': observe_payload})}\n\n"

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

    yield f"data: {json.dumps({'type': 'error', 'message': 'Max iterations reached'})}\n\n"
