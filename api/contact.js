import { 
  setCORSHeaders, 
  handlePreflight, 
  isValidEmail, 
  sendEmail, 
  generateContactEmailHTML 
} from './_utils/resend.js';

export default async function handler(req, res) {
  // Handle preflight requests
  if (handlePreflight(req, res)) return;
  
  // Set CORS headers
  setCORSHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      error: 'All fields are required',
      missing: {
        name: !name,
        email: !email,
        subject: !subject,
        message: !message
      }
    });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Send email to site owner
    const emailData = {
      from: process.env.RESEND_FROM_EMAIL || 'contact@mysite.com',
      to: process.env.RESEND_TO_EMAIL || 'admin@mysite.com',
      subject: `Contact Form: ${subject}`,
      html: await generateContactEmailHTML(name, email, subject, message),
      replyTo: email
    };

    const result = await sendEmail(emailData);

    // Log successful submission
    console.log('Contact form submission:', {
      id: result.data?.id,
      email,
      subject,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully!',
      id: result.data?.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    return res.status(500).json({ 
      error: 'Failed to send message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}