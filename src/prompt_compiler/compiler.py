from __future__ import annotations

from html import escape

from prompt_compiler.context import select_context
from prompt_compiler.models import OptimizeRequest, PromptSpec
from prompt_compiler.profiles import ModelProfile, get_profile


def build_spec(payload: OptimizeRequest) -> PromptSpec:
    selected = select_context(payload.context, payload.task_tags)
    return PromptSpec(
        objective=payload.request.strip(),
        selected_context=selected,
        constraints=[item.strip() for item in payload.constraints if item.strip()],
        output_format=payload.output_format.strip() if payload.output_format else None,
        source_request=payload.request.strip(),
    )


def _context_lines(spec: PromptSpec) -> list[str]:
    return [f"- {item.key}: {item.value}" for item in spec.selected_context]


def _render_markdown(spec: PromptSpec, profile: ModelProfile) -> str:
    sections: list[str] = ["# Task", spec.objective]

    if spec.selected_context:
        sections.extend(["# Context", *(_context_lines(spec))])

    if spec.constraints:
        sections.extend(["# Constraints", *[f"- {item}" for item in spec.constraints]])

    if spec.output_format:
        sections.extend(["# Output", f"Return the result as: {spec.output_format}."])

    sections.extend(["# Guidance", *[f"- {item}" for item in profile.guidance]])
    return "\n\n".join(sections).strip() + "\n"


def _render_xml(spec: PromptSpec, profile: ModelProfile) -> str:
    context = "\n".join(
        f'  <item key="{escape(item.key)}">{escape(item.value)}</item>'
        for item in spec.selected_context
    )
    constraints = "\n".join(
        f"  <constraint>{escape(item)}</constraint>" for item in spec.constraints
    )
    guidance = "\n".join(f"  <rule>{escape(item)}</rule>" for item in profile.guidance)

    blocks = [f"<task>\n{escape(spec.objective)}\n</task>"]
    if context:
        blocks.append(f"<context>\n{context}\n</context>")
    if constraints:
        blocks.append(f"<constraints>\n{constraints}\n</constraints>")
    if spec.output_format:
        blocks.append(f"<output_format>{escape(spec.output_format)}</output_format>")
    blocks.append(f"<guidance>\n{guidance}\n</guidance>")
    return "\n\n".join(blocks).strip() + "\n"


def compile_prompt(payload: OptimizeRequest) -> tuple[PromptSpec, str]:
    spec = build_spec(payload)
    profile = get_profile(payload.target_model)
    if profile.section_style == "xml":
        return spec, _render_xml(spec, profile)
    return spec, _render_markdown(spec, profile)
