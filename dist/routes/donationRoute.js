"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donationController_1 = require("../controllers/donationController");
const Middleware_1 = require("../lib/Utils/Middleware");
const Route = (0, express_1.Router)();
// Route to create a Stripe Checkout session for donation
Route.post('/create-checkout-session', Middleware_1.authenticate, donationController_1.createCheckoutSession);
// Stripe webhook to handle payment success or failure
Route.post('/webhook', Middleware_1.authenticate, donationController_1.stripeWebhook);
// Route to get donation details by donationId
Route.get('/getDonationDetail/:donationId', Middleware_1.authenticate, donationController_1.getDonationDetailsbyId);
// Route to get all completed donations
Route.get('/getAllDonation', Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)("admin"), donationController_1.getAllDonations);
exports.default = Route;
