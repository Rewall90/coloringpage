import { 
  setCORSHeaders, 
  handlePreflight, 
  isValidEmail, 
  sendEmail, 
  addToAudience, 
  generateWelcomeEmailHTML 
} from './_utils/resend.js';

export default async function handler(req, res) {
  // Handle preflight requests
  if (handlePreflight(req, res)) return;
  
  // Set CORS headers
  setCORSHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ 
      error: 'Email is required'
    });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (!audienceId) {
      console.error('RESEND_AUDIENCE_ID environment variable is not set');
      return res.status(500).json({ 
        error: 'Newsletter service is not properly configured' 
      });
    }

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
    console.log('Newsletter subscription:', {
      email,
      contactId: contactResult.data?.id,
      emailId: emailResult.data?.id,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed! Check your email for confirmation.',
      contactId: contactResult.data?.id
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    // Handle specific Resend API errors
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ 
        error: 'This email is already subscribed to our newsletter.',
        code: 'ALREADY_SUBSCRIBED'
      });
    }

    return res.status(500).json({ 
      error: 'Failed to subscribe. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}