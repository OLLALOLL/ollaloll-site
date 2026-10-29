(() => {
  "use strict";
  const root = document.querySelector("[data-rc]");
  if (!root || !window.MC) return;
  const { el, normItem, ITEM_RE, isInt, copyText, downloadText, store } = MC;
  MC.addItemList();
  const $ = (s) => root.querySelector(s);

  const gridEl = $("[data-rc-grid]"), slotIn = $("[data-rc-slot]"), slotLabel = $("[data-rc-slot-label]");
  const outEl = $("[data-rc-out]"), errBox = $("[data-rc-errors]");
  const copyBtn = $("[data-rc-copy]"), dlBtn = $("[data-rc-download]");
  const idIn = $("[data-rc-id]"), pathNote = $("[data-rc-pathnote]");
  const resIn = $("[data-rc-result]"), cntIn = $("[data-rc-count]");
  const fin = $("[data-rc-fin]"), fout = $("[data-rc-fout]");
  const saved = store("ollaloll.recipe.v1");

  const FUR = [["furnace", "Furnace"], ["blast_furnace", "Blast furnace"], ["smoker", "Smoker"], ["campfire", "Campfire"], ["soul_campfire", "Soul campfire"]];
  const POS = ["top left", "top middle", "top right", "middle left", "centre", "middle right", "bottom left", "bottom middle", "bottom right"];
  let st = saved.load();
  if (!st || typeof st !== "object" || !Array.isArray(st.slots) || st.slots.length !== 9) {
    st = { type: "shaped", slots: Array(9).fill(""), sel: 0, id: "", result: "", count: "1", fin: "", fout: "", furn: ["furnace"] };
  }
  if (!["shaped", "shapeless", "furnace"].includes(st.type)) st.type = "shaped";
  if (!Array.isArray(st.furn)) st.furn = ["furnace"];
  ["id", "result", "count", "fin", "fout"].forEach((k) => { if (typeof st[k] !== "string") st[k] = k === "count" ? "1" : ""; });
  if (!(st.sel >= 0 && st.sel < 9)) st.sel = 0;

  function item(raw, label, errors) {
    const n = normItem(raw);
    if (!n) { errors.push(label + ": choose an item, like minecraft:diamond."); return null; }
    if (!ITEM_RE.test(n)) { errors.push(label + ": “" + n + "” isn't a valid item ID (lowercase letters, digits and underscores, like minecraft:diamond)."); return null; }
    return n;
  }

  function build() {
    const errors = [];
    const id = st.id.trim();
    if (!id) errors.push("Give the recipe an ID, like mypack:diamond_sword.");
    else if (!/^[a-z0-9_]+:[a-z0-9_]+$/.test(id)) errors.push("The recipe ID must look like namespace:name, in lowercase letters, digits and underscores.");
    else if (id.startsWith("minecraft:")) errors.push("Don't use the minecraft: namespace for your own recipe. Use your own, like mypack:" + id.split(":")[1] + ".");

    let body = null, key = null;
    if (st.type === "furnace") {
      const i = item(st.fin, "Input", errors), o = item(st.fout, "Output", errors);
      if (!st.furn.length) errors.push("Choose at least one place this can be cooked.");
      if (i && o && !errors.length) { body = { description: { identifier: id }, tags: FUR.map((f) => f[0]).filter((t) => st.furn.includes(t)), input: i, output: o }; key = "minecraft:recipe_furnace"; }
    } else {
      const res = item(st.result, "Result", errors);
      const c = st.count.trim();
      if (!isInt(c) || +c < 1 || +c > 64) errors.push("Result amount must be a whole number from 1 to 64.");
      const slots = st.slots.map((s, i) => (s.trim() ? item(s, "Slot " + (i + 1) + " (" + POS[i] + ")", errors) : ""));
      const used = slots.filter(Boolean);
      if (!errors.length && !used.length) errors.push("Put at least one ingredient in the grid.");
      if (!errors.length) {
        const result = { item: res, count: +c };
        if (st.type === "shapeless") {
          body = { description: { identifier: id }, tags: ["crafting_table"], ingredients: used.map((u) => ({ item: u })), result };
          key = "minecraft:recipe_shapeless";
        } else {
          let r0 = 3, r1 = -1, c0 = 3, c1 = -1;
          slots.forEach((s, i) => { if (s) { const r = Math.floor(i / 3), cc = i % 3; r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, cc); c1 = Math.max(c1, cc); } });
          const letters = "ABCDEFGHI"; const map = {}; const keyObj = {}; let n = 0;
          const pattern = [];
          for (let r = r0; r <= r1; r++) {
            let row = "";
            for (let cc = c0; cc <= c1; cc++) {
              const s = slots[r * 3 + cc];
              if (!s) { row += " "; continue; }
              if (!map[s]) { map[s] = letters[n++]; keyObj[map[s]] = { item: s }; }
              row += map[s];
            }
            pattern.push(row);
          }
          body = { description: { identifier: id }, tags: ["crafting_table"], pattern, key: keyObj, result };
          key = "minecraft:recipe_shaped";
        }
      }
    }
    const json = body ? { format_version: "1.12", [key]: body } : null;
    return { json, errors };
  }

  function update() {
    const { json, errors } = build();
    errBox.textContent = ""; errBox.hidden = !errors.length;
    errors.forEach((m) => errBox.append(el("p", null, m)));
    const ok = !errors.length && !!json;
    outEl.textContent = ok ? JSON.stringify(json, null, 2) : "Your recipe appears here once everything above is filled in.";
    outEl.classList.toggle("is-placeholder", !ok);
    [copyBtn, dlBtn].forEach((b) => b.setAttribute("aria-disabled", ok ? "false" : "true"));
    const name = /^[a-z0-9_]+:([a-z0-9_]+)$/.test(st.id.trim()) ? st.id.trim().split(":")[1] : "my_recipe";
    pathNote.textContent = "Save as recipes/" + name + ".json in your behavior pack.";
    store("ollaloll.recipe.v1").save(st);
    return { json, ok, name };
  }

  /* ---------- grid ---------- */
  const cells = [];
  function short(v) { return v.trim().replace(/^minecraft:/, "").replace(/_/g, "_​"); }
  function drawCells() {
    cells.forEach((b, i) => {
      b.textContent = ""; const v = st.slots[i];
      if (v.trim()) b.append(el("span", "bd-cell-t", short(v))); else b.append(el("span", "bd-cell-e", "+"));
      b.classList.toggle("is-sel", i === st.sel);
      b.classList.toggle("is-filled", !!v.trim());
      b.setAttribute("aria-pressed", i === st.sel ? "true" : "false");
      b.setAttribute("aria-label", "Slot " + (i + 1) + ", " + POS[i] + ": " + (v.trim() || "empty"));
    });
    slotLabel.textContent = "Slot " + (st.sel + 1) + " · " + POS[st.sel];
    if (document.activeElement !== slotIn) slotIn.value = st.slots[st.sel];
  }
  for (let i = 0; i < 9; i++) {
    const b = el("button", "bd-cell"); b.type = "button";
    b.addEventListener("click", () => { st.sel = i; drawCells(); slotIn.focus({ preventScroll: true }); slotIn.select(); });
    cells.push(b); gridEl.append(b);
  }
  slotIn.addEventListener("input", () => { st.slots[st.sel] = slotIn.value; drawCells(); update(); });
  slotIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); st.sel = (st.sel + 1) % 9; drawCells(); slotIn.value = st.slots[st.sel]; slotIn.select(); }
  });
  $("[data-rc-clear-slot]").addEventListener("click", () => { st.slots[st.sel] = ""; slotIn.value = ""; drawCells(); update(); });
  $("[data-rc-clear-all]").addEventListener("click", () => { st.slots = Array(9).fill(""); slotIn.value = ""; drawCells(); update(); });

  /* ---------- type switch + fields ---------- */
  const panels = { craft: $("[data-rc-craft]"), furnace: $("[data-rc-furnace]") };
  function showType() {
    root.querySelectorAll('input[name="rc-type"]').forEach((r) => { r.checked = r.value === st.type; });
    const f = st.type === "furnace";
    panels.craft.hidden = f; panels.furnace.hidden = !f;
    $("[data-rc-grid-hint]").textContent = st.type === "shapeless"
      ? "Order doesn't matter for shapeless recipes. Every filled slot becomes one ingredient."
      : "Tap a slot, then type or pick an item. Empty slots stay empty in the recipe.";
    $("[data-rc-result-box]").hidden = f;
  }
  root.querySelectorAll('input[name="rc-type"]').forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.type = r.value; showType(); update(); } }));

  const bind = (inp, key) => { inp.value = st[key]; inp.addEventListener("input", () => { st[key] = inp.value; update(); }); inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } }); };
  bind(idIn, "id"); bind(resIn, "result"); bind(cntIn, "count"); bind(fin, "fin"); bind(fout, "fout");

  const furnBox = $("[data-rc-furn]");
  FUR.forEach(([v, t]) => {
    const l = el("label", "bd-chip"); const c = el("input"); c.type = "checkbox"; c.value = v; c.checked = st.furn.includes(v);
    c.addEventListener("change", () => { st.furn = FUR.map((f) => f[0]).filter((x) => (x === v ? c.checked : st.furn.includes(x))); update(); });
    l.append(c, el("span", null, t)); furnBox.append(l);
  });

  copyBtn.addEventListener("click", () => { if (copyBtn.getAttribute("aria-disabled") === "true") return explain(); copyText(outEl.textContent, "Recipe"); });
  dlBtn.addEventListener("click", () => { if (dlBtn.getAttribute("aria-disabled") === "true") return explain(); downloadText(outEl.textContent, update().name + ".json"); });
  function explain() { MC.say("Fix the problems listed first."); errBox.scrollIntoView({ block: "center", behavior: "smooth" }); }
  $("[data-rc-reset]").addEventListener("click", () => {
    st = { type: "shaped", slots: Array(9).fill(""), sel: 0, id: "", result: "", count: "1", fin: "", fout: "", furn: ["furnace"] };
    [["id", idIn], ["result", resIn], ["count", cntIn], ["fin", fin], ["fout", fout]].forEach(([k, i]) => { i.value = st[k]; });
    furnBox.querySelectorAll("input").forEach((c) => { c.checked = st.furn.includes(c.value); });
    showType(); drawCells(); update();
  });

  showType(); drawCells(); update();
  window.__recipeState = () => st; window.__recipeBuild = build; window.__recipeRefresh = () => { showType(); drawCells(); update(); };
})();
