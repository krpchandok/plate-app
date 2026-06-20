import json
import re
import base64
import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from agent.state import RecoveryState

PARSE_PROMPT = """
You are parsing a restaurant menu. Extract every dish and return ONLY a JSON array, no preamble, no markdown.

Each dish should follow this structure:
{
  "name": "dish name",
  "original_description": "original text",
  "ingredients": ["inferred", "ingredients"],
  "food_groups": {
    "protein": true/false,
    "grains": true/false,
    "vegetables": true/false,
    "dairy": true/false,
    "joy": true/false
  },
  "category": "main/side/dessert/drink/appetizer"
}

Set joy=true for dishes that are primarily desserts, sweets, or comfort foods with no significant nutritional food group coverage.
"""

def load_pdf(state: RecoveryState, pdf_path: str) -> RecoveryState:
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    raw_text = ""
    for page in reader.pages:
        raw_text += page.extract_text()
    return {**state, "raw_text": raw_text}

def load_image(state: RecoveryState, image_path: str) -> RecoveryState:
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    return {**state, "raw_text": "", "image_data": image_data}

def parse_menu(state: RecoveryState) -> RecoveryState:
    llm = ChatAnthropic(model="claude-sonnet-4-5", max_tokens=4096)

    if state.get("image_data"):
        message = HumanMessage(content=[
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": state["image_data"]
                }
            },
            {"type": "text", "text": PARSE_PROMPT}
        ])
        response = llm.invoke([message])
    else:
        response = llm.invoke(PARSE_PROMPT + f"\n\nMenu text:\n{state['raw_text']}")

    content = re.sub(r"```json|```", "", response.content).strip()

    output_path = os.path.join(os.getcwd(), "outputs", "debug_response.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(content)

    raw_menu = json.loads(content)
    return {**state, "raw_menu": raw_menu}