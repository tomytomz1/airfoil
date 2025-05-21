import { SearchManager } from './search.js';
import { ComparisonManager } from './comparison.js';

export class App {
  constructor() {
    this.airfoils = {};
    this.searchManager = null;
    this.comparisonManager = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Load airfoil data
      const response = await fetch('/data/airfoils.json');
      if (!response.ok) {
        throw new Error('Failed to load airfoil data');
      }
      
      this.airfoils = await response.json();
      console.log('[DEBUG] Loaded airfoil keys:', Object.keys(this.airfoils));
      if (this.airfoils && Object.keys(this.airfoils).length > 0) {
        const firstKey = Object.keys(this.airfoils)[0];
        console.log('[DEBUG] Sample airfoil entry:', firstKey, this.airfoils[firstKey]);
      }
      
      // Initialize managers
      this.searchManager = new SearchManager(this.airfoils);
      this.comparisonManager = new ComparisonManager(this.airfoils);
      
      // Auto-apply Application filter from query param if present
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('application');
      if (appParam) {
        // Wait for DOM to be ready
        setTimeout(() => {
          const dropdown = document.getElementById('applicationDropdown');
          if (dropdown) {
            const checkbox = Array.from(dropdown.querySelectorAll('input[type="checkbox"]')).find(cb => cb.value === appParam);
            if (checkbox && !checkbox.checked) {
              checkbox.checked = true;
              checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }, 100);
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initial search
      this.searchManager.updateResults();
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to load airfoil data. Please try refreshing the page.');
    }
  }
  
  setupEventListeners() {
    // Mobile menu toggle
    const menuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      if (mobileMenu && !mobileMenu.contains(event.target) && !menuButton.contains(event.target)) {
        mobileMenu.classList.add('hidden');
      }
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Close mobile menu
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
        
        // Close comparison modal
        const modal = document.getElementById('comparisonModal');
        if (modal && !modal.classList.contains('hidden')) {
          this.comparisonManager.closeComparisonModal();
        }
      }
    });
  }
  
  showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 5000);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 