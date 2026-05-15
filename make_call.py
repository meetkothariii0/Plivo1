import os
from plivo import RestClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Retrieve configuration
    auth_id = os.environ.get("PLIVO_AUTH_ID")
    auth_token = os.environ.get("PLIVO_AUTH_TOKEN")
    from_number = os.environ.get("PLIVO_FROM_NUMBER")
    to_number = os.environ.get("TO_NUMBER")
    base_url = os.environ.get("BASE_URL")

    # Verify all required variables are present
    if not all([auth_id, auth_token, from_number, to_number, base_url]):
        print("Error: Missing required environment variables. Please check your .env file.")
        return

    # Initialize Plivo Client
    client = RestClient(auth_id, auth_token)
    
    # URL that Plivo will fetch when the call is answered
    answer_url = f"{base_url}/answer"
    answer_method = "GET"

    try:
        # Initiate the outbound call
        response = client.calls.create(
            from_=from_number,
            to_=to_number,
            answer_url=answer_url,
            answer_method=answer_method,
        )
        print("Call initiated successfully")
        print(f"Request UUID: {response.request_uuid}")
    except Exception as e:
        print(f"Error initiating call: {e}")

if __name__ == "__main__":
    main()
