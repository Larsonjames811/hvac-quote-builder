/* =====================================================================
 *  HVAC INSTANT QUOTE BUILDER — app logic
 *  You normally do NOT need to edit this file. All the numbers and
 *  branding live in config.js. This file just reads that config,
 *  builds the form, does the math, and handles the lead.
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
    if (b.logoUrl) { var l = $("logo"); l.src = b.logoUrl; l.hidden = false; }
  }

  /* ---------- Build the form from config ---------- */
  function buildForm() {
    // System type cards
    var sysWrap = $("systemOptions");
    Object.keys(CFG.pricing.systems).forEach(function (key, i) {
      var sys = CFG.pricing.systems[key];
      var lbl = document.createElement("label");
      lbl.className = "choice";
      lbl.innerHTML = '<input type="radio" name="system" value="' + key + '">' + sys.label;
      lbl.addEventListener("click", function () {
        state.system = key;
        markSelected(sysWrap, lbl, "choice");
        updateProgress();
      });
      sysWrap.appendChild(lbl);
      if (i === 0) { state.system = key; lbl.classList.add("selected"); lbl.querySelector("input").checked = true; }
    });

    // Efficiency row
    var effWrap = $("effOptions");
    Object.keys(CFG.pricing.efficiency).forEach(function (key, i) {
      var eff = CFG.pricing.efficiency[key];
      var lbl = document.createElement("label");
      lbl.className = "choice" + (i === 0 ? " selected" : "");
      lbl.innerHTML = '<input type="radio" name="eff" value="' + key + '"' + (i === 0 ? " checked" : "") + ">" + eff.label;
      lbl.addEventListener("click", function () {
        state.efficiency = key;
        markSelected(effWrap, lbl, "choice");
      });
      effWrap.appendChild(lbl);
    });

    // Add-ons
    var addWrap = $("addonOptions");
    CFG.addons.forEach(function (a) {
      var lbl = document.createElement("label");
      lbl.className = "addon";
      lbl.innerHTML = '<input type="checkbox" value="' + a.id + '">' + a.label;
      var cb = lbl.querySelector("input");
      cb.addEventListener("change", function () {
        state.addons[a.id] = cb.checked;
        lbl.classList.toggle("selected", cb.checked);
      });
      addWrap.appendChild(lbl);
    });
  }

  function markSelected(wrap, el, cls) {
    wrap.querySelectorAll("." + cls).forEach(function (n) { n.classList.remove("selected"); });
    el.classList.add("selected");
    var input = el.querySelector("input");
    if (input) input.checked = true;
  }

  function updateProgress() {
    var fields = [state.system, $("sqft").value, $("name").value, $("phone").value];
    var done = fields.filter(function (v) { return v && String(v).trim(); }).length;
    $("progressBar").style.width = Math.round((done / fields.length) * 100) + "%";
  }

  /* ---------- The estimate math ---------- */
  function roundTo(n, step) { return Math.round(n / step) * step; }

  function computeTons(sqft) {
    var s = CFG.sizing;
    var raw = sqft / s.sqftPerTon;
    var rounded = Math.round(raw / s.roundToTons) * s.roundToTons;
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
      tons: tons,
      sqft: sqft,
      systemLabel: sys.label,
      effLabel: p.efficiency[state.efficiency].label,
      low: roundTo(low, p.roundTo),
      high: roundTo(high, p.roundTo),
      base: roundTo(point, p.roundTo),
      addonLines: addonLines
    };
  }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  /* ---------- Render result ---------- */
  function showResult(est) {
    $("priceRange").textContent = money(est.low) + " – " + money(est.high);
    $("resultSummary").textContent =
      est.systemLabel + " · ~" + est.tons + " ton · " +
      est.sqft.toLocaleString() + " sq ft · " + est.effLabel;

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
    // 1) Always save locally so nothing is ever lost.
    try {
      var saved = JSON.parse(localStorage.getItem("hvac_leads") || "[]");
      saved.push(lead);
      localStorage.setItem("hvac_leads", JSON.stringify(saved));
    } catch (e) { /* ignore storage errors */ }

    // 2) Preferred: POST to a webhook (n8n / Make / Zapier / GHL).
    var url = CFG.leads.webhookUrl;
    if (url) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }).catch(function (e) { console.warn("webhook failed", e); });
      return;
    }

    // 3) Fallback: open a pre-filled email to the owner.
    if (CFG.leads.ownerEmail) {
      var body = encodeURIComponent(
        "New HVAC estimate request\n\n" +
        "Name: " + lead.name + "\nPhone: " + lead.phone + "\nEmail: " + lead.email + "\n" +
        "Address: " + lead.address + "\nBest time: " + lead.contactTime + "\n\n" +
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
    if (!state.system) { return fail(err, "Please pick what you need in step 1."); }
    if (!name) { return fail(err, "Please add your name so we can reach you."); }
    if (!phone) { return fail(err, "Please add a phone number."); }

    var est = computeEstimate();
    var lead = {
      name: name,
      phone: phone,
      email: $("email").value.trim(),
      address: $("address").value.trim(),
      contactTime: $("contactTime").value,
      system: state.system,
      systemLabel: est.systemLabel,
      efficiency: state.efficiency,
      effLabel: est.effLabel,
      sqft: est.sqft,
      tons: est.tons,
      addons: Object.keys(state.addons).filter(function (k) { return state.addons[k]; }),
      low: est.low,
      high: est.high,
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
  ["sqft", "name", "phone"].forEach(function (id) { $(id).addEventListener("input", updateProgress); });
  $("quoteForm").addEventListener("submit", onSubmit);
  $("restartBtn").addEventListener("click", restart);
  updateProgress();
})();
