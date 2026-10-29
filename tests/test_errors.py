import os
import pytest
from unittest.mock import MagicMock, patch
from src.utils.errors import sanitize_error_message
from src.graph.workflow import create_creator_node, create_reviewer_node, should_continue, build_workflow
from src.state import AgentState
from src.agents.creator import CreatorAgent
from src.agents.reviewer import ReviewerAgent
from main import validate_environment


def test_sanitize_error_message_redacts_api_keys():
    raw_error = Exception("Error code: 401 - Incorrect API key provided: gsk_1234567890abcdef. Authorization: Bearer gsk_secret123")
    sanitized = sanitize_error_message(raw_error)
    assert "gsk_1234567890abcdef" not in sanitized
    assert "gsk_secret123" not in sanitized
    assert "Groq API Authentication failed" in sanitized


def test_sanitize_error_message_model_not_found():
    raw_error = Exception("Error code: 404 - The model llama-3.3-70b-versatile does not exist or you do not have access to it.")
    sanitized = sanitize_error_message(raw_error)
    assert "Groq model is unavailable or not accessible." in sanitized


def test_sanitize_error_message_rate_limit():
    raw_error = Exception("Error code: 429 - Rate limit reached for default-llama3-70b in organization")
    sanitized = sanitize_error_message(raw_error)
    assert "Groq API rate limit reached" in sanitized


def test_sanitize_error_message_network_failure():
    raw_error = Exception("ConnectError: Failed to establish a new connection: [Errno 11001] getaddrinfo failed")
    sanitized = sanitize_error_message(raw_error)
    assert "Network or connection error" in sanitized


def test_sanitize_error_message_structured_output_failure():
    raw_error = Exception("tool call validation failed: parameters for tool ReviewOutput did not match schema")
    sanitized = sanitize_error_message(raw_error)
    assert "Failed to parse structured review output from LLM." in sanitized


def test_validate_environment_missing_key():
    with patch.dict(os.environ, {"GROQ_API_KEY": ""}, clear=True):
        with pytest.raises(SystemExit) as exc_info:
            validate_environment()
        assert exc_info.value.code == 1


def test_creator_node_failure_sets_failed_status():
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.side_effect = Exception("401 Unauthorized API key gsk_testkey123")

    node_fn = create_creator_node(mock_creator)
    state: AgentState = {
        "task_prompt": "Test Prompt", "current_draft": "", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    result = node_fn(state)
    assert result["status"] == "FAILED"
    assert "Groq API Authentication failed" in result["error_message"]
    assert "gsk_testkey123" not in result["error_message"]


def test_reviewer_node_failure_sets_failed_status():
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.side_effect = Exception("tool call validation failed for ReviewOutput")

    node_fn = create_reviewer_node(mock_reviewer)
    state: AgentState = {
        "task_prompt": "Test Prompt", "current_draft": "Draft text", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    result = node_fn(state)
    assert result["status"] == "FAILED"
    assert "Failed to parse structured review output" in result["error_message"]


def test_should_continue_routes_failed_to_end():
    failed_state: AgentState = {
        "task_prompt": "Test", "current_draft": "Draft", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "FAILED", "error_message": "Some error"
    }
    assert should_continue(failed_state) == "end"


def test_workflow_terminates_immediately_on_failed_status():
    """Scenario D: Verify workflow terminates immediately on failure without retrying creator or executing further iterations."""
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Draft 1"
    mock_creator.refine_draft.return_value = "Should not be called"

    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.side_effect = Exception("404 model_not_found")

    app = build_workflow(creator_agent=mock_creator, reviewer_agent=mock_reviewer)
    initial_state: AgentState = {
        "task_prompt": "Explain agentic loops", "current_draft": "", "latest_review": None,
        "history": [], "iteration_count": 1, "max_iterations": 3, "quality_threshold": 8,
        "status": "IN_PROGRESS"
    }

    final_state = app.invoke(initial_state)

    assert final_state["status"] == "FAILED"
    assert "Groq model is unavailable or not accessible." in final_state["error_message"]
    mock_creator.refine_draft.assert_not_called()
