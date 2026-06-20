from typing import TypedDict

class RecoveryState(TypedDict):
    raw_text: str
    image_data: str
    raw_menu: list[dict]
    rewritten_menu: list[dict]
    food_group_map: dict
    avoided_foods: list[str]
    dietary_restrictions: list[str]
    recovery_stage: str
    challenges: list[dict]
    chat_history: list[dict]
    reparse_needed: bool

class ChatState(TypedDict):
    chat_history: list[dict]
    avoided_foods: list[str]
    dietary_restrictions: list[str]
    recovery_stage: str
    challenges: list[dict]
    rewritten_menu: list[dict]
    reparse_needed: bool
    done: bool