from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

TargetModel = Literal["neutral", "gpt", "claude", "gemini"]


class ContextItem(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=5000)
    tags: list[str] = Field(default_factory=list)
    allow: bool = True


class OptimizeRequest(BaseModel):
    request: str = Field(min_length=1, max_length=10000)
    target_model: TargetModel = "neutral"
    context: list[ContextItem] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    output_format: str | None = None
    task_tags: list[str] = Field(default_factory=list)


class PromptSpec(BaseModel):
    objective: str
    selected_context: list[ContextItem] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    output_format: str | None = None
    source_request: str


class QualityReport(BaseModel):
    score: int = Field(ge=0, le=100)
    checks: dict[str, bool]
    recommendations: list[str] = Field(default_factory=list)


class OptimizeResponse(BaseModel):
    target_model: TargetModel
    compiled_prompt: str
    selected_context_keys: list[str]
    quality: QualityReport
