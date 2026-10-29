from typing import List, Optional
from pydantic import BaseModel, Field


class RunRequest(BaseModel):
    """Request schema for executing CritiqLoop AI graph via API."""
    task_prompt: str = Field(..., min_length=1, max_length=5000, description="The content creation goal prompt.")
    max_iterations: int = Field(default=3, ge=1, le=10, description="Maximum number of iteration cycles.")
    quality_threshold: int = Field(default=8, ge=0, le=10, description="Target quality score threshold (0-10).")
    model: Optional[str] = Field(default=None, description="Optional Groq model override.")
    initial_draft: Optional[str] = Field(default=None, description="Optional previous draft for human-in-the-loop refinement.")


class IterationHistoryItem(BaseModel):
    """Schema for a single iteration record in API response."""
    iteration: int
    draft: str
    relevance: int
    clarity: int
    completeness: int
    overall_quality: int
    strengths: List[str]
    weaknesses: List[str]
    feedback: str
    approved: bool


class RunResponse(BaseModel):
    """Response schema returned by CritiqLoop AI API execution."""
    status: str
    iterations_used: int
    final_quality: Optional[int]
    quality_threshold: int
    reviewer_approved: bool
    final_draft: str
    history: List[IterationHistoryItem]
    error_message: Optional[str] = None
