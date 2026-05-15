require('dotenv').config();

const config = {
  // Plivo API Configuration
  plivo: {
    authId: process.env.PLIVO_AUTH_ID,
    authToken: process.env.PLIVO_AUTH_TOKEN,
    phoneNumber: process.env.PLIVO_PHONE_NUMBER,
    apiBaseUrl: 'https://api.plivo.com/v1',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    callbackBaseUrl: process.env.CALLBACK_BASE_URL || 'http://localhost:3000',
  },

  // IVR Configuration
  ivr: {
    // OTP: March 15th in DDMM format
    otp: '1503',
    // Maximum OTP attempts before call hangup
    maxOtpAttempts: 3,
    // Default audio URL (Plivo sample or public MP3)
    audioUrl: 'https://cache.plivo.com/voice/uploads/announcement.mp3',
    // Placeholder number for call forwarding
    associateNumber: '+14157654321',
  },

  // Validation
  validate: () => {
    const required = [
      'PLIVO_AUTH_ID',
      'PLIVO_AUTH_TOKEN',
      'PLIVO_PHONE_NUMBER',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please copy .env.example to .env and fill in your Plivo credentials.`
      );
    }
  },
};

// Validate on load
config.validate();

module.exports = config;
