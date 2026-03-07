import { a as ut, b as _s, p as Ve, c as Xt, B as _r, r as Es, g as ws } from "./index-Dm6_ga7l.js";
function Fs(e, n) {
  for (var i = 0; i < n.length; i++) {
    const t = n[i];
    if (typeof t != "string" && !Array.isArray(t)) {
      for (const r in t) if (r !== "default" && !(r in e)) {
        const a = Object.getOwnPropertyDescriptor(t, r);
        a && Object.defineProperty(e, r, a.get ? a : { enumerable: true, get: () => t[r] });
      }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }));
}
var ze = {}, Fr = "1.13.8", Da = typeof self == "object" && self.self === self && self || typeof ut == "object" && ut.global === ut && ut || Function("return this")() || {}, $t = Array.prototype, Ar = Object.prototype, ya = typeof Symbol < "u" ? Symbol.prototype : null, As = $t.push, at = $t.slice, Jn = Ar.toString, Cs = Ar.hasOwnProperty, Lo = typeof ArrayBuffer < "u", Ws = typeof DataView < "u", Bs = Array.isArray, va = Object.keys, xa = Object.create, Ua = Lo && ArrayBuffer.isView, Ss = isNaN, Rs = isFinite, qo = !{ toString: null }.propertyIsEnumerable("toString"), Ta = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"], Ns = Math.pow(2, 53) - 1;
function qe(e, n) {
  return n = n == null ? e.length - 1 : +n, function() {
    for (var i = Math.max(arguments.length - n, 0), t = Array(i), r = 0; r < i; r++) t[r] = arguments[r + n];
    switch (n) {
      case 0:
        return e.call(this, t);
      case 1:
        return e.call(this, arguments[0], t);
      case 2:
        return e.call(this, arguments[0], arguments[1], t);
    }
    var a = Array(n + 1);
    for (r = 0; r < n; r++) a[r] = arguments[r];
    return a[n] = t, e.apply(this, a);
  };
}
function hn(e) {
  var n = typeof e;
  return n === "function" || n === "object" && !!e;
}
function Mo(e) {
  return e === null;
}
function Cr(e) {
  return e === void 0;
}
function Wr(e) {
  return e === true || e === false || Jn.call(e) === "[object Boolean]";
}
function Po(e) {
  return !!(e && e.nodeType === 1);
}
function Le(e) {
  var n = "[object " + e + "]";
  return function(i) {
    return Jn.call(i) === n;
  };
}
const Qt = Le("String"), Br = Le("Number"), Xo = Le("Date"), jo = Le("RegExp"), Vo = Le("Error"), Sr = Le("Symbol"), Rr = Le("ArrayBuffer");
var Ho = Le("Function"), ks = Da.document && Da.document.childNodes;
typeof /./ != "function" && typeof Int8Array != "object" && typeof ks != "function" && (Ho = function(e) {
  return typeof e == "function" || false;
});
const Ie = Ho, zo = Le("Object");
var Go = Ws && (!/\[native code\]/.test(String(DataView)) || zo(new DataView(new ArrayBuffer(8)))), Nr = typeof Map < "u" && zo(/* @__PURE__ */ new Map()), Os = Le("DataView");
function Is(e) {
  return e != null && Ie(e.getInt8) && Rr(e.buffer);
}
const et = Go ? Is : Os, gn = Bs || Le("Array");
function pn(e, n) {
  return e != null && Cs.call(e, n);
}
var Er = Le("Arguments");
(function() {
  Er(arguments) || (Er = function(e) {
    return pn(e, "callee");
  });
})();
const Yt = Er;
function $o(e) {
  return !Sr(e) && Rs(e) && !isNaN(parseFloat(e));
}
function kr(e) {
  return Br(e) && Ss(e);
}
function Or(e) {
  return function() {
    return e;
  };
}
function Qo(e) {
  return function(n) {
    var i = e(n);
    return typeof i == "number" && i >= 0 && i <= Ns;
  };
}
function Yo(e) {
  return function(n) {
    return n == null ? void 0 : n[e];
  };
}
const jt = Yo("byteLength"), Ls = Qo(jt);
var qs = /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
function Ms(e) {
  return Ua ? Ua(e) && !et(e) : Ls(e) && qs.test(Jn.call(e));
}
const Ir = Lo ? Ms : Or(false), Oe = Yo("length");
function Ps(e) {
  for (var n = {}, i = e.length, t = 0; t < i; ++t) n[e[t]] = true;
  return { contains: function(r) {
    return n[r] === true;
  }, push: function(r) {
    return n[r] = true, e.push(r);
  } };
}
function Zo(e, n) {
  n = Ps(n);
  var i = Ta.length, t = e.constructor, r = Ie(t) && t.prototype || Ar, a = "constructor";
  for (pn(e, a) && !n.contains(a) && n.push(a); i--; ) a = Ta[i], a in e && e[a] !== r[a] && !n.contains(a) && n.push(a);
}
function Re(e) {
  if (!hn(e)) return [];
  if (va) return va(e);
  var n = [];
  for (var i in e) pn(e, i) && n.push(i);
  return qo && Zo(e, n), n;
}
function Ko(e) {
  if (e == null) return true;
  var n = Oe(e);
  return typeof n == "number" && (gn(e) || Qt(e) || Yt(e)) ? n === 0 : Oe(Re(e)) === 0;
}
function Lr(e, n) {
  var i = Re(n), t = i.length;
  if (e == null) return !t;
  for (var r = Object(e), a = 0; a < t; a++) {
    var c = i[a];
    if (n[c] !== r[c] || !(c in r)) return false;
  }
  return true;
}
function _e(e) {
  if (e instanceof _e) return e;
  if (!(this instanceof _e)) return new _e(e);
  this._wrapped = e;
}
_e.VERSION = Fr;
_e.prototype.value = function() {
  return this._wrapped;
};
_e.prototype.valueOf = _e.prototype.toJSON = _e.prototype.value;
_e.prototype.toString = function() {
  return String(this._wrapped);
};
function _a(e) {
  return new Uint8Array(e.buffer || e, e.byteOffset || 0, jt(e));
}
var Ea = "[object DataView]";
function Jo(e, n) {
  for (var i = [{ a: e, b: n }], t = [], r = []; i.length; ) {
    var a = i.pop();
    if (a === true) {
      t.pop(), r.pop();
      continue;
    }
    if (e = a.a, n = a.b, e === n) {
      if (e !== 0 || 1 / e === 1 / n) continue;
      return false;
    }
    if (e == null || n == null) return false;
    if (e !== e) {
      if (n !== n) continue;
      return false;
    }
    var c = typeof e;
    if (c !== "function" && c !== "object" && typeof n != "object") return false;
    e instanceof _e && (e = e._wrapped), n instanceof _e && (n = n._wrapped);
    var o = Jn.call(e);
    if (o !== Jn.call(n)) return false;
    if (Go && o == "[object Object]" && et(e)) {
      if (!et(n)) return false;
      o = Ea;
    }
    switch (o) {
      case "[object RegExp]":
      case "[object String]":
        if ("" + e == "" + n) continue;
        return false;
      case "[object Number]":
        i.push({ a: +e, b: +n });
        continue;
      case "[object Date]":
      case "[object Boolean]":
        if (+e == +n) continue;
        return false;
      case "[object Symbol]":
        if (ya.valueOf.call(e) === ya.valueOf.call(n)) continue;
        return false;
      case "[object ArrayBuffer]":
      case Ea:
        i.push({ a: _a(e), b: _a(n) });
        continue;
    }
    var u = o === "[object Array]";
    if (!u && Ir(e)) {
      var s = jt(e);
      if (s !== jt(n)) return false;
      if (e.buffer === n.buffer && e.byteOffset === n.byteOffset) continue;
      u = true;
    }
    if (!u) {
      if (typeof e != "object" || typeof n != "object") return false;
      var h = e.constructor, g = n.constructor;
      if (h !== g && !(Ie(h) && h instanceof h && Ie(g) && g instanceof g) && "constructor" in e && "constructor" in n) return false;
    }
    for (var f = t.length; f--; ) if (t[f] === e) {
      if (r[f] === n) break;
      return false;
    }
    if (!(f >= 0)) if (t.push(e), r.push(n), i.push(true), u) {
      if (f = e.length, f !== n.length) return false;
      for (; f--; ) i.push({ a: e[f], b: n[f] });
    } else {
      var m = Re(e), D;
      if (f = m.length, Re(n).length !== f) return false;
      for (; f--; ) {
        if (D = m[f], !pn(n, D)) return false;
        i.push({ a: e[D], b: n[D] });
      }
    }
  }
  return true;
}
function qn(e) {
  if (!hn(e)) return [];
  var n = [];
  for (var i in e) n.push(i);
  return qo && Zo(e, n), n;
}
function qr(e) {
  var n = Oe(e);
  return function(i) {
    if (i == null) return false;
    var t = qn(i);
    if (Oe(t)) return false;
    for (var r = 0; r < n; r++) if (!Ie(i[e[r]])) return false;
    return e !== tu || !Ie(i[Mr]);
  };
}
var Mr = "forEach", eu = "has", Pr = ["clear", "delete"], nu = ["get", eu, "set"], Xs = Pr.concat(Mr, nu), tu = Pr.concat(nu), js = ["add"].concat(Pr, Mr, eu);
const iu = Nr ? qr(Xs) : Le("Map"), ru = Nr ? qr(tu) : Le("WeakMap"), au = Nr ? qr(js) : Le("Set"), cu = Le("WeakSet");
function An(e) {
  for (var n = Re(e), i = n.length, t = Array(i), r = 0; r < i; r++) t[r] = e[n[r]];
  return t;
}
function ou(e) {
  for (var n = Re(e), i = n.length, t = Array(i), r = 0; r < i; r++) t[r] = [n[r], e[n[r]]];
  return t;
}
function Xr(e) {
  for (var n = {}, i = Re(e), t = 0, r = i.length; t < r; t++) n[e[i[t]]] = i[t];
  return n;
}
function nt(e) {
  var n = [];
  for (var i in e) Ie(e[i]) && n.push(i);
  return n.sort();
}
function jr(e, n) {
  return function(i) {
    var t = arguments.length;
    if (n && (i = Object(i)), t < 2 || i == null) return i;
    for (var r = 1; r < t; r++) for (var a = arguments[r], c = e(a), o = c.length, u = 0; u < o; u++) {
      var s = c[u];
      (!n || i[s] === void 0) && (i[s] = a[s]);
    }
    return i;
  };
}
const Vr = jr(qn), In = jr(Re), Hr = jr(qn, true);
function Vs() {
  return function() {
  };
}
function uu(e) {
  if (!hn(e)) return {};
  if (xa) return xa(e);
  var n = Vs();
  n.prototype = e;
  var i = new n();
  return n.prototype = null, i;
}
function su(e, n) {
  var i = uu(e);
  return n && In(i, n), i;
}
function du(e) {
  return hn(e) ? gn(e) ? e.slice() : Vr({}, e) : e;
}
function lu(e, n) {
  return n(e), e;
}
function zr(e) {
  return gn(e) ? e : [e];
}
_e.toPath = zr;
function ct(e) {
  return _e.toPath(e);
}
function Gr(e, n) {
  for (var i = n.length, t = 0; t < i; t++) {
    if (e == null) return;
    e = e[n[t]];
  }
  return i ? e : void 0;
}
function $r(e, n, i) {
  var t = Gr(e, ct(n));
  return Cr(t) ? i : t;
}
function fu(e, n) {
  n = ct(n);
  for (var i = n.length, t = 0; t < i; t++) {
    var r = n[t];
    if (!pn(e, r)) return false;
    e = e[r];
  }
  return !!i;
}
function Zt(e) {
  return e;
}
function Fn(e) {
  return e = In({}, e), function(n) {
    return Lr(n, e);
  };
}
function Kt(e) {
  return e = ct(e), function(n) {
    return Gr(n, e);
  };
}
function ot(e, n, i) {
  if (n === void 0) return e;
  switch (i ?? 3) {
    case 1:
      return function(t) {
        return e.call(n, t);
      };
    case 3:
      return function(t, r, a) {
        return e.call(n, t, r, a);
      };
    case 4:
      return function(t, r, a, c) {
        return e.call(n, t, r, a, c);
      };
  }
  return function() {
    return e.apply(n, arguments);
  };
}
function hu(e, n, i) {
  return e == null ? Zt : Ie(e) ? ot(e, n, i) : hn(e) && !gn(e) ? Fn(e) : Kt(e);
}
function Jt(e, n) {
  return hu(e, n, 1 / 0);
}
_e.iteratee = Jt;
function Xe(e, n, i) {
  return _e.iteratee !== Jt ? _e.iteratee(e, n) : hu(e, n, i);
}
function gu(e, n, i) {
  n = Xe(n, i);
  for (var t = Re(e), r = t.length, a = {}, c = 0; c < r; c++) {
    var o = t[c];
    a[o] = n(e[o], o, e);
  }
  return a;
}
function Qr() {
}
function pu(e) {
  return e == null ? Qr : function(n) {
    return $r(e, n);
  };
}
function mu(e, n, i) {
  var t = Array(Math.max(0, e));
  n = ot(n, i, 1);
  for (var r = 0; r < e; r++) t[r] = n(r);
  return t;
}
function Vt(e, n) {
  return n == null && (n = e, e = 0), e + Math.floor(Math.random() * (n - e + 1));
}
const Ln = Date.now || function() {
  return (/* @__PURE__ */ new Date()).getTime();
};
function bu(e) {
  var n = function(a) {
    return e[a];
  }, i = "(?:" + Re(e).join("|") + ")", t = RegExp(i), r = RegExp(i, "g");
  return function(a) {
    return a = a == null ? "" : "" + a, t.test(a) ? a.replace(r, n) : a;
  };
}
const Du = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" }, yu = bu(Du), Hs = Xr(Du), vu = bu(Hs), xu = _e.templateSettings = { evaluate: /<%([\s\S]+?)%>/g, interpolate: /<%=([\s\S]+?)%>/g, escape: /<%-([\s\S]+?)%>/g };
var yi = /(.)^/, zs = { "'": "'", "\\": "\\", "\r": "r", "\n": "n", "\u2028": "u2028", "\u2029": "u2029" }, Gs = /\\|'|\r|\n|\u2028|\u2029/g;
function $s(e) {
  return "\\" + zs[e];
}
var Qs = /^\s*(\w|\$)+\s*$/;
function Uu(e, n, i) {
  !n && i && (n = i), n = Hr({}, n, _e.templateSettings);
  var t = RegExp([(n.escape || yi).source, (n.interpolate || yi).source, (n.evaluate || yi).source].join("|") + "|$", "g"), r = 0, a = "__p+='";
  e.replace(t, function(s, h, g, f, m) {
    return a += e.slice(r, m).replace(Gs, $s), r = m + s.length, h ? a += `'+
((__t=(` + h + `))==null?'':_.escape(__t))+
'` : g ? a += `'+
((__t=(` + g + `))==null?'':__t)+
'` : f && (a += `';
` + f + `
__p+='`), s;
  }), a += `';
`;
  var c = n.variable;
  if (c) {
    if (!Qs.test(c)) throw new Error("variable is not a bare identifier: " + c);
  } else a = `with(obj||{}){
` + a + `}
`, c = "obj";
  a = `var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
` + a + `return __p;
`;
  var o;
  try {
    o = new Function(c, "_", a);
  } catch (s) {
    throw s.source = a, s;
  }
  var u = function(s) {
    return o.call(this, s, _e);
  };
  return u.source = "function(" + c + `){
` + a + "}", u;
}
function Tu(e, n, i) {
  n = ct(n);
  var t = n.length;
  if (!t) return Ie(i) ? i.call(e) : i;
  for (var r = 0; r < t; r++) {
    var a = e == null ? void 0 : e[n[r]];
    a === void 0 && (a = i, r = t), e = Ie(a) ? a.call(e) : a;
  }
  return e;
}
var Ys = 0;
function _u(e) {
  var n = ++Ys + "";
  return e ? e + n : n;
}
function Eu(e) {
  var n = _e(e);
  return n._chain = true, n;
}
function wu(e, n, i, t, r) {
  if (!(t instanceof n)) return e.apply(i, r);
  var a = uu(e.prototype), c = e.apply(a, r);
  return hn(c) ? c : a;
}
var Cn = qe(function(e, n) {
  var i = Cn.placeholder, t = function() {
    for (var r = 0, a = n.length, c = Array(a), o = 0; o < a; o++) c[o] = n[o] === i ? arguments[r++] : n[o];
    for (; r < arguments.length; ) c.push(arguments[r++]);
    return wu(e, t, this, this, c);
  };
  return t;
});
Cn.placeholder = _e;
const Yr = qe(function(e, n, i) {
  if (!Ie(e)) throw new TypeError("Bind must be called on a function");
  var t = qe(function(r) {
    return wu(e, t, n, this, i.concat(r));
  });
  return t;
}), He = Qo(Oe);
function Mn(e, n, i) {
  !n && n !== 0 && (n = 1 / 0);
  for (var t = [], r = 0, a = 0, c = Oe(e) || 0, o = []; ; ) {
    if (a >= c) {
      if (!o.length) break;
      var u = o.pop();
      a = u.i, e = u.v, c = Oe(e);
      continue;
    }
    var s = e[a++];
    o.length >= n ? t[r++] = s : He(s) && (gn(s) || Yt(s)) ? (o.push({ i: a, v: e }), a = 0, e = s, c = Oe(e)) : i || (t[r++] = s);
  }
  return t;
}
const Fu = qe(function(e, n) {
  n = Mn(n, false, false);
  var i = n.length;
  if (i < 1) throw new Error("bindAll must be passed function names");
  for (; i--; ) {
    var t = n[i];
    e[t] = Yr(e[t], e);
  }
  return e;
});
function Au(e, n) {
  var i = function(t) {
    var r = i.cache, a = "" + (n ? n.apply(this, arguments) : t);
    return pn(r, a) || (r[a] = e.apply(this, arguments)), r[a];
  };
  return i.cache = {}, i;
}
const Zr = qe(function(e, n, i) {
  return setTimeout(function() {
    return e.apply(null, i);
  }, n);
}), Cu = Cn(Zr, _e, 1);
function Wu(e, n, i) {
  var t, r, a, c, o = 0;
  i || (i = {});
  var u = function() {
    o = i.leading === false ? 0 : Ln(), t = null, c = e.apply(r, a), t || (r = a = null);
  }, s = function() {
    var h = Ln();
    !o && i.leading === false && (o = h);
    var g = n - (h - o);
    return r = this, a = arguments, g <= 0 || g > n ? (t && (clearTimeout(t), t = null), o = h, c = e.apply(r, a), t || (r = a = null)) : !t && i.trailing !== false && (t = setTimeout(u, g)), c;
  };
  return s.cancel = function() {
    clearTimeout(t), o = 0, t = r = a = null;
  }, s;
}
function Bu(e, n, i) {
  var t, r, a, c, o, u = function() {
    var h = Ln() - r;
    n > h ? t = setTimeout(u, n - h) : (t = null, i || (c = e.apply(o, a)), t || (a = o = null));
  }, s = qe(function(h) {
    return o = this, a = h, r = Ln(), t || (t = setTimeout(u, n), i && (c = e.apply(o, a))), c;
  });
  return s.cancel = function() {
    clearTimeout(t), t = a = o = null;
  }, s;
}
function Su(e, n) {
  return Cn(n, e);
}
function ei(e) {
  return function() {
    return !e.apply(this, arguments);
  };
}
function Ru() {
  var e = arguments, n = e.length - 1;
  return function() {
    for (var i = n, t = e[n].apply(this, arguments); i--; ) t = e[i].call(this, t);
    return t;
  };
}
function Nu(e, n) {
  return function() {
    if (--e < 1) return n.apply(this, arguments);
  };
}
function Kr(e, n) {
  var i;
  return function() {
    return --e > 0 && (i = n.apply(this, arguments)), e <= 1 && (n = null), i;
  };
}
const ku = Cn(Kr, 2);
function Jr(e, n, i) {
  n = Xe(n, i);
  for (var t = Re(e), r, a = 0, c = t.length; a < c; a++) if (r = t[a], n(e[r], r, e)) return r;
}
function Ou(e) {
  return function(n, i, t) {
    i = Xe(i, t);
    for (var r = Oe(n), a = e > 0 ? 0 : r - 1; a >= 0 && a < r; a += e) if (i(n[a], a, n)) return a;
    return -1;
  };
}
const ni = Ou(1), ea = Ou(-1);
function na(e, n, i, t) {
  i = Xe(i, t, 1);
  for (var r = i(n), a = 0, c = Oe(e); a < c; ) {
    var o = Math.floor((a + c) / 2);
    i(e[o]) < r ? a = o + 1 : c = o;
  }
  return a;
}
function Iu(e, n, i) {
  return function(t, r, a) {
    var c = 0, o = Oe(t);
    if (typeof a == "number") e > 0 ? c = a >= 0 ? a : Math.max(a + o, c) : o = a >= 0 ? Math.min(a + 1, o) : a + o + 1;
    else if (i && a && o) return a = i(t, r), t[a] === r ? a : -1;
    if (r !== r) return a = n(at.call(t, c, o), kr), a >= 0 ? a + c : -1;
    for (a = e > 0 ? c : o - 1; a >= 0 && a < o; a += e) if (t[a] === r) return a;
    return -1;
  };
}
const ta = Iu(1, ni, na), Lu = Iu(-1, ea);
function tt(e, n, i) {
  var t = He(e) ? ni : Jr, r = t(e, n, i);
  if (r !== void 0 && r !== -1) return e[r];
}
function qu(e, n) {
  return tt(e, Fn(n));
}
function Ke(e, n, i) {
  n = ot(n, i);
  var t, r;
  if (He(e)) for (t = 0, r = e.length; t < r; t++) n(e[t], t, e);
  else {
    var a = Re(e);
    for (t = 0, r = a.length; t < r; t++) n(e[a[t]], a[t], e);
  }
  return e;
}
function an(e, n, i) {
  n = Xe(n, i);
  for (var t = !He(e) && Re(e), r = (t || e).length, a = Array(r), c = 0; c < r; c++) {
    var o = t ? t[c] : c;
    a[c] = n(e[o], o, e);
  }
  return a;
}
function Mu(e) {
  var n = function(i, t, r, a) {
    var c = !He(i) && Re(i), o = (c || i).length, u = e > 0 ? 0 : o - 1;
    for (a || (r = i[c ? c[u] : u], u += e); u >= 0 && u < o; u += e) {
      var s = c ? c[u] : u;
      r = t(r, i[s], s, i);
    }
    return r;
  };
  return function(i, t, r, a) {
    var c = arguments.length >= 3;
    return n(i, ot(t, a, 4), r, c);
  };
}
const kn = Mu(1), Ht = Mu(-1);
function ln(e, n, i) {
  var t = [];
  return n = Xe(n, i), Ke(e, function(r, a, c) {
    n(r, a, c) && t.push(r);
  }), t;
}
function Pu(e, n, i) {
  return ln(e, ei(Xe(n)), i);
}
function zt(e, n, i) {
  n = Xe(n, i);
  for (var t = !He(e) && Re(e), r = (t || e).length, a = 0; a < r; a++) {
    var c = t ? t[a] : a;
    if (!n(e[c], c, e)) return false;
  }
  return true;
}
function Gt(e, n, i) {
  n = Xe(n, i);
  for (var t = !He(e) && Re(e), r = (t || e).length, a = 0; a < r; a++) {
    var c = t ? t[a] : a;
    if (n(e[c], c, e)) return true;
  }
  return false;
}
function $e(e, n, i, t) {
  return He(e) || (e = An(e)), (typeof i != "number" || t) && (i = 0), ta(e, n, i) >= 0;
}
const Xu = qe(function(e, n, i) {
  var t, r;
  return Ie(n) ? r = n : (n = ct(n), t = n.slice(0, -1), n = n[n.length - 1]), an(e, function(a) {
    var c = r;
    if (!c) {
      if (t && t.length && (a = Gr(a, t)), a == null) return;
      c = a[n];
    }
    return c == null ? c : c.apply(a, i);
  });
});
function ti(e, n) {
  return an(e, Kt(n));
}
function ju(e, n) {
  return ln(e, Fn(n));
}
function ia(e, n, i) {
  var t = -1 / 0, r = -1 / 0, a, c;
  if (n == null || typeof n == "number" && typeof e[0] != "object" && e != null) {
    e = He(e) ? e : An(e);
    for (var o = 0, u = e.length; o < u; o++) a = e[o], a != null && a > t && (t = a);
  } else n = Xe(n, i), Ke(e, function(s, h, g) {
    c = n(s, h, g), (c > r || c === -1 / 0 && t === -1 / 0) && (t = s, r = c);
  });
  return t;
}
function Vu(e, n, i) {
  var t = 1 / 0, r = 1 / 0, a, c;
  if (n == null || typeof n == "number" && typeof e[0] != "object" && e != null) {
    e = He(e) ? e : An(e);
    for (var o = 0, u = e.length; o < u; o++) a = e[o], a != null && a < t && (t = a);
  } else n = Xe(n, i), Ke(e, function(s, h, g) {
    c = n(s, h, g), (c < r || c === 1 / 0 && t === 1 / 0) && (t = s, r = c);
  });
  return t;
}
var Zs = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
function ra(e) {
  return e ? gn(e) ? at.call(e) : Qt(e) ? e.match(Zs) : He(e) ? an(e, Zt) : An(e) : [];
}
function aa(e, n, i) {
  if (n == null || i) return He(e) || (e = An(e)), e[Vt(e.length - 1)];
  var t = ra(e), r = Oe(t);
  n = Math.max(Math.min(n, r), 0);
  for (var a = r - 1, c = 0; c < n; c++) {
    var o = Vt(c, a), u = t[c];
    t[c] = t[o], t[o] = u;
  }
  return t.slice(0, n);
}
function Hu(e) {
  return aa(e, 1 / 0);
}
function zu(e, n, i) {
  var t = 0;
  return n = Xe(n, i), ti(an(e, function(r, a, c) {
    return { value: r, index: t++, criteria: n(r, a, c) };
  }).sort(function(r, a) {
    var c = r.criteria, o = a.criteria;
    if (c !== o) {
      if (c > o || c === void 0) return 1;
      if (c < o || o === void 0) return -1;
    }
    return r.index - a.index;
  }), "value");
}
function ii(e, n) {
  return function(i, t, r) {
    var a = n ? [[], []] : {};
    return t = Xe(t, r), Ke(i, function(c, o) {
      var u = t(c, o, i);
      e(a, c, u);
    }), a;
  };
}
const Gu = ii(function(e, n, i) {
  pn(e, i) ? e[i].push(n) : e[i] = [n];
}), $u = ii(function(e, n, i) {
  e[i] = n;
}), Qu = ii(function(e, n, i) {
  pn(e, i) ? e[i]++ : e[i] = 1;
}), Yu = ii(function(e, n, i) {
  e[i ? 0 : 1].push(n);
}, true);
function Zu(e) {
  return e == null ? 0 : He(e) ? e.length : Re(e).length;
}
function Ks(e, n, i) {
  return n in i;
}
const ca = qe(function(e, n) {
  var i = {}, t = n[0];
  if (e == null) return i;
  Ie(t) ? (n.length > 1 && (t = ot(t, n[1])), n = qn(e)) : (t = Ks, n = Mn(n, false, false), e = Object(e));
  for (var r = 0, a = n.length; r < a; r++) {
    var c = n[r], o = e[c];
    t(o, c, e) && (i[c] = o);
  }
  return i;
}), Ku = qe(function(e, n) {
  var i = n[0], t;
  return Ie(i) ? (i = ei(i), n.length > 1 && (t = n[1])) : (n = an(Mn(n, false, false), String), i = function(r, a) {
    return !$e(n, a);
  }), ca(e, i, t);
});
function oa(e, n, i) {
  return at.call(e, 0, Math.max(0, e.length - (n == null || i ? 1 : n)));
}
function On(e, n, i) {
  return e == null || e.length < 1 ? n == null || i ? void 0 : [] : n == null || i ? e[0] : oa(e, e.length - n);
}
function wn(e, n, i) {
  return at.call(e, n == null || i ? 1 : n);
}
function Ju(e, n, i) {
  return e == null || e.length < 1 ? n == null || i ? void 0 : [] : n == null || i ? e[e.length - 1] : wn(e, Math.max(0, e.length - n));
}
function es(e) {
  return ln(e, Boolean);
}
function ns(e, n) {
  return Mn(e, n, false);
}
const ua = qe(function(e, n) {
  return n = Mn(n, true, true), ln(e, function(i) {
    return !$e(n, i);
  });
}), ts = qe(function(e, n) {
  return ua(e, n);
});
function it(e, n, i, t) {
  Wr(n) || (t = i, i = n, n = false), i != null && (i = Xe(i, t));
  for (var r = [], a = [], c = 0, o = Oe(e); c < o; c++) {
    var u = e[c], s = i ? i(u, c, e) : u;
    n && !i ? ((!c || a !== s) && r.push(u), a = s) : i ? $e(a, s) || (a.push(s), r.push(u)) : $e(r, u) || r.push(u);
  }
  return r;
}
const is = qe(function(e) {
  return it(Mn(e, true, true));
});
function rs(e) {
  for (var n = [], i = arguments.length, t = 0, r = Oe(e); t < r; t++) {
    var a = e[t];
    if (!$e(n, a)) {
      var c;
      for (c = 1; c < i && $e(arguments[c], a); c++) ;
      c === i && n.push(a);
    }
  }
  return n;
}
function rt(e) {
  for (var n = e && ia(e, Oe).length || 0, i = Array(n), t = 0; t < n; t++) i[t] = ti(e, t);
  return i;
}
const as = qe(rt);
function cs(e, n) {
  for (var i = {}, t = 0, r = Oe(e); t < r; t++) n ? i[e[t]] = n[t] : i[e[t][0]] = e[t][1];
  return i;
}
function os(e, n, i) {
  n == null && (n = e || 0, e = 0), i || (i = n < e ? -1 : 1);
  for (var t = Math.max(Math.ceil((n - e) / i), 0), r = Array(t), a = 0; a < t; a++, e += i) r[a] = e;
  return r;
}
function us(e, n) {
  if (n == null || n < 1) return [];
  for (var i = [], t = 0, r = e.length; t < r; ) i.push(at.call(e, t, t += n));
  return i;
}
function sa(e, n) {
  return e._chain ? _e(n).chain() : n;
}
function da(e) {
  return Ke(nt(e), function(n) {
    var i = _e[n] = e[n];
    _e.prototype[n] = function() {
      var t = [this._wrapped];
      return As.apply(t, arguments), sa(this, i.apply(_e, t));
    };
  }), _e;
}
Ke(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(e) {
  var n = $t[e];
  _e.prototype[e] = function() {
    var i = this._wrapped;
    return i != null && (n.apply(i, arguments), (e === "shift" || e === "splice") && i.length === 0 && delete i[0]), sa(this, i);
  };
});
Ke(["concat", "join", "slice"], function(e) {
  var n = $t[e];
  _e.prototype[e] = function() {
    var i = this._wrapped;
    return i != null && (i = n.apply(i, arguments)), sa(this, i);
  };
});
const Js = Object.freeze(Object.defineProperty({ __proto__: null, VERSION: Fr, after: Nu, all: zt, allKeys: qn, any: Gt, assign: In, before: Kr, bind: Yr, bindAll: Fu, chain: Eu, chunk: us, clone: du, collect: an, compact: es, compose: Ru, constant: Or, contains: $e, countBy: Qu, create: su, debounce: Bu, default: _e, defaults: Hr, defer: Cu, delay: Zr, detect: tt, difference: ua, drop: wn, each: Ke, escape: yu, every: zt, extend: Vr, extendOwn: In, filter: ln, find: tt, findIndex: ni, findKey: Jr, findLastIndex: ea, findWhere: qu, first: On, flatten: ns, foldl: kn, foldr: Ht, forEach: Ke, functions: nt, get: $r, groupBy: Gu, has: fu, head: On, identity: Zt, include: $e, includes: $e, indexBy: $u, indexOf: ta, initial: oa, inject: kn, intersection: rs, invert: Xr, invoke: Xu, isArguments: Yt, isArray: gn, isArrayBuffer: Rr, isBoolean: Wr, isDataView: et, isDate: Xo, isElement: Po, isEmpty: Ko, isEqual: Jo, isError: Vo, isFinite: $o, isFunction: Ie, isMap: iu, isMatch: Lr, isNaN: kr, isNull: Mo, isNumber: Br, isObject: hn, isRegExp: jo, isSet: au, isString: Qt, isSymbol: Sr, isTypedArray: Ir, isUndefined: Cr, isWeakMap: ru, isWeakSet: cu, iteratee: Jt, keys: Re, last: Ju, lastIndexOf: Lu, map: an, mapObject: gu, matcher: Fn, matches: Fn, max: ia, memoize: Au, methods: nt, min: Vu, mixin: da, negate: ei, noop: Qr, now: Ln, object: cs, omit: Ku, once: ku, pairs: ou, partial: Cn, partition: Yu, pick: ca, pluck: ti, property: Kt, propertyOf: pu, random: Vt, range: os, reduce: kn, reduceRight: Ht, reject: Pu, rest: wn, restArguments: qe, result: Tu, sample: aa, select: ln, shuffle: Hu, size: Zu, some: Gt, sortBy: zu, sortedIndex: na, tail: wn, take: On, tap: lu, template: Uu, templateSettings: xu, throttle: Wu, times: mu, toArray: ra, toPath: zr, transpose: rt, unescape: vu, union: is, uniq: it, unique: it, uniqueId: _u, unzip: rt, values: An, where: ju, without: ts, wrap: Su, zip: as }, Symbol.toStringTag, { value: "Module" }));
var wr = da(Js);
wr._ = wr;
const ed = Object.freeze(Object.defineProperty({ __proto__: null, VERSION: Fr, after: Nu, all: zt, allKeys: qn, any: Gt, assign: In, before: Kr, bind: Yr, bindAll: Fu, chain: Eu, chunk: us, clone: du, collect: an, compact: es, compose: Ru, constant: Or, contains: $e, countBy: Qu, create: su, debounce: Bu, default: wr, defaults: Hr, defer: Cu, delay: Zr, detect: tt, difference: ua, drop: wn, each: Ke, escape: yu, every: zt, extend: Vr, extendOwn: In, filter: ln, find: tt, findIndex: ni, findKey: Jr, findLastIndex: ea, findWhere: qu, first: On, flatten: ns, foldl: kn, foldr: Ht, forEach: Ke, functions: nt, get: $r, groupBy: Gu, has: fu, head: On, identity: Zt, include: $e, includes: $e, indexBy: $u, indexOf: ta, initial: oa, inject: kn, intersection: rs, invert: Xr, invoke: Xu, isArguments: Yt, isArray: gn, isArrayBuffer: Rr, isBoolean: Wr, isDataView: et, isDate: Xo, isElement: Po, isEmpty: Ko, isEqual: Jo, isError: Vo, isFinite: $o, isFunction: Ie, isMap: iu, isMatch: Lr, isNaN: kr, isNull: Mo, isNumber: Br, isObject: hn, isRegExp: jo, isSet: au, isString: Qt, isSymbol: Sr, isTypedArray: Ir, isUndefined: Cr, isWeakMap: ru, isWeakSet: cu, iteratee: Jt, keys: Re, last: Ju, lastIndexOf: Lu, map: an, mapObject: gu, matcher: Fn, matches: Fn, max: ia, memoize: Au, methods: nt, min: Vu, mixin: da, negate: ei, noop: Qr, now: Ln, object: cs, omit: Ku, once: ku, pairs: ou, partial: Cn, partition: Yu, pick: ca, pluck: ti, property: Kt, propertyOf: pu, random: Vt, range: os, reduce: kn, reduceRight: Ht, reject: Pu, rest: wn, restArguments: qe, result: Tu, sample: aa, select: ln, shuffle: Hu, size: Zu, some: Gt, sortBy: zu, sortedIndex: na, tail: wn, take: On, tap: lu, template: Uu, templateSettings: xu, throttle: Wu, times: mu, toArray: ra, toPath: zr, transpose: rt, unescape: vu, union: is, uniq: it, unique: it, uniqueId: _u, unzip: rt, values: An, where: ju, without: ts, wrap: Su, zip: as }, Symbol.toStringTag, { value: "Module" })), Be = _s(ed);
var st = {}, Ge = {}, vi = { exports: {} }, dt = { exports: {} }, wa;
function Pn() {
  if (wa) return dt.exports;
  wa = 1;
  var e = /* @__PURE__ */ (function() {
    return this === void 0;
  })();
  if (e) dt.exports = { freeze: Object.freeze, defineProperty: Object.defineProperty, getDescriptor: Object.getOwnPropertyDescriptor, keys: Object.keys, names: Object.getOwnPropertyNames, getPrototypeOf: Object.getPrototypeOf, isArray: Array.isArray, isES5: e, propertyIsWritable: function(h, g) {
    var f = Object.getOwnPropertyDescriptor(h, g);
    return !!(!f || f.writable || f.set);
  } };
  else {
    var n = {}.hasOwnProperty, i = {}.toString, t = {}.constructor.prototype, r = function(h) {
      var g = [];
      for (var f in h) n.call(h, f) && g.push(f);
      return g;
    }, a = function(h, g) {
      return { value: h[g] };
    }, c = function(h, g, f) {
      return h[g] = f.value, h;
    }, o = function(h) {
      return h;
    }, u = function(h) {
      try {
        return Object(h).constructor.prototype;
      } catch {
        return t;
      }
    }, s = function(h) {
      try {
        return i.call(h) === "[object Array]";
      } catch {
        return false;
      }
    };
    dt.exports = { isArray: s, keys: r, names: r, defineProperty: c, getDescriptor: a, freeze: o, getPrototypeOf: u, isES5: e, propertyIsWritable: function() {
      return true;
    } };
  }
  return dt.exports;
}
var jn, Fa;
function Ae() {
  if (Fa) return jn;
  Fa = 1;
  var e = {}, n = Pn(), i = typeof navigator > "u", t = { e: {} }, r, a = typeof self < "u" ? self : typeof window < "u" ? window : typeof Xt < "u" ? Xt : jn !== void 0 ? jn : null;
  function c() {
    try {
      var I = r;
      return r = null, I.apply(this, arguments);
    } catch (K) {
      return t.e = K, t;
    }
  }
  function o(I) {
    return r = I, c;
  }
  var u = function(I, K) {
    var ie = {}.hasOwnProperty;
    function re() {
      this.constructor = I, this.constructor$ = K;
      for (var ee in K.prototype) ie.call(K.prototype, ee) && ee.charAt(ee.length - 1) !== "$" && (this[ee + "$"] = K.prototype[ee]);
    }
    return re.prototype = K.prototype, I.prototype = new re(), I.prototype;
  };
  function s(I) {
    return I == null || I === true || I === false || typeof I == "string" || typeof I == "number";
  }
  function h(I) {
    return typeof I == "function" || typeof I == "object" && I !== null;
  }
  function g(I) {
    return s(I) ? new Error(_(I)) : I;
  }
  function f(I, K) {
    var ie = I.length, re = new Array(ie + 1), ee;
    for (ee = 0; ee < ie; ++ee) re[ee] = I[ee];
    return re[ee] = K, re;
  }
  function m(I, K, ie) {
    if (n.isES5) {
      var re = Object.getOwnPropertyDescriptor(I, K);
      if (re != null) return re.get == null && re.set == null ? re.value : ie;
    } else return {}.hasOwnProperty.call(I, K) ? I[K] : void 0;
  }
  function D(I, K, ie) {
    if (s(I)) return I;
    var re = { value: ie, configurable: true, enumerable: false, writable: true };
    return n.defineProperty(I, K, re), I;
  }
  function b(I) {
    throw I;
  }
  var d = (function() {
    var I = [Array.prototype, Object.prototype, Function.prototype], K = function(ee) {
      for (var de = 0; de < I.length; ++de) if (I[de] === ee) return true;
      return false;
    };
    if (n.isES5) {
      var ie = Object.getOwnPropertyNames;
      return function(ee) {
        for (var de = [], De = /* @__PURE__ */ Object.create(null); ee != null && !K(ee); ) {
          var he;
          try {
            he = ie(ee);
          } catch {
            return de;
          }
          for (var ve = 0; ve < he.length; ++ve) {
            var Fe = he[ve];
            if (!De[Fe]) {
              De[Fe] = true;
              var Se = Object.getOwnPropertyDescriptor(ee, Fe);
              Se != null && Se.get == null && Se.set == null && de.push(Fe);
            }
          }
          ee = n.getPrototypeOf(ee);
        }
        return de;
      };
    } else {
      var re = {}.hasOwnProperty;
      return function(ee) {
        if (K(ee)) return [];
        var de = [];
        e: for (var De in ee) if (re.call(ee, De)) de.push(De);
        else {
          for (var he = 0; he < I.length; ++he) if (re.call(I[he], De)) continue e;
          de.push(De);
        }
        return de;
      };
    }
  })(), p = /this\s*\.\s*\S+\s*=/;
  function l(I) {
    try {
      if (typeof I == "function") {
        var K = n.names(I.prototype), ie = n.isES5 && K.length > 1, re = K.length > 0 && !(K.length === 1 && K[0] === "constructor"), ee = p.test(I + "") && n.names(I).length > 0;
        if (ie || re || ee) return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  function y(I) {
    return I;
  }
  var w = /^[a-z$_][a-z$_0-9]*$/i;
  function T(I) {
    return w.test(I);
  }
  function x(I, K, ie) {
    for (var re = new Array(I), ee = 0; ee < I; ++ee) re[ee] = K + ee + ie;
    return re;
  }
  function _(I) {
    try {
      return I + "";
    } catch {
      return "[no string representation]";
    }
  }
  function C(I) {
    return I !== null && typeof I == "object" && typeof I.message == "string" && typeof I.name == "string";
  }
  function E(I) {
    try {
      D(I, "isOperational", true);
    } catch {
    }
  }
  function S(I) {
    return I == null ? false : I instanceof Error.__BluebirdErrorTypes__.OperationalError || I.isOperational === true;
  }
  function X(I) {
    return C(I) && n.propertyIsWritable(I, "stack");
  }
  var A = (function() {
    return "stack" in new Error() ? function(I) {
      return X(I) ? I : new Error(_(I));
    } : function(I) {
      if (X(I)) return I;
      try {
        throw new Error(_(I));
      } catch (K) {
        return K;
      }
    };
  })();
  function R(I) {
    return {}.toString.call(I);
  }
  function M(I, K, ie) {
    for (var re = n.names(I), ee = 0; ee < re.length; ++ee) {
      var de = re[ee];
      if (ie(de)) try {
        n.defineProperty(K, de, n.getDescriptor(I, de));
      } catch {
      }
    }
  }
  var H = function(I) {
    return n.isArray(I) ? I : null;
  };
  if (typeof Symbol < "u" && Symbol.iterator) {
    var F = typeof Array.from == "function" ? function(I) {
      return Array.from(I);
    } : function(I) {
      for (var K = [], ie = I[Symbol.iterator](), re; !(re = ie.next()).done; ) K.push(re.value);
      return K;
    };
    H = function(I) {
      return n.isArray(I) ? I : I != null && typeof I[Symbol.iterator] == "function" ? F(I) : null;
    };
  }
  var B = typeof Ve < "u" && R(Ve).toLowerCase() === "[object process]", O = typeof Ve < "u" && typeof e < "u";
  function P(I) {
    return O ? e[I] : void 0;
  }
  function z() {
    if (typeof Promise == "function") try {
      var I = new Promise(function() {
      });
      if ({}.toString.call(I) === "[object Promise]") return Promise;
    } catch {
    }
  }
  function j(I, K) {
    return I.bind(K);
  }
  var te = { isClass: l, isIdentifier: T, inheritedDataKeys: d, getDataPropertyOrDefault: m, thrower: b, isArray: n.isArray, asArray: H, notEnumerableProp: D, isPrimitive: s, isObject: h, isError: C, canEvaluate: i, errorObj: t, tryCatch: o, inherits: u, withAppended: f, maybeWrapAsError: g, toFastProperties: y, filledRange: x, toString: _, canAttachTrace: X, ensureErrorObject: A, originatesFromRejection: S, markAsOriginatingFromRejection: E, classString: R, copyDescriptors: M, hasDevTools: typeof chrome < "u" && chrome && typeof chrome.loadTimes == "function", isNode: B, hasEnvVariables: O, env: P, global: a, getNativePromise: z, domainBind: j };
  te.isRecentNode = te.isNode && (function() {
    var I = Ve.versions.node.split(".").map(Number);
    return I[0] === 0 && I[1] > 10 || I[0] > 0;
  })(), te.isNode && te.toFastProperties(Ve);
  try {
    throw new Error();
  } catch (I) {
    te.lastLineError = I;
  }
  return jn = te, jn;
}
var lt = { exports: {} }, xi, Aa;
function nd() {
  if (Aa) return xi;
  Aa = 1;
  var e = Ae(), n, i = function() {
    throw new Error(`No async scheduler available

    See http://goo.gl/MqrFmX
`);
  }, t = e.getNativePromise();
  if (e.isNode && typeof MutationObserver > "u") {
    var r = Xt.setImmediate, a = Ve.nextTick;
    n = e.isRecentNode ? function(o) {
      r.call(Xt, o);
    } : function(o) {
      a.call(Ve, o);
    };
  } else if (typeof t == "function" && typeof t.resolve == "function") {
    var c = t.resolve();
    n = function(o) {
      c.then(o);
    };
  } else typeof MutationObserver < "u" && !(typeof window < "u" && window.navigator && (window.navigator.standalone || window.cordova)) ? n = (function() {
    var o = document.createElement("div"), u = { attributes: true }, s = false, h = document.createElement("div"), g = new MutationObserver(function() {
      o.classList.toggle("foo"), s = false;
    });
    g.observe(h, u);
    var f = function() {
      s || (s = true, h.classList.toggle("foo"));
    };
    return function(D) {
      var b = new MutationObserver(function() {
        b.disconnect(), D();
      });
      b.observe(o, u), f();
    };
  })() : typeof setImmediate < "u" ? n = function(o) {
    setImmediate(o);
  } : typeof setTimeout < "u" ? n = function(o) {
    setTimeout(o, 0);
  } : n = i;
  return xi = n, xi;
}
var Ui, Ca;
function td() {
  if (Ca) return Ui;
  Ca = 1;
  function e(i, t, r, a, c) {
    for (var o = 0; o < c; ++o) r[o + a] = i[o + t], i[o + t] = void 0;
  }
  function n(i) {
    this._capacity = i, this._length = 0, this._front = 0;
  }
  return n.prototype._willBeOverCapacity = function(i) {
    return this._capacity < i;
  }, n.prototype._pushOne = function(i) {
    var t = this.length();
    this._checkCapacity(t + 1);
    var r = this._front + t & this._capacity - 1;
    this[r] = i, this._length = t + 1;
  }, n.prototype.push = function(i, t, r) {
    var a = this.length() + 3;
    if (this._willBeOverCapacity(a)) {
      this._pushOne(i), this._pushOne(t), this._pushOne(r);
      return;
    }
    var c = this._front + a - 3;
    this._checkCapacity(a);
    var o = this._capacity - 1;
    this[c + 0 & o] = i, this[c + 1 & o] = t, this[c + 2 & o] = r, this._length = a;
  }, n.prototype.shift = function() {
    var i = this._front, t = this[i];
    return this[i] = void 0, this._front = i + 1 & this._capacity - 1, this._length--, t;
  }, n.prototype.length = function() {
    return this._length;
  }, n.prototype._checkCapacity = function(i) {
    this._capacity < i && this._resizeTo(this._capacity << 1);
  }, n.prototype._resizeTo = function(i) {
    var t = this._capacity;
    this._capacity = i;
    var r = this._front, a = this._length, c = r + a & t - 1;
    e(this, 0, this, t, c);
  }, Ui = n, Ui;
}
var Wa;
function id() {
  if (Wa) return lt.exports;
  Wa = 1;
  var e;
  try {
    throw new Error();
  } catch (u) {
    e = u;
  }
  var n = nd(), i = td(), t = Ae();
  function r() {
    this._customScheduler = false, this._isTickUsed = false, this._lateQueue = new i(16), this._normalQueue = new i(16), this._haveDrainedQueues = false, this._trampolineEnabled = true;
    var u = this;
    this.drainQueues = function() {
      u._drainQueues();
    }, this._schedule = n;
  }
  r.prototype.setScheduler = function(u) {
    var s = this._schedule;
    return this._schedule = u, this._customScheduler = true, s;
  }, r.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
  }, r.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
  }, r.prototype.disableTrampolineIfNecessary = function() {
    t.hasDevTools && (this._trampolineEnabled = false);
  }, r.prototype.haveItemsQueued = function() {
    return this._isTickUsed || this._haveDrainedQueues;
  }, r.prototype.fatalError = function(u, s) {
    s ? (Ve.stderr.write("Fatal " + (u instanceof Error ? u.stack : u) + `
`), Ve.exit(2)) : this.throwLater(u);
  }, r.prototype.throwLater = function(u, s) {
    if (arguments.length === 1 && (s = u, u = function() {
      throw s;
    }), typeof setTimeout < "u") setTimeout(function() {
      u(s);
    }, 0);
    else try {
      this._schedule(function() {
        u(s);
      });
    } catch {
      throw new Error(`No async scheduler available

    See http://goo.gl/MqrFmX
`);
    }
  };
  function a(u, s, h) {
    this._lateQueue.push(u, s, h), this._queueTick();
  }
  function c(u, s, h) {
    this._normalQueue.push(u, s, h), this._queueTick();
  }
  function o(u) {
    this._normalQueue._pushOne(u), this._queueTick();
  }
  return t.hasDevTools ? (r.prototype.invokeLater = function(u, s, h) {
    this._trampolineEnabled ? a.call(this, u, s, h) : this._schedule(function() {
      setTimeout(function() {
        u.call(s, h);
      }, 100);
    });
  }, r.prototype.invoke = function(u, s, h) {
    this._trampolineEnabled ? c.call(this, u, s, h) : this._schedule(function() {
      u.call(s, h);
    });
  }, r.prototype.settlePromises = function(u) {
    this._trampolineEnabled ? o.call(this, u) : this._schedule(function() {
      u._settlePromises();
    });
  }) : (r.prototype.invokeLater = a, r.prototype.invoke = c, r.prototype.settlePromises = o), r.prototype._drainQueue = function(u) {
    for (; u.length() > 0; ) {
      var s = u.shift();
      if (typeof s != "function") {
        s._settlePromises();
        continue;
      }
      var h = u.shift(), g = u.shift();
      s.call(h, g);
    }
  }, r.prototype._drainQueues = function() {
    this._drainQueue(this._normalQueue), this._reset(), this._haveDrainedQueues = true, this._drainQueue(this._lateQueue);
  }, r.prototype._queueTick = function() {
    this._isTickUsed || (this._isTickUsed = true, this._schedule(this.drainQueues));
  }, r.prototype._reset = function() {
    this._isTickUsed = false;
  }, lt.exports = r, lt.exports.firstLineError = e, lt.exports;
}
var Ti, Ba;
function fn() {
  if (Ba) return Ti;
  Ba = 1;
  var e = Pn(), n = e.freeze, i = Ae(), t = i.inherits, r = i.notEnumerableProp;
  function a(p, l) {
    function y(w) {
      if (!(this instanceof y)) return new y(w);
      r(this, "message", typeof w == "string" ? w : l), r(this, "name", p), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : Error.call(this);
    }
    return t(y, Error), y;
  }
  var c, o, u = a("Warning", "warning"), s = a("CancellationError", "cancellation error"), h = a("TimeoutError", "timeout error"), g = a("AggregateError", "aggregate error");
  try {
    c = TypeError, o = RangeError;
  } catch {
    c = a("TypeError", "type error"), o = a("RangeError", "range error");
  }
  for (var f = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" "), m = 0; m < f.length; ++m) typeof Array.prototype[f[m]] == "function" && (g.prototype[f[m]] = Array.prototype[f[m]]);
  e.defineProperty(g.prototype, "length", { value: 0, configurable: false, writable: true, enumerable: true }), g.prototype.isOperational = true;
  var D = 0;
  g.prototype.toString = function() {
    var p = Array(D * 4 + 1).join(" "), l = `
` + p + `AggregateError of:
`;
    D++, p = Array(D * 4 + 1).join(" ");
    for (var y = 0; y < this.length; ++y) {
      for (var w = this[y] === this ? "[Circular AggregateError]" : this[y] + "", T = w.split(`
`), x = 0; x < T.length; ++x) T[x] = p + T[x];
      w = T.join(`
`), l += w + `
`;
    }
    return D--, l;
  };
  function b(p) {
    if (!(this instanceof b)) return new b(p);
    r(this, "name", "OperationalError"), r(this, "message", p), this.cause = p, this.isOperational = true, p instanceof Error ? (r(this, "message", p.message), r(this, "stack", p.stack)) : Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
  t(b, Error);
  var d = Error.__BluebirdErrorTypes__;
  return d || (d = n({ CancellationError: s, TimeoutError: h, OperationalError: b, RejectionError: b, AggregateError: g }), e.defineProperty(Error, "__BluebirdErrorTypes__", { value: d, writable: false, enumerable: false, configurable: false })), Ti = { Error, TypeError: c, RangeError: o, CancellationError: d.CancellationError, OperationalError: d.OperationalError, TimeoutError: d.TimeoutError, AggregateError: d.AggregateError, Warning: u }, Ti;
}
var _i, Sa;
function rd() {
  return Sa || (Sa = 1, _i = function(e, n) {
    var i = Ae(), t = i.errorObj, r = i.isObject;
    function a(g, f) {
      if (r(g)) {
        if (g instanceof e) return g;
        var m = o(g);
        if (m === t) {
          f && f._pushContext();
          var D = e.reject(m.e);
          return f && f._popContext(), D;
        } else if (typeof m == "function") {
          if (s(g)) {
            var D = new e(n);
            return g._then(D._fulfill, D._reject, void 0, D, null), D;
          }
          return h(g, m, f);
        }
      }
      return g;
    }
    function c(g) {
      return g.then;
    }
    function o(g) {
      try {
        return c(g);
      } catch (f) {
        return t.e = f, t;
      }
    }
    var u = {}.hasOwnProperty;
    function s(g) {
      try {
        return u.call(g, "_promise0");
      } catch {
        return false;
      }
    }
    function h(g, f, m) {
      var D = new e(n), b = D;
      m && m._pushContext(), D._captureStackTrace(), m && m._popContext();
      var d = true, p = i.tryCatch(f).call(g, l, y);
      d = false, D && p === t && (D._rejectCallback(p.e, true, true), D = null);
      function l(w) {
        D && (D._resolveCallback(w), D = null);
      }
      function y(w) {
        D && (D._rejectCallback(w, d, true), D = null);
      }
      return b;
    }
    return a;
  }), _i;
}
var Ei, Ra;
function ad() {
  return Ra || (Ra = 1, Ei = function(e, n, i, t, r) {
    var a = Ae();
    a.isArray;
    function c(u) {
      switch (u) {
        case -2:
          return [];
        case -3:
          return {};
      }
    }
    function o(u) {
      var s = this._promise = new e(n);
      u instanceof e && s._propagateFrom(u, 3), s._setOnCancel(this), this._values = u, this._length = 0, this._totalResolved = 0, this._init(void 0, -2);
    }
    return a.inherits(o, r), o.prototype.length = function() {
      return this._length;
    }, o.prototype.promise = function() {
      return this._promise;
    }, o.prototype._init = function u(s, h) {
      var g = i(this._values, this._promise);
      if (g instanceof e) {
        g = g._target();
        var f = g._bitField;
        if (this._values = g, (f & 50397184) === 0) return this._promise._setAsyncGuaranteed(), g._then(u, this._reject, void 0, this, h);
        if ((f & 33554432) !== 0) g = g._value();
        else return (f & 16777216) !== 0 ? this._reject(g._reason()) : this._cancel();
      }
      if (g = a.asArray(g), g === null) {
        var m = t("expecting an array or an iterable object but got " + a.classString(g)).reason();
        this._promise._rejectCallback(m, false);
        return;
      }
      if (g.length === 0) {
        h === -5 ? this._resolveEmptyArray() : this._resolve(c(h));
        return;
      }
      this._iterate(g);
    }, o.prototype._iterate = function(u) {
      var s = this.getActualLength(u.length);
      this._length = s, this._values = this.shouldCopyValues() ? new Array(s) : this._values;
      for (var h = this._promise, g = false, f = null, m = 0; m < s; ++m) {
        var D = i(u[m], h);
        D instanceof e ? (D = D._target(), f = D._bitField) : f = null, g ? f !== null && D.suppressUnhandledRejections() : f !== null ? (f & 50397184) === 0 ? (D._proxy(this, m), this._values[m] = D) : (f & 33554432) !== 0 ? g = this._promiseFulfilled(D._value(), m) : (f & 16777216) !== 0 ? g = this._promiseRejected(D._reason(), m) : g = this._promiseCancelled(m) : g = this._promiseFulfilled(D, m);
      }
      g || h._setAsyncGuaranteed();
    }, o.prototype._isResolved = function() {
      return this._values === null;
    }, o.prototype._resolve = function(u) {
      this._values = null, this._promise._fulfill(u);
    }, o.prototype._cancel = function() {
      this._isResolved() || !this._promise._isCancellable() || (this._values = null, this._promise._cancel());
    }, o.prototype._reject = function(u) {
      this._values = null, this._promise._rejectCallback(u, false);
    }, o.prototype._promiseFulfilled = function(u, s) {
      this._values[s] = u;
      var h = ++this._totalResolved;
      return h >= this._length ? (this._resolve(this._values), true) : false;
    }, o.prototype._promiseCancelled = function() {
      return this._cancel(), true;
    }, o.prototype._promiseRejected = function(u) {
      return this._totalResolved++, this._reject(u), true;
    }, o.prototype._resultCancelled = function() {
      if (!this._isResolved()) {
        var u = this._values;
        if (this._cancel(), u instanceof e) u.cancel();
        else for (var s = 0; s < u.length; ++s) u[s] instanceof e && u[s].cancel();
      }
    }, o.prototype.shouldCopyValues = function() {
      return true;
    }, o.prototype.getActualLength = function(u) {
      return u;
    }, o;
  }), Ei;
}
var wi, Na;
function cd() {
  return Na || (Na = 1, wi = function(e) {
    var n = false, i = [];
    e.prototype._promiseCreated = function() {
    }, e.prototype._pushContext = function() {
    }, e.prototype._popContext = function() {
      return null;
    }, e._peekContext = e.prototype._peekContext = function() {
    };
    function t() {
      this._trace = new t.CapturedTrace(a());
    }
    t.prototype._pushContext = function() {
      this._trace !== void 0 && (this._trace._promiseCreated = null, i.push(this._trace));
    }, t.prototype._popContext = function() {
      if (this._trace !== void 0) {
        var c = i.pop(), o = c._promiseCreated;
        return c._promiseCreated = null, o;
      }
      return null;
    };
    function r() {
      if (n) return new t();
    }
    function a() {
      var c = i.length - 1;
      if (c >= 0) return i[c];
    }
    return t.CapturedTrace = null, t.create = r, t.deactivateLongStackTraces = function() {
    }, t.activateLongStackTraces = function() {
      var c = e.prototype._pushContext, o = e.prototype._popContext, u = e._peekContext, s = e.prototype._peekContext, h = e.prototype._promiseCreated;
      t.deactivateLongStackTraces = function() {
        e.prototype._pushContext = c, e.prototype._popContext = o, e._peekContext = u, e.prototype._peekContext = s, e.prototype._promiseCreated = h, n = false;
      }, n = true, e.prototype._pushContext = t.prototype._pushContext, e.prototype._popContext = t.prototype._popContext, e._peekContext = e.prototype._peekContext = a, e.prototype._promiseCreated = function() {
        var g = this._peekContext();
        g && g._promiseCreated == null && (g._promiseCreated = this);
      };
    }, t;
  }), wi;
}
var Fi, ka;
function od() {
  return ka || (ka = 1, Fi = function(e, n) {
    var i = e._getDomain, t = e._async, r = fn().Warning, a = Ae(), c = a.canAttachTrace, o, u, s = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/, h = /\((?:timers\.js):\d+:\d+\)/, g = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/, f = null, m = null, D = false, b, d = !!(a.env("BLUEBIRD_DEBUG") != 0 && (a.env("BLUEBIRD_DEBUG") || a.env("NODE_ENV") === "development")), p = !!(a.env("BLUEBIRD_WARNINGS") != 0 && (d || a.env("BLUEBIRD_WARNINGS"))), l = !!(a.env("BLUEBIRD_LONG_STACK_TRACES") != 0 && (d || a.env("BLUEBIRD_LONG_STACK_TRACES"))), y = a.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 && (p || !!a.env("BLUEBIRD_W_FORGOTTEN_RETURN"));
    e.prototype.suppressUnhandledRejections = function() {
      var N = this._target();
      N._bitField = N._bitField & -1048577 | 524288;
    }, e.prototype._ensurePossibleRejectionHandled = function() {
      (this._bitField & 524288) === 0 && (this._setRejectionIsUnhandled(), t.invokeLater(this._notifyUnhandledRejection, this, void 0));
    }, e.prototype._notifyUnhandledRejectionIsHandled = function() {
      Fe("rejectionHandled", o, void 0, this);
    }, e.prototype._setReturnedNonUndefined = function() {
      this._bitField = this._bitField | 268435456;
    }, e.prototype._returnedNonUndefined = function() {
      return (this._bitField & 268435456) !== 0;
    }, e.prototype._notifyUnhandledRejection = function() {
      if (this._isRejectionUnhandled()) {
        var N = this._settledValue();
        this._setUnhandledRejectionIsNotified(), Fe("unhandledRejection", u, N, this);
      }
    }, e.prototype._setUnhandledRejectionIsNotified = function() {
      this._bitField = this._bitField | 262144;
    }, e.prototype._unsetUnhandledRejectionIsNotified = function() {
      this._bitField = this._bitField & -262145;
    }, e.prototype._isUnhandledRejectionNotified = function() {
      return (this._bitField & 262144) > 0;
    }, e.prototype._setRejectionIsUnhandled = function() {
      this._bitField = this._bitField | 1048576;
    }, e.prototype._unsetRejectionIsUnhandled = function() {
      this._bitField = this._bitField & -1048577, this._isUnhandledRejectionNotified() && (this._unsetUnhandledRejectionIsNotified(), this._notifyUnhandledRejectionIsHandled());
    }, e.prototype._isRejectionUnhandled = function() {
      return (this._bitField & 1048576) > 0;
    }, e.prototype._warn = function(N, L, $) {
      return K(N, L, $ || this);
    }, e.onPossiblyUnhandledRejection = function(N) {
      var L = i();
      u = typeof N == "function" ? L === null ? N : a.domainBind(L, N) : void 0;
    }, e.onUnhandledRejectionHandled = function(N) {
      var L = i();
      o = typeof N == "function" ? L === null ? N : a.domainBind(L, N) : void 0;
    };
    var w = function() {
    };
    e.longStackTraces = function() {
      if (t.haveItemsQueued() && !ce.longStackTraces) throw new Error(`cannot enable long stack traces after promises have been created

    See http://goo.gl/MqrFmX
`);
      if (!ce.longStackTraces && J()) {
        var N = e.prototype._captureStackTrace, L = e.prototype._attachExtraTrace;
        ce.longStackTraces = true, w = function() {
          if (t.haveItemsQueued() && !ce.longStackTraces) throw new Error(`cannot enable long stack traces after promises have been created

    See http://goo.gl/MqrFmX
`);
          e.prototype._captureStackTrace = N, e.prototype._attachExtraTrace = L, n.deactivateLongStackTraces(), t.enableTrampoline(), ce.longStackTraces = false;
        }, e.prototype._captureStackTrace = z, e.prototype._attachExtraTrace = j, n.activateLongStackTraces(), t.disableTrampolineIfNecessary();
      }
    }, e.hasLongStackTraces = function() {
      return ce.longStackTraces && J();
    };
    var T = (function() {
      try {
        if (typeof CustomEvent == "function") {
          var N = new CustomEvent("CustomEvent");
          return a.global.dispatchEvent(N), function(L, $) {
            var Q = new CustomEvent(L.toLowerCase(), { detail: $, cancelable: true });
            return !a.global.dispatchEvent(Q);
          };
        } else if (typeof Event == "function") {
          var N = new Event("CustomEvent");
          return a.global.dispatchEvent(N), function($, Q) {
            var ae = new Event($.toLowerCase(), { cancelable: true });
            return ae.detail = Q, !a.global.dispatchEvent(ae);
          };
        } else {
          var N = document.createEvent("CustomEvent");
          return N.initCustomEvent("testingtheevent", false, true, {}), a.global.dispatchEvent(N), function($, Q) {
            var ae = document.createEvent("CustomEvent");
            return ae.initCustomEvent($.toLowerCase(), false, true, Q), !a.global.dispatchEvent(ae);
          };
        }
      } catch {
      }
      return function() {
        return false;
      };
    })(), x = (function() {
      return a.isNode ? function() {
        return Ve.emit.apply(Ve, arguments);
      } : a.global ? function(N) {
        var L = "on" + N.toLowerCase(), $ = a.global[L];
        return $ ? ($.apply(a.global, [].slice.call(arguments, 1)), true) : false;
      } : function() {
        return false;
      };
    })();
    function _(N, L) {
      return { promise: L };
    }
    var C = { promiseCreated: _, promiseFulfilled: _, promiseRejected: _, promiseResolved: _, promiseCancelled: _, promiseChained: function(N, L, $) {
      return { promise: L, child: $ };
    }, warning: function(N, L) {
      return { warning: L };
    }, unhandledRejection: function(N, L, $) {
      return { reason: L, promise: $ };
    }, rejectionHandled: _ }, E = function(N) {
      var L = false;
      try {
        L = x.apply(null, arguments);
      } catch (Q) {
        t.throwLater(Q), L = true;
      }
      var $ = false;
      try {
        $ = T(N, C[N].apply(null, arguments));
      } catch (Q) {
        t.throwLater(Q), $ = true;
      }
      return $ || L;
    };
    e.config = function(N) {
      if (N = Object(N), "longStackTraces" in N && (N.longStackTraces ? e.longStackTraces() : !N.longStackTraces && e.hasLongStackTraces() && w()), "warnings" in N) {
        var L = N.warnings;
        ce.warnings = !!L, y = ce.warnings, a.isObject(L) && "wForgottenReturn" in L && (y = !!L.wForgottenReturn);
      }
      if ("cancellation" in N && N.cancellation && !ce.cancellation) {
        if (t.haveItemsQueued()) throw new Error("cannot enable cancellation after promises are in use");
        e.prototype._clearCancellationData = H, e.prototype._propagateFrom = F, e.prototype._onCancel = R, e.prototype._setOnCancel = M, e.prototype._attachCancellationCallback = A, e.prototype._execute = X, O = F, ce.cancellation = true;
      }
      return "monitoring" in N && (N.monitoring && !ce.monitoring ? (ce.monitoring = true, e.prototype._fireEvent = E) : !N.monitoring && ce.monitoring && (ce.monitoring = false, e.prototype._fireEvent = S)), e;
    };
    function S() {
      return false;
    }
    e.prototype._fireEvent = S, e.prototype._execute = function(N, L, $) {
      try {
        N(L, $);
      } catch (Q) {
        return Q;
      }
    }, e.prototype._onCancel = function() {
    }, e.prototype._setOnCancel = function(N) {
    }, e.prototype._attachCancellationCallback = function(N) {
    }, e.prototype._captureStackTrace = function() {
    }, e.prototype._attachExtraTrace = function() {
    }, e.prototype._clearCancellationData = function() {
    }, e.prototype._propagateFrom = function(N, L) {
    };
    function X(N, L, $) {
      var Q = this;
      try {
        N(L, $, function(ae) {
          if (typeof ae != "function") throw new TypeError("onCancel must be a function, got: " + a.toString(ae));
          Q._attachCancellationCallback(ae);
        });
      } catch (ae) {
        return ae;
      }
    }
    function A(N) {
      if (!this._isCancellable()) return this;
      var L = this._onCancel();
      L !== void 0 ? a.isArray(L) ? L.push(N) : this._setOnCancel([L, N]) : this._setOnCancel(N);
    }
    function R() {
      return this._onCancelField;
    }
    function M(N) {
      this._onCancelField = N;
    }
    function H() {
      this._cancellationParent = void 0, this._onCancelField = void 0;
    }
    function F(N, L) {
      if ((L & 1) !== 0) {
        this._cancellationParent = N;
        var $ = N._branchesRemainingToCancel;
        $ === void 0 && ($ = 0), N._branchesRemainingToCancel = $ + 1;
      }
      (L & 2) !== 0 && N._isBound() && this._setBoundTo(N._boundTo);
    }
    function B(N, L) {
      (L & 2) !== 0 && N._isBound() && this._setBoundTo(N._boundTo);
    }
    var O = B;
    function P() {
      var N = this._boundTo;
      return N !== void 0 && N instanceof e ? N.isFulfilled() ? N.value() : void 0 : N;
    }
    function z() {
      this._trace = new ye(this._peekContext());
    }
    function j(N, L) {
      if (c(N)) {
        var $ = this._trace;
        if ($ !== void 0 && L && ($ = $._parent), $ !== void 0) $.attachExtraTrace(N);
        else if (!N.__stackCleaned__) {
          var Q = he(N);
          a.notEnumerableProp(N, "stack", Q.message + `
` + Q.stack.join(`
`)), a.notEnumerableProp(N, "__stackCleaned__", true);
        }
      }
    }
    function te(N, L, $, Q, ae) {
      if (N === void 0 && L !== null && y) {
        if (ae !== void 0 && ae._returnedNonUndefined() || (Q._bitField & 65535) === 0) return;
        $ && ($ = $ + " ");
        var Ee = "", xe = "";
        if (L._trace) {
          for (var se = L._trace.stack.split(`
`), Ue = de(se), we = Ue.length - 1; we >= 0; --we) {
            var k = Ue[we];
            if (!h.test(k)) {
              var G = k.match(g);
              G && (Ee = "at " + G[1] + ":" + G[2] + ":" + G[3] + " ");
              break;
            }
          }
          if (Ue.length > 0) {
            for (var ne = Ue[0], we = 0; we < se.length; ++we) if (se[we] === ne) {
              we > 0 && (xe = `
` + se[we - 1]);
              break;
            }
          }
        }
        var oe = "a promise was created in a " + $ + "handler " + Ee + "but was not returned from it, see http://goo.gl/rRqMUw" + xe;
        Q._warn(oe, true, L);
      }
    }
    function I(N, L) {
      var $ = N + " is deprecated and will be removed in a future version.";
      return L && ($ += " Use " + L + " instead."), K($);
    }
    function K(N, L, $) {
      if (ce.warnings) {
        var Q = new r(N), ae;
        if (L) $._attachExtraTrace(Q);
        else if (ce.longStackTraces && (ae = e._peekContext())) ae.attachExtraTrace(Q);
        else {
          var Ee = he(Q);
          Q.stack = Ee.message + `
` + Ee.stack.join(`
`);
        }
        E("warning", Q) || ve(Q, "", true);
      }
    }
    function ie(N, L) {
      for (var $ = 0; $ < L.length - 1; ++$) L[$].push("From previous event:"), L[$] = L[$].join(`
`);
      return $ < L.length && (L[$] = L[$].join(`
`)), N + `
` + L.join(`
`);
    }
    function re(N) {
      for (var L = 0; L < N.length; ++L) (N[L].length === 0 || L + 1 < N.length && N[L][0] === N[L + 1][0]) && (N.splice(L, 1), L--);
    }
    function ee(N) {
      for (var L = N[0], $ = 1; $ < N.length; ++$) {
        for (var Q = N[$], ae = L.length - 1, Ee = L[ae], xe = -1, se = Q.length - 1; se >= 0; --se) if (Q[se] === Ee) {
          xe = se;
          break;
        }
        for (var se = xe; se >= 0; --se) {
          var Ue = Q[se];
          if (L[ae] === Ue) L.pop(), ae--;
          else break;
        }
        L = Q;
      }
    }
    function de(N) {
      for (var L = [], $ = 0; $ < N.length; ++$) {
        var Q = N[$], ae = Q === "    (No stack trace)" || f.test(Q), Ee = ae && Y(Q);
        ae && !Ee && (D && Q.charAt(0) !== " " && (Q = "    " + Q), L.push(Q));
      }
      return L;
    }
    function De(N) {
      for (var L = N.stack.replace(/\s+$/g, "").split(`
`), $ = 0; $ < L.length; ++$) {
        var Q = L[$];
        if (Q === "    (No stack trace)" || f.test(Q)) break;
      }
      return $ > 0 && N.name != "SyntaxError" && (L = L.slice($)), L;
    }
    function he(N) {
      var L = N.stack, $ = N.toString();
      return L = typeof L == "string" && L.length > 0 ? De(N) : ["    (No stack trace)"], { message: $, stack: N.name == "SyntaxError" ? L : de(L) };
    }
    function ve(N, L, $) {
      if (typeof console < "u") {
        var Q;
        if (a.isObject(N)) {
          var ae = N.stack;
          Q = L + m(ae, N);
        } else Q = L + String(N);
        typeof b == "function" ? b(Q, $) : (typeof console.log == "function" || typeof console.log == "object") && console.log(Q);
      }
    }
    function Fe(N, L, $, Q) {
      var ae = false;
      try {
        typeof L == "function" && (ae = true, N === "rejectionHandled" ? L(Q) : L($, Q));
      } catch (Ee) {
        t.throwLater(Ee);
      }
      N === "unhandledRejection" ? !E(N, $, Q) && !ae && ve($, "Unhandled rejection ") : E(N, Q);
    }
    function Se(N) {
      var L;
      if (typeof N == "function") L = "[function " + (N.name || "anonymous") + "]";
      else {
        L = N && typeof N.toString == "function" ? N.toString() : a.toString(N);
        var $ = /\[object [a-zA-Z0-9$_]+\]/;
        if ($.test(L)) try {
          var Q = JSON.stringify(N);
          L = Q;
        } catch {
        }
        L.length === 0 && (L = "(empty array)");
      }
      return "(<" + V(L) + ">, no stack trace)";
    }
    function V(N) {
      var L = 41;
      return N.length < L ? N : N.substr(0, L - 3) + "...";
    }
    function J() {
      return typeof me == "function";
    }
    var Y = function() {
      return false;
    }, ue = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
    function fe(N) {
      var L = N.match(ue);
      if (L) return { fileName: L[1], line: parseInt(L[2], 10) };
    }
    function ge(N, L) {
      if (J()) {
        for (var $ = N.stack.split(`
`), Q = L.stack.split(`
`), ae = -1, Ee = -1, xe, se, Ue = 0; Ue < $.length; ++Ue) {
          var we = fe($[Ue]);
          if (we) {
            xe = we.fileName, ae = we.line;
            break;
          }
        }
        for (var Ue = 0; Ue < Q.length; ++Ue) {
          var we = fe(Q[Ue]);
          if (we) {
            se = we.fileName, Ee = we.line;
            break;
          }
        }
        ae < 0 || Ee < 0 || !xe || !se || xe !== se || ae >= Ee || (Y = function(k) {
          if (s.test(k)) return true;
          var G = fe(k);
          return !!(G && G.fileName === xe && ae <= G.line && G.line <= Ee);
        });
      }
    }
    function ye(N) {
      this._parent = N, this._promisesCreated = 0;
      var L = this._length = 1 + (N === void 0 ? 0 : N._length);
      me(this, ye), L > 32 && this.uncycle();
    }
    a.inherits(ye, Error), n.CapturedTrace = ye, ye.prototype.uncycle = function() {
      var N = this._length;
      if (!(N < 2)) {
        for (var L = [], $ = {}, Q = 0, ae = this; ae !== void 0; ++Q) L.push(ae), ae = ae._parent;
        N = this._length = Q;
        for (var Q = N - 1; Q >= 0; --Q) {
          var Ee = L[Q].stack;
          $[Ee] === void 0 && ($[Ee] = Q);
        }
        for (var Q = 0; Q < N; ++Q) {
          var xe = L[Q].stack, se = $[xe];
          if (se !== void 0 && se !== Q) {
            se > 0 && (L[se - 1]._parent = void 0, L[se - 1]._length = 1), L[Q]._parent = void 0, L[Q]._length = 1;
            var Ue = Q > 0 ? L[Q - 1] : this;
            se < N - 1 ? (Ue._parent = L[se + 1], Ue._parent.uncycle(), Ue._length = Ue._parent._length + 1) : (Ue._parent = void 0, Ue._length = 1);
            for (var we = Ue._length + 1, k = Q - 2; k >= 0; --k) L[k]._length = we, we++;
            return;
          }
        }
      }
    }, ye.prototype.attachExtraTrace = function(N) {
      if (!N.__stackCleaned__) {
        this.uncycle();
        for (var L = he(N), $ = L.message, Q = [L.stack], ae = this; ae !== void 0; ) Q.push(de(ae.stack.split(`
`))), ae = ae._parent;
        ee(Q), re(Q), a.notEnumerableProp(N, "stack", ie($, Q)), a.notEnumerableProp(N, "__stackCleaned__", true);
      }
    };
    var me = (function() {
      var L = /^\s*at\s*/, $ = function(xe, se) {
        return typeof xe == "string" ? xe : se.name !== void 0 && se.message !== void 0 ? se.toString() : Se(se);
      };
      if (typeof Error.stackTraceLimit == "number" && typeof Error.captureStackTrace == "function") {
        Error.stackTraceLimit += 6, f = L, m = $;
        var Q = Error.captureStackTrace;
        return Y = function(xe) {
          return s.test(xe);
        }, function(xe, se) {
          Error.stackTraceLimit += 6, Q(xe, se), Error.stackTraceLimit -= 6;
        };
      }
      var ae = new Error();
      if (typeof ae.stack == "string" && ae.stack.split(`
`)[0].indexOf("stackDetection@") >= 0) return f = /@/, m = $, D = true, function(se) {
        se.stack = new Error().stack;
      };
      var Ee;
      try {
        throw new Error();
      } catch (xe) {
        Ee = "stack" in xe;
      }
      return !("stack" in ae) && Ee && typeof Error.stackTraceLimit == "number" ? (f = L, m = $, function(se) {
        Error.stackTraceLimit += 6;
        try {
          throw new Error();
        } catch (Ue) {
          se.stack = Ue.stack;
        }
        Error.stackTraceLimit -= 6;
      }) : (m = function(xe, se) {
        return typeof xe == "string" ? xe : (typeof se == "object" || typeof se == "function") && se.name !== void 0 && se.message !== void 0 ? se.toString() : Se(se);
      }, null);
    })();
    typeof console < "u" && typeof console.warn < "u" && (b = function(N) {
      console.warn(N);
    }, a.isNode && Ve.stderr.isTTY ? b = function(N, L) {
      var $ = L ? "\x1B[33m" : "\x1B[31m";
      console.warn($ + N + `\x1B[0m
`);
    } : !a.isNode && typeof new Error().stack == "string" && (b = function(N, L) {
      console.warn("%c" + N, L ? "color: darkorange" : "color: red");
    }));
    var ce = { warnings: p, longStackTraces: false, cancellation: false, monitoring: false };
    return l && e.longStackTraces(), { longStackTraces: function() {
      return ce.longStackTraces;
    }, warnings: function() {
      return ce.warnings;
    }, cancellation: function() {
      return ce.cancellation;
    }, monitoring: function() {
      return ce.monitoring;
    }, propagateFromFunction: function() {
      return O;
    }, boundValueFunction: function() {
      return P;
    }, checkForgottenReturns: te, setBounds: ge, warn: K, deprecated: I, CapturedTrace: ye, fireDomEvent: T, fireGlobalEvent: x };
  }), Fi;
}
var Ai, Oa;
function ud() {
  return Oa || (Oa = 1, Ai = function(e, n) {
    var i = Ae(), t = e.CancellationError, r = i.errorObj;
    function a(g, f, m) {
      this.promise = g, this.type = f, this.handler = m, this.called = false, this.cancelPromise = null;
    }
    a.prototype.isFinallyHandler = function() {
      return this.type === 0;
    };
    function c(g) {
      this.finallyHandler = g;
    }
    c.prototype._resultCancelled = function() {
      o(this.finallyHandler);
    };
    function o(g, f) {
      return g.cancelPromise != null ? (arguments.length > 1 ? g.cancelPromise._reject(f) : g.cancelPromise._cancel(), g.cancelPromise = null, true) : false;
    }
    function u() {
      return h.call(this, this.promise._target()._settledValue());
    }
    function s(g) {
      if (!o(this, g)) return r.e = g, r;
    }
    function h(g) {
      var f = this.promise, m = this.handler;
      if (!this.called) {
        this.called = true;
        var D = this.isFinallyHandler() ? m.call(f._boundValue()) : m.call(f._boundValue(), g);
        if (D !== void 0) {
          f._setReturnedNonUndefined();
          var b = n(D, f);
          if (b instanceof e) {
            if (this.cancelPromise != null) if (b._isCancelled()) {
              var d = new t("late cancellation observer");
              return f._attachExtraTrace(d), r.e = d, r;
            } else b.isPending() && b._attachCancellationCallback(new c(this));
            return b._then(u, s, void 0, this, void 0);
          }
        }
      }
      return f.isRejected() ? (o(this), r.e = g, r) : (o(this), g);
    }
    return e.prototype._passThrough = function(g, f, m, D) {
      return typeof g != "function" ? this.then() : this._then(m, D, void 0, new a(this, f, g), void 0);
    }, e.prototype.lastly = e.prototype.finally = function(g) {
      return this._passThrough(g, 0, h, h);
    }, e.prototype.tap = function(g) {
      return this._passThrough(g, 1, h);
    }, a;
  }), Ai;
}
var Ci, Ia;
function sd() {
  return Ia || (Ia = 1, Ci = function(e) {
    var n = Ae(), i = Pn().keys, t = n.tryCatch, r = n.errorObj;
    function a(c, o, u) {
      return function(s) {
        var h = u._boundValue();
        e: for (var g = 0; g < c.length; ++g) {
          var f = c[g];
          if (f === Error || f != null && f.prototype instanceof Error) {
            if (s instanceof f) return t(o).call(h, s);
          } else if (typeof f == "function") {
            var m = t(f).call(h, s);
            if (m === r) return m;
            if (m) return t(o).call(h, s);
          } else if (n.isObject(s)) {
            for (var D = i(f), b = 0; b < D.length; ++b) {
              var d = D[b];
              if (f[d] != s[d]) continue e;
            }
            return t(o).call(h, s);
          }
        }
        return e;
      };
    }
    return a;
  }), Ci;
}
var Wi, La;
function ss() {
  if (La) return Wi;
  La = 1;
  var e = Ae(), n = e.maybeWrapAsError, i = fn(), t = i.OperationalError, r = Pn();
  function a(s) {
    return s instanceof Error && r.getPrototypeOf(s) === Error.prototype;
  }
  var c = /^(?:name|message|stack|cause)$/;
  function o(s) {
    var h;
    if (a(s)) {
      h = new t(s), h.name = s.name, h.message = s.message, h.stack = s.stack;
      for (var g = r.keys(s), f = 0; f < g.length; ++f) {
        var m = g[f];
        c.test(m) || (h[m] = s[m]);
      }
      return h;
    }
    return e.markAsOriginatingFromRejection(s), s;
  }
  function u(s, h) {
    return function(g, f) {
      if (s !== null) {
        if (g) {
          var m = o(n(g));
          s._attachExtraTrace(m), s._reject(m);
        } else if (!h) s._fulfill(f);
        else {
          for (var D = arguments.length, b = new Array(Math.max(D - 1, 0)), d = 1; d < D; ++d) b[d - 1] = arguments[d];
          s._fulfill(b);
        }
        s = null;
      }
    };
  }
  return Wi = u, Wi;
}
var Bi, qa;
function dd() {
  return qa || (qa = 1, Bi = function(e, n, i, t, r) {
    var a = Ae(), c = a.tryCatch;
    e.method = function(o) {
      if (typeof o != "function") throw new e.TypeError("expecting a function but got " + a.classString(o));
      return function() {
        var u = new e(n);
        u._captureStackTrace(), u._pushContext();
        var s = c(o).apply(this, arguments), h = u._popContext();
        return r.checkForgottenReturns(s, h, "Promise.method", u), u._resolveFromSyncValue(s), u;
      };
    }, e.attempt = e.try = function(o) {
      if (typeof o != "function") return t("expecting a function but got " + a.classString(o));
      var u = new e(n);
      u._captureStackTrace(), u._pushContext();
      var s;
      if (arguments.length > 1) {
        r.deprecated("calling Promise.try with more than 1 argument");
        var h = arguments[1], g = arguments[2];
        s = a.isArray(h) ? c(o).apply(g, h) : c(o).call(g, h);
      } else s = c(o)();
      var f = u._popContext();
      return r.checkForgottenReturns(s, f, "Promise.try", u), u._resolveFromSyncValue(s), u;
    }, e.prototype._resolveFromSyncValue = function(o) {
      o === a.errorObj ? this._rejectCallback(o.e, false) : this._resolveCallback(o, true);
    };
  }), Bi;
}
var Si, Ma;
function ld() {
  return Ma || (Ma = 1, Si = function(e, n, i, t) {
    var r = false, a = function(s, h) {
      this._reject(h);
    }, c = function(s, h) {
      h.promiseRejectionQueued = true, h.bindingPromise._then(a, a, null, this, s);
    }, o = function(s, h) {
      (this._bitField & 50397184) === 0 && this._resolveCallback(h.target);
    }, u = function(s, h) {
      h.promiseRejectionQueued || this._reject(s);
    };
    e.prototype.bind = function(s) {
      r || (r = true, e.prototype._propagateFrom = t.propagateFromFunction(), e.prototype._boundValue = t.boundValueFunction());
      var h = i(s), g = new e(n);
      g._propagateFrom(this, 1);
      var f = this._target();
      if (g._setBoundTo(h), h instanceof e) {
        var m = { promiseRejectionQueued: false, promise: g, target: f, bindingPromise: h };
        f._then(n, c, void 0, g, m), h._then(o, u, void 0, g, m), g._setOnCancel(h);
      } else g._resolveCallback(f);
      return g;
    }, e.prototype._setBoundTo = function(s) {
      s !== void 0 ? (this._bitField = this._bitField | 2097152, this._boundTo = s) : this._bitField = this._bitField & -2097153;
    }, e.prototype._isBound = function() {
      return (this._bitField & 2097152) === 2097152;
    }, e.bind = function(s, h) {
      return e.resolve(h).bind(s);
    };
  }), Si;
}
var Ri, Pa;
function fd() {
  return Pa || (Pa = 1, Ri = function(e, n, i, t) {
    var r = Ae(), a = r.tryCatch, c = r.errorObj, o = e._async;
    e.prototype.break = e.prototype.cancel = function() {
      if (!t.cancellation()) return this._warn("cancellation is disabled");
      for (var u = this, s = u; u._isCancellable(); ) {
        if (!u._cancelBy(s)) {
          s._isFollowing() ? s._followee().cancel() : s._cancelBranched();
          break;
        }
        var h = u._cancellationParent;
        if (h == null || !h._isCancellable()) {
          u._isFollowing() ? u._followee().cancel() : u._cancelBranched();
          break;
        } else u._isFollowing() && u._followee().cancel(), u._setWillBeCancelled(), s = u, u = h;
      }
    }, e.prototype._branchHasCancelled = function() {
      this._branchesRemainingToCancel--;
    }, e.prototype._enoughBranchesHaveCancelled = function() {
      return this._branchesRemainingToCancel === void 0 || this._branchesRemainingToCancel <= 0;
    }, e.prototype._cancelBy = function(u) {
      return u === this ? (this._branchesRemainingToCancel = 0, this._invokeOnCancel(), true) : (this._branchHasCancelled(), this._enoughBranchesHaveCancelled() ? (this._invokeOnCancel(), true) : false);
    }, e.prototype._cancelBranched = function() {
      this._enoughBranchesHaveCancelled() && this._cancel();
    }, e.prototype._cancel = function() {
      this._isCancellable() && (this._setCancelled(), o.invoke(this._cancelPromises, this, void 0));
    }, e.prototype._cancelPromises = function() {
      this._length() > 0 && this._settlePromises();
    }, e.prototype._unsetOnCancel = function() {
      this._onCancelField = void 0;
    }, e.prototype._isCancellable = function() {
      return this.isPending() && !this._isCancelled();
    }, e.prototype.isCancellable = function() {
      return this.isPending() && !this.isCancelled();
    }, e.prototype._doInvokeOnCancel = function(u, s) {
      if (r.isArray(u)) for (var h = 0; h < u.length; ++h) this._doInvokeOnCancel(u[h], s);
      else if (u !== void 0) if (typeof u == "function") {
        if (!s) {
          var g = a(u).call(this._boundValue());
          g === c && (this._attachExtraTrace(g.e), o.throwLater(g.e));
        }
      } else u._resultCancelled(this);
    }, e.prototype._invokeOnCancel = function() {
      var u = this._onCancel();
      this._unsetOnCancel(), o.invoke(this._doInvokeOnCancel, this, u);
    }, e.prototype._invokeInternalOnCancel = function() {
      this._isCancellable() && (this._doInvokeOnCancel(this._onCancel(), true), this._unsetOnCancel());
    }, e.prototype._resultCancelled = function() {
      this.cancel();
    };
  }), Ri;
}
var Ni, Xa;
function hd() {
  return Xa || (Xa = 1, Ni = function(e) {
    function n() {
      return this.value;
    }
    function i() {
      throw this.reason;
    }
    e.prototype.return = e.prototype.thenReturn = function(t) {
      return t instanceof e && t.suppressUnhandledRejections(), this._then(n, void 0, void 0, { value: t }, void 0);
    }, e.prototype.throw = e.prototype.thenThrow = function(t) {
      return this._then(i, void 0, void 0, { reason: t }, void 0);
    }, e.prototype.catchThrow = function(t) {
      if (arguments.length <= 1) return this._then(void 0, i, void 0, { reason: t }, void 0);
      var r = arguments[1], a = function() {
        throw r;
      };
      return this.caught(t, a);
    }, e.prototype.catchReturn = function(t) {
      if (arguments.length <= 1) return t instanceof e && t.suppressUnhandledRejections(), this._then(void 0, n, void 0, { value: t }, void 0);
      var r = arguments[1];
      r instanceof e && r.suppressUnhandledRejections();
      var a = function() {
        return r;
      };
      return this.caught(t, a);
    };
  }), Ni;
}
var ki, ja;
function gd() {
  return ja || (ja = 1, ki = function(e) {
    function n(u) {
      u !== void 0 ? (u = u._target(), this._bitField = u._bitField, this._settledValueField = u._isFateSealed() ? u._settledValue() : void 0) : (this._bitField = 0, this._settledValueField = void 0);
    }
    n.prototype._settledValue = function() {
      return this._settledValueField;
    };
    var i = n.prototype.value = function() {
      if (!this.isFulfilled()) throw new TypeError(`cannot get fulfillment value of a non-fulfilled promise

    See http://goo.gl/MqrFmX
`);
      return this._settledValue();
    }, t = n.prototype.error = n.prototype.reason = function() {
      if (!this.isRejected()) throw new TypeError(`cannot get rejection reason of a non-rejected promise

    See http://goo.gl/MqrFmX
`);
      return this._settledValue();
    }, r = n.prototype.isFulfilled = function() {
      return (this._bitField & 33554432) !== 0;
    }, a = n.prototype.isRejected = function() {
      return (this._bitField & 16777216) !== 0;
    }, c = n.prototype.isPending = function() {
      return (this._bitField & 50397184) === 0;
    }, o = n.prototype.isResolved = function() {
      return (this._bitField & 50331648) !== 0;
    };
    n.prototype.isCancelled = function() {
      return (this._bitField & 8454144) !== 0;
    }, e.prototype.__isCancelled = function() {
      return (this._bitField & 65536) === 65536;
    }, e.prototype._isCancelled = function() {
      return this._target().__isCancelled();
    }, e.prototype.isCancelled = function() {
      return (this._target()._bitField & 8454144) !== 0;
    }, e.prototype.isPending = function() {
      return c.call(this._target());
    }, e.prototype.isRejected = function() {
      return a.call(this._target());
    }, e.prototype.isFulfilled = function() {
      return r.call(this._target());
    }, e.prototype.isResolved = function() {
      return o.call(this._target());
    }, e.prototype.value = function() {
      return i.call(this._target());
    }, e.prototype.reason = function() {
      var u = this._target();
      return u._unsetRejectionIsUnhandled(), t.call(u);
    }, e.prototype._value = function() {
      return this._settledValue();
    }, e.prototype._reason = function() {
      return this._unsetRejectionIsUnhandled(), this._settledValue();
    }, e.PromiseInspection = n;
  }), ki;
}
var Oi, Va;
function pd() {
  return Va || (Va = 1, Oi = function(e, n, i, t, r, a) {
    var c = Ae(), o = c.canEvaluate, u = c.tryCatch, s = c.errorObj, h;
    if (o) {
      for (var g = function(l) {
        return new Function("value", "holder", `                             
	            'use strict';                                                    
	            holder.pIndex = value;                                           
	            holder.checkFulfillment(this);                                   
	            `.replace(/Index/g, l));
      }, f = function(l) {
        return new Function("promise", "holder", `                           
	            'use strict';                                                    
	            holder.pIndex = promise;                                         
	            `.replace(/Index/g, l));
      }, m = function(l) {
        for (var y = new Array(l), w = 0; w < y.length; ++w) y[w] = "this.p" + (w + 1);
        var T = y.join(" = ") + " = null;", x = `var promise;
` + y.map(function(S) {
          return `                                                         
	                promise = ` + S + `;                                      
	                if (promise instanceof Promise) {                            
	                    promise.cancel();                                        
	                }                                                            
	            `;
        }).join(`
`), _ = y.join(", "), C = "Holder$" + l, E = `return function(tryCatch, errorObj, Promise, async) {    
	            'use strict';                                                    
	            function [TheName](fn) {                                         
	                [TheProperties]                                              
	                this.fn = fn;                                                
	                this.asyncNeeded = true;                                     
	                this.now = 0;                                                
	            }                                                                
	                                                                             
	            [TheName].prototype._callFunction = function(promise) {          
	                promise._pushContext();                                      
	                var ret = tryCatch(this.fn)([ThePassedArguments]);           
	                promise._popContext();                                       
	                if (ret === errorObj) {                                      
	                    promise._rejectCallback(ret.e, false);                   
	                } else {                                                     
	                    promise._resolveCallback(ret);                           
	                }                                                            
	            };                                                               
	                                                                             
	            [TheName].prototype.checkFulfillment = function(promise) {       
	                var now = ++this.now;                                        
	                if (now === [TheTotal]) {                                    
	                    if (this.asyncNeeded) {                                  
	                        async.invoke(this._callFunction, this, promise);     
	                    } else {                                                 
	                        this._callFunction(promise);                         
	                    }                                                        
	                                                                             
	                }                                                            
	            };                                                               
	                                                                             
	            [TheName].prototype._resultCancelled = function() {              
	                [CancellationCode]                                           
	            };                                                               
	                                                                             
	            return [TheName];                                                
	        }(tryCatch, errorObj, Promise, async);                               
	        `;
        return E = E.replace(/\[TheName\]/g, C).replace(/\[TheTotal\]/g, l).replace(/\[ThePassedArguments\]/g, _).replace(/\[TheProperties\]/g, T).replace(/\[CancellationCode\]/g, x), new Function("tryCatch", "errorObj", "Promise", "async", E)(u, s, e, r);
      }, D = [], b = [], d = [], p = 0; p < 8; ++p) D.push(m(p + 1)), b.push(g(p + 1)), d.push(f(p + 1));
      h = function(l) {
        this._reject(l);
      };
    }
    e.join = function() {
      var l = arguments.length - 1, y;
      if (l > 0 && typeof arguments[l] == "function" && (y = arguments[l], l <= 8 && o)) {
        var M = new e(t);
        M._captureStackTrace();
        for (var w = D[l - 1], T = new w(y), x = b, _ = 0; _ < l; ++_) {
          var C = i(arguments[_], M);
          if (C instanceof e) {
            C = C._target();
            var E = C._bitField;
            (E & 50397184) === 0 ? (C._then(x[_], h, void 0, M, T), d[_](C, T), T.asyncNeeded = false) : (E & 33554432) !== 0 ? x[_].call(M, C._value(), T) : (E & 16777216) !== 0 ? M._reject(C._reason()) : M._cancel();
          } else x[_].call(M, C, T);
        }
        if (!M._isFateSealed()) {
          if (T.asyncNeeded) {
            var S = a();
            S !== null && (T.fn = c.domainBind(S, T.fn));
          }
          M._setAsyncGuaranteed(), M._setOnCancel(T);
        }
        return M;
      }
      for (var X = arguments.length, A = new Array(X), R = 0; R < X; ++R) A[R] = arguments[R];
      y && A.pop();
      var M = new n(A).promise();
      return y !== void 0 ? M.spread(y) : M;
    };
  }), Oi;
}
var Ii, Ha;
function md() {
  return Ha || (Ha = 1, Ii = function(e, n, i, t, r, a) {
    var c = e._getDomain, o = Ae(), u = o.tryCatch, s = o.errorObj, h = e._async;
    function g(m, D, b, d) {
      this.constructor$(m), this._promise._captureStackTrace();
      var p = c();
      this._callback = p === null ? D : o.domainBind(p, D), this._preservedValues = d === r ? new Array(this.length()) : null, this._limit = b, this._inFlight = 0, this._queue = [], h.invoke(this._asyncInit, this, void 0);
    }
    o.inherits(g, n), g.prototype._asyncInit = function() {
      this._init$(void 0, -2);
    }, g.prototype._init = function() {
    }, g.prototype._promiseFulfilled = function(m, D) {
      var b = this._values, d = this.length(), p = this._preservedValues, l = this._limit;
      if (D < 0) {
        if (D = D * -1 - 1, b[D] = m, l >= 1 && (this._inFlight--, this._drainQueue(), this._isResolved())) return true;
      } else {
        if (l >= 1 && this._inFlight >= l) return b[D] = m, this._queue.push(D), false;
        p !== null && (p[D] = m);
        var y = this._promise, w = this._callback, T = y._boundValue();
        y._pushContext();
        var x = u(w).call(T, m, D, d), _ = y._popContext();
        if (a.checkForgottenReturns(x, _, p !== null ? "Promise.filter" : "Promise.map", y), x === s) return this._reject(x.e), true;
        var C = t(x, this._promise);
        if (C instanceof e) {
          C = C._target();
          var E = C._bitField;
          if ((E & 50397184) === 0) return l >= 1 && this._inFlight++, b[D] = C, C._proxy(this, (D + 1) * -1), false;
          if ((E & 33554432) !== 0) x = C._value();
          else return (E & 16777216) !== 0 ? (this._reject(C._reason()), true) : (this._cancel(), true);
        }
        b[D] = x;
      }
      var S = ++this._totalResolved;
      return S >= d ? (p !== null ? this._filter(b, p) : this._resolve(b), true) : false;
    }, g.prototype._drainQueue = function() {
      for (var m = this._queue, D = this._limit, b = this._values; m.length > 0 && this._inFlight < D; ) {
        if (this._isResolved()) return;
        var d = m.pop();
        this._promiseFulfilled(b[d], d);
      }
    }, g.prototype._filter = function(m, D) {
      for (var b = D.length, d = new Array(b), p = 0, l = 0; l < b; ++l) m[l] && (d[p++] = D[l]);
      d.length = p, this._resolve(d);
    }, g.prototype.preservedValues = function() {
      return this._preservedValues;
    };
    function f(m, D, b, d) {
      if (typeof D != "function") return i("expecting a function but got " + o.classString(D));
      var p = 0;
      if (b !== void 0) if (typeof b == "object" && b !== null) {
        if (typeof b.concurrency != "number") return e.reject(new TypeError("'concurrency' must be a number but it is " + o.classString(b.concurrency)));
        p = b.concurrency;
      } else return e.reject(new TypeError("options argument must be an object but it is " + o.classString(b)));
      return p = typeof p == "number" && isFinite(p) && p >= 1 ? p : 0, new g(m, D, p, d).promise();
    }
    e.prototype.map = function(m, D) {
      return f(this, m, D, null);
    }, e.map = function(m, D, b, d) {
      return f(m, D, b, d);
    };
  }), Ii;
}
var Li, za;
function bd() {
  if (za) return Li;
  za = 1;
  var e = Object.create;
  if (e) {
    var n = e(null), i = e(null);
    n[" size"] = i[" size"] = 0;
  }
  return Li = function(t) {
    var r = Ae(), a = r.canEvaluate, c = r.isIdentifier, o, u;
    {
      var s = function(d) {
        return new Function("ensureMethod", `                                    
	        return function(obj) {                                               
	            'use strict'                                                     
	            var len = this.length;                                           
	            ensureMethod(obj, 'methodName');                                 
	            switch(len) {                                                    
	                case 1: return obj.methodName(this[0]);                      
	                case 2: return obj.methodName(this[0], this[1]);             
	                case 3: return obj.methodName(this[0], this[1], this[2]);    
	                case 0: return obj.methodName();                             
	                default:                                                     
	                    return obj.methodName.apply(obj, this);                  
	            }                                                                
	        };                                                                   
	        `.replace(/methodName/g, d))(f);
      }, h = function(d) {
        return new Function("obj", `                                             
	        'use strict';                                                        
	        return obj.propertyName;                                             
	        `.replace("propertyName", d));
      }, g = function(d, p, l) {
        var y = l[d];
        if (typeof y != "function") {
          if (!c(d)) return null;
          if (y = p(d), l[d] = y, l[" size"]++, l[" size"] > 512) {
            for (var w = Object.keys(l), T = 0; T < 256; ++T) delete l[w[T]];
            l[" size"] = w.length - 256;
          }
        }
        return y;
      };
      o = function(d) {
        return g(d, s, n);
      }, u = function(d) {
        return g(d, h, i);
      };
    }
    function f(d, p) {
      var l;
      if (d != null && (l = d[p]), typeof l != "function") {
        var y = "Object " + r.classString(d) + " has no method '" + r.toString(p) + "'";
        throw new t.TypeError(y);
      }
      return l;
    }
    function m(d) {
      var p = this.pop(), l = f(d, p);
      return l.apply(d, this);
    }
    t.prototype.call = function(d) {
      for (var p = arguments.length, l = new Array(Math.max(p - 1, 0)), y = 1; y < p; ++y) l[y - 1] = arguments[y];
      if (a) {
        var w = o(d);
        if (w !== null) return this._then(w, void 0, void 0, l, void 0);
      }
      return l.push(d), this._then(m, void 0, void 0, l, void 0);
    };
    function D(d) {
      return d[this];
    }
    function b(d) {
      var p = +this;
      return p < 0 && (p = Math.max(0, p + d.length)), d[p];
    }
    t.prototype.get = function(d) {
      var p = typeof d == "number", l;
      if (p) l = b;
      else if (a) {
        var y = u(d);
        l = y !== null ? y : D;
      } else l = D;
      return this._then(l, void 0, void 0, d, void 0);
    };
  }, Li;
}
var qi, Ga;
function Dd() {
  return Ga || (Ga = 1, qi = function(e, n, i, t, r, a) {
    var c = Ae(), o = fn().TypeError, u = Ae().inherits, s = c.errorObj, h = c.tryCatch, g = {};
    function f(y) {
      setTimeout(function() {
        throw y;
      }, 0);
    }
    function m(y) {
      var w = i(y);
      return w !== y && typeof y._isDisposable == "function" && typeof y._getDisposer == "function" && y._isDisposable() && w._setDisposable(y._getDisposer()), w;
    }
    function D(y, w) {
      var T = 0, x = y.length, _ = new e(r);
      function C() {
        if (T >= x) return _._fulfill();
        var E = m(y[T++]);
        if (E instanceof e && E._isDisposable()) {
          try {
            E = i(E._getDisposer().tryDispose(w), y.promise);
          } catch (S) {
            return f(S);
          }
          if (E instanceof e) return E._then(C, f, null, null, null);
        }
        C();
      }
      return C(), _;
    }
    function b(y, w, T) {
      this._data = y, this._promise = w, this._context = T;
    }
    b.prototype.data = function() {
      return this._data;
    }, b.prototype.promise = function() {
      return this._promise;
    }, b.prototype.resource = function() {
      return this.promise().isFulfilled() ? this.promise().value() : g;
    }, b.prototype.tryDispose = function(y) {
      var w = this.resource(), T = this._context;
      T !== void 0 && T._pushContext();
      var x = w !== g ? this.doDispose(w, y) : null;
      return T !== void 0 && T._popContext(), this._promise._unsetDisposable(), this._data = null, x;
    }, b.isDisposer = function(y) {
      return y != null && typeof y.resource == "function" && typeof y.tryDispose == "function";
    };
    function d(y, w, T) {
      this.constructor$(y, w, T);
    }
    u(d, b), d.prototype.doDispose = function(y, w) {
      var T = this.data();
      return T.call(y, y, w);
    };
    function p(y) {
      return b.isDisposer(y) ? (this.resources[this.index]._setDisposable(y), y.promise()) : y;
    }
    function l(y) {
      this.length = y, this.promise = null, this[y - 1] = null;
    }
    l.prototype._resultCancelled = function() {
      for (var y = this.length, w = 0; w < y; ++w) {
        var T = this[w];
        T instanceof e && T.cancel();
      }
    }, e.using = function() {
      var y = arguments.length;
      if (y < 2) return n("you must pass at least 2 arguments to Promise.using");
      var w = arguments[y - 1];
      if (typeof w != "function") return n("expecting a function but got " + c.classString(w));
      var T, x = true;
      y === 2 && Array.isArray(arguments[0]) ? (T = arguments[0], y = T.length, x = false) : (T = arguments, y--);
      for (var _ = new l(y), C = 0; C < y; ++C) {
        var E = T[C];
        if (b.isDisposer(E)) {
          var S = E;
          E = E.promise(), E._setDisposable(S);
        } else {
          var X = i(E);
          X instanceof e && (E = X._then(p, null, null, { resources: _, index: C }, void 0));
        }
        _[C] = E;
      }
      for (var A = new Array(_.length), C = 0; C < A.length; ++C) A[C] = e.resolve(_[C]).reflect();
      var R = e.all(A).then(function(H) {
        for (var F = 0; F < H.length; ++F) {
          var B = H[F];
          if (B.isRejected()) return s.e = B.error(), s;
          if (!B.isFulfilled()) {
            R.cancel();
            return;
          }
          H[F] = B.value();
        }
        M._pushContext(), w = h(w);
        var O = x ? w.apply(void 0, H) : w(H), P = M._popContext();
        return a.checkForgottenReturns(O, P, "Promise.using", M), O;
      }), M = R.lastly(function() {
        var H = new e.PromiseInspection(R);
        return D(_, H);
      });
      return _.promise = M, M._setOnCancel(_), M;
    }, e.prototype._setDisposable = function(y) {
      this._bitField = this._bitField | 131072, this._disposer = y;
    }, e.prototype._isDisposable = function() {
      return (this._bitField & 131072) > 0;
    }, e.prototype._getDisposer = function() {
      return this._disposer;
    }, e.prototype._unsetDisposable = function() {
      this._bitField = this._bitField & -131073, this._disposer = void 0;
    }, e.prototype.disposer = function(y) {
      if (typeof y == "function") return new d(y, this, t());
      throw new o();
    };
  }), qi;
}
var Mi, $a;
function yd() {
  return $a || ($a = 1, Mi = function(e, n, i) {
    var t = Ae(), r = e.TimeoutError;
    function a(g) {
      this.handle = g;
    }
    a.prototype._resultCancelled = function() {
      clearTimeout(this.handle);
    };
    var c = function(g) {
      return o(+this).thenReturn(g);
    }, o = e.delay = function(g, f) {
      var m, D;
      return f !== void 0 ? (m = e.resolve(f)._then(c, null, null, g, void 0), i.cancellation() && f instanceof e && m._setOnCancel(f)) : (m = new e(n), D = setTimeout(function() {
        m._fulfill();
      }, +g), i.cancellation() && m._setOnCancel(new a(D)), m._captureStackTrace()), m._setAsyncGuaranteed(), m;
    };
    e.prototype.delay = function(g) {
      return o(g, this);
    };
    var u = function(g, f, m) {
      var D;
      typeof f != "string" ? f instanceof Error ? D = f : D = new r("operation timed out") : D = new r(f), t.markAsOriginatingFromRejection(D), g._attachExtraTrace(D), g._reject(D), m == null ? void 0 : m.cancel();
    };
    function s(g) {
      return clearTimeout(this.handle), g;
    }
    function h(g) {
      throw clearTimeout(this.handle), g;
    }
    e.prototype.timeout = function(g, f) {
      g = +g;
      var m, D, b = new a(setTimeout(function() {
        m.isPending() && u(m, f, D);
      }, g));
      return i.cancellation() ? (D = this.then(), m = D._then(s, h, void 0, b, void 0), m._setOnCancel(b)) : m = this._then(s, h, void 0, b, void 0), m;
    };
  }), Mi;
}
var Pi, Qa;
function vd() {
  return Qa || (Qa = 1, Pi = function(e, n, i, t, r, a) {
    var c = fn(), o = c.TypeError, u = Ae(), s = u.errorObj, h = u.tryCatch, g = [];
    function f(D, b, d) {
      for (var p = 0; p < b.length; ++p) {
        d._pushContext();
        var l = h(b[p])(D);
        if (d._popContext(), l === s) {
          d._pushContext();
          var y = e.reject(s.e);
          return d._popContext(), y;
        }
        var w = t(l, d);
        if (w instanceof e) return w;
      }
      return null;
    }
    function m(D, b, d, p) {
      if (a.cancellation()) {
        var l = new e(i), y = this._finallyPromise = new e(i);
        this._promise = l.lastly(function() {
          return y;
        }), l._captureStackTrace(), l._setOnCancel(this);
      } else {
        var w = this._promise = new e(i);
        w._captureStackTrace();
      }
      this._stack = p, this._generatorFunction = D, this._receiver = b, this._generator = void 0, this._yieldHandlers = typeof d == "function" ? [d].concat(g) : g, this._yieldedPromise = null, this._cancellationPhase = false;
    }
    u.inherits(m, r), m.prototype._isResolved = function() {
      return this._promise === null;
    }, m.prototype._cleanup = function() {
      this._promise = this._generator = null, a.cancellation() && this._finallyPromise !== null && (this._finallyPromise._fulfill(), this._finallyPromise = null);
    }, m.prototype._promiseCancelled = function() {
      if (!this._isResolved()) {
        var D = typeof this._generator.return < "u", b;
        if (D) this._promise._pushContext(), b = h(this._generator.return).call(this._generator, void 0), this._promise._popContext();
        else {
          var d = new e.CancellationError("generator .return() sentinel");
          e.coroutine.returnSentinel = d, this._promise._attachExtraTrace(d), this._promise._pushContext(), b = h(this._generator.throw).call(this._generator, d), this._promise._popContext();
        }
        this._cancellationPhase = true, this._yieldedPromise = null, this._continue(b);
      }
    }, m.prototype._promiseFulfilled = function(D) {
      this._yieldedPromise = null, this._promise._pushContext();
      var b = h(this._generator.next).call(this._generator, D);
      this._promise._popContext(), this._continue(b);
    }, m.prototype._promiseRejected = function(D) {
      this._yieldedPromise = null, this._promise._attachExtraTrace(D), this._promise._pushContext();
      var b = h(this._generator.throw).call(this._generator, D);
      this._promise._popContext(), this._continue(b);
    }, m.prototype._resultCancelled = function() {
      if (this._yieldedPromise instanceof e) {
        var D = this._yieldedPromise;
        this._yieldedPromise = null, D.cancel();
      }
    }, m.prototype.promise = function() {
      return this._promise;
    }, m.prototype._run = function() {
      this._generator = this._generatorFunction.call(this._receiver), this._receiver = this._generatorFunction = void 0, this._promiseFulfilled(void 0);
    }, m.prototype._continue = function(D) {
      var b = this._promise;
      if (D === s) return this._cleanup(), this._cancellationPhase ? b.cancel() : b._rejectCallback(D.e, false);
      var d = D.value;
      if (D.done === true) return this._cleanup(), this._cancellationPhase ? b.cancel() : b._resolveCallback(d);
      var p = t(d, this._promise);
      if (!(p instanceof e) && (p = f(p, this._yieldHandlers, this._promise), p === null)) {
        this._promiseRejected(new o(`A value %s was yielded that could not be treated as a promise

    See http://goo.gl/MqrFmX

`.replace("%s", d) + `From coroutine:
` + this._stack.split(`
`).slice(1, -7).join(`
`)));
        return;
      }
      p = p._target();
      var l = p._bitField;
      (l & 50397184) === 0 ? (this._yieldedPromise = p, p._proxy(this, null)) : (l & 33554432) !== 0 ? e._async.invoke(this._promiseFulfilled, this, p._value()) : (l & 16777216) !== 0 ? e._async.invoke(this._promiseRejected, this, p._reason()) : this._promiseCancelled();
    }, e.coroutine = function(D, b) {
      if (typeof D != "function") throw new o(`generatorFunction must be a function

    See http://goo.gl/MqrFmX
`);
      var d = Object(b).yieldHandler, p = m, l = new Error().stack;
      return function() {
        var y = D.apply(this, arguments), w = new p(void 0, void 0, d, l), T = w.promise();
        return w._generator = y, w._promiseFulfilled(void 0), T;
      };
    }, e.coroutine.addYieldHandler = function(D) {
      if (typeof D != "function") throw new o("expecting a function but got " + u.classString(D));
      g.push(D);
    }, e.spawn = function(D) {
      if (a.deprecated("Promise.spawn()", "Promise.coroutine()"), typeof D != "function") return n(`generatorFunction must be a function

    See http://goo.gl/MqrFmX
`);
      var b = new m(D, this), d = b.promise();
      return b._run(e.spawn), d;
    };
  }), Pi;
}
var Xi, Ya;
function xd() {
  return Ya || (Ya = 1, Xi = function(e) {
    var n = Ae(), i = e._async, t = n.tryCatch, r = n.errorObj;
    function a(u, s) {
      var h = this;
      if (!n.isArray(u)) return c.call(h, u, s);
      var g = t(s).apply(h._boundValue(), [null].concat(u));
      g === r && i.throwLater(g.e);
    }
    function c(u, s) {
      var h = this, g = h._boundValue(), f = u === void 0 ? t(s).call(g, null) : t(s).call(g, null, u);
      f === r && i.throwLater(f.e);
    }
    function o(u, s) {
      var h = this;
      if (!u) {
        var g = new Error(u + "");
        g.cause = u, u = g;
      }
      var f = t(s).call(h._boundValue(), u);
      f === r && i.throwLater(f.e);
    }
    e.prototype.asCallback = e.prototype.nodeify = function(u, s) {
      if (typeof u == "function") {
        var h = c;
        s !== void 0 && Object(s).spread && (h = a), this._then(h, o, void 0, this, u);
      }
      return this;
    };
  }), Xi;
}
var ji, Za;
function Ud() {
  return Za || (Za = 1, ji = function(e, n) {
    var i = {}, t = Ae(), r = ss(), a = t.withAppended, c = t.maybeWrapAsError, o = t.canEvaluate, u = fn().TypeError, s = "Async", h = { __isPromisified__: true }, g = ["arity", "length", "name", "arguments", "caller", "callee", "prototype", "__isPromisified__"], f = new RegExp("^(?:" + g.join("|") + ")$"), m = function(R) {
      return t.isIdentifier(R) && R.charAt(0) !== "_" && R !== "constructor";
    };
    function D(R) {
      return !f.test(R);
    }
    function b(R) {
      try {
        return R.__isPromisified__ === true;
      } catch {
        return false;
      }
    }
    function d(R, M, H) {
      var F = t.getDataPropertyOrDefault(R, M + H, h);
      return F ? b(F) : false;
    }
    function p(R, M, H) {
      for (var F = 0; F < R.length; F += 2) {
        var B = R[F];
        if (H.test(B)) {
          for (var O = B.replace(H, ""), P = 0; P < R.length; P += 2) if (R[P] === O) throw new u(`Cannot promisify an API that has normal methods with '%s'-suffix

    See http://goo.gl/MqrFmX
`.replace("%s", M));
        }
      }
    }
    function l(R, M, H, F) {
      for (var B = t.inheritedDataKeys(R), O = [], P = 0; P < B.length; ++P) {
        var z = B[P], j = R[z], te = F === m ? true : m(z);
        typeof j == "function" && !b(j) && !d(R, z, M) && F(z, j, R, te) && O.push(z, j);
      }
      return p(O, M, H), O;
    }
    var y = function(R) {
      return R.replace(/([$])/, "\\$");
    }, w;
    {
      var T = function(R) {
        for (var M = [R], H = Math.max(0, R - 1 - 3), F = R - 1; F >= H; --F) M.push(F);
        for (var F = R + 1; F <= 3; ++F) M.push(F);
        return M;
      }, x = function(R) {
        return t.filledRange(R, "_arg", "");
      }, _ = function(R) {
        return t.filledRange(Math.max(R, 3), "_arg", "");
      }, C = function(R) {
        return typeof R.length == "number" ? Math.max(Math.min(R.length, 1024), 0) : 0;
      };
      w = function(R, M, H, F, B, O) {
        var P = Math.max(0, C(F) - 1), z = T(P), j = typeof R == "string" || M === i;
        function te(re) {
          var ee = x(re).join(", "), de = re > 0 ? ", " : "", De;
          return j ? De = `ret = callback.call(this, {{args}}, nodeback); break;
` : De = M === void 0 ? `ret = callback({{args}}, nodeback); break;
` : `ret = callback.call(receiver, {{args}}, nodeback); break;
`, De.replace("{{args}}", ee).replace(", ", de);
        }
        function I() {
          for (var re = "", ee = 0; ee < z.length; ++ee) re += "case " + z[ee] + ":" + te(z[ee]);
          return re += `                                                             
	        default:                                                             
	            var args = new Array(len + 1);                                   
	            var i = 0;                                                       
	            for (var i = 0; i < len; ++i) {                                  
	               args[i] = arguments[i];                                       
	            }                                                                
	            args[i] = nodeback;                                              
	            [CodeForCall]                                                    
	            break;                                                           
	        `.replace("[CodeForCall]", j ? `ret = callback.apply(this, args);
` : `ret = callback.apply(receiver, args);
`), re;
        }
        var K = typeof R == "string" ? "this != null ? this['" + R + "'] : fn" : "fn", ie = `'use strict';                                                
	        var ret = function (Parameters) {                                    
	            'use strict';                                                    
	            var len = arguments.length;                                      
	            var promise = new Promise(INTERNAL);                             
	            promise._captureStackTrace();                                    
	            var nodeback = nodebackForPromise(promise, ` + O + `);   
	            var ret;                                                         
	            var callback = tryCatch([GetFunctionCode]);                      
	            switch(len) {                                                    
	                [CodeForSwitchCase]                                          
	            }                                                                
	            if (ret === errorObj) {                                          
	                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);
	            }                                                                
	            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     
	            return promise;                                                  
	        };                                                                   
	        notEnumerableProp(ret, '__isPromisified__', true);                   
	        return ret;                                                          
	    `.replace("[CodeForSwitchCase]", I()).replace("[GetFunctionCode]", K);
        return ie = ie.replace("Parameters", _(P)), new Function("Promise", "fn", "receiver", "withAppended", "maybeWrapAsError", "nodebackForPromise", "tryCatch", "errorObj", "notEnumerableProp", "INTERNAL", ie)(e, F, M, a, c, r, t.tryCatch, t.errorObj, t.notEnumerableProp, n);
      };
    }
    function E(R, M, H, F, B, O) {
      var P = /* @__PURE__ */ (function() {
        return this;
      })(), z = R;
      typeof z == "string" && (R = F);
      function j() {
        var te = M;
        M === i && (te = this);
        var I = new e(n);
        I._captureStackTrace();
        var K = typeof z == "string" && this !== P ? this[z] : R, ie = r(I, O);
        try {
          K.apply(te, a(arguments, ie));
        } catch (re) {
          I._rejectCallback(c(re), true, true);
        }
        return I._isFateSealed() || I._setAsyncGuaranteed(), I;
      }
      return t.notEnumerableProp(j, "__isPromisified__", true), j;
    }
    var S = o ? w : E;
    function X(R, M, H, F, B) {
      for (var O = new RegExp(y(M) + "$"), P = l(R, M, O, H), z = 0, j = P.length; z < j; z += 2) {
        var te = P[z], I = P[z + 1], K = te + M;
        if (F === S) R[K] = S(te, i, te, I, M, B);
        else {
          var ie = F(I, function() {
            return S(te, i, te, I, M, B);
          });
          t.notEnumerableProp(ie, "__isPromisified__", true), R[K] = ie;
        }
      }
      return t.toFastProperties(R), R;
    }
    function A(R, M, H) {
      return S(R, M, void 0, R, null, H);
    }
    e.promisify = function(R, M) {
      if (typeof R != "function") throw new u("expecting a function but got " + t.classString(R));
      if (b(R)) return R;
      M = Object(M);
      var H = M.context === void 0 ? i : M.context, F = !!M.multiArgs, B = A(R, H, F);
      return t.copyDescriptors(R, B, D), B;
    }, e.promisifyAll = function(R, M) {
      if (typeof R != "function" && typeof R != "object") throw new u(`the target of promisifyAll must be an object or a function

    See http://goo.gl/MqrFmX
`);
      M = Object(M);
      var H = !!M.multiArgs, F = M.suffix;
      typeof F != "string" && (F = s);
      var B = M.filter;
      typeof B != "function" && (B = m);
      var O = M.promisifier;
      if (typeof O != "function" && (O = S), !t.isIdentifier(F)) throw new RangeError(`suffix must be a valid identifier

    See http://goo.gl/MqrFmX
`);
      for (var P = t.inheritedDataKeys(R), z = 0; z < P.length; ++z) {
        var j = R[P[z]];
        P[z] !== "constructor" && t.isClass(j) && (X(j.prototype, F, B, O, H), X(j, F, B, O, H));
      }
      return X(R, F, B, O, H);
    };
  }), ji;
}
var Vi, Ka;
function Td() {
  return Ka || (Ka = 1, Vi = function(e, n, i, t) {
    var r = Ae(), a = r.isObject, c = Pn(), o;
    typeof Map == "function" && (o = Map);
    var u = /* @__PURE__ */ (function() {
      var f = 0, m = 0;
      function D(b, d) {
        this[f] = b, this[f + m] = d, f++;
      }
      return function(d) {
        m = d.size, f = 0;
        var p = new Array(d.size * 2);
        return d.forEach(D, p), p;
      };
    })(), s = function(f) {
      for (var m = new o(), D = f.length / 2 | 0, b = 0; b < D; ++b) {
        var d = f[D + b], p = f[b];
        m.set(d, p);
      }
      return m;
    };
    function h(f) {
      var m = false, D;
      if (o !== void 0 && f instanceof o) D = u(f), m = true;
      else {
        var b = c.keys(f), d = b.length;
        D = new Array(d * 2);
        for (var p = 0; p < d; ++p) {
          var l = b[p];
          D[p] = f[l], D[p + d] = l;
        }
      }
      this.constructor$(D), this._isMap = m, this._init$(void 0, -3);
    }
    r.inherits(h, n), h.prototype._init = function() {
    }, h.prototype._promiseFulfilled = function(f, m) {
      this._values[m] = f;
      var D = ++this._totalResolved;
      if (D >= this._length) {
        var b;
        if (this._isMap) b = s(this._values);
        else {
          b = {};
          for (var d = this.length(), p = 0, l = this.length(); p < l; ++p) b[this._values[p + d]] = this._values[p];
        }
        return this._resolve(b), true;
      }
      return false;
    }, h.prototype.shouldCopyValues = function() {
      return false;
    }, h.prototype.getActualLength = function(f) {
      return f >> 1;
    };
    function g(f) {
      var m, D = i(f);
      if (a(D)) D instanceof e ? m = D._then(e.props, void 0, void 0, void 0, void 0) : m = new h(D).promise();
      else return t(`cannot await properties of a non-object

    See http://goo.gl/MqrFmX
`);
      return D instanceof e && m._propagateFrom(D, 2), m;
    }
    e.prototype.props = function() {
      return g(this);
    }, e.props = function(f) {
      return g(f);
    };
  }), Vi;
}
var Hi, Ja;
function _d() {
  return Ja || (Ja = 1, Hi = function(e, n, i, t) {
    var r = Ae(), a = function(o) {
      return o.then(function(u) {
        return c(u, o);
      });
    };
    function c(o, u) {
      var s = i(o);
      if (s instanceof e) return a(s);
      if (o = r.asArray(o), o === null) return t("expecting an array or an iterable object but got " + r.classString(o));
      var h = new e(n);
      u !== void 0 && h._propagateFrom(u, 3);
      for (var g = h._fulfill, f = h._reject, m = 0, D = o.length; m < D; ++m) {
        var b = o[m];
        b === void 0 && !(m in o) || e.cast(b)._then(g, f, void 0, h, null);
      }
      return h;
    }
    e.race = function(o) {
      return c(o, void 0);
    }, e.prototype.race = function() {
      return c(this, void 0);
    };
  }), Hi;
}
var zi, ec;
function Ed() {
  return ec || (ec = 1, zi = function(e, n, i, t, r, a) {
    var c = e._getDomain, o = Ae(), u = o.tryCatch;
    function s(D, b, d, p) {
      this.constructor$(D);
      var l = c();
      this._fn = l === null ? b : o.domainBind(l, b), d !== void 0 && (d = e.resolve(d), d._attachCancellationCallback(this)), this._initialValue = d, this._currentCancellable = null, p === r ? this._eachValues = Array(this._length) : p === 0 ? this._eachValues = null : this._eachValues = void 0, this._promise._captureStackTrace(), this._init$(void 0, -5);
    }
    o.inherits(s, n), s.prototype._gotAccum = function(D) {
      this._eachValues !== void 0 && this._eachValues !== null && D !== r && this._eachValues.push(D);
    }, s.prototype._eachComplete = function(D) {
      return this._eachValues !== null && this._eachValues.push(D), this._eachValues;
    }, s.prototype._init = function() {
    }, s.prototype._resolveEmptyArray = function() {
      this._resolve(this._eachValues !== void 0 ? this._eachValues : this._initialValue);
    }, s.prototype.shouldCopyValues = function() {
      return false;
    }, s.prototype._resolve = function(D) {
      this._promise._resolveCallback(D), this._values = null;
    }, s.prototype._resultCancelled = function(D) {
      if (D === this._initialValue) return this._cancel();
      this._isResolved() || (this._resultCancelled$(), this._currentCancellable instanceof e && this._currentCancellable.cancel(), this._initialValue instanceof e && this._initialValue.cancel());
    }, s.prototype._iterate = function(D) {
      this._values = D;
      var b, d, p = D.length;
      if (this._initialValue !== void 0 ? (b = this._initialValue, d = 0) : (b = e.resolve(D[0]), d = 1), this._currentCancellable = b, !b.isRejected()) for (; d < p; ++d) {
        var l = { accum: null, value: D[d], index: d, length: p, array: this };
        b = b._then(f, void 0, void 0, l, void 0);
      }
      this._eachValues !== void 0 && (b = b._then(this._eachComplete, void 0, void 0, this, void 0)), b._then(h, h, void 0, b, this);
    }, e.prototype.reduce = function(D, b) {
      return g(this, D, b, null);
    }, e.reduce = function(D, b, d, p) {
      return g(D, b, d, p);
    };
    function h(D, b) {
      this.isFulfilled() ? b._resolve(D) : b._reject(D);
    }
    function g(D, b, d, p) {
      if (typeof b != "function") return i("expecting a function but got " + o.classString(b));
      var l = new s(D, b, d, p);
      return l.promise();
    }
    function f(D) {
      this.accum = D, this.array._gotAccum(D);
      var b = t(this.value, this.array._promise);
      return b instanceof e ? (this.array._currentCancellable = b, b._then(m, void 0, void 0, this, void 0)) : m.call(this, b);
    }
    function m(D) {
      var b = this.array, d = b._promise, p = u(b._fn);
      d._pushContext();
      var l;
      b._eachValues !== void 0 ? l = p.call(d._boundValue(), D, this.index, this.length) : l = p.call(d._boundValue(), this.accum, D, this.index, this.length), l instanceof e && (b._currentCancellable = l);
      var y = d._popContext();
      return a.checkForgottenReturns(l, y, b._eachValues !== void 0 ? "Promise.each" : "Promise.reduce", d), l;
    }
  }), zi;
}
var Gi, nc;
function wd() {
  return nc || (nc = 1, Gi = function(e, n, i) {
    var t = e.PromiseInspection, r = Ae();
    function a(c) {
      this.constructor$(c);
    }
    r.inherits(a, n), a.prototype._promiseResolved = function(c, o) {
      this._values[c] = o;
      var u = ++this._totalResolved;
      return u >= this._length ? (this._resolve(this._values), true) : false;
    }, a.prototype._promiseFulfilled = function(c, o) {
      var u = new t();
      return u._bitField = 33554432, u._settledValueField = c, this._promiseResolved(o, u);
    }, a.prototype._promiseRejected = function(c, o) {
      var u = new t();
      return u._bitField = 16777216, u._settledValueField = c, this._promiseResolved(o, u);
    }, e.settle = function(c) {
      return i.deprecated(".settle()", ".reflect()"), new a(c).promise();
    }, e.prototype.settle = function() {
      return e.settle(this);
    };
  }), Gi;
}
var $i, tc;
function Fd() {
  return tc || (tc = 1, $i = function(e, n, i) {
    var t = Ae(), r = fn().RangeError, a = fn().AggregateError, c = t.isArray, o = {};
    function u(h) {
      this.constructor$(h), this._howMany = 0, this._unwrap = false, this._initialized = false;
    }
    t.inherits(u, n), u.prototype._init = function() {
      if (this._initialized) {
        if (this._howMany === 0) {
          this._resolve([]);
          return;
        }
        this._init$(void 0, -5);
        var h = c(this._values);
        !this._isResolved() && h && this._howMany > this._canPossiblyFulfill() && this._reject(this._getRangeError(this.length()));
      }
    }, u.prototype.init = function() {
      this._initialized = true, this._init();
    }, u.prototype.setUnwrap = function() {
      this._unwrap = true;
    }, u.prototype.howMany = function() {
      return this._howMany;
    }, u.prototype.setHowMany = function(h) {
      this._howMany = h;
    }, u.prototype._promiseFulfilled = function(h) {
      return this._addFulfilled(h), this._fulfilled() === this.howMany() ? (this._values.length = this.howMany(), this.howMany() === 1 && this._unwrap ? this._resolve(this._values[0]) : this._resolve(this._values), true) : false;
    }, u.prototype._promiseRejected = function(h) {
      return this._addRejected(h), this._checkOutcome();
    }, u.prototype._promiseCancelled = function() {
      return this._values instanceof e || this._values == null ? this._cancel() : (this._addRejected(o), this._checkOutcome());
    }, u.prototype._checkOutcome = function() {
      if (this.howMany() > this._canPossiblyFulfill()) {
        for (var h = new a(), g = this.length(); g < this._values.length; ++g) this._values[g] !== o && h.push(this._values[g]);
        return h.length > 0 ? this._reject(h) : this._cancel(), true;
      }
      return false;
    }, u.prototype._fulfilled = function() {
      return this._totalResolved;
    }, u.prototype._rejected = function() {
      return this._values.length - this.length();
    }, u.prototype._addRejected = function(h) {
      this._values.push(h);
    }, u.prototype._addFulfilled = function(h) {
      this._values[this._totalResolved++] = h;
    }, u.prototype._canPossiblyFulfill = function() {
      return this.length() - this._rejected();
    }, u.prototype._getRangeError = function(h) {
      var g = "Input array must contain at least " + this._howMany + " items but contains only " + h + " items";
      return new r(g);
    }, u.prototype._resolveEmptyArray = function() {
      this._reject(this._getRangeError(0));
    };
    function s(h, g) {
      if ((g | 0) !== g || g < 0) return i(`expecting a positive integer

    See http://goo.gl/MqrFmX
`);
      var f = new u(h), m = f.promise();
      return f.setHowMany(g), f.init(), m;
    }
    e.some = function(h, g) {
      return s(h, g);
    }, e.prototype.some = function(h) {
      return s(this, h);
    }, e._SomePromiseArray = u;
  }), $i;
}
var Qi, ic;
function Ad() {
  return ic || (ic = 1, Qi = function(e, n) {
    var i = e.map;
    e.prototype.filter = function(t, r) {
      return i(this, t, r, n);
    }, e.filter = function(t, r, a) {
      return i(t, r, a, n);
    };
  }), Qi;
}
var Yi, rc;
function Cd() {
  return rc || (rc = 1, Yi = function(e, n) {
    var i = e.reduce, t = e.all;
    function r() {
      return t(this);
    }
    function a(c, o) {
      return i(c, o, n, n);
    }
    e.prototype.each = function(c) {
      return i(this, c, n, 0)._then(r, void 0, void 0, this, void 0);
    }, e.prototype.mapSeries = function(c) {
      return i(this, c, n, n);
    }, e.each = function(c, o) {
      return i(c, o, n, 0)._then(r, void 0, void 0, c, void 0);
    }, e.mapSeries = a;
  }), Yi;
}
var Zi, ac;
function Wd() {
  return ac || (ac = 1, Zi = function(e) {
    var n = e._SomePromiseArray;
    function i(t) {
      var r = new n(t), a = r.promise();
      return r.setHowMany(1), r.setUnwrap(), r.init(), a;
    }
    e.any = function(t) {
      return i(t);
    }, e.prototype.any = function() {
      return i(this);
    };
  }), Zi;
}
var cc;
function Bd() {
  return cc || (cc = 1, (function(e) {
    e.exports = function() {
      var n = function() {
        return new f(`circular promise resolution chain

    See http://goo.gl/MqrFmX
`);
      }, i = function() {
        return new A.PromiseInspection(this._target());
      }, t = function(F) {
        return A.reject(new f(F));
      };
      function r() {
      }
      var a = {}, c = Ae(), o;
      c.isNode ? o = function() {
        var F = Ve.domain;
        return F === void 0 && (F = null), F;
      } : o = function() {
        return null;
      }, c.notEnumerableProp(A, "_getDomain", o);
      var u = Pn(), s = id(), h = new s();
      u.defineProperty(A, "_async", { value: h });
      var g = fn(), f = A.TypeError = g.TypeError;
      A.RangeError = g.RangeError;
      var m = A.CancellationError = g.CancellationError;
      A.TimeoutError = g.TimeoutError, A.OperationalError = g.OperationalError, A.RejectionError = g.OperationalError, A.AggregateError = g.AggregateError;
      var D = function() {
      }, b = {}, d = {}, p = rd()(A, D), l = ad()(A, D, p, t, r), y = cd()(A), w = y.create, T = od()(A, y);
      T.CapturedTrace;
      var x = ud()(A, p), _ = sd()(d), C = ss(), E = c.errorObj, S = c.tryCatch;
      function X(F, B) {
        if (typeof B != "function") throw new f("expecting a function but got " + c.classString(B));
        if (F.constructor !== A) throw new f(`the promise constructor cannot be invoked directly

    See http://goo.gl/MqrFmX
`);
      }
      function A(F) {
        this._bitField = 0, this._fulfillmentHandler0 = void 0, this._rejectionHandler0 = void 0, this._promise0 = void 0, this._receiver0 = void 0, F !== D && (X(this, F), this._resolveFromExecutor(F)), this._promiseCreated(), this._fireEvent("promiseCreated", this);
      }
      A.prototype.toString = function() {
        return "[object Promise]";
      }, A.prototype.caught = A.prototype.catch = function(F) {
        var B = arguments.length;
        if (B > 1) {
          var O = new Array(B - 1), P = 0, z;
          for (z = 0; z < B - 1; ++z) {
            var j = arguments[z];
            if (c.isObject(j)) O[P++] = j;
            else return t("expecting an object but got A catch statement predicate " + c.classString(j));
          }
          return O.length = P, F = arguments[z], this.then(void 0, _(O, F, this));
        }
        return this.then(void 0, F);
      }, A.prototype.reflect = function() {
        return this._then(i, i, void 0, this, void 0);
      }, A.prototype.then = function(F, B) {
        if (T.warnings() && arguments.length > 0 && typeof F != "function" && typeof B != "function") {
          var O = ".then() only accepts functions but was passed: " + c.classString(F);
          arguments.length > 1 && (O += ", " + c.classString(B)), this._warn(O);
        }
        return this._then(F, B, void 0, void 0, void 0);
      }, A.prototype.done = function(F, B) {
        var O = this._then(F, B, void 0, void 0, void 0);
        O._setIsFinal();
      }, A.prototype.spread = function(F) {
        return typeof F != "function" ? t("expecting a function but got " + c.classString(F)) : this.all()._then(F, void 0, void 0, b, void 0);
      }, A.prototype.toJSON = function() {
        var F = { isFulfilled: false, isRejected: false, fulfillmentValue: void 0, rejectionReason: void 0 };
        return this.isFulfilled() ? (F.fulfillmentValue = this.value(), F.isFulfilled = true) : this.isRejected() && (F.rejectionReason = this.reason(), F.isRejected = true), F;
      }, A.prototype.all = function() {
        return arguments.length > 0 && this._warn(".all() was passed arguments but it does not take any"), new l(this).promise();
      }, A.prototype.error = function(F) {
        return this.caught(c.originatesFromRejection, F);
      }, A.getNewLibraryCopy = e.exports, A.is = function(F) {
        return F instanceof A;
      }, A.fromNode = A.fromCallback = function(F) {
        var B = new A(D);
        B._captureStackTrace();
        var O = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : false, P = S(F)(C(B, O));
        return P === E && B._rejectCallback(P.e, true), B._isFateSealed() || B._setAsyncGuaranteed(), B;
      }, A.all = function(F) {
        return new l(F).promise();
      }, A.cast = function(F) {
        var B = p(F);
        return B instanceof A || (B = new A(D), B._captureStackTrace(), B._setFulfilled(), B._rejectionHandler0 = F), B;
      }, A.resolve = A.fulfilled = A.cast, A.reject = A.rejected = function(F) {
        var B = new A(D);
        return B._captureStackTrace(), B._rejectCallback(F, true), B;
      }, A.setScheduler = function(F) {
        if (typeof F != "function") throw new f("expecting a function but got " + c.classString(F));
        return h.setScheduler(F);
      }, A.prototype._then = function(F, B, O, P, z) {
        var j = z !== void 0, te = j ? z : new A(D), I = this._target(), K = I._bitField;
        j || (te._propagateFrom(this, 3), te._captureStackTrace(), P === void 0 && (this._bitField & 2097152) !== 0 && ((K & 50397184) !== 0 ? P = this._boundValue() : P = I === this ? void 0 : this._boundTo), this._fireEvent("promiseChained", this, te));
        var ie = o();
        if ((K & 50397184) !== 0) {
          var re, ee, de = I._settlePromiseCtx;
          (K & 33554432) !== 0 ? (ee = I._rejectionHandler0, re = F) : (K & 16777216) !== 0 ? (ee = I._fulfillmentHandler0, re = B, I._unsetRejectionIsUnhandled()) : (de = I._settlePromiseLateCancellationObserver, ee = new m("late cancellation observer"), I._attachExtraTrace(ee), re = B), h.invoke(de, I, { handler: ie === null ? re : typeof re == "function" && c.domainBind(ie, re), promise: te, receiver: P, value: ee });
        } else I._addCallbacks(F, B, te, P, ie);
        return te;
      }, A.prototype._length = function() {
        return this._bitField & 65535;
      }, A.prototype._isFateSealed = function() {
        return (this._bitField & 117506048) !== 0;
      }, A.prototype._isFollowing = function() {
        return (this._bitField & 67108864) === 67108864;
      }, A.prototype._setLength = function(F) {
        this._bitField = this._bitField & -65536 | F & 65535;
      }, A.prototype._setFulfilled = function() {
        this._bitField = this._bitField | 33554432, this._fireEvent("promiseFulfilled", this);
      }, A.prototype._setRejected = function() {
        this._bitField = this._bitField | 16777216, this._fireEvent("promiseRejected", this);
      }, A.prototype._setFollowing = function() {
        this._bitField = this._bitField | 67108864, this._fireEvent("promiseResolved", this);
      }, A.prototype._setIsFinal = function() {
        this._bitField = this._bitField | 4194304;
      }, A.prototype._isFinal = function() {
        return (this._bitField & 4194304) > 0;
      }, A.prototype._unsetCancelled = function() {
        this._bitField = this._bitField & -65537;
      }, A.prototype._setCancelled = function() {
        this._bitField = this._bitField | 65536, this._fireEvent("promiseCancelled", this);
      }, A.prototype._setWillBeCancelled = function() {
        this._bitField = this._bitField | 8388608;
      }, A.prototype._setAsyncGuaranteed = function() {
        h.hasCustomScheduler() || (this._bitField = this._bitField | 134217728);
      }, A.prototype._receiverAt = function(F) {
        var B = F === 0 ? this._receiver0 : this[F * 4 - 4 + 3];
        if (B !== a) return B === void 0 && this._isBound() ? this._boundValue() : B;
      }, A.prototype._promiseAt = function(F) {
        return this[F * 4 - 4 + 2];
      }, A.prototype._fulfillmentHandlerAt = function(F) {
        return this[F * 4 - 4 + 0];
      }, A.prototype._rejectionHandlerAt = function(F) {
        return this[F * 4 - 4 + 1];
      }, A.prototype._boundValue = function() {
      }, A.prototype._migrateCallback0 = function(F) {
        F._bitField;
        var B = F._fulfillmentHandler0, O = F._rejectionHandler0, P = F._promise0, z = F._receiverAt(0);
        z === void 0 && (z = a), this._addCallbacks(B, O, P, z, null);
      }, A.prototype._migrateCallbackAt = function(F, B) {
        var O = F._fulfillmentHandlerAt(B), P = F._rejectionHandlerAt(B), z = F._promiseAt(B), j = F._receiverAt(B);
        j === void 0 && (j = a), this._addCallbacks(O, P, z, j, null);
      }, A.prototype._addCallbacks = function(F, B, O, P, z) {
        var j = this._length();
        if (j >= 65531 && (j = 0, this._setLength(0)), j === 0) this._promise0 = O, this._receiver0 = P, typeof F == "function" && (this._fulfillmentHandler0 = z === null ? F : c.domainBind(z, F)), typeof B == "function" && (this._rejectionHandler0 = z === null ? B : c.domainBind(z, B));
        else {
          var te = j * 4 - 4;
          this[te + 2] = O, this[te + 3] = P, typeof F == "function" && (this[te + 0] = z === null ? F : c.domainBind(z, F)), typeof B == "function" && (this[te + 1] = z === null ? B : c.domainBind(z, B));
        }
        return this._setLength(j + 1), j;
      }, A.prototype._proxy = function(F, B) {
        this._addCallbacks(void 0, void 0, B, F, null);
      }, A.prototype._resolveCallback = function(F, B) {
        if ((this._bitField & 117506048) === 0) {
          if (F === this) return this._rejectCallback(n(), false);
          var O = p(F, this);
          if (!(O instanceof A)) return this._fulfill(F);
          B && this._propagateFrom(O, 2);
          var P = O._target();
          if (P === this) {
            this._reject(n());
            return;
          }
          var z = P._bitField;
          if ((z & 50397184) === 0) {
            var j = this._length();
            j > 0 && P._migrateCallback0(this);
            for (var te = 1; te < j; ++te) P._migrateCallbackAt(this, te);
            this._setFollowing(), this._setLength(0), this._setFollowee(P);
          } else if ((z & 33554432) !== 0) this._fulfill(P._value());
          else if ((z & 16777216) !== 0) this._reject(P._reason());
          else {
            var I = new m("late cancellation observer");
            P._attachExtraTrace(I), this._reject(I);
          }
        }
      }, A.prototype._rejectCallback = function(F, B, O) {
        var P = c.ensureErrorObject(F), z = P === F;
        if (!z && !O && T.warnings()) {
          var j = "a promise was rejected with a non-error: " + c.classString(F);
          this._warn(j, true);
        }
        this._attachExtraTrace(P, B ? z : false), this._reject(F);
      }, A.prototype._resolveFromExecutor = function(F) {
        var B = this;
        this._captureStackTrace(), this._pushContext();
        var O = true, P = this._execute(F, function(z) {
          B._resolveCallback(z);
        }, function(z) {
          B._rejectCallback(z, O);
        });
        O = false, this._popContext(), P !== void 0 && B._rejectCallback(P, true);
      }, A.prototype._settlePromiseFromHandler = function(F, B, O, P) {
        var z = P._bitField;
        if ((z & 65536) === 0) {
          P._pushContext();
          var j;
          B === b ? !O || typeof O.length != "number" ? (j = E, j.e = new f("cannot .spread() a non-array: " + c.classString(O))) : j = S(F).apply(this._boundValue(), O) : j = S(F).call(B, O);
          var te = P._popContext();
          z = P._bitField, (z & 65536) === 0 && (j === d ? P._reject(O) : j === E ? P._rejectCallback(j.e, false) : (T.checkForgottenReturns(j, te, "", P, this), P._resolveCallback(j)));
        }
      }, A.prototype._target = function() {
        for (var F = this; F._isFollowing(); ) F = F._followee();
        return F;
      }, A.prototype._followee = function() {
        return this._rejectionHandler0;
      }, A.prototype._setFollowee = function(F) {
        this._rejectionHandler0 = F;
      }, A.prototype._settlePromise = function(F, B, O, P) {
        var z = F instanceof A, j = this._bitField, te = (j & 134217728) !== 0;
        (j & 65536) !== 0 ? (z && F._invokeInternalOnCancel(), O instanceof x && O.isFinallyHandler() ? (O.cancelPromise = F, S(B).call(O, P) === E && F._reject(E.e)) : B === i ? F._fulfill(i.call(O)) : O instanceof r ? O._promiseCancelled(F) : z || F instanceof l ? F._cancel() : O.cancel()) : typeof B == "function" ? z ? (te && F._setAsyncGuaranteed(), this._settlePromiseFromHandler(B, O, P, F)) : B.call(O, P, F) : O instanceof r ? O._isResolved() || ((j & 33554432) !== 0 ? O._promiseFulfilled(P, F) : O._promiseRejected(P, F)) : z && (te && F._setAsyncGuaranteed(), (j & 33554432) !== 0 ? F._fulfill(P) : F._reject(P));
      }, A.prototype._settlePromiseLateCancellationObserver = function(F) {
        var B = F.handler, O = F.promise, P = F.receiver, z = F.value;
        typeof B == "function" ? O instanceof A ? this._settlePromiseFromHandler(B, P, z, O) : B.call(P, z, O) : O instanceof A && O._reject(z);
      }, A.prototype._settlePromiseCtx = function(F) {
        this._settlePromise(F.promise, F.handler, F.receiver, F.value);
      }, A.prototype._settlePromise0 = function(F, B, O) {
        var P = this._promise0, z = this._receiverAt(0);
        this._promise0 = void 0, this._receiver0 = void 0, this._settlePromise(P, F, z, B);
      }, A.prototype._clearCallbackDataAtIndex = function(F) {
        var B = F * 4 - 4;
        this[B + 2] = this[B + 3] = this[B + 0] = this[B + 1] = void 0;
      }, A.prototype._fulfill = function(F) {
        var B = this._bitField;
        if (!((B & 117506048) >>> 16)) {
          if (F === this) {
            var O = n();
            return this._attachExtraTrace(O), this._reject(O);
          }
          this._setFulfilled(), this._rejectionHandler0 = F, (B & 65535) > 0 && ((B & 134217728) !== 0 ? this._settlePromises() : h.settlePromises(this));
        }
      }, A.prototype._reject = function(F) {
        var B = this._bitField;
        if (!((B & 117506048) >>> 16)) {
          if (this._setRejected(), this._fulfillmentHandler0 = F, this._isFinal()) return h.fatalError(F, c.isNode);
          (B & 65535) > 0 ? h.settlePromises(this) : this._ensurePossibleRejectionHandled();
        }
      }, A.prototype._fulfillPromises = function(F, B) {
        for (var O = 1; O < F; O++) {
          var P = this._fulfillmentHandlerAt(O), z = this._promiseAt(O), j = this._receiverAt(O);
          this._clearCallbackDataAtIndex(O), this._settlePromise(z, P, j, B);
        }
      }, A.prototype._rejectPromises = function(F, B) {
        for (var O = 1; O < F; O++) {
          var P = this._rejectionHandlerAt(O), z = this._promiseAt(O), j = this._receiverAt(O);
          this._clearCallbackDataAtIndex(O), this._settlePromise(z, P, j, B);
        }
      }, A.prototype._settlePromises = function() {
        var F = this._bitField, B = F & 65535;
        if (B > 0) {
          if ((F & 16842752) !== 0) {
            var O = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, O, F), this._rejectPromises(B, O);
          } else {
            var P = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, P, F), this._fulfillPromises(B, P);
          }
          this._setLength(0);
        }
        this._clearCancellationData();
      }, A.prototype._settledValue = function() {
        var F = this._bitField;
        if ((F & 33554432) !== 0) return this._rejectionHandler0;
        if ((F & 16777216) !== 0) return this._fulfillmentHandler0;
      };
      function R(F) {
        this.promise._resolveCallback(F);
      }
      function M(F) {
        this.promise._rejectCallback(F, false);
      }
      A.defer = A.pending = function() {
        T.deprecated("Promise.defer", "new Promise");
        var F = new A(D);
        return { promise: F, resolve: R, reject: M };
      }, c.notEnumerableProp(A, "_makeSelfResolutionError", n), dd()(A, D, p, t, T), ld()(A, D, p, T), fd()(A, l, t, T), hd()(A), gd()(A), pd()(A, l, p, D, h, o), A.Promise = A, A.version = "3.4.7", md()(A, l, t, p, D, T), bd()(A), Dd()(A, t, p, w, D, T), yd()(A, D, T), vd()(A, t, D, p, r, T), xd()(A), Ud()(A, D), Td()(A, l, p, t), _d()(A, D, p, t), Ed()(A, l, t, p, D, T), wd()(A, l, T), Fd()(A, l, t), Ad()(A, D), Cd()(A, D), Wd()(A), c.toFastProperties(A), c.toFastProperties(A.prototype);
      function H(F) {
        var B = new A(D);
        B._fulfillmentHandler0 = F, B._rejectionHandler0 = F, B._promise0 = F, B._receiver0 = F;
      }
      return H({ a: 1 }), H({ b: 2 }), H({ c: 3 }), H(1), H(function() {
      }), H(void 0), H(false), H(new A(D)), T.setBounds(s.firstLineError, c.lastLineError), A;
    };
  })(vi)), vi.exports;
}
var oc;
function mn() {
  if (oc) return Ge;
  oc = 1;
  var e = Be, n = Bd()();
  Ge.defer = i, Ge.when = n.resolve, Ge.resolve = n.resolve, Ge.all = n.all, Ge.props = n.props, Ge.reject = n.reject, Ge.promisify = n.promisify, Ge.mapSeries = n.mapSeries, Ge.attempt = n.attempt, Ge.nfcall = function(t) {
    var r = Array.prototype.slice.call(arguments, 1), a = n.promisify(t);
    return a.apply(null, r);
  }, n.prototype.fail = n.prototype.caught, n.prototype.also = function(t) {
    return this.then(function(r) {
      var a = e.extend({}, r, t(r));
      return n.props(a);
    });
  };
  function i() {
    var t, r, a = new n.Promise(function(c, o) {
      t = c, r = o;
    });
    return { resolve: t, reject: r, promise: a };
  }
  return Ge;
}
var Te = {}, uc;
function Wn() {
  if (uc) return Te;
  uc = 1;
  var e = Be, n = Te.types = { document: "document", paragraph: "paragraph", run: "run", text: "text", tab: "tab", checkbox: "checkbox", hyperlink: "hyperlink", noteReference: "noteReference", image: "image", note: "note", commentReference: "commentReference", comment: "comment", table: "table", tableRow: "tableRow", tableCell: "tableCell", break: "break", bookmarkStart: "bookmarkStart" };
  function i(x, _) {
    return _ = _ || {}, { type: n.document, children: x, notes: _.notes || new g({}), comments: _.comments || [] };
  }
  function t(x, _) {
    _ = _ || {};
    var C = _.indent || {};
    return { type: n.paragraph, children: x, styleId: _.styleId || null, styleName: _.styleName || null, numbering: _.numbering || null, alignment: _.alignment || null, indent: { start: C.start || null, end: C.end || null, firstLine: C.firstLine || null, hanging: C.hanging || null } };
  }
  function r(x, _) {
    return _ = _ || {}, { type: n.run, children: x, styleId: _.styleId || null, styleName: _.styleName || null, isBold: !!_.isBold, isUnderline: !!_.isUnderline, isItalic: !!_.isItalic, isStrikethrough: !!_.isStrikethrough, isAllCaps: !!_.isAllCaps, isSmallCaps: !!_.isSmallCaps, verticalAlignment: _.verticalAlignment || a.baseline, font: _.font || null, fontSize: _.fontSize || null, highlight: _.highlight || null };
  }
  var a = { baseline: "baseline", superscript: "superscript", subscript: "subscript" };
  function c(x) {
    return { type: n.text, value: x };
  }
  function o() {
    return { type: n.tab };
  }
  function u(x) {
    return { type: n.checkbox, checked: x.checked };
  }
  function s(x, _) {
    return { type: n.hyperlink, children: x, href: _.href, anchor: _.anchor, targetFrame: _.targetFrame };
  }
  function h(x) {
    return { type: n.noteReference, noteType: x.noteType, noteId: x.noteId };
  }
  function g(x) {
    this._notes = e.indexBy(x, function(_) {
      return b(_.noteType, _.noteId);
    });
  }
  g.prototype.resolve = function(x) {
    return this.findNoteByKey(b(x.noteType, x.noteId));
  }, g.prototype.findNoteByKey = function(x) {
    return this._notes[x] || null;
  };
  function f(x) {
    return { type: n.note, noteType: x.noteType, noteId: x.noteId, body: x.body };
  }
  function m(x) {
    return { type: n.commentReference, commentId: x.commentId };
  }
  function D(x) {
    return { type: n.comment, commentId: x.commentId, body: x.body, authorName: x.authorName, authorInitials: x.authorInitials };
  }
  function b(x, _) {
    return x + "-" + _;
  }
  function d(x) {
    return { type: n.image, read: function(_) {
      return _ ? x.readImage(_) : x.readImage().then(function(C) {
        return _r.from(C);
      });
    }, readAsArrayBuffer: function() {
      return x.readImage();
    }, readAsBase64String: function() {
      return x.readImage("base64");
    }, readAsBuffer: function() {
      return x.readImage().then(function(_) {
        return _r.from(_);
      });
    }, altText: x.altText, contentType: x.contentType };
  }
  function p(x, _) {
    return _ = _ || {}, { type: n.table, children: x, styleId: _.styleId || null, styleName: _.styleName || null };
  }
  function l(x, _) {
    return _ = _ || {}, { type: n.tableRow, children: x, isHeader: _.isHeader || false };
  }
  function y(x, _) {
    return _ = _ || {}, { type: n.tableCell, children: x, colSpan: _.colSpan == null ? 1 : _.colSpan, rowSpan: _.rowSpan == null ? 1 : _.rowSpan };
  }
  function w(x) {
    return { type: n.break, breakType: x };
  }
  function T(x) {
    return { type: n.bookmarkStart, name: x.name };
  }
  return Te.document = Te.Document = i, Te.paragraph = Te.Paragraph = t, Te.run = Te.Run = r, Te.text = Te.Text = c, Te.tab = Te.Tab = o, Te.checkbox = Te.Checkbox = u, Te.Hyperlink = s, Te.noteReference = Te.NoteReference = h, Te.Notes = g, Te.Note = f, Te.commentReference = m, Te.comment = D, Te.Image = d, Te.Table = p, Te.TableRow = l, Te.TableCell = y, Te.lineBreak = w("line"), Te.pageBreak = w("page"), Te.columnBreak = w("column"), Te.BookmarkStart = T, Te.verticalAlignment = a, Te;
}
var Sn = {}, sc;
function cn() {
  if (sc) return Sn;
  sc = 1;
  var e = Be;
  Sn.Result = n, Sn.success = i, Sn.warning = t, Sn.error = r;
  function n(u, s) {
    this.value = u, this.messages = s || [];
  }
  n.prototype.map = function(u) {
    return new n(u(this.value), this.messages);
  }, n.prototype.flatMap = function(u) {
    var s = u(this.value);
    return new n(s.value, a([this, s]));
  }, n.prototype.flatMapThen = function(u) {
    var s = this;
    return u(this.value).then(function(h) {
      return new n(h.value, a([s, h]));
    });
  }, n.combine = function(u) {
    var s = e.flatten(e.pluck(u, "value")), h = a(u);
    return new n(s, h);
  };
  function i(u) {
    return new n(u, []);
  }
  function t(u) {
    return { type: "warning", message: u };
  }
  function r(u) {
    return { type: "error", message: u.message, error: u };
  }
  function a(u) {
    var s = [];
    return e.flatten(e.pluck(u, "messages"), true).forEach(function(h) {
      c(s, h) || s.push(h);
    }), s;
  }
  function c(u, s) {
    return e.find(u, o.bind(null, s)) !== void 0;
  }
  function o(u, s) {
    return u.type === s.type && u.message === s.message;
  }
  return Sn;
}
var Vn = {}, Hn = {}, dc;
function Sd() {
  if (dc) return Hn;
  dc = 1, Hn.byteLength = o, Hn.toByteArray = s, Hn.fromByteArray = f;
  for (var e = [], n = [], i = typeof Uint8Array < "u" ? Uint8Array : Array, t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", r = 0, a = t.length; r < a; ++r) e[r] = t[r], n[t.charCodeAt(r)] = r;
  n[45] = 62, n[95] = 63;
  function c(m) {
    var D = m.length;
    if (D % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
    var b = m.indexOf("=");
    b === -1 && (b = D);
    var d = b === D ? 0 : 4 - b % 4;
    return [b, d];
  }
  function o(m) {
    var D = c(m), b = D[0], d = D[1];
    return (b + d) * 3 / 4 - d;
  }
  function u(m, D, b) {
    return (D + b) * 3 / 4 - b;
  }
  function s(m) {
    var D, b = c(m), d = b[0], p = b[1], l = new i(u(m, d, p)), y = 0, w = p > 0 ? d - 4 : d, T;
    for (T = 0; T < w; T += 4) D = n[m.charCodeAt(T)] << 18 | n[m.charCodeAt(T + 1)] << 12 | n[m.charCodeAt(T + 2)] << 6 | n[m.charCodeAt(T + 3)], l[y++] = D >> 16 & 255, l[y++] = D >> 8 & 255, l[y++] = D & 255;
    return p === 2 && (D = n[m.charCodeAt(T)] << 2 | n[m.charCodeAt(T + 1)] >> 4, l[y++] = D & 255), p === 1 && (D = n[m.charCodeAt(T)] << 10 | n[m.charCodeAt(T + 1)] << 4 | n[m.charCodeAt(T + 2)] >> 2, l[y++] = D >> 8 & 255, l[y++] = D & 255), l;
  }
  function h(m) {
    return e[m >> 18 & 63] + e[m >> 12 & 63] + e[m >> 6 & 63] + e[m & 63];
  }
  function g(m, D, b) {
    for (var d, p = [], l = D; l < b; l += 3) d = (m[l] << 16 & 16711680) + (m[l + 1] << 8 & 65280) + (m[l + 2] & 255), p.push(h(d));
    return p.join("");
  }
  function f(m) {
    for (var D, b = m.length, d = b % 3, p = [], l = 16383, y = 0, w = b - d; y < w; y += l) p.push(g(m, y, y + l > w ? w : y + l));
    return d === 1 ? (D = m[b - 1], p.push(e[D >> 2] + e[D << 4 & 63] + "==")) : d === 2 && (D = (m[b - 2] << 8) + m[b - 1], p.push(e[D >> 10] + e[D >> 4 & 63] + e[D << 2 & 63] + "=")), p.join("");
  }
  return Hn;
}
var lc;
function ds() {
  if (lc) return Vn;
  lc = 1;
  var e = Sd(), n = Es();
  Vn.openArrayBuffer = i, Vn.splitPath = t, Vn.joinPath = r;
  function i(a) {
    return n.loadAsync(a).then(function(c) {
      function o(g) {
        return c.file(g) !== null;
      }
      function u(g, f) {
        return c.file(g).async("uint8array").then(function(m) {
          if (f === "base64") return e.fromByteArray(m);
          if (f) {
            var D = new TextDecoder(f);
            return D.decode(m);
          } else return m;
        });
      }
      function s(g, f) {
        c.file(g, f);
      }
      function h() {
        return c.generateAsync({ type: "arraybuffer" });
      }
      return { exists: o, read: u, write: s, toArrayBuffer: h };
    });
  }
  function t(a) {
    var c = a.lastIndexOf("/");
    return c === -1 ? { dirname: "", basename: a } : { dirname: a.substring(0, c), basename: a.substring(c + 1) };
  }
  function r() {
    var a = Array.prototype.filter.call(arguments, function(o) {
      return o;
    }), c = [];
    return a.forEach(function(o) {
      /^\//.test(o) ? c = [o] : c.push(o);
    }), c.join("/");
  }
  return Vn;
}
var ft = {}, un = {}, Rn = {}, fc;
function ls() {
  if (fc) return Rn;
  fc = 1;
  var e = Be;
  Rn.Element = i, Rn.element = function(a, c, o) {
    return new i(a, c, o);
  }, Rn.text = function(a) {
    return { type: "text", value: a };
  };
  var n = Rn.emptyElement = { first: function() {
    return null;
  }, firstOrEmpty: function() {
    return n;
  }, attributes: {}, children: [] };
  function i(a, c, o) {
    this.type = "element", this.name = a, this.attributes = c || {}, this.children = o || [];
  }
  i.prototype.first = function(a) {
    return e.find(this.children, function(c) {
      return c.name === a;
    });
  }, i.prototype.firstOrEmpty = function(a) {
    return this.first(a) || n;
  }, i.prototype.getElementsByTagName = function(a) {
    var c = e.filter(this.children, function(o) {
      return o.name === a;
    });
    return r(c);
  }, i.prototype.text = function() {
    if (this.children.length === 0) return "";
    if (this.children.length !== 1 || this.children[0].type !== "text") throw new Error("Not implemented");
    return this.children[0].value;
  };
  var t = { getElementsByTagName: function(a) {
    return r(e.flatten(this.map(function(c) {
      return c.getElementsByTagName(a);
    }, true)));
  } };
  function r(a) {
    return e.extend(a, t);
  }
  return Rn;
}
var Ki = {}, ht = {}, zn = {}, tn = {}, Tn = {}, hc;
function ri() {
  if (hc) return Tn;
  hc = 1;
  function e(a, c, o) {
    if (o === void 0 && (o = Array.prototype), a && typeof o.find == "function") return o.find.call(a, c);
    for (var u = 0; u < a.length; u++) if (Object.prototype.hasOwnProperty.call(a, u)) {
      var s = a[u];
      if (c.call(void 0, s, u, a)) return s;
    }
  }
  function n(a, c) {
    return c === void 0 && (c = Object), c && typeof c.freeze == "function" ? c.freeze(a) : a;
  }
  function i(a, c) {
    if (a === null || typeof a != "object") throw new TypeError("target is not an object");
    for (var o in c) Object.prototype.hasOwnProperty.call(c, o) && (a[o] = c[o]);
    return a;
  }
  var t = n({ HTML: "text/html", isHTML: function(a) {
    return a === t.HTML;
  }, XML_APPLICATION: "application/xml", XML_TEXT: "text/xml", XML_XHTML_APPLICATION: "application/xhtml+xml", XML_SVG_IMAGE: "image/svg+xml" }), r = n({ HTML: "http://www.w3.org/1999/xhtml", isHTML: function(a) {
    return a === r.HTML;
  }, SVG: "http://www.w3.org/2000/svg", XML: "http://www.w3.org/XML/1998/namespace", XMLNS: "http://www.w3.org/2000/xmlns/" });
  return Tn.assign = i, Tn.find = e, Tn.freeze = n, Tn.MIME_TYPE = t, Tn.NAMESPACE = r, Tn;
}
var gc;
function la() {
  if (gc) return tn;
  gc = 1;
  var e = ri(), n = e.find, i = e.NAMESPACE;
  function t(v) {
    return v !== "";
  }
  function r(v) {
    return v ? v.split(/[\t\n\f\r ]+/).filter(t) : [];
  }
  function a(v, U) {
    return v.hasOwnProperty(U) || (v[U] = true), v;
  }
  function c(v) {
    if (!v) return [];
    var U = r(v);
    return Object.keys(U.reduce(a, {}));
  }
  function o(v) {
    return function(U) {
      return v && v.indexOf(U) !== -1;
    };
  }
  function u(v, U) {
    for (var W in v) Object.prototype.hasOwnProperty.call(v, W) && (U[W] = v[W]);
  }
  function s(v, U) {
    var W = v.prototype;
    if (!(W instanceof U)) {
      let q = function() {
      };
      q.prototype = U.prototype, q = new q(), u(W, q), v.prototype = W = q;
    }
    W.constructor != v && (typeof v != "function" && console.error("unknown Class:" + v), W.constructor = v);
  }
  var h = {}, g = h.ELEMENT_NODE = 1, f = h.ATTRIBUTE_NODE = 2, m = h.TEXT_NODE = 3, D = h.CDATA_SECTION_NODE = 4, b = h.ENTITY_REFERENCE_NODE = 5, d = h.ENTITY_NODE = 6, p = h.PROCESSING_INSTRUCTION_NODE = 7, l = h.COMMENT_NODE = 8, y = h.DOCUMENT_NODE = 9, w = h.DOCUMENT_TYPE_NODE = 10, T = h.DOCUMENT_FRAGMENT_NODE = 11, x = h.NOTATION_NODE = 12, _ = {}, C = {};
  _.INDEX_SIZE_ERR = (C[1] = "Index size error", 1), _.DOMSTRING_SIZE_ERR = (C[2] = "DOMString size error", 2);
  var E = _.HIERARCHY_REQUEST_ERR = (C[3] = "Hierarchy request error", 3);
  _.WRONG_DOCUMENT_ERR = (C[4] = "Wrong document", 4), _.INVALID_CHARACTER_ERR = (C[5] = "Invalid character", 5), _.NO_DATA_ALLOWED_ERR = (C[6] = "No data allowed", 6), _.NO_MODIFICATION_ALLOWED_ERR = (C[7] = "No modification allowed", 7);
  var S = _.NOT_FOUND_ERR = (C[8] = "Not found", 8);
  _.NOT_SUPPORTED_ERR = (C[9] = "Not supported", 9);
  var X = _.INUSE_ATTRIBUTE_ERR = (C[10] = "Attribute in use", 10);
  _.INVALID_STATE_ERR = (C[11] = "Invalid state", 11), _.SYNTAX_ERR = (C[12] = "Syntax error", 12), _.INVALID_MODIFICATION_ERR = (C[13] = "Invalid modification", 13), _.NAMESPACE_ERR = (C[14] = "Invalid namespace", 14), _.INVALID_ACCESS_ERR = (C[15] = "Invalid access", 15);
  function A(v, U) {
    if (U instanceof Error) var W = U;
    else W = this, Error.call(this, C[v]), this.message = C[v], Error.captureStackTrace && Error.captureStackTrace(this, A);
    return W.code = v, U && (this.message = this.message + ": " + U), W;
  }
  A.prototype = Error.prototype, u(_, A);
  function R() {
  }
  R.prototype = { length: 0, item: function(v) {
    return v >= 0 && v < this.length ? this[v] : null;
  }, toString: function(v, U) {
    for (var W = [], q = 0; q < this.length; q++) be(this[q], W, v, U);
    return W.join("");
  }, filter: function(v) {
    return Array.prototype.filter.call(this, v);
  }, indexOf: function(v) {
    return Array.prototype.indexOf.call(this, v);
  } };
  function M(v, U) {
    this._node = v, this._refresh = U, H(this);
  }
  function H(v) {
    var U = v._node._inc || v._node.ownerDocument._inc;
    if (v._inc !== U) {
      var W = v._refresh(v._node);
      if (Dn(v, "length", W.length), !v.$$length || W.length < v.$$length) for (var q = W.length; q in v; q++) Object.prototype.hasOwnProperty.call(v, q) && delete v[q];
      u(W, v), v._inc = U;
    }
  }
  M.prototype.item = function(v) {
    return H(this), this[v] || null;
  }, s(M, R);
  function F() {
  }
  function B(v, U) {
    for (var W = v.length; W--; ) if (v[W] === U) return W;
  }
  function O(v, U, W, q) {
    if (q ? U[B(U, q)] = W : U[U.length++] = W, v) {
      W.ownerElement = v;
      var Z = v.ownerDocument;
      Z && (q && re(Z, v, q), ie(Z, v, W));
    }
  }
  function P(v, U, W) {
    var q = B(U, W);
    if (q >= 0) {
      for (var Z = U.length - 1; q < Z; ) U[q] = U[++q];
      if (U.length = Z, v) {
        var le = v.ownerDocument;
        le && (re(le, v, W), W.ownerElement = null);
      }
    } else throw new A(S, new Error(v.tagName + "@" + W));
  }
  F.prototype = { length: 0, item: R.prototype.item, getNamedItem: function(v) {
    for (var U = this.length; U--; ) {
      var W = this[U];
      if (W.nodeName == v) return W;
    }
  }, setNamedItem: function(v) {
    var U = v.ownerElement;
    if (U && U != this._ownerElement) throw new A(X);
    var W = this.getNamedItem(v.nodeName);
    return O(this._ownerElement, this, v, W), W;
  }, setNamedItemNS: function(v) {
    var U = v.ownerElement, W;
    if (U && U != this._ownerElement) throw new A(X);
    return W = this.getNamedItemNS(v.namespaceURI, v.localName), O(this._ownerElement, this, v, W), W;
  }, removeNamedItem: function(v) {
    var U = this.getNamedItem(v);
    return P(this._ownerElement, this, U), U;
  }, removeNamedItemNS: function(v, U) {
    var W = this.getNamedItemNS(v, U);
    return P(this._ownerElement, this, W), W;
  }, getNamedItemNS: function(v, U) {
    for (var W = this.length; W--; ) {
      var q = this[W];
      if (q.localName == U && q.namespaceURI == v) return q;
    }
    return null;
  } };
  function z() {
  }
  z.prototype = { hasFeature: function(v, U) {
    return true;
  }, createDocument: function(v, U, W) {
    var q = new K();
    if (q.implementation = this, q.childNodes = new R(), q.doctype = W || null, W && q.appendChild(W), U) {
      var Z = q.createElementNS(v, U);
      q.appendChild(Z);
    }
    return q;
  }, createDocumentType: function(v, U, W) {
    var q = new Ee();
    return q.name = v, q.nodeName = v, q.publicId = U || "", q.systemId = W || "", q;
  } };
  function j() {
  }
  j.prototype = { firstChild: null, lastChild: null, previousSibling: null, nextSibling: null, attributes: null, parentNode: null, childNodes: null, ownerDocument: null, nodeValue: null, namespaceURI: null, prefix: null, localName: null, insertBefore: function(v, U) {
    return ge(this, v, U);
  }, replaceChild: function(v, U) {
    ge(this, v, U, fe), U && this.removeChild(U);
  }, removeChild: function(v) {
    return de(this, v);
  }, appendChild: function(v) {
    return this.insertBefore(v, null);
  }, hasChildNodes: function() {
    return this.firstChild != null;
  }, cloneNode: function(v) {
    return Me(this.ownerDocument || this, this, v);
  }, normalize: function() {
    for (var v = this.firstChild; v; ) {
      var U = v.nextSibling;
      U && U.nodeType == m && v.nodeType == m ? (this.removeChild(U), v.appendData(U.data)) : (v.normalize(), v = U);
    }
  }, isSupported: function(v, U) {
    return this.ownerDocument.implementation.hasFeature(v, U);
  }, hasAttributes: function() {
    return this.attributes.length > 0;
  }, lookupPrefix: function(v) {
    for (var U = this; U; ) {
      var W = U._nsMap;
      if (W) {
        for (var q in W) if (Object.prototype.hasOwnProperty.call(W, q) && W[q] === v) return q;
      }
      U = U.nodeType == f ? U.ownerDocument : U.parentNode;
    }
    return null;
  }, lookupNamespaceURI: function(v) {
    for (var U = this; U; ) {
      var W = U._nsMap;
      if (W && Object.prototype.hasOwnProperty.call(W, v)) return W[v];
      U = U.nodeType == f ? U.ownerDocument : U.parentNode;
    }
    return null;
  }, isDefaultNamespace: function(v) {
    var U = this.lookupPrefix(v);
    return U == null;
  } };
  function te(v) {
    return v == "<" && "&lt;" || v == ">" && "&gt;" || v == "&" && "&amp;" || v == '"' && "&quot;" || "&#" + v.charCodeAt() + ";";
  }
  u(h, j), u(h, j.prototype);
  function I(v, U) {
    if (U(v)) return true;
    if (v = v.firstChild) do
      if (I(v, U)) return true;
    while (v = v.nextSibling);
  }
  function K() {
    this.ownerDocument = this;
  }
  function ie(v, U, W) {
    v && v._inc++;
    var q = W.namespaceURI;
    q === i.XMLNS && (U._nsMap[W.prefix ? W.localName : ""] = W.value);
  }
  function re(v, U, W, q) {
    v && v._inc++;
    var Z = W.namespaceURI;
    Z === i.XMLNS && delete U._nsMap[W.prefix ? W.localName : ""];
  }
  function ee(v, U, W) {
    if (v && v._inc) {
      v._inc++;
      var q = U.childNodes;
      if (W) q[q.length++] = W;
      else {
        for (var Z = U.firstChild, le = 0; Z; ) q[le++] = Z, Z = Z.nextSibling;
        q.length = le, delete q[q.length];
      }
    }
  }
  function de(v, U) {
    var W = U.previousSibling, q = U.nextSibling;
    return W ? W.nextSibling = q : v.firstChild = q, q ? q.previousSibling = W : v.lastChild = W, U.parentNode = null, U.previousSibling = null, U.nextSibling = null, ee(v.ownerDocument, v), U;
  }
  function De(v) {
    return v && (v.nodeType === j.DOCUMENT_NODE || v.nodeType === j.DOCUMENT_FRAGMENT_NODE || v.nodeType === j.ELEMENT_NODE);
  }
  function he(v) {
    return v && (Fe(v) || Se(v) || ve(v) || v.nodeType === j.DOCUMENT_FRAGMENT_NODE || v.nodeType === j.COMMENT_NODE || v.nodeType === j.PROCESSING_INSTRUCTION_NODE);
  }
  function ve(v) {
    return v && v.nodeType === j.DOCUMENT_TYPE_NODE;
  }
  function Fe(v) {
    return v && v.nodeType === j.ELEMENT_NODE;
  }
  function Se(v) {
    return v && v.nodeType === j.TEXT_NODE;
  }
  function V(v, U) {
    var W = v.childNodes || [];
    if (n(W, Fe) || ve(U)) return false;
    var q = n(W, ve);
    return !(U && q && W.indexOf(q) > W.indexOf(U));
  }
  function J(v, U) {
    var W = v.childNodes || [];
    function q(le) {
      return Fe(le) && le !== U;
    }
    if (n(W, q)) return false;
    var Z = n(W, ve);
    return !(U && Z && W.indexOf(Z) > W.indexOf(U));
  }
  function Y(v, U, W) {
    if (!De(v)) throw new A(E, "Unexpected parent node type " + v.nodeType);
    if (W && W.parentNode !== v) throw new A(S, "child not in parent");
    if (!he(U) || ve(U) && v.nodeType !== j.DOCUMENT_NODE) throw new A(E, "Unexpected node type " + U.nodeType + " for parent node type " + v.nodeType);
  }
  function ue(v, U, W) {
    var q = v.childNodes || [], Z = U.childNodes || [];
    if (U.nodeType === j.DOCUMENT_FRAGMENT_NODE) {
      var le = Z.filter(Fe);
      if (le.length > 1 || n(Z, Se)) throw new A(E, "More than one element or text in fragment");
      if (le.length === 1 && !V(v, W)) throw new A(E, "Element in fragment can not be inserted before doctype");
    }
    if (Fe(U) && !V(v, W)) throw new A(E, "Only one element can be added and only after doctype");
    if (ve(U)) {
      if (n(q, ve)) throw new A(E, "Only one doctype is allowed");
      var Ce = n(q, Fe);
      if (W && q.indexOf(Ce) < q.indexOf(W)) throw new A(E, "Doctype can only be inserted before an element");
      if (!W && Ce) throw new A(E, "Doctype can not be appended since element is present");
    }
  }
  function fe(v, U, W) {
    var q = v.childNodes || [], Z = U.childNodes || [];
    if (U.nodeType === j.DOCUMENT_FRAGMENT_NODE) {
      var le = Z.filter(Fe);
      if (le.length > 1 || n(Z, Se)) throw new A(E, "More than one element or text in fragment");
      if (le.length === 1 && !J(v, W)) throw new A(E, "Element in fragment can not be inserted before doctype");
    }
    if (Fe(U) && !J(v, W)) throw new A(E, "Only one element can be added and only after doctype");
    if (ve(U)) {
      if (n(q, function(Qe) {
        return ve(Qe) && Qe !== W;
      })) throw new A(E, "Only one doctype is allowed");
      var Ce = n(q, Fe);
      if (W && q.indexOf(Ce) < q.indexOf(W)) throw new A(E, "Doctype can only be inserted before an element");
    }
  }
  function ge(v, U, W, q) {
    Y(v, U, W), v.nodeType === j.DOCUMENT_NODE && (q || ue)(v, U, W);
    var Z = U.parentNode;
    if (Z && Z.removeChild(U), U.nodeType === T) {
      var le = U.firstChild;
      if (le == null) return U;
      var Ce = U.lastChild;
    } else le = Ce = U;
    var Pe = W ? W.previousSibling : v.lastChild;
    le.previousSibling = Pe, Ce.nextSibling = W, Pe ? Pe.nextSibling = le : v.firstChild = le, W == null ? v.lastChild = Ce : W.previousSibling = Ce;
    do {
      le.parentNode = v;
      var Qe = v.ownerDocument || v;
      ye(le, Qe);
    } while (le !== Ce && (le = le.nextSibling));
    return ee(v.ownerDocument || v, v), U.nodeType == T && (U.firstChild = U.lastChild = null), U;
  }
  function ye(v, U) {
    if (v.ownerDocument !== U) {
      if (v.ownerDocument = U, v.nodeType === g && v.attributes) for (var W = 0; W < v.attributes.length; W++) {
        var q = v.attributes.item(W);
        q && (q.ownerDocument = U);
      }
      for (var Z = v.firstChild; Z; ) ye(Z, U), Z = Z.nextSibling;
    }
  }
  function me(v, U) {
    U.parentNode && U.parentNode.removeChild(U), U.parentNode = v, U.previousSibling = v.lastChild, U.nextSibling = null, U.previousSibling ? U.previousSibling.nextSibling = U : v.firstChild = U, v.lastChild = U, ee(v.ownerDocument, v, U);
    var W = v.ownerDocument || v;
    return ye(U, W), U;
  }
  K.prototype = { nodeName: "#document", nodeType: y, doctype: null, documentElement: null, _inc: 1, insertBefore: function(v, U) {
    if (v.nodeType == T) {
      for (var W = v.firstChild; W; ) {
        var q = W.nextSibling;
        this.insertBefore(W, U), W = q;
      }
      return v;
    }
    return ge(this, v, U), ye(v, this), this.documentElement === null && v.nodeType === g && (this.documentElement = v), v;
  }, removeChild: function(v) {
    return this.documentElement == v && (this.documentElement = null), de(this, v);
  }, replaceChild: function(v, U) {
    ge(this, v, U, fe), ye(v, this), U && this.removeChild(U), Fe(v) && (this.documentElement = v);
  }, importNode: function(v, U) {
    return We(this, v, U);
  }, getElementById: function(v) {
    var U = null;
    return I(this.documentElement, function(W) {
      if (W.nodeType == g && W.getAttribute("id") == v) return U = W, true;
    }), U;
  }, getElementsByClassName: function(v) {
    var U = c(v);
    return new M(this, function(W) {
      var q = [];
      return U.length > 0 && I(W.documentElement, function(Z) {
        if (Z !== W && Z.nodeType === g) {
          var le = Z.getAttribute("class");
          if (le) {
            var Ce = v === le;
            if (!Ce) {
              var Pe = c(le);
              Ce = U.every(o(Pe));
            }
            Ce && q.push(Z);
          }
        }
      }), q;
    });
  }, createElement: function(v) {
    var U = new ce();
    U.ownerDocument = this, U.nodeName = v, U.tagName = v, U.localName = v, U.childNodes = new R();
    var W = U.attributes = new F();
    return W._ownerElement = U, U;
  }, createDocumentFragment: function() {
    var v = new we();
    return v.ownerDocument = this, v.childNodes = new R(), v;
  }, createTextNode: function(v) {
    var U = new $();
    return U.ownerDocument = this, U.appendData(v), U;
  }, createComment: function(v) {
    var U = new Q();
    return U.ownerDocument = this, U.appendData(v), U;
  }, createCDATASection: function(v) {
    var U = new ae();
    return U.ownerDocument = this, U.appendData(v), U;
  }, createProcessingInstruction: function(v, U) {
    var W = new k();
    return W.ownerDocument = this, W.tagName = W.nodeName = W.target = v, W.nodeValue = W.data = U, W;
  }, createAttribute: function(v) {
    var U = new N();
    return U.ownerDocument = this, U.name = v, U.nodeName = v, U.localName = v, U.specified = true, U;
  }, createEntityReference: function(v) {
    var U = new Ue();
    return U.ownerDocument = this, U.nodeName = v, U;
  }, createElementNS: function(v, U) {
    var W = new ce(), q = U.split(":"), Z = W.attributes = new F();
    return W.childNodes = new R(), W.ownerDocument = this, W.nodeName = U, W.tagName = U, W.namespaceURI = v, q.length == 2 ? (W.prefix = q[0], W.localName = q[1]) : W.localName = U, Z._ownerElement = W, W;
  }, createAttributeNS: function(v, U) {
    var W = new N(), q = U.split(":");
    return W.ownerDocument = this, W.nodeName = U, W.name = U, W.namespaceURI = v, W.specified = true, q.length == 2 ? (W.prefix = q[0], W.localName = q[1]) : W.localName = U, W;
  } }, s(K, j);
  function ce() {
    this._nsMap = {};
  }
  ce.prototype = { nodeType: g, hasAttribute: function(v) {
    return this.getAttributeNode(v) != null;
  }, getAttribute: function(v) {
    var U = this.getAttributeNode(v);
    return U && U.value || "";
  }, getAttributeNode: function(v) {
    return this.attributes.getNamedItem(v);
  }, setAttribute: function(v, U) {
    var W = this.ownerDocument.createAttribute(v);
    W.value = W.nodeValue = "" + U, this.setAttributeNode(W);
  }, removeAttribute: function(v) {
    var U = this.getAttributeNode(v);
    U && this.removeAttributeNode(U);
  }, appendChild: function(v) {
    return v.nodeType === T ? this.insertBefore(v, null) : me(this, v);
  }, setAttributeNode: function(v) {
    return this.attributes.setNamedItem(v);
  }, setAttributeNodeNS: function(v) {
    return this.attributes.setNamedItemNS(v);
  }, removeAttributeNode: function(v) {
    return this.attributes.removeNamedItem(v.nodeName);
  }, removeAttributeNS: function(v, U) {
    var W = this.getAttributeNodeNS(v, U);
    W && this.removeAttributeNode(W);
  }, hasAttributeNS: function(v, U) {
    return this.getAttributeNodeNS(v, U) != null;
  }, getAttributeNS: function(v, U) {
    var W = this.getAttributeNodeNS(v, U);
    return W && W.value || "";
  }, setAttributeNS: function(v, U, W) {
    var q = this.ownerDocument.createAttributeNS(v, U);
    q.value = q.nodeValue = "" + W, this.setAttributeNode(q);
  }, getAttributeNodeNS: function(v, U) {
    return this.attributes.getNamedItemNS(v, U);
  }, getElementsByTagName: function(v) {
    return new M(this, function(U) {
      var W = [];
      return I(U, function(q) {
        q !== U && q.nodeType == g && (v === "*" || q.tagName == v) && W.push(q);
      }), W;
    });
  }, getElementsByTagNameNS: function(v, U) {
    return new M(this, function(W) {
      var q = [];
      return I(W, function(Z) {
        Z !== W && Z.nodeType === g && (v === "*" || Z.namespaceURI === v) && (U === "*" || Z.localName == U) && q.push(Z);
      }), q;
    });
  } }, K.prototype.getElementsByTagName = ce.prototype.getElementsByTagName, K.prototype.getElementsByTagNameNS = ce.prototype.getElementsByTagNameNS, s(ce, j);
  function N() {
  }
  N.prototype.nodeType = f, s(N, j);
  function L() {
  }
  L.prototype = { data: "", substringData: function(v, U) {
    return this.data.substring(v, v + U);
  }, appendData: function(v) {
    v = this.data + v, this.nodeValue = this.data = v, this.length = v.length;
  }, insertData: function(v, U) {
    this.replaceData(v, 0, U);
  }, appendChild: function(v) {
    throw new Error(C[E]);
  }, deleteData: function(v, U) {
    this.replaceData(v, U, "");
  }, replaceData: function(v, U, W) {
    var q = this.data.substring(0, v), Z = this.data.substring(v + U);
    W = q + W + Z, this.nodeValue = this.data = W, this.length = W.length;
  } }, s(L, j);
  function $() {
  }
  $.prototype = { nodeName: "#text", nodeType: m, splitText: function(v) {
    var U = this.data, W = U.substring(v);
    U = U.substring(0, v), this.data = this.nodeValue = U, this.length = U.length;
    var q = this.ownerDocument.createTextNode(W);
    return this.parentNode && this.parentNode.insertBefore(q, this.nextSibling), q;
  } }, s($, L);
  function Q() {
  }
  Q.prototype = { nodeName: "#comment", nodeType: l }, s(Q, L);
  function ae() {
  }
  ae.prototype = { nodeName: "#cdata-section", nodeType: D }, s(ae, L);
  function Ee() {
  }
  Ee.prototype.nodeType = w, s(Ee, j);
  function xe() {
  }
  xe.prototype.nodeType = x, s(xe, j);
  function se() {
  }
  se.prototype.nodeType = d, s(se, j);
  function Ue() {
  }
  Ue.prototype.nodeType = b, s(Ue, j);
  function we() {
  }
  we.prototype.nodeName = "#document-fragment", we.prototype.nodeType = T, s(we, j);
  function k() {
  }
  k.prototype.nodeType = p, s(k, j);
  function G() {
  }
  G.prototype.serializeToString = function(v, U, W) {
    return ne.call(v, U, W);
  }, j.prototype.toString = ne;
  function ne(v, U) {
    var W = [], q = this.nodeType == 9 && this.documentElement || this, Z = q.prefix, le = q.namespaceURI;
    if (le && Z == null) {
      var Z = q.lookupPrefix(le);
      if (Z == null) var Ce = [{ namespace: le, prefix: null }];
    }
    return be(this, W, v, U, Ce), W.join("");
  }
  function oe(v, U, W) {
    var q = v.prefix || "", Z = v.namespaceURI;
    if (!Z || q === "xml" && Z === i.XML || Z === i.XMLNS) return false;
    for (var le = W.length; le--; ) {
      var Ce = W[le];
      if (Ce.prefix === q) return Ce.namespace !== Z;
    }
    return true;
  }
  function pe(v, U, W) {
    v.push(" ", U, '="', W.replace(/[<>&"\t\n\r]/g, te), '"');
  }
  function be(v, U, W, q, Z) {
    if (Z || (Z = []), q) if (v = q(v), v) {
      if (typeof v == "string") {
        U.push(v);
        return;
      }
    } else return;
    switch (v.nodeType) {
      case g:
        var le = v.attributes, Ce = le.length, ke = v.firstChild, Pe = v.tagName;
        W = i.isHTML(v.namespaceURI) || W;
        var Qe = Pe;
        if (!W && !v.prefix && v.namespaceURI) {
          for (var on, nn = 0; nn < le.length; nn++) if (le.item(nn).name === "xmlns") {
            on = le.item(nn).value;
            break;
          }
          if (!on) for (var yn = Z.length - 1; yn >= 0; yn--) {
            var vn = Z[yn];
            if (vn.prefix === "" && vn.namespace === v.namespaceURI) {
              on = vn.namespace;
              break;
            }
          }
          if (on !== v.namespaceURI) for (var yn = Z.length - 1; yn >= 0; yn--) {
            var vn = Z[yn];
            if (vn.namespace === v.namespaceURI) {
              vn.prefix && (Qe = vn.prefix + ":" + Pe);
              break;
            }
          }
        }
        U.push("<", Qe);
        for (var xn = 0; xn < Ce; xn++) {
          var Je = le.item(xn);
          Je.prefix == "xmlns" ? Z.push({ prefix: Je.localName, namespace: Je.value }) : Je.nodeName == "xmlns" && Z.push({ prefix: "", namespace: Je.value });
        }
        for (var xn = 0; xn < Ce; xn++) {
          var Je = le.item(xn);
          if (oe(Je, W, Z)) {
            var Un = Je.prefix || "", Xn = Je.namespaceURI;
            pe(U, Un ? "xmlns:" + Un : "xmlns", Xn), Z.push({ prefix: Un, namespace: Xn });
          }
          be(Je, U, W, q, Z);
        }
        if (Pe === Qe && oe(v, W, Z)) {
          var Un = v.prefix || "", Xn = v.namespaceURI;
          pe(U, Un ? "xmlns:" + Un : "xmlns", Xn), Z.push({ prefix: Un, namespace: Xn });
        }
        if (ke || W && !/^(?:meta|link|img|br|hr|input)$/i.test(Pe)) {
          if (U.push(">"), W && /^script$/i.test(Pe)) for (; ke; ) ke.data ? U.push(ke.data) : be(ke, U, W, q, Z.slice()), ke = ke.nextSibling;
          else for (; ke; ) be(ke, U, W, q, Z.slice()), ke = ke.nextSibling;
          U.push("</", Qe, ">");
        } else U.push("/>");
        return;
      case y:
      case T:
        for (var ke = v.firstChild; ke; ) be(ke, U, W, q, Z.slice()), ke = ke.nextSibling;
        return;
      case f:
        return pe(U, v.name, v.value);
      case m:
        return U.push(v.data.replace(/[<&>]/g, te));
      case D:
        return U.push("<![CDATA[", v.data, "]]>");
      case l:
        return U.push("<!--", v.data, "-->");
      case w:
        var ma = v.publicId, Bn = v.systemId;
        if (U.push("<!DOCTYPE ", v.name), ma) U.push(" PUBLIC ", ma), Bn && Bn != "." && U.push(" ", Bn), U.push(">");
        else if (Bn && Bn != ".") U.push(" SYSTEM ", Bn, ">");
        else {
          var ba = v.internalSubset;
          ba && U.push(" [", ba, "]"), U.push(">");
        }
        return;
      case p:
        return U.push("<?", v.target, " ", v.data, "?>");
      case b:
        return U.push("&", v.nodeName, ";");
      default:
        U.push("??", v.nodeName);
    }
  }
  function We(v, U, W) {
    var q;
    switch (U.nodeType) {
      case g:
        q = U.cloneNode(false), q.ownerDocument = v;
      case T:
        break;
      case f:
        W = true;
        break;
    }
    if (q || (q = U.cloneNode(false)), q.ownerDocument = v, q.parentNode = null, W) for (var Z = U.firstChild; Z; ) q.appendChild(We(v, Z, W)), Z = Z.nextSibling;
    return q;
  }
  function Me(v, U, W) {
    var q = new U.constructor();
    for (var Z in U) if (Object.prototype.hasOwnProperty.call(U, Z)) {
      var le = U[Z];
      typeof le != "object" && le != q[Z] && (q[Z] = le);
    }
    switch (U.childNodes && (q.childNodes = new R()), q.ownerDocument = v, q.nodeType) {
      case g:
        var Ce = U.attributes, Pe = q.attributes = new F(), Qe = Ce.length;
        Pe._ownerElement = q;
        for (var on = 0; on < Qe; on++) q.setAttributeNode(Me(v, Ce.item(on), true));
        break;
      case f:
        W = true;
    }
    if (W) for (var nn = U.firstChild; nn; ) q.appendChild(Me(v, nn, W)), nn = nn.nextSibling;
    return q;
  }
  function Dn(v, U, W) {
    v[U] = W;
  }
  try {
    if (Object.defineProperty) {
      let v = function(U) {
        switch (U.nodeType) {
          case g:
          case T:
            var W = [];
            for (U = U.firstChild; U; ) U.nodeType !== 7 && U.nodeType !== 8 && W.push(v(U)), U = U.nextSibling;
            return W.join("");
          default:
            return U.nodeValue;
        }
      };
      Object.defineProperty(M.prototype, "length", { get: function() {
        return H(this), this.$$length;
      } }), Object.defineProperty(j.prototype, "textContent", { get: function() {
        return v(this);
      }, set: function(U) {
        switch (this.nodeType) {
          case g:
          case T:
            for (; this.firstChild; ) this.removeChild(this.firstChild);
            (U || String(U)) && this.appendChild(this.ownerDocument.createTextNode(U));
            break;
          default:
            this.data = U, this.value = U, this.nodeValue = U;
        }
      } }), Dn = function(U, W, q) {
        U["$$" + W] = q;
      };
    }
  } catch {
  }
  return tn.DocumentType = Ee, tn.DOMException = A, tn.DOMImplementation = z, tn.Element = ce, tn.Node = j, tn.NodeList = R, tn.XMLSerializer = G, tn;
}
var Gn = {}, Ji = {}, pc;
function Rd() {
  return pc || (pc = 1, (function(e) {
    var n = ri().freeze;
    e.XML_ENTITIES = n({ amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' }), e.HTML_ENTITIES = n({ Aacute: "\xC1", aacute: "\xE1", Abreve: "\u0102", abreve: "\u0103", ac: "\u223E", acd: "\u223F", acE: "\u223E\u0333", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", Acy: "\u0410", acy: "\u0430", AElig: "\xC6", aelig: "\xE6", af: "\u2061", Afr: "\u{1D504}", afr: "\u{1D51E}", Agrave: "\xC0", agrave: "\xE0", alefsym: "\u2135", aleph: "\u2135", Alpha: "\u0391", alpha: "\u03B1", Amacr: "\u0100", amacr: "\u0101", amalg: "\u2A3F", AMP: "&", amp: "&", And: "\u2A53", and: "\u2227", andand: "\u2A55", andd: "\u2A5C", andslope: "\u2A58", andv: "\u2A5A", ang: "\u2220", ange: "\u29A4", angle: "\u2220", angmsd: "\u2221", angmsdaa: "\u29A8", angmsdab: "\u29A9", angmsdac: "\u29AA", angmsdad: "\u29AB", angmsdae: "\u29AC", angmsdaf: "\u29AD", angmsdag: "\u29AE", angmsdah: "\u29AF", angrt: "\u221F", angrtvb: "\u22BE", angrtvbd: "\u299D", angsph: "\u2222", angst: "\xC5", angzarr: "\u237C", Aogon: "\u0104", aogon: "\u0105", Aopf: "\u{1D538}", aopf: "\u{1D552}", ap: "\u2248", apacir: "\u2A6F", apE: "\u2A70", ape: "\u224A", apid: "\u224B", apos: "'", ApplyFunction: "\u2061", approx: "\u2248", approxeq: "\u224A", Aring: "\xC5", aring: "\xE5", Ascr: "\u{1D49C}", ascr: "\u{1D4B6}", Assign: "\u2254", ast: "*", asymp: "\u2248", asympeq: "\u224D", Atilde: "\xC3", atilde: "\xE3", Auml: "\xC4", auml: "\xE4", awconint: "\u2233", awint: "\u2A11", backcong: "\u224C", backepsilon: "\u03F6", backprime: "\u2035", backsim: "\u223D", backsimeq: "\u22CD", Backslash: "\u2216", Barv: "\u2AE7", barvee: "\u22BD", Barwed: "\u2306", barwed: "\u2305", barwedge: "\u2305", bbrk: "\u23B5", bbrktbrk: "\u23B6", bcong: "\u224C", Bcy: "\u0411", bcy: "\u0431", bdquo: "\u201E", becaus: "\u2235", Because: "\u2235", because: "\u2235", bemptyv: "\u29B0", bepsi: "\u03F6", bernou: "\u212C", Bernoullis: "\u212C", Beta: "\u0392", beta: "\u03B2", beth: "\u2136", between: "\u226C", Bfr: "\u{1D505}", bfr: "\u{1D51F}", bigcap: "\u22C2", bigcirc: "\u25EF", bigcup: "\u22C3", bigodot: "\u2A00", bigoplus: "\u2A01", bigotimes: "\u2A02", bigsqcup: "\u2A06", bigstar: "\u2605", bigtriangledown: "\u25BD", bigtriangleup: "\u25B3", biguplus: "\u2A04", bigvee: "\u22C1", bigwedge: "\u22C0", bkarow: "\u290D", blacklozenge: "\u29EB", blacksquare: "\u25AA", blacktriangle: "\u25B4", blacktriangledown: "\u25BE", blacktriangleleft: "\u25C2", blacktriangleright: "\u25B8", blank: "\u2423", blk12: "\u2592", blk14: "\u2591", blk34: "\u2593", block: "\u2588", bne: "=\u20E5", bnequiv: "\u2261\u20E5", bNot: "\u2AED", bnot: "\u2310", Bopf: "\u{1D539}", bopf: "\u{1D553}", bot: "\u22A5", bottom: "\u22A5", bowtie: "\u22C8", boxbox: "\u29C9", boxDL: "\u2557", boxDl: "\u2556", boxdL: "\u2555", boxdl: "\u2510", boxDR: "\u2554", boxDr: "\u2553", boxdR: "\u2552", boxdr: "\u250C", boxH: "\u2550", boxh: "\u2500", boxHD: "\u2566", boxHd: "\u2564", boxhD: "\u2565", boxhd: "\u252C", boxHU: "\u2569", boxHu: "\u2567", boxhU: "\u2568", boxhu: "\u2534", boxminus: "\u229F", boxplus: "\u229E", boxtimes: "\u22A0", boxUL: "\u255D", boxUl: "\u255C", boxuL: "\u255B", boxul: "\u2518", boxUR: "\u255A", boxUr: "\u2559", boxuR: "\u2558", boxur: "\u2514", boxV: "\u2551", boxv: "\u2502", boxVH: "\u256C", boxVh: "\u256B", boxvH: "\u256A", boxvh: "\u253C", boxVL: "\u2563", boxVl: "\u2562", boxvL: "\u2561", boxvl: "\u2524", boxVR: "\u2560", boxVr: "\u255F", boxvR: "\u255E", boxvr: "\u251C", bprime: "\u2035", Breve: "\u02D8", breve: "\u02D8", brvbar: "\xA6", Bscr: "\u212C", bscr: "\u{1D4B7}", bsemi: "\u204F", bsim: "\u223D", bsime: "\u22CD", bsol: "\\", bsolb: "\u29C5", bsolhsub: "\u27C8", bull: "\u2022", bullet: "\u2022", bump: "\u224E", bumpE: "\u2AAE", bumpe: "\u224F", Bumpeq: "\u224E", bumpeq: "\u224F", Cacute: "\u0106", cacute: "\u0107", Cap: "\u22D2", cap: "\u2229", capand: "\u2A44", capbrcup: "\u2A49", capcap: "\u2A4B", capcup: "\u2A47", capdot: "\u2A40", CapitalDifferentialD: "\u2145", caps: "\u2229\uFE00", caret: "\u2041", caron: "\u02C7", Cayleys: "\u212D", ccaps: "\u2A4D", Ccaron: "\u010C", ccaron: "\u010D", Ccedil: "\xC7", ccedil: "\xE7", Ccirc: "\u0108", ccirc: "\u0109", Cconint: "\u2230", ccups: "\u2A4C", ccupssm: "\u2A50", Cdot: "\u010A", cdot: "\u010B", cedil: "\xB8", Cedilla: "\xB8", cemptyv: "\u29B2", cent: "\xA2", CenterDot: "\xB7", centerdot: "\xB7", Cfr: "\u212D", cfr: "\u{1D520}", CHcy: "\u0427", chcy: "\u0447", check: "\u2713", checkmark: "\u2713", Chi: "\u03A7", chi: "\u03C7", cir: "\u25CB", circ: "\u02C6", circeq: "\u2257", circlearrowleft: "\u21BA", circlearrowright: "\u21BB", circledast: "\u229B", circledcirc: "\u229A", circleddash: "\u229D", CircleDot: "\u2299", circledR: "\xAE", circledS: "\u24C8", CircleMinus: "\u2296", CirclePlus: "\u2295", CircleTimes: "\u2297", cirE: "\u29C3", cire: "\u2257", cirfnint: "\u2A10", cirmid: "\u2AEF", cirscir: "\u29C2", ClockwiseContourIntegral: "\u2232", CloseCurlyDoubleQuote: "\u201D", CloseCurlyQuote: "\u2019", clubs: "\u2663", clubsuit: "\u2663", Colon: "\u2237", colon: ":", Colone: "\u2A74", colone: "\u2254", coloneq: "\u2254", comma: ",", commat: "@", comp: "\u2201", compfn: "\u2218", complement: "\u2201", complexes: "\u2102", cong: "\u2245", congdot: "\u2A6D", Congruent: "\u2261", Conint: "\u222F", conint: "\u222E", ContourIntegral: "\u222E", Copf: "\u2102", copf: "\u{1D554}", coprod: "\u2210", Coproduct: "\u2210", COPY: "\xA9", copy: "\xA9", copysr: "\u2117", CounterClockwiseContourIntegral: "\u2233", crarr: "\u21B5", Cross: "\u2A2F", cross: "\u2717", Cscr: "\u{1D49E}", cscr: "\u{1D4B8}", csub: "\u2ACF", csube: "\u2AD1", csup: "\u2AD0", csupe: "\u2AD2", ctdot: "\u22EF", cudarrl: "\u2938", cudarrr: "\u2935", cuepr: "\u22DE", cuesc: "\u22DF", cularr: "\u21B6", cularrp: "\u293D", Cup: "\u22D3", cup: "\u222A", cupbrcap: "\u2A48", CupCap: "\u224D", cupcap: "\u2A46", cupcup: "\u2A4A", cupdot: "\u228D", cupor: "\u2A45", cups: "\u222A\uFE00", curarr: "\u21B7", curarrm: "\u293C", curlyeqprec: "\u22DE", curlyeqsucc: "\u22DF", curlyvee: "\u22CE", curlywedge: "\u22CF", curren: "\xA4", curvearrowleft: "\u21B6", curvearrowright: "\u21B7", cuvee: "\u22CE", cuwed: "\u22CF", cwconint: "\u2232", cwint: "\u2231", cylcty: "\u232D", Dagger: "\u2021", dagger: "\u2020", daleth: "\u2138", Darr: "\u21A1", dArr: "\u21D3", darr: "\u2193", dash: "\u2010", Dashv: "\u2AE4", dashv: "\u22A3", dbkarow: "\u290F", dblac: "\u02DD", Dcaron: "\u010E", dcaron: "\u010F", Dcy: "\u0414", dcy: "\u0434", DD: "\u2145", dd: "\u2146", ddagger: "\u2021", ddarr: "\u21CA", DDotrahd: "\u2911", ddotseq: "\u2A77", deg: "\xB0", Del: "\u2207", Delta: "\u0394", delta: "\u03B4", demptyv: "\u29B1", dfisht: "\u297F", Dfr: "\u{1D507}", dfr: "\u{1D521}", dHar: "\u2965", dharl: "\u21C3", dharr: "\u21C2", DiacriticalAcute: "\xB4", DiacriticalDot: "\u02D9", DiacriticalDoubleAcute: "\u02DD", DiacriticalGrave: "`", DiacriticalTilde: "\u02DC", diam: "\u22C4", Diamond: "\u22C4", diamond: "\u22C4", diamondsuit: "\u2666", diams: "\u2666", die: "\xA8", DifferentialD: "\u2146", digamma: "\u03DD", disin: "\u22F2", div: "\xF7", divide: "\xF7", divideontimes: "\u22C7", divonx: "\u22C7", DJcy: "\u0402", djcy: "\u0452", dlcorn: "\u231E", dlcrop: "\u230D", dollar: "$", Dopf: "\u{1D53B}", dopf: "\u{1D555}", Dot: "\xA8", dot: "\u02D9", DotDot: "\u20DC", doteq: "\u2250", doteqdot: "\u2251", DotEqual: "\u2250", dotminus: "\u2238", dotplus: "\u2214", dotsquare: "\u22A1", doublebarwedge: "\u2306", DoubleContourIntegral: "\u222F", DoubleDot: "\xA8", DoubleDownArrow: "\u21D3", DoubleLeftArrow: "\u21D0", DoubleLeftRightArrow: "\u21D4", DoubleLeftTee: "\u2AE4", DoubleLongLeftArrow: "\u27F8", DoubleLongLeftRightArrow: "\u27FA", DoubleLongRightArrow: "\u27F9", DoubleRightArrow: "\u21D2", DoubleRightTee: "\u22A8", DoubleUpArrow: "\u21D1", DoubleUpDownArrow: "\u21D5", DoubleVerticalBar: "\u2225", DownArrow: "\u2193", Downarrow: "\u21D3", downarrow: "\u2193", DownArrowBar: "\u2913", DownArrowUpArrow: "\u21F5", DownBreve: "\u0311", downdownarrows: "\u21CA", downharpoonleft: "\u21C3", downharpoonright: "\u21C2", DownLeftRightVector: "\u2950", DownLeftTeeVector: "\u295E", DownLeftVector: "\u21BD", DownLeftVectorBar: "\u2956", DownRightTeeVector: "\u295F", DownRightVector: "\u21C1", DownRightVectorBar: "\u2957", DownTee: "\u22A4", DownTeeArrow: "\u21A7", drbkarow: "\u2910", drcorn: "\u231F", drcrop: "\u230C", Dscr: "\u{1D49F}", dscr: "\u{1D4B9}", DScy: "\u0405", dscy: "\u0455", dsol: "\u29F6", Dstrok: "\u0110", dstrok: "\u0111", dtdot: "\u22F1", dtri: "\u25BF", dtrif: "\u25BE", duarr: "\u21F5", duhar: "\u296F", dwangle: "\u29A6", DZcy: "\u040F", dzcy: "\u045F", dzigrarr: "\u27FF", Eacute: "\xC9", eacute: "\xE9", easter: "\u2A6E", Ecaron: "\u011A", ecaron: "\u011B", ecir: "\u2256", Ecirc: "\xCA", ecirc: "\xEA", ecolon: "\u2255", Ecy: "\u042D", ecy: "\u044D", eDDot: "\u2A77", Edot: "\u0116", eDot: "\u2251", edot: "\u0117", ee: "\u2147", efDot: "\u2252", Efr: "\u{1D508}", efr: "\u{1D522}", eg: "\u2A9A", Egrave: "\xC8", egrave: "\xE8", egs: "\u2A96", egsdot: "\u2A98", el: "\u2A99", Element: "\u2208", elinters: "\u23E7", ell: "\u2113", els: "\u2A95", elsdot: "\u2A97", Emacr: "\u0112", emacr: "\u0113", empty: "\u2205", emptyset: "\u2205", EmptySmallSquare: "\u25FB", emptyv: "\u2205", EmptyVerySmallSquare: "\u25AB", emsp: "\u2003", emsp13: "\u2004", emsp14: "\u2005", ENG: "\u014A", eng: "\u014B", ensp: "\u2002", Eogon: "\u0118", eogon: "\u0119", Eopf: "\u{1D53C}", eopf: "\u{1D556}", epar: "\u22D5", eparsl: "\u29E3", eplus: "\u2A71", epsi: "\u03B5", Epsilon: "\u0395", epsilon: "\u03B5", epsiv: "\u03F5", eqcirc: "\u2256", eqcolon: "\u2255", eqsim: "\u2242", eqslantgtr: "\u2A96", eqslantless: "\u2A95", Equal: "\u2A75", equals: "=", EqualTilde: "\u2242", equest: "\u225F", Equilibrium: "\u21CC", equiv: "\u2261", equivDD: "\u2A78", eqvparsl: "\u29E5", erarr: "\u2971", erDot: "\u2253", Escr: "\u2130", escr: "\u212F", esdot: "\u2250", Esim: "\u2A73", esim: "\u2242", Eta: "\u0397", eta: "\u03B7", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", euro: "\u20AC", excl: "!", exist: "\u2203", Exists: "\u2203", expectation: "\u2130", ExponentialE: "\u2147", exponentiale: "\u2147", fallingdotseq: "\u2252", Fcy: "\u0424", fcy: "\u0444", female: "\u2640", ffilig: "\uFB03", fflig: "\uFB00", ffllig: "\uFB04", Ffr: "\u{1D509}", ffr: "\u{1D523}", filig: "\uFB01", FilledSmallSquare: "\u25FC", FilledVerySmallSquare: "\u25AA", fjlig: "fj", flat: "\u266D", fllig: "\uFB02", fltns: "\u25B1", fnof: "\u0192", Fopf: "\u{1D53D}", fopf: "\u{1D557}", ForAll: "\u2200", forall: "\u2200", fork: "\u22D4", forkv: "\u2AD9", Fouriertrf: "\u2131", fpartint: "\u2A0D", frac12: "\xBD", frac13: "\u2153", frac14: "\xBC", frac15: "\u2155", frac16: "\u2159", frac18: "\u215B", frac23: "\u2154", frac25: "\u2156", frac34: "\xBE", frac35: "\u2157", frac38: "\u215C", frac45: "\u2158", frac56: "\u215A", frac58: "\u215D", frac78: "\u215E", frasl: "\u2044", frown: "\u2322", Fscr: "\u2131", fscr: "\u{1D4BB}", gacute: "\u01F5", Gamma: "\u0393", gamma: "\u03B3", Gammad: "\u03DC", gammad: "\u03DD", gap: "\u2A86", Gbreve: "\u011E", gbreve: "\u011F", Gcedil: "\u0122", Gcirc: "\u011C", gcirc: "\u011D", Gcy: "\u0413", gcy: "\u0433", Gdot: "\u0120", gdot: "\u0121", gE: "\u2267", ge: "\u2265", gEl: "\u2A8C", gel: "\u22DB", geq: "\u2265", geqq: "\u2267", geqslant: "\u2A7E", ges: "\u2A7E", gescc: "\u2AA9", gesdot: "\u2A80", gesdoto: "\u2A82", gesdotol: "\u2A84", gesl: "\u22DB\uFE00", gesles: "\u2A94", Gfr: "\u{1D50A}", gfr: "\u{1D524}", Gg: "\u22D9", gg: "\u226B", ggg: "\u22D9", gimel: "\u2137", GJcy: "\u0403", gjcy: "\u0453", gl: "\u2277", gla: "\u2AA5", glE: "\u2A92", glj: "\u2AA4", gnap: "\u2A8A", gnapprox: "\u2A8A", gnE: "\u2269", gne: "\u2A88", gneq: "\u2A88", gneqq: "\u2269", gnsim: "\u22E7", Gopf: "\u{1D53E}", gopf: "\u{1D558}", grave: "`", GreaterEqual: "\u2265", GreaterEqualLess: "\u22DB", GreaterFullEqual: "\u2267", GreaterGreater: "\u2AA2", GreaterLess: "\u2277", GreaterSlantEqual: "\u2A7E", GreaterTilde: "\u2273", Gscr: "\u{1D4A2}", gscr: "\u210A", gsim: "\u2273", gsime: "\u2A8E", gsiml: "\u2A90", Gt: "\u226B", GT: ">", gt: ">", gtcc: "\u2AA7", gtcir: "\u2A7A", gtdot: "\u22D7", gtlPar: "\u2995", gtquest: "\u2A7C", gtrapprox: "\u2A86", gtrarr: "\u2978", gtrdot: "\u22D7", gtreqless: "\u22DB", gtreqqless: "\u2A8C", gtrless: "\u2277", gtrsim: "\u2273", gvertneqq: "\u2269\uFE00", gvnE: "\u2269\uFE00", Hacek: "\u02C7", hairsp: "\u200A", half: "\xBD", hamilt: "\u210B", HARDcy: "\u042A", hardcy: "\u044A", hArr: "\u21D4", harr: "\u2194", harrcir: "\u2948", harrw: "\u21AD", Hat: "^", hbar: "\u210F", Hcirc: "\u0124", hcirc: "\u0125", hearts: "\u2665", heartsuit: "\u2665", hellip: "\u2026", hercon: "\u22B9", Hfr: "\u210C", hfr: "\u{1D525}", HilbertSpace: "\u210B", hksearow: "\u2925", hkswarow: "\u2926", hoarr: "\u21FF", homtht: "\u223B", hookleftarrow: "\u21A9", hookrightarrow: "\u21AA", Hopf: "\u210D", hopf: "\u{1D559}", horbar: "\u2015", HorizontalLine: "\u2500", Hscr: "\u210B", hscr: "\u{1D4BD}", hslash: "\u210F", Hstrok: "\u0126", hstrok: "\u0127", HumpDownHump: "\u224E", HumpEqual: "\u224F", hybull: "\u2043", hyphen: "\u2010", Iacute: "\xCD", iacute: "\xED", ic: "\u2063", Icirc: "\xCE", icirc: "\xEE", Icy: "\u0418", icy: "\u0438", Idot: "\u0130", IEcy: "\u0415", iecy: "\u0435", iexcl: "\xA1", iff: "\u21D4", Ifr: "\u2111", ifr: "\u{1D526}", Igrave: "\xCC", igrave: "\xEC", ii: "\u2148", iiiint: "\u2A0C", iiint: "\u222D", iinfin: "\u29DC", iiota: "\u2129", IJlig: "\u0132", ijlig: "\u0133", Im: "\u2111", Imacr: "\u012A", imacr: "\u012B", image: "\u2111", ImaginaryI: "\u2148", imagline: "\u2110", imagpart: "\u2111", imath: "\u0131", imof: "\u22B7", imped: "\u01B5", Implies: "\u21D2", in: "\u2208", incare: "\u2105", infin: "\u221E", infintie: "\u29DD", inodot: "\u0131", Int: "\u222C", int: "\u222B", intcal: "\u22BA", integers: "\u2124", Integral: "\u222B", intercal: "\u22BA", Intersection: "\u22C2", intlarhk: "\u2A17", intprod: "\u2A3C", InvisibleComma: "\u2063", InvisibleTimes: "\u2062", IOcy: "\u0401", iocy: "\u0451", Iogon: "\u012E", iogon: "\u012F", Iopf: "\u{1D540}", iopf: "\u{1D55A}", Iota: "\u0399", iota: "\u03B9", iprod: "\u2A3C", iquest: "\xBF", Iscr: "\u2110", iscr: "\u{1D4BE}", isin: "\u2208", isindot: "\u22F5", isinE: "\u22F9", isins: "\u22F4", isinsv: "\u22F3", isinv: "\u2208", it: "\u2062", Itilde: "\u0128", itilde: "\u0129", Iukcy: "\u0406", iukcy: "\u0456", Iuml: "\xCF", iuml: "\xEF", Jcirc: "\u0134", jcirc: "\u0135", Jcy: "\u0419", jcy: "\u0439", Jfr: "\u{1D50D}", jfr: "\u{1D527}", jmath: "\u0237", Jopf: "\u{1D541}", jopf: "\u{1D55B}", Jscr: "\u{1D4A5}", jscr: "\u{1D4BF}", Jsercy: "\u0408", jsercy: "\u0458", Jukcy: "\u0404", jukcy: "\u0454", Kappa: "\u039A", kappa: "\u03BA", kappav: "\u03F0", Kcedil: "\u0136", kcedil: "\u0137", Kcy: "\u041A", kcy: "\u043A", Kfr: "\u{1D50E}", kfr: "\u{1D528}", kgreen: "\u0138", KHcy: "\u0425", khcy: "\u0445", KJcy: "\u040C", kjcy: "\u045C", Kopf: "\u{1D542}", kopf: "\u{1D55C}", Kscr: "\u{1D4A6}", kscr: "\u{1D4C0}", lAarr: "\u21DA", Lacute: "\u0139", lacute: "\u013A", laemptyv: "\u29B4", lagran: "\u2112", Lambda: "\u039B", lambda: "\u03BB", Lang: "\u27EA", lang: "\u27E8", langd: "\u2991", langle: "\u27E8", lap: "\u2A85", Laplacetrf: "\u2112", laquo: "\xAB", Larr: "\u219E", lArr: "\u21D0", larr: "\u2190", larrb: "\u21E4", larrbfs: "\u291F", larrfs: "\u291D", larrhk: "\u21A9", larrlp: "\u21AB", larrpl: "\u2939", larrsim: "\u2973", larrtl: "\u21A2", lat: "\u2AAB", lAtail: "\u291B", latail: "\u2919", late: "\u2AAD", lates: "\u2AAD\uFE00", lBarr: "\u290E", lbarr: "\u290C", lbbrk: "\u2772", lbrace: "{", lbrack: "[", lbrke: "\u298B", lbrksld: "\u298F", lbrkslu: "\u298D", Lcaron: "\u013D", lcaron: "\u013E", Lcedil: "\u013B", lcedil: "\u013C", lceil: "\u2308", lcub: "{", Lcy: "\u041B", lcy: "\u043B", ldca: "\u2936", ldquo: "\u201C", ldquor: "\u201E", ldrdhar: "\u2967", ldrushar: "\u294B", ldsh: "\u21B2", lE: "\u2266", le: "\u2264", LeftAngleBracket: "\u27E8", LeftArrow: "\u2190", Leftarrow: "\u21D0", leftarrow: "\u2190", LeftArrowBar: "\u21E4", LeftArrowRightArrow: "\u21C6", leftarrowtail: "\u21A2", LeftCeiling: "\u2308", LeftDoubleBracket: "\u27E6", LeftDownTeeVector: "\u2961", LeftDownVector: "\u21C3", LeftDownVectorBar: "\u2959", LeftFloor: "\u230A", leftharpoondown: "\u21BD", leftharpoonup: "\u21BC", leftleftarrows: "\u21C7", LeftRightArrow: "\u2194", Leftrightarrow: "\u21D4", leftrightarrow: "\u2194", leftrightarrows: "\u21C6", leftrightharpoons: "\u21CB", leftrightsquigarrow: "\u21AD", LeftRightVector: "\u294E", LeftTee: "\u22A3", LeftTeeArrow: "\u21A4", LeftTeeVector: "\u295A", leftthreetimes: "\u22CB", LeftTriangle: "\u22B2", LeftTriangleBar: "\u29CF", LeftTriangleEqual: "\u22B4", LeftUpDownVector: "\u2951", LeftUpTeeVector: "\u2960", LeftUpVector: "\u21BF", LeftUpVectorBar: "\u2958", LeftVector: "\u21BC", LeftVectorBar: "\u2952", lEg: "\u2A8B", leg: "\u22DA", leq: "\u2264", leqq: "\u2266", leqslant: "\u2A7D", les: "\u2A7D", lescc: "\u2AA8", lesdot: "\u2A7F", lesdoto: "\u2A81", lesdotor: "\u2A83", lesg: "\u22DA\uFE00", lesges: "\u2A93", lessapprox: "\u2A85", lessdot: "\u22D6", lesseqgtr: "\u22DA", lesseqqgtr: "\u2A8B", LessEqualGreater: "\u22DA", LessFullEqual: "\u2266", LessGreater: "\u2276", lessgtr: "\u2276", LessLess: "\u2AA1", lesssim: "\u2272", LessSlantEqual: "\u2A7D", LessTilde: "\u2272", lfisht: "\u297C", lfloor: "\u230A", Lfr: "\u{1D50F}", lfr: "\u{1D529}", lg: "\u2276", lgE: "\u2A91", lHar: "\u2962", lhard: "\u21BD", lharu: "\u21BC", lharul: "\u296A", lhblk: "\u2584", LJcy: "\u0409", ljcy: "\u0459", Ll: "\u22D8", ll: "\u226A", llarr: "\u21C7", llcorner: "\u231E", Lleftarrow: "\u21DA", llhard: "\u296B", lltri: "\u25FA", Lmidot: "\u013F", lmidot: "\u0140", lmoust: "\u23B0", lmoustache: "\u23B0", lnap: "\u2A89", lnapprox: "\u2A89", lnE: "\u2268", lne: "\u2A87", lneq: "\u2A87", lneqq: "\u2268", lnsim: "\u22E6", loang: "\u27EC", loarr: "\u21FD", lobrk: "\u27E6", LongLeftArrow: "\u27F5", Longleftarrow: "\u27F8", longleftarrow: "\u27F5", LongLeftRightArrow: "\u27F7", Longleftrightarrow: "\u27FA", longleftrightarrow: "\u27F7", longmapsto: "\u27FC", LongRightArrow: "\u27F6", Longrightarrow: "\u27F9", longrightarrow: "\u27F6", looparrowleft: "\u21AB", looparrowright: "\u21AC", lopar: "\u2985", Lopf: "\u{1D543}", lopf: "\u{1D55D}", loplus: "\u2A2D", lotimes: "\u2A34", lowast: "\u2217", lowbar: "_", LowerLeftArrow: "\u2199", LowerRightArrow: "\u2198", loz: "\u25CA", lozenge: "\u25CA", lozf: "\u29EB", lpar: "(", lparlt: "\u2993", lrarr: "\u21C6", lrcorner: "\u231F", lrhar: "\u21CB", lrhard: "\u296D", lrm: "\u200E", lrtri: "\u22BF", lsaquo: "\u2039", Lscr: "\u2112", lscr: "\u{1D4C1}", Lsh: "\u21B0", lsh: "\u21B0", lsim: "\u2272", lsime: "\u2A8D", lsimg: "\u2A8F", lsqb: "[", lsquo: "\u2018", lsquor: "\u201A", Lstrok: "\u0141", lstrok: "\u0142", Lt: "\u226A", LT: "<", lt: "<", ltcc: "\u2AA6", ltcir: "\u2A79", ltdot: "\u22D6", lthree: "\u22CB", ltimes: "\u22C9", ltlarr: "\u2976", ltquest: "\u2A7B", ltri: "\u25C3", ltrie: "\u22B4", ltrif: "\u25C2", ltrPar: "\u2996", lurdshar: "\u294A", luruhar: "\u2966", lvertneqq: "\u2268\uFE00", lvnE: "\u2268\uFE00", macr: "\xAF", male: "\u2642", malt: "\u2720", maltese: "\u2720", Map: "\u2905", map: "\u21A6", mapsto: "\u21A6", mapstodown: "\u21A7", mapstoleft: "\u21A4", mapstoup: "\u21A5", marker: "\u25AE", mcomma: "\u2A29", Mcy: "\u041C", mcy: "\u043C", mdash: "\u2014", mDDot: "\u223A", measuredangle: "\u2221", MediumSpace: "\u205F", Mellintrf: "\u2133", Mfr: "\u{1D510}", mfr: "\u{1D52A}", mho: "\u2127", micro: "\xB5", mid: "\u2223", midast: "*", midcir: "\u2AF0", middot: "\xB7", minus: "\u2212", minusb: "\u229F", minusd: "\u2238", minusdu: "\u2A2A", MinusPlus: "\u2213", mlcp: "\u2ADB", mldr: "\u2026", mnplus: "\u2213", models: "\u22A7", Mopf: "\u{1D544}", mopf: "\u{1D55E}", mp: "\u2213", Mscr: "\u2133", mscr: "\u{1D4C2}", mstpos: "\u223E", Mu: "\u039C", mu: "\u03BC", multimap: "\u22B8", mumap: "\u22B8", nabla: "\u2207", Nacute: "\u0143", nacute: "\u0144", nang: "\u2220\u20D2", nap: "\u2249", napE: "\u2A70\u0338", napid: "\u224B\u0338", napos: "\u0149", napprox: "\u2249", natur: "\u266E", natural: "\u266E", naturals: "\u2115", nbsp: "\xA0", nbump: "\u224E\u0338", nbumpe: "\u224F\u0338", ncap: "\u2A43", Ncaron: "\u0147", ncaron: "\u0148", Ncedil: "\u0145", ncedil: "\u0146", ncong: "\u2247", ncongdot: "\u2A6D\u0338", ncup: "\u2A42", Ncy: "\u041D", ncy: "\u043D", ndash: "\u2013", ne: "\u2260", nearhk: "\u2924", neArr: "\u21D7", nearr: "\u2197", nearrow: "\u2197", nedot: "\u2250\u0338", NegativeMediumSpace: "\u200B", NegativeThickSpace: "\u200B", NegativeThinSpace: "\u200B", NegativeVeryThinSpace: "\u200B", nequiv: "\u2262", nesear: "\u2928", nesim: "\u2242\u0338", NestedGreaterGreater: "\u226B", NestedLessLess: "\u226A", NewLine: `
`, nexist: "\u2204", nexists: "\u2204", Nfr: "\u{1D511}", nfr: "\u{1D52B}", ngE: "\u2267\u0338", nge: "\u2271", ngeq: "\u2271", ngeqq: "\u2267\u0338", ngeqslant: "\u2A7E\u0338", nges: "\u2A7E\u0338", nGg: "\u22D9\u0338", ngsim: "\u2275", nGt: "\u226B\u20D2", ngt: "\u226F", ngtr: "\u226F", nGtv: "\u226B\u0338", nhArr: "\u21CE", nharr: "\u21AE", nhpar: "\u2AF2", ni: "\u220B", nis: "\u22FC", nisd: "\u22FA", niv: "\u220B", NJcy: "\u040A", njcy: "\u045A", nlArr: "\u21CD", nlarr: "\u219A", nldr: "\u2025", nlE: "\u2266\u0338", nle: "\u2270", nLeftarrow: "\u21CD", nleftarrow: "\u219A", nLeftrightarrow: "\u21CE", nleftrightarrow: "\u21AE", nleq: "\u2270", nleqq: "\u2266\u0338", nleqslant: "\u2A7D\u0338", nles: "\u2A7D\u0338", nless: "\u226E", nLl: "\u22D8\u0338", nlsim: "\u2274", nLt: "\u226A\u20D2", nlt: "\u226E", nltri: "\u22EA", nltrie: "\u22EC", nLtv: "\u226A\u0338", nmid: "\u2224", NoBreak: "\u2060", NonBreakingSpace: "\xA0", Nopf: "\u2115", nopf: "\u{1D55F}", Not: "\u2AEC", not: "\xAC", NotCongruent: "\u2262", NotCupCap: "\u226D", NotDoubleVerticalBar: "\u2226", NotElement: "\u2209", NotEqual: "\u2260", NotEqualTilde: "\u2242\u0338", NotExists: "\u2204", NotGreater: "\u226F", NotGreaterEqual: "\u2271", NotGreaterFullEqual: "\u2267\u0338", NotGreaterGreater: "\u226B\u0338", NotGreaterLess: "\u2279", NotGreaterSlantEqual: "\u2A7E\u0338", NotGreaterTilde: "\u2275", NotHumpDownHump: "\u224E\u0338", NotHumpEqual: "\u224F\u0338", notin: "\u2209", notindot: "\u22F5\u0338", notinE: "\u22F9\u0338", notinva: "\u2209", notinvb: "\u22F7", notinvc: "\u22F6", NotLeftTriangle: "\u22EA", NotLeftTriangleBar: "\u29CF\u0338", NotLeftTriangleEqual: "\u22EC", NotLess: "\u226E", NotLessEqual: "\u2270", NotLessGreater: "\u2278", NotLessLess: "\u226A\u0338", NotLessSlantEqual: "\u2A7D\u0338", NotLessTilde: "\u2274", NotNestedGreaterGreater: "\u2AA2\u0338", NotNestedLessLess: "\u2AA1\u0338", notni: "\u220C", notniva: "\u220C", notnivb: "\u22FE", notnivc: "\u22FD", NotPrecedes: "\u2280", NotPrecedesEqual: "\u2AAF\u0338", NotPrecedesSlantEqual: "\u22E0", NotReverseElement: "\u220C", NotRightTriangle: "\u22EB", NotRightTriangleBar: "\u29D0\u0338", NotRightTriangleEqual: "\u22ED", NotSquareSubset: "\u228F\u0338", NotSquareSubsetEqual: "\u22E2", NotSquareSuperset: "\u2290\u0338", NotSquareSupersetEqual: "\u22E3", NotSubset: "\u2282\u20D2", NotSubsetEqual: "\u2288", NotSucceeds: "\u2281", NotSucceedsEqual: "\u2AB0\u0338", NotSucceedsSlantEqual: "\u22E1", NotSucceedsTilde: "\u227F\u0338", NotSuperset: "\u2283\u20D2", NotSupersetEqual: "\u2289", NotTilde: "\u2241", NotTildeEqual: "\u2244", NotTildeFullEqual: "\u2247", NotTildeTilde: "\u2249", NotVerticalBar: "\u2224", npar: "\u2226", nparallel: "\u2226", nparsl: "\u2AFD\u20E5", npart: "\u2202\u0338", npolint: "\u2A14", npr: "\u2280", nprcue: "\u22E0", npre: "\u2AAF\u0338", nprec: "\u2280", npreceq: "\u2AAF\u0338", nrArr: "\u21CF", nrarr: "\u219B", nrarrc: "\u2933\u0338", nrarrw: "\u219D\u0338", nRightarrow: "\u21CF", nrightarrow: "\u219B", nrtri: "\u22EB", nrtrie: "\u22ED", nsc: "\u2281", nsccue: "\u22E1", nsce: "\u2AB0\u0338", Nscr: "\u{1D4A9}", nscr: "\u{1D4C3}", nshortmid: "\u2224", nshortparallel: "\u2226", nsim: "\u2241", nsime: "\u2244", nsimeq: "\u2244", nsmid: "\u2224", nspar: "\u2226", nsqsube: "\u22E2", nsqsupe: "\u22E3", nsub: "\u2284", nsubE: "\u2AC5\u0338", nsube: "\u2288", nsubset: "\u2282\u20D2", nsubseteq: "\u2288", nsubseteqq: "\u2AC5\u0338", nsucc: "\u2281", nsucceq: "\u2AB0\u0338", nsup: "\u2285", nsupE: "\u2AC6\u0338", nsupe: "\u2289", nsupset: "\u2283\u20D2", nsupseteq: "\u2289", nsupseteqq: "\u2AC6\u0338", ntgl: "\u2279", Ntilde: "\xD1", ntilde: "\xF1", ntlg: "\u2278", ntriangleleft: "\u22EA", ntrianglelefteq: "\u22EC", ntriangleright: "\u22EB", ntrianglerighteq: "\u22ED", Nu: "\u039D", nu: "\u03BD", num: "#", numero: "\u2116", numsp: "\u2007", nvap: "\u224D\u20D2", nVDash: "\u22AF", nVdash: "\u22AE", nvDash: "\u22AD", nvdash: "\u22AC", nvge: "\u2265\u20D2", nvgt: ">\u20D2", nvHarr: "\u2904", nvinfin: "\u29DE", nvlArr: "\u2902", nvle: "\u2264\u20D2", nvlt: "<\u20D2", nvltrie: "\u22B4\u20D2", nvrArr: "\u2903", nvrtrie: "\u22B5\u20D2", nvsim: "\u223C\u20D2", nwarhk: "\u2923", nwArr: "\u21D6", nwarr: "\u2196", nwarrow: "\u2196", nwnear: "\u2927", Oacute: "\xD3", oacute: "\xF3", oast: "\u229B", ocir: "\u229A", Ocirc: "\xD4", ocirc: "\xF4", Ocy: "\u041E", ocy: "\u043E", odash: "\u229D", Odblac: "\u0150", odblac: "\u0151", odiv: "\u2A38", odot: "\u2299", odsold: "\u29BC", OElig: "\u0152", oelig: "\u0153", ofcir: "\u29BF", Ofr: "\u{1D512}", ofr: "\u{1D52C}", ogon: "\u02DB", Ograve: "\xD2", ograve: "\xF2", ogt: "\u29C1", ohbar: "\u29B5", ohm: "\u03A9", oint: "\u222E", olarr: "\u21BA", olcir: "\u29BE", olcross: "\u29BB", oline: "\u203E", olt: "\u29C0", Omacr: "\u014C", omacr: "\u014D", Omega: "\u03A9", omega: "\u03C9", Omicron: "\u039F", omicron: "\u03BF", omid: "\u29B6", ominus: "\u2296", Oopf: "\u{1D546}", oopf: "\u{1D560}", opar: "\u29B7", OpenCurlyDoubleQuote: "\u201C", OpenCurlyQuote: "\u2018", operp: "\u29B9", oplus: "\u2295", Or: "\u2A54", or: "\u2228", orarr: "\u21BB", ord: "\u2A5D", order: "\u2134", orderof: "\u2134", ordf: "\xAA", ordm: "\xBA", origof: "\u22B6", oror: "\u2A56", orslope: "\u2A57", orv: "\u2A5B", oS: "\u24C8", Oscr: "\u{1D4AA}", oscr: "\u2134", Oslash: "\xD8", oslash: "\xF8", osol: "\u2298", Otilde: "\xD5", otilde: "\xF5", Otimes: "\u2A37", otimes: "\u2297", otimesas: "\u2A36", Ouml: "\xD6", ouml: "\xF6", ovbar: "\u233D", OverBar: "\u203E", OverBrace: "\u23DE", OverBracket: "\u23B4", OverParenthesis: "\u23DC", par: "\u2225", para: "\xB6", parallel: "\u2225", parsim: "\u2AF3", parsl: "\u2AFD", part: "\u2202", PartialD: "\u2202", Pcy: "\u041F", pcy: "\u043F", percnt: "%", period: ".", permil: "\u2030", perp: "\u22A5", pertenk: "\u2031", Pfr: "\u{1D513}", pfr: "\u{1D52D}", Phi: "\u03A6", phi: "\u03C6", phiv: "\u03D5", phmmat: "\u2133", phone: "\u260E", Pi: "\u03A0", pi: "\u03C0", pitchfork: "\u22D4", piv: "\u03D6", planck: "\u210F", planckh: "\u210E", plankv: "\u210F", plus: "+", plusacir: "\u2A23", plusb: "\u229E", pluscir: "\u2A22", plusdo: "\u2214", plusdu: "\u2A25", pluse: "\u2A72", PlusMinus: "\xB1", plusmn: "\xB1", plussim: "\u2A26", plustwo: "\u2A27", pm: "\xB1", Poincareplane: "\u210C", pointint: "\u2A15", Popf: "\u2119", popf: "\u{1D561}", pound: "\xA3", Pr: "\u2ABB", pr: "\u227A", prap: "\u2AB7", prcue: "\u227C", prE: "\u2AB3", pre: "\u2AAF", prec: "\u227A", precapprox: "\u2AB7", preccurlyeq: "\u227C", Precedes: "\u227A", PrecedesEqual: "\u2AAF", PrecedesSlantEqual: "\u227C", PrecedesTilde: "\u227E", preceq: "\u2AAF", precnapprox: "\u2AB9", precneqq: "\u2AB5", precnsim: "\u22E8", precsim: "\u227E", Prime: "\u2033", prime: "\u2032", primes: "\u2119", prnap: "\u2AB9", prnE: "\u2AB5", prnsim: "\u22E8", prod: "\u220F", Product: "\u220F", profalar: "\u232E", profline: "\u2312", profsurf: "\u2313", prop: "\u221D", Proportion: "\u2237", Proportional: "\u221D", propto: "\u221D", prsim: "\u227E", prurel: "\u22B0", Pscr: "\u{1D4AB}", pscr: "\u{1D4C5}", Psi: "\u03A8", psi: "\u03C8", puncsp: "\u2008", Qfr: "\u{1D514}", qfr: "\u{1D52E}", qint: "\u2A0C", Qopf: "\u211A", qopf: "\u{1D562}", qprime: "\u2057", Qscr: "\u{1D4AC}", qscr: "\u{1D4C6}", quaternions: "\u210D", quatint: "\u2A16", quest: "?", questeq: "\u225F", QUOT: '"', quot: '"', rAarr: "\u21DB", race: "\u223D\u0331", Racute: "\u0154", racute: "\u0155", radic: "\u221A", raemptyv: "\u29B3", Rang: "\u27EB", rang: "\u27E9", rangd: "\u2992", range: "\u29A5", rangle: "\u27E9", raquo: "\xBB", Rarr: "\u21A0", rArr: "\u21D2", rarr: "\u2192", rarrap: "\u2975", rarrb: "\u21E5", rarrbfs: "\u2920", rarrc: "\u2933", rarrfs: "\u291E", rarrhk: "\u21AA", rarrlp: "\u21AC", rarrpl: "\u2945", rarrsim: "\u2974", Rarrtl: "\u2916", rarrtl: "\u21A3", rarrw: "\u219D", rAtail: "\u291C", ratail: "\u291A", ratio: "\u2236", rationals: "\u211A", RBarr: "\u2910", rBarr: "\u290F", rbarr: "\u290D", rbbrk: "\u2773", rbrace: "}", rbrack: "]", rbrke: "\u298C", rbrksld: "\u298E", rbrkslu: "\u2990", Rcaron: "\u0158", rcaron: "\u0159", Rcedil: "\u0156", rcedil: "\u0157", rceil: "\u2309", rcub: "}", Rcy: "\u0420", rcy: "\u0440", rdca: "\u2937", rdldhar: "\u2969", rdquo: "\u201D", rdquor: "\u201D", rdsh: "\u21B3", Re: "\u211C", real: "\u211C", realine: "\u211B", realpart: "\u211C", reals: "\u211D", rect: "\u25AD", REG: "\xAE", reg: "\xAE", ReverseElement: "\u220B", ReverseEquilibrium: "\u21CB", ReverseUpEquilibrium: "\u296F", rfisht: "\u297D", rfloor: "\u230B", Rfr: "\u211C", rfr: "\u{1D52F}", rHar: "\u2964", rhard: "\u21C1", rharu: "\u21C0", rharul: "\u296C", Rho: "\u03A1", rho: "\u03C1", rhov: "\u03F1", RightAngleBracket: "\u27E9", RightArrow: "\u2192", Rightarrow: "\u21D2", rightarrow: "\u2192", RightArrowBar: "\u21E5", RightArrowLeftArrow: "\u21C4", rightarrowtail: "\u21A3", RightCeiling: "\u2309", RightDoubleBracket: "\u27E7", RightDownTeeVector: "\u295D", RightDownVector: "\u21C2", RightDownVectorBar: "\u2955", RightFloor: "\u230B", rightharpoondown: "\u21C1", rightharpoonup: "\u21C0", rightleftarrows: "\u21C4", rightleftharpoons: "\u21CC", rightrightarrows: "\u21C9", rightsquigarrow: "\u219D", RightTee: "\u22A2", RightTeeArrow: "\u21A6", RightTeeVector: "\u295B", rightthreetimes: "\u22CC", RightTriangle: "\u22B3", RightTriangleBar: "\u29D0", RightTriangleEqual: "\u22B5", RightUpDownVector: "\u294F", RightUpTeeVector: "\u295C", RightUpVector: "\u21BE", RightUpVectorBar: "\u2954", RightVector: "\u21C0", RightVectorBar: "\u2953", ring: "\u02DA", risingdotseq: "\u2253", rlarr: "\u21C4", rlhar: "\u21CC", rlm: "\u200F", rmoust: "\u23B1", rmoustache: "\u23B1", rnmid: "\u2AEE", roang: "\u27ED", roarr: "\u21FE", robrk: "\u27E7", ropar: "\u2986", Ropf: "\u211D", ropf: "\u{1D563}", roplus: "\u2A2E", rotimes: "\u2A35", RoundImplies: "\u2970", rpar: ")", rpargt: "\u2994", rppolint: "\u2A12", rrarr: "\u21C9", Rrightarrow: "\u21DB", rsaquo: "\u203A", Rscr: "\u211B", rscr: "\u{1D4C7}", Rsh: "\u21B1", rsh: "\u21B1", rsqb: "]", rsquo: "\u2019", rsquor: "\u2019", rthree: "\u22CC", rtimes: "\u22CA", rtri: "\u25B9", rtrie: "\u22B5", rtrif: "\u25B8", rtriltri: "\u29CE", RuleDelayed: "\u29F4", ruluhar: "\u2968", rx: "\u211E", Sacute: "\u015A", sacute: "\u015B", sbquo: "\u201A", Sc: "\u2ABC", sc: "\u227B", scap: "\u2AB8", Scaron: "\u0160", scaron: "\u0161", sccue: "\u227D", scE: "\u2AB4", sce: "\u2AB0", Scedil: "\u015E", scedil: "\u015F", Scirc: "\u015C", scirc: "\u015D", scnap: "\u2ABA", scnE: "\u2AB6", scnsim: "\u22E9", scpolint: "\u2A13", scsim: "\u227F", Scy: "\u0421", scy: "\u0441", sdot: "\u22C5", sdotb: "\u22A1", sdote: "\u2A66", searhk: "\u2925", seArr: "\u21D8", searr: "\u2198", searrow: "\u2198", sect: "\xA7", semi: ";", seswar: "\u2929", setminus: "\u2216", setmn: "\u2216", sext: "\u2736", Sfr: "\u{1D516}", sfr: "\u{1D530}", sfrown: "\u2322", sharp: "\u266F", SHCHcy: "\u0429", shchcy: "\u0449", SHcy: "\u0428", shcy: "\u0448", ShortDownArrow: "\u2193", ShortLeftArrow: "\u2190", shortmid: "\u2223", shortparallel: "\u2225", ShortRightArrow: "\u2192", ShortUpArrow: "\u2191", shy: "\xAD", Sigma: "\u03A3", sigma: "\u03C3", sigmaf: "\u03C2", sigmav: "\u03C2", sim: "\u223C", simdot: "\u2A6A", sime: "\u2243", simeq: "\u2243", simg: "\u2A9E", simgE: "\u2AA0", siml: "\u2A9D", simlE: "\u2A9F", simne: "\u2246", simplus: "\u2A24", simrarr: "\u2972", slarr: "\u2190", SmallCircle: "\u2218", smallsetminus: "\u2216", smashp: "\u2A33", smeparsl: "\u29E4", smid: "\u2223", smile: "\u2323", smt: "\u2AAA", smte: "\u2AAC", smtes: "\u2AAC\uFE00", SOFTcy: "\u042C", softcy: "\u044C", sol: "/", solb: "\u29C4", solbar: "\u233F", Sopf: "\u{1D54A}", sopf: "\u{1D564}", spades: "\u2660", spadesuit: "\u2660", spar: "\u2225", sqcap: "\u2293", sqcaps: "\u2293\uFE00", sqcup: "\u2294", sqcups: "\u2294\uFE00", Sqrt: "\u221A", sqsub: "\u228F", sqsube: "\u2291", sqsubset: "\u228F", sqsubseteq: "\u2291", sqsup: "\u2290", sqsupe: "\u2292", sqsupset: "\u2290", sqsupseteq: "\u2292", squ: "\u25A1", Square: "\u25A1", square: "\u25A1", SquareIntersection: "\u2293", SquareSubset: "\u228F", SquareSubsetEqual: "\u2291", SquareSuperset: "\u2290", SquareSupersetEqual: "\u2292", SquareUnion: "\u2294", squarf: "\u25AA", squf: "\u25AA", srarr: "\u2192", Sscr: "\u{1D4AE}", sscr: "\u{1D4C8}", ssetmn: "\u2216", ssmile: "\u2323", sstarf: "\u22C6", Star: "\u22C6", star: "\u2606", starf: "\u2605", straightepsilon: "\u03F5", straightphi: "\u03D5", strns: "\xAF", Sub: "\u22D0", sub: "\u2282", subdot: "\u2ABD", subE: "\u2AC5", sube: "\u2286", subedot: "\u2AC3", submult: "\u2AC1", subnE: "\u2ACB", subne: "\u228A", subplus: "\u2ABF", subrarr: "\u2979", Subset: "\u22D0", subset: "\u2282", subseteq: "\u2286", subseteqq: "\u2AC5", SubsetEqual: "\u2286", subsetneq: "\u228A", subsetneqq: "\u2ACB", subsim: "\u2AC7", subsub: "\u2AD5", subsup: "\u2AD3", succ: "\u227B", succapprox: "\u2AB8", succcurlyeq: "\u227D", Succeeds: "\u227B", SucceedsEqual: "\u2AB0", SucceedsSlantEqual: "\u227D", SucceedsTilde: "\u227F", succeq: "\u2AB0", succnapprox: "\u2ABA", succneqq: "\u2AB6", succnsim: "\u22E9", succsim: "\u227F", SuchThat: "\u220B", Sum: "\u2211", sum: "\u2211", sung: "\u266A", Sup: "\u22D1", sup: "\u2283", sup1: "\xB9", sup2: "\xB2", sup3: "\xB3", supdot: "\u2ABE", supdsub: "\u2AD8", supE: "\u2AC6", supe: "\u2287", supedot: "\u2AC4", Superset: "\u2283", SupersetEqual: "\u2287", suphsol: "\u27C9", suphsub: "\u2AD7", suplarr: "\u297B", supmult: "\u2AC2", supnE: "\u2ACC", supne: "\u228B", supplus: "\u2AC0", Supset: "\u22D1", supset: "\u2283", supseteq: "\u2287", supseteqq: "\u2AC6", supsetneq: "\u228B", supsetneqq: "\u2ACC", supsim: "\u2AC8", supsub: "\u2AD4", supsup: "\u2AD6", swarhk: "\u2926", swArr: "\u21D9", swarr: "\u2199", swarrow: "\u2199", swnwar: "\u292A", szlig: "\xDF", Tab: "	", target: "\u2316", Tau: "\u03A4", tau: "\u03C4", tbrk: "\u23B4", Tcaron: "\u0164", tcaron: "\u0165", Tcedil: "\u0162", tcedil: "\u0163", Tcy: "\u0422", tcy: "\u0442", tdot: "\u20DB", telrec: "\u2315", Tfr: "\u{1D517}", tfr: "\u{1D531}", there4: "\u2234", Therefore: "\u2234", therefore: "\u2234", Theta: "\u0398", theta: "\u03B8", thetasym: "\u03D1", thetav: "\u03D1", thickapprox: "\u2248", thicksim: "\u223C", ThickSpace: "\u205F\u200A", thinsp: "\u2009", ThinSpace: "\u2009", thkap: "\u2248", thksim: "\u223C", THORN: "\xDE", thorn: "\xFE", Tilde: "\u223C", tilde: "\u02DC", TildeEqual: "\u2243", TildeFullEqual: "\u2245", TildeTilde: "\u2248", times: "\xD7", timesb: "\u22A0", timesbar: "\u2A31", timesd: "\u2A30", tint: "\u222D", toea: "\u2928", top: "\u22A4", topbot: "\u2336", topcir: "\u2AF1", Topf: "\u{1D54B}", topf: "\u{1D565}", topfork: "\u2ADA", tosa: "\u2929", tprime: "\u2034", TRADE: "\u2122", trade: "\u2122", triangle: "\u25B5", triangledown: "\u25BF", triangleleft: "\u25C3", trianglelefteq: "\u22B4", triangleq: "\u225C", triangleright: "\u25B9", trianglerighteq: "\u22B5", tridot: "\u25EC", trie: "\u225C", triminus: "\u2A3A", TripleDot: "\u20DB", triplus: "\u2A39", trisb: "\u29CD", tritime: "\u2A3B", trpezium: "\u23E2", Tscr: "\u{1D4AF}", tscr: "\u{1D4C9}", TScy: "\u0426", tscy: "\u0446", TSHcy: "\u040B", tshcy: "\u045B", Tstrok: "\u0166", tstrok: "\u0167", twixt: "\u226C", twoheadleftarrow: "\u219E", twoheadrightarrow: "\u21A0", Uacute: "\xDA", uacute: "\xFA", Uarr: "\u219F", uArr: "\u21D1", uarr: "\u2191", Uarrocir: "\u2949", Ubrcy: "\u040E", ubrcy: "\u045E", Ubreve: "\u016C", ubreve: "\u016D", Ucirc: "\xDB", ucirc: "\xFB", Ucy: "\u0423", ucy: "\u0443", udarr: "\u21C5", Udblac: "\u0170", udblac: "\u0171", udhar: "\u296E", ufisht: "\u297E", Ufr: "\u{1D518}", ufr: "\u{1D532}", Ugrave: "\xD9", ugrave: "\xF9", uHar: "\u2963", uharl: "\u21BF", uharr: "\u21BE", uhblk: "\u2580", ulcorn: "\u231C", ulcorner: "\u231C", ulcrop: "\u230F", ultri: "\u25F8", Umacr: "\u016A", umacr: "\u016B", uml: "\xA8", UnderBar: "_", UnderBrace: "\u23DF", UnderBracket: "\u23B5", UnderParenthesis: "\u23DD", Union: "\u22C3", UnionPlus: "\u228E", Uogon: "\u0172", uogon: "\u0173", Uopf: "\u{1D54C}", uopf: "\u{1D566}", UpArrow: "\u2191", Uparrow: "\u21D1", uparrow: "\u2191", UpArrowBar: "\u2912", UpArrowDownArrow: "\u21C5", UpDownArrow: "\u2195", Updownarrow: "\u21D5", updownarrow: "\u2195", UpEquilibrium: "\u296E", upharpoonleft: "\u21BF", upharpoonright: "\u21BE", uplus: "\u228E", UpperLeftArrow: "\u2196", UpperRightArrow: "\u2197", Upsi: "\u03D2", upsi: "\u03C5", upsih: "\u03D2", Upsilon: "\u03A5", upsilon: "\u03C5", UpTee: "\u22A5", UpTeeArrow: "\u21A5", upuparrows: "\u21C8", urcorn: "\u231D", urcorner: "\u231D", urcrop: "\u230E", Uring: "\u016E", uring: "\u016F", urtri: "\u25F9", Uscr: "\u{1D4B0}", uscr: "\u{1D4CA}", utdot: "\u22F0", Utilde: "\u0168", utilde: "\u0169", utri: "\u25B5", utrif: "\u25B4", uuarr: "\u21C8", Uuml: "\xDC", uuml: "\xFC", uwangle: "\u29A7", vangrt: "\u299C", varepsilon: "\u03F5", varkappa: "\u03F0", varnothing: "\u2205", varphi: "\u03D5", varpi: "\u03D6", varpropto: "\u221D", vArr: "\u21D5", varr: "\u2195", varrho: "\u03F1", varsigma: "\u03C2", varsubsetneq: "\u228A\uFE00", varsubsetneqq: "\u2ACB\uFE00", varsupsetneq: "\u228B\uFE00", varsupsetneqq: "\u2ACC\uFE00", vartheta: "\u03D1", vartriangleleft: "\u22B2", vartriangleright: "\u22B3", Vbar: "\u2AEB", vBar: "\u2AE8", vBarv: "\u2AE9", Vcy: "\u0412", vcy: "\u0432", VDash: "\u22AB", Vdash: "\u22A9", vDash: "\u22A8", vdash: "\u22A2", Vdashl: "\u2AE6", Vee: "\u22C1", vee: "\u2228", veebar: "\u22BB", veeeq: "\u225A", vellip: "\u22EE", Verbar: "\u2016", verbar: "|", Vert: "\u2016", vert: "|", VerticalBar: "\u2223", VerticalLine: "|", VerticalSeparator: "\u2758", VerticalTilde: "\u2240", VeryThinSpace: "\u200A", Vfr: "\u{1D519}", vfr: "\u{1D533}", vltri: "\u22B2", vnsub: "\u2282\u20D2", vnsup: "\u2283\u20D2", Vopf: "\u{1D54D}", vopf: "\u{1D567}", vprop: "\u221D", vrtri: "\u22B3", Vscr: "\u{1D4B1}", vscr: "\u{1D4CB}", vsubnE: "\u2ACB\uFE00", vsubne: "\u228A\uFE00", vsupnE: "\u2ACC\uFE00", vsupne: "\u228B\uFE00", Vvdash: "\u22AA", vzigzag: "\u299A", Wcirc: "\u0174", wcirc: "\u0175", wedbar: "\u2A5F", Wedge: "\u22C0", wedge: "\u2227", wedgeq: "\u2259", weierp: "\u2118", Wfr: "\u{1D51A}", wfr: "\u{1D534}", Wopf: "\u{1D54E}", wopf: "\u{1D568}", wp: "\u2118", wr: "\u2240", wreath: "\u2240", Wscr: "\u{1D4B2}", wscr: "\u{1D4CC}", xcap: "\u22C2", xcirc: "\u25EF", xcup: "\u22C3", xdtri: "\u25BD", Xfr: "\u{1D51B}", xfr: "\u{1D535}", xhArr: "\u27FA", xharr: "\u27F7", Xi: "\u039E", xi: "\u03BE", xlArr: "\u27F8", xlarr: "\u27F5", xmap: "\u27FC", xnis: "\u22FB", xodot: "\u2A00", Xopf: "\u{1D54F}", xopf: "\u{1D569}", xoplus: "\u2A01", xotime: "\u2A02", xrArr: "\u27F9", xrarr: "\u27F6", Xscr: "\u{1D4B3}", xscr: "\u{1D4CD}", xsqcup: "\u2A06", xuplus: "\u2A04", xutri: "\u25B3", xvee: "\u22C1", xwedge: "\u22C0", Yacute: "\xDD", yacute: "\xFD", YAcy: "\u042F", yacy: "\u044F", Ycirc: "\u0176", ycirc: "\u0177", Ycy: "\u042B", ycy: "\u044B", yen: "\xA5", Yfr: "\u{1D51C}", yfr: "\u{1D536}", YIcy: "\u0407", yicy: "\u0457", Yopf: "\u{1D550}", yopf: "\u{1D56A}", Yscr: "\u{1D4B4}", yscr: "\u{1D4CE}", YUcy: "\u042E", yucy: "\u044E", Yuml: "\u0178", yuml: "\xFF", Zacute: "\u0179", zacute: "\u017A", Zcaron: "\u017D", zcaron: "\u017E", Zcy: "\u0417", zcy: "\u0437", Zdot: "\u017B", zdot: "\u017C", zeetrf: "\u2128", ZeroWidthSpace: "\u200B", Zeta: "\u0396", zeta: "\u03B6", Zfr: "\u2128", zfr: "\u{1D537}", ZHcy: "\u0416", zhcy: "\u0436", zigrarr: "\u21DD", Zopf: "\u2124", zopf: "\u{1D56B}", Zscr: "\u{1D4B5}", zscr: "\u{1D4CF}", zwj: "\u200D", zwnj: "\u200C" }), e.entityMap = e.HTML_ENTITIES;
  })(Ji)), Ji;
}
var gt = {}, mc;
function Nd() {
  if (mc) return gt;
  mc = 1;
  var e = ri().NAMESPACE, n = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, i = new RegExp("[\\-\\.0-9" + n.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"), t = new RegExp("^" + n.source + i.source + "*(?::" + n.source + i.source + "*)?$"), r = 0, a = 1, c = 2, o = 3, u = 4, s = 5, h = 6, g = 7;
  function f(E, S) {
    this.message = E, this.locator = S, Error.captureStackTrace && Error.captureStackTrace(this, f);
  }
  f.prototype = new Error(), f.prototype.name = f.name;
  function m() {
  }
  m.prototype = { parse: function(E, S, X) {
    var A = this.domBuilder;
    A.startDocument(), w(S, S = {}), D(E, S, X, A, this.errorHandler), A.endDocument();
  } };
  function D(E, S, X, A, R) {
    function M(me) {
      if (me > 65535) {
        me -= 65536;
        var ce = 55296 + (me >> 10), N = 56320 + (me & 1023);
        return String.fromCharCode(ce, N);
      } else return String.fromCharCode(me);
    }
    function H(me) {
      var ce = me.slice(1, -1);
      return Object.hasOwnProperty.call(X, ce) ? X[ce] : ce.charAt(0) === "#" ? M(parseInt(ce.substr(1).replace("x", "0x"))) : (R.error("entity not found:" + me), me);
    }
    function F(me) {
      if (me > K) {
        var ce = E.substring(K, me).replace(/&#?\w+;/g, H);
        j && B(K), A.characters(ce, 0, me - K), K = me;
      }
    }
    function B(me, ce) {
      for (; me >= P && (ce = z.exec(E)); ) O = ce.index, P = O + ce[0].length, j.lineNumber++;
      j.columnNumber = me - O + 1;
    }
    for (var O = 0, P = 0, z = /.*(?:\r\n?|\n)|.*$/g, j = A.locator, te = [{ currentNSMap: S }], I = {}, K = 0; ; ) {
      try {
        var ie = E.indexOf("<", K);
        if (ie < 0) {
          if (!E.substr(K).match(/^\s*$/)) {
            var re = A.doc, ee = re.createTextNode(E.substr(K));
            re.appendChild(ee), A.currentElement = ee;
          }
          return;
        }
        switch (ie > K && F(ie), E.charAt(ie + 1)) {
          case "/":
            var Y = E.indexOf(">", ie + 3), de = E.substring(ie + 2, Y).replace(/[ \t\n\r]+$/g, ""), De = te.pop();
            Y < 0 ? (de = E.substring(ie + 2).replace(/[\s<].*/, ""), R.error("end tag name: " + de + " is not complete:" + De.tagName), Y = ie + 1 + de.length) : de.match(/\s</) && (de = de.replace(/[\s<].*/, ""), R.error("end tag name: " + de + " maybe not complete"), Y = ie + 1 + de.length);
            var he = De.localNSMap, ve = De.tagName == de, Fe = ve || De.tagName && De.tagName.toLowerCase() == de.toLowerCase();
            if (Fe) {
              if (A.endElement(De.uri, De.localName, de), he) for (var Se in he) Object.prototype.hasOwnProperty.call(he, Se) && A.endPrefixMapping(Se);
              ve || R.fatalError("end tag name: " + de + " is not match the current start tagName:" + De.tagName);
            } else te.push(De);
            Y++;
            break;
          case "?":
            j && B(ie), Y = x(E, ie, A);
            break;
          case "!":
            j && B(ie), Y = T(E, ie, A, R);
            break;
          default:
            j && B(ie);
            var V = new _(), J = te[te.length - 1].currentNSMap, Y = d(E, ie, V, J, H, R), ue = V.length;
            if (!V.closed && y(E, Y, V.tagName, I) && (V.closed = true, X.nbsp || R.warning("unclosed xml attribute")), j && ue) {
              for (var fe = b(j, {}), ge = 0; ge < ue; ge++) {
                var ye = V[ge];
                B(ye.offset), ye.locator = b(j, {});
              }
              A.locator = fe, p(V, A, J) && te.push(V), A.locator = j;
            } else p(V, A, J) && te.push(V);
            e.isHTML(V.uri) && !V.closed ? Y = l(E, Y, V.tagName, H, A) : Y++;
        }
      } catch (me) {
        if (me instanceof f) throw me;
        R.error("element parse error: " + me), Y = -1;
      }
      Y > K ? K = Y : F(Math.max(ie, K) + 1);
    }
  }
  function b(E, S) {
    return S.lineNumber = E.lineNumber, S.columnNumber = E.columnNumber, S;
  }
  function d(E, S, X, A, R, M) {
    function H(j, te, I) {
      X.attributeNames.hasOwnProperty(j) && M.fatalError("Attribute " + j + " redefined"), X.addValue(j, te.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, R), I);
    }
    for (var F, B, O = ++S, P = r; ; ) {
      var z = E.charAt(O);
      switch (z) {
        case "=":
          if (P === a) F = E.slice(S, O), P = o;
          else if (P === c) P = o;
          else throw new Error("attribute equal must after attrName");
          break;
        case "'":
        case '"':
          if (P === o || P === a) if (P === a && (M.warning('attribute value must after "="'), F = E.slice(S, O)), S = O + 1, O = E.indexOf(z, S), O > 0) B = E.slice(S, O), H(F, B, S - 1), P = s;
          else throw new Error("attribute value no end '" + z + "' match");
          else if (P == u) B = E.slice(S, O), H(F, B, S), M.warning('attribute "' + F + '" missed start quot(' + z + ")!!"), S = O + 1, P = s;
          else throw new Error('attribute value must after "="');
          break;
        case "/":
          switch (P) {
            case r:
              X.setTagName(E.slice(S, O));
            case s:
            case h:
            case g:
              P = g, X.closed = true;
            case u:
            case a:
              break;
            case c:
              X.closed = true;
              break;
            default:
              throw new Error("attribute invalid close char('/')");
          }
          break;
        case "":
          return M.error("unexpected end of input"), P == r && X.setTagName(E.slice(S, O)), O;
        case ">":
          switch (P) {
            case r:
              X.setTagName(E.slice(S, O));
            case s:
            case h:
            case g:
              break;
            case u:
            case a:
              B = E.slice(S, O), B.slice(-1) === "/" && (X.closed = true, B = B.slice(0, -1));
            case c:
              P === c && (B = F), P == u ? (M.warning('attribute "' + B + '" missed quot(")!'), H(F, B, S)) : ((!e.isHTML(A[""]) || !B.match(/^(?:disabled|checked|selected)$/i)) && M.warning('attribute "' + B + '" missed value!! "' + B + '" instead!!'), H(B, B, S));
              break;
            case o:
              throw new Error("attribute value missed!!");
          }
          return O;
        case "\x80":
          z = " ";
        default:
          if (z <= " ") switch (P) {
            case r:
              X.setTagName(E.slice(S, O)), P = h;
              break;
            case a:
              F = E.slice(S, O), P = c;
              break;
            case u:
              var B = E.slice(S, O);
              M.warning('attribute "' + B + '" missed quot(")!!'), H(F, B, S);
            case s:
              P = h;
              break;
          }
          else switch (P) {
            case c:
              X.tagName, (!e.isHTML(A[""]) || !F.match(/^(?:disabled|checked|selected)$/i)) && M.warning('attribute "' + F + '" missed value!! "' + F + '" instead2!!'), H(F, F, S), S = O, P = a;
              break;
            case s:
              M.warning('attribute space is required"' + F + '"!!');
            case h:
              P = a, S = O;
              break;
            case o:
              P = u, S = O;
              break;
            case g:
              throw new Error("elements closed character '/' and '>' must be connected to");
          }
      }
      O++;
    }
  }
  function p(E, S, X) {
    for (var A = E.tagName, R = null, z = E.length; z--; ) {
      var M = E[z], H = M.qName, F = M.value, j = H.indexOf(":");
      if (j > 0) var B = M.prefix = H.slice(0, j), O = H.slice(j + 1), P = B === "xmlns" && O;
      else O = H, B = null, P = H === "xmlns" && "";
      M.localName = O, P !== false && (R == null && (R = {}, w(X, X = {})), X[P] = R[P] = F, M.uri = e.XMLNS, S.startPrefixMapping(P, F));
    }
    for (var z = E.length; z--; ) {
      M = E[z];
      var B = M.prefix;
      B && (B === "xml" && (M.uri = e.XML), B !== "xmlns" && (M.uri = X[B || ""]));
    }
    var j = A.indexOf(":");
    j > 0 ? (B = E.prefix = A.slice(0, j), O = E.localName = A.slice(j + 1)) : (B = null, O = E.localName = A);
    var te = E.uri = X[B || ""];
    if (S.startElement(te, O, A, E), E.closed) {
      if (S.endElement(te, O, A), R) for (B in R) Object.prototype.hasOwnProperty.call(R, B) && S.endPrefixMapping(B);
    } else return E.currentNSMap = X, E.localNSMap = R, true;
  }
  function l(E, S, X, A, R) {
    if (/^(?:script|textarea)$/i.test(X)) {
      var M = E.indexOf("</" + X + ">", S), H = E.substring(S + 1, M);
      if (/[&<]/.test(H)) return /^script$/i.test(X) ? (R.characters(H, 0, H.length), M) : (H = H.replace(/&#?\w+;/g, A), R.characters(H, 0, H.length), M);
    }
    return S + 1;
  }
  function y(E, S, X, A) {
    var R = A[X];
    return R == null && (R = E.lastIndexOf("</" + X + ">"), R < S && (R = E.lastIndexOf("</" + X)), A[X] = R), R < S;
  }
  function w(E, S) {
    for (var X in E) Object.prototype.hasOwnProperty.call(E, X) && (S[X] = E[X]);
  }
  function T(E, S, X, A) {
    var R = E.charAt(S + 2);
    switch (R) {
      case "-":
        if (E.charAt(S + 3) === "-") {
          var M = E.indexOf("-->", S + 4);
          return M > S ? (X.comment(E, S + 4, M - S - 4), M + 3) : (A.error("Unclosed comment"), -1);
        } else return -1;
      default:
        if (E.substr(S + 3, 6) == "CDATA[") {
          var M = E.indexOf("]]>", S + 9);
          return X.startCDATA(), X.characters(E, S + 9, M - S - 9), X.endCDATA(), M + 3;
        }
        var H = C(E, S), F = H.length;
        if (F > 1 && /!doctype/i.test(H[0][0])) {
          var B = H[1][0], O = false, P = false;
          F > 3 && (/^public$/i.test(H[2][0]) ? (O = H[3][0], P = F > 4 && H[4][0]) : /^system$/i.test(H[2][0]) && (P = H[3][0]));
          var z = H[F - 1];
          return X.startDTD(B, O, P), X.endDTD(), z.index + z[0].length;
        }
    }
    return -1;
  }
  function x(E, S, X) {
    var A = E.indexOf("?>", S);
    if (A) {
      var R = E.substring(S, A).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
      return R ? (R[0].length, X.processingInstruction(R[1], R[2]), A + 2) : -1;
    }
    return -1;
  }
  function _() {
    this.attributeNames = {};
  }
  _.prototype = { setTagName: function(E) {
    if (!t.test(E)) throw new Error("invalid tagName:" + E);
    this.tagName = E;
  }, addValue: function(E, S, X) {
    if (!t.test(E)) throw new Error("invalid attribute:" + E);
    this.attributeNames[E] = this.length, this[this.length++] = { qName: E, value: S, offset: X };
  }, length: 0, getLocalName: function(E) {
    return this[E].localName;
  }, getLocator: function(E) {
    return this[E].locator;
  }, getQName: function(E) {
    return this[E].qName;
  }, getURI: function(E) {
    return this[E].uri;
  }, getValue: function(E) {
    return this[E].value;
  } };
  function C(E, S) {
    var X, A = [], R = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
    for (R.lastIndex = S, R.exec(E); X = R.exec(E); ) if (A.push(X), X[1]) return A;
  }
  return gt.XMLReader = m, gt.ParseError = f, gt;
}
var bc;
function kd() {
  if (bc) return Gn;
  bc = 1;
  var e = ri(), n = la(), i = Rd(), t = Nd(), r = n.DOMImplementation, a = e.NAMESPACE, c = t.ParseError, o = t.XMLReader;
  function u(d) {
    return d.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028]/g, `
`);
  }
  function s(d) {
    this.options = d || { locator: {} };
  }
  s.prototype.parseFromString = function(d, p) {
    var l = this.options, y = new o(), w = l.domBuilder || new g(), T = l.errorHandler, x = l.locator, _ = l.xmlns || {}, C = /\/x?html?$/.test(p), E = C ? i.HTML_ENTITIES : i.XML_ENTITIES;
    x && w.setDocumentLocator(x), y.errorHandler = h(T, w, x), y.domBuilder = l.domBuilder || w, C && (_[""] = a.HTML), _.xml = _.xml || a.XML;
    var S = l.normalizeLineEndings || u;
    return d && typeof d == "string" ? y.parse(S(d), _, E) : y.errorHandler.error("invalid doc source"), w.doc;
  };
  function h(d, p, l) {
    if (!d) {
      if (p instanceof g) return p;
      d = p;
    }
    var y = {}, w = d instanceof Function;
    l = l || {};
    function T(x) {
      var _ = d[x];
      !_ && w && (_ = d.length == 2 ? function(C) {
        d(x, C);
      } : d), y[x] = _ && function(C) {
        _("[xmldom " + x + "]	" + C + m(l));
      } || function() {
      };
    }
    return T("warning"), T("error"), T("fatalError"), y;
  }
  function g() {
    this.cdata = false;
  }
  function f(d, p) {
    p.lineNumber = d.lineNumber, p.columnNumber = d.columnNumber;
  }
  g.prototype = { startDocument: function() {
    this.doc = new r().createDocument(null, null, null), this.locator && (this.doc.documentURI = this.locator.systemId);
  }, startElement: function(d, p, l, y) {
    var w = this.doc, T = w.createElementNS(d, l || p), x = y.length;
    b(this, T), this.currentElement = T, this.locator && f(this.locator, T);
    for (var _ = 0; _ < x; _++) {
      var d = y.getURI(_), C = y.getValue(_), l = y.getQName(_), E = w.createAttributeNS(d, l);
      this.locator && f(y.getLocator(_), E), E.value = E.nodeValue = C, T.setAttributeNode(E);
    }
  }, endElement: function(d, p, l) {
    var y = this.currentElement;
    y.tagName, this.currentElement = y.parentNode;
  }, startPrefixMapping: function(d, p) {
  }, endPrefixMapping: function(d) {
  }, processingInstruction: function(d, p) {
    var l = this.doc.createProcessingInstruction(d, p);
    this.locator && f(this.locator, l), b(this, l);
  }, ignorableWhitespace: function(d, p, l) {
  }, characters: function(d, p, l) {
    if (d = D.apply(this, arguments), d) {
      if (this.cdata) var y = this.doc.createCDATASection(d);
      else var y = this.doc.createTextNode(d);
      this.currentElement ? this.currentElement.appendChild(y) : /^\s*$/.test(d) && this.doc.appendChild(y), this.locator && f(this.locator, y);
    }
  }, skippedEntity: function(d) {
  }, endDocument: function() {
    this.doc.normalize();
  }, setDocumentLocator: function(d) {
    (this.locator = d) && (d.lineNumber = 0);
  }, comment: function(d, p, l) {
    d = D.apply(this, arguments);
    var y = this.doc.createComment(d);
    this.locator && f(this.locator, y), b(this, y);
  }, startCDATA: function() {
    this.cdata = true;
  }, endCDATA: function() {
    this.cdata = false;
  }, startDTD: function(d, p, l) {
    var y = this.doc.implementation;
    if (y && y.createDocumentType) {
      var w = y.createDocumentType(d, p, l);
      this.locator && f(this.locator, w), b(this, w), this.doc.doctype = w;
    }
  }, warning: function(d) {
    console.warn("[xmldom warning]	" + d, m(this.locator));
  }, error: function(d) {
    console.error("[xmldom error]	" + d, m(this.locator));
  }, fatalError: function(d) {
    throw new c(d, this.locator);
  } };
  function m(d) {
    if (d) return `
@` + (d.systemId || "") + "#[line:" + d.lineNumber + ",col:" + d.columnNumber + "]";
  }
  function D(d, p, l) {
    return typeof d == "string" ? d.substr(p, l) : d.length >= p + l || p ? new java.lang.String(d, p, l) + "" : d;
  }
  "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(d) {
    g.prototype[d] = function() {
      return null;
    };
  });
  function b(d, p) {
    d.currentElement ? d.currentElement.appendChild(p) : d.doc.appendChild(p);
  }
  return Gn.__DOMHandler = g, Gn.normalizeLineEndings = u, Gn.DOMParser = s, Gn;
}
var Dc;
function Od() {
  if (Dc) return zn;
  Dc = 1;
  var e = la();
  return zn.DOMImplementation = e.DOMImplementation, zn.XMLSerializer = e.XMLSerializer, zn.DOMParser = kd().DOMParser, zn;
}
var yc;
function Id() {
  if (yc) return ht;
  yc = 1;
  var e = Od(), n = la();
  function i(t) {
    var r = null, a = new e.DOMParser({ errorHandler: function(o, u) {
      r = { level: o, message: u };
    } }), c = a.parseFromString(t);
    if (r === null) return c;
    throw new Error(r.level + ": " + r.message);
  }
  return ht.parseFromString = i, ht.Node = n.Node, ht;
}
var vc;
function Ld() {
  if (vc) return Ki;
  vc = 1;
  var e = mn(), n = Be, i = Id(), t = ls(), r = t.Element;
  Ki.readString = c;
  var a = i.Node;
  function c(o, u) {
    u = u || {};
    try {
      var s = i.parseFromString(o, "text/xml");
    } catch (m) {
      return e.reject(m);
    }
    if (s.documentElement.tagName === "parsererror") return e.resolve(new Error(s.documentElement.textContent));
    function h(m) {
      switch (m.nodeType) {
        case a.ELEMENT_NODE:
          return g(m);
        case a.TEXT_NODE:
          return t.text(m.nodeValue);
      }
    }
    function g(m) {
      var D = f(m), b = [];
      n.forEach(m.childNodes, function(p) {
        var l = h(p);
        l && b.push(l);
      });
      var d = {};
      return n.forEach(m.attributes, function(p) {
        d[f(p)] = p.value;
      }), new r(D, d, b);
    }
    function f(m) {
      if (m.namespaceURI) {
        var D = u[m.namespaceURI], b;
        return D ? b = D + ":" : b = "{" + m.namespaceURI + "}", b + m.localName;
      } else return m.localName;
    }
    return e.resolve(h(s.documentElement));
  }
  return Ki;
}
var er = {}, _n = {}, en = {}, xc;
function bn() {
  return xc || (xc = 1, (function() {
    var e, n, i, t, r, a, c, o = [].slice, u = {}.hasOwnProperty;
    e = function() {
      var s, h, g, f, m, D;
      if (D = arguments[0], m = 2 <= arguments.length ? o.call(arguments, 1) : [], r(Object.assign)) Object.assign.apply(null, arguments);
      else for (s = 0, g = m.length; s < g; s++) if (f = m[s], f != null) for (h in f) u.call(f, h) && (D[h] = f[h]);
      return D;
    }, r = function(s) {
      return !!s && Object.prototype.toString.call(s) === "[object Function]";
    }, a = function(s) {
      var h;
      return !!s && ((h = typeof s) == "function" || h === "object");
    }, i = function(s) {
      return r(Array.isArray) ? Array.isArray(s) : Object.prototype.toString.call(s) === "[object Array]";
    }, t = function(s) {
      var h;
      if (i(s)) return !s.length;
      for (h in s) if (u.call(s, h)) return false;
      return true;
    }, c = function(s) {
      var h, g;
      return a(s) && (g = Object.getPrototypeOf(s)) && (h = g.constructor) && typeof h == "function" && h instanceof h && Function.prototype.toString.call(h) === Function.prototype.toString.call(Object);
    }, n = function(s) {
      return r(s.valueOf) ? s.valueOf() : s;
    }, en.assign = e, en.isFunction = r, en.isObject = a, en.isArray = i, en.isEmpty = t, en.isPlainObject = c, en.getValue = n;
  }).call(en)), en;
}
var xt = { exports: {} }, Ut = { exports: {} }, Tt = { exports: {} }, _t = { exports: {} }, qd = _t.exports, Uc;
function fs() {
  return Uc || (Uc = 1, (function() {
    _t.exports = (function() {
      function e(n, i, t) {
        if (this.options = n.options, this.stringify = n.stringify, this.parent = n, i == null) throw new Error("Missing attribute name. " + this.debugInfo(i));
        if (t == null) throw new Error("Missing attribute value. " + this.debugInfo(i));
        this.name = this.stringify.attName(i), this.value = this.stringify.attValue(t);
      }
      return e.prototype.clone = function() {
        return Object.create(this);
      }, e.prototype.toString = function(n) {
        return this.options.writer.set(n).attribute(this);
      }, e.prototype.debugInfo = function(n) {
        return n = n || this.name, n == null ? "parent: <" + this.parent.name + ">" : "attribute: {" + n + "}, parent: <" + this.parent.name + ">";
      }, e;
    })();
  }).call(qd)), _t.exports;
}
var Md = Tt.exports, Tc;
function ai() {
  return Tc || (Tc = 1, (function() {
    var e, n, i, t, r, a, c = function(u, s) {
      for (var h in s) o.call(s, h) && (u[h] = s[h]);
      function g() {
        this.constructor = u;
      }
      return g.prototype = s.prototype, u.prototype = new g(), u.__super__ = s.prototype, u;
    }, o = {}.hasOwnProperty;
    a = bn(), r = a.isObject, t = a.isFunction, i = a.getValue, n = je(), e = fs(), Tt.exports = (function(u) {
      c(s, u);
      function s(h, g, f) {
        if (s.__super__.constructor.call(this, h), g == null) throw new Error("Missing element name. " + this.debugInfo());
        this.name = this.stringify.eleName(g), this.attributes = {}, f != null && this.attribute(f), h.isDocument && (this.isRoot = true, this.documentObject = h, h.rootObject = this);
      }
      return s.prototype.clone = function() {
        var h, g, f, m;
        f = Object.create(this), f.isRoot && (f.documentObject = null), f.attributes = {}, m = this.attributes;
        for (g in m) o.call(m, g) && (h = m[g], f.attributes[g] = h.clone());
        return f.children = [], this.children.forEach(function(D) {
          var b;
          return b = D.clone(), b.parent = f, f.children.push(b);
        }), f;
      }, s.prototype.attribute = function(h, g) {
        var f, m;
        if (h != null && (h = i(h)), r(h)) for (f in h) o.call(h, f) && (m = h[f], this.attribute(f, m));
        else t(g) && (g = g.apply()), (!this.options.skipNullAttributes || g != null) && (this.attributes[h] = new e(this, h, g));
        return this;
      }, s.prototype.removeAttribute = function(h) {
        var g, f, m;
        if (h == null) throw new Error("Missing attribute name. " + this.debugInfo());
        if (h = i(h), Array.isArray(h)) for (f = 0, m = h.length; f < m; f++) g = h[f], delete this.attributes[g];
        else delete this.attributes[h];
        return this;
      }, s.prototype.toString = function(h) {
        return this.options.writer.set(h).element(this);
      }, s.prototype.att = function(h, g) {
        return this.attribute(h, g);
      }, s.prototype.a = function(h, g) {
        return this.attribute(h, g);
      }, s;
    })(n);
  }).call(Md)), Tt.exports;
}
var Et = { exports: {} }, Pd = Et.exports, _c;
function ci() {
  return _c || (_c = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Et.exports = (function(t) {
      n(r, t);
      function r(a, c) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing CDATA text. " + this.debugInfo());
        this.text = this.stringify.cdata(c);
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return this.options.writer.set(a).cdata(this);
      }, r;
    })(e);
  }).call(Pd)), Et.exports;
}
var wt = { exports: {} }, Xd = wt.exports, Ec;
function oi() {
  return Ec || (Ec = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), wt.exports = (function(t) {
      n(r, t);
      function r(a, c) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing comment text. " + this.debugInfo());
        this.text = this.stringify.comment(c);
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return this.options.writer.set(a).comment(this);
      }, r;
    })(e);
  }).call(Xd)), wt.exports;
}
var Ft = { exports: {} }, jd = Ft.exports, wc;
function ui() {
  return wc || (wc = 1, (function() {
    var e, n, i = function(r, a) {
      for (var c in a) t.call(a, c) && (r[c] = a[c]);
      function o() {
        this.constructor = r;
      }
      return o.prototype = a.prototype, r.prototype = new o(), r.__super__ = a.prototype, r;
    }, t = {}.hasOwnProperty;
    n = bn().isObject, e = je(), Ft.exports = (function(r) {
      i(a, r);
      function a(c, o, u, s) {
        var h;
        a.__super__.constructor.call(this, c), n(o) && (h = o, o = h.version, u = h.encoding, s = h.standalone), o || (o = "1.0"), this.version = this.stringify.xmlVersion(o), u != null && (this.encoding = this.stringify.xmlEncoding(u)), s != null && (this.standalone = this.stringify.xmlStandalone(s));
      }
      return a.prototype.toString = function(c) {
        return this.options.writer.set(c).declaration(this);
      }, a;
    })(e);
  }).call(jd)), Ft.exports;
}
var At = { exports: {} }, Ct = { exports: {} }, Vd = Ct.exports, Fc;
function si() {
  return Fc || (Fc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Ct.exports = (function(t) {
      n(r, t);
      function r(a, c, o, u, s, h) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing DTD element name. " + this.debugInfo());
        if (o == null) throw new Error("Missing DTD attribute name. " + this.debugInfo(c));
        if (!u) throw new Error("Missing DTD attribute type. " + this.debugInfo(c));
        if (!s) throw new Error("Missing DTD attribute default. " + this.debugInfo(c));
        if (s.indexOf("#") !== 0 && (s = "#" + s), !s.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(c));
        if (h && !s.match(/^(#FIXED|#DEFAULT)$/)) throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(c));
        this.elementName = this.stringify.eleName(c), this.attributeName = this.stringify.attName(o), this.attributeType = this.stringify.dtdAttType(u), this.defaultValue = this.stringify.dtdAttDefault(h), this.defaultValueType = s;
      }
      return r.prototype.toString = function(a) {
        return this.options.writer.set(a).dtdAttList(this);
      }, r;
    })(e);
  }).call(Vd)), Ct.exports;
}
var Wt = { exports: {} }, Hd = Wt.exports, Ac;
function di() {
  return Ac || (Ac = 1, (function() {
    var e, n, i = function(r, a) {
      for (var c in a) t.call(a, c) && (r[c] = a[c]);
      function o() {
        this.constructor = r;
      }
      return o.prototype = a.prototype, r.prototype = new o(), r.__super__ = a.prototype, r;
    }, t = {}.hasOwnProperty;
    n = bn().isObject, e = je(), Wt.exports = (function(r) {
      i(a, r);
      function a(c, o, u, s) {
        if (a.__super__.constructor.call(this, c), u == null) throw new Error("Missing DTD entity name. " + this.debugInfo(u));
        if (s == null) throw new Error("Missing DTD entity value. " + this.debugInfo(u));
        if (this.pe = !!o, this.name = this.stringify.eleName(u), !n(s)) this.value = this.stringify.dtdEntityValue(s);
        else {
          if (!s.pubID && !s.sysID) throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(u));
          if (s.pubID && !s.sysID) throw new Error("System identifier is required for a public external entity. " + this.debugInfo(u));
          if (s.pubID != null && (this.pubID = this.stringify.dtdPubID(s.pubID)), s.sysID != null && (this.sysID = this.stringify.dtdSysID(s.sysID)), s.nData != null && (this.nData = this.stringify.dtdNData(s.nData)), this.pe && this.nData) throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(u));
        }
      }
      return a.prototype.toString = function(c) {
        return this.options.writer.set(c).dtdEntity(this);
      }, a;
    })(e);
  }).call(Hd)), Wt.exports;
}
var Bt = { exports: {} }, zd = Bt.exports, Cc;
function li() {
  return Cc || (Cc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Bt.exports = (function(t) {
      n(r, t);
      function r(a, c, o) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing DTD element name. " + this.debugInfo());
        o || (o = "(#PCDATA)"), Array.isArray(o) && (o = "(" + o.join(",") + ")"), this.name = this.stringify.eleName(c), this.value = this.stringify.dtdElementValue(o);
      }
      return r.prototype.toString = function(a) {
        return this.options.writer.set(a).dtdElement(this);
      }, r;
    })(e);
  }).call(zd)), Bt.exports;
}
var St = { exports: {} }, Gd = St.exports, Wc;
function fi() {
  return Wc || (Wc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), St.exports = (function(t) {
      n(r, t);
      function r(a, c, o) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing DTD notation name. " + this.debugInfo(c));
        if (!o.pubID && !o.sysID) throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(c));
        this.name = this.stringify.eleName(c), o.pubID != null && (this.pubID = this.stringify.dtdPubID(o.pubID)), o.sysID != null && (this.sysID = this.stringify.dtdSysID(o.sysID));
      }
      return r.prototype.toString = function(a) {
        return this.options.writer.set(a).dtdNotation(this);
      }, r;
    })(e);
  }).call(Gd)), St.exports;
}
var $d = At.exports, Bc;
function hi() {
  return Bc || (Bc = 1, (function() {
    var e, n, i, t, r, a, c = function(u, s) {
      for (var h in s) o.call(s, h) && (u[h] = s[h]);
      function g() {
        this.constructor = u;
      }
      return g.prototype = s.prototype, u.prototype = new g(), u.__super__ = s.prototype, u;
    }, o = {}.hasOwnProperty;
    a = bn().isObject, r = je(), e = si(), i = di(), n = li(), t = fi(), At.exports = (function(u) {
      c(s, u);
      function s(h, g, f) {
        var m, D;
        s.__super__.constructor.call(this, h), this.name = "!DOCTYPE", this.documentObject = h, a(g) && (m = g, g = m.pubID, f = m.sysID), f == null && (D = [g, f], f = D[0], g = D[1]), g != null && (this.pubID = this.stringify.dtdPubID(g)), f != null && (this.sysID = this.stringify.dtdSysID(f));
      }
      return s.prototype.element = function(h, g) {
        var f;
        return f = new n(this, h, g), this.children.push(f), this;
      }, s.prototype.attList = function(h, g, f, m, D) {
        var b;
        return b = new e(this, h, g, f, m, D), this.children.push(b), this;
      }, s.prototype.entity = function(h, g) {
        var f;
        return f = new i(this, false, h, g), this.children.push(f), this;
      }, s.prototype.pEntity = function(h, g) {
        var f;
        return f = new i(this, true, h, g), this.children.push(f), this;
      }, s.prototype.notation = function(h, g) {
        var f;
        return f = new t(this, h, g), this.children.push(f), this;
      }, s.prototype.toString = function(h) {
        return this.options.writer.set(h).docType(this);
      }, s.prototype.ele = function(h, g) {
        return this.element(h, g);
      }, s.prototype.att = function(h, g, f, m, D) {
        return this.attList(h, g, f, m, D);
      }, s.prototype.ent = function(h, g) {
        return this.entity(h, g);
      }, s.prototype.pent = function(h, g) {
        return this.pEntity(h, g);
      }, s.prototype.not = function(h, g) {
        return this.notation(h, g);
      }, s.prototype.up = function() {
        return this.root() || this.documentObject;
      }, s;
    })(r);
  }).call($d)), At.exports;
}
var Rt = { exports: {} }, Qd = Rt.exports, Sc;
function gi() {
  return Sc || (Sc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Rt.exports = (function(t) {
      n(r, t);
      function r(a, c) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing raw text. " + this.debugInfo());
        this.value = this.stringify.raw(c);
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return this.options.writer.set(a).raw(this);
      }, r;
    })(e);
  }).call(Qd)), Rt.exports;
}
var Nt = { exports: {} }, Yd = Nt.exports, Rc;
function pi() {
  return Rc || (Rc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Nt.exports = (function(t) {
      n(r, t);
      function r(a, c) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing element text. " + this.debugInfo());
        this.value = this.stringify.eleText(c);
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return this.options.writer.set(a).text(this);
      }, r;
    })(e);
  }).call(Yd)), Nt.exports;
}
var kt = { exports: {} }, Zd = kt.exports, Nc;
function mi() {
  return Nc || (Nc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), kt.exports = (function(t) {
      n(r, t);
      function r(a, c, o) {
        if (r.__super__.constructor.call(this, a), c == null) throw new Error("Missing instruction target. " + this.debugInfo());
        this.target = this.stringify.insTarget(c), o && (this.value = this.stringify.insValue(o));
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return this.options.writer.set(a).processingInstruction(this);
      }, r;
    })(e);
  }).call(Zd)), kt.exports;
}
var Ot = { exports: {} }, Kd = Ot.exports, kc;
function fa() {
  return kc || (kc = 1, (function() {
    var e, n = function(t, r) {
      for (var a in r) i.call(r, a) && (t[a] = r[a]);
      function c() {
        this.constructor = t;
      }
      return c.prototype = r.prototype, t.prototype = new c(), t.__super__ = r.prototype, t;
    }, i = {}.hasOwnProperty;
    e = je(), Ot.exports = (function(t) {
      n(r, t);
      function r(a) {
        r.__super__.constructor.call(this, a), this.isDummy = true;
      }
      return r.prototype.clone = function() {
        return Object.create(this);
      }, r.prototype.toString = function(a) {
        return "";
      }, r;
    })(e);
  }).call(Kd)), Ot.exports;
}
var Jd = Ut.exports, Oc;
function je() {
  return Oc || (Oc = 1, (function() {
    var e, n, i, t, r, a, c, o, u, s, h, g, f, m, D = {}.hasOwnProperty;
    m = bn(), f = m.isObject, g = m.isFunction, h = m.isEmpty, s = m.getValue, a = null, e = null, n = null, i = null, t = null, o = null, u = null, c = null, r = null, Ut.exports = (function() {
      function b(d) {
        this.parent = d, this.parent && (this.options = this.parent.options, this.stringify = this.parent.stringify), this.children = [], a || (a = ai(), e = ci(), n = oi(), i = ui(), t = hi(), o = gi(), u = pi(), c = mi(), r = fa());
      }
      return b.prototype.element = function(d, p, l) {
        var y, w, T, x, _, C, E, S, X, A, R;
        if (C = null, p === null && l == null && (X = [{}, null], p = X[0], l = X[1]), p == null && (p = {}), p = s(p), f(p) || (A = [p, l], l = A[0], p = A[1]), d != null && (d = s(d)), Array.isArray(d)) for (T = 0, E = d.length; T < E; T++) w = d[T], C = this.element(w);
        else if (g(d)) C = this.element(d.apply());
        else if (f(d)) {
          for (_ in d) if (D.call(d, _)) if (R = d[_], g(R) && (R = R.apply()), f(R) && h(R) && (R = null), !this.options.ignoreDecorators && this.stringify.convertAttKey && _.indexOf(this.stringify.convertAttKey) === 0) C = this.attribute(_.substr(this.stringify.convertAttKey.length), R);
          else if (!this.options.separateArrayItems && Array.isArray(R)) for (x = 0, S = R.length; x < S; x++) w = R[x], y = {}, y[_] = w, C = this.element(y);
          else f(R) ? (C = this.element(_), C.element(R)) : C = this.element(_, R);
        } else this.options.skipNullNodes && l === null ? C = this.dummy() : !this.options.ignoreDecorators && this.stringify.convertTextKey && d.indexOf(this.stringify.convertTextKey) === 0 ? C = this.text(l) : !this.options.ignoreDecorators && this.stringify.convertCDataKey && d.indexOf(this.stringify.convertCDataKey) === 0 ? C = this.cdata(l) : !this.options.ignoreDecorators && this.stringify.convertCommentKey && d.indexOf(this.stringify.convertCommentKey) === 0 ? C = this.comment(l) : !this.options.ignoreDecorators && this.stringify.convertRawKey && d.indexOf(this.stringify.convertRawKey) === 0 ? C = this.raw(l) : !this.options.ignoreDecorators && this.stringify.convertPIKey && d.indexOf(this.stringify.convertPIKey) === 0 ? C = this.instruction(d.substr(this.stringify.convertPIKey.length), l) : C = this.node(d, p, l);
        if (C == null) throw new Error("Could not create any elements with: " + d + ". " + this.debugInfo());
        return C;
      }, b.prototype.insertBefore = function(d, p, l) {
        var y, w, T;
        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(d));
        return w = this.parent.children.indexOf(this), T = this.parent.children.splice(w), y = this.parent.element(d, p, l), Array.prototype.push.apply(this.parent.children, T), y;
      }, b.prototype.insertAfter = function(d, p, l) {
        var y, w, T;
        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(d));
        return w = this.parent.children.indexOf(this), T = this.parent.children.splice(w + 1), y = this.parent.element(d, p, l), Array.prototype.push.apply(this.parent.children, T), y;
      }, b.prototype.remove = function() {
        var d;
        if (this.isRoot) throw new Error("Cannot remove the root element. " + this.debugInfo());
        return d = this.parent.children.indexOf(this), [].splice.apply(this.parent.children, [d, d - d + 1].concat([])), this.parent;
      }, b.prototype.node = function(d, p, l) {
        var y, w;
        return d != null && (d = s(d)), p || (p = {}), p = s(p), f(p) || (w = [p, l], l = w[0], p = w[1]), y = new a(this, d, p), l != null && y.text(l), this.children.push(y), y;
      }, b.prototype.text = function(d) {
        var p;
        return p = new u(this, d), this.children.push(p), this;
      }, b.prototype.cdata = function(d) {
        var p;
        return p = new e(this, d), this.children.push(p), this;
      }, b.prototype.comment = function(d) {
        var p;
        return p = new n(this, d), this.children.push(p), this;
      }, b.prototype.commentBefore = function(d) {
        var p, l;
        return p = this.parent.children.indexOf(this), l = this.parent.children.splice(p), this.parent.comment(d), Array.prototype.push.apply(this.parent.children, l), this;
      }, b.prototype.commentAfter = function(d) {
        var p, l;
        return p = this.parent.children.indexOf(this), l = this.parent.children.splice(p + 1), this.parent.comment(d), Array.prototype.push.apply(this.parent.children, l), this;
      }, b.prototype.raw = function(d) {
        var p;
        return p = new o(this, d), this.children.push(p), this;
      }, b.prototype.dummy = function() {
        var d;
        return d = new r(this), this.children.push(d), d;
      }, b.prototype.instruction = function(d, p) {
        var l, y, w, T, x;
        if (d != null && (d = s(d)), p != null && (p = s(p)), Array.isArray(d)) for (T = 0, x = d.length; T < x; T++) l = d[T], this.instruction(l);
        else if (f(d)) for (l in d) D.call(d, l) && (y = d[l], this.instruction(l, y));
        else g(p) && (p = p.apply()), w = new c(this, d, p), this.children.push(w);
        return this;
      }, b.prototype.instructionBefore = function(d, p) {
        var l, y;
        return l = this.parent.children.indexOf(this), y = this.parent.children.splice(l), this.parent.instruction(d, p), Array.prototype.push.apply(this.parent.children, y), this;
      }, b.prototype.instructionAfter = function(d, p) {
        var l, y;
        return l = this.parent.children.indexOf(this), y = this.parent.children.splice(l + 1), this.parent.instruction(d, p), Array.prototype.push.apply(this.parent.children, y), this;
      }, b.prototype.declaration = function(d, p, l) {
        var y, w;
        return y = this.document(), w = new i(y, d, p, l), y.children[0] instanceof i ? y.children[0] = w : y.children.unshift(w), y.root() || y;
      }, b.prototype.doctype = function(d, p) {
        var l, y, w, T, x, _, C, E, S, X;
        for (y = this.document(), w = new t(y, d, p), S = y.children, T = x = 0, C = S.length; x < C; T = ++x) if (l = S[T], l instanceof t) return y.children[T] = w, w;
        for (X = y.children, T = _ = 0, E = X.length; _ < E; T = ++_) if (l = X[T], l.isRoot) return y.children.splice(T, 0, w), w;
        return y.children.push(w), w;
      }, b.prototype.up = function() {
        if (this.isRoot) throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
        return this.parent;
      }, b.prototype.root = function() {
        var d;
        for (d = this; d; ) {
          if (d.isDocument) return d.rootObject;
          if (d.isRoot) return d;
          d = d.parent;
        }
      }, b.prototype.document = function() {
        var d;
        for (d = this; d; ) {
          if (d.isDocument) return d;
          d = d.parent;
        }
      }, b.prototype.end = function(d) {
        return this.document().end(d);
      }, b.prototype.prev = function() {
        var d;
        for (d = this.parent.children.indexOf(this); d > 0 && this.parent.children[d - 1].isDummy; ) d = d - 1;
        if (d < 1) throw new Error("Already at the first node. " + this.debugInfo());
        return this.parent.children[d - 1];
      }, b.prototype.next = function() {
        var d;
        for (d = this.parent.children.indexOf(this); d < this.parent.children.length - 1 && this.parent.children[d + 1].isDummy; ) d = d + 1;
        if (d === -1 || d === this.parent.children.length - 1) throw new Error("Already at the last node. " + this.debugInfo());
        return this.parent.children[d + 1];
      }, b.prototype.importDocument = function(d) {
        var p;
        return p = d.root().clone(), p.parent = this, p.isRoot = false, this.children.push(p), this;
      }, b.prototype.debugInfo = function(d) {
        var p, l;
        return d = d || this.name, d == null && !((p = this.parent) != null && p.name) ? "" : d == null ? "parent: <" + this.parent.name + ">" : (l = this.parent) != null && l.name ? "node: <" + d + ">, parent: <" + this.parent.name + ">" : "node: <" + d + ">";
      }, b.prototype.ele = function(d, p, l) {
        return this.element(d, p, l);
      }, b.prototype.nod = function(d, p, l) {
        return this.node(d, p, l);
      }, b.prototype.txt = function(d) {
        return this.text(d);
      }, b.prototype.dat = function(d) {
        return this.cdata(d);
      }, b.prototype.com = function(d) {
        return this.comment(d);
      }, b.prototype.ins = function(d, p) {
        return this.instruction(d, p);
      }, b.prototype.doc = function() {
        return this.document();
      }, b.prototype.dec = function(d, p, l) {
        return this.declaration(d, p, l);
      }, b.prototype.dtd = function(d, p) {
        return this.doctype(d, p);
      }, b.prototype.e = function(d, p, l) {
        return this.element(d, p, l);
      }, b.prototype.n = function(d, p, l) {
        return this.node(d, p, l);
      }, b.prototype.t = function(d) {
        return this.text(d);
      }, b.prototype.d = function(d) {
        return this.cdata(d);
      }, b.prototype.c = function(d) {
        return this.comment(d);
      }, b.prototype.r = function(d) {
        return this.raw(d);
      }, b.prototype.i = function(d, p) {
        return this.instruction(d, p);
      }, b.prototype.u = function() {
        return this.up();
      }, b.prototype.importXMLBuilder = function(d) {
        return this.importDocument(d);
      }, b;
    })();
  }).call(Jd)), Ut.exports;
}
var It = { exports: {} }, el = It.exports, Ic;
function hs() {
  return Ic || (Ic = 1, (function() {
    var e = function(i, t) {
      return function() {
        return i.apply(t, arguments);
      };
    }, n = {}.hasOwnProperty;
    It.exports = (function() {
      function i(t) {
        this.assertLegalChar = e(this.assertLegalChar, this);
        var r, a, c;
        t || (t = {}), this.noDoubleEncoding = t.noDoubleEncoding, a = t.stringify || {};
        for (r in a) n.call(a, r) && (c = a[r], this[r] = c);
      }
      return i.prototype.eleName = function(t) {
        return t = "" + t || "", this.assertLegalChar(t);
      }, i.prototype.eleText = function(t) {
        return t = "" + t || "", this.assertLegalChar(this.elEscape(t));
      }, i.prototype.cdata = function(t) {
        return t = "" + t || "", t = t.replace("]]>", "]]]]><![CDATA[>"), this.assertLegalChar(t);
      }, i.prototype.comment = function(t) {
        if (t = "" + t || "", t.match(/--/)) throw new Error("Comment text cannot contain double-hypen: " + t);
        return this.assertLegalChar(t);
      }, i.prototype.raw = function(t) {
        return "" + t || "";
      }, i.prototype.attName = function(t) {
        return t = "" + t || "";
      }, i.prototype.attValue = function(t) {
        return t = "" + t || "", this.attEscape(t);
      }, i.prototype.insTarget = function(t) {
        return "" + t || "";
      }, i.prototype.insValue = function(t) {
        if (t = "" + t || "", t.match(/\?>/)) throw new Error("Invalid processing instruction value: " + t);
        return t;
      }, i.prototype.xmlVersion = function(t) {
        if (t = "" + t || "", !t.match(/1\.[0-9]+/)) throw new Error("Invalid version number: " + t);
        return t;
      }, i.prototype.xmlEncoding = function(t) {
        if (t = "" + t || "", !t.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw new Error("Invalid encoding: " + t);
        return t;
      }, i.prototype.xmlStandalone = function(t) {
        return t ? "yes" : "no";
      }, i.prototype.dtdPubID = function(t) {
        return "" + t || "";
      }, i.prototype.dtdSysID = function(t) {
        return "" + t || "";
      }, i.prototype.dtdElementValue = function(t) {
        return "" + t || "";
      }, i.prototype.dtdAttType = function(t) {
        return "" + t || "";
      }, i.prototype.dtdAttDefault = function(t) {
        return t != null ? "" + t || "" : t;
      }, i.prototype.dtdEntityValue = function(t) {
        return "" + t || "";
      }, i.prototype.dtdNData = function(t) {
        return "" + t || "";
      }, i.prototype.convertAttKey = "@", i.prototype.convertPIKey = "?", i.prototype.convertTextKey = "#text", i.prototype.convertCDataKey = "#cdata", i.prototype.convertCommentKey = "#comment", i.prototype.convertRawKey = "#raw", i.prototype.assertLegalChar = function(t) {
        var r;
        if (r = t.match(/[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/), r) throw new Error("Invalid character in string: " + t + " at index " + r.index);
        return t;
      }, i.prototype.elEscape = function(t) {
        var r;
        return r = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, t.replace(r, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
      }, i.prototype.attEscape = function(t) {
        var r;
        return r = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, t.replace(r, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;");
      }, i;
    })();
  }).call(el)), It.exports;
}
var Lt = { exports: {} }, qt = { exports: {} }, nl = qt.exports, Lc;
function gs() {
  return Lc || (Lc = 1, (function() {
    var e = {}.hasOwnProperty;
    qt.exports = (function() {
      function n(i) {
        var t, r, a, c, o, u, s, h, g;
        i || (i = {}), this.pretty = i.pretty || false, this.allowEmpty = (r = i.allowEmpty) != null ? r : false, this.pretty ? (this.indent = (a = i.indent) != null ? a : "  ", this.newline = (c = i.newline) != null ? c : `
`, this.offset = (o = i.offset) != null ? o : 0, this.dontprettytextnodes = (u = i.dontprettytextnodes) != null ? u : 0) : (this.indent = "", this.newline = "", this.offset = 0, this.dontprettytextnodes = 0), this.spacebeforeslash = (s = i.spacebeforeslash) != null ? s : "", this.spacebeforeslash === true && (this.spacebeforeslash = " "), this.newlinedefault = this.newline, this.prettydefault = this.pretty, h = i.writer || {};
        for (t in h) e.call(h, t) && (g = h[t], this[t] = g);
      }
      return n.prototype.set = function(i) {
        var t, r, a;
        i || (i = {}), "pretty" in i && (this.pretty = i.pretty), "allowEmpty" in i && (this.allowEmpty = i.allowEmpty), this.pretty ? (this.indent = "indent" in i ? i.indent : "  ", this.newline = "newline" in i ? i.newline : `
`, this.offset = "offset" in i ? i.offset : 0, this.dontprettytextnodes = "dontprettytextnodes" in i ? i.dontprettytextnodes : 0) : (this.indent = "", this.newline = "", this.offset = 0, this.dontprettytextnodes = 0), this.spacebeforeslash = "spacebeforeslash" in i ? i.spacebeforeslash : "", this.spacebeforeslash === true && (this.spacebeforeslash = " "), this.newlinedefault = this.newline, this.prettydefault = this.pretty, r = i.writer || {};
        for (t in r) e.call(r, t) && (a = r[t], this[t] = a);
        return this;
      }, n.prototype.space = function(i) {
        var t;
        return this.pretty ? (t = (i || 0) + this.offset + 1, t > 0 ? new Array(t).join(this.indent) : "") : "";
      }, n;
    })();
  }).call(nl)), qt.exports;
}
var tl = Lt.exports, qc;
function ha() {
  return qc || (qc = 1, (function() {
    var e, n, i, t, r, a, c, o, u, s, h, g, f, m, D = function(d, p) {
      for (var l in p) b.call(p, l) && (d[l] = p[l]);
      function y() {
        this.constructor = d;
      }
      return y.prototype = p.prototype, d.prototype = new y(), d.__super__ = p.prototype, d;
    }, b = {}.hasOwnProperty;
    c = ui(), o = hi(), e = ci(), n = oi(), s = ai(), g = gi(), f = pi(), h = mi(), u = fa(), i = si(), t = li(), r = di(), a = fi(), m = gs(), Lt.exports = (function(d) {
      D(p, d);
      function p(l) {
        p.__super__.constructor.call(this, l);
      }
      return p.prototype.document = function(l) {
        var y, w, T, x, _;
        for (this.textispresent = false, x = "", _ = l.children, w = 0, T = _.length; w < T; w++) y = _[w], !(y instanceof u) && (x += (function() {
          switch (false) {
            case !(y instanceof c):
              return this.declaration(y);
            case !(y instanceof o):
              return this.docType(y);
            case !(y instanceof n):
              return this.comment(y);
            case !(y instanceof h):
              return this.processingInstruction(y);
            default:
              return this.element(y, 0);
          }
        }).call(this));
        return this.pretty && x.slice(-this.newline.length) === this.newline && (x = x.slice(0, -this.newline.length)), x;
      }, p.prototype.attribute = function(l) {
        return " " + l.name + '="' + l.value + '"';
      }, p.prototype.cdata = function(l, y) {
        return this.space(y) + "<![CDATA[" + l.text + "]]>" + this.newline;
      }, p.prototype.comment = function(l, y) {
        return this.space(y) + "<!-- " + l.text + " -->" + this.newline;
      }, p.prototype.declaration = function(l, y) {
        var w;
        return w = this.space(y), w += '<?xml version="' + l.version + '"', l.encoding != null && (w += ' encoding="' + l.encoding + '"'), l.standalone != null && (w += ' standalone="' + l.standalone + '"'), w += this.spacebeforeslash + "?>", w += this.newline, w;
      }, p.prototype.docType = function(l, y) {
        var w, T, x, _, C;
        if (y || (y = 0), _ = this.space(y), _ += "<!DOCTYPE " + l.root().name, l.pubID && l.sysID ? _ += ' PUBLIC "' + l.pubID + '" "' + l.sysID + '"' : l.sysID && (_ += ' SYSTEM "' + l.sysID + '"'), l.children.length > 0) {
          for (_ += " [", _ += this.newline, C = l.children, T = 0, x = C.length; T < x; T++) w = C[T], _ += (function() {
            switch (false) {
              case !(w instanceof i):
                return this.dtdAttList(w, y + 1);
              case !(w instanceof t):
                return this.dtdElement(w, y + 1);
              case !(w instanceof r):
                return this.dtdEntity(w, y + 1);
              case !(w instanceof a):
                return this.dtdNotation(w, y + 1);
              case !(w instanceof e):
                return this.cdata(w, y + 1);
              case !(w instanceof n):
                return this.comment(w, y + 1);
              case !(w instanceof h):
                return this.processingInstruction(w, y + 1);
              default:
                throw new Error("Unknown DTD node type: " + w.constructor.name);
            }
          }).call(this);
          _ += "]";
        }
        return _ += this.spacebeforeslash + ">", _ += this.newline, _;
      }, p.prototype.element = function(l, y) {
        var w, T, x, _, C, E, S, X, A, R, M, H, F;
        y || (y = 0), F = false, this.textispresent ? (this.newline = "", this.pretty = false) : (this.newline = this.newlinedefault, this.pretty = this.prettydefault), H = this.space(y), X = "", X += H + "<" + l.name, A = l.attributes;
        for (S in A) b.call(A, S) && (w = A[S], X += this.attribute(w));
        if (l.children.length === 0 || l.children.every(function(B) {
          return B.value === "";
        })) this.allowEmpty ? X += "></" + l.name + ">" + this.newline : X += this.spacebeforeslash + "/>" + this.newline;
        else if (this.pretty && l.children.length === 1 && l.children[0].value != null) X += ">", X += l.children[0].value, X += "</" + l.name + ">" + this.newline;
        else {
          if (this.dontprettytextnodes) {
            for (R = l.children, x = 0, C = R.length; x < C; x++) if (T = R[x], T.value != null) {
              this.textispresent++, F = true;
              break;
            }
          }
          for (this.textispresent && (this.newline = "", this.pretty = false, H = this.space(y)), X += ">" + this.newline, M = l.children, _ = 0, E = M.length; _ < E; _++) T = M[_], X += (function() {
            switch (false) {
              case !(T instanceof e):
                return this.cdata(T, y + 1);
              case !(T instanceof n):
                return this.comment(T, y + 1);
              case !(T instanceof s):
                return this.element(T, y + 1);
              case !(T instanceof g):
                return this.raw(T, y + 1);
              case !(T instanceof f):
                return this.text(T, y + 1);
              case !(T instanceof h):
                return this.processingInstruction(T, y + 1);
              case !(T instanceof u):
                return "";
              default:
                throw new Error("Unknown XML node type: " + T.constructor.name);
            }
          }).call(this);
          F && this.textispresent--, this.textispresent || (this.newline = this.newlinedefault, this.pretty = this.prettydefault), X += H + "</" + l.name + ">" + this.newline;
        }
        return X;
      }, p.prototype.processingInstruction = function(l, y) {
        var w;
        return w = this.space(y) + "<?" + l.target, l.value && (w += " " + l.value), w += this.spacebeforeslash + "?>" + this.newline, w;
      }, p.prototype.raw = function(l, y) {
        return this.space(y) + l.value + this.newline;
      }, p.prototype.text = function(l, y) {
        return this.space(y) + l.value + this.newline;
      }, p.prototype.dtdAttList = function(l, y) {
        var w;
        return w = this.space(y) + "<!ATTLIST " + l.elementName + " " + l.attributeName + " " + l.attributeType, l.defaultValueType !== "#DEFAULT" && (w += " " + l.defaultValueType), l.defaultValue && (w += ' "' + l.defaultValue + '"'), w += this.spacebeforeslash + ">" + this.newline, w;
      }, p.prototype.dtdElement = function(l, y) {
        return this.space(y) + "<!ELEMENT " + l.name + " " + l.value + this.spacebeforeslash + ">" + this.newline;
      }, p.prototype.dtdEntity = function(l, y) {
        var w;
        return w = this.space(y) + "<!ENTITY", l.pe && (w += " %"), w += " " + l.name, l.value ? w += ' "' + l.value + '"' : (l.pubID && l.sysID ? w += ' PUBLIC "' + l.pubID + '" "' + l.sysID + '"' : l.sysID && (w += ' SYSTEM "' + l.sysID + '"'), l.nData && (w += " NDATA " + l.nData)), w += this.spacebeforeslash + ">" + this.newline, w;
      }, p.prototype.dtdNotation = function(l, y) {
        var w;
        return w = this.space(y) + "<!NOTATION " + l.name, l.pubID && l.sysID ? w += ' PUBLIC "' + l.pubID + '" "' + l.sysID + '"' : l.pubID ? w += ' PUBLIC "' + l.pubID + '"' : l.sysID && (w += ' SYSTEM "' + l.sysID + '"'), w += this.spacebeforeslash + ">" + this.newline, w;
      }, p.prototype.openNode = function(l, y) {
        var w, T, x, _;
        if (y || (y = 0), l instanceof s) {
          x = this.space(y) + "<" + l.name, _ = l.attributes;
          for (T in _) b.call(_, T) && (w = _[T], x += this.attribute(w));
          return x += (l.children ? ">" : "/>") + this.newline, x;
        } else return x = this.space(y) + "<!DOCTYPE " + l.rootNodeName, l.pubID && l.sysID ? x += ' PUBLIC "' + l.pubID + '" "' + l.sysID + '"' : l.sysID && (x += ' SYSTEM "' + l.sysID + '"'), x += (l.children ? " [" : ">") + this.newline, x;
      }, p.prototype.closeNode = function(l, y) {
        switch (y || (y = 0), false) {
          case !(l instanceof s):
            return this.space(y) + "</" + l.name + ">" + this.newline;
          case !(l instanceof o):
            return this.space(y) + "]>" + this.newline;
        }
      }, p;
    })(m);
  }).call(tl)), Lt.exports;
}
var il = xt.exports, Mc;
function rl() {
  return Mc || (Mc = 1, (function() {
    var e, n, i, t, r = function(c, o) {
      for (var u in o) a.call(o, u) && (c[u] = o[u]);
      function s() {
        this.constructor = c;
      }
      return s.prototype = o.prototype, c.prototype = new s(), c.__super__ = o.prototype, c;
    }, a = {}.hasOwnProperty;
    t = bn().isPlainObject, e = je(), i = hs(), n = ha(), xt.exports = (function(c) {
      r(o, c);
      function o(u) {
        o.__super__.constructor.call(this, null), this.name = "?xml", u || (u = {}), u.writer || (u.writer = new n()), this.options = u, this.stringify = new i(u), this.isDocument = true;
      }
      return o.prototype.end = function(u) {
        var s;
        return u ? t(u) && (s = u, u = this.options.writer.set(s)) : u = this.options.writer, u.document(this);
      }, o.prototype.toString = function(u) {
        return this.options.writer.set(u).document(this);
      }, o;
    })(e);
  }).call(il)), xt.exports;
}
var Mt = { exports: {} }, al = Mt.exports, Pc;
function cl() {
  return Pc || (Pc = 1, (function() {
    var e, n, i, t, r, a, c, o, u, s, h, g, f, m, D, b, d, p, l, y, w = {}.hasOwnProperty;
    y = bn(), p = y.isObject, d = y.isFunction, l = y.isPlainObject, b = y.getValue, s = ai(), n = ci(), i = oi(), g = gi(), D = pi(), h = mi(), o = ui(), u = hi(), t = si(), a = di(), r = li(), c = fi(), e = fs(), m = hs(), f = ha(), Mt.exports = (function() {
      function T(x, _, C) {
        var E;
        this.name = "?xml", x || (x = {}), x.writer ? l(x.writer) && (E = x.writer, x.writer = new f(E)) : x.writer = new f(x), this.options = x, this.writer = x.writer, this.stringify = new m(x), this.onDataCallback = _ || function() {
        }, this.onEndCallback = C || function() {
        }, this.currentNode = null, this.currentLevel = -1, this.openTags = {}, this.documentStarted = false, this.documentCompleted = false, this.root = null;
      }
      return T.prototype.node = function(x, _, C) {
        var E, S;
        if (x == null) throw new Error("Missing node name.");
        if (this.root && this.currentLevel === -1) throw new Error("Document can only have one root node. " + this.debugInfo(x));
        return this.openCurrent(), x = b(x), _ === null && C == null && (E = [{}, null], _ = E[0], C = E[1]), _ == null && (_ = {}), _ = b(_), p(_) || (S = [_, C], C = S[0], _ = S[1]), this.currentNode = new s(this, x, _), this.currentNode.children = false, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, C != null && this.text(C), this;
      }, T.prototype.element = function(x, _, C) {
        return this.currentNode && this.currentNode instanceof u ? this.dtdElement.apply(this, arguments) : this.node(x, _, C);
      }, T.prototype.attribute = function(x, _) {
        var C, E;
        if (!this.currentNode || this.currentNode.children) throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(x));
        if (x != null && (x = b(x)), p(x)) for (C in x) w.call(x, C) && (E = x[C], this.attribute(C, E));
        else d(_) && (_ = _.apply()), (!this.options.skipNullAttributes || _ != null) && (this.currentNode.attributes[x] = new e(this, x, _));
        return this;
      }, T.prototype.text = function(x) {
        var _;
        return this.openCurrent(), _ = new D(this, x), this.onData(this.writer.text(_, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.cdata = function(x) {
        var _;
        return this.openCurrent(), _ = new n(this, x), this.onData(this.writer.cdata(_, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.comment = function(x) {
        var _;
        return this.openCurrent(), _ = new i(this, x), this.onData(this.writer.comment(_, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.raw = function(x) {
        var _;
        return this.openCurrent(), _ = new g(this, x), this.onData(this.writer.raw(_, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.instruction = function(x, _) {
        var C, E, S, X, A;
        if (this.openCurrent(), x != null && (x = b(x)), _ != null && (_ = b(_)), Array.isArray(x)) for (C = 0, X = x.length; C < X; C++) E = x[C], this.instruction(E);
        else if (p(x)) for (E in x) w.call(x, E) && (S = x[E], this.instruction(E, S));
        else d(_) && (_ = _.apply()), A = new h(this, x, _), this.onData(this.writer.processingInstruction(A, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      }, T.prototype.declaration = function(x, _, C) {
        var E;
        if (this.openCurrent(), this.documentStarted) throw new Error("declaration() must be the first node.");
        return E = new o(this, x, _, C), this.onData(this.writer.declaration(E, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.doctype = function(x, _, C) {
        if (this.openCurrent(), x == null) throw new Error("Missing root node name.");
        if (this.root) throw new Error("dtd() must come before the root node.");
        return this.currentNode = new u(this, _, C), this.currentNode.rootNodeName = x, this.currentNode.children = false, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, this;
      }, T.prototype.dtdElement = function(x, _) {
        var C;
        return this.openCurrent(), C = new r(this, x, _), this.onData(this.writer.dtdElement(C, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.attList = function(x, _, C, E, S) {
        var X;
        return this.openCurrent(), X = new t(this, x, _, C, E, S), this.onData(this.writer.dtdAttList(X, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.entity = function(x, _) {
        var C;
        return this.openCurrent(), C = new a(this, false, x, _), this.onData(this.writer.dtdEntity(C, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.pEntity = function(x, _) {
        var C;
        return this.openCurrent(), C = new a(this, true, x, _), this.onData(this.writer.dtdEntity(C, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.notation = function(x, _) {
        var C;
        return this.openCurrent(), C = new c(this, x, _), this.onData(this.writer.dtdNotation(C, this.currentLevel + 1), this.currentLevel + 1), this;
      }, T.prototype.up = function() {
        if (this.currentLevel < 0) throw new Error("The document node has no parent.");
        return this.currentNode ? (this.currentNode.children ? this.closeNode(this.currentNode) : this.openNode(this.currentNode), this.currentNode = null) : this.closeNode(this.openTags[this.currentLevel]), delete this.openTags[this.currentLevel], this.currentLevel--, this;
      }, T.prototype.end = function() {
        for (; this.currentLevel >= 0; ) this.up();
        return this.onEnd();
      }, T.prototype.openCurrent = function() {
        if (this.currentNode) return this.currentNode.children = true, this.openNode(this.currentNode);
      }, T.prototype.openNode = function(x) {
        if (!x.isOpen) return !this.root && this.currentLevel === 0 && x instanceof s && (this.root = x), this.onData(this.writer.openNode(x, this.currentLevel), this.currentLevel), x.isOpen = true;
      }, T.prototype.closeNode = function(x) {
        if (!x.isClosed) return this.onData(this.writer.closeNode(x, this.currentLevel), this.currentLevel), x.isClosed = true;
      }, T.prototype.onData = function(x, _) {
        return this.documentStarted = true, this.onDataCallback(x, _ + 1);
      }, T.prototype.onEnd = function() {
        return this.documentCompleted = true, this.onEndCallback();
      }, T.prototype.debugInfo = function(x) {
        return x == null ? "" : "node: <" + x + ">";
      }, T.prototype.ele = function() {
        return this.element.apply(this, arguments);
      }, T.prototype.nod = function(x, _, C) {
        return this.node(x, _, C);
      }, T.prototype.txt = function(x) {
        return this.text(x);
      }, T.prototype.dat = function(x) {
        return this.cdata(x);
      }, T.prototype.com = function(x) {
        return this.comment(x);
      }, T.prototype.ins = function(x, _) {
        return this.instruction(x, _);
      }, T.prototype.dec = function(x, _, C) {
        return this.declaration(x, _, C);
      }, T.prototype.dtd = function(x, _, C) {
        return this.doctype(x, _, C);
      }, T.prototype.e = function(x, _, C) {
        return this.element(x, _, C);
      }, T.prototype.n = function(x, _, C) {
        return this.node(x, _, C);
      }, T.prototype.t = function(x) {
        return this.text(x);
      }, T.prototype.d = function(x) {
        return this.cdata(x);
      }, T.prototype.c = function(x) {
        return this.comment(x);
      }, T.prototype.r = function(x) {
        return this.raw(x);
      }, T.prototype.i = function(x, _) {
        return this.instruction(x, _);
      }, T.prototype.att = function() {
        return this.currentNode && this.currentNode instanceof u ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments);
      }, T.prototype.a = function() {
        return this.currentNode && this.currentNode instanceof u ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments);
      }, T.prototype.ent = function(x, _) {
        return this.entity(x, _);
      }, T.prototype.pent = function(x, _) {
        return this.pEntity(x, _);
      }, T.prototype.not = function(x, _) {
        return this.notation(x, _);
      }, T;
    })();
  }).call(al)), Mt.exports;
}
var Pt = { exports: {} }, ol = Pt.exports, Xc;
function ul() {
  return Xc || (Xc = 1, (function() {
    var e, n, i, t, r, a, c, o, u, s, h, g, f, m, D = function(d, p) {
      for (var l in p) b.call(p, l) && (d[l] = p[l]);
      function y() {
        this.constructor = d;
      }
      return y.prototype = p.prototype, d.prototype = new y(), d.__super__ = p.prototype, d;
    }, b = {}.hasOwnProperty;
    c = ui(), o = hi(), e = ci(), n = oi(), s = ai(), g = gi(), f = pi(), h = mi(), u = fa(), i = si(), t = li(), r = di(), a = fi(), m = gs(), Pt.exports = (function(d) {
      D(p, d);
      function p(l, y) {
        p.__super__.constructor.call(this, y), this.stream = l;
      }
      return p.prototype.document = function(l) {
        var y, w, T, x, _, C, E, S;
        for (C = l.children, w = 0, x = C.length; w < x; w++) y = C[w], y.isLastRootNode = false;
        for (l.children[l.children.length - 1].isLastRootNode = true, E = l.children, S = [], T = 0, _ = E.length; T < _; T++) if (y = E[T], !(y instanceof u)) switch (false) {
          case !(y instanceof c):
            S.push(this.declaration(y));
            break;
          case !(y instanceof o):
            S.push(this.docType(y));
            break;
          case !(y instanceof n):
            S.push(this.comment(y));
            break;
          case !(y instanceof h):
            S.push(this.processingInstruction(y));
            break;
          default:
            S.push(this.element(y));
        }
        return S;
      }, p.prototype.attribute = function(l) {
        return this.stream.write(" " + l.name + '="' + l.value + '"');
      }, p.prototype.cdata = function(l, y) {
        return this.stream.write(this.space(y) + "<![CDATA[" + l.text + "]]>" + this.endline(l));
      }, p.prototype.comment = function(l, y) {
        return this.stream.write(this.space(y) + "<!-- " + l.text + " -->" + this.endline(l));
      }, p.prototype.declaration = function(l, y) {
        return this.stream.write(this.space(y)), this.stream.write('<?xml version="' + l.version + '"'), l.encoding != null && this.stream.write(' encoding="' + l.encoding + '"'), l.standalone != null && this.stream.write(' standalone="' + l.standalone + '"'), this.stream.write(this.spacebeforeslash + "?>"), this.stream.write(this.endline(l));
      }, p.prototype.docType = function(l, y) {
        var w, T, x, _;
        if (y || (y = 0), this.stream.write(this.space(y)), this.stream.write("<!DOCTYPE " + l.root().name), l.pubID && l.sysID ? this.stream.write(' PUBLIC "' + l.pubID + '" "' + l.sysID + '"') : l.sysID && this.stream.write(' SYSTEM "' + l.sysID + '"'), l.children.length > 0) {
          for (this.stream.write(" ["), this.stream.write(this.endline(l)), _ = l.children, T = 0, x = _.length; T < x; T++) switch (w = _[T], false) {
            case !(w instanceof i):
              this.dtdAttList(w, y + 1);
              break;
            case !(w instanceof t):
              this.dtdElement(w, y + 1);
              break;
            case !(w instanceof r):
              this.dtdEntity(w, y + 1);
              break;
            case !(w instanceof a):
              this.dtdNotation(w, y + 1);
              break;
            case !(w instanceof e):
              this.cdata(w, y + 1);
              break;
            case !(w instanceof n):
              this.comment(w, y + 1);
              break;
            case !(w instanceof h):
              this.processingInstruction(w, y + 1);
              break;
            default:
              throw new Error("Unknown DTD node type: " + w.constructor.name);
          }
          this.stream.write("]");
        }
        return this.stream.write(this.spacebeforeslash + ">"), this.stream.write(this.endline(l));
      }, p.prototype.element = function(l, y) {
        var w, T, x, _, C, E, S, X;
        y || (y = 0), X = this.space(y), this.stream.write(X + "<" + l.name), E = l.attributes;
        for (C in E) b.call(E, C) && (w = E[C], this.attribute(w));
        if (l.children.length === 0 || l.children.every(function(A) {
          return A.value === "";
        })) this.allowEmpty ? this.stream.write("></" + l.name + ">") : this.stream.write(this.spacebeforeslash + "/>");
        else if (this.pretty && l.children.length === 1 && l.children[0].value != null) this.stream.write(">"), this.stream.write(l.children[0].value), this.stream.write("</" + l.name + ">");
        else {
          for (this.stream.write(">" + this.newline), S = l.children, x = 0, _ = S.length; x < _; x++) switch (T = S[x], false) {
            case !(T instanceof e):
              this.cdata(T, y + 1);
              break;
            case !(T instanceof n):
              this.comment(T, y + 1);
              break;
            case !(T instanceof s):
              this.element(T, y + 1);
              break;
            case !(T instanceof g):
              this.raw(T, y + 1);
              break;
            case !(T instanceof f):
              this.text(T, y + 1);
              break;
            case !(T instanceof h):
              this.processingInstruction(T, y + 1);
              break;
            case !(T instanceof u):
              break;
            default:
              throw new Error("Unknown XML node type: " + T.constructor.name);
          }
          this.stream.write(X + "</" + l.name + ">");
        }
        return this.stream.write(this.endline(l));
      }, p.prototype.processingInstruction = function(l, y) {
        return this.stream.write(this.space(y) + "<?" + l.target), l.value && this.stream.write(" " + l.value), this.stream.write(this.spacebeforeslash + "?>" + this.endline(l));
      }, p.prototype.raw = function(l, y) {
        return this.stream.write(this.space(y) + l.value + this.endline(l));
      }, p.prototype.text = function(l, y) {
        return this.stream.write(this.space(y) + l.value + this.endline(l));
      }, p.prototype.dtdAttList = function(l, y) {
        return this.stream.write(this.space(y) + "<!ATTLIST " + l.elementName + " " + l.attributeName + " " + l.attributeType), l.defaultValueType !== "#DEFAULT" && this.stream.write(" " + l.defaultValueType), l.defaultValue && this.stream.write(' "' + l.defaultValue + '"'), this.stream.write(this.spacebeforeslash + ">" + this.endline(l));
      }, p.prototype.dtdElement = function(l, y) {
        return this.stream.write(this.space(y) + "<!ELEMENT " + l.name + " " + l.value), this.stream.write(this.spacebeforeslash + ">" + this.endline(l));
      }, p.prototype.dtdEntity = function(l, y) {
        return this.stream.write(this.space(y) + "<!ENTITY"), l.pe && this.stream.write(" %"), this.stream.write(" " + l.name), l.value ? this.stream.write(' "' + l.value + '"') : (l.pubID && l.sysID ? this.stream.write(' PUBLIC "' + l.pubID + '" "' + l.sysID + '"') : l.sysID && this.stream.write(' SYSTEM "' + l.sysID + '"'), l.nData && this.stream.write(" NDATA " + l.nData)), this.stream.write(this.spacebeforeslash + ">" + this.endline(l));
      }, p.prototype.dtdNotation = function(l, y) {
        return this.stream.write(this.space(y) + "<!NOTATION " + l.name), l.pubID && l.sysID ? this.stream.write(' PUBLIC "' + l.pubID + '" "' + l.sysID + '"') : l.pubID ? this.stream.write(' PUBLIC "' + l.pubID + '"') : l.sysID && this.stream.write(' SYSTEM "' + l.sysID + '"'), this.stream.write(this.spacebeforeslash + ">" + this.endline(l));
      }, p.prototype.endline = function(l) {
        return l.isLastRootNode ? "" : this.newline;
      }, p;
    })(m);
  }).call(ol)), Pt.exports;
}
var jc;
function sl() {
  return jc || (jc = 1, (function() {
    var e, n, i, t, r, a, c;
    c = bn(), r = c.assign, a = c.isFunction, e = rl(), n = cl(), t = ha(), i = ul(), _n.create = function(o, u, s, h) {
      var g, f;
      if (o == null) throw new Error("Root element needs a name.");
      return h = r({}, u, s, h), g = new e(h), f = g.element(o), h.headless || (g.declaration(h), (h.pubID != null || h.sysID != null) && g.doctype(h)), f;
    }, _n.begin = function(o, u, s) {
      var h;
      return a(o) && (h = [o, u], u = h[0], s = h[1], o = {}), u ? new n(o, u, s) : new e(o);
    }, _n.stringWriter = function(o) {
      return new t(o);
    }, _n.streamWriter = function(o, u) {
      return new i(o, u);
    };
  }).call(_n)), _n;
}
var Vc;
function dl() {
  if (Vc) return er;
  Vc = 1;
  var e = Be, n = sl();
  er.writeString = i;
  function i(r, a) {
    var c = e.invert(a), o = { element: s, text: t };
    function u(f, m) {
      return o[m.type](f, m);
    }
    function s(f, m) {
      var D = f.element(h(m.name), m.attributes);
      m.children.forEach(function(b) {
        u(D, b);
      });
    }
    function h(f) {
      var m = /^\{(.*)\}(.*)$/.exec(f);
      if (m) {
        var D = c[m[1]];
        return D + (D === "" ? "" : ":") + m[2];
      } else return f;
    }
    function g(f) {
      var m = n.create(h(f.name), { version: "1.0", encoding: "UTF-8", standalone: true });
      return e.forEach(a, function(D, b) {
        var d = "xmlns" + (b === "" ? "" : ":" + b);
        m.attribute(d, D);
      }), f.children.forEach(function(D) {
        u(m, D);
      }), m.end();
    }
    return g(r);
  }
  function t(r, a) {
    r.text(a.value);
  }
  return er;
}
var Hc;
function ga() {
  if (Hc) return un;
  Hc = 1;
  var e = ls();
  return un.Element = e.Element, un.element = e.element, un.emptyElement = e.emptyElement, un.text = e.text, un.readString = Ld().readString, un.writeString = dl().writeString, un;
}
var zc;
function ll() {
  if (zc) return ft;
  zc = 1;
  var e = Be, n = mn(), i = ga();
  ft.read = r, ft.readXmlFromZipFile = a;
  var t = { "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w", "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r", "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp", "http://schemas.openxmlformats.org/drawingml/2006/main": "a", "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic", "http://purl.oclc.org/ooxml/wordprocessingml/main": "w", "http://purl.oclc.org/ooxml/officeDocument/relationships": "r", "http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp", "http://purl.oclc.org/ooxml/drawingml/main": "a", "http://purl.oclc.org/ooxml/drawingml/picture": "pic", "http://schemas.openxmlformats.org/package/2006/content-types": "content-types", "http://schemas.openxmlformats.org/package/2006/relationships": "relationships", "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc", "urn:schemas-microsoft-com:vml": "v", "urn:schemas-microsoft-com:office:word": "office-word", "http://schemas.microsoft.com/office/word/2010/wordml": "wordml" };
  function r(u) {
    return i.readString(u, t).then(function(s) {
      return o(s)[0];
    });
  }
  function a(u, s) {
    return u.exists(s) ? u.read(s, "utf-8").then(c).then(r) : n.resolve(null);
  }
  function c(u) {
    return u.replace(/^\uFEFF/g, "");
  }
  function o(u) {
    return u.type === "element" ? u.name === "mc:AlternateContent" ? u.firstOrEmpty("mc:Fallback").children : (u.children = e.flatten(u.children.map(o, true)), [u]) : [u];
  }
  return ft;
}
var pt = {}, Ye = {}, mt = {}, Gc;
function fl() {
  if (Gc) return mt;
  Gc = 1, Object.defineProperty(mt, "__esModule", { value: true });
  var e = [{ "Typeface name": "Symbol", "Dingbat dec": "32", "Dingbat hex": "20", "Unicode dec": "32", "Unicode hex": "20" }, { "Typeface name": "Symbol", "Dingbat dec": "33", "Dingbat hex": "21", "Unicode dec": "33", "Unicode hex": "21" }, { "Typeface name": "Symbol", "Dingbat dec": "34", "Dingbat hex": "22", "Unicode dec": "8704", "Unicode hex": "2200" }, { "Typeface name": "Symbol", "Dingbat dec": "35", "Dingbat hex": "23", "Unicode dec": "35", "Unicode hex": "23" }, { "Typeface name": "Symbol", "Dingbat dec": "36", "Dingbat hex": "24", "Unicode dec": "8707", "Unicode hex": "2203" }, { "Typeface name": "Symbol", "Dingbat dec": "37", "Dingbat hex": "25", "Unicode dec": "37", "Unicode hex": "25" }, { "Typeface name": "Symbol", "Dingbat dec": "38", "Dingbat hex": "26", "Unicode dec": "38", "Unicode hex": "26" }, { "Typeface name": "Symbol", "Dingbat dec": "39", "Dingbat hex": "27", "Unicode dec": "8717", "Unicode hex": "220D" }, { "Typeface name": "Symbol", "Dingbat dec": "40", "Dingbat hex": "28", "Unicode dec": "40", "Unicode hex": "28" }, { "Typeface name": "Symbol", "Dingbat dec": "41", "Dingbat hex": "29", "Unicode dec": "41", "Unicode hex": "29" }, { "Typeface name": "Symbol", "Dingbat dec": "42", "Dingbat hex": "2A", "Unicode dec": "42", "Unicode hex": "2A" }, { "Typeface name": "Symbol", "Dingbat dec": "43", "Dingbat hex": "2B", "Unicode dec": "43", "Unicode hex": "2B" }, { "Typeface name": "Symbol", "Dingbat dec": "44", "Dingbat hex": "2C", "Unicode dec": "44", "Unicode hex": "2C" }, { "Typeface name": "Symbol", "Dingbat dec": "45", "Dingbat hex": "2D", "Unicode dec": "8722", "Unicode hex": "2212" }, { "Typeface name": "Symbol", "Dingbat dec": "46", "Dingbat hex": "2E", "Unicode dec": "46", "Unicode hex": "2E" }, { "Typeface name": "Symbol", "Dingbat dec": "47", "Dingbat hex": "2F", "Unicode dec": "47", "Unicode hex": "2F" }, { "Typeface name": "Symbol", "Dingbat dec": "48", "Dingbat hex": "30", "Unicode dec": "48", "Unicode hex": "30" }, { "Typeface name": "Symbol", "Dingbat dec": "49", "Dingbat hex": "31", "Unicode dec": "49", "Unicode hex": "31" }, { "Typeface name": "Symbol", "Dingbat dec": "50", "Dingbat hex": "32", "Unicode dec": "50", "Unicode hex": "32" }, { "Typeface name": "Symbol", "Dingbat dec": "51", "Dingbat hex": "33", "Unicode dec": "51", "Unicode hex": "33" }, { "Typeface name": "Symbol", "Dingbat dec": "52", "Dingbat hex": "34", "Unicode dec": "52", "Unicode hex": "34" }, { "Typeface name": "Symbol", "Dingbat dec": "53", "Dingbat hex": "35", "Unicode dec": "53", "Unicode hex": "35" }, { "Typeface name": "Symbol", "Dingbat dec": "54", "Dingbat hex": "36", "Unicode dec": "54", "Unicode hex": "36" }, { "Typeface name": "Symbol", "Dingbat dec": "55", "Dingbat hex": "37", "Unicode dec": "55", "Unicode hex": "37" }, { "Typeface name": "Symbol", "Dingbat dec": "56", "Dingbat hex": "38", "Unicode dec": "56", "Unicode hex": "38" }, { "Typeface name": "Symbol", "Dingbat dec": "57", "Dingbat hex": "39", "Unicode dec": "57", "Unicode hex": "39" }, { "Typeface name": "Symbol", "Dingbat dec": "58", "Dingbat hex": "3A", "Unicode dec": "58", "Unicode hex": "3A" }, { "Typeface name": "Symbol", "Dingbat dec": "59", "Dingbat hex": "3B", "Unicode dec": "59", "Unicode hex": "3B" }, { "Typeface name": "Symbol", "Dingbat dec": "60", "Dingbat hex": "3C", "Unicode dec": "60", "Unicode hex": "3C" }, { "Typeface name": "Symbol", "Dingbat dec": "61", "Dingbat hex": "3D", "Unicode dec": "61", "Unicode hex": "3D" }, { "Typeface name": "Symbol", "Dingbat dec": "62", "Dingbat hex": "3E", "Unicode dec": "62", "Unicode hex": "3E" }, { "Typeface name": "Symbol", "Dingbat dec": "63", "Dingbat hex": "3F", "Unicode dec": "63", "Unicode hex": "3F" }, { "Typeface name": "Symbol", "Dingbat dec": "64", "Dingbat hex": "40", "Unicode dec": "8773", "Unicode hex": "2245" }, { "Typeface name": "Symbol", "Dingbat dec": "65", "Dingbat hex": "41", "Unicode dec": "913", "Unicode hex": "391" }, { "Typeface name": "Symbol", "Dingbat dec": "66", "Dingbat hex": "42", "Unicode dec": "914", "Unicode hex": "392" }, { "Typeface name": "Symbol", "Dingbat dec": "67", "Dingbat hex": "43", "Unicode dec": "935", "Unicode hex": "3A7" }, { "Typeface name": "Symbol", "Dingbat dec": "68", "Dingbat hex": "44", "Unicode dec": "916", "Unicode hex": "394" }, { "Typeface name": "Symbol", "Dingbat dec": "69", "Dingbat hex": "45", "Unicode dec": "917", "Unicode hex": "395" }, { "Typeface name": "Symbol", "Dingbat dec": "70", "Dingbat hex": "46", "Unicode dec": "934", "Unicode hex": "3A6" }, { "Typeface name": "Symbol", "Dingbat dec": "71", "Dingbat hex": "47", "Unicode dec": "915", "Unicode hex": "393" }, { "Typeface name": "Symbol", "Dingbat dec": "72", "Dingbat hex": "48", "Unicode dec": "919", "Unicode hex": "397" }, { "Typeface name": "Symbol", "Dingbat dec": "73", "Dingbat hex": "49", "Unicode dec": "921", "Unicode hex": "399" }, { "Typeface name": "Symbol", "Dingbat dec": "74", "Dingbat hex": "4A", "Unicode dec": "977", "Unicode hex": "3D1" }, { "Typeface name": "Symbol", "Dingbat dec": "75", "Dingbat hex": "4B", "Unicode dec": "922", "Unicode hex": "39A" }, { "Typeface name": "Symbol", "Dingbat dec": "76", "Dingbat hex": "4C", "Unicode dec": "923", "Unicode hex": "39B" }, { "Typeface name": "Symbol", "Dingbat dec": "77", "Dingbat hex": "4D", "Unicode dec": "924", "Unicode hex": "39C" }, { "Typeface name": "Symbol", "Dingbat dec": "78", "Dingbat hex": "4E", "Unicode dec": "925", "Unicode hex": "39D" }, { "Typeface name": "Symbol", "Dingbat dec": "79", "Dingbat hex": "4F", "Unicode dec": "927", "Unicode hex": "39F" }, { "Typeface name": "Symbol", "Dingbat dec": "80", "Dingbat hex": "50", "Unicode dec": "928", "Unicode hex": "3A0" }, { "Typeface name": "Symbol", "Dingbat dec": "81", "Dingbat hex": "51", "Unicode dec": "920", "Unicode hex": "398" }, { "Typeface name": "Symbol", "Dingbat dec": "82", "Dingbat hex": "52", "Unicode dec": "929", "Unicode hex": "3A1" }, { "Typeface name": "Symbol", "Dingbat dec": "83", "Dingbat hex": "53", "Unicode dec": "931", "Unicode hex": "3A3" }, { "Typeface name": "Symbol", "Dingbat dec": "84", "Dingbat hex": "54", "Unicode dec": "932", "Unicode hex": "3A4" }, { "Typeface name": "Symbol", "Dingbat dec": "85", "Dingbat hex": "55", "Unicode dec": "933", "Unicode hex": "3A5" }, { "Typeface name": "Symbol", "Dingbat dec": "86", "Dingbat hex": "56", "Unicode dec": "962", "Unicode hex": "3C2" }, { "Typeface name": "Symbol", "Dingbat dec": "87", "Dingbat hex": "57", "Unicode dec": "937", "Unicode hex": "3A9" }, { "Typeface name": "Symbol", "Dingbat dec": "88", "Dingbat hex": "58", "Unicode dec": "926", "Unicode hex": "39E" }, { "Typeface name": "Symbol", "Dingbat dec": "89", "Dingbat hex": "59", "Unicode dec": "936", "Unicode hex": "3A8" }, { "Typeface name": "Symbol", "Dingbat dec": "90", "Dingbat hex": "5A", "Unicode dec": "918", "Unicode hex": "396" }, { "Typeface name": "Symbol", "Dingbat dec": "91", "Dingbat hex": "5B", "Unicode dec": "91", "Unicode hex": "5B" }, { "Typeface name": "Symbol", "Dingbat dec": "92", "Dingbat hex": "5C", "Unicode dec": "8756", "Unicode hex": "2234" }, { "Typeface name": "Symbol", "Dingbat dec": "93", "Dingbat hex": "5D", "Unicode dec": "93", "Unicode hex": "5D" }, { "Typeface name": "Symbol", "Dingbat dec": "94", "Dingbat hex": "5E", "Unicode dec": "8869", "Unicode hex": "22A5" }, { "Typeface name": "Symbol", "Dingbat dec": "95", "Dingbat hex": "5F", "Unicode dec": "95", "Unicode hex": "5F" }, { "Typeface name": "Symbol", "Dingbat dec": "96", "Dingbat hex": "60", "Unicode dec": "8254", "Unicode hex": "203E" }, { "Typeface name": "Symbol", "Dingbat dec": "97", "Dingbat hex": "61", "Unicode dec": "945", "Unicode hex": "3B1" }, { "Typeface name": "Symbol", "Dingbat dec": "98", "Dingbat hex": "62", "Unicode dec": "946", "Unicode hex": "3B2" }, { "Typeface name": "Symbol", "Dingbat dec": "99", "Dingbat hex": "63", "Unicode dec": "967", "Unicode hex": "3C7" }, { "Typeface name": "Symbol", "Dingbat dec": "100", "Dingbat hex": "64", "Unicode dec": "948", "Unicode hex": "3B4" }, { "Typeface name": "Symbol", "Dingbat dec": "101", "Dingbat hex": "65", "Unicode dec": "949", "Unicode hex": "3B5" }, { "Typeface name": "Symbol", "Dingbat dec": "102", "Dingbat hex": "66", "Unicode dec": "966", "Unicode hex": "3C6" }, { "Typeface name": "Symbol", "Dingbat dec": "103", "Dingbat hex": "67", "Unicode dec": "947", "Unicode hex": "3B3" }, { "Typeface name": "Symbol", "Dingbat dec": "104", "Dingbat hex": "68", "Unicode dec": "951", "Unicode hex": "3B7" }, { "Typeface name": "Symbol", "Dingbat dec": "105", "Dingbat hex": "69", "Unicode dec": "953", "Unicode hex": "3B9" }, { "Typeface name": "Symbol", "Dingbat dec": "106", "Dingbat hex": "6A", "Unicode dec": "981", "Unicode hex": "3D5" }, { "Typeface name": "Symbol", "Dingbat dec": "107", "Dingbat hex": "6B", "Unicode dec": "954", "Unicode hex": "3BA" }, { "Typeface name": "Symbol", "Dingbat dec": "108", "Dingbat hex": "6C", "Unicode dec": "955", "Unicode hex": "3BB" }, { "Typeface name": "Symbol", "Dingbat dec": "109", "Dingbat hex": "6D", "Unicode dec": "956", "Unicode hex": "3BC" }, { "Typeface name": "Symbol", "Dingbat dec": "110", "Dingbat hex": "6E", "Unicode dec": "957", "Unicode hex": "3BD" }, { "Typeface name": "Symbol", "Dingbat dec": "111", "Dingbat hex": "6F", "Unicode dec": "959", "Unicode hex": "3BF" }, { "Typeface name": "Symbol", "Dingbat dec": "112", "Dingbat hex": "70", "Unicode dec": "960", "Unicode hex": "3C0" }, { "Typeface name": "Symbol", "Dingbat dec": "113", "Dingbat hex": "71", "Unicode dec": "952", "Unicode hex": "3B8" }, { "Typeface name": "Symbol", "Dingbat dec": "114", "Dingbat hex": "72", "Unicode dec": "961", "Unicode hex": "3C1" }, { "Typeface name": "Symbol", "Dingbat dec": "115", "Dingbat hex": "73", "Unicode dec": "963", "Unicode hex": "3C3" }, { "Typeface name": "Symbol", "Dingbat dec": "116", "Dingbat hex": "74", "Unicode dec": "964", "Unicode hex": "3C4" }, { "Typeface name": "Symbol", "Dingbat dec": "117", "Dingbat hex": "75", "Unicode dec": "965", "Unicode hex": "3C5" }, { "Typeface name": "Symbol", "Dingbat dec": "118", "Dingbat hex": "76", "Unicode dec": "982", "Unicode hex": "3D6" }, { "Typeface name": "Symbol", "Dingbat dec": "119", "Dingbat hex": "77", "Unicode dec": "969", "Unicode hex": "3C9" }, { "Typeface name": "Symbol", "Dingbat dec": "120", "Dingbat hex": "78", "Unicode dec": "958", "Unicode hex": "3BE" }, { "Typeface name": "Symbol", "Dingbat dec": "121", "Dingbat hex": "79", "Unicode dec": "968", "Unicode hex": "3C8" }, { "Typeface name": "Symbol", "Dingbat dec": "122", "Dingbat hex": "7A", "Unicode dec": "950", "Unicode hex": "3B6" }, { "Typeface name": "Symbol", "Dingbat dec": "123", "Dingbat hex": "7B", "Unicode dec": "123", "Unicode hex": "7B" }, { "Typeface name": "Symbol", "Dingbat dec": "124", "Dingbat hex": "7C", "Unicode dec": "124", "Unicode hex": "7C" }, { "Typeface name": "Symbol", "Dingbat dec": "125", "Dingbat hex": "7D", "Unicode dec": "125", "Unicode hex": "7D" }, { "Typeface name": "Symbol", "Dingbat dec": "126", "Dingbat hex": "7E", "Unicode dec": "126", "Unicode hex": "7E" }, { "Typeface name": "Symbol", "Dingbat dec": "160", "Dingbat hex": "A0", "Unicode dec": "8364", "Unicode hex": "20AC" }, { "Typeface name": "Symbol", "Dingbat dec": "161", "Dingbat hex": "A1", "Unicode dec": "978", "Unicode hex": "3D2" }, { "Typeface name": "Symbol", "Dingbat dec": "162", "Dingbat hex": "A2", "Unicode dec": "8242", "Unicode hex": "2032" }, { "Typeface name": "Symbol", "Dingbat dec": "163", "Dingbat hex": "A3", "Unicode dec": "8804", "Unicode hex": "2264" }, { "Typeface name": "Symbol", "Dingbat dec": "164", "Dingbat hex": "A4", "Unicode dec": "8260", "Unicode hex": "2044" }, { "Typeface name": "Symbol", "Dingbat dec": "165", "Dingbat hex": "A5", "Unicode dec": "8734", "Unicode hex": "221E" }, { "Typeface name": "Symbol", "Dingbat dec": "166", "Dingbat hex": "A6", "Unicode dec": "402", "Unicode hex": "192" }, { "Typeface name": "Symbol", "Dingbat dec": "167", "Dingbat hex": "A7", "Unicode dec": "9827", "Unicode hex": "2663" }, { "Typeface name": "Symbol", "Dingbat dec": "168", "Dingbat hex": "A8", "Unicode dec": "9830", "Unicode hex": "2666" }, { "Typeface name": "Symbol", "Dingbat dec": "169", "Dingbat hex": "A9", "Unicode dec": "9829", "Unicode hex": "2665" }, { "Typeface name": "Symbol", "Dingbat dec": "170", "Dingbat hex": "AA", "Unicode dec": "9824", "Unicode hex": "2660" }, { "Typeface name": "Symbol", "Dingbat dec": "171", "Dingbat hex": "AB", "Unicode dec": "8596", "Unicode hex": "2194" }, { "Typeface name": "Symbol", "Dingbat dec": "172", "Dingbat hex": "AC", "Unicode dec": "8592", "Unicode hex": "2190" }, { "Typeface name": "Symbol", "Dingbat dec": "173", "Dingbat hex": "AD", "Unicode dec": "8593", "Unicode hex": "2191" }, { "Typeface name": "Symbol", "Dingbat dec": "174", "Dingbat hex": "AE", "Unicode dec": "8594", "Unicode hex": "2192" }, { "Typeface name": "Symbol", "Dingbat dec": "175", "Dingbat hex": "AF", "Unicode dec": "8595", "Unicode hex": "2193" }, { "Typeface name": "Symbol", "Dingbat dec": "176", "Dingbat hex": "B0", "Unicode dec": "176", "Unicode hex": "B0" }, { "Typeface name": "Symbol", "Dingbat dec": "177", "Dingbat hex": "B1", "Unicode dec": "177", "Unicode hex": "B1" }, { "Typeface name": "Symbol", "Dingbat dec": "178", "Dingbat hex": "B2", "Unicode dec": "8243", "Unicode hex": "2033" }, { "Typeface name": "Symbol", "Dingbat dec": "179", "Dingbat hex": "B3", "Unicode dec": "8805", "Unicode hex": "2265" }, { "Typeface name": "Symbol", "Dingbat dec": "180", "Dingbat hex": "B4", "Unicode dec": "215", "Unicode hex": "D7" }, { "Typeface name": "Symbol", "Dingbat dec": "181", "Dingbat hex": "B5", "Unicode dec": "8733", "Unicode hex": "221D" }, { "Typeface name": "Symbol", "Dingbat dec": "182", "Dingbat hex": "B6", "Unicode dec": "8706", "Unicode hex": "2202" }, { "Typeface name": "Symbol", "Dingbat dec": "183", "Dingbat hex": "B7", "Unicode dec": "8226", "Unicode hex": "2022" }, { "Typeface name": "Symbol", "Dingbat dec": "184", "Dingbat hex": "B8", "Unicode dec": "247", "Unicode hex": "F7" }, { "Typeface name": "Symbol", "Dingbat dec": "185", "Dingbat hex": "B9", "Unicode dec": "8800", "Unicode hex": "2260" }, { "Typeface name": "Symbol", "Dingbat dec": "186", "Dingbat hex": "BA", "Unicode dec": "8801", "Unicode hex": "2261" }, { "Typeface name": "Symbol", "Dingbat dec": "187", "Dingbat hex": "BB", "Unicode dec": "8776", "Unicode hex": "2248" }, { "Typeface name": "Symbol", "Dingbat dec": "188", "Dingbat hex": "BC", "Unicode dec": "8230", "Unicode hex": "2026" }, { "Typeface name": "Symbol", "Dingbat dec": "189", "Dingbat hex": "BD", "Unicode dec": "9168", "Unicode hex": "23D0" }, { "Typeface name": "Symbol", "Dingbat dec": "190", "Dingbat hex": "BE", "Unicode dec": "9135", "Unicode hex": "23AF" }, { "Typeface name": "Symbol", "Dingbat dec": "191", "Dingbat hex": "BF", "Unicode dec": "8629", "Unicode hex": "21B5" }, { "Typeface name": "Symbol", "Dingbat dec": "192", "Dingbat hex": "C0", "Unicode dec": "8501", "Unicode hex": "2135" }, { "Typeface name": "Symbol", "Dingbat dec": "193", "Dingbat hex": "C1", "Unicode dec": "8465", "Unicode hex": "2111" }, { "Typeface name": "Symbol", "Dingbat dec": "194", "Dingbat hex": "C2", "Unicode dec": "8476", "Unicode hex": "211C" }, { "Typeface name": "Symbol", "Dingbat dec": "195", "Dingbat hex": "C3", "Unicode dec": "8472", "Unicode hex": "2118" }, { "Typeface name": "Symbol", "Dingbat dec": "196", "Dingbat hex": "C4", "Unicode dec": "8855", "Unicode hex": "2297" }, { "Typeface name": "Symbol", "Dingbat dec": "197", "Dingbat hex": "C5", "Unicode dec": "8853", "Unicode hex": "2295" }, { "Typeface name": "Symbol", "Dingbat dec": "198", "Dingbat hex": "C6", "Unicode dec": "8709", "Unicode hex": "2205" }, { "Typeface name": "Symbol", "Dingbat dec": "199", "Dingbat hex": "C7", "Unicode dec": "8745", "Unicode hex": "2229" }, { "Typeface name": "Symbol", "Dingbat dec": "200", "Dingbat hex": "C8", "Unicode dec": "8746", "Unicode hex": "222A" }, { "Typeface name": "Symbol", "Dingbat dec": "201", "Dingbat hex": "C9", "Unicode dec": "8835", "Unicode hex": "2283" }, { "Typeface name": "Symbol", "Dingbat dec": "202", "Dingbat hex": "CA", "Unicode dec": "8839", "Unicode hex": "2287" }, { "Typeface name": "Symbol", "Dingbat dec": "203", "Dingbat hex": "CB", "Unicode dec": "8836", "Unicode hex": "2284" }, { "Typeface name": "Symbol", "Dingbat dec": "204", "Dingbat hex": "CC", "Unicode dec": "8834", "Unicode hex": "2282" }, { "Typeface name": "Symbol", "Dingbat dec": "205", "Dingbat hex": "CD", "Unicode dec": "8838", "Unicode hex": "2286" }, { "Typeface name": "Symbol", "Dingbat dec": "206", "Dingbat hex": "CE", "Unicode dec": "8712", "Unicode hex": "2208" }, { "Typeface name": "Symbol", "Dingbat dec": "207", "Dingbat hex": "CF", "Unicode dec": "8713", "Unicode hex": "2209" }, { "Typeface name": "Symbol", "Dingbat dec": "208", "Dingbat hex": "D0", "Unicode dec": "8736", "Unicode hex": "2220" }, { "Typeface name": "Symbol", "Dingbat dec": "209", "Dingbat hex": "D1", "Unicode dec": "8711", "Unicode hex": "2207" }, { "Typeface name": "Symbol", "Dingbat dec": "210", "Dingbat hex": "D2", "Unicode dec": "174", "Unicode hex": "AE" }, { "Typeface name": "Symbol", "Dingbat dec": "211", "Dingbat hex": "D3", "Unicode dec": "169", "Unicode hex": "A9" }, { "Typeface name": "Symbol", "Dingbat dec": "212", "Dingbat hex": "D4", "Unicode dec": "8482", "Unicode hex": "2122" }, { "Typeface name": "Symbol", "Dingbat dec": "213", "Dingbat hex": "D5", "Unicode dec": "8719", "Unicode hex": "220F" }, { "Typeface name": "Symbol", "Dingbat dec": "214", "Dingbat hex": "D6", "Unicode dec": "8730", "Unicode hex": "221A" }, { "Typeface name": "Symbol", "Dingbat dec": "215", "Dingbat hex": "D7", "Unicode dec": "8901", "Unicode hex": "22C5" }, { "Typeface name": "Symbol", "Dingbat dec": "216", "Dingbat hex": "D8", "Unicode dec": "172", "Unicode hex": "AC" }, { "Typeface name": "Symbol", "Dingbat dec": "217", "Dingbat hex": "D9", "Unicode dec": "8743", "Unicode hex": "2227" }, { "Typeface name": "Symbol", "Dingbat dec": "218", "Dingbat hex": "DA", "Unicode dec": "8744", "Unicode hex": "2228" }, { "Typeface name": "Symbol", "Dingbat dec": "219", "Dingbat hex": "DB", "Unicode dec": "8660", "Unicode hex": "21D4" }, { "Typeface name": "Symbol", "Dingbat dec": "220", "Dingbat hex": "DC", "Unicode dec": "8656", "Unicode hex": "21D0" }, { "Typeface name": "Symbol", "Dingbat dec": "221", "Dingbat hex": "DD", "Unicode dec": "8657", "Unicode hex": "21D1" }, { "Typeface name": "Symbol", "Dingbat dec": "222", "Dingbat hex": "DE", "Unicode dec": "8658", "Unicode hex": "21D2" }, { "Typeface name": "Symbol", "Dingbat dec": "223", "Dingbat hex": "DF", "Unicode dec": "8659", "Unicode hex": "21D3" }, { "Typeface name": "Symbol", "Dingbat dec": "224", "Dingbat hex": "E0", "Unicode dec": "9674", "Unicode hex": "25CA" }, { "Typeface name": "Symbol", "Dingbat dec": "225", "Dingbat hex": "E1", "Unicode dec": "12296", "Unicode hex": "3008" }, { "Typeface name": "Symbol", "Dingbat dec": "226", "Dingbat hex": "E2", "Unicode dec": "174", "Unicode hex": "AE" }, { "Typeface name": "Symbol", "Dingbat dec": "227", "Dingbat hex": "E3", "Unicode dec": "169", "Unicode hex": "A9" }, { "Typeface name": "Symbol", "Dingbat dec": "228", "Dingbat hex": "E4", "Unicode dec": "8482", "Unicode hex": "2122" }, { "Typeface name": "Symbol", "Dingbat dec": "229", "Dingbat hex": "E5", "Unicode dec": "8721", "Unicode hex": "2211" }, { "Typeface name": "Symbol", "Dingbat dec": "230", "Dingbat hex": "E6", "Unicode dec": "9115", "Unicode hex": "239B" }, { "Typeface name": "Symbol", "Dingbat dec": "231", "Dingbat hex": "E7", "Unicode dec": "9116", "Unicode hex": "239C" }, { "Typeface name": "Symbol", "Dingbat dec": "232", "Dingbat hex": "E8", "Unicode dec": "9117", "Unicode hex": "239D" }, { "Typeface name": "Symbol", "Dingbat dec": "233", "Dingbat hex": "E9", "Unicode dec": "9121", "Unicode hex": "23A1" }, { "Typeface name": "Symbol", "Dingbat dec": "234", "Dingbat hex": "EA", "Unicode dec": "9122", "Unicode hex": "23A2" }, { "Typeface name": "Symbol", "Dingbat dec": "235", "Dingbat hex": "EB", "Unicode dec": "9123", "Unicode hex": "23A3" }, { "Typeface name": "Symbol", "Dingbat dec": "236", "Dingbat hex": "EC", "Unicode dec": "9127", "Unicode hex": "23A7" }, { "Typeface name": "Symbol", "Dingbat dec": "237", "Dingbat hex": "ED", "Unicode dec": "9128", "Unicode hex": "23A8" }, { "Typeface name": "Symbol", "Dingbat dec": "238", "Dingbat hex": "EE", "Unicode dec": "9129", "Unicode hex": "23A9" }, { "Typeface name": "Symbol", "Dingbat dec": "239", "Dingbat hex": "EF", "Unicode dec": "9130", "Unicode hex": "23AA" }, { "Typeface name": "Symbol", "Dingbat dec": "240", "Dingbat hex": "F0", "Unicode dec": "63743", "Unicode hex": "F8FF" }, { "Typeface name": "Symbol", "Dingbat dec": "241", "Dingbat hex": "F1", "Unicode dec": "12297", "Unicode hex": "3009" }, { "Typeface name": "Symbol", "Dingbat dec": "242", "Dingbat hex": "F2", "Unicode dec": "8747", "Unicode hex": "222B" }, { "Typeface name": "Symbol", "Dingbat dec": "243", "Dingbat hex": "F3", "Unicode dec": "8992", "Unicode hex": "2320" }, { "Typeface name": "Symbol", "Dingbat dec": "244", "Dingbat hex": "F4", "Unicode dec": "9134", "Unicode hex": "23AE" }, { "Typeface name": "Symbol", "Dingbat dec": "245", "Dingbat hex": "F5", "Unicode dec": "8993", "Unicode hex": "2321" }, { "Typeface name": "Symbol", "Dingbat dec": "246", "Dingbat hex": "F6", "Unicode dec": "9118", "Unicode hex": "239E" }, { "Typeface name": "Symbol", "Dingbat dec": "247", "Dingbat hex": "F7", "Unicode dec": "9119", "Unicode hex": "239F" }, { "Typeface name": "Symbol", "Dingbat dec": "248", "Dingbat hex": "F8", "Unicode dec": "9120", "Unicode hex": "23A0" }, { "Typeface name": "Symbol", "Dingbat dec": "249", "Dingbat hex": "F9", "Unicode dec": "9124", "Unicode hex": "23A4" }, { "Typeface name": "Symbol", "Dingbat dec": "250", "Dingbat hex": "FA", "Unicode dec": "9125", "Unicode hex": "23A5" }, { "Typeface name": "Symbol", "Dingbat dec": "251", "Dingbat hex": "FB", "Unicode dec": "9126", "Unicode hex": "23A6" }, { "Typeface name": "Symbol", "Dingbat dec": "252", "Dingbat hex": "FC", "Unicode dec": "9131", "Unicode hex": "23AB" }, { "Typeface name": "Symbol", "Dingbat dec": "253", "Dingbat hex": "FD", "Unicode dec": "9132", "Unicode hex": "23AC" }, { "Typeface name": "Symbol", "Dingbat dec": "254", "Dingbat hex": "FE", "Unicode dec": "9133", "Unicode hex": "23AD" }, { "Typeface name": "Webdings", "Dingbat dec": "32", "Dingbat hex": "20", "Unicode dec": "32", "Unicode hex": "20" }, { "Typeface name": "Webdings", "Dingbat dec": "33", "Dingbat hex": "21", "Unicode dec": "128375", "Unicode hex": "1F577" }, { "Typeface name": "Webdings", "Dingbat dec": "34", "Dingbat hex": "22", "Unicode dec": "128376", "Unicode hex": "1F578" }, { "Typeface name": "Webdings", "Dingbat dec": "35", "Dingbat hex": "23", "Unicode dec": "128370", "Unicode hex": "1F572" }, { "Typeface name": "Webdings", "Dingbat dec": "36", "Dingbat hex": "24", "Unicode dec": "128374", "Unicode hex": "1F576" }, { "Typeface name": "Webdings", "Dingbat dec": "37", "Dingbat hex": "25", "Unicode dec": "127942", "Unicode hex": "1F3C6" }, { "Typeface name": "Webdings", "Dingbat dec": "38", "Dingbat hex": "26", "Unicode dec": "127894", "Unicode hex": "1F396" }, { "Typeface name": "Webdings", "Dingbat dec": "39", "Dingbat hex": "27", "Unicode dec": "128391", "Unicode hex": "1F587" }, { "Typeface name": "Webdings", "Dingbat dec": "40", "Dingbat hex": "28", "Unicode dec": "128488", "Unicode hex": "1F5E8" }, { "Typeface name": "Webdings", "Dingbat dec": "41", "Dingbat hex": "29", "Unicode dec": "128489", "Unicode hex": "1F5E9" }, { "Typeface name": "Webdings", "Dingbat dec": "42", "Dingbat hex": "2A", "Unicode dec": "128496", "Unicode hex": "1F5F0" }, { "Typeface name": "Webdings", "Dingbat dec": "43", "Dingbat hex": "2B", "Unicode dec": "128497", "Unicode hex": "1F5F1" }, { "Typeface name": "Webdings", "Dingbat dec": "44", "Dingbat hex": "2C", "Unicode dec": "127798", "Unicode hex": "1F336" }, { "Typeface name": "Webdings", "Dingbat dec": "45", "Dingbat hex": "2D", "Unicode dec": "127895", "Unicode hex": "1F397" }, { "Typeface name": "Webdings", "Dingbat dec": "46", "Dingbat hex": "2E", "Unicode dec": "128638", "Unicode hex": "1F67E" }, { "Typeface name": "Webdings", "Dingbat dec": "47", "Dingbat hex": "2F", "Unicode dec": "128636", "Unicode hex": "1F67C" }, { "Typeface name": "Webdings", "Dingbat dec": "48", "Dingbat hex": "30", "Unicode dec": "128469", "Unicode hex": "1F5D5" }, { "Typeface name": "Webdings", "Dingbat dec": "49", "Dingbat hex": "31", "Unicode dec": "128470", "Unicode hex": "1F5D6" }, { "Typeface name": "Webdings", "Dingbat dec": "50", "Dingbat hex": "32", "Unicode dec": "128471", "Unicode hex": "1F5D7" }, { "Typeface name": "Webdings", "Dingbat dec": "51", "Dingbat hex": "33", "Unicode dec": "9204", "Unicode hex": "23F4" }, { "Typeface name": "Webdings", "Dingbat dec": "52", "Dingbat hex": "34", "Unicode dec": "9205", "Unicode hex": "23F5" }, { "Typeface name": "Webdings", "Dingbat dec": "53", "Dingbat hex": "35", "Unicode dec": "9206", "Unicode hex": "23F6" }, { "Typeface name": "Webdings", "Dingbat dec": "54", "Dingbat hex": "36", "Unicode dec": "9207", "Unicode hex": "23F7" }, { "Typeface name": "Webdings", "Dingbat dec": "55", "Dingbat hex": "37", "Unicode dec": "9194", "Unicode hex": "23EA" }, { "Typeface name": "Webdings", "Dingbat dec": "56", "Dingbat hex": "38", "Unicode dec": "9193", "Unicode hex": "23E9" }, { "Typeface name": "Webdings", "Dingbat dec": "57", "Dingbat hex": "39", "Unicode dec": "9198", "Unicode hex": "23EE" }, { "Typeface name": "Webdings", "Dingbat dec": "58", "Dingbat hex": "3A", "Unicode dec": "9197", "Unicode hex": "23ED" }, { "Typeface name": "Webdings", "Dingbat dec": "59", "Dingbat hex": "3B", "Unicode dec": "9208", "Unicode hex": "23F8" }, { "Typeface name": "Webdings", "Dingbat dec": "60", "Dingbat hex": "3C", "Unicode dec": "9209", "Unicode hex": "23F9" }, { "Typeface name": "Webdings", "Dingbat dec": "61", "Dingbat hex": "3D", "Unicode dec": "9210", "Unicode hex": "23FA" }, { "Typeface name": "Webdings", "Dingbat dec": "62", "Dingbat hex": "3E", "Unicode dec": "128474", "Unicode hex": "1F5DA" }, { "Typeface name": "Webdings", "Dingbat dec": "63", "Dingbat hex": "3F", "Unicode dec": "128499", "Unicode hex": "1F5F3" }, { "Typeface name": "Webdings", "Dingbat dec": "64", "Dingbat hex": "40", "Unicode dec": "128736", "Unicode hex": "1F6E0" }, { "Typeface name": "Webdings", "Dingbat dec": "65", "Dingbat hex": "41", "Unicode dec": "127959", "Unicode hex": "1F3D7" }, { "Typeface name": "Webdings", "Dingbat dec": "66", "Dingbat hex": "42", "Unicode dec": "127960", "Unicode hex": "1F3D8" }, { "Typeface name": "Webdings", "Dingbat dec": "67", "Dingbat hex": "43", "Unicode dec": "127961", "Unicode hex": "1F3D9" }, { "Typeface name": "Webdings", "Dingbat dec": "68", "Dingbat hex": "44", "Unicode dec": "127962", "Unicode hex": "1F3DA" }, { "Typeface name": "Webdings", "Dingbat dec": "69", "Dingbat hex": "45", "Unicode dec": "127964", "Unicode hex": "1F3DC" }, { "Typeface name": "Webdings", "Dingbat dec": "70", "Dingbat hex": "46", "Unicode dec": "127981", "Unicode hex": "1F3ED" }, { "Typeface name": "Webdings", "Dingbat dec": "71", "Dingbat hex": "47", "Unicode dec": "127963", "Unicode hex": "1F3DB" }, { "Typeface name": "Webdings", "Dingbat dec": "72", "Dingbat hex": "48", "Unicode dec": "127968", "Unicode hex": "1F3E0" }, { "Typeface name": "Webdings", "Dingbat dec": "73", "Dingbat hex": "49", "Unicode dec": "127958", "Unicode hex": "1F3D6" }, { "Typeface name": "Webdings", "Dingbat dec": "74", "Dingbat hex": "4A", "Unicode dec": "127965", "Unicode hex": "1F3DD" }, { "Typeface name": "Webdings", "Dingbat dec": "75", "Dingbat hex": "4B", "Unicode dec": "128739", "Unicode hex": "1F6E3" }, { "Typeface name": "Webdings", "Dingbat dec": "76", "Dingbat hex": "4C", "Unicode dec": "128269", "Unicode hex": "1F50D" }, { "Typeface name": "Webdings", "Dingbat dec": "77", "Dingbat hex": "4D", "Unicode dec": "127956", "Unicode hex": "1F3D4" }, { "Typeface name": "Webdings", "Dingbat dec": "78", "Dingbat hex": "4E", "Unicode dec": "128065", "Unicode hex": "1F441" }, { "Typeface name": "Webdings", "Dingbat dec": "79", "Dingbat hex": "4F", "Unicode dec": "128066", "Unicode hex": "1F442" }, { "Typeface name": "Webdings", "Dingbat dec": "80", "Dingbat hex": "50", "Unicode dec": "127966", "Unicode hex": "1F3DE" }, { "Typeface name": "Webdings", "Dingbat dec": "81", "Dingbat hex": "51", "Unicode dec": "127957", "Unicode hex": "1F3D5" }, { "Typeface name": "Webdings", "Dingbat dec": "82", "Dingbat hex": "52", "Unicode dec": "128740", "Unicode hex": "1F6E4" }, { "Typeface name": "Webdings", "Dingbat dec": "83", "Dingbat hex": "53", "Unicode dec": "127967", "Unicode hex": "1F3DF" }, { "Typeface name": "Webdings", "Dingbat dec": "84", "Dingbat hex": "54", "Unicode dec": "128755", "Unicode hex": "1F6F3" }, { "Typeface name": "Webdings", "Dingbat dec": "85", "Dingbat hex": "55", "Unicode dec": "128364", "Unicode hex": "1F56C" }, { "Typeface name": "Webdings", "Dingbat dec": "86", "Dingbat hex": "56", "Unicode dec": "128363", "Unicode hex": "1F56B" }, { "Typeface name": "Webdings", "Dingbat dec": "87", "Dingbat hex": "57", "Unicode dec": "128360", "Unicode hex": "1F568" }, { "Typeface name": "Webdings", "Dingbat dec": "88", "Dingbat hex": "58", "Unicode dec": "128264", "Unicode hex": "1F508" }, { "Typeface name": "Webdings", "Dingbat dec": "89", "Dingbat hex": "59", "Unicode dec": "127892", "Unicode hex": "1F394" }, { "Typeface name": "Webdings", "Dingbat dec": "90", "Dingbat hex": "5A", "Unicode dec": "127893", "Unicode hex": "1F395" }, { "Typeface name": "Webdings", "Dingbat dec": "91", "Dingbat hex": "5B", "Unicode dec": "128492", "Unicode hex": "1F5EC" }, { "Typeface name": "Webdings", "Dingbat dec": "92", "Dingbat hex": "5C", "Unicode dec": "128637", "Unicode hex": "1F67D" }, { "Typeface name": "Webdings", "Dingbat dec": "93", "Dingbat hex": "5D", "Unicode dec": "128493", "Unicode hex": "1F5ED" }, { "Typeface name": "Webdings", "Dingbat dec": "94", "Dingbat hex": "5E", "Unicode dec": "128490", "Unicode hex": "1F5EA" }, { "Typeface name": "Webdings", "Dingbat dec": "95", "Dingbat hex": "5F", "Unicode dec": "128491", "Unicode hex": "1F5EB" }, { "Typeface name": "Webdings", "Dingbat dec": "96", "Dingbat hex": "60", "Unicode dec": "11156", "Unicode hex": "2B94" }, { "Typeface name": "Webdings", "Dingbat dec": "97", "Dingbat hex": "61", "Unicode dec": "10004", "Unicode hex": "2714" }, { "Typeface name": "Webdings", "Dingbat dec": "98", "Dingbat hex": "62", "Unicode dec": "128690", "Unicode hex": "1F6B2" }, { "Typeface name": "Webdings", "Dingbat dec": "99", "Dingbat hex": "63", "Unicode dec": "11036", "Unicode hex": "2B1C" }, { "Typeface name": "Webdings", "Dingbat dec": "100", "Dingbat hex": "64", "Unicode dec": "128737", "Unicode hex": "1F6E1" }, { "Typeface name": "Webdings", "Dingbat dec": "101", "Dingbat hex": "65", "Unicode dec": "128230", "Unicode hex": "1F4E6" }, { "Typeface name": "Webdings", "Dingbat dec": "102", "Dingbat hex": "66", "Unicode dec": "128753", "Unicode hex": "1F6F1" }, { "Typeface name": "Webdings", "Dingbat dec": "103", "Dingbat hex": "67", "Unicode dec": "11035", "Unicode hex": "2B1B" }, { "Typeface name": "Webdings", "Dingbat dec": "104", "Dingbat hex": "68", "Unicode dec": "128657", "Unicode hex": "1F691" }, { "Typeface name": "Webdings", "Dingbat dec": "105", "Dingbat hex": "69", "Unicode dec": "128712", "Unicode hex": "1F6C8" }, { "Typeface name": "Webdings", "Dingbat dec": "106", "Dingbat hex": "6A", "Unicode dec": "128745", "Unicode hex": "1F6E9" }, { "Typeface name": "Webdings", "Dingbat dec": "107", "Dingbat hex": "6B", "Unicode dec": "128752", "Unicode hex": "1F6F0" }, { "Typeface name": "Webdings", "Dingbat dec": "108", "Dingbat hex": "6C", "Unicode dec": "128968", "Unicode hex": "1F7C8" }, { "Typeface name": "Webdings", "Dingbat dec": "109", "Dingbat hex": "6D", "Unicode dec": "128372", "Unicode hex": "1F574" }, { "Typeface name": "Webdings", "Dingbat dec": "110", "Dingbat hex": "6E", "Unicode dec": "11044", "Unicode hex": "2B24" }, { "Typeface name": "Webdings", "Dingbat dec": "111", "Dingbat hex": "6F", "Unicode dec": "128741", "Unicode hex": "1F6E5" }, { "Typeface name": "Webdings", "Dingbat dec": "112", "Dingbat hex": "70", "Unicode dec": "128660", "Unicode hex": "1F694" }, { "Typeface name": "Webdings", "Dingbat dec": "113", "Dingbat hex": "71", "Unicode dec": "128472", "Unicode hex": "1F5D8" }, { "Typeface name": "Webdings", "Dingbat dec": "114", "Dingbat hex": "72", "Unicode dec": "128473", "Unicode hex": "1F5D9" }, { "Typeface name": "Webdings", "Dingbat dec": "115", "Dingbat hex": "73", "Unicode dec": "10067", "Unicode hex": "2753" }, { "Typeface name": "Webdings", "Dingbat dec": "116", "Dingbat hex": "74", "Unicode dec": "128754", "Unicode hex": "1F6F2" }, { "Typeface name": "Webdings", "Dingbat dec": "117", "Dingbat hex": "75", "Unicode dec": "128647", "Unicode hex": "1F687" }, { "Typeface name": "Webdings", "Dingbat dec": "118", "Dingbat hex": "76", "Unicode dec": "128653", "Unicode hex": "1F68D" }, { "Typeface name": "Webdings", "Dingbat dec": "119", "Dingbat hex": "77", "Unicode dec": "9971", "Unicode hex": "26F3" }, { "Typeface name": "Webdings", "Dingbat dec": "120", "Dingbat hex": "78", "Unicode dec": "10680", "Unicode hex": "29B8" }, { "Typeface name": "Webdings", "Dingbat dec": "121", "Dingbat hex": "79", "Unicode dec": "8854", "Unicode hex": "2296" }, { "Typeface name": "Webdings", "Dingbat dec": "122", "Dingbat hex": "7A", "Unicode dec": "128685", "Unicode hex": "1F6AD" }, { "Typeface name": "Webdings", "Dingbat dec": "123", "Dingbat hex": "7B", "Unicode dec": "128494", "Unicode hex": "1F5EE" }, { "Typeface name": "Webdings", "Dingbat dec": "124", "Dingbat hex": "7C", "Unicode dec": "9168", "Unicode hex": "23D0" }, { "Typeface name": "Webdings", "Dingbat dec": "125", "Dingbat hex": "7D", "Unicode dec": "128495", "Unicode hex": "1F5EF" }, { "Typeface name": "Webdings", "Dingbat dec": "126", "Dingbat hex": "7E", "Unicode dec": "128498", "Unicode hex": "1F5F2" }, { "Typeface name": "Webdings", "Dingbat dec": "128", "Dingbat hex": "80", "Unicode dec": "128697", "Unicode hex": "1F6B9" }, { "Typeface name": "Webdings", "Dingbat dec": "129", "Dingbat hex": "81", "Unicode dec": "128698", "Unicode hex": "1F6BA" }, { "Typeface name": "Webdings", "Dingbat dec": "130", "Dingbat hex": "82", "Unicode dec": "128713", "Unicode hex": "1F6C9" }, { "Typeface name": "Webdings", "Dingbat dec": "131", "Dingbat hex": "83", "Unicode dec": "128714", "Unicode hex": "1F6CA" }, { "Typeface name": "Webdings", "Dingbat dec": "132", "Dingbat hex": "84", "Unicode dec": "128700", "Unicode hex": "1F6BC" }, { "Typeface name": "Webdings", "Dingbat dec": "133", "Dingbat hex": "85", "Unicode dec": "128125", "Unicode hex": "1F47D" }, { "Typeface name": "Webdings", "Dingbat dec": "134", "Dingbat hex": "86", "Unicode dec": "127947", "Unicode hex": "1F3CB" }, { "Typeface name": "Webdings", "Dingbat dec": "135", "Dingbat hex": "87", "Unicode dec": "9975", "Unicode hex": "26F7" }, { "Typeface name": "Webdings", "Dingbat dec": "136", "Dingbat hex": "88", "Unicode dec": "127938", "Unicode hex": "1F3C2" }, { "Typeface name": "Webdings", "Dingbat dec": "137", "Dingbat hex": "89", "Unicode dec": "127948", "Unicode hex": "1F3CC" }, { "Typeface name": "Webdings", "Dingbat dec": "138", "Dingbat hex": "8A", "Unicode dec": "127946", "Unicode hex": "1F3CA" }, { "Typeface name": "Webdings", "Dingbat dec": "139", "Dingbat hex": "8B", "Unicode dec": "127940", "Unicode hex": "1F3C4" }, { "Typeface name": "Webdings", "Dingbat dec": "140", "Dingbat hex": "8C", "Unicode dec": "127949", "Unicode hex": "1F3CD" }, { "Typeface name": "Webdings", "Dingbat dec": "141", "Dingbat hex": "8D", "Unicode dec": "127950", "Unicode hex": "1F3CE" }, { "Typeface name": "Webdings", "Dingbat dec": "142", "Dingbat hex": "8E", "Unicode dec": "128664", "Unicode hex": "1F698" }, { "Typeface name": "Webdings", "Dingbat dec": "143", "Dingbat hex": "8F", "Unicode dec": "128480", "Unicode hex": "1F5E0" }, { "Typeface name": "Webdings", "Dingbat dec": "144", "Dingbat hex": "90", "Unicode dec": "128738", "Unicode hex": "1F6E2" }, { "Typeface name": "Webdings", "Dingbat dec": "145", "Dingbat hex": "91", "Unicode dec": "128176", "Unicode hex": "1F4B0" }, { "Typeface name": "Webdings", "Dingbat dec": "146", "Dingbat hex": "92", "Unicode dec": "127991", "Unicode hex": "1F3F7" }, { "Typeface name": "Webdings", "Dingbat dec": "147", "Dingbat hex": "93", "Unicode dec": "128179", "Unicode hex": "1F4B3" }, { "Typeface name": "Webdings", "Dingbat dec": "148", "Dingbat hex": "94", "Unicode dec": "128106", "Unicode hex": "1F46A" }, { "Typeface name": "Webdings", "Dingbat dec": "149", "Dingbat hex": "95", "Unicode dec": "128481", "Unicode hex": "1F5E1" }, { "Typeface name": "Webdings", "Dingbat dec": "150", "Dingbat hex": "96", "Unicode dec": "128482", "Unicode hex": "1F5E2" }, { "Typeface name": "Webdings", "Dingbat dec": "151", "Dingbat hex": "97", "Unicode dec": "128483", "Unicode hex": "1F5E3" }, { "Typeface name": "Webdings", "Dingbat dec": "152", "Dingbat hex": "98", "Unicode dec": "10031", "Unicode hex": "272F" }, { "Typeface name": "Webdings", "Dingbat dec": "153", "Dingbat hex": "99", "Unicode dec": "128388", "Unicode hex": "1F584" }, { "Typeface name": "Webdings", "Dingbat dec": "154", "Dingbat hex": "9A", "Unicode dec": "128389", "Unicode hex": "1F585" }, { "Typeface name": "Webdings", "Dingbat dec": "155", "Dingbat hex": "9B", "Unicode dec": "128387", "Unicode hex": "1F583" }, { "Typeface name": "Webdings", "Dingbat dec": "156", "Dingbat hex": "9C", "Unicode dec": "128390", "Unicode hex": "1F586" }, { "Typeface name": "Webdings", "Dingbat dec": "157", "Dingbat hex": "9D", "Unicode dec": "128441", "Unicode hex": "1F5B9" }, { "Typeface name": "Webdings", "Dingbat dec": "158", "Dingbat hex": "9E", "Unicode dec": "128442", "Unicode hex": "1F5BA" }, { "Typeface name": "Webdings", "Dingbat dec": "159", "Dingbat hex": "9F", "Unicode dec": "128443", "Unicode hex": "1F5BB" }, { "Typeface name": "Webdings", "Dingbat dec": "160", "Dingbat hex": "A0", "Unicode dec": "128373", "Unicode hex": "1F575" }, { "Typeface name": "Webdings", "Dingbat dec": "161", "Dingbat hex": "A1", "Unicode dec": "128368", "Unicode hex": "1F570" }, { "Typeface name": "Webdings", "Dingbat dec": "162", "Dingbat hex": "A2", "Unicode dec": "128445", "Unicode hex": "1F5BD" }, { "Typeface name": "Webdings", "Dingbat dec": "163", "Dingbat hex": "A3", "Unicode dec": "128446", "Unicode hex": "1F5BE" }, { "Typeface name": "Webdings", "Dingbat dec": "164", "Dingbat hex": "A4", "Unicode dec": "128203", "Unicode hex": "1F4CB" }, { "Typeface name": "Webdings", "Dingbat dec": "165", "Dingbat hex": "A5", "Unicode dec": "128466", "Unicode hex": "1F5D2" }, { "Typeface name": "Webdings", "Dingbat dec": "166", "Dingbat hex": "A6", "Unicode dec": "128467", "Unicode hex": "1F5D3" }, { "Typeface name": "Webdings", "Dingbat dec": "167", "Dingbat hex": "A7", "Unicode dec": "128366", "Unicode hex": "1F56E" }, { "Typeface name": "Webdings", "Dingbat dec": "168", "Dingbat hex": "A8", "Unicode dec": "128218", "Unicode hex": "1F4DA" }, { "Typeface name": "Webdings", "Dingbat dec": "169", "Dingbat hex": "A9", "Unicode dec": "128478", "Unicode hex": "1F5DE" }, { "Typeface name": "Webdings", "Dingbat dec": "170", "Dingbat hex": "AA", "Unicode dec": "128479", "Unicode hex": "1F5DF" }, { "Typeface name": "Webdings", "Dingbat dec": "171", "Dingbat hex": "AB", "Unicode dec": "128451", "Unicode hex": "1F5C3" }, { "Typeface name": "Webdings", "Dingbat dec": "172", "Dingbat hex": "AC", "Unicode dec": "128450", "Unicode hex": "1F5C2" }, { "Typeface name": "Webdings", "Dingbat dec": "173", "Dingbat hex": "AD", "Unicode dec": "128444", "Unicode hex": "1F5BC" }, { "Typeface name": "Webdings", "Dingbat dec": "174", "Dingbat hex": "AE", "Unicode dec": "127917", "Unicode hex": "1F3AD" }, { "Typeface name": "Webdings", "Dingbat dec": "175", "Dingbat hex": "AF", "Unicode dec": "127900", "Unicode hex": "1F39C" }, { "Typeface name": "Webdings", "Dingbat dec": "176", "Dingbat hex": "B0", "Unicode dec": "127896", "Unicode hex": "1F398" }, { "Typeface name": "Webdings", "Dingbat dec": "177", "Dingbat hex": "B1", "Unicode dec": "127897", "Unicode hex": "1F399" }, { "Typeface name": "Webdings", "Dingbat dec": "178", "Dingbat hex": "B2", "Unicode dec": "127911", "Unicode hex": "1F3A7" }, { "Typeface name": "Webdings", "Dingbat dec": "179", "Dingbat hex": "B3", "Unicode dec": "128191", "Unicode hex": "1F4BF" }, { "Typeface name": "Webdings", "Dingbat dec": "180", "Dingbat hex": "B4", "Unicode dec": "127902", "Unicode hex": "1F39E" }, { "Typeface name": "Webdings", "Dingbat dec": "181", "Dingbat hex": "B5", "Unicode dec": "128247", "Unicode hex": "1F4F7" }, { "Typeface name": "Webdings", "Dingbat dec": "182", "Dingbat hex": "B6", "Unicode dec": "127903", "Unicode hex": "1F39F" }, { "Typeface name": "Webdings", "Dingbat dec": "183", "Dingbat hex": "B7", "Unicode dec": "127916", "Unicode hex": "1F3AC" }, { "Typeface name": "Webdings", "Dingbat dec": "184", "Dingbat hex": "B8", "Unicode dec": "128253", "Unicode hex": "1F4FD" }, { "Typeface name": "Webdings", "Dingbat dec": "185", "Dingbat hex": "B9", "Unicode dec": "128249", "Unicode hex": "1F4F9" }, { "Typeface name": "Webdings", "Dingbat dec": "186", "Dingbat hex": "BA", "Unicode dec": "128254", "Unicode hex": "1F4FE" }, { "Typeface name": "Webdings", "Dingbat dec": "187", "Dingbat hex": "BB", "Unicode dec": "128251", "Unicode hex": "1F4FB" }, { "Typeface name": "Webdings", "Dingbat dec": "188", "Dingbat hex": "BC", "Unicode dec": "127898", "Unicode hex": "1F39A" }, { "Typeface name": "Webdings", "Dingbat dec": "189", "Dingbat hex": "BD", "Unicode dec": "127899", "Unicode hex": "1F39B" }, { "Typeface name": "Webdings", "Dingbat dec": "190", "Dingbat hex": "BE", "Unicode dec": "128250", "Unicode hex": "1F4FA" }, { "Typeface name": "Webdings", "Dingbat dec": "191", "Dingbat hex": "BF", "Unicode dec": "128187", "Unicode hex": "1F4BB" }, { "Typeface name": "Webdings", "Dingbat dec": "192", "Dingbat hex": "C0", "Unicode dec": "128421", "Unicode hex": "1F5A5" }, { "Typeface name": "Webdings", "Dingbat dec": "193", "Dingbat hex": "C1", "Unicode dec": "128422", "Unicode hex": "1F5A6" }, { "Typeface name": "Webdings", "Dingbat dec": "194", "Dingbat hex": "C2", "Unicode dec": "128423", "Unicode hex": "1F5A7" }, { "Typeface name": "Webdings", "Dingbat dec": "195", "Dingbat hex": "C3", "Unicode dec": "128377", "Unicode hex": "1F579" }, { "Typeface name": "Webdings", "Dingbat dec": "196", "Dingbat hex": "C4", "Unicode dec": "127918", "Unicode hex": "1F3AE" }, { "Typeface name": "Webdings", "Dingbat dec": "197", "Dingbat hex": "C5", "Unicode dec": "128379", "Unicode hex": "1F57B" }, { "Typeface name": "Webdings", "Dingbat dec": "198", "Dingbat hex": "C6", "Unicode dec": "128380", "Unicode hex": "1F57C" }, { "Typeface name": "Webdings", "Dingbat dec": "199", "Dingbat hex": "C7", "Unicode dec": "128223", "Unicode hex": "1F4DF" }, { "Typeface name": "Webdings", "Dingbat dec": "200", "Dingbat hex": "C8", "Unicode dec": "128385", "Unicode hex": "1F581" }, { "Typeface name": "Webdings", "Dingbat dec": "201", "Dingbat hex": "C9", "Unicode dec": "128384", "Unicode hex": "1F580" }, { "Typeface name": "Webdings", "Dingbat dec": "202", "Dingbat hex": "CA", "Unicode dec": "128424", "Unicode hex": "1F5A8" }, { "Typeface name": "Webdings", "Dingbat dec": "203", "Dingbat hex": "CB", "Unicode dec": "128425", "Unicode hex": "1F5A9" }, { "Typeface name": "Webdings", "Dingbat dec": "204", "Dingbat hex": "CC", "Unicode dec": "128447", "Unicode hex": "1F5BF" }, { "Typeface name": "Webdings", "Dingbat dec": "205", "Dingbat hex": "CD", "Unicode dec": "128426", "Unicode hex": "1F5AA" }, { "Typeface name": "Webdings", "Dingbat dec": "206", "Dingbat hex": "CE", "Unicode dec": "128476", "Unicode hex": "1F5DC" }, { "Typeface name": "Webdings", "Dingbat dec": "207", "Dingbat hex": "CF", "Unicode dec": "128274", "Unicode hex": "1F512" }, { "Typeface name": "Webdings", "Dingbat dec": "208", "Dingbat hex": "D0", "Unicode dec": "128275", "Unicode hex": "1F513" }, { "Typeface name": "Webdings", "Dingbat dec": "209", "Dingbat hex": "D1", "Unicode dec": "128477", "Unicode hex": "1F5DD" }, { "Typeface name": "Webdings", "Dingbat dec": "210", "Dingbat hex": "D2", "Unicode dec": "128229", "Unicode hex": "1F4E5" }, { "Typeface name": "Webdings", "Dingbat dec": "211", "Dingbat hex": "D3", "Unicode dec": "128228", "Unicode hex": "1F4E4" }, { "Typeface name": "Webdings", "Dingbat dec": "212", "Dingbat hex": "D4", "Unicode dec": "128371", "Unicode hex": "1F573" }, { "Typeface name": "Webdings", "Dingbat dec": "213", "Dingbat hex": "D5", "Unicode dec": "127779", "Unicode hex": "1F323" }, { "Typeface name": "Webdings", "Dingbat dec": "214", "Dingbat hex": "D6", "Unicode dec": "127780", "Unicode hex": "1F324" }, { "Typeface name": "Webdings", "Dingbat dec": "215", "Dingbat hex": "D7", "Unicode dec": "127781", "Unicode hex": "1F325" }, { "Typeface name": "Webdings", "Dingbat dec": "216", "Dingbat hex": "D8", "Unicode dec": "127782", "Unicode hex": "1F326" }, { "Typeface name": "Webdings", "Dingbat dec": "217", "Dingbat hex": "D9", "Unicode dec": "9729", "Unicode hex": "2601" }, { "Typeface name": "Webdings", "Dingbat dec": "218", "Dingbat hex": "DA", "Unicode dec": "127784", "Unicode hex": "1F328" }, { "Typeface name": "Webdings", "Dingbat dec": "219", "Dingbat hex": "DB", "Unicode dec": "127783", "Unicode hex": "1F327" }, { "Typeface name": "Webdings", "Dingbat dec": "220", "Dingbat hex": "DC", "Unicode dec": "127785", "Unicode hex": "1F329" }, { "Typeface name": "Webdings", "Dingbat dec": "221", "Dingbat hex": "DD", "Unicode dec": "127786", "Unicode hex": "1F32A" }, { "Typeface name": "Webdings", "Dingbat dec": "222", "Dingbat hex": "DE", "Unicode dec": "127788", "Unicode hex": "1F32C" }, { "Typeface name": "Webdings", "Dingbat dec": "223", "Dingbat hex": "DF", "Unicode dec": "127787", "Unicode hex": "1F32B" }, { "Typeface name": "Webdings", "Dingbat dec": "224", "Dingbat hex": "E0", "Unicode dec": "127772", "Unicode hex": "1F31C" }, { "Typeface name": "Webdings", "Dingbat dec": "225", "Dingbat hex": "E1", "Unicode dec": "127777", "Unicode hex": "1F321" }, { "Typeface name": "Webdings", "Dingbat dec": "226", "Dingbat hex": "E2", "Unicode dec": "128715", "Unicode hex": "1F6CB" }, { "Typeface name": "Webdings", "Dingbat dec": "227", "Dingbat hex": "E3", "Unicode dec": "128719", "Unicode hex": "1F6CF" }, { "Typeface name": "Webdings", "Dingbat dec": "228", "Dingbat hex": "E4", "Unicode dec": "127869", "Unicode hex": "1F37D" }, { "Typeface name": "Webdings", "Dingbat dec": "229", "Dingbat hex": "E5", "Unicode dec": "127864", "Unicode hex": "1F378" }, { "Typeface name": "Webdings", "Dingbat dec": "230", "Dingbat hex": "E6", "Unicode dec": "128718", "Unicode hex": "1F6CE" }, { "Typeface name": "Webdings", "Dingbat dec": "231", "Dingbat hex": "E7", "Unicode dec": "128717", "Unicode hex": "1F6CD" }, { "Typeface name": "Webdings", "Dingbat dec": "232", "Dingbat hex": "E8", "Unicode dec": "9413", "Unicode hex": "24C5" }, { "Typeface name": "Webdings", "Dingbat dec": "233", "Dingbat hex": "E9", "Unicode dec": "9855", "Unicode hex": "267F" }, { "Typeface name": "Webdings", "Dingbat dec": "234", "Dingbat hex": "EA", "Unicode dec": "128710", "Unicode hex": "1F6C6" }, { "Typeface name": "Webdings", "Dingbat dec": "235", "Dingbat hex": "EB", "Unicode dec": "128392", "Unicode hex": "1F588" }, { "Typeface name": "Webdings", "Dingbat dec": "236", "Dingbat hex": "EC", "Unicode dec": "127891", "Unicode hex": "1F393" }, { "Typeface name": "Webdings", "Dingbat dec": "237", "Dingbat hex": "ED", "Unicode dec": "128484", "Unicode hex": "1F5E4" }, { "Typeface name": "Webdings", "Dingbat dec": "238", "Dingbat hex": "EE", "Unicode dec": "128485", "Unicode hex": "1F5E5" }, { "Typeface name": "Webdings", "Dingbat dec": "239", "Dingbat hex": "EF", "Unicode dec": "128486", "Unicode hex": "1F5E6" }, { "Typeface name": "Webdings", "Dingbat dec": "240", "Dingbat hex": "F0", "Unicode dec": "128487", "Unicode hex": "1F5E7" }, { "Typeface name": "Webdings", "Dingbat dec": "241", "Dingbat hex": "F1", "Unicode dec": "128746", "Unicode hex": "1F6EA" }, { "Typeface name": "Webdings", "Dingbat dec": "242", "Dingbat hex": "F2", "Unicode dec": "128063", "Unicode hex": "1F43F" }, { "Typeface name": "Webdings", "Dingbat dec": "243", "Dingbat hex": "F3", "Unicode dec": "128038", "Unicode hex": "1F426" }, { "Typeface name": "Webdings", "Dingbat dec": "244", "Dingbat hex": "F4", "Unicode dec": "128031", "Unicode hex": "1F41F" }, { "Typeface name": "Webdings", "Dingbat dec": "245", "Dingbat hex": "F5", "Unicode dec": "128021", "Unicode hex": "1F415" }, { "Typeface name": "Webdings", "Dingbat dec": "246", "Dingbat hex": "F6", "Unicode dec": "128008", "Unicode hex": "1F408" }, { "Typeface name": "Webdings", "Dingbat dec": "247", "Dingbat hex": "F7", "Unicode dec": "128620", "Unicode hex": "1F66C" }, { "Typeface name": "Webdings", "Dingbat dec": "248", "Dingbat hex": "F8", "Unicode dec": "128622", "Unicode hex": "1F66E" }, { "Typeface name": "Webdings", "Dingbat dec": "249", "Dingbat hex": "F9", "Unicode dec": "128621", "Unicode hex": "1F66D" }, { "Typeface name": "Webdings", "Dingbat dec": "250", "Dingbat hex": "FA", "Unicode dec": "128623", "Unicode hex": "1F66F" }, { "Typeface name": "Webdings", "Dingbat dec": "251", "Dingbat hex": "FB", "Unicode dec": "128506", "Unicode hex": "1F5FA" }, { "Typeface name": "Webdings", "Dingbat dec": "252", "Dingbat hex": "FC", "Unicode dec": "127757", "Unicode hex": "1F30D" }, { "Typeface name": "Webdings", "Dingbat dec": "253", "Dingbat hex": "FD", "Unicode dec": "127759", "Unicode hex": "1F30F" }, { "Typeface name": "Webdings", "Dingbat dec": "254", "Dingbat hex": "FE", "Unicode dec": "127758", "Unicode hex": "1F30E" }, { "Typeface name": "Webdings", "Dingbat dec": "255", "Dingbat hex": "FF", "Unicode dec": "128330", "Unicode hex": "1F54A" }, { "Typeface name": "Wingdings", "Dingbat dec": "32", "Dingbat hex": "20", "Unicode dec": "32", "Unicode hex": "20" }, { "Typeface name": "Wingdings", "Dingbat dec": "33", "Dingbat hex": "21", "Unicode dec": "128393", "Unicode hex": "1F589" }, { "Typeface name": "Wingdings", "Dingbat dec": "34", "Dingbat hex": "22", "Unicode dec": "9986", "Unicode hex": "2702" }, { "Typeface name": "Wingdings", "Dingbat dec": "35", "Dingbat hex": "23", "Unicode dec": "9985", "Unicode hex": "2701" }, { "Typeface name": "Wingdings", "Dingbat dec": "36", "Dingbat hex": "24", "Unicode dec": "128083", "Unicode hex": "1F453" }, { "Typeface name": "Wingdings", "Dingbat dec": "37", "Dingbat hex": "25", "Unicode dec": "128365", "Unicode hex": "1F56D" }, { "Typeface name": "Wingdings", "Dingbat dec": "38", "Dingbat hex": "26", "Unicode dec": "128366", "Unicode hex": "1F56E" }, { "Typeface name": "Wingdings", "Dingbat dec": "39", "Dingbat hex": "27", "Unicode dec": "128367", "Unicode hex": "1F56F" }, { "Typeface name": "Wingdings", "Dingbat dec": "40", "Dingbat hex": "28", "Unicode dec": "128383", "Unicode hex": "1F57F" }, { "Typeface name": "Wingdings", "Dingbat dec": "41", "Dingbat hex": "29", "Unicode dec": "9990", "Unicode hex": "2706" }, { "Typeface name": "Wingdings", "Dingbat dec": "42", "Dingbat hex": "2A", "Unicode dec": "128386", "Unicode hex": "1F582" }, { "Typeface name": "Wingdings", "Dingbat dec": "43", "Dingbat hex": "2B", "Unicode dec": "128387", "Unicode hex": "1F583" }, { "Typeface name": "Wingdings", "Dingbat dec": "44", "Dingbat hex": "2C", "Unicode dec": "128234", "Unicode hex": "1F4EA" }, { "Typeface name": "Wingdings", "Dingbat dec": "45", "Dingbat hex": "2D", "Unicode dec": "128235", "Unicode hex": "1F4EB" }, { "Typeface name": "Wingdings", "Dingbat dec": "46", "Dingbat hex": "2E", "Unicode dec": "128236", "Unicode hex": "1F4EC" }, { "Typeface name": "Wingdings", "Dingbat dec": "47", "Dingbat hex": "2F", "Unicode dec": "128237", "Unicode hex": "1F4ED" }, { "Typeface name": "Wingdings", "Dingbat dec": "48", "Dingbat hex": "30", "Unicode dec": "128448", "Unicode hex": "1F5C0" }, { "Typeface name": "Wingdings", "Dingbat dec": "49", "Dingbat hex": "31", "Unicode dec": "128449", "Unicode hex": "1F5C1" }, { "Typeface name": "Wingdings", "Dingbat dec": "50", "Dingbat hex": "32", "Unicode dec": "128462", "Unicode hex": "1F5CE" }, { "Typeface name": "Wingdings", "Dingbat dec": "51", "Dingbat hex": "33", "Unicode dec": "128463", "Unicode hex": "1F5CF" }, { "Typeface name": "Wingdings", "Dingbat dec": "52", "Dingbat hex": "34", "Unicode dec": "128464", "Unicode hex": "1F5D0" }, { "Typeface name": "Wingdings", "Dingbat dec": "53", "Dingbat hex": "35", "Unicode dec": "128452", "Unicode hex": "1F5C4" }, { "Typeface name": "Wingdings", "Dingbat dec": "54", "Dingbat hex": "36", "Unicode dec": "8987", "Unicode hex": "231B" }, { "Typeface name": "Wingdings", "Dingbat dec": "55", "Dingbat hex": "37", "Unicode dec": "128430", "Unicode hex": "1F5AE" }, { "Typeface name": "Wingdings", "Dingbat dec": "56", "Dingbat hex": "38", "Unicode dec": "128432", "Unicode hex": "1F5B0" }, { "Typeface name": "Wingdings", "Dingbat dec": "57", "Dingbat hex": "39", "Unicode dec": "128434", "Unicode hex": "1F5B2" }, { "Typeface name": "Wingdings", "Dingbat dec": "58", "Dingbat hex": "3A", "Unicode dec": "128435", "Unicode hex": "1F5B3" }, { "Typeface name": "Wingdings", "Dingbat dec": "59", "Dingbat hex": "3B", "Unicode dec": "128436", "Unicode hex": "1F5B4" }, { "Typeface name": "Wingdings", "Dingbat dec": "60", "Dingbat hex": "3C", "Unicode dec": "128427", "Unicode hex": "1F5AB" }, { "Typeface name": "Wingdings", "Dingbat dec": "61", "Dingbat hex": "3D", "Unicode dec": "128428", "Unicode hex": "1F5AC" }, { "Typeface name": "Wingdings", "Dingbat dec": "62", "Dingbat hex": "3E", "Unicode dec": "9991", "Unicode hex": "2707" }, { "Typeface name": "Wingdings", "Dingbat dec": "63", "Dingbat hex": "3F", "Unicode dec": "9997", "Unicode hex": "270D" }, { "Typeface name": "Wingdings", "Dingbat dec": "64", "Dingbat hex": "40", "Unicode dec": "128398", "Unicode hex": "1F58E" }, { "Typeface name": "Wingdings", "Dingbat dec": "65", "Dingbat hex": "41", "Unicode dec": "9996", "Unicode hex": "270C" }, { "Typeface name": "Wingdings", "Dingbat dec": "66", "Dingbat hex": "42", "Unicode dec": "128399", "Unicode hex": "1F58F" }, { "Typeface name": "Wingdings", "Dingbat dec": "67", "Dingbat hex": "43", "Unicode dec": "128077", "Unicode hex": "1F44D" }, { "Typeface name": "Wingdings", "Dingbat dec": "68", "Dingbat hex": "44", "Unicode dec": "128078", "Unicode hex": "1F44E" }, { "Typeface name": "Wingdings", "Dingbat dec": "69", "Dingbat hex": "45", "Unicode dec": "9756", "Unicode hex": "261C" }, { "Typeface name": "Wingdings", "Dingbat dec": "70", "Dingbat hex": "46", "Unicode dec": "9758", "Unicode hex": "261E" }, { "Typeface name": "Wingdings", "Dingbat dec": "71", "Dingbat hex": "47", "Unicode dec": "9757", "Unicode hex": "261D" }, { "Typeface name": "Wingdings", "Dingbat dec": "72", "Dingbat hex": "48", "Unicode dec": "9759", "Unicode hex": "261F" }, { "Typeface name": "Wingdings", "Dingbat dec": "73", "Dingbat hex": "49", "Unicode dec": "128400", "Unicode hex": "1F590" }, { "Typeface name": "Wingdings", "Dingbat dec": "74", "Dingbat hex": "4A", "Unicode dec": "9786", "Unicode hex": "263A" }, { "Typeface name": "Wingdings", "Dingbat dec": "75", "Dingbat hex": "4B", "Unicode dec": "128528", "Unicode hex": "1F610" }, { "Typeface name": "Wingdings", "Dingbat dec": "76", "Dingbat hex": "4C", "Unicode dec": "9785", "Unicode hex": "2639" }, { "Typeface name": "Wingdings", "Dingbat dec": "77", "Dingbat hex": "4D", "Unicode dec": "128163", "Unicode hex": "1F4A3" }, { "Typeface name": "Wingdings", "Dingbat dec": "78", "Dingbat hex": "4E", "Unicode dec": "128369", "Unicode hex": "1F571" }, { "Typeface name": "Wingdings", "Dingbat dec": "79", "Dingbat hex": "4F", "Unicode dec": "127987", "Unicode hex": "1F3F3" }, { "Typeface name": "Wingdings", "Dingbat dec": "80", "Dingbat hex": "50", "Unicode dec": "127985", "Unicode hex": "1F3F1" }, { "Typeface name": "Wingdings", "Dingbat dec": "81", "Dingbat hex": "51", "Unicode dec": "9992", "Unicode hex": "2708" }, { "Typeface name": "Wingdings", "Dingbat dec": "82", "Dingbat hex": "52", "Unicode dec": "9788", "Unicode hex": "263C" }, { "Typeface name": "Wingdings", "Dingbat dec": "83", "Dingbat hex": "53", "Unicode dec": "127778", "Unicode hex": "1F322" }, { "Typeface name": "Wingdings", "Dingbat dec": "84", "Dingbat hex": "54", "Unicode dec": "10052", "Unicode hex": "2744" }, { "Typeface name": "Wingdings", "Dingbat dec": "85", "Dingbat hex": "55", "Unicode dec": "128326", "Unicode hex": "1F546" }, { "Typeface name": "Wingdings", "Dingbat dec": "86", "Dingbat hex": "56", "Unicode dec": "10014", "Unicode hex": "271E" }, { "Typeface name": "Wingdings", "Dingbat dec": "87", "Dingbat hex": "57", "Unicode dec": "128328", "Unicode hex": "1F548" }, { "Typeface name": "Wingdings", "Dingbat dec": "88", "Dingbat hex": "58", "Unicode dec": "10016", "Unicode hex": "2720" }, { "Typeface name": "Wingdings", "Dingbat dec": "89", "Dingbat hex": "59", "Unicode dec": "10017", "Unicode hex": "2721" }, { "Typeface name": "Wingdings", "Dingbat dec": "90", "Dingbat hex": "5A", "Unicode dec": "9770", "Unicode hex": "262A" }, { "Typeface name": "Wingdings", "Dingbat dec": "91", "Dingbat hex": "5B", "Unicode dec": "9775", "Unicode hex": "262F" }, { "Typeface name": "Wingdings", "Dingbat dec": "92", "Dingbat hex": "5C", "Unicode dec": "128329", "Unicode hex": "1F549" }, { "Typeface name": "Wingdings", "Dingbat dec": "93", "Dingbat hex": "5D", "Unicode dec": "9784", "Unicode hex": "2638" }, { "Typeface name": "Wingdings", "Dingbat dec": "94", "Dingbat hex": "5E", "Unicode dec": "9800", "Unicode hex": "2648" }, { "Typeface name": "Wingdings", "Dingbat dec": "95", "Dingbat hex": "5F", "Unicode dec": "9801", "Unicode hex": "2649" }, { "Typeface name": "Wingdings", "Dingbat dec": "96", "Dingbat hex": "60", "Unicode dec": "9802", "Unicode hex": "264A" }, { "Typeface name": "Wingdings", "Dingbat dec": "97", "Dingbat hex": "61", "Unicode dec": "9803", "Unicode hex": "264B" }, { "Typeface name": "Wingdings", "Dingbat dec": "98", "Dingbat hex": "62", "Unicode dec": "9804", "Unicode hex": "264C" }, { "Typeface name": "Wingdings", "Dingbat dec": "99", "Dingbat hex": "63", "Unicode dec": "9805", "Unicode hex": "264D" }, { "Typeface name": "Wingdings", "Dingbat dec": "100", "Dingbat hex": "64", "Unicode dec": "9806", "Unicode hex": "264E" }, { "Typeface name": "Wingdings", "Dingbat dec": "101", "Dingbat hex": "65", "Unicode dec": "9807", "Unicode hex": "264F" }, { "Typeface name": "Wingdings", "Dingbat dec": "102", "Dingbat hex": "66", "Unicode dec": "9808", "Unicode hex": "2650" }, { "Typeface name": "Wingdings", "Dingbat dec": "103", "Dingbat hex": "67", "Unicode dec": "9809", "Unicode hex": "2651" }, { "Typeface name": "Wingdings", "Dingbat dec": "104", "Dingbat hex": "68", "Unicode dec": "9810", "Unicode hex": "2652" }, { "Typeface name": "Wingdings", "Dingbat dec": "105", "Dingbat hex": "69", "Unicode dec": "9811", "Unicode hex": "2653" }, { "Typeface name": "Wingdings", "Dingbat dec": "106", "Dingbat hex": "6A", "Unicode dec": "128624", "Unicode hex": "1F670" }, { "Typeface name": "Wingdings", "Dingbat dec": "107", "Dingbat hex": "6B", "Unicode dec": "128629", "Unicode hex": "1F675" }, { "Typeface name": "Wingdings", "Dingbat dec": "108", "Dingbat hex": "6C", "Unicode dec": "9899", "Unicode hex": "26AB" }, { "Typeface name": "Wingdings", "Dingbat dec": "109", "Dingbat hex": "6D", "Unicode dec": "128318", "Unicode hex": "1F53E" }, { "Typeface name": "Wingdings", "Dingbat dec": "110", "Dingbat hex": "6E", "Unicode dec": "9724", "Unicode hex": "25FC" }, { "Typeface name": "Wingdings", "Dingbat dec": "111", "Dingbat hex": "6F", "Unicode dec": "128911", "Unicode hex": "1F78F" }, { "Typeface name": "Wingdings", "Dingbat dec": "112", "Dingbat hex": "70", "Unicode dec": "128912", "Unicode hex": "1F790" }, { "Typeface name": "Wingdings", "Dingbat dec": "113", "Dingbat hex": "71", "Unicode dec": "10065", "Unicode hex": "2751" }, { "Typeface name": "Wingdings", "Dingbat dec": "114", "Dingbat hex": "72", "Unicode dec": "10066", "Unicode hex": "2752" }, { "Typeface name": "Wingdings", "Dingbat dec": "115", "Dingbat hex": "73", "Unicode dec": "128927", "Unicode hex": "1F79F" }, { "Typeface name": "Wingdings", "Dingbat dec": "116", "Dingbat hex": "74", "Unicode dec": "10731", "Unicode hex": "29EB" }, { "Typeface name": "Wingdings", "Dingbat dec": "117", "Dingbat hex": "75", "Unicode dec": "9670", "Unicode hex": "25C6" }, { "Typeface name": "Wingdings", "Dingbat dec": "118", "Dingbat hex": "76", "Unicode dec": "10070", "Unicode hex": "2756" }, { "Typeface name": "Wingdings", "Dingbat dec": "119", "Dingbat hex": "77", "Unicode dec": "11049", "Unicode hex": "2B29" }, { "Typeface name": "Wingdings", "Dingbat dec": "120", "Dingbat hex": "78", "Unicode dec": "8999", "Unicode hex": "2327" }, { "Typeface name": "Wingdings", "Dingbat dec": "121", "Dingbat hex": "79", "Unicode dec": "11193", "Unicode hex": "2BB9" }, { "Typeface name": "Wingdings", "Dingbat dec": "122", "Dingbat hex": "7A", "Unicode dec": "8984", "Unicode hex": "2318" }, { "Typeface name": "Wingdings", "Dingbat dec": "123", "Dingbat hex": "7B", "Unicode dec": "127989", "Unicode hex": "1F3F5" }, { "Typeface name": "Wingdings", "Dingbat dec": "124", "Dingbat hex": "7C", "Unicode dec": "127990", "Unicode hex": "1F3F6" }, { "Typeface name": "Wingdings", "Dingbat dec": "125", "Dingbat hex": "7D", "Unicode dec": "128630", "Unicode hex": "1F676" }, { "Typeface name": "Wingdings", "Dingbat dec": "126", "Dingbat hex": "7E", "Unicode dec": "128631", "Unicode hex": "1F677" }, { "Typeface name": "Wingdings", "Dingbat dec": "127", "Dingbat hex": "7F", "Unicode dec": "9647", "Unicode hex": "25AF" }, { "Typeface name": "Wingdings", "Dingbat dec": "128", "Dingbat hex": "80", "Unicode dec": "127243", "Unicode hex": "1F10B" }, { "Typeface name": "Wingdings", "Dingbat dec": "129", "Dingbat hex": "81", "Unicode dec": "10112", "Unicode hex": "2780" }, { "Typeface name": "Wingdings", "Dingbat dec": "130", "Dingbat hex": "82", "Unicode dec": "10113", "Unicode hex": "2781" }, { "Typeface name": "Wingdings", "Dingbat dec": "131", "Dingbat hex": "83", "Unicode dec": "10114", "Unicode hex": "2782" }, { "Typeface name": "Wingdings", "Dingbat dec": "132", "Dingbat hex": "84", "Unicode dec": "10115", "Unicode hex": "2783" }, { "Typeface name": "Wingdings", "Dingbat dec": "133", "Dingbat hex": "85", "Unicode dec": "10116", "Unicode hex": "2784" }, { "Typeface name": "Wingdings", "Dingbat dec": "134", "Dingbat hex": "86", "Unicode dec": "10117", "Unicode hex": "2785" }, { "Typeface name": "Wingdings", "Dingbat dec": "135", "Dingbat hex": "87", "Unicode dec": "10118", "Unicode hex": "2786" }, { "Typeface name": "Wingdings", "Dingbat dec": "136", "Dingbat hex": "88", "Unicode dec": "10119", "Unicode hex": "2787" }, { "Typeface name": "Wingdings", "Dingbat dec": "137", "Dingbat hex": "89", "Unicode dec": "10120", "Unicode hex": "2788" }, { "Typeface name": "Wingdings", "Dingbat dec": "138", "Dingbat hex": "8A", "Unicode dec": "10121", "Unicode hex": "2789" }, { "Typeface name": "Wingdings", "Dingbat dec": "139", "Dingbat hex": "8B", "Unicode dec": "127244", "Unicode hex": "1F10C" }, { "Typeface name": "Wingdings", "Dingbat dec": "140", "Dingbat hex": "8C", "Unicode dec": "10122", "Unicode hex": "278A" }, { "Typeface name": "Wingdings", "Dingbat dec": "141", "Dingbat hex": "8D", "Unicode dec": "10123", "Unicode hex": "278B" }, { "Typeface name": "Wingdings", "Dingbat dec": "142", "Dingbat hex": "8E", "Unicode dec": "10124", "Unicode hex": "278C" }, { "Typeface name": "Wingdings", "Dingbat dec": "143", "Dingbat hex": "8F", "Unicode dec": "10125", "Unicode hex": "278D" }, { "Typeface name": "Wingdings", "Dingbat dec": "144", "Dingbat hex": "90", "Unicode dec": "10126", "Unicode hex": "278E" }, { "Typeface name": "Wingdings", "Dingbat dec": "145", "Dingbat hex": "91", "Unicode dec": "10127", "Unicode hex": "278F" }, { "Typeface name": "Wingdings", "Dingbat dec": "146", "Dingbat hex": "92", "Unicode dec": "10128", "Unicode hex": "2790" }, { "Typeface name": "Wingdings", "Dingbat dec": "147", "Dingbat hex": "93", "Unicode dec": "10129", "Unicode hex": "2791" }, { "Typeface name": "Wingdings", "Dingbat dec": "148", "Dingbat hex": "94", "Unicode dec": "10130", "Unicode hex": "2792" }, { "Typeface name": "Wingdings", "Dingbat dec": "149", "Dingbat hex": "95", "Unicode dec": "10131", "Unicode hex": "2793" }, { "Typeface name": "Wingdings", "Dingbat dec": "150", "Dingbat hex": "96", "Unicode dec": "128610", "Unicode hex": "1F662" }, { "Typeface name": "Wingdings", "Dingbat dec": "151", "Dingbat hex": "97", "Unicode dec": "128608", "Unicode hex": "1F660" }, { "Typeface name": "Wingdings", "Dingbat dec": "152", "Dingbat hex": "98", "Unicode dec": "128609", "Unicode hex": "1F661" }, { "Typeface name": "Wingdings", "Dingbat dec": "153", "Dingbat hex": "99", "Unicode dec": "128611", "Unicode hex": "1F663" }, { "Typeface name": "Wingdings", "Dingbat dec": "154", "Dingbat hex": "9A", "Unicode dec": "128606", "Unicode hex": "1F65E" }, { "Typeface name": "Wingdings", "Dingbat dec": "155", "Dingbat hex": "9B", "Unicode dec": "128604", "Unicode hex": "1F65C" }, { "Typeface name": "Wingdings", "Dingbat dec": "156", "Dingbat hex": "9C", "Unicode dec": "128605", "Unicode hex": "1F65D" }, { "Typeface name": "Wingdings", "Dingbat dec": "157", "Dingbat hex": "9D", "Unicode dec": "128607", "Unicode hex": "1F65F" }, { "Typeface name": "Wingdings", "Dingbat dec": "158", "Dingbat hex": "9E", "Unicode dec": "8729", "Unicode hex": "2219" }, { "Typeface name": "Wingdings", "Dingbat dec": "159", "Dingbat hex": "9F", "Unicode dec": "8226", "Unicode hex": "2022" }, { "Typeface name": "Wingdings", "Dingbat dec": "160", "Dingbat hex": "A0", "Unicode dec": "11037", "Unicode hex": "2B1D" }, { "Typeface name": "Wingdings", "Dingbat dec": "161", "Dingbat hex": "A1", "Unicode dec": "11096", "Unicode hex": "2B58" }, { "Typeface name": "Wingdings", "Dingbat dec": "162", "Dingbat hex": "A2", "Unicode dec": "128902", "Unicode hex": "1F786" }, { "Typeface name": "Wingdings", "Dingbat dec": "163", "Dingbat hex": "A3", "Unicode dec": "128904", "Unicode hex": "1F788" }, { "Typeface name": "Wingdings", "Dingbat dec": "164", "Dingbat hex": "A4", "Unicode dec": "128906", "Unicode hex": "1F78A" }, { "Typeface name": "Wingdings", "Dingbat dec": "165", "Dingbat hex": "A5", "Unicode dec": "128907", "Unicode hex": "1F78B" }, { "Typeface name": "Wingdings", "Dingbat dec": "166", "Dingbat hex": "A6", "Unicode dec": "128319", "Unicode hex": "1F53F" }, { "Typeface name": "Wingdings", "Dingbat dec": "167", "Dingbat hex": "A7", "Unicode dec": "9642", "Unicode hex": "25AA" }, { "Typeface name": "Wingdings", "Dingbat dec": "168", "Dingbat hex": "A8", "Unicode dec": "128910", "Unicode hex": "1F78E" }, { "Typeface name": "Wingdings", "Dingbat dec": "169", "Dingbat hex": "A9", "Unicode dec": "128961", "Unicode hex": "1F7C1" }, { "Typeface name": "Wingdings", "Dingbat dec": "170", "Dingbat hex": "AA", "Unicode dec": "128965", "Unicode hex": "1F7C5" }, { "Typeface name": "Wingdings", "Dingbat dec": "171", "Dingbat hex": "AB", "Unicode dec": "9733", "Unicode hex": "2605" }, { "Typeface name": "Wingdings", "Dingbat dec": "172", "Dingbat hex": "AC", "Unicode dec": "128971", "Unicode hex": "1F7CB" }, { "Typeface name": "Wingdings", "Dingbat dec": "173", "Dingbat hex": "AD", "Unicode dec": "128975", "Unicode hex": "1F7CF" }, { "Typeface name": "Wingdings", "Dingbat dec": "174", "Dingbat hex": "AE", "Unicode dec": "128979", "Unicode hex": "1F7D3" }, { "Typeface name": "Wingdings", "Dingbat dec": "175", "Dingbat hex": "AF", "Unicode dec": "128977", "Unicode hex": "1F7D1" }, { "Typeface name": "Wingdings", "Dingbat dec": "176", "Dingbat hex": "B0", "Unicode dec": "11216", "Unicode hex": "2BD0" }, { "Typeface name": "Wingdings", "Dingbat dec": "177", "Dingbat hex": "B1", "Unicode dec": "8982", "Unicode hex": "2316" }, { "Typeface name": "Wingdings", "Dingbat dec": "178", "Dingbat hex": "B2", "Unicode dec": "11214", "Unicode hex": "2BCE" }, { "Typeface name": "Wingdings", "Dingbat dec": "179", "Dingbat hex": "B3", "Unicode dec": "11215", "Unicode hex": "2BCF" }, { "Typeface name": "Wingdings", "Dingbat dec": "180", "Dingbat hex": "B4", "Unicode dec": "11217", "Unicode hex": "2BD1" }, { "Typeface name": "Wingdings", "Dingbat dec": "181", "Dingbat hex": "B5", "Unicode dec": "10026", "Unicode hex": "272A" }, { "Typeface name": "Wingdings", "Dingbat dec": "182", "Dingbat hex": "B6", "Unicode dec": "10032", "Unicode hex": "2730" }, { "Typeface name": "Wingdings", "Dingbat dec": "183", "Dingbat hex": "B7", "Unicode dec": "128336", "Unicode hex": "1F550" }, { "Typeface name": "Wingdings", "Dingbat dec": "184", "Dingbat hex": "B8", "Unicode dec": "128337", "Unicode hex": "1F551" }, { "Typeface name": "Wingdings", "Dingbat dec": "185", "Dingbat hex": "B9", "Unicode dec": "128338", "Unicode hex": "1F552" }, { "Typeface name": "Wingdings", "Dingbat dec": "186", "Dingbat hex": "BA", "Unicode dec": "128339", "Unicode hex": "1F553" }, { "Typeface name": "Wingdings", "Dingbat dec": "187", "Dingbat hex": "BB", "Unicode dec": "128340", "Unicode hex": "1F554" }, { "Typeface name": "Wingdings", "Dingbat dec": "188", "Dingbat hex": "BC", "Unicode dec": "128341", "Unicode hex": "1F555" }, { "Typeface name": "Wingdings", "Dingbat dec": "189", "Dingbat hex": "BD", "Unicode dec": "128342", "Unicode hex": "1F556" }, { "Typeface name": "Wingdings", "Dingbat dec": "190", "Dingbat hex": "BE", "Unicode dec": "128343", "Unicode hex": "1F557" }, { "Typeface name": "Wingdings", "Dingbat dec": "191", "Dingbat hex": "BF", "Unicode dec": "128344", "Unicode hex": "1F558" }, { "Typeface name": "Wingdings", "Dingbat dec": "192", "Dingbat hex": "C0", "Unicode dec": "128345", "Unicode hex": "1F559" }, { "Typeface name": "Wingdings", "Dingbat dec": "193", "Dingbat hex": "C1", "Unicode dec": "128346", "Unicode hex": "1F55A" }, { "Typeface name": "Wingdings", "Dingbat dec": "194", "Dingbat hex": "C2", "Unicode dec": "128347", "Unicode hex": "1F55B" }, { "Typeface name": "Wingdings", "Dingbat dec": "195", "Dingbat hex": "C3", "Unicode dec": "11184", "Unicode hex": "2BB0" }, { "Typeface name": "Wingdings", "Dingbat dec": "196", "Dingbat hex": "C4", "Unicode dec": "11185", "Unicode hex": "2BB1" }, { "Typeface name": "Wingdings", "Dingbat dec": "197", "Dingbat hex": "C5", "Unicode dec": "11186", "Unicode hex": "2BB2" }, { "Typeface name": "Wingdings", "Dingbat dec": "198", "Dingbat hex": "C6", "Unicode dec": "11187", "Unicode hex": "2BB3" }, { "Typeface name": "Wingdings", "Dingbat dec": "199", "Dingbat hex": "C7", "Unicode dec": "11188", "Unicode hex": "2BB4" }, { "Typeface name": "Wingdings", "Dingbat dec": "200", "Dingbat hex": "C8", "Unicode dec": "11189", "Unicode hex": "2BB5" }, { "Typeface name": "Wingdings", "Dingbat dec": "201", "Dingbat hex": "C9", "Unicode dec": "11190", "Unicode hex": "2BB6" }, { "Typeface name": "Wingdings", "Dingbat dec": "202", "Dingbat hex": "CA", "Unicode dec": "11191", "Unicode hex": "2BB7" }, { "Typeface name": "Wingdings", "Dingbat dec": "203", "Dingbat hex": "CB", "Unicode dec": "128618", "Unicode hex": "1F66A" }, { "Typeface name": "Wingdings", "Dingbat dec": "204", "Dingbat hex": "CC", "Unicode dec": "128619", "Unicode hex": "1F66B" }, { "Typeface name": "Wingdings", "Dingbat dec": "205", "Dingbat hex": "CD", "Unicode dec": "128597", "Unicode hex": "1F655" }, { "Typeface name": "Wingdings", "Dingbat dec": "206", "Dingbat hex": "CE", "Unicode dec": "128596", "Unicode hex": "1F654" }, { "Typeface name": "Wingdings", "Dingbat dec": "207", "Dingbat hex": "CF", "Unicode dec": "128599", "Unicode hex": "1F657" }, { "Typeface name": "Wingdings", "Dingbat dec": "208", "Dingbat hex": "D0", "Unicode dec": "128598", "Unicode hex": "1F656" }, { "Typeface name": "Wingdings", "Dingbat dec": "209", "Dingbat hex": "D1", "Unicode dec": "128592", "Unicode hex": "1F650" }, { "Typeface name": "Wingdings", "Dingbat dec": "210", "Dingbat hex": "D2", "Unicode dec": "128593", "Unicode hex": "1F651" }, { "Typeface name": "Wingdings", "Dingbat dec": "211", "Dingbat hex": "D3", "Unicode dec": "128594", "Unicode hex": "1F652" }, { "Typeface name": "Wingdings", "Dingbat dec": "212", "Dingbat hex": "D4", "Unicode dec": "128595", "Unicode hex": "1F653" }, { "Typeface name": "Wingdings", "Dingbat dec": "213", "Dingbat hex": "D5", "Unicode dec": "9003", "Unicode hex": "232B" }, { "Typeface name": "Wingdings", "Dingbat dec": "214", "Dingbat hex": "D6", "Unicode dec": "8998", "Unicode hex": "2326" }, { "Typeface name": "Wingdings", "Dingbat dec": "215", "Dingbat hex": "D7", "Unicode dec": "11160", "Unicode hex": "2B98" }, { "Typeface name": "Wingdings", "Dingbat dec": "216", "Dingbat hex": "D8", "Unicode dec": "11162", "Unicode hex": "2B9A" }, { "Typeface name": "Wingdings", "Dingbat dec": "217", "Dingbat hex": "D9", "Unicode dec": "11161", "Unicode hex": "2B99" }, { "Typeface name": "Wingdings", "Dingbat dec": "218", "Dingbat hex": "DA", "Unicode dec": "11163", "Unicode hex": "2B9B" }, { "Typeface name": "Wingdings", "Dingbat dec": "219", "Dingbat hex": "DB", "Unicode dec": "11144", "Unicode hex": "2B88" }, { "Typeface name": "Wingdings", "Dingbat dec": "220", "Dingbat hex": "DC", "Unicode dec": "11146", "Unicode hex": "2B8A" }, { "Typeface name": "Wingdings", "Dingbat dec": "221", "Dingbat hex": "DD", "Unicode dec": "11145", "Unicode hex": "2B89" }, { "Typeface name": "Wingdings", "Dingbat dec": "222", "Dingbat hex": "DE", "Unicode dec": "11147", "Unicode hex": "2B8B" }, { "Typeface name": "Wingdings", "Dingbat dec": "223", "Dingbat hex": "DF", "Unicode dec": "129128", "Unicode hex": "1F868" }, { "Typeface name": "Wingdings", "Dingbat dec": "224", "Dingbat hex": "E0", "Unicode dec": "129130", "Unicode hex": "1F86A" }, { "Typeface name": "Wingdings", "Dingbat dec": "225", "Dingbat hex": "E1", "Unicode dec": "129129", "Unicode hex": "1F869" }, { "Typeface name": "Wingdings", "Dingbat dec": "226", "Dingbat hex": "E2", "Unicode dec": "129131", "Unicode hex": "1F86B" }, { "Typeface name": "Wingdings", "Dingbat dec": "227", "Dingbat hex": "E3", "Unicode dec": "129132", "Unicode hex": "1F86C" }, { "Typeface name": "Wingdings", "Dingbat dec": "228", "Dingbat hex": "E4", "Unicode dec": "129133", "Unicode hex": "1F86D" }, { "Typeface name": "Wingdings", "Dingbat dec": "229", "Dingbat hex": "E5", "Unicode dec": "129135", "Unicode hex": "1F86F" }, { "Typeface name": "Wingdings", "Dingbat dec": "230", "Dingbat hex": "E6", "Unicode dec": "129134", "Unicode hex": "1F86E" }, { "Typeface name": "Wingdings", "Dingbat dec": "231", "Dingbat hex": "E7", "Unicode dec": "129144", "Unicode hex": "1F878" }, { "Typeface name": "Wingdings", "Dingbat dec": "232", "Dingbat hex": "E8", "Unicode dec": "129146", "Unicode hex": "1F87A" }, { "Typeface name": "Wingdings", "Dingbat dec": "233", "Dingbat hex": "E9", "Unicode dec": "129145", "Unicode hex": "1F879" }, { "Typeface name": "Wingdings", "Dingbat dec": "234", "Dingbat hex": "EA", "Unicode dec": "129147", "Unicode hex": "1F87B" }, { "Typeface name": "Wingdings", "Dingbat dec": "235", "Dingbat hex": "EB", "Unicode dec": "129148", "Unicode hex": "1F87C" }, { "Typeface name": "Wingdings", "Dingbat dec": "236", "Dingbat hex": "EC", "Unicode dec": "129149", "Unicode hex": "1F87D" }, { "Typeface name": "Wingdings", "Dingbat dec": "237", "Dingbat hex": "ED", "Unicode dec": "129151", "Unicode hex": "1F87F" }, { "Typeface name": "Wingdings", "Dingbat dec": "238", "Dingbat hex": "EE", "Unicode dec": "129150", "Unicode hex": "1F87E" }, { "Typeface name": "Wingdings", "Dingbat dec": "239", "Dingbat hex": "EF", "Unicode dec": "8678", "Unicode hex": "21E6" }, { "Typeface name": "Wingdings", "Dingbat dec": "240", "Dingbat hex": "F0", "Unicode dec": "8680", "Unicode hex": "21E8" }, { "Typeface name": "Wingdings", "Dingbat dec": "241", "Dingbat hex": "F1", "Unicode dec": "8679", "Unicode hex": "21E7" }, { "Typeface name": "Wingdings", "Dingbat dec": "242", "Dingbat hex": "F2", "Unicode dec": "8681", "Unicode hex": "21E9" }, { "Typeface name": "Wingdings", "Dingbat dec": "243", "Dingbat hex": "F3", "Unicode dec": "11012", "Unicode hex": "2B04" }, { "Typeface name": "Wingdings", "Dingbat dec": "244", "Dingbat hex": "F4", "Unicode dec": "8691", "Unicode hex": "21F3" }, { "Typeface name": "Wingdings", "Dingbat dec": "245", "Dingbat hex": "F5", "Unicode dec": "11009", "Unicode hex": "2B01" }, { "Typeface name": "Wingdings", "Dingbat dec": "246", "Dingbat hex": "F6", "Unicode dec": "11008", "Unicode hex": "2B00" }, { "Typeface name": "Wingdings", "Dingbat dec": "247", "Dingbat hex": "F7", "Unicode dec": "11011", "Unicode hex": "2B03" }, { "Typeface name": "Wingdings", "Dingbat dec": "248", "Dingbat hex": "F8", "Unicode dec": "11010", "Unicode hex": "2B02" }, { "Typeface name": "Wingdings", "Dingbat dec": "249", "Dingbat hex": "F9", "Unicode dec": "129196", "Unicode hex": "1F8AC" }, { "Typeface name": "Wingdings", "Dingbat dec": "250", "Dingbat hex": "FA", "Unicode dec": "129197", "Unicode hex": "1F8AD" }, { "Typeface name": "Wingdings", "Dingbat dec": "251", "Dingbat hex": "FB", "Unicode dec": "128502", "Unicode hex": "1F5F6" }, { "Typeface name": "Wingdings", "Dingbat dec": "252", "Dingbat hex": "FC", "Unicode dec": "10003", "Unicode hex": "2713" }, { "Typeface name": "Wingdings", "Dingbat dec": "253", "Dingbat hex": "FD", "Unicode dec": "128503", "Unicode hex": "1F5F7" }, { "Typeface name": "Wingdings", "Dingbat dec": "254", "Dingbat hex": "FE", "Unicode dec": "128505", "Unicode hex": "1F5F9" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "32", "Dingbat hex": "20", "Unicode dec": "32", "Unicode hex": "20" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "33", "Dingbat hex": "21", "Unicode dec": "128394", "Unicode hex": "1F58A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "34", "Dingbat hex": "22", "Unicode dec": "128395", "Unicode hex": "1F58B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "35", "Dingbat hex": "23", "Unicode dec": "128396", "Unicode hex": "1F58C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "36", "Dingbat hex": "24", "Unicode dec": "128397", "Unicode hex": "1F58D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "37", "Dingbat hex": "25", "Unicode dec": "9988", "Unicode hex": "2704" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "38", "Dingbat hex": "26", "Unicode dec": "9984", "Unicode hex": "2700" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "39", "Dingbat hex": "27", "Unicode dec": "128382", "Unicode hex": "1F57E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "40", "Dingbat hex": "28", "Unicode dec": "128381", "Unicode hex": "1F57D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "41", "Dingbat hex": "29", "Unicode dec": "128453", "Unicode hex": "1F5C5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "42", "Dingbat hex": "2A", "Unicode dec": "128454", "Unicode hex": "1F5C6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "43", "Dingbat hex": "2B", "Unicode dec": "128455", "Unicode hex": "1F5C7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "44", "Dingbat hex": "2C", "Unicode dec": "128456", "Unicode hex": "1F5C8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "45", "Dingbat hex": "2D", "Unicode dec": "128457", "Unicode hex": "1F5C9" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "46", "Dingbat hex": "2E", "Unicode dec": "128458", "Unicode hex": "1F5CA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "47", "Dingbat hex": "2F", "Unicode dec": "128459", "Unicode hex": "1F5CB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "48", "Dingbat hex": "30", "Unicode dec": "128460", "Unicode hex": "1F5CC" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "49", "Dingbat hex": "31", "Unicode dec": "128461", "Unicode hex": "1F5CD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "50", "Dingbat hex": "32", "Unicode dec": "128203", "Unicode hex": "1F4CB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "51", "Dingbat hex": "33", "Unicode dec": "128465", "Unicode hex": "1F5D1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "52", "Dingbat hex": "34", "Unicode dec": "128468", "Unicode hex": "1F5D4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "53", "Dingbat hex": "35", "Unicode dec": "128437", "Unicode hex": "1F5B5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "54", "Dingbat hex": "36", "Unicode dec": "128438", "Unicode hex": "1F5B6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "55", "Dingbat hex": "37", "Unicode dec": "128439", "Unicode hex": "1F5B7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "56", "Dingbat hex": "38", "Unicode dec": "128440", "Unicode hex": "1F5B8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "57", "Dingbat hex": "39", "Unicode dec": "128429", "Unicode hex": "1F5AD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "58", "Dingbat hex": "3A", "Unicode dec": "128431", "Unicode hex": "1F5AF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "59", "Dingbat hex": "3B", "Unicode dec": "128433", "Unicode hex": "1F5B1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "60", "Dingbat hex": "3C", "Unicode dec": "128402", "Unicode hex": "1F592" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "61", "Dingbat hex": "3D", "Unicode dec": "128403", "Unicode hex": "1F593" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "62", "Dingbat hex": "3E", "Unicode dec": "128408", "Unicode hex": "1F598" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "63", "Dingbat hex": "3F", "Unicode dec": "128409", "Unicode hex": "1F599" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "64", "Dingbat hex": "40", "Unicode dec": "128410", "Unicode hex": "1F59A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "65", "Dingbat hex": "41", "Unicode dec": "128411", "Unicode hex": "1F59B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "66", "Dingbat hex": "42", "Unicode dec": "128072", "Unicode hex": "1F448" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "67", "Dingbat hex": "43", "Unicode dec": "128073", "Unicode hex": "1F449" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "68", "Dingbat hex": "44", "Unicode dec": "128412", "Unicode hex": "1F59C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "69", "Dingbat hex": "45", "Unicode dec": "128413", "Unicode hex": "1F59D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "70", "Dingbat hex": "46", "Unicode dec": "128414", "Unicode hex": "1F59E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "71", "Dingbat hex": "47", "Unicode dec": "128415", "Unicode hex": "1F59F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "72", "Dingbat hex": "48", "Unicode dec": "128416", "Unicode hex": "1F5A0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "73", "Dingbat hex": "49", "Unicode dec": "128417", "Unicode hex": "1F5A1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "74", "Dingbat hex": "4A", "Unicode dec": "128070", "Unicode hex": "1F446" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "75", "Dingbat hex": "4B", "Unicode dec": "128071", "Unicode hex": "1F447" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "76", "Dingbat hex": "4C", "Unicode dec": "128418", "Unicode hex": "1F5A2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "77", "Dingbat hex": "4D", "Unicode dec": "128419", "Unicode hex": "1F5A3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "78", "Dingbat hex": "4E", "Unicode dec": "128401", "Unicode hex": "1F591" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "79", "Dingbat hex": "4F", "Unicode dec": "128500", "Unicode hex": "1F5F4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "80", "Dingbat hex": "50", "Unicode dec": "128504", "Unicode hex": "1F5F8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "81", "Dingbat hex": "51", "Unicode dec": "128501", "Unicode hex": "1F5F5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "82", "Dingbat hex": "52", "Unicode dec": "9745", "Unicode hex": "2611" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "83", "Dingbat hex": "53", "Unicode dec": "11197", "Unicode hex": "2BBD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "84", "Dingbat hex": "54", "Unicode dec": "9746", "Unicode hex": "2612" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "85", "Dingbat hex": "55", "Unicode dec": "11198", "Unicode hex": "2BBE" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "86", "Dingbat hex": "56", "Unicode dec": "11199", "Unicode hex": "2BBF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "87", "Dingbat hex": "57", "Unicode dec": "128711", "Unicode hex": "1F6C7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "88", "Dingbat hex": "58", "Unicode dec": "10680", "Unicode hex": "29B8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "89", "Dingbat hex": "59", "Unicode dec": "128625", "Unicode hex": "1F671" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "90", "Dingbat hex": "5A", "Unicode dec": "128628", "Unicode hex": "1F674" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "91", "Dingbat hex": "5B", "Unicode dec": "128626", "Unicode hex": "1F672" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "92", "Dingbat hex": "5C", "Unicode dec": "128627", "Unicode hex": "1F673" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "93", "Dingbat hex": "5D", "Unicode dec": "8253", "Unicode hex": "203D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "94", "Dingbat hex": "5E", "Unicode dec": "128633", "Unicode hex": "1F679" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "95", "Dingbat hex": "5F", "Unicode dec": "128634", "Unicode hex": "1F67A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "96", "Dingbat hex": "60", "Unicode dec": "128635", "Unicode hex": "1F67B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "97", "Dingbat hex": "61", "Unicode dec": "128614", "Unicode hex": "1F666" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "98", "Dingbat hex": "62", "Unicode dec": "128612", "Unicode hex": "1F664" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "99", "Dingbat hex": "63", "Unicode dec": "128613", "Unicode hex": "1F665" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "100", "Dingbat hex": "64", "Unicode dec": "128615", "Unicode hex": "1F667" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "101", "Dingbat hex": "65", "Unicode dec": "128602", "Unicode hex": "1F65A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "102", "Dingbat hex": "66", "Unicode dec": "128600", "Unicode hex": "1F658" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "103", "Dingbat hex": "67", "Unicode dec": "128601", "Unicode hex": "1F659" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "104", "Dingbat hex": "68", "Unicode dec": "128603", "Unicode hex": "1F65B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "105", "Dingbat hex": "69", "Unicode dec": "9450", "Unicode hex": "24EA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "106", "Dingbat hex": "6A", "Unicode dec": "9312", "Unicode hex": "2460" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "107", "Dingbat hex": "6B", "Unicode dec": "9313", "Unicode hex": "2461" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "108", "Dingbat hex": "6C", "Unicode dec": "9314", "Unicode hex": "2462" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "109", "Dingbat hex": "6D", "Unicode dec": "9315", "Unicode hex": "2463" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "110", "Dingbat hex": "6E", "Unicode dec": "9316", "Unicode hex": "2464" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "111", "Dingbat hex": "6F", "Unicode dec": "9317", "Unicode hex": "2465" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "112", "Dingbat hex": "70", "Unicode dec": "9318", "Unicode hex": "2466" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "113", "Dingbat hex": "71", "Unicode dec": "9319", "Unicode hex": "2467" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "114", "Dingbat hex": "72", "Unicode dec": "9320", "Unicode hex": "2468" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "115", "Dingbat hex": "73", "Unicode dec": "9321", "Unicode hex": "2469" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "116", "Dingbat hex": "74", "Unicode dec": "9471", "Unicode hex": "24FF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "117", "Dingbat hex": "75", "Unicode dec": "10102", "Unicode hex": "2776" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "118", "Dingbat hex": "76", "Unicode dec": "10103", "Unicode hex": "2777" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "119", "Dingbat hex": "77", "Unicode dec": "10104", "Unicode hex": "2778" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "120", "Dingbat hex": "78", "Unicode dec": "10105", "Unicode hex": "2779" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "121", "Dingbat hex": "79", "Unicode dec": "10106", "Unicode hex": "277A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "122", "Dingbat hex": "7A", "Unicode dec": "10107", "Unicode hex": "277B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "123", "Dingbat hex": "7B", "Unicode dec": "10108", "Unicode hex": "277C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "124", "Dingbat hex": "7C", "Unicode dec": "10109", "Unicode hex": "277D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "125", "Dingbat hex": "7D", "Unicode dec": "10110", "Unicode hex": "277E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "126", "Dingbat hex": "7E", "Unicode dec": "10111", "Unicode hex": "277F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "128", "Dingbat hex": "80", "Unicode dec": "9737", "Unicode hex": "2609" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "129", "Dingbat hex": "81", "Unicode dec": "127765", "Unicode hex": "1F315" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "130", "Dingbat hex": "82", "Unicode dec": "9789", "Unicode hex": "263D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "131", "Dingbat hex": "83", "Unicode dec": "9790", "Unicode hex": "263E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "132", "Dingbat hex": "84", "Unicode dec": "11839", "Unicode hex": "2E3F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "133", "Dingbat hex": "85", "Unicode dec": "10013", "Unicode hex": "271D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "134", "Dingbat hex": "86", "Unicode dec": "128327", "Unicode hex": "1F547" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "135", "Dingbat hex": "87", "Unicode dec": "128348", "Unicode hex": "1F55C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "136", "Dingbat hex": "88", "Unicode dec": "128349", "Unicode hex": "1F55D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "137", "Dingbat hex": "89", "Unicode dec": "128350", "Unicode hex": "1F55E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "138", "Dingbat hex": "8A", "Unicode dec": "128351", "Unicode hex": "1F55F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "139", "Dingbat hex": "8B", "Unicode dec": "128352", "Unicode hex": "1F560" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "140", "Dingbat hex": "8C", "Unicode dec": "128353", "Unicode hex": "1F561" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "141", "Dingbat hex": "8D", "Unicode dec": "128354", "Unicode hex": "1F562" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "142", "Dingbat hex": "8E", "Unicode dec": "128355", "Unicode hex": "1F563" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "143", "Dingbat hex": "8F", "Unicode dec": "128356", "Unicode hex": "1F564" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "144", "Dingbat hex": "90", "Unicode dec": "128357", "Unicode hex": "1F565" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "145", "Dingbat hex": "91", "Unicode dec": "128358", "Unicode hex": "1F566" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "146", "Dingbat hex": "92", "Unicode dec": "128359", "Unicode hex": "1F567" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "147", "Dingbat hex": "93", "Unicode dec": "128616", "Unicode hex": "1F668" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "148", "Dingbat hex": "94", "Unicode dec": "128617", "Unicode hex": "1F669" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "149", "Dingbat hex": "95", "Unicode dec": "8901", "Unicode hex": "22C5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "150", "Dingbat hex": "96", "Unicode dec": "128900", "Unicode hex": "1F784" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "151", "Dingbat hex": "97", "Unicode dec": "10625", "Unicode hex": "2981" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "152", "Dingbat hex": "98", "Unicode dec": "9679", "Unicode hex": "25CF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "153", "Dingbat hex": "99", "Unicode dec": "9675", "Unicode hex": "25CB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "154", "Dingbat hex": "9A", "Unicode dec": "128901", "Unicode hex": "1F785" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "155", "Dingbat hex": "9B", "Unicode dec": "128903", "Unicode hex": "1F787" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "156", "Dingbat hex": "9C", "Unicode dec": "128905", "Unicode hex": "1F789" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "157", "Dingbat hex": "9D", "Unicode dec": "8857", "Unicode hex": "2299" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "158", "Dingbat hex": "9E", "Unicode dec": "10687", "Unicode hex": "29BF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "159", "Dingbat hex": "9F", "Unicode dec": "128908", "Unicode hex": "1F78C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "160", "Dingbat hex": "A0", "Unicode dec": "128909", "Unicode hex": "1F78D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "161", "Dingbat hex": "A1", "Unicode dec": "9726", "Unicode hex": "25FE" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "162", "Dingbat hex": "A2", "Unicode dec": "9632", "Unicode hex": "25A0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "163", "Dingbat hex": "A3", "Unicode dec": "9633", "Unicode hex": "25A1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "164", "Dingbat hex": "A4", "Unicode dec": "128913", "Unicode hex": "1F791" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "165", "Dingbat hex": "A5", "Unicode dec": "128914", "Unicode hex": "1F792" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "166", "Dingbat hex": "A6", "Unicode dec": "128915", "Unicode hex": "1F793" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "167", "Dingbat hex": "A7", "Unicode dec": "128916", "Unicode hex": "1F794" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "168", "Dingbat hex": "A8", "Unicode dec": "9635", "Unicode hex": "25A3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "169", "Dingbat hex": "A9", "Unicode dec": "128917", "Unicode hex": "1F795" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "170", "Dingbat hex": "AA", "Unicode dec": "128918", "Unicode hex": "1F796" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "171", "Dingbat hex": "AB", "Unicode dec": "128919", "Unicode hex": "1F797" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "172", "Dingbat hex": "AC", "Unicode dec": "128920", "Unicode hex": "1F798" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "173", "Dingbat hex": "AD", "Unicode dec": "11049", "Unicode hex": "2B29" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "174", "Dingbat hex": "AE", "Unicode dec": "11045", "Unicode hex": "2B25" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "175", "Dingbat hex": "AF", "Unicode dec": "9671", "Unicode hex": "25C7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "176", "Dingbat hex": "B0", "Unicode dec": "128922", "Unicode hex": "1F79A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "177", "Dingbat hex": "B1", "Unicode dec": "9672", "Unicode hex": "25C8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "178", "Dingbat hex": "B2", "Unicode dec": "128923", "Unicode hex": "1F79B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "179", "Dingbat hex": "B3", "Unicode dec": "128924", "Unicode hex": "1F79C" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "180", "Dingbat hex": "B4", "Unicode dec": "128925", "Unicode hex": "1F79D" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "181", "Dingbat hex": "B5", "Unicode dec": "128926", "Unicode hex": "1F79E" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "182", "Dingbat hex": "B6", "Unicode dec": "11050", "Unicode hex": "2B2A" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "183", "Dingbat hex": "B7", "Unicode dec": "11047", "Unicode hex": "2B27" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "184", "Dingbat hex": "B8", "Unicode dec": "9674", "Unicode hex": "25CA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "185", "Dingbat hex": "B9", "Unicode dec": "128928", "Unicode hex": "1F7A0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "186", "Dingbat hex": "BA", "Unicode dec": "9686", "Unicode hex": "25D6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "187", "Dingbat hex": "BB", "Unicode dec": "9687", "Unicode hex": "25D7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "188", "Dingbat hex": "BC", "Unicode dec": "11210", "Unicode hex": "2BCA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "189", "Dingbat hex": "BD", "Unicode dec": "11211", "Unicode hex": "2BCB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "190", "Dingbat hex": "BE", "Unicode dec": "11200", "Unicode hex": "2BC0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "191", "Dingbat hex": "BF", "Unicode dec": "11201", "Unicode hex": "2BC1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "192", "Dingbat hex": "C0", "Unicode dec": "11039", "Unicode hex": "2B1F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "193", "Dingbat hex": "C1", "Unicode dec": "11202", "Unicode hex": "2BC2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "194", "Dingbat hex": "C2", "Unicode dec": "11043", "Unicode hex": "2B23" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "195", "Dingbat hex": "C3", "Unicode dec": "11042", "Unicode hex": "2B22" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "196", "Dingbat hex": "C4", "Unicode dec": "11203", "Unicode hex": "2BC3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "197", "Dingbat hex": "C5", "Unicode dec": "11204", "Unicode hex": "2BC4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "198", "Dingbat hex": "C6", "Unicode dec": "128929", "Unicode hex": "1F7A1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "199", "Dingbat hex": "C7", "Unicode dec": "128930", "Unicode hex": "1F7A2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "200", "Dingbat hex": "C8", "Unicode dec": "128931", "Unicode hex": "1F7A3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "201", "Dingbat hex": "C9", "Unicode dec": "128932", "Unicode hex": "1F7A4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "202", "Dingbat hex": "CA", "Unicode dec": "128933", "Unicode hex": "1F7A5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "203", "Dingbat hex": "CB", "Unicode dec": "128934", "Unicode hex": "1F7A6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "204", "Dingbat hex": "CC", "Unicode dec": "128935", "Unicode hex": "1F7A7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "205", "Dingbat hex": "CD", "Unicode dec": "128936", "Unicode hex": "1F7A8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "206", "Dingbat hex": "CE", "Unicode dec": "128937", "Unicode hex": "1F7A9" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "207", "Dingbat hex": "CF", "Unicode dec": "128938", "Unicode hex": "1F7AA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "208", "Dingbat hex": "D0", "Unicode dec": "128939", "Unicode hex": "1F7AB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "209", "Dingbat hex": "D1", "Unicode dec": "128940", "Unicode hex": "1F7AC" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "210", "Dingbat hex": "D2", "Unicode dec": "128941", "Unicode hex": "1F7AD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "211", "Dingbat hex": "D3", "Unicode dec": "128942", "Unicode hex": "1F7AE" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "212", "Dingbat hex": "D4", "Unicode dec": "128943", "Unicode hex": "1F7AF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "213", "Dingbat hex": "D5", "Unicode dec": "128944", "Unicode hex": "1F7B0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "214", "Dingbat hex": "D6", "Unicode dec": "128945", "Unicode hex": "1F7B1" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "215", "Dingbat hex": "D7", "Unicode dec": "128946", "Unicode hex": "1F7B2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "216", "Dingbat hex": "D8", "Unicode dec": "128947", "Unicode hex": "1F7B3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "217", "Dingbat hex": "D9", "Unicode dec": "128948", "Unicode hex": "1F7B4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "218", "Dingbat hex": "DA", "Unicode dec": "128949", "Unicode hex": "1F7B5" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "219", "Dingbat hex": "DB", "Unicode dec": "128950", "Unicode hex": "1F7B6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "220", "Dingbat hex": "DC", "Unicode dec": "128951", "Unicode hex": "1F7B7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "221", "Dingbat hex": "DD", "Unicode dec": "128952", "Unicode hex": "1F7B8" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "222", "Dingbat hex": "DE", "Unicode dec": "128953", "Unicode hex": "1F7B9" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "223", "Dingbat hex": "DF", "Unicode dec": "128954", "Unicode hex": "1F7BA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "224", "Dingbat hex": "E0", "Unicode dec": "128955", "Unicode hex": "1F7BB" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "225", "Dingbat hex": "E1", "Unicode dec": "128956", "Unicode hex": "1F7BC" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "226", "Dingbat hex": "E2", "Unicode dec": "128957", "Unicode hex": "1F7BD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "227", "Dingbat hex": "E3", "Unicode dec": "128958", "Unicode hex": "1F7BE" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "228", "Dingbat hex": "E4", "Unicode dec": "128959", "Unicode hex": "1F7BF" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "229", "Dingbat hex": "E5", "Unicode dec": "128960", "Unicode hex": "1F7C0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "230", "Dingbat hex": "E6", "Unicode dec": "128962", "Unicode hex": "1F7C2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "231", "Dingbat hex": "E7", "Unicode dec": "128964", "Unicode hex": "1F7C4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "232", "Dingbat hex": "E8", "Unicode dec": "128966", "Unicode hex": "1F7C6" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "233", "Dingbat hex": "E9", "Unicode dec": "128969", "Unicode hex": "1F7C9" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "234", "Dingbat hex": "EA", "Unicode dec": "128970", "Unicode hex": "1F7CA" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "235", "Dingbat hex": "EB", "Unicode dec": "10038", "Unicode hex": "2736" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "236", "Dingbat hex": "EC", "Unicode dec": "128972", "Unicode hex": "1F7CC" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "237", "Dingbat hex": "ED", "Unicode dec": "128974", "Unicode hex": "1F7CE" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "238", "Dingbat hex": "EE", "Unicode dec": "128976", "Unicode hex": "1F7D0" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "239", "Dingbat hex": "EF", "Unicode dec": "128978", "Unicode hex": "1F7D2" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "240", "Dingbat hex": "F0", "Unicode dec": "10041", "Unicode hex": "2739" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "241", "Dingbat hex": "F1", "Unicode dec": "128963", "Unicode hex": "1F7C3" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "242", "Dingbat hex": "F2", "Unicode dec": "128967", "Unicode hex": "1F7C7" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "243", "Dingbat hex": "F3", "Unicode dec": "10031", "Unicode hex": "272F" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "244", "Dingbat hex": "F4", "Unicode dec": "128973", "Unicode hex": "1F7CD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "245", "Dingbat hex": "F5", "Unicode dec": "128980", "Unicode hex": "1F7D4" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "246", "Dingbat hex": "F6", "Unicode dec": "11212", "Unicode hex": "2BCC" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "247", "Dingbat hex": "F7", "Unicode dec": "11213", "Unicode hex": "2BCD" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "248", "Dingbat hex": "F8", "Unicode dec": "8251", "Unicode hex": "203B" }, { "Typeface name": "Wingdings 2", "Dingbat dec": "249", "Dingbat hex": "F9", "Unicode dec": "8258", "Unicode hex": "2042" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "32", "Dingbat hex": "20", "Unicode dec": "32", "Unicode hex": "20" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "33", "Dingbat hex": "21", "Unicode dec": "11104", "Unicode hex": "2B60" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "34", "Dingbat hex": "22", "Unicode dec": "11106", "Unicode hex": "2B62" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "35", "Dingbat hex": "23", "Unicode dec": "11105", "Unicode hex": "2B61" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "36", "Dingbat hex": "24", "Unicode dec": "11107", "Unicode hex": "2B63" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "37", "Dingbat hex": "25", "Unicode dec": "11110", "Unicode hex": "2B66" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "38", "Dingbat hex": "26", "Unicode dec": "11111", "Unicode hex": "2B67" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "39", "Dingbat hex": "27", "Unicode dec": "11113", "Unicode hex": "2B69" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "40", "Dingbat hex": "28", "Unicode dec": "11112", "Unicode hex": "2B68" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "41", "Dingbat hex": "29", "Unicode dec": "11120", "Unicode hex": "2B70" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "42", "Dingbat hex": "2A", "Unicode dec": "11122", "Unicode hex": "2B72" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "43", "Dingbat hex": "2B", "Unicode dec": "11121", "Unicode hex": "2B71" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "44", "Dingbat hex": "2C", "Unicode dec": "11123", "Unicode hex": "2B73" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "45", "Dingbat hex": "2D", "Unicode dec": "11126", "Unicode hex": "2B76" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "46", "Dingbat hex": "2E", "Unicode dec": "11128", "Unicode hex": "2B78" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "47", "Dingbat hex": "2F", "Unicode dec": "11131", "Unicode hex": "2B7B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "48", "Dingbat hex": "30", "Unicode dec": "11133", "Unicode hex": "2B7D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "49", "Dingbat hex": "31", "Unicode dec": "11108", "Unicode hex": "2B64" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "50", "Dingbat hex": "32", "Unicode dec": "11109", "Unicode hex": "2B65" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "51", "Dingbat hex": "33", "Unicode dec": "11114", "Unicode hex": "2B6A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "52", "Dingbat hex": "34", "Unicode dec": "11116", "Unicode hex": "2B6C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "53", "Dingbat hex": "35", "Unicode dec": "11115", "Unicode hex": "2B6B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "54", "Dingbat hex": "36", "Unicode dec": "11117", "Unicode hex": "2B6D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "55", "Dingbat hex": "37", "Unicode dec": "11085", "Unicode hex": "2B4D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "56", "Dingbat hex": "38", "Unicode dec": "11168", "Unicode hex": "2BA0" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "57", "Dingbat hex": "39", "Unicode dec": "11169", "Unicode hex": "2BA1" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "58", "Dingbat hex": "3A", "Unicode dec": "11170", "Unicode hex": "2BA2" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "59", "Dingbat hex": "3B", "Unicode dec": "11171", "Unicode hex": "2BA3" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "60", "Dingbat hex": "3C", "Unicode dec": "11172", "Unicode hex": "2BA4" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "61", "Dingbat hex": "3D", "Unicode dec": "11173", "Unicode hex": "2BA5" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "62", "Dingbat hex": "3E", "Unicode dec": "11174", "Unicode hex": "2BA6" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "63", "Dingbat hex": "3F", "Unicode dec": "11175", "Unicode hex": "2BA7" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "64", "Dingbat hex": "40", "Unicode dec": "11152", "Unicode hex": "2B90" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "65", "Dingbat hex": "41", "Unicode dec": "11153", "Unicode hex": "2B91" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "66", "Dingbat hex": "42", "Unicode dec": "11154", "Unicode hex": "2B92" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "67", "Dingbat hex": "43", "Unicode dec": "11155", "Unicode hex": "2B93" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "68", "Dingbat hex": "44", "Unicode dec": "11136", "Unicode hex": "2B80" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "69", "Dingbat hex": "45", "Unicode dec": "11139", "Unicode hex": "2B83" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "70", "Dingbat hex": "46", "Unicode dec": "11134", "Unicode hex": "2B7E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "71", "Dingbat hex": "47", "Unicode dec": "11135", "Unicode hex": "2B7F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "72", "Dingbat hex": "48", "Unicode dec": "11140", "Unicode hex": "2B84" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "73", "Dingbat hex": "49", "Unicode dec": "11142", "Unicode hex": "2B86" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "74", "Dingbat hex": "4A", "Unicode dec": "11141", "Unicode hex": "2B85" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "75", "Dingbat hex": "4B", "Unicode dec": "11143", "Unicode hex": "2B87" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "76", "Dingbat hex": "4C", "Unicode dec": "11151", "Unicode hex": "2B8F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "77", "Dingbat hex": "4D", "Unicode dec": "11149", "Unicode hex": "2B8D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "78", "Dingbat hex": "4E", "Unicode dec": "11150", "Unicode hex": "2B8E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "79", "Dingbat hex": "4F", "Unicode dec": "11148", "Unicode hex": "2B8C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "80", "Dingbat hex": "50", "Unicode dec": "11118", "Unicode hex": "2B6E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "81", "Dingbat hex": "51", "Unicode dec": "11119", "Unicode hex": "2B6F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "82", "Dingbat hex": "52", "Unicode dec": "9099", "Unicode hex": "238B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "83", "Dingbat hex": "53", "Unicode dec": "8996", "Unicode hex": "2324" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "84", "Dingbat hex": "54", "Unicode dec": "8963", "Unicode hex": "2303" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "85", "Dingbat hex": "55", "Unicode dec": "8997", "Unicode hex": "2325" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "86", "Dingbat hex": "56", "Unicode dec": "9251", "Unicode hex": "2423" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "87", "Dingbat hex": "57", "Unicode dec": "9085", "Unicode hex": "237D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "88", "Dingbat hex": "58", "Unicode dec": "8682", "Unicode hex": "21EA" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "89", "Dingbat hex": "59", "Unicode dec": "11192", "Unicode hex": "2BB8" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "90", "Dingbat hex": "5A", "Unicode dec": "129184", "Unicode hex": "1F8A0" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "91", "Dingbat hex": "5B", "Unicode dec": "129185", "Unicode hex": "1F8A1" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "92", "Dingbat hex": "5C", "Unicode dec": "129186", "Unicode hex": "1F8A2" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "93", "Dingbat hex": "5D", "Unicode dec": "129187", "Unicode hex": "1F8A3" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "94", "Dingbat hex": "5E", "Unicode dec": "129188", "Unicode hex": "1F8A4" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "95", "Dingbat hex": "5F", "Unicode dec": "129189", "Unicode hex": "1F8A5" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "96", "Dingbat hex": "60", "Unicode dec": "129190", "Unicode hex": "1F8A6" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "97", "Dingbat hex": "61", "Unicode dec": "129191", "Unicode hex": "1F8A7" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "98", "Dingbat hex": "62", "Unicode dec": "129192", "Unicode hex": "1F8A8" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "99", "Dingbat hex": "63", "Unicode dec": "129193", "Unicode hex": "1F8A9" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "100", "Dingbat hex": "64", "Unicode dec": "129194", "Unicode hex": "1F8AA" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "101", "Dingbat hex": "65", "Unicode dec": "129195", "Unicode hex": "1F8AB" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "102", "Dingbat hex": "66", "Unicode dec": "129104", "Unicode hex": "1F850" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "103", "Dingbat hex": "67", "Unicode dec": "129106", "Unicode hex": "1F852" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "104", "Dingbat hex": "68", "Unicode dec": "129105", "Unicode hex": "1F851" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "105", "Dingbat hex": "69", "Unicode dec": "129107", "Unicode hex": "1F853" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "106", "Dingbat hex": "6A", "Unicode dec": "129108", "Unicode hex": "1F854" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "107", "Dingbat hex": "6B", "Unicode dec": "129109", "Unicode hex": "1F855" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "108", "Dingbat hex": "6C", "Unicode dec": "129111", "Unicode hex": "1F857" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "109", "Dingbat hex": "6D", "Unicode dec": "129110", "Unicode hex": "1F856" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "110", "Dingbat hex": "6E", "Unicode dec": "129112", "Unicode hex": "1F858" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "111", "Dingbat hex": "6F", "Unicode dec": "129113", "Unicode hex": "1F859" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "112", "Dingbat hex": "70", "Unicode dec": "9650", "Unicode hex": "25B2" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "113", "Dingbat hex": "71", "Unicode dec": "9660", "Unicode hex": "25BC" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "114", "Dingbat hex": "72", "Unicode dec": "9651", "Unicode hex": "25B3" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "115", "Dingbat hex": "73", "Unicode dec": "9661", "Unicode hex": "25BD" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "116", "Dingbat hex": "74", "Unicode dec": "9664", "Unicode hex": "25C0" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "117", "Dingbat hex": "75", "Unicode dec": "9654", "Unicode hex": "25B6" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "118", "Dingbat hex": "76", "Unicode dec": "9665", "Unicode hex": "25C1" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "119", "Dingbat hex": "77", "Unicode dec": "9655", "Unicode hex": "25B7" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "120", "Dingbat hex": "78", "Unicode dec": "9699", "Unicode hex": "25E3" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "121", "Dingbat hex": "79", "Unicode dec": "9698", "Unicode hex": "25E2" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "122", "Dingbat hex": "7A", "Unicode dec": "9700", "Unicode hex": "25E4" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "123", "Dingbat hex": "7B", "Unicode dec": "9701", "Unicode hex": "25E5" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "124", "Dingbat hex": "7C", "Unicode dec": "128896", "Unicode hex": "1F780" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "125", "Dingbat hex": "7D", "Unicode dec": "128898", "Unicode hex": "1F782" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "126", "Dingbat hex": "7E", "Unicode dec": "128897", "Unicode hex": "1F781" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "128", "Dingbat hex": "80", "Unicode dec": "128899", "Unicode hex": "1F783" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "129", "Dingbat hex": "81", "Unicode dec": "11205", "Unicode hex": "2BC5" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "130", "Dingbat hex": "82", "Unicode dec": "11206", "Unicode hex": "2BC6" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "131", "Dingbat hex": "83", "Unicode dec": "11207", "Unicode hex": "2BC7" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "132", "Dingbat hex": "84", "Unicode dec": "11208", "Unicode hex": "2BC8" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "133", "Dingbat hex": "85", "Unicode dec": "11164", "Unicode hex": "2B9C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "134", "Dingbat hex": "86", "Unicode dec": "11166", "Unicode hex": "2B9E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "135", "Dingbat hex": "87", "Unicode dec": "11165", "Unicode hex": "2B9D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "136", "Dingbat hex": "88", "Unicode dec": "11167", "Unicode hex": "2B9F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "137", "Dingbat hex": "89", "Unicode dec": "129040", "Unicode hex": "1F810" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "138", "Dingbat hex": "8A", "Unicode dec": "129042", "Unicode hex": "1F812" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "139", "Dingbat hex": "8B", "Unicode dec": "129041", "Unicode hex": "1F811" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "140", "Dingbat hex": "8C", "Unicode dec": "129043", "Unicode hex": "1F813" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "141", "Dingbat hex": "8D", "Unicode dec": "129044", "Unicode hex": "1F814" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "142", "Dingbat hex": "8E", "Unicode dec": "129046", "Unicode hex": "1F816" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "143", "Dingbat hex": "8F", "Unicode dec": "129045", "Unicode hex": "1F815" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "144", "Dingbat hex": "90", "Unicode dec": "129047", "Unicode hex": "1F817" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "145", "Dingbat hex": "91", "Unicode dec": "129048", "Unicode hex": "1F818" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "146", "Dingbat hex": "92", "Unicode dec": "129050", "Unicode hex": "1F81A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "147", "Dingbat hex": "93", "Unicode dec": "129049", "Unicode hex": "1F819" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "148", "Dingbat hex": "94", "Unicode dec": "129051", "Unicode hex": "1F81B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "149", "Dingbat hex": "95", "Unicode dec": "129052", "Unicode hex": "1F81C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "150", "Dingbat hex": "96", "Unicode dec": "129054", "Unicode hex": "1F81E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "151", "Dingbat hex": "97", "Unicode dec": "129053", "Unicode hex": "1F81D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "152", "Dingbat hex": "98", "Unicode dec": "129055", "Unicode hex": "1F81F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "153", "Dingbat hex": "99", "Unicode dec": "129024", "Unicode hex": "1F800" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "154", "Dingbat hex": "9A", "Unicode dec": "129026", "Unicode hex": "1F802" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "155", "Dingbat hex": "9B", "Unicode dec": "129025", "Unicode hex": "1F801" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "156", "Dingbat hex": "9C", "Unicode dec": "129027", "Unicode hex": "1F803" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "157", "Dingbat hex": "9D", "Unicode dec": "129028", "Unicode hex": "1F804" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "158", "Dingbat hex": "9E", "Unicode dec": "129030", "Unicode hex": "1F806" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "159", "Dingbat hex": "9F", "Unicode dec": "129029", "Unicode hex": "1F805" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "160", "Dingbat hex": "A0", "Unicode dec": "129031", "Unicode hex": "1F807" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "161", "Dingbat hex": "A1", "Unicode dec": "129032", "Unicode hex": "1F808" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "162", "Dingbat hex": "A2", "Unicode dec": "129034", "Unicode hex": "1F80A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "163", "Dingbat hex": "A3", "Unicode dec": "129033", "Unicode hex": "1F809" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "164", "Dingbat hex": "A4", "Unicode dec": "129035", "Unicode hex": "1F80B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "165", "Dingbat hex": "A5", "Unicode dec": "129056", "Unicode hex": "1F820" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "166", "Dingbat hex": "A6", "Unicode dec": "129058", "Unicode hex": "1F822" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "167", "Dingbat hex": "A7", "Unicode dec": "129060", "Unicode hex": "1F824" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "168", "Dingbat hex": "A8", "Unicode dec": "129062", "Unicode hex": "1F826" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "169", "Dingbat hex": "A9", "Unicode dec": "129064", "Unicode hex": "1F828" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "170", "Dingbat hex": "AA", "Unicode dec": "129066", "Unicode hex": "1F82A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "171", "Dingbat hex": "AB", "Unicode dec": "129068", "Unicode hex": "1F82C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "172", "Dingbat hex": "AC", "Unicode dec": "129180", "Unicode hex": "1F89C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "173", "Dingbat hex": "AD", "Unicode dec": "129181", "Unicode hex": "1F89D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "174", "Dingbat hex": "AE", "Unicode dec": "129182", "Unicode hex": "1F89E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "175", "Dingbat hex": "AF", "Unicode dec": "129183", "Unicode hex": "1F89F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "176", "Dingbat hex": "B0", "Unicode dec": "129070", "Unicode hex": "1F82E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "177", "Dingbat hex": "B1", "Unicode dec": "129072", "Unicode hex": "1F830" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "178", "Dingbat hex": "B2", "Unicode dec": "129074", "Unicode hex": "1F832" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "179", "Dingbat hex": "B3", "Unicode dec": "129076", "Unicode hex": "1F834" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "180", "Dingbat hex": "B4", "Unicode dec": "129078", "Unicode hex": "1F836" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "181", "Dingbat hex": "B5", "Unicode dec": "129080", "Unicode hex": "1F838" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "182", "Dingbat hex": "B6", "Unicode dec": "129082", "Unicode hex": "1F83A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "183", "Dingbat hex": "B7", "Unicode dec": "129081", "Unicode hex": "1F839" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "184", "Dingbat hex": "B8", "Unicode dec": "129083", "Unicode hex": "1F83B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "185", "Dingbat hex": "B9", "Unicode dec": "129176", "Unicode hex": "1F898" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "186", "Dingbat hex": "BA", "Unicode dec": "129178", "Unicode hex": "1F89A" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "187", "Dingbat hex": "BB", "Unicode dec": "129177", "Unicode hex": "1F899" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "188", "Dingbat hex": "BC", "Unicode dec": "129179", "Unicode hex": "1F89B" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "189", "Dingbat hex": "BD", "Unicode dec": "129084", "Unicode hex": "1F83C" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "190", "Dingbat hex": "BE", "Unicode dec": "129086", "Unicode hex": "1F83E" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "191", "Dingbat hex": "BF", "Unicode dec": "129085", "Unicode hex": "1F83D" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "192", "Dingbat hex": "C0", "Unicode dec": "129087", "Unicode hex": "1F83F" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "193", "Dingbat hex": "C1", "Unicode dec": "129088", "Unicode hex": "1F840" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "194", "Dingbat hex": "C2", "Unicode dec": "129090", "Unicode hex": "1F842" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "195", "Dingbat hex": "C3", "Unicode dec": "129089", "Unicode hex": "1F841" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "196", "Dingbat hex": "C4", "Unicode dec": "129091", "Unicode hex": "1F843" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "197", "Dingbat hex": "C5", "Unicode dec": "129092", "Unicode hex": "1F844" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "198", "Dingbat hex": "C6", "Unicode dec": "129094", "Unicode hex": "1F846" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "199", "Dingbat hex": "C7", "Unicode dec": "129093", "Unicode hex": "1F845" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "200", "Dingbat hex": "C8", "Unicode dec": "129095", "Unicode hex": "1F847" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "201", "Dingbat hex": "C9", "Unicode dec": "11176", "Unicode hex": "2BA8" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "202", "Dingbat hex": "CA", "Unicode dec": "11177", "Unicode hex": "2BA9" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "203", "Dingbat hex": "CB", "Unicode dec": "11178", "Unicode hex": "2BAA" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "204", "Dingbat hex": "CC", "Unicode dec": "11179", "Unicode hex": "2BAB" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "205", "Dingbat hex": "CD", "Unicode dec": "11180", "Unicode hex": "2BAC" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "206", "Dingbat hex": "CE", "Unicode dec": "11181", "Unicode hex": "2BAD" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "207", "Dingbat hex": "CF", "Unicode dec": "11182", "Unicode hex": "2BAE" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "208", "Dingbat hex": "D0", "Unicode dec": "11183", "Unicode hex": "2BAF" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "209", "Dingbat hex": "D1", "Unicode dec": "129120", "Unicode hex": "1F860" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "210", "Dingbat hex": "D2", "Unicode dec": "129122", "Unicode hex": "1F862" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "211", "Dingbat hex": "D3", "Unicode dec": "129121", "Unicode hex": "1F861" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "212", "Dingbat hex": "D4", "Unicode dec": "129123", "Unicode hex": "1F863" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "213", "Dingbat hex": "D5", "Unicode dec": "129124", "Unicode hex": "1F864" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "214", "Dingbat hex": "D6", "Unicode dec": "129125", "Unicode hex": "1F865" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "215", "Dingbat hex": "D7", "Unicode dec": "129127", "Unicode hex": "1F867" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "216", "Dingbat hex": "D8", "Unicode dec": "129126", "Unicode hex": "1F866" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "217", "Dingbat hex": "D9", "Unicode dec": "129136", "Unicode hex": "1F870" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "218", "Dingbat hex": "DA", "Unicode dec": "129138", "Unicode hex": "1F872" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "219", "Dingbat hex": "DB", "Unicode dec": "129137", "Unicode hex": "1F871" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "220", "Dingbat hex": "DC", "Unicode dec": "129139", "Unicode hex": "1F873" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "221", "Dingbat hex": "DD", "Unicode dec": "129140", "Unicode hex": "1F874" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "222", "Dingbat hex": "DE", "Unicode dec": "129141", "Unicode hex": "1F875" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "223", "Dingbat hex": "DF", "Unicode dec": "129143", "Unicode hex": "1F877" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "224", "Dingbat hex": "E0", "Unicode dec": "129142", "Unicode hex": "1F876" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "225", "Dingbat hex": "E1", "Unicode dec": "129152", "Unicode hex": "1F880" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "226", "Dingbat hex": "E2", "Unicode dec": "129154", "Unicode hex": "1F882" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "227", "Dingbat hex": "E3", "Unicode dec": "129153", "Unicode hex": "1F881" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "228", "Dingbat hex": "E4", "Unicode dec": "129155", "Unicode hex": "1F883" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "229", "Dingbat hex": "E5", "Unicode dec": "129156", "Unicode hex": "1F884" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "230", "Dingbat hex": "E6", "Unicode dec": "129157", "Unicode hex": "1F885" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "231", "Dingbat hex": "E7", "Unicode dec": "129159", "Unicode hex": "1F887" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "232", "Dingbat hex": "E8", "Unicode dec": "129158", "Unicode hex": "1F886" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "233", "Dingbat hex": "E9", "Unicode dec": "129168", "Unicode hex": "1F890" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "234", "Dingbat hex": "EA", "Unicode dec": "129170", "Unicode hex": "1F892" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "235", "Dingbat hex": "EB", "Unicode dec": "129169", "Unicode hex": "1F891" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "236", "Dingbat hex": "EC", "Unicode dec": "129171", "Unicode hex": "1F893" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "237", "Dingbat hex": "ED", "Unicode dec": "129172", "Unicode hex": "1F894" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "238", "Dingbat hex": "EE", "Unicode dec": "129174", "Unicode hex": "1F896" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "239", "Dingbat hex": "EF", "Unicode dec": "129173", "Unicode hex": "1F895" }, { "Typeface name": "Wingdings 3", "Dingbat dec": "240", "Dingbat hex": "F0", "Unicode dec": "129175", "Unicode hex": "1F897" }];
  return mt.default = e, mt;
}
var $c;
function hl() {
  if ($c) return Ye;
  $c = 1;
  var e = Ye && Ye.__importDefault || function(m) {
    return m && m.__esModule ? m : { default: m };
  };
  Object.defineProperty(Ye, "__esModule", { value: true }), Ye.hex = Ye.dec = Ye.codePoint = void 0;
  for (var n = e(fl()), i = {}, t = String.fromCodePoint ? String.fromCodePoint : f, r = 0, a = n.default; r < a.length; r++) {
    var c = a[r], o = parseInt(c["Unicode dec"], 10), u = { codePoint: o, string: t(o) };
    i[c["Typeface name"].toUpperCase() + "_" + c["Dingbat dec"]] = u;
  }
  function s(m, D) {
    return i[m.toUpperCase() + "_" + D];
  }
  Ye.codePoint = s;
  function h(m, D) {
    return s(m, parseInt(D, 10));
  }
  Ye.dec = h;
  function g(m, D) {
    return s(m, parseInt(D, 16));
  }
  Ye.hex = g;
  function f(m) {
    if (m <= 65535) return String.fromCharCode(m);
    var D = Math.floor((m - 65536) / 1024) + 55296, b = (m - 65536) % 1024 + 56320;
    return String.fromCharCode(D, b);
  }
  return Ye;
}
var sn = {}, Qc;
function ps() {
  if (Qc) return sn;
  Qc = 1;
  var e = Be;
  sn.paragraph = n, sn.run = i, sn._elements = r, sn._elementsOfType = t, sn.getDescendantsOfType = a, sn.getDescendants = c;
  function n(u) {
    return t("paragraph", u);
  }
  function i(u) {
    return t("run", u);
  }
  function t(u, s) {
    return r(function(h) {
      return h.type === u ? s(h) : h;
    });
  }
  function r(u) {
    return function s(h) {
      if (h.children) {
        var g = e.map(h.children, s);
        h = e.extend(h, { children: g });
      }
      return u(h);
    };
  }
  function a(u, s) {
    return c(u).filter(function(h) {
      return h.type === s;
    });
  }
  function c(u) {
    var s = [];
    return o(u, function(h) {
      s.push(h);
    }), s;
  }
  function o(u, s) {
    u.children && u.children.forEach(function(h) {
      o(h, s), s(h);
    });
  }
  return sn;
}
var bt = {}, Yc;
function gl() {
  if (Yc) return bt;
  Yc = 1, bt.uriToZipEntryName = e, bt.replaceFragment = n;
  function e(i, t) {
    return t.charAt(0) === "/" ? t.substr(1) : i + "/" + t;
  }
  function n(i, t) {
    var r = i.indexOf("#");
    return r !== -1 && (i = i.substring(0, r)), i + "#" + t;
  }
  return bt;
}
var Zc;
function pl() {
  if (Zc) return pt;
  Zc = 1, pt.createBodyReader = u, pt._readNumberingProperties = h;
  var e = hl(), n = Be, i = Wn(), t = cn().Result, r = cn().warning, a = ga(), c = ps(), o = gl();
  function u(T) {
    return { readXmlElement: function(x) {
      return new s(T).readXmlElement(x);
    }, readXmlElements: function(x) {
      return new s(T).readXmlElements(x);
    } };
  }
  function s(T) {
    var x = [], _ = [], C = [], E = T.relationships, S = T.contentTypes, X = T.docxFile, A = T.files, R = T.numbering, M = T.styles;
    function H(k) {
      var G = k.map(F);
      return l(G);
    }
    function F(k) {
      if (k.type === "element") {
        var G = ue[k.name];
        if (G) return G(k);
        if (!Object.prototype.hasOwnProperty.call(f, k.name)) {
          var ne = r("An unrecognised element was ignored: " + k.name);
          return m([ne]);
        }
      }
      return D();
    }
    function B(k) {
      return K(k).map(function(G) {
        return { type: "paragraphProperties", styleId: G.styleId, styleName: G.name, alignment: k.firstOrEmpty("w:jc").attributes["w:val"], numbering: h(G.styleId, k.firstOrEmpty("w:numPr"), R), indent: O(k.firstOrEmpty("w:ind")) };
      });
    }
    function O(k) {
      return { start: k.attributes["w:start"] || k.attributes["w:left"], end: k.attributes["w:end"] || k.attributes["w:right"], firstLine: k.attributes["w:firstLine"], hanging: k.attributes["w:hanging"] };
    }
    function P(k) {
      return ie(k).map(function(G) {
        var ne = k.firstOrEmpty("w:sz").attributes["w:val"], oe = /^[0-9]+$/.test(ne) ? parseInt(ne, 10) / 2 : null;
        return { type: "runProperties", styleId: G.styleId, styleName: G.name, verticalAlignment: k.firstOrEmpty("w:vertAlign").attributes["w:val"], font: k.firstOrEmpty("w:rFonts").attributes["w:ascii"], fontSize: oe, isBold: j(k.first("w:b")), isUnderline: z(k.first("w:u")), isItalic: j(k.first("w:i")), isStrikethrough: j(k.first("w:strike")), isAllCaps: j(k.first("w:caps")), isSmallCaps: j(k.first("w:smallCaps")), highlight: I(k.firstOrEmpty("w:highlight").attributes["w:val"]) };
      });
    }
    function z(k) {
      if (k) {
        var G = k.attributes["w:val"];
        return G !== void 0 && G !== "false" && G !== "0" && G !== "none";
      } else return false;
    }
    function j(k) {
      if (k) {
        var G = k.attributes["w:val"];
        return G !== "false" && G !== "0";
      } else return false;
    }
    function te(k) {
      return k !== "false" && k !== "0";
    }
    function I(k) {
      return !k || k === "none" ? null : k;
    }
    function K(k) {
      return ee(k, "w:pStyle", "Paragraph", M.findParagraphStyleById);
    }
    function ie(k) {
      return ee(k, "w:rStyle", "Run", M.findCharacterStyleById);
    }
    function re(k) {
      return ee(k, "w:tblStyle", "Table", M.findTableStyleById);
    }
    function ee(k, G, ne, oe) {
      var pe = [], be = k.first(G), We = null, Me = null;
      if (be && (We = be.attributes["w:val"], We)) {
        var Dn = oe(We);
        Dn ? Me = Dn.name : pe.push(we(ne, We));
      }
      return d({ styleId: We, name: Me }, pe);
    }
    function de(k) {
      var G = k.attributes["w:fldCharType"];
      if (G === "begin") x.push({ type: "begin", fldChar: k }), _ = [];
      else if (G === "end") {
        var ne = x.pop();
        if (ne.type === "begin" && (ne = he(ne)), ne.type === "checkbox") return b(i.checkbox({ checked: ne.checked }));
      } else if (G === "separate") {
        var oe = x.pop(), pe = he(oe);
        x.push(pe);
      }
      return D();
    }
    function De() {
      var k = n.last(x.filter(function(G) {
        return G.type === "hyperlink";
      }));
      return k ? k.options : null;
    }
    function he(k) {
      return ve(_.join(""), k.type === "begin" ? k.fldChar : a.emptyElement);
    }
    function ve(k, G) {
      var ne = /\s*HYPERLINK "(.*)"/.exec(k);
      if (ne) return { type: "hyperlink", options: { href: ne[1] } };
      var oe = /\s*HYPERLINK\s+\\l\s+"(.*)"/.exec(k);
      if (oe) return { type: "hyperlink", options: { anchor: oe[1] } };
      var pe = /\s*FORMCHECKBOX\s*/.exec(k);
      if (pe) {
        var be = G.firstOrEmpty("w:ffData").firstOrEmpty("w:checkBox"), We = be.first("w:checked"), Me = We == null ? j(be.first("w:default")) : j(We);
        return { type: "checkbox", checked: Me };
      }
      return { type: "unknown" };
    }
    function Fe(k) {
      return _.push(k.text()), D();
    }
    function Se(k) {
      var G = k.attributes["w:font"], ne = k.attributes["w:char"], oe = e.hex(G, ne);
      return oe == null && /^F0..$/.test(ne) && (oe = e.hex(G, ne.substring(2))), oe == null ? m([r("A w:sym element with an unsupported character was ignored: char " + ne + " in font " + G)]) : b(new i.Text(oe.string));
    }
    function V(k) {
      return function(G) {
        var ne = G.attributes["w:id"];
        return b(new i.NoteReference({ noteType: k, noteId: ne }));
      };
    }
    function J(k) {
      return b(i.commentReference({ commentId: k.attributes["w:id"] }));
    }
    function Y(k) {
      return H(k.children);
    }
    var ue = { "w:p": function(k) {
      var G = k.firstOrEmpty("w:pPr"), ne = !!G.firstOrEmpty("w:rPr").first("w:del");
      if (ne) return k.children.forEach(function(pe) {
        C.push(pe);
      }), D();
      var oe = k.children;
      return C.length > 0 && (oe = C.concat(oe), C = []), p.map(B(G), H(oe), function(pe, be) {
        return new i.Paragraph(be, pe);
      }).insertExtra();
    }, "w:r": function(k) {
      return p.map(P(k.firstOrEmpty("w:rPr")), H(k.children), function(G, ne) {
        var oe = De();
        return oe !== null && (ne = [new i.Hyperlink(ne, oe)]), new i.Run(ne, G);
      });
    }, "w:fldChar": de, "w:instrText": Fe, "w:t": function(k) {
      return b(new i.Text(k.text()));
    }, "w:tab": function(k) {
      return b(new i.Tab());
    }, "w:noBreakHyphen": function() {
      return b(new i.Text("\u2011"));
    }, "w:softHyphen": function(k) {
      return b(new i.Text("\xAD"));
    }, "w:sym": Se, "w:hyperlink": function(k) {
      var G = k.attributes["r:id"], ne = k.attributes["w:anchor"];
      return H(k.children).map(function(oe) {
        function pe(We) {
          var Me = k.attributes["w:tgtFrame"] || null;
          return new i.Hyperlink(oe, n.extend({ targetFrame: Me }, We));
        }
        if (G) {
          var be = E.findTargetByRelationshipId(G);
          return ne && (be = o.replaceFragment(be, ne)), pe({ href: be });
        } else return ne ? pe({ anchor: ne }) : oe;
      });
    }, "w:tbl": fe, "w:tr": ye, "w:tc": me, "w:footnoteReference": V("footnote"), "w:endnoteReference": V("endnote"), "w:commentReference": J, "w:br": function(k) {
      var G = k.attributes["w:type"];
      return G == null || G === "textWrapping" ? b(i.lineBreak) : G === "page" ? b(i.pageBreak) : G === "column" ? b(i.columnBreak) : m([r("Unsupported break type: " + G)]);
    }, "w:bookmarkStart": function(k) {
      var G = k.attributes["w:name"];
      return G === "_GoBack" ? D() : b(new i.BookmarkStart({ name: G }));
    }, "mc:AlternateContent": function(k) {
      return Y(k.firstOrEmpty("mc:Fallback"));
    }, "w:sdt": function(k) {
      var G = H(k.firstOrEmpty("w:sdtContent").children);
      return G.map(function(ne) {
        var oe = k.firstOrEmpty("w:sdtPr").first("wordml:checkbox");
        if (oe) {
          var pe = oe.first("wordml:checked"), be = !!pe && te(pe.attributes["wordml:val"]), We = i.checkbox({ checked: be }), Me = false, Dn = ne.map(c._elementsOfType(i.types.text, function(v) {
            return v.value.length > 0 && !Me ? (Me = true, We) : v;
          }));
          return Me ? Dn : We;
        } else return ne;
      });
    }, "w:ins": Y, "w:object": Y, "w:smartTag": Y, "w:drawing": Y, "w:pict": function(k) {
      return Y(k).toExtra();
    }, "v:roundrect": Y, "v:shape": Y, "v:textbox": Y, "w:txbxContent": Y, "wp:inline": $, "wp:anchor": $, "v:imagedata": xe, "v:group": Y, "v:rect": Y };
    return { readXmlElement: F, readXmlElements: H };
    function fe(k) {
      var G = ge(k.firstOrEmpty("w:tblPr"));
      return H(k.children).flatMap(N).flatMap(function(ne) {
        return G.map(function(oe) {
          return i.Table(ne, oe);
        });
      });
    }
    function ge(k) {
      return re(k).map(function(G) {
        return { styleId: G.styleId, styleName: G.name };
      });
    }
    function ye(k) {
      var G = k.firstOrEmpty("w:trPr"), ne = !!G.first("w:del");
      if (ne) return D();
      var oe = !!G.first("w:tblHeader");
      return H(k.children).map(function(pe) {
        return i.TableRow(pe, { isHeader: oe });
      });
    }
    function me(k) {
      return H(k.children).map(function(G) {
        var ne = k.firstOrEmpty("w:tcPr"), oe = ne.firstOrEmpty("w:gridSpan").attributes["w:val"], pe = oe ? parseInt(oe, 10) : 1, be = i.TableCell(G, { colSpan: pe });
        return be._vMerge = ce(ne), be;
      });
    }
    function ce(k) {
      var G = k.first("w:vMerge");
      if (G) {
        var ne = G.attributes["w:val"];
        return ne === "continue" || !ne;
      } else return null;
    }
    function N(k) {
      var G = n.any(k, function(pe) {
        return pe.type !== i.types.tableRow;
      });
      if (G) return L(k), d(k, [r("unexpected non-row element in table, cell merging may be incorrect")]);
      var ne = n.any(k, function(pe) {
        return n.any(pe.children, function(be) {
          return be.type !== i.types.tableCell;
        });
      });
      if (ne) return L(k), d(k, [r("unexpected non-cell element in table row, cell merging may be incorrect")]);
      var oe = {};
      return k.forEach(function(pe) {
        var be = 0;
        pe.children.forEach(function(We) {
          We._vMerge && oe[be] ? oe[be].rowSpan++ : (oe[be] = We, We._vMerge = false), be += We.colSpan;
        });
      }), k.forEach(function(pe) {
        pe.children = pe.children.filter(function(be) {
          return !be._vMerge;
        }), pe.children.forEach(function(be) {
          delete be._vMerge;
        });
      }), b(k);
    }
    function L(k) {
      k.forEach(function(G) {
        var ne = c.getDescendantsOfType(G, i.types.tableCell);
        ne.forEach(function(oe) {
          delete oe._vMerge;
        });
      });
    }
    function $(k) {
      var G = k.getElementsByTagName("a:graphic").getElementsByTagName("a:graphicData").getElementsByTagName("pic:pic").getElementsByTagName("pic:blipFill").getElementsByTagName("a:blip");
      return l(G.map(Q.bind(null, k)));
    }
    function Q(k, G) {
      var ne = k.first("wp:docPr").attributes, oe = ae(ne.descr) ? ne.title : ne.descr, pe = Ee(G);
      return pe === null ? m([r("Could not find image file for a:blip element")]) : Ue(pe, oe);
    }
    function ae(k) {
      return k == null || /^\s*$/.test(k);
    }
    function Ee(k) {
      var G = k.attributes["r:embed"], ne = k.attributes["r:link"];
      if (G) return se(G);
      if (ne) {
        var oe = E.findTargetByRelationshipId(ne);
        return { path: oe, read: A.read.bind(A, oe) };
      } else return null;
    }
    function xe(k) {
      var G = k.attributes["r:id"];
      return G ? Ue(se(G), k.attributes["o:title"]) : m([r("A v:imagedata element without a relationship ID was ignored")]);
    }
    function se(k) {
      var G = o.uriToZipEntryName("word", E.findTargetByRelationshipId(k));
      return { path: G, read: X.read.bind(X, G) };
    }
    function Ue(k, G) {
      var ne = S.findContentType(k.path), oe = i.Image({ readImage: k.read, altText: G, contentType: ne }), pe = g[ne] ? [] : r("Image of type " + ne + " is unlikely to display in web browsers");
      return d(oe, pe);
    }
    function we(k, G) {
      return r(k + " style with ID " + G + " was referenced but not defined in the document");
    }
  }
  function h(T, x, _) {
    var C = x.firstOrEmpty("w:ilvl").attributes["w:val"], E = x.firstOrEmpty("w:numId").attributes["w:val"];
    if (C !== void 0 && E !== void 0) return _.findLevel(E, C);
    if (T != null) {
      var S = _.findLevelByParagraphStyleId(T);
      if (S != null) return S;
    }
    return E !== void 0 ? _.findLevel(E, "0") : null;
  }
  var g = { "image/png": true, "image/gif": true, "image/jpeg": true, "image/svg+xml": true, "image/tiff": true }, f = { "office-word:wrap": true, "v:shadow": true, "v:shapetype": true, "w:annotationRef": true, "w:bookmarkEnd": true, "w:sectPr": true, "w:proofErr": true, "w:lastRenderedPageBreak": true, "w:commentRangeStart": true, "w:commentRangeEnd": true, "w:del": true, "w:footnoteRef": true, "w:endnoteRef": true, "w:pPr": true, "w:rPr": true, "w:tblPr": true, "w:tblGrid": true, "w:trPr": true, "w:tcPr": true };
  function m(T) {
    return new p(null, null, T);
  }
  function D() {
    return new p(null);
  }
  function b(T) {
    return new p(T);
  }
  function d(T, x) {
    return new p(T, null, x);
  }
  function p(T, x, _) {
    this.value = T || [], this.extra = x || [], this._result = new t({ element: this.value, extra: x }, _), this.messages = this._result.messages;
  }
  p.prototype.toExtra = function() {
    return new p(null, y(this.extra, this.value), this.messages);
  }, p.prototype.insertExtra = function() {
    var T = this.extra;
    return T && T.length ? new p(y(this.value, T), null, this.messages) : this;
  }, p.prototype.map = function(T) {
    var x = this._result.map(function(_) {
      return T(_.element);
    });
    return new p(x.value, this.extra, x.messages);
  }, p.prototype.flatMap = function(T) {
    var x = this._result.flatMap(function(_) {
      return T(_.element)._result;
    });
    return new p(x.value.element, y(this.extra, x.value.extra), x.messages);
  }, p.map = function(T, x, _) {
    return new p(_(T.value, x.value), y(T.extra, x.extra), T.messages.concat(x.messages));
  };
  function l(T) {
    var x = t.combine(n.pluck(T, "_result"));
    return new p(n.flatten(n.pluck(x.value, "element")), n.filter(n.flatten(n.pluck(x.value, "extra")), w), x.messages);
  }
  function y(T, x) {
    return n.flatten([T, x]);
  }
  function w(T) {
    return T;
  }
  return pt;
}
var nr = {}, Kc;
function ml() {
  if (Kc) return nr;
  Kc = 1, nr.DocumentXmlReader = i;
  var e = Wn(), n = cn().Result;
  function i(t) {
    var r = t.bodyReader;
    function a(c) {
      var o = c.first("w:body");
      if (o == null) throw new Error("Could not find the body element: are you sure this is a docx file?");
      var u = r.readXmlElements(o.children).map(function(s) {
        return new e.Document(s, { notes: t.notes, comments: t.comments });
      });
      return new n(u.value, u.messages);
    }
    return { convertXmlToDocument: a };
  }
  return nr;
}
var $n = {}, Jc;
function bl() {
  if (Jc) return $n;
  Jc = 1, $n.readRelationships = e, $n.defaultValue = new n([]), $n.Relationships = n;
  function e(i) {
    var t = [];
    return i.children.forEach(function(r) {
      if (r.name === "relationships:Relationship") {
        var a = { relationshipId: r.attributes.Id, target: r.attributes.Target, type: r.attributes.Type };
        t.push(a);
      }
    }), new n(t);
  }
  function n(i) {
    var t = {};
    i.forEach(function(a) {
      t[a.relationshipId] = a.target;
    });
    var r = {};
    return i.forEach(function(a) {
      r[a.type] || (r[a.type] = []), r[a.type].push(a.target);
    }), { findTargetByRelationshipId: function(a) {
      return t[a];
    }, findTargetsByType: function(a) {
      return r[a] || [];
    } };
  }
  return $n;
}
var Dt = {}, eo;
function Dl() {
  if (eo) return Dt;
  eo = 1, Dt.readContentTypesFromXml = n;
  var e = { png: "png", gif: "gif", jpeg: "jpeg", jpg: "jpeg", tif: "tiff", tiff: "tiff", bmp: "bmp" };
  Dt.defaultContentTypes = i({}, {});
  function n(t) {
    var r = {}, a = {};
    return t.children.forEach(function(c) {
      if (c.name === "content-types:Default" && (r[c.attributes.Extension] = c.attributes.ContentType), c.name === "content-types:Override") {
        var o = c.attributes.PartName;
        o.charAt(0) === "/" && (o = o.substring(1)), a[o] = c.attributes.ContentType;
      }
    }), i(a, r);
  }
  function i(t, r) {
    return { findContentType: function(a) {
      var c = t[a];
      if (c) return c;
      var o = a.split("."), u = o[o.length - 1];
      if (r.hasOwnProperty(u)) return r[u];
      var s = e[u.toLowerCase()];
      return s ? "image/" + s : null;
    } };
  }
  return Dt;
}
var Qn = {}, no;
function yl() {
  if (no) return Qn;
  no = 1;
  var e = Be;
  Qn.readNumberingXml = i, Qn.Numbering = n, Qn.defaultNumbering = new n({}, {});
  function n(c, o, u) {
    var s = e.flatten(e.values(o).map(function(m) {
      return e.values(m.levels);
    })), h = e.indexBy(s.filter(function(m) {
      return m.paragraphStyleId != null;
    }), "paragraphStyleId");
    function g(m, D) {
      var b = c[m];
      if (b) {
        var d = o[b.abstractNumId];
        if (d) {
          if (d.numStyleLink == null) return o[b.abstractNumId].levels[D];
          var p = u.findNumberingStyleById(d.numStyleLink);
          return g(p.numId, D);
        } else return null;
      } else return null;
    }
    function f(m) {
      return h[m] || null;
    }
    return { findLevel: g, findLevelByParagraphStyleId: f };
  }
  function i(c, o) {
    if (!o || !o.styles) throw new Error("styles is missing");
    var u = t(c), s = a(c);
    return new n(s, u, o.styles);
  }
  function t(c) {
    var o = {};
    return c.getElementsByTagName("w:abstractNum").forEach(function(u) {
      var s = u.attributes["w:abstractNumId"];
      o[s] = r(u);
    }), o;
  }
  function r(c) {
    var o = {}, u = null;
    c.getElementsByTagName("w:lvl").forEach(function(h) {
      var g = h.attributes["w:ilvl"], f = h.firstOrEmpty("w:numFmt").attributes["w:val"], m = f !== "bullet", D = h.firstOrEmpty("w:pStyle").attributes["w:val"];
      g === void 0 ? u = { isOrdered: m, level: "0", paragraphStyleId: D } : o[g] = { isOrdered: m, level: g, paragraphStyleId: D };
    }), u !== null && o[u.level] === void 0 && (o[u.level] = u);
    var s = c.firstOrEmpty("w:numStyleLink").attributes["w:val"];
    return { levels: o, numStyleLink: s };
  }
  function a(c) {
    var o = {};
    return c.getElementsByTagName("w:num").forEach(function(u) {
      var s = u.attributes["w:numId"], h = u.first("w:abstractNumId").attributes["w:val"];
      o[s] = { abstractNumId: h };
    }), o;
  }
  return Qn;
}
var Yn = {}, to;
function vl() {
  if (to) return Yn;
  to = 1, Yn.readStylesXml = n, Yn.Styles = e, Yn.defaultStyles = new e({}, {});
  function e(c, o, u, s) {
    return { findParagraphStyleById: function(h) {
      return c[h];
    }, findCharacterStyleById: function(h) {
      return o[h];
    }, findTableStyleById: function(h) {
      return u[h];
    }, findNumberingStyleById: function(h) {
      return s[h];
    } };
  }
  e.EMPTY = new e({}, {}, {}, {});
  function n(c) {
    var o = {}, u = {}, s = {}, h = {}, g = { paragraph: o, character: u, table: s, numbering: h };
    return c.getElementsByTagName("w:style").forEach(function(f) {
      var m = i(f), D = g[m.type];
      D && D[m.styleId] === void 0 && (D[m.styleId] = m);
    }), new e(o, u, s, h);
  }
  function i(c) {
    var o = c.attributes["w:type"];
    if (o === "numbering") return r(o, c);
    var u = a(c), s = t(c);
    return { type: o, styleId: u, name: s };
  }
  function t(c) {
    var o = c.first("w:name");
    return o ? o.attributes["w:val"] : null;
  }
  function r(c, o) {
    var u = a(o), s = o.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"];
    return { type: c, numId: s, styleId: u };
  }
  function a(c) {
    return c.attributes["w:styleId"];
  }
  return Yn;
}
var Nn = {}, io;
function xl() {
  if (io) return Nn;
  io = 1;
  var e = Wn(), n = cn().Result;
  Nn.createFootnotesReader = i.bind(Nn, "footnote"), Nn.createEndnotesReader = i.bind(Nn, "endnote");
  function i(t, r) {
    function a(u) {
      return n.combine(u.getElementsByTagName("w:" + t).filter(c).map(o));
    }
    function c(u) {
      var s = u.attributes["w:type"];
      return s !== "continuationSeparator" && s !== "separator";
    }
    function o(u) {
      var s = u.attributes["w:id"];
      return r.readXmlElements(u.children).map(function(h) {
        return e.Note({ noteType: t, noteId: s, body: h });
      });
    }
    return a;
  }
  return Nn;
}
var tr = {}, ro;
function Ul() {
  if (ro) return tr;
  ro = 1;
  var e = Wn(), n = cn().Result;
  function i(t) {
    function r(c) {
      return n.combine(c.getElementsByTagName("w:comment").map(a));
    }
    function a(c) {
      var o = c.attributes["w:id"];
      function u(s) {
        return (c.attributes[s] || "").trim() || null;
      }
      return t.readXmlElements(c.children).map(function(s) {
        return e.comment({ commentId: o, body: s, authorName: u("w:author"), authorInitials: u("w:initials") });
      });
    }
    return r;
  }
  return tr.createCommentsReader = i, tr;
}
var ir = {}, ao;
function Tl() {
  if (ao) return ir;
  ao = 1;
  var e = mn();
  ir.Files = n;
  function n() {
    function i(t) {
      return e.reject(new Error("could not open external image: '" + t + `'
cannot open linked files from a web browser`));
    }
    return { read: i };
  }
  return ir;
}
var co;
function _l() {
  if (co) return st;
  co = 1, st.read = D, st._findPartPaths = b;
  var e = mn(), n = Wn(), i = cn().Result, t = ds(), r = ll().readXmlFromZipFile, a = pl().createBodyReader, c = ml().DocumentXmlReader, o = bl(), u = Dl(), s = yl(), h = vl(), g = xl(), f = Ul(), m = Tl().Files;
  function D(E, S, X) {
    S = S || {}, X = X || {};
    var A = new m({ externalFileAccess: X.externalFileAccess, relativeToFile: S.path });
    return e.props({ contentTypes: T(E), partPaths: b(E), docxFile: E, files: A }).also(function(R) {
      return { styles: _(E, R.partPaths.styles) };
    }).also(function(R) {
      return { numbering: x(E, R.partPaths.numbering, R.styles) };
    }).also(function(R) {
      return { footnotes: y(R.partPaths.footnotes, R, function(M, H) {
        return H ? g.createFootnotesReader(M)(H) : new i([]);
      }), endnotes: y(R.partPaths.endnotes, R, function(M, H) {
        return H ? g.createEndnotesReader(M)(H) : new i([]);
      }), comments: y(R.partPaths.comments, R, function(M, H) {
        return H ? f.createCommentsReader(M)(H) : new i([]);
      }) };
    }).also(function(R) {
      return { notes: R.footnotes.flatMap(function(M) {
        return R.endnotes.map(function(H) {
          return new n.Notes(M.concat(H));
        });
      }) };
    }).then(function(R) {
      return y(R.partPaths.mainDocument, R, function(M, H) {
        return R.notes.flatMap(function(F) {
          return R.comments.flatMap(function(B) {
            var O = new c({ bodyReader: M, notes: F, comments: B });
            return O.convertXmlToDocument(H);
          });
        });
      });
    });
  }
  function b(E) {
    return C(E).then(function(S) {
      var X = d({ docxFile: E, relationships: S, relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", basePath: "", fallbackPath: "word/document.xml" });
      if (!E.exists(X)) throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");
      return l({ filename: w(X), readElement: o.readRelationships, defaultValue: o.defaultValue })(E).then(function(A) {
        function R(M) {
          return d({ docxFile: E, relationships: A, relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + M, basePath: t.splitPath(X).dirname, fallbackPath: "word/" + M + ".xml" });
        }
        return { mainDocument: X, comments: R("comments"), endnotes: R("endnotes"), footnotes: R("footnotes"), numbering: R("numbering"), styles: R("styles") };
      });
    });
  }
  function d(E) {
    var S = E.docxFile, X = E.relationships, A = E.relationshipType, R = E.basePath, M = E.fallbackPath, H = X.findTargetsByType(A), F = H.map(function(O) {
      return p(t.joinPath(R, O), "/");
    }), B = F.filter(function(O) {
      return S.exists(O);
    });
    return B.length === 0 ? M : B[0];
  }
  function p(E, S) {
    return E.substring(0, S.length) === S ? E.substring(S.length) : E;
  }
  function l(E) {
    return function(S) {
      return r(S, E.filename).then(function(X) {
        return X ? E.readElement(X) : E.defaultValue;
      });
    };
  }
  function y(E, S, X) {
    var A = l({ filename: w(E), readElement: o.readRelationships, defaultValue: o.defaultValue });
    return A(S.docxFile).then(function(R) {
      var M = new a({ relationships: R, contentTypes: S.contentTypes, docxFile: S.docxFile, numbering: S.numbering, styles: S.styles, files: S.files });
      return r(S.docxFile, E).then(function(H) {
        return X(M, H);
      });
    });
  }
  function w(E) {
    var S = t.splitPath(E);
    return t.joinPath(S.dirname, "_rels", S.basename + ".rels");
  }
  var T = l({ filename: "[Content_Types].xml", readElement: u.readContentTypesFromXml, defaultValue: u.defaultContentTypes });
  function x(E, S, X) {
    return l({ filename: S, readElement: function(A) {
      return s.readNumberingXml(A, { styles: X });
    }, defaultValue: s.defaultNumbering })(E);
  }
  function _(E, S) {
    return l({ filename: S, readElement: h.readStylesXml, defaultValue: h.defaultStyles })(E);
  }
  var C = l({ filename: "_rels/.rels", readElement: o.readRelationships, defaultValue: o.defaultValue });
  return st;
}
var yt = {}, oo;
function El() {
  if (oo) return yt;
  oo = 1;
  var e = Be, n = mn(), i = ga();
  yt.writeStyleMap = c, yt.readStyleMap = h;
  var t = "http://schemas.zwobble.org/mammoth/style-map", r = "mammoth/style-map", a = "/" + r;
  function c(g, f) {
    return g.write(r, f), o(g).then(function() {
      return u(g);
    });
  }
  function o(g) {
    var f = "word/_rels/document.xml.rels", m = "http://schemas.openxmlformats.org/package/2006/relationships", D = "{" + m + "}Relationship";
    return g.read(f, "utf8").then(i.readString).then(function(b) {
      var d = b.children;
      s(d, D, "Id", { Id: "rMammothStyleMap", Type: t, Target: a });
      var p = { "": m };
      return g.write(f, i.writeString(b, p));
    });
  }
  function u(g) {
    var f = "[Content_Types].xml", m = "http://schemas.openxmlformats.org/package/2006/content-types", D = "{" + m + "}Override";
    return g.read(f, "utf8").then(i.readString).then(function(b) {
      var d = b.children;
      s(d, D, "PartName", { PartName: a, ContentType: "text/prs.mammoth.style-map" });
      var p = { "": m };
      return g.write(f, i.writeString(b, p));
    });
  }
  function s(g, f, m, D) {
    var b = e.find(g, function(d) {
      return d.name === f && d.attributes[m] === D[m];
    });
    b ? b.attributes = D : g.push(i.element(f, D));
  }
  function h(g) {
    return g.exists(r) ? g.read(r, "utf8") : n.resolve(null);
  }
  return yt;
}
var vt = {}, En = {}, rn = {}, dn = {}, uo;
function ms() {
  if (uo) return dn;
  uo = 1;
  var e = Di();
  function n(u, s, h) {
    return t(e.element(u, s, { fresh: false }), h);
  }
  function i(u, s, h) {
    var g = e.element(u, s, { fresh: true });
    return t(g, h);
  }
  function t(u, s) {
    return { type: "element", tag: u, children: s || [] };
  }
  function r(u) {
    return { type: "text", value: u };
  }
  var a = { type: "forceWrite" };
  dn.freshElement = i, dn.nonFreshElement = n, dn.elementWithTag = t, dn.text = r, dn.forceWrite = a;
  var c = { br: true, hr: true, img: true, input: true };
  function o(u) {
    return u.children.length === 0 && c[u.tag.tagName];
  }
  return dn.isVoidElement = o, dn;
}
var rr, so;
function wl() {
  if (so) return rr;
  so = 1;
  var e = Be, n = ms();
  function i(b) {
    return t(s(b));
  }
  function t(b) {
    var d = [];
    return b.map(r).forEach(function(p) {
      u(d, p);
    }), d;
  }
  function r(b) {
    return a[b.type](b);
  }
  var a = { element: c, text: o, forceWrite: o };
  function c(b) {
    return n.elementWithTag(b.tag, t(b.children));
  }
  function o(b) {
    return b;
  }
  function u(b, d) {
    var p = b[b.length - 1];
    d.type === "element" && !d.tag.fresh && p && p.type === "element" && d.tag.matchesElement(p.tag) ? (d.tag.separator && u(p.children, n.text(d.tag.separator)), d.children.forEach(function(l) {
      u(p.children, l);
    })) : b.push(d);
  }
  function s(b) {
    return h(b, function(d) {
      return g[d.type](d);
    });
  }
  function h(b, d) {
    return e.flatten(e.map(b, d), true);
  }
  var g = { element: m, text: D, forceWrite: f };
  function f(b) {
    return [b];
  }
  function m(b) {
    var d = s(b.children);
    return d.length === 0 && !n.isVoidElement(b) ? [] : [n.elementWithTag(b.tag, d)];
  }
  function D(b) {
    return b.value.length === 0 ? [] : [b];
  }
  return rr = i, rr;
}
var lo;
function bi() {
  if (lo) return rn;
  lo = 1;
  var e = ms();
  rn.freshElement = e.freshElement, rn.nonFreshElement = e.nonFreshElement, rn.elementWithTag = e.elementWithTag, rn.text = e.text, rn.forceWrite = e.forceWrite, rn.simplify = wl();
  function n(c, o) {
    o.forEach(function(u) {
      i(c, u);
    });
  }
  function i(c, o) {
    t[o.type](c, o);
  }
  var t = { element: r, text: a, forceWrite: function() {
  } };
  function r(c, o) {
    e.isVoidElement(o) ? c.selfClosing(o.tag.tagName, o.tag.attributes) : (c.open(o.tag.tagName, o.tag.attributes), n(c, o.children), c.close(o.tag.tagName));
  }
  function a(c, o) {
    c.text(o.value);
  }
  return rn.write = n, rn;
}
var fo;
function Di() {
  if (fo) return En;
  fo = 1;
  var e = Be, n = bi();
  En.topLevelElement = i, En.elements = t, En.element = a;
  function i(o, u) {
    return t([a(o, u, { fresh: true })]);
  }
  function t(o) {
    return new r(o.map(function(u) {
      return e.isString(u) ? a(u) : u;
    }));
  }
  function r(o) {
    this._elements = o;
  }
  r.prototype.wrap = function(u) {
    for (var s = u(), h = this._elements.length - 1; h >= 0; h--) s = this._elements[h].wrapNodes(s);
    return s;
  };
  function a(o, u, s) {
    return s = s || {}, new c(o, u, s);
  }
  function c(o, u, s) {
    var h = {};
    e.isArray(o) ? (o.forEach(function(g) {
      h[g] = true;
    }), o = o[0]) : h[o] = true, this.tagName = o, this.tagNames = h, this.attributes = u || {}, this.fresh = s.fresh, this.separator = s.separator;
  }
  return c.prototype.matchesElement = function(o) {
    return this.tagNames[o.tagName] && e.isEqual(this.attributes || {}, o.attributes || {});
  }, c.prototype.wrap = function(u) {
    return this.wrapNodes(u());
  }, c.prototype.wrapNodes = function(u) {
    return [n.elementWithTag(this, u)];
  }, En.empty = t([]), En.ignore = { wrap: function() {
    return [];
  } }, En;
}
var ar = {}, ho;
function bs() {
  return ho || (ho = 1, (function(e) {
    var n = Be, i = mn(), t = bi();
    e.imgElement = r;
    function r(a) {
      return function(c, o) {
        return i.when(a(c)).then(function(u) {
          var s = {};
          return c.altText && (s.alt = c.altText), n.extend(s, u), [t.freshElement("img", s)];
        });
      };
    }
    e.inline = e.imgElement, e.dataUri = r(function(a) {
      return a.readAsBase64String().then(function(c) {
        return { src: "data:" + a.contentType + ";base64," + c };
      });
    });
  })(ar)), ar;
}
var cr = {}, or = {}, go;
function Fl() {
  if (go) return or;
  go = 1;
  var e = Be;
  or.writer = n;
  function n(o) {
    return o = o || {}, o.prettyPrint ? t() : r();
  }
  var i = { div: true, p: true, ul: true, li: true };
  function t() {
    var o = 0, u = "  ", s = [], h = true, g = false, f = r();
    function m(T, x) {
      i[T] && y(), s.push(T), f.open(T, x), i[T] && o++, h = false;
    }
    function D(T) {
      i[T] && (o--, y()), s.pop(), f.close(T);
    }
    function b(T) {
      l();
      var x = w() ? T : T.replace(`
`, `
` + u);
      f.text(x);
    }
    function d(T, x) {
      y(), f.selfClosing(T, x);
    }
    function p() {
      return s.length === 0 || i[s[s.length - 1]];
    }
    function l() {
      g || (y(), g = true);
    }
    function y() {
      if (g = false, !h && p() && !w()) {
        f._append(`
`);
        for (var T = 0; T < o; T++) f._append(u);
      }
    }
    function w() {
      return e.some(s, function(T) {
        return T === "pre";
      });
    }
    return { asString: f.asString, open: m, close: D, text: b, selfClosing: d };
  }
  function r() {
    var o = [];
    function u(b, d) {
      var p = g(d);
      o.push("<" + b + p + ">");
    }
    function s(b) {
      o.push("</" + b + ">");
    }
    function h(b, d) {
      var p = g(d);
      o.push("<" + b + p + " />");
    }
    function g(b) {
      return e.map(b, function(d, p) {
        return " " + p + '="' + c(d) + '"';
      }).join("");
    }
    function f(b) {
      o.push(a(b));
    }
    function m(b) {
      o.push(b);
    }
    function D() {
      return o.join("");
    }
    return { asString: D, open: u, close: s, text: f, selfClosing: h, _append: m };
  }
  function a(o) {
    return o.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function c(o) {
    return o.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return or;
}
var ur = {}, po;
function Al() {
  if (po) return ur;
  po = 1;
  var e = Be;
  function n(g) {
    return i(g, g);
  }
  function i(g, f) {
    return function() {
      return { start: g, end: f };
    };
  }
  function t(g) {
    var f = g.href || "";
    return f ? { start: "[", end: "](" + f + ")", anchorPosition: "before" } : {};
  }
  function r(g) {
    var f = g.src || "", m = g.alt || "";
    return f || m ? { start: "![" + m + "](" + f + ")" } : {};
  }
  function a(g) {
    return function(f, m) {
      return { start: m ? `
` : "", end: m ? "" : `
`, list: { isOrdered: g.isOrdered, indent: m ? m.indent + 1 : 0, count: 0 } };
    };
  }
  function c(g, f, m) {
    f = f || { indent: 0, isOrdered: false, count: 0 }, f.count++, m.hasClosed = false;
    var D = f.isOrdered ? f.count + "." : "-", b = u("	", f.indent) + D + " ";
    return { start: b, end: function() {
      if (!m.hasClosed) return m.hasClosed = true, `
`;
    } };
  }
  var o = { p: i("", `

`), br: i("", `  
`), ul: a({ isOrdered: false }), ol: a({ isOrdered: true }), li: c, strong: n("__"), em: n("*"), a: t, img: r };
  (function() {
    for (var g = 1; g <= 6; g++) o["h" + g] = i(u("#", g) + " ", `

`);
  })();
  function u(g, f) {
    return new Array(f + 1).join(g);
  }
  function s() {
    var g = [], f = [], m = null, D = {};
    function b(T, x) {
      x = x || {};
      var _ = o[T] || function() {
        return {};
      }, C = _(x, m, D);
      f.push({ end: C.end, list: m }), C.list && (m = C.list);
      var E = C.anchorPosition === "before";
      E && d(x), g.push(C.start || ""), E || d(x);
    }
    function d(T) {
      T.id && g.push('<a id="' + T.id + '"></a>');
    }
    function p(T) {
      var x = f.pop();
      m = x.list;
      var _ = e.isFunction(x.end) ? x.end() : x.end;
      g.push(_ || "");
    }
    function l(T, x) {
      b(T, x), p();
    }
    function y(T) {
      g.push(h(T));
    }
    function w() {
      return g.join("");
    }
    return { asString: w, open: b, close: p, text: y, selfClosing: l };
  }
  ur.writer = s;
  function h(g) {
    return g.replace(/\\/g, "\\\\").replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, "\\$1");
  }
  return ur;
}
var mo;
function Cl() {
  if (mo) return cr;
  mo = 1;
  var e = Fl(), n = Al();
  cr.writer = i;
  function i(t) {
    return t = t || {}, t.outputFormat === "markdown" ? n.writer() : e.writer(t);
  }
  return cr;
}
var bo;
function Wl() {
  if (bo) return vt;
  bo = 1;
  var e = Be, n = mn(), i = Wn(), t = Di(), r = cn(), a = bs(), c = bi(), o = Cl();
  vt.DocumentConverter = u;
  function u(d) {
    return { convertToHtml: function(p) {
      var l = e.indexBy(p.type === i.types.document ? p.comments : [], "commentId"), y = new s(d, l);
      return y.convertToHtml(p);
    } };
  }
  function s(d, p) {
    var l = 1, y = [], w = [];
    d = e.extend({ ignoreEmptyParagraphs: true }, d);
    var T = d.idPrefix === void 0 ? "" : d.idPrefix, x = d.ignoreEmptyParagraphs, _ = t.topLevelElement("p"), C = d.styleMap || [];
    function E(V) {
      var J = [], Y = X(V, J, {}), ue = [];
      D(Y, function(ge) {
        ge.type === "deferred" && ue.push(ge);
      });
      var fe = {};
      return n.mapSeries(ue, function(ge) {
        return ge.value().then(function(ye) {
          fe[ge.id] = ye;
        });
      }).then(function() {
        function ge(me) {
          return m(me, function(ce) {
            return ce.type === "deferred" ? fe[ce.id] : ce.children ? [e.extend({}, ce, { children: ge(ce.children) })] : [ce];
          });
        }
        var ye = o.writer({ prettyPrint: d.prettyPrint, outputFormat: d.outputFormat });
        return c.write(ye, c.simplify(ge(Y))), new r.Result(ye.asString(), J);
      });
    }
    function S(V, J, Y) {
      return m(V, function(ue) {
        return X(ue, J, Y);
      });
    }
    function X(V, J, Y) {
      if (!Y) throw new Error("options not set");
      var ue = Se[V.type];
      return ue ? ue(V, J, Y) : [];
    }
    function A(V, J, Y) {
      return R(V, J).wrap(function() {
        var ue = S(V.children, J, Y);
        return x ? ue : [c.forceWrite].concat(ue);
      });
    }
    function R(V, J) {
      var Y = B(V);
      return Y ? Y.to : (V.styleId && J.push(f("paragraph", V)), _);
    }
    function M(V, J, Y) {
      var ue = function() {
        return S(V.children, J, Y);
      }, fe = [];
      if (V.highlight !== null) {
        var ge = F({ type: "highlight", color: V.highlight });
        ge && fe.push(ge);
      }
      V.isSmallCaps && fe.push(H("smallCaps")), V.isAllCaps && fe.push(H("allCaps")), V.isStrikethrough && fe.push(H("strikethrough", "s")), V.isUnderline && fe.push(H("underline")), V.verticalAlignment === i.verticalAlignment.subscript && fe.push(t.element("sub", {}, { fresh: false })), V.verticalAlignment === i.verticalAlignment.superscript && fe.push(t.element("sup", {}, { fresh: false })), V.isItalic && fe.push(H("italic", "em")), V.isBold && fe.push(H("bold", "strong"));
      var ye = t.empty, me = B(V);
      return me ? ye = me.to : V.styleId && J.push(f("run", V)), fe.push(ye), fe.forEach(function(ce) {
        ue = ce.wrap.bind(ce, ue);
      }), ue();
    }
    function H(V, J) {
      var Y = F({ type: V });
      return Y || (J ? t.element(J, {}, { fresh: false }) : t.empty);
    }
    function F(V, J) {
      var Y = B(V);
      return Y ? Y.to : J;
    }
    function B(V) {
      for (var J = 0; J < C.length; J++) if (C[J].from.matches(V)) return C[J];
    }
    function O(V) {
      return function(J, Y) {
        return n.attempt(function() {
          return V(J, Y);
        }).caught(function(ue) {
          return Y.push(r.error(ue)), [];
        });
      };
    }
    function P(V) {
      return j(V.noteType, V.noteId);
    }
    function z(V) {
      return te(V.noteType, V.noteId);
    }
    function j(V, J) {
      return I(V + "-" + J);
    }
    function te(V, J) {
      return I(V + "-ref-" + J);
    }
    function I(V) {
      return T + V;
    }
    var K = t.elements([t.element("table", {}, { fresh: true })]);
    function ie(V, J, Y) {
      return F(V, K).wrap(function() {
        return re(V, J, Y);
      });
    }
    function re(V, J, Y) {
      var ue = e.findIndex(V.children, function(me) {
        return !me.type === i.types.tableRow || !me.isHeader;
      });
      ue === -1 && (ue = V.children.length);
      var fe;
      if (ue === 0) fe = S(V.children, J, e.extend({}, Y, { isTableHeader: false }));
      else {
        var ge = S(V.children.slice(0, ue), J, e.extend({}, Y, { isTableHeader: true })), ye = S(V.children.slice(ue), J, e.extend({}, Y, { isTableHeader: false }));
        fe = [c.freshElement("thead", {}, ge), c.freshElement("tbody", {}, ye)];
      }
      return [c.forceWrite].concat(fe);
    }
    function ee(V, J, Y) {
      var ue = S(V.children, J, Y);
      return [c.freshElement("tr", {}, [c.forceWrite].concat(ue))];
    }
    function de(V, J, Y) {
      var ue = Y.isTableHeader ? "th" : "td", fe = S(V.children, J, Y), ge = {};
      return V.colSpan !== 1 && (ge.colspan = V.colSpan.toString()), V.rowSpan !== 1 && (ge.rowspan = V.rowSpan.toString()), [c.freshElement(ue, ge, [c.forceWrite].concat(fe))];
    }
    function De(V, J, Y) {
      return F(V, t.ignore).wrap(function() {
        var ue = p[V.commentId], fe = w.length + 1, ge = "[" + b(ue) + fe + "]";
        return w.push({ label: ge, comment: ue }), [c.freshElement("a", { href: "#" + j("comment", V.commentId), id: te("comment", V.commentId) }, [c.text(ge)])];
      });
    }
    function he(V, J, Y) {
      var ue = V.label, fe = V.comment, ge = S(fe.body, J, Y).concat([c.nonFreshElement("p", {}, [c.text(" "), c.freshElement("a", { href: "#" + te("comment", fe.commentId) }, [c.text("\u2191")])])]);
      return [c.freshElement("dt", { id: j("comment", fe.commentId) }, [c.text("Comment " + ue)]), c.freshElement("dd", {}, ge)];
    }
    function ve(V, J, Y) {
      return Fe(V).wrap(function() {
        return [];
      });
    }
    function Fe(V) {
      var J = B(V);
      return J ? J.to : V.breakType === "line" ? t.topLevelElement("br") : t.empty;
    }
    var Se = { document: function(V, J, Y) {
      var ue = S(V.children, J, Y), fe = y.map(function(ye) {
        return V.notes.resolve(ye);
      }), ge = S(fe, J, Y);
      return ue.concat([c.freshElement("ol", {}, ge), c.freshElement("dl", {}, m(w, function(ye) {
        return he(ye, J, Y);
      }))]);
    }, paragraph: A, run: M, text: function(V, J, Y) {
      return [c.text(V.value)];
    }, tab: function(V, J, Y) {
      return [c.text("	")];
    }, hyperlink: function(V, J, Y) {
      var ue = V.anchor ? "#" + I(V.anchor) : V.href, fe = { href: ue };
      V.targetFrame != null && (fe.target = V.targetFrame);
      var ge = S(V.children, J, Y);
      return [c.nonFreshElement("a", fe, ge)];
    }, checkbox: function(V) {
      var J = { type: "checkbox" };
      return V.checked && (J.checked = "checked"), [c.freshElement("input", J)];
    }, bookmarkStart: function(V, J, Y) {
      var ue = c.freshElement("a", { id: I(V.name) }, [c.forceWrite]);
      return [ue];
    }, noteReference: function(V, J, Y) {
      y.push(V);
      var ue = c.freshElement("a", { href: "#" + P(V), id: z(V) }, [c.text("[" + l++ + "]")]);
      return [c.freshElement("sup", {}, [ue])];
    }, note: function(V, J, Y) {
      var ue = S(V.body, J, Y), fe = c.elementWithTag(t.element("p", {}, { fresh: false }), [c.text(" "), c.freshElement("a", { href: "#" + z(V) }, [c.text("\u2191")])]), ge = ue.concat([fe]);
      return c.freshElement("li", { id: P(V) }, ge);
    }, commentReference: De, comment: he, image: g(O(d.convertImage || a.dataUri)), table: ie, tableRow: ee, tableCell: de, break: ve };
    return { convertToHtml: E };
  }
  var h = 1;
  function g(d) {
    return function(p, l, y) {
      return [{ type: "deferred", id: h++, value: function() {
        return d(p, l, y);
      } }];
    };
  }
  function f(d, p) {
    return r.warning("Unrecognised " + d + " style: '" + p.styleName + "' (Style ID: " + p.styleId + ")");
  }
  function m(d, p) {
    return e.flatten(d.map(p), true);
  }
  function D(d, p) {
    d.forEach(function(l) {
      p(l), l.children && D(l.children, p);
    });
  }
  var b = vt.commentAuthorLabel = function(p) {
    return p.authorInitials || "";
  };
  return vt;
}
var sr = {}, Do;
function Bl() {
  if (Do) return sr;
  Do = 1;
  var e = Wn();
  function n(i) {
    if (i.type === "text") return i.value;
    if (i.type === e.types.tab) return "	";
    var t = i.type === "paragraph" ? `

` : "";
    return (i.children || []).map(n).join("") + t;
  }
  return sr.convertElementToRawText = n, sr;
}
var Zn = {}, Ze = {}, dr = {}, lr = { exports: {} }, yo;
function Sl() {
  if (yo) return lr.exports;
  yo = 1;
  var e = lr.exports = function(n, i) {
    this._tokens = n, this._startIndex = i || 0;
  };
  return e.prototype.head = function() {
    return this._tokens[this._startIndex];
  }, e.prototype.tail = function(n) {
    return new e(this._tokens, this._startIndex + 1);
  }, e.prototype.toArray = function() {
    return this._tokens.slice(this._startIndex);
  }, e.prototype.end = function() {
    return this._tokens[this._tokens.length - 1];
  }, e.prototype.to = function(n) {
    var i = this.head().source, t = n.head() || n.end();
    return i.to(t.source);
  }, lr.exports;
}
var vo;
function Rl() {
  if (vo) return dr;
  vo = 1;
  var e = Sl();
  return dr.Parser = function(n) {
    var i = function(t, r) {
      return t(new e(r));
    };
    return { parseTokens: i };
  }, dr;
}
var fr = {}, hr = {}, xo;
function Nl() {
  return xo || (xo = 1, (function(e) {
    e.none = /* @__PURE__ */ Object.create({ value: function() {
      throw new Error("Called value on none");
    }, isNone: function() {
      return true;
    }, isSome: function() {
      return false;
    }, map: function() {
      return e.none;
    }, flatMap: function() {
      return e.none;
    }, filter: function() {
      return e.none;
    }, toArray: function() {
      return [];
    }, orElse: n, valueOrElse: n });
    function n(t) {
      return typeof t == "function" ? t() : t;
    }
    e.some = function(t) {
      return new i(t);
    };
    var i = function(t) {
      this._value = t;
    };
    i.prototype.value = function() {
      return this._value;
    }, i.prototype.isNone = function() {
      return false;
    }, i.prototype.isSome = function() {
      return true;
    }, i.prototype.map = function(t) {
      return new i(t(this._value));
    }, i.prototype.flatMap = function(t) {
      return t(this._value);
    }, i.prototype.filter = function(t) {
      return t(this._value) ? this : e.none;
    }, i.prototype.toArray = function() {
      return [this._value];
    }, i.prototype.orElse = function(t) {
      return this;
    }, i.prototype.valueOrElse = function(t) {
      return this._value;
    }, e.isOption = function(t) {
      return t === e.none || t instanceof i;
    }, e.fromNullable = function(t) {
      return t == null ? e.none : new i(t);
    };
  })(hr)), hr;
}
var gr, Uo;
function pa() {
  if (Uo) return gr;
  Uo = 1, gr = { failure: function(n, i) {
    if (n.length < 1) throw new Error("Failure must have errors");
    return new e({ status: "failure", remaining: i, errors: n });
  }, error: function(n, i) {
    if (n.length < 1) throw new Error("Failure must have errors");
    return new e({ status: "error", remaining: i, errors: n });
  }, success: function(n, i, t) {
    return new e({ status: "success", value: n, source: t, remaining: i, errors: [] });
  }, cut: function(n) {
    return new e({ status: "cut", remaining: n, errors: [] });
  } };
  var e = function(n) {
    this._value = n.value, this._status = n.status, this._hasValue = n.value !== void 0, this._remaining = n.remaining, this._source = n.source, this._errors = n.errors;
  };
  return e.prototype.map = function(n) {
    return this._hasValue ? new e({ value: n(this._value, this._source), status: this._status, remaining: this._remaining, source: this._source, errors: this._errors }) : this;
  }, e.prototype.changeRemaining = function(n) {
    return new e({ value: this._value, status: this._status, remaining: n, source: this._source, errors: this._errors });
  }, e.prototype.isSuccess = function() {
    return this._status === "success" || this._status === "cut";
  }, e.prototype.isFailure = function() {
    return this._status === "failure";
  }, e.prototype.isError = function() {
    return this._status === "error";
  }, e.prototype.isCut = function() {
    return this._status === "cut";
  }, e.prototype.value = function() {
    return this._value;
  }, e.prototype.remaining = function() {
    return this._remaining;
  }, e.prototype.source = function() {
    return this._source;
  }, e.prototype.errors = function() {
    return this._errors;
  }, gr;
}
var pr = {}, To;
function Ds() {
  if (To) return pr;
  To = 1, pr.error = function(n) {
    return new e(n);
  };
  var e = function(n) {
    this.expected = n.expected, this.actual = n.actual, this._location = n.location;
  };
  return e.prototype.describe = function() {
    var n = this._location ? this._location.describe() + `:
` : "";
    return n + "Expected " + this.expected + `
but got ` + this.actual;
  }, e.prototype.lineNumber = function() {
    return this._location.lineNumber();
  }, e.prototype.characterNumber = function() {
    return this._location.characterNumber();
  }, pr;
}
var mr = {}, _o;
function kl() {
  if (_o) return mr;
  _o = 1, mr.fromArray = function(n) {
    var i = 0, t = function() {
      return i < n.length;
    };
    return new e({ hasNext: t, next: function() {
      if (t()) return n[i++];
      throw new Error("No more elements");
    } });
  };
  var e = function(n) {
    this._iterator = n;
  };
  return e.prototype.map = function(n) {
    var i = this._iterator;
    return new e({ hasNext: function() {
      return i.hasNext();
    }, next: function() {
      return n(i.next());
    } });
  }, e.prototype.filter = function(n) {
    var i = this._iterator, t = false, r = false, a, c = function() {
      if (!t) for (t = true, r = false; i.hasNext() && !r; ) a = i.next(), r = n(a);
    };
    return new e({ hasNext: function() {
      return c(), r;
    }, next: function() {
      c();
      var o = a;
      return t = false, o;
    } });
  }, e.prototype.first = function() {
    var n = this._iterator;
    return this._iterator.hasNext() ? n.next() : null;
  }, e.prototype.toArray = function() {
    for (var n = []; this._iterator.hasNext(); ) n.push(this._iterator.next());
    return n;
  }, mr;
}
var Eo;
function ys() {
  return Eo || (Eo = 1, (function(e) {
    var n = Be, i = Nl(), t = pa(), r = Ds(), a = kl();
    e.token = function(f, m) {
      var D = m !== void 0;
      return function(b) {
        var d = b.head();
        if (d && d.name === f && (!D || d.value === m)) return t.success(d.value, b.tail(), d.source);
        var p = h({ name: f, value: m });
        return g(b, p);
      };
    }, e.tokenOfType = function(f) {
      return e.token(f);
    }, e.firstOf = function(f, m) {
      return n.isArray(m) || (m = Array.prototype.slice.call(arguments, 1)), function(D) {
        return a.fromArray(m).map(function(b) {
          return b(D);
        }).filter(function(b) {
          return b.isSuccess() || b.isError();
        }).first() || g(D, f);
      };
    }, e.then = function(f, m) {
      return function(D) {
        var b = f(D);
        return b.map || console.log(b), b.map(m);
      };
    }, e.sequence = function() {
      var f = Array.prototype.slice.call(arguments, 0), m = function(b) {
        var d = n.foldl(f, function(l, y) {
          var w = l.result, T = l.hasCut;
          if (!w.isSuccess()) return { result: w, hasCut: T };
          var x = y(w.remaining());
          if (x.isCut()) return { result: w, hasCut: true };
          if (x.isSuccess()) {
            var _;
            y.isCaptured ? _ = w.value().withValue(y, x.value()) : _ = w.value();
            var C = x.remaining(), E = b.to(C);
            return { result: t.success(_, C, E), hasCut: T };
          } else return T ? { result: t.error(x.errors(), x.remaining()), hasCut: T } : { result: x, hasCut: T };
        }, { result: t.success(new c(), b), hasCut: false }).result, p = b.to(d.remaining());
        return d.map(function(l) {
          return l.withValue(e.sequence.source, p);
        });
      };
      m.head = function() {
        var b = n.find(f, D);
        return e.then(m, e.sequence.extract(b));
      }, m.map = function(b) {
        return e.then(m, function(d) {
          return b.apply(this, d.toArray());
        });
      };
      function D(b) {
        return b.isCaptured;
      }
      return m;
    };
    var c = function(f, m) {
      this._values = f || {}, this._valuesArray = m || [];
    };
    c.prototype.withValue = function(f, m) {
      if (f.captureName && f.captureName in this._values) throw new Error('Cannot add second value for capture "' + f.captureName + '"');
      var D = n.clone(this._values);
      D[f.captureName] = m;
      var b = this._valuesArray.concat([m]);
      return new c(D, b);
    }, c.prototype.get = function(f) {
      if (f.captureName in this._values) return this._values[f.captureName];
      throw new Error('No value for capture "' + f.captureName + '"');
    }, c.prototype.toArray = function() {
      return this._valuesArray;
    }, e.sequence.capture = function(f, m) {
      var D = function() {
        return f.apply(this, arguments);
      };
      return D.captureName = m, D.isCaptured = true, D;
    }, e.sequence.extract = function(f) {
      return function(m) {
        return m.get(f);
      };
    }, e.sequence.applyValues = function(f) {
      var m = Array.prototype.slice.call(arguments, 1);
      return function(D) {
        var b = m.map(function(d) {
          return D.get(d);
        });
        return f.apply(this, b);
      };
    }, e.sequence.source = { captureName: "\u2603source\u2603" }, e.sequence.cut = function() {
      return function(f) {
        return t.cut(f);
      };
    }, e.optional = function(f) {
      return function(m) {
        var D = f(m);
        return D.isSuccess() ? D.map(i.some) : D.isFailure() ? t.success(i.none, m) : D;
      };
    }, e.zeroOrMoreWithSeparator = function(f, m) {
      return s(f, m, false);
    }, e.oneOrMoreWithSeparator = function(f, m) {
      return s(f, m, true);
    };
    var o = e.zeroOrMore = function(f) {
      return function(m) {
        for (var D = [], b; (b = f(m)) && b.isSuccess(); ) m = b.remaining(), D.push(b.value());
        return b.isError() ? b : t.success(D, m);
      };
    };
    e.oneOrMore = function(f) {
      return e.oneOrMoreWithSeparator(f, u);
    };
    function u(f) {
      return t.success(null, f);
    }
    var s = function(f, m, D) {
      return function(b) {
        var d = f(b);
        if (d.isSuccess()) {
          var p = e.sequence.capture(f, "main"), l = o(e.then(e.sequence(m, p), e.sequence.extract(p))), y = l(d.remaining());
          return t.success([d.value()].concat(y.value()), y.remaining());
        } else return D || d.isError() ? d : t.success([], b);
      };
    };
    e.leftAssociative = function(f, m, D) {
      var b;
      D ? b = [{ func: D, rule: m }] : b = m, b = b.map(function(p) {
        return e.then(p.rule, function(l) {
          return function(y, w) {
            return p.func(y, l, w);
          };
        });
      });
      var d = e.firstOf.apply(null, ["rules"].concat(b));
      return function(p) {
        var l = p, y = f(p);
        if (!y.isSuccess()) return y;
        for (var w = d(y.remaining()); w.isSuccess(); ) {
          var T = w.remaining(), x = l.to(w.remaining()), _ = w.value();
          y = t.success(_(y.value(), x), T, x), w = d(y.remaining());
        }
        return w.isError() ? w : y;
      };
    }, e.leftAssociative.firstOf = function() {
      return Array.prototype.slice.call(arguments, 0);
    }, e.nonConsuming = function(f) {
      return function(m) {
        return f(m).changeRemaining(m);
      };
    };
    var h = function(f) {
      return f.value ? f.name + ' "' + f.value + '"' : f.name;
    };
    function g(f, m) {
      var D, b = f.head();
      return b ? D = r.error({ expected: m, actual: h(b), location: b.source }) : D = r.error({ expected: m, actual: "end of tokens" }), t.failure([D], f);
    }
  })(fr)), fr;
}
var br = { exports: {} }, wo;
function vs() {
  if (wo) return br.exports;
  wo = 1, br.exports = function(n, i) {
    var t = { asString: function() {
      return n;
    }, range: function(r, a) {
      return new e(n, i, r, a);
    } };
    return t;
  };
  var e = function(n, i, t, r) {
    this._string = n, this._description = i, this._startIndex = t, this._endIndex = r;
  };
  return e.prototype.to = function(n) {
    return new e(this._string, this._description, this._startIndex, n._endIndex);
  }, e.prototype.describe = function() {
    var n = this._position(), i = this._description ? this._description + `
` : "";
    return i + "Line number: " + n.lineNumber + `
Character number: ` + n.characterNumber;
  }, e.prototype.lineNumber = function() {
    return this._position().lineNumber;
  }, e.prototype.characterNumber = function() {
    return this._position().characterNumber;
  }, e.prototype._position = function() {
    for (var n = this, i = 0, t = function() {
      return n._string.indexOf(`
`, i);
    }, r = 1; t() !== -1 && t() < this._startIndex; ) i = t() + 1, r += 1;
    var a = this._startIndex - i + 1;
    return { lineNumber: r, characterNumber: a };
  }, br.exports;
}
var Dr, Fo;
function xs() {
  return Fo || (Fo = 1, Dr = function(e, n, i) {
    this.name = e, this.value = n, i && (this.source = i);
  }), Dr;
}
var yr = {}, Ao;
function Ol() {
  return Ao || (Ao = 1, (function(e) {
    var n = ys(), i = pa();
    e.parser = function(a, c, o) {
      var u = { rule: f, leftAssociative: m, rightAssociative: D }, s = new t(o.map(g)), h = n.firstOf(a, c);
      function g(p) {
        return { name: p.name, rule: r(p.ruleBuilder.bind(null, u)) };
      }
      function f() {
        return b(s);
      }
      function m(p) {
        return b(s.untilExclusive(p));
      }
      function D(p) {
        return b(s.untilInclusive(p));
      }
      function b(p) {
        return d.bind(null, p);
      }
      function d(p, l) {
        var y = h(l);
        return y.isSuccess() ? p.apply(y) : y;
      }
      return u;
    };
    function t(a) {
      function c(g) {
        return new t(a.slice(0, u().indexOf(g)));
      }
      function o(g) {
        return new t(a.slice(0, u().indexOf(g) + 1));
      }
      function u() {
        return a.map(function(g) {
          return g.name;
        });
      }
      function s(g) {
        for (var f, m; ; ) if (f = h(g.remaining()), f.isSuccess()) m = g.source().to(f.source()), g = i.success(f.value()(g.value(), m), f.remaining(), m);
        else return f.isFailure() ? g : f;
      }
      function h(g) {
        return n.firstOf("infix", a.map(function(f) {
          return f.rule;
        }))(g);
      }
      return { apply: s, untilExclusive: c, untilInclusive: o };
    }
    e.infix = function(a, c) {
      function o(u) {
        return e.infix(a, function(s) {
          var h = c(s);
          return function(g) {
            var f = h(g);
            return f.map(function(m) {
              return function(D, b) {
                return u(D, m, b);
              };
            });
          };
        });
      }
      return { name: a, ruleBuilder: c, map: o };
    };
    var r = function(a) {
      var c;
      return function(o) {
        return c || (c = a()), c(o);
      };
    };
  })(yr)), yr;
}
var vr = {}, Co;
function Il() {
  if (Co) return vr;
  Co = 1;
  var e = xs(), n = vs();
  vr.RegexTokeniser = i;
  function i(t) {
    t = t.map(function(o) {
      return { name: o.name, regex: new RegExp(o.regex.source, "g") };
    });
    function r(o, u) {
      for (var s = new n(o, u), h = 0, g = []; h < o.length; ) {
        var f = a(o, h, s);
        h = f.endIndex, g.push(f.token);
      }
      return g.push(c(o, s)), g;
    }
    function a(o, u, s) {
      for (var h = 0; h < t.length; h++) {
        var g = t[h].regex;
        g.lastIndex = u;
        var f = g.exec(o);
        if (f) {
          var D = u + f[0].length;
          if (f.index === u && D > u) {
            var m = f[1], b = new e(t[h].name, m, s.range(u, D));
            return { token: b, endIndex: D };
          }
        }
      }
      var D = u + 1, b = new e("unrecognisedCharacter", o.substring(u, D), s.range(u, D));
      return { token: b, endIndex: D };
    }
    function c(o, u) {
      return new e("end", null, u.range(o.length, o.length));
    }
    return { tokenise: r };
  }
  return vr;
}
var Wo;
function Us() {
  return Wo || (Wo = 1, Ze.Parser = Rl().Parser, Ze.rules = ys(), Ze.errors = Ds(), Ze.results = pa(), Ze.StringSource = vs(), Ze.Token = xs(), Ze.bottomUp = Ol(), Ze.RegexTokeniser = Il().RegexTokeniser, Ze.rule = function(e) {
    var n;
    return function(i) {
      return n || (n = e()), n(i);
    };
  }), Ze;
}
var Ne = {}, Bo;
function Ll() {
  if (Bo) return Ne;
  Bo = 1, Ne.paragraph = e, Ne.run = n, Ne.table = i, Ne.bold = new r("bold"), Ne.italic = new r("italic"), Ne.underline = new r("underline"), Ne.strikethrough = new r("strikethrough"), Ne.allCaps = new r("allCaps"), Ne.smallCaps = new r("smallCaps"), Ne.highlight = t, Ne.commentReference = new r("commentReference"), Ne.lineBreak = new c({ breakType: "line" }), Ne.pageBreak = new c({ breakType: "page" }), Ne.columnBreak = new c({ breakType: "column" }), Ne.equalTo = u, Ne.startsWith = s;
  function e(f) {
    return new r("paragraph", f);
  }
  function n(f) {
    return new r("run", f);
  }
  function i(f) {
    return new r("table", f);
  }
  function t(f) {
    return new a(f);
  }
  function r(f, m) {
    m = m || {}, this._elementType = f, this._styleId = m.styleId, this._styleName = m.styleName, m.list && (this._listIndex = m.list.levelIndex, this._listIsOrdered = m.list.isOrdered);
  }
  r.prototype.matches = function(f) {
    return f.type === this._elementType && (this._styleId === void 0 || f.styleId === this._styleId) && (this._styleName === void 0 || f.styleName && this._styleName.operator(this._styleName.operand, f.styleName)) && (this._listIndex === void 0 || o(f, this._listIndex, this._listIsOrdered)) && (this._breakType === void 0 || this._breakType === f.breakType);
  };
  function a(f) {
    f = f || {}, this._color = f.color;
  }
  a.prototype.matches = function(f) {
    return f.type === "highlight" && (this._color === void 0 || f.color === this._color);
  };
  function c(f) {
    f = f || {}, this._breakType = f.breakType;
  }
  c.prototype.matches = function(f) {
    return f.type === "break" && (this._breakType === void 0 || f.breakType === this._breakType);
  };
  function o(f, m, D) {
    return f.numbering && f.numbering.level == m && f.numbering.isOrdered == D;
  }
  function u(f) {
    return { operator: h, operand: f };
  }
  function s(f) {
    return { operator: g, operand: f };
  }
  function h(f, m) {
    return f.toUpperCase() === m.toUpperCase();
  }
  function g(f, m) {
    return m.toUpperCase().indexOf(f.toUpperCase()) === 0;
  }
  return Ne;
}
var xr = {}, So;
function ql() {
  if (So) return xr;
  So = 1;
  var e = Us(), n = e.RegexTokeniser;
  xr.tokenise = t;
  var i = "'((?:\\\\.|[^'])*)";
  function t(r) {
    var a = "(?:[a-zA-Z\\-_]|\\\\.)", c = new n([{ name: "identifier", regex: new RegExp("(" + a + "(?:" + a + "|[0-9])*)") }, { name: "dot", regex: /\./ }, { name: "colon", regex: /:/ }, { name: "gt", regex: />/ }, { name: "whitespace", regex: /\s+/ }, { name: "arrow", regex: /=>/ }, { name: "equals", regex: /=/ }, { name: "startsWith", regex: /\^=/ }, { name: "open-paren", regex: /\(/ }, { name: "close-paren", regex: /\)/ }, { name: "open-square-bracket", regex: /\[/ }, { name: "close-square-bracket", regex: /\]/ }, { name: "string", regex: new RegExp(i + "'") }, { name: "unterminated-string", regex: new RegExp(i) }, { name: "integer", regex: /([0-9]+)/ }, { name: "choice", regex: /\|/ }, { name: "bang", regex: /(!)/ }]);
    return c.tokenise(r);
  }
  return xr;
}
var Ro;
function Ml() {
  if (Ro) return Zn;
  Ro = 1;
  var e = Be, n = Us(), i = Ll(), t = Di(), r = ql().tokenise, a = cn();
  Zn.readHtmlPath = h, Zn.readDocumentMatcher = u, Zn.readStyle = c;
  function c(C) {
    return w(_, C);
  }
  function o() {
    return n.rules.sequence(n.rules.sequence.capture(s()), n.rules.tokenOfType("whitespace"), n.rules.tokenOfType("arrow"), n.rules.sequence.capture(n.rules.optional(n.rules.sequence(n.rules.tokenOfType("whitespace"), n.rules.sequence.capture(g())).head())), n.rules.tokenOfType("end")).map(function(C, E) {
      return { from: C, to: E.valueOrElse(t.empty) };
    });
  }
  function u(C) {
    return w(s(), C);
  }
  function s() {
    var C = n.rules.sequence, E = function(he, ve) {
      return n.rules.then(n.rules.token("identifier", he), function() {
        return ve;
      });
    }, S = E("p", i.paragraph), X = E("r", i.run), A = n.rules.firstOf("p or r or table", S, X), R = n.rules.sequence(n.rules.tokenOfType("dot"), n.rules.sequence.cut(), n.rules.sequence.capture(f)).map(function(he) {
      return { styleId: he };
    }), M = n.rules.firstOf("style name matcher", n.rules.then(n.rules.sequence(n.rules.tokenOfType("equals"), n.rules.sequence.cut(), n.rules.sequence.capture(D)).head(), function(he) {
      return { styleName: i.equalTo(he) };
    }), n.rules.then(n.rules.sequence(n.rules.tokenOfType("startsWith"), n.rules.sequence.cut(), n.rules.sequence.capture(D)).head(), function(he) {
      return { styleName: i.startsWith(he) };
    })), H = n.rules.sequence(n.rules.tokenOfType("open-square-bracket"), n.rules.sequence.cut(), n.rules.token("identifier", "style-name"), n.rules.sequence.capture(M), n.rules.tokenOfType("close-square-bracket")).head(), F = n.rules.firstOf("list type", E("ordered-list", { isOrdered: true }), E("unordered-list", { isOrdered: false })), B = C(n.rules.tokenOfType("colon"), C.capture(F), C.cut(), n.rules.tokenOfType("open-paren"), C.capture(m), n.rules.tokenOfType("close-paren")).map(function(he, ve) {
      return { list: { isOrdered: he.isOrdered, levelIndex: ve - 1 } };
    });
    function O(he) {
      var ve = n.rules.firstOf.apply(n.rules.firstOf, ["matcher suffix"].concat(he)), Fe = n.rules.zeroOrMore(ve);
      return n.rules.then(Fe, function(Se) {
        var V = {};
        return Se.forEach(function(J) {
          e.extend(V, J);
        }), V;
      });
    }
    var P = C(C.capture(A), C.capture(O([R, H, B]))).map(function(he, ve) {
      return he(ve);
    }), z = C(n.rules.token("identifier", "table"), C.capture(O([R, H]))).map(function(he) {
      return i.table(he);
    }), j = E("b", i.bold), te = E("i", i.italic), I = E("u", i.underline), K = E("strike", i.strikethrough), ie = E("all-caps", i.allCaps), re = E("small-caps", i.smallCaps), ee = C(n.rules.token("identifier", "highlight"), n.rules.sequence.capture(n.rules.optional(n.rules.sequence(n.rules.tokenOfType("open-square-bracket"), n.rules.sequence.cut(), n.rules.token("identifier", "color"), n.rules.tokenOfType("equals"), n.rules.sequence.capture(D), n.rules.tokenOfType("close-square-bracket")).head()))).map(function(he) {
      return i.highlight({ color: he.valueOrElse(void 0) });
    }), de = E("comment-reference", i.commentReference), De = C(n.rules.token("identifier", "br"), C.cut(), n.rules.tokenOfType("open-square-bracket"), n.rules.token("identifier", "type"), n.rules.tokenOfType("equals"), C.capture(D), n.rules.tokenOfType("close-square-bracket")).map(function(he) {
      switch (he) {
        case "line":
          return i.lineBreak;
        case "page":
          return i.pageBreak;
        case "column":
          return i.columnBreak;
      }
    });
    return n.rules.firstOf("element type", P, z, j, te, I, K, ie, re, ee, de, De);
  }
  function h(C) {
    return w(g(), C);
  }
  function g() {
    var C = n.rules.sequence.capture, E = n.rules.tokenOfType("whitespace"), S = n.rules.then(n.rules.optional(n.rules.sequence(n.rules.tokenOfType("colon"), n.rules.token("identifier", "fresh"))), function(M) {
      return M.map(function() {
        return true;
      }).valueOrElse(false);
    }), X = n.rules.then(n.rules.optional(n.rules.sequence(n.rules.tokenOfType("colon"), n.rules.token("identifier", "separator"), n.rules.tokenOfType("open-paren"), C(D), n.rules.tokenOfType("close-paren")).head()), function(M) {
      return M.valueOrElse("");
    }), A = n.rules.oneOrMoreWithSeparator(f, n.rules.tokenOfType("choice")), R = n.rules.sequence(C(A), C(n.rules.zeroOrMore(y)), C(S), C(X)).map(function(M, H, F, B) {
      var O = {}, P = {};
      return H.forEach(function(z) {
        z.append && O[z.name] ? O[z.name] += " " + z.value : O[z.name] = z.value;
      }), F && (P.fresh = true), B && (P.separator = B), t.element(M, O, P);
    });
    return n.rules.firstOf("html path", n.rules.then(n.rules.tokenOfType("bang"), function() {
      return t.ignore;
    }), n.rules.then(n.rules.zeroOrMoreWithSeparator(R, n.rules.sequence(E, n.rules.tokenOfType("gt"), E)), t.elements));
  }
  var f = n.rules.then(n.rules.tokenOfType("identifier"), d), m = n.rules.tokenOfType("integer"), D = n.rules.then(n.rules.tokenOfType("string"), d), b = { n: `
`, r: "\r", t: "	" };
  function d(C) {
    return C.replace(/\\(.)/g, function(E, S) {
      return b[S] || S;
    });
  }
  var p = n.rules.sequence(n.rules.tokenOfType("open-square-bracket"), n.rules.sequence.cut(), n.rules.sequence.capture(f), n.rules.tokenOfType("equals"), n.rules.sequence.capture(D), n.rules.tokenOfType("close-square-bracket")).map(function(C, E) {
    return { name: C, value: E, append: false };
  }), l = n.rules.sequence(n.rules.tokenOfType("dot"), n.rules.sequence.cut(), n.rules.sequence.capture(f)).map(function(C) {
    return { name: "class", value: C, append: true };
  }), y = n.rules.firstOf("attribute or class", p, l);
  function w(C, E) {
    var S = r(E), X = n.Parser(), A = X.parseTokens(C, S);
    return A.isSuccess() ? a.success(A.value()) : new a.Result(null, [a.warning(T(E, A))]);
  }
  function T(C, E) {
    return "Did not understand this style mapping, so ignored it: " + C + `
` + E.errors().map(x).join(`
`);
  }
  function x(C) {
    return "Error was at character number " + C.characterNumber() + ": Expected " + C.expected + " but got " + C.actual;
  }
  var _ = o();
  return Zn;
}
var Kn = {}, No;
function Pl() {
  if (No) return Kn;
  No = 1, Kn.readOptions = t;
  var e = Be, n = Kn._defaultStyleMap = ["p.Heading1 => h1:fresh", "p.Heading2 => h2:fresh", "p.Heading3 => h3:fresh", "p.Heading4 => h4:fresh", "p.Heading5 => h5:fresh", "p.Heading6 => h6:fresh", "p[style-name='Heading 1'] => h1:fresh", "p[style-name='Heading 2'] => h2:fresh", "p[style-name='Heading 3'] => h3:fresh", "p[style-name='Heading 4'] => h4:fresh", "p[style-name='Heading 5'] => h5:fresh", "p[style-name='Heading 6'] => h6:fresh", "p[style-name='heading 1'] => h1:fresh", "p[style-name='heading 2'] => h2:fresh", "p[style-name='heading 3'] => h3:fresh", "p[style-name='heading 4'] => h4:fresh", "p[style-name='heading 5'] => h5:fresh", "p[style-name='heading 6'] => h6:fresh", "p.Heading => h1:fresh", "p[style-name='Heading'] => h1:fresh", "r[style-name='Strong'] => strong", "p[style-name='footnote text'] => p:fresh", "r[style-name='footnote reference'] =>", "p[style-name='endnote text'] => p:fresh", "r[style-name='endnote reference'] =>", "p[style-name='annotation text'] => p:fresh", "r[style-name='annotation reference'] =>", "p[style-name='Footnote'] => p:fresh", "r[style-name='Footnote anchor'] =>", "p[style-name='Endnote'] => p:fresh", "r[style-name='Endnote anchor'] =>", "p:unordered-list(1) => ul > li:fresh", "p:unordered-list(2) => ul|ol > li > ul > li:fresh", "p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh", "p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh", "p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh", "p:ordered-list(1) => ol > li:fresh", "p:ordered-list(2) => ul|ol > li > ol > li:fresh", "p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh", "p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh", "p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh", "r[style-name='Hyperlink'] =>", "p[style-name='Normal'] => p:fresh", "p.Body => p:fresh", "p[style-name='Body'] => p:fresh"], i = Kn._standardOptions = { externalFileAccess: false, transformDocument: a, includeDefaultStyleMap: true, includeEmbeddedStyleMap: true };
  function t(c) {
    return c = c || {}, e.extend({}, i, c, { customStyleMap: r(c.styleMap), readStyleMap: function() {
      var o = this.customStyleMap;
      return this.includeEmbeddedStyleMap && (o = o.concat(r(this.embeddedStyleMap))), this.includeDefaultStyleMap && (o = o.concat(n)), o;
    } });
  }
  function r(c) {
    return c ? e.isString(c) ? c.split(`
`).map(function(o) {
      return o.trim();
    }).filter(function(o) {
      return o !== "" && o.charAt(0) !== "#";
    }) : c : [];
  }
  function a(c) {
    return c;
  }
  return Kn;
}
var Ur = {}, ko;
function Xl() {
  if (ko) return Ur;
  ko = 1;
  var e = mn(), n = ds();
  Ur.openZip = i;
  function i(t) {
    return t.arrayBuffer ? e.resolve(n.openArrayBuffer(t.arrayBuffer)) : e.reject(new Error("Could not find file in options"));
  }
  return Ur;
}
var Tr = {}, Oo;
function jl() {
  if (Oo) return Tr;
  Oo = 1;
  var e = Di(), n = bi();
  Tr.element = i;
  function i(t) {
    return function(r) {
      return n.elementWithTag(e.element(t), [r]);
    };
  }
  return Tr;
}
var Io;
function Vl() {
  if (Io) return ze;
  Io = 1;
  var e = Be, n = _l(), i = El(), t = Wl().DocumentConverter, r = Bl().convertElementToRawText, a = Ml().readStyle, c = Pl().readOptions, o = Xl(), u = cn().Result;
  ze.convertToHtml = s, ze.convertToMarkdown = h, ze.convert = g, ze.extractRawText = b, ze.images = bs(), ze.transforms = ps(), ze.underline = jl(), ze.embedStyleMap = d, ze.readEmbeddedStyleMap = f;
  function s(p, l) {
    return g(p, l);
  }
  function h(p, l) {
    var y = Object.create(l || {});
    return y.outputFormat = "markdown", g(p, y);
  }
  function g(p, l) {
    return l = c(l), o.openZip(p).tap(function(y) {
      return i.readStyleMap(y).then(function(w) {
        l.embeddedStyleMap = w;
      });
    }).then(function(y) {
      return n.read(y, p, l).then(function(w) {
        return w.map(l.transformDocument);
      }).then(function(w) {
        return m(w, l);
      });
    });
  }
  function f(p) {
    return o.openZip(p).then(i.readStyleMap);
  }
  function m(p, l) {
    var y = D(l.readStyleMap()), w = e.extend({}, l, { styleMap: y.value }), T = new t(w);
    return p.flatMapThen(function(x) {
      return y.flatMapThen(function(_) {
        return T.convertToHtml(x);
      });
    });
  }
  function D(p) {
    return u.combine((p || []).map(a)).map(function(l) {
      return l.filter(function(y) {
        return !!y;
      });
    });
  }
  function b(p) {
    return o.openZip(p).then(n.read).then(function(l) {
      return l.map(r);
    });
  }
  function d(p, l) {
    return o.openZip(p).tap(function(y) {
      return i.writeStyleMap(y, l);
    }).then(function(y) {
      return y.toArrayBuffer();
    }).then(function(y) {
      return { toArrayBuffer: function() {
        return y;
      }, toBuffer: function() {
        return _r.from(y);
      } };
    });
  }
  return ze.styleMapping = function() {
    throw new Error(`Use a raw string instead of mammoth.styleMapping e.g. "p[style-name='Title'] => h1" instead of mammoth.styleMapping("p[style-name='Title'] => h1")`);
  }, ze;
}
var Ts = Vl();
const Hl = ws(Ts), Gl = Fs({ __proto__: null, default: Hl }, [Ts]);
export {
  Gl as i
};
