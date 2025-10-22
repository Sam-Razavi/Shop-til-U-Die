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
        <div class="list-group">
          {{#each categories}}
            <button type="button"
                    class="list-group-item list-group-item-action"
                    data-category="{{this}}">
              {{this}}
            </button>
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
  }

  connectedCallback() {
    this._render();
    this._loadCategories();
    // Event delegation for clicks on category buttons
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      const category = btn.getAttribute('data-category');
      // Dispatch a CustomEvent that bubbles so the app can listen
      this.dispatchEvent(new CustomEvent('SelectedCategory', {
        detail: { category },
        bubbles: true,
        composed: true
      }));
    });
  }

  async _loadCategories() {
    try {
      // Fake Store API: returns ["electronics","jewelery","men's clothing","women's clothing"]
      const res = await fetch('https://fakestoreapi.com/products/categories');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      this._state = { loading: false, error: "", categories: data };
    } catch (err) {
      this._state = { loading: false, error: 'Kunde inte hämta kategorier. Prova igen.', categories: [] };
      console.error(err);
    } finally {
      this._render();
    }
  }

  _render() {
    this.innerHTML = this._template(this._state);
  }
}

customElements.define('categories-list', CategoriesList);
