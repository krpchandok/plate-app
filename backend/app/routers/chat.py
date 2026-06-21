import uuid
import json
from fastapi import APIRouter, WebSocket
from pydantic import BaseModel
from starlette.websockets import WebSocketDisconnect
from services.chat_service import bot_reply, get_greeting

router = APIRouter()
rewritten_menu = {}

class ChallengeCreate(BaseModel):
    session_id: str
    dish: str
    component: str
    description: str
    status: str = "pending"

class ChallengeUpdate(BaseModel):
    status: str

@router.get("/health")
def health():
    return {"status": "ok"}

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    print(f"WebSocket connected")
    print(f"Query params: {dict(websocket.query_params)}")
    session_id = websocket.query_params.get("session_id")
    token = websocket.query_params.get("token")
    lat = float(websocket.query_params.get("lat", 43.6532))
    lng = float(websocket.query_params.get("lng", -79.3832))

    from db.supabase_client import get_supabase
    client = get_supabase()

    try:
        user = client.auth.get_user(token)
        if not user or not user.user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close()
            return
    except Exception as e:
        print(f"Auth error: {e}")
        await websocket.close()
        return

    session_id = session_id or user.user.id

    greeting = await get_greeting(session_id, rewritten_menu, lat=lat, lng=lng)
    await websocket.send_json({
        "type": "greeting",
        "session_id": session_id,
        "message": greeting["reply"]
    })

    while True:
        try:
            data = await websocket.receive_text()
            result = await bot_reply(session_id, data, rewritten_menu, lat=lat, lng=lng)
            print(f"bot_reply result: {result['reply'][:50]}")  
            await websocket.send_json({
                "type": "message",
                "message": result["reply"],
                "challenges": result["challenges"]
            })
        except WebSocketDisconnect:
            break
        except Exception as e:
            import traceback
            traceback.print_exc()
            await websocket.send_json({"type": "error", "message": str(e)})


@router.get("/chat/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    from db.supabase_client import get_supabase
    from db.session_store import get_messages
    client = get_supabase()
    messages = await get_messages(client, session_id)
    return {"messages": messages}

@router.get("/chat/sessions/{session_id}/challenges")
async def get_session_challenges(session_id: str):
    from db.supabase_client import get_supabase
    from db.session_store import get_challenges
    client = get_supabase()
    challenges = await get_challenges(client, session_id)
    return {"challenges": challenges}

@router.post("/challenges")
async def create_challenge(challenge: ChallengeCreate):
    from db.supabase_client import get_supabase
    from db.session_store import save_challenge
    client = get_supabase()

    existing = client.table("challenges").select("*").eq("session_id", challenge.session_id).eq("dish", challenge.dish).execute()
    if existing.data:
        return {"status": "duplicate", "message": "Challenge for this dish already exists"}

    await save_challenge(client, challenge.session_id, {
        "dish": challenge.dish,
        "component": challenge.component,
        "description": challenge.description,
        "status": challenge.status
    })
    return {"status": "ok"}

@router.patch("/challenges/{challenge_id}")
async def update_challenge(challenge_id: str, update: ChallengeUpdate):
    from db.supabase_client import get_supabase
    client = get_supabase()
    client.table("challenges").update({"status": update.status}).eq("id", challenge_id).execute()
    return {"status": "ok"}

@router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    from db.supabase_client import get_supabase
    client = get_supabase()
    client.table("challenges").delete().eq("id", challenge_id).execute()
    return {"status": "ok"}