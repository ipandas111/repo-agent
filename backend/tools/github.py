import base64
import os
import httpx

GITHUB_API = "https://api.github.com"

def _headers() -> dict:
    token = os.getenv("GITHUB_TOKEN")
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h

def parse_github_url(url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL."""
    url = url.rstrip("/")
    if "github.com" not in url:
        raise ValueError(f"Not a GitHub URL: {url}")
    parts = url.split("github.com/")[-1].split("/")
    if len(parts) < 2 or not parts[0] or not parts[1]:
        raise ValueError(f"Cannot parse owner/repo from: {url}")
    return parts[0], parts[1]

def github_get_repo(owner: str, repo: str) -> dict:
    r = httpx.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers())
    r.raise_for_status()
    data = r.json()
    return {
        "name": data["name"],
        "description": data.get("description"),
        "language": data.get("language"),
        "stars": data["stargazers_count"],
        "forks": data["forks_count"],
        "open_issues": data["open_issues_count"],
        "default_branch": data["default_branch"],
        "topics": data.get("topics", []),
    }

def github_list_tree(owner: str, repo: str, branch: str = "HEAD") -> dict:
    r = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
        headers=_headers()
    )
    r.raise_for_status()
    data = r.json()
    paths = [item["path"] for item in data.get("tree", []) if item["type"] == "blob"]
    return {"file_count": len(paths), "files": paths[:200]}  # cap at 200

def github_read_file(owner: str, repo: str, path: str) -> dict:
    r = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        headers=_headers()
    )
    r.raise_for_status()
    data = r.json()
    if data.get("encoding") == "base64":
        content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    else:
        content = data.get("content", "")
    return {"path": path, "size": data.get("size", 0), "content": content[:8000]}  # cap 8KB

def github_search_code(owner: str, repo: str, query: str) -> dict:
    r = httpx.get(
        f"{GITHUB_API}/search/code",
        params={"q": f"{query} repo:{owner}/{repo}", "per_page": 10},
        headers=_headers()
    )
    r.raise_for_status()
    data = r.json()
    results = [{"path": item["path"], "url": item["html_url"]} for item in data.get("items", [])]
    return {"total": data.get("total_count", 0), "results": results}

def github_list_issues(owner: str, repo: str, state: str = "open") -> dict:
    r = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/issues",
        params={"state": state, "per_page": 10},
        headers=_headers()
    )
    r.raise_for_status()
    issues = [{"number": i["number"], "title": i["title"], "state": i["state"]} for i in r.json()]
    return {"issues": issues}

def github_list_prs(owner: str, repo: str, state: str = "open") -> dict:
    r = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
        params={"state": state, "per_page": 10},
        headers=_headers()
    )
    r.raise_for_status()
    prs = [{"number": p["number"], "title": p["title"], "state": p["state"]} for p in r.json()]
    return {"pull_requests": prs}

def github_get_languages(owner: str, repo: str) -> dict:
    r = httpx.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages", headers=_headers())
    r.raise_for_status()
    return r.json()

def github_get_commits(owner: str, repo: str) -> dict:
    r = httpx.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/commits",
        params={"per_page": 10},
        headers=_headers()
    )
    r.raise_for_status()
    commits = [
        {"sha": c["sha"][:7], "message": c["commit"]["message"].split("\n")[0],
         "author": c["commit"]["author"]["name"], "date": c["commit"]["author"]["date"]}
        for c in r.json()
    ]
    return {"commits": commits}
