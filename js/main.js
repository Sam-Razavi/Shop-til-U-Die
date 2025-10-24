// Importerar alla våra webbkomponenter så att de registreras
import './components/hello-box.js';
import './components/categories-list.js';
import './components/products-list.js';
import './components/product-details.js';
import './components/shopping-cart.js';

/**
 * Liten "router": visar en sektion och döljer de andra.
 * Vi använder Bootstrap-klassen d-none för att gömma sektioner.
 */
function showView(id) {
  document.querySelectorAll('main > section').forEach(sec => {
    sec.classList.toggle('d-none', sec.id !== id);
  });
}

// Startvy: visa kategorier först
showView('view-categories');

// När en kategori väljs -> visa produktlistan
document.addEventListener('SelectedCategory', () => showView('view-products'));

// När en produkt väljs -> visa produktdetaljer
document.addEventListener('SelectedProduct', () => showView('view-details'));

// När något läggs i kundvagnen -> visa kundvagn
document.addEventListener('AddedToCart', () => showView('view-cart'));

/**
 * Hemlänken i navbaren (om den finns i HTML:en):
 * Klick ska ta oss tillbaka till kategorivyn utan att ladda om sidan.
 */
document.addEventListener('DOMContentLoaded', () => {
  const homeLink = document.getElementById('linkHome');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('view-categories');
    });
  }
});

/**
 * Uppdatera siffra (badge) i navbarens kundvagn på sidstart
 * Läser från localStorage där vår <shopping-cart> sparar varorna.
 */
function updateCartCountFromStorage() {
  try {
    const items = JSON.parse(localStorage.getItem('cart-items') || '[]');
    const count = items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
  } catch {}
}
updateCartCountFromStorage();

/**
 * När kundvagnen uppdateras (lägg till/ta bort/ändra antal)
 * -> uppdatera siffran i badgen.
 */
document.addEventListener('CartUpdated', (e) => {
  const count = (e.detail.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count;
});

/**
 * Klick på "Cart"-knappen i navbaren:
 * Visa kundvagnsvyn i vår lilla router (om den finns).
 */
document.getElementById('linkCart')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (typeof showView === 'function') {
    showView('view-cart');
  } else {
    // Fallback: scrolla till komponenten om router inte används
    document.querySelector('shopping-cart')?.scrollIntoView({ behavior: 'smooth' });
  }
});

/**
 * Liten "toast" som visar bekräftelse när något läggs i kundvagnen.
 * Vi använder Bootstraps Toast-komponent.
 */
let _toast;
function showAddedToast(message = 'Produkten lades i kundvagnen.') {
  const el = document.getElementById('addedToast');
  if (!el) return;
  el.querySelector('.toast-body').textContent = message;
  _toast = _toast || new bootstrap.Toast(el, { delay: 1500 });
  _toast.show();
}
// När något läggs i kundvagnen -> visa toast med produktens titel
document.addEventListener('AddedToCart', (e) => {
  const title = e?.detail?.product?.title;
  showAddedToast(title ? `"${title}" lades i kundvagnen.` : undefined);
});

/**
 * När man klickar på en produkt i kundvagnen (bild/titel)
 * vill vi öppna produktens detaljsida.
 * Här hämtar vi produktdata från API:t och återanvänder flödet
 * genom att dispatcha SelectedProduct (som details-komponenten lyssnar på).
 */
document.addEventListener('ViewProductFromCart', async (e) => {
  const id = e.detail.id;
  try {
    const res = await fetch(`https://fakestoreapi.com/products/${id}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const product = await res.json();

    // Skicka eventet som product-details redan lyssnar på
    document.dispatchEvent(new CustomEvent('SelectedProduct', {
      detail: { product },
      bubbles: true,
      composed: true
    }));

    // Byt vy till detaljer (router) eller scrolla dit
    if (typeof showView === 'function') {
      showView('view-details');
    } else {
      document.querySelector('product-details')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error(err);
  }
});

/**
 * Liten visuell effekt på kundvagns-badgen när vagnen ändras
 * (en snabb "pop"-animation du lagt i CSS med .cart-pop).
 */
document.addEventListener('CartUpdated', () => {
  const badge = document.getElementById('cartCount');
  badge?.classList.add('cart-pop');
  setTimeout(() => badge?.classList.remove('cart-pop'), 250);
});
