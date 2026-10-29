from unittest.mock import MagicMock
from src.graph.workflow import should_continue, build_workflow, create_reviewer_node
from src.state import AgentState
from src.schemas import ReviewOutput
from src.agents.creator import CreatorAgent
from src.agents.reviewer import ReviewerAgent


def test_should_continue_logic():
    # 1. Approved status -> end
    state_approved: AgentState = {
        "task_prompt": "test", "current_draft": "draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "APPROVED"
    }
    assert should_continue(state_approved) == "end"

    # 2. MAX_ITERATIONS_REACHED -> end
    state_max: AgentState = {
        "task_prompt": "test", "current_draft": "draft", "latest_review": None,
        "history": [], "iteration_count": 3, "max_iterations": 3, "quality_threshold": 8,
        "status": "MAX_ITERATIONS_REACHED"
    }
    assert should_continue(state_max) == "end"

    # 3. FAILED -> end
    state_failed: AgentState = {
        "task_prompt": "test", "current_draft": "draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "FAILED"
    }
    assert should_continue(state_failed) == "end"

    # 4. IN_PROGRESS status -> creator
    state_in_progress: AgentState = {
        "task_prompt": "test", "current_draft": "draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }
    assert should_continue(state_in_progress) == "creator"


def test_workflow_max_iterations_bound():
    """Scenario B: Verify workflow executes Iterations 1, 2, 3 and stops at MAX_ITERATIONS_REACHED without Iteration 4."""
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Draft 1"
    mock_creator.refine_draft.side_effect = ["Draft 2", "Draft 3", "Draft 4"]

    unapproved_review = ReviewOutput(
        relevance=5, clarity=5, completeness=5, overall_quality=5,
        strengths=["Basic structure"], weaknesses=["Lacks depth"],
        feedback="Needs major improvements", approved=False
    )

    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = unapproved_review

    app = build_workflow(creator_agent=mock_creator, reviewer_agent=mock_reviewer)
    initial_state: AgentState = {
        "task_prompt": "Explain Quantum Computing", "current_draft": "", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    final_state = app.invoke(initial_state)

    assert final_state["status"] == "MAX_ITERATIONS_REACHED"
    assert len(final_state["history"]) == 3
    assert final_state["history"][0].iteration == 1
    assert final_state["history"][1].iteration == 2
    assert final_state["history"][2].iteration == 3
    assert len(final_state["history"]) <= 3


def test_workflow_early_approval():
    """Scenario C: Verify workflow stops immediately on Iteration 1 when quality requirements are satisfied."""
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Perfect Draft 1"

    approved_review = ReviewOutput(
        relevance=9, clarity=9, completeness=9, overall_quality=9,
        strengths=["Outstanding"], weaknesses=[], feedback="Great job!", approved=True
    )

    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = approved_review

    app = build_workflow(creator_agent=mock_creator, reviewer_agent=mock_reviewer)
    initial_state: AgentState = {
        "task_prompt": "Simple prompt", "current_draft": "", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    final_state = app.invoke(initial_state)

    assert final_state["status"] == "APPROVED"
    assert len(final_state["history"]) == 1
    assert final_state["history"][0].iteration == 1


def test_workflow_scenario_multi_iteration_approval():
    """Scenario A: Verify Iteration 1 rejected -> Creator refined -> Iteration 2 approved -> END."""
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Initial Draft 1"
    mock_creator.refine_draft.return_value = "Improved Draft 2"

    review1 = ReviewOutput(
        relevance=6, clarity=6, completeness=6, overall_quality=6,
        strengths=["Good start"], weaknesses=["Lacks depth"], feedback="Add examples", approved=False
    )
    review2 = ReviewOutput(
        relevance=9, clarity=9, completeness=9, overall_quality=9,
        strengths=["Excellent details"], weaknesses=[], feedback="Perfect", approved=True
    )

    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.side_effect = [review1, review2]

    app = build_workflow(creator_agent=mock_creator, reviewer_agent=mock_reviewer)
    initial_state: AgentState = {
        "task_prompt": "Explain agent loops", "current_draft": "", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    final_state = app.invoke(initial_state)

    assert final_state["status"] == "APPROVED"
    assert len(final_state["history"]) == 2
    assert final_state["history"][0].iteration == 1
    assert final_state["history"][1].iteration == 2
    assert final_state["latest_review"].overall_quality == 9
    mock_creator.refine_draft.assert_called_once_with("Explain agent loops", "Initial Draft 1", review1)


def test_quality_gate_approved_below_threshold():
    """Matrix 2: score < threshold + approved=True -> IN_PROGRESS."""
    review = ReviewOutput(
        relevance=6, clarity=6, completeness=6, overall_quality=6,
        strengths=["Okay"], weaknesses=["Low quality"], feedback="Improve depth", approved=True
    )
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = review

    node_fn = create_reviewer_node(mock_reviewer)
    state: AgentState = {
        "task_prompt": "Prompt", "current_draft": "Draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    result = node_fn(state)
    assert result["status"] == "IN_PROGRESS"
    assert result["iteration_count"] == 2


def test_quality_gate_not_approved_above_threshold():
    """Matrix 3: score >= threshold + approved=False -> IN_PROGRESS."""
    review = ReviewOutput(
        relevance=9, clarity=9, completeness=9, overall_quality=9,
        strengths=["Good"], weaknesses=["Minor flaw"], feedback="Fix minor flaw", approved=False
    )
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = review

    node_fn = create_reviewer_node(mock_reviewer)
    state: AgentState = {
        "task_prompt": "Prompt", "current_draft": "Draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    result = node_fn(state)
    assert result["status"] == "IN_PROGRESS"
    assert result["iteration_count"] == 2


def test_quality_gate_not_approved_below_threshold():
    """Matrix 4: score < threshold + approved=False -> IN_PROGRESS."""
    review = ReviewOutput(
        relevance=4, clarity=4, completeness=4, overall_quality=4,
        strengths=["Basic"], weaknesses=["Major flaws"], feedback="Rewrite section", approved=False
    )
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = review

    node_fn = create_reviewer_node(mock_reviewer)
    state: AgentState = {
        "task_prompt": "Prompt", "current_draft": "Draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    result = node_fn(state)
    assert result["status"] == "IN_PROGRESS"
    assert result["iteration_count"] == 2
