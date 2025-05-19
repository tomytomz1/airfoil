function updateFavoriteIcon(btn, isFav) {
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', isFav ? 'red' : 'none');
    btn.classList.toggle('text-red-500', isFav);
    btn.classList.toggle('text-gray-400', !isFav);
    btn.setAttribute('data-favorite', isFav ? 'true' : 'false');
  }
}

function updateFavoritesSidebar() {
  const favorites = window.storage.get('favorites');
  const favoritesList = document.getElementById('favorites');
  if (favoritesList) {
    favoritesList.innerHTML = '';
    if (favorites.length === 0) {
      favoritesList.innerHTML = '<li class="pl-2 text-gray-700">No favorites yet.</li>';
    } else {
      favorites.forEach(airfoil => {
        favoritesList.innerHTML += `<li class='pl-2 text-gray-700'>${airfoil.name}</li>`;
      });
    }
  }
}

function setupFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const id = btn.getAttribute('data-id');
    const isFav = window.storage.isFavorite(id);
    updateFavoriteIcon(btn, isFav);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.airfoil-card');
      const name = card?.getAttribute('data-name') || '';
      const description = card?.getAttribute('data-description') || '';
      const airfoil = { id, name, description };
      const newFav = window.storage.toggleFavorite(airfoil);
      updateFavoriteIcon(btn, newFav);
      updateFavoritesSidebar();
    });
  });
}

// Run on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  setupFavoriteButtons();
  updateFavoritesSidebar();
}); 