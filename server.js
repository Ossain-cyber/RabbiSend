const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const OTP_SECRET = process.env.OTP_SECRET || 'rabbi-send-secret-key-2024';
const OTP_EXPIRY_MINUTES = 5;
const SESSION_EXPIRY_HOURS = 1;

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Valid email required' });
        }
        
        const currentWindow = Math.floor(Date.now() / (OTP_EXPIRY_MINUTES * 60 * 1000));
        const hmac = crypto.createHmac('sha256', OTP_SECRET);
        hmac.update(email + currentWindow);
        const hash = hmac.digest('hex');
        const otpCode = (parseInt(hash.substring(0, 6), 16) % 1000000).toString().padStart(6, '0');
        
        await transporter.sendMail({
            from: `"Rabbi Send" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Rabbi Send Verification Code',
            html: `
                <div style="font-family: system-ui; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #fef3c7; border-radius: 16px; background: white;">
                    <div style="text-align: center;">
                        <div style="display: inline-block; background: #f5f5dc; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #8b5a2b;">R</div>
                        <h2 style="margin: 16px 0 8px; color: #8b5a2b;">Rabbi Send</h2>
                    </div>
                    <div style="background: #fffef7; padding: 24px; text-align: center; border-radius: 12px; border: 1px solid #fef3c7;">
                        <p style="color: #334155;">Your verification code is:</p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #b87333;">${otpCode}</div>
                        <p style="color: #64748b; font-size: 14px;">Valid for ${OTP_EXPIRY_MINUTES} minutes</p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">For support: rabbi111@duck.com</p>
                </div>
            `
        });
        
        res.json({ success: true, expiry: Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send code' });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const currentWindow = Math.floor(Date.now() / (OTP_EXPIRY_MINUTES * 60 * 1000));
        
        const hmacCurrent = crypto.createHmac('sha256', OTP_SECRET);
        hmacCurrent.update(email + currentWindow);
        const expectedCurrent = (parseInt(hmacCurrent.digest('hex').substring(0, 6), 16) % 1000000).toString().padStart(6, '0');
        
        const hmacPrev = crypto.createHmac('sha256', OTP_SECRET);
        hmacPrev.update(email + (currentWindow - 1));
        const expectedPrev = (parseInt(hmacPrev.digest('hex').substring(0, 6), 16) % 1000000).toString().padStart(6, '0');
        
        if (otp !== expectedCurrent && otp !== expectedPrev) {
            return res.status(400).json({ error: 'Invalid code' });
        }
        
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        
        res.json({ success: true, sessionToken, expiry: sessionExpiry, email });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rabbi Send running at http://localhost:${PORT}`);
});
