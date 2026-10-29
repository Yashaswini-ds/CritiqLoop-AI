from pydantic import BaseModel, Field
from typing import List


class ReviewOutput(BaseModel):
    """Structured review evaluation produced by the Reviewer Agent."""

    relevance: int = Field(
        ge=0, le=10, description="Relevance score from 0 to 10 evaluating how well content meets prompt"
    )
    clarity: int = Field(
        ge=0, le=10, description="Clarity score from 0 to 10 evaluating readability and structure"
    )
    completeness: int = Field(
        ge=0, le=10, description="Completeness score from 0 to 10 evaluating thoroughness"
    )
    overall_quality: int = Field(
        ge=0, le=10, description="Overall quality score from 0 to 10 summarizing total quality"
    )
    strengths: List[str] = Field(
        default_factory=list, description="Key strengths identified in the content"
    )
    weaknesses: List[str] = Field(
        default_factory=list, description="Key areas needing improvement in the content"
    )
    feedback: str = Field(
        description="Actionable, specific guidance for the Creator Agent to revise and improve the content"
    )
    approved: bool = Field(
        description="True if quality standards are satisfied, False otherwise (must be boolean true or false)"
    )


class IterationHistoryEntry(BaseModel):
    """Structured record of a single iteration loop cycle."""

    iteration: int = Field(description="1-indexed iteration number (e.g. 1, 2, 3)")
    draft: str = Field(description="Content draft generated in this iteration")
    review: ReviewOutput = Field(description="Reviewer evaluation for this draft")
