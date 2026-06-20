from fastapi import APIRouter
import httpx
import os
import json
import re
from anthropic import Anthropic
from agent.nodes.rewriter import rewrite_dishes
from agent.state import RecoveryState
from db.supabase_client import get_supabase

router = APIRouter()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@router.get("/menu/{place_id}")
async def get_menu(place_id: str, website: str, name: str = ""):
    supabase = get_supabase()

    cached = supabase.table("menus").select("*").eq("place_id", place_id).execute()
    if cached.data:
        return {"menu": cached.data[0]["menu"], "cached": True}

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": f"""You are helping generate a menu for {name} (website: {website}).

Using your knowledge of this restaurant chain or establishment, create a realistic menu.

Return ONLY a JSON array, no preamble, no markdown.

Each dish:
{{
  "name": "dish name",
  "original_description": "realistic description",
  "ingredients": ["inferred", "ingredients"],
  "food_groups": {{
    "protein": true/false,
    "grains": true/false,
    "vegetables": true/false,
    "dairy": true/false,
    "joy": true/false
  }},
  "category": "main/side/dessert/drink/appetizer"
}}

Set joy=true for desserts, sweets, or comfort foods.
Include at least 8-12 dishes across categories."""
        }]
    )

    content = re.sub(r"```json|```", "", response.content[0].text).strip()

    try:
        raw_menu = json.loads(content)
    except:
        return {"error": "Could not parse menu"}

    state: RecoveryState = {
        "raw_text": "",
        "image_data": "",
        "raw_menu": raw_menu,
        "rewritten_menu": [],
        "food_group_map": {},
        "avoided_foods": [],
        "dietary_restrictions": [],
        "recovery_stage": "gentle",
        "challenges": [],
        "chat_history": [],
        "reparse_needed": False
    }

    state = rewrite_dishes(state)
    rewritten = state["rewritten_menu"]

    supabase.table("menus").insert({
        "place_id": place_id,
        "restaurant_name": name,
        "menu": rewritten
    }).execute()

    return {"menu": rewritten, "cached": False}