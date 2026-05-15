# Plivo Multi-Level IVR System

A secure, production-quality outbound IVR (Interactive Voice Response) system built with **Python**, **Flask**, and the **Plivo Voice API**. This project demonstrates caller authentication, multi-level branching logic, and real-time call bridging.

## 🚀 Features

- **Outbound Call Trigger**: Initiate calls via a modern web dashboard or a standalone Python script.
- **Secure OTP Layer**: Identity verification using a 4-digit DDMM passcode (1503).
- **Multi-Level IVR**:
    - **Level 1**: Language selection (English/Spanish).
    - **Level 2**: Dynamic actions (MP3 Audio Playback or Live Agent Transfer).
- **Modern Dashboard**: Responsive UI with Dark/Light mode, glassmorphism aesthetics, and a real-time call flow visualizer.
- **Robust Routing**: Uses absolute URL mapping to prevent call drops over tunnels.
- **Detailed Logging**: Every interaction (digits pressed, errors, redirects) is logged for auditing.

---

## 🛠️ Tech Stack

- **Backend**: Flask (Python 3.x)
- **Voice SDK**: Plivo Python SDK
- **Frontend**: HTML5, CSS3 (Vanilla), Jinja2
- **Tunneling**: Ngrok

---

## 📋 Setup Instructions

### 1. Prerequisites
- Python 3.8+ installed.
- A [Plivo Account](https://www.plivo.com/) with a Voice-enabled phone number.
- [Ngrok](https://ngrok.com/) installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/meetkothariii0/Plivo1.git
cd Plivo1
```

### 3. Install Dependencies
```bash
# Recommended: Use a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```
Open `.env` and provide your **actual** Plivo credentials:
```env
PLIVO_AUTH_ID=your_auth_id
PLIVO_AUTH_TOKEN=your_auth_token
PLIVO_FROM_NUMBER=your_plivo_number
BASE_URL=your_ngrok_url
OTP=1503
AUDIO_URL=https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
LIVE_AGENT_NUMBER=your_associate_number
```

---

## 🔑 Required Plivo Credentials

To run this project, you need the following from your [Plivo Console](https://console.plivo.com/dashboard/):
1.  **Auth ID**: Found on the main dashboard.
2.  **Auth Token**: Found on the main dashboard.
3.  **Plivo Number**: A rented number capable of making outbound voice calls.

---

## 🏃 Steps to Run and Test

### Step 1: Start the Tunnel (Ngrok)
In a separate terminal, start ngrok on port 5001:
```bash
ngrok http 5001
```
Copy the Forwarding URL (e.g., `https://xxxx-xxxx.ngrok-free.app`) and paste it as the `BASE_URL` in your `.env` file.

### Step 2: Start the Flask Server
```bash
python app.py
```
The server will start on `http://localhost:5001`.

### Step 3: Trigger a Call
1.  Open your browser and navigate to `http://localhost:5001`.
2.  Enter your personal phone number (with country code).
3.  Click **"Initiate Secure Call"**.

### Step 4: Follow the IVR Flow
1.  **Answer the call**: You will hear the Agent ask for a 4-digit code.
2.  **Enter OTP**: Type `1503`.
3.  **Select Language**: Press `1` for English.
4.  **Execute Action**: Press `1` to hear a song or `2` to be transferred to an agent.

---

## 📁 Project Structure

```text
Plivo1/
├── app.py              # Main Flask application (Webhooks & Frontend)
├── make_call.py        # CLI script to trigger calls
├── requirements.txt    # Python dependencies
├── .env                # Private configuration (excluded from git)
├── .env.example        # Template for configuration
├── static/
│   └── style.css       # Frontend styling (Dark/Light mode)
└── templates/
    └── index.html      # Frontend dashboard (Jinja2)
```

---

## ⚠️ Troubleshooting
- **No Sound?** Ensure the `Speak` tags are nested inside `GetInput` (this is already handled in `app.py`).
- **Call Hangs Up?** Double-check that your `BASE_URL` in `.env` matches your current ngrok URL perfectly.
- **Trial Account?** If using a Plivo Trial, you MUST verify your destination phone number in the Plivo Sandbox Console.
