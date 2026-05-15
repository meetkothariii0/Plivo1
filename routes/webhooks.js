const express = require('express');
const router = express.Router();
const config = require('../config');
const { generateOTPPrompt, generateLanguageMenu, generateActionMenu, generateAudioPlayback, generateCallTransfer, generateOTPMaxAttemptsReached, generateInvalidInputRetry } = require('../utils/ivrXml');
const callStateManager = require('../utils/callState');

/**
 * POST /webhook/answer
 * Called when an outbound call is answered
 * Returns XML with OTP prompt
 */
router.post('/answer', (req, res) => {
  const callUuid = req.body.CallUUID || req.query.CallUUID;
  const from = req.body.From || req.query.From;
  const to = req.body.To || req.query.To;

  console.log(`Call answered - UUID: ${callUuid}, From: ${from}, To: ${to}`);

  // Initialize call state
  callStateManager.initializeCallState(callUuid);

  // Generate OTP prompt XML
  const callbackUrl = config.server.callbackBaseUrl;
  const xmlResponse = generateOTPPrompt(callbackUrl);

  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

/**
 * POST /webhook/otp-input
 * Called when caller enters OTP digits
 * Validates OTP and returns next prompt or retry
 */
router.post('/otp-input', (req, res) => {
  const callUuid = req.body.CallUUID || req.query.CallUUID;
  const digits = req.body.Digits || req.query.Digits;

  console.log(`OTP input received - UUID: ${callUuid}, Digits: ${digits}`);

  const state = callStateManager.getCallState(callUuid);
  if (!state) {
    console.warn(`Call state not found for UUID: ${callUuid}`);
    res.set('Content-Type', 'application/xml');
    res.send(generateOTPMaxAttemptsReached());
    return;
  }

  // Increment OTP attempt counter
  callStateManager.incrementOtpAttempts(callUuid);
  const updatedState = callStateManager.getCallState(callUuid);

  // Check if OTP is correct
  if (digits === config.ivr.otp) {
    console.log(`OTP verification successful for UUID: ${callUuid}`);
    const callbackUrl = config.server.callbackBaseUrl;
    const xmlResponse = generateLanguageMenu(callbackUrl);
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
  } else {
    // OTP incorrect
    console.log(`OTP verification failed for UUID: ${callUuid}. Attempts: ${updatedState.otpAttempts}`);

    // Check if max attempts exceeded
    if (updatedState.otpAttempts >= config.ivr.maxOtpAttempts) {
      console.log(`Max OTP attempts exceeded for UUID: ${callUuid}`);
      res.set('Content-Type', 'application/xml');
      res.send(generateOTPMaxAttemptsReached());
      return;
    }

    // Retry OTP prompt
    const callbackUrl = config.server.callbackBaseUrl;
    const xmlResponse = generateOTPPrompt(callbackUrl);
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
  }
});

/**
 * POST /webhook/language-input
 * Called when caller selects language (1=English, 2=Spanish)
 * Returns action menu in selected language
 */
router.post('/language-input', (req, res) => {
  const callUuid = req.body.CallUUID || req.query.CallUUID;
  const digits = req.body.Digits || req.query.Digits;

  console.log(`Language input received - UUID: ${callUuid}, Selection: ${digits}`);

  // Validate language selection
  if (digits !== '1' && digits !== '2') {
    console.log(`Invalid language selection for UUID: ${callUuid}. Digits: ${digits}`);
    const callbackUrl = config.server.callbackBaseUrl;
    const xmlResponse = generateInvalidInputRetry(callbackUrl, 'language');
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
    return;
  }

  // Store language selection in call state
  callStateManager.setLanguage(callUuid, digits);
  console.log(`Language set to ${digits === '1' ? 'English' : 'Spanish'} for UUID: ${callUuid}`);

  // Generate action menu in selected language
  const callbackUrl = config.server.callbackBaseUrl;
  const xmlResponse = generateActionMenu(callbackUrl, digits);
  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

/**
 * POST /webhook/action-input
 * Called when caller selects action (1=Audio, 2=Transfer)
 * Routes to audio playback or call transfer
 */
router.post('/action-input', (req, res) => {
  const callUuid = req.body.CallUUID || req.query.CallUUID;
  const digits = req.body.Digits || req.query.Digits;

  console.log(`Action input received - UUID: ${callUuid}, Selection: ${digits}`);

  const state = callStateManager.getCallState(callUuid);
  if (!state) {
    console.warn(`Call state not found for UUID: ${callUuid}`);
    res.set('Content-Type', 'application/xml');
    res.send('<Response><Hangup /></Response>');
    return;
  }

  const language = state.selectedLanguage;

  // Validate action selection
  if (digits !== '1' && digits !== '2') {
    console.log(`Invalid action selection for UUID: ${callUuid}. Digits: ${digits}`);
    const callbackUrl = config.server.callbackBaseUrl;
    const xmlResponse = generateInvalidInputRetry(callbackUrl, 'action');
    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);
    return;
  }

  let xmlResponse;

  if (digits === '1') {
    // Audio playback
    console.log(`Playing audio for UUID: ${callUuid}`);
    xmlResponse = generateAudioPlayback(config.ivr.audioUrl, language);
  } else {
    // Call transfer to associate
    console.log(`Transferring call for UUID: ${callUuid} to associate`);
    xmlResponse = generateCallTransfer(language);
  }

  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

/**
 * POST /webhook/hangup
 * Called when call ends (optional - for logging/cleanup)
 */
router.post('/hangup', (req, res) => {
  const callUuid = req.body.CallUUID || req.query.CallUUID;
  const callStatus = req.body.CallStatus || req.query.CallStatus;

  console.log(`Call hangup - UUID: ${callUuid}, Status: ${callStatus}`);

  // Clean up call state
  callStateManager.clearCallState(callUuid);

  res.status(200).json({ success: true });
});

module.exports = router;
