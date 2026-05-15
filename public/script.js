// Form submission handler
document.getElementById('callForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const responseSection = document.getElementById('responseSection');
    const responseContent = document.getElementById('responseContent');

    // Validate phone number
    if (!phoneNumber) {
        showResponse('Error: Phone number is required', 'error');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = '📞 Calling...';
    responseSection.classList.remove('hidden');
    responseSection.classList.add('response-loading');
    responseContent.innerHTML = '<p>Initiating outbound call...</p>';

    try {
        const response = await fetch('/api/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showResponse(
                `<strong style="color: #27ae60;">✓ Call Initiated Successfully</strong><br>
                <strong>Request UUID:</strong> ${data.request_uuid}<br>
                <strong>API ID:</strong> ${data.api_id}<br>
                <strong>Message:</strong> ${data.message}<br><br>
                <em>Your phone should ring shortly. Answer to start the IVR flow.</em>`,
                'success'
            );
        } else {
            showResponse(
                `<strong style="color: #e74c3c;">✗ Call Failed</strong><br>
                <strong>Error:</strong> ${data.error}<br>
                <strong>Details:</strong> ${data.details || 'No additional details'}`,
                'error'
            );
        }
    } catch (error) {
        console.error('Error:', error);
        showResponse(
            `<strong style="color: #e74c3c;">✗ Network Error</strong><br>
            <strong>Error:</strong> ${error.message}<br>
            <em>Make sure the server is running and ngrok tunnel is active.</em>`,
            'error'
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Make Call';
    }
});

// Clear button handler
document.getElementById('clearBtn').addEventListener('click', () => {
    const responseSection = document.getElementById('responseSection');
    responseSection.classList.add('hidden');
    document.getElementById('phoneNumber').value = '';
    document.getElementById('phoneNumber').focus();
});

// Display response helper
function showResponse(message, type) {
    const responseSection = document.getElementById('responseSection');
    const responseContent = document.getElementById('responseContent');

    responseSection.classList.remove('hidden', 'response-loading', 'response-success', 'response-error');
    
    if (type === 'success') {
        responseSection.classList.add('response-success');
    } else if (type === 'error') {
        responseSection.classList.add('response-error');
    }

    responseContent.innerHTML = message;
}

// Focus on phone number input on load
window.addEventListener('load', () => {
    document.getElementById('phoneNumber').focus();
});
