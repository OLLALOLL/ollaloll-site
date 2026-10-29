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

  const isInt = (v) => /^-?\d+$/.test(String(v).trim());

  window.MC = { ITEMS, ITEM_RE, normItem, el, addItemList, say, copyText, downloadText, store, isInt };
})();
