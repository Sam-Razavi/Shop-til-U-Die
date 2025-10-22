// js/components/product-details.js
const DETAILS_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Produkt</h5>

      {{#if loading}}
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar produkt…</span>
        </div>
      {{else if error}}
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else if product}}
        <div class="row g-3 align-items-start">
          <div class="col-12 col-md-4">
            <img src="{{product.image}}" alt="{{product.title}}" class="img-fluid border rounded p-3" style="object-fit:contain; max-height:280px;">
          </div>
          <div class="col-12 col-md-8">
            <h6 class="mb-2">{{product.title}}</h6>
            <p class="mb-1">
              <span class="badge text-bg-secondary">{{product.category}}</span>
            </p>
            <p class="fs-5 fw-semibold mb-1">{{formatPrice product.price}} $</p>
            {{#if product.rating}}
              <p class="text-muted mb-2">Betyg: {{product.rating.rate}} ({{product.rating.count}} omdömen)</p>
            {{/if}}
            <p class="mb-3">{{product.description}}</p>

            <div class="d-flex gap-2 align-items-center">
              <input type="number" class="form-control" id="qty" value="1" min="1" style="max-width:120px">
              <button class="btn btn-primary" id="btnAddToCart">Lägg i kundvagn</button>
            </div>
          </div>
        </div>
      {{else}}
        <p>Välj en produkt för att se detaljer.</p>
      {{/if}}
    </div>
  </div>
`;

class ProductDetails extends HTMLElement {
  constructor() {
    super();
    this._state = { loading: false, error: "", product: null };
    // helper: price formatting
    Handlebars.registerHelper('formatPrice', (val) => {
      try { return Number(val).toFixed(2); } catch { return val; }
    });
    this._template = Handlebars.compile(DETAILS_TEMPLATE);

    // Listen globally for SelectedProduct
    document.addEventListener('SelectedProduct', (e) => {
      // You already have the full product object from ProductsList
      this._showProduct(e.detail.product);
    });
  }

  connectedCallback() {
    this._render();
    // Delegate click for Add to Cart
    this.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btnAddToCart') {
        const qtyInput = this.querySelector('#qty');
        const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
        if (!this._state.product) return;

        this.dispatchEvent(new CustomEvent('AddedToCart', {
          detail: { product: this._state.product, quantity: qty },
          bubbles: true,
          composed: true
        }));
      }
    });
  }

  _showProduct(product) {
    this._state = { loading: false, error: "", product };
    this._render();
  }

  _render() {
    this.innerHTML = this._template(this._state);
  }
}

customElements.define('product-details', ProductDetails);
