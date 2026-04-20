import json
import os
from typing import AsyncGenerator
import anthropic
from tools.schemas import TOOLS
from tools.github import (
    github_get_repo, github_list_tree, github_read_file,
    github_search_code, github_list_issues, github_list_prs,
    github_get_languages, github_get_commits
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


async def run_agent(github_url: str, user_request: str) -> AsyncGenerator[str, None]:
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

                # Send result as object (not double-encoded string) for consistent frontend parsing
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
