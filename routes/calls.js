const express = require('express');
const router = express.Router();
const config = require('../config');
const PlivoService = require('../services/PlivoService');

const plivoService = new PlivoService();

/**
 * POST /api/make-call
 * Triggers an outbound call to the provided phone number
 * Body: { phone_number: "+1234567890", language_preference: "1" (optional) }
 */
router.post('/make-call', async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate phone number
    if (!phone_number) {
      return res.status(400).json({
        error: 'Missing phone_number in request body',
      });
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phone_number)) {
      return res.status(400).json({
        error: 'Invalid phone number format. Use E.164 format (e.g., +14157654321)',
      });
    }

    console.log(`API request to make call to: ${phone_number}`);

    // Build callback URL for answer endpoint
    const answerUrl = `${config.server.callbackBaseUrl}/webhook/answer`;

    // Make outbound call via Plivo
    const response = await plivoService.makeOutboundCall(phone_number, answerUrl);

    console.log('Outbound call successfully initiated');

    res.status(200).json({
      success: true,
      request_uuid: response.request_uuid,
      message: 'Outbound call initiated. Please answer your phone.',
      api_id: response.api_id,
    });
  } catch (error) {
    console.error('Error in make-call endpoint:', error.message);
    res.status(500).json({
      error: 'Failed to initiate call',
      details: error.message,
    });
  }
});

/**
 * GET /api/call-status/:callUuid
 * Get status of a specific call
 */
router.get('/call-status/:callUuid', async (req, res) => {
  try {
    const { callUuid } = req.params;

    if (!callUuid) {
      return res.status(400).json({
        error: 'Missing callUuid parameter',
      });
    }

    const callDetails = await plivoService.getCallDetails(callUuid);

    res.status(200).json({
      success: true,
      call_details: callDetails,
    });
  } catch (error) {
    console.error('Error fetching call status:', error.message);
    res.status(500).json({
      error: 'Failed to fetch call status',
      details: error.message,
    });
  }
});

/**
 * POST /api/hangup-call/:callUuid
 * Hangup a specific call
 */
router.post('/hangup-call/:callUuid', async (req, res) => {
  try {
    const { callUuid } = req.params;

    if (!callUuid) {
      return res.status(400).json({
        error: 'Missing callUuid parameter',
      });
    }

    await plivoService.hangupCall(callUuid);

    res.status(200).json({
      success: true,
      message: 'Call hangup initiated',
    });
  } catch (error) {
    console.error('Error hanging up call:', error.message);
    res.status(500).json({
      error: 'Failed to hangup call',
      details: error.message,
    });
  }
});

module.exports = router;
