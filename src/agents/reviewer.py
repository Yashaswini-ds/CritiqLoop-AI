import os
from typing import Optional
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models import BaseChatModel
from langchain_groq import ChatGroq
from src.schemas import ReviewOutput

load_dotenv()


class ReviewerAgent:
    """Reviewer Agent responsible for evaluating draft content against criteria using Groq."""

    def __init__(self, llm: Optional[BaseChatModel] = None):
        if llm is not None:
            self.llm = llm
        else:
            model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
            api_key = os.getenv("GROQ_API_KEY")

            kwargs = {"model": model_name, "temperature": 0.2}
            if api_key and api_key != "your_groq_api_key_here":
                kwargs["groq_api_key"] = api_key

            self.llm = ChatGroq(**kwargs)

        self.structured_llm = self.llm.with_structured_output(ReviewOutput)

    def evaluate(self, prompt: str, current_draft: str) -> ReviewOutput:
        """Evaluates draft content against task prompt across Relevance, Clarity, Completeness, Overall Quality."""
        system_prompt = (
            "You are a strict, independent AI Reviewer Agent. Your task is to perform an objective evaluation "
            "of the candidate draft against the user's original task goal.\n\n"
            "Evaluation Rules:\n"
            "1. Evaluate ONLY the following four exact criteria on an integer scale from 0 to 10:\n"
            "   - Relevance: Does the content directly and accurately fulfill the original task prompt within requested scope?\n"
            "   - Clarity: Is the explanation logically structured, readable, and free of confusing formatting or reasoning artifacts?\n"
            "   - Completeness: Does the draft thoroughly cover all required components without cut-offs or missing sections?\n"
            "   - Overall Quality: Holistic rating reflecting technical accuracy, coherence, and professional presentation.\n"
            "2. Critical Review Checks:\n"
            "   - Verify whether the original user goal was actually answered.\n"
            "   - Identify if essential components, sub-topics, or sections are missing.\n"
            "   - Inspect for broken formatting, truncated text, or internal monologues/thinking tags.\n"
            "   - Flag unsupported precise claims, fabricated statistics, or ungrounded citations.\n"
            "   - Identify unnecessary repetition or scope drift.\n"
            "3. DO NOT approve content merely because it is long, polished, or nicely formatted.\n"
            "4. Provide concrete, actionable feedback that clearly guides the Creator on what to fix in the next iteration.\n"
            "5. Ensure the 'approved' field is a strict boolean (true if quality threshold is met, false otherwise)."
        )

        user_msg = (
            f"Original User Goal Prompt:\n{prompt}\n\n"
            f"Candidate Draft to Review:\n{current_draft}\n\n"
            f"Perform a strict structured evaluation."
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_msg),
        ]

        result = self.structured_llm.invoke(messages)
        if isinstance(result, dict):
            return ReviewOutput(**result)
        return result
