// Basic API wrapper using fetch
// This wrapper centralizes HTTP requests and default headers.

class ApiWrapper {
  constructor(baseUrl, defaultHeaders = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  async request(method, endpoint, data = null, headers = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    const options = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    if (data !== null) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(`API error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.response = body;
      throw error;
    }

    return body;
  }

  get(endpoint, headers = {}) {
    return this.request('GET', endpoint, null, headers);
  }

  post(endpoint, data, headers = {}) {
    return this.request('POST', endpoint, data, headers);
  }

  put(endpoint, data, headers = {}) {
    return this.request('PUT', endpoint, data, headers);
  }

  delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

// Example usage:
// const api = new ApiWrapper('https://api.example.com', { Authorization: 'Bearer token' });
// const items = await api.get('/items');
// const created = await api.post('/items', { name: 'New item' });

module.exports = ApiWrapper;
