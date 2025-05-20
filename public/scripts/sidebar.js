function updateFavoritesSidebar() {
  const favorites = window.storage ? window.storage.get('favorites') : [];
  const favoritesList = document.getElementById('favorites');
  if (favoritesList) {
    favoritesList.innerHTML = '';
    if (favorites.length === 0) {
      favoritesList.innerHTML = '<li class="pl-2 text-gray-700">No favorites yet.</li>';
    } else {
      favorites.forEach(airfoil => {
        favoritesList.innerHTML += `
          <li class="pl-2 text-gray-700">
            <a href="/airfoil/${airfoil.id}" class="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
              ${airfoil.name}
            </a>
          </li>
        `;
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.storage) {
    updateFavoritesSidebar();
  } else {
    // Wait for storage to be defined
    const interval = setInterval(() => {
      if (window.storage) {
        updateFavoritesSidebar();
        clearInterval(interval);
      }
    }, 50);
  }
}); 