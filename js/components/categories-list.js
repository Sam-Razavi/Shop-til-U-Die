// js/components/categories-list.js
const CATEGORIES_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Kategorier</h5>

      {{#if loading}}
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar kategorier…</span>
        </div>
      {{else if error}}
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else}}
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
          {{#each categories}}
            <div class="col">
              <div class="card h-100 category-card" data-category="{{this.name}}" role="button" tabindex="0" aria-label="Visa produkter i {{this.name}}">
                <img src="{{this.image}}" alt="{{this.name}}" class="category-thumb">
                <div class="card-body d-flex align-items-center justify-content-center">
                  <h6 class="card-title mb-0 text-uppercase text-center">{{this.name}}</h6>
                </div>
              </div>
            </div>
          {{/each}}
        </div>
      {{/if}}
    </div>
  </div>
`;

class CategoriesList extends HTMLElement {
  constructor() {
    super();
    this._state = { loading: true, error: "", categories: [] };
    this._template = Handlebars.compile(CATEGORIES_TEMPLATE);

    // Optional: pre-defined images for known FakeStore categories
    this._imageMap = {
      "electronics": "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
      "jewelery": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
      "men's clothing": "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1200&auto=format&fit=crop",
      "women's clothing": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop"
    };
  }

  connectedCallback() {
    this._render();
    this._loadCategories();

    // Click/keyboard activation
    this.addEventListener('click', this._onActivate.bind(this));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this._onActivate(e);
      }
    });
  }

  _onActivate(e) {
    const card = e.target.closest('[data-category]');
    if (!card) return;
    const category = card.getAttribute('data-category');
    this.dispatchEvent(new CustomEvent('SelectedCategory', {
      detail: { category },
      bubbles: true,
      composed: true
    }));
  }

  async _loadCategories() {
    try {
      const res = await fetch('https://fakestoreapi.com/products/categories');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const names = await res.json(); // ["electronics","jewelery","men's clothing","women's clothing"]

      // Build view models with image per category (map or fallback via first product)
      const categories = await Promise.all(
        names.map(async (name) => {
          let image = this._imageMap[name];
          if (!image) {
            // Fallback: fetch first product image in this category
            try {
              const pr = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(name)}`);
              if (pr.ok) {
                const list = await pr.json();
                image = list?.[0]?.image || '';
              }
            } catch { /* ignore fallback errors */ }
          }
          return { name, image: image || 'https://picsum.photos/600/400?blur=2' };
        })
      );

      this._state = { loading: false, error: "", categories };
    } catch (err) {
      console.error(err);
      this._state = { loading: false, error: 'Kunde inte hämta kategorier. Prova igen.', categories: [] };
    } finally {
      this._render();
    }
  }

  _render() {
    this.innerHTML = this._template(this._state);
  }
}

customElements.define('categories-list', CategoriesList);
