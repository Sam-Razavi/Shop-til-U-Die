import './components/hello-box.js';
import './components/categories-list.js';
import './components/products-list.js';
import './components/product-details.js';
import './components/shopping-cart.js';

// Debug while building
document.addEventListener('SelectedCategory', e => console.log('SelectedCategory:', e.detail));
document.addEventListener('SelectedProduct',  e => console.log('SelectedProduct:',  e.detail));
document.addEventListener('AddedToCart',     e => console.log('AddedToCart:',     e.detail));
document.addEventListener('CartUpdated',     e => console.log('CartUpdated:',     e.detail));