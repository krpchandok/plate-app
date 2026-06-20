import json
import re
import os
from langchain_anthropic import ChatAnthropic
from agent.state import RecoveryState

NOURISHING_PROMPT = """
You are rewriting restaurant menu descriptions for people in eating disorder recovery.
This dish has meaningful nutritional food groups. Use warm, sensory language that also 
highlights recovery-supportive benefits — no numbers, no calories, no macro framing.

Focus on: taste, texture, warmth, comfort, and what each food group gently supports 
(e.g. "rich in iron which supports energy" not "high protein").

Dish: {name}
Original: {description}
Food groups present: {food_groups}

Return ONLY a JSON object, no preamble:
{{
  "rewritten_description": "...",
  "plate_annotations": {{
    "protein": "recovery note if present, else null",
    "grains": "recovery note if present, else null",
    "vegetables": "recovery note if present, else null",
    "dairy": "recovery note if present, else null"
  }}
}}
"""

JOY_PROMPT = """
You are rewriting restaurant menu descriptions for people in eating disorder recovery.
This dish is a joy food — rewrite it using purely sensory and pleasure language.
No nutritional justification needed. Food doesn't need to earn its place.

Focus on: taste, texture, indulgence, warmth, celebration, comfort.

Dish: {name}
Original: {description}

Return ONLY a JSON object, no preamble:
{{
  "rewritten_description": "...",
  "plate_annotations": {{
    "joy": "one gentle sentence about why joy foods belong in recovery"
  }}
}}
"""

def rewrite_dishes(state: RecoveryState) -> RecoveryState:
    llm = ChatAnthropic(model="claude-sonnet-4-5", max_tokens=1024)
    rewritten_menu = []

    for dish in state["raw_menu"]:
        fg = dish["food_groups"]
        is_joy_only = fg["joy"] and not any([fg["protein"], fg["grains"], fg["vegetables"], fg["dairy"]])

        prompt = (JOY_PROMPT if is_joy_only else NOURISHING_PROMPT).format(
            name=dish["name"],
            description=dish["original_description"],
            food_groups=[k for k, v in fg.items() if v and k != "joy"]
        )

        response = llm.invoke(prompt)
        content = re.sub(r"```json|```", "", response.content).strip()

        try:
            rewrite = json.loads(content)
        except json.JSONDecodeError:
            rewrite = {"rewritten_description": dish["original_description"], "plate_annotations": {}}

        rewritten_menu.append({
            **dish,
            "rewritten_description": rewrite["rewritten_description"],
            "plate_annotations": rewrite["plate_annotations"]
        })

        print(f"  ✓ {dish['name']}")

    output_path = os.path.join(os.getcwd(), "outputs", "rewritten_menu.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(rewritten_menu, f, indent=2)

    return {**state, "rewritten_menu": rewritten_menu}