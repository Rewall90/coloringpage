// Inline Search Implementation
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
    
    // Event listeners
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('focus', () => this.handleFocus());
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
    
    // Get base URL for fetching index
    this.baseURL = this.input.getAttribute('data-url');
    this.baseURL = this.baseURL.replace(/\/?$/, '/');
  }
  
  handleInput(event) {
    const query = event.target.value.trim();
    
    // Clear previous debounce timer
    clearTimeout(this.searchDebounceTimer);
    
    if (query.length < 2) {
      this.hideResults();
      return;
    }
    
    // Debounce search to avoid excessive API calls
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }
  
  handleFocus() {
    const query = this.input.value.trim();
    if (query.length >= 2 && this.resultsList.children.length > 0) {
      this.showResults();
    }
  }
  
  handleKeyDown(event) {
    if (!this.resultsContainer || this.resultsContainer.classList.contains('hidden')) {
      return;
    }
    
    const items = this.resultsList.querySelectorAll('.inline-search-result-item');
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection(items);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
          const link = items[this.selectedIndex].querySelector('a');
          if (link) {
            link.click();
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.hideResults();
        this.input.blur();
        break;
    }
  }
  
  updateSelection(items) {
    // Remove previous selection
    items.forEach(item => item.classList.remove('selected'));
    
    // Add selection to current item
    if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
      items[this.selectedIndex].classList.add('selected');
      items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  handleOutsideClick(event) {
    if (!this.input.contains(event.target) && !this.resultsContainer.contains(event.target)) {
      this.hideResults();
    }
  }
  
  async performSearch(query) {
    if (!this.indexed) {
      await this.buildIndex();
    }
    
    if (!this.fuse) return;
    
    this.isSearching = true;
    
    try {
      // Perform fuzzy search
      const results = this.fuse.search(query);
      this.displayResults(results, query);
    } catch (error) {
      console.error('Search error:', error);
      this.showNoResults();
    } finally {
      this.isSearching = false;
    }
  }
  
  async buildIndex() {
    if (this.indexed) return;
    
    try {
      const response = await fetch(this.baseURL + 'index.json');
      const data = await response.json();
      
      // Filter to only include posts
      const postsOnly = data.filter(item => {
        // Check if the item is a post based on section or type
        return item.type === 'posts' || 
               item.section === 'Posts' || 
               item.section === 'posts' ||
               (item.permalink && item.permalink.includes('/posts/'));
      });
      
      // Fuse.js options optimized for content search
      const options = {
        shouldSort: true,
        ignoreLocation: true,
        threshold: 0.3,
        minMatchCharLength: 2,
        keys: [
          { name: 'title', weight: 0.8 },
          { name: 'section', weight: 0.6 },
          { name: 'summary', weight: 0.4 },
          { name: 'content', weight: 0.2 }
        ],
        includeMatches: true,
        includeScore: true
      };
      
      this.fuse = new Fuse(postsOnly, options);
      this.indexed = true;
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }
  
  displayResults(results, query) {
    this.clearResults();
    this.selectedIndex = -1; // Reset selection
    
    if (results.length === 0) {
      this.showNoResults();
      return;
    }
    
    // Limit results to prevent overwhelming UI
    const maxResults = 8;
    const limitedResults = results.slice(0, maxResults);
    
    limitedResults.forEach((result, index) => {
      const item = result.item;
      const listItem = this.createResultItem(item, result, index);
      this.resultsList.appendChild(listItem);
    });
    
    this.showResults();
  }
  
  createResultItem(item, result, index) {
    const li = document.createElement('li');
    li.className = 'inline-search-result-item';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '-1');
    li.dataset.index = index;
    
    const link = document.createElement('a');
    link.href = item.permalink || '#';
    link.className = 'inline-search-result-link';
    
    // Title
    const title = document.createElement('div');
    title.className = 'inline-search-result-title';
    title.innerHTML = this.highlightMatches(item.title || 'Untitled', result.matches);
    
    // Summary/excerpt
    const summary = document.createElement('div');
    summary.className = 'inline-search-result-summary';
    summary.textContent = item.summary ? 
      (item.summary.length > 120 ? item.summary.substring(0, 120) + '...' : item.summary) : 
      '';
    
    link.appendChild(title);
    if (summary.textContent) link.appendChild(summary);
    
    li.appendChild(link);
    
    // Click handler
    link.addEventListener('click', () => {
      this.hideResults();
    });
    
    return li;
  }
  
  showResults() {
    this.resultsContainer.classList.remove('hidden');
  }
  
  hideResults() {
    this.resultsContainer.classList.add('hidden');
    this.selectedIndex = -1;
  }
  
  showNoResults() {
    this.noResultsMessage.classList.remove('hidden');
    this.resultsList.classList.add('hidden');
    this.showResults();
  }
  
  clearResults() {
    this.resultsList.innerHTML = '';
    this.noResultsMessage.classList.add('hidden');
  }
  
  highlightMatches(text, matches) {
    if (!matches || !Array.isArray(matches)) {
      return this.escapeHtml(text);
    }
    
    // Find matches for the current field (title)
    const titleMatches = matches.find(match => match.key === 'title');
    if (!titleMatches || !titleMatches.indices) {
      return this.escapeHtml(text);
    }
    
    let result = '';
    let lastIndex = 0;
    
    // Sort indices by start position
    const sortedIndices = titleMatches.indices.sort((a, b) => a[0] - b[0]);
    
    sortedIndices.forEach(([start, end]) => {
      // Add text before match
      result += this.escapeHtml(text.slice(lastIndex, start));
      // Add highlighted match
      result += `<mark class="inline-search-highlight">${this.escapeHtml(text.slice(start, end + 1))}</mark>`;
      lastIndex = end + 1;
    });
    
    // Add remaining text
    result += this.escapeHtml(text.slice(lastIndex));
    
    return result;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('inline-search-input')) {
    new InlineSearch();
  }
});