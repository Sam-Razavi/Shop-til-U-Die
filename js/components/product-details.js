// js/components/product-details.js

// Handlebars-mall för hur produktdetaljer ska se ut i HTML
const DETAILS_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Produkt</h5>

      {{#if loading}}
        <!-- Visar en liten spinner när vi laddar data -->
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Laddar produkt…</span>
        </div>
      {{else if error}}
        <!-- Visar felmeddelande om något gick fel -->
        <div class="alert alert-danger mb-0">{{error}}</div>
      {{else if product}}
        <!-- När vi har en produkt att visa -->
        <div class="row g-3 align-items-start">
          <div class="col-12 col-md-4">
            <!-- Produktbild -->
            <!-- loading="lazy" = laddar bilden först när den är nära att synas (bättre prestanda) -->
            <img loading="lazy" src="{{product.image}}" alt="{{product.title}}"
                 class="img-fluid border rounded p-3 card-img-top"
                 style="object-fit:contain; max-height:280px;">
          </div>

          <div class="col-12 col-md-8">
            <!-- Produktens titel -->
            <h6 class="mb-2">{{product.title}}</h6>

            <!-- Kategori-badge -->
            <p class="mb-1">
              <span class="badge text-bg-secondary">{{product.category}}</span>
            </p>

            <!-- Pris + litet "rating-chip" i samma rad -->
            <p class="fs-5 fw-semibold mb-2 d-flex align-items-center gap-2">
              <!-- Visar priset med vår currency-hjälpare -->
              {{currency product.price}}

              <!-- Om rating finns, visa en liten badge med betyg och antal omdömen -->
              {{#if product.rating}}
                <span class="badge text-bg-light"
                      aria-label="Betyg {{product.rating.rate}} av 5 baserat på {{product.rating.count}} omdömen">
                  ⭐ {{product.rating.rate}} ({{product.rating.count}})
                </span>
              {{/if}}
            </p>

            <!-- Produktbeskrivning -->
            <p class="mb-3">{{product.description}}</p>

            <!-- Antal + Lägg i kundvagn-knapp -->
            <div class="d-flex gap-2 align-items-center">
              <!-- Label kopplad till input för bättre tillgänglighet (skjuts undan visuellt) -->
              <label for="qty" class="visually-hidden">Antal</label>

              <!-- Antalsfält: min=1 för att undvika noll/negativt, smal maxbredd -->
              <!-- inputmode och aria-describedby gör det tydligare för skärmläsare/mobilt tangentbord -->
              <input type="number" class="form-control" id="qty" value="1" min="1"
                     inputmode="numeric" aria-describedby="qtyHelp" style="max-width:120px">
              <span id="qtyHelp" class="visually-hidden">Ange antal du vill lägga i kundvagnen</span>

              <!-- Knapp som skickar event "AddedToCart" uppåt -->
              <button type="button" class="btn btn-primary" id="btnAddToCart">Lägg i kundvagn</button>
            </div>
          </div>
        </div>
      {{else}}
        <!-- Om ingen produkt är vald ännu -->
        <p>Välj en produkt för att se detaljer.</p>
      {{/if}}
    </div>
  </div>
`;

class ProductDetails extends HTMLElement {
  constructor() {
    super();

    // Internt "state" där vi sparar om vi laddar, fel, och själva produkten
    this._state = { loading: false, error: "", product: null };

    // --- Handlebars-hjälpare (registreras en gång) ---
    // currency: formaterar tal som valuta (t.ex. $12.99)
    if (!Handlebars.helpers.currency) {
      Handlebars.registerHelper('currency', (n) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
          .format(Number(n))
      );
    }

    // stars: om du vill visa ★★★★☆ baserat på t.ex. 4.3 i rating
    if (!Handlebars.helpers.stars) {
      Handlebars.registerHelper('stars', (rating = 0) => {
        const r = Math.max(0, Math.min(5, Math.round(Number(rating))));
        // Returnerar en sträng som ser ut som "★★★★☆"
        return '★★★★★☆☆☆☆☆'.slice(5 - r, 10 - r);
      });
    }

    // Förbered mallen för att kunna fyllas med data
    this._template = Handlebars.compile(DETAILS_TEMPLATE);

    // Lyssna globalt: när en produkt valts i products-list så får vi ett event här
    document.addEventListener('SelectedProduct', (e) => {
      this._showProduct(e.detail.product);
    });
  }

  connectedCallback() {
    // Första rendering: visar "välj en produkt…" läget
    this._render();

    // Händelsedelegering: lyssna på klick på knappen "Lägg i kundvagn"
    this.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btnAddToCart') {
        // Hämta antal från inputfältet (minst 1)
        const qtyInput = this.querySelector('#qty');
        const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
        if (!this._state.product) return;

        // Skicka ett anpassat event uppåt i DOM:en så <shopping-cart> kan lägga till varan
        this.dispatchEvent(new CustomEvent('AddedToCart', {
          detail: { product: this._state.product, quantity: qty },
          bubbles: true,
          composed: true
        }));
      }
    });
  }

  // Sätt vald produkt i state och rita om
  _showProduct(product) {
    this._state = { loading: false, error: "", product };
    this._render();
  }

  // Render: fyller mallen med state och stoppar in HTML:en i denna komponent
  _render() {
    this.innerHTML = this._template(this._state);
  }
}

// Registrera webkomponenten så vi kan använda <product-details> i HTML
customElements.define('product-details', ProductDetails);
