# Plivo IVR Project

## Project Overview
This is a secure multi-level IVR system built using Python, Flask, and the Plivo Voice API. The application initiates an outbound call and prompts the user to authenticate via a 4-digit OTP. Upon successful authentication, it guides the caller through a multi-level menu to choose their preferred language and an action (playing an audio message or connecting to a live associate).

## Features
- Outbound calling using Plivo API
- OTP Authentication using DTMF input
- Multi-level IVR (Language Selection -> Action Selection)
- Plivo XML for call flow logic
- Support for multiple languages (English and Spanish)

## Project Structure
```
plivo-ivr/
├── app.py             # Main Flask server handling Plivo webhooks
├── make_call.py       # Script to trigger the outbound call
├── requirements.txt   # Python dependencies
├── .env.example       # Example environment variables
└── README.md          # Documentation
```

## Setup Instructions

### 1. Installation Steps
Clone the repository and install the Python dependencies:

```bash
pip install -r requirements.txt
```

### 2. Environment Setup
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your actual Plivo Auth ID, Auth Token, phone numbers, and your ngrok base URL.

### 3. Run ngrok
You will need to expose your local Flask server to the internet so Plivo can reach your webhooks. Run:
```bash
ngrok http 5000
```
Copy the Forwarding URL (e.g., `https://xxxx-xxx.ngrok-free.app`) and set it as `BASE_URL` in your `.env` file.

### 4. Run the Flask Server
Start the webhook server in a new terminal window:
```bash
python app.py
```
The server will run on port 5000.

### 5. Trigger the Outbound Call
With your Flask app and ngrok running, open another terminal and execute:
```bash
python make_call.py
```

## Expected Call Flow
1. Run `python make_call.py`
2. Your designated phone rings and you answer.
3. The system prompts for a 4-digit OTP.
4. **Incorrect OTP:** The system plays "Incorrect OTP. Please try again." and prompts again.
5. **Correct OTP (1503):** The system plays "Authentication successful" and proceeds.
6. The system presents the Language menu (Press 1 for English, 2 for Spanish).
7. The system presents the Action menu based on the language chosen:
   - **Press 1:** Audio message plays.
   - **Press 2:** The call connects to a live agent.

## Troubleshooting
- **Call doesn't initiate:** Ensure your Plivo credentials in `.env` are correct and your source phone number is registered/purchased in your Plivo account.
- **Plivo can't reach webhook:** Make sure `ngrok` is running, your `BASE_URL` in `.env` matches the ngrok URL perfectly (no trailing slash), and your Flask server is running.
- **OTP fails continuously:** Ensure you are entering `1503` (or whatever `OTP` is set to in your `.env`).
