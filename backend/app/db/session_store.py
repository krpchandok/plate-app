from supabase import Client

async def get_session(client: Client, session_id: str) -> dict | None:
    result = client.table("sessions").select("*").eq("session_id", session_id).execute()
    return result.data[0] if result.data else None

async def create_session(client: Client, session_id: str, rewritten_menu: list) -> dict:
    result = client.table("sessions").insert({
        "session_id": session_id,
        "rewritten_menu": rewritten_menu,
        "avoided_foods": [],
        "dietary_restrictions": [],
        "recovery_stage": "gentle",
        "reparse_needed": False
    }).execute()
    return result.data[0]

async def update_session(client: Client, session_id: str, updates: dict):
    client.table("sessions").update(updates).eq("session_id", session_id).execute()

async def save_message(client: Client, session_id: str, role: str, content: str):
    client.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content
    }).execute()

async def get_messages(client: Client, session_id: str) -> list:
    result = client.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return [{"role": m["role"], "content": m["content"]} for m in result.data]

async def save_challenge(client: Client, session_id: str, challenge: dict):
    existing = client.table("challenges").select("*").eq("session_id", session_id).eq("dish", challenge["dish"]).execute()
    if existing.data:
        return None
    client.table("challenges").insert({
        "session_id": session_id,
        **challenge
    }).execute()

async def get_challenges(client: Client, session_id: str) -> list:
    result = client.table("challenges").select("*").eq("session_id", session_id).execute()
    return result.data