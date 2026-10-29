from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from src.state import AgentState
from src.schemas import IterationHistoryEntry
from src.agents.creator import CreatorAgent
from src.agents.reviewer import ReviewerAgent
from src.utils.errors import sanitize_error_message


def create_creator_node(creator_agent: Optional[CreatorAgent] = None):
    """Node handler for Creator Agent."""
    def creator_node(state: AgentState) -> Dict[str, Any]:
        try:
            agent = creator_agent or CreatorAgent()
            task_prompt = state["task_prompt"]
            iteration = state.get("iteration_count", 1)
            latest_review = state.get("latest_review")
            current_draft = state.get("current_draft", "")

            if iteration == 1 or not latest_review or not current_draft:
                new_draft = agent.generate_draft(task_prompt)
            else:
                new_draft = agent.refine_draft(task_prompt, current_draft, latest_review)

            return {"current_draft": new_draft}
        except Exception as e:
            error_msg = sanitize_error_message(e)
            return {"status": "FAILED", "error_message": error_msg}

    return creator_node


def create_reviewer_node(reviewer_agent: Optional[ReviewerAgent] = None):
    """Node handler for Reviewer Agent with programmatic quality gate enforcement."""
    def reviewer_node(state: AgentState) -> Dict[str, Any]:
        try:
            agent = reviewer_agent or ReviewerAgent()
            task_prompt = state["task_prompt"]
            current_draft = state["current_draft"]
            current_iteration = state.get("iteration_count", 1)
            max_iterations = state.get("max_iterations", 3)
            quality_threshold = state.get("quality_threshold", 8)
            history = list(state.get("history", []))

            # Perform review
            review = agent.evaluate(task_prompt, current_draft)

            # Enforce application-level quality threshold
            is_approved = (review.overall_quality >= quality_threshold) and (review.approved is True)

            # Create structured history record
            history_entry = IterationHistoryEntry(
                iteration=current_iteration,
                draft=current_draft,
                review=review
            )
            history.append(history_entry)

            # Determine state status & next iteration counter
            if is_approved:
                new_status = "APPROVED"
                next_iteration = current_iteration
            elif current_iteration >= max_iterations:
                new_status = "MAX_ITERATIONS_REACHED"
                next_iteration = current_iteration
            else:
                new_status = "IN_PROGRESS"
                next_iteration = current_iteration + 1

            return {
                "latest_review": review,
                "history": history,
                "status": new_status,
                "iteration_count": next_iteration
            }
        except Exception as e:
            error_msg = sanitize_error_message(e)
            return {"status": "FAILED", "error_message": error_msg}

    return reviewer_node


def should_continue(state: AgentState) -> str:
    """Conditional routing edge deciding whether to stop or return to Creator."""
    status = state.get("status", "IN_PROGRESS")

    if status in ("APPROVED", "MAX_ITERATIONS_REACHED", "FAILED"):
        return "end"

    return "creator"


def build_workflow(creator_agent: Optional[CreatorAgent] = None, reviewer_agent: Optional[ReviewerAgent] = None):
    """Assembles and compiles the LangGraph state graph for CritiqLoop AI."""
    workflow = StateGraph(AgentState)

    creator_fn = create_creator_node(creator_agent)
    reviewer_fn = create_reviewer_node(reviewer_agent)

    workflow.add_node("creator", creator_fn)
    workflow.add_node("reviewer", reviewer_fn)

    workflow.set_entry_point("creator")
    workflow.add_edge("creator", "reviewer")

    workflow.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "creator": "creator",
            "end": END
        }
    )

    return workflow.compile()
