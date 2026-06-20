from langgraph.graph import StateGraph, END
from agent.graph.chat_workflow_state import ChatWorkflowState
from agent.graph.chat_nodes import call_model

def build_chat_graph():
    graph = StateGraph(ChatWorkflowState)
    graph.add_node("call_model", call_model)
    graph.set_entry_point("call_model")
    graph.add_edge("call_model", END)
    return graph.compile()
