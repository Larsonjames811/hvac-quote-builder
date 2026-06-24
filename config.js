/* =====================================================================
 *  HVAC INSTANT QUOTE BUILDER — CONFIG
 *  ---------------------------------------------------------------------
 *  This is the ONLY file you need to edit to make this yours.
 *  No coding knowledge required — just change the values inside the
 *  quotes and numbers. Save the file, refresh the page, done.
 *
 *  Sections:
 *    1. BRANDING      — your company name, phone, colors
 *    2. LEADS         — where new customer estimates get sent
 *    3. SIZING        — how square footage maps to system size (tonnage)
 *    4. PRICING       — the dollars. Tune these to YOUR real numbers.
 *    5. ADD-ONS       — optional extras the customer can select
 * ===================================================================== */

window.QUOTE_CONFIG = {

  /* ---------------------------------------------------------------
   * 1. BRANDING
   * ------------------------------------------------------------- */
  branding: {
    companyName: "Your HVAC Company",        // <-- put your business name here
    tagline: "Instant ballpark estimate in 60 seconds",
    phone: "(801) 555-0100",                 // <-- your phone, shown on the page
    phoneHref: "tel:+18015550100",           // <-- same number, digits only after +1
    primaryColor: "#0c6cf2",                 // main brand color (buttons, accents)
    accentColor: "#0a9b6c",                  // success / price color (green)
    logoUrl: ""                              // optional: paste an image URL, or leave blank
  },

  /* ---------------------------------------------------------------
   * 2. LEADS — where a submitted estimate goes
   * ------------------------------------------------------------- *
   * Every lead is ALWAYS shown on screen and saved in the browser.
   * To actually get notified, set ONE of these:
   *
   *   a) webhookUrl — paste a webhook from n8n / Make / Zapier / GoHighLevel.
   *      The full lead (name, phone, sqft, estimate, etc.) is POSTed there
   *      as JSON. This is the recommended, hands-off option.
   *
   *   b) ownerEmail — if no webhook is set, the customer's "Send" button
   *      opens their email app pre-filled to you as a fallback.
   * ------------------------------------------------------------- */
  leads: {
    webhookUrl: "",                          // e.g. "https://hooks.your-n8n.com/webhook/hvac-lead"
    ownerEmail: "owner@yourhvac.com"         // fallback if no webhook
  },

  /* ---------------------------------------------------------------
   * 3. SIZING — square footage -> system size (tons)
   * ------------------------------------------------------------- *
   * Rule of thumb: ~1 ton of capacity per 500 sq ft (good middle
   * number for Utah). Lower the number = bigger systems quoted.
   * ------------------------------------------------------------- */
  sizing: {
    sqftPerTon: 600,
    minTons: 1.5,
    maxTons: 5,
    roundToTons: 0.5
  },

  /* ---------------------------------------------------------------
   * 4. PRICING — the dollars. EDIT THESE TO YOUR REAL NUMBERS.
   * ------------------------------------------------------------- *
   * Each estimate is:  (base + perTon * tons) * efficiency multiplier
   * Then a range is shown: estimate minus/plus the "spread" below.
   *
   * Defaults are calibrated to typical 2026 U.S. installed prices.
   * A 3-ton full system here lands around $9.5k base / ~$13k high-eff.
   * Plug in what YOU actually charge.
   * ------------------------------------------------------------- */
  pricing: {
    rangeSpread: 0.15,        // show price +/- 15% as a range
    roundTo: 100,             // round displayed prices to nearest $100

    systems: {
      full_system: { label: "New AC + Furnace (full system)", base: 4000, perTon: 1800 },
      ac_only:     { label: "Air Conditioner only",           base: 2000, perTon: 1300 },
      furnace_only:{ label: "Furnace only",                   base: 2500, perTon: 700  },
      heat_pump:   { label: "Heat Pump system",               base: 3500, perTon: 2000 },
      mini_split:  { label: "Ductless Mini-Split",            base: 3500, perTon: 2200 }
    },

    efficiency: {
      standard: { label: "Standard efficiency", multiplier: 1.0 },
      high:     { label: "High efficiency (lower bills, rebates)", multiplier: 1.35 }
    }
  },

  /* ---------------------------------------------------------------
   * 5. ADD-ONS — optional extras (added to the range)
   * ------------------------------------------------------------- *
   * "kind: flat"   adds a dollar range (low + high).
   * "kind: mult"   multiplies the whole estimate (e.g. hard access).
   * ------------------------------------------------------------- */
  addons: [
    { id: "ductwork",   label: "Replace / add ductwork",        kind: "flat", low: 2000, high: 5000 },
    { id: "thermostat", label: "Smart thermostat",              kind: "flat", low: 250,  high: 500  },
    { id: "haulaway",   label: "Haul away & dispose old system",kind: "flat", low: 300,  high: 800  },
    { id: "access",     label: "Attic / tight or difficult access", kind: "mult", low: 1.08, high: 1.15 }
  ]
};
