import os
import json
import traceback
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class LLMClient:
    def classify(self, complaint_text: str) -> dict:
        """
        Classify a complaint into category, priority, and location using Gemini 3.6 Flash.
        
        Args:
            complaint_text: The complaint description to classify.
            
        Returns:
            A dict with keys: category, priority, location.
            Falls back to defaults if classification fails.
        """
        prompt = (
            "Classify the following citizen complaint into category, priority, and location. "
            "Return ONLY JSON with keys category, priority, location. "
            "category should be one of: Roads, Water, Electricity, Sanitation, Public Safety, Other. "
            "priority should be one of: Low, Medium, High. "
            "location should be any place name mentioned in the text, or \"Unknown\" if none.\n\n"
            f"Complaint: {complaint_text}"
        )

        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )
            raw = response.text.strip()

            # Strip markdown code fences if Gemini wraps the JSON in ```json ... ```
            if raw.startswith("```"):
                raw = raw.strip("`")
                if raw.startswith("json"):
                    raw = raw[4:].lstrip()

            # Parse JSON response
            data = json.loads(raw)
            
            return {
                "category": data.get("category", "Other"),
                "priority": data.get("priority", "Medium"),
                "location": data.get("location", "Unknown"),
            }
        except Exception as e:
            print("=== LLM CLASSIFICATION ERROR ===")
            traceback.print_exc()
            print("================================")
            # Return safe defaults if classification fails
            return {
                "category": "Other",
                "priority": "Medium",
                "location": "Unknown",
            }