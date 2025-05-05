import { Router } from "express";
import { createCheckoutSession, stripeWebhook, getDonationDetailsbyId, getAllDonations } from '../controllers/donationController';
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router();

// Route to create a Stripe Checkout session for donation
Route.post('/create-checkout-session', authenticate, createCheckoutSession);

// Stripe webhook to handle payment success or failure (authentication removed)
Route.post('/webhook', stripeWebhook); 

// Route to get donation details by donationId
Route.get('/getDonationDetail/:donationId', authenticate, getDonationDetailsbyId);

// Route to get all completed donations (only accessible by admins)
Route.get('/getAllDonation', authenticate, authorizeRoles("admin"), getAllDonations);

export default Route;
