(() => {
  "use strict";
  const root = document.querySelector("[data-tr]");
  if (!root || !window.MC) return;
  const { el, normItem, ITEM_RE, isInt, copyText, downloadText, store } = MC;
  MC.addItemList();
  const $ = (s) => root.querySelector(s);
  const tiersBox = $("[data-tr-tiers]"), outEl = $("[data-tr-out]"), errBox = $("[data-tr-errors]"), pvBox = $("[data-tr-preview]");
  const pathIn = $("[data-tr-path]"), nameIn = $("[data-tr-name]"), pathNote = $("[data-tr-pathnote]");
  const copyBtn = $("[data-tr-copy]"), dlBtn = $("[data-tr-download]");
  const entOut = $("[data-tr-ent]"), entCopy = $("[data-tr-ent-copy]");
  const saved = store("ollaloll.trades.v1");

  const newTrade = () => ({ w1: "", q1: "1", w2: "", q2: "1", pm: "", g: "", gq: "1", uses: "", texp: "", rew: true });
  const newTier = (i) => ({ xp: i ? String(i * 10) : "", mode: "all", pick: "1", trades: [newTrade()] });
  const fresh = () => ({ path: "", name: "", tiers: [newTier(0)] });
  let state = saved.load();
  const okShape = (s) => s && Array.isArray(s.tiers) && s.tiers.length && s.tiers.every((t) => t && Array.isArray(t.trades) && t.trades.length);
  if (!okShape(state)) state = fresh();
  ["path", "name"].forEach((k) => { if (typeof state[k] !== "string") state[k] = ""; });

  const pretty = (id) => id.replace(/^minecraft:/, "").replace(/_/g, " ");
  const numStr = (v) => String(v).trim();

  /* ---------- build + validate ---------- */
  function build() {
    const errors = [];
    const err = (m) => errors.push(m);
    const tiers = [];
    let prevXp = 0;
    state.tiers.forEach((tier, ti) => {
      const T = "Tier " + (ti + 1) + ": ";
      const out = {};
      if (ti > 0) {
        const x = numStr(tier.xp);
        if (!isInt(x) || +x < 0 || +x > 100000) err(T + "“XP needed” must be a whole number, like 10.");
        else if (+x <= prevXp) err(T + "“XP needed” must be higher than the tier before (" + prevXp + ").");
        else { out.total_exp_required = +x; prevXp = +x; }
      }
      const trades = [];
      tier.trades.forEach((tr, i) => {
        const R = T + "Trade " + (i + 1) + ": ";
        let ok = true;
        const it = (raw, what) => {
          const n = normItem(raw);
          if (!n) { err(R + what + ": choose an item, like minecraft:emerald."); ok = false; return null; }
          if (!ITEM_RE.test(n)) { err(R + what + ": “" + n + "” isn't a valid item ID (lowercase letters, digits and underscores)."); ok = false; return null; }
          return n;
        };
        const qty = (v, what) => {
          const s = numStr(v);
          if (!isInt(s) || +s < 1 || +s > 64) { err(R + what + " amount must be a whole number from 1 to 64."); ok = false; return null; }
          return +s;
        };
        const wants = [];
        const i1 = it(tr.w1, "Player gives"), q1 = qty(tr.q1, "Player gives");
        const w = { item: i1, quantity: q1 };
        const pm = numStr(tr.pm);
        if (pm) {
          if (!/^\d+(\.\d+)?$/.test(pm) || +pm > 10) { err(R + "price change must be a number from 0 to 10 (like 0.05), or empty."); ok = false; }
          else w.price_multiplier = +pm;
        }
        wants.push(w);
        if (tr.w2.trim()) { const i2 = it(tr.w2, "Second item"), q2 = qty(tr.q2, "Second item"); wants.push({ item: i2, quantity: q2 }); }
        const g = it(tr.g, "Player gets"), gq = qty(tr.gq, "Player gets");
        const o = { wants, gives: [{ item: g, quantity: gq }] };
        const u = numStr(tr.uses);
        if (u) { if (!isInt(u) || +u < -1 || +u > 9999) { err(R + "uses must be a whole number from 1 to 9999, or -1 for unlimited."); ok = false; } else o.max_uses = +u; }
        if (tr.rew === false) o.reward_exp = false;
        const te = numStr(tr.texp);
        if (te) { if (!isInt(te) || +te < 0 || +te > 1000) { err(R + "trader XP must be a whole number from 0 to 1000."); ok = false; } else o.trader_exp = +te; }
        if (ok) trades.push(o);
      });
      if (tier.mode === "random") {
        const n = numStr(tier.pick);
        if (!isInt(n) || +n < 1 || +n > tier.trades.length) err(T + "“random trades” must be a whole number from 1 to " + tier.trades.length + " (the number of trades in this tier).");
        out.groups = [{ num_to_select: isInt(n) ? +n : 1, trades }];
      } else out.trades = trades;
      tiers.push(out);
    });
    const p = state.path.trim();
    if (p && !/^[a-z0-9_]+(\/[a-z0-9_]+)*$/.test(p)) err("The file name can only use lowercase letters, digits, underscores and slashes (like mypack/my_trades).");
    return { json: { tiers }, errors };
  }

  /* ---------- preview ---------- */
  function slot(id, q) {
    const s = el("span", "tr-slot" + (id ? "" : " is-empty"));
    s.append(el("span", "tr-slot-n", id ? pretty(normItem(id)) : "?"));
    if (id && +q > 1) s.append(el("span", "tr-slot-q", "×" + q));
    return s;
  }
  function preview() {
    pvBox.textContent = "";
    state.tiers.forEach((tier, ti) => {
      const h = el("h3", "tr-pv-h", "Tier " + (ti + 1) + (ti ? " · unlocks at " + (numStr(tier.xp) || "?") + " XP" : " · available from the start"));
      pvBox.append(h);
      if (tier.mode === "random") pvBox.append(el("p", "bd-hint", "Each trader gets " + (numStr(tier.pick) || "?") + " of these at random."));
      tier.trades.forEach((tr) => {
        const row = el("div", "tr-pv-row");
        const left = el("div", "tr-pv-want"); left.append(slot(tr.w1.trim(), tr.q1)); if (tr.w2.trim()) left.append(slot(tr.w2.trim(), tr.q2));
        row.append(left, el("span", "tr-pv-arrow", "→"), slot(tr.g.trim(), tr.gq));
        const u = numStr(tr.uses);
        row.append(el("span", "tr-pv-meta", (u === "-1" ? "unlimited uses" : (u || "7") + " uses") + (tr.rew === false ? "" : " · XP orbs")));
        pvBox.append(row);
      });
    });
  }

  /* ---------- output ---------- */
  function update() {
    const { json, errors } = build();
    errBox.textContent = ""; errBox.hidden = !errors.length;
    errors.forEach((m) => errBox.append(el("p", null, m)));
    const ok = !errors.length;
    outEl.textContent = ok ? JSON.stringify(json, null, 2) : "Your trade table appears here once everything above is filled in.";
    outEl.classList.toggle("is-placeholder", !ok);
    [copyBtn, dlBtn].forEach((b) => b.setAttribute("aria-disabled", ok ? "false" : "true"));
    const p = state.path.trim() || "my_trades";
    pathNote.textContent = "Save as trading/" + p + ".json in your behavior pack.";
    const comp = { "minecraft:trade_table": { display_name: state.name.trim() || "Trader", table: "trading/" + p + ".json", new_screen: true }, "minecraft:trade_resupply": {} };
    entOut.textContent = JSON.stringify(comp, null, 2);
    preview();
    store("ollaloll.trades.v1").save(state);
  }

  /* ---------- UI ---------- */
  function input(value, attrs, onInput) {
    const i = el("input"); i.value = value;
    Object.entries(Object.assign({ type: "text", autocomplete: "off", autocapitalize: "none", spellcheck: "false" }, attrs || {})).forEach(([k, v]) => i.setAttribute(k, v));
    i.addEventListener("input", () => { onInput(i.value); update(); });
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } });
    return i;
  }
  const field = (label, inp, cls) => { const w = el("label", "bd-f" + (cls ? " " + cls : "")); w.append(el("span", "bd-f-l", label), inp); return w; };
  const itemIn = (v, ph, label, set) => input(v, { list: "mc-items", placeholder: ph, "aria-label": label, enterkeyhint: "next" }, set);
  const numIn = (v, label, set, ph) => input(v, { inputmode: "numeric", "aria-label": label, placeholder: ph || "", enterkeyhint: "done" }, set);

  function render() {
    tiersBox.textContent = "";
    state.tiers.forEach((tier, ti) => {
      const card = el("section", "panel bd-pool");
      const head = el("div", "bd-pool-head");
      head.append(el("h2", null, "Tier " + (ti + 1)));
      if (state.tiers.length > 1) {
        const rm = el("button", "btn btn-ghost btn-small", "Remove tier"); rm.type = "button";
        rm.addEventListener("click", () => { state.tiers.splice(ti, 1); render(); update(); });
        head.append(rm);
      }
      card.append(head);

      const opts = el("div", "tr-tier-opts");
      if (ti > 0) opts.append(field("XP needed to unlock", numIn(tier.xp, "XP needed to unlock this tier", (v) => { tier.xp = v; }, "10")));
      else opts.append(el("p", "bd-hint tr-first", "The first tier is open from the start."));
      const sel = el("select"); sel.setAttribute("aria-label", "How many trades to offer");
      [["all", "Offer all trades"], ["random", "Offer a random few"]].forEach(([v, t]) => { const o = el("option", null, t); o.value = v; if (tier.mode === v) o.selected = true; sel.append(o); });
      sel.addEventListener("change", () => { tier.mode = sel.value; render(); update(); });
      const selWrap = el("div", "bd-f"); selWrap.append(el("span", "bd-f-l", "Trades shown"), MC.dropdown(sel));
      opts.append(selWrap);
      if (tier.mode === "random") opts.append(field("How many", numIn(tier.pick, "How many random trades", (v) => { tier.pick = v; }, "1")));
      card.append(opts);

      const list = el("ul", "bd-entries");
      tier.trades.forEach((tr, i) => {
        const li = el("li", "bd-entry");
        const top = el("div", "bd-entry-top");
        top.append(el("strong", "tr-trade-n", "Trade " + (i + 1)));
        const rm = el("button", "bd-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "Remove trade " + (i + 1));
        if (tier.trades.length > 1) rm.addEventListener("click", () => { tier.trades.splice(i, 1); render(); update(); }); else rm.hidden = true;
        top.append(rm); li.append(top);

        const give = el("div", "tr-row");
        give.append(field("Player gives", itemIn(tr.w1, "minecraft:emerald", "Item the player gives", (v) => { tr.w1 = v; }), "tr-grow"), field("Amount", numIn(tr.q1, "Amount the player gives", (v) => { tr.q1 = v; }), "tr-qty"));
        li.append(give);
        const give2 = el("div", "tr-row");
        give2.append(field("Second item (optional)", itemIn(tr.w2, "minecraft:book", "Second item the player gives", (v) => { tr.w2 = v; }), "tr-grow"), field("Amount", numIn(tr.q2, "Amount of the second item", (v) => { tr.q2 = v; }), "tr-qty"));
        li.append(give2);
        const get = el("div", "tr-row");
        get.append(field("Player gets", itemIn(tr.g, "minecraft:diamond", "Item the player gets", (v) => { tr.g = v; }), "tr-grow"), field("Amount", numIn(tr.gq, "Amount the player gets", (v) => { tr.gq = v; }), "tr-qty"));
        li.append(get);

        const more = el("details", "tr-more");
        more.append(el("summary", null, "More options"));
        const mrow = el("div", "bd-entry-row");
        mrow.append(
          field("Trade limit", numIn(tr.uses, "Uses before restock", (v) => { tr.uses = v; }, "7")),
          field("Trader XP", numIn(tr.texp, "XP the trader gains", (v) => { tr.texp = v; }, "1")),
          field("Price change", input(tr.pm, { inputmode: "decimal", "aria-label": "Price change with demand", placeholder: "0" }, (v) => { tr.pm = v; }))
        );
        more.append(mrow);
        const sw = el("label", "bd-switch"); const cb = el("input"); cb.type = "checkbox"; cb.checked = tr.rew !== false;
        cb.addEventListener("change", () => { tr.rew = cb.checked; update(); });
        sw.append(cb, el("span", "bd-track"), el("span", "bd-switch-text", "Player gets XP orbs"));
        sw.querySelector(".bd-track").setAttribute("aria-hidden", "true");
        more.append(sw);
        more.append(el("p", "bd-hint", "Trade limit: uses before the trader restocks (blank = 7, -1 = unlimited). Price change: how much demand raises the price (blank = none, vanilla uses 0.05 to 0.2)."));
        if (tr.uses || tr.texp || tr.pm || tr.rew === false) more.open = true;
        li.append(more);
        list.append(li);
      });
      card.append(list);
      const add = el("button", "btn btn-ghost bd-add", "+ Add trade"); add.type = "button";
      add.addEventListener("click", () => { tier.trades.push(newTrade()); render(); update(); const rows = tiersBox.querySelectorAll(".bd-pool")[ti].querySelectorAll(".bd-entry"); const f = rows[rows.length - 1].querySelector('input[type="text"]'); if (f) f.focus(); });
      card.append(add);
      tiersBox.append(card);
    });
  }

  $("[data-tr-addtier]").addEventListener("click", () => { state.tiers.push(newTier(state.tiers.length)); render(); update(); });
  pathIn.value = state.path; nameIn.value = state.name;
  pathIn.addEventListener("input", () => { state.path = pathIn.value; update(); });
  nameIn.addEventListener("input", () => { state.name = nameIn.value; update(); });
  [pathIn, nameIn].forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") i.blur(); }));
  function explain() { MC.say("Fix the problems listed first."); errBox.scrollIntoView({ block: "center", behavior: "smooth" }); }
  copyBtn.addEventListener("click", () => { if (copyBtn.getAttribute("aria-disabled") === "true") return explain(); copyText(outEl.textContent, "Trade table"); });
  dlBtn.addEventListener("click", () => { if (dlBtn.getAttribute("aria-disabled") === "true") return explain(); const p = state.path.trim(); downloadText(outEl.textContent, (p ? p.split("/").pop() : "my_trades") + ".json"); });
  entCopy.addEventListener("click", () => copyText(entOut.textContent, "Entity components"));
  $("[data-tr-reset]").addEventListener("click", () => { state = fresh(); pathIn.value = ""; nameIn.value = ""; render(); update(); });

  render(); update();
  window.__tradesBuild = build;
})();
