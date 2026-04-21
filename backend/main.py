import os
import uuid
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from tools.github import parse_github_url
from agent import run_agent, run_followup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# In-memory session store: session_id -> {messages, github_url, follow_up_count}
sessions: dict = {}

MAX_FOLLOWUPS = 3

class AnalyzeRequest(BaseModel):
    github_url: str
    user_request: str

class FollowupRequest(BaseModel):
    session_id: str
    question: str

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        parse_github_url(req.github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session_id = str(uuid.uuid4())
    sessions[session_id] = {"messages": [], "github_url": req.github_url, "follow_up_count": 0}

    return StreamingResponse(
        run_agent(req.github_url, req.user_request, session_id, sessions),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/followup")
async def followup(req: FollowupRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["follow_up_count"] >= MAX_FOLLOWUPS:
        raise HTTPException(status_code=400, detail="Max follow-ups reached")

    session["follow_up_count"] += 1

    return StreamingResponse(
        run_followup(req.question, session),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
