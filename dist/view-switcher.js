const A = /* @__PURE__ */ new Map(), x = (t) => String(t ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), O = (t) => {
  const e = A.get(t);
  if (e)
    return e;
  const s = t.replace(/\bthis\b/g, "__item"), n = new Function("scope", `with (scope) { return (${s}); }`);
  return A.set(t, n), n;
}, g = (t, e) => {
  try {
    return O(t)(e);
  } catch {
    return "";
  }
}, w = (t, e = 0, s) => {
  const n = [];
  let i = e;
  for (; i < t.length; ) {
    const r = t.indexOf("{{", i);
    if (r === -1)
      return n.push({ type: "text", value: t.slice(i) }), { nodes: n, index: t.length };
    r > i && n.push({ type: "text", value: t.slice(i, r) });
    const o = t.indexOf("}}", r + 2);
    if (o === -1)
      return n.push({ type: "text", value: t.slice(r) }), { nodes: n, index: t.length };
    const a = t.slice(r + 2, o).trim();
    if (i = o + 2, a === "/if" || a === "/each") {
      if (s === a)
        return { nodes: n, index: i };
      n.push({ type: "text", value: `{{${a}}}` });
      continue;
    }
    if (a.startsWith("#if ")) {
      const c = w(t, i, "/if");
      n.push({
        type: "if",
        condition: a.slice(4).trim(),
        children: c.nodes
      }), i = c.index;
      continue;
    }
    if (a.startsWith("#each ")) {
      const c = w(t, i, "/each");
      n.push({
        type: "each",
        source: a.slice(6).trim(),
        children: c.nodes
      }), i = c.index;
      continue;
    }
    n.push({ type: "expr", value: a });
  }
  return { nodes: n, index: i };
}, m = (t, e) => {
  let s = "";
  for (const n of t) {
    if (n.type === "text") {
      s += n.value;
      continue;
    }
    if (n.type === "expr") {
      s += x(g(n.value, e));
      continue;
    }
    if (n.type === "if") {
      g(n.condition, e) && (s += m(n.children, e));
      continue;
    }
    const i = g(n.source, e);
    if (Array.isArray(i))
      for (const r of i) {
        const o = Object.create(e);
        o.__item = r, s += m(n.children, o);
      }
  }
  return s;
}, P = (t) => {
  const e = w(t).nodes;
  return (s) => m(e, s);
};
function F(t, e = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(t, e);
}
async function l(t, e = {}, s) {
  return window.__TAURI_INTERNALS__.invoke(t, e, s);
}
function W(t, e = "asset") {
  return window.__TAURI_INTERNALS__.convertFileSrc(t, e);
}
var b;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WINDOW_SUSPENDED = "tauri://suspended", t.WINDOW_RESUMED = "tauri://resumed", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(b || (b = {}));
async function N(t, e) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(t, e), await l("plugin:event|unlisten", {
    event: t,
    eventId: e
  });
}
async function h(t, e, s) {
  var n;
  const i = (n = void 0) !== null && n !== void 0 ? n : { kind: "Any" };
  return l("plugin:event|listen", {
    event: t,
    target: i,
    handler: F(e)
  }).then((r) => async () => N(t, r));
}
async function S(t, e) {
  await l("plugin:event|emit", {
    event: t,
    payload: e
  });
}
async function _(t, e, s) {
  await l("plugin:event|emit_to", {
    target: { kind: "AnyLabel", label: t },
    event: e,
    payload: s
  });
}
const V = "pack-tcp-socket-open", D = "pack-tcp-socket-data", $ = "pack-tcp-socket-close", M = 5e3, q = (t) => {
  let e = "";
  for (let s = 0; s < t.length; s += 1)
    e += String.fromCharCode(t[s]);
  return btoa(e);
}, H = (t) => {
  const e = atob(t), s = new Uint8Array(e.length);
  for (let n = 0; n < e.length; n += 1)
    s[n] = e.charCodeAt(n);
  return s;
}, G = (t) => t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : Uint8Array.from(t), j = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `tcp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
class z {
  constructor(e, s) {
    this.hasEventAccess = s, this.isConnected = !1, this.connecting = null, this.tauriListenersReady = null, this.tauriUnlisteners = [], this.listeners = {
      open: /* @__PURE__ */ new Set(),
      data: /* @__PURE__ */ new Set(),
      close: /* @__PURE__ */ new Set(),
      error: /* @__PURE__ */ new Set()
    }, this.host = String(e.host ?? "").trim(), this.port = Number(e.port), this.sessionId = j();
  }
  get connected() {
    return this.isConnected;
  }
  async connect() {
    if (!this.hasEventAccess)
      throw new Error("TCP socket access requires the Allow event access permission.");
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
    await l("pack_tcp_socket_write", {
      sessionId: this.sessionId,
      dataBase64: q(G(e))
    });
  }
  async write(e) {
    await this.send(e);
  }
  async close() {
    try {
      await l("pack_tcp_socket_disconnect", { sessionId: this.sessionId });
    } finally {
      this.isConnected = !1, this.teardownTauriListeners();
    }
  }
  on(e, s) {
    return this.listeners[e].add(s), () => this.listeners[e].delete(s);
  }
  async connectInternal() {
    await this.ensureTauriListeners(), await new Promise(async (e, s) => {
      let n = !1;
      const i = setTimeout(() => {
        n || (n = !0, a(), s(new Error(`TCP socket connection timed out for ${this.host}:${this.port}`)));
      }, M), r = this.on("open", () => {
        n || (n = !0, a(), e());
      }), o = this.on("close", (c) => {
        n || (n = !0, a(), s(new Error(c.error ?? "TCP socket closed before opening.")));
      }), a = () => {
        clearTimeout(i), r(), o();
      };
      try {
        await l("pack_tcp_socket_connect", {
          sessionId: this.sessionId,
          host: this.host,
          port: this.port,
          allowEventAccess: this.hasEventAccess
        });
      } catch (c) {
        if (n) return;
        n = !0, a(), s(c);
      }
    });
  }
  async ensureTauriListeners() {
    return this.tauriListenersReady ? this.tauriListenersReady : (this.tauriListenersReady = (async () => {
      this.tauriUnlisteners = [
        await h(V, (e) => {
          e.payload.sessionId === this.sessionId && (this.isConnected = !0, this.emit("open", {
            host: this.host,
            port: this.port
          }));
        }),
        await h(D, (e) => {
          if (e.payload.sessionId === this.sessionId)
            try {
              this.emit("data", H(e.payload.dataBase64));
            } catch (s) {
              this.emit("error", {
                host: this.host,
                port: this.port,
                error: s instanceof Error ? s.message : "Invalid TCP socket data."
              });
            }
        }),
        await h($, (e) => {
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
  emit(e, s) {
    for (const n of this.listeners[e])
      n(s);
  }
}
const J = (t) => {
  if (typeof t != "function")
    return !1;
  const e = t;
  return e._isSignal === !0 && typeof e.set == "function" && typeof e.subscribe == "function";
}, E = (t) => {
  let e = t;
  const s = /* @__PURE__ */ new Set(), n = (() => e);
  return n._isSignal = !0, n.set = (i) => {
    if (!Object.is(e, i)) {
      e = i;
      for (const r of s)
        r(e);
    }
  }, n.update = (i) => {
    n.set(i(e));
  }, n.subscribe = (i) => (s.add(i), () => s.delete(i)), n;
}, K = (t, e = "") => l("controller_widget_focus_view", {
  configuredWidgetId: t,
  requestId: e
}), Q = async (t, e) => {
  const s = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let n = null, i = null;
  const r = new Promise((o) => {
    i = o;
  });
  try {
    return n = await h(
      "displayduck-widget-focus-state-response",
      (o) => {
        o.payload.requestId !== s || o.payload.configuredWidgetId !== t || i?.(o.payload.focused === !0);
      }
    ), await l("controller_widget_get_focus_state", {
      configuredWidgetId: t,
      focusRequestId: e,
      requestId: s
    }), await Promise.race([
      r,
      new Promise((o) => setTimeout(() => o(!1), 1e3))
    ]);
  } finally {
    n?.();
  }
}, X = (t, e, s) => l("controller_widget_set_focus_requirement", {
  configuredWidgetId: t,
  required: e,
  requestId: s
}), Y = (t, e) => {
  const s = [];
  for (const n of Object.keys(t)) {
    const i = t[n];
    J(i) && s.push(i.subscribe(() => e()));
  }
  return () => {
    for (const n of s)
      n();
  };
}, Z = (t, e) => new Proxy(
  { payload: e },
  {
    get(s, n) {
      if (typeof n != "string")
        return;
      if (n in s)
        return s[n];
      const i = t[n];
      return typeof i == "function" ? i.bind(t) : i;
    },
    has(s, n) {
      return typeof n != "string" ? !1 : n in s || n in t;
    }
  }
), B = ["src", "href", "poster"], tt = "{{pack-install-path}}/", I = "{{ASSETS}}", et = (t) => {
  const e = t.trim();
  return e.length === 0 || e.startsWith("data:") || e.startsWith("blob:") || e.startsWith("http://") || e.startsWith("https://") || e.startsWith("file:") || e.startsWith("asset:") || e.startsWith("mailto:") || e.startsWith("tel:") || e.startsWith("javascript:") || e.startsWith("//") || e.startsWith("/") || e.startsWith("#");
}, nt = (t) => {
  const e = t.trim();
  if (!e)
    return null;
  if (!et(e))
    return e.replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (e.startsWith("http://") || e.startsWith("https://"))
    try {
      const s = new URL(e);
      if (s.origin === window.location.origin)
        return `${s.pathname}${s.search}${s.hash}`.replace(/^\/+/, "");
    } catch {
      return null;
    }
  return null;
}, st = (t, e) => {
  const s = t.replaceAll("\\", "/").replace(/\/+$/, ""), n = `${s}/${e.trim()}`, i = n.split("/"), r = [];
  for (const o of i) {
    if (!o || o === ".") {
      r.length === 0 && n.startsWith("/") && r.push("");
      continue;
    }
    if (o === "..") {
      (r.length > 1 || r.length === 1 && r[0] !== "") && r.pop();
      continue;
    }
    r.push(o);
  }
  return r.join("/") || s;
}, p = (t, e) => {
  const s = nt(e);
  if (!t || !s)
    return e;
  try {
    return W(st(t, s));
  } catch {
    return e;
  }
}, it = (t) => {
  const e = t.trim().replaceAll("\\", "/").replace(/\/+$/, "");
  if (!e)
    return "";
  try {
    return W(e);
  } catch {
    return e;
  }
}, rt = (t, e) => t.split(",").map((s) => {
  const n = s.trim();
  if (!n)
    return n;
  const [i, r] = n.split(/\s+/, 2), o = p(e, i);
  return r ? `${o} ${r}` : o;
}).join(", "), ot = (t, e) => t.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (s, n, i) => {
  const r = p(e, i);
  return r === i ? s : `url("${r}")`;
}), y = (t, e) => {
  for (const i of B) {
    const r = t.getAttribute(i);
    if (!r)
      continue;
    const o = p(e, r);
    o !== r && t.setAttribute(i, o);
  }
  const s = t.getAttribute("srcset");
  if (s) {
    const i = rt(s, e);
    i !== s && t.setAttribute("srcset", i);
  }
  const n = t.getAttribute("style");
  if (n) {
    const i = ot(n, e);
    i !== n && t.setAttribute("style", i);
  }
}, R = (t, e) => {
  if (e) {
    t instanceof Element && y(t, e);
    for (const s of Array.from(t.querySelectorAll("*")))
      y(s, e);
  }
}, C = (t, e) => {
  if (!e)
    return t;
  let s = t;
  const n = it(e);
  return n && s.includes(I) && (s = s.replaceAll(I, n)), s.includes(tt) ? s.replace(/\{\{pack-install-path\}\}\/([^"')\s]+)/g, (i, r) => p(e, r)) : s;
}, ct = (t) => {
  const e = /@font-face\s*\{[^{}]*\}/gi, s = t.match(e)?.join(`
`) ?? "";
  return {
    scopedStyles: s ? t.replace(e, "") : t,
    fontStyles: s
  };
}, at = (t, e) => class {
  constructor({
    mount: n,
    payload: i,
    setLoading: r
  }) {
    this.cleanups = [], this.hasRendered = !1, this.renderScheduled = !1, this.destroyed = !1, this.globalFontStyle = null, this.focusRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, this.widgetDirectory = "", this.mount = n, this.payload = i ?? {}, this.setLoading = typeof r == "function" ? r : (() => {
    }), this.assetObserver = new MutationObserver((o) => {
      if (this.widgetDirectory)
        for (const a of o) {
          if (a.type === "attributes" && a.target instanceof Element) {
            y(a.target, this.widgetDirectory);
            continue;
          }
          for (const c of Array.from(a.addedNodes))
            c instanceof Element && R(c, this.widgetDirectory);
        }
    }), this.logic = new t({
      mount: n,
      payload: this.payload,
      setLoading: (o) => this.setLoading(!!o),
      focusWidgetView: () => K(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        this.focusRequestId
      ),
      isWidgetViewFocused: () => Q(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        this.focusRequestId
      ),
      setRequireFocus: (o) => X(
        String(this.payload?.configuredWidgetId ?? "").trim(),
        !!o,
        this.focusRequestId
      ),
      createTcpSocket: (o) => new z(
        o,
        this.hasEventAccessPermission()
      ),
      on: (o, a, c) => this.on(o, a, c)
    }), this.cleanupSignalSubscriptions = Y(this.logic, () => this.scheduleRender()), this.assetObserver.observe(this.mount, {
      subtree: !0,
      childList: !0,
      attributes: !0,
      attributeFilter: ["src", "href", "poster", "srcset", "style"]
    });
  }
  onInit() {
    this.render(), this.logic.onInit?.();
  }
  onUpdate(n) {
    this.payload = n ?? {}, this.logic.onUpdate?.(this.payload), this.render();
  }
  onDestroy() {
    for (this.destroyed = !0, this.renderScheduled = !1, this.globalFontStyle?.remove(), this.globalFontStyle = null, this.cleanupSignalSubscriptions(); this.cleanups.length > 0; )
      this.cleanups.pop()?.();
    this.assetObserver.disconnect(), this.logic.onDestroy?.(), this.mount.innerHTML = "", this.hasRendered = !1;
  }
  hasEventAccessPermission() {
    const n = this.payload?.config;
    return !!(n && typeof n == "object" && n.allowEventAccess === !0);
  }
  render() {
    this.renderScheduled = !1;
    const n = Z(this.logic, this.payload);
    this.widgetDirectory = String(
      this.payload?.widgetDirectory ?? this.payload?.directory ?? ""
    ).trim();
    const i = C(e.template, this.widgetDirectory), r = C(e.styles, this.widgetDirectory), { scopedStyles: o, fontStyles: a } = ct(r);
    this.syncGlobalFontStyle(a);
    const d = P(i)(n), u = `<style>${o}</style>${d}`;
    this.hasRendered ? this.reconcileMarkup(u) : (this.mount.innerHTML = u, this.hasRendered = !0), this.mount.setAttribute("data-displayduck-render-empty", d.trim().length === 0 ? "true" : "false"), R(this.mount, this.widgetDirectory), this.logic.afterRender?.();
  }
  syncGlobalFontStyle(n) {
    if (!n) {
      this.globalFontStyle?.remove(), this.globalFontStyle = null;
      return;
    }
    this.globalFontStyle || (this.globalFontStyle = this.mount.ownerDocument.createElement("style"), this.globalFontStyle.dataset.displayduckPackFonts = "true", this.mount.ownerDocument.head.appendChild(this.globalFontStyle)), this.globalFontStyle.textContent !== n && (this.globalFontStyle.textContent = n);
  }
  scheduleRender() {
    this.renderScheduled || this.destroyed || (this.renderScheduled = !0, queueMicrotask(() => {
      !this.destroyed && this.renderScheduled && this.render();
    }));
  }
  reconcileMarkup(n) {
    const i = document.createElement("div");
    i.innerHTML = n, this.reconcileChildren(this.mount, i);
  }
  reconcileChildren(n, i) {
    const r = Array.from(n.childNodes), o = Array.from(i.childNodes), a = Math.min(r.length, o.length);
    for (let c = 0; c < a; c += 1)
      this.reconcileNode(r[c], o[c]);
    for (let c = a; c < o.length; c += 1)
      n.appendChild(o[c].cloneNode(!0));
    for (let c = r.length - 1; c >= o.length; c -= 1)
      r[c].remove();
  }
  reconcileNode(n, i) {
    if (n.nodeType !== i.nodeType) {
      n.replaceWith(i.cloneNode(!0));
      return;
    }
    if (n.nodeType === Node.TEXT_NODE) {
      n.nodeValue !== i.nodeValue && (n.nodeValue = i.nodeValue);
      return;
    }
    if (!(!(n instanceof Element) || !(i instanceof Element))) {
      if (n.tagName !== i.tagName) {
        n.replaceWith(i.cloneNode(!0));
        return;
      }
      for (const r of Array.from(n.attributes))
        i.hasAttribute(r.name) || n.removeAttribute(r.name);
      for (const r of Array.from(i.attributes))
        n.getAttribute(r.name) !== r.value && n.setAttribute(r.name, r.value);
      this.reconcileChildren(n, i);
    }
  }
  on(n, i, r) {
    const o = (c) => {
      const u = c.target?.closest(i);
      !u || !this.mount.contains(u) || r(c, u);
    };
    this.mount.addEventListener(n, o);
    const a = () => this.mount.removeEventListener(n, o);
    return this.cleanups.push(a), a;
  }
};
var f;
(function(t) {
  t[t.Audio = 1] = "Audio", t[t.Cache = 2] = "Cache", t[t.Config = 3] = "Config", t[t.Data = 4] = "Data", t[t.LocalData = 5] = "LocalData", t[t.Document = 6] = "Document", t[t.Download = 7] = "Download", t[t.Picture = 8] = "Picture", t[t.Public = 9] = "Public", t[t.Video = 10] = "Video", t[t.Resource = 11] = "Resource", t[t.Temp = 12] = "Temp", t[t.AppConfig = 13] = "AppConfig", t[t.AppData = 14] = "AppData", t[t.AppLocalData = 15] = "AppLocalData", t[t.AppCache = 16] = "AppCache", t[t.AppLog = 17] = "AppLog", t[t.Desktop = 18] = "Desktop", t[t.Executable = 19] = "Executable", t[t.Font = 20] = "Font", t[t.Home = 21] = "Home", t[t.Runtime = 22] = "Runtime", t[t.Template = 23] = "Template";
})(f || (f = {}));
var v;
(function(t) {
  t[t.Start = 0] = "Start", t[t.Current = 1] = "Current", t[t.End = 2] = "End";
})(v || (v = {}));
async function lt(t, e) {
  if (t instanceof URL && t.protocol !== "file:")
    throw new TypeError("Must be a file URL.");
  const s = await l("plugin:fs|read_text_file", {
    path: t instanceof URL ? t.toString() : t,
    options: e
  }), n = s instanceof ArrayBuffer ? s : Uint8Array.from(s);
  return new TextDecoder(e?.encoding ?? "utf-8").decode(n);
}
async function ut(t, e, s) {
  if (t instanceof URL && t.protocol !== "file:")
    throw new TypeError("Must be a file URL.");
  const n = new TextEncoder();
  await l("plugin:fs|write_text_file", n.encode(e), {
    headers: {
      path: encodeURIComponent(t instanceof URL ? t.toString() : t),
      options: JSON.stringify(s)
    }
  });
}
const T = (t) => {
  const e = t.config;
  return e && typeof e == "object" ? e : {};
};
let dt = class {
  constructor(e) {
    this.ctx = e, this.destroyed = !1, this.config = E(T(e.payload ?? {})), this.view = E(this.getConfiguredView(this.config()));
  }
  onInit() {
    this.ctx.on("click", "[data-view-switcher]", () => {
      this.setView(this.view());
    });
  }
  onUpdate(e) {
    this.config.set(T(e ?? {})), this.view.set(this.getConfiguredView(this.config()));
  }
  onDestroy() {
    this.destroyed = !0;
  }
  getConfiguredView(e) {
    const s = Number(e.view ?? 1);
    return Number.isFinite(s) && s >= 1 ? Math.floor(s) : 1;
  }
  async setView(e) {
    if (!this.destroyed)
      try {
        const s = await lt("config.dd", { baseDir: f.AppConfig }), n = JSON.parse(s), i = Array.isArray(n.views) ? n.views : [], r = e - 1;
        if (!i[r]) return;
        const o = i.map((U, k) => ({ ...U, active: k === r })), a = { ...n, views: o };
        await ut("config.dd", JSON.stringify(a, null, 2), { baseDir: f.AppConfig });
        const c = o[r], d = { config: a }, u = {
          viewId: c.id ?? "",
          view: { ...c, widgets: Array.isArray(c.widgets) ? c.widgets : [] }
        };
        await S("displayduck-update", d), await _("display", "displayduck-update", d), await S("displayduck-active-view-updated", u), await _("display", "displayduck-active-view-updated", u);
      } catch (s) {
        console.error("[DisplayDuck View Switcher] failed to switch view", s);
      }
  }
};
const ht = `<div class="view" data-view-switcher>
  <div class="label">{{ view() }}</div>
</div>
`, ft = ".view{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;background:#0000002e;cursor:pointer;-webkit-user-select:none;user-select:none}.label{padding:.2em .45em;font-size:clamp(1.5rem,30cqw,4rem);font-weight:700}", L = at(dt, { template: ht, styles: ft }), pt = L, mt = { DisplayDuckWidget: L, Widget: pt };
export {
  L as DisplayDuckWidget,
  pt as Widget,
  mt as default
};
