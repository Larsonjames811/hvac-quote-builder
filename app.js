/* =====================================================================
 *  HVAC INSTANT QUOTE BUILDER — app logic
 *  You normally do NOT need to edit this file. All the numbers and
 *  branding live in config.js. This file reads that config, builds the
 *  form, does the math, and handles the lead.
 * ===================================================================== */
(function () {
  "use strict";

  var CFG = window.QUOTE_CONFIG;
  if (!CFG) { console.error("config.js failed to load"); return; }

  var $ = function (id) { return document.getElementById(id); };
  var state = { system: null, efficiency: "standard", addons: {} };

  /* ---------- Apply branding ---------- */
  function applyBranding() {
    var b = CFG.branding;
    document.documentElement.style.setProperty("--brand", b.primaryColor);
    document.documentElement.style.setProperty("--accent", b.accentColor);
    document.title = b.companyName + " — Instant HVAC Estimate";
    $("companyName").textContent = b.companyName;
    $("tagline").textContent = b.tagline;
    $("phoneText").textContent = b.phone;
    $("callBtn").href = b.phoneHref;
    $("resultCall").href = b.phoneHref;
    var logo = $("logo");
    if (b.logoUrl) { logo.src = b.logoUrl; logo.alt = b.companyName; }
    else { logo.hidden = true; $("companyName").className = ""; }
  }

  /* ---------- Build the form from config ---------- */
  function buildForm() {
    var sysWrap = $("systemOptions");
    Object.keys(CFG.pricing.systems).forEach(function (key, i) {
      var sys = CFG.pricing.systems[key];
      var lbl = document.createElement("label");
      lbl.className = "choice";
      lbl.innerHTML = '<input type="radio" name="system" value="' + key + '" autocomplete="off">' + sys.label;
      lbl.addEventListener("click", function () {
        state.system = key;
        markSelected(sysWrap, lbl);
      });
      sysWrap.appendChild(lbl);
      if (i === 0) state.system = key;
    });
    // Enforce the default selection (immune to browser form-state restoration).
    markSelected(sysWrap, sysWrap.querySelector(".choice"));

    var effWrap = $("effOptions");
    Object.keys(CFG.pricing.efficiency).forEach(function (key, i) {
      var eff = CFG.pricing.efficiency[key];
      var lbl = document.createElement("label");
      lbl.className = "choice";
      lbl.innerHTML = '<input type="radio" name="eff" value="' + key + '" autocomplete="off">' + eff.label;
      lbl.addEventListener("click", function () {
        state.efficiency = key;
        markSelected(effWrap, lbl);
      });
      effWrap.appendChild(lbl);
      if (i === 0) state.efficiency = key;
    });
    markSelected(effWrap, effWrap.querySelector(".choice"));

    var addWrap = $("addonOptions");
    CFG.addons.forEach(function (a) {
      var lbl = document.createElement("label");
      lbl.className = "addon";
      lbl.innerHTML = '<input type="checkbox" value="' + a.id + '" autocomplete="off">' + a.label;
      var cb = lbl.querySelector("input");
      cb.addEventListener("change", function () {
        state.addons[a.id] = cb.checked;
        lbl.classList.toggle("selected", cb.checked);
      });
      addWrap.appendChild(lbl);
    });
  }

  function markSelected(wrap, el) {
    wrap.querySelectorAll(".choice").forEach(function (n) { n.classList.remove("selected"); });
    el.classList.add("selected");
    var input = el.querySelector("input");
    if (input) input.checked = true;
  }

  /* ---------- The estimate math ---------- */
  function roundTo(n, step) { return Math.round(n / step) * step; }

  function computeTons(sqft) {
    var s = CFG.sizing;
    var rounded = Math.round((sqft / s.sqftPerTon) / s.roundToTons) * s.roundToTons;
    return Math.min(s.maxTons, Math.max(s.minTons, rounded));
  }

  function computeEstimate() {
    var p = CFG.pricing;
    var sqft = parseFloat($("sqft").value) || 2000;
    var tons = computeTons(sqft);
    var sys = p.systems[state.system];
    var effMult = p.efficiency[state.efficiency].multiplier;

    var point = (sys.base + sys.perTon * tons) * effMult;
    var low = point * (1 - p.rangeSpread);
    var high = point * (1 + p.rangeSpread);

    var addonLines = [];
    var accessMult = { low: 1, high: 1 };
    CFG.addons.forEach(function (a) {
      if (!state.addons[a.id]) return;
      if (a.kind === "flat") {
        low += a.low; high += a.high;
        addonLines.push({ label: a.label, text: money(a.low) + " – " + money(a.high) });
      } else if (a.kind === "mult") {
        accessMult.low *= a.low; accessMult.high *= a.high;
        addonLines.push({ label: a.label, text: "+" + Math.round((a.high - 1) * 100) + "%" });
      }
    });
    low *= accessMult.low; high *= accessMult.high;

    return {
      tons: tons, sqft: sqft,
      systemLabel: sys.label,
      effLabel: p.efficiency[state.efficiency].label,
      low: roundTo(low, p.roundTo),
      high: roundTo(high, p.roundTo),
      addonLines: addonLines
    };
  }

  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

  /* ---------- Render result ---------- */
  function showResult(est) {
    $("priceRange").textContent = money(est.low) + " – " + money(est.high);
    $("resultSummary").textContent =
      est.systemLabel + " · ~" + est.tons + " ton · " + est.sqft.toLocaleString() + " sq ft · " + est.effLabel;

    var rows = "<table>";
    rows += "<tr><td>System</td><td>" + est.systemLabel + "</td></tr>";
    rows += "<tr><td>Estimated size</td><td>~" + est.tons + " ton (" + est.sqft.toLocaleString() + " sq ft)</td></tr>";
    rows += "<tr><td>Efficiency</td><td>" + est.effLabel + "</td></tr>";
    est.addonLines.forEach(function (a) { rows += "<tr><td>" + a.label + "</td><td>" + a.text + "</td></tr>"; });
    rows += "</table>";
    $("howDetail").innerHTML = rows;

    $("quoteForm").hidden = true;
    var r = $("result");
    r.hidden = false;
    r.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Lead delivery ---------- */
  function deliverLead(lead) {
    try {
      var saved = JSON.parse(localStorage.getItem("hvac_leads") || "[]");
      saved.push(lead);
      localStorage.setItem("hvac_leads", JSON.stringify(saved));
    } catch (e) { /* ignore storage errors */ }

    var url = CFG.leads.webhookUrl;
    if (url) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }).catch(function (e) { console.warn("webhook failed", e); });
      return;
    }

    if (CFG.leads.ownerEmail) {
      var body = encodeURIComponent(
        "New HVAC estimate request\n\n" +
        "Name: " + lead.name + "\nPhone: " + lead.phone + "\nEmail: " + lead.email + "\n" +
        "Address: " + lead.address + "\n\n" +
        "Job: " + lead.systemLabel + " · ~" + lead.tons + " ton · " + lead.sqft + " sq ft · " + lead.effLabel + "\n" +
        "Add-ons: " + (lead.addons.join(", ") || "none") + "\n" +
        "Estimate shown: " + money(lead.low) + " – " + money(lead.high)
      );
      window.location.href = "mailto:" + CFG.leads.ownerEmail +
        "?subject=" + encodeURIComponent("New HVAC lead: " + lead.name) + "&body=" + body;
    }
  }

  /* ---------- Submit ---------- */
  function onSubmit(e) {
    e.preventDefault();
    var err = $("formError");
    err.hidden = true;

    var name = $("name").value.trim();
    var phone = $("phone").value.trim();
    if (!state.system) { return fail(err, "Please pick what you need above."); }
    if (!name) { return fail(err, "Please add your name so we can reach you."); }
    if (!phone) { return fail(err, "Please add a phone number."); }

    var est = computeEstimate();
    var lead = {
      name: name, phone: phone,
      email: $("email").value.trim(),
      address: $("address").value.trim(),
      system: state.system, systemLabel: est.systemLabel,
      efficiency: state.efficiency, effLabel: est.effLabel,
      sqft: est.sqft, tons: est.tons,
      addons: Object.keys(state.addons).filter(function (k) { return state.addons[k]; }),
      low: est.low, high: est.high,
      submittedAt: new Date().toISOString()
    };

    deliverLead(lead);
    showResult(est);
  }

  function fail(err, msg) { err.textContent = msg; err.hidden = false; err.scrollIntoView({ behavior: "smooth", block: "center" }); }

  function restart() {
    $("result").hidden = true;
    $("quoteForm").hidden = false;
    $("quoteForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Init ---------- */
  applyBranding();
  buildForm();
  $("quoteForm").addEventListener("submit", onSubmit);
  $("restartBtn").addEventListener("click", restart);
})();
