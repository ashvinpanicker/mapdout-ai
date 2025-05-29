import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Add the ADK samples path to sys.path
ADK_SAMPLE_PATH = "/Users/ashvinpanicker/Code/adk-samples/python/agents/travel-concierge"
if ADK_SAMPLE_PATH not in sys.path:
    sys.path.append(ADK_SAMPLE_PATH)

# Attempt to import the actual TravelConciergeAgent
try:
    # Assuming the main agent class is TravelConciergeAgent in agent.py
    # inside the 'travel_concierge' subdirectory of ADK_SAMPLE_PATH
    from travel_concierge.agent import TravelConciergeAgent
    ADK_AGENT_AVAILABLE = True
    print(f"Successfully imported TravelConciergeAgent from {os.path.join(ADK_SAMPLE_PATH, 'travel_concierge')}")
except ImportError as e:
    print(f"WARNING: Could not import TravelConciergeAgent from {ADK_SAMPLE_PATH}. Error: {e}")
    print("ADK integration will be mocked.")
    ADK_AGENT_AVAILABLE = False

    # Define a Mock Agent if the real one isn't found, so the app can still run
    class TravelConciergeAgent: # type: ignore
        def __init__(self, api_key: str):
            if not api_key:
                # This check might be handled by the real agent too
                print("MockTravelConciergeAgent: API key would be required for the real agent.")
            print(f"MockTravelConciergeAgent initialized (API Key: {api_key[:5]}...)")
            self.api_key = api_key

        def plan_trip(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
            print(f"MockTravelConciergeAgent: plan_trip called with: {preferences}")
            # Simulate some processing based on input
            duration_str = "N/A"
            if preferences.get("startDate") and preferences.get("endDate"):
                try:
                    from datetime import date
                    start_date = date.fromisoformat(preferences["startDate"])
                    end_date = date.fromisoformat(preferences["endDate"])
                    duration = (end_date - start_date).days
                    duration_str = f"{duration} days"
                except ValueError:
                    duration_str = "Invalid date format"

            return {
                "trip_id": "mock_trip_123",
                "destination_echo": preferences.get("destination"),
                "duration_echo": duration_str,
                "summary": "This is a mock itinerary because the real ADK agent could not be fully loaded or an error occurred.",
                "suggestions": [
                    f"Explore {preferences.get('destination', 'the area')} (mock)",
                    "Try local cuisine (mock)"
                ]
            }

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "null",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent
# Initialize the agent
# IMPORTANT: Ensure GOOGLE_API_KEY environment variable is set for the actual agent.
google_api_key = os.getenv("GOOGLE_API_KEY")
travel_agent: Optional[TravelConciergeAgent] = None

if not google_api_key:
    print("CRITICAL WARNING: GOOGLE_API_KEY environment variable not set. The ADK agent will likely fail or use mock.")

if ADK_AGENT_AVAILABLE and google_api_key:
    try:
        # The actual TravelConciergeAgent might take other parameters for initialization
        # For example, it might directly use an initialized GenerativeModel client
        # This is a simplified initialization based on a common pattern.
        # You may need to adjust this based on the ADK sample's agent.py.
        travel_agent = TravelConciergeAgent(api_key=google_api_key)
        print("Successfully initialized REAL TravelConciergeAgent.")
    except Exception as e:
        print(f"Error initializing REAL TravelConciergeAgent: {e}. ADK features may not work.")
        # Optionally, fall back to mock if initialization of real agent fails
        if not ADK_AGENT_AVAILABLE: # Ensure mock is defined if import failed
             class TravelConciergeAgent: # type: ignore
                def __init__(self, api_key: str): print(f"Fallback MockAgent (init error) API Key: {api_key[:5]}...")
                def plan_trip(self, p: Dict[str,Any]): return {"error": "Real agent init failed", "details": str(e)}
        travel_agent = TravelConciergeAgent(api_key="MOCK_KEY_REAL_AGENT_INIT_FAILED")
elif ADK_AGENT_AVAILABLE and not google_api_key:
    print("Using MOCK TravelConciergeAgent because GOOGLE_API_KEY is not set.")
    travel_agent = TravelConciergeAgent(api_key="MOCK_KEY_NO_API_KEY_FOR_REAL_AGENT")
else: # ADK_AGENT_AVAILABLE is False
    print("Using MOCK TravelConciergeAgent because ADK module was not found.")
    travel_agent = TravelConciergeAgent(api_key="MOCK_KEY_ADK_MODULE_NOT_FOUND")


class QuestionnaireData(BaseModel):
    destination: str
    startDate: str
    endDate: str
    travelers: str
    dailyRhythm: str
    travelStyle: str
    structureLevel: int
    interests: List[str]
    budget: str
    dietary: List[str]
    foodAdventure: int
    specialRequirements: List[str]
    specialNotes: Optional[str] = ""

@app.post("/submit_questionnaire/")
async def submit_questionnaire(data: QuestionnaireData):
    print("Received questionnaire data:")
    preferences = data.model_dump()
    print(preferences)

    if not travel_agent:
        raise HTTPException(status_code=500, detail="Travel agent not initialized.")

    try:
        # Transform `preferences` if needed to match the ADK agent's expected input format
        # For now, we'll pass it directly, assuming it's compatible or the agent handles it.
        adk_request = preferences # Example: might need mapping like {"destination_city": data.destination, ...}
        
        print(f"Sending to ADK agent: {adk_request}")
        adk_response = travel_agent.plan_trip(adk_request)
        print(f"Received from ADK agent: {adk_response}")

        return {
            "message": "Questionnaire data processed by Travel Concierge Agent!",
            "original_data": data,
            "agent_response": adk_response
        }
    except Exception as e:
        print(f"Error calling ADK agent: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing request with ADK agent: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)