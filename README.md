# Instant HVAC Quote Builder

A simple, mobile-friendly web page that gives homeowners an **instant ballpark
estimate** for a new HVAC system and **captures them as a lead** — so you stop
driving out to quote jobs that were never in your price range.

> **Why a range, not an exact price?** Every install is different, and a hard
> number on a website is one you'll get held to. This tool gives a smart
> ballpark so the customer self-qualifies on budget *before* you drive out, and
> hands you their contact info + job details either way. The exact price is
> still confirmed at your in-home visit.

It's a plain web page — no accounts, no monthly software fee, no database to run.

---

## See it / use it

Open `index.html` in any browser to preview. To put it online, pick one (all free):

| Option | How |
|---|---|
| **Netlify Drop** (easiest) | Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag this whole folder onto the page. You get a live link in ~10 seconds. |
| **Vercel** | Import the GitHub repo at [vercel.com/new](https://vercel.com/new) — no build settings needed. |
| **GitHub Pages** | In the repo: Settings → Pages → deploy from `main` branch, root folder. |

Then link to it from your website, Google Business profile, or text it to leads.

---

## Make it yours — edit one file: `config.js`

Open **`config.js`** in any text editor. Everything you'd want to change is in
there with plain-English comments. You do **not** need to touch any other file.

1. **Branding** — your company name, phone number, and colors.
2. **Leads** — where estimates get sent (see below).
3. **Pricing** — *the most important part.* Replace the default prices with
   **your real numbers.** The defaults are typical 2026 U.S. installed prices,
   not yours.
4. **Add-ons** — the optional extras a customer can check off.

Save the file, refresh the page, and your changes are live.

### How the estimate is calculated

```
size (tons)   = home square footage ÷ 600   (rounded, 1.5–5 ton)
base estimate = (system base price + per-ton price × tons) × efficiency
shown range   = base estimate ± 15%, plus any add-ons
```

You control every number in that formula from `config.js`. If you tend to
install bigger systems, lower `sqftPerTon`. If your prices run higher, raise the
`base` / `perTon` numbers.

---

## Getting the leads

Every completed estimate is always shown to the customer and saved in their
browser. To get **notified**, set one of these in `config.js` under `leads`:

- **`webhookUrl`** *(recommended)* — paste a webhook from n8n, Make, Zapier, or
  GoHighLevel. The full lead (name, phone, address, job details, estimate) is
  sent there as JSON the instant they submit. Route it to a text, an email, or
  straight into your CRM.
- **`ownerEmail`** — if you don't set a webhook, the customer's submit button
  opens a pre-filled email addressed to you as a simple fallback.

The lead JSON looks like this:

```json
{
  "name": "Jane Homeowner",
  "phone": "801-555-1234",
  "email": "jane@example.com",
  "address": "123 Main St, Lehi UT",
  "contactTime": "Afternoon",
  "systemLabel": "New AC + Furnace (full system)",
  "effLabel": "High efficiency (lower bills, rebates)",
  "sqft": 2400,
  "tons": 4,
  "addons": ["ductwork"],
  "low": 14400,
  "high": 21200,
  "submittedAt": "2026-06-24T22:46:59.994Z"
}
```

---

## Files

| File | What it is |
|---|---|
| `config.js` | **Edit this.** All branding, pricing, and lead settings. |
| `index.html` | The page structure. |
| `styles.css` | The look. |
| `app.js` | The logic (builds the form, does the math). You won't need to edit this. |

---

*Estimates are for general budgeting only and are not a binding offer. Final
pricing requires an in-person assessment.*
