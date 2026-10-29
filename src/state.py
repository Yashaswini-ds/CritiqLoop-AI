from typing import TypedDict, List, Optional
from src.schemas import ReviewOutput, IterationHistoryEntry


class AgentState(TypedDict):
    """Central state shared across LangGraph nodes in CritiqLoop AI."""

    task_prompt: str
    current_draft: str
    latest_review: Optional[ReviewOutput]
    history: List[IterationHistoryEntry]
    iteration_count: int
    max_iterations: int
    quality_threshold: int
    status: str  # "IN_PROGRESS", "APPROVED", "MAX_ITERATIONS_REACHED", "FAILED"
    error_message: Optional[str]
