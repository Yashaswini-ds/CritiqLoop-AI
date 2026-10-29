import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.schemas import ReviewOutput
from src.graph.workflow import build_workflow
from src.state import AgentState
from src.api.schemas import RunRequest, RunResponse, IterationHistoryItem
from src.utils.errors import sanitize_error_message

# Load environment configuration
load_dotenv()

app = FastAPI(
    title="CritiqLoop AI API",
    description="REST API wrapper over LangGraph Agentic Feedback Loop",
    version="1.0.0"
)

# Configure CORS for local development environments
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


@app.post("/api/run", response_model=RunResponse)
def run_workflow(req: RunRequest):
    """Executes the existing LangGraph agentic workflow for the given user request."""
    # Check for API key presence
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key or groq_api_key.strip() == "" or groq_api_key == "your_groq_api_key_here":
        return RunResponse(
            status="FAILED",
            iterations_used=0,
            final_quality=None,
            quality_threshold=req.quality_threshold,
            reviewer_approved=False,
            final_draft="",
            history=[],
            error_message="Groq API key is not configured. Set GROQ_API_KEY in the .env file."
        )

    # Optional model override
    if req.model:
        os.environ["GROQ_MODEL"] = req.model

    initial_draft_content = req.initial_draft or ""
    synthetic_review = ReviewOutput(
        relevance=7,
        clarity=7,
        completeness=7,
        overall_quality=7,
        strengths=["Good core foundation"],
        weaknesses=["Requires specific human feedback enhancements"],
        feedback="Incorporate user human reviewer instructions.",
        approved=False
    ) if req.initial_draft else None

    initial_state: AgentState = {
        "task_prompt": req.task_prompt,
        "current_draft": initial_draft_content,
        "latest_review": synthetic_review,
        "history": [],
        "iteration_count": 1,
        "max_iterations": req.max_iterations,
        "quality_threshold": req.quality_threshold,
        "status": "IN_PROGRESS"
    }

    workflow = build_workflow()

    try:
        final_state = workflow.invoke(initial_state)

        status = final_state.get("status", "FAILED")
        current_draft = final_state.get("current_draft", "")
        history_raw = final_state.get("history", [])
        if not current_draft and history_raw:
            current_draft = history_raw[-1].draft
        latest_review = final_state.get("latest_review")
        error_msg = final_state.get("error_message")

        # Transform raw history entries into API response models
        history_items: List[IterationHistoryItem] = []
        for entry in history_raw:
            rev = entry.review
            history_items.append(
                IterationHistoryItem(
                    iteration=entry.iteration,
                    draft=entry.draft,
                    relevance=rev.relevance,
                    clarity=rev.clarity,
                    completeness=rev.completeness,
                    overall_quality=rev.overall_quality,
                    strengths=rev.strengths,
                    weaknesses=rev.weaknesses,
                    feedback=rev.feedback,
                    approved=rev.approved
                )
            )

        iterations_used = len(history_items) if history_items else final_state.get("iteration_count", 1)
        final_quality = latest_review.overall_quality if latest_review else None
        reviewer_approved = latest_review.approved if latest_review else False

        return RunResponse(
            status=status,
            iterations_used=iterations_used,
            final_quality=final_quality,
            quality_threshold=req.quality_threshold,
            reviewer_approved=reviewer_approved,
            final_draft=current_draft,
            history=history_items,
            error_message=error_msg
        )

    except Exception as e:
        sanitized = sanitize_error_message(e)
        return RunResponse(
            status="FAILED",
            iterations_used=0,
            final_quality=None,
            quality_threshold=req.quality_threshold,
            reviewer_approved=False,
            final_draft="",
            history=[],
            error_message=sanitized
        )
