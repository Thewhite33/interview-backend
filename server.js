const express = require('express');
const nodemailer = require('nodemailer');
const { generateInterviewEmail } = require('./emailTemplate');
const db = require('./firebase');
const { format, parseISO } = require('date-fns');
const dotenv = require('dotenv')

dotenv.config()

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(require('cors')());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// Generate interview email
app.post('/send-email', async (req, res) => {
    const { candidateName, candidateEmail, slots, date } = req.body;
    const baseUrl = 'http://localhost:3001';

    const htmlContent = generateInterviewEmail(candidateName, candidateEmail, slots, baseUrl, date);

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
    const { email, slot, date } = req.body;

    if (!email || !slot || !date)
        return res.status(400).json({ message: 'Missing data' });

    try {
        // Format date to "Jul 17, 2025"
        const parsedDate = parseISO(date);
        const formattedDate = format(parsedDate, 'PP');

        await db.collection('interviews').doc(email).set({
            status: 'Accepted',
            slot: String(slot),
            date: formattedDate,
        });

        res.status(200).json({ message: 'Slot and date accepted and saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving slot and date' });
    }
});

// Handle candidate declining and redirecting to frontend
app.get('/decline', async (req, res) => {
    const { email } = req.query;

    if (!email) return res.status(400).send("Missing email");

    // Save "declined" response to Firebase
    await db.collection('interviews').doc(email).set({ status: 'Declined', customSlot: null });

    res.redirect(`http://localhost:3001/select-slot?email=${encodeURIComponent(email)}`);
});

// Handle custom slot selection by the candidate
app.post('/custom-slot', async (req, res) => {
    const { email, date, slot } = req.body;

    if (!email || !date || !slot)
        return res.status(400).json({ message: 'Missing data' });

    await db.collection('interviews').doc(email).set({
        status: 'Custom Slot Selected',
        date,
        slot,
    });

    res.json({ message: 'Custom date and time saved successfully' });
});


app.get('/all-interviews', async (req, res) => {
    try {
        const snapshot = await db.collection('interviews').get();
        const data = {};
        snapshot.forEach(doc => {
            data[doc.id] = doc.data();
        });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});