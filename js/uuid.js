(() => {
  "use strict";
  const root = document.querySelector("[data-uu]");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const packEl = $("[data-uu-pack]"), modEl = $("[data-uu-module]"), manEl = $("[data-uu-manifest]");
  const typeSel = $("[data-uu-type]"), nameIn = $("[data-uu-name]"), upper = $("[data-uu-upper]");
  const listEl = $("[data-uu-list]"), countIn = $("[data-uu-count]");
  const toast = document.querySelector("[data-uu-toast]");

  function uuid4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  if (window.MC && MC.dropdown) MC.dropdown(typeSel);
  let pair = { pack: uuid4(), module: uuid4() };
  const fmt = (u) => (upper.checked ? u.toUpperCase() : u.toLowerCase());

  function manifest() {
    const type = typeSel.value;
    const name = nameIn.value.trim() || "My Pack";
    const skin = type === "skin_pack";
    const m = {
      format_version: skin ? 1 : 2,
      header: Object.assign(
        { name, description: skin ? "My skin pack" : "My pack", uuid: fmt(pair.pack), version: [1, 0, 0] },
        skin ? {} : { min_engine_version: [1, 21, 0] }
      ),
      modules: [{ type, uuid: fmt(pair.module), version: [1, 0, 0] }]
    };
    return JSON.stringify(m, null, 2).replace(/\[\s+(\d+),\s+(\d+),\s+(\d+)\s+\]/g, "[$1, $2, $3]");
  }

  function render() {
    packEl.textContent = fmt(pair.pack);
    modEl.textContent = fmt(pair.module);
    manEl.textContent = manifest();
  }

  let timer;
  function say(msg) {
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { toast.hidden = true; }, 1800);
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0;font-size:16px";
      document.body.append(t); t.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) {}
      t.remove();
      if (!ok) { say("Couldn't copy — select it and copy by hand."); return; }
    }
    say(label + " copied");
  }

  function bulk() {
    const n = Math.max(1, Math.min(100, parseInt(countIn.value, 10) || 1));
    countIn.value = n;
    listEl.value = Array.from({ length: n }, () => fmt(uuid4())).join("\n");
  }

  $("[data-uu-new]").addEventListener("click", () => { pair = { pack: uuid4(), module: uuid4() }; render(); say("New pair generated"); });
  $("[data-uu-bulk]").addEventListener("click", bulk);
  upper.addEventListener("change", () => { render(); bulk(); });
  typeSel.addEventListener("change", render);
  nameIn.addEventListener("input", render);
  nameIn.addEventListener("keydown", (e) => { if (e.key === "Enter") nameIn.blur(); });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-uu-copy]");
    if (!b) return;
    const k = b.dataset.uuCopy;
    if (k === "pack") copy(fmt(pair.pack), "Pack UUID");
    else if (k === "module") copy(fmt(pair.module), "Module UUID");
    else if (k === "manifest") copy(manifest(), "Manifest");
    else if (k === "list") copy(listEl.value, "List");
  });

  render(); bulk();
})();
