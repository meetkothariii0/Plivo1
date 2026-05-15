const config = require('../config');

// In-memory call state storage
// Maps callUuid -> { otpAttempts, selectedLanguage, createdAt }
const callState = new Map();

// Clean up old call states (after 1 hour)
const CALL_STATE_TTL = 60 * 60 * 1000; // 1 hour

const getCallState = (callUuid) => {
  const state = callState.get(callUuid);
  
  if (!state) {
    return null;
  }

  // Check if state has expired
  if (Date.now() - state.createdAt > CALL_STATE_TTL) {
    callState.delete(callUuid);
    return null;
  }

  return state;
};

const initializeCallState = (callUuid) => {
  const state = {
    callUuid,
    otpAttempts: 0,
    selectedLanguage: null,
    createdAt: Date.now(),
  };
  callState.set(callUuid, state);
  return state;
};

const updateCallState = (callUuid, updates) => {
  const state = getCallState(callUuid) || initializeCallState(callUuid);
  const updated = { ...state, ...updates };
  callState.set(callUuid, updated);
  return updated;
};

const incrementOtpAttempts = (callUuid) => {
  const state = getCallState(callUuid) || initializeCallState(callUuid);
  const updated = state.otpAttempts + 1;
  return updateCallState(callUuid, { otpAttempts: updated });
};

const setLanguage = (callUuid, language) => {
  return updateCallState(callUuid, { selectedLanguage: language });
};

const clearCallState = (callUuid) => {
  callState.delete(callUuid);
};

module.exports = {
  getCallState,
  initializeCallState,
  updateCallState,
  incrementOtpAttempts,
  setLanguage,
  clearCallState,
};
