from prompt_compiler.context import is_sensitive_key, select_context
from prompt_compiler.models import ContextItem


def test_sensitive_keys_are_detected() -> None:
    assert is_sensitive_key("api_key")
    assert is_sensitive_key("private-token")
    assert not is_sensitive_key("career_goal")


def test_context_selection_respects_tags_and_allow_flag() -> None:
    items = [
        ContextItem(key="skills", value="Python and SQL", tags=["career"]),
        ContextItem(key="diet", value="vegetarian", tags=["food"]),
        ContextItem(key="private_note", value="omit", tags=["career"], allow=False),
    ]
    selected = select_context(items, task_tags=["career"])
    assert [item.key for item in selected] == ["skills"]
