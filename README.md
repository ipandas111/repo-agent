# Repo Agent

A web-based AI Agent that analyzes any public GitHub repository using a hand-written **ReAct loop** — no LangChain, no abstractions. Just Claude's native `tool_use` API with real-time streaming.

[![CI](https://github.com/ipandas111/repo-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/ipandas111/repo-agent/actions/workflows/ci.yml) ![Python](https://img.shields.io/badge/python-3.11+-blue) ![React](https://img.shields.io/badge/react-18-61dafb)

## What It Does

Enter a GitHub URL + a natural language request. The agent:

1. Reasons about what tools to call (THINK)
2. Calls GitHub API tools autonomously (ACT)
3. Observes results and decides next steps (OBSERVE)
4. Streams the entire reasoning process to the UI in real time

## Architecture

```
User Input (GitHub URL + request)
    ↓
FastAPI Backend — POST /analyze → SSE stream
    └── ReAct Agent Loop
          ├── Claude decides next tool via tool_use API
          ├── Execute: GitHub REST API calls
          └── Loop until done (max 20 iterations)
    ↓
React Frontend — streams think/act/observe steps live
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Claude API (`claude-opus-4-7`), native `tool_use` |
| Backend | FastAPI + Python, SSE streaming |
| GitHub Data | GitHub REST API v3 (no cloning) |
| Frontend | React + Vite, fetch + ReadableStream |

## Tools Available to the Agent

| Tool | Purpose |
|------|---------|
| `github_get_repo` | Project metadata, stars, language |
| `github_list_tree` | Full file tree (up to 200 files) |
| `github_read_file` | Read any file content (up to 8KB) |
| `github_search_code` | Search keywords in codebase |
| `github_list_issues` | Recent issues |
| `github_list_prs` | Recent pull requests |
| `github_get_languages` | Language breakdown |
| `github_get_commits` | Recent commit history |
| `write_file` | Save analysis output locally |

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Anthropic API Key](https://console.anthropic.com)
- GitHub Personal Access Token (optional, increases rate limit to 5000 req/hr)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys
```

### Frontend

```bash
cd frontend
npm install
```

### Run

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Required
GITHUB_TOKEN=ghp_...            # Optional (recommended)
DEMO_MODE=false                 # Set true to run without Anthropic key
```

### Demo Mode

Set `DEMO_MODE=true` to run without an Anthropic API key. The agent uses real GitHub API data but scripted reasoning — useful for UI demos and portfolio showcases.

## Why This Project

Most "AI agents" are wrappers around LangChain abstractions. This project implements the ReAct loop from scratch:

```python
while not done:
    response = await claude.messages.create(tools=TOOLS, messages=history)
    if response.stop_reason == "tool_use":
        result = execute_tool(response)   # call GitHub API
        history.append(result)            # Claude observes result
    else:
        break  # Claude finished reasoning
```

Each think/act/observe cycle is streamed to the frontend via SSE, making the agent's reasoning process fully transparent.

## Project Structure

```
repo-agent/
├── backend/
│   ├── main.py         # FastAPI, /analyze SSE endpoint
│   ├── agent.py        # ReAct loop core
│   ├── tools/
│   │   ├── github.py   # GitHub API tools
│   │   ├── file.py     # write_file tool
│   │   └── schemas.py  # Claude tool schemas
│   └── tests/          # pytest test suite
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── InputPanel.jsx
            └── AgentStream.jsx
```

## Author

**刘子安 (Zian Liu)** — Cornell University, Systems Engineering MS

[GitHub](https://github.com/ipandas111) · [Portfolio](https://ipandas111.github.io/portfolio)
