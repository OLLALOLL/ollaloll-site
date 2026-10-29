/* Shared helpers for the Bedrock builder tools (loot table, recipe). */
(() => {
  "use strict";

  const base = ["diamond", "iron_ingot", "gold_ingot", "copper_ingot", "netherite_ingot", "netherite_scrap", "emerald", "coal", "charcoal", "redstone", "lapis_lazuli", "quartz", "amethyst_shard", "stick", "string", "feather", "flint", "bone", "bone_meal", "gunpowder", "blaze_rod", "blaze_powder", "ender_pearl", "ender_eye", "slime_ball", "leather", "paper", "book", "apple", "golden_apple", "enchanted_golden_apple", "bread", "beef", "cooked_beef", "porkchop", "cooked_porkchop", "chicken", "cooked_chicken", "mutton", "cooked_mutton", "cod", "cooked_cod", "salmon", "cooked_salmon", "potato", "baked_potato", "carrot", "golden_carrot", "wheat", "sugar", "egg", "bucket", "water_bucket", "lava_bucket", "milk_bucket", "name_tag", "saddle", "arrow", "bow", "crossbow", "trident", "shield", "totem_of_undying", "elytra", "fishing_rod", "shears", "flint_and_steel", "compass", "clock", "map", "experience_bottle", "glass_bottle", "potion", "mace", "wind_charge", "tnt", "torch", "ladder", "chest", "ender_chest", "barrel", "furnace", "blast_furnace", "smoker", "crafting_table", "oak_planks", "oak_log", "stone", "cobblestone", "deepslate", "sand", "glass", "gravel", "dirt", "obsidian", "netherrack", "iron_ore", "gold_ore", "copper_ore", "coal_ore", "diamond_ore", "raw_iron", "raw_gold", "raw_copper", "iron_block", "gold_block", "diamond_block", "emerald_block", "ancient_debris", "white_wool"];
  const items = base.slice();
  ["wooden", "stone", "iron", "golden", "diamond", "netherite"].forEach((m) => ["sword", "pickaxe", "axe", "shovel", "hoe"].forEach((t) => items.push(m + "_" + t)));
  ["leather", "chainmail", "iron", "golden", "diamond", "netherite"].forEach((m) => ["helmet", "chestplate", "leggings", "boots"].forEach((t) => items.push(m + "_" + t)));
  const ITEMS = [...new Set(items)].sort().map((n) => "minecraft:" + n);

  const ITEM_RE = /^[a-z0-9_]+:[a-z0-9_]+$/;

  /** Tidy what was typed into an item field: trim, lower-case, spaces to underscores, add minecraft: if no namespace. */
  function normItem(raw) {
    let s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!s) return "";
    if (!s.includes(":")) s = "minecraft:" + s;
    return s;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function addItemList() {
    if (document.getElementById("mc-items")) return;
    const dl = el("datalist"); dl.id = "mc-items";
    ITEMS.forEach((v) => { const o = el("option"); o.value = v; dl.append(o); });
    document.body.append(dl);
  }

  const toastEl = document.querySelector("[data-bd-toast]");
  let timer;
  function say(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { toastEl.hidden = true; }, 2000);
  }

  async function copyText(text, label) {
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0;font-size:16px";
      document.body.append(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      t.remove();
      if (!ok) { say("Couldn't copy. Select the text and copy it by hand."); return; }
    }
    say((label || "Text") + " copied");
  }

  function downloadText(text, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/octet-stream" }));
    a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function store(key) {
    return {
      load() { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
      save(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage blocked: fine */ } }
    };
  }


  /** Replace a native <select> with a fully styled dropdown. The select stays in the DOM (hidden) and keeps the value. */
  let ddId = 0;
  function dropdown(sel) {
    const id = "mc-dd-" + ++ddId;
    const wrap = el("div", "mc-dd");
    const btn = el("button", "mc-dd-btn"); btn.type = "button";
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    const lab = sel.getAttribute("aria-label") || (sel.id && (document.querySelector('label[for="' + sel.id + '"]') || {}).textContent) || "";
    if (lab) btn.setAttribute("aria-label", lab);
    const txt = el("span", "mc-dd-text");
    btn.append(txt);
    btn.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>');
    const list = el("ul", "mc-dd-list"); list.id = id; list.setAttribute("role", "listbox"); list.hidden = true; list.tabIndex = -1;
    const opts = [...sel.options];
    const lis = opts.map((o, i) => {
      const li = el("li", "mc-dd-opt", o.textContent); li.id = id + "-" + i; li.setAttribute("role", "option"); li.dataset.i = i;
      list.append(li); return li;
    });
    sel.hidden = true; sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    let active = 0, open = false;
    const paint = () => {
      txt.textContent = opts[sel.selectedIndex] ? opts[sel.selectedIndex].textContent : "";
      lis.forEach((li, i) => { li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false"); li.classList.toggle("is-active", open && i === active); });
      if (open) btn.setAttribute("aria-activedescendant", id + "-" + active); else btn.removeAttribute("aria-activedescendant");
    };
    function setOpen(v) {
      open = v; list.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false");
      wrap.classList.toggle("is-open", v);
      if (v) {
        active = Math.max(0, sel.selectedIndex);
        wrap.classList.remove("is-up");
        const r = btn.getBoundingClientRect();
        if (window.innerHeight - r.bottom < list.offsetHeight + 16 && r.top > list.offsetHeight + 16) wrap.classList.add("is-up");
        const a = lis[active]; if (a) a.scrollIntoView({ block: "nearest" });
      }
      paint();
    }
    function choose(i) {
      setOpen(false);
      if (i !== sel.selectedIndex) { sel.selectedIndex = i; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      paint(); btn.focus({ preventScroll: true });
    }
    btn.addEventListener("click", () => setOpen(!open));
    btn.addEventListener("keydown", (e) => {
      const k = e.key;
      if (!open && (k === "ArrowDown" || k === "ArrowUp")) { e.preventDefault(); setOpen(true); return; }
      if (!open) return;
      if (k === "ArrowDown") { e.preventDefault(); active = Math.min(lis.length - 1, active + 1); }
      else if (k === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); }
      else if (k === "Home") { e.preventDefault(); active = 0; }
      else if (k === "End") { e.preventDefault(); active = lis.length - 1; }
      else if (k === "Enter" || k === " ") { e.preventDefault(); choose(active); return; }
      else if (k === "Escape") { e.preventDefault(); setOpen(false); return; }
      else if (k === "Tab") { setOpen(false); return; }
      else return;
      paint(); lis[active].scrollIntoView({ block: "nearest" });
    });
    list.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus on the button
    list.addEventListener("click", (e) => { const li = e.target.closest(".mc-dd-opt"); if (li) choose(+li.dataset.i); });
    list.addEventListener("pointermove", (e) => { const li = e.target.closest(".mc-dd-opt"); if (li && +li.dataset.i !== active) { active = +li.dataset.i; paint(); } });
    document.addEventListener("pointerdown", (e) => { if (open && !wrap.contains(e.target)) setOpen(false); });
    btn.addEventListener("blur", () => setTimeout(() => { if (open && !wrap.contains(document.activeElement)) setOpen(false); }, 0));
    sel.addEventListener("change", paint);
    wrap.append(btn, list);
    if (sel.parentNode) { sel.parentNode.insertBefore(wrap, sel); }
    wrap.append(sel);
    paint();
    return wrap;
  }

  const isInt = (v) => /^-?\d+$/.test(String(v).trim());

  window.MC = { dropdown, ITEMS, ITEM_RE, normItem, el, addItemList, say, copyText, downloadText, store, isInt };
})();
