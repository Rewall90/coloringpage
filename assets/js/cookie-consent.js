// Cookie Consent Manager
class CookieConsent {
  constructor() {
    this.storageKey = 'coloringvault-cookie-consent';
    this.expirationDays = 365;
    this.banner = null;
    this.settingsButton = null;
    this.modal = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.banner = document.getElementById('cookie-consent-banner');
    this.settingsButton = document.getElementById('cookie-settings-button');
    this.modal = document.getElementById('cookie-preferences-modal');
    
    if (!this.banner) return;

    // Check if user has already made a choice
    if (!this.hasValidConsent()) {
      this.showBanner();
    } else {
      // Show settings button if user has given consent
      this.showSettingsButton();
    }

    // Bind event listeners
    this.bindEvents();
    this.bindModalEvents();

    // Initialize Google Analytics consent mode
    this.initializeGoogleConsent();
  }

  bindEvents() {
    const acceptBtn = document.getElementById('cookie-accept-all');
    const customizeBtn = document.getElementById('cookie-customize');
    const rejectBtn = document.getElementById('cookie-reject');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.acceptAll());
    }

    if (customizeBtn) {
      customizeBtn.addEventListener('click', () => this.customize());
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => this.rejectAll());
    }

    // Settings button event
    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', () => this.openSettings());
    }
  }

  showBanner() {
    if (this.banner) {
      this.banner.style.display = 'block';
      // Animate in
      setTimeout(() => {
        this.banner.classList.add('cookie-banner-visible');
      }, 100);
    }
  }

  hideBanner() {
    if (this.banner) {
      this.banner.classList.add('cookie-banner-hiding');
      setTimeout(() => {
        this.banner.style.display = 'none';
        this.banner.classList.remove('cookie-banner-visible', 'cookie-banner-hiding');
      }, 300);
    }
  }

  acceptAll() {
    const consent = {
      necessary: true,
      functional: true,
      analytics: true,
      performance: true,
      advertising: true,
      consentDate: new Date().toISOString(),
      expirationDate: this.getExpirationDate()
    };

    this.saveConsent(consent);
    this.hideBanner();
    this.showSettingsButton();
    
    // Update Google Analytics consent
    this.updateGoogleAnalytics(consent);
    console.log('Accepted all cookies');
  }

  customize() {
    // Hide banner and show modal
    this.hideBanner();
    this.showModal();
  }

  rejectAll() {
    const consent = {
      necessary: true,  // Always required
      functional: false,
      analytics: false,
      performance: false,
      advertising: false,
      consentDate: new Date().toISOString(),
      expirationDate: this.getExpirationDate()
    };

    this.saveConsent(consent);
    this.hideBanner();
    this.showSettingsButton();
    
    // Update Google Analytics consent
    this.updateGoogleAnalytics(consent);
    console.log('Rejected all cookies');
  }

  saveConsent(consent) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(consent));
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  }

  getConsent() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get cookie consent:', error);
      return null;
    }
  }

  hasValidConsent() {
    const consent = this.getConsent();
    if (!consent || !consent.expirationDate) {
      return false;
    }

    // Check if consent has expired
    const expirationDate = new Date(consent.expirationDate);
    const now = new Date();
    
    return now < expirationDate;
  }

  getExpirationDate() {
    const date = new Date();
    date.setDate(date.getDate() + this.expirationDays);
    return date.toISOString();
  }

  showSettingsButton() {
    if (this.settingsButton) {
      this.settingsButton.style.display = 'block';
      // Animate in
      setTimeout(() => {
        this.settingsButton.classList.add('cookie-settings-visible');
      }, 100);
    }
  }

  hideSettingsButton() {
    if (this.settingsButton) {
      this.settingsButton.classList.add('cookie-settings-hiding');
      setTimeout(() => {
        this.settingsButton.style.display = 'none';
        this.settingsButton.classList.remove('cookie-settings-visible', 'cookie-settings-hiding');
      }, 300);
    }
  }

  openSettings() {
    // Show preferences modal
    this.showModal();
  }

  bindModalEvents() {
    if (!this.modal) return;

    // Modal action buttons
    const modalAcceptAll = document.getElementById('cookie-modal-accept-all');
    const modalSave = document.getElementById('cookie-modal-save');
    const modalRejectAll = document.getElementById('cookie-modal-reject-all');
    const modalClose = document.getElementById('cookie-modal-close');
    const modalBackdrop = this.modal.querySelector('.cookie-modal-backdrop');

    // Show/hide details buttons
    const detailsButtons = document.querySelectorAll('.cookie-show-details');

    if (modalAcceptAll) {
      modalAcceptAll.addEventListener('click', () => this.modalAcceptAll());
    }

    if (modalSave) {
      modalSave.addEventListener('click', () => this.modalSavePreferences());
    }

    if (modalRejectAll) {
      modalRejectAll.addEventListener('click', () => this.modalRejectAll());
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => this.hideModal());
    }

    // Handle show/hide details
    detailsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleDetails(button);
      });
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        this.hideModal();
      }
    });
  }

  showModal() {
    if (!this.modal) return;

    // Load current preferences into toggles
    this.loadPreferencesToModal();
    
    // Show modal
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Animate in
    setTimeout(() => {
      this.modal.classList.add('cookie-modal-visible');
    }, 10);

    // Focus management
    const firstFocusable = this.modal.querySelector('button, input');
    if (firstFocusable) firstFocusable.focus();
  }

  hideModal() {
    if (!this.modal) return;

    this.modal.classList.add('cookie-modal-hiding');
    document.body.style.overflow = ''; // Restore scroll
    
    setTimeout(() => {
      this.modal.style.display = 'none';
      this.modal.classList.remove('cookie-modal-visible', 'cookie-modal-hiding');
    }, 300);
  }

  loadPreferencesToModal() {
    const consent = this.getConsent();
    const defaults = { functional: false, analytics: false, performance: false, advertising: false };
    const preferences = consent ? { ...defaults, ...consent } : defaults;

    // Set toggle states
    const toggles = {
      functional: document.getElementById('cookie-functional'),
      analytics: document.getElementById('cookie-analytics'),
      performance: document.getElementById('cookie-performance'),
      advertising: document.getElementById('cookie-advertising')
    };

    Object.keys(toggles).forEach(category => {
      if (toggles[category]) {
        toggles[category].checked = preferences[category] || false;
      }
    });
  }

  modalAcceptAll() {
    // Check all toggles
    const toggles = document.querySelectorAll('.cookie-toggle:not([disabled])');
    toggles.forEach(toggle => toggle.checked = true);
    
    // Save and close
    this.modalSavePreferences();
  }

  modalRejectAll() {
    // Uncheck all optional toggles
    const toggles = document.querySelectorAll('.cookie-toggle:not([disabled])');
    toggles.forEach(toggle => toggle.checked = false);
    
    // Save and close
    this.modalSavePreferences();
  }

  modalSavePreferences() {
    const consent = {
      necessary: true, // Always true
      functional: document.getElementById('cookie-functional')?.checked || false,
      analytics: document.getElementById('cookie-analytics')?.checked || false,
      performance: document.getElementById('cookie-performance')?.checked || false,
      advertising: document.getElementById('cookie-advertising')?.checked || false,
      consentDate: new Date().toISOString(),
      expirationDate: this.getExpirationDate()
    };

    this.saveConsent(consent);
    this.hideModal();
    this.showSettingsButton();
    
    // Update Google Analytics based on consent
    this.updateGoogleAnalytics(consent);
    console.log('Saved preferences:', consent);
  }

  toggleDetails(button) {
    if (!button) return;

    const targetId = button.dataset.target;
    const details = document.getElementById(targetId);
    const showText = button.querySelector('.show-text');
    const hideText = button.querySelector('.hide-text');
    const arrow = button.querySelector('.details-arrow');

    if (!details) return;

    // Check current state more reliably
    const isCurrentlyVisible = details.style.display === 'block' || 
                               (details.style.display === '' && details.offsetHeight > 0);
    
    if (isCurrentlyVisible) {
      // Hide details
      details.style.display = 'none';
      if (showText) showText.style.display = '';
      if (hideText) hideText.style.display = 'none';
      if (arrow) arrow.style.transform = '';
      button.setAttribute('aria-expanded', 'false');
    } else {
      // Show details
      details.style.display = 'block';
      if (showText) showText.style.display = 'none';
      if (hideText) hideText.style.display = '';
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      button.setAttribute('aria-expanded', 'true');
    }
  }

  // Google Analytics Consent Mode Integration
  initializeGoogleConsent() {
    // Initialize Google consent mode with default denied states
    if (typeof gtag === 'function') {
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'security_storage': 'granted', // Always granted for security
        'wait_for_update': 2000
      });
    }

    // Check if user already has valid consent and update accordingly
    if (this.hasValidConsent()) {
      const consent = this.getConsent();
      if (consent) {
        this.updateGoogleAnalytics(consent);
      }
    }
  }

  updateGoogleAnalytics(consent) {
    if (typeof gtag !== 'function') {
      console.warn('Google Analytics (gtag) not found. Consent preferences saved but GA not updated.');
      return;
    }

    // Update consent based on user choices
    const consentUpdate = {
      'security_storage': 'granted', // Always granted
      'functionality_storage': consent.functional ? 'granted' : 'denied',
      'analytics_storage': consent.analytics ? 'granted' : 'denied',
      'ad_storage': consent.advertising ? 'granted' : 'denied',
      'ad_user_data': consent.advertising ? 'granted' : 'denied',
      'ad_personalization': consent.advertising ? 'granted' : 'denied',
      'personalization_storage': consent.performance ? 'granted' : 'denied'
    };

    gtag('consent', 'update', consentUpdate);
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent, consentUpdate }
    }));

    console.log('Google Analytics consent updated:', consentUpdate);
  }
}

// Initialize cookie consent when script loads
new CookieConsent();