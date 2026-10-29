/* Skin Pack Builder (/tools/skin)
   Builds a Minecraft Bedrock skin pack (.mcpack) entirely in the browser:
   skins are read from PNG files, previewed, and zipped with a tiny built-in
   ZIP writer. Nothing is uploaded anywhere. */
(function () {
  "use strict";

  const root = document.querySelector("[data-skb]");
  if (!root) return;

  const STORE_KEY = "ollaloll.skinpack.v1";
  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const PREVIEW_PX = 5; // on-screen pixels per skin pixel in the card previews

  const $ = (sel, scope) => (scope || root).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || root).querySelectorAll(sel));
  const page = (sel) => document.querySelector(sel);

  /* ------------------------------------------------------------------ *
   * Tiny helpers
   * ------------------------------------------------------------------ */

  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? "" : value);
      }
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
    return node;
  }

  function svg(inner, extra) {
    const wrap = document.createElement("span");
    wrap.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' +
      (extra || "") +
      ">" + inner + "</svg>";
    return wrap.firstChild;
  }

  const ICONS = {
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
    return [h.slice(0, 4), h.slice(4, 6), h.slice(6, 8), h.slice(8, 10), h.slice(10)]
      .map((part) => part.join(""))
      .join("-");
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  function dataUrlBytes(dataUrl) {
    const bin = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function dataUrlSize(dataUrl) {
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    return Math.floor((b64.length * 3) / 4) - pad;
  }

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("couldn't read the file"));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("that doesn't look like a valid image"));
      img.src = src;
    });
  }

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */

  const state = freshState();

  function freshState() {
    return {
      name: "",
      author: "",
      description: "",
      version: "1.0.0",
      uuids: { pack: uuid(), module: uuid() },
      icon: { mode: "auto", skinId: null, dataUrl: null },
      skins: [],
    };
  }

  let iconUploadImg = null; // decoded copy of state.icon.dataUrl

  /* ------------------------------------------------------------------ *
   * Persistence (best effort: storage can be blocked or full)
   * ------------------------------------------------------------------ */

  let saveTimer = 0;
  let saveOk = true;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }

  function saveDraft() {
    const payload = {
      name: state.name,
      author: state.author,
      description: state.description,
      version: state.version,
      uuids: state.uuids,
      icon: state.icon,
      skins: state.skins.map((s) => ({
        id: s.id, name: s.name, model: s.model, png: s.png, w: s.w, h: s.h, note: s.note,
      })),
    };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(payload));
      saveOk = true;
    } catch (error) {
      saveOk = false;
    }
    updateSavedNote();
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function loadDraft() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (error) {
      return;
    }
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (typeof d.name === "string") state.name = d.name.slice(0, 48);
      if (typeof d.author === "string") state.author = d.author.slice(0, 48);
      if (typeof d.description === "string") state.description = d.description.slice(0, 120);
      if (typeof d.version === "string") state.version = d.version.slice(0, 11);
      if (d.uuids && typeof d.uuids.pack === "string" && typeof d.uuids.module === "string") {
        state.uuids = { pack: d.uuids.pack, module: d.uuids.module };
      }
      if (d.icon && ["auto", "upload", "none"].includes(d.icon.mode)) {
        state.icon = {
          mode: d.icon.mode,
          skinId: typeof d.icon.skinId === "string" ? d.icon.skinId : null,
          dataUrl: typeof d.icon.dataUrl === "string" ? d.icon.dataUrl : null,
        };
      }
      if (Array.isArray(d.skins)) {
        for (const s of d.skins) {
          if (!s || typeof s.png !== "string" || !s.png.startsWith("data:image/png")) continue;
          const skin = {
            id: typeof s.id === "string" ? s.id : uid(),
            name: typeof s.name === "string" ? s.name.slice(0, 48) : "Skin",
            model: s.model === "slim" ? "slim" : "classic",
            png: s.png,
            w: s.w === 128 ? 128 : 64,
            h: s.h === 128 ? 128 : 64,
            note: typeof s.note === "string" ? s.note : "",
            img: null,
          };
          skin.img = new Image();
          skin.img.src = skin.png;
          skin.ready = skin.img.decode ? skin.img.decode().catch(() => {}) : Promise.resolve();
          state.skins.push(skin);
        }
      }
    } catch (error) {
      /* a corrupt draft is just ignored */
    }
  }

  /* ------------------------------------------------------------------ *
   * Skin drawing
   * ------------------------------------------------------------------ */

  // Source rectangles on a 64x64 skin: [x, y, w, h]. Arm widths differ between
  // the classic (4px) and slim (3px) models.
  function partsFor(model, view) {
    const aw = model === "slim" ? 3 : 4;
    const slim = model === "slim";
    if (view === "front") {
      return [
        { src: [4, 20, 4, 12], ov: [4, 36, 4, 12], at: [4, 20] }, // right leg
        { src: [20, 52, 4, 12], ov: [4, 52, 4, 12], at: [8, 20] }, // left leg
        { src: [20, 20, 8, 12], ov: [20, 36, 8, 12], at: [4, 8] }, // body
        { src: [44, 20, aw, 12], ov: [44, 36, aw, 12], at: [4 - aw, 8] }, // right arm
        { src: [36, 52, aw, 12], ov: [52, 52, aw, 12], at: [12, 8] }, // left arm
        { src: [8, 8, 8, 8], ov: [40, 8, 8, 8], at: [4, 0] }, // head
      ];
    }
    return [
      { src: [28, 52, 4, 12], ov: [12, 52, 4, 12], at: [4, 20] }, // left leg (seen from behind, on the left)
      { src: [12, 20, 4, 12], ov: [12, 36, 4, 12], at: [8, 20] }, // right leg
      { src: [32, 20, 8, 12], ov: [32, 36, 8, 12], at: [4, 8] }, // body
      { src: [slim ? 43 : 44, 52, aw, 12], ov: [slim ? 59 : 60, 52, aw, 12], at: [4 - aw, 8] }, // left arm
      { src: [slim ? 51 : 52, 20, aw, 12], ov: [slim ? 51 : 52, 36, aw, 12], at: [12, 8] }, // right arm
      { src: [24, 8, 8, 8], ov: [56, 8, 8, 8], at: [4, 0] }, // head
    ];
  }

  function drawSkinView(canvas, skin, view, px) {
    const img = skin.img;
    canvas.width = 16 * px;
    canvas.height = 32 * px;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img || !img.naturalWidth) return;
    ctx.imageSmoothingEnabled = false;
    const s = img.naturalWidth / 64;
    for (const part of partsFor(skin.model, view)) {
      for (const rect of [part.src, part.ov]) {
        ctx.drawImage(
          img,
          rect[0] * s, rect[1] * s, rect[2] * s, rect[3] * s,
          part.at[0] * px, part.at[1] * px, rect[2] * px, rect[3] * px
        );
      }
    }
  }

  function drawFace(ctx, skin, size) {
    const img = skin.img;
    if (!img || !img.naturalWidth) return;
    const s = img.naturalWidth / 64;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, size, size);
    ctx.drawImage(img, 40 * s, 8 * s, 8 * s, 8 * s, 0, 0, size, size);
  }

  /* ------------------------------------------------------------------ *
   * Importing skins
   * ------------------------------------------------------------------ */

  // Old 64x32 skins: rebuild the left arm/leg by mirroring the right ones,
  // the same way Minecraft itself upgrades legacy skins.
  function upgradeLegacy(img) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const image = ctx.getImageData(0, 0, 64, 64);
    const d = image.data;
    const copy = (x, y, xo, yo, w, h) => {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const from = ((y + j) * 64 + (x + i)) * 4;
          const to = ((y + yo + j) * 64 + (x + xo + (w - 1 - i))) * 4;
          d[to] = d[from];
          d[to + 1] = d[from + 1];
          d[to + 2] = d[from + 2];
          d[to + 3] = d[from + 3];
        }
      }
    };
    [
      [4, 16, 16, 32, 4, 4], [8, 16, 16, 32, 4, 4],
      [0, 20, 24, 32, 4, 12], [4, 20, 16, 32, 4, 12], [8, 20, 8, 32, 4, 12], [12, 20, 16, 32, 4, 12],
      [44, 16, -8, 32, 4, 4], [48, 16, -8, 32, 4, 4],
      [40, 20, 0, 32, 4, 12], [44, 20, -8, 32, 4, 12], [48, 20, -16, 32, 4, 12], [52, 20, -8, 32, 4, 12],
    ].forEach((args) => copy(...args));
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  // Slim ("Alex") skins leave the unused arm columns fully transparent.
  function detectModel(img) {
    const s = img.naturalWidth / 64;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const regions = [[50, 16, 2, 4], [54, 20, 2, 12], [42, 48, 2, 4], [46, 52, 2, 12]];
    for (const [x, y, w, h] of regions) {
      const data = ctx.getImageData(x * s, y * s, w * s, h * s).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return "classic";
    }
    return "slim";
  }

  function nameFromFile(fileName) {
    const base = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
    return (base || "Skin").slice(0, 48);
  }

  async function importPng(file) {
    if (!(file.type === "image/png" || /\.png$/i.test(file.name))) {
      throw new Error("only PNG skins are supported");
    }
    if (file.size > MAX_FILE_BYTES) throw new Error("file is too large for a skin (2 MB max)");
    let png = await readAsDataURL(file);
    let img = await loadImage(png);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    let note = "";
    if (w === 64 && h === 32) {
      png = upgradeLegacy(img);
      img = await loadImage(png);
      w = 64;
      h = 64;
      note = "Converted from 64×32";
    } else if (!((w === 64 && h === 64) || (w === 128 && h === 128))) {
      throw new Error("is " + w + "×" + h + " — skins must be 64×64 or 128×128");
    }
    return {
      id: uid(),
      name: nameFromFile(file.name),
      model: detectModel(img),
      png, w, h, note, img,
      ready: Promise.resolve(),
    };
  }

  /* ------------------------------------------------------------------ *
   * Rendering: skins grid
   * ------------------------------------------------------------------ */

  const grid = $("[data-skb-grid]");
  const emptyBox = $("[data-skb-empty]");
  const tip = $("[data-skb-tip]");
  const countEl = $("[data-skb-count]");
  const fileInput = $("[data-skb-file]");
  const alertBox = $("[data-skb-alert]");

  function renderSkins(opts) {
    grid.textContent = "";
    state.skins.forEach((skin, index) => grid.append(buildCard(skin, index, opts && opts.newId === skin.id)));
    if (state.skins.length) {
      grid.append(
        el(
          "button",
          { type: "button", class: "skb-add-tile", onclick: () => fileInput.click() },
          svg(ICONS.plus),
          "Add more skins"
        )
      );
    }
    emptyBox.hidden = state.skins.length > 0;
    tip.hidden = state.skins.length === 0;
    countEl.textContent = String(state.skins.length);
    if (opts && opts.focus) {
      const card = grid.querySelector('[data-skin="' + opts.focus.id + '"]');
      if (card) {
        const btn = card.querySelector('[data-move="' + opts.focus.dir + '"]:not(:disabled)') ||
          card.querySelector("[data-move]:not(:disabled)") ||
          card.querySelector(".skb-card-name");
        if (btn) btn.focus();
      }
    }
    syncIconSkinSelect();
    updateSummary();
  }

  function buildCard(skin, index, isNew) {
    const front = el("canvas", { "aria-hidden": "true" });
    const back = el("canvas", { "aria-hidden": "true" });
    const redraw = () => {
      drawSkinView(front, skin, "front", PREVIEW_PX);
      drawSkinView(back, skin, "back", PREVIEW_PX);
    };
    redraw();
    skin.ready.then(() => {
      redraw();
      updateIcons();
    });

    const radioName = "skb-model-" + skin.id;
    const modelRadio = (value, label) =>
      el(
        "label",
        null,
        el("input", {
          type: "radio",
          name: radioName,
          value,
          checked: skin.model === value,
          onchange: () => {
            skin.model = value;
            redraw();
            scheduleSave();
          },
        }),
        el("span", { text: label })
      );

    const nameInput = el("input", {
      class: "skb-card-name",
      type: "text",
      maxlength: "48",
      value: skin.name,
      "aria-label": "Skin " + (index + 1) + " name",
      placeholder: "Skin name",
      autocomplete: "off",
      oninput: (e) => {
        skin.name = e.target.value;
        syncIconSkinSelect();
        updateSummary();
        scheduleSave();
      },
    });

    const replaceInput = el("input", {
      type: "file",
      accept: "image/png,.png",
      hidden: true,
      onchange: async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (!file) return;
        try {
          const fresh = await importPng(file);
          skin.png = fresh.png;
          skin.w = fresh.w;
          skin.h = fresh.h;
          skin.note = fresh.note;
          skin.img = fresh.img;
          skin.model = fresh.model;
          clearAlert();
          renderSkins();
          scheduleSave();
          toast("Replaced the texture for “" + (skin.name || "Skin") + "”.");
        } catch (error) {
          showAlert([file.name + ": " + error.message]);
        }
      },
    });

    const meta = skin.w + "×" + skin.h + (skin.note ? " · " + skin.note : "");

    return el(
      "div",
      { class: "skb-card" + (isNew ? " is-new" : ""), "data-skin": skin.id },
      el(
        "div",
        { class: "skb-stage" },
        el("span", { class: "skb-idx", text: "#" + (index + 1) }),
        el(
          "div",
          { class: "skb-move" },
          el(
            "button",
            {
              type: "button",
              class: "skb-icon-btn",
              "data-move": "left",
              "aria-label": "Move " + (skin.name || "skin") + " earlier",
              title: "Move earlier",
              disabled: index === 0,
              onclick: () => moveSkin(skin.id, -1),
            },
            svg(ICONS.left)
          ),
          el(
            "button",
            {
              type: "button",
              class: "skb-icon-btn",
              "data-move": "right",
              "aria-label": "Move " + (skin.name || "skin") + " later",
              title: "Move later",
              disabled: index === state.skins.length - 1,
              onclick: () => moveSkin(skin.id, 1),
            },
            svg(ICONS.right)
          )
        ),
        el("div", { class: "skb-view" }, front, el("small", { text: "Front" })),
        el("div", { class: "skb-view" }, back, el("small", { text: "Back" }))
      ),
      nameInput,
      el(
        "div",
        { class: "skb-seg", role: "radiogroup", "aria-label": "Arm style" },
        modelRadio("classic", "Classic arms"),
        modelRadio("slim", "Slim arms")
      ),
      el("p", { class: "skb-meta", text: meta }),
      el(
        "div",
        { class: "skb-actions" },
        el("button", { type: "button", class: "skb-text-btn", onclick: () => replaceInput.click() }, "Replace"),
        el("button", { type: "button", class: "skb-text-btn is-danger", onclick: () => removeSkin(skin.id) }, "Remove"),
        replaceInput
      )
    );
  }

  function moveSkin(id, delta) {
    const from = state.skins.findIndex((s) => s.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= state.skins.length) return;
    const [skin] = state.skins.splice(from, 1);
    state.skins.splice(to, 0, skin);
    renderSkins({ focus: { id, dir: delta < 0 ? "left" : "right" } });
    scheduleSave();
  }

  function removeSkin(id) {
    const index = state.skins.findIndex((s) => s.id === id);
    if (index < 0) return;
    const [skin] = state.skins.splice(index, 1);
    renderSkins();
    scheduleSave();
    toast("Removed “" + (skin.name || "Skin") + "”.", {
      label: "Undo",
      onClick: () => {
        state.skins.splice(Math.min(index, state.skins.length), 0, skin);
        renderSkins();
        scheduleSave();
      },
    });
  }

  /* ------------------------------------------------------------------ *
   * Adding files
   * ------------------------------------------------------------------ */

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    const problems = [];
    let lastId = null;
    let added = 0;
    for (const file of files) {
      try {
        const skin = await importPng(file);
        state.skins.push(skin);
        lastId = skin.id;
        added++;
      } catch (error) {
        problems.push(file.name + ": " + error.message);
      }
    }
    if (problems.length) showAlert(problems);
    else clearAlert();
    if (added) {
      renderSkins({ newId: lastId });
      scheduleSave();
      toast(added === 1 ? "Added 1 skin." : "Added " + added + " skins.");
    }
  }

  function showAlert(lines) {
    alertBox.textContent = "";
    alertBox.append(
      el("strong", { text: lines.length === 1 ? "Couldn't add that file" : "Couldn't add " + lines.length + " files" }),
      el("ul", null, lines.map((line) => el("li", { text: line }))),
      el("button", { type: "button", "aria-label": "Dismiss", onclick: clearAlert }, "×")
    );
    alertBox.hidden = false;
  }

  function clearAlert() {
    alertBox.hidden = true;
    alertBox.textContent = "";
  }

  $$("[data-skb-add]").forEach((btn) => btn.addEventListener("click", () => fileInput.click()));
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";
    addFiles(files);
  });

  // Drag & drop anywhere on the page, plus pasting an image.
  const overlay = $("[data-skb-overlay]", document);
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");

  window.addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    overlay.hidden = false;
  });
  window.addEventListener("dragover", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  window.addEventListener("dragleave", (e) => {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) overlay.hidden = true;
  });
  window.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    overlay.hidden = true;
    addFiles(e.dataTransfer.files);
  });
  document.addEventListener("paste", (e) => {
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
  });

  /* ------------------------------------------------------------------ *
   * Toasts
   * ------------------------------------------------------------------ */

  const toastBox = $("[data-skb-toasts]", document);

  function toast(message, action) {
    const node = el("div", { class: "skb-toast" }, el("span", { text: message }));
    let timer = 0;
    const dismiss = () => {
      clearTimeout(timer);
      node.remove();
    };
    if (action) {
      node.append(
        el("button", {
          type: "button",
          text: action.label,
          onclick: () => {
            dismiss();
            action.onClick();
          },
        })
      );
    }
    toastBox.append(node);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    timer = setTimeout(dismiss, action ? 7000 : 3500);
  }

  /* ------------------------------------------------------------------ *
   * Pack details form
   * ------------------------------------------------------------------ */

  const nameInput = $("[data-skb-name]");
  const authorInput = $("[data-skb-author]");
  const descInput = $("[data-skb-desc]");
  const versionInput = $("[data-skb-version]");

  nameInput.addEventListener("input", () => {
    state.name = nameInput.value;
    updateSummary();
    scheduleSave();
  });
  authorInput.addEventListener("input", () => {
    state.author = authorInput.value;
    scheduleSave();
  });
  descInput.addEventListener("input", () => {
    state.description = descInput.value;
    scheduleSave();
  });
  versionInput.addEventListener("input", () => {
    state.version = versionInput.value.trim();
    versionInput.setAttribute("aria-invalid", parseVersion(state.version) ? "false" : "true");
    updateSummary();
    scheduleSave();
  });

  function parseVersion(text) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim());
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  }

  const uuidPackEl = $("[data-skb-uuid-pack]");
  const uuidModuleEl = $("[data-skb-uuid-module]");

  function showUuids() {
    uuidPackEl.textContent = state.uuids.pack;
    uuidModuleEl.textContent = state.uuids.module;
  }

  $("[data-skb-new-uuid]").addEventListener("click", () => {
    state.uuids = { pack: uuid(), module: uuid() };
    showUuids();
    scheduleSave();
    toast("New pack IDs generated.");
  });

  /* ---- Pack icon ---- */

  const iconMain = $("[data-skb-icon-main]");
  const iconSide = $("[data-skb-icon-side]");
  const iconSkinSelect = $("[data-skb-icon-skin]");
  const iconAutoBox = $("[data-skb-icon-auto]");
  const iconUploadBox = $("[data-skb-icon-upload]");
  const iconFile = $("[data-skb-icon-file]");
  const iconNote = $("[data-skb-icon-note]");

  function iconSourceSkin() {
    if (state.icon.mode !== "auto" || !state.skins.length) return null;
    return state.skins.find((s) => s.id === state.icon.skinId) || state.skins[0];
  }

  // Draws the pack icon at `size` on a fresh canvas, or returns null for "no icon".
  function makeIconCanvas(size) {
    if (state.icon.mode === "none") return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (state.icon.mode === "upload") {
      if (!iconUploadImg) return null;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(iconUploadImg, 0, 0, size, size);
      return canvas;
    }
    const skin = iconSourceSkin();
    if (!skin || !skin.img || !skin.img.naturalWidth) return null;
    drawFace(ctx, skin, size);
    return canvas;
  }

  function paintIcon(target) {
    const ctx = target.getContext("2d");
    ctx.clearRect(0, 0, target.width, target.height);
    const source = makeIconCanvas(64);
    if (source) ctx.drawImage(source, 0, 0);
    else {
      // No icon: a faint placeholder cube so the slot doesn't look broken.
      ctx.strokeStyle = "rgba(201,184,255,.35)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(32, 12); ctx.lineTo(50, 22); ctx.lineTo(50, 42); ctx.lineTo(32, 52); ctx.lineTo(14, 42); ctx.lineTo(14, 22);
      ctx.closePath();
      ctx.moveTo(14, 22); ctx.lineTo(32, 32); ctx.lineTo(50, 22);
      ctx.moveTo(32, 32); ctx.lineTo(32, 52);
      ctx.stroke();
    }
  }

  function updateIcons() {
    paintIcon(iconMain);
    paintIcon(iconSide);
  }

  function syncIconSkinSelect() {
    iconSkinSelect.textContent = "";
    if (!state.skins.length) {
      iconSkinSelect.append(el("option", { value: "", text: "Add a skin first" }));
      iconSkinSelect.disabled = true;
    } else {
      iconSkinSelect.disabled = false;
      state.skins.forEach((skin, i) => {
        iconSkinSelect.append(
          el("option", { value: skin.id, text: "Face of: " + (skin.name.trim() || "Skin " + (i + 1)) })
        );
      });
      iconSkinSelect.value = state.skins.some((s) => s.id === state.icon.skinId) ? state.icon.skinId : state.skins[0].id;
    }
    updateIcons();
  }

  function applyIconMode() {
    $$('input[name="skb-icon-mode"]').forEach((r) => {
      r.checked = r.value === state.icon.mode;
    });
    iconAutoBox.hidden = state.icon.mode !== "auto";
    iconUploadBox.hidden = state.icon.mode !== "upload";
    updateIcons();
    updateSummary();
  }

  $$('input[name="skb-icon-mode"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      state.icon.mode = radio.value;
      applyIconMode();
      scheduleSave();
    })
  );

  iconSkinSelect.addEventListener("change", () => {
    state.icon.skinId = iconSkinSelect.value || null;
    updateIcons();
    scheduleSave();
  });

  $("[data-skb-icon-pick]").addEventListener("click", () => iconFile.click());
  iconFile.addEventListener("change", async () => {
    const file = iconFile.files && iconFile.files[0];
    iconFile.value = "";
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) throw new Error("that isn't an image");
      const img = await loadImage(await readAsDataURL(file));
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
        0, 0, 256, 256
      );
      state.icon.dataUrl = canvas.toDataURL("image/png");
      iconUploadImg = await loadImage(state.icon.dataUrl);
      iconNote.textContent = "Using " + file.name + " (cropped to a square, 256×256).";
      updateIcons();
      updateSummary();
      scheduleSave();
    } catch (error) {
      iconNote.textContent = file.name + ": " + error.message;
    }
  });

  /* ------------------------------------------------------------------ *
   * Summary, checklist and file list
   * ------------------------------------------------------------------ */

  const sumName = $("[data-skb-sum-name]");
  const sumMeta = $("[data-skb-sum-meta]");
  const checkList = $("[data-skb-check]");
  const dlButton = $("[data-skb-download]");
  const dlLabel = $("[data-skb-dl-label]");
  const filesList = $("[data-skb-files]");
  const sizeEl = $("[data-skb-size]");
  const savedNote = $("[data-skb-saved]");

  function slugPack(name) {
    const slug = name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "");
    return slug.slice(0, 40) || "SkinPack";
  }

  function slugSkin(name) {
    return name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 32);
  }

  // One unique, safe id per skin, in order. Used for file names and lang keys.
  function skinIds() {
    const used = new Set();
    return state.skins.map((skin, i) => {
      const base = slugSkin(skin.name) || "skin" + (i + 1);
      let id = base;
      let n = 2;
      while (used.has(id)) id = base + "_" + n++;
      used.add(id);
      return id;
    });
  }

  function problems() {
    const list = [];
    if (!state.name.trim()) list.push("name");
    if (!state.skins.length) list.push("skins");
    if (!parseVersion(state.version)) list.push("version");
    return list;
  }

  function hasIcon() {
    return state.icon.mode === "auto" ? Boolean(state.skins.length) : state.icon.mode === "upload" && Boolean(state.icon.dataUrl);
  }

  function updateSummary() {
    const name = state.name.trim();
    sumName.textContent = name || "Untitled pack";
    sumName.classList.toggle("is-empty", !name);
    const n = state.skins.length;
    sumMeta.textContent = n ? n + (n === 1 ? " skin" : " skins") + " · v" + (parseVersion(state.version) ? state.version : "?") : "No skins yet";

    const issues = problems();
    checkList.textContent = "";
    const item = (ok, text) => el("li", { class: ok ? "is-ok" : "" }, text);
    checkList.append(
      item(!issues.includes("name"), "Pack has a name"),
      item(!issues.includes("skins"), n ? n + (n === 1 ? " skin added" : " skins added") : "At least one skin added")
    );
    if (issues.includes("version")) checkList.append(item(false, "Version looks like 1.0.0"));

    const ready = issues.length === 0;
    dlButton.disabled = !ready;
    dlButton.title = ready ? "" : "Finish the checklist above first";

    // File list
    const ids = skinIds();
    const rows = [["manifest.json", 0], ["skins.json", 0], ["texts/en_US.lang", 0], ["texts/languages.json", 0]];
    let total = 0;
    if (hasIcon()) rows.push(["pack_icon.png", state.icon.mode === "upload" ? dataUrlSize(state.icon.dataUrl) : 0]);
    state.skins.forEach((skin, i) => rows.push([ids[i] + ".png", dataUrlSize(skin.png)]));
    filesList.textContent = "";
    for (const [file, size] of rows) {
      total += size;
      filesList.append(el("li", null, el("span", { text: file }), el("span", { text: size ? formatBytes(size) : "" })));
    }
    sizeEl.textContent = state.skins.length ? "(≈ " + formatBytes(total + 1500) + ")" : "";
  }

  function updateSavedNote() {
    savedNote.textContent = saveOk
      ? "Draft saves automatically on this device."
      : "Couldn't save a draft (browser storage is full or blocked).";
  }

  /* ------------------------------------------------------------------ *
   * ZIP writer (store-only, which is fine for already-compressed PNGs)
   * ------------------------------------------------------------------ */

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeZip(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [];
    const central = [];
    let offset = 0;

    for (const [name, data] of files) {
      const nameBytes = enc.encode(name);
      const crc = crc32(data);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint16(8, 0, true); // stored
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, nameBytes.length, true);
      local.setUint16(28, 0, true);
      parts.push(new Uint8Array(local.buffer), nameBytes, data);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(8, 0x0800, true);
      entry.setUint16(10, 0, true);
      entry.setUint16(12, dosTime, true);
      entry.setUint16(14, dosDate, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, data.length, true);
      entry.setUint32(24, data.length, true);
      entry.setUint16(28, nameBytes.length, true);
      entry.setUint32(42, offset, true);
      central.push(new Uint8Array(entry.buffer), nameBytes);

      offset += 30 + nameBytes.length + data.length;
    }

    const centralSize = central.reduce((sum, part) => sum + part.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);

    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/octet-stream" });
  }

  /* ------------------------------------------------------------------ *
   * Building the pack
   * ------------------------------------------------------------------ */

  const cleanLang = (text) => text.replace(/[\r\n\t]+/g, " ").trim();

  function canvasBytes(canvas) {
    return dataUrlBytes(canvas.toDataURL("image/png"));
  }

  function buildPack() {
    const enc = new TextEncoder();
    const packName = state.name.trim();
    const packId = slugPack(packName);
    const ids = skinIds();
    const version = parseVersion(state.version);
    const author = state.author.trim();
    const description = state.description.trim() || (author ? "Skin pack by " + author : "A skin pack");

    const manifest = {
      format_version: 1,
      header: {
        name: packName,
        description: cleanLang(description),
        uuid: state.uuids.pack,
        version,
      },
      modules: [{ type: "skin_pack", uuid: state.uuids.module, version }],
    };

    const skinsJson = {
      skins: state.skins.map((skin, i) => ({
        localization_name: ids[i],
        geometry: skin.model === "slim" ? "geometry.humanoid.customSlim" : "geometry.humanoid.custom",
        texture: ids[i] + ".png",
        type: "free",
      })),
      serialize_name: packId,
      localization_name: packId,
    };

    const lang =
      ["skinpack." + packId + "=" + cleanLang(packName)]
        .concat(state.skins.map((skin, i) => "skin." + packId + "." + ids[i] + "=" + (cleanLang(skin.name) || "Skin " + (i + 1))))
        .join("\n") + "\n";

    const files = [
      ["manifest.json", enc.encode(JSON.stringify(manifest, null, 2) + "\n")],
      ["skins.json", enc.encode(JSON.stringify(skinsJson, null, 2) + "\n")],
      ["texts/en_US.lang", enc.encode(lang)],
      ["texts/languages.json", enc.encode(JSON.stringify(["en_US"]) + "\n")],
    ];

    if (state.icon.mode === "upload" && state.icon.dataUrl) {
      files.push(["pack_icon.png", dataUrlBytes(state.icon.dataUrl)]);
    } else if (state.icon.mode === "auto") {
      const icon = makeIconCanvas(256);
      if (icon) files.push(["pack_icon.png", canvasBytes(icon)]);
    }

    state.skins.forEach((skin, i) => files.push([ids[i] + ".png", dataUrlBytes(skin.png)]));

    return { blob: makeZip(files), fileName: packId + ".mcpack" };
  }

  dlButton.addEventListener("click", () => {
    if (problems().length) return;
    let result;
    try {
      result = buildPack();
    } catch (error) {
      toast("Something went wrong building the pack. Try again?");
      return;
    }
    const url = URL.createObjectURL(result.blob);
    const link = el("a", { href: url, download: result.fileName });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    toast("Downloaded " + result.fileName + ". Open it with Minecraft to import.");
  });

  /* ---- Start over (two-step so it can't be hit by accident) ---- */

  const resetBtn = $("[data-skb-reset]");
  let resetTimer = 0;
  resetBtn.addEventListener("click", () => {
    if (!resetBtn.dataset.armed) {
      resetBtn.dataset.armed = "1";
      resetBtn.textContent = "Click again to confirm";
      resetTimer = setTimeout(disarmReset, 4000);
      return;
    }
    disarmReset();
    Object.assign(state, freshState());
    iconUploadImg = null;
    iconNote.textContent = "Any square-ish image. It gets cropped and resized to 256×256.";
    clearDraft();
    clearAlert();
    syncForm();
    renderSkins();
    toast("Started a fresh pack.");
  });

  function disarmReset() {
    clearTimeout(resetTimer);
    delete resetBtn.dataset.armed;
    resetBtn.textContent = "Start over";
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function syncForm() {
    nameInput.value = state.name;
    authorInput.value = state.author;
    descInput.value = state.description;
    versionInput.value = state.version;
    versionInput.setAttribute("aria-invalid", parseVersion(state.version) ? "false" : "true");
    showUuids();
    applyIconMode();
  }

  loadDraft();
  const boot = state.icon.mode === "upload" && state.icon.dataUrl
    ? loadImage(state.icon.dataUrl).then((img) => {
        iconUploadImg = img;
      }).catch(() => {})
    : Promise.resolve();
  syncForm();
  renderSkins();
  updateSavedNote();
  boot.then(updateIcons);
})();
