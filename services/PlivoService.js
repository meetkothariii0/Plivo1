const ApiWrapper = require('../apiWrapper');
const config = require('../config');
const axios = require('axios');

/**
 * PlivoService extends ApiWrapper with Plivo-specific API calls
 * Handles outbound calls, call management, and API interactions
 */
class PlivoService extends ApiWrapper {
  constructor() {
    // Initialize with Plivo API base URL and Basic Auth header
    const basicAuth = Buffer.from(
      `${config.plivo.authId}:${config.plivo.authToken}`
    ).toString('base64');

    super(config.plivo.apiBaseUrl, {
      Authorization: `Basic ${basicAuth}`,
    });
  }

  /**
   * Make an outbound call via Plivo API
   * @param {string} toNumber - Destination phone number (E.164 format)
   * @param {string} answerUrl - Webhook URL to fetch IVR XML when call is answered
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with request_uuid
   */
  async makeOutboundCall(toNumber, answerUrl, options = {}) {
    try {
      const payload = {
        to: toNumber,
        from: config.plivo.phoneNumber,
        answer_url: answerUrl,
        answer_method: 'POST',
        ring_timeout: 30,
        ...options,
      };

      console.log('Making outbound call to:', toNumber);
      console.log('Answer URL:', answerUrl);

      const response = await this.post(
        `/Account/${config.plivo.authId}/Call/`,
        payload
      );

      console.log('Outbound call initiated. UUID:', response.request_uuid);
      return response;
    } catch (error) {
      console.error('Error making outbound call:', error.message);
      throw error;
    }
  }

  /**
   * Get call details from Plivo
   * @param {string} callUuid - Call UUID
   * @returns {Promise<Object>} Call details
   */
  async getCallDetails(callUuid) {
    try {
      const response = await this.get(
        `/Account/${config.plivo.authId}/Call/${callUuid}/`
      );
      return response;
    } catch (error) {
      console.error('Error fetching call details:', error.message);
      throw error;
    }
  }

  /**
   * Hangup a call in progress
   * @param {string} callUuid - Call UUID
   * @returns {Promise<Object>} Response from Plivo
   */
  async hangupCall(callUuid) {
    try {
      const response = await this.delete(
        `/Account/${config.plivo.authId}/Call/${callUuid}/`
      );
      console.log('Call hangup initiated for UUID:', callUuid);
      return response;
    } catch (error) {
      console.error('Error hanging up call:', error.message);
      throw error;
    }
  }

  /**
   * Send DTMF digits to an active call
   * @param {string} callUuid - Call UUID
   * @param {string} digits - DTMF digits to send
   * @returns {Promise<Object>} Response from Plivo
   */
  async sendDtmf(callUuid, digits) {
    try {
      const response = await this.post(
        `/Account/${config.plivo.authId}/Call/${callUuid}/DTMF/`,
        { digits }
      );
      console.log('DTMF sent to call:', callUuid, 'Digits:', digits);
      return response;
    } catch (error) {
      console.error('Error sending DTMF:', error.message);
      throw error;
    }
  }

  /**
   * List all calls
   * @param {Object} options - Query parameters (limit, offset, etc.)
   * @returns {Promise<Object>} List of calls
   */
  async listCalls(options = {}) {
    try {
      const response = await this.get(
        `/Account/${config.plivo.authId}/Call/`,
        { params: options }
      );
      return response;
    } catch (error) {
      console.error('Error listing calls:', error.message);
      throw error;
    }
  }
}

module.exports = PlivoService;
