import os
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from src.api.main import app
from src.schemas import ReviewOutput, IterationHistoryEntry
from src.agents.creator import CreatorAgent
from src.agents.reviewer import ReviewerAgent

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_cors_preflight():
    response = client.options(
        "/api/run",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_api_run_validation_empty_prompt():
    response = client.post("/api/run", json={"task_prompt": "", "max_iterations": 3, "quality_threshold": 8})
    assert response.status_code == 422


def test_api_run_validation_invalid_bounds():
    # max_iterations = 0 (less than ge=1)
    response_low = client.post("/api/run", json={"task_prompt": "Test", "max_iterations": 0, "quality_threshold": 8})
    assert response_low.status_code == 422

    # quality_threshold = 15 (greater than le=10)
    response_high = client.post("/api/run", json={"task_prompt": "Test", "max_iterations": 3, "quality_threshold": 15})
    assert response_high.status_code == 422


def test_api_run_success_approved():
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Great content draft"

    mock_review = ReviewOutput(
        relevance=9, clarity=9, completeness=9, overall_quality=9,
        strengths=["Clear intro"], weaknesses=[], feedback="Excellent", approved=True
    )
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = mock_review

    with patch("src.api.main.build_workflow") as mock_build, patch.dict(os.environ, {"GROQ_API_KEY": "gsk_validkey"}):
        from src.graph.workflow import build_workflow as real_build
        mock_build.return_value = real_build(creator_agent=mock_creator, reviewer_agent=mock_reviewer)

        payload = {
            "task_prompt": "Explain agent loops",
            "max_iterations": 3,
            "quality_threshold": 8
        }
        response = client.post("/api/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "APPROVED"
        assert data["iterations_used"] == 1
        assert data["final_quality"] == 9
        assert data["reviewer_approved"] is True
        assert data["final_draft"] == "Great content draft"
        assert len(data["history"]) == 1
        assert "gsk_validkey" not in str(data)


def test_api_run_max_iterations_reached():
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.return_value = "Draft 1"
    mock_creator.refine_draft.side_effect = ["Draft 2", "Draft 3"]

    unapproved_review = ReviewOutput(
        relevance=5, clarity=5, completeness=5, overall_quality=5,
        strengths=["Basic"], weaknesses=["Needs work"], feedback="Refine content", approved=False
    )
    mock_reviewer = MagicMock(spec=ReviewerAgent)
    mock_reviewer.evaluate.return_value = unapproved_review

    with patch("src.api.main.build_workflow") as mock_build, patch.dict(os.environ, {"GROQ_API_KEY": "gsk_validkey"}):
        from src.graph.workflow import build_workflow as real_build
        mock_build.return_value = real_build(creator_agent=mock_creator, reviewer_agent=mock_reviewer)

        payload = {
            "task_prompt": "Complex prompt",
            "max_iterations": 3,
            "quality_threshold": 8
        }
        response = client.post("/api/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "MAX_ITERATIONS_REACHED"
        assert data["iterations_used"] == 3
        assert data["final_quality"] == 5
        assert data["reviewer_approved"] is False


def test_api_run_failed_workflow_sanitized_error():
    mock_creator = MagicMock(spec=CreatorAgent)
    mock_creator.generate_draft.side_effect = Exception("401 Unauthorized gsk_secretkey123")

    with patch("src.api.main.build_workflow") as mock_build, patch.dict(os.environ, {"GROQ_API_KEY": "gsk_secretkey123"}):
        from src.graph.workflow import build_workflow as real_build
        mock_build.return_value = real_build(creator_agent=mock_creator)

        payload = {
            "task_prompt": "Prompt causing failure",
            "max_iterations": 3,
            "quality_threshold": 8
        }
        response = client.post("/api/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "FAILED"
        assert "Groq API Authentication failed" in data["error_message"]
        assert "gsk_secretkey123" not in str(data)


def test_api_run_missing_api_key():
    with patch.dict(os.environ, {"GROQ_API_KEY": ""}, clear=True):
        payload = {
            "task_prompt": "Test prompt",
            "max_iterations": 3,
            "quality_threshold": 8
        }
        response = client.post("/api/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "FAILED"
        assert "Groq API key is not configured" in data["error_message"]
