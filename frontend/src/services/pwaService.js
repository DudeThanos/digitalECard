// PWA Service for "Save to Home" functionality
// This service handles PWA installation and offline card data management

class PWAService {
  constructor() {
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.serviceWorkerRegistration = null;
    this._booted = false;
  }

  // Boot PWA service (called on app startup)
  boot() {
    if (this._booted) return;
    this._booted = true;

    console.log('PWA: Booting service...');

    // Listen immediately so we don't miss the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('PWA: Install prompt captured');
      // Optional: fire a custom event so your UI can show an "Install" button
      window.dispatchEvent(new Event('pwa:prompt-ready'));
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('PWA: App was installed');
    });

    // Check if already installed (Android + iOS)
    this.isInstalled = 
      window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (this.isInstalled) {
      console.log('PWA: Already installed');
    }

    console.log('PWA: Boot complete');
  }

  // Initialize PWA service (called only when "Save to Home" is clicked)
  async initialize() {
    if (!this.isMobile()) {
      console.log('PWA: Not mobile device, skipping initialization');
      return false;
    }

    // Boot if not already done
    if (!this._booted) {
      this.boot();
    }

    try {
      // Try to register service worker (but don't fail if it doesn't work)
      try {
        await this.registerServiceWorker();
      } catch (swError) {
        console.log('PWA: Service worker registration failed, but continuing:', swError);
      }
      
      return true;
    } catch (error) {
      console.error('PWA: Initialization failed:', error);
      return false;
    }
  }

  // Check if device is mobile
  isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
  }

  // Register service worker for offline functionality
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Use absolute path for service worker
        const swUrl = `${window.location.origin}/sw.js`;
        this.serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
        console.log('PWA: Service worker registered successfully');
        return true;
      } catch (error) {
        console.error('PWA: Service worker registration failed:', error);
        return false;
      }
    }
    return false;
  }



  // Check if PWA is already installed
  checkIfInstalled() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('PWA: Already installed');
    }
  }



  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      // Check if real prompt has the required methods
      if (this.deferredPrompt.prompt && typeof this.deferredPrompt.prompt === 'function' && 
          this.deferredPrompt.userChoice && typeof this.deferredPrompt.userChoice.then === 'function') {
        
        // Real PWA install prompt
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA: User accepted installation');
          this.isInstalled = true;
          this.deferredPrompt = null;
          return true;
        } else {
          console.log('PWA: User declined installation');
          return false;
        }
      } else {
        console.log('PWA: Real prompt methods not available');
        return false;
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
      return false;
    }
  }





  // Show manual installation instructions
  showManualInstructions() {
    const instructions = this.getManualInstallInstructions();
    const message = `To install K Card:\n\n${instructions}\n\n💡 Look for "Add to Home Screen" in your browser menu`;
    alert(message);
  }

  // Show detailed installation instructions with specific steps
  showDetailedInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome')) {
      instructions = `📱 To install K Card on your home screen:

1. Tap the three dots (⋮) in the top right corner
2. Look for "Add to Home screen" or "Install app"
3. Tap it and confirm the installation
4. The app will appear on your home screen as "K Card"`;
    } else if (userAgent.includes('safari')) {
      instructions = `📱 To install K Card on your home screen:

1. Tap the share button (square with arrow up)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm
4. The app will appear on your home screen as "K Card"`;
    } else if (userAgent.includes('firefox')) {
      instructions = `📱 To install K Card on your home screen:

1. Tap the menu button (☰) in the top right
2. Tap "Add to Home Screen"
3. Confirm the installation
4. The app will appear on your home screen as "K Card"`;
    } else if (userAgent.includes('samsung') || userAgent.includes('android')) {
      instructions = `📱 To install K Card on your home screen:

1. Tap the three dots (⋮) in the top right corner
2. Look for "Add to Home screen" or "Install app"
3. Tap it and confirm the installation
4. The app will appear on your home screen as "K Card"`;
    } else {
      instructions = `📱 To install K Card on your home screen:

1. Look for "Add to Home Screen" in your browser menu
2. Follow the browser's instructions
3. The app will appear on your home screen as "K Card"`;
    }
    
    // Show as a styled alert
    this.showStyledInstructions(instructions);
  }

  // Show styled instructions instead of basic alert
  showStyledInstructions(instructions) {
    // Remove existing styled instructions if any
    const existing = document.getElementById('styled-instructions');
    if (existing) {
      existing.remove();
    }

    // Create styled overlay
    const overlay = document.createElement('div');
    overlay.id = 'styled-instructions';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Create instructions box
    const box = document.createElement('div');
    box.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      text-align: left;
      font-family: 'Century Gothic', Arial, sans-serif;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = '📱 Install K Card';
    title.style.cssText = `
      color: #AC212F;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
    `;

    // Instructions
    const content = document.createElement('div');
    content.innerHTML = instructions.replace(/\n/g, '<br>');
    content.style.cssText = `
      color: #333;
      line-height: 1.6;
      font-size: 16px;
      margin-bottom: 25px;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Got it!';
    closeBtn.style.cssText = `
      background: #AC212F;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
    `;

    closeBtn.onmouseover = () => {
      closeBtn.style.background = '#8A1A25';
    };

    closeBtn.onmouseout = () => {
      closeBtn.style.background = '#AC212F';
    };

    closeBtn.onclick = () => {
      overlay.remove();
    };

    // Assemble
    box.appendChild(title);
    box.appendChild(content);
    box.appendChild(closeBtn);
    overlay.appendChild(box);

    document.body.appendChild(overlay);

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 10000);
  }

  // Save card data to localStorage for offline access
  saveCardData(cardData) {
    try {
      const cardKey = `offline_card_${cardData.employee_code}`;
      localStorage.setItem(cardKey, JSON.stringify(cardData));
      console.log('PWA: Card data saved to localStorage');
      return true;
    } catch (error) {
      console.error('PWA: Failed to save card data:', error);
      return false;
    }
  }

  // Get card data from localStorage
  getCardData(employeeCode) {
    try {
      const cardKey = `offline_card_${employeeCode}`;
      const cardData = localStorage.getItem(cardKey);
      return cardData ? JSON.parse(cardData) : null;
    } catch (error) {
      console.error('PWA: Failed to get card data:', error);
      return null;
    }
  }

  // Check if card data exists in localStorage
  hasCardData(employeeCode) {
    const cardKey = `offline_card_${employeeCode}`;
    return localStorage.getItem(cardKey) !== null;
  }

  // Handle "Save to Home" button click
  async handleSaveToHome(cardData) {
    if (!this.isMobile()) {
      console.log('PWA: Not mobile device');
      return { success: false, message: 'This feature is only available on mobile devices' };
    }

    try {
      // Initialize PWA if not already done
      if (!this.serviceWorkerRegistration) {
        await this.initialize();
      }

      // Save card data to localStorage
      const saved = this.saveCardData(cardData);
      if (!saved) {
        return { success: false, message: 'Failed to save card data' };
      }

      // Check if PWA criteria are met (real values, no overrides)
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const hasManifest = document.querySelector('link[rel="manifest"]') !== null;

      console.log('PWA: Criteria check:', {
        isHttps,
        isLocalhost,
        hasManifest,
        deferredPrompt: !!this.deferredPrompt,
        isInstalled: this.isInstalled
      });

      // Check if already installed
      if (this.isInstalled) {
        return { success: true, message: 'APP Shortcut already installed!' };
      }

      // Check if we have a deferred prompt (real PWA install available)
      if (this.deferredPrompt && (isHttps || isLocalhost) && hasManifest) {
        // Try to trigger the real install prompt immediately
        console.log('PWA: Triggering real install prompt');
        const result = await this.showInstallPrompt();
        
        if (result) {
          return { 
            success: true, 
            message: 'APP Shortcut added successfully!'
          };
        } else {
          // If real prompt failed, show manual instructions
          this.showDetailedInstallInstructions();
          return { 
            success: true, 
            message: 'Card saved! Manual installation instructions shown.',
            showInstallDialog: true
          };
        }
      } else if ((isHttps || isLocalhost) && hasManifest) {
        // PWA criteria met but no prompt available - show manual instructions
        console.log('PWA: No deferred prompt available, showing manual instructions');
        this.showDetailedInstallInstructions();
        return { 
          success: true, 
          message: 'Card saved! Manual installation instructions shown.',
          showInstallDialog: true
        };
      } else {
        // PWA criteria not met, just save card data
        return { 
          success: true, 
          message: 'Card saved for offline access! PWA installation requires HTTPS or localhost.'
        };
      }
    } catch (error) {
      console.error('PWA: Save to home failed:', error);
      return { success: false, message: 'Failed to save card' };
    }
  }

  // Get manual install instructions based on browser
  getManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Tap the menu (⋮) → "Add to Home screen"';
    } else if (userAgent.includes('safari')) {
      return 'Tap the share button → "Add to Home Screen"';
    } else if (userAgent.includes('firefox')) {
      return 'Tap the menu (☰) → "Add to Home Screen"';
    } else if (userAgent.includes('samsung') || userAgent.includes('android')) {
      return 'Tap the menu (⋮) → "Add to Home screen" or "Install app"';
    } else {
      return 'Add to Home Screen from browser menu';
    }
  }

  // Test if PWA can be installed
  canInstallPWA() {
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    return {
      canInstall: (isHttps || isLocalhost) && hasManifest && hasServiceWorker,
      reasons: {
        isHttps,
        isLocalhost,
        hasManifest,
        hasServiceWorker
      }
    };
  }
}

// Export singleton instance
const pwaService = new PWAService();
export default pwaService;
