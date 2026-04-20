TOOLS = [
    {
        "name": "github_get_repo",
        "description": "Get basic repo info: name, description, language, stars, forks, default branch.",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string", "description": "GitHub username or org"},
                "repo": {"type": "string", "description": "Repository name"}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "github_list_tree",
        "description": "Get the full file tree of the repository (up to 200 files).",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"},
                "branch": {"type": "string", "description": "Branch name, default HEAD"}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "github_read_file",
        "description": "Read the content of a specific file in the repository (up to 8KB).",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"},
                "path": {"type": "string", "description": "File path relative to repo root"}
            },
            "required": ["owner", "repo", "path"]
        }
    },
    {
        "name": "github_search_code",
        "description": "Search for a keyword or pattern in the repository's code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"},
                "query": {"type": "string", "description": "Search keyword or phrase"}
            },
            "required": ["owner", "repo", "query"]
        }
    },
    {
        "name": "github_list_issues",
        "description": "List recent issues in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"},
                "state": {"type": "string", "enum": ["open", "closed", "all"], "description": "Default: open"}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "github_list_prs",
        "description": "List recent pull requests in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"},
                "state": {"type": "string", "enum": ["open", "closed", "all"]}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "github_get_languages",
        "description": "Get the language breakdown of the repository (e.g. Python 78%, JS 22%).",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "github_get_commits",
        "description": "Get the 10 most recent commits: sha, message, author, date.",
        "input_schema": {
            "type": "object",
            "properties": {
                "owner": {"type": "string"},
                "repo": {"type": "string"}
            },
            "required": ["owner", "repo"]
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a local file. Use this to save analysis results, generate README, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative file path"},
                "content": {"type": "string", "description": "File content to write"}
            },
            "required": ["path", "content"]
        }
    }
]

TOOL_NAMES = {t["name"] for t in TOOLS}
