// Form handling for contact and newsletter forms
document.addEventListener('DOMContentLoaded', function() {
  
  // Newsletter Form Handler
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  }

  // Contact Form Handler  
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Newsletter form submission
  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value.trim();
    const submitButton = document.getElementById('newsletter-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    const messageDiv = document.getElementById('newsletter-message');
    const successDiv = document.getElementById('newsletter-success');
    const errorDiv = document.getElementById('newsletter-error');
    const errorText = document.getElementById('newsletter-error-text');

    // Validate email
    if (!email || !isValidEmail(email)) {
      showMessage(messageDiv, errorDiv, errorText, 'Please enter a valid email address.');
      return;
    }

    // Show loading state
    setLoadingState(submitButton, buttonText, loadingSpinner, true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(messageDiv, successDiv);
        form.reset();
      } else {
        // Handle specific error cases
        let errorMessage = data.error || 'Failed to subscribe. Please try again.';
        if (data.code === 'ALREADY_SUBSCRIBED') {
          errorMessage = 'This email is already subscribed to our newsletter.';
        }
        showMessage(messageDiv, errorDiv, errorText, errorMessage);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showMessage(messageDiv, errorDiv, errorText, 'Network error. Please check your connection and try again.');
    } finally {
      setLoadingState(submitButton, buttonText, loadingSpinner, false);
    }
  }

  // Contact form submission
  async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      subject: 'Contact Form Message', // Default subject since field is not in form
      message: formData.get('message').trim()
    };

    const submitButton = document.getElementById('contact-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    const messageDiv = document.getElementById('contact-message-display');
    const successDiv = document.getElementById('contact-success');
    const errorDiv = document.getElementById('contact-error');
    const errorText = document.getElementById('contact-error-text');

    // Validate form data
    const validation = validateContactForm(data);
    if (!validation.isValid) {
      showMessage(messageDiv, errorDiv, errorText, validation.message);
      return;
    }

    // Show loading state
    setLoadingState(submitButton, buttonText, loadingSpinner, true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok) {
        showMessage(messageDiv, successDiv);
        form.reset();
      } else {
        const errorMessage = responseData.error || 'Failed to send message. Please try again.';
        showMessage(messageDiv, errorDiv, errorText, errorMessage);
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showMessage(messageDiv, errorDiv, errorText, 'Network error. Please check your connection and try again.');
    } finally {
      setLoadingState(submitButton, buttonText, loadingSpinner, false);
    }
  }

  // Utility functions
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateContactForm(data) {
    if (!data.name) {
      return { isValid: false, message: 'Please enter your name.' };
    }
    if (!data.email) {
      return { isValid: false, message: 'Please enter your email address.' };
    }
    if (!isValidEmail(data.email)) {
      return { isValid: false, message: 'Please enter a valid email address.' };
    }
    if (!data.message) {
      return { isValid: false, message: 'Please enter a message.' };
    }
    if (data.message.length < 10) {
      return { isValid: false, message: 'Message must be at least 10 characters long.' };
    }
    return { isValid: true };
  }

  function setLoadingState(button, textElement, spinner, isLoading) {
    if (isLoading) {
      button.disabled = true;
      textElement.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      button.disabled = false;
      textElement.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  function showMessage(messageDiv, targetDiv, errorTextElement = null, message = '') {
    // Hide all message divs first
    const allMessageDivs = messageDiv.querySelectorAll('div[id$="-success"], div[id$="-error"]');
    allMessageDivs.forEach(div => div.classList.add('hidden'));
    
    // Show the message container
    messageDiv.classList.remove('hidden');
    
    // Show the target div
    targetDiv.classList.remove('hidden');
    
    // Set error text if provided
    if (errorTextElement && message) {
      errorTextElement.textContent = message;
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add('hidden');
      allMessageDivs.forEach(div => div.classList.add('hidden'));
    }, 5000);
  }
});