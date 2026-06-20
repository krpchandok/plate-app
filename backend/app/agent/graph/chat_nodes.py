import os
from urllib import response
import anthropic
import httpx
from agent.graph.chat_workflow_state import ChatWorkflowState

SYSTEM_PROMPT = """
You are a warm, gentle recovery companion helping someone navigate dining out.
You are NOT a therapist or dietitian — you are a supportive guide.

You have access to the restaurant's rewritten menu:
{menu_summary}

You also have the user's location: lat={lat}, lng={lng}

Your goals:
1. Check in gently — how is the person feeling about eating out today
2. Ask about their food preferences and what kind of environment feels safe
3. Use get_nearby_restaurants to find options near them
4. Use recommend_restaurants to suggest 2-3 places that match their preferences and recovery needs
5. Listen for foods or food groups they mention avoiding or feeling anxious about
6. When appropriate, gently explore what feels manageable as a small challenge
7. When the person identifies something they want to work toward, use the add_challenge tool
8. Use update_context if they share avoided foods or dietary restrictions
9. Always reccomend places nearby, and suggest dishes from the rewritten menu that might feel good based on their preferences and challenges
10. If the person says they want to challenge something, offer them locations near them to try out. If they specify a location, include that in the challenge, if not, then leave it as a challenge without a location specified.
11. When a user asks about a specific restaurant, ask if they would like to see its menu, and if so, use get_restaurant_menu to fetch and rewrite it for them in case they want to try it out. 
12. Do not tell a user to search up a restaurant on their own, always offer to fetch the menu for them and rewrite it with recovery-friendly language. If you cannot find the menu, say their menu is not available but you can still help them navigate the restaurant based on their preferences and challenges.

Rules:
- Never push. If someone isn't ready, validate that and move on.
- Never mention calories, macros, or weight.
- Never frame food as good/bad, clean/dirty, earned/unearned.
- Keep responses short and warm — this is a conversation, not a lecture.
- If someone seems distressed, remind them this is a support tool and encourage them to speak with their care team.
"""

TOOLS = [
    {
        "name": "add_challenge",
        "description": "Add a recovery challenge to the user's list when they express readiness",
        "input_schema": {
            "type": "object",
            "properties": {
                "dish": {"type": "string"},
                "component": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["dish", "component", "description"]
        }
    },
    {
        "name": "update_context",
        "description": "Update the user's avoided foods or recovery stage based on what they share",
        "input_schema": {
            "type": "object",
            "properties": {
                "avoided_foods": {"type": "array", "items": {"type": "string"}},
                "dietary_restrictions": {"type": "array", "items": {"type": "string"}},
                "recovery_stage": {"type": "string", "enum": ["gentle", "moderate", "challenging"]}
            },
            "required": []
        }
    },
    {
        "name": "get_nearby_restaurants",
        "description": "Fetch nearby restaurants based on user location to make recommendations",
        "input_schema": {
            "type": "object",
            "properties": {
                "lat": {"type": "number"},
                "lng": {"type": "number"},
                "preference": {"type": "string"}
            },
            "required": ["lat", "lng"]
        }
    },
    {
        "name": "recommend_restaurants",
        "description": "Recommend specific restaurants from the nearby list based on user preferences and recovery context",
        "input_schema": {
            "type": "object",
            "properties": {
                "recommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "reason": {"type": "string"}
                        }
                    }
                }
            },
            "required": ["recommendations"]
        }
    },
    {
        "name": "get_restaurant_menu",
        "description": "Fetch and rewrite the menu for a specific restaurant by name to show the user recovery-friendly descriptions",
        "input_schema": {
            "type": "object",
            "properties": {
                "restaurant_name": {"type": "string"},
                "place_id": {"type": "string", "description": "Google Place ID if known"}
            },
            "required": ["restaurant_name"]
        }
    }   
]

def build_menu_summary(rewritten_menu: list[dict]) -> str:
    return "\n".join([
        f"- {dish['name']} ({dish['category']}): {dish['rewritten_description']}"
        for dish in rewritten_menu
    ])

