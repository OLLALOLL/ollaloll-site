(() => {
  "use strict";
  const root = document.querySelector("[data-cv]");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const drop = $("[data-cv-drop]"), fileIn = $("[data-cv-file]"), alertBox = $("[data-cv-alert]");
  const results = $("[data-cv-results]"), list = $("[data-cv-list]"), count = $("[data-cv-count]");
  const zipBtn = $("[data-cv-zip]"), overlay = document.querySelector("[data-cv-overlay]");

  const items = []; // { id, name, blob, url, srcSize, w, h }
  let nextId = 1;

  const fmt = (n) => (n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB");
  const baseName = (n) => (n.replace(/\.[^.]+$/, "") || "image").replace(/[\\/:*?"<>|]+/g, "_");
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function uniqueName(base) {
    let name = base + ".png", i = 2;
    while (items.some((it) => it.name === name)) name = base + "-" + i++ + ".png";
    return name;
  }

  async function decode(file) {
    if (window.createImageBitmap) {
      try { const bmp = await createImageBitmap(file); return { src: bmp, w: bmp.width, h: bmp.height }; } catch (e) { /* fall back */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      return { src: img, w: img.naturalWidth, h: img.naturalHeight };
    } finally { URL.revokeObjectURL(url); }
  }

  async function convert(file) {
    const { src, w, h } = await decode(file);
    if (!w || !h) throw new Error("empty image");
    if (w * h > 100e6) throw new Error("too large (over 100 megapixels)");
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(src, 0, 0);
    if (src.close) src.close();
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    if (!blob) throw new Error("couldn't encode PNG");
    return { blob, w, h };
  }

  function showAlert(lines) {
    alertBox.textContent = "";
    lines.forEach((l) => alertBox.append(el("p", null, l)));
    alertBox.hidden = !lines.length;
  }

  async function addFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const problems = [];
    drop.querySelector("[data-cv-drop-title]").textContent = "Converting…";
    for (const file of files) {
      if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) { problems.push(file.name + ": not an image"); continue; }
      try {
        const out = await convert(file);
        items.push({ id: nextId++, name: uniqueName(baseName(file.name)), blob: out.blob, url: URL.createObjectURL(out.blob), srcSize: file.size, w: out.w, h: out.h });
      } catch (e) {
        problems.push(file.name + ": " + (e.message || "couldn't read this image"));
      }
    }
    drop.querySelector("[data-cv-drop-title]").textContent = "Choose images or drop them here";
    showAlert(problems.length ? ["Couldn't convert " + problems.length + (problems.length === 1 ? " file:" : " files:")].concat(problems) : []);
    render();
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([blob], { type: "application/octet-stream" }));
    a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function render() {
    results.hidden = !items.length;
    list.textContent = "";
    items.forEach((it) => {
      const li = el("li", "cv-item");
      const img = el("img", "cv-thumb"); img.src = it.url; img.alt = ""; img.loading = "lazy";
      const info = el("div", "cv-info");
      info.append(el("span", "cv-name", it.name), el("span", "cv-meta", it.w + "×" + it.h + " · " + fmt(it.srcSize) + " → " + fmt(it.blob.size)));
      const actions = el("div", "cv-actions");
      const dl = el("button", "btn btn-primary btn-small", "Download"); dl.type = "button";
      dl.addEventListener("click", () => download(it.blob, it.name));
      const rm = el("button", "cv-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + it.name);
      rm.addEventListener("click", () => { URL.revokeObjectURL(it.url); items.splice(items.indexOf(it), 1); render(); });
      actions.append(dl, rm);
      li.append(img, info, actions);
      list.append(li);
    });
    count.textContent = items.length + (items.length === 1 ? " image converted" : " images converted");
    zipBtn.hidden = items.length < 2;
  }

  /* ---- store-only ZIP ---- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return ~c >>> 0; };
  async function makeZip(entries) {
    const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
    for (const { name, blob } of entries) {
      const data = new Uint8Array(await blob.arrayBuffer()), nm = enc.encode(name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true);
      parts.push(lh, nm, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
      central.push(ch, nm);
      offset += 30 + nm.length + data.length;
    }
    const csize = central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  zipBtn.addEventListener("click", async () => { download(await makeZip(items), "converted-png.zip"); });
  $("[data-cv-clear]").addEventListener("click", () => { items.forEach((i) => URL.revokeObjectURL(i.url)); items.length = 0; showAlert([]); render(); });
  $("[data-cv-add]").addEventListener("click", () => fileIn.click());
  drop.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", () => { addFiles(fileIn.files).then(() => { fileIn.value = ""; }); });

  /* ---- drag and drop anywhere ---- */
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
  window.addEventListener("dragenter", (e) => { if (hasFiles(e)) { depth++; overlay.hidden = false; } });
  window.addEventListener("dragleave", (e) => { if (hasFiles(e) && --depth <= 0) { depth = 0; overlay.hidden = true; } });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("drop", (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; overlay.hidden = true; addFiles(e.dataTransfer.files); });
})();
