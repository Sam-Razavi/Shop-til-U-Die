// js/components/products-list.js
const PRODUCTS_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      {{#if loading}}
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar produkter…</span>
        </div>
      {{else if error}}
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else if products.length}}
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {{#each products}}
            <div class="col">
              <div class="card h-100">
                <img src="{{image}}" class="card-img-top p-3" alt="{{title}}" style="object-fit:contain; height:200px;">
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title flex-grow-1">{{title}}</h6>
                  <p class="mb-1"><strong>{{price}} $</strong></p>
                  <button class="btn btn-sm btn-primary mt-2"
                          data-id="{{id}}">
                    Visa mer info
                  </button>
                </div>
              </div>
            </div>
          {{/each}}
        </div>
      {{else}}
        <p>Inga produkter att visa ännu.</p>
      {{/if}}
    </div>
  </div>
`;

class ProductsList extends HTMLElement {
  constructor() {
    super();
    this._state = { loading: false, error: "", products: [] };
    this._template = Handlebars.compile(PRODUCTS_TEMPLATE);
    // listen for SelectedCategory globally
    document.addEventListener('SelectedCategory', (e) => {
      this._loadProducts(e.detail.category);
    });
  }

  connectedCallback() {
    this._render();
    // listen for product clicks
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const product = this._state.products.find(p => p.id == id);
      if (product) {
        this.dispatchEvent(new CustomEvent('SelectedProduct', {
          detail: { product },
          bubbles: true,
          composed: true
        }));
      }
    });
  }

  async _loadProducts(category) {
    this._state = { loading: true, error: "", products: [] };
    this._render();
    try {
      const res = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      this._state = { loading: false, error: "", products: data };
    } catch (err) {
      console.error(err);
      this._state = { loading: false, error: "Kunde inte hämta produkter.", products: [] };
    } finally {
      this._render();
    }
  }

  _render() {
    this.innerHTML = this._template(this._state);
  }
}

customElements.define('products-list', ProductsList);
