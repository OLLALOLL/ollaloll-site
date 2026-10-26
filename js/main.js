(function () {
  "use strict";

  const SITE = {
    name: "OLLALOLL",
    siteUrl: "https://ollaloll.com",
    tagline: "Texture packs, addons and scripts for Minecraft Bedrock Edition.",
    intro: "Browse my public projects, read the install guide, or send me a message.",
    what: [
      { type: "texturepack", title: "Texture packs", text: "Custom textures and looks for Bedrock resource packs." },
      { type: "addon", title: "Addons", text: "Behavior and resource packs that change how the game plays." },
      { type: "script", title: "Scripts", text: "Gameplay logic written with the Script API in JavaScript." },
    ],
    avatar: "assets/avatar.webp",
    about: {
      developer: {
        title: "Building for Bedrock",
        text: [
          "I'm OLLALOLL, a Minecraft Bedrock developer. I make texture packs, addons and scripts, and most of my time goes into the Script API, where a bit of JavaScript can change how an entire server plays.",
          "My OLLA series covers what servers actually need and other small quality-of-life packs. I care about commands that feel native, menus that are quick to use, and code that is easy to fix when Bedrock changes under it.",
          "Everything I've released publicly lives on the Projects page.",
        ],
      },
      obsessions: {
        title: "Minecraft...",
        text: ["Minecraft isn't only what I build for, it's what I do. If there's a fight to win, a machine to figure out or a clever trick to pull off, I'm in."],
        items: [
          { title: "PvP", text: "Fast fights, tight combos, kits and arenas. I love the mechanics people argue about, which is why I ended up building a tier list around them." },
          { title: "Redstone", text: "Farms, hidden doors, clocks and contraptions. Redstone is programming with blocks, and I never get tired of a clean, compact build." },
          { title: "Trapping", text: "Trap design is a craft: hiding it, baiting it and getting the timing exactly right. I enjoy building traps almost as much as watching them work." },
          { title: "Commands", text: "Command blocks, selectors and long execute chains. Commands are where a lot of my addon ideas begin, and custom commands are my favorite part of the Script API." },
        ],
      },
      web: {
        title: "Also a web developer",
        text: [
          "Outside Minecraft I build websites and web apps. I work in plain HTML, CSS and JavaScript, use Supabase for accounts, databases and storage, and like shipping things people can actually use. I build Discord bots too.",
          "I'm the founder of Genghis Tiers, a Minecraft PvP tier list and leaderboard. I also run live extras like bingo cards and tournaments, and built a daily word game called (not)WORDLE.",
        ],
        items: [
          { title: "Genghis Tiers", text: "A PvP tier list and leaderboard with per-gamemode ratings.", url: "https://ollaloll.com/genghistiers" },
          { title: "Beaver Transceiver", text: "A mobile-first, Discord-like group chat app with accounts, friends and realtime DMs.", url: "https://ollaloll.com/beaver" },
          { title: "Extras", text: "Active bingo cards, tournaments and other live extras — including the daily (not)WORDLE word game.", url: "https://ollaloll.com/extras" },
        ],
      },
    },
    supabase: {
      url: "https://zrslvneipbgtivhlygfd.supabase.co",
      key: "sb_publishable_3M5msWhxHlC7cOfY5X4NeQ_Lbc1bR3f",
      anonJwt:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyc2x2bmVpcGJndGl2aGx5Z2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjUyOTAsImV4cCI6MjEwNTMwMTI5MH0.SaJ4yOFo5-p7iTP-aGT_r75bwaC-spe2JSyfnPHle7Q",
    },
    email: "ollaloll@outlook.com",
    discord: { handle: "itzgerog", server: "https://discord.gg/KRNhhbacwz", clientId: "1553429538547957801" },
    links: [
      { id: "youtube", label: "YouTube", handle: "", url: "" },
      { id: "github", label: "GitHub", handle: "", url: "" },
      { id: "x", label: "X (Twitter)", handle: "@gerog12345", url: "https://x.com/gerog12345" },
      { id: "tiktok", label: "TikTok", handle: "@ollaloll", url: "https://www.tiktok.com/@ollaloll" },
    ],
    donate: { url: "" },
  };
  const S = SITE;
  const SB = S.supabase || {};
  const I = window.I18N || { languages: [], ui: {} };
  const packs = (window.I18N_PACKS = window.I18N_PACKS || {});
  const self = document.currentScript;
  const JS_BASE = self ? new URL(".", self.src).href : "js/";
  const ASSET_BASE = self ? new URL("../assets/", self.src).href : "assets/";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SLIDE_MS = 700;
  const SLIDE_HOLD_MS = 5000;
  const MESSAGE_COOLDOWN_MS = 30000;
  const DOWNLOAD_DEDUPE_MS = 24 * 60 * 60 * 1000;
  const LOCALES = { en: "en-GB", pt: "pt-BR" };
  const TYPES = ["texturepack", "addon", "script"];
  const BINGO_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

  const ICONS = {
    discord: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
    youtube: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    github: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',
    x: '<path d="M5 5l14 14M19 5L5 19"/>',
    tiktok: '<path d="M15 3v11a4 4 0 1 1-3-3.87"/><path d="M15 7a5 5 0 0 0 5 5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    prev: '<path d="m15 6-6 6 6 6"/>',
    next: '<path d="m9 6 6 6-6 6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    texturepack: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    addon: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    script: '<path d="M9 4H8a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1M15 4h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z"/><path d="M20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z"/>',
    library: '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
    quote: '<path d="M6 7c-2 1-3 3-3 5h3v5H3v-5c0-2 1-4 3-5z"/><path d="M15 7c-2 1-3 3-3 5h3v5h-3v-5c0-2 1-4 3-5z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    bell: '<path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3z"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0"/>',
    rss: '<path d="M5 5a14 14 0 0 1 14 14"/><path d="M5 11a8 8 0 0 1 8 8"/><circle cx="6" cy="18" r="1.5"/>',
    offline: '<path d="M8 16a4 4 0 0 1 .5-7.95A5.5 5.5 0 0 1 18.9 10 3.5 3.5 0 0 1 18.5 16"/><path d="M4 4l16 16"/>',
  };

  const icon = (name) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    (ICONS[name] || ICONS.link) +
    "</svg>";

  const isWebUrl = (value) => /^https?:\/\//i.test(value || "");
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {}
  }

  function debounce(fn, wait) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  // Shares text via the native share sheet when available (mobile, and
  // modern desktop browsers); otherwise copies it to the clipboard. Only
  // flashes the "copied" feedback for the clipboard path — the OS share
  // sheet appearing is its own confirmation, so nothing is copied there.
  function shareOrCopy(text, { button, copiedLabel, resetDelay = 1500 } = {}) {
    const flashCopied = () => {
      if (!button) return;
      const original = button.dataset.shareOriginal ?? button.textContent;
      button.dataset.shareOriginal = original;
      button.classList.add("is-copied");
      if (copiedLabel) button.textContent = copiedLabel;
      setTimeout(() => {
        button.classList.remove("is-copied");
        if (copiedLabel) button.textContent = button.dataset.shareOriginal;
      }, resetDelay);
    };
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flashCopied).catch(() => {});
      return;
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flashCopied();
    } catch (error) {}
  }

  // Saves a form's own typed-in values to localStorage as the person types
  // (debounced) and restores them on load, so an accidental reload or
  // back-swipe mid-message doesn't lose a half-written contact message or
  // bug report. Skips the honeypot and any hidden field — those back
  // custom dropdowns (project/platform) or auth tokens (discordProof)
  // whose visible UI wouldn't be kept in sync by a raw value restore, and
  // a hidden field is never something the person actually typed anyway.
  function initFormDraft(form, keySuffix) {
    if (!form) return { clear: () => {} };
    const key = "draft:" + keySuffix;
    const fieldList = () =>
      Array.from(form.elements).filter(
        (field) => field.name && field.name !== "_gotcha" && !["hidden", "submit", "button", "file"].includes(field.type)
      );

    function save() {
      const data = {};
      fieldList().forEach((field) => {
        if (field.type === "checkbox") data[field.name] = field.checked;
        else if (field.type === "radio") {
          if (field.checked) data[field.name] = field.value;
        } else data[field.name] = field.value;
      });
      writeStorage(key, JSON.stringify(data));
    }

    function restore() {
      const raw = readStorage(key);
      if (!raw) return;
      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        return;
      }
      fieldList().forEach((field) => {
        if (!(field.name in data)) return;
        if (field.type === "checkbox") field.checked = Boolean(data[field.name]);
        else if (field.type === "radio") field.checked = field.value === data[field.name];
        else field.value = data[field.name];
      });
    }

    function clear() {
      try {
        localStorage.removeItem(key);
      } catch (error) {}
    }

    restore();
    form.addEventListener("input", debounce(save, 400));
    return { clear };
  }

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

  let lang = "en";

  function t(key, vars) {
    const pack = packs[lang];
    let text = pack && pack.ui && pack.ui[key] !== undefined ? pack.ui[key] : I.ui[key];
    if (text === undefined) return key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m)) : text;
  }

  function pick(path) {
    const pack = packs[lang];
    const translated = pack && pack.content ? get(pack.content, path) : undefined;
    return translated !== undefined ? translated : get(S, path);
  }

  function merged(path) {
    const base = get(S, path) || [];
    const pack = packs[lang];
    const translated = (pack && pack.content && get(pack.content, path)) || [];
    return base.map((item, i) => Object.assign({}, item, translated[i]));
  }

  const brand = (text) => (S.name && S.name !== "OLLALOLL" ? text.replace(/OLLALOLL/g, S.name) : text);

  function setPageMeta(title, description, url) {
    document.title = title;
    const meta = $("meta[name=description]");
    if (meta) meta.setAttribute("content", description);
    [["meta[property='og:title']", title], ["meta[property='og:description']", description], ["meta[property='og:url']", url]].forEach(
      ([selector, content]) => {
        const node = $(selector);
        if (node) node.setAttribute("content", content);
      }
    );
    let canonical = $("link[rel=canonical]");
    if (!canonical) {
      canonical = el("link", { rel: "canonical" });
      document.head.append(canonical);
    }
    canonical.setAttribute("href", url);
  }

  function loadPack(code) {
    if (code === "en" || packs[code]) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = JS_BASE + "lang/" + code + ".js";
      script.onload = script.onerror = () => resolve();
      document.head.append(script);
    });
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(LOCALES[lang] || lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  const nav = $(".nav");
  const toggle = $(".nav-toggle");
  const discord = S.discord || {};
  const donate = S.donate || {};

  function hideOrLink(nodes, url) {
    nodes.forEach((node) => {
      if (!url) {
        node.hidden = true;
        return;
      }
      if (node.tagName === "A") {
        node.href = url;
        node.target = "_blank";
        node.rel = "noopener";
      }
    });
  }

  function applyStatic() {
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach((node) => (node.textContent = t(node.dataset.i18n)));
    $$("[data-i18n-html]").forEach((node) => (node.innerHTML = t(node.dataset.i18nHtml)));
    $$("[data-i18n-attr]").forEach((node) =>
      node.dataset.i18nAttr.split(";").forEach((pair) => {
        const at = pair.indexOf(":");
        node.setAttribute(pair.slice(0, at), t(pair.slice(at + 1)));
      })
    );
    $$("[data-site]").forEach((node) => {
      const key = node.dataset.site;
      const value = key === "name" ? S.name : pick(key);
      if (typeof value === "string" && value) node.textContent = value;
    });

    const page = document.documentElement.dataset.page;
    if (page) {
      const title = brand(t("meta." + page + ".title"));
      const description = brand(t("meta." + page + ".desc"));
      document.title = title;
      [["meta[name=description]", description], ["meta[property='og:title']", title], ["meta[property='og:description']", description]].forEach(
        ([selector, content]) => {
          const meta = $(selector);
          if (meta) meta.setAttribute("content", content);
        }
      );
    }

    $$("[data-year]").forEach((node) => (node.textContent = new Date().getFullYear()));
  }

  const renderers = [];

  function setLanguage(code) {
    return loadPack(code).then(() => {
      lang = packs[code] || code === "en" ? code : "en";
      writeStorage("lang", lang);
      applyStatic();
      renderers.forEach((render) => render());
    });
  }

  function initNav() {
    if (!nav || !toggle) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", t(open ? "close" : "menu"));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.click();
        toggle.focus();
      }
    });
  }

  function initSwitchers() {
    const flagSrc = (flag) => ASSET_BASE + "flags/" + flag + ".svg";
    const views = $$("[data-lang]").map((root) => {
      const flag = el("img", { class: "flag", alt: "", width: "30", height: "30" });
      const button = el("button", { class: "lang-btn", type: "button", "aria-haspopup": "true", "aria-expanded": "false" }, flag);
      const list = el("ul", { class: "lang-list", hidden: true });
      const items = I.languages.map((language) => {
        const item = el("button", { class: "lang-item", type: "button", lang: language.code }, [
          el("img", { class: "flag", src: flagSrc(language.flag), alt: "", width: "24", height: "24" }),
          el("span", { text: language.name }),
        ]);
        item.addEventListener("click", () => {
          setLanguage(language.code);
          close();
          button.focus();
        });
        list.append(el("li", {}, item));
        return item;
      });
      root.append(button, list);

      function open() {
        list.hidden = false;
        button.setAttribute("aria-expanded", "true");
      }

      function close() {
        list.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }

      button.addEventListener("click", () => (list.hidden ? open() : close()));
      root.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !list.hidden) {
          close();
          button.focus();
          return;
        }
        if (list.hidden || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const at = items.indexOf(document.activeElement);
        let next = at;
        if (event.key === "ArrowDown") next = at < 0 ? 0 : (at + 1) % items.length;
        if (event.key === "ArrowUp") next = at <= 0 ? items.length - 1 : at - 1;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        items[next].focus();
      });
      document.addEventListener("click", (event) => {
        if (!root.contains(event.target)) close();
      });

      return { flag, button, items, flagSrc };
    });

    renderers.push(() =>
      views.forEach((view) => {
        const current = I.languages.find((language) => language.code === lang) || I.languages[0];
        view.flag.src = view.flagSrc(current.flag);
        view.button.setAttribute("aria-label", t("lang") + ": " + current.name);
        view.items.forEach((item, i) => {
          if (I.languages[i].code === current.code) item.setAttribute("aria-current", "true");
          else item.removeAttribute("aria-current");
        });
      })
    );
  }

  function allLinks() {
    const list = [
      { id: "discord", label: t("links.discord"), handle: discord.handle || "", url: "" },
      {
        id: "discord",
        label: t("links.server"),
        handle: discord.server ? t("links.join") : "",
        url: discord.server || "",
      },
    ].concat(S.links || []);
    list.push({ id: "mail", label: t("links.email"), handle: S.email || "", url: S.email ? "mailto:" + S.email : "" });
    return list.filter((link) => link.url || link.handle);
  }

  function linkRow(link) {
    const has = Boolean(link.url);
    const external = has && !link.url.startsWith("mailto:");
    const row = el(has ? "a" : "div", {
      class: "link-row",
      href: has ? link.url : false,
      target: external ? "_blank" : false,
      rel: external ? "noopener" : false,
    });
    row.append(el("span", { class: "link-icon", html: icon(link.id) }));
    row.append(
      el("span", { class: "link-text" }, [
        el("strong", { text: link.label }),
        el("span", { text: link.handle || link.url.replace(/^(https?:\/\/|mailto:)/, "") }),
      ])
    );
    return row;
  }

  function renderLinks() {
    $$("[data-contact-links]").forEach((box) => box.replaceChildren(...allLinks().map((link) => el("li", {}, linkRow(link)))));

    $$("[data-footer-links]").forEach((box) => {
      const links = allLinks();
      box.hidden = !links.length;
      box.replaceChildren(
        ...links.map((link) => {
          const external = link.url && !link.url.startsWith("mailto:");
          return el(
            "li",
            {},
            link.url
              ? el("a", {
                  href: link.url,
                  text: link.label,
                  target: external ? "_blank" : false,
                  rel: external ? "noopener" : false,
                })
              : el("span", { text: link.label + ": " + link.handle })
          );
        })
      );
    });
  }

  function renderMakes() {
    $$("[data-makes]").forEach((box) =>
      box.replaceChildren(
        ...merged("what").map((item) => {
          const type = TYPES.includes(item.type) ? item.type : "addon";
          return el("a", { class: "make", href: "/projects?type=" + type }, [
            el("span", { class: "make-title" }, [el("span", { html: icon(type) }), el("span", { text: item.title || t("types." + type) })]),
            el("p", { text: item.text || "" }),
            el("span", { class: "make-cta", text: t("see." + type) }),
          ]);
        })
      )
    );
  }

  function initStage() {
    const stage = $("[data-stage]");
    const tilt = stage && $(".tilt", stage);
    if (!tilt || reduceMotion) return;
    stage.addEventListener("pointermove", (event) => {
      const box = stage.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      tilt.style.setProperty("--rx", (-py * 16).toFixed(1) + "deg");
      tilt.style.setProperty("--ry", (px * 22).toFixed(1) + "deg");
    });
    stage.addEventListener("pointerleave", () => {
      tilt.style.setProperty("--rx", "0deg");
      tilt.style.setProperty("--ry", "0deg");
    });
  }

  let projectsRequest = null;
  function loadProjects() {
    if (!projectsRequest) {
      projectsRequest =
        SB.url && SB.key
          ? fetch(SB.url + "/rest/v1/projects?select=*,project_updates(id,version,released_on,notes)&order=featured.desc,sort_order.asc,release_date.desc.nullslast,created_at.desc&project_updates.order=released_on.desc", {
              headers: { apikey: SB.key },
            }).then((response) => {
              if (!response.ok) throw new Error("Request failed");
              return response.json();
            })
          : Promise.resolve([]);
    }
    return projectsRequest;
  }

  function trackDownload(project) {
    if (!SB.url || !SB.key) return;
    const key = "download-" + project.id;
    const last = Number(readStorage(key));
    if (last && Date.now() - last < DOWNLOAD_DEDUPE_MS) return;
    writeStorage(key, Date.now());
    fetch(SB.url + "/rest/v1/download_events", {
      method: "POST",
      keepalive: true,
      headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ project_id: project.id }),
    }).catch(() => {});
  }

  function fileUrl(project) {
    const path = project.file_path.split("/").map(encodeURIComponent).join("/");
    return SB.url + "/storage/v1/object/public/project-files/" + path + "?download=" + encodeURIComponent(project.file_name || "download");
  }

  const cleanups = [];

  // Builds a background (blurred, cropped) + foreground (uncropped,
  // contain-fitted) image pair so letterboxed space around a photo shows a
  // blurred copy of that same photo instead of a flat gradient.
  function imgPair(src, alt, extra) {
    return [
      el("img", Object.assign({ src, alt: "", "aria-hidden": "true", class: "img-blur-bg", decoding: "async" }, extra && extra.bg)),
      el("img", Object.assign({ src, alt, class: "img-contain-fg" }, extra && extra.fg)),
    ];
  }

  function slider(images, name, type) {
    const total = images.length;
    const track = el("div", { class: "track" });
    images.forEach((src, n) =>
      track.append(
        el(
          "div",
          { class: "track-slide" },
          imgPair(src, t("project.imageAlt", { name, n: n + 1, total }), {
            fg: { loading: n ? false : "lazy", decoding: "async" },
          })
        )
      )
    );
    track.append(el("div", { class: "track-slide", "aria-hidden": "true" }, imgPair(images[0], "")));

    const dots = images.map((_, n) => el("button", { type: "button", class: "dot", "aria-label": t("project.showImage", { n: n + 1, total }) }));
    const thumb = el(
      "div",
      {
        class: "thumb slider thumb--" + type,
        role: "group",
        "aria-roledescription": "carousel",
        "aria-label": t("project.imagesLabel", { name }),
      },
      [track, el("div", { class: "dots" }, dots)]
    );

    let index = 0;
    let held = false;
    let visible = true;
    let timer = null;
    let observer = null;

    function show(next, animate) {
      index = next;
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach((dot, n) => {
        if (n === index % total) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    function advance() {
      show(index + 1, true);
      if (index === total) {
        setTimeout(() => {
          if (index === total) {
            show(0, false);
            void track.offsetWidth;
          }
        }, SLIDE_MS + 50);
      }
    }

    function start() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(() => {
        if (!held && visible && !document.hidden) advance();
      }, SLIDE_HOLD_MS);
    }

    dots.forEach((dot, n) =>
      dot.addEventListener("click", () => {
        show(n, true);
        start();
      })
    );
    thumb.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") held = true;
    });
    thumb.addEventListener("pointerleave", () => (held = false));
    thumb.addEventListener("focusin", () => (held = true));
    thumb.addEventListener("focusout", () => (held = false));

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      observer.observe(thumb);
    }

    show(0, false);
    start();
    cleanups.push(() => {
      clearInterval(timer);
      if (observer) observer.disconnect();
    });
    return thumb;
  }

  function latestUpdate(project) {
    const dates = (project.project_updates || []).map((update) => update.released_on).sort();
    return dates.length ? dates[dates.length - 1] : null;
  }

  function richText(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return el("ul", {}, lines.map((line) => el("li", { text: line.replace(/^\s*[-*]\s+/, "") })));
        }
        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return el("ol", {}, lines.map((line) => el("li", { text: line.replace(/^\s*\d+[.)]\s+/, "") })));
        }
        return el("p", { text: block });
      });
  }

  function actionButtons(project) {
    const buttons = [];
    const isFile = Boolean(project.file_path && SB.url);
    if (isFile || isWebUrl(project.download_url)) {
      const button = el(
        "a",
        {
          class: "btn btn-primary btn-small",
          href: isFile ? fileUrl(project) : project.download_url,
          target: isFile ? false : "_blank",
          download: isFile ? project.file_name || true : false,
          rel: "noopener",
        },
        [el("span", { html: icon("download") }), el("span", { text: project.download_label || t("project.download") })]
      );
      button.addEventListener("click", () => trackDownload(project));
      buttons.push(button);
    }
    if (isWebUrl(project.page_url)) {
      buttons.push(
        el("a", { class: "btn btn-ghost btn-small", href: project.page_url, target: "_blank", rel: "noopener" }, [
          el("span", { html: icon("external") }),
          el("span", { text: project.page_label || t("project.page") }),
        ])
      );
    }
    buttons.push(
      el("a", { class: "btn btn-ghost btn-small", href: "/report-bug?project=" + encodeURIComponent(project.name) }, [
        el("span", { text: t("project.reportBug") }),
      ])
    );
    return buttons;
  }

  function metaLine(project, type) {
    const latest = latestUpdate(project);
    return el("div", { class: "meta" }, [
      el("span", { class: "badge", text: t("type." + type) }),
      project.featured ? el("span", { class: "badge badge-featured", text: t("project.featured") }) : null,
      project.release_date
        ? el("time", { class: "meta-text", datetime: project.release_date, text: t("project.released", { date: formatDate(project.release_date) }) })
        : null,
      project.version ? el("span", { class: "meta-text", text: project.version }) : null,
      project.file_path && project.file_size ? el("span", { class: "meta-text", text: formatSize(project.file_size) }) : null,
      latest ? el("time", { class: "meta-text", datetime: latest, text: t("project.updated", { date: formatDate(latest) }) }) : null,
    ]);
  }

  function projectCard(project) {
    const type = TYPES.includes(project.type) ? project.type : "addon";
    const images = (project.images || []).filter(Boolean);

    let thumb;
    if (images.length > 1) {
      thumb = slider(images, project.name, type);
    } else {
      thumb = el("div", { class: "thumb thumb--" + type });
      if (images.length) {
        thumb.append(
          ...imgPair(images[0], t("project.singleImage", { name: project.name }), { fg: { loading: "lazy", decoding: "async" } })
        );
      } else {
        thumb.append(el("span", { class: "thumb-icon", html: icon(type) }));
      }
    }

    const link = "/project?p=" + encodeURIComponent(project.slug);
    const buttons = actionButtons(project);
    buttons.push(el("a", { class: "text-link", href: link, text: t("project.details") }));

    return el("article", { class: "card" }, [
      thumb,
      metaLine(project, type),
      el("h3", {}, el("a", { href: link, text: project.name })),
      el("p", { class: "card-desc", text: project.description || "" }),
      project.tags && project.tags.length ? el("ul", { class: "tags" }, project.tags.map((tag) => el("li", { text: tag }))) : null,
      el("div", { class: "card-actions" }, buttons),
    ]);
  }

  function gallery(images, name) {
    let index = 0;
    const mainBg = el("img", { alt: "", "aria-hidden": "true", class: "img-blur-bg" });
    const main = el("img", { alt: "", class: "img-contain-fg" });
    const stage = el("div", { class: "gallery-stage" }, [mainBg, main]);
    const many = images.length > 1;
    const thumbs = images.map((src, n) =>
      el("button", { class: "gallery-thumb", type: "button", "aria-label": t("project.thumb", { n: n + 1 }) }, el("img", { src, alt: "", loading: "lazy" }))
    );

    function show(next) {
      index = (next + images.length) % images.length;
      mainBg.src = images[index];
      main.src = images[index];
      main.alt = t("project.imageAlt", { name, n: index + 1, total: images.length });
      thumbs.forEach((button, n) => {
        if (n === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    if (many) {
      const prev = el("button", { class: "gallery-btn prev", type: "button", "aria-label": t("project.prev"), html: icon("prev") });
      const next = el("button", { class: "gallery-btn next", type: "button", "aria-label": t("project.next"), html: icon("next") });
      prev.addEventListener("click", () => show(index - 1));
      next.addEventListener("click", () => show(index + 1));
      stage.append(prev, next);
    }
    thumbs.forEach((button, n) => button.addEventListener("click", () => show(n)));

    const root = el(
      "div",
      {
        class: "gallery",
        role: "group",
        "aria-roledescription": "carousel",
        "aria-label": t("project.gallery"),
        tabindex: many ? "0" : false,
      },
      [stage, many ? el("div", { class: "gallery-thumbs" }, thumbs) : null]
    );
    root.addEventListener("keydown", (event) => {
      if (!many || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
    });
    show(0);
    return root;
  }

  function initProjects() {
    const boxes = $$("[data-projects]");
    if (!boxes.length) return;
    const filterBox = $("[data-filters]");
    let projects = null;
    let failed = false;
    let current = new URLSearchParams(location.search).get("type") || "all";

    function message(box, text) {
      box.replaceChildren(el("p", { class: "empty", text }));
    }

    function drawFilters() {
      if (!filterBox || !projects) return;
      const present = TYPES.filter((key) => projects.some((p) => p.type === key));
      if (current !== "all" && !present.includes(current)) current = "all";
      const options = [["all", t("projects.all", { n: projects.length })]].concat(
        present.map((key) => [key, t("types." + key) + " (" + projects.filter((p) => p.type === key).length + ")"])
      );
      filterBox.replaceChildren(
        ...options.map(([key, text]) => {
          const button = el("button", { class: "chip", type: "button", "aria-pressed": String(key === current), text });
          button.addEventListener("click", () => {
            current = key;
            render();
            history.replaceState(null, "", key === "all" ? location.pathname : location.pathname + "?type=" + key);
          });
          return button;
        })
      );
    }

    function render() {
      cleanups.splice(0).forEach((fn) => fn());
      drawFilters();
      boxes.forEach((box) => {
        if (failed) return message(box, t("projects.error"));
        if (!projects) return box.replaceChildren(skeletonBlock(parseInt(box.dataset.limit || "0", 10) || 3));
        const limit = parseInt(box.dataset.limit || "0", 10);
        let list = filterBox && current !== "all" ? projects.filter((p) => p.type === current) : projects;
        if (limit) list = list.slice(0, limit);
        if (!list.length) return message(box, projects.length ? t("projects.noneCategory") : t("projects.none"));
        box.replaceChildren(...list.map(projectCard));
      });
    }

    renderers.push(render);
    loadProjects().then(
      (list) => {
        projects = list;
        render();
      },
      () => {
        failed = true;
        render();
      }
    );
  }

  function initProjectPage() {
    const root = $("[data-project-view]");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("p");
    let project = null;
    let state = "loading";

    function setMeta(name, description) {
      document.title = brand(name + " | OLLALOLL");
      const meta = $("meta[name=description]");
      if (meta) meta.setAttribute("content", description);
      const url = (S.siteUrl || location.origin) + "/project?p=" + encodeURIComponent(slug);
      let canonical = $("link[rel=canonical]");
      if (!canonical) {
        canonical = el("link", { rel: "canonical" });
        document.head.append(canonical);
      }
      canonical.setAttribute("href", url);
    }

    function render() {
      if (state === "loading") return root.replaceChildren(skeletonBlock(1));
      if (state === "missing") {
        return root.replaceChildren(
          el("div", { class: "empty" }, [
            el("h2", { text: t("project.notFound") }),
            el("p", { text: t("project.notFoundText") }),
            el("a", { class: "btn btn-primary btn-small", href: "/projects", text: t("project.back") }),
          ])
        );
      }

      const type = TYPES.includes(project.type) ? project.type : "addon";
      const images = (project.images || []).filter(Boolean);
      const buttons = actionButtons(project);
      const updates = project.project_updates || [];
      setMeta(project.name, project.description || "");

      const visual = images.length
        ? gallery(images, project.name)
        : el("div", { class: "thumb thumb--" + type }, el("span", { class: "thumb-icon", html: icon(type) }));

      const body = [];
      if (project.details) body.push(el("section", { class: "rich" }, richTextLite(project.details)));
      if (project.install_note) {
        body.push(
          el("section", { class: "callout" }, [
            el("h2", { text: t("project.install") }),
            ...richTextLite(project.install_note),
            el("a", { class: "text-link", href: "/projects#install", text: t("project.guide") }),
          ])
        );
      }
      if (updates.length) {
        body.push(
          el("section", {}, [
            el("h2", { text: t("project.changelog") }),
            el(
              "ul",
              { class: "changelog" },
              updates.map((update) =>
                el("li", { class: "update" }, [
                  el("div", { class: "update-head" }, [
                    update.version ? el("span", { class: "badge", text: update.version }) : null,
                    el("time", { class: "meta-text", datetime: update.released_on, text: formatDate(update.released_on) }),
                  ]),
                  el("p", { text: update.notes }),
                ])
              )
            ),
          ])
        );
      }

      root.replaceChildren(
        el("article", {}, [
          el("header", { class: "project-head" }, [
            el("h1", { text: project.name }),
            metaLine(project, type),
            project.tags && project.tags.length ? el("ul", { class: "tags" }, project.tags.map((tag) => el("li", { text: tag }))) : null,
          ]),
          el("div", { class: "project-layout" }, [
            visual,
            el("div", { class: "project-summary" }, [
              el("p", { class: "lead-text", text: project.description || "" }),
              buttons.length ? el("div", { class: "card-actions" }, buttons) : null,
            ]),
          ]),
          body.length ? el("div", { class: "project-body" }, body) : null,
        ])
      );
    }

    renderers.push(render);
    if (!slug || !SB.url) {
      state = "missing";
      return;
    }
    fetch(
      SB.url +
        "/rest/v1/projects?slug=eq." +
        encodeURIComponent(slug) +
        "&select=*,project_updates(id,version,released_on,notes)&project_updates.order=released_on.desc",
      { headers: { apikey: SB.key } }
    )
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          project = rows[0] || null;
          state = project ? "ready" : "missing";
          render();
        },
        () => {
          state = "missing";
          render();
        }
      );
  }

  function initDictionary() {
    const listRoot = $("[data-dictionary-list]");
    if (!listRoot) return;
    const searchInput = $("#dict-search-input");
    const suggestBox = $("#dict-suggestions");
    let terms = null;
    let failed = false;
    let activeIndex = -1;
    let currentMatches = [];

    function letterOf(term) {
      const first = (term.term || "").trim().charAt(0).toUpperCase();
      return /[A-Z]/.test(first) ? first : "#";
    }

    function accuracyBadge(term) {
      return el("span", {
        class: "dict-accuracy",
        "data-accurate": String(Boolean(term.date_accurate)),
        text: term.date_accurate ? t("dictionary.dateAccurate") : t("dictionary.dateApprox"),
        title: term.date_accurate ? t("dictionary.dateAccurateHint") : t("dictionary.dateApproxHint"),
      });
    }

    const termHref = (term) => "/term?t=" + encodeURIComponent(term.slug);

    function termCard(term) {
      return el("li", { class: "dict-term", id: "dict-term-" + term.id }, [
        el("div", { class: "dict-term-head" }, [el("h3", {}, el("a", { href: termHref(term), text: term.term }))]),
        el("p", { text: term.definition }),
        el("div", { class: "dict-term-meta" }, [
          el("span", { text: t("dictionary.added") + " " + formatDate(term.added_on) }),
          accuracyBadge(term),
        ]),
      ]);
    }

    function renderList() {
      if (failed) return listRoot.replaceChildren(el("p", { class: "empty", text: t("dictionary.error") }));
      if (!terms) return listRoot.replaceChildren(skeletonBlock(5));
      if (!terms.length) return listRoot.replaceChildren(el("p", { class: "empty", text: t("dictionary.empty") }));

      const groups = [];
      const byLetter = new Map();
      terms.forEach((term) => {
        const letter = letterOf(term);
        if (!byLetter.has(letter)) {
          const group = { letter, items: [] };
          byLetter.set(letter, group);
          groups.push(group);
        }
        byLetter.get(letter).items.push(term);
      });

      listRoot.replaceChildren(
        ...groups.map((group) =>
          el("section", { class: "dict-group" }, [
            el("h2", { class: "dict-group-letter", text: group.letter }),
            el("ul", { class: "dict-terms" }, group.items.map(termCard)),
          ])
        )
      );
    }

    function closeSuggestions() {
      suggestBox.hidden = true;
      suggestBox.replaceChildren();
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.removeAttribute("aria-activedescendant");
      activeIndex = -1;
      currentMatches = [];
    }

    function setActive(index) {
      const options = $$(".suggestion", suggestBox);
      options.forEach((node, i) => node.classList.toggle("is-active", i === index));
      activeIndex = index;
      if (index >= 0 && options[index]) searchInput.setAttribute("aria-activedescendant", options[index].id);
      else searchInput.removeAttribute("aria-activedescendant");
    }

    function renderSuggestions(query) {
      if (!query) {
        closeSuggestions();
        return;
      }
      const q = query.toLowerCase();
      const matches = (terms || []).filter(
        (term) => term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q)
      );
      currentMatches = matches;
      activeIndex = -1;
      suggestBox.hidden = false;
      searchInput.setAttribute("aria-expanded", "true");

      if (!matches.length) {
        suggestBox.replaceChildren(el("li", { class: "no-results", role: "presentation", text: t("dictionary.noResults") }));
        searchInput.removeAttribute("aria-activedescendant");
        return;
      }

      suggestBox.replaceChildren(
        ...matches.slice(0, 30).map((term, index) =>
          el("li", { role: "presentation" }, [
            el("a", { class: "suggestion", id: "dict-suggestion-" + index, role: "option", href: termHref(term) }, [
              el("strong", { text: term.term }),
              el("span", { text: term.definition }),
            ]),
          ])
        )
      );
    }

    if (searchInput) {
      const debouncedSuggestions = debounce((value) => renderSuggestions(value), 180);
      searchInput.addEventListener("input", () => debouncedSuggestions(searchInput.value.trim()));
      searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim()) renderSuggestions(searchInput.value.trim());
      });
      searchInput.addEventListener("keydown", (event) => {
        if (suggestBox.hidden || !currentMatches.length) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(Math.min(activeIndex + 1, currentMatches.length - 1));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(Math.max(activeIndex - 1, 0));
        } else if (event.key === "Enter") {
          if (activeIndex >= 0) {
            event.preventDefault();
            location.href = termHref(currentMatches[activeIndex]);
          }
        } else if (event.key === "Escape") {
          closeSuggestions();
        }
      });
      document.addEventListener("click", (event) => {
        if (!suggestBox.hidden && !event.target.closest(".dict-search-box")) closeSuggestions();
      });
    }

    renderers.push(renderList);
    if (!SB.url) {
      failed = true;
      renderList();
      return;
    }
    fetch(SB.url + "/rest/v1/dictionary_terms?select=id,term,slug,definition,added_on,date_accurate&order=sort_key.asc", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          terms = rows;
          renderList();
        },
        () => {
          failed = true;
          renderList();
        }
      );
  }

  function initDictTermPage() {
    const root = $("[data-term-view]");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("t");
    let term = null;
    let state = "loading";

    function setMeta(name, description) {
      const url = (S.siteUrl || location.origin) + "/term?t=" + encodeURIComponent(slug);
      setPageMeta(brand(name + " | OLLALOLL"), description, url);
    }

    function accuracyBadge(row) {
      return el("span", {
        class: "dict-accuracy",
        "data-accurate": String(Boolean(row.date_accurate)),
        text: row.date_accurate ? t("dictionary.dateAccurate") : t("dictionary.dateApprox"),
        title: row.date_accurate ? t("dictionary.dateAccurateHint") : t("dictionary.dateApproxHint"),
      });
    }

    function render() {
      if (state === "loading") return root.replaceChildren(skeletonBlock(1));
      if (state === "missing") {
        return root.replaceChildren(
          el("div", { class: "empty" }, [
            el("h2", { text: t("dictionary.termNotFound") }),
            el("p", { text: t("dictionary.termNotFoundText") }),
            el("a", { class: "btn btn-primary btn-small", href: "/dictionary", text: t("dictionary.back") }),
          ])
        );
      }

      setMeta(term.term, term.definition || "");
      const shortText = term.definition || "";
      const longText = (term.long_definition || "").trim();

      root.replaceChildren(
        el("article", {}, [
          el("header", { class: "project-head" }, [
            el("h1", { text: term.term }),
            el("div", { class: "dict-term-meta" }, [
              el("span", { class: "meta-text", text: t("dictionary.added") + " " + formatDate(term.added_on) }),
              accuracyBadge(term),
              term.updated_at ? el("span", { class: "meta-text", text: t("library.updated") + " " + formatDate(term.updated_at) }) : null,
            ]),
          ]),
          el("div", { class: "project-body" }, [
            shortText ? el("p", { class: "lead-text", text: shortText }) : null,
            longText ? el("section", { class: "rich" }, richText(longText)) : null,
          ]),
        ])
      );
    }

    renderers.push(render);
    if (!slug || !SB.url) {
      state = "missing";
      return;
    }
    fetch(SB.url + "/rest/v1/dictionary_terms?slug=eq." + encodeURIComponent(slug) + "&select=*", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          term = rows[0] || null;
          state = term ? "ready" : "missing";
          render();
        },
        () => {
          state = "missing";
          render();
        }
      );
  }

  function initQuotes() {
    const listRoot = $("[data-quotes-list]");
    if (!listRoot) return;
    const searchInput = $("#quotes-search-input");
    const suggestBox = $("#quotes-suggestions");
    let quotes = null;
    let failed = false;
    let activeIndex = -1;
    let currentMatches = [];

    function yearOf(quote) {
      return (quote.quote_date || "").slice(0, 4) || "?";
    }

    function quoteId(quote) {
      return "quote-" + quote.id;
    }

    function quoteCard(quote) {
      return el("li", { class: "quote-card", id: quoteId(quote) }, [
        quote.pre_context ? el("p", { class: "quote-context", text: quote.pre_context }) : null,
        el("blockquote", { class: "quote-text", text: quote.quote }),
        quote.post_context ? el("p", { class: "quote-context", text: quote.post_context }) : null,
        el("div", { class: "quote-meta-row" }, [
          el("p", { class: "quote-meta", text: "— " + quote.author + ", " + formatDate(quote.quote_date) }),
          el("a", {
            class: "quote-permalink",
            href: "/quote?q=" + encodeURIComponent(quote.slug),
            "aria-label": t("quotes.permalink"),
            title: t("quotes.permalink"),
            html: icon("link"),
          }),
        ]),
      ]);
    }

    function renderList() {
      if (failed) return listRoot.replaceChildren(el("p", { class: "empty", text: t("quotes.error") }));
      if (!quotes) return listRoot.replaceChildren(skeletonBlock(4));
      if (!quotes.length) return listRoot.replaceChildren(el("p", { class: "empty", text: t("quotes.empty") }));

      const groups = [];
      const byYear = new Map();
      quotes.forEach((quote) => {
        const year = yearOf(quote);
        if (!byYear.has(year)) {
          const group = { year, items: [] };
          byYear.set(year, group);
          groups.push(group);
        }
        byYear.get(year).items.push(quote);
      });

      listRoot.replaceChildren(
        ...groups.map((group) =>
          el("section", { class: "quote-group" }, [
            el("h2", { class: "quote-group-year", text: group.year }),
            el("ul", { class: "quote-list" }, group.items.map(quoteCard)),
          ])
        )
      );
    }

    function closeSuggestions() {
      suggestBox.hidden = true;
      suggestBox.replaceChildren();
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.removeAttribute("aria-activedescendant");
      activeIndex = -1;
      currentMatches = [];
    }

    function setActive(index) {
      const options = $$(".suggestion", suggestBox);
      options.forEach((node, i) => node.classList.toggle("is-active", i === index));
      activeIndex = index;
      if (index >= 0 && options[index]) searchInput.setAttribute("aria-activedescendant", options[index].id);
      else searchInput.removeAttribute("aria-activedescendant");
    }

    function highlightCard(quote) {
      const card = document.getElementById(quoteId(quote));
      if (!card) return;
      card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      card.classList.add("is-highlighted");
      clearTimeout(card._highlightTimer);
      card._highlightTimer = setTimeout(() => card.classList.remove("is-highlighted"), 2000);
    }

    function quoteMatches(quote, q) {
      return (
        quote.quote.toLowerCase().includes(q) ||
        quote.author.toLowerCase().includes(q) ||
        formatDate(quote.quote_date).toLowerCase().includes(q) ||
        String(quote.quote_date).toLowerCase().includes(q)
      );
    }

    function renderSuggestions(query) {
      if (!query) {
        closeSuggestions();
        return;
      }
      const q = query.toLowerCase();
      const matches = (quotes || []).filter((quote) => quoteMatches(quote, q));
      currentMatches = matches;
      activeIndex = -1;
      suggestBox.hidden = false;
      searchInput.setAttribute("aria-expanded", "true");

      if (!matches.length) {
        suggestBox.replaceChildren(el("li", { class: "no-results", role: "presentation", text: t("quotes.noResults") }));
        searchInput.removeAttribute("aria-activedescendant");
        return;
      }

      suggestBox.replaceChildren(
        ...matches.slice(0, 30).map((quote, index) =>
          el("li", { role: "presentation" }, [
            el(
              "button",
              { class: "suggestion", type: "button", id: "quotes-suggestion-" + index, role: "option" },
              [
                el("strong", { text: quote.quote.length > 70 ? quote.quote.slice(0, 70) + "…" : quote.quote }),
                el("span", { text: quote.author + " · " + formatDate(quote.quote_date) }),
              ]
            ),
          ])
        )
      );
      $$(".suggestion", suggestBox).forEach((button, index) => {
        button.addEventListener("click", () => {
          highlightCard(matches[index]);
          closeSuggestions();
          searchInput.value = "";
        });
      });
    }

    if (searchInput) {
      const debouncedSuggestions = debounce((value) => renderSuggestions(value), 180);
      searchInput.addEventListener("input", () => debouncedSuggestions(searchInput.value.trim()));
      searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim()) renderSuggestions(searchInput.value.trim());
      });
      searchInput.addEventListener("keydown", (event) => {
        if (suggestBox.hidden || !currentMatches.length) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(Math.min(activeIndex + 1, currentMatches.length - 1));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(Math.max(activeIndex - 1, 0));
        } else if (event.key === "Enter") {
          if (activeIndex >= 0) {
            event.preventDefault();
            highlightCard(currentMatches[activeIndex]);
            closeSuggestions();
            searchInput.value = "";
          }
        } else if (event.key === "Escape") {
          closeSuggestions();
        }
      });
      document.addEventListener("click", (event) => {
        if (!suggestBox.hidden && !event.target.closest(".quotes-search-box")) closeSuggestions();
      });
    }

    renderers.push(renderList);
    if (!SB.url) {
      failed = true;
      renderList();
      return;
    }
    fetch(SB.url + "/rest/v1/quotes?select=id,quote,author,quote_date,pre_context,post_context,slug&order=quote_date.desc,created_at.desc", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          quotes = rows;
          renderList();
        },
        () => {
          failed = true;
          renderList();
        }
      );
  }

  function initQuotePage() {
    const root = $("[data-quote-view]");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("q");
    let quote = null;
    let state = "loading";

    function setMeta(text, description) {
      const title = text.length > 60 ? text.slice(0, 60) + "…" : text;
      const url = (S.siteUrl || location.origin) + "/quote?q=" + encodeURIComponent(slug);
      setPageMeta(brand(title + " | OLLALOLL"), description, url);
    }

    function render() {
      if (state === "loading") return root.replaceChildren(skeletonBlock(1));
      if (state === "missing") {
        return root.replaceChildren(
          el("div", { class: "empty" }, [
            el("h2", { text: t("quotes.notFound") }),
            el("p", { text: t("quotes.notFoundText") }),
            el("a", { class: "btn btn-primary btn-small", href: "/quotes", text: t("quotes.back") }),
          ])
        );
      }

      setMeta(quote.quote, "— " + quote.author + ", " + formatDate(quote.quote_date));

      root.replaceChildren(
        el("article", { class: "quote-card quote-page" }, [
          quote.pre_context ? el("p", { class: "quote-context", text: quote.pre_context }) : null,
          el("blockquote", { class: "quote-text quote-text-large", text: quote.quote }),
          quote.post_context ? el("p", { class: "quote-context", text: quote.post_context }) : null,
          el("p", { class: "quote-meta", text: "— " + quote.author + ", " + formatDate(quote.quote_date) }),
        ])
      );
    }

    renderers.push(render);
    if (!slug || !SB.url) {
      state = "missing";
      return;
    }
    fetch(SB.url + "/rest/v1/quotes?slug=eq." + encodeURIComponent(slug) + "&select=*", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          quote = rows[0] || null;
          state = quote ? "ready" : "missing";
          render();
        },
        () => {
          state = "missing";
          render();
        }
      );
  }

  function teamLabel(team) {
    return Array.isArray(team) ? team.join(" & ") : String(team || "");
  }

  function roundLabel(index, totalRounds) {
    const remaining = totalRounds - index;
    if (remaining <= 1) return t("events.final");
    if (remaining === 2) return t("events.semifinals");
    if (remaining === 3) return t("events.quarterfinals");
    return t("events.round", { n: index + 1 });
  }

  function tournamentBracket(eventRow) {
    const layout = eventRow.layout && Array.isArray(eventRow.layout.rounds) ? eventRow.layout : null;
    if (!layout || !layout.rounds.length) return el("p", { class: "empty", text: t("events.empty") });
    const totalRounds = Math.log2(layout.bracketSize || 2) || 1;
    const tree = el(
      "div",
      { class: "bracket-tree" },
      layout.rounds.map((round, roundIndex) =>
        el("div", { class: "bracket-round" }, [
          el("div", { class: "bracket-round-title", text: roundLabel(roundIndex, totalRounds) }),
          ...round.map((match) =>
            el("div", { class: "bracket-match" }, [
              el(
                "div",
                { class: "bracket-slot-row" },
                match.teams.map((team, slotIndex) =>
                  team == null
                    ? el("span", { class: "bracket-slot is-bye", text: t("events.bye") })
                    : el("span", {
                        class: "bracket-slot" + (match.winnerIndex === slotIndex ? " is-winner" : ""),
                        text: teamLabel(team),
                      })
                )
              ),
            ])
          ),
        ])
      )
    );
    const rounds = layout.rounds;
    const last = rounds[rounds.length - 1];
    const champion = last && last.length === 1 && last[0].winnerIndex != null ? last[0].teams[last[0].winnerIndex] : null;
    const wrap = el("div", { class: "bracket-wrap" }, [tree]);
    if (champion) wrap.append(el("div", { class: "bracket-champion", text: t("events.champion") + ": " + teamLabel(champion) }));
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

  function countdownDisplay(eventRow) {
    const targetIso = eventRow.target_at;
    const display = el("div", { class: "countdown-display" });
    const labels = [t("events.countdown.days"), t("events.countdown.hours"), t("events.countdown.minutes"), t("events.countdown.seconds")];
    const numbers = labels.map((label) => {
      const number = el("span", { class: "countdown-number", text: "0" });
      display.append(el("div", { class: "countdown-unit" }, [number, el("span", { class: "countdown-label", text: label })]));
      return number;
    });
    const ended = el("p", { class: "countdown-ended", text: t("events.countdown.ended") });
    ended.hidden = true;
    const wrap = el("div", { class: "countdown-wrap" }, [display, ended]);

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

  function isEventUnlocked(id) {
    try {
      return sessionStorage.getItem("event-unlock-" + id) === "1";
    } catch (error) {
      return false;
    }
  }

  function unlockEvent(id) {
    try {
      sessionStorage.setItem("event-unlock-" + id, "1");
    } catch (error) {}
  }

  function lobbyGate(eventRow, onUnlock) {
    const input = el("input", {
      type: "text",
      inputmode: "numeric",
      maxlength: "6",
      class: "lobby-code-input",
      "aria-label": t("events.codePrompt"),
      placeholder: "······",
    });
    const button = el("button", { class: "btn btn-primary btn-small", type: "button", text: t("events.codeSubmit") });
    const error = el("p", { class: "error", role: "alert" });
    function attempt() {
      const value = input.value.replace(/\D/g, "");
      if (value && eventRow.lobby_code && value === String(eventRow.lobby_code)) {
        unlockEvent(eventRow.id);
        onUnlock();
      } else {
        error.textContent = t("events.codeWrong");
      }
    }
    button.addEventListener("click", attempt);
    input.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter") {
        keyEvent.preventDefault();
        attempt();
      }
    });
    return el("div", { class: "lobby-gate" }, [
      el("p", { class: "hint", text: t("events.codeHint") }),
      el("div", { class: "lobby-gate-row" }, [input, button]),
      error,
    ]);
  }

  function parseInlineMd(line) {
    const nodes = [];
    const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let last = 0;
    let match;
    while ((match = re.exec(line))) {
      if (match.index > last) nodes.push(document.createTextNode(line.slice(last, match.index)));
      if (match[1] !== undefined) nodes.push(el("strong", { text: match[1] }));
      else nodes.push(el("a", { href: match[3], target: "_blank", rel: "noopener", text: match[2] }));
      last = match.index + match[0].length;
    }
    if (last < line.length) nodes.push(document.createTextNode(line.slice(last)));
    return nodes;
  }

  function richTextLite(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return el("ul", {}, lines.map((line) => el("li", {}, parseInlineMd(line.replace(/^\s*[-*]\s+/, "")))));
        }
        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return el("ol", {}, lines.map((line) => el("li", {}, parseInlineMd(line.replace(/^\s*\d+[.)]\s+/, "")))));
        }
        const paragraph = el("p", {});
        lines.forEach((line, index) => {
          if (index > 0) paragraph.append(el("br"));
          parseInlineMd(line).forEach((node) => paragraph.append(node));
        });
        return paragraph;
      });
  }

  function initLibrary() {
    const listRoot = $("[data-library-list]");
    if (!listRoot) return;
    const searchInput = $("#library-search-input");
    const sortButton = $("#library-sort-btn");
    const SORT_MODES = ["newest", "oldest", "name"];
    let sortMode = "newest";
    let entries = null;
    let failed = false;
    const pathCategoryMatch = location.pathname.match(/\/library\/([^/]+)\/?$/i);
    let activeCategory = (pathCategoryMatch ? decodeURIComponent(pathCategoryMatch[1]) : null) ||
      new URLSearchParams(location.search).get("c") ||
      null;
    if (activeCategory) activeCategory = activeCategory.toLowerCase();

    function categoryKeyOf(entry) {
      return (entry.category || "").toLowerCase();
    }

    function sortItems(items) {
      const sorted = items.slice();
      if (sortMode === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortMode === "oldest") sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return sorted;
    }

    function matchesQuery(entry, q) {
      if (!q) return true;
      if (entry.name.toLowerCase().includes(q)) return true;
      if ((entry.category || "").toLowerCase().includes(q)) return true;
      return (entry.fields || []).some(
        (field) => (field.title || "").toLowerCase().includes(q) || (field.description || "").toLowerCase().includes(q)
      );
    }

    const entryHref = (entry) => {
      const key = categoryKeyOf(entry);
      return key
        ? "/library/" + encodeURIComponent(key) + "/entry?e=" + encodeURIComponent(entry.slug)
        : "/library-entry?e=" + encodeURIComponent(entry.slug);
    };

    function entryCard(entry) {
      const firstField = (entry.fields || [])[0];
      const preview = entry.summary || (firstField ? firstField.description || "" : "");
      return el("li", { class: "dict-term" }, [
        el("div", { class: "dict-term-head" }, [el("h3", {}, el("a", { href: entryHref(entry), text: entry.name }))]),
        preview ? el("p", { text: preview.length > 160 ? preview.slice(0, 160) + "…" : preview }) : null,
      ]);
    }

    function countLabel(count) {
      return count === 1 ? t("library.entryCount", { count }) : t("library.entryCountPlural", { count });
    }

    function groupByCategory(items) {
      const groups = [];
      const byCategory = new Map();
      items.forEach((entry) => {
        const key = categoryKeyOf(entry);
        if (!byCategory.has(key)) {
          const group = { key, category: entry.category, items: [] };
          byCategory.set(key, group);
          groups.push(group);
        }
        byCategory.get(key).items.push(entry);
      });
      groups.sort((a, b) => a.category.localeCompare(b.category));
      return { groups, byCategory };
    }

    function islandCard(group) {
      return el("a", { class: "lib-island", href: "library/" + encodeURIComponent(group.key) + "/" }, [
        el("h2", { class: "lib-island-name", text: group.category }),
        el("span", { class: "lib-island-count", text: countLabel(group.items.length) }),
      ]);
    }

    function backLink() {
      return el("a", { class: "lib-back-link", href: "/library", text: t("library.backToCategories") });
    }

    function renderList() {
      if (failed) return listRoot.replaceChildren(el("p", { class: "empty", text: t("library.error") }));
      if (!entries) return listRoot.replaceChildren(skeletonBlock(5));
      if (!entries.length) return listRoot.replaceChildren(el("p", { class: "empty", text: t("library.empty") }));

      const q = (searchInput && searchInput.value.trim().toLowerCase()) || "";
      const { groups: allGroups, byCategory: allByCategory } = groupByCategory(entries);

      if (sortButton) sortButton.hidden = !q && !activeCategory;

      if (!q && !activeCategory) {
        return listRoot.replaceChildren(el("div", { class: "lib-islands" }, allGroups.map(islandCard)));
      }

      const filtered = entries.filter(
        (entry) => (!activeCategory || categoryKeyOf(entry) === activeCategory) && matchesQuery(entry, q)
      );

      if (!filtered.length) {
        return listRoot.replaceChildren(
          ...[activeCategory ? backLink() : null, el("p", { class: "empty", text: t("library.noResults") })].filter(Boolean)
        );
      }

      if (activeCategory) {
        const activeGroup = allByCategory.get(activeCategory);
        const activeLabel = activeGroup ? activeGroup.category : activeCategory;
        return listRoot.replaceChildren(
          el("section", { class: "dict-group" }, [
            backLink(),
            el("h2", { class: "dict-group-letter" }, [
              el("span", { text: activeLabel }),
              el("span", { class: "lib-count", text: countLabel(filtered.length) }),
            ]),
            el("ul", { class: "dict-terms" }, sortItems(filtered).map(entryCard)),
          ])
        );
      }

      const { groups } = groupByCategory(filtered);
      listRoot.replaceChildren(
        ...groups.map((group) =>
          el("section", { class: "dict-group" }, [
            el("h2", { class: "dict-group-letter" }, [
              el("span", { text: group.category }),
              el("span", { class: "lib-count", text: countLabel(group.items.length) }),
            ]),
            el("ul", { class: "dict-terms" }, sortItems(group.items).map(entryCard)),
          ])
        )
      );
    }

    function updateSortButton() {
      if (!sortButton) return;
      const key = sortMode === "name" ? "library.sortName" : sortMode === "oldest" ? "library.sortOldest" : "library.sortNewest";
      sortButton.textContent = t("library.sortLabel") + ": " + t(key);
    }

    if (sortButton) {
      sortButton.addEventListener("click", () => {
        sortMode = SORT_MODES[(SORT_MODES.indexOf(sortMode) + 1) % SORT_MODES.length];
        updateSortButton();
        renderList();
      });
    }
    if (searchInput) searchInput.addEventListener("input", debounce(renderList, 180));

    renderers.push(updateSortButton, renderList);
    if (!SB.url) {
      failed = true;
      renderList();
      return;
    }
    fetch(SB.url + "/rest/v1/library_entries?select=id,category,name,slug,summary,fields,image_url,created_at&order=category_key.asc,sort_key.asc", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          entries = rows;
          renderList();
        },
        () => {
          failed = true;
          renderList();
        }
      );
  }

  function initLibraryEntryPage() {
    const root = $("[data-library-entry-view]");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("e");
    let entry = null;
    let related = [];
    let state = "loading";

    function setMeta(name, description) {
      const url = (S.siteUrl || location.origin) + "/library-entry?e=" + encodeURIComponent(slug);
      setPageMeta(brand(name + " | OLLALOLL"), description, url);
    }

    function render() {
      if (state === "loading") return root.replaceChildren(skeletonBlock(1));
      if (state === "missing") {
        return root.replaceChildren(
          el("div", { class: "empty" }, [
            el("h2", { text: t("library.entryNotFound") }),
            el("p", { text: t("library.entryNotFoundText") }),
            el("a", { class: "btn btn-primary btn-small", href: "/library", text: t("library.back") }),
          ])
        );
      }

      setMeta(entry.name, entry.summary || ((entry.fields || [])[0] ? (entry.fields || [])[0].description || "" : ""));

      root.replaceChildren(
        el("article", {}, [
          el("header", { class: "project-head" }, [
            el("span", { class: "badge" }, entry.category),
            el("h1", { text: entry.name }),
            el("div", { class: "dict-term-meta" }, [el("span", { class: "meta-text", text: t("library.updated") + " " + formatDate(entry.updated_at) })]),
          ]),
          entry.summary ? el("p", { class: "lib-entry-summary" }, entry.summary) : null,
          entry.image_url ? el("img", { class: "lib-entry-image", src: entry.image_url, alt: "" }) : null,
          el(
            "div",
            { class: "project-body" },
            (entry.fields || []).map((field) =>
              el("section", { class: "lib-field" }, [el("h2", { text: field.title }), el("div", { class: "rich" }, richTextLite(field.description))])
            )
          ),
          related.length
            ? el("section", { class: "lib-related" }, [
                el("h2", { text: t("library.related") }),
                el(
                  "ul",
                  { class: "lib-related-links" },
                  related.map((other) =>
                    el(
                      "li",
                      {},
                      el("a", {
                        href: "/library/" + encodeURIComponent((other.category || "").toLowerCase()) + "/entry?e=" + encodeURIComponent(other.slug),
                        text: other.name,
                      })
                    )
                  )
                ),
              ])
            : null,
        ])
      );
    }

    renderers.push(render);
    if (!slug || !SB.url) {
      state = "missing";
      return;
    }
    fetch(SB.url + "/rest/v1/library_entries?slug=eq." + encodeURIComponent(slug) + "&select=*", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then((rows) => {
        entry = rows[0] || null;
        if (!entry) {
          state = "missing";
          render();
          return Promise.reject(new Error("missing"));
        }
        state = "ready";
        render();
        return fetch(
          SB.url + "/rest/v1/library_relations?select=entry_a,entry_b&or=(entry_a.eq." + entry.id + ",entry_b.eq." + entry.id + ")",
          { headers: { apikey: SB.key } }
        );
      })
      .then((response) => (response && response.ok ? response.json() : []))
      .then((rows) => {
        const otherIds = (rows || []).map((row) => (row.entry_a === entry.id ? row.entry_b : row.entry_a));
        if (!otherIds.length) return [];
        const filter = "(" + otherIds.join(",") + ")";
        return fetch(SB.url + "/rest/v1/library_entries?id=in." + filter + "&select=id,name,slug,category", { headers: { apikey: SB.key } }).then(
          (response) => (response.ok ? response.json() : [])
        );
      })
      .then(
        (rows) => {
          related = rows || [];
          render();
        },
        () => {
          state = state === "loading" ? "missing" : state;
          render();
        }
      );
  }

  function initIslandIcons() {
    $$("[data-icon]").forEach((node) => {
      if (node.querySelector(".island-icon")) return;
      node.prepend(el("span", { class: "island-icon", html: icon(node.dataset.icon) }));
    });
  }

  function timeAgo(dateStr) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days <= 0) return t("recent.today");
    if (days === 1) return t("recent.yesterday");
    return t("recent.daysAgo", { n: days });
  }

  function initRecentFeed() {
    const root = $("[data-recent-list]");
    if (!root) return;
    const LIMIT = 8;
    let items = null;
    let expanded = false;

    function render() {
      if (!items) return root.replaceChildren(skeletonBlock(3));
      if (!items.length) return root.replaceChildren(el("p", { class: "empty", text: t("recent.empty") }));
      const shown = expanded ? items : items.slice(0, LIMIT);
      const extra = items.length - shown.length;
      const kids = [
        el(
          "ul",
          { class: "recent-list" },
          shown.map((item) =>
            el("li", { class: "recent-item" }, [
              el("a", { href: item.href }, [
                el("div", { class: "recent-item-head" }, [
                  el("span", { class: "recent-item-type", text: t("content.type." + item.type) }),
                  el("span", { class: "recent-item-time", text: timeAgo(item.created_at) }),
                ]),
                el("span", { class: "recent-item-title", text: item.title }),
              ]),
            ])
          )
        ),
      ];
      if (extra > 0 || expanded) {
        const toggle = el("button", {
          type: "button",
          class: "btn btn-ghost btn-small recent-toggle",
          text: expanded ? t("recent.showLess") : t("recent.showMore", { n: extra }),
        });
        toggle.addEventListener("click", () => {
          expanded = !expanded;
          render();
        });
        kids.push(toggle);
      }
      root.replaceChildren(...kids);
    }

    renderers.push(render);
    if (!SB.url) {
      items = [];
      render();
      return;
    }
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const sinceParam = "created_at=gte." + encodeURIComponent(since);
    Promise.all([
      fetch(SB.url + "/rest/v1/projects?" + sinceParam + "&select=name,slug,created_at&order=created_at.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
      fetch(SB.url + "/rest/v1/dictionary_terms?" + sinceParam + "&select=term,slug,created_at&order=created_at.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
      fetch(SB.url + "/rest/v1/quotes?" + sinceParam + "&select=quote,slug,created_at&order=created_at.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
      fetch(SB.url + "/rest/v1/library_entries?" + sinceParam + "&select=name,slug,created_at&order=created_at.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([projects, terms, quotes, libraryItems]) => {
        items = []
          .concat(
            (projects || []).map((p) => ({ type: "project", title: p.name, href: "/project?p=" + encodeURIComponent(p.slug), created_at: p.created_at })),
            (terms || []).map((term) => ({ type: "term", title: term.term, href: "/term?t=" + encodeURIComponent(term.slug), created_at: term.created_at })),
            (quotes || []).map((quote) => ({
              type: "quote",
              title: quote.quote.length > 60 ? quote.quote.slice(0, 60) + "…" : quote.quote,
              href: "/quote?q=" + encodeURIComponent(quote.slug),
              created_at: quote.created_at,
            })),
            (libraryItems || []).map((entry) => ({
              type: "library",
              title: entry.name,
              href: "/library/" + encodeURIComponent((entry.category || "").toLowerCase()) + "/entry?e=" + encodeURIComponent(entry.slug),
              created_at: entry.created_at,
            }))
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        render();
      })
      .catch(() => {
        items = [];
        render();
      });
  }

  function initGlobalSearch() {
    const toggle = $("#global-search-toggle");
    if (!toggle) return;

    let cache = null;
    let overlay = null;
    let input = null;
    let resultsBox = null;
    let activeIndex = -1;
    let currentResults = [];

    function buildOverlay() {
      input = el("input", {
        type: "search",
        class: "global-search-input",
        placeholder: t("search.placeholder"),
        "aria-label": t("search.placeholder"),
        autocomplete: "off",
      });
      const closeBtn = el("button", { class: "global-search-close", type: "button", "aria-label": t("search.close") }, el("span", { html: icon("close") }));
      resultsBox = el("div", { class: "global-search-results" });
      const box = el("div", { class: "global-search-box" }, [el("span", { html: icon("search") }), input, closeBtn]);
      const panel = el("div", {
        class: "global-search-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": t("search.toggle"),
      }, [box, resultsBox]);
      overlay = el("div", { class: "global-search-overlay", hidden: true });
      overlay.append(panel);
      document.body.append(overlay);

      closeBtn.addEventListener("click", close);
      overlay.addEventListener("mousedown", (event) => {
        if (event.target === overlay) close();
      });
      panel.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const focusable = $$('a[href], button, input, [tabindex]:not([tabindex="-1"])', panel).filter(
          (node) => !node.disabled && node.offsetParent !== null
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      input.addEventListener("input", debounce(() => renderResults(input.value.trim()), 180));
      input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          close();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(Math.min(activeIndex + 1, currentResults.length - 1));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(Math.max(activeIndex - 1, 0));
        } else if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          location.href = currentResults[activeIndex].href;
        }
      });
    }

    function setActive(index) {
      const nodes = $$(".global-search-result", resultsBox);
      nodes.forEach((node, i) => node.classList.toggle("is-active", i === index));
      activeIndex = index;
      if (nodes[index]) nodes[index].scrollIntoView({ block: "nearest" });
    }

    function open() {
      if (!overlay) buildOverlay();
      overlay.hidden = false;
      input.value = "";
      renderResults("");
      setTimeout(() => input.focus(), 0);
      loadCache();
    }

    function close() {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      toggle.focus();
    }

    toggle.addEventListener("click", () => (overlay && !overlay.hidden ? close() : open()));
    document.addEventListener("keydown", (event) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
      }
    });

    function renderResults(query) {
      if (!resultsBox) return;
      if (!query) {
        activeIndex = -1;
        currentResults = [];
        resultsBox.replaceChildren(el("p", { class: "global-search-empty", text: t("search.prompt") }));
        return;
      }
      const q = query.toLowerCase();
      const data = cache || { projects: [], terms: [], quotes: [], library: [] };
      const matches = []
        .concat(
          data.projects
            .filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q))
            .map((p) => ({ type: "project", title: p.name, sub: p.description || "", href: "/project?p=" + encodeURIComponent(p.slug) })),
          data.terms
            .filter((term) => term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q))
            .map((term) => ({ type: "term", title: term.term, sub: term.definition, href: "/term?t=" + encodeURIComponent(term.slug) })),
          data.quotes
            .filter((quote) => quote.quote.toLowerCase().includes(q) || quote.author.toLowerCase().includes(q))
            .map((quote) => ({ type: "quote", title: quote.quote, sub: quote.author, href: "/quote?q=" + encodeURIComponent(quote.slug) })),
          data.library
            .filter(
              (entry) =>
                entry.name.toLowerCase().includes(q) ||
                entry.category.toLowerCase().includes(q) ||
                (entry.fields || []).some((f) => (f.title || "").toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q))
            )
            .map((entry) => ({
              type: "library",
              title: entry.name,
              sub: entry.category,
              href: "/library/" + encodeURIComponent((entry.category || "").toLowerCase()) + "/entry?e=" + encodeURIComponent(entry.slug),
            }))
        )
        .slice(0, 40);

      currentResults = matches;
      activeIndex = -1;
      if (!matches.length) {
        resultsBox.replaceChildren(el("p", { class: "global-search-empty", text: t("search.noResults") }));
        return;
      }

      const groups = [];
      const byType = new Map();
      matches.forEach((match) => {
        if (!byType.has(match.type)) {
          const group = { type: match.type, items: [] };
          byType.set(match.type, group);
          groups.push(group);
        }
        byType.get(match.type).items.push(match);
      });

      resultsBox.replaceChildren(
        ...groups.flatMap((group) => [
          el("p", { class: "global-search-group-label", text: t("content.type." + group.type) }),
          ...group.items.map((match) =>
            el("a", { class: "global-search-result", href: match.href }, [el("strong", { text: match.title }), el("span", { text: match.sub })])
          ),
        ])
      );
    }

    let cacheRequest = null;
    function loadCache() {
      if (cache || cacheRequest || !SB.url) return;
      cacheRequest = Promise.all([
        fetch(SB.url + "/rest/v1/projects?select=name,slug,description&order=created_at.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
        fetch(SB.url + "/rest/v1/dictionary_terms?select=term,slug,definition&order=sort_key.asc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
        fetch(SB.url + "/rest/v1/quotes?select=quote,author,slug&order=quote_date.desc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
        fetch(SB.url + "/rest/v1/library_entries?select=name,slug,category,fields&order=category_key.asc", { headers: { apikey: SB.key } }).then((r) => (r.ok ? r.json() : [])),
      ]).then(([projects, terms, quotes, library]) => {
        cache = { projects: projects || [], terms: terms || [], quotes: quotes || [], library: library || [] };
        if (input && input.value.trim()) renderResults(input.value.trim());
      });
    }
  }

  function initEvents() {
    const listRoot = $("[data-events-list]");
    if (!listRoot) return;
    let events = null;
    let failed = false;

    const bingoState = {};
    const bingoPolling = {};

    function getBingoPlayer(eventId) {
      try {
        const raw = readStorage("bingo-player-" + eventId);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    }

    function setBingoPlayer(eventId, player) {
      writeStorage("bingo-player-" + eventId, JSON.stringify(player));
    }

    function bingoDeviceToken() {
      let token = readStorage("ollaloll_bingo_device");
      if (!token) {
        token = window.crypto && crypto.randomUUID ? crypto.randomUUID() : "d-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        writeStorage("ollaloll_bingo_device", token);
      }
      return token;
    }

    function joinBingoPlayer(eventRow, name) {
      if (!SB.url) return Promise.reject(new Error("no backend"));
      const device = bingoDeviceToken();
      const getHeaders = { apikey: SB.key };
      return fetch(
        SB.url +
          "/rest/v1/bingo_players?event_id=eq." +
          eventRow.id +
          "&device_token=eq." +
          encodeURIComponent(device) +
          "&select=id,name,color,marked_cells",
        { headers: getHeaders }
      )
        .then((response) => (response.ok ? response.json() : []))
        .then((rows) => {
          if (rows && rows[0]) {
            if (rows[0].name === name) return rows[0];
            return fetch(SB.url + "/rest/v1/bingo_players?id=eq." + rows[0].id, {
              method: "PATCH",
              headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=representation" }, getHeaders),
              body: JSON.stringify({ name }),
            })
              .then((response) => (response.ok ? response.json() : [rows[0]]))
              .then((updated) => (updated && updated[0]) || rows[0]);
          }
          return fetch(SB.url + "/rest/v1/bingo_players?event_id=eq." + eventRow.id + "&select=color", { headers: getHeaders })
            .then((response) => (response.ok ? response.json() : []))
            .then((existing) => {
              const color = BINGO_COLORS[(existing || []).length % BINGO_COLORS.length];
              return fetch(SB.url + "/rest/v1/bingo_players?on_conflict=event_id,device_token", {
                method: "POST",
                headers: Object.assign(
                  { "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
                  getHeaders
                ),
                body: JSON.stringify({ event_id: eventRow.id, device_token: device, name, color }),
              })
                .then((response) => (response.ok ? response.json() : Promise.reject(new Error("join failed"))))
                .then((created) => created[0]);
            });
        });
    }

    function fetchBingoState(eventRow) {
      const isLockout = eventRow.type === "lockout_bingo";
      if (isLockout) {
        return fetch(SB.url + "/rest/v1/bingo_boards?event_id=eq." + eventRow.id + "&select=marked_cells", { headers: { apikey: SB.key } })
          .then((response) => (response.ok ? response.json() : []))
          .then((rows) => {
            if (rows && rows[0]) return rows[0].marked_cells || [];
            return fetch(SB.url + "/rest/v1/bingo_boards?on_conflict=event_id", {
              method: "POST",
              headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
              body: JSON.stringify({ event_id: eventRow.id, marked_cells: [] }),
            })
              .then((response) => (response.ok ? response.json() : []))
              .then((created) => (created && created[0] ? created[0].marked_cells || [] : []));
          });
      }
      const device = bingoDeviceToken();
      return fetch(
        SB.url + "/rest/v1/bingo_players?event_id=eq." + eventRow.id + "&device_token=eq." + encodeURIComponent(device) + "&select=marked_cells",
        { headers: { apikey: SB.key } }
      )
        .then((response) => (response.ok ? response.json() : []))
        .then((rows) => (rows && rows[0] ? rows[0].marked_cells || [] : []));
    }

    function toggleBingoCell(eventRow, index) {
      const isLockout = eventRow.type === "lockout_bingo";
      const state = bingoState[eventRow.id] || (bingoState[eventRow.id] = { marked: [], loaded: true });
      const marked = state.marked.includes(index) ? state.marked.filter((i) => i !== index) : state.marked.concat(index);
      bingoState[eventRow.id] = { marked, loaded: true };
      renderList();
      if (!SB.url) return;
      if (isLockout) {
        fetch(SB.url + "/rest/v1/bingo_boards?event_id=eq." + eventRow.id, {
          method: "PATCH",
          headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ marked_cells: marked, updated_at: new Date().toISOString() }),
        }).catch(() => {});
        return;
      }
      const device = bingoDeviceToken();
      fetch(SB.url + "/rest/v1/bingo_players?event_id=eq." + eventRow.id + "&device_token=eq." + encodeURIComponent(device), {
        method: "PATCH",
        headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ marked_cells: marked, updated_at: new Date().toISOString() }),
      }).catch(() => {});
    }

    function bingoNameGate(eventRow, onJoined) {
      const input = el("input", {
        type: "text",
        maxlength: "24",
        class: "lobby-code-input lobby-name-input",
        "aria-label": t("events.namePrompt"),
        placeholder: t("events.namePlaceholder"),
      });
      const button = el("button", { class: "btn btn-primary btn-small", type: "button", text: t("events.nameSubmit") });
      const error = el("p", { class: "error", role: "alert" });
      function attempt() {
        const name = input.value.trim().slice(0, 24);
        if (!name) {
          error.textContent = t("events.nameWrong");
          return;
        }
        error.textContent = "";
        button.disabled = true;
        joinBingoPlayer(eventRow, name)
          .then((player) => {
            setBingoPlayer(eventRow.id, { id: player.id, name: player.name, color: player.color });
            onJoined();
          })
          .catch(() => {
            button.disabled = false;
            error.textContent = t("events.nameError");
          });
      }
      button.addEventListener("click", attempt);
      input.addEventListener("keydown", (keyEvent) => {
        if (keyEvent.key === "Enter") {
          keyEvent.preventDefault();
          attempt();
        }
      });
      return el("div", { class: "lobby-gate" }, [
        el("p", { class: "hint", text: t("events.namePrompt") }),
        el("div", { class: "lobby-gate-row" }, [input, button]),
        error,
      ]);
    }

    function bingoGrid(eventRow) {
      const size = eventRow.size || 5;
      const layout = Array.isArray(eventRow.layout) ? eventRow.layout : [];
      const cells = Array.from({ length: size * size }, (_, i) => layout[i] || "");
      const isLockout = eventRow.type === "lockout_bingo";
      const player = getBingoPlayer(eventRow.id);

      if (!bingoState[eventRow.id]) {
        bingoState[eventRow.id] = { marked: [], loaded: false };
        fetchBingoState(eventRow).then((marked) => {
          bingoState[eventRow.id] = { marked: marked || [], loaded: true };
          renderList();
        });
      }

      if (isLockout && !bingoPolling[eventRow.id]) {
        bingoPolling[eventRow.id] = setInterval(() => {
          fetchBingoState(eventRow).then((marked) => {
            const current = (bingoState[eventRow.id] && bingoState[eventRow.id].marked) || [];
            const same = JSON.stringify(current.slice().sort()) === JSON.stringify((marked || []).slice().sort());
            bingoState[eventRow.id] = { marked: marked || [], loaded: true };
            if (!same) renderList();
          });
        }, 4000);
      }

      const marked = (bingoState[eventRow.id] && bingoState[eventRow.id].marked) || [];

      const badge = player
        ? el("p", { class: "bingo-player-badge" }, [
            el("span", { class: "bingo-swatch", style: "background:" + player.color, "aria-hidden": "true" }),
            el("span", { text: t("events.bingoYou", { name: player.name }) }),
          ])
        : null;

      const grid = el(
        "div",
        { class: "bingo-grid", style: "--bingo-size:" + size },
        cells.map((cellText, index) => {
          const isMarked = marked.includes(index);
          const button = el(
            "button",
            {
              class: "bingo-cell" + (isMarked ? " is-marked" : ""),
              type: "button",
              "aria-pressed": String(isMarked),
              style: isMarked && player && !isLockout ? "--bingo-mark:" + player.color : "",
            },
            el("span", { text: cellText })
          );
          button.addEventListener("click", () => toggleBingoCell(eventRow, index));
          return button;
        })
      );

      return el("div", { class: "bingo-wrap" }, [badge, grid]);
    }

    let voteTally = {};

    function voterToken() {
      let token = readStorage("ollaloll_voter");
      if (!token) {
        token = window.crypto && crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        writeStorage("ollaloll_voter", token);
      }
      return token;
    }

    function myPollVote(eventId) {
      const raw = readStorage("poll-vote-" + eventId);
      return raw === null ? null : Number(raw);
    }

    function castVote(eventRow, index) {
      if (!SB.url || myPollVote(eventRow.id) != null) return;
      const token = voterToken();
      writeStorage("poll-vote-" + eventRow.id, index);
      voteTally[eventRow.id] = voteTally[eventRow.id] || {};
      voteTally[eventRow.id][index] = (voteTally[eventRow.id][index] || 0) + 1;
      renderList();
      fetch(SB.url + "/rest/v1/event_votes", {
        method: "POST",
        keepalive: true,
        headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ event_id: eventRow.id, option_index: index, voter_token: token }),
      }).catch(() => {});
    }

    function pollOptions(eventRow) {
      const options = Array.isArray(eventRow.items) ? eventRow.items : [];
      const tally = voteTally[eventRow.id] || {};
      const total = Object.values(tally).reduce((sum, n) => sum + n, 0);
      const myVote = myPollVote(eventRow.id);
      const wrap = el("div", { class: "poll-options" });
      options.forEach((label, index) => {
        if (myVote == null) {
          const button = el("button", { class: "poll-option poll-option-vote", type: "button" }, el("span", { text: label }));
          button.addEventListener("click", () => castVote(eventRow, index));
          wrap.append(button);
          return;
        }
        const count = tally[index] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        wrap.append(
          el("div", { class: "poll-option" + (myVote === index ? " is-mine" : "") }, [
            el("div", { class: "poll-option-head" }, [
              el("span", { text: label + (myVote === index ? " ✓" : "") }),
              el("span", { class: "poll-count", text: pct + "%" }),
            ]),
            el("div", { class: "poll-bar" }, el("div", { class: "poll-bar-fill", style: "width:" + pct + "%" })),
          ])
        );
      });
      return wrap;
    }

    function tournamentCard(eventRow) {
      return el("section", { class: "event-card" }, [
        eventRow.featured ? el("span", { class: "card-live-dot", "aria-hidden": "true", title: t("events.featured") }) : null,
        el("div", { class: "event-card-head" }, [
          el("h2", { text: eventRow.title }),
          el("span", { class: "badge", text: t("events.type.tournament") }),
        ]),
        eventRow.description ? el("p", { class: "event-card-desc", text: eventRow.description }) : null,
        el("a", { class: "btn btn-primary btn-small", href: "/tournament?id=" + encodeURIComponent(eventRow.id), text: t("events.viewBracket") }),
      ]);
    }

    function eventCard(eventRow) {
      if (eventRow.type === "tournament") return tournamentCard(eventRow);
      const isBingoEvt = eventRow.type === "bingo" || eventRow.type === "lockout_bingo";
      const locked = eventRow.requires_code && !isEventUnlocked(eventRow.id);
      const needsName = isBingoEvt && !locked && !getBingoPlayer(eventRow.id);
      const body = locked
        ? lobbyGate(eventRow, renderList)
        : needsName
        ? bingoNameGate(eventRow, renderList)
        : eventRow.type === "countdown"
        ? countdownDisplay(eventRow)
        : eventRow.type === "poll"
        ? pollOptions(eventRow)
        : bingoGrid(eventRow);
      return el("section", { class: "event-card" }, [
        eventRow.featured ? el("span", { class: "card-live-dot", "aria-hidden": "true", title: t("events.featured") }) : null,
        el("div", { class: "event-card-head" }, [
          el("h2", { text: eventRow.title }),
          el("span", { class: "badge", text: t("events.type." + eventRow.type) }),
        ]),
        eventRow.description ? el("p", { class: "event-card-desc", text: eventRow.description }) : null,
        eventRow.type === "lockout_bingo" && !locked ? el("p", { class: "event-card-note", text: t("events.lockoutNote") }) : null,
        body,
      ]);
    }

    function renderList() {
      if (failed) return listRoot.replaceChildren(el("p", { class: "empty", text: t("events.error") }));
      if (!events) return listRoot.replaceChildren(skeletonBlock(2));
      if (!events.length) {
        listRoot.replaceChildren(
          el("div", { class: "events-empty" }, [
            el("p", { class: "empty", text: t("events.emptyFormal") }),
            el("a", { class: "btn btn-primary btn-small", href: "/", text: t("events.backHome") }),
          ])
        );
        return;
      }
      listRoot.replaceChildren(...events.map(eventCard));
    }

    renderers.push(renderList);
    if (!SB.url) {
      failed = true;
      renderList();
      return;
    }
    fetch(
      SB.url +
        "/rest/v1/events?select=id,title,type,description,size,layout,target_at,items,requires_code,lobby_code,featured&is_active=eq.true&order=created_at.desc",
      {
        headers: { apikey: SB.key },
      }
    )
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          events = rows;
          const pollIds = rows.filter((row) => row.type === "poll").map((row) => row.id);
          if (!pollIds.length) {
            renderList();
            return;
          }
          renderList();
          const idList = pollIds.join(",");
          fetch(SB.url + "/rest/v1/event_votes?select=event_id,option_index&event_id=in.(" + idList + ")", {
            headers: { apikey: SB.key },
          })
            .then((response) => (response.ok ? response.json() : []))
            .then((voteRows) => {
              (voteRows || []).forEach((vote) => {
                voteTally[vote.event_id] = voteTally[vote.event_id] || {};
                voteTally[vote.event_id][vote.option_index] = (voteTally[vote.event_id][vote.option_index] || 0) + 1;
              });
              renderList();
            })
            .catch(() => {});
        },
        () => {
          failed = true;
          renderList();
        }
      );
  }

  function initHeroRealmCopy() {
    const btn = $("[data-realm-copy]");
    const code = $("[data-realm-code]");
    if (!btn || !code) return;
    btn.addEventListener("click", () => {
      shareOrCopy(code.textContent.trim(), { button: btn });
    });
  }

  function initNavExtrasBadge() {
    const dot = $("[data-nav-extras-dot]");
    if (!dot || !SB.url) return;
    fetch(SB.url + "/rest/v1/events?select=id&is_active=eq.true&featured=eq.true&limit=1", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          dot.hidden = !(rows && rows.length);
        },
        () => {}
      );
  }

  function initHomeCountdowns() {
    const section = $("[data-home-countdowns-section]");
    const root = $("[data-home-countdowns]");
    if (!section || !root) return;
    let rows = [];

    function render() {
      section.hidden = !rows.length;
      if (!rows.length) return;
      root.replaceChildren(
        ...rows.map((row) =>
          el("div", { class: "countdown-card" }, [el("h3", { text: row.title }), countdownDisplay(row)])
        )
      );
    }

    renderers.push(render);
    if (!SB.url) return;
    fetch(SB.url + "/rest/v1/events?select=id,title,target_at&type=eq.countdown&is_active=eq.true&order=target_at.asc", {
      headers: { apikey: SB.key },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        rows = data || [];
        render();
      })
      .catch(() => {});
  }

  function initTournamentPage() {
    const root = $("[data-tournament-root]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    let failed = false;
    let notFound = !id;
    let row = null;

    function render() {
      if (failed || notFound) {
        root.replaceChildren(
          el("div", { class: "events-empty" }, [
            el("p", { class: "empty", text: t("events.tournamentNotFound") }),
            el("a", { class: "btn btn-primary btn-small", href: "/extras", text: t("events.backEvents") }),
          ])
        );
        return;
      }
      if (!row) {
        root.replaceChildren(skeletonBlock(1));
        return;
      }
      document.title = brand(row.title + " | OLLALOLL");
      root.replaceChildren(
        el("section", { class: "event-card" }, [
          el("div", { class: "event-card-head" }, [
            el("h1", { text: row.title }),
            el("span", { class: "badge", text: t("events.type.tournament") }),
          ]),
          row.description ? el("p", { class: "event-card-desc", text: row.description }) : null,
          tournamentBracket(row),
        ])
      );
    }

    renderers.push(render);
    if (notFound) {
      render();
      return;
    }
    if (!SB.url) {
      failed = true;
      render();
      return;
    }
    fetch(
      SB.url +
        "/rest/v1/events?select=id,title,description,layout&id=eq." +
        encodeURIComponent(id) +
        "&type=eq.tournament&is_active=eq.true",
      { headers: { apikey: SB.key } }
    )
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
      .then(
        (rows) => {
          if (!rows || !rows.length) {
            notFound = true;
            render();
            return;
          }
          row = rows[0];
          render();
        },
        () => {
          failed = true;
          render();
        }
      );
  }

  function initNotWordle() {
    const root = $("[data-notwordle-root]");
    if (!root) return;

    const WORD_LEN = 5;
    const MAX_GUESSES = 6;
    const EPOCH = Date.UTC(2026, 8, 27);
    const ROW1 = "qwertyuiop".split("");
    const ROW2 = "asdfghjkl".split("");
    const ROW3 = "zxcvbnm".split("");
    const RANK = { absent: 0, present: 1, correct: 2 };

    let failed = false;
    let wordList = null;
    let wordSet = new Set();
    let dayNumber = null;
    let answer = null;
    let guesses = [];
    let currentGuess = "";
    let status = "playing";
    let transientMessage = "";
    let shakeRow = -1;
    let shakeTimer = null;
    let revealing = false;
    let revealTimer = null;
    const animatedRows = new Set();
    const REVEAL_STAGGER_MS = 280;
    const REVEAL_TILE_MS = 550;

    function todayDayNumber() {
      const now = new Date();
      const utc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      return Math.floor((utc - EPOCH) / 86400000);
    }

    function todayDateString() {
      const now = new Date();
      return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    }

    const stateKey = (day) => "notwordle-state-" + day;
    const STATS_SALT = "ollaloll-notwordle-v2";

    function fnv1a(str) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      return (hash >>> 0).toString(36);
    }

    function signDayRecord(day, payload) {
      return fnv1a(STATS_SALT + "|" + day + "|" + JSON.stringify(payload) + "|" + STATS_SALT);
    }

    // Day-by-day game records are the only source of truth for stats (see computeStats below).
    // Each record is signed so a hand-edited localStorage/console entry is detected and ignored
    // rather than trusted — this can't be made unbreakable in client-side JS, but it closes the
    // "just paste a bigger number in" shortcut. Legacy unsigned records are migrated once, so
    // existing players don't lose real progress.
    function loadDayState(day) {
      try {
        const raw = JSON.parse(readStorage(stateKey(day)) || "null");
        if (!raw || typeof raw !== "object") return null;
        if (raw.payload && raw.sig) {
          if (signDayRecord(day, raw.payload) !== raw.sig) return null;
          return raw.payload;
        }
        if (raw.guesses && raw.status) {
          writeStorage(stateKey(day), JSON.stringify({ payload: raw, sig: signDayRecord(day, raw) }));
          return raw;
        }
        return null;
      } catch (error) {
        return null;
      }
    }

    function saveDayState() {
      const payload = { guesses, status };
      writeStorage(stateKey(dayNumber), JSON.stringify({ payload, sig: signDayRecord(dayNumber, payload) }));
    }

    function computeStats() {
      let keys = [];
      try {
        keys = Object.keys(localStorage);
      } catch (error) {
        keys = [];
      }
      const records = [];
      keys.forEach((key) => {
        const match = /^notwordle-state-(-?\d+)$/.exec(key);
        if (!match) return;
        const day = parseInt(match[1], 10);
        const payload = loadDayState(day);
        if (payload && (payload.status === "won" || payload.status === "lost")) records.push({ day, status: payload.status });
      });
      records.sort((a, b) => a.day - b.day);
      const stats = { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, lastWonDay: null };
      records.forEach((record) => {
        stats.played += 1;
        if (record.status === "won") {
          stats.wins += 1;
          stats.currentStreak = stats.lastWonDay === record.day - 1 ? stats.currentStreak + 1 : 1;
          stats.lastWonDay = record.day;
          stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        } else {
          stats.currentStreak = 0;
        }
      });
      return stats;
    }

    function computeFeedback(guess, target) {
      const result = new Array(WORD_LEN).fill("absent");
      const targetLetters = target.split("");
      const used = new Array(WORD_LEN).fill(false);
      for (let i = 0; i < WORD_LEN; i++) {
        if (guess[i] === targetLetters[i]) {
          result[i] = "correct";
          used[i] = true;
        }
      }
      for (let i = 0; i < WORD_LEN; i++) {
        if (result[i] === "correct") continue;
        let found = -1;
        for (let j = 0; j < WORD_LEN; j++) {
          if (!used[j] && targetLetters[j] === guess[i]) {
            found = j;
            break;
          }
        }
        if (found !== -1) {
          result[i] = "present";
          used[found] = true;
        }
      }
      return result;
    }

    function keyStates() {
      const states = {};
      guesses.forEach((guess, rowIndex) => {
        if (revealing && rowIndex === guesses.length - 1) return;
        guess.word.split("").forEach((letter, i) => {
          const fb = guess.feedback[i];
          if (!states[letter] || RANK[fb] > RANK[states[letter]]) states[letter] = fb;
        });
      });
      return states;
    }

    function triggerShake() {
      clearTimeout(shakeTimer);
      shakeRow = guesses.length;
      render();
      shakeTimer = setTimeout(() => {
        shakeRow = -1;
        render();
      }, 400);
    }

    function submitGuess() {
      if (status !== "playing" || revealing) return;
      if (currentGuess.length < WORD_LEN) {
        transientMessage = t("notwordle.invalidLength");
        triggerShake();
        return;
      }
      if (!wordSet.has(currentGuess)) {
        transientMessage = t("notwordle.notInList");
        triggerShake();
        return;
      }
      transientMessage = "";
      const feedback = computeFeedback(currentGuess, answer);
      guesses.push({ word: currentGuess, feedback });
      const won = currentGuess === answer;
      const lost = !won && guesses.length >= MAX_GUESSES;
      currentGuess = "";
      revealing = true;
      render();
      const revealDuration = (WORD_LEN - 1) * REVEAL_STAGGER_MS + REVEAL_TILE_MS;
      clearTimeout(revealTimer);
      revealTimer = setTimeout(() => {
        revealing = false;
        if (won) {
          status = "won";
        } else if (lost) {
          status = "lost";
        }
        saveDayState();
        render();
      }, revealDuration);
    }

    function handleKey(key) {
      if (status !== "playing" || revealing) return;
      if (key === "Enter") {
        submitGuess();
        return;
      }
      if (key === "Backspace") {
        if (!currentGuess.length) return;
        currentGuess = currentGuess.slice(0, -1);
        transientMessage = "";
        render();
        return;
      }
      if (/^[a-z]$/.test(key) && currentGuess.length < WORD_LEN) {
        currentGuess += key;
        transientMessage = "";
        render();
      }
    }

    document.addEventListener("keydown", (event) => {
      if (!root.isConnected || status !== "playing") return;
      const tag = (event.target && event.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Enter") handleKey("Enter");
      else if (event.key === "Backspace") handleKey("Backspace");
      else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toLowerCase());
    });

    function tileRow(rowIndex) {
      const guess = guesses[rowIndex];
      const isCurrent = rowIndex === guesses.length && status === "playing";
      const letters = guess ? guess.word.split("") : isCurrent ? currentGuess.split("") : [];
      const isRevealing = Boolean(guess) && !animatedRows.has(rowIndex);
      if (isRevealing) animatedRows.add(rowIndex);
      const tiles = [];
      for (let i = 0; i < WORD_LEN; i++) {
        const letter = letters[i] || "";
        const state = guess ? guess.feedback[i] : letter ? "filled" : "empty";
        const attrs = { class: "wordle-tile" + (isRevealing ? " is-revealing" : ""), "data-state": state, text: letter.toUpperCase() };
        if (isRevealing) attrs.style = "animation-delay:" + i * REVEAL_STAGGER_MS + "ms";
        tiles.push(el("div", attrs));
      }
      return el("div", { class: "wordle-row" + (rowIndex === shakeRow ? " is-shake" : "") }, tiles);
    }

    function board() {
      const rows = [];
      for (let i = 0; i < MAX_GUESSES; i++) rows.push(tileRow(i));
      return el("div", { class: "wordle-board" }, rows);
    }

    function keyButton(label, value, wide) {
      const state = value.length === 1 ? keyStates()[value] : null;
      const btn = el("button", { class: "wordle-key" + (wide ? " wordle-key-wide" : ""), type: "button", "data-state": state || "", text: label });
      btn.addEventListener("click", () => handleKey(value));
      return btn;
    }

    function keyboard() {
      return el("div", { class: "wordle-keyboard" }, [
        el("div", { class: "wordle-key-row" }, ROW1.map((k) => keyButton(k.toUpperCase(), k))),
        el("div", { class: "wordle-key-row" }, ROW2.map((k) => keyButton(k.toUpperCase(), k))),
        el("div", { class: "wordle-key-row" }, [
          keyButton(t("notwordle.enter"), "Enter", true),
          ...ROW3.map((k) => keyButton(k.toUpperCase(), k)),
          keyButton("⌫", "Backspace", true),
        ]),
      ]);
    }

    function statBlock(value, label) {
      return el("div", { class: "wordle-stat" }, [el("strong", { text: String(value) }), el("span", { text: label })]);
    }

    function shareResult(button) {
      const emojiRows = guesses
        .map((guess) => guess.feedback.map((state) => (state === "correct" ? "🟩" : state === "present" ? "🟨" : "⬛")).join(""))
        .join("\n");
      const scoreLabel = status === "won" ? String(guesses.length) : "X";
      const text = "(not)WORDLE " + t("notwordle.day", { n: dayNumber }) + " " + scoreLabel + "/" + MAX_GUESSES + "\n\n" + emojiRows;
      shareOrCopy(text, { button, copiedLabel: t("notwordle.shareCopied"), resetDelay: 2000 });
    }

    function statsPanel() {
      const stats = computeStats();
      const winPct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
      const shareBtn = el("button", { class: "btn btn-primary btn-small", type: "button", text: t("notwordle.share") });
      shareBtn.addEventListener("click", () => shareResult(shareBtn));
      return el("div", { class: "wordle-stats" }, [
        el("h2", { text: t("notwordle.stats.title") }),
        el("div", { class: "wordle-stats-grid" }, [
          statBlock(stats.played, t("notwordle.stats.played")),
          statBlock(winPct + "%", t("notwordle.stats.winPct")),
          statBlock(stats.currentStreak, t("notwordle.stats.streak")),
          statBlock(stats.maxStreak, t("notwordle.stats.maxStreak")),
        ]),
        shareBtn,
        el("p", { class: "hint", text: t("notwordle.playAgainTomorrow") }),
      ]);
    }

    function messageText() {
      if (transientMessage) return transientMessage;
      if (status === "won") return t("notwordle.win");
      if (status === "lost") return t("notwordle.lose", { word: answer.toUpperCase() });
      return "";
    }

    function render() {
      if (failed) {
        root.replaceChildren(el("p", { class: "empty", text: t("notwordle.error") }));
        return;
      }
      if (!wordList) {
        root.replaceChildren(skeletonBlock(1));
        return;
      }
      if (!wordList.length) {
        root.replaceChildren(el("p", { class: "empty", text: t("notwordle.noWords") }));
        return;
      }
      const msg = messageText();
      root.replaceChildren(
        el("div", { class: "wordle-wrap" }, [
          el("p", { class: "wordle-day", text: t("notwordle.day", { n: dayNumber }) }),
          board(),
          msg ? el("p", { class: "wordle-message", role: "status", "aria-live": "assertive", text: msg }) : null,
          status === "playing" ? keyboard() : statsPanel(),
        ])
      );
    }

    renderers.push(render);
    if (!SB.url) {
      failed = true;
      render();
      return;
    }
    function fetchAllWords(offset, acc) {
      const pageSize = 1000;
      return fetch(
        SB.url +
          "/rest/v1/wordle_words?select=word,scheduled_date&order=created_at.asc,id.asc&limit=" +
          pageSize +
          "&offset=" +
          offset,
        { headers: { apikey: SB.key } }
      )
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Request failed"))))
        .then((page) => {
          const combined = acc.concat(page || []);
          if (!page || page.length < pageSize) return combined;
          return fetchAllWords(offset + pageSize, combined);
        });
    }

    fetchAllWords(0, [])
      .then((rows) => {
        wordList = rows.map((row) => row.word.toLowerCase());
        wordSet = new Set(wordList);
        if (!wordList.length) {
          render();
          return;
        }
        dayNumber = todayDayNumber();
        const scheduled = rows.find((row) => row.scheduled_date === todayDateString());
        if (scheduled) {
          answer = scheduled.word.toLowerCase();
        } else {
          const pool = rows.filter((row) => !row.scheduled_date).map((row) => row.word.toLowerCase());
          const usablePool = pool.length ? pool : wordList;
          const idx = ((dayNumber % usablePool.length) + usablePool.length) % usablePool.length;
          answer = usablePool[idx];
        }
        const saved = loadDayState(dayNumber);
        if (saved) {
          guesses = saved.guesses || [];
          status = saved.status || "playing";
        }
        guesses.forEach((_, rowIndex) => animatedRows.add(rowIndex));
        render();
      })
      .catch(() => {
        failed = true;
        render();
      });
  }

  function renderAbout() {
    $$("[data-about-title]").forEach((node) => {
      const value = pick("about." + node.dataset.aboutTitle + ".title");
      if (value) node.textContent = value;
    });
    $$("[data-about-text]").forEach((box) =>
      box.replaceChildren(...(pick("about." + box.dataset.aboutText + ".text") || []).map((paragraph) => el("p", { text: paragraph })))
    );
    $$("[data-about-items]").forEach((list) =>
      list.replaceChildren(
        ...merged("about." + list.dataset.aboutItems + ".items").map((item) =>
          el("li", { class: "item" }, [
            el("h3", { text: item.title }),
            el("p", { text: item.text }),
            isWebUrl(item.url)
              ? el("a", { class: "btn btn-ghost btn-small item-link", href: item.url, target: "_blank", rel: "noopener", text: t("about.visit") })
              : null,
          ])
        )
      )
    );
    $$("[data-avatar]").forEach((box) => {
      if (S.avatar) box.replaceChildren(el("img", { src: S.avatar, alt: (S.name || "") + "" }));
    });
  }

  function initTabs() {
    $$("[data-tabs]").forEach((group) => {
      const tabs = $$('[role="tab"]', group);
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

      function select(index, focus) {
        tabs.forEach((tab, i) => {
          const active = i === index;
          tab.setAttribute("aria-selected", String(active));
          tab.tabIndex = active ? 0 : -1;
          panels[i].hidden = !active;
        });
        if (focus) tabs[index].focus();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => select(index, false));
        tab.addEventListener("keydown", (event) => {
          let next = null;
          if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
          if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = tabs.length - 1;
          if (next !== null) {
            event.preventDefault();
            select(next, true);
          }
        });
      });

      select(0, false);
    });
  }

  function initSelects() {
    $$("[data-select]").forEach((root) => {
      const button = $(".select-btn", root);
      const list = $(".select-list", root);
      const label = $(".select-value", root);
      const input = $("input[type=hidden]", root);
      const options = $$('[role="option"]', list);
      const selected = () => Math.max(0, options.findIndex((o) => o.getAttribute("aria-selected") === "true"));
      let active = selected();
      // .panel has a backdrop-filter, which makes it its own stacking
      // context — so when this list pops open and overflows past the
      // panel's edge, a later sibling .panel (also its own stacking
      // context) paints over it regardless of the list's own z-index.
      // Lifting the whole panel above its siblings while open fixes that.
      const elevateHost = root.closest(".panel");

      function highlight(index) {
        active = Math.min(options.length - 1, Math.max(0, index));
        options.forEach((option, n) => option.classList.toggle("is-active", n === active));
        button.setAttribute("aria-activedescendant", options[active].id);
        options[active].scrollIntoView({ block: "nearest" });
      }

      function choose(index) {
        options.forEach((option, n) => option.setAttribute("aria-selected", String(n === index)));
        label.textContent = options[index].textContent;
        input.value = options[index].dataset.value || options[index].textContent;
      }

      function open() {
        list.hidden = false;
        root.classList.add("is-open");
        if (elevateHost) elevateHost.classList.add("has-open-select");
        button.setAttribute("aria-expanded", "true");
        highlight(selected());
      }

      function close() {
        list.hidden = true;
        root.classList.remove("is-open");
        if (elevateHost) elevateHost.classList.remove("has-open-select");
        button.setAttribute("aria-expanded", "false");
        button.removeAttribute("aria-activedescendant");
      }

      button.addEventListener("click", () => (list.hidden ? open() : close()));

      button.addEventListener("keydown", (event) => {
        if (list.hidden) {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            open();
          }
          return;
        }
        if (event.key === "ArrowDown") highlight(active + 1);
        else if (event.key === "ArrowUp") highlight(active - 1);
        else if (event.key === "Home") highlight(0);
        else if (event.key === "End") highlight(options.length - 1);
        else if (event.key === "Enter" || event.key === " ") {
          choose(active);
          close();
        } else if (event.key === "Escape") close();
        else if (event.key === "Tab") {
          choose(active);
          close();
          return;
        } else return;
        event.preventDefault();
      });

      list.addEventListener("mousedown", (event) => event.preventDefault());
      list.addEventListener("click", (event) => {
        const option = event.target.closest('[role="option"]');
        if (!option) return;
        choose(options.indexOf(option));
        close();
        button.focus();
      });

      button.addEventListener("blur", close);

      const form = root.closest("form");
      if (form) form.addEventListener("reset", () => setTimeout(() => choose(0), 0));

      renderers.push(() => (label.textContent = options[selected()].textContent));
    });
  }

  function initForm() {
    const form = $("#contact-form");
    if (!form) return;
    const draft = initFormDraft(form, "contact");
    const status = $("#form-status", form);
    const submit = $("button[type=submit]", form);
    const captcha = $("[data-captcha]", form);
    const check = $("[data-captcha-check]", form);
    const stateText = $("[data-captcha-state]", form);
    const emailField = $("#field-email", form);
    const discordField = $("#field-discord", form);
    const discordVerifyWrap = $("#discord-verify", form);
    const discordVerifyBtn = $("#discord-verify-btn", form);
    const discordVerifyLabel = $("span", discordVerifyBtn);
    const discordState = $("#discord-state", form);
    const endpoint = SB.url + "/functions/v1/contact";
    const STORE_KEY = "discord-oauth-draft";
    const STATE_KEY = "discord-oauth-state";
    const RULES = {
      name: (v) => v.trim().length > 0,
      email: (v) => currentMethod() !== "email" || /^\S+@\S+\.\S+$/.test(v.trim()),
      discord: () => currentMethod() !== "discord" || Boolean(form.elements.discordProof.value),
      message: (v) => v.trim().length >= 10,
    };

    let captchaState = "idle";
    let proof = null;
    let proofAt = 0;
    let solving = null;
    const currentMethod = () => $('input[name="method"]:checked', form).value;

    function setStatus(text, isError) {
      status.textContent = text;
      status.hidden = true;
      if (text) showToast(text, isError);
    }

    function renderCaptcha() {
      captcha.dataset.state = captchaState;
      check.checked = captchaState === "done";
      check.disabled = captchaState === "working" || captchaState === "done";
      const texts = { working: t("captcha.working"), done: t("captcha.done"), failed: t("captcha.failed") };
      stateText.textContent = texts[captchaState] || "";
    }

    function setCaptcha(next) {
      captchaState = next;
      renderCaptcha();
    }

    function renderMethod() {
      const method = currentMethod();
      emailField.hidden = method !== "email";
      discordField.hidden = method !== "discord";
      $("#error-" + (method === "email" ? "discord" : "email")).textContent = "";
      form.elements[method === "email" ? "discord" : "email"].removeAttribute("aria-invalid");
    }

    function setDiscordState(next, label) {
      discordVerifyWrap.dataset.discordState = next;
      discordState.textContent = label || "";
    }

    function clearDiscordVerification() {
      form.elements.discord.value = "";
      form.elements.discordProof.value = "";
      setDiscordState("idle", "");
      discordVerifyLabel.textContent = t("form.discord.verify");
    }

    async function callContact(payload) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SB.anonJwt, Authorization: "Bearer " + SB.anonJwt },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || "failed");
        error.code = data.error;
        throw error;
      }
      return data;
    }

    async function solve(challenge) {
      const encoder = new TextEncoder();
      const batch = 500;
      for (let start = 0; start <= challenge.maxnumber; start += batch) {
        const jobs = [];
        for (let n = start; n < Math.min(start + batch, challenge.maxnumber + 1); n++) {
          jobs.push(
            crypto.subtle.digest("SHA-256", encoder.encode(challenge.salt + n)).then((buffer) => ({
              n,
              hex: Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join(""),
            }))
          );
        }
        const hit = (await Promise.all(jobs)).find((result) => result.hex === challenge.challenge);
        if (hit) return hit.n;
      }
      throw new Error("unsolved");
    }

    function verify() {
      if (proof && Date.now() - proofAt < 9 * 60 * 1000) return Promise.resolve(proof);
      if (solving) return solving;
      proof = null;
      setCaptcha("working");
      solving = callContact({ action: "challenge" })
        .then(async (challenge) => {
          const number = await solve(challenge);
          proof = { salt: challenge.salt, challenge: challenge.challenge, signature: challenge.signature, number };
          proofAt = Date.now();
          setCaptcha("done");
          return proof;
        })
        .catch((error) => {
          setCaptcha("failed");
          throw error;
        })
        .finally(() => {
          solving = null;
        });
      return solving;
    }

    function saveDraft() {
      try {
        sessionStorage.setItem(
          STORE_KEY,
          JSON.stringify({
            name: form.elements.name.value,
            topic: $("input[name=topic]", form).value,
            message: form.elements.message.value,
          })
        );
      } catch (error) {}
    }

    function restoreDraft() {
      let draft = null;
      try {
        draft = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
        sessionStorage.removeItem(STORE_KEY);
      } catch (error) {}
      if (!draft) return;
      if (draft.name) form.elements.name.value = draft.name;
      if (draft.message) form.elements.message.value = draft.message;
      if (draft.topic) {
        const topicInput = $("input[name=topic]", form);
        const option = $('[data-value="' + draft.topic + '"]', form);
        if (topicInput && option) {
          topicInput.value = draft.topic;
          const button = $("#topic", form);
          if (button) $(".select-value", button).textContent = option.textContent;
        }
      }
    }

    function startDiscordAuth() {
      const clientId = discord.clientId;
      if (!clientId) {
        setDiscordState("failed", t("discord.unavailable"));
        return;
      }
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
      const redirectUri = location.origin + location.pathname;
      try {
        sessionStorage.setItem(STATE_KEY, state);
      } catch (error) {}
      saveDraft();
      const authorizeUrl = new URL("https://discord.com/api/oauth2/authorize");
      authorizeUrl.searchParams.set("client_id", clientId);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("scope", "identify");
      authorizeUrl.searchParams.set("state", state);
      location.href = authorizeUrl.toString();
    }

    async function finishDiscordAuth() {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const authError = params.get("error");
      if (!code && !authError) return;

      history.replaceState(null, "", location.pathname);
      const methodRadio = $('input[name="method"][value="discord"]', form);
      if (methodRadio) methodRadio.checked = true;
      restoreDraft();
      renderMethod();

      let savedState = null;
      try {
        savedState = sessionStorage.getItem(STATE_KEY);
        sessionStorage.removeItem(STATE_KEY);
      } catch (error) {}

      if (authError) {
        setDiscordState("failed", t("discord.denied"));
        return;
      }
      if (!state || !savedState || state !== savedState) {
        setDiscordState("failed", t("discord.failed"));
        return;
      }

      setDiscordState("checking", t("discord.checking"));
      try {
        const data = await callContact({
          action: "discord-verify",
          code,
          redirect_uri: location.origin + location.pathname,
        });
        form.elements.discord.value = data.username;
        form.elements.discordProof.value = data.proof;
        setDiscordState("verified", t("discord.verified", { name: data.username }));
        discordVerifyLabel.textContent = t("form.discord.reverify");
        const box = $("#error-discord");
        if (box) box.textContent = "";
        form.elements.discord.removeAttribute("aria-invalid");
      } catch (error) {
        clearDiscordVerification();
        setDiscordState("failed", t("discord.failed"));
      }
    }

    $$('input[name="method"]', form).forEach((radio) => radio.addEventListener("change", renderMethod));
    discordVerifyBtn.addEventListener("click", startDiscordAuth);

    function validate() {
      let firstBad = null;
      Object.keys(RULES).forEach((name) => {
        const field = form.elements[name];
        const valid = RULES[name](field.value);
        const box = $("#error-" + name);
        if (box) box.textContent = valid ? "" : t("form.err." + name);
        if (valid) {
          field.removeAttribute("aria-invalid");
        } else {
          field.setAttribute("aria-invalid", "true");
          if (!firstBad) firstBad = field;
        }
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    check.addEventListener("change", () => {
      if (check.checked) verify().catch(() => {});
    });
    form.addEventListener(
      "focusin",
      () => {
        if (SB.url && SB.anonJwt && captchaState === "idle") verify().catch(() => {});
      },
      { once: true }
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus("");
      if (form.elements._gotcha.value) return;
      if (!validate()) return;

      if (!SB.url || !SB.anonJwt) {
        setStatus(t("form.notConnected"), true);
        return;
      }
      const last = Number(readStorage("message-sent"));
      if (last && Date.now() - last < MESSAGE_COOLDOWN_MS) {
        setStatus(t("form.wait"), true);
        return;
      }

      const method = currentMethod();
      submit.disabled = true;
      submit.textContent = t("form.sending");
      try {
        const activeProof = await verify();
        await callContact({
          action: "send",
          method,
          name: form.elements.name.value.trim(),
          email: method === "email" ? form.elements.email.value.trim() : undefined,
          discordProof: method === "discord" ? form.elements.discordProof.value : undefined,
          topic: $("input[name=topic]", form).value,
          message: form.elements.message.value.trim(),
          lang,
          proof: activeProof,
        });
        writeStorage("message-sent", Date.now());
        proof = null;
        setCaptcha("idle");
        form.reset();
        draft.clear();
        clearDiscordVerification();
        renderMethod();
        setStatus(t(method === "discord" ? "form.sent.discord" : "form.sent"));
      } catch (error) {
        if (error.code === "rate") {
          setStatus(t("form.rate"), true);
        } else if (error.code === "captcha") {
          proof = null;
          setCaptcha("failed");
          setStatus(t("captcha.failed"), true);
        } else if (error.code === "discord_unverified") {
          clearDiscordVerification();
          setStatus(t("form.err.discordExpired"), true);
        } else {
          setStatus(t("form.failed"), true);
        }
      } finally {
        submit.disabled = false;
        submit.textContent = t("form.send");
      }
    });

    form.addEventListener("input", (event) => {
      const field = event.target;
      if (field.getAttribute("aria-invalid") && RULES[field.name] && RULES[field.name](field.value)) {
        field.removeAttribute("aria-invalid");
        const error = $("#error-" + field.name, form);
        if (error) error.textContent = "";
      }
    });

    renderMethod();
    renderers.push(renderCaptcha);
    finishDiscordAuth();
  }

  function initBugReportForm() {
    const form = $("#bug-report-form");
    if (!form) return;
    const draft = initFormDraft(form, "bug-report");
    const status = $("#bug-form-status", form);
    const submit = $("button[type=submit]", form);
    const captcha = $("[data-captcha]", form);
    const check = $("[data-captcha-check]", form);
    const stateText = $("[data-captcha-state]", form);
    const endpoint = SB.url + "/functions/v1/contact";
    const COOLDOWN_KEY = "bug-report-sent";

    let captchaState = "idle";
    let proof = null;
    let proofAt = 0;
    let solving = null;

    function setStatus(text, isError) {
      status.textContent = text;
      status.hidden = true;
      if (text) showToast(text, isError);
    }

    function renderCaptcha() {
      captcha.dataset.state = captchaState;
      check.checked = captchaState === "done";
      check.disabled = captchaState === "working" || captchaState === "done";
      const texts = { working: t("captcha.working"), done: t("captcha.done"), failed: t("captcha.failed") };
      stateText.textContent = texts[captchaState] || "";
    }

    function setCaptcha(next) {
      captchaState = next;
      renderCaptcha();
    }

    async function callContact(payload) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SB.anonJwt, Authorization: "Bearer " + SB.anonJwt },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || "failed");
        error.code = data.error;
        throw error;
      }
      return data;
    }

    async function solve(challenge) {
      const solveEncoder = new TextEncoder();
      const batch = 500;
      for (let start = 0; start <= challenge.maxnumber; start += batch) {
        const jobs = [];
        for (let n = start; n < Math.min(start + batch, challenge.maxnumber + 1); n++) {
          jobs.push(
            crypto.subtle.digest("SHA-256", solveEncoder.encode(challenge.salt + n)).then((buffer) => ({
              n,
              hex: Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join(""),
            }))
          );
        }
        const hit = (await Promise.all(jobs)).find((result) => result.hex === challenge.challenge);
        if (hit) return hit.n;
      }
      throw new Error("unsolved");
    }

    function verify() {
      if (proof && Date.now() - proofAt < 9 * 60 * 1000) return Promise.resolve(proof);
      if (solving) return solving;
      proof = null;
      setCaptcha("working");
      solving = callContact({ action: "challenge" })
        .then(async (challenge) => {
          const number = await solve(challenge);
          proof = { salt: challenge.salt, challenge: challenge.challenge, signature: challenge.signature, number };
          proofAt = Date.now();
          setCaptcha("done");
          return proof;
        })
        .catch((error) => {
          setCaptcha("failed");
          throw error;
        })
        .finally(() => {
          solving = null;
        });
      return solving;
    }

    check.addEventListener("change", () => {
      if (check.checked) verify().catch(() => {});
    });
    form.addEventListener(
      "focusin",
      () => {
        if (SB.url && SB.anonJwt && captchaState === "idle") verify().catch(() => {});
      },
      { once: true }
    );

    // Custom project dropdown, populated once the live project list loads (kept separate
    // from the generic initSelects wiring since its options don't exist at page-init time).
    const projectRoot = $("[data-bug-project-select]", form);
    const projectButton = $(".select-btn", projectRoot);
    const projectList = $(".select-list", projectRoot);
    const projectLabel = $(".select-value", projectRoot);
    const projectInput = $("input[type=hidden]", projectRoot);
    let projectOptions = [];
    let projectActive = 0;

    function projectHighlight(index) {
      projectActive = Math.min(projectOptions.length - 1, Math.max(0, index));
      projectOptions.forEach((option, n) => option.classList.toggle("is-active", n === projectActive));
      projectButton.setAttribute("aria-activedescendant", projectOptions[projectActive].id);
      projectOptions[projectActive].scrollIntoView({ block: "nearest" });
    }

    function projectChoose(index) {
      projectOptions.forEach((option, n) => option.setAttribute("aria-selected", String(n === index)));
      projectLabel.textContent = projectOptions[index].textContent;
      projectInput.value = projectOptions[index].dataset.value || "";
    }

    function projectOpen() {
      projectList.hidden = false;
      projectRoot.classList.add("is-open");
      projectButton.setAttribute("aria-expanded", "true");
      projectHighlight(projectOptions.findIndex((o) => o.getAttribute("aria-selected") === "true"));
    }

    function projectClose() {
      projectList.hidden = true;
      projectRoot.classList.remove("is-open");
      projectButton.setAttribute("aria-expanded", "false");
      projectButton.removeAttribute("aria-activedescendant");
    }

    function wireProjectOptions() {
      projectOptions = $$('[role="option"]', projectList);
      projectOptions.forEach((option, index) => {
        option.addEventListener("click", () => {
          projectChoose(index);
          projectClose();
          projectButton.focus();
        });
      });
    }

    projectButton.addEventListener("click", () => (projectList.hidden ? projectOpen() : projectClose()));
    projectButton.addEventListener("keydown", (event) => {
      if (projectList.hidden) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          projectOpen();
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        projectHighlight(projectActive + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        projectHighlight(projectActive - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        projectHighlight(0);
      } else if (event.key === "End") {
        event.preventDefault();
        projectHighlight(projectOptions.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        projectChoose(projectActive);
        projectClose();
      } else if (event.key === "Escape") {
        projectClose();
      }
    });
    document.addEventListener("click", (event) => {
      if (!projectList.hidden && !projectRoot.contains(event.target)) projectClose();
    });

    wireProjectOptions();

    const preselect = new URLSearchParams(location.search).get("project");

    function populateProjects(rows) {
      const otherOption = projectList.firstElementChild;
      projectList.replaceChildren(
        ...rows.map((project, index) =>
          el("li", {
            id: "bug-project-option-" + (index + 1),
            role: "option",
            "aria-selected": "false",
            "data-value": project.name,
            text: project.name,
          })
        ),
        otherOption
      );
      otherOption.id = "bug-project-option-other";
      wireProjectOptions();
      const matchIndex = preselect ? projectOptions.findIndex((option) => option.dataset.value === preselect) : -1;
      projectChoose(matchIndex >= 0 ? matchIndex : projectOptions.length - 1);
    }

    if (SB.url) {
      fetch(SB.url + "/rest/v1/projects?select=name&is_draft=eq.false&order=sort_order.asc,name.asc", { headers: { apikey: SB.key } })
        .then((response) => (response.ok ? response.json() : []))
        .then((rows) => populateProjects(rows || []))
        .catch(() => populateProjects([]));
    } else {
      populateProjects([]);
    }

    function validate() {
      let firstBad = null;
      const platformOk = Boolean($("input[name=platform]", form).value);
      $("#error-bug-platform").textContent = platformOk ? "" : t("bugreport.err.platform");
      if (!platformOk) firstBad = projectButton;

      const stepsOk = form.elements.steps.value.trim().length >= 10;
      $("#error-bug-steps").textContent = stepsOk ? "" : t("bugreport.err.steps");
      if (stepsOk) form.elements.steps.removeAttribute("aria-invalid");
      else {
        form.elements.steps.setAttribute("aria-invalid", "true");
        firstBad = firstBad || form.elements.steps;
      }

      const contactOk = Boolean(form.elements.contact.value.trim());
      $("#error-bug-contact").textContent = contactOk ? "" : t("bugreport.err.contact");
      if (contactOk) form.elements.contact.removeAttribute("aria-invalid");
      else {
        form.elements.contact.setAttribute("aria-invalid", "true");
        firstBad = firstBad || form.elements.contact;
      }

      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    form.addEventListener("input", (event) => {
      if (event.target === form.elements.steps && form.elements.steps.value.trim().length >= 10) {
        form.elements.steps.removeAttribute("aria-invalid");
        $("#error-bug-steps").textContent = "";
      }
      if (event.target === form.elements.contact && form.elements.contact.value.trim()) {
        form.elements.contact.removeAttribute("aria-invalid");
        $("#error-bug-contact").textContent = "";
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus("");
      if (form.elements._gotcha.value) return;
      if (!validate()) return;

      if (!SB.url || !SB.anonJwt) {
        setStatus(t("bugreport.notConnected"), true);
        return;
      }
      const last = Number(readStorage(COOLDOWN_KEY));
      if (last && Date.now() - last < MESSAGE_COOLDOWN_MS) {
        setStatus(t("bugreport.wait"), true);
        return;
      }

      submit.disabled = true;
      submit.textContent = t("bugreport.sending");
      try {
        const activeProof = await verify();
        await callContact({
          action: "send-bug-report",
          projectName: projectInput.value || projectLabel.textContent,
          projectVersion: form.elements.version.value.trim(),
          platform: $("input[name=platform]", form).value,
          steps: form.elements.steps.value.trim(),
          expected: form.elements.expected.value.trim(),
          actual: form.elements.actual.value.trim(),
          contact: form.elements.contact.value.trim(),
          lang,
          proof: activeProof,
        });
        writeStorage(COOLDOWN_KEY, Date.now());
        proof = null;
        setCaptcha("idle");
        form.elements.version.value = "";
        form.elements.steps.value = "";
        form.elements.expected.value = "";
        form.elements.actual.value = "";
        form.elements.contact.value = "";
        draft.clear();
        setStatus(t("bugreport.sent"));
      } catch (error) {
        if (error.code === "rate") {
          setStatus(t("bugreport.rate"), true);
        } else if (error.code === "captcha") {
          proof = null;
          setCaptcha("failed");
          setStatus(t("captcha.failed"), true);
        } else {
          setStatus(t("bugreport.failed"), true);
        }
      } finally {
        submit.disabled = false;
        submit.textContent = t("bugreport.send");
      }
    });

    renderers.push(renderCaptcha);
  }

  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // sw.js calls skipWaiting()/clients.claim() on every install, so a new
    // deploy takes over fast — but a tab that's been open since before the
    // deploy is still running the old page/JS until it reloads. "hadController"
    // is true only once this tab was already being served by a worker, so we
    // don't show "update available" on a first-ever visit — only on a real
    // takeover by a newer one.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let shown = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || shown) return;
      shown = true;
      showUpdateToast();
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    });
  }

  function showUpdateToast() {
    const stack = ensureToastStack();
    const toast = el(
      "div",
      { class: "toast is-update", tabindex: "0", role: "button", "aria-label": t("sw.updateAvailable") },
      el("span", { text: t("sw.updateAvailable") })
    );
    toast.addEventListener("click", () => location.reload());
    toast.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        location.reload();
      }
    });
    stack.append(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    // No auto-dismiss — an update prompt should stay until acted on, not
    // disappear on its own like a transient confirmation toast.
  }

  // Pages like /projects, /library and /dictionary render their list from
  // an async fetch, so by the time the browser's own scroll-restoration
  // tries to put you back where you were on a back/forward navigation, the
  // page is still short (empty list) and it snaps to the top instead. We
  // take restoration over manually: save scroll position per URL as the
  // user scrolls/leaves, and on load, poll until the page has grown tall
  // enough to actually hold that position before jumping to it.
  function initScrollRestore() {
    try {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    } catch (error) {}

    const key = "scrollpos:" + location.pathname + location.search;
    const saveNow = () => writeStorage(key, Math.round(window.scrollY));

    window.addEventListener("scroll", debounce(saveNow, 150), { passive: true });
    window.addEventListener("pagehide", saveNow);

    const raw = readStorage(key);
    const target = raw == null ? NaN : parseFloat(raw);
    if (!Number.isFinite(target) || target <= 0) return;

    const deadline = Date.now() + 1500;
    function attempt() {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll >= target - 2 || Date.now() > deadline) {
        window.scrollTo(0, Math.min(target, maxScroll));
        return;
      }
      requestAnimationFrame(attempt);
    }
    requestAnimationFrame(attempt);
  }

  // The /tools/skin-preview page: upload a Minecraft skin PNG and spin it
  // around in 3D via the skinview3d library (loaded from a CDN script tag
  // on that page only). Everything happens client-side — the file never
  // leaves the browser.
  function initSkinPreview() {
    const canvas = $("[data-skin-canvas]");
    if (!canvas) return;

    const statusEl = $("[data-skin-status]");
    const errorEl = $("[data-skin-error]");
    const fileInput = $("[data-skin-file-input]");
    const modelButtons = $$("[data-skin-model]");
    const rotateBtn = $("[data-skin-rotate]");
    const resetBtn = $("[data-skin-reset]");

    if (!window.skinview3d) {
      if (statusEl) statusEl.textContent = t("skinpreview.loadFailed");
      return;
    }

    let currentModel = "auto-detect";
    let objectUrl = null;

    function sizeCanvas() {
      const wrap = canvas.parentElement;
      const width = Math.max(240, Math.round(wrap.clientWidth));
      const height = Math.round(width * (4 / 3));
      viewer.width = width;
      viewer.height = height;
    }

    const viewer = new window.skinview3d.SkinViewer({
      canvas,
      width: 300,
      height: 400,
      skin: "../../assets/skin-preview-default.png",
    });
    viewer.autoRotate = true;
    viewer.zoom = 0.85;
    viewer.fov = 50;

    sizeCanvas();
    window.addEventListener("resize", debounce(sizeCanvas, 150));

    if (statusEl) statusEl.textContent = t("skinpreview.placeholderNote");

    function setError(message) {
      if (errorEl) errorEl.textContent = message || "";
    }

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      setError("");

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);

      viewer
        .loadSkin(objectUrl, { model: currentModel })
        .then(() => {
          if (statusEl) statusEl.textContent = t("skinpreview.loaded");
        })
        .catch(() => {
          setError(t("skinpreview.error"));
        });
    });

    modelButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentModel = button.getAttribute("data-skin-model");
        modelButtons.forEach((b) => {
          b.classList.toggle("is-active", b === button);
          b.setAttribute("aria-pressed", b === button ? "true" : "false");
        });
        const file = fileInput?.files && fileInput.files[0];
        if (file) {
          viewer.loadSkin(objectUrl, { model: currentModel }).catch(() => setError(t("skinpreview.error")));
        } else {
          viewer.loadSkin("../../assets/skin-preview-default.png", { model: currentModel }).catch(() => {});
        }
      });
    });

    rotateBtn?.addEventListener("click", () => {
      viewer.autoRotate = !viewer.autoRotate;
      rotateBtn.setAttribute("aria-pressed", viewer.autoRotate ? "true" : "false");
      rotateBtn.classList.toggle("is-active", viewer.autoRotate);
    });

    resetBtn?.addEventListener("click", () => {
      viewer.autoRotate = true;
      viewer.zoom = 0.85;
      if (rotateBtn) {
        rotateBtn.setAttribute("aria-pressed", "true");
        rotateBtn.classList.add("is-active");
      }
      if (viewer.playerObject) viewer.playerObject.rotation.y = 0;
    });
  }

  // The /tools/coordinates page: a live two-way Overworld <-> Nether
  // coordinate converter. Typing in either side updates the other
  // (Nether = Overworld / 8, Overworld = Nether * 8); Y is unaffected by
  // the conversion so it isn't shown here.
  function initCoordsCalc() {
    const owX = $("[data-coords='ow-x']");
    if (!owX) return;
    const owZ = $("[data-coords='ow-z']");
    const netX = $("[data-coords='nether-x']");
    const netZ = $("[data-coords='nether-z']");
    const resetBtn = $("[data-coords-reset]");

    const round = (n) => Math.round(n * 100) / 100;

    function fromOverworld() {
      const x = parseFloat(owX.value);
      const z = parseFloat(owZ.value);
      if (Number.isFinite(x)) netX.value = round(x / 8);
      if (Number.isFinite(z)) netZ.value = round(z / 8);
    }

    function fromNether() {
      const x = parseFloat(netX.value);
      const z = parseFloat(netZ.value);
      if (Number.isFinite(x)) owX.value = round(x * 8);
      if (Number.isFinite(z)) owZ.value = round(z * 8);
    }

    [owX, owZ].forEach((input) => input.addEventListener("input", fromOverworld));
    [netX, netZ].forEach((input) => input.addEventListener("input", fromNether));

    resetBtn?.addEventListener("click", () => {
      owX.value = 0;
      owZ.value = 0;
      netX.value = 0;
      netZ.value = 0;
      owX.focus();
    });

    fromOverworld();
  }

  // The /tools/redstone-timer page: turn a target delay into the shortest
  // chain of repeaters (each 1-4 redstone ticks) that produces it.
  function initRedstoneTimer() {
    const delayInput = $("#rs-delay");
    if (!delayInput) return;
    const unitValue = $("#rs-unit-value");
    const unitList = $("#rs-unit-list");
    const output = $("[data-rs-output]");
    const summaryEl = $("[data-rs-summary]");
    const chainEl = $("[data-rs-repeaters]");
    const chainIntroEl = $("[data-rs-chain-intro]");
    const noteEl = $("[data-rs-note]");
    const errorEl = $("[data-rs-error]");

    function recompute() {
      errorEl.textContent = "";
      const raw = parseFloat(delayInput.value);
      if (!Number.isFinite(raw) || raw < 0) {
        output.hidden = true;
        if (delayInput.value.trim() !== "") errorEl.textContent = t("redstone.error") || "";
        return;
      }

      const unit = unitValue ? unitValue.value : "seconds";
      let redstoneTicksExact;
      if (unit === "seconds") redstoneTicksExact = raw * 10;
      else if (unit === "gameticks") redstoneTicksExact = raw / 2;
      else redstoneTicksExact = raw;

      const redstoneTicks = Math.round(redstoneTicksExact * 1000) / 1000;
      const wholeTicks = Math.floor(redstoneTicks);
      const isExact = Math.abs(redstoneTicks - wholeTicks) < 1e-6;
      const gameTicks = wholeTicks * 2;
      const seconds = Math.round(wholeTicks * 0.1 * 1000) / 1000;

      output.hidden = false;
      summaryEl.textContent = t("redstone.summary", { redstoneTicks: wholeTicks, gameTicks, seconds });

      chainEl.innerHTML = "";
      if (wholeTicks <= 0) {
        chainIntroEl.textContent = "";
        noteEl.textContent = t("redstone.zero");
      } else {
        let remaining = wholeTicks;
        const steps = [];
        while (remaining > 0) {
          const step = Math.min(4, remaining);
          steps.push(step);
          remaining -= step;
        }
        steps.forEach((ticks) => {
          chainEl.appendChild(
            el("span", { class: "btn btn-ghost btn-small redstone-chip", role: "listitem", text: t("redstone.repeaterLabel", { ticks }) })
          );
        });

        chainIntroEl.textContent = t("redstone.chainIntro", { count: steps.length });
        const notes = [];
        if (!isExact) notes.push(t("redstone.oddWarning"));
        if (steps.length > 8) notes.push(t("redstone.manyWarning", { count: steps.length }));
        noteEl.textContent = notes.join(" ");
      }
    }

    delayInput.addEventListener("input", recompute);
    if (unitList) unitList.addEventListener("click", recompute);

    recompute();
  }

  // The /tools/anvil-planner page: total XP-level cost of a set of
  // enchantments applied to one item, using the standard anvil cost model
  // (rarity multiplier x level, book cost halved, prior-work penalty
  // doubling each time an item is the result of a combine).
  function initAnvilPlanner() {
    const rowsEl = $("[data-anvil-rows]");
    if (!rowsEl) return;
    const addBtn = $("[data-anvil-add]");
    const resetBtn = $("[data-anvil-reset]");
    const priorInput = $("#anvil-prior-count");
    const priorNoteEl = $("[data-anvil-prior-note]");
    const totalEl = $("[data-anvil-total]");
    const xpEl = $("[data-anvil-xp]");

    function xpForLevel(level) {
      if (level <= 0) return 0;
      if (level <= 16) return level * level + 6 * level;
      if (level <= 31) return 2.5 * level * level - 40.5 * level + 360;
      return 4.5 * level * level - 162.5 * level + 2220;
    }

    function rowCost(row) {
      const level = Math.max(0, parseInt($("[data-anvil-level]", row).value, 10) || 0);
      const rarity = parseInt($("[data-anvil-rarity]", row).value, 10) || 1;
      const source = $("[data-anvil-source]", row).value;
      const mult = source === "book" ? Math.max(1, Math.round(rarity / 2)) : rarity;
      return mult * level;
    }

    function makeRow() {
      const row = el("div", { class: "anvil-row", "data-anvil-row": "" }, [
        el("div", { class: "anvil-row-grid" }, [
          el("div", { class: "field" }, [
            el("label", { text: t("anvil.row.name") }),
            el("input", { type: "text", "data-anvil-name": "", placeholder: t("anvil.row.namePlaceholder") }),
          ]),
          el("div", { class: "field" }, [
            el("label", { text: t("anvil.row.level") }),
            el("input", { type: "number", min: "1", step: "1", value: "1", "data-anvil-level": "" }),
          ]),
          el("div", { class: "field" }, [
            el("label", { text: t("anvil.row.rarity") }),
            el("select", { "data-anvil-rarity": "" }, [
              el("option", { value: "1", text: t("anvil.row.rarity.common") }),
              el("option", { value: "2", text: t("anvil.row.rarity.uncommon") }),
              el("option", { value: "4", text: t("anvil.row.rarity.rare") }),
              el("option", { value: "8", text: t("anvil.row.rarity.veryRare") }),
            ]),
          ]),
          el("div", { class: "field" }, [
            el("label", { text: t("anvil.row.source") }),
            el("select", { "data-anvil-source": "" }, [
              el("option", { value: "book", text: t("anvil.row.source.book") }),
              el("option", { value: "item", text: t("anvil.row.source.item") }),
            ]),
          ]),
        ]),
        el("div", { class: "anvil-row-footer" }, [
          el("span", { class: "hint", "data-anvil-row-cost": "" }),
          el("button", { type: "button", class: "btn btn-ghost btn-tiny", "data-anvil-remove": "", text: t("anvil.row.remove") }),
        ]),
      ]);

      $$("input, select", row).forEach((field) => field.addEventListener("input", recompute));
      $("[data-anvil-remove]", row).addEventListener("click", () => {
        row.remove();
        recompute();
      });

      return row;
    }

    function recompute() {
      let enchantTotal = 0;
      $$("[data-anvil-row]", rowsEl).forEach((row) => {
        const cost = rowCost(row);
        enchantTotal += cost;
        $("[data-anvil-row-cost]", row).textContent = t("anvil.row.cost", { levels: cost });
      });

      const priorCount = Math.max(0, parseInt(priorInput.value, 10) || 0);
      const penalty = Math.pow(2, priorCount) - 1;
      priorNoteEl.textContent = t("anvil.priorWork.note", { penalty });

      const total = enchantTotal + penalty;
      totalEl.textContent = t("anvil.total.summary", { total, enchantTotal, penalty });
      xpEl.textContent = t("anvil.total.xp", { xp: Math.round(xpForLevel(total)), total });
    }

    addBtn.addEventListener("click", () => {
      rowsEl.appendChild(makeRow());
      recompute();
    });

    priorInput.addEventListener("input", recompute);

    resetBtn.addEventListener("click", () => {
      rowsEl.innerHTML = "";
      rowsEl.appendChild(makeRow());
      priorInput.value = 0;
      recompute();
    });

    rowsEl.appendChild(makeRow());
    recompute();
  }

  // The /tools/loot-odds page: binomial probability calculator for "will I
  // get this drop in N attempts" — works for any user-entered drop chance,
  // rather than trying to hardcode every mob/chest loot table.
  function initLootOdds() {
    const chanceInput = $("#loot-chance");
    if (!chanceInput) return;
    const oneInNInput = $("#loot-oneinn");
    const attemptsInput = $("#loot-attempts");
    const atLeastEl = $("[data-loot-atleast]");
    const expectedEl = $("[data-loot-expected]");
    const confidenceEl = $("[data-loot-confidence]");

    const round = (n, d) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

    function fromChance() {
      const chance = parseFloat(chanceInput.value);
      if (Number.isFinite(chance) && chance > 0) oneInNInput.value = round(100 / chance, 2);
      else oneInNInput.value = "";
      recompute();
    }

    function fromOneInN() {
      const n = parseFloat(oneInNInput.value);
      if (Number.isFinite(n) && n > 0) chanceInput.value = round(100 / n, 4);
      recompute();
    }

    function recompute() {
      const chance = parseFloat(chanceInput.value);
      const attempts = Math.max(0, parseInt(attemptsInput.value, 10) || 0);
      if (!Number.isFinite(chance) || chance < 0 || chance > 100) {
        atLeastEl.textContent = "";
        expectedEl.textContent = "";
        confidenceEl.innerHTML = "";
        return;
      }

      const p = chance / 100;
      const probAtLeastOne = 1 - Math.pow(1 - p, attempts);
      atLeastEl.textContent = t("loot.atleast", {
        attempts,
        chance: round(chance, 4),
        probability: round(probAtLeastOne * 100, 2),
      });
      expectedEl.textContent = t("loot.expected", { expected: round(attempts * p, 2) });

      confidenceEl.innerHTML = "";
      [50, 90, 95, 99].forEach((percent) => {
        let label;
        if (p <= 0) {
          label = t("loot.confidence.impossible", { percent });
        } else if (p >= 1) {
          label = t("loot.confidence.chip", { percent, attempts: 1 });
        } else {
          const needed = Math.ceil(Math.log(1 - percent / 100) / Math.log(1 - p));
          label = t("loot.confidence.chip", { percent, attempts: needed });
        }
        confidenceEl.appendChild(el("span", { class: "btn btn-ghost btn-small redstone-chip", role: "listitem", text: label }));
      });
    }

    chanceInput.addEventListener("input", fromChance);
    oneInNInput.addEventListener("input", fromOneInN);
    attemptsInput.addEventListener("input", recompute);

    fromChance();
  }

  // The /tools/motd-formatter page: click color/format swatches to insert
  // §-codes into a text box, with a live styled preview and a copy button.
  // The 16 standard colors are exact; the Bedrock-exclusive "material"
  // colors (added in recent versions) use the correct §-codes but an
  // approximate preview swatch, called out in the page copy.
  const MOTD_STANDARD_COLORS = [
    { code: "0", i18n: "motd.color.black", hex: "#000000" },
    { code: "1", i18n: "motd.color.darkBlue", hex: "#0000AA" },
    { code: "2", i18n: "motd.color.darkGreen", hex: "#00AA00" },
    { code: "3", i18n: "motd.color.darkAqua", hex: "#00AAAA" },
    { code: "4", i18n: "motd.color.darkRed", hex: "#AA0000" },
    { code: "5", i18n: "motd.color.darkPurple", hex: "#AA00AA" },
    { code: "6", i18n: "motd.color.gold", hex: "#FFAA00" },
    { code: "7", i18n: "motd.color.gray", hex: "#AAAAAA" },
    { code: "8", i18n: "motd.color.darkGray", hex: "#555555" },
    { code: "9", i18n: "motd.color.blue", hex: "#5555FF" },
    { code: "a", i18n: "motd.color.green", hex: "#55FF55" },
    { code: "b", i18n: "motd.color.aqua", hex: "#55FFFF" },
    { code: "c", i18n: "motd.color.red", hex: "#FF5555" },
    { code: "d", i18n: "motd.color.lightPurple", hex: "#FF55FF" },
    { code: "e", i18n: "motd.color.yellow", hex: "#FFFF55" },
    { code: "f", i18n: "motd.color.white", hex: "#FFFFFF" },
  ];

  const MOTD_BEDROCK_COLORS = [
    { code: "g", i18n: "motd.color.minecoinGold", hex: "#DDD605" },
    { code: "h", i18n: "motd.color.quartz", hex: "#E3D4D1" },
    { code: "i", i18n: "motd.color.iron", hex: "#CECACA" },
    { code: "j", i18n: "motd.color.netherite", hex: "#443A3D" },
    { code: "m", i18n: "motd.color.redstone", hex: "#971607" },
    { code: "n", i18n: "motd.color.copper", hex: "#B4684D" },
    { code: "p", i18n: "motd.color.matGold", hex: "#DEB12D" },
    { code: "q", i18n: "motd.color.emerald", hex: "#47A036" },
    { code: "s", i18n: "motd.color.diamond", hex: "#2EE8DC" },
    { code: "t", i18n: "motd.color.lapis", hex: "#21497B" },
    { code: "u", i18n: "motd.color.amethyst", hex: "#9A5CC6" },
    { code: "v", i18n: "motd.color.resin", hex: "#CB6F32" },
  ];

  const MOTD_FORMATS = [
    { code: "l", i18n: "motd.format.bold" },
    { code: "o", i18n: "motd.format.italic" },
    { code: "k", i18n: "motd.format.obfuscated" },
    { code: "r", i18n: "motd.format.reset" },
  ];

  function initMotdFormatter() {
    const input = $("[data-motd-input]");
    if (!input) return;
    const formatsEl = $("[data-motd-formats]");
    const colorsEl = $("[data-motd-colors]");
    const bedrockColorsEl = $("[data-motd-bedrock-colors]");
    const previewEl = $("[data-motd-preview]");
    const copyBtn = $("[data-motd-copy]");
    const clearBtn = $("[data-motd-clear]");

    const colorHexByCode = {};
    [...MOTD_STANDARD_COLORS, ...MOTD_BEDROCK_COLORS].forEach((c) => (colorHexByCode[c.code] = c.hex));

    function insertCode(code) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const insertion = "§" + code;
      input.value = input.value.slice(0, start) + insertion + input.value.slice(end);
      const pos = start + insertion.length;
      input.focus();
      input.setSelectionRange(pos, pos);
      renderPreview();
    }

    function renderPreview() {
      previewEl.innerHTML = "";
      const parts = input.value.split("§");
      let color = null;
      let bold = false;
      let italic = false;
      let obfuscated = false;

      function appendSpan(text) {
        if (!text) return;
        previewEl.appendChild(
          el("span", {
            text,
            style:
              (color ? "color:" + color + ";" : "") +
              (bold ? "font-weight:700;" : "") +
              (italic ? "font-style:italic;" : ""),
            class: obfuscated ? "motd-obfuscated" : null,
          })
        );
      }

      parts.forEach((part, i) => {
        if (i === 0) {
          appendSpan(part);
          return;
        }
        const code = (part[0] || "").toLowerCase();
        const rest = part.slice(1);
        if (code === "r") {
          color = null;
          bold = false;
          italic = false;
          obfuscated = false;
        } else if (code === "l") {
          bold = true;
        } else if (code === "o") {
          italic = true;
        } else if (code === "k") {
          obfuscated = true;
        } else if (colorHexByCode[code]) {
          color = colorHexByCode[code];
          bold = false;
          italic = false;
          obfuscated = false;
        }
        appendSpan(rest);
      });
    }

    function buildSwatches(container, list, isColor) {
      list.forEach((entry) => {
        const button = el("button", {
          type: "button",
          class: isColor ? "motd-swatch" : "btn btn-ghost btn-small redstone-chip",
          role: "listitem",
          title: t(entry.i18n),
          "aria-label": t(entry.i18n),
          style: isColor ? "background:" + entry.hex + ";" : null,
          text: isColor ? null : t(entry.i18n),
        });
        button.addEventListener("click", () => insertCode(entry.code));
        container.appendChild(button);
      });
    }

    buildSwatches(formatsEl, MOTD_FORMATS, false);
    buildSwatches(colorsEl, MOTD_STANDARD_COLORS, true);
    buildSwatches(bedrockColorsEl, MOTD_BEDROCK_COLORS, true);

    input.addEventListener("input", renderPreview);

    copyBtn.addEventListener("click", () => {
      shareOrCopy(input.value, { button: copyBtn, copiedLabel: t("motd.copied"), resetDelay: 1500 });
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      renderPreview();
      input.focus();
    });

    renderPreview();
  }

  // Bedrock /effect command IDs. Sourced against DigMinecraft's PE/Bedrock
  // effect list, cross-checked against the Hero of the Village page for the
  // Bedrock-specific "village_hero" id (Java uses "hero_of_the_village").
  const EFFECT_LIST = [
    { id: "absorption", i18n: "cmdbuilder.effectName.absorption" },
    { id: "bad_omen", i18n: "cmdbuilder.effectName.badOmen" },
    { id: "blindness", i18n: "cmdbuilder.effectName.blindness" },
    { id: "breath_of_the_nautilus", i18n: "cmdbuilder.effectName.breathOfTheNautilus" },
    { id: "conduit_power", i18n: "cmdbuilder.effectName.conduitPower" },
    { id: "darkness", i18n: "cmdbuilder.effectName.darkness" },
    { id: "dolphins_grace", i18n: "cmdbuilder.effectName.dolphinsGrace" },
    { id: "fatal_poison", i18n: "cmdbuilder.effectName.fatalPoison" },
    { id: "fire_resistance", i18n: "cmdbuilder.effectName.fireResistance" },
    { id: "glowing", i18n: "cmdbuilder.effectName.glowing" },
    { id: "haste", i18n: "cmdbuilder.effectName.haste" },
    { id: "health_boost", i18n: "cmdbuilder.effectName.healthBoost" },
    { id: "hunger", i18n: "cmdbuilder.effectName.hunger" },
    { id: "infested", i18n: "cmdbuilder.effectName.infested" },
    { id: "instant_damage", i18n: "cmdbuilder.effectName.instantDamage" },
    { id: "instant_health", i18n: "cmdbuilder.effectName.instantHealth" },
    { id: "invisibility", i18n: "cmdbuilder.effectName.invisibility" },
    { id: "jump_boost", i18n: "cmdbuilder.effectName.jumpBoost" },
    { id: "levitation", i18n: "cmdbuilder.effectName.levitation" },
    { id: "mining_fatigue", i18n: "cmdbuilder.effectName.miningFatigue" },
    { id: "nausea", i18n: "cmdbuilder.effectName.nausea" },
    { id: "night_vision", i18n: "cmdbuilder.effectName.nightVision" },
    { id: "oozing", i18n: "cmdbuilder.effectName.oozing" },
    { id: "poison", i18n: "cmdbuilder.effectName.poison" },
    { id: "raid_omen", i18n: "cmdbuilder.effectName.raidOmen" },
    { id: "regeneration", i18n: "cmdbuilder.effectName.regeneration" },
    { id: "resistance", i18n: "cmdbuilder.effectName.resistance" },
    { id: "saturation", i18n: "cmdbuilder.effectName.saturation" },
    { id: "slow_falling", i18n: "cmdbuilder.effectName.slowFalling" },
    { id: "slowness", i18n: "cmdbuilder.effectName.slowness" },
    { id: "speed", i18n: "cmdbuilder.effectName.speed" },
    { id: "strength", i18n: "cmdbuilder.effectName.strength" },
    { id: "trial_omen", i18n: "cmdbuilder.effectName.trialOmen" },
    { id: "village_hero", i18n: "cmdbuilder.effectName.villageHero" },
    { id: "water_breathing", i18n: "cmdbuilder.effectName.waterBreathing" },
    { id: "weakness", i18n: "cmdbuilder.effectName.weakness" },
    { id: "weaving", i18n: "cmdbuilder.effectName.weaving" },
    { id: "wind_charged", i18n: "cmdbuilder.effectName.windCharged" },
    { id: "wither", i18n: "cmdbuilder.effectName.wither" },
  ];

  const SUMMON_ENTITY_SUGGESTIONS = [
    "zombie", "skeleton", "creeper", "spider", "enderman", "cow", "pig", "sheep",
    "chicken", "wolf", "cat", "horse", "villager", "iron_golem", "snow_golem",
    "slime", "witch", "drowned", "husk", "piglin", "hoglin", "blaze", "ghast",
    "panda", "fox", "bee", "parrot", "dolphin", "turtle", "polar_bear",
    "armor_stand", "item", "olla:bear", "olla:lion", "olla:moose", "olla:deer", "olla:walrus",
  ];

  // Bedrock /execute step grammar, sourced from Microsoft's official command
  // reference (learn.microsoft.com/.../commands/execute) and cross-checked
  // against the community execute-rewrite writeup for the 1.19.70+ syntax
  // (as/at/in, positioned/align/anchored/rotated/facing, if/unless).
  const EXEC_STEP_TYPES = {
    as: {
      group: "context",
      label: "cmdbuilder.execute.step.as",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@s" }],
      build: (v) => `as ${v.target || "@s"}`,
    },
    at: {
      group: "context",
      label: "cmdbuilder.execute.step.at",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@s" }],
      build: (v) => `at ${v.target || "@s"}`,
    },
    in: {
      group: "context",
      label: "cmdbuilder.execute.step.in",
      fields: [
        {
          key: "dimension",
          label: "cmdbuilder.execute.field.dimension",
          type: "select",
          options: [
            { value: "overworld", label: "cmdbuilder.execute.dim.overworld" },
            { value: "nether", label: "cmdbuilder.execute.dim.nether" },
            { value: "the_end", label: "cmdbuilder.execute.dim.theEnd" },
          ],
          default: "overworld",
        },
      ],
      build: (v) => `in ${v.dimension || "overworld"}`,
    },
    positioned: {
      group: "position",
      label: "cmdbuilder.execute.step.positioned",
      fields: [
        { key: "x", label: "X", default: "~" },
        { key: "y", label: "Y", default: "~" },
        { key: "z", label: "Z", default: "~" },
      ],
      build: (v) => `positioned ${v.x || "~"} ${v.y || "~"} ${v.z || "~"}`,
    },
    positionedAs: {
      group: "position",
      label: "cmdbuilder.execute.step.positionedAs",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@s" }],
      build: (v) => `positioned as ${v.target || "@s"}`,
    },
    align: {
      group: "position",
      label: "cmdbuilder.execute.step.align",
      fields: [{ key: "axes", label: "cmdbuilder.execute.field.axes", type: "checkboxAxes", default: ["x", "y", "z"] }],
      build: (v) => `align ${(v.axes && v.axes.length ? v.axes : ["x", "y", "z"]).join("")}`,
    },
    anchored: {
      group: "position",
      label: "cmdbuilder.execute.step.anchored",
      fields: [
        {
          key: "anchor",
          label: "cmdbuilder.execute.field.anchor",
          type: "select",
          options: [
            { value: "feet", label: "cmdbuilder.anchor.feet" },
            { value: "eyes", label: "cmdbuilder.anchor.eyes" },
          ],
          default: "feet",
        },
      ],
      build: (v) => `anchored ${v.anchor || "feet"}`,
    },
    rotated: {
      group: "position",
      label: "cmdbuilder.execute.step.rotated",
      fields: [
        { key: "yaw", label: "cmdbuilder.summon.yaw", default: "~" },
        { key: "pitch", label: "cmdbuilder.summon.pitch", default: "~" },
      ],
      build: (v) => `rotated ${v.yaw || "~"} ${v.pitch || "~"}`,
    },
    rotatedAs: {
      group: "position",
      label: "cmdbuilder.execute.step.rotatedAs",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@s" }],
      build: (v) => `rotated as ${v.target || "@s"}`,
    },
    facing: {
      group: "position",
      label: "cmdbuilder.execute.step.facing",
      fields: [
        { key: "x", label: "X", default: "~" },
        { key: "y", label: "Y", default: "~" },
        { key: "z", label: "Z", default: "~" },
      ],
      build: (v) => `facing ${v.x || "~"} ${v.y || "~"} ${v.z || "~"}`,
    },
    facingEntity: {
      group: "position",
      label: "cmdbuilder.execute.step.facingEntity",
      fields: [
        { key: "target", label: "cmdbuilder.execute.field.target", default: "@p" },
        {
          key: "anchor",
          label: "cmdbuilder.execute.field.anchor",
          type: "select",
          options: [
            { value: "eyes", label: "cmdbuilder.anchor.eyes" },
            { value: "feet", label: "cmdbuilder.anchor.feet" },
          ],
          default: "eyes",
        },
      ],
      build: (v) => `facing entity ${v.target || "@p"} ${v.anchor || "eyes"}`,
    },
    ifEntity: {
      group: "condition",
      label: "cmdbuilder.execute.step.ifEntity",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@p" }],
      build: (v) => `if entity ${v.target || "@p"}`,
    },
    unlessEntity: {
      group: "condition",
      label: "cmdbuilder.execute.step.unlessEntity",
      fields: [{ key: "target", label: "cmdbuilder.execute.field.target", default: "@p" }],
      build: (v) => `unless entity ${v.target || "@p"}`,
    },
    ifBlock: {
      group: "condition",
      label: "cmdbuilder.execute.step.ifBlock",
      fields: [
        { key: "x", label: "X", default: "~" },
        { key: "y", label: "Y", default: "~-1" },
        { key: "z", label: "Z", default: "~" },
        { key: "block", label: "cmdbuilder.execute.field.block", default: "minecraft:stone" },
      ],
      build: (v) => `if block ${v.x || "~"} ${v.y || "~-1"} ${v.z || "~"} ${v.block || "minecraft:stone"}`,
    },
    unlessBlock: {
      group: "condition",
      label: "cmdbuilder.execute.step.unlessBlock",
      fields: [
        { key: "x", label: "X", default: "~" },
        { key: "y", label: "Y", default: "~-1" },
        { key: "z", label: "Z", default: "~" },
        { key: "block", label: "cmdbuilder.execute.field.block", default: "minecraft:stone" },
      ],
      build: (v) => `unless block ${v.x || "~"} ${v.y || "~-1"} ${v.z || "~"} ${v.block || "minecraft:stone"}`,
    },
    ifScoreMatches: {
      group: "condition",
      label: "cmdbuilder.execute.step.ifScoreMatches",
      fields: [
        { key: "target", label: "cmdbuilder.execute.field.target", default: "@s" },
        { key: "objective", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
        { key: "range", label: "cmdbuilder.execute.field.range", default: "1.." },
      ],
      build: (v) => `if score ${v.target || "@s"} ${v.objective || "myObjective"} matches ${v.range || "1.."}`,
    },
    unlessScoreMatches: {
      group: "condition",
      label: "cmdbuilder.execute.step.unlessScoreMatches",
      fields: [
        { key: "target", label: "cmdbuilder.execute.field.target", default: "@s" },
        { key: "objective", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
        { key: "range", label: "cmdbuilder.execute.field.range", default: "1.." },
      ],
      build: (v) => `unless score ${v.target || "@s"} ${v.objective || "myObjective"} matches ${v.range || "1.."}`,
    },
    ifScoreCompare: {
      group: "condition",
      label: "cmdbuilder.execute.step.ifScoreCompare",
      fields: [
        { key: "target", label: "cmdbuilder.execute.field.target", default: "@s" },
        { key: "objective", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
        {
          key: "op",
          label: "cmdbuilder.execute.field.op",
          type: "select",
          options: [
            { value: "=", label: "cmdbuilder.execute.op.eq" },
            { value: "<", label: "cmdbuilder.execute.op.lt" },
            { value: "<=", label: "cmdbuilder.execute.op.lte" },
            { value: ">", label: "cmdbuilder.execute.op.gt" },
            { value: ">=", label: "cmdbuilder.execute.op.gte" },
          ],
          default: "=",
        },
        { key: "target2", label: "cmdbuilder.execute.field.target2", default: "@p" },
        { key: "objective2", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
      ],
      build: (v) =>
        `if score ${v.target || "@s"} ${v.objective || "myObjective"} ${v.op || "="} ${v.target2 || "@p"} ${v.objective2 || "myObjective"}`,
    },
    unlessScoreCompare: {
      group: "condition",
      label: "cmdbuilder.execute.step.unlessScoreCompare",
      fields: [
        { key: "target", label: "cmdbuilder.execute.field.target", default: "@s" },
        { key: "objective", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
        {
          key: "op",
          label: "cmdbuilder.execute.field.op",
          type: "select",
          options: [
            { value: "=", label: "cmdbuilder.execute.op.eq" },
            { value: "<", label: "cmdbuilder.execute.op.lt" },
            { value: "<=", label: "cmdbuilder.execute.op.lte" },
            { value: ">", label: "cmdbuilder.execute.op.gt" },
            { value: ">=", label: "cmdbuilder.execute.op.gte" },
          ],
          default: "=",
        },
        { key: "target2", label: "cmdbuilder.execute.field.target2", default: "@p" },
        { key: "objective2", label: "cmdbuilder.execute.field.objective", default: "myObjective" },
      ],
      build: (v) =>
        `unless score ${v.target || "@s"} ${v.objective || "myObjective"} ${v.op || "="} ${v.target2 || "@p"} ${v.objective2 || "myObjective"}`,
    },
  };

  function cmdQuoteIfNeeded(str) {
    if (!str) return "";
    return /\s/.test(str) ? '"' + str.replace(/"/g, '\\"') + '"' : str;
  }

  function initCommandBuilder() {
    const tabsWrap = $("[data-cmd-tabs]");
    if (!tabsWrap) return;

    const tabs = $$("[data-cmd-tab]");
    const panels = $$("[data-cmd-panel]");
    tabs.forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const target = tabBtn.dataset.cmdTab;
        tabs.forEach((b) => b.classList.toggle("is-active", b === tabBtn));
        panels.forEach((p) => {
          p.hidden = p.dataset.cmdPanel !== target;
        });
      });
    });

    $$("[data-cmd-copy]").forEach((btn) => {
      const key = btn.dataset.cmdCopy;
      btn.addEventListener("click", () => {
        const codeEl = $('[data-cmd-output="' + key + '"]');
        if (!codeEl) return;
        shareOrCopy(codeEl.textContent, { button: btn, copiedLabel: t("cmdbuilder.copied"), resetDelay: 1500 });
      });
    });

    // --- /effect ---
    (function initEffectBuilder() {
      const modeButtons = $$("[data-effect-mode]");
      const giveFields = $("[data-effect-give-fields]");
      const targetInput = $("[data-effect-target]");
      const nameSelect = $("[data-effect-name]");
      const secondsInput = $("[data-effect-seconds]");
      const amplifierInput = $("[data-effect-amplifier]");
      const hideParticlesInput = $("[data-effect-hide-particles]");
      const infiniteInput = $("[data-effect-infinite]");
      const output = $('[data-cmd-output="effect"]');
      if (!targetInput || !nameSelect || !output) return;

      EFFECT_LIST.forEach((effect) => {
        nameSelect.appendChild(el("option", { value: effect.id, text: t(effect.i18n) }));
      });
      nameSelect.value = "speed";

      let mode = "give";
      modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          mode = btn.dataset.effectMode;
          modeButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
          giveFields.hidden = mode !== "give";
          recompute();
        });
      });

      $$('[data-cmd-quickpick-for="effect-target"] button').forEach((btn) => {
        btn.addEventListener("click", () => {
          targetInput.value = btn.textContent;
          recompute();
        });
      });

      function recompute() {
        const target = targetInput.value.trim() || "@s";
        if (mode === "clear") {
          output.textContent = `/effect ${target} clear`;
          return;
        }
        const effectId = nameSelect.value;
        const amplifier = Math.max(0, Math.min(255, parseInt(amplifierInput.value, 10) || 0));
        const hide = hideParticlesInput.checked ? "true" : "false";
        const seconds = infiniteInput.checked ? "infinite" : Math.max(1, parseInt(secondsInput.value, 10) || 30);
        secondsInput.disabled = infiniteInput.checked;
        output.textContent = `/effect ${target} ${effectId} ${seconds} ${amplifier} ${hide}`;
      }

      [targetInput, nameSelect, secondsInput, amplifierInput].forEach((elm) => elm.addEventListener("input", recompute));
      [hideParticlesInput, infiniteInput].forEach((elm) => elm.addEventListener("change", recompute));
      recompute();
    })();

    // --- /summon ---
    (function initSummonBuilder() {
      const entityInput = $("[data-summon-entity]");
      const entityList = $("[data-summon-entity-list]");
      const output = $('[data-cmd-output="summon"]');
      if (!entityInput || !output) return;

      SUMMON_ENTITY_SUGGESTIONS.forEach((id) => entityList.appendChild(el("option", { value: id })));

      const posInputs = {};
      $$("[data-summon-pos]").forEach((input) => (posInputs[input.dataset.summonPos] = input));
      const yawInput = $("[data-summon-yaw]");
      const pitchInput = $("[data-summon-pitch]");
      const faceInputs = {};
      $$("[data-summon-face]").forEach((input) => (faceInputs[input.dataset.summonFace] = input));
      const faceTargetInput = $("[data-summon-face-target]");
      const faceAnchorSelect = $("[data-summon-face-anchor]");
      const eventInput = $("[data-summon-event]");
      const nameTagInput = $("[data-summon-nametag]");
      const rotModeButtons = $$("[data-summon-rot-mode]");
      const rotFieldGroups = {};
      $$("[data-summon-rot-fields]").forEach((group) => (rotFieldGroups[group.dataset.summonRotFields] = group));

      let rotMode = "none";
      rotModeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          rotMode = btn.dataset.summonRotMode;
          rotModeButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
          Object.entries(rotFieldGroups).forEach(([key, group]) => {
            group.hidden = key !== rotMode;
          });
          recompute();
        });
      });

      function recompute() {
        const entity = entityInput.value.trim() || "zombie";
        const parts = ["/summon", entity, posInputs.x.value || "~", posInputs.y.value || "~", posInputs.z.value || "~"];

        if (rotMode === "yawpitch") {
          parts.push(yawInput.value || "~", pitchInput.value || "~");
        } else if (rotMode === "facingpos") {
          parts.push("facing", faceInputs.x.value || "~", faceInputs.y.value || "~", faceInputs.z.value || "~");
        } else if (rotMode === "facingentity") {
          parts.push("facing", "entity", faceTargetInput.value.trim() || "@p", faceAnchorSelect.value);
        }

        const spawnEvent = eventInput.value.trim();
        const nameTag = nameTagInput.value.trim();
        if (spawnEvent) parts.push(cmdQuoteIfNeeded(spawnEvent));
        if (nameTag) parts.push(cmdQuoteIfNeeded(nameTag));

        output.textContent = parts.join(" ");
      }

      [
        entityInput,
        posInputs.x,
        posInputs.y,
        posInputs.z,
        yawInput,
        pitchInput,
        faceInputs.x,
        faceInputs.y,
        faceInputs.z,
        faceTargetInput,
        eventInput,
        nameTagInput,
      ].forEach((input) => input && input.addEventListener("input", recompute));
      faceAnchorSelect.addEventListener("change", recompute);

      recompute();
    })();

    // --- /execute ---
    (function initExecuteBuilder() {
      const stepsContainer = $("[data-exec-steps]");
      const addBtn = $("[data-exec-add]");
      const runInput = $("[data-exec-run]");
      const output = $('[data-cmd-output="execute"]');
      if (!stepsContainer || !output) return;

      const groupOrder = ["context", "position", "condition"];
      const stepRows = [];

      function recompute() {
        const tokens = stepRows.map((row) => EXEC_STEP_TYPES[row.select.value].build(row.getValues()));
        let cmd = "/execute";
        if (tokens.length) cmd += " " + tokens.join(" ");
        const runVal = runInput.value.trim();
        if (runVal) cmd += " run " + runVal;
        output.textContent = cmd;
      }

      function renderStepFields(container, stepDef, values) {
        container.innerHTML = "";
        stepDef.fields.forEach((f) => {
          if (f.type === "checkboxAxes") {
            values[f.key] = values[f.key] || f.default.slice();
            const wrap = el("div", { class: "field" }, [el("label", { text: t(f.label) })]);
            const group = el("div", { class: "cmd-quickpicks" });
            ["x", "y", "z"].forEach((axis) => {
              const label = el("label", { class: "cmd-checkbox-inline", style: "margin:0;" });
              const cb = el("input", { type: "checkbox" });
              cb.checked = values[f.key].includes(axis);
              cb.addEventListener("change", () => {
                const set = new Set(values[f.key]);
                if (cb.checked) set.add(axis);
                else set.delete(axis);
                values[f.key] = ["x", "y", "z"].filter((a) => set.has(a));
                recompute();
              });
              label.append(cb, el("span", { text: axis.toUpperCase() }));
              group.appendChild(label);
            });
            wrap.appendChild(group);
            container.appendChild(wrap);
          } else if (f.type === "select") {
            values[f.key] = values[f.key] || f.default;
            const wrap = el("div", { class: "field" }, [el("label", { text: t(f.label) })]);
            const select = el("select", {});
            f.options.forEach((opt) => {
              const o = el("option", { value: opt.value, text: t(opt.label) });
              if (opt.value === values[f.key]) o.selected = true;
              select.appendChild(o);
            });
            select.addEventListener("change", () => {
              values[f.key] = select.value;
              recompute();
            });
            wrap.appendChild(select);
            container.appendChild(wrap);
          } else {
            values[f.key] = values[f.key] || f.default || "";
            const wrap = el("div", { class: "field" }, [el("label", { text: f.label && f.label.includes(".") ? t(f.label) : f.label })]);
            const input = el("input", { type: "text", value: values[f.key] });
            input.addEventListener("input", () => {
              values[f.key] = input.value;
              recompute();
            });
            wrap.appendChild(input);
            container.appendChild(wrap);
          }
        });
      }

      function addStep(initialType) {
        const row = el("div", { class: "cmd-step" });
        const head = el("div", { class: "cmd-step-head" });
        const select = el("select", {});
        groupOrder.forEach((group) => {
          const optgroup = el("optgroup", { label: t("cmdbuilder.execute.group." + group) });
          Object.entries(EXEC_STEP_TYPES)
            .filter(([, def]) => def.group === group)
            .forEach(([key, def]) => optgroup.appendChild(el("option", { value: key, text: t(def.label) })));
          select.appendChild(optgroup);
        });
        select.value = initialType;
        const removeBtn = el("button", {
          type: "button",
          class: "btn btn-ghost btn-small cmd-step-remove",
          "aria-label": t("cmdbuilder.execute.removeStep"),
          text: "×",
        });
        head.append(select, removeBtn);
        const fieldsWrap = el("div", { class: "cmd-step-fields" });
        row.append(head, fieldsWrap);

        let values = {};
        const rowEntry = { row, select, getValues: () => values };

        select.addEventListener("change", () => {
          values = {};
          renderStepFields(fieldsWrap, EXEC_STEP_TYPES[select.value], values);
          recompute();
        });
        removeBtn.addEventListener("click", () => {
          row.remove();
          const idx = stepRows.indexOf(rowEntry);
          if (idx !== -1) stepRows.splice(idx, 1);
          recompute();
        });

        stepsContainer.appendChild(row);
        stepRows.push(rowEntry);
        renderStepFields(fieldsWrap, EXEC_STEP_TYPES[initialType], values);
      }

      addBtn.addEventListener("click", () => {
        addStep("as");
        recompute();
      });
      runInput.addEventListener("input", recompute);

      addStep("as");
      recompute();
    })();
  }

  // sw.js caches pages + the Project/Dictionary/Library data for offline
  // reading, but gives no visual cue that's what's happening — a visitor
  // with no signal just sees content with no explanation of why nothing
  // updates. This banner makes that state visible, and clears itself (with
  // a brief confirmation toast) once the connection comes back.
  function initOfflineBanner() {
    let banner = null;
    let wasOffline = !navigator.onLine;

    function ensureBanner() {
      if (banner && banner.isConnected) return banner;
      banner = el("div", { class: "offline-banner", role: "status", "aria-live": "polite" }, [
        el("span", { html: icon("offline") }),
        el("span", { text: t("offline.banner") }),
      ]);
      document.body.prepend(banner);
      return banner;
    }

    function show() {
      ensureBanner().classList.add("is-visible");
    }

    function hide() {
      if (banner) banner.classList.remove("is-visible");
    }

    if (wasOffline) show();

    window.addEventListener("offline", () => {
      wasOffline = true;
      show();
    });
    window.addEventListener("online", () => {
      hide();
      if (wasOffline) showToast(t("offline.backOnline"));
      wasOffline = false;
    });
  }

  const VAPID_PUBLIC_KEY = "BLgsV3h4QeDmlsulruH0VsGcfGeje7XBq1cdWxzYo9gSgWejPcjz4fxKUF--fq_DhKTNnP1gG_x04GJ9z842WSQ";

  function urlBase64ToUint8Array(base64) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(b64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
  }

  function initWebPush() {
    const toggle = $("[data-push-toggle]");
    if (!toggle) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !SB.url) {
      toggle.hidden = true;
      return;
    }

    async function callPush(payload) {
      const response = await fetch(SB.url + "/functions/v1/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SB.anonJwt, Authorization: "Bearer " + SB.anonJwt },
        body: JSON.stringify(payload),
      });
      return response.json().catch(() => ({}));
    }

    let subscribedState = false;
    function render(subscribed) {
      subscribedState = subscribed;
      toggle.hidden = false;
      toggle.classList.toggle("is-active", subscribed);
      toggle.innerHTML = "";
      toggle.append(el("span", { class: "btn-icon", html: icon("bell") }), el("span", { text: t(subscribed ? "push.disable" : "push.enable") }));
    }
    renderers.push(() => {
      if (!toggle.hidden) render(subscribedState);
    });

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => render(Boolean(sub)))
      .catch(() => {
        toggle.hidden = true;
      });

    toggle.addEventListener("click", async () => {
      if (Notification.permission === "denied") {
        showToast(t("push.denied"), true);
        return;
      }
      toggle.disabled = true;
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          await callPush({ action: "unsubscribe", endpoint: existing.endpoint });
          render(false);
          showToast(t("push.disabled"));
        } else {
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          const data = await callPush({ action: "subscribe", subscription: sub.toJSON(), lang });
          if (!data.ok) throw new Error(data.error || "failed");
          render(true);
          showToast(t("push.enabled"));
        }
      } catch (error) {
        render(false);
        showToast(Notification.permission === "denied" ? t("push.denied") : t("push.error"), true);
      } finally {
        toggle.disabled = false;
      }
    });
  }

  function init() {
    hideOrLink($$("[data-donate]"), donate.url);
    hideOrLink($$("[data-discord-server]"), discord.server);

    initNav();
    initSwitchers();
    initStage();
    initTabs();
    initSelects();
    initForm();
    initBugReportForm();
    initProjects();
    initProjectPage();
    initDictionary();
    initDictTermPage();
    initQuotes();
    initQuotePage();
    initLibrary();
    initLibraryEntryPage();
    initEvents();
    initTournamentPage();
    initHomeCountdowns();
    initNotWordle();
    initNavExtrasBadge();
    initHeroRealmCopy();
    initIslandIcons();
    initRecentFeed();
    initGlobalSearch();
    initServiceWorker();
    initWebPush();
    initOfflineBanner();
    initScrollRestore();
    initSkinPreview();
    initCoordsCalc();
    initRedstoneTimer();
    initAnvilPlanner();
    initLootOdds();
    initMotdFormatter();
    initCommandBuilder();

    renderers.push(renderLinks, renderMakes, renderAbout);
    applyStatic();
    renderers.forEach((render) => render());
  }

  const stored = readStorage("lang");
  const initial = I.languages.some((language) => language.code === stored) ? stored : "en";
  loadPack(initial).then(() => {
    lang = packs[initial] || initial === "en" ? initial : "en";
    init();
  });
})();
