// js/components/products-list.js

// Handlebars-mall för produktlistan. Vi fyller in data i {{...}}.
const PRODUCTS_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <!-- Visar rubrik + vald kategori om den finns -->
        <h5 class="card-title mb-0">Produkter{{#if currentCategory}} – {{currentCategory}}{{/if}}</h5>
      </div>

      <!-- Filter- och sorteringskontroller -->
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
        <!-- Enkel laddningsindikator -->
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar produkter…</span>
        </div>
      {{else if error}}
        <!-- Felmeddelande om något gick fel -->
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else if products.length}}
        <!-- Rutnät som anpassar sig 1/2/3 kolumner beroende på skärmstorlek -->
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {{#each products}}
            <div class="col">
              <div class="card h-100">
                <!-- [Prestanda] loading="lazy" = bilder laddas först när de är nära att synas -->
                <img loading="lazy" src="{{image}}" class="card-img-top p-3" alt="{{title}}" style="object-fit:contain; height:200px;">
                <div class="card-body d-flex flex-column">
                  <!-- Titel. Lägg gärna till .line-clamp-2 i din CSS om du vill kapa långa titlar -->
                  <h6 class="card-title flex-grow-1">{{title}}</h6>

                  <!-- Pris + rating-chip i samma rad -->
                  <p class="mb-2 d-flex align-items-center gap-2">
                    <strong>{{currency price}}</strong>
                    {{#if rating}}
                      <span class="badge text-bg-light"
                            aria-label="Betyg {{rating.rate}} av 5 baserat på {{rating.count}} omdömen">
                        ⭐ {{rating.rate}} ({{rating.count}})
                      </span>
                    {{/if}}
                  </p>

                  <!-- Åtgärdsknappar: Visa mer info + Quick-add (+) -->
                  <div class="d-flex gap-2 mt-auto">
                    <!-- Knapp som öppnar produkten i detaljvy -->
                    <button type="button" class="btn btn-sm btn-primary" data-id="{{id}}">
                      Visa mer info
                    </button>

                    <!-- [NY] Quick-add: lägger direkt i kundvagnen (kvantitet 1) -->
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-success"
                      data-quickadd="{{id}}"
                      aria-label="Lägg {{title}} i kundvagnen">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {{/each}}
        </div>
      {{else}}
        <!-- Om inga produkter matchar filtren -->
        <p>Inga produkter matchar filtren.</p>
      {{/if}}
    </div>
  </div>
`;

class ProductsList extends HTMLElement {
  constructor() {
    super();

    // Enkel jämförelsehjälpare för att kunna skriva (eq a b) i templaten
    if (!Handlebars.helpers.eq) {
      Handlebars.registerHelper('eq', (a, b) => a === b);
    }

    // Valutahjälpare om den inte redan finns (ger t.ex. $12.99)
    if (!Handlebars.helpers.currency) {
      Handlebars.registerHelper('currency', (n) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
          .format(Number(n))
      );
    }

    // Förbered vår template
    this._template = Handlebars.compile(PRODUCTS_TEMPLATE);

    // Full dataset (för vald kategori) vs. det filtrerade vi faktiskt visar
    this._all = [];
    this._state = {
      loading: false,
      error: "",
      products: [],
      currentCategory: "",
      // Kontroller (sök/sort/filter)
      q: "",
      minPrice: "",
      maxPrice: "",
      sort: "relevance",
    };

    // Lyssna på när en kategori väljs från <categories-list>
    document.addEventListener('SelectedCategory', (e) => {
      this._fetchProducts(e.detail.category);
    });
  }

  connectedCallback() {
    // Första render (visar tomt läge / laddning beroende på state)
    this._render();

    // Händelsedelegering för knapparna inne i listan
    this.addEventListener('click', (e) => {
      // 1) Visa mer info (öppna detaljvy)
      const btnInfo = e.target.closest('[data-id]');
      if (btnInfo) {
        const id = btnInfo.getAttribute('data-id');
        const product = this._state.products.find(p => String(p.id) === String(id));
        if (product) {
          // Skicka event uppåt så <product-details> kan visa detaljer
          this.dispatchEvent(new CustomEvent('SelectedProduct', {
            detail: { product },
            bubbles: true,
            composed: true
          }));
        }
        return; // Viktigt: sluta här så vi inte råkar köra quick-add också
      }

      // 2) Quick-add: direkt lägg i kundvagn (kvantitet 1)
      const quick = e.target.closest('[data-quickadd]');
      if (quick) {
        const id = quick.getAttribute('data-quickadd');
        const product = this._state.products.find(p => String(p.id) === String(id));
        if (product) {
          // Skicka event uppåt så <shopping-cart> kan lägga till varan
          this.dispatchEvent(new CustomEvent('AddedToCart', {
            detail: { product, quantity: 1 },
            bubbles: true,
            composed: true
          }));
        }
      }
    });

    // Koppla in kontroller (sök/filter/sort). Måste göras efter varje render.
    this._bindControls();
  }

  // ----------- Datahämtning -----------

  // Hämtar produkter för en vald kategori från API:t
  async _fetchProducts(category) {
    // Sätt laddningsläge och nollställ fel/lista
    this._state.loading = true;
    this._state.error = "";
    this._state.products = [];
    this._state.currentCategory = category;

    // Nollställ kontroller när man byter kategori
    this._state.q = "";
    this._state.minPrice = "";
    this._state.maxPrice = "";
    this._state.sort = "relevance";

    // Rita om direkt så användaren ser att vi "laddar"
    this._render();

    try {
      const res = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      this._all = data;       // Spara originaldata
      this._applyFilters();   // Kör igenom filter/sort och visa
    } catch (err) {
      console.error(err);
      this._state.loading = false;
      this._state.error = "Kunde inte hämta produkter.";
      this._state.products = [];
      this._render();
    }
  }

  // Filtrerar/sorterar listan utifrån kontrollerna
  _applyFilters() {
    const q = this._state.q.trim().toLowerCase();
    const min = this._state.minPrice !== "" ? Number(this._state.minPrice) : null;
    const max = this._state.maxPrice !== "" ? Number(this._state.maxPrice) : null;

    let out = this._all.slice(); // Kopia av alla produkter

    // Sök i titel
    if (q) {
      out = out.filter(p => String(p.title).toLowerCase().includes(q));
    }

    // Prisintervall
    out = out.filter(p => {
      const price = Number(p.price);
      if (Number.isFinite(min) && price < min) return false;
      if (Number.isFinite(max) && price > max) return false;
      return true;
    });

    // Sortera enligt val
    const sort = this._state.sort;
    if (sort === "price-asc") {
      out.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      out.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "title-asc") {
      out.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "title-desc") {
      out.sort((a, b) => b.title.localeCompare(a.title));
    } // "relevance" = behåller originalordning

    // Uppdatera state och rendera
    this._state.loading = false;
    this._state.error = "";
    this._state.products = out;
    this._render();
  }

  // ----------- Kontroller -----------

  // Kopplar händelser till sök-/filter-/sort-fälten
  _bindControls() {
    const controls = this.querySelector('#controls');
    if (!controls) return; // Kan hända om vi renderar fel/loader

    // Debounce = vänta lite innan vi söker (så det inte blir för många uppdateringar)
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

  // ----------- Render -----------

  // Bygger HTML från template och nuvarande state
  _render() {
    this.innerHTML = this._template(this._state);
    //vi kopplar in kontrollerna efter varje render (DOM byts ut)
    this._bindControls();
  }
}

// Registrera webkomponenten så <products-list> funkar i HTML
customElements.define('products-list', ProductsList);
