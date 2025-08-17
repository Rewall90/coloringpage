import { 
  withApiMiddleware,
  successResponse,
  errorResponse,
  HTTP_STATUS,
  logApiCall
} from './_utils/api-middleware.js';
import { 
  sendEmail, 
  addToAudience, 
  generateWelcomeEmailHTML 
} from './_utils/resend.js';

async function newsletterHandler(req, res) {
  const { email } = req.body;

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    // Add contact to Resend audience
    const contactResult = await addToAudience(email, audienceId);

    // Send welcome email
    const welcomeEmailData = {
      from: process.env.RESEND_FROM_EMAIL || 'newsletter@mysite.com',
      to: email,
      subject: 'Welcome to Our Newsletter! 🎨',
      html: await generateWelcomeEmailHTML()
    };

    const emailResult = await sendEmail(welcomeEmailData);

    // Log successful subscription
    logApiCall('newsletter-subscribe', { email }, {
      contactId: contactResult.data?.id,
      emailId: emailResult.data?.id
    });

    return successResponse(res, {
      message: 'Successfully subscribed! Check your email for confirmation.',
      contactId: contactResult.data?.id
    });

  } catch (error) {
    logApiCall('newsletter-subscribe', { email }, null, error);
    
    // Handle specific Resend API errors
    if (error.message && error.message.includes('already exists')) {
      return errorResponse(res, HTTP_STATUS.CONFLICT, 
        'This email is already subscribed to our newsletter.', 
        null, 'ALREADY_SUBSCRIBED');
    }

    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 
      'Failed to subscribe. Please try again later.', error.message);
  }
}

// Export with middleware wrapper
export default withApiMiddleware(newsletterHandler, {
  allowedMethods: ['POST'],
  requireFields: ['email'],
  validateEmail: true,
  requiredEnvVars: ['RESEND_AUDIENCE_ID', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL']
});