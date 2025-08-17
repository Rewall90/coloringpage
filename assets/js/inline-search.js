/**
 * Inline Search Implementation
 * Provides real-time search functionality for coloring pages
 */

class InlineSearch {
  constructor() {
    this.fuse = null;
    this.indexed = false;
    this.isSearching = false;
    this.searchDebounceTimer = null;
    this.selectedIndex = -1;
    
    // DOM elements
    this.input = document.getElementById('inline-search-input');
    this.resultsContainer = document.getElementById('inline-search-results');
    this.resultsList = document.getElementById('inline-search-list');
    this.noResultsMessage = document.getElementById('inline-search-no-results');
    
    this.init();
  }
  
  init() {
    if (!this.input) return;
    
    // Set up event listeners
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.input.addEventListener('focus', () => this.handleFocus());
    this.input.addEventListener('blur', (e) => this.handleBlur(e));
    
    // Click outside to close
    document.addEventListener('click', (e) => this.handleDocumentClick(e));
  }
  
  handleInput(e) {
    const query = e.target.value.trim();
    
    // Clear previous timer
    clearTimeout(this.searchDebounceTimer);
    
    // Debounce search to avoid excessive API calls
    this.searchDebounceTimer = setTimeout(() => {
      if (query.length === 0) {
        this.hideResults();
        return;
      }
      
      if (query.length >= 2) {
        this.performSearch(query);
      }
    }, 300);
  }
  
  handleKeyDown(e) {
    const results = this.resultsList.querySelectorAll('li a');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
        this.updateSelection(results);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection(results);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && results[this.selectedIndex]) {
          results[this.selectedIndex].click();
        }
        break;
        
      case 'Escape':
        this.hideResults();
        this.input.blur();
        break;
    }
  }
  
  handleFocus() {
    if (this.input.value.trim().length >= 2) {
      this.showResults();
    }
  }
  
  handleBlur(e) {
    // Delay hiding to allow clicks on results
    setTimeout(() => {
      if (!this.resultsContainer.contains(document.activeElement)) {
        this.hideResults();
      }
    }, 150);
  }
  
  handleDocumentClick(e) {
    if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
      this.hideResults();
    }
  }
  
  async performSearch(query) {
    if (!this.indexed) {
      await this.buildIndex();
    }
    
    if (!this.fuse) return;
    
    this.isSearching = true;
    this.selectedIndex = -1;
    
    const results = this.fuse.search(query);
    this.displayResults(results);
    this.showResults();
    
    this.isSearching = false;
  }
  
  async buildIndex() {
    try {
      const baseURL = this.input.getAttribute('data-url') || '/';
      const indexURL = baseURL.replace(/\/?$/, '/') + 'index.json';
      
      const response = await fetch(indexURL);
      if (!response.ok) throw new Error('Failed to fetch search index');
      
      const data = await response.json();
      
      const options = {
        shouldSort: true,
        ignoreLocation: true,
        threshold: 0.3,
        includeMatches: true,
        keys: [
          { name: 'title', weight: 0.8 },
          { name: 'section', weight: 0.6 },
          { name: 'summary', weight: 0.4 },
          { name: 'content', weight: 0.2 }
        ]
      };
      
      // Filter out non-coloring page content if needed
      const filteredData = data.filter(item => 
        item.type !== 'authors' && 
        item.type !== 'tags' && 
        item.type !== 'categories' &&
        item.section !== 'Pages'
      );
      
      this.fuse = new Fuse(filteredData, options);
      this.indexed = true;
    } catch (error) {
      searchLogger.error('Failed to build search index:', error);
    }
  }
  
  displayResults(results) {
    if (results.length === 0) {
      this.showNoResults();
      return;
    }
    
    this.hideNoResults();
    
    const resultsHTML = results.slice(0, 8).map(result => {
      const item = result.item;
      const title = this.escapeHtml(item.title);
      const section = this.escapeHtml(item.section || '');
      const summary = this.escapeHtml(this.truncateText(item.summary || '', 100));
      
      return `
        <li>
          <a href="${item.permalink}" 
             class="block px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:bg-neutral-100 dark:focus:bg-neutral-700 focus:outline-none transition-colors duration-200"
             tabindex="0">
            <div class="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              ${title}
            </div>
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              ${section}
            </div>
            ${summary ? `<div class="text-sm text-neutral-500 dark:text-neutral-500">${summary}</div>` : ''}
          </a>
        </li>
      `;
    }).join('');
    
    this.resultsList.innerHTML = resultsHTML;
  }
  
  updateSelection(results) {
    results.forEach((result, index) => {
      if (index === this.selectedIndex) {
        result.classList.add('bg-primary-100', 'dark:bg-primary-900');
        result.setAttribute('aria-selected', 'true');
        result.scrollIntoView({ block: 'nearest' });
      } else {
        result.classList.remove('bg-primary-100', 'dark:bg-primary-900');
        result.setAttribute('aria-selected', 'false');
      }
    });
    
    // Update ARIA attributes
    this.input.setAttribute('aria-activedescendant', 
      this.selectedIndex >= 0 ? `search-result-${this.selectedIndex}` : '');
  }
  
  showResults() {
    this.resultsContainer.classList.remove('hidden');
    this.input.setAttribute('aria-expanded', 'true');
  }
  
  hideResults() {
    this.resultsContainer.classList.add('hidden');
    this.input.setAttribute('aria-expanded', 'false');
    this.selectedIndex = -1;
  }
  
  showNoResults() {
    this.noResultsMessage.classList.remove('hidden');
    this.resultsList.innerHTML = '';
  }
  
  hideNoResults() {
    this.noResultsMessage.classList.add('hidden');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  new InlineSearch();
});