const j = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
class $ {
  constructor() {
    this.pending = /* @__PURE__ */ new Map(), this.subscribers = /* @__PURE__ */ new Map(), this.handleMessage = (e) => {
      const t = e.data;
      if (!(!t || typeof t != "object")) {
        if (t.kind === "response") {
          this.handleResponse(t);
          return;
        }
        t.kind === "push" && this.handlePush(t);
      }
    }, self.addEventListener("message", this.handleMessage);
  }
  call(e, t) {
    const s = j(), n = { kind: "request", id: s, method: e, params: t };
    return new Promise((c, a) => {
      this.pending.set(s, { resolve: c, reject: a }), self.postMessage(n);
    });
  }
  emit(e, t) {
    const s = { kind: "event", method: e, params: t };
    self.postMessage(s);
  }
  subscribe(e, t) {
    let s = this.subscribers.get(e);
    return s || (s = /* @__PURE__ */ new Set(), this.subscribers.set(e, s)), s.add(t), () => {
      s?.delete(t);
    };
  }
  handleResponse(e) {
    const t = this.pending.get(e.id);
    t && (this.pending.delete(e.id), e.ok ? t.resolve(e.result) : t.reject(new Error(e.error ?? "RPC call failed.")));
  }
  handlePush(e) {
    const t = this.subscribers.get(e.channel);
    if (t?.size)
      for (const s of [...t])
        s(e.payload);
  }
}
let A = null;
const B = () => (A || (A = new $()), A), I = /* @__PURE__ */ new Map(), z = (r) => String(r ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), K = (r) => {
  const e = I.get(r);
  if (e)
    return e;
  const t = r.replace(/\bthis\b/g, "__item"), s = new Function("scope", `with (scope) { return (${t}); }`);
  return I.set(r, s), s;
}, R = (r, e) => {
  try {
    return K(r)(e);
  } catch {
    return "";
  }
}, k = (r, e = 0, t) => {
  const s = [];
  let n = e;
  for (; n < r.length; ) {
    const c = r.indexOf("{{", n);
    if (c === -1)
      return s.push({ type: "text", value: r.slice(n) }), { nodes: s, index: r.length };
    c > n && s.push({ type: "text", value: r.slice(n, c) });
    const a = r.indexOf("}}", c + 2);
    if (a === -1)
      return s.push({ type: "text", value: r.slice(c) }), { nodes: s, index: r.length };
    const l = r.slice(c + 2, a).trim();
    if (n = a + 2, l === "/if" || l === "/each") {
      if (t === l)
        return { nodes: s, index: n };
      s.push({ type: "text", value: `{{${l}}}` });
      continue;
    }
    if (l.startsWith("#if ")) {
      const f = k(r, n, "/if");
      s.push({
        type: "if",
        condition: l.slice(4).trim(),
        children: f.nodes
      }), n = f.index;
      continue;
    }
    if (l.startsWith("#each ")) {
      const f = k(r, n, "/each");
      s.push({
        type: "each",
        source: l.slice(6).trim(),
        children: f.nodes
      }), n = f.index;
      continue;
    }
    s.push({ type: "expr", value: l });
  }
  return { nodes: s, index: n };
}, E = (r, e) => {
  let t = "";
  for (const s of r) {
    if (s.type === "text") {
      t += s.value;
      continue;
    }
    if (s.type === "expr") {
      t += z(R(s.value, e));
      continue;
    }
    if (s.type === "if") {
      R(s.condition, e) && (t += E(s.children, e));
      continue;
    }
    const n = R(s.source, e);
    if (Array.isArray(n))
      for (const c of n) {
        const a = Object.create(e);
        a.__item = c, t += E(s.children, a);
      }
  }
  return t;
}, G = (r) => {
  const e = k(r).nodes;
  return (t) => E(e, t);
}, J = (r) => {
  if (typeof r != "function")
    return !1;
  const e = r;
  return e._isSignal === !0 && typeof e.set == "function" && typeof e.subscribe == "function";
}, Q = (r) => {
  let e = r;
  const t = /* @__PURE__ */ new Set(), s = (() => e);
  return s._isSignal = !0, s.set = (n) => {
    if (!Object.is(e, n)) {
      e = n;
      for (const c of t)
        c(e);
    }
  }, s.update = (n) => {
    s.set(n(e));
  }, s.subscribe = (n) => (t.add(n), () => t.delete(n)), s;
}, X = /* @__PURE__ */ new Set([
  // Worker/message-channel plumbing the RPC layer itself needs.
  "self",
  "postMessage",
  "addEventListener",
  "removeEventListener",
  "dispatchEvent",
  "onmessage",
  "onmessageerror",
  "onerror",
  "onunhandledrejection",
  "onrejectionhandled",
  "name",
  "close",
  // Timers / scheduling.
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  // Pure computation / encoding -- no network, no storage, no cross-context reach.
  "crypto",
  "Crypto",
  "CryptoKey",
  "SubtleCrypto",
  "TextEncoder",
  "TextDecoder",
  "structuredClone",
  "atob",
  "btoa",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  "console",
  "performance",
  "Performance",
  "PerformanceEntry",
  "PerformanceMark",
  "PerformanceMeasure",
  // Standard ECMAScript built-ins.
  "Object",
  "Array",
  "Function",
  "Boolean",
  "Symbol",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "AggregateError",
  "Number",
  "BigInt",
  "Math",
  "Date",
  "String",
  "RegExp",
  "JSON",
  "Promise",
  "Proxy",
  "Reflect",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "FinalizationRegistry",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "globalThis",
  "undefined",
  "NaN",
  "Infinity",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI"
]), Y = () => {
  const r = self;
  for (const e of Object.getOwnPropertyNames(r))
    if (!X.has(e))
      try {
        delete r[e];
      } catch {
      }
};
Y();
const Z = (r, e) => {
  const t = [];
  for (const s of Object.keys(r)) {
    const n = r[s];
    J(n) && t.push(n.subscribe(() => e()));
  }
  return () => {
    for (const s of t)
      s();
  };
}, ee = (r, e) => new Proxy(
  { payload: e },
  {
    get(t, s) {
      if (typeof s != "string")
        return;
      if (s in t)
        return t[s];
      const n = r[s];
      return typeof n == "function" ? n.bind(r) : n;
    },
    has(t, s) {
      return typeof s != "string" ? !1 : s in t || s in r;
    }
  }
), P = "{{ASSETS}}", te = /\{\{pack-install-path\}\}\/([^"')\s]+)/g, _ = (r, e) => {
  const t = e.trim().replace(/^\.\/+/, "").replace(/^\/+/, "");
  return !r || !t ? e : `${r.replace(/\/+$/, "")}/${t}`;
}, U = (r, e) => {
  if (!e)
    return r;
  let t = r;
  return t.includes(P) && (t = t.replaceAll(P, e)), t.replace(te, (s, n) => _(e, n));
};
class se {
  constructor(e, t) {
    this.rpc = e, this.selector = t;
  }
  setText(e) {
    this.rpc.emit("dom.setText", { selector: this.selector, text: e });
  }
  setAttribute(e, t) {
    this.rpc.emit("dom.setAttribute", { selector: this.selector, name: e, value: t });
  }
  removeAttribute(e) {
    this.rpc.emit("dom.removeAttribute", { selector: this.selector, name: e });
  }
  setStyle(e, t) {
    this.rpc.emit("dom.setStyle", { selector: this.selector, property: e, value: t });
  }
  addClass(...e) {
    this.rpc.emit("dom.addClass", { selector: this.selector, names: e });
  }
  removeClass(...e) {
    this.rpc.emit("dom.removeClass", { selector: this.selector, names: e });
  }
  toggleClass(e, t) {
    this.rpc.emit("dom.toggleClass", { selector: this.selector, name: e, on: t });
  }
  async getRect() {
    return this.rpc.call("dom.getRect", { selector: this.selector });
  }
}
let re = class {
  get config() {
    return this._getConfig();
  }
  on(e, t, s) {
    return this._onRegister(e, t, s);
  }
  /** Internal: called once by createWidgetClass() right after construction. */
  _attach(e) {
    this.dom = e.dom, this.assets = e.assets, this.network = e.network, this.media = e.media, this.permissions = e.permissions, this.app = e.app, this._getConfig = e.getConfig, this._onRegister = e.onRegister;
  }
};
const ne = (r, e) => {
  const t = B();
  let s = null, n = {}, c = {}, a = "", l = [], f = [], g = !1, m = !1, C = () => {
  };
  const b = /* @__PURE__ */ new Map();
  let x = null;
  const D = (i, o, d) => {
    let h = b.get(i);
    h || (h = /* @__PURE__ */ new Map(), b.set(i, h));
    let u = h.get(o);
    return u || (u = /* @__PURE__ */ new Set(), h.set(o, u), t.emit("on.register", { eventName: i, selector: o })), u.add(d), x ??= t.subscribe("dom-event", (S) => {
      const p = S, y = b.get(p.eventName)?.get(p.selector);
      if (y)
        for (const H of [...y])
          H(p);
    }), () => {
      u?.delete(d);
    };
  }, V = {
    fetch: (i) => t.call("network.fetch", { url: i }),
    fetchAsDataUrl: (i) => t.call("network.fetchAsDataUrl", { url: i }),
    checkIframeEmbeddable: (i) => t.call("app.checkIframeEmbeddable", { url: i })
  }, w = /* @__PURE__ */ new Map();
  let M = null;
  const W = {
    playHls: (i) => t.call("media.playHls", { url: i }),
    stop: () => t.call("media.stop"),
    setVolume: (i) => t.call("media.setVolume", { volume: i }),
    setMuted: (i) => t.call("media.setMuted", { muted: i }),
    on: (i, o) => {
      let d = w.get(i);
      return d || (d = /* @__PURE__ */ new Set(), w.set(i, d)), d.add(o), M ??= t.subscribe("media-event", (h) => {
        const { eventName: u, detail: S } = h, p = w.get(u);
        if (p)
          for (const y of [...p])
            y(S);
      }), () => {
        d?.delete(o);
      };
    }
  }, L = {
    has: (i) => l.includes(i),
    get requested() {
      return f;
    }
  }, N = {
    setLoading: (i) => t.emit("app.setLoading", { loading: i }),
    focusView: () => t.call("app.focusView"),
    setRequireFocus: (i) => t.call("app.setRequireFocus", { required: i }),
    isViewFocused: () => t.call("app.isViewFocused"),
    switchView: (i) => t.call("app.switchView", { viewNumber: i })
  }, q = {
    query: (i) => new se(t, i)
  }, F = {
    resolve: (i) => _(a, i)
  }, v = () => {
    if (g = !1, !s || m)
      return;
    const i = ee(s, n), o = U(e.template, a), d = U(e.styles, a), u = G(o)(i);
    t.emit("render", { html: u, styles: d }), s.afterRender?.();
  }, O = () => {
    g || m || (g = !0, queueMicrotask(() => {
      !m && g && v();
    }));
  };
  t.subscribe("init", (i) => {
    const o = i;
    n = o.payload ?? {}, c = o.config ?? {}, a = o.assetsBaseUrl ?? "", l = o.grantedPermissions ?? [], f = o.requestedPermissions ?? [], s = new r(), s._attach({
      dom: q,
      assets: F,
      network: V,
      media: W,
      permissions: L,
      app: N,
      getConfig: () => c,
      onRegister: D
    }), C = Z(s, O), s.onInit?.(), v();
  }), t.subscribe("payload-update", (i) => {
    const o = i;
    n = o.payload ?? {}, c = o.config ?? {}, s?.onUpdate?.(n), v();
  }), t.subscribe("destroy", () => {
    m = !0, g = !1, C(), x?.(), M?.(), s?.onDestroy?.();
  }), t.emit("ready");
};
let ie = class extends re {
  constructor() {
    super(...arguments), this.view = Q(1);
  }
  onInit() {
    this.view.set(this.getConfiguredView()), this.on("click", "[data-view-switcher]", () => {
      this.switchView();
    });
  }
  onUpdate() {
    this.view.set(this.getConfiguredView());
  }
  getConfiguredView() {
    const e = Number(this.config.view ?? 1);
    return Number.isFinite(e) && e >= 1 ? Math.floor(e) : 1;
  }
  async switchView() {
    try {
      await this.app.switchView(this.view());
    } catch (e) {
      console.error("[DisplayDuck View Switcher] failed to switch view", e);
    }
  }
};
const oe = `<div class="view" data-view-switcher>
  <div class="label">{{ view() }}</div>
</div>
`, ce = ".view{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;background:#0000002e;cursor:pointer;-webkit-user-select:none;user-select:none}.label{padding:.2em .45em;font-size:clamp(1.5rem,30cqw,4rem);font-weight:700}", T = ne(ie, { template: oe, styles: ce }), ae = T, ue = { DisplayDuckWidget: T, Widget: ae };
export {
  T as DisplayDuckWidget,
  ae as Widget,
  ue as default
};
