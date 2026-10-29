import os
from typing import Optional
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models import BaseChatModel
from langchain_groq import ChatGroq
from src.schemas import ReviewOutput

load_dotenv()


class CreatorAgent:
    """Creator Agent responsible for initial content drafting and iterative refinement using Groq."""

    def __init__(self, llm: Optional[BaseChatModel] = None):
        if llm is not None:
            self.llm = llm
        else:
            model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
            api_key = os.getenv("GROQ_API_KEY")

            kwargs = {"model": model_name, "temperature": 0.7}
            if api_key and api_key != "your_groq_api_key_here":
                kwargs["groq_api_key"] = api_key

            self.llm = ChatGroq(**kwargs)

    def generate_draft(self, prompt: str) -> str:
        """Mode A: Initial Generation — Generates initial draft content based on user task prompt."""
        system_prompt = (
            "You are an expert AI Creator Agent specializing in generating high-quality, professional content.\n\n"
            "Execution Mode: INITIAL DRAFT GENERATION\n\n"
            "Directives:\n"
            "1. Directly answer the user's task prompt, staying tightly aligned with the requested topic.\n"
            "2. Produce complete, coherent, well-structured content using appropriate markdown headings, lists, tables, or examples.\n"
            "3. Maintain professional clarity and depth while avoiding unnecessary verbosity.\n"
            "4. Never output internal reasoning, chain-of-thought (e.g., <think> blocks), or meta-commentary.\n"
            "5. Never return incomplete, truncated, or mid-sentence cut-off sections.\n"
            "6. Avoid inventing precise statistics, unverified studies, fake URLs, or ungrounded citations. "
            "Use cautious, accurate wording when specific evidence is unavailable.\n"
            "7. Output ONLY the complete requested draft content without preamble or conversational filler."
        )

        user_msg = f"Task Goal:\n{prompt}\n\nPlease generate a complete initial draft response."

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_msg),
        ]
        response = self.llm.invoke(messages)
        return str(response.content).strip()

    def refine_draft(self, prompt: str, current_draft: str, review: ReviewOutput) -> str:
        """Mode B: Feedback-Driven Refinement — Refines draft based on structured Reviewer feedback."""
        system_prompt = (
            "You are an expert AI Creator Agent specializing in iterative content refinement.\n\n"
            "Execution Mode: FEEDBACK-DRIVEN REFINEMENT\n\n"
            "Directives:\n"
            "1. Reviewer feedback is an explicit improvement specification, not commentary.\n"
            "2. Preserve all valid strengths identified in the previous draft.\n"
            "3. Address EVERY identified weakness and incorporate ALL actionable reviewer feedback.\n"
            "4. Improve the draft incrementally rather than performing an unnecessary total rewrite.\n"
            "5. Maintain tight relevance to the original user task goal while removing redundancy.\n"
            "6. Repair any incomplete sections, formatting errors, or truncated text.\n"
            "7. Avoid introducing unsupported or fabricated factual claims while revising.\n"
            "8. Produce a complete replacement draft.\n"
            "9. Never mention the reviewer, evaluation scores, feedback process, internal reasoning, or iteration mechanics in the output.\n"
            "10. Output ONLY the refined, standalone draft content."
        )

        strengths_str = "\n".join(f"- {s}" for s in review.strengths) if review.strengths else "None specified"
        weaknesses_str = "\n".join(f"- {w}" for w in review.weaknesses) if review.weaknesses else "None specified"

        user_msg = (
            f"Original Task Goal:\n{prompt}\n\n"
            f"Current Draft:\n{current_draft}\n\n"
            f"Reviewer Evaluation Specification:\n"
            f"- Overall Quality Score: {review.overall_quality}/10\n"
            f"- Relevance Score: {review.relevance}/10\n"
            f"- Clarity Score: {review.clarity}/10\n"
            f"- Completeness Score: {review.completeness}/10\n\n"
            f"Identified Strengths (PRESERVE THESE):\n{strengths_str}\n\n"
            f"Identified Weaknesses (CORRECT ALL OF THESE):\n{weaknesses_str}\n\n"
            f"Actionable Guidance (INCORPORATE FULLY):\n{review.feedback}\n\n"
            f"Please generate the fully revised, complete replacement draft."
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_msg),
        ]
        response = self.llm.invoke(messages)
        return str(response.content).strip()
