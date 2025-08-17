// Newsletter form handling
document.addEventListener('DOMContentLoaded', function() {
  
  // Newsletter Form Handler
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
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
      showNewsletterMessage(errorDiv, null, 'Please enter a valid email address.');
      return;
    }

    // Show loading state
    setNewsletterLoadingState(true);

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
        showNewsletterMessage(successDiv);
        form.reset();
      } else {
        // Handle specific error cases
        let errorMessage = data.error || 'Failed to subscribe. Please try again.';
        if (data.code === 'ALREADY_SUBSCRIBED') {
          errorMessage = 'This email is already subscribed to our newsletter.';
        }
        showNewsletterMessage(errorDiv, null, errorMessage);
      }
    } catch (error) {
      formsLogger.error('Newsletter subscription error:', error);
      showNewsletterMessage(errorDiv, null, 'Network error. Please check your connection and try again.');
    } finally {
      setNewsletterLoadingState(false);
    }
  }


  // Newsletter-specific utility functions
  // NOTE: Keep this email validation regex in sync with api/_utils/api-middleware.js:48
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function setNewsletterLoadingState(isLoading) {
    const submitButton = document.getElementById('newsletter-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    
    if (isLoading) {
      submitButton.disabled = true;
      buttonText.classList.add('hidden');
      loadingSpinner.classList.remove('hidden');
    } else {
      submitButton.disabled = false;
      buttonText.classList.remove('hidden');
      loadingSpinner.classList.add('hidden');
    }
  }

  function showNewsletterMessage(targetDiv, errorText = null, message = '') {
    const messageDiv = document.getElementById('newsletter-message');
    const successDiv = document.getElementById('newsletter-success');
    const errorDiv = document.getElementById('newsletter-error');
    const errorTextElement = document.getElementById('newsletter-error-text');
    
    // Hide all message divs first
    successDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
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
      successDiv.classList.add('hidden');
      errorDiv.classList.add('hidden');
    }, 5000);
  }
});