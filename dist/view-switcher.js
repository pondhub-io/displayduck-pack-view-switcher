const _ = /* @__PURE__ */ new Map(), N = (t) => String(t ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), x = (t) => {
  const e = _.get(t);
  if (e)
    return e;
  const n = t.replace(/\bthis\b/g, "__item"), s = new Function("scope", `with (scope) { return (${n}); }`);
  return _.set(t, s), s;
}, w = (t, e) => {
  try {
    return x(t)(e);
  } catch {
    return "";
  }
}, m = (t, e = 0, n) => {
  const s = [];
  let i = e;
  for (; i < t.length; ) {
    const r = t.indexOf("{{", i);
    if (r === -1)
      return s.push({ type: "text", value: t.slice(i) }), { nodes: s, index: t.length };
    r > i && s.push({ type: "text", value: t.slice(i, r) });
    const o = t.indexOf("}}", r + 2);
    if (o === -1)
      return s.push({ type: "text", value: t.slice(r) }), { nodes: s, index: t.length };
    const a = t.slice(r + 2, o).trim();
    if (i = o + 2, a === "/if" || a === "/each") {
      if (n === a)
        return { nodes: s, index: i };
      s.push({ type: "text", value: `{{${a}}}` });
      continue;
    }
    if (a.startsWith("#if ")) {
      const c = m(t, i, "/if");
      s.push({
        type: "if",
        condition: a.slice(4).trim(),
        children: c.nodes
      }), i = c.index;
      continue;
    }
    if (a.startsWith("#each ")) {
      const c = m(t, i, "/each");
      s.push({
        type: "each",
        source: a.slice(6).trim(),
        children: c.nodes
      }), i = c.index;
      continue;
    }
    s.push({ type: "expr", value: a });
  }
  return { nodes: s, index: i };
}, y = (t, e) => {
  let n = "";
  for (const s of t) {
    if (s.type === "text") {
      n += s.value;
      continue;
    }
    if (s.type === "expr") {
      n += N(w(s.value, e));
      continue;
    }
    if (s.type === "if") {
      w(s.condition, e) && (n += y(s.children, e));
      continue;
    }
    const i = w(s.source, e);
    if (Array.isArray(i))
      for (const r of i) {
        const o = Object.create(e);
        o.__item = r, n += y(s.children, o);
      }
  }
  return n;
}, F = (t) => {
  const e = m(t).nodes;
  return (n) => y(e, n);
};
function P(t, e = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(t, e);
}
async function u(t, e = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(t, e, n);
}
function U(t, e = "asset") {
  return window.__TAURI_INTERNALS__.convertFileSrc(t, e);
}
var S;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(S || (S = {}));
async function V(t, e) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(t, e), await u("plugin:event|unlisten", {
    event: t,
    eventId: e
  });
}
async function h(t, e, n) {
  var s;
  const i = (s = void 0) !== null && s !== void 0 ? s : { kind: "Any" };
  return u("plugin:event|listen", {
    event: t,
    target: i,
    handler: P(e)
  }).then((r) => async () => V(t, r));
}
const $ = "pack-tcp-socket-open", M = "pack-tcp-socket-data", q = "pack-tcp-socket-close", G = 5e3, H = (t) => {
  let e = "";
  for (let n = 0; n < t.length; n += 1)
    e += String.fromCharCode(t[n]);
  return btoa(e);
}, j = (t) => {
  const e = atob(t), n = new Uint8Array(e.length);
  for (let s = 0; s < e.length; s += 1)
    n[s] = e.charCodeAt(s);
  return n;
}, z = (t) => t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : Uint8Array.from(t), J = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `tcp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
class Q {
  constructor(e, n) {
    this.hasLocalhostAccess = n, this.isConnected = !1, this.connecting = null, this.tauriListenersReady = null, this.tauriUnlisteners = [], this.listeners = {
      open: /* @__PURE__ */ new Set(),
      data: /* @__PURE__ */ new Set(),
      close: /* @__PURE__ */ new Set(),
      error: /* @__PURE__ */ new Set()
    }, this.host = String(e.host ?? "").trim(), this.port = Number(e.port), this.sessionId = J();
  }
  get connected() {
    return this.isConnected;
  }
  async connect() {
    if (!this.hasLocalhostAccess)
      throw new Error("TCP socket access requires the Allow localhost access permission.");
    if (!this.isConnected) {
      if (this.connecting)
        return this.connecting;
      if (!this.host || !Number.isInteger(this.port) || this.port < 1 || this.port > 65535)
        throw new Error("A valid TCP socket host and port are required.");
      this.connecting = this.connectInternal();
      try {
        await this.connecting;
      } finally {
        this.connecting = null;
      }
    }
  }
  async send(e) {
    if (!this.isConnected)
      throw new Error("TCP socket is not connected.");
    await u("pack_tcp_socket_write", {
      sessionId: this.sessionId,
      dataBase64: H(z(e)),
      allowLocalhostAccess: this.hasLocalhostAccess
    });
  }
  async write(e) {
    await this.send(e);
  }
  async close() {
    try {
      await u("pack_tcp_socket_disconnect", { sessionId: this.sessionId });
    } finally {
      this.isConnected = !1, this.teardownTauriListeners();
    }
  }
  on(e, n) {
    return this.listeners[e].add(n), () => this.listeners[e].delete(n);
  }
  async connectInternal() {
    await this.ensureTauriListeners(), await new Promise(async (e, n) => {
      let s = !1;
      const i = setTimeout(() => {
        s || (s = !0, a(), n(new Error(`TCP socket connection timed out for ${this.host}:${this.port}`)));
      }, G), r = this.on("open", () => {
        s || (s = !0, a(), e());
      }), o = this.on("close", (c) => {
        s || (s = !0, a(), n(new Error(c.error ?? "TCP socket closed before opening.")));
      }), a = () => {
        clearTimeout(i), r(), o();
      };
      try {
        await u("pack_tcp_socket_connect", {
          sessionId: this.sessionId,
          host: this.host,
          port: this.port,
          allowLocalhostAccess: this.hasLocalhostAccess
        });
      } catch (c) {
        if (s) return;
        s = !0, a(), n(c);
      }
    });
  }
  async ensureTauriListeners() {
    return this.tauriListenersReady ? this.tauriListenersReady : (this.tauriListenersReady = (async () => {
      this.tauriUnlisteners = [
        await h($, (e) => {
          e.payload.sessionId === this.sessionId && (this.isConnected = !0, this.emit("open", {
            host: this.host,
            port: this.port
          }));
        }),
        await h(M, (e) => {
          if (e.payload.sessionId === this.sessionId)
            try {
              this.emit("data", j(e.payload.dataBase64));
            } catch (n) {
              this.emit("error", {
                host: this.host,
                port: this.port,
                error: n instanceof Error ? n.message : "Invalid TCP socket data."
              });
            }
        }),
        await h(q, (e) => {
          e.payload.sessionId === this.sessionId && (this.isConnected = !1, e.payload.error && this.emit("error", {
            host: this.host,
            port: this.port,
            error: e.payload.error
          }), this.emit("close", {
            host: this.host,
            port: this.port,
            error: e.payload.error
          }));
        })
      ];
    })(), this.tauriListenersReady);
  }
  teardownTauriListeners() {
    for (const e of this.tauriUnlisteners)
      try {
        e();
      } catch {
      }
    this.tauriUnlisteners = [], this.tauriListenersReady = null;
  }
  emit(e, n) {
    for (const s of this.listeners[e])
      s(n);
  }
}
const Y = (t) => {
  if (typeof t != "function")
    return !1;
  const e = t;
  return e._isSignal === !0 && typeof e.set == "function" && typeof e.subscribe == "function";
}, b = (t) => {
  let e = t;
  const n = /* @__PURE__ */ new Set(), s = (() => e);
  return s._isSignal = !0, s.set = (i) => {
    if (!Object.is(e, i)) {
      e = i;
      for (const r of n)
        r(e);
    }
  }, s.update = (i) => {
    s.set(i(e));
  }, s.subscribe = (i) => (n.add(i), () => n.delete(i)), s;
}, Z = (t, e = "") => u("controller_widget_focus_view", {
  configuredWidgetId: t,
  requestId: e
}), K = async (t, e) => {
  const n = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let s = null, i = null;
  const r = new Promise((o) => {
    i = o;
  });
  try {
    return s = await h(
      "displayduck-widget-focus-state-response",
      (o) => {
        o.payload.requestId !== n || o.payload.configuredWidgetId !== t || i?.(o.payload.focused === !0);
      }
    ), await u("controller_widget_get_focus_state", {
      configuredWidgetId: t,
      focusRequestId: e,
      requestId: n
    }), await Promise.race([
      r,
      new Promise((o) => setTimeout(() => o(!1), 1e3))
    ]);
  } finally {
    s?.();
  }
}, X = (t, e, n) => u("controller_widget_set_focus_requirement", {
  configuredWidgetId: t,
  required: e,
  requestId: n
}), B = (t, e) => {
  const n = [];
  for (const s of Object.keys(t)) {
    const i = t[s];
    Y(i) && n.push(i.subscribe(() => e()));
  }
  return () => {
    for (const s of n)
      s();
  };
}, tt = (t, e) => new Proxy(
  { payload: e },
  {
    get(n, s) {
      if (typeof s != "string")
        return;
      if (s in n)
        return n[s];
      const i = t[s];
      return typeof i == "function" ? i.bind(t) : i;
    },
    has(n, s) {
      return typeof s != "string" ? !1 : s in n || s in t;
    }
  }
), et = ["src", "href", "poster"], st = "{{pack-install-path}}/", E = "{{ASSETS}}", nt = (t) => {
  const e = t.trim();
  return e.length === 0 || e.startsWith("data:") || e.startsWith("blob:") || e.startsWith("http://") || e.startsWith("https://") || e.startsWith("file:") || e.startsWith("asset:") || e.startsWith("mailto:") || e.startsWith("tel:") || e.startsWith("javascript:") || e.startsWith("//") || e.startsWith("/") || e.startsWith("#");
}, it = (t) => {
  const e = t.trim();
  if (!e)
    return null;
  if (!nt(e))
    return e.replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (e.startsWith("http://") || e.startsWith("https://"))
    try {
      const n = new URL(e);
      if (n.origin === window.location.origin)
        return `${n.pathname}${n.search}${n.hash}`.replace(/^\/+/, "");
    } catch {
      return null;
    }
  return null;
}, rt = (t, e) => {
  const n = t.replaceAll("\\", "/").replace(/\/+$/, ""), s = `${n}/${e.trim()}`, i = s.split("/"), r = [];
  for (const o of i) {
    if (!o || o === ".") {
      r.length === 0 && s.startsWith("/") && r.push("");
      continue;
    }
    if (o === "..") {
      (r.length > 1 || r.length === 1 && r[0] !== "") && r.pop();
      continue;
    }
    r.push(o);
  }
  return r.join("/") || n;
}, p = (t, e) => {
  const n = it(e);
  if (!t || !n)
    return e;
  try {
    return U(rt(t, n));
  } catch {
    return e;
  }
}, ot = (t) => {
  const e = t.trim().replaceAll("\\", "/").replace(/\/+$/, "");
  if (!e)
    return "";
  try {
    return U(e);
  } catch {
    return e;
  }
}, ct = (t, e) => t.split(",").map((n) => {
  const s = n.trim();
  if (!s)
    return s;
  const [i, r] = s.split(/\s+/, 2), o = p(e, i);
  return r ? `${o} ${r}` : o;
}).join(", "), at = (t, e) => t.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (n, s, i) => {
  const r = p(e, i);
  return r === i ? n : `url("${r}")`;
}), A = (t, e) => {
  for (const i of et) {
    const r = t.getAttribute(i);
    if (!r)
      continue;
    const o = p(e, r);
    o !== r && t.setAttribute(i, o);
  }
  const n = t.getAttribute("srcset");
  if (n) {
    const i = ct(n, e);
    i !== n && t.setAttribute("srcset", i);
  }
  const s = t.getAttribute("style");
  if (s) {
    const i = at(s, e);
    i !== s && t.setAttribute("style", i);
  }
}, R = (t, e) => {
  if (e) {
    t instanceof Element && A(t, e);
    for (const n of Array.from(t.querySelectorAll("*")))
      A(n, e);
  }
}, I = (t, e) => {
  if (!e)
    return t;
  let n = t;
  const s = ot(e);
  return s && n.includes(E) && (n = n.replaceAll(E, s)), n.includes(st) ? n.replace(/\{\{pack-install-path\}\}\/([^"')\s]+)/g, (i, r) => p(e, r)) : n;
}, lt = (t) => {
  const e = /@font-face\s*\{[^{}]*\}/gi, n = t.match(e)?.join(`
`) ?? "";
  return {
    scopedStyles: n ? t.replace(e, "") : t,
    fontStyles: n
  };
}, ut = (t, e) => class {
  constructor({
    mount: s,
    payload: i,
    setLoading: r
  }) {
    this.cleanups = [], this.hasRendered = !1, this.renderScheduled = !1, this.destroyed = !1, this.globalFontStyle = null, this.focusRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, this.widgetDirectory = "", this.mount = s, this.payload = i ?? {}, this.setLoading = typeof r == "function" ? r : (() => {
    }), this.assetObserver = new MutationObserver((o) => {
      if (this.widgetDirectory)
        for (const a of o) {
          if (a.type === "attributes" && a.target instanceof Element) {
            A(a.target, this.widgetDirectory);
            continue;
          }
          for (const c of Array.from(a.addedNodes))
            c instanceof Element && R(c, this.widgetDirectory);
        }
    }), this.logic = new t({
      mount: s,
      payload: this.payload,
      setLoading: (o) => this.setLoading(!!o),
      focusWidgetView: () => Z(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        this.focusRequestId
      ),
      isWidgetViewFocused: () => K(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        this.focusRequestId
      ),
      setRequireFocus: (o) => X(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        !!o,
        this.focusRequestId
      ),
      createTcpSocket: (o) => new Q(
        o,
        this.hasLocalhostAccessPermission()
      ),
      on: (o, a, c) => this.on(o, a, c)
    }), this.cleanupSignalSubscriptions = B(this.logic, () => this.scheduleRender()), this.assetObserver.observe(this.mount, {
      subtree: !0,
      childList: !0,
      attributes: !0,
      attributeFilter: ["src", "href", "poster", "srcset", "style"]
    });
  }
  onInit() {
    this.render(), this.logic.onInit?.();
  }
  onUpdate(s) {
    this.payload = s ?? {}, this.logic.onUpdate?.(this.payload), this.render();
  }
  onDestroy() {
    for (this.destroyed = !0, this.renderScheduled = !1, this.globalFontStyle?.remove(), this.globalFontStyle = null, this.cleanupSignalSubscriptions(); this.cleanups.length > 0; )
      this.cleanups.pop()?.();
    this.assetObserver.disconnect(), this.logic.onDestroy?.(), this.mount.innerHTML = "", this.hasRendered = !1;
  }
  hasLocalhostAccessPermission() {
    const s = this.payload?.config;
    return !!(s && typeof s == "object" && s.allowEventAccess === !0);
  }
  render() {
    this.renderScheduled = !1;
    const s = tt(this.logic, this.payload);
    this.widgetDirectory = String(
      this.payload?.widgetDirectory ?? this.payload?.directory ?? ""
    ).trim();
    const i = I(e.template, this.widgetDirectory), r = I(e.styles, this.widgetDirectory), { scopedStyles: o, fontStyles: a } = lt(r);
    this.syncGlobalFontStyle(a);
    const d = F(i)(s), l = `<style>${o}</style>${d}`;
    this.hasRendered ? this.reconcileMarkup(l) : (this.mount.innerHTML = l, this.hasRendered = !0), this.mount.setAttribute("data-displayduck-render-empty", d.trim().length === 0 ? "true" : "false"), R(this.mount, this.widgetDirectory), this.logic.afterRender?.();
  }
  syncGlobalFontStyle(s) {
    if (!s) {
      this.globalFontStyle?.remove(), this.globalFontStyle = null;
      return;
    }
    this.globalFontStyle || (this.globalFontStyle = this.mount.ownerDocument.createElement("style"), this.globalFontStyle.dataset.displayduckPackFonts = "true", this.mount.ownerDocument.head.appendChild(this.globalFontStyle)), this.globalFontStyle.textContent !== s && (this.globalFontStyle.textContent = s);
  }
  scheduleRender() {
    this.renderScheduled || this.destroyed || (this.renderScheduled = !0, queueMicrotask(() => {
      !this.destroyed && this.renderScheduled && this.render();
    }));
  }
  reconcileMarkup(s) {
    const i = document.createElement("div");
    i.innerHTML = s, this.reconcileChildren(this.mount, i);
  }
  reconcileChildren(s, i) {
    const r = Array.from(s.childNodes), o = Array.from(i.childNodes), a = Math.min(r.length, o.length);
    for (let c = 0; c < a; c += 1)
      this.reconcileNode(r[c], o[c]);
    for (let c = a; c < o.length; c += 1)
      s.appendChild(o[c].cloneNode(!0));
    for (let c = r.length - 1; c >= o.length; c -= 1)
      r[c].remove();
  }
  reconcileNode(s, i) {
    if (s.nodeType !== i.nodeType) {
      s.replaceWith(i.cloneNode(!0));
      return;
    }
    if (s.nodeType === Node.TEXT_NODE) {
      s.nodeValue !== i.nodeValue && (s.nodeValue = i.nodeValue);
      return;
    }
    if (!(!(s instanceof Element) || !(i instanceof Element))) {
      if (s.tagName !== i.tagName) {
        s.replaceWith(i.cloneNode(!0));
        return;
      }
      for (const r of Array.from(s.attributes))
        i.hasAttribute(r.name) || s.removeAttribute(r.name);
      for (const r of Array.from(i.attributes))
        s.getAttribute(r.name) !== r.value && s.setAttribute(r.name, r.value);
      this.reconcileChildren(s, i);
    }
  }
  on(s, i, r) {
    const o = (c) => {
      const l = c.target?.closest(i);
      !l || !this.mount.contains(l) || r(c, l);
    };
    this.mount.addEventListener(s, o);
    const a = () => this.mount.removeEventListener(s, o);
    return this.cleanups.push(a), a;
  }
};
async function g(t, e = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(t, e, n);
}
var W;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WINDOW_SUSPENDED = "tauri://suspended", t.WINDOW_RESUMED = "tauri://resumed", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(W || (W = {}));
async function C(t, e) {
  await g("plugin:event|emit", {
    event: t,
    payload: e
  });
}
async function L(t, e, n) {
  await g("plugin:event|emit_to", {
    target: { kind: "AnyLabel", label: t },
    event: e,
    payload: n
  });
}
var f;
(function(t) {
  t[t.Audio = 1] = "Audio", t[t.Cache = 2] = "Cache", t[t.Config = 3] = "Config", t[t.Data = 4] = "Data", t[t.LocalData = 5] = "LocalData", t[t.Document = 6] = "Document", t[t.Download = 7] = "Download", t[t.Picture = 8] = "Picture", t[t.Public = 9] = "Public", t[t.Video = 10] = "Video", t[t.Resource = 11] = "Resource", t[t.Temp = 12] = "Temp", t[t.AppConfig = 13] = "AppConfig", t[t.AppData = 14] = "AppData", t[t.AppLocalData = 15] = "AppLocalData", t[t.AppCache = 16] = "AppCache", t[t.AppLog = 17] = "AppLog", t[t.Desktop = 18] = "Desktop", t[t.Executable = 19] = "Executable", t[t.Font = 20] = "Font", t[t.Home = 21] = "Home", t[t.Runtime = 22] = "Runtime", t[t.Template = 23] = "Template";
})(f || (f = {}));
var T;
(function(t) {
  t[t.Start = 0] = "Start", t[t.Current = 1] = "Current", t[t.End = 2] = "End";
})(T || (T = {}));
async function dt(t, e) {
  if (t instanceof URL && t.protocol !== "file:")
    throw new TypeError("Must be a file URL.");
  const n = await g("plugin:fs|read_text_file", {
    path: t instanceof URL ? t.toString() : t,
    options: e
  }), s = n instanceof ArrayBuffer ? n : Uint8Array.from(n);
  return new TextDecoder(e?.encoding ?? "utf-8").decode(s);
}
async function ht(t, e, n) {
  if (t instanceof URL && t.protocol !== "file:")
    throw new TypeError("Must be a file URL.");
  const s = new TextEncoder();
  await g("plugin:fs|write_text_file", s.encode(e), {
    headers: {
      path: encodeURIComponent(t instanceof URL ? t.toString() : t),
      options: JSON.stringify(n)
    }
  });
}
const O = (t) => {
  const e = t.config;
  return e && typeof e == "object" ? e : {};
};
let ft = class {
  constructor(e) {
    this.ctx = e, this.destroyed = !1, this.config = b(O(e.payload ?? {})), this.view = b(this.getConfiguredView(this.config()));
  }
  onInit() {
    this.ctx.on("click", "[data-view-switcher]", () => {
      this.setView(this.view());
    });
  }
  onUpdate(e) {
    this.config.set(O(e ?? {})), this.view.set(this.getConfiguredView(this.config()));
  }
  onDestroy() {
    this.destroyed = !0;
  }
  getConfiguredView(e) {
    const n = Number(e.view ?? 1);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }
  async setView(e) {
    if (!this.destroyed)
      try {
        const n = await dt("config.dd", { baseDir: f.AppConfig }), s = JSON.parse(n), i = Array.isArray(s.views) ? s.views : [], r = e - 1;
        if (!i[r]) return;
        const o = i.map((D, v) => ({ ...D, active: v === r })), a = { ...s, views: o };
        await ht("config.dd", JSON.stringify(a, null, 2), { baseDir: f.AppConfig });
        const c = o[r], d = { config: a }, l = {
          viewId: c.id ?? "",
          view: { ...c, widgets: Array.isArray(c.widgets) ? c.widgets : [] }
        };
        await C("displayduck-update", d), await L("display", "displayduck-update", d), await C("displayduck-active-view-updated", l), await L("display", "displayduck-active-view-updated", l);
      } catch (n) {
        console.error("[DisplayDuck View Switcher] failed to switch view", n);
      }
  }
};
const pt = `<div class="view" data-view-switcher>
  <div class="label">{{ view() }}</div>
</div>
`, gt = ".view{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;background:#0000002e;cursor:pointer;-webkit-user-select:none;user-select:none}.label{padding:.2em .45em;font-size:clamp(1.5rem,30cqw,4rem);font-weight:700}", k = ut(ft, { template: pt, styles: gt }), wt = k, At = { DisplayDuckWidget: k, Widget: wt };
export {
  k as DisplayDuckWidget,
  wt as Widget,
  At as default
};
