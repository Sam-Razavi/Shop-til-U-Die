// js/components/products-list.js
const PRODUCTS_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">Produkter{{#if currentCategory}} – {{currentCategory}}{{/if}}</h5>
      </div>

      <!-- Controls -->
      <form class="row g-2 mb-3" id="controls">
        <div class="col-12 col-md-4">
          <input type="search" class="form-control" id="q" placeholder="Sök på titel…" value="{{q}}">
        </div>
        <div class="col-6 col-md-2">
          <input type="number" step="0.01" min="0" class="form-control" id="minPrice" placeholder="Min pris" value="{{minPrice}}">
        </div>
        <div class="col-6 col-md-2">
          <input type="number" step="0.01" min="0" class="form-control" id="maxPrice" placeholder="Max pris" value="{{maxPrice}}">
        </div>
        <div class="col-12 col-md-3">
          <select class="form-select" id="sort">
            <option value="relevance" {{#if (eq sort "relevance")}}selected{{/if}}>Sortera: Relevans</option>
            <option value="price-asc" {{#if (eq sort "price-asc")}}selected{{/if}}>Pris: lägst först</option>
            <option value="price-desc" {{#if (eq sort "price-desc")}}selected{{/if}}>Pris: högst först</option>
            <option value="title-asc" {{#if (eq sort "title-asc")}}selected{{/if}}>Titel: A–Ö</option>
            <option value="title-desc" {{#if (eq sort "title-desc")}}selected{{/if}}>Titel: Ö–A</option>
          </select>
        </div>
        <div class="col-12 col-md-1 d-grid">
          <button type="button" class="btn btn-outline-secondary" id="btnReset">Rensa</button>
        </div>
      </form>

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
        <p>Inga produkter matchar filtren.</p>
      {{/if}}
    </div>
  </div>
`;

class ProductsList extends HTMLElement {
  constructor() {
    super();

    // Register a tiny equality helper for Handlebars
    if (!Handlebars.helpers.eq) {
      Handlebars.registerHelper('eq', (a, b) => a === b);
    }

    this._template = Handlebars.compile(PRODUCTS_TEMPLATE);

    // Full dataset (for current category) vs. filtered view
    this._all = [];
    this._state = {
      loading: false,
      error: "",
      products: [],
      currentCategory: "",
      // controls
      q: "",
      minPrice: "",
      maxPrice: "",
      sort: "relevance",
    };

    // Listen for category changes
    document.addEventListener('SelectedCategory', (e) => {
      this._fetchProducts(e.detail.category);
    });
  }

  connectedCallback() {
    this._render();

    // Delegate product clicks
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const product = this._state.products.find(p => String(p.id) === String(id));
      if (product) {
        this.dispatchEvent(new CustomEvent('SelectedProduct', {
          detail: { product },
          bubbles: true,
          composed: true
        }));
      }
    });

    // Controls (wired after every render)
    this._bindControls();
  }

  // ------------- Data -------------
  async _fetchProducts(category) {
    this._state.loading = true;
    this._state.error = "";
    this._state.products = [];
    this._state.currentCategory = category;
    // Reset controls on new category
    this._state.q = "";
    this._state.minPrice = "";
    this._state.maxPrice = "";
    this._state.sort = "relevance";
    this._render();

    try {
      const res = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      this._all = data;
      this._applyFilters();
    } catch (err) {
      console.error(err);
      this._state.loading = false;
      this._state.error = "Kunde inte hämta produkter.";
      this._state.products = [];
      this._render();
    }
  }

  _applyFilters() {
    const q = this._state.q.trim().toLowerCase();
    const min = this._state.minPrice !== "" ? Number(this._state.minPrice) : null;
    const max = this._state.maxPrice !== "" ? Number(this._state.maxPrice) : null;

    let out = this._all.slice();

    // Search in title
    if (q) {
      out = out.filter(p => String(p.title).toLowerCase().includes(q));
    }

    // Price range
    out = out.filter(p => {
      const price = Number(p.price);
      if (Number.isFinite(min) && price < min) return false;
      if (Number.isFinite(max) && price > max) return false;
      return true;
    });

    // Sort
    const sort = this._state.sort;
    if (sort === "price-asc") {
      out.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      out.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "title-asc") {
      out.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "title-desc") {
      out.sort((a, b) => b.title.localeCompare(a.title));
    } // "relevance" keeps original order

    this._state.loading = false;
    this._state.error = "";
    this._state.products = out;
    this._render();
  }

  // ------------- Controls -------------
  _bindControls() {
    const controls = this.querySelector('#controls');
    if (!controls) return; // not rendered yet

    // Debounce helper for search input
    const debounce = (fn, ms = 300) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    };

    const qEl = this.querySelector('#q');
    const minEl = this.querySelector('#minPrice');
    const maxEl = this.querySelector('#maxPrice');
    const sortEl = this.querySelector('#sort');
    const resetBtn = this.querySelector('#btnReset');

    if (qEl) {
      qEl.addEventListener('input', debounce((e) => {
        this._state.q = e.target.value;
        this._applyFilters();
      }));
    }

    if (minEl) {
      minEl.addEventListener('change', (e) => {
        this._state.minPrice = e.target.value;
        this._applyFilters();
      });
    }

    if (maxEl) {
      maxEl.addEventListener('change', (e) => {
        this._state.maxPrice = e.target.value;
        this._applyFilters();
      });
    }

    if (sortEl) {
      sortEl.addEventListener('change', (e) => {
        this._state.sort = e.target.value;
        this._applyFilters();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this._state.q = "";
        this._state.minPrice = "";
        this._state.maxPrice = "";
        this._state.sort = "relevance";
        this._applyFilters();
      });
    }
  }

  // ------------- Render -------------
  _render() {
    this.innerHTML = this._template(this._state);
    // Re-bind controls after each render
    this._bindControls();
  }
}

customElements.define('products-list', ProductsList);
