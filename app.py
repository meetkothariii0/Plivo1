import os
import logging
from flask import Flask, request, Response, render_template
from plivo import plivoxml, RestClient
from dotenv import load_dotenv

# Initialize environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# --- Configuration Constants ---
OTP_CODE = os.environ.get("OTP", "1503")
AUDIO_MESSAGE_URL = os.environ.get("AUDIO_URL", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
LIVE_AGENT_PHONE = os.environ.get("LIVE_AGENT_NUMBER", "918888888888")

# Credentials for Outbound Calling
PLIVO_AUTH_ID = os.environ.get("PLIVO_AUTH_ID")
PLIVO_AUTH_TOKEN = os.environ.get("PLIVO_AUTH_TOKEN")
PLIVO_FROM_NUMBER = os.environ.get("PLIVO_FROM_NUMBER")
BASE_URL = os.environ.get("BASE_URL")

# Ensure BASE_URL doesn't have a trailing slash for consistent concatenation
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')

# --- XML Helper Functions ---

def generate_xml_response(xml_element):
    """Converts Plivo XML element to a Flask Response object."""
    xml_str = xml_element.to_string()
    logger.info(f"Generated XML: {xml_str}")
    return Response(xml_str, mimetype="text/xml")

def add_input_prompt(xml_response, action_path, prompt_text, num_digits=1, timeout=7, language="en-US"):
    """
    Adds a GetInput verb with a nested Speak verb using absolute URLs.
    Using absolute URLs (BASE_URL + path) is more reliable with Plivo.
    """
    # Create absolute URL for the action
    absolute_action_url = f"{BASE_URL}{action_path}"
    
    get_input = plivoxml.GetInputElement(
        action=absolute_action_url,
        method="POST",
        num_digits=num_digits
    )
    get_input.add(plivoxml.SpeakElement(prompt_text, language=language))
    xml_response.add(get_input)
    return get_input

# --- Outbound Call Logic ---

def create_call(to_number):
    """Helper to initiate an outbound call using Plivo API."""
    if not all([PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_FROM_NUMBER, BASE_URL]):
        raise Exception("Missing Plivo configuration in environment variables.")

    client = RestClient(PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN)
    answer_url = f"{BASE_URL}/answer"
    
    response = client.calls.create(
        from_=PLIVO_FROM_NUMBER,
        to_=to_number,
        answer_url=answer_url,
        answer_method="GET"
    )
    return response.request_uuid

# --- Frontend Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start-call', methods=['POST'])
def start_call():
    to_number = request.form.get('phone_number')
    if not to_number:
        return render_template('index.html', message="Please enter a phone number.", is_error=True)
    try:
        uuid = create_call(to_number)
        msg = f"Call initiated successfully. Request UUID: {uuid}"
        logger.info(msg)
        return render_template('index.html', message=msg, is_error=False)
    except Exception as e:
        err_msg = f"Failed to initiate call: {str(e)}"
        logger.error(err_msg)
        return render_template('index.html', message=err_msg, is_error=True)

# --- IVR Webhook Routes (Using Absolute Redirects) ---

@app.route('/answer', methods=['GET', 'POST'])
def handle_answer():
    call_uuid = request.values.get('CallUUID', 'Unknown')
    logger.info(f"Call {call_uuid} answered. Prompting for OTP.")
    try:
        response = plivoxml.ResponseElement()
        # Use absolute paths for the helper
        add_input_prompt(response, "/verify-otp", "Welcome. Please enter your 4 digit authentication code.", num_digits=4)
        
        # Absolute redirect
        response.add(plivoxml.RedirectElement(f"{BASE_URL}/answer", method="GET"))
        
        return generate_xml_response(response)
    except Exception as e:
        logger.error(f"Error in /answer: {e}")
        return Response("Error processing call", status=500)

@app.route('/verify-otp', methods=['POST'])
def handle_verify_otp():
    user_input_otp = request.values.get('Digits')
    call_uuid = request.values.get('CallUUID', 'Unknown')
    try:
        response = plivoxml.ResponseElement()
        if user_input_otp == OTP_CODE:
            response.add(plivoxml.SpeakElement("Authentication successful."))
            response.add(plivoxml.RedirectElement(f"{BASE_URL}/language", method="POST"))
        else:
            response.add(plivoxml.SpeakElement("Incorrect OTP. Please try again."))
            response.add(plivoxml.RedirectElement(f"{BASE_URL}/answer", method="GET"))
        return generate_xml_response(response)
    except Exception as e:
        logger.error(f"Error in /verify-otp: {e}")
        return Response("Error verifying OTP", status=500)

@app.route('/language', methods=['POST'])
def handle_language_menu():
    try:
        response = plivoxml.ResponseElement()
        add_input_prompt(response, "/handle-language", "For English, press 1. Para Español, presione 2.")
        response.add(plivoxml.RedirectElement(f"{BASE_URL}/language", method="POST"))
        return generate_xml_response(response)
    except Exception as e:
        logger.error(f"Error in /language: {e}")
        return Response("Error in language menu", status=500)

@app.route('/handle-language', methods=['POST'])
def handle_language_selection():
    selected_lang_digit = request.values.get('Digits')
    try:
        response = plivoxml.ResponseElement()
        if selected_lang_digit == '1':
            add_input_prompt(response, "/handle-action?lang=en", "Press 1 to play a message. Press 2 to connect to a live associate.")
        elif selected_lang_digit == '2':
            add_input_prompt(response, "/handle-action?lang=es", "Presione uno para escuchar un mensaje. Presione dos para hablar con un agente.", language="es-US")
        else:
            response.add(plivoxml.RedirectElement(f"{BASE_URL}/language", method="POST"))
            return generate_xml_response(response)
        response.add(plivoxml.RedirectElement(f"{BASE_URL}/language", method="POST"))
        return generate_xml_response(response)
    except Exception as e:
        logger.error(f"Error in /handle-language: {e}")
        return Response("Error handling language selection", status=500)

@app.route('/handle-action', methods=['POST'])
def handle_final_action():
    action_digit = request.values.get('Digits')
    language_code = request.args.get('lang', 'en')
    try:
        response = plivoxml.ResponseElement()
        tts_lang = "en-US" if language_code == "en" else "es-US"
        if action_digit == '1':
            msg = "Playing message." if language_code == "en" else "Reproduciendo mensaje."
            response.add(plivoxml.SpeakElement(msg, language=tts_lang))
            response.add(plivoxml.PlayElement(AUDIO_MESSAGE_URL))
        elif action_digit == '2':
            msg = "Connecting to an associate." if language_code == "en" else "Conectando con un agente."
            response.add(plivoxml.SpeakElement(msg, language=tts_lang))
            dial_verb = plivoxml.DialElement()
            dial_verb.add(plivoxml.NumberElement(LIVE_AGENT_PHONE))
            response.add(dial_verb)
        else:
            response.add(plivoxml.SpeakElement("Invalid choice.", language=tts_lang))
            response.add(plivoxml.RedirectElement(f"{BASE_URL}/language", method="POST"))
        return generate_xml_response(response)
    except Exception as e:
        logger.error(f"Error in /handle-action: {e}")
        return Response("Error executing action", status=500)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
