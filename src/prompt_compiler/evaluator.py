from __future__ import annotations

from prompt_compiler.models import PromptSpec, QualityReport


def evaluate_prompt(spec: PromptSpec, compiled_prompt: str) -> QualityReport:
    checks = {
        "objective_present": bool(spec.objective.strip()),
        "constraints_explicit": bool(spec.constraints),
        "context_separated": (not spec.selected_context) or ("Context" in compiled_prompt or "<context>" in compiled_prompt),
        "output_defined": bool(spec.output_format),
        "guidance_present": "Guidance" in compiled_prompt or "<guidance>" in compiled_prompt,
    }

    weights = {
        "objective_present": 30,
        "constraints_explicit": 20,
        "context_separated": 20,
        "output_defined": 15,
        "guidance_present": 15,
    }
    score = sum(weights[key] for key, passed in checks.items() if passed)

    recommendations: list[str] = []
    if not checks["constraints_explicit"]:
        recommendations.append("Add hard constraints or preferences when they matter to task success.")
    if not checks["output_defined"]:
        recommendations.append("Specify the desired output shape when downstream structure matters.")

    return QualityReport(score=score, checks=checks, recommendations=recommendations)
