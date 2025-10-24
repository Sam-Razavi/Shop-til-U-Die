// js/components/categories-list.js

// Handlebars-mall för lista med kategorier.
// Visar loader, felmeddelande eller själva kategorikorten i ett responsivt rutnät.
const CATEGORIES_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Kategorier</h5>

      {{#if loading}}
        <!-- Enkel "spinner" medan vi hämtar kategorier -->
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar kategorier…</span>
        </div>
      {{else if error}}
        <!-- Felmeddelande om hämtningen misslyckas -->
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else}}
        <!-- Rutnät: 1 kolumn på mobil, 2 på mellanstora skärmar, 4 på stora -->
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
          {{#each categories}}
            <div class="col">
              <!-- Varje kategori visas som ett "card". -->
              <!-- role="button" + tabindex="0" gör kortet fokuserbart/tryckbart med tangentbord -->
              <div class="card h-100 category-card"
                   data-category="{{this.name}}"
                   role="button"
                   tabindex="0"
                   aria-label="Visa produkter i {{this.name}}"
                   aria-pressed="false"> <!-- [NYTT] initiera otilltryckt (ej vald) -->
                <!-- [NYTT] loading="lazy" = ladda bilder först när de kommer i bild (snabbare) -->
                <img loading="lazy" src="{{this.image}}" alt="Kategori: {{this.name}}" class="category-thumb">
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
    // Internt state: om vi laddar, ev. fel, samt själva kategorierna
    this._state = { loading: true, error: "", categories: [] };

    // Kompilera vår Handlebars-mall en gång
    this._template = Handlebars.compile(CATEGORIES_TEMPLATE);

    // Förvalda representativa bilder för de fyra FakeStore-kategorierna (om vi inte hittar en fallback)
    this._imageMap = {
      "electronics": "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
      "jewelery": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
      "men's clothing": "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1200&auto=format&fit=crop",
      "women's clothing": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop"
    };
  }

  connectedCallback() {
    // Första render (visar loader)
    this._render();
    // Hämta kategorier från API
    this._loadCategories();

    // Klick på kort -> aktivera kategori
    this.addEventListener('click', this._onActivate.bind(this));

    // Tangentbordsstöd: Enter eller Space aktiverar samma sak som klick
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();        // [NYTT] hindra Space från att scrolla sidan
        this._onActivate(e);
      }
    });
  }

  // Aktivera vald kategori (klick/Enter/Space)
  _onActivate(e) {
    // Hitta närmaste element som har data-category (själva kortet)
    const card = e.target.closest('[data-category]');
    if (!card) return;

    // [NYTT] Tillgänglighet: sätt aria-pressed på vald och ta bort på övriga
    this.querySelectorAll('[data-category]').forEach(c => c.setAttribute('aria-pressed', 'false'));
    card.setAttribute('aria-pressed', 'true');

    // Plocka ut kategorinamnet
    const category = card.getAttribute('data-category');

    // Skicka ett custom event uppåt så <products-list> kan hämta rätt produkter
    this.dispatchEvent(new CustomEvent('SelectedCategory', {
      detail: { category },
      bubbles: true,
      composed: true
    }));
  }

  // Hämta kategorier från FakeStore API och bygg vy-modeller med bilder
  async _loadCategories() {
    try {
      const res = await fetch('https://fakestoreapi.com/products/categories');
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      // Exempel: ["electronics","jewelery","men's clothing","women's clothing"]
      const names = await res.json();

      // För varje kategori: försök hitta en representativ bild (map eller första produkt i kategorin)
      const categories = await Promise.all(
        names.map(async (name) => {
          let image = this._imageMap[name];
          if (!image) {
            // Fallback: hämta första produktbilden i kategorin
            try {
              const pr = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(name)}`);
              if (pr.ok) {
                const list = await pr.json();
                image = list?.[0]?.image || '';
              }
            } catch {
              // Ignorera fel i fallbacken, vi sätter default nedan
            }
          }
          // Om vi fortfarande inte har bild -> sätt en neutral placeholder
          return { name, image: image || 'https://picsum.photos/600/400?blur=2' };
        })
      );

      // Uppdatera state: nu är vi klara med laddning och har kategorierna
      this._state = { loading: false, error: "", categories };
    } catch (err) {
      console.error(err);
      // Vid fel: visa felmeddelande
      this._state = { loading: false, error: 'Kunde inte hämta kategorier. Prova igen.', categories: [] };
    } finally {
      // Rita om oavsett om det gick eller inte
      this._render();
    }
  }

  // Render: fyll mallen med data och stoppa in HTML:en i komponenten
  _render() {
    this.innerHTML = this._template(this._state);
  }
}

// Registrera webkomponenten så <categories-list> fungerar i HTML
customElements.define('categories-list', CategoriesList);
