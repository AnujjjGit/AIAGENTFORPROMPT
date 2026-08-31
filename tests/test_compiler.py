from prompt_compiler.compiler import compile_prompt
from prompt_compiler.models import ContextItem, OptimizeRequest


def test_claude_profile_uses_structured_sections() -> None:
    payload = OptimizeRequest(
        request="Prepare me for an AI solutions interview",
        target_model="claude",
        context=[ContextItem(key="skills", value="Python, SQL", tags=["career"])],
        task_tags=["career"],
        constraints=["include system design"],
        output_format="7-day plan",
    )
    spec, prompt = compile_prompt(payload)
    assert "<task>" in prompt
    assert "<context>" in prompt
    assert "<constraints>" in prompt
    assert "<output_format>7-day plan</output_format>" in prompt
    assert [item.key for item in spec.selected_context] == ["skills"]


def test_gpt_profile_uses_markdown_sections() -> None:
    payload = OptimizeRequest(request="Summarize this analysis", target_model="gpt")
    _, prompt = compile_prompt(payload)
    assert "# Task" in prompt
    assert "# Guidance" in prompt
