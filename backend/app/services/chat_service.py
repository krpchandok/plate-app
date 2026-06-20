from agent.graph.graph_builder import build_chat_graph
from db.supabase_client import get_supabase
from db.session_store import (
    get_session, create_session, update_session,
    save_message, get_messages,
    save_challenge, get_challenges
)

chat_graph = build_chat_graph()

async def get_greeting(session_id: str, rewritten_menu: list[dict], lat: float = 43.6532, lng: float = -79.3832) -> dict:
    client = get_supabase()
    session = await get_session(client, session_id)

    if session:
        messages = await get_messages(client, session_id)
        print(f"Loaded {len(messages)} messages from DB")
        assistant_messages = [m for m in messages if m["role"] == "assistant" and m["content"] != "Please greet me briefly."]
        print(f"Assistant messages: {len(assistant_messages)}")
        if assistant_messages:
            print(f"Returning: {assistant_messages[-1]['content'][:50]}")
            return {"reply": assistant_messages[-1]["content"], "session_id": session_id}

    await create_session(client, session_id, rewritten_menu)
    messages = [{"role": "user", "content": "Please greet me briefly."}]
    await save_message(client, session_id, "user", "Please greet me briefly.")

    state = {
        "messages": messages,
        "avoided_foods": [],
        "dietary_restrictions": [],
        "recovery_stage": "gentle",
        "challenges": [],
        "rewritten_menu": rewritten_menu,
        "reparse_needed": False,
        "lat": lat,
        "lng": lng,
        "recommendations": []
    }

    state = chat_graph.invoke(state)
    last = state["messages"][-1]
    reply = last.content if hasattr(last, "content") else last["content"]
    await save_message(client, session_id, "assistant", reply)

    return {"reply": reply, "session_id": session_id}

async def bot_reply(session_id: str, user_message: str, rewritten_menu: list[dict], lat: float = 43.6532, lng: float = -79.3832) -> dict:
    client = get_supabase()
    print(f"bot_reply called: session={session_id}, message={user_message[:20]}")

    session = await get_session(client, session_id)
    if not session:
        session = await create_session(client, session_id, rewritten_menu)

    messages = await get_messages(client, session_id)
    messages.append({"role": "user", "content": user_message})
    await save_message(client, session_id, "user", user_message)

    existing_challenges = await get_challenges(client, session_id)

    state = {
        "messages": messages,
        "avoided_foods": session.get("avoided_foods") or [],
        "dietary_restrictions": session.get("dietary_restrictions") or [],
        "recovery_stage": session.get("recovery_stage") or "gentle",
        "challenges": existing_challenges,
        "rewritten_menu": rewritten_menu,
        "reparse_needed": session.get("reparse_needed") or False,
        "lat": lat,
        "lng": lng,
        "recommendations": []
    }

    state = chat_graph.invoke(state)

    last = state["messages"][-1]
    reply = last.content if hasattr(last, "content") else last["content"]
    await save_message(client, session_id, "assistant", reply)

    existing_descs = {c["description"] for c in existing_challenges}
    for c in state["challenges"]:
        if c["description"] not in existing_descs:
            await save_challenge(client, session_id, c)

    await update_session(client, session_id, {
        "avoided_foods": state["avoided_foods"],
        "dietary_restrictions": state["dietary_restrictions"],
        "recovery_stage": state["recovery_stage"],
        "reparse_needed": state["reparse_needed"]
    })

    return {
        "reply": reply,
        "challenges": state["challenges"]
    }