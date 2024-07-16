// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Mercado Pago credentials
const { MP_ACCESS_TOKEN } = process.env;

// Stripe credentials
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Generate Mercado Pago payment link
app.post('/create_payment', async (req, res) => {
    const { amount } = req.body;
    try {
        const response = await axios.post(
            'https://api.mercadopago.com/checkout/preferences',
            {
                items: [{ title: 'Payment', quantity: 1, currency_id: 'BRL', unit_price: parseFloat(amount) }],
                back_urls: {
                    success: 'http://localhost:3000/success',
                    failure: 'http://localhost:3000/failure',
                    pending: 'http://localhost:3000/pending'
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`
                }
            }
        );
        res.json({ init_point: response.data.init_point });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Stripe webhook for payment confirmation
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const event = req.body;
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`PaymentIntent was successful for amount: ${paymentIntent.amount}`);
            // Update front-end here
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
