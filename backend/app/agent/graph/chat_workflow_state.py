from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class ChatWorkflowState(TypedDict):
    messages: Annotated[list, add_messages]
    avoided_foods: list[str]
    dietary_restrictions: list[str]
    recovery_stage: str
    challenges: list[dict]
    rewritten_menu: list[dict]
    reparse_needed: bool
    lat: float
    lng: float
    recommendations: list[dict]