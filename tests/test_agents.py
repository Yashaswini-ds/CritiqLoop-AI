from unittest.mock import MagicMock
from langchain_core.messages import AIMessage, HumanMessage
from src.agents.creator import CreatorAgent
from src.agents.reviewer import ReviewerAgent
from src.schemas import ReviewOutput


def test_creator_agent_generate_draft():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(content="Generated initial draft content.")

    agent = CreatorAgent(llm=mock_llm)
    draft = agent.generate_draft("Explain python lists")

    assert draft == "Generated initial draft content."
    mock_llm.invoke.assert_called_once()
    call_args = mock_llm.invoke.call_args[0][0]
    human_msg = [m for m in call_args if isinstance(m, HumanMessage)][0]
    assert "Explain python lists" in human_msg.content


def test_creator_agent_refine_draft_feedback_incorporation():
    """Verify CreatorAgent.refine_draft incorporates prompt, previous draft, strengths, weaknesses, and feedback into LLM message."""
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(content="Refined draft content with details.")

    review = ReviewOutput(
        relevance=8,
        clarity=7,
        completeness=6,
        overall_quality=7,
        strengths=["Clear intro structure"],
        weaknesses=["Missing concrete Python code examples"],
        feedback="Add at least three code snippets demonstrating list methods",
        approved=False
    )

    agent = CreatorAgent(llm=mock_llm)
    task_prompt = "Explain python lists"
    previous_draft = "Initial draft text about lists"

    refined = agent.refine_draft(task_prompt, previous_draft, review)

    assert refined == "Refined draft content with details."
    mock_llm.invoke.assert_called_once()

    # Inspect the exact messages passed to the LLM
    call_messages = mock_llm.invoke.call_args[0][0]
    human_msg = [m for m in call_messages if isinstance(m, HumanMessage)][0]

    # Prove all feedback components are present in the refinement prompt
    assert task_prompt in human_msg.content
    assert previous_draft in human_msg.content
    assert "Clear intro structure" in human_msg.content
    assert "Missing concrete Python code examples" in human_msg.content
    assert "Add at least three code snippets demonstrating list methods" in human_msg.content


def test_reviewer_agent_evaluate():
    mock_llm = MagicMock()
    mock_structured_llm = MagicMock()

    expected_review = ReviewOutput(
        relevance=9,
        clarity=9,
        completeness=8,
        overall_quality=9,
        strengths=["Comprehensive"],
        weaknesses=[],
        feedback="Looks great",
        approved=True
    )

    mock_structured_llm.invoke.return_value = expected_review
    mock_llm.with_structured_output.return_value = mock_structured_llm

    agent = ReviewerAgent(llm=mock_llm)
    review_result = agent.evaluate("Prompt", "Draft content")

    assert review_result.overall_quality == 9
    assert review_result.approved is True
    mock_structured_llm.invoke.assert_called_once()
