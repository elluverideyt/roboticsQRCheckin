// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Initialize the app and middleware
const app = express();
app.use(bodyParser.json());

// Hovercode API setup
const HOVERCODE_API_BASE = 'https://hovercode.com/api/v2';
const HOVERCODE_API_TOKEN = '6f44a4bee0205487e1864ad071fe17b1d82cd64d'; // Replace with your actual API token
const HOVERCODE_WORKSPACE_ID = 'eb4cd226-0d9b-425d-831c-feacb779e441'; // Replace with your actual workspace ID

// Update the root route to fetch the QR code dynamically from Hovercode
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${HOVERCODE_API_BASE}/workspace/${HOVERCODE_WORKSPACE_ID}/hovercodes/`, {
            headers: {
                Authorization: `Token ${HOVERCODE_API_TOKEN}`
            }
        });

        const qrCode = response.data.results[0]; // Assuming the first QR code is the one to display
        const qrCodeImage = `<img src="${qrCode.png}" alt="QR Code">`;

        res.send(`
            <h1>Welcome to the Robotics Team Check-In/Out Service</h1>
            <p>Scan the QR code below to check in or out:</p>
            ${qrCodeImage}
        `);
    } catch (error) {
        res.status(500).send('<h1>Error fetching QR code</h1><p>Please try again later.</p>');
    }
});

// Update the admin page form to send data in JSON format
app.get('/admin', (req, res) => {
    res.send(`
        <h1>Admin Page</h1>
        <form action="/admin/qr" method="POST" onsubmit="submitForm(event)">
            <label for="newLink">New Link for QR Code:</label>
            <input type="text" id="newLink" name="newLink" required>
            <button type="submit">Regenerate QR Code</button>
        </form>
        <script>
            async function submitForm(event) {
                event.preventDefault();
                const newLink = document.getElementById('newLink').value;
                const response = await fetch('/admin/qr', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newLink })
                });
                const result = await response.json();
                alert(result.message || result.error);
            }
        </script>
    `);
});

// Route for check-in/out functionality
app.post('/check', async (req, res) => {
    const { userId, action } = req.body; // Expecting userId and action (check-in or check-out)

    if (!userId || !action) {
        return res.status(400).json({ error: 'Missing userId or action' });
    }

    // Example logic for check-in/out
    if (action === 'check-in') {
        // Perform check-in logic here
        return res.json({ message: `User ${userId} checked in successfully.` });
    } else if (action === 'check-out') {
        // Perform check-out logic here
        return res.json({ message: `User ${userId} checked out successfully.` });
    } else {
        return res.status(400).json({ error: 'Invalid action' });
    }
});

// Update the admin route to regenerate the QR code using Hovercode
app.post('/admin/qr', async (req, res) => {
    const { newLink } = req.body; // Expecting a new link to update the QR code

    if (!newLink) {
        return res.status(400).json({ error: 'Missing newLink' });
    }

    try {
        const response = await axios.post(
            `${HOVERCODE_API_BASE}/hovercode/create/`,
            {
                qr_data: newLink,
                qr_type: 'Link',
                generate_png: true,
                workspace_id: HOVERCODE_WORKSPACE_ID
            },
            {
                headers: {
                    Authorization: `Token ${HOVERCODE_API_TOKEN}`
                }
            }
        );

        return res.json({ message: 'QR code updated successfully.', qrCode: response.data });
    } catch (error) {
        console.error('Error updating QR code:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to update QR code', details: error.response?.data || error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});