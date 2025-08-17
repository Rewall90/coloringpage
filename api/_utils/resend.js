import { Resend } from 'resend';
import { render } from 'react-email';
import { WelcomeNewsletterEmail } from '../_templates/welcome-newsletter.js';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Send email via Resend
export async function sendEmail(emailData) {
  return await resend.emails.send(emailData);
}

// Add contact to audience
export async function addToAudience(email, audienceId) {
  return await resend.contacts.create({
    email: email,
    audienceId: audienceId
  });
}

// Generate React Email templates
export async function generateWelcomeEmailHTML() {
  return await render(WelcomeNewsletterEmail());
}