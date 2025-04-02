"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDonations = exports.getDonationDetailsbyId = exports.stripeWebhook = exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const Donation_1 = __importDefault(require("../models/Donation"));
const user_1 = __importDefault(require("../models/user"));
// Initialize Stripe (Ensure to add your actual secret key)
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});
const createCheckoutSession = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required but not found in request' });
        return Promise.resolve();
    }
    const { donationAmount, isAnonymous, donationType, message } = req.body;
    if (!donationAmount || donationAmount <= 0) {
        res.status(400).json({ message: 'Invalid donation amount!' });
        return Promise.resolve();
    }
    const newDonation = new Donation_1.default({
        userId,
        amount: donationAmount,
        status: 'pending',
        isAnonymous: isAnonymous || false,
        donationType: donationType || 'one-time',
        message: message || '',
        paymentId: '',
    });
    return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd', //  US Dollar
                    product_data: { name: 'Donation', description: 'Donation for charity' },
                    unit_amount: donationAmount * 100, // Convert to cents
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/donations?status=success`,
        cancel_url: `${process.env.FRONTEND_URL}/donations?status=failed`,
        metadata: { userId: userId.toString() },
    })
        .then((session) => {
        if (!session.url) {
            console.error('Error: No session URL');
            res.status(400).json({ success: false, message: 'Error while creating session' });
            return Promise.resolve();
        }
        newDonation.paymentId = session.id; // Set the session ID as the paymentId
        return newDonation.save()
            .then(() => {
            // Return the Stripe session ID and the userId in the response
            res.status(200).json({
                success: true,
                url: session.url,
                userId: userId, // Include userId
                sessionId: session.id, // Include Stripe session ID (for webhook)
                donationAmount: donationAmount
            });
            return Promise.resolve();
        })
            .catch((error) => {
            console.error('Error saving donation record:', error);
            res.status(500).json({ success: false, message: 'Error saving donation record.' });
            return Promise.resolve();
        });
    })
        .catch((error) => {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the donation.' });
        return Promise.resolve();
    });
};
exports.createCheckoutSession = createCheckoutSession;
// Stripe webhook to handle payment success or failure
const stripeWebhook = (req, res) => {
    let event;
    try {
        const payloadString = JSON.stringify(req.body, null, 2);
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret,
        });
        event = stripe.webhooks.constructEvent(payloadString, header, secret);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Webhook error:", error.message);
            if (!res.headersSent)
                res.status(400).send(`Webhook error: ${error.message}`);
        }
        else {
            console.error("Unknown error occurred");
            if (!res.headersSent)
                res.status(400).send("Webhook error: Unknown error");
        }
        return Promise.resolve();
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        Donation_1.default.findOne({ paymentId: session.id })
            .then((donation) => {
            if (!donation) {
                console.error(" Donation not found for paymentId:", session.id);
                if (!res.headersSent)
                    res.status(404).json({ message: "Donation not found" });
                return;
            }
            if (session.amount_total) {
                donation.amount = session.amount_total / 100; // Convert from cents to amount
            }
            donation.status = "completed";
            return donation.save().then(() => {
                return user_1.default.findByIdAndUpdate(donation.userId, { $addToSet: { donationHistory: donation._id } }, { new: true });
            });
        })
            .then(() => {
            if (!res.headersSent)
                res.status(200).send("✅ Donation completed successfully");
        })
            .catch((error) => {
            console.error(" Error handling event:", error);
            if (!res.headersSent)
                res.status(500).json({ message: "Internal Server Error" });
        });
    }
    if (!res.headersSent)
        res.status(200).send();
    return Promise.resolve();
};
exports.stripeWebhook = stripeWebhook;
// Route to get donation details by donationId
const getDonationDetailsbyId = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required but not found in the request' });
        return Promise.resolve();
    }
    // Find donations made by the authenticated user only
    return Donation_1.default.find({ userId })
        .populate({ path: 'userId', select: '-password' })
        .then((donations) => {
        if (!donations || donations.length === 0) {
            res.status(404).json({ message: 'No donations found for this user!' });
            return Promise.resolve();
        }
        // Send the donations that belong to the authenticated user
        res.status(200).json({ donations });
        return Promise.resolve();
    })
        .catch((error) => {
        res.status(500).json({ message: 'Error retrieving donations' });
        return Promise.resolve();
    });
};
exports.getDonationDetailsbyId = getDonationDetailsbyId;
// Route to get all completed donations
const getAllDonations = (_, res) => {
    return Donation_1.default.find({ status: { $regex: /^completed$/i } })
        .populate({ path: 'userId', select: '-password' })
        .then((donations) => {
        if (!donations.length) {
            res.status(404).json({ message: 'No donations found' });
            return Promise.resolve();
        }
        res.status(200).json({ donations });
        return Promise.resolve();
    })
        .catch((error) => {
        console.error('Error retrieving donations:', error);
        res.status(500).json({ message: 'Error retrieving donations' });
        return Promise.resolve();
    });
};
exports.getAllDonations = getAllDonations;
