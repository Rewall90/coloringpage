import { Resend } from 'resend';
import { render } from 'react-email';
import { ContactFormEmail } from '../_templates/contact-form.js';
import { WelcomeNewsletterEmail } from '../_templates/welcome-newsletter.js';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Common CORS headers
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle preflight requests
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    return res.status(200).end();
  }
  return false;
}

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
export async function generateContactEmailHTML(name, email, subject, message) {
  return await render(ContactFormEmail({ name, email, subject, message }));
}

export async function generateWelcomeEmailHTML() {
  return await render(WelcomeNewsletterEmail());
}