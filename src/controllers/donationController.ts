import { Request, Response } from 'express';  
import Stripe from 'stripe';
import Donation from '../models/Donation';
import User from '../models/user';

export interface AuthRequest extends Request {
  id: string; 
}

declare global {
  namespace Express {
    interface Request {
      id: string;  
    }
  }
}

export interface AuthRequest extends Request {
  user?: any; 
}

// Initialize Stripe (Ensure to add your actual secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export const createCheckoutSession = (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id; 

  if (!userId) {
    res.status(400).json({ message: 'User ID is required but not found in request' });
    return Promise.resolve();
  }

  const { donationAmount, isAnonymous, donationType, message } = req.body;

  if (!donationAmount || donationAmount <= 0) {
    res.status(400).json({ message: 'Invalid donation amount!' });
    return Promise.resolve();
  }

  const newDonation = new Donation({
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


// Stripe webhook to handle payment success or failure
export const stripeWebhook = (req: Request, res: Response): Promise<void> => {
  let event;

  try {
    const payloadString = JSON.stringify(req.body, null, 2);
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    event = stripe.webhooks.constructEvent(payloadString, header, secret);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Webhook error:", error.message);
      if (!res.headersSent) res.status(400).send(`Webhook error: ${error.message}`);
    } else {
      console.error("Unknown error occurred");
      if (!res.headersSent) res.status(400).send("Webhook error: Unknown error");
    }
    return Promise.resolve(); 
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    Donation.findOne({ paymentId: session.id })
      .then((donation) => {
        if (!donation) {
          console.error(" Donation not found for paymentId:", session.id);
          if (!res.headersSent) res.status(404).json({ message: "Donation not found" });
          return;
        }

        if (session.amount_total) {
          donation.amount = session.amount_total / 100; // Convert from cents to amount
        }
        donation.status = "completed";

        return donation.save().then(() => {
          return User.findByIdAndUpdate(
            donation.userId,
            { $addToSet: { donationHistory: donation._id } },
            { new: true }
          );
        });
      })
      .then(() => {
        if (!res.headersSent) res.status(200).send("✅ Donation completed successfully");
      })
      .catch((error) => {
        console.error(" Error handling event:", error);
        if (!res.headersSent) res.status(500).json({ message: "Internal Server Error" });
      });
  }

  if (!res.headersSent) res.status(200).send();
  return Promise.resolve(); 
};


// Route to get donation details by donationId
export const getDonationDetailsbyId = (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id; 

  if (!userId) {
    res.status(400).json({ message: 'User ID is required but not found in the request' });
    return Promise.resolve(); 
  }

  // Find donations made by the authenticated user only
  return Donation.find({ userId })
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


// Route to get all completed donations
export const getAllDonations = (_: Request, res: Response): Promise<void> => {
  return Donation.find({ status: { $regex: /^completed$/i } }) 
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
