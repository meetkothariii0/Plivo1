const config = require('../config');

/**
 * Generate XML for OTP prompt
 * Collects 4 DTMF digits and sends to /webhook/otp-input
 */
const generateOTPPrompt = (callbackUrl) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits action="${callbackUrl}/webhook/otp-input" numDigits="4" timeout="10" retries="1">
        <Speak>Welcome to InspireWorks. Please enter your 4 digit PIN code.</Speak>
    </GetDigits>
    <Hangup />
</Response>`;
};

/**
 * Generate XML for language selection menu
 * Collects 1 DTMF digit (1 or 2) for language choice
 */
const generateLanguageMenu = (callbackUrl) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits action="${callbackUrl}/webhook/language-input" numDigits="1" timeout="10" retries="1">
        <Speak>Please select your language. Press 1 for English or Press 2 for Spanish.</Speak>
    </GetDigits>
    <Hangup />
</Response>`;
};

/**
 * Generate XML for action selection menu
 * Language-specific prompts for audio playback or call forwarding
 */
const generateActionMenu = (callbackUrl, language) => {
  const languageCode = language === '2' ? 'es' : 'en';
  
  let prompt;
  if (languageCode === 'es') {
    prompt = 'Presione 1 para escuchar un mensaje o Presione 2 para hablar con un asociado.';
  } else {
    prompt = 'Press 1 to listen to a message or Press 2 to speak with an associate.';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits action="${callbackUrl}/webhook/action-input" numDigits="1" timeout="10" retries="1">
        <Speak>${prompt}</Speak>
    </GetDigits>
    <Hangup />
</Response>`;
};

/**
 * Generate XML for audio playback
 * Plays audio file and then optionally continues flow
 */
const generateAudioPlayback = (audioUrl, language) => {
  const languageCode = language === '2' ? 'es' : 'en';
  
  let thankYouMessage;
  if (languageCode === 'es') {
    thankYouMessage = 'Gracias por escuchar. Adiós.';
  } else {
    thankYouMessage = 'Thank you for listening. Goodbye.';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
    <Speak>${thankYouMessage}</Speak>
    <Hangup />
</Response>`;
};

/**
 * Generate XML for call transfer to associate
 * Uses Dial element to forward call to placeholder number
 */
const generateCallTransfer = (language) => {
  const languageCode = language === '2' ? 'es' : 'en';
  
  let connectingMessage;
  if (languageCode === 'es') {
    connectingMessage = 'Conectando con un asociado. Por favor espere.';
  } else {
    connectingMessage = 'Connecting you with an associate. Please hold.';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak>${connectingMessage}</Speak>
    <Dial>${config.ivr.associateNumber}</Dial>
</Response>`;
};

/**
 * Generate XML for OTP retry after max attempts exceeded
 */
const generateOTPMaxAttemptsReached = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak>Maximum number of attempts reached. Goodbye.</Speak>
    <Hangup />
</Response>`;
};

/**
 * Generate XML for invalid input (retry prompt)
 */
const generateInvalidInputRetry = (callbackUrl, stage) => {
  let retryMessage;
  
  switch (stage) {
    case 'otp':
      retryMessage = 'Invalid PIN code. Please try again.';
      break;
    case 'language':
      retryMessage = 'Invalid selection. Please press 1 for English or 2 for Spanish.';
      break;
    case 'action':
      retryMessage = 'Invalid selection. Please press 1 to listen to a message or 2 to speak with an associate.';
      break;
    default:
      retryMessage = 'Invalid input. Please try again.';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak>${retryMessage}</Speak>
    <GetDigits action="${callbackUrl}/webhook/${stage}-input" numDigits="1" timeout="10" retries="1">
        <Speak>Please try again.</Speak>
    </GetDigits>
    <Hangup />
</Response>`;
};

module.exports = {
  generateOTPPrompt,
  generateLanguageMenu,
  generateActionMenu,
  generateAudioPlayback,
  generateCallTransfer,
  generateOTPMaxAttemptsReached,
  generateInvalidInputRetry,
};
