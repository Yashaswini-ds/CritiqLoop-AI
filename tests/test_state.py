from src.schemas import ReviewOutput, IterationHistoryEntry
from src.state import AgentState


def test_review_output_schema():
    review = ReviewOutput(
        relevance=9,
        clarity=8,
        completeness=8,
        overall_quality=8,
        strengths=["Clear explanation", "Good structure"],
        weaknesses=["Could use code snippets"],
        feedback="Add short code example",
        approved=True
    )
    assert review.relevance == 9
    assert review.overall_quality == 8
    assert review.approved is True
    assert len(review.strengths) == 2


def test_iteration_history_entry_schema():
    review = ReviewOutput(
        relevance=7,
        clarity=7,
        completeness=6,
        overall_quality=6,
        strengths=["Good start"],
        weaknesses=["Incomplete"],
        feedback="Elaborate on details",
        approved=False
    )
    history_entry = IterationHistoryEntry(
        iteration=1,
        draft="Initial draft text",
        review=review
    )
    assert history_entry.iteration == 1
    assert history_entry.draft == "Initial draft text"
    assert history_entry.review.overall_quality == 6


def test_agent_state_dict():
    state: AgentState = {
        "task_prompt": "Test prompt",
        "current_draft": "Draft v1",
        "latest_review": None,
        "history": [],
        "iteration_count": 1,
        "max_iterations": 3,
        "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }
    assert state["iteration_count"] == 1
    assert state["max_iterations"] == 3
    assert state["status"] == "IN_PROGRESS"
