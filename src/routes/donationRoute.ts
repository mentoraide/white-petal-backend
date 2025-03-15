import { Router } from "express"
import {createCheckoutSession,stripeWebhook,getDonationDetailsbyId,getAllDonations} from '../controllers/donationController';
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router()

// Route to create a Stripe Checkout session for donation
Route.post('/create-checkout-session', authenticate, createCheckoutSession);

// Stripe webhook to handle payment success or failure
Route.post('/webhook', authenticate,stripeWebhook);

// Route to get donation details by donationId
Route.get('/getDonationDetail/:donationId',authenticate, getDonationDetailsbyId);

// Route to get all completed donations
Route.get('/getAllDonation',authenticate,authorizeRoles("admin"), getAllDonations);

export default Route
