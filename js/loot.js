(() => {
  "use strict";
  const root = document.querySelector("[data-lt]");
  if (!root || !window.MC) return;
  const { el, normItem, ITEM_RE, isInt, copyText, downloadText, store } = MC;
  MC.addItemList();

  const $ = (s) => root.querySelector(s);
  const poolsBox = $("[data-lt-pools]"), outEl = $("[data-lt-out]"), errBox = $("[data-lt-errors]");
  const pathIn = $("[data-lt-path]"), pathNote = $("[data-lt-pathnote]");
  const copyBtn = $("[data-lt-copy]"), dlBtn = $("[data-lt-download]");
  const saved = store("ollaloll.loot.v1");

  const newEntry = (o) => Object.assign({ type: "item", name: "", weight: "1", cMin: "", cMax: "" }, o);
  const newPool = () => ({ rMin: "1", rMax: "1", entries: [newEntry()] });
  let state = saved.load();
  if (!state || !Array.isArray(state.pools) || !state.pools.length) state = { path: "", pools: [newPool()] };
  if (typeof state.path !== "string") state.path = "";

  /* ---------- build + validate ---------- */
  function build() {
    const errors = [];
    const err = (m) => errors.push(m);
    const pools = [];
    state.pools.forEach((pool, pi) => {
      const P = state.pools.length > 1 ? "Pool " + (pi + 1) + ": " : "";
      const out = {};
      const rMin = String(pool.rMin).trim(), rMax = String(pool.rMax).trim() || rMin;
      let rollsOk = true;
      if (!isInt(rMin) || +rMin < 0 || +rMin > 1000) { err(P + "“Rolls” must be a whole number from 0 to 1000."); rollsOk = false; }
      else if (!isInt(rMax) || +rMax < +rMin || +rMax > 1000) { err(P + "The highest roll count must be a whole number, not lower than the lowest."); rollsOk = false; }
      if (rollsOk) out.rolls = +rMin === +rMax ? +rMin : { min: +rMin, max: +rMax };
      const entries = [];
      if (!pool.entries.length) err(P + "Add at least one entry.");
      pool.entries.forEach((en, ei) => {
        const E = P + "Entry " + (ei + 1) + ": ";
        const o = { type: en.type };
        let ok = true;
        if (en.type === "item") {
          const name = normItem(en.name);
          if (!name) { err(E + "choose an item, like minecraft:diamond."); ok = false; }
          else if (!ITEM_RE.test(name)) { err(E + "“" + name + "” isn't a valid item ID. Use lowercase letters, digits and underscores, like minecraft:diamond."); ok = false; }
          else o.name = name;
        } else if (en.type === "loot_table") {
          const name = String(en.name || "").trim();
          if (!/^loot_tables\/[a-z0-9_\/]+\.json$/.test(name)) { err(E + "a loot table reference looks like loot_tables/chests/my_loot.json."); ok = false; }
          else o.name = name;
        }
        const w = String(en.weight).trim();
        if (!isInt(w) || +w < 1 || +w > 10000) { err(E + "weight must be a whole number from 1 to 10000."); ok = false; }
        else o.weight = +w;
        if (en.type === "item") {
          const a = String(en.cMin).trim(), b = String(en.cMax).trim();
          if (a || b) {
            const lo = a || b, hi = b || a;
            if (!isInt(lo) || !isInt(hi) || +lo < 1 || +hi > 64 || +lo > +hi) { err(E + "amount must be whole numbers from 1 to 64, with the smaller one first."); ok = false; }
            else o.functions = [{ function: "set_count", count: { min: +lo, max: +hi } }];
          }
        }
        if (ok) entries.push(o);
      });
      out.entries = entries;
      pools.push(out);
    });
    const p = state.path.trim();
    if (p && !/^[a-z0-9_]+(\/[a-z0-9_]+)*$/.test(p)) err("The file path can only use lowercase letters, digits, underscores and slashes (like chests/my_loot).");
    return { json: { pools }, errors };
  }

  /* ---------- output ---------- */
  function update() {
    const { json, errors } = build();
    errBox.textContent = "";
    errBox.hidden = !errors.length;
    errors.forEach((m) => errBox.append(el("p", null, m)));
    const ok = !errors.length;
    outEl.textContent = ok ? JSON.stringify(json, null, 2) : "Your loot table appears here once everything above is filled in.";
    outEl.classList.toggle("is-placeholder", !ok);
    [copyBtn, dlBtn].forEach((b) => b.setAttribute("aria-disabled", ok ? "false" : "true"));
    const p = state.path.trim();
    pathNote.textContent = "Save as loot_tables/" + (p || "my_loot") + ".json in your behavior pack.";
    // chance labels
    state.pools.forEach((pool, pi) => {
      const total = pool.entries.reduce((s, e) => s + (isInt(e.weight) && +e.weight > 0 ? +e.weight : 0), 0);
      pool.entries.forEach((e, ei) => {
        const lab = root.querySelector(`[data-chance="${pi}-${ei}"]`);
        if (lab) lab.textContent = total && isInt(e.weight) && +e.weight > 0 ? "≈ " + Math.round((+e.weight / total) * 1000) / 10 + "% per roll" : "";
      });
    });
    store("ollaloll.loot.v1").save(state);
  }

  /* ---------- UI ---------- */
  function field(labelText, input, cls) {
    const w = el("label", "bd-f" + (cls ? " " + cls : ""));
    w.append(el("span", "bd-f-l", labelText), input);
    return w;
  }
  function input(value, attrs, onInput) {
    const i = el("input"); i.value = value;
    Object.entries(attrs || {}).forEach(([k, v]) => i.setAttribute(k, v));
    i.addEventListener("input", () => { onInput(i.value); update(); });
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } });
    return i;
  }

  function render() {
    poolsBox.textContent = "";
    state.pools.forEach((pool, pi) => {
      const card = el("section", "panel bd-pool");
      const head = el("div", "bd-pool-head");
      head.append(el("h2", null, state.pools.length > 1 ? "Pool " + (pi + 1) : "Items"));
      if (state.pools.length > 1) {
        const rm = el("button", "btn btn-ghost btn-small", "Remove pool"); rm.type = "button";
        rm.addEventListener("click", () => { state.pools.splice(pi, 1); render(); update(); });
        head.append(rm);
      }
      card.append(head);

      const rolls = el("div", "bd-rolls");
      rolls.append(
        field("Rolls (min)", input(pool.rMin, { type: "text", inputmode: "numeric", autocomplete: "off", "aria-label": "Minimum rolls" }, (v) => { pool.rMin = v; })),
        field("Rolls (max)", input(pool.rMax, { type: "text", inputmode: "numeric", autocomplete: "off", "aria-label": "Maximum rolls" }, (v) => { pool.rMax = v; }))
      );
      rolls.append(el("p", "bd-hint", "How many times the game picks from this pool. Use the same number twice for an exact count."));
      card.append(rolls);

      const list = el("ul", "bd-entries");
      pool.entries.forEach((en, ei) => {
        const li = el("li", "bd-entry");
        const top = el("div", "bd-entry-top");
        const sel = el("select");
        [["item", "Item"], ["empty", "Nothing"], ["loot_table", "Other loot table"]].forEach(([v, t]) => { const o = el("option", null, t); o.value = v; if (en.type === v) o.selected = true; sel.append(o); });
        sel.setAttribute("aria-label", "Entry type");
        sel.addEventListener("change", () => { en.type = sel.value; render(); update(); });
        top.append(MC.dropdown(sel));
        const rm = el("button", "bd-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "Remove entry " + (ei + 1));
        rm.addEventListener("click", () => { pool.entries.splice(ei, 1); render(); update(); });
        top.append(rm);
        li.append(top);

        if (en.type !== "empty") {
          const attrs = { type: "text", autocomplete: "off", autocapitalize: "none", spellcheck: "false", enterkeyhint: "done" };
          if (en.type === "item") Object.assign(attrs, { list: "mc-items", placeholder: "minecraft:diamond", "aria-label": "Item ID" });
          else Object.assign(attrs, { placeholder: "loot_tables/chests/my_loot.json", "aria-label": "Loot table path" });
          li.append(field(en.type === "item" ? "Item" : "Loot table", input(en.name, attrs, (v) => { en.name = v; }), "bd-wide"));
        }
        const row = el("div", "bd-entry-row");
        row.append(field("Weight", input(en.weight, { type: "text", inputmode: "numeric", autocomplete: "off", "aria-label": "Weight" }, (v) => { en.weight = v; })));
        if (en.type === "item") {
          row.append(
            field("Amount (min)", input(en.cMin, { type: "text", inputmode: "numeric", autocomplete: "off", placeholder: "1", "aria-label": "Minimum amount" }, (v) => { en.cMin = v; })),
            field("Amount (max)", input(en.cMax, { type: "text", inputmode: "numeric", autocomplete: "off", placeholder: "1", "aria-label": "Maximum amount" }, (v) => { en.cMax = v; }))
          );
        }
        li.append(row);
        li.append(el("span", "bd-chance")); li.lastChild.setAttribute("data-chance", pi + "-" + ei);
        list.append(li);
      });
      card.append(list);

      const add = el("button", "btn btn-ghost bd-add", "+ Add entry"); add.type = "button";
      add.addEventListener("click", () => { pool.entries.push(newEntry()); render(); update(); const ins = poolsBox.querySelectorAll(".bd-pool")[pi].querySelectorAll(".bd-entry"); const last = ins[ins.length - 1]; const f = last.querySelector('input[type="text"]'); if (f) f.focus(); });
      card.append(add);
      poolsBox.append(card);
    });
  }

  $("[data-lt-addpool]").addEventListener("click", () => { state.pools.push(newPool()); render(); update(); });
  pathIn.value = state.path;
  pathIn.addEventListener("input", () => { state.path = pathIn.value; update(); });
  pathIn.addEventListener("keydown", (e) => { if (e.key === "Enter") pathIn.blur(); });
  copyBtn.addEventListener("click", () => { if (copyBtn.getAttribute("aria-disabled") === "true") return explain(); copyText(outEl.textContent, "Loot table"); });
  dlBtn.addEventListener("click", () => {
    if (dlBtn.getAttribute("aria-disabled") === "true") return explain();
    const p = state.path.trim(); downloadText(outEl.textContent, (p ? p.split("/").pop() : "my_loot") + ".json");
  });
  function explain() { MC.say("Fix the problems listed first."); errBox.scrollIntoView({ block: "center", behavior: "smooth" }); }
  $("[data-lt-reset]").addEventListener("click", () => { state = { path: "", pools: [newPool()] }; pathIn.value = ""; render(); update(); });

  render(); update();
  window.__lootBuild = build; // used by tests
})();
