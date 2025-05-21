export class SearchManager {
  constructor(airfoils) {
    this.airfoils = airfoils;
    this.filterState = {
      search: '',
      camber: [],
      thickness: [],
      applications: [],
      sortBy: 'popular',
      view: 'grid'
    };
    
    this.setupEventListeners();
    this.updateResults();
  }
  
  setupEventListeners() {
    // Search input
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      searchBox.addEventListener('input', (e) => {
        this.filterState.search = e.target.value;
        this.updateResults();
      });
    }
    
    // Filter dropdowns
    ['camber', 'thickness', 'application'].forEach(filterType => {
      const btn = document.getElementById(`${filterType}DropdownBtn`);
      const dropdown = document.getElementById(`${filterType}Dropdown`);
      
      if (btn && dropdown) {
        btn.addEventListener('click', () => {
          dropdown.classList.toggle('hidden');
          btn.setAttribute('aria-expanded', !dropdown.classList.contains('hidden'));
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
          }
        });
        
        // Handle checkbox changes
        dropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            const filterKey = filterType === 'application' ? 'applications' : filterType;
            this.filterState[filterKey] = Array.from(
              dropdown.querySelectorAll('input[type="checkbox"]:checked')
            ).map(cb => cb.value);
            this.updateResults();
          });
        });
      }
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filterState.sortBy = e.target.value;
        this.updateResults();
      });
    }
    
    // View toggle
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (gridViewBtn && listViewBtn) {
      gridViewBtn.addEventListener('click', () => {
        this.filterState.view = 'grid';
        this.updateView();
      });
      
      listViewBtn.addEventListener('click', () => {
        this.filterState.view = 'list';
        this.updateView();
      });
    }
    
    // Reset filters
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }
  }
  
  updateResults() {
    const filteredAirfoils = this.filterAirfoils();
    const sortedAirfoils = this.sortAirfoils(filteredAirfoils);
    this.updateUI(sortedAirfoils);
  }
  
  filterAirfoils() {
    return Object.entries(this.airfoils).filter(([id, airfoil]) => {
      // Search filter
      if (this.filterState.search) {
        const searchLower = this.filterState.search.toLowerCase();
        const matchesSearch = 
          airfoil.name.toLowerCase().includes(searchLower) ||
          (airfoil.description || '').toLowerCase().includes(searchLower) ||
          (airfoil.applications || []).some(app => app.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      // Camber filter
      if (this.filterState.camber.length > 0) {
        const matchesCamber = this.filterState.camber.some(range => {
          let [minStr, maxStr] = range.replace(/%/g, '').split('-');
          let min = Number(minStr);
          let max = maxStr && maxStr.includes('+') ? Infinity : Number((maxStr || '').replace('+', ''));
          return airfoil.camber >= min && airfoil.camber <= max;
        });
        if (!matchesCamber) return false;
      }
      
      // Thickness filter
      if (this.filterState.thickness.length > 0) {
        const matchesThickness = this.filterState.thickness.some(range => {
          let [minStr, maxStr] = range.replace(/%/g, '').split('-');
          let min = Number(minStr);
          let max = maxStr && maxStr.includes('+') ? Infinity : Number((maxStr || '').replace('+', ''));
          return airfoil.thickness >= min && airfoil.thickness <= max;
        });
        if (!matchesThickness) return false;
      }
      
      // Applications filter
      if (this.filterState.applications.length > 0) {
        const matchesApplications = this.filterState.applications.some(selectedApp =>
          (airfoil.applications || []).some(app =>
            app.toLowerCase().includes(selectedApp.toLowerCase())
          )
        );
        if (!matchesApplications) return false;
      }
      
      return true;
    });
  }
  
  sortAirfoils(airfoils) {
    const [field, direction] = this.filterState.sortBy.match(/(.+)(Asc|Desc)/) || ['popular', ''];
    
    return airfoils.sort((a, b) => {
      if (field === 'popular') {
        // Implement popularity sorting logic here
        return 0;
      }
      
      const aValue = a[1][field];
      const bValue = b[1][field];
      
      if (direction === 'Asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  updateUI(airfoils) {
    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `Showing ${airfoils.length} airfoils`;
    }

    // Hide/show airfoil cards based on filtered results
    const visibleIds = new Set(airfoils.map(([id]) => id));
    document.querySelectorAll('.airfoil-card').forEach(card => {
      const id = card.getAttribute('data-id');
      if (visibleIds.has(id)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });

    // Update grid/list view
    this.updateView();

    // Update active filters
    this.updateActiveFilters();

    // Dispatch event for sticky positioning update
    document.dispatchEvent(new CustomEvent('airfoilsUpdated'));
  }
  
  updateView() {
    const grid = document.getElementById('airfoilGrid');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (grid && gridViewBtn && listViewBtn) {
      if (this.filterState.view === 'grid') {
        grid.classList.remove('grid-cols-1');
        grid.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
        gridViewBtn.classList.add('bg-blue-100', 'text-blue-800');
        gridViewBtn.classList.remove('text-gray-400');
        listViewBtn.classList.add('text-gray-400');
        listViewBtn.classList.remove('bg-blue-100', 'text-blue-800');
      } else {
        grid.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
        grid.classList.add('grid-cols-1');
        listViewBtn.classList.add('bg-blue-100', 'text-blue-800');
        listViewBtn.classList.remove('text-gray-400');
        gridViewBtn.classList.add('text-gray-400');
        gridViewBtn.classList.remove('bg-blue-100', 'text-blue-800');
      }
    }
  }
  
  updateActiveFilters() {
    const activeFilters = document.getElementById('activeFilters');
    const filterTags = document.getElementById('filterTags');
    
    if (activeFilters && filterTags) {
      const hasActiveFilters = 
        this.filterState.search ||
        this.filterState.camber.length > 0 ||
        this.filterState.thickness.length > 0 ||
        this.filterState.applications.length > 0;
      
      activeFilters.classList.toggle('hidden', !hasActiveFilters);
      
      if (hasActiveFilters) {
        filterTags.innerHTML = '';
        
        if (this.filterState.search) {
          this.addFilterTag('Search', this.filterState.search);
        }
        
        this.filterState.camber.forEach(range => {
          this.addFilterTag('Camber', range);
        });
        
        this.filterState.thickness.forEach(range => {
          this.addFilterTag('Thickness', range);
        });
        
        this.filterState.applications.forEach(app => {
          this.addFilterTag('Application', app);
        });
      }
    }
  }
  
  addFilterTag(type, value) {
    const filterTags = document.getElementById('filterTags');
    if (!filterTags) return;
    
    const tag = document.createElement('div');
    tag.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
    tag.innerHTML = `
      ${type}: ${value}
      <button class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none" aria-label="Remove filter">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    
    filterTags.appendChild(tag);

    // Add event listener to remove filter on X click
    const closeBtn = tag.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (type === 'Search') {
          this.filterState.search = '';
          const searchBox = document.getElementById('searchBox');
          if (searchBox) searchBox.value = '';
        } else if (type === 'Camber') {
          this.filterState.camber = this.filterState.camber.filter(v => v !== value);
          // Uncheck the corresponding checkbox
          document.querySelectorAll('#camberDropdown input[type="checkbox"]').forEach(cb => {
            if (cb.value === value) cb.checked = false;
          });
        } else if (type === 'Thickness') {
          this.filterState.thickness = this.filterState.thickness.filter(v => v !== value);
          document.querySelectorAll('#thicknessDropdown input[type="checkbox"]').forEach(cb => {
            if (cb.value === value) cb.checked = false;
          });
        } else if (type === 'Application') {
          this.filterState.applications = this.filterState.applications.filter(v => v !== value);
          document.querySelectorAll('#applicationDropdown input[type="checkbox"]').forEach(cb => {
            if (cb.value === value) cb.checked = false;
          });
        }
        this.updateResults();
      });
    }
  }
  
  resetFilters() {
    this.filterState = {
      search: '',
      camber: [],
      thickness: [],
      applications: [],
      sortBy: 'popular',
      view: 'grid'
    };
    
    // Reset UI elements
    const searchBox = document.getElementById('searchBox');
    if (searchBox) searchBox.value = '';
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'popular';
    
    this.updateResults();
  }
} 