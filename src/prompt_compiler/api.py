from __future__ import annotations

from fastapi import FastAPI

from prompt_compiler.compiler import compile_prompt
from prompt_compiler.evaluator import evaluate_prompt
from prompt_compiler.models import OptimizeRequest, OptimizeResponse

app = FastAPI(
    title="Context-Aware Prompt Compiler",
    version="0.1.0",
    description="Compile user intent and safe reusable context into model-profiled prompts.",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/optimize", response_model=OptimizeResponse)
def optimize(payload: OptimizeRequest) -> OptimizeResponse:
    spec, compiled = compile_prompt(payload)
    quality = evaluate_prompt(spec, compiled)
    return OptimizeResponse(
        target_model=payload.target_model,
        compiled_prompt=compiled,
        selected_context_keys=[item.key for item in spec.selected_context],
        quality=quality,
    )
