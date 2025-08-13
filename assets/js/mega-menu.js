/**
 * Mega Menu Hover Intent System
 * Provides reliable hover behavior with delay timers to prevent flickering
 */

class MegaMenuHoverIntent {
  constructor() {
    this.showTimer = null;
    this.hideTimer = null;
    this.showDelay = 0; // Show immediately
    this.hideDelay = 300; // Wait 300ms before hiding
    this.isMenuVisible = false;
    
    this.init();
  }

  init() {
    const megaMenuContainer = document.querySelector('.mega-menu-container');
    const megaMenuDropdown = document.querySelector('.mega-menu-dropdown');
    
    if (!megaMenuContainer || !megaMenuDropdown) {
      return; // No mega menu found
    }

    // Handle hover on trigger (Categories text)
    megaMenuContainer.addEventListener('mouseenter', () => {
      this.showMenu();
    });
    
    megaMenuContainer.addEventListener('mouseleave', () => {
      this.scheduleHideMenu();
    });

    // Handle hover on dropdown menu itself
    megaMenuDropdown.addEventListener('mouseenter', () => {
      this.showMenu();
    });
    
    megaMenuDropdown.addEventListener('mouseleave', () => {
      this.scheduleHideMenu();
    });

    // Handle keyboard navigation (accessibility)
    megaMenuContainer.addEventListener('focusin', () => {
      this.showMenu();
    });
    
    megaMenuContainer.addEventListener('focusout', (e) => {
      // Only hide if focus is moving outside the entire menu system
      if (!megaMenuContainer.contains(e.relatedTarget) && 
          !megaMenuDropdown.contains(e.relatedTarget)) {
        this.scheduleHideMenu();
      }
    });

    megaMenuDropdown.addEventListener('focusin', () => {
      this.showMenu();
    });
    
    megaMenuDropdown.addEventListener('focusout', (e) => {
      if (!megaMenuContainer.contains(e.relatedTarget) && 
          !megaMenuDropdown.contains(e.relatedTarget)) {
        this.scheduleHideMenu();
      }
    });
  }

  showMenu() {
    // Clear any pending hide timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    // If already visible, no need to show again
    if (this.isMenuVisible) {
      return;
    }

    // Clear any existing show timer and start new one
    if (this.showTimer) {
      clearTimeout(this.showTimer);
    }

    this.showTimer = setTimeout(() => {
      const megaMenuDropdown = document.querySelector('.mega-menu-dropdown');
      if (megaMenuDropdown) {
        megaMenuDropdown.classList.add('mega-menu-visible');
        this.isMenuVisible = true;
      }
      this.showTimer = null;
    }, this.showDelay);
  }

  scheduleHideMenu() {
    // Clear any pending show timer
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    // Clear any existing hide timer and start new one
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => {
      this.hideMenu();
      this.hideTimer = null;
    }, this.hideDelay);
  }

  hideMenu() {
    const megaMenuDropdown = document.querySelector('.mega-menu-dropdown');
    if (megaMenuDropdown) {
      megaMenuDropdown.classList.remove('mega-menu-visible');
      this.isMenuVisible = false;
    }
  }

  // Public methods for manual control if needed
  forceShow() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.showMenu();
  }

  forceHide() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.hideMenu();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MegaMenuHoverIntent();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOMContentLoaded will fire
} else {
  // DOM is already ready
  new MegaMenuHoverIntent();
}