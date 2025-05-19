export const storage = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      console.error(`Error reading from localStorage: ${e.message}`);
      localStorage.removeItem(key);
      return [];
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage: ${e.message}`);
    }
  },
  
  addToRecentlyViewed: (airfoil) => {
    const recent = storage.get('recentlyViewed');
    const filtered = recent.filter(item => item.id !== airfoil.id);
    storage.set('recentlyViewed', [airfoil, ...filtered].slice(0, 5));
  },
  
  toggleFavorite: (airfoil) => {
    const favorites = storage.get('favorites');
    const exists = favorites.some(item => item.id === airfoil.id);
    
    if (exists) {
      storage.set('favorites', favorites.filter(item => item.id !== airfoil.id));
      return false;
    } else {
      storage.set('favorites', [...favorites, airfoil]);
      return true;
    }
  },
  
  isFavorite: (airfoilId) => {
    const favorites = storage.get('favorites');
    return favorites.some(item => item.id === airfoilId);
  }
};

if (typeof window !== 'undefined') {
  window.storage = storage;
} 