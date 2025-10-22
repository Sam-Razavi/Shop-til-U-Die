// js/components/shopping-cart.js
const CART_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Kundvagn</h5>

      {{#if items.length}}
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Produkt</th>
                <th class="text-end">Pris</th>
                <th style="width:160px;" class="text-center">Antal</th>
                <th class="text-end">Delsumma</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
                <tr data-id="{{id}}">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img src="{{image}}" alt="{{title}}" style="width:48px; height:48px; object-fit:contain;" class="border rounded p-1">
                      <div>
                        <div class="fw-semibold small">{{title}}</div>
                        <div class="text-muted small">{{category}}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-end">{{formatPrice price}} $</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group" aria-label="qty">
                      <button class="btn btn-outline-secondary" data-action="dec">−</button>
                      <span class="btn btn-light disabled">{{qty}}</span>
                      <button class="btn btn-outline-secondary" data-action="inc">+</button>
                    </div>
                  </td>
                  <td class="text-end">{{formatPrice subtotal}} $</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" data-action="remove">Ta bort</button>
                  </td>
                </tr>
              {{/each}}
              <tr>
                <td colspan="3" class="text-end fw-semibold">Totalt</td>
                <td class="text-end fw-bold">{{formatPrice total}} $</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" id="btnClear">Töm kundvagn</button>
          <button class="btn btn-success" id="btnCheckout">Gå till checkout</button>
        </div>
      {{else}}
        <p>Kundvagnen är tom. Lägg till en produkt.</p>
      {{/if}}
    </div>
  </div>
`;

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    // try restore from localStorage
    const saved = localStorage.getItem('cart-items');
    this._items = saved ? JSON.parse(saved) : [];
    // helpers
    Handlebars.registerHelper('formatPrice', (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : v;
    });
    this._template = Handlebars.compile(CART_TEMPLATE);

    // Listen globally for AddedToCart
    document.addEventListener('AddedToCart', (e) => {
      const { product, quantity } = e.detail;
      this._add(product, quantity);
    });
  }

  connectedCallback() {
    this._render();
    // delegate all clicks inside
    this.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]');
      const action = e.target.getAttribute('data-action');

      if (row && action) {
        const id = Number(row.getAttribute('data-id'));
        if (action === 'inc') this._changeQty(id, +1);
        if (action === 'dec') this._changeQty(id, -1);
        if (action === 'remove') this._remove(id);
      }

      if (e.target?.id === 'btnClear') {
        this._clear();
      }
      if (e.target?.id === 'btnCheckout') {
        alert('Demo: här skulle checkout starta 🛒');
      }
    });
  }

  // ---------- data ops ----------
  _add(product, qty = 1) {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const existing = this._items.find(it => it.id === product.id);
    if (existing) {
      existing.qty += q;
    } else {
      this._items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        qty: q,
      });
    }
    this._persist();
    this._render();
  }

  _changeQty(id, delta) {
    const it = this._items.find(x => x.id === id);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) {
      this._items = this._items.filter(x => x.id !== id);
    }
    this._persist();
    this._render();
  }

  _remove(id) {
    this._items = this._items.filter(x => x.id !== id);
    this._persist();
    this._render();
  }

  _clear() {
    this._items = [];
    this._persist();
    this._render();
  }

  _persist() {
    localStorage.setItem('cart-items', JSON.stringify(this._items));
    // optional: emit update event
    this.dispatchEvent(new CustomEvent('CartUpdated', {
      detail: { items: this._items, total: this._calcTotal() },
      bubbles: true,
      composed: true
    }));
  }

  _calcTotal() {
    return this._items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  _viewModel() {
    const items = this._items.map(it => ({
      ...it,
      subtotal: it.price * it.qty
    }));
    return { items, total: this._calcTotal() };
  }

  // ---------- render ----------
  _render() {
    this.innerHTML = this._template(this._viewModel());
  }
}

customElements.define('shopping-cart', ShoppingCart);
