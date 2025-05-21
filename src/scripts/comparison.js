export class ComparisonManager {
  constructor(airfoils) {
    this.airfoils = airfoils;
    this.comparisonItems = new Set();
    
    this.setupEventListeners();
    this.updateUI();
  }
  
  setupEventListeners() {
    // Compare buttons
    document.querySelectorAll('.compare-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        this.toggleComparison(id, name);
      });
    });
    
    // Comparison banner buttons
    const clearCompareBtn = document.getElementById('clearCompare');
    const viewCompareBtn = document.getElementById('viewCompare');
    const addToCompareBtn = document.getElementById('addToCompare');
    
    if (clearCompareBtn) {
      clearCompareBtn.addEventListener('click', () => {
        this.clearComparison();
      });
    }
    
    if (viewCompareBtn) {
      viewCompareBtn.addEventListener('click', () => {
        this.openComparisonModal();
      });
    }
    
    if (addToCompareBtn) {
      addToCompareBtn.addEventListener('click', () => {
        // Implement add to comparison logic
      });
    }
    
    // Modal close button
    const closeModalBtn = document.getElementById('closeComparisonModal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.closeComparisonModal();
      });
    }
    
    // Modal export buttons
    const exportBtn = document.getElementById('exportComparison');
    const downloadBtn = document.getElementById('downloadData');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportComparison();
      });
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadComparison();
      });
    }
  }
  
  toggleComparison(id, name) {
    if (this.comparisonItems.has(id)) {
      this.comparisonItems.delete(id);
    } else {
      if (this.comparisonItems.size >= 3) {
        alert('You can compare up to 3 airfoils at a time');
        return;
      }
      this.comparisonItems.add(id);
    }
    
    this.updateUI();
  }
  
  clearComparison() {
    this.comparisonItems.clear();
    this.updateUI();
  }
  
  openComparisonModal() {
    const modal = document.getElementById('comparisonModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.populateComparisonGrid();
    }
  }
  
  closeComparisonModal() {
    const modal = document.getElementById('comparisonModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
  
  updateUI() {
    const banner = document.getElementById('comparisonBanner');
    const count = document.getElementById('compareCount');
    const items = document.getElementById('compareItems');
    
    if (banner && count && items) {
      const hasItems = this.comparisonItems.size > 0;
      banner.classList.toggle('hidden', !hasItems);
      
      if (hasItems) {
        count.textContent = this.comparisonItems.size;
        items.innerHTML = '';
        
        this.comparisonItems.forEach(id => {
          const airfoil = this.airfoils[id];
          if (airfoil) {
            const item = document.createElement('div');
            item.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
            item.innerHTML = `
              ${airfoil.name}
              <button 
                class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none" 
                data-id="${id}"
                aria-label="Remove from comparison"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            `;
            
            item.querySelector('button').addEventListener('click', () => {
              this.toggleComparison(id, airfoil.name);
            });
            
            items.appendChild(item);
          }
        });
      }
    }
    // Update compare button states globally
    this.updateCompareButtons();
  }
  
  updateCompareButtons() {
    const compareIds = new Set(this.comparisonItems);
    document.querySelectorAll('.compare-btn').forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (compareIds.has(id)) {
        btn.classList.add('compare-selected');
        btn.setAttribute('data-compare-state', 'selected');
      } else {
        btn.classList.remove('compare-selected');
        btn.setAttribute('data-compare-state', 'unselected');
      }
    });
  }
  
  populateComparisonGrid() {
    const grid = document.getElementById('comparisonGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    this.comparisonItems.forEach(id => {
      const airfoil = this.airfoils[id];
      if (airfoil) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4';
        card.innerHTML = `
          <h3 class="text-lg font-medium text-gray-900">${airfoil.name}</h3>
          <div class="mt-3 border-b border-gray-200 pb-3">
            <canvas class="airfoil-canvas w-full h-32" data-coords='${JSON.stringify(airfoil.coordinates)}'></canvas>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase">Quick Stats</h4>
              <div class="grid grid-cols-2 gap-1 mt-1">
                <div class="text-sm text-gray-700">Camber</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.camber || '--'}</div>
                <div class="text-sm text-gray-700">Thickness</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.thickness || '--'}</div>
                <div class="text-sm text-gray-700">Re Range</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.reynoldsRange || '--'}</div>
              </div>
            </div>
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase">Performance</h4>
              <div class="grid grid-cols-2 gap-1 mt-1">
                <div class="text-sm text-gray-700">Max Cl/Cd</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.maxLiftDragRatio || '--'}</div>
                <div class="text-sm text-gray-700">Stall Angle</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.stallAngle || '--'}</div>
                <div class="text-sm text-gray-700">Cm</div>
                <div class="text-sm text-gray-900 font-medium">${airfoil.momentCoefficient || '--'}</div>
              </div>
            </div>
          </div>
        `;
        
        grid.appendChild(card);
        
        // Initialize canvas
        const canvas = card.querySelector('canvas');
        if (canvas) {
          // Set canvas width and height to match display size for crisp drawing
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          this.drawAirfoil(canvas, airfoil.coordinates);
        }
      }
    });
  }
  
  drawAirfoil(canvas, coordinates) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Compute bounding box with padding
    const xs = coordinates.map(([x, y]) => x);
    const ys = coordinates.map(([x, y]) => y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = (maxX - minX) * 0.05;
    const padY = (maxY - minY) * 0.15;
    const boxWidth = (maxX - minX) + 2 * padX;
    const boxHeight = (maxY - minY) + 2 * padY;
    
    // Compute scale to fit the canvas while preserving aspect ratio
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Center the airfoil in the canvas
    const scaledWidth = boxWidth * scale;
    const scaledHeight = boxHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    // Set up coordinate system
    ctx.save();
    ctx.translate(offsetX, offsetY + scaledHeight); // move origin to bottom left of drawing area
    ctx.scale(scale, -scale); // flip Y axis
    ctx.translate(-minX + padX, -minY + padY);
    
    // Draw airfoil
    ctx.beginPath();
    coordinates.forEach(([x, y], i) => {
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 0.01;
    ctx.stroke();
    
    ctx.restore();
  }
  
  exportComparison() {
    const data = Array.from(this.comparisonItems).map(id => this.airfoils[id]);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airfoil-comparison.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  downloadComparison() {
    // Implement download functionality (e.g., CSV format)
    console.log('Download comparison data');
  }
} 