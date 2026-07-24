import express from 'express';

const router = express.Router();
const API_BASE_URL = 'https://api.lessannoyingcrm.com/v2/';

/**
 * POST /api/lacrm
 * Proxy endpoint for Less Annoying CRM API requests
 */
router.post('/lacrm', async (req, res) => {
    try {
        // Read API key from environment
        const API_KEY = process.env.LACRM_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({
                error: 'LACRM_API_KEY is not set on the server',
            });
        }

        const { functionName, parameters } = req.body;

        if (!functionName) {
            return res.status(400).json({
                error: 'functionName is required',
            });
        }

        const payload = {
            Function: functionName,
            Parameters: parameters || {},
        };

        console.log('Sending request to LACRM:', {
            url: API_BASE_URL,
            payload,
        });

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorData;
            let errorText;

            try {
                errorText = await response.text();
                errorData = JSON.parse(errorText);
            } catch (parseErr) {
                errorData = { rawText: errorText };
            }

            console.error('❌ LACRM API Error:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                requestPayload: payload,
            });

            return res.status(response.status).json({
                error: errorData.message || response.statusText,
                details: errorData,
                request: payload,
                lacrm_status: response.status,
            });
        }

        const data = await response.json();
        console.log('✅ LACRM API Success:', {
            function: functionName,
            resultCount: data.Results ? data.Results.length : 0,
        });
        res.json(data);
    } catch (error) {
        console.error('LACRM API Proxy Error:', error.message);
        res.status(500).json({
            error: error.message,
        });
    }
});

export default router;
