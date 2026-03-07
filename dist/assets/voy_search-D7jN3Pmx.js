import { B as T, __tla as __tla_0 } from "./index-DzxENfWI.js";
let z, J, R, H, F, q, P, B, I, N, Z, G, ve, ke, me, xe, he, ze;
let __tla = Promise.all([
  (() => {
    try {
      return __tla_0;
    } catch {
    }
  })()
]).then(async () => {
  const W = "/assets/voy_search_bg-FlZi7F4l.wasm", M = async (e = {}, n) => {
    let _;
    if (n.startsWith("data:")) {
      const r = n.replace(/^data:.*?base64,/, "");
      let o;
      if (typeof T == "function" && typeof T.from == "function") o = T.from(r, "base64");
      else if (typeof atob == "function") {
        const c = atob(r);
        o = new Uint8Array(c.length);
        for (let i = 0; i < c.length; i++) o[i] = c.charCodeAt(i);
      } else throw new Error("Cannot decode base64-encoded data URL");
      _ = await WebAssembly.instantiate(o, e);
    } else {
      const r = await fetch(n), o = r.headers.get("Content-Type") || "";
      if ("instantiateStreaming" in WebAssembly && o.startsWith("application/wasm")) _ = await WebAssembly.instantiateStreaming(r, e);
      else {
        const c = await r.arrayBuffer();
        _ = await WebAssembly.instantiate(c, e);
      }
    }
    return _.instance.exports;
  };
  let t;
  F = function(e) {
    t = e;
  };
  const u = new Array(128).fill(void 0);
  u.push(void 0, null, true, false);
  function y(e) {
    return u[e];
  }
  let p = u.length;
  function f(e) {
    p === u.length && u.push(u.length + 1);
    const n = p;
    return p = u[n], u[n] = e, n;
  }
  function L(e) {
    e < 132 || (u[e] = p, p = e);
  }
  function j(e) {
    const n = y(e);
    return L(e), n;
  }
  let l = 0, m = null;
  function x() {
    return (m === null || m.byteLength === 0) && (m = new Uint8Array(t.memory.buffer)), m;
  }
  const U = typeof TextEncoder > "u" ? (0, module.require)("util").TextEncoder : TextEncoder;
  let k = new U("utf-8");
  const $ = typeof k.encodeInto == "function" ? function(e, n) {
    return k.encodeInto(e, n);
  } : function(e, n) {
    const _ = k.encode(e);
    return n.set(_), {
      read: e.length,
      written: _.length
    };
  };
  function w(e, n, _) {
    if (_ === void 0) {
      const a = k.encode(e), b = n(a.length) >>> 0;
      return x().subarray(b, b + a.length).set(a), l = a.length, b;
    }
    let r = e.length, o = n(r) >>> 0;
    const c = x();
    let i = 0;
    for (; i < r; i++) {
      const a = e.charCodeAt(i);
      if (a > 127) break;
      c[o + i] = a;
    }
    if (i !== r) {
      i !== 0 && (e = e.slice(i)), o = _(o, r, r = i + e.length * 3) >>> 0;
      const a = x().subarray(o + i, o + r), b = $(e, a);
      i += b.written;
    }
    return l = i, o;
  }
  function A(e) {
    return e == null;
  }
  let h = null;
  function d() {
    return (h === null || h.byteLength === 0) && (h = new Int32Array(t.memory.buffer)), h;
  }
  const C = typeof TextDecoder > "u" ? (0, module.require)("util").TextDecoder : TextDecoder;
  let E = new C("utf-8", {
    ignoreBOM: true,
    fatal: true
  });
  E.decode();
  function g(e, n) {
    return e = e >>> 0, E.decode(x().subarray(e, e + n));
  }
  let v = null;
  function D() {
    return (v === null || v.byteLength === 0) && (v = new Float32Array(t.memory.buffer)), v;
  }
  function O(e, n) {
    const _ = n(e.length * 4) >>> 0;
    return D().set(e, _ / 4), l = e.length, _;
  }
  me = function(e) {
    let n, _;
    try {
      const c = t.__wbindgen_add_to_stack_pointer(-16);
      t.index(c, f(e));
      var r = d()[c / 4 + 0], o = d()[c / 4 + 1];
      return n = r, _ = o, g(r, o);
    } finally {
      t.__wbindgen_add_to_stack_pointer(16), t.__wbindgen_free(n, _);
    }
  };
  he = function(e, n, _) {
    const r = w(e, t.__wbindgen_malloc, t.__wbindgen_realloc), o = l, c = O(n, t.__wbindgen_malloc), i = l, a = t.search(r, o, c, i, _);
    return j(a);
  };
  ve = function(e, n) {
    let _, r;
    try {
      const i = t.__wbindgen_add_to_stack_pointer(-16), a = w(e, t.__wbindgen_malloc, t.__wbindgen_realloc), b = l;
      t.add(i, a, b, f(n));
      var o = d()[i / 4 + 0], c = d()[i / 4 + 1];
      return _ = o, r = c, g(o, c);
    } finally {
      t.__wbindgen_add_to_stack_pointer(16), t.__wbindgen_free(_, r);
    }
  };
  xe = function(e, n) {
    let _, r;
    try {
      const i = t.__wbindgen_add_to_stack_pointer(-16), a = w(e, t.__wbindgen_malloc, t.__wbindgen_realloc), b = l;
      t.remove(i, a, b, f(n));
      var o = d()[i / 4 + 0], c = d()[i / 4 + 1];
      return _ = o, r = c, g(o, c);
    } finally {
      t.__wbindgen_add_to_stack_pointer(16), t.__wbindgen_free(_, r);
    }
  };
  ke = function(e) {
    let n, _;
    try {
      const c = t.__wbindgen_add_to_stack_pointer(-16), i = w(e, t.__wbindgen_malloc, t.__wbindgen_realloc), a = l;
      t.clear(c, i, a);
      var r = d()[c / 4 + 0], o = d()[c / 4 + 1];
      return n = r, _ = o, g(r, o);
    } finally {
      t.__wbindgen_add_to_stack_pointer(16), t.__wbindgen_free(n, _);
    }
  };
  ze = function(e) {
    const n = w(e, t.__wbindgen_malloc, t.__wbindgen_realloc), _ = l;
    return t.size(n, _) >>> 0;
  };
  function S(e, n) {
    try {
      return e.apply(this, n);
    } catch (_) {
      t.__wbindgen_exn_store(f(_));
    }
  }
  z = class {
    static __wrap(n) {
      n = n >>> 0;
      const _ = Object.create(z.prototype);
      return _.__wbg_ptr = n, _;
    }
    __destroy_into_raw() {
      const n = this.__wbg_ptr;
      return this.__wbg_ptr = 0, n;
    }
    free() {
      const n = this.__destroy_into_raw();
      t.__wbg_voy_free(n);
    }
    constructor(n) {
      const _ = t.voy_new(A(n) ? 0 : f(n));
      return z.__wrap(_);
    }
    serialize() {
      let n, _;
      try {
        const c = t.__wbindgen_add_to_stack_pointer(-16);
        t.voy_serialize(c, this.__wbg_ptr);
        var r = d()[c / 4 + 0], o = d()[c / 4 + 1];
        return n = r, _ = o, g(r, o);
      } finally {
        t.__wbindgen_add_to_stack_pointer(16), t.__wbindgen_free(n, _);
      }
    }
    static deserialize(n) {
      const _ = w(n, t.__wbindgen_malloc, t.__wbindgen_realloc), r = l, o = t.voy_deserialize(_, r);
      return z.__wrap(o);
    }
    index(n) {
      t.voy_index(this.__wbg_ptr, f(n));
    }
    search(n, _) {
      const r = O(n, t.__wbindgen_malloc), o = l, c = t.voy_search(this.__wbg_ptr, r, o, _);
      return j(c);
    }
    add(n) {
      t.voy_add(this.__wbg_ptr, f(n));
    }
    remove(n) {
      t.voy_remove(this.__wbg_ptr, f(n));
    }
    clear() {
      t.voy_clear(this.__wbg_ptr);
    }
    size() {
      return t.voy_size(this.__wbg_ptr) >>> 0;
    }
  };
  I = function(e) {
    const n = y(e);
    return f(n);
  };
  B = function(e) {
    return y(e) === void 0;
  };
  N = function(e) {
    j(e);
  };
  R = function() {
    const e = new Error();
    return f(e);
  };
  q = function(e, n) {
    const _ = y(n).stack, r = w(_, t.__wbindgen_malloc, t.__wbindgen_realloc), o = l;
    d()[e / 4 + 1] = o, d()[e / 4 + 0] = r;
  };
  J = function(e, n) {
    let _, r;
    try {
      _ = e, r = n, console.error(g(e, n));
    } finally {
      t.__wbindgen_free(_, r);
    }
  };
  H = function() {
    return S(function(e, n) {
      const _ = JSON.parse(g(e, n));
      return f(_);
    }, arguments);
  };
  P = function() {
    return S(function(e) {
      const n = JSON.stringify(y(e));
      return f(n);
    }, arguments);
  };
  Z = function(e, n) {
    const _ = y(n), r = typeof _ == "string" ? _ : void 0;
    var o = A(r) ? 0 : w(r, t.__wbindgen_malloc, t.__wbindgen_realloc), c = l;
    d()[e / 4 + 1] = c, d()[e / 4 + 0] = o;
  };
  G = function(e, n) {
    throw new Error(g(e, n));
  };
  URL = globalThis.URL;
  const s = await M({
    "./voy_search_bg.js": {
      __wbindgen_object_clone_ref: I,
      __wbindgen_is_undefined: B,
      __wbindgen_object_drop_ref: N,
      __wbg_new_abda76e883ba8a5f: R,
      __wbg_stack_658279fe44541cf6: q,
      __wbg_error_f851667af71bcfc6: J,
      __wbg_parse_76a8a18ca3f8730b: H,
      __wbg_stringify_d06ad2addc54d51e: P,
      __wbindgen_string_get: Z,
      __wbindgen_throw: G
    }
  }, W), K = s.memory, Q = s.__wbg_voy_free, X = s.voy_new, Y = s.voy_serialize, V = s.voy_deserialize, ee = s.voy_index, ne = s.voy_search, te = s.voy_add, _e = s.voy_remove, re = s.voy_clear, oe = s.voy_size, ce = s.index, ie = s.search, se = s.add, ae = s.remove, de = s.clear, le = s.size, fe = s.__wbindgen_malloc, be = s.__wbindgen_realloc, ue = s.__wbindgen_add_to_stack_pointer, we = s.__wbindgen_free, ge = s.__wbindgen_exn_store, ye = Object.freeze(Object.defineProperty({
    __proto__: null,
    __wbg_voy_free: Q,
    __wbindgen_add_to_stack_pointer: ue,
    __wbindgen_exn_store: ge,
    __wbindgen_free: we,
    __wbindgen_malloc: fe,
    __wbindgen_realloc: be,
    add: se,
    clear: de,
    index: ce,
    memory: K,
    remove: ae,
    search: ie,
    size: le,
    voy_add: te,
    voy_clear: re,
    voy_deserialize: V,
    voy_index: ee,
    voy_new: X,
    voy_remove: _e,
    voy_search: ne,
    voy_serialize: Y,
    voy_size: oe
  }, Symbol.toStringTag, {
    value: "Module"
  }));
  F(ye);
});
export {
  z as Voy,
  __tla,
  J as __wbg_error_f851667af71bcfc6,
  R as __wbg_new_abda76e883ba8a5f,
  H as __wbg_parse_76a8a18ca3f8730b,
  F as __wbg_set_wasm,
  q as __wbg_stack_658279fe44541cf6,
  P as __wbg_stringify_d06ad2addc54d51e,
  B as __wbindgen_is_undefined,
  I as __wbindgen_object_clone_ref,
  N as __wbindgen_object_drop_ref,
  Z as __wbindgen_string_get,
  G as __wbindgen_throw,
  ve as add,
  ke as clear,
  me as index,
  xe as remove,
  he as search,
  ze as size
};
