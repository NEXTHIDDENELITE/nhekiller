const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// 🔒 আপনার সিক্রেট টেলিগ্রাম ডেটা (সার্ভারের ভেতরে একদম সুরক্ষিত)
const BOT_TOKEN = "8897882721:AAFd1HMzUXOxq5XAdh3VV1fFRHRZ3xqaeuY";
const CHAT_ID = "8135816344";

// টেলিগ্রামে ডাটা পাঠানোর সিকিউর ফাংশন
function telegramRequest(endpoint, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
}

// ১. নতুন রিকোয়েস্ট পাঠানোর রুট
app.post('/api/send-request', async (req, res) => {
    try {
        const { text, reply_markup } = req.body;
        const data = await telegramRequest('sendMessage', {
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML',
            reply_markup: reply_markup
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ২. এডমিনের রেসপন্স (YES/NO) চেক করার রুট
app.get('/api/check-response', async (req, res) => {
    try {
        https.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`, (telegramRes) => {
            let body = '';
            telegramRes.on('data', (chunk) => body += chunk);
            telegramRes.on('end', () => {
                res.json(JSON.parse(body));
            });
        }).on('error', (error) => {
            res.status(500).json({ ok: false, error: error.message });
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ৩. টেলিগ্রাম মেসেজ এডিট/আপডেট করার রুট
app.post('/api/edit-request', async (req, res) => {
    try {
        const { message_id, text } = req.body;
        const data = await telegramRequest('editMessageText', {
            chat_id: CHAT_ID,
            message_id: message_id,
            text: text,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [] }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NHE Secure Server running on port ${PORT}`));