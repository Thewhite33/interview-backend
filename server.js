const express = require('express');
const nodemailer = require('nodemailer');
const { generateInterviewEmail } = require('./emailTemplate');
const db = require('./firebase');
const dotenv = require('dotenv')

dotenv.config()

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(require('cors')());

// Setup email transporter using Nodemailer (use your SMTP service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any other service like SendGrid or Mailgun
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail or other service
        pass: process.env.GMAIL_PASS,
    },
});

// Generate interview email
app.post('/send-email', async (req, res) => {
    const { candidateName, candidateEmail, slots } = req.body;
    const baseUrl = 'http://localhost:3001';

    const htmlContent = generateInterviewEmail(candidateName, candidateEmail, slots, baseUrl);

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: candidateEmail,
        subject: 'Interview Schedule',
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending email');
    }
});

// Accept slot and save to Firebase
app.post('/accept-slot', async (req, res) => {
    const { email, slot } = req.body;

    if (!email || !slot) return res.status(400).json({ message: 'Missing data' });

    try {
        await db.collection('interviews').doc(email).set({ status: 'Accepted', slot });
        res.status(200).json({ message: 'Slot accepted and saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving slot' });
    }
});


// Handle candidate declining and redirecting to frontend
app.get('/decline', async (req, res) => {
    const { email } = req.query;

    if (!email) return res.status(400).send("Missing email");

    // Save "declined" response to Firebase
    await db.collection('interviews').doc(email).set({ status: 'Declined', customSlot: null });

    // Redirect to frontend to select custom slot
    res.redirect(`http://localhost:3001/select-slot?email=${encodeURIComponent(email)}`);
});

// Handle custom slot selection by the candidate
app.post('/custom-slot', async (req, res) => {
    const { email, customSlot } = req.body;

    if (!email || !customSlot) return res.status(400).json({ message: 'Missing data' });

    // Save custom time slot to Firebase
    await db.collection('interviews').doc(email).set({ status: 'Custom Slot Selected', customSlot });

    res.json({ message: 'Custom time slot saved successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