def call_model(state: ChatWorkflowState) -> ChatWorkflowState:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    system = SYSTEM_PROMPT.format(
        menu_summary=build_menu_summary(state["rewritten_menu"]),
        lat=state.get("lat", 43.6532),
        lng=state.get("lng", -79.3832)
    )

    messages = []
    for m in state["messages"]:
        if hasattr(m, "type"):
            role = "user" if m.type == "human" else "assistant"
            messages.append({"role": role, "content": m.content})
        else:
            messages.append({"role": m["role"], "content": m["content"]})

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=system,
        tools=TOOLS,
        messages=messages
    )

    new_challenges = list(state["challenges"])
    avoided_foods = list(state["avoided_foods"])
    reparse_needed = state["reparse_needed"]
    recovery_stage = state["recovery_stage"]
    recommendations = list(state.get("recommendations", []))
    assistant_text = ""
    tool_results = []

    for block in response.content:
        if block.type == "tool_use":
            if block.name == "add_challenge":
                new_challenges.append({
                    "dish": block.input["dish"],
                    "component": block.input["component"],
                    "description": block.input["description"],
                    "status": "pending"
                })
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": f"Challenge added for {block.input['dish']}"
                })
            elif block.name == "update_context":
                if "avoided_foods" in block.input:
                    avoided_foods = block.input["avoided_foods"]
                    reparse_needed = True
                if "recovery_stage" in block.input:
                    recovery_stage = block.input["recovery_stage"]
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": "Context updated"
                })
            elif block.name == "get_nearby_restaurants":
                lat = block.input.get("lat") or state.get("lat", 43.6532)
                lng = block.input.get("lng") or state.get("lng", -79.3832)
                key = os.getenv("GOOGLE_PLACES_KEY")
                url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1500&type=restaurant&key={key}"
                with httpx.Client() as http:
                    res = http.get(url)
                    places = res.json().get("results", [])[:10]
                    restaurant_list = [{"name": p["name"], "address": p.get("vicinity", "")} for p in places]
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(restaurant_list)
                })
            elif block.name == "recommend_restaurants":
                recommendations = block.input.get("recommendations", [])
                rec_text = "\n".join([f"• {r['name']} — {r['reason']}" for r in recommendations])
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": rec_text
                })
            elif block.name == "get_restaurant_menu":
                print(f"🍽 Fetching menu for: {block.input.get('restaurant_name')}")
                import requests
                restaurant_name = block.input.get("restaurant_name", "")
                place_id = block.input.get("place_id", restaurant_name)
                
                # call your own menu endpoint
                res = requests.get(
                    f"http://localhost:8000/menu/{place_id}",
                    params={"website": f"https://www.google.com/search?q={restaurant_name}+menu", "name": restaurant_name}
                )
                menu_data = res.json()
                menu = menu_data.get("menu", [])
                
                if menu:
                    summary = "\n".join([f"- {d['name']}: {d['rewritten_description']}" for d in menu[:8]])
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Here is the rewritten menu for {restaurant_name}:\n{summary}"
                    })
                else:
                    print(f"⚠️ Could not fetch menu for {restaurant_name}")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Could not find menu for {restaurant_name}"
                    })


        elif block.type == "text" and block.text:
            assistant_text = block.text

    # if tool was called, make follow-up call to get text response
    if tool_results:
        follow_up_messages = messages + [
            {"role": "assistant", "content": response.content},
            {"role": "user", "content": tool_results}
        ]
        follow_up = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=system,
            tools=TOOLS,
            messages=follow_up_messages
        )
        for block in follow_up.content:
            if block.type == "text" and block.text:
                assistant_text = block.text

    return {
        **state,
        "messages": state["messages"] + [{"role": "assistant", "content": assistant_text}],
        "challenges": new_challenges,
        "avoided_foods": avoided_foods,
        "reparse_needed": reparse_needed,
        "recovery_stage": recovery_stage,
        "recommendations": recommendations
    }