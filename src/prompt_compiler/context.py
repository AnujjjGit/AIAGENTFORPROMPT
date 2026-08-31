from __future__ import annotations

from prompt_compiler.models import ContextItem

SENSITIVE_TERMS = {
    "password",
    "passwd",
    "secret",
    "token",
    "api_key",
    "apikey",
    "ssn",
    "social_security",
    "account_number",
    "routing_number",
    "credit_card",
    "private_key",
}


def is_sensitive_key(key: str) -> bool:
    normalized = key.strip().lower().replace("-", "_").replace(" ", "_")
    return any(term in normalized for term in SENSITIVE_TERMS)


def select_context(
    items: list[ContextItem],
    task_tags: list[str] | None = None,
) -> list[ContextItem]:
    """Select allowed, non-sensitive context relevant to the current task.

    Relevance is intentionally deterministic for the public prototype:
    - context without tags is treated as generally reusable;
    - tagged context is included when it overlaps task tags;
    - explicit allow=False always wins;
    - sensitive-key patterns are excluded by default.
    """

    requested_tags = {tag.strip().lower() for tag in (task_tags or []) if tag.strip()}
    selected: list[ContextItem] = []

    for item in items:
        if not item.allow or is_sensitive_key(item.key):
            continue

        item_tags = {tag.strip().lower() for tag in item.tags if tag.strip()}
        if not requested_tags or not item_tags or requested_tags.intersection(item_tags):
            selected.append(item)

    return selected
