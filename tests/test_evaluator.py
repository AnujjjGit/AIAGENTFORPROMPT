from prompt_compiler.compiler import compile_prompt
from prompt_compiler.evaluator import evaluate_prompt
from prompt_compiler.models import OptimizeRequest


def test_quality_score_rewards_explicit_structure() -> None:
    payload = OptimizeRequest(
        request="Compare three options",
        target_model="neutral",
        constraints=["rank by risk"],
        output_format="table",
    )
    spec, prompt = compile_prompt(payload)
    report = evaluate_prompt(spec, prompt)
    assert report.score == 100
    assert all(report.checks.values())
