import './components/hello-box.js';
import './components/categories-list.js';
import './components/products-list.js';
import './components/product-details.js';
import './components/shopping-cart.js';

function showView(id) {
  document.querySelectorAll('main > section').forEach(sec => {
    sec.classList.toggle('d-none', sec.id !== id);
  });
}

// On startup
showView('view-categories');

// When category selected
document.addEventListener('SelectedCategory', () => showView('view-products'));

// When product selected
document.addEventListener('SelectedProduct', () => showView('view-details'));

// If you want a button or link to cart
document.addEventListener('AddedToCart', () => showView('view-cart'));


// Handle clicking the navbar brand to go "home"
document.addEventListener('DOMContentLoaded', () => {
  const homeLink = document.getElementById('linkHome');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('view-categories'); // assuming you have the router function
    });
  }
});


// Initialize cart badge from localStorage (matches your ShoppingCart storage key)
function updateCartCountFromStorage() {
  try {
    const items = JSON.parse(localStorage.getItem('cart-items') || '[]');
    const count = items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
  } catch {}
}
updateCartCountFromStorage();

document.addEventListener('CartUpdated', (e) => {
  const count = (e.detail.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count;
});

// (Optional) if you use the tiny router:
document.getElementById('linkCart')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (typeof showView === 'function') {
    showView('view-cart');
  } else {
    // fallback: just scroll to cart component
    document.querySelector('shopping-cart')?.scrollIntoView({ behavior: 'smooth' });
  }
});

let _toast;
function showAddedToast(message = 'Produkten lades i kundvagnen.') {
  const el = document.getElementById('addedToast');
  if (!el) return;
  el.querySelector('.toast-body').textContent = message;
  _toast = _toast || new bootstrap.Toast(el, { delay: 1500 });
  _toast.show();
}
document.addEventListener('AddedToCart', (e) => {
  const title = e?.detail?.product?.title;
  showAddedToast(title ? `"${title}" lades i kundvagnen.` : undefined);
});
