(function () {
  "use strict";

  const SITE = {
    email: "ollaloll@outlook.com",
    siteUrl: "https://ollaloll.com",
    supabase: {
      url: "https://zrslvneipbgtivhlygfd.supabase.co",
      key: "sb_publishable_3M5msWhxHlC7cOfY5X4NeQ_Lbc1bR3f",
    },
  };
  const S = SITE;
  const SB = S.supabase || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const IMAGES = "project-images";
  const FILES = "project-files";
  const LIB_IMAGES = "library-images";
  const MAX_LIB_FIELDS = 20;
  const MAX_RELATED = 10;
  const MAX_IMAGES = 5;
  const MAX_TAGS = 8;
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAX_EDGE = 1600;
  const FILE_TYPES = /\.(mcpack|mcaddon|mcworld|mctemplate|zip)$/i;
  const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const POLL_MS = 60000;

  const TYPES = { texturepack: "Texture pack", addon: "Addon", script: "Script" };
  const TYPE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>';
  const GRIP =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

  const dateFormat = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isWebUrl = (value) => /^https?:\/\//i.test(value || "");

  function el(tag, attrs = {}, kids = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value == null) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else node.setAttribute(key, value === true ? "" : value);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((kid) => {
      if (kid != null) node.append(kid);
    });
    return node;
  }

  let toastStack = null;

  function ensureToastStack() {
    if (!toastStack || !toastStack.isConnected) {
      toastStack = el("div", { class: "toast-stack", role: "status", "aria-live": "polite", "aria-atomic": "false" });
      document.body.append(toastStack);
    }
    return toastStack;
  }

  function showToast(message, isError) {
    if (!message) return;
    const stack = ensureToastStack();
    const last = stack.lastElementChild;
    if (last && last.textContent === message && last.classList.contains("is-error") === Boolean(isError)) {
      // Avoid stacking an identical toast back-to-back (e.g. "Saving..." shown twice during one save).
      return;
    }
    const toast = el("div", { class: "toast" + (isError ? " is-error" : ""), tabindex: "0" }, el("span", { text: message }));
    const remove = () => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 220);
    };
    toast.addEventListener("click", remove);
    stack.append(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(remove, 4200);
  }

  function skeletonBlock(count) {
    return el(
      "div",
      { class: "skeleton-group", "aria-hidden": "true" },
      Array.from({ length: count || 3 }, () =>
        el("div", { class: "skeleton-card" }, [
          el("div", { class: "skeleton-line skeleton-line-title" }),
          el("div", { class: "skeleton-line" }),
          el("div", { class: "skeleton-line skeleton-line-short" }),
        ])
      )
    );
  }

  function parseDmy(text) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
    if (!match) return null;
    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  function isoToDmy(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    return day + "/" + month + "/" + year;
  }

  function formatDmyTyping(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let out = digits.slice(0, 2);
    if (digits.length > 2) out += "/" + digits.slice(2, 4);
    if (digits.length > 4) out += "/" + digits.slice(4);
    return out;
  }

  const todayDmy = () => isoToDmy(new Date().toISOString().slice(0, 10));

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function slugify(text) {
    return (
      text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['\u2019]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "") || "project"
    );
  }

  function capitalizeFirst(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed;
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  const views = {
    loading: $("#view-loading"),
    setup: $("#view-setup"),
    login: $("#view-login"),
    denied: $("#view-denied"),
    app: $("#view-app"),
  };

  function show(name) {
    Object.entries(views).forEach(([key, node]) => (node.hidden = key !== name));
    $("#user-bar").hidden = name !== "app" && name !== "denied";
  }

  function setStatus(node, text, isError) {
    node.textContent = text;
    node.hidden = true;
    if (text) showToast(text, isError);
  }

  if (!SB.url || !SB.key || !window.supabase) {
    show("setup");
    return;
  }

  const sb = window.supabase.createClient(SB.url, SB.key);
  const imageBucket = () => sb.storage.from(IMAGES);
  const fileBucket = () => sb.storage.from(FILES);

  async function callGenerate(payload) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session ? data.session.access_token : null;
    if (!token) throw new Error("not_signed_in");
    const response = await fetch(SB.url + "/functions/v1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB.key, Authorization: "Bearer " + token },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json.error || "failed");
      error.code = json.error;
      throw error;
    }
    return json.text;
  }

  function generateMessageFor(code) {
    if (code === "forbidden" || code === "not_signed_in") return "You need to be signed in as the admin to use Generate.";
    if (code === "config") return "Generate isn't set up yet — the GEMINI_API_KEY secret is missing on the server.";
    if (code === "ai_failed" || code === "ai_empty") return "The AI didn't return anything usable. Try again.";
    return "Couldn't generate that. Please try again.";
  }

  function wireGenerateButton(button, getPayload, onResult) {
    if (!button) return;
    button.addEventListener("click", async () => {
      const payload = getPayload();
      if (!payload) return;
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Generating…";
      try {
        const text = await callGenerate(payload);
        onResult(text);
      } catch (error) {
        showToast(generateMessageFor(error.code), true);
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  const form = $("#project-form");
  const formStatus = $("#form-status");
  const listStatus = $("#list-status");
  const saveButton = $("#save");
  const cancelButton = $("#cancel");
  const thumbs = $("#thumbs");
  const imageInput = $("#p-images");
  const fileInput = $("#p-file");

  let lastUserId;
  let projects = [];
  let editing = null;
  let originalImages = [];
  let originalFilePath = null;
  let images = [];
  let fileState = null;
  let slugTouched = false;
  let dragId = null;
  let pollTimer = null;

  function pathFromUrl(url, bucket) {
    const marker = "/object/public/" + bucket + "/";
    const at = url.indexOf(marker);
    return at < 0 ? null : decodeURIComponent(url.slice(at + marker.length));
  }

  async function toWebp(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not convert the image."))), "image/webp", 0.85)
    );
  }

  const TAB_ORDER = ["projects", "messages", "bugreports", "dictionary", "quotes", "library", "extras", "words"];
  const TAB_LABELS = {
    projects: "Projects",
    messages: "Messages",
    bugreports: "Bug Reports",
    dictionary: "Dictionary",
    quotes: "Quotes",
    library: "Library",
    extras: "Extras",
    words: "Words",
  };
  const adminNav = $("#admin-nav");
  const adminNavCurrent = $("#admin-nav-current");
  const tabs = {
    projects: $("#tab-projects"),
    messages: $("#tab-messages"),
    bugreports: $("#tab-bugreports"),
    dictionary: $("#tab-dictionary"),
    quotes: $("#tab-quotes"),
    library: $("#tab-library"),
    extras: $("#tab-events"),
    words: $("#tab-words"),
  };
  const panes = {
    projects: $("#pane-projects"),
    messages: $("#pane-messages"),
    bugreports: $("#pane-bugreports"),
    dictionary: $("#pane-dictionary"),
    quotes: $("#pane-quotes"),
    library: $("#pane-library"),
    extras: $("#pane-events"),
    words: $("#pane-words"),
  };

  function tabFromPath() {
    const clean = location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
    const last = clean.split("/").pop();
    return TAB_ORDER.includes(last) ? last : "projects";
  }

  function selectTab(name, focus) {
    Object.keys(tabs).forEach((key) => {
      tabs[key].setAttribute("aria-selected", String(key === name));
      tabs[key].tabIndex = key === name ? 0 : -1;
      panes[key].hidden = key !== name;
    });
    if (adminNavCurrent && TAB_LABELS[name]) adminNavCurrent.textContent = TAB_LABELS[name];
    if (adminNav) adminNav.open = false;
    if (focus) tabs[name].focus();
    if (location.pathname.startsWith("/admin")) history.replaceState(null, "", "/admin/" + name);
    if (name === "messages") loadMessages();
    if (name === "bugreports") loadBugReports();
    if (name === "dictionary") loadDictionary();
    if (name === "quotes") loadQuotes();
    if (name === "library") loadLibrary();
    if (name === "extras") loadEvents();
    if (name === "words") loadWords();
  }

  Object.entries(tabs).forEach(([name, tab]) => {
    tab.addEventListener("click", () => selectTab(name, false));
    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const from = TAB_ORDER.indexOf(name);
        const to = (from + (event.key === "ArrowRight" ? 1 : TAB_ORDER.length - 1)) % TAB_ORDER.length;
        selectTab(TAB_ORDER[to], true);
      }
    });
  });

  if (adminNav) {
    document.addEventListener("click", (event) => {
      if (adminNav.open && !adminNav.contains(event.target)) adminNav.open = false;
    });
  }

  function route(session) {
    const user = session ? session.user : null;
    const id = user ? user.id : null;
    if (id === lastUserId) return;
    lastUserId = id;
    clearInterval(pollTimer);

    if (!user) {
      show("login");
      return;
    }
    $("#who").textContent = user.email;
    const isOwner = (user.email || "").toLowerCase() === (S.email || "").toLowerCase();
    show(isOwner ? "app" : "denied");
    if (isOwner) {
      selectTab(tabFromPath(), false);
      resetForm();
      resetDictForm();
      resetQuoteForm();
      resetLibForm();
      resetEventForm();
      loadList();
      loadMessages();
      loadBugReports();
      loadDictionary();
      loadQuotes();
      loadLibrary();
      loadEvents();
      loadWords();
      pollTimer = setInterval(() => {
        loadMessages();
        loadBugReports();
      }, POLL_MS);
    }
  }

  async function start() {
    const { data } = await sb.auth.getSession();
    route(data.session);
    sb.auth.onAuthStateChange((event, session) => setTimeout(() => route(session), 0));
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("#login-status");
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;
    if (!email || !password) {
      setStatus(status, "Enter your email and password.", true);
      return;
    }
    setStatus(status, "Signing in...");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(status, "Email or password is incorrect.", true);
      return;
    }
    $("#login-password").value = "";
    setStatus(status, "");
  });

  $("#sign-out").addEventListener("click", async () => {
    await sb.auth.signOut();
  });

  function renderThumbs() {
    thumbs.replaceChildren(
      ...images.map((item, index) => {
        const move = (by) => {
          const target = index + by;
          [images[index], images[target]] = [images[target], images[index]];
          renderThumbs();
        };
        const earlier = el("button", { class: "mini", type: "button", text: "Earlier", "aria-label": "Move image " + (index + 1) + " earlier" });
        const later = el("button", { class: "mini", type: "button", text: "Later", "aria-label": "Move image " + (index + 1) + " later" });
        const remove = el("button", { class: "mini mini-danger", type: "button", text: "Remove", "aria-label": "Remove image " + (index + 1) });
        earlier.disabled = index === 0;
        later.disabled = index === images.length - 1;
        earlier.addEventListener("click", () => move(-1));
        later.addEventListener("click", () => move(1));
        remove.addEventListener("click", () => {
          if (item.preview) URL.revokeObjectURL(item.preview);
          images.splice(index, 1);
          renderThumbs();
        });
        return el("li", { class: "tile" }, [
          el("img", { src: item.preview || item.url, alt: "Image " + (index + 1) + " preview" }),
          el("span", { class: "tile-order", text: String(index + 1) }),
          el("div", { class: "tile-actions" }, [earlier, later, remove]),
        ]);
      })
    );
    $("#error-images").textContent = "";
  }

  imageInput.addEventListener("change", () => {
    const error = $("#error-images");
    error.textContent = "";
    const room = MAX_IMAGES - images.length;
    const accepted = [];
    let skipped = 0;

    Array.from(imageInput.files).forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES || accepted.length >= room) skipped++;
      else accepted.push(file);
    });

    accepted.forEach((file) => images.push({ file, preview: URL.createObjectURL(file) }));
    imageInput.value = "";
    renderThumbs();
    if (skipped) {
      error.textContent =
        "Skipped " + skipped + " file" + (skipped === 1 ? "" : "s") + ". Only images under 15 MB are accepted, and a project holds up to " + MAX_IMAGES + ".";
    }
  });

  const currentSource = () => $('input[name="source"]:checked', form).value;

  function setSource(value) {
    $('input[name="source"][value="' + value + '"]', form).checked = true;
    applySource();
  }

  function applySource() {
    const source = currentSource();
    $("#source-box").hidden = source === "none";
    $("#source-link").hidden = source !== "link";
    $("#source-file").hidden = source !== "file";
  }

  $$('input[name="source"]', form).forEach((radio) => radio.addEventListener("change", applySource));

  function renderFile() {
    const box = $("#file-current");
    box.hidden = !fileState;
    if (!fileState) return;
    $("#file-name").textContent = fileState.name;
    $("#file-size").textContent = formatSize(fileState.size) + (fileState.file ? " (not uploaded yet)" : "");
    const downloads = $("#file-downloads");
    downloads.hidden = fileState.downloads == null;
    if (fileState.downloads != null) downloads.textContent = fileState.downloads + (fileState.downloads === 1 ? " download" : " downloads");
    $("#file-pick").textContent = "Choose a different file";
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    const error = $("#error-file");
    error.textContent = "";
    if (!file) return;
    if (!FILE_TYPES.test(file.name)) {
      error.textContent = "Choose a .mcpack, .mcaddon, .mcworld, .mctemplate or .zip file.";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      error.textContent = "That file is over 50 MB.";
      return;
    }
    fileState = { file, name: file.name, size: file.size };
    renderFile();
  });

  function bindCount(field, counter, max) {
    const update = () => (counter.textContent = field.value.length + " / " + max);
    field.addEventListener("input", update);
    return update;
  }

  const updateDescriptionCount = bindCount($("#p-description"), $("#description-count"), 400);
  const updateDetailsCount = bindCount($("#p-details"), $("#details-count"), 6000);
  const updateInstallCount = bindCount($("#p-install"), $("#install-count"), 1000);
  const updateNotesCount = bindCount($("#u-notes"), $("#notes-count"), 1000);

  function updateSlugHint() {
    const slug = form.elements.slug.value.trim();
    $("#slug-hint").textContent = slug ? "Project page: " + (S.siteUrl || "") + "/project.html?p=" + slug : "Made from the project name. You can change it.";
  }

  function uniqueSlug(base, ownId) {
    const taken = new Set(projects.filter((project) => project.id !== ownId).map((project) => project.slug));
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = base + "-" + n++;
    return slug;
  }

  form.elements.name.addEventListener("input", () => {
    if (slugTouched) return;
    form.elements.slug.value = uniqueSlug(slugify(form.elements.name.value), editing ? editing.id : null);
    updateSlugHint();
  });

  form.elements.slug.addEventListener("input", () => {
    slugTouched = true;
    updateSlugHint();
  });

  function resetForm() {
    images.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    images = [];
    originalImages = [];
    originalFilePath = null;
    fileState = null;
    editing = null;
    slugTouched = false;
    form.reset();
    applySource();
    $("#form-title").textContent = "Add a project";
    saveButton.textContent = "Add project";
    cancelButton.hidden = true;
    $("#changelog-panel").hidden = true;
    $$(".error", form).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", form).forEach((node) => node.removeAttribute("aria-invalid"));
    updateDescriptionCount();
    updateDetailsCount();
    updateInstallCount();
    updateSlugHint();
    renderThumbs();
    renderFile();
  }

  const downloadCount = (project) => ((project.download_events || [])[0] || {}).count || 0;

  function fillForm(project) {
    resetForm();
    editing = project;
    slugTouched = true;
    originalImages = (project.images || []).slice();
    originalFilePath = project.file_path || null;
    form.elements.name.value = project.name;
    form.elements.slug.value = project.slug;
    form.elements.description.value = project.description;
    form.elements.details.value = project.details || "";
    form.elements.install_note.value = project.install_note || "";
    form.elements.release_date.value = isoToDmy(project.release_date);
    form.elements.version.value = project.version || "";
    form.elements.tags.value = (project.tags || []).join(", ");
    form.elements.page_url.value = project.page_url || "";
    form.elements.page_label.value = project.page_label || "";
    form.elements.download_label.value = project.download_label || "";
    form.elements.featured.checked = Boolean(project.featured);
    form.elements.is_draft.checked = Boolean(project.is_draft);
    const radio = $('input[name="type"][value="' + project.type + '"]', form);
    if (radio) radio.checked = true;

    if (project.file_path) {
      setSource("file");
      fileState = { path: project.file_path, name: project.file_name, size: project.file_size || 0, downloads: downloadCount(project) };
    } else if (project.download_url) {
      setSource("link");
      form.elements.download_url.value = project.download_url;
    }

    images = (project.images || []).map((url) => ({ url }));
    $("#form-title").textContent = "Edit project";
    saveButton.textContent = "Save changes";
    cancelButton.hidden = false;
    updateDescriptionCount();
    updateDetailsCount();
    updateInstallCount();
    updateSlugHint();
    renderThumbs();
    renderFile();
    showChangelog(project);
    setStatus(formStatus, "");
    $("#form-title").scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.name.focus({ preventScroll: true });
  }

  cancelButton.addEventListener("click", () => {
    resetForm();
    setStatus(formStatus, "");
  });

  function readForm() {
    const seen = new Set();
    const tags = form.elements.tags.value
      .split(",")
      .map((tag) => tag.trim().slice(0, 30))
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (!tag || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_TAGS);

    const source = currentSource();
    const downloadUrl = source === "link" ? form.elements.download_url.value.trim() : "";
    const pageUrl = form.elements.page_url.value.trim();

    return {
      source,
      row: {
        name: form.elements.name.value.trim(),
        slug: form.elements.slug.value.trim(),
        description: form.elements.description.value.trim(),
        details: form.elements.details.value.trim() || null,
        install_note: form.elements.install_note.value.trim() || null,
        type: $('input[name="type"]:checked', form).value,
        release_date: parseDmy(form.elements.release_date.value),
        version: form.elements.version.value.trim() || null,
        tags,
        featured: form.elements.featured.checked,
        is_draft: form.elements.is_draft.checked,
        download_url: downloadUrl || null,
        download_label: source === "none" ? null : form.elements.download_label.value.trim() || null,
        page_url: pageUrl || null,
        page_label: pageUrl ? form.elements.page_label.value.trim() || null : null,
      },
    };
  }

  const FIELD_ERRORS = { name: "name", slug: "slug", description: "description", release_date: "date", download_url: "download", page_url: "page" };

  function validate({ source, row }) {
    const otherSlugTaken = projects.some((project) => project.slug === row.slug && (!editing || project.id !== editing.id));
    const messages = {
      name: row.name ? "" : "Enter a project name.",
      slug: !SLUG_FORMAT.test(row.slug)
        ? "Use lowercase letters, numbers and single dashes, like my-project."
        : otherSlugTaken
        ? "Another project already uses this page address."
        : "",
      description: row.description ? "" : "Enter a short description.",
      release_date: row.release_date ? "" : "Enter the release date as DD/MM/YYYY, for example 01/09/2026.",
      download_url: source !== "link" || isWebUrl(row.download_url) ? "" : "Enter a link that starts with http:// or https://.",
      page_url: !row.page_url || isWebUrl(row.page_url) ? "" : "The link must start with http:// or https://.",
    };
    const fileMessage = source === "file" && !fileState ? "Choose a file to upload." : "";
    let first = null;
    Object.keys(messages).forEach((field) => {
      const input = form.elements[field];
      $("#error-" + FIELD_ERRORS[field]).textContent = messages[field];
      if (messages[field]) {
        input.setAttribute("aria-invalid", "true");
        if (!first) first = input;
      } else {
        input.removeAttribute("aria-invalid");
      }
    });
    $("#error-file").textContent = fileMessage;
    if (fileMessage && !first) first = $("#file-pick");
    if (first) first.focus();
    return !first;
  }

  form.elements.release_date.addEventListener("input", (event) => {
    event.target.value = formatDmyTyping(event.target.value);
  });

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.getAttribute("aria-invalid") && FIELD_ERRORS[field.name]) {
      field.removeAttribute("aria-invalid");
      $("#error-" + FIELD_ERRORS[field.name]).textContent = "";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm();
    if (!validate(data)) return;

    saveButton.disabled = true;
    setStatus(formStatus, "Saving...");

    const id = editing ? editing.id : uuid();
    const uploadedImages = [];
    let uploadedFile = null;

    try {
      const urls = [];
      for (const item of images) {
        if (item.url) {
          urls.push(item.url);
          continue;
        }
        const blob = await toWebp(item.file);
        const path = id + "/" + uuid() + ".webp";
        const { error } = await imageBucket().upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        uploadedImages.push(path);
        urls.push(imageBucket().getPublicUrl(path).data.publicUrl);
      }

      let fileFields = { file_path: null, file_name: null, file_size: null };
      if (data.source === "file" && fileState) {
        if (fileState.file) {
          setStatus(formStatus, "Uploading file...");
          const file = fileState.file;
          const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
          const path = id + "/" + uuid().slice(0, 8) + "-" + safe;
          const { error } = await fileBucket().upload(path, file, { contentType: file.type || "application/octet-stream", cacheControl: "3600" });
          if (error) throw error;
          uploadedFile = path;
          fileFields = { file_path: path, file_name: file.name.slice(0, 200), file_size: file.size };
        } else {
          fileFields = { file_path: fileState.path, file_name: fileState.name, file_size: fileState.size };
        }
      }

      setStatus(formStatus, "Saving...");
      const row = Object.assign({}, data.row, fileFields, { images: urls });
      const { error } = editing
        ? await sb.from("projects").update(row).eq("id", id)
        : await sb.from("projects").insert(Object.assign({ id }, row));
      if (error) throw error;

      const kept = new Set(urls);
      const goneImages = originalImages.filter((url) => !kept.has(url)).map((url) => pathFromUrl(url, IMAGES)).filter(Boolean);
      if (goneImages.length) await imageBucket().remove(goneImages);
      if (originalFilePath && originalFilePath !== fileFields.file_path) await fileBucket().remove([originalFilePath]);

      const wasEditing = Boolean(editing);
      resetForm();
      setStatus(formStatus, wasEditing ? "Changes saved." : "Project added.");
      await loadList();
    } catch (error) {
      if (uploadedImages.length) await imageBucket().remove(uploadedImages);
      if (uploadedFile) await fileBucket().remove([uploadedFile]);
      const duplicate = /projects_slug_key|duplicate key/i.test(error.message || "");
      if (duplicate) $("#error-slug").textContent = "Another project already uses this page address.";
      setStatus(formStatus, duplicate ? "Could not save: the page address is already used." : "Could not save: " + (error.message || "unknown error"), true);
    } finally {
      saveButton.disabled = false;
    }
  });

  const updatesList = $("#updates-list");
  const updateStatus = $("#update-status");

  function renderUpdates() {
    const updates = (editing && editing.project_updates) || [];
    updatesList.replaceChildren(
      ...(updates.length
        ? updates.map((update) => {
            const remove = el("button", { class: "mini mini-danger", type: "button", text: "Delete" });
            remove.addEventListener("click", async () => {
              if (!window.confirm("Delete this update?")) return;
              const { error } = await sb.from("project_updates").delete().eq("id", update.id);
              if (error) setStatus(updateStatus, "Could not delete the update: " + error.message, true);
              else reloadUpdates();
            });
            return el("li", { class: "update-row" }, [
              el("div", {}, [
                update.version ? el("strong", { text: update.version + " " }) : null,
                el("span", { class: "meta-text", text: dateFormat.format(new Date(update.released_on)) }),
              ]),
              remove,
              el("p", { text: update.notes }),
            ]);
          })
        : [el("li", { class: "empty", text: "No updates yet." })])
    );
  }

  function showChangelog(project) {
    $("#changelog-panel").hidden = false;
    $("#changelog-title").textContent = "Changelog for " + project.name;
    $("#u-version").value = "";
    $("#u-notes").value = "";
    $("#u-date").value = todayDmy();
    updateNotesCount();
    setStatus(updateStatus, "");
    renderUpdates();
  }

  async function reloadUpdates() {
    if (!editing) return;
    const { data, error } = await sb
      .from("project_updates")
      .select("*")
      .eq("project_id", editing.id)
      .order("released_on", { ascending: false });
    if (error) {
      setStatus(updateStatus, "Could not load updates: " + error.message, true);
      return;
    }
    editing.project_updates = data;
    renderUpdates();
  }

  $("#u-date").addEventListener("input", (event) => {
    event.target.value = formatDmyTyping(event.target.value);
  });

  $("#add-update").addEventListener("click", async () => {
    if (!editing) return;
    const date = parseDmy($("#u-date").value);
    const notes = $("#u-notes").value.trim();
    $("#error-update-date").textContent = date ? "" : "Enter the date as DD/MM/YYYY.";
    $("#error-update-notes").textContent = notes ? "" : "Write what changed.";
    if (!date || !notes) return;
    const { error } = await sb
      .from("project_updates")
      .insert({ project_id: editing.id, version: $("#u-version").value.trim() || null, released_on: date, notes });
    if (error) {
      setStatus(updateStatus, "Could not add the update: " + error.message, true);
      return;
    }
    $("#u-version").value = "";
    $("#u-notes").value = "";
    updateNotesCount();
    setStatus(updateStatus, "Update added.");
    reloadUpdates();
  });

  const sameGroup = (a, b) => Boolean(a.featured) === Boolean(b.featured);

  async function persistOrder() {
    renderList();
    const changes = projects.map((project, i) => ({ project, order: i + 1 })).filter((item) => item.project.sort_order !== item.order);
    try {
      await Promise.all(
        changes.map(async ({ project, order }) => {
          const { error } = await sb.from("projects").update({ sort_order: order }).eq("id", project.id);
          if (error) throw error;
          project.sort_order = order;
        })
      );
      setStatus(listStatus, "");
    } catch (error) {
      setStatus(listStatus, "Could not save the new order: " + error.message, true);
      loadList();
    }
  }

  function moveBy(project, delta) {
    const from = projects.indexOf(project);
    let to = from + delta;
    while (to >= 0 && to < projects.length && !sameGroup(projects[to], project)) to += delta;
    if (to < 0 || to >= projects.length) return;
    [projects[from], projects[to]] = [projects[to], projects[from]];
    persistOrder();
  }

  function dropOn(target, after) {
    const moved = projects.find((project) => project.id === dragId);
    if (!moved || moved === target || !sameGroup(moved, target)) return;
    projects.splice(projects.indexOf(moved), 1);
    projects.splice(projects.indexOf(target) + (after ? 1 : 0), 0, moved);
    persistOrder();
  }

  async function toggleFlag(project, field) {
    const { error } = await sb.from("projects").update({ [field]: !project[field] }).eq("id", project.id);
    if (error) setStatus(listStatus, "Could not update the project: " + error.message, true);
    else loadList();
  }

  function projectRow(project) {
    const first = (project.images || [])[0];
    const rowNode = el("li", { class: "project-row", draggable: "true" });
    const clearMarks = () => $$(".project-row").forEach((node) => node.classList.remove("drop-before", "drop-after"));

    rowNode.addEventListener("dragstart", (event) => {
      dragId = project.id;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", project.id);
      rowNode.classList.add("is-dragging");
    });
    rowNode.addEventListener("dragend", () => {
      dragId = null;
      rowNode.classList.remove("is-dragging");
      clearMarks();
    });
    rowNode.addEventListener("dragover", (event) => {
      const moved = projects.find((item) => item.id === dragId);
      if (!moved || moved === project || !sameGroup(moved, project)) return;
      event.preventDefault();
      const box = rowNode.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      clearMarks();
      rowNode.classList.add(after ? "drop-after" : "drop-before");
    });
    rowNode.addEventListener("dragleave", () => rowNode.classList.remove("drop-before", "drop-after"));
    rowNode.addEventListener("drop", (event) => {
      event.preventDefault();
      const box = rowNode.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      clearMarks();
      dropOn(project, after);
    });

    const act = (label, handler, className = "mini") => {
      const button = el("button", { class: className, type: "button", text: label });
      button.addEventListener("click", handler);
      return button;
    };
    const edit = act("Edit", () => fillForm(project), "btn btn-ghost btn-small");
    const remove = act("Delete", () => deleteProject(project), "btn btn-danger btn-small");

    const bits = [TYPES[project.type] || "Project"];
    if (project.release_date) bits.push(dateFormat.format(new Date(project.release_date)));
    const count = (project.images || []).length;
    bits.push(count + (count === 1 ? " image" : " images"));

    const flags = [];
    if (project.featured) flags.push(el("span", { class: "badge badge-featured", text: "Featured" }));
    if (project.is_draft) flags.push(el("span", { class: "badge", text: "Draft (hidden)" }));

    const info = [el("strong", { text: project.name }), el("span", { text: bits.join(" \u00b7 ") })];
    if (flags.length) info.push(el("span", { class: "row-flags" }, flags));
    if (project.file_path) {
      const downloads = downloadCount(project);
      info.push(
        el("span", {}, [
          el("span", { class: "stat", text: downloads + (downloads === 1 ? " download" : " downloads") }),
          document.createTextNode(" \u00b7 " + project.file_name + " (" + formatSize(project.file_size || 0) + ")"),
        ])
      );
    } else if (project.download_url) {
      info.push(el("span", { text: "Download link (downloads are not counted for links)" }));
    }
    const updates = (project.project_updates || []).length;
    if (updates) info.push(el("span", { text: updates + (updates === 1 ? " changelog entry" : " changelog entries") }));

    const handle = el("span", { class: "drag-handle", "aria-hidden": "true", html: GRIP });
    rowNode.append(
      handle,
      el("div", { class: "row-thumb" }, first ? el("img", { src: first, alt: "" }) : el("span", { html: TYPE_ICON })),
      el("div", { class: "row-info" }, info),
      el("div", { class: "row-actions" }, [
        act("Up", () => moveBy(project, -1)),
        act("Down", () => moveBy(project, 1)),
        act(project.featured ? "Unpin" : "Pin", () => toggleFlag(project, "featured")),
        act(project.is_draft ? "Publish" : "Unpublish", () => toggleFlag(project, "is_draft")),
        edit,
        remove,
      ])
    );
    return rowNode;
  }

  function renderList() {
    $("#project-list").replaceChildren(
      ...(projects.length ? projects.map(projectRow) : [el("li", { class: "empty", text: "No projects yet. Add your first one above." })])
    );
    const withFiles = projects.filter((project) => project.file_path);
    const total = withFiles.reduce((sum, project) => sum + downloadCount(project), 0);
    const totalNode = $("#download-total");
    totalNode.hidden = !withFiles.length;
    totalNode.textContent = "Total downloads: " + total;
  }

  async function loadList() {
    setStatus(listStatus, "");
    const { data, error } = await sb
      .from("projects")
      .select("*, download_events(count), project_updates(id,version,released_on,notes)")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("release_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("released_on", { referencedTable: "project_updates", ascending: false });
    if (error) {
      setStatus(listStatus, "Could not load projects: " + error.message, true);
      return;
    }
    projects = data;
    renderList();
  }

  async function deleteProject(project) {
    if (!window.confirm('Delete "' + project.name + '"? This cannot be undone.')) return;
    setStatus(listStatus, "");
    const { error } = await sb.from("projects").delete().eq("id", project.id);
    if (error) {
      setStatus(listStatus, "Could not delete: " + error.message, true);
      return;
    }
    const imagePaths = (project.images || []).map((url) => pathFromUrl(url, IMAGES)).filter(Boolean);
    if (imagePaths.length) await imageBucket().remove(imagePaths);
    if (project.file_path) await fileBucket().remove([project.file_path]);
    if (editing && editing.id === project.id) resetForm();
    await loadList();
  }

  const xmlEscape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  $("#sitemap").addEventListener("click", () => {
    const base = (S.siteUrl || location.origin).replace(/\/$/, "");
    const today = new Date().toISOString().slice(0, 10);
    // Clean (no .html, no query-string) section pages only — matches the site's
    // actual URL scheme and the hand-maintained sitemap.xml it ships with.
    // Deep per-project/per-term/per-library-entry pages are intentionally left
    // out: they're reachable by crawling their index page and churn too often
    // to track individual lastmod dates for here.
    const urls = ["/", "/projects", "/about", "/contact", "/report-bug", "/dictionary", "/quotes", "/extras", "/library", "/notwordle"].map(
      (path) => ({ loc: base + path, lastmod: today })
    );
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((url) => "  <url>\n    <loc>" + xmlEscape(url.loc) + "</loc>\n    <lastmod>" + url.lastmod + "</lastmod>\n  </url>\n").join("") +
      "</urlset>\n";
    const link = el("a", { href: URL.createObjectURL(new Blob([xml], { type: "application/xml" })), download: "sitemap.xml" });
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(listStatus, "Sitemap downloaded. Put sitemap.xml in your site folder, replacing the old one, and upload the site again.");
    listStatus.classList.remove("is-error");
  });

  const messagesStatus = $("#messages-status");

  function messageItem(message) {
    const toggleRead = el("button", { class: "btn btn-ghost btn-small", type: "button", text: message.is_read ? "Mark as unread" : "Mark as read" });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });
    const isDiscord = Boolean(message.discord_handle);
    let reply;
    let copyHandle;
    if (isDiscord) {
      if (message.discord_id) {
        reply = el("a", {
          class: "btn btn-primary btn-small",
          href: "https://discord.com/users/" + message.discord_id,
          target: "_blank",
          rel: "noopener",
          text: "Reply on Discord",
        });
      } else {
        reply = el("button", { class: "btn btn-primary btn-small", type: "button", text: "Copy Discord username" });
        reply.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(message.discord_handle);
            reply.textContent = "Copied";
            setTimeout(() => (reply.textContent = "Copy Discord username"), 1500);
          } catch (error) {
            window.prompt("Copy this Discord username:", message.discord_handle);
          }
        });
      }
      if (message.discord_id) {
        copyHandle = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Copy username" });
        copyHandle.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(message.discord_handle);
            copyHandle.textContent = "Copied";
            setTimeout(() => (copyHandle.textContent = "Copy username"), 1500);
          } catch (error) {
            window.prompt("Copy this Discord username:", message.discord_handle);
          }
        });
      }
    } else {
      const subject = encodeURIComponent("Re: " + message.topic);
      reply = el("a", { class: "btn btn-primary btn-small", href: "mailto:" + message.email + "?subject=" + subject, text: "Reply by email" });
    }

    toggleRead.addEventListener("click", async () => {
      const { error } = await sb.from("messages").update({ is_read: !message.is_read }).eq("id", message.id);
      if (error) setStatus(messagesStatus, "Could not update the message: " + error.message, true);
      else loadMessages();
    });
    remove.addEventListener("click", async () => {
      if (!window.confirm("Delete this message from " + message.name + "? This cannot be undone.")) return;
      const { error } = await sb.from("messages").delete().eq("id", message.id);
      if (error) setStatus(messagesStatus, "Could not delete the message: " + error.message, true);
      else loadMessages();
    });

    const contactLine = isDiscord ? "Discord: " + message.discord_handle : message.email;

    return el("li", { class: "message" + (message.is_read ? "" : " is-unread") }, [
      el("div", { class: "message-head" }, [
        el("strong", { text: message.name }),
        el("span", { class: "badge", text: message.topic }),
        el("span", { class: "message-meta", text: dateTimeFormat.format(new Date(message.created_at)) }),
      ]),
      el("p", { class: "message-from", text: contactLine + (message.lang ? " \u00b7 site language: " + message.lang : "") }),
      el("p", { class: "message-body", text: message.message }),
      el("div", { class: "row-actions" }, [reply, copyHandle, toggleRead, remove].filter(Boolean)),
    ]);
  }

  async function loadMessages() {
    const { data, error } = await sb.from("messages").select("*").order("created_at", { ascending: false });
    if (error) {
      setStatus(messagesStatus, "Could not load messages: " + error.message, true);
      return;
    }
    setStatus(messagesStatus, "");
    const unread = data.filter((message) => !message.is_read).length;
    const badge = $("#unread-count");
    badge.hidden = unread === 0;
    badge.textContent = String(unread);
    $("#mark-all-read").disabled = unread === 0;
    $("#message-list").replaceChildren(
      ...(data.length ? data.map(messageItem) : [el("li", { class: "empty", text: "No messages yet. Messages sent from the contact form appear here." })])
    );
  }

  $("#refresh-messages").addEventListener("click", loadMessages);
  $("#mark-all-read").addEventListener("click", async () => {
    const { error } = await sb.from("messages").update({ is_read: true }).eq("is_read", false);
    if (error) setStatus(messagesStatus, "Could not update the messages: " + error.message, true);
    else loadMessages();
  });

  const bugreportsStatus = $("#bugreports-status");
  const BUGREPORT_STATUS_LABEL = { new: "New", acknowledged: "Acknowledged", resolved: "Resolved" };
  const BUGREPORT_NEXT_ACTION = {
    new: { next: "acknowledged", label: "Mark acknowledged" },
    acknowledged: { next: "resolved", label: "Mark resolved" },
    resolved: { next: "new", label: "Reopen" },
  };

  function bugReportItem(report) {
    const action = BUGREPORT_NEXT_ACTION[report.status] || BUGREPORT_NEXT_ACTION.new;
    const advance = el("button", { class: "btn btn-ghost btn-small", type: "button", text: action.label });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });

    advance.addEventListener("click", async () => {
      const { error } = await sb.from("bug_reports").update({ status: action.next }).eq("id", report.id);
      if (error) setStatus(bugreportsStatus, "Could not update the report: " + error.message, true);
      else loadBugReports();
    });
    remove.addEventListener("click", async () => {
      if (!window.confirm('Delete this bug report for "' + report.project_name + '"? This cannot be undone.')) return;
      const { error } = await sb.from("bug_reports").delete().eq("id", report.id);
      if (error) setStatus(bugreportsStatus, "Could not delete the report: " + error.message, true);
      else loadBugReports();
    });

    const metaBits = [report.project_name, report.project_version, report.platform].filter(Boolean).join(" · ");

    return el("li", { class: "message" + (report.status === "new" ? " is-unread" : "") }, [
      el("div", { class: "message-head" }, [
        el("strong", { text: metaBits || "Bug report" }),
        el("span", { class: "badge", text: BUGREPORT_STATUS_LABEL[report.status] || "New" }),
        el("span", { class: "message-meta", text: dateTimeFormat.format(new Date(report.created_at)) }),
      ]),
      el("p", { class: "message-from", text: "Steps to reproduce" }),
      el("p", { class: "message-body", text: report.steps }),
      report.expected ? el("p", { class: "message-from", text: "Expected: " + report.expected }) : null,
      report.actual ? el("p", { class: "message-from", text: "Actual: " + report.actual }) : null,
      report.contact ? el("p", { class: "message-from", text: "Contact: " + report.contact }) : null,
      report.lang ? el("p", { class: "message-from", text: "Site language: " + report.lang }) : null,
      el("div", { class: "row-actions" }, [advance, remove]),
    ]);
  }

  async function loadBugReports() {
    const { data, error } = await sb.from("bug_reports").select("*").order("created_at", { ascending: false });
    if (error) {
      setStatus(bugreportsStatus, "Could not load bug reports: " + error.message, true);
      return;
    }
    setStatus(bugreportsStatus, "");
    const newCount = data.filter((report) => report.status === "new").length;
    const badge = $("#new-bugreport-count");
    badge.hidden = newCount === 0;
    badge.textContent = String(newCount);
    $("#bugreport-list").replaceChildren(
      ...(data.length ? data.map(bugReportItem) : [el("li", { class: "empty", text: "No bug reports yet. Reports sent from the Report a Bug page appear here." })])
    );
  }

  $("#refresh-bugreports").addEventListener("click", loadBugReports);

  const dictForm = $("#dict-form");
  const dictFormStatus = $("#dict-form-status");
  const dictListStatus = $("#dict-list-status");
  const dictSaveButton = $("#dict-save");
  const dictCancelButton = $("#dict-cancel");
  const updateDictDefinitionCount = bindCount($("#d-definition"), $("#d-definition-count"), 400);
  const updateDictLongCount = bindCount($("#d-long"), $("#d-long-count"), 3000);

  wireGenerateButton(
    $("#d-definition-generate"),
    () => {
      const term = dictForm.elements.term.value.trim();
      if (!term) {
        showToast("Enter a term first.", true);
        return null;
      }
      return { kind: "dict-short", term };
    },
    (text) => {
      dictForm.elements.definition.value = text;
      updateDictDefinitionCount();
    }
  );

  wireGenerateButton(
    $("#d-long-generate"),
    () => {
      const term = dictForm.elements.term.value.trim();
      if (!term) {
        showToast("Enter a term first.", true);
        return null;
      }
      return { kind: "dict-long", term, shortDefinition: dictForm.elements.definition.value.trim() };
    },
    (text) => {
      dictForm.elements.long_definition.value = text;
      updateDictLongCount();
    }
  );

  let dictTerms = [];
  let dictEditing = null;
  let dictSlugTouched = false;

  function uniqueDictSlug(base, ownId) {
    const taken = new Set(dictTerms.filter((term) => term.id !== ownId).map((term) => term.slug));
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = base + "-" + n++;
    return slug;
  }

  function updateDictSlugHint() {
    const slug = dictForm.elements.slug.value.trim();
    $("#d-slug-hint").textContent = slug ? "Term page: " + (S.siteUrl || "") + "/term.html?t=" + slug : "Made from the term. You can change it.";
  }

  dictForm.elements.term.addEventListener("input", () => {
    if (dictSlugTouched) return;
    dictForm.elements.slug.value = uniqueDictSlug(slugify(dictForm.elements.term.value), dictEditing ? dictEditing.id : null);
    updateDictSlugHint();
  });

  dictForm.elements.slug.addEventListener("input", () => {
    dictSlugTouched = true;
    updateDictSlugHint();
  });

  function resetDictForm() {
    dictEditing = null;
    dictSlugTouched = false;
    dictForm.reset();
    $("#d-date").value = todayDmy();
    $("#dict-form-title").textContent = "Add a term";
    dictSaveButton.textContent = "Add term";
    dictCancelButton.hidden = true;
    $$(".error", dictForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", dictForm).forEach((node) => node.removeAttribute("aria-invalid"));
    updateDictDefinitionCount();
    updateDictLongCount();
    updateDictSlugHint();
  }

  function fillDictForm(term) {
    dictEditing = term;
    dictSlugTouched = true;
    dictForm.elements.term.value = term.term;
    dictForm.elements.slug.value = term.slug;
    dictForm.elements.definition.value = term.definition;
    dictForm.elements.long_definition.value = term.long_definition || "";
    dictForm.elements.added_on.value = isoToDmy(term.added_on);
    dictForm.elements.date_accurate.checked = Boolean(term.date_accurate);
    $("#dict-form-title").textContent = "Edit term";
    dictSaveButton.textContent = "Save changes";
    dictCancelButton.hidden = false;
    $$(".error", dictForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", dictForm).forEach((node) => node.removeAttribute("aria-invalid"));
    updateDictDefinitionCount();
    updateDictLongCount();
    updateDictSlugHint();
    setStatus(dictFormStatus, "");
    $("#dict-form-title").scrollIntoView({ behavior: "smooth", block: "start" });
    dictForm.elements.term.focus({ preventScroll: true });
  }

  dictCancelButton.addEventListener("click", () => {
    resetDictForm();
    setStatus(dictFormStatus, "");
  });

  $("#d-date").addEventListener("input", (event) => {
    event.target.value = formatDmyTyping(event.target.value);
  });

  dictForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const term = dictForm.elements.term.value.trim();
    const slug = dictForm.elements.slug.value.trim();
    const definition = dictForm.elements.definition.value.trim();
    const longDefinition = dictForm.elements.long_definition.value.trim();
    const addedOn = parseDmy(dictForm.elements.added_on.value);
    const dateAccurate = dictForm.elements.date_accurate.checked;

    const otherSlugTaken = dictTerms.some((t) => t.slug === slug && (!dictEditing || t.id !== dictEditing.id));
    $("#error-d-term").textContent = term ? "" : "Enter a term.";
    $("#error-d-slug").textContent = !slug
      ? "Enter a page address."
      : !SLUG_FORMAT.test(slug)
      ? "Use lowercase letters, numbers and single dashes, like my-term."
      : otherSlugTaken
      ? "Another term already uses this page address."
      : "";
    $("#error-d-definition").textContent = definition ? "" : "Enter a short definition.";
    $("#error-d-date").textContent = addedOn ? "" : "Enter the date as DD/MM/YYYY, for example 01/09/2026.";
    if (!term || !slug || !SLUG_FORMAT.test(slug) || otherSlugTaken || !definition || !addedOn) return;

    dictSaveButton.disabled = true;
    setStatus(dictFormStatus, "Saving...");
    const row = { term, slug, definition, long_definition: longDefinition || null, added_on: addedOn, date_accurate: dateAccurate };
    const { error } = dictEditing
      ? await sb.from("dictionary_terms").update(row).eq("id", dictEditing.id)
      : await sb.from("dictionary_terms").insert(row);
    dictSaveButton.disabled = false;
    if (error) {
      const duplicate = /dictionary_terms_slug_key|duplicate key/i.test(error.message || "");
      if (duplicate) $("#error-d-slug").textContent = "Another term already uses this page address.";
      setStatus(dictFormStatus, duplicate ? "Could not save: the page address is already used." : "Could not save: " + error.message, true);
      return;
    }
    const wasEditing = Boolean(dictEditing);
    resetDictForm();
    setStatus(dictFormStatus, wasEditing ? "Changes saved." : "Term added.");
    loadDictionary();
  });

  function dictTermRow(term) {
    const edit = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Edit" });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });
    const view = el("a", {
      class: "btn btn-ghost btn-small",
      href: (S.siteUrl || "") + "/term.html?t=" + encodeURIComponent(term.slug),
      target: "_blank",
      rel: "noopener",
      text: "View page",
    });
    edit.addEventListener("click", () => fillDictForm(term));
    remove.addEventListener("click", async () => {
      if (!window.confirm('Delete "' + term.term + '"? This cannot be undone.')) return;
      const { error } = await sb.from("dictionary_terms").delete().eq("id", term.id);
      if (error) {
        setStatus(dictListStatus, "Could not delete: " + error.message, true);
        return;
      }
      if (dictEditing && dictEditing.id === term.id) resetDictForm();
      loadDictionary();
    });

    const accuracy = el("span", {
      class: "badge" + (term.date_accurate ? "" : " badge-warn"),
      text: term.date_accurate ? "Date of creation" : "Date of logging",
    });

    return el("li", { class: "dict-row" }, [
      el("div", { class: "row-info" }, [
        el("strong", { text: term.term }),
        el("div", { class: "dict-row-meta" }, [el("span", { text: dateFormat.format(new Date(term.added_on)) }), accuracy]),
        el("p", { text: term.definition }),
      ]),
      el("div", { class: "row-actions" }, [view, edit, remove]),
    ]);
  }

  const dictSearchInput = $("#dict-search");

  function renderDictList() {
    const q = (dictSearchInput && dictSearchInput.value.trim().toLowerCase()) || "";
    const filtered = q
      ? dictTerms.filter(
          (term) => term.term.toLowerCase().includes(q) || (term.definition || "").toLowerCase().includes(q) || (term.long_definition || "").toLowerCase().includes(q)
        )
      : dictTerms;
    $("#dict-list").replaceChildren(
      ...(filtered.length
        ? filtered.map(dictTermRow)
        : [el("li", { class: "empty", text: dictTerms.length ? "No terms match your search." : "No terms yet. Add your first one above." })])
    );
  }

  if (dictSearchInput) dictSearchInput.addEventListener("input", renderDictList);

  async function loadDictionary() {
    setStatus(dictListStatus, "");
    const { data, error } = await sb.from("dictionary_terms").select("*").order("sort_key", { ascending: true });
    if (error) {
      setStatus(dictListStatus, "Could not load the dictionary: " + error.message, true);
      return;
    }
    dictTerms = data;
    renderDictList();
  }

  const quoteForm = $("#quote-form");
  const quoteFormStatus = $("#quote-form-status");
  const quoteListStatus = $("#quote-list-status");
  const quoteSaveButton = $("#quote-save");
  const quoteCancelButton = $("#quote-cancel");
  const updateQuoteCount = bindCount($("#q-quote"), $("#q-quote-count"), 500);

  let quotes = [];
  let quoteEditing = null;

  async function uniqueQuoteSlug(text, author, excludeId) {
    const taken = new Set(quotes.filter((q) => !excludeId || q.id !== excludeId).map((q) => q.slug));
    const base = slugify(text);
    if (!taken.has(base)) return base;
    const withAuthor = slugify(text + "-" + author);
    if (!taken.has(withAuthor)) return withAuthor;
    for (let i = 2; i < 200; i++) {
      const candidate = base + "-" + i;
      if (!taken.has(candidate)) return candidate;
    }
    return base + "-" + uuid().slice(0, 8);
  }

  function resetQuoteForm() {
    quoteEditing = null;
    quoteForm.reset();
    $("#q-date").value = todayDmy();
    $("#quote-form-title").textContent = "Add a quote";
    quoteSaveButton.textContent = "Add quote";
    quoteCancelButton.hidden = true;
    $$(".error", quoteForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", quoteForm).forEach((node) => node.removeAttribute("aria-invalid"));
    updateQuoteCount();
  }

  function fillQuoteForm(quote) {
    quoteEditing = quote;
    quoteForm.elements.quote.value = quote.quote;
    quoteForm.elements.author.value = quote.author;
    quoteForm.elements.quote_date.value = isoToDmy(quote.quote_date);
    quoteForm.elements.pre_context.value = quote.pre_context || "";
    quoteForm.elements.post_context.value = quote.post_context || "";
    $("#quote-form-title").textContent = "Edit quote";
    quoteSaveButton.textContent = "Save changes";
    quoteCancelButton.hidden = false;
    $$(".error", quoteForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", quoteForm).forEach((node) => node.removeAttribute("aria-invalid"));
    updateQuoteCount();
    setStatus(quoteFormStatus, "");
    $("#quote-form-title").scrollIntoView({ behavior: "smooth", block: "start" });
    quoteForm.elements.quote.focus({ preventScroll: true });
  }

  quoteCancelButton.addEventListener("click", () => {
    resetQuoteForm();
    setStatus(quoteFormStatus, "");
  });

  $("#q-date").addEventListener("input", (event) => {
    event.target.value = formatDmyTyping(event.target.value);
  });

  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const quoteText = quoteForm.elements.quote.value.trim();
    const author = quoteForm.elements.author.value.trim();
    const quoteDate = parseDmy(quoteForm.elements.quote_date.value);
    const preContext = quoteForm.elements.pre_context.value.trim();
    const postContext = quoteForm.elements.post_context.value.trim();

    $("#error-q-quote").textContent = quoteText ? "" : "Enter the quote.";
    $("#error-q-author").textContent = author ? "" : "Enter the author.";
    $("#error-q-date").textContent = quoteDate ? "" : "Enter the date as DD/MM/YYYY, for example 01/09/2026.";
    if (!quoteText || !author || !quoteDate) return;

    quoteSaveButton.disabled = true;
    setStatus(quoteFormStatus, "Saving...");
    const slug =
      quoteEditing && quoteEditing.quote === quoteText
        ? quoteEditing.slug
        : await uniqueQuoteSlug(quoteText, author, quoteEditing ? quoteEditing.id : null);
    const row = { quote: quoteText, author, quote_date: quoteDate, pre_context: preContext || null, post_context: postContext || null, slug };
    const { error } = quoteEditing
      ? await sb.from("quotes").update(row).eq("id", quoteEditing.id)
      : await sb.from("quotes").insert(row);
    quoteSaveButton.disabled = false;
    if (error) {
      setStatus(quoteFormStatus, "Could not save: " + error.message, true);
      return;
    }
    const wasEditing = Boolean(quoteEditing);
    resetQuoteForm();
    setStatus(quoteFormStatus, wasEditing ? "Changes saved." : "Quote added.");
    loadQuotes();
  });

  function quoteRow(quote) {
    const edit = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Edit" });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });
    const view = el("a", {
      class: "btn btn-ghost btn-small",
      href: (S.siteUrl || "") + "/quote.html?q=" + encodeURIComponent(quote.slug),
      target: "_blank",
      rel: "noopener",
      text: "View page",
    });
    edit.addEventListener("click", () => fillQuoteForm(quote));
    remove.addEventListener("click", async () => {
      if (!window.confirm("Delete this quote? This cannot be undone.")) return;
      const { error } = await sb.from("quotes").delete().eq("id", quote.id);
      if (error) {
        setStatus(quoteListStatus, "Could not delete: " + error.message, true);
        return;
      }
      if (quoteEditing && quoteEditing.id === quote.id) resetQuoteForm();
      loadQuotes();
    });

    return el("li", { class: "dict-row" }, [
      el("div", { class: "row-info" }, [
        quote.pre_context ? el("p", { class: "hint", text: "* " + quote.pre_context }) : null,
        el("p", { text: "“" + quote.quote + "”" }),
        quote.post_context ? el("p", { class: "hint", text: "* " + quote.post_context }) : null,
        el("div", { class: "dict-row-meta" }, [el("span", { text: "— " + quote.author + ", " + dateFormat.format(new Date(quote.quote_date)) })]),
      ]),
      el("div", { class: "row-actions" }, [view, edit, remove]),
    ]);
  }

  const quoteSearchInput = $("#quote-search");

  function renderQuoteList() {
    const q = (quoteSearchInput && quoteSearchInput.value.trim().toLowerCase()) || "";
    const filtered = q
      ? quotes.filter(
          (quote) =>
            quote.quote.toLowerCase().includes(q) ||
            (quote.author || "").toLowerCase().includes(q) ||
            (quote.pre_context || "").toLowerCase().includes(q) ||
            (quote.post_context || "").toLowerCase().includes(q)
        )
      : quotes;
    $("#quote-list").replaceChildren(
      ...(filtered.length
        ? filtered.map(quoteRow)
        : [el("li", { class: "empty", text: quotes.length ? "No quotes match your search." : "No quotes yet. Add your first one above." })])
    );
  }

  if (quoteSearchInput) quoteSearchInput.addEventListener("input", renderQuoteList);

  async function loadQuotes() {
    setStatus(quoteListStatus, "");
    const { data, error } = await sb.from("quotes").select("*").order("quote_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
      setStatus(quoteListStatus, "Could not load the quotes: " + error.message, true);
      return;
    }
    quotes = data;
    renderQuoteList();
  }

  const libForm = $("#lib-form");
  const libFormStatus = $("#lib-form-status");
  const libListStatus = $("#lib-list-status");
  const libSaveButton = $("#lib-save");
  const libCancelButton = $("#lib-cancel");
  const libFieldsRoot = $("#lib-fields");
  const libFieldAddButton = $("#lib-field-add");
  const libImageInput = $("#l-image");
  const libImageRow = $("#lib-image-row");
  const libRelatedRoot = $("#lib-related");
  const libRelatedSearchInput = $("#lib-related-search");
  const libImageBucket = () => sb.storage.from(LIB_IMAGES);

  let libraryEntries = [];
  let libraryRelations = [];
  let libEditing = null;
  let libFields = [{ title: "", description: "" }];
  let libImageState = null; // { file } for a newly chosen image, or null
  let libImageRemoved = false;
  let libOriginalImageUrl = null;
  let libRelatedSelected = new Set();

  function renderLibFields() {
    libFieldsRoot.replaceChildren(
      ...libFields.map((field, index) => {
        const titleInput = el("input", {
          type: "text",
          maxlength: "80",
          value: field.title,
          "aria-label": "Field " + (index + 1) + " title",
          placeholder: "Title",
        });
        const descInput = el("textarea", {
          maxlength: "2000",
          "aria-label": "Field " + (index + 1) + " description",
          placeholder: "Description (supports **bold**, [link text](https://...), \"- \" bullet lists and \"1. \" numbered lists)",
        });
        descInput.value = field.description;
        titleInput.addEventListener("input", () => (libFields[index].title = titleInput.value));
        descInput.addEventListener("input", () => (libFields[index].description = descInput.value));
        const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Remove field" });
        remove.addEventListener("click", () => {
          libFields.splice(index, 1);
          renderLibFields();
        });
        const moveUp = el("button", {
          class: "btn btn-ghost btn-tiny",
          type: "button",
          "aria-label": "Move field " + (index + 1) + " up",
          disabled: index === 0,
          html: "↑",
        });
        moveUp.addEventListener("click", () => {
          if (index === 0) return;
          [libFields[index - 1], libFields[index]] = [libFields[index], libFields[index - 1]];
          renderLibFields();
        });
        const moveDown = el("button", {
          class: "btn btn-ghost btn-tiny",
          type: "button",
          "aria-label": "Move field " + (index + 1) + " down",
          disabled: index === libFields.length - 1,
          html: "↓",
        });
        moveDown.addEventListener("click", () => {
          if (index === libFields.length - 1) return;
          [libFields[index], libFields[index + 1]] = [libFields[index + 1], libFields[index]];
          renderLibFields();
        });
        const reorder = el("div", { class: "lib-field-reorder" }, [moveUp, moveDown]);
        const generateBtn = el("button", { class: "btn btn-ghost btn-tiny", type: "button", text: "✨ Generate" });
        wireGenerateButton(
          generateBtn,
          () => {
            const entryName = libForm.elements.name.value.trim();
            const fieldTitle = titleInput.value.trim();
            if (!entryName || !fieldTitle) {
              showToast("Enter the entry name and this field's title first.", true);
              return null;
            }
            return { kind: "library-field", entryName, category: libForm.elements.category.value.trim(), fieldTitle };
          },
          (text) => {
            descInput.value = text;
            libFields[index].description = text;
          }
        );
        return el("div", { class: "lib-field-row" }, [
          reorder,
          el("div", { class: "field" }, [el("label", { text: "Title" }), titleInput]),
          el("div", { class: "field" }, [
            el("div", { class: "field-label-row" }, [el("label", { text: "Description" }), generateBtn]),
            descInput,
          ]),
          remove,
        ]);
      })
    );
    libFieldAddButton.disabled = libFields.length >= MAX_LIB_FIELDS;
  }

  libFieldAddButton.addEventListener("click", () => {
    if (libFields.length >= MAX_LIB_FIELDS) return;
    libFields.push({ title: "", description: "" });
    renderLibFields();
  });

  if (libRelatedSearchInput) libRelatedSearchInput.addEventListener("input", renderLibRelatedPicker);

  function renderLibImagePicker() {
    const existingUrl = !libImageRemoved && !libImageState ? libOriginalImageUrl : null;
    const preview = libImageState
      ? el("img", { class: "lib-image-preview", src: URL.createObjectURL(libImageState.file), alt: "" })
      : existingUrl
      ? el("img", { class: "lib-image-preview", src: existingUrl, alt: "" })
      : null;
    const removeBtn =
      libImageState || existingUrl
        ? el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Remove image" })
        : null;
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        libImageState = null;
        libImageRemoved = true;
        libImageInput.value = "";
        renderLibImagePicker();
      });
    }
    libImageRow.replaceChildren(...[preview, libImageInput, removeBtn].filter(Boolean));
  }

  libImageInput.addEventListener("change", () => {
    const file = libImageInput.files && libImageInput.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setStatus(libFormStatus, "Choose an image file.", true);
      libImageInput.value = "";
      return;
    }
    libImageState = { file };
    libImageRemoved = false;
    renderLibImagePicker();
  });

  function relatedLabel(entry) {
    return entry.name + " — " + entry.category;
  }

  function renderLibRelatedPicker() {
    const others = libraryEntries.filter((entry) => !libEditing || entry.id !== libEditing.id);
    if (!others.length) {
      libRelatedRoot.replaceChildren(el("p", { class: "hint", text: "No other entries yet to relate this one to." }));
      return;
    }
    const q = (libRelatedSearchInput && libRelatedSearchInput.value.trim().toLowerCase()) || "";
    const filtered = q
      ? others.filter((entry) => relatedLabel(entry).toLowerCase().includes(q))
      : others;
    if (!filtered.length) {
      libRelatedRoot.replaceChildren(el("p", { class: "hint", text: "No entries match your search." }));
      return;
    }
    libRelatedRoot.replaceChildren(
      ...filtered.map((entry) => {
        const checkbox = el("input", { type: "checkbox" });
        checkbox.checked = libRelatedSelected.has(entry.id);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked && libRelatedSelected.size >= MAX_RELATED) {
            checkbox.checked = false;
            setStatus(libFormStatus, "You can pick up to " + MAX_RELATED + " related entries.", true);
            return;
          }
          if (checkbox.checked) libRelatedSelected.add(entry.id);
          else libRelatedSelected.delete(entry.id);
        });
        return el("label", { class: "check" }, [checkbox, el("span", { text: relatedLabel(entry) })]);
      })
    );
  }

  function resetLibForm() {
    libEditing = null;
    libForm.reset();
    if (libForm.elements.summary) libForm.elements.summary.value = "";
    libFields = [{ title: "", description: "" }];
    libImageState = null;
    libImageRemoved = false;
    libOriginalImageUrl = null;
    libRelatedSelected = new Set();
    if (libRelatedSearchInput) libRelatedSearchInput.value = "";
    $("#lib-form-title").textContent = "Add a library entry";
    libSaveButton.textContent = "Add entry";
    libCancelButton.hidden = true;
    $$(".error", libForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", libForm).forEach((node) => node.removeAttribute("aria-invalid"));
    renderLibFields();
    renderLibImagePicker();
    renderLibRelatedPicker();
  }

  function fillLibForm(entry) {
    libEditing = entry;
    libForm.elements.category.value = entry.category;
    libForm.elements.name.value = entry.name;
    if (libForm.elements.summary) libForm.elements.summary.value = entry.summary || "";
    libFields = entry.fields && entry.fields.length ? entry.fields.map((f) => ({ title: f.title || "", description: f.description || "" })) : [{ title: "", description: "" }];
    libImageState = null;
    libImageRemoved = false;
    libOriginalImageUrl = entry.image_url || null;
    libRelatedSelected = new Set(
      libraryRelations.filter((r) => r.entry_a === entry.id || r.entry_b === entry.id).map((r) => (r.entry_a === entry.id ? r.entry_b : r.entry_a))
    );
    if (libRelatedSearchInput) libRelatedSearchInput.value = "";
    $("#lib-form-title").textContent = "Edit entry";
    libSaveButton.textContent = "Save changes";
    libCancelButton.hidden = false;
    $$(".error", libForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", libForm).forEach((node) => node.removeAttribute("aria-invalid"));
    renderLibFields();
    renderLibImagePicker();
    renderLibRelatedPicker();
    setStatus(libFormStatus, "");
    $("#lib-form-title").scrollIntoView({ behavior: "smooth", block: "start" });
    libForm.elements.category.focus({ preventScroll: true });
  }

  libCancelButton.addEventListener("click", () => {
    resetLibForm();
    setStatus(libFormStatus, "");
  });

  async function uniqueLibSlug(name, category, excludeId) {
    const taken = new Set(libraryEntries.filter((entry) => !excludeId || entry.id !== excludeId).map((entry) => entry.slug));
    const base = slugify(name);
    if (!taken.has(base)) return base;
    const withCategory = slugify(name + "-" + category);
    if (!taken.has(withCategory)) return withCategory;
    for (let i = 2; i < 200; i++) {
      const candidate = base + "-" + i;
      if (!taken.has(candidate)) return candidate;
    }
    return base + "-" + uuid().slice(0, 8);
  }

  libForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const categoryRaw = libForm.elements.category.value.trim();
    const nameRaw = libForm.elements.name.value.trim();
    const category = capitalizeFirst(categoryRaw);
    const name = nameRaw;
    const summary = (libForm.elements.summary ? libForm.elements.summary.value : "").trim();
    const filledFields = libFields.map((f) => ({ title: f.title.trim(), description: f.description.trim() })).filter((f) => f.title || f.description);

    $("#error-l-category").textContent = category ? "" : "Enter a category.";
    $("#error-l-name").textContent = name ? "" : "Enter a name.";
    const summaryError = summary.length > 220 ? "Keep the summary to 220 characters or fewer." : "";
    if ($("#error-l-summary")) $("#error-l-summary").textContent = summaryError;
    const fieldsError = filledFields.length ? (filledFields.some((f) => !f.title || !f.description) ? "Each field needs both a title and a description." : "") : "Add at least one field.";
    $("#error-l-fields").textContent = fieldsError;
    if (!category || !name || summaryError || fieldsError) return;

    libSaveButton.disabled = true;
    setStatus(libFormStatus, "Saving...");

    const id = libEditing ? libEditing.id : uuid();
    let uploadedImagePath = null;

    try {
      let imageUrl = libOriginalImageUrl;
      if (libImageState) {
        setStatus(libFormStatus, "Uploading image...");
        const blob = await toWebp(libImageState.file);
        const path = id + "/" + uuid() + ".webp";
        const { error } = await libImageBucket().upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        uploadedImagePath = path;
        imageUrl = libImageBucket().getPublicUrl(path).data.publicUrl;
      } else if (libImageRemoved) {
        imageUrl = null;
      }

      const slug = libEditing && libEditing.category === category && libEditing.name === name ? libEditing.slug : await uniqueLibSlug(name, category, libEditing ? libEditing.id : null);

      setStatus(libFormStatus, "Saving...");
      const row = { category, name, slug, summary: summary || null, fields: filledFields, image_url: imageUrl };
      const { error } = libEditing ? await sb.from("library_entries").update(row).eq("id", id) : await sb.from("library_entries").insert(Object.assign({ id }, row));
      if (error) throw error;

      if (libOriginalImageUrl && libOriginalImageUrl !== imageUrl) {
        const oldPath = pathFromUrl(libOriginalImageUrl, LIB_IMAGES);
        if (oldPath) await libImageBucket().remove([oldPath]);
      }

      const originalRelated = libEditing
        ? new Set(libraryRelations.filter((r) => r.entry_a === id || r.entry_b === id).map((r) => (r.entry_a === id ? r.entry_b : r.entry_a)))
        : new Set();
      const toAdd = [...libRelatedSelected].filter((otherId) => !originalRelated.has(otherId));
      const toRemove = [...originalRelated].filter((otherId) => !libRelatedSelected.has(otherId));
      for (const otherId of toAdd) {
        const pair = id < otherId ? { entry_a: id, entry_b: otherId } : { entry_a: otherId, entry_b: id };
        await sb.from("library_relations").insert(pair);
      }
      for (const otherId of toRemove) {
        const pair = id < otherId ? { entry_a: id, entry_b: otherId } : { entry_a: otherId, entry_b: id };
        await sb.from("library_relations").delete().eq("entry_a", pair.entry_a).eq("entry_b", pair.entry_b);
      }

      const wasEditing = Boolean(libEditing);
      resetLibForm();
      setStatus(libFormStatus, wasEditing ? "Changes saved." : "Entry added.");
      await loadLibrary();
    } catch (error) {
      if (uploadedImagePath) await libImageBucket().remove([uploadedImagePath]);
      const duplicate = /library_entries_slug_key|duplicate key/i.test(error.message || "");
      setStatus(libFormStatus, duplicate ? "Could not save: that page address is already used, try again." : "Could not save: " + (error.message || "unknown error"), true);
    } finally {
      libSaveButton.disabled = false;
    }
  });

  function libEntryRow(entry) {
    const edit = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Edit" });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });
    const view = el("a", {
      class: "btn btn-ghost btn-small",
      href: (S.siteUrl || "") + "/library-entry.html?e=" + encodeURIComponent(entry.slug),
      target: "_blank",
      rel: "noopener",
      text: "View page",
    });
    edit.addEventListener("click", () => fillLibForm(entry));
    remove.addEventListener("click", async () => {
      if (!window.confirm('Delete "' + entry.name + '"? This cannot be undone.')) return;
      const { error } = await sb.from("library_entries").delete().eq("id", entry.id);
      if (error) {
        setStatus(libListStatus, "Could not delete: " + error.message, true);
        return;
      }
      if (entry.image_url) {
        const path = pathFromUrl(entry.image_url, LIB_IMAGES);
        if (path) await libImageBucket().remove([path]);
      }
      if (libEditing && libEditing.id === entry.id) resetLibForm();
      await loadLibrary();
    });

    return el("li", { class: "dict-row" }, [
      el("div", { class: "row-info" }, [
        el("strong", { text: entry.name }),
        el("div", { class: "dict-row-meta" }, [el("span", { text: (entry.fields || []).length + " field" + ((entry.fields || []).length === 1 ? "" : "s") })]),
      ]),
      el("div", { class: "row-actions" }, [view, edit, remove]),
    ]);
  }

  const libSearchInput = $("#lib-search");

  function libEntryMatches(entry, q) {
    if (!q) return true;
    if (entry.name.toLowerCase().includes(q)) return true;
    if ((entry.category || "").toLowerCase().includes(q)) return true;
    if ((entry.summary || "").toLowerCase().includes(q)) return true;
    return (entry.fields || []).some(
      (field) => (field.title || "").toLowerCase().includes(q) || (field.description || "").toLowerCase().includes(q)
    );
  }

  function renderLibList() {
    if (!libraryEntries.length) {
      $("#lib-list").replaceChildren(el("p", { class: "empty", text: "No entries yet. Add your first one above." }));
      return;
    }
    const q = (libSearchInput && libSearchInput.value.trim().toLowerCase()) || "";
    const filteredEntries = q ? libraryEntries.filter((entry) => libEntryMatches(entry, q)) : libraryEntries;
    if (!filteredEntries.length) {
      $("#lib-list").replaceChildren(el("p", { class: "empty", text: "No entries match your search." }));
      return;
    }
    const groups = [];
    const byCategory = new Map();
    filteredEntries.forEach((entry) => {
      const key = entry.category_key;
      if (!byCategory.has(key)) {
        const group = { category: entry.category, items: [] };
        byCategory.set(key, group);
        groups.push(group);
      }
      byCategory.get(key).items.push(entry);
    });
    $("#lib-list").replaceChildren(
      ...groups.map((group) =>
        el("section", { class: "dict-group" }, [
          el("h3", { class: "dict-group-letter", text: group.category }),
          el("ul", { class: "project-list" }, group.items.map(libEntryRow)),
        ])
      )
    );
  }

  if (libSearchInput) libSearchInput.addEventListener("input", renderLibList);

  async function loadLibrary() {
    setStatus(libListStatus, "");
    const [entriesRes, relationsRes] = await Promise.all([
      sb.from("library_entries").select("*").order("category_key", { ascending: true }).order("sort_key", { ascending: true }),
      sb.from("library_relations").select("entry_a, entry_b"),
    ]);
    if (entriesRes.error) {
      setStatus(libListStatus, "Could not load the library: " + entriesRes.error.message, true);
      return;
    }
    libraryEntries = entriesRes.data;
    libraryRelations = relationsRes.data || [];
    renderLibList();
    renderLibRelatedPicker();
  }

  const eventForm = $("#event-form");
  const eventFormStatus = $("#event-form-status");
  const eventListStatus = $("#event-list-status");
  const eventSaveButton = $("#event-save");
  const eventCancelButton = $("#event-cancel");

  let events = [];
  let eventEditing = null;
  let eventSelected = null;

  function currentEventType() {
    return $('input[name="type"]:checked', eventForm).value;
  }

  function isBingoType(type) {
    return type === "lockout_bingo" || type === "bingo";
  }

  function randomLobbyCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function updateEventTypeUI() {
    const type = currentEventType();
    const bingo = isBingoType(type);
    const tournament = type === "tournament";
    const countdown = type === "countdown";
    const poll = type === "poll";
    $("#e-size-field").hidden = !bingo;
    eventForm.elements.size.required = bingo;
    $("#e-target-field").hidden = !countdown;
    eventForm.elements.target_at.required = countdown;
    $("#e-items-field").hidden = countdown;
    eventForm.elements.items.required = !countdown;
    $("#e-items-label").textContent = bingo
      ? "Items (semicolon-separated)"
      : tournament
      ? "Players or teams (semicolon-separated)"
      : "Options (semicolon-separated)";
    $("#e-items-hint").textContent = bingo
      ? "Separate each item with a semicolon, like item1;item2;item3. Needs exactly size × size items."
      : tournament
      ? "Separate each player or team with a semicolon, like player1;player2;player3. For a team, separate its members with a comma, like player1,player2;player3,player4. Needs at least 2 entries; uneven counts get automatic byes."
      : "Separate each option with a semicolon, like Option A;Option B;Option C. Needs at least 2 options.";
    $("#e-type-hint").textContent =
      type === "lockout_bingo"
        ? "Lockout Bingo: everyone plays on the same shared card."
        : type === "bingo"
        ? "Bingo: text or numbers, randomly placed on a grid."
        : tournament
        ? "Tournament: players or teams are randomly seeded into a bracket. Pick a winner for each match to advance them to the next round."
        : countdown
        ? "Countdown: shows a live countdown to a date and time you pick."
        : "Poll: visitors vote once for one of the options; results show live.";
  }

  $$('input[name="type"]', eventForm).forEach((radio) => radio.addEventListener("change", updateEventTypeUI));

  function resetEventForm() {
    eventEditing = null;
    eventSelected = null;
    eventForm.reset();
    updateEventTypeUI();
    $("#event-form-title").textContent = "Add an event";
    eventSaveButton.textContent = "Add event";
    eventCancelButton.hidden = true;
    $$(".error", eventForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", eventForm).forEach((node) => node.removeAttribute("aria-invalid"));
  }

  function isoToDatetimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function itemsToText(row) {
    if (row.type === "tournament") {
      return (Array.isArray(row.items) ? row.items : [])
        .map((team) => (Array.isArray(team) ? team.join(",") : team))
        .join(";");
    }
    return (Array.isArray(row.items) ? row.items : []).join(";");
  }

  function fillEventForm(row) {
    eventEditing = row;
    eventSelected = null;
    eventForm.elements.title.value = row.title;
    $('input[name="type"][value="' + row.type + '"]', eventForm).checked = true;
    eventForm.elements.size.value = row.size || 5;
    eventForm.elements.target_at.value = isoToDatetimeLocal(row.target_at);
    eventForm.elements.items.value = itemsToText(row);
    eventForm.elements.description.value = row.description || "";
    eventForm.elements.is_active.checked = Boolean(row.is_active);
    eventForm.elements.featured.checked = Boolean(row.featured);
    updateEventTypeUI();
    $("#event-form-title").textContent = "Edit event";
    eventSaveButton.textContent = "Save changes";
    eventCancelButton.hidden = false;
    $$(".error", eventForm).forEach((node) => (node.textContent = ""));
    $$("[aria-invalid]", eventForm).forEach((node) => node.removeAttribute("aria-invalid"));
    setStatus(eventFormStatus, "");
    $("#event-form-title").scrollIntoView({ behavior: "smooth", block: "start" });
    eventForm.elements.title.focus({ preventScroll: true });
  }

  eventCancelButton.addEventListener("click", () => {
    resetEventForm();
    setStatus(eventFormStatus, "");
  });

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function parseTeams(text) {
    return text
      .split(";")
      .map((chunk) =>
        chunk
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
      )
      .filter((team) => team.length);
  }

  function teamLabel(team) {
    return Array.isArray(team) ? team.join(" & ") : String(team || "");
  }

  function nextPowerOfTwo(n) {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  function buildInitialRound(teams) {
    const n = teams.length;
    const bracketSize = nextPowerOfTwo(Math.max(n, 2));
    const byesNeeded = bracketSize - n;
    const shuffled = shuffleArray(teams);
    const round = [];
    let idx = 0;
    for (let i = 0; i < byesNeeded; i++) {
      round.push({ teams: [shuffled[idx++], null], winnerIndex: 0 });
    }
    while (idx < shuffled.length) {
      const a = shuffled[idx++];
      const b = shuffled[idx++];
      round.push({ teams: [a, b], winnerIndex: null });
    }
    return round;
  }

  function buildBracket(teams) {
    return { bracketSize: nextPowerOfTwo(Math.max(teams.length, 2)), rounds: [buildInitialRound(teams)] };
  }

  function roundIsComplete(round) {
    return round.every((match) => match.winnerIndex != null);
  }

  function buildNextRound(round) {
    const winners = round.map((match) => match.teams[match.winnerIndex]);
    const next = [];
    for (let i = 0; i < winners.length; i += 2) {
      next.push({ teams: [winners[i], winners[i + 1]], winnerIndex: null });
    }
    return next;
  }

  function setMatchWinner(layout, roundIndex, matchIndex, winnerIndex) {
    layout.rounds[roundIndex][matchIndex].winnerIndex = winnerIndex;
    layout.rounds.length = roundIndex + 1;
    let round = layout.rounds[roundIndex];
    while (roundIsComplete(round) && round.length > 1) {
      const next = buildNextRound(round);
      layout.rounds.push(next);
      round = next;
    }
  }

  function championOf(layout) {
    const rounds = layout.rounds;
    const last = rounds[rounds.length - 1];
    if (last && last.length === 1 && last[0].winnerIndex != null) return last[0].teams[last[0].winnerIndex];
    return null;
  }

  function normalizedTournamentLayout(row) {
    if (row.layout && Array.isArray(row.layout.rounds)) return row.layout;
    const teams = (Array.isArray(row.items) ? row.items : []).map((item) => (Array.isArray(item) ? item : [item]));
    row.layout = buildBracket(teams);
    return row.layout;
  }

  function roundLabel(index, totalRounds) {
    const remaining = totalRounds - index;
    if (remaining <= 1) return "Final";
    if (remaining === 2) return "Semifinals";
    if (remaining === 3) return "Quarterfinals";
    return "Round " + (index + 1);
  }

  async function persistEventLayout(row) {
    const { error } = await sb.from("events").update({ layout: row.layout }).eq("id", row.id);
    if (error) setStatus(eventListStatus, "Could not save the bracket: " + error.message, true);
  }

  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = eventForm.elements.title.value.trim();
    const type = currentEventType();
    const bingo = isBingoType(type);
    const tournament = type === "tournament";
    const countdown = type === "countdown";
    const poll = type === "poll";
    const size = Number(eventForm.elements.size.value) || 5;
    const targetRaw = eventForm.elements.target_at.value;
    const itemsRaw = countdown
      ? []
      : tournament
      ? parseTeams(eventForm.elements.items.value)
      : eventForm.elements.items.value
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean);
    const description = eventForm.elements.description.value.trim();
    const isActive = eventForm.elements.is_active.checked;
    const isFeatured = eventForm.elements.featured.checked;

    $("#error-e-title").textContent = title ? "" : "Enter a title.";

    let sizeError = "";
    if (bingo && (size < 3 || size > 8)) sizeError = "Grid size must be between 3 and 8.";
    $("#error-e-size").textContent = sizeError;

    let targetError = "";
    if (countdown && !targetRaw) targetError = "Pick a target date and time.";
    $("#error-e-target").textContent = targetError;

    let itemsError = "";
    if (bingo) {
      if (itemsRaw.length !== size * size) {
        itemsError = "Needs exactly " + size * size + " items for a " + size + "×" + size + " grid (found " + itemsRaw.length + ").";
      }
    } else if (tournament && itemsRaw.length < 2) {
      itemsError = "Enter at least 2 players or teams.";
    } else if (poll && itemsRaw.length < 2) {
      itemsError = "Enter at least 2 options.";
    }
    $("#error-e-items").textContent = itemsError;

    if (!title || sizeError || targetError || itemsError) return;

    const unchangedShape =
      eventEditing &&
      eventEditing.type === type &&
      (!bingo || eventEditing.size === size) &&
      JSON.stringify(eventEditing.items) === JSON.stringify(itemsRaw);

    const layout =
      countdown || poll ? [] : unchangedShape ? eventEditing.layout : tournament ? buildBracket(itemsRaw) : shuffleArray(itemsRaw);

    eventSaveButton.disabled = true;
    setStatus(eventFormStatus, "Saving...");
    const row = {
      title,
      type,
      description: description || null,
      is_active: isActive,
      featured: isFeatured,
      size: bingo ? size : null,
      target_at: countdown ? new Date(targetRaw).toISOString() : null,
      items: itemsRaw,
      layout,
      requires_code: bingo,
      lobby_code: bingo ? (eventEditing && eventEditing.requires_code && eventEditing.lobby_code ? eventEditing.lobby_code : randomLobbyCode()) : null,
    };
    const { error } = eventEditing
      ? await sb.from("events").update(row).eq("id", eventEditing.id)
      : await sb.from("events").insert(row);
    eventSaveButton.disabled = false;
    if (error) {
      setStatus(eventFormStatus, "Could not save: " + error.message, true);
      return;
    }
    const wasEditing = Boolean(eventEditing);
    resetEventForm();
    setStatus(eventFormStatus, wasEditing ? "Changes saved." : "Event added.");
    loadEvents();
  });

  function clearEventSelection() {
    eventSelected = null;
  }

  async function swapEventAt(row, index) {
    if (!eventSelected || eventSelected.id !== row.id) {
      eventSelected = { id: row.id, index };
      renderEventList();
      return;
    }
    if (eventSelected.index === index) {
      clearEventSelection();
      renderEventList();
      return;
    }
    const layout = (Array.isArray(row.layout) ? row.layout : []).slice();
    const a = eventSelected.index;
    [layout[a], layout[index]] = [layout[index], layout[a]];
    row.layout = layout;
    clearEventSelection();
    renderEventList();
    const { error } = await sb.from("events").update({ layout }).eq("id", row.id);
    if (error) setStatus(eventListStatus, "Could not save the new order: " + error.message, true);
  }

  function eventBingoEditor(row) {
    const size = row.size || 5;
    const layout = Array.isArray(row.layout) ? row.layout : [];
    const cells = Array.from({ length: size * size }, (_, i) => layout[i] || "");
    return el(
      "div",
      { class: "bingo-grid", style: "--bingo-size:" + size },
      cells.map((cellText, index) => {
        const isSelected = Boolean(eventSelected && eventSelected.id === row.id && eventSelected.index === index);
        const button = el("button", { class: "bingo-cell" + (isSelected ? " is-selected" : ""), type: "button" }, el("span", { text: cellText }));
        button.addEventListener("click", () => swapEventAt(row, index));
        return button;
      })
    );
  }

  async function swapEventTeams(row, roundIndex, matchIndex, slotIndex) {
    if (!eventSelected || eventSelected.id !== row.id) {
      eventSelected = { id: row.id, roundIndex, matchIndex, slotIndex };
      renderEventList();
      return;
    }
    if (eventSelected.matchIndex === matchIndex && eventSelected.slotIndex === slotIndex) {
      clearEventSelection();
      renderEventList();
      return;
    }
    const layout = row.layout;
    const a = layout.rounds[eventSelected.roundIndex][eventSelected.matchIndex].teams;
    const b = layout.rounds[roundIndex][matchIndex].teams;
    const tmp = a[eventSelected.slotIndex];
    a[eventSelected.slotIndex] = b[slotIndex];
    b[slotIndex] = tmp;
    clearEventSelection();
    renderEventList();
    await persistEventLayout(row);
  }

  async function pickEventWinner(row, roundIndex, matchIndex, slotIndex) {
    setMatchWinner(row.layout, roundIndex, matchIndex, slotIndex);
    clearEventSelection();
    renderEventList();
    await persistEventLayout(row);
  }

  function renderAdminMatch(row, layout, roundIndex, matchIndex, match) {
    const isBye = match.teams[1] == null;
    const decided = match.winnerIndex != null;
    const box = el("div", { class: "bracket-match" });

    const slotsRow = el("div", { class: "bracket-slot-row" });
    match.teams.forEach((team, slotIndex) => {
      if (team == null) {
        slotsRow.append(el("span", { class: "bracket-slot is-bye", text: "Bye" }));
        return;
      }
      const canSwap = roundIndex === 0 && !decided;
      const isWinnerSlot = decided && match.winnerIndex === slotIndex;
      const isSelected = Boolean(
        eventSelected &&
          eventSelected.id === row.id &&
          eventSelected.roundIndex === roundIndex &&
          eventSelected.matchIndex === matchIndex &&
          eventSelected.slotIndex === slotIndex
      );
      const label = teamLabel(team);
      if (canSwap) {
        const button = el("button", { class: "bracket-slot" + (isSelected ? " is-selected" : ""), type: "button", text: label });
        button.addEventListener("click", () => swapEventTeams(row, roundIndex, matchIndex, slotIndex));
        slotsRow.append(button);
      } else {
        slotsRow.append(el("span", { class: "bracket-slot" + (isWinnerSlot ? " is-winner" : ""), text: label }));
      }
    });
    box.append(slotsRow);

    if (!isBye) {
      const picks = el("div", { class: "bracket-winner-picks" });
      match.teams.forEach((team, slotIndex) => {
        const isWinner = match.winnerIndex === slotIndex;
        const button = el("button", {
          class: "btn btn-small " + (isWinner ? "btn-primary" : "btn-ghost"),
          type: "button",
          text: (isWinner ? "Winner: " : "Pick: ") + teamLabel(team),
        });
        button.disabled = isWinner;
        button.addEventListener("click", () => pickEventWinner(row, roundIndex, matchIndex, slotIndex));
        picks.append(button);
      });
      box.append(picks);
    }

    return box;
  }

  function eventBracketEditor(row) {
    const layout = normalizedTournamentLayout(row);
    const totalRounds = Math.log2(layout.bracketSize || 2) || 1;
    const tree = el(
      "div",
      { class: "bracket-tree" },
      layout.rounds.map((round, roundIndex) =>
        el("div", { class: "bracket-round" }, [
          el("div", { class: "bracket-round-title", text: roundLabel(roundIndex, totalRounds) }),
          ...round.map((match, matchIndex) => renderAdminMatch(row, layout, roundIndex, matchIndex, match)),
        ])
      )
    );
    const wrap = el("div", { class: "bracket-wrap" }, [tree]);
    const champion = championOf(layout);
    if (champion) wrap.append(el("div", { class: "bracket-champion", text: "Champion: " + teamLabel(champion) }));
    return wrap;
  }

  function countdownParts(diffMs) {
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }

  function countdownDisplay(targetIso) {
    const wrap = el("div", { class: "countdown-wrap" });
    const display = el("div", { class: "countdown-display" });
    const unitDefs = ["Days", "Hours", "Minutes", "Seconds"];
    const numbers = unitDefs.map((label) => {
      const number = el("span", { class: "countdown-number", text: "0" });
      display.append(el("div", { class: "countdown-unit" }, [number, el("span", { class: "countdown-label", text: label })]));
      return number;
    });
    const ended = el("p", { class: "countdown-ended", text: "This has already started!" });
    ended.hidden = true;
    wrap.append(display, ended);
    if (targetIso) {
      wrap.append(el("p", { class: "hint", text: "Target: " + dateTimeFormat.format(new Date(targetIso)) }));
    }

    let timer;
    function tick(isScheduled) {
      if (isScheduled && !wrap.isConnected) {
        clearInterval(timer);
        return;
      }
      const diff = new Date(targetIso).getTime() - Date.now();
      if (!targetIso || Number.isNaN(diff) || diff <= 0) {
        display.hidden = true;
        ended.hidden = false;
        clearInterval(timer);
        return;
      }
      const parts = countdownParts(diff);
      numbers[0].textContent = String(parts.days);
      numbers[1].textContent = String(parts.hours).padStart(2, "0");
      numbers[2].textContent = String(parts.minutes).padStart(2, "0");
      numbers[3].textContent = String(parts.seconds).padStart(2, "0");
    }
    tick(false);
    timer = setInterval(() => tick(true), 1000);
    return wrap;
  }

  function pollEditor(row) {
    const options = Array.isArray(row.items) ? row.items : [];
    const tally = row.__votes || {};
    const total = Object.values(tally).reduce((sum, n) => sum + n, 0);
    return el(
      "div",
      { class: "poll-results" },
      options.map((label, index) => {
        const count = tally[index] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return el("div", { class: "poll-option" }, [
          el("div", { class: "poll-option-head" }, [
            el("span", { text: label }),
            el("span", { class: "poll-count", text: count + (count === 1 ? " vote" : " votes") + " (" + pct + "%)" }),
          ]),
          el("div", { class: "poll-bar" }, el("div", { class: "poll-bar-fill", style: "width:" + pct + "%" })),
        ]);
      })
    );
  }

  const bingoBoardsOpen = {};
  const bingoBoardsCache = {};

  function miniBingoGrid(size, layout, marked) {
    const cells = Array.from({ length: size * size }, (_, i) => layout[i] || "");
    return el(
      "div",
      { class: "bingo-grid bingo-grid-mini", style: "--bingo-size:" + size },
      cells.map((cellText, index) =>
        el("div", { class: "bingo-cell" + (marked.includes(index) ? " is-marked" : "") }, el("span", { text: cellText }))
      )
    );
  }

  async function loadBingoBoards(row) {
    bingoBoardsCache[row.id] = bingoBoardsCache[row.id] || { loading: true, players: [], shared: [] };
    bingoBoardsCache[row.id].loading = true;
    renderEventList();
    const { data: players } = await sb
      .from("bingo_players")
      .select("*")
      .eq("event_id", row.id)
      .order("created_at", { ascending: true });
    let shared = [];
    if (row.type === "lockout_bingo") {
      const { data: board } = await sb.from("bingo_boards").select("marked_cells").eq("event_id", row.id).maybeSingle();
      shared = (board && board.marked_cells) || [];
    }
    bingoBoardsCache[row.id] = { loading: false, players: players || [], shared };
    renderEventList();
  }

  function bingoBoardsPanel(row) {
    const size = row.size || 5;
    const layout = Array.isArray(row.layout) ? row.layout : [];
    const cache = bingoBoardsCache[row.id];
    if (!cache || cache.loading) {
      return el("div", { class: "bingo-boards-panel" }, skeletonBlock(2));
    }
    if (row.type === "lockout_bingo") {
      return el("div", { class: "bingo-boards-panel" }, [
        el("p", { class: "hint", text: "Shared board — " + cache.players.length + " player(s) joined." }),
        miniBingoGrid(size, layout, cache.shared),
        cache.players.length
          ? el(
              "ul",
              { class: "bingo-player-list" },
              cache.players.map((p) =>
                el("li", {}, [el("span", { class: "bingo-swatch", style: "background:" + p.color }), el("span", { text: p.name })])
              )
            )
          : null,
      ]);
    }
    if (!cache.players.length) {
      return el("div", { class: "bingo-boards-panel" }, el("p", { class: "hint", text: "No players have joined this lobby yet." }));
    }
    return el(
      "div",
      { class: "bingo-boards-panel bingo-boards-grid" },
      cache.players.map((p) =>
        el("div", { class: "bingo-player-board" }, [
          el("p", { class: "bingo-player-board-head" }, [
            el("span", { class: "bingo-swatch", style: "background:" + p.color }),
            el("span", { text: p.name }),
          ]),
          miniBingoGrid(size, layout, p.marked_cells || []),
        ])
      )
    );
  }

  async function toggleEventFeatured(row) {
    row.featured = !row.featured;
    renderEventList();
    const { error } = await sb.from("events").update({ featured: row.featured }).eq("id", row.id);
    if (error) setStatus(eventListStatus, "Could not update the event: " + error.message, true);
  }

  function eventRow(row) {
    const edit = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Edit" });
    const shuffle = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Shuffle" });
    const resetVotes = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Reset votes" });
    const regenCode = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Regenerate code" });
    const featureToggle = el("button", {
      class: "btn btn-ghost btn-small",
      type: "button",
      text: row.featured ? "Unfeature" : "Feature",
    });
    const remove = el("button", { class: "btn btn-danger btn-small", type: "button", text: "Delete" });
    const isBingoType = row.type === "bingo" || row.type === "lockout_bingo";
    const boardsToggle = isBingoType
      ? el("button", {
          class: "btn btn-ghost btn-small",
          type: "button",
          text: bingoBoardsOpen[row.id] ? "Hide boards" : row.type === "lockout_bingo" ? "Live board" : "Player boards",
        })
      : null;

    edit.addEventListener("click", () => fillEventForm(row));
    featureToggle.addEventListener("click", () => toggleEventFeatured(row));
    if (boardsToggle) {
      boardsToggle.addEventListener("click", () => {
        bingoBoardsOpen[row.id] = !bingoBoardsOpen[row.id];
        if (bingoBoardsOpen[row.id]) loadBingoBoards(row);
        else renderEventList();
      });
    }

    regenCode.addEventListener("click", async () => {
      row.lobby_code = randomLobbyCode();
      renderEventList();
      const { error } = await sb.from("events").update({ lobby_code: row.lobby_code }).eq("id", row.id);
      if (error) setStatus(eventListStatus, "Could not save the new code: " + error.message, true);
    });

    shuffle.addEventListener("click", async () => {
      row.layout = row.type === "tournament" ? buildBracket(Array.isArray(row.items) ? row.items : []) : shuffleArray(Array.isArray(row.items) ? row.items : []);
      clearEventSelection();
      renderEventList();
      await persistEventLayout(row);
    });

    resetVotes.addEventListener("click", async () => {
      if (!window.confirm("Clear all votes for this poll? This cannot be undone.")) return;
      const { error } = await sb.from("event_votes").delete().eq("event_id", row.id);
      if (error) {
        setStatus(eventListStatus, "Could not reset votes: " + error.message, true);
        return;
      }
      row.__votes = {};
      renderEventList();
    });

    remove.addEventListener("click", async () => {
      if (!window.confirm("Delete this event? This cannot be undone.")) return;
      const { error } = await sb.from("events").delete().eq("id", row.id);
      if (error) {
        setStatus(eventListStatus, "Could not delete: " + error.message, true);
        return;
      }
      if (eventEditing && eventEditing.id === row.id) resetEventForm();
      loadEvents();
    });

    const typeLabels = { lockout_bingo: "Lockout Bingo", bingo: "Bingo", tournament: "Tournament", countdown: "Countdown", poll: "Poll" };
    const editor =
      row.type === "tournament"
        ? eventBracketEditor(row)
        : row.type === "countdown"
        ? countdownDisplay(row.target_at)
        : row.type === "poll"
        ? pollEditor(row)
        : eventBingoEditor(row);
    const actionButtons =
      row.type === "countdown"
        ? [edit, featureToggle, remove]
        : row.type === "poll"
        ? [edit, resetVotes, featureToggle, remove]
        : row.requires_code
        ? [edit, shuffle, regenCode, boardsToggle, featureToggle, remove]
        : [edit, shuffle, featureToggle, remove];

    return el("li", { class: "dict-row" }, [
      el("div", { class: "row-info" }, [
        el("div", { class: "dict-row-meta" }, [
          el("strong", { text: row.title }),
          el("span", { class: "badge", text: typeLabels[row.type] || row.type }),
          row.is_active ? null : el("span", { class: "badge badge-warn", text: "Inactive" }),
          row.featured ? el("span", { class: "badge badge-featured", text: "Featured" }) : null,
          row.requires_code && row.lobby_code ? el("span", { class: "badge", text: "Code: " + row.lobby_code }) : null,
        ]),
        row.description ? el("p", { text: row.description }) : null,
        editor,
        isBingoType && bingoBoardsOpen[row.id] ? bingoBoardsPanel(row) : null,
      ]),
      el("div", { class: "row-actions" }, actionButtons),
    ]);
  }

  function renderEventList() {
    $("#event-list").replaceChildren(
      ...(events.length ? events.map(eventRow) : [el("li", { class: "empty", text: "No events yet. Add your first one above." })])
    );
  }

  async function loadEvents() {
    setStatus(eventListStatus, "");
    const { data, error } = await sb.from("events").select("*").order("created_at", { ascending: false });
    if (error) {
      setStatus(eventListStatus, "Could not load the events: " + error.message, true);
      return;
    }
    events = data;
    const pollIds = events.filter((row) => row.type === "poll").map((row) => row.id);
    if (pollIds.length) {
      const { data: votes } = await sb.from("event_votes").select("event_id,option_index").in("event_id", pollIds);
      const tally = {};
      (votes || []).forEach((vote) => {
        tally[vote.event_id] = tally[vote.event_id] || {};
        tally[vote.event_id][vote.option_index] = (tally[vote.event_id][vote.option_index] || 0) + 1;
      });
      events.forEach((row) => {
        if (row.type === "poll") row.__votes = tally[row.id] || {};
      });
    }
    renderEventList();
  }

  const wordsListStatus = $("#words-list-status");
  const wordsFormStatus = $("#words-form-status");
  const wordsForm = $("#words-form");
  const wordsListWrap = $("#words-list-wrap");
  const wordsListToggle = $("#words-list-toggle");
  const WORDS_COLLAPSE_THRESHOLD = 14;
  let wordsListExpanded = false;
  let words = [];

  wordsListToggle.addEventListener("click", () => {
    wordsListExpanded = !wordsListExpanded;
    updateWordsListCollapse();
  });

  function updateWordsListCollapse() {
    const shouldOfferToggle = words.length > WORDS_COLLAPSE_THRESHOLD;
    wordsListToggle.hidden = !shouldOfferToggle;
    const collapsed = shouldOfferToggle && !wordsListExpanded;
    wordsListWrap.classList.toggle("is-collapsed", collapsed);
    wordsListToggle.textContent = wordsListExpanded ? "Show fewer words" : "Show all words (" + words.length + ")";
  }

  function wordRow(row) {
    const remove = el("button", { class: "mini mini-danger", type: "button", text: "Delete", "aria-label": "Delete " + row.word });
    remove.addEventListener("click", async () => {
      const { error } = await sb.from("wordle_words").delete().eq("id", row.id);
      if (error) {
        setStatus(wordsListStatus, "Could not delete: " + error.message, true);
        return;
      }
      words = words.filter((item) => item.id !== row.id);
      renderWordList();
    });
    return el("li", { class: "word-chip" }, [
      el("span", { text: row.word.toUpperCase() }),
      row.scheduled_date ? el("span", { class: "word-chip-date", text: row.scheduled_date }) : null,
      remove,
    ]);
  }

  const wordsSearchInput = $("#words-search");

  function renderWordList() {
    $("#words-total").textContent = words.length ? "(" + words.length + ")" : "";
    const q = (wordsSearchInput && wordsSearchInput.value.trim().toLowerCase()) || "";
    const filtered = q ? words.filter((row) => row.word.toLowerCase().includes(q)) : words;
    $("#words-list").replaceChildren(
      ...(filtered.length
        ? filtered.map(wordRow)
        : [el("li", { class: "empty", text: words.length ? "No words match your search." : "No words yet. Add some above." })])
    );
    if (q) {
      // While searching, show every match instead of the collapsed preview.
      wordsListWrap.classList.remove("is-collapsed");
      wordsListToggle.hidden = true;
    } else {
      updateWordsListCollapse();
    }
  }

  if (wordsSearchInput) wordsSearchInput.addEventListener("input", renderWordList);

  function queueRow(row) {
    const unqueue = el("button", { class: "btn btn-ghost btn-small", type: "button", text: "Remove date" });
    unqueue.addEventListener("click", async () => {
      row.scheduled_date = null;
      renderWordList();
      renderWordsQueueList();
      const { error } = await sb.from("wordle_words").update({ scheduled_date: null }).eq("id", row.id);
      if (error) setStatus(wordsQueueStatus, "Could not update: " + error.message, true);
    });
    return el("li", { class: "dict-row" }, [
      el("div", { class: "row-info" }, [el("strong", { text: row.word.toUpperCase() }), el("p", { text: row.scheduled_date })]),
      el("div", { class: "row-actions" }, [unqueue]),
    ]);
  }

  function renderWordsQueueList() {
    const queued = words.filter((row) => row.scheduled_date).sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1));
    $("#words-queue-list").replaceChildren(
      ...(queued.length ? queued.map(queueRow) : [el("li", { class: "empty", text: "No words queued for a specific date yet." })])
    );
  }

  async function loadWords() {
    setStatus(wordsListStatus, "");
    const pageSize = 1000;
    const all = [];
    let from = 0;
    while (true) {
      const { data, error } = await sb
        .from("wordle_words")
        .select("*")
        .order("word", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) {
        setStatus(wordsListStatus, "Could not load the word list: " + error.message, true);
        return;
      }
      all.push(...(data || []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    words = all;
    renderWordList();
    renderWordsQueueList();
  }

  wordsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(wordsFormStatus, "");
    $("#error-w-bulk").textContent = "";
    const raw = wordsForm.elements.bulk.value;
    const candidates = raw
      .split(/[\s,;]+/)
      .map((piece) => piece.trim().toLowerCase())
      .filter(Boolean);
    if (!candidates.length) {
      $("#error-w-bulk").textContent = "Enter at least one 5-letter word.";
      return;
    }
    const valid = candidates.filter((word) => /^[a-z]{5}$/.test(word));
    const invalidCount = candidates.length - valid.length;
    const existing = new Set(words.map((row) => row.word.toLowerCase()));
    const seen = new Set();
    const toInsert = [];
    valid.forEach((word) => {
      if (existing.has(word) || seen.has(word)) return;
      seen.add(word);
      toInsert.push({ word });
    });
    if (!toInsert.length) {
      setStatus(
        wordsFormStatus,
        invalidCount ? "Nothing to add: " + invalidCount + " word" + (invalidCount === 1 ? " wasn't" : "s weren't") + " exactly 5 letters, and the rest were already in the list." : "Those words are already in the list.",
        true
      );
      return;
    }
    setStatus(wordsFormStatus, "Adding...");
    const { data, error } = await sb.from("wordle_words").insert(toInsert).select();
    if (error) {
      setStatus(wordsFormStatus, "Could not add words: " + error.message, true);
      return;
    }
    words = words.concat(data || toInsert);
    words.sort((a, b) => a.word.localeCompare(b.word));
    renderWordList();
    wordsForm.reset();
    const skipped = candidates.length - toInsert.length;
    setStatus(
      wordsFormStatus,
      "Added " + toInsert.length + " word" + (toInsert.length === 1 ? "" : "s") + (skipped ? ", skipped " + skipped + " (invalid or duplicate)." : ".")
    );
  });

  const wordsQueueForm = $("#words-queue-form");
  const wordsQueueStatus = $("#words-queue-status");

  wordsQueueForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(wordsQueueStatus, "");
    $("#error-w-queue-word").textContent = "";
    $("#error-w-queue-date").textContent = "";
    const word = wordsQueueForm.elements.word.value.trim().toLowerCase();
    const date = wordsQueueForm.elements.date.value;
    let ok = true;
    if (!/^[a-z]{5}$/.test(word)) {
      $("#error-w-queue-word").textContent = "Enter exactly 5 letters.";
      ok = false;
    }
    if (!date) {
      $("#error-w-queue-date").textContent = "Pick a date.";
      ok = false;
    }
    if (!ok) return;

    const dateTaken = words.find((row) => row.scheduled_date === date);
    if (dateTaken && dateTaken.word.toLowerCase() !== word) {
      setStatus(wordsQueueStatus, "That date already has a queued word (" + dateTaken.word.toUpperCase() + "). Remove it first.", true);
      return;
    }

    setStatus(wordsQueueStatus, "Saving...");
    const existing = words.find((row) => row.word.toLowerCase() === word);
    let error;
    if (existing) {
      existing.scheduled_date = date;
      ({ error } = await sb.from("wordle_words").update({ scheduled_date: date }).eq("id", existing.id));
    } else {
      const { data, error: insertError } = await sb.from("wordle_words").insert({ word, scheduled_date: date }).select();
      error = insertError;
      if (!error && data) words.push(data[0]);
    }
    if (error) {
      setStatus(wordsQueueStatus, "Could not save: " + error.message, true);
      return;
    }
    words.sort((a, b) => a.word.localeCompare(b.word));
    renderWordList();
    renderWordsQueueList();
    wordsQueueForm.reset();
    setStatus(wordsQueueStatus, "Queued " + word.toUpperCase() + " for " + date + ".");
  });

  start().catch(() => show("setup"));
})();
