var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
import { p as yt, B as Fs, __tla as __tla_0 } from "./index-adT2nIe5.js";
let Rt, Dt, O, R, Ft, Ms, Lt, st, cn, vt, Ie, lt, nt, he, ke, as, ot, de, Pt, Ri, ls, ht, Wi, Vi, Qt, As, Me, Gt, hs, mt, Be, T, Le, pi, dn, Ar, ci, ge, un, fr, rn, an, be, ui, on, Oe, ws, _n, fi, ys, os, St, sn, mi, Ot, L, K, di, yr;
let __tla = Promise.all([
  (() => {
    try {
      return __tla_0;
    } catch {
    }
  })()
]).then(async () => {
  var _T_static, _a, t_fn, e_fn, _b, _c, _t2, _t3, _e2, _i2, _s2, _a2, _r2, _n2, _fn_instances, o_fn, h_fn, l_fn, u_fn, d_fn, _t4, _e3, _i3, _s3, _a3, _r3, _n3, _o, _h, _le_static, l_fn2, _le_instances, u_fn2, d_fn2, f_fn, m_get, _t5, _e4, _i4, _pn_instances, s_fn, a_fn, r_fn, _t6, _e5, _i5, _s4, _t7, _t8, _e6, _i6, _vs_instances, s_fn2, _t9, _e7, _i7, _s5, _ye_instances, t_fn2, _t10, _e8, _i8, _s6, _a4, _r4, _n4, _o2, _h2, _l, _u, _d, _f, _m, _g, _c2, _p, _b2, _A, _y, _C, _E, _v, _x, _w, __, _M, _P, _k, _O, _I, _R, _B, _F, _G, _T, _S, _L, _U, _$, _X, _W, _Y, _j, _N, _V, _J, _Z, _H2, _d2, _Ft_instances, Q_fn, tt_fn, nt_fn, rt_fn, at_fn, q_fn, ot_fn, lt_fn, ht_fn, et_fn, ct_fn, dt_fn, ut_fn, ft_fn, D_fn, z_fn, pt_fn, gt_fn, st_fn, mt_get, K_fn, it_fn, _t11, _e9, _i9, _s7, _a5, _r5, _n5, _o3, _h3, _l2, _u2, _d3, _f2, _xt_instances, m_get2, g_fn, _t12, _e10, _i10, _s8, _a6, _r6, _n6, _o4, _h4, _l3, _we_instances, u_fn3, _t13, _e11, _i11, _s9, _a7, _r7, _n7, _o5, _h5, _l4, _u3, _d4, _Be_instances, f_fn2, m_fn, g_fn2, _e12, _t14, _e13, _i12, _s10, _a8, _r8, _n8, _o6, _h6, _l5, _u4, _d5, _f3, _m2, _g2, _c3, _p2, _b3, _A2, _y2, _C2, _E2, _v2, _x2, _w2, __2, _D_instances, M_fn, _D_static, P_fn, k_fn, O_fn, I_fn, R_fn, B_fn, F_fn, G_fn, T_fn, S_fn, L_fn, U_fn, $_fn, X_fn, W_fn, Y_fn, j_fn, N_fn, _t15, _e14, _i13, _s11, _Es_instances, a_fn2, _t16, _t17, _t18, _t19, _e15, _i14, _Yt_instances, s_fn3, _t20, _e16, _i15, _qt_instances, s_fn4, _t21, _e17, _i16, _s12, _a9, _r9, _n9, _o7, _G_instances, h_fn2, l_fn3, u_fn4, _t22, _e18, _i17, _s13, _a10, _r10, _n10, _o8, _t23, _t24, _e19, _t25, _ae_instances, e_fn2, i_fn, s_fn5, a_fn3, _t26, _t27, _e20, _i18, _s14, _a11, _r11, _n11, _xn_instances, o_get, h_get, l_get, u_fn5, d_fn3, f_fn3, m_fn2, g_fn3, c_fn, p_fn, b_fn, A_fn, _t28, _e21, _t29, _e22, _i19, _s15, _a12, _r12, _n12, _o9, _h7, _l6, _u5, _d6, _f4, _m3, _g3, _c4, _p3, _Rn_instances, b_fn2, _t30, _e23, _i20, _s16, _a13, _Kt_instances, t_fn3, e_fn3, i_fn2, _f5, _t31, _e24, _t32, _e25, _t33, _e26, _i21, _s17, _t34, _e27, _i22, _s18, _qn_instances, a_fn4, _t35, _e28, _Kn_instances, t_fn4, _t36, _t37, _t38, _nr_instances, e_fn4, i_fn3, _t39, _rr_instances, e_fn5, i_fn4, s_fn6, a_fn5, _t40, _ar_instances, e_fn6, i_fn5, s_fn7, _t41, _Li_instances, e_fn7, _g4, _t42, _e29, _i23, _s19, _a14, _r13, _n13, _o10, _h8, _l7, _u6, _d7, _f6, _m4, _g5, _c5, _p4, _b4, _h9, _A3, _y3, _C3, _E3, _v3, _mt_instances, x_fn, w_fn, __fn, _mt_static, M_fn2, P_fn2, k_fn2, O_fn2, _t43, _t44, _e30, _i24, _s20, _i25, _t45, _e31, _gr_instances, i_fn6, _t46, _e32, _i26, _s21, _j2, _a15, _r14, _n14, __this_instances, o_fn2, h_fn3, l_fn4, u_fn6, __this_static, d_get, _t47, _e33, _i27, _s22, _a16, _r15, _n15, _o11, _mr_instances, h_fn4, l_fn5, u_fn7, _t48, _e34, _t49, _e35, _i28, _s23, _a17, _r16, _n16, _o12, _h10, _l8, _k2, _u7, _vt_instances, d_fn4, f_fn4, m_fn3, g_fn4, c_fn2, p_get, _t50, _e36, _i29, _s24, _t51, _e37, _i30, _q_instances, s_fn8, _Ps_instances, t_fn5, e_fn8, i_fn7, _ps_instances, t_fn6, _t52, _e38, _i31, _s25, _a18, _r17, _n17, _o13, _h11, _l9, _u8, _d8, _f7, _m5, _g6, _c6, _p5, _b5, _A4, _y4, _C4, _E4, _v4, _x3, _w3, __3, _Mr_instances, M_fn3, P_fn3, k_fn3, O_fn3, I_get, R_get, B_get, F_fn2, G_fn2, T_fn2, S_fn2, L_fn2, U_fn2, _t53, _t54, _t55, _t56, _t57, _e39, _ks_instances, i_fn8, _t58, _Ur_instances, e_fn9, _t59, _e40, _i32, _s26, _a19, _r18, _n18, _o14, _Ms_instances, h_fn5, l_fn6, _l10, _t60, _e41, _i33, _s27, _at_instances, a_fn6, r_fn2, n_fn, o_fn3, _at_static, h_fn6, l_fn7, u_fn8, d_fn5, f_fn5, _t61, _e42, _i34, _s28, _a20, _r19, _n19, _o15, _h12, _l11, _u9, _d9, _f8, _m6, _g7, _c7, _Nt_instances, p_fn2, b_fn3, A_fn2, y_fn, C_fn, E_fn, v_fn, _t62, _e43, _i35, _s29, _a21, _r20, _n20, _Hi_instances, o_fn4, _t63, _e44, _i36, _s30, _a22, _gs_instances, r_fn3, n_fn2, o_fn5, h_fn7, l_fn8, _t64, _e45, _t65, _e46, _i37, _s31, _a23, _r21, _n21, _o16, _h13, _l12, _u10, _d10, _f9, _m7, _g8, _c8, _p6, _b6, _Q_instances, A_fn3, y_fn2, C_fn2, E_fn2, v_fn2, x_fn2, w_fn2, _Q_static, __fn2, M_fn4, P_fn4, k_fn4, O_fn4, I_fn2, R_fn2, B_fn2, F_fn3, _t66, _t67, _e47, _i38, _s32, _a24, _U_instances, r_fn4, n_fn3, o_fn6, h_fn8, l_fn9, u_fn9, d_fn6, f_fn6, _t68, _e48, _i39, _s33, _a25, _r22, _n22, _o17, _h14, _l13, _u11, _jr_instances, d_fn7, _t69, _e49, _i40, _s34, _a26, _r23, _n23, _o18, _h15, _Ae_instances, l_fn10, u_fn10, d_fn8, f_fn7, _Ds_instances, t_fn7, _m8, _t70, _Gt_static, e_fn10, _i41, s_fn9, a_fn7, r_fn5, n_fn4, o_fn7, h_fn9, l_fn11, u_fn11, d_fn9, f_fn8, _t71, _e50, _i42, _s35, _t72, _e51, _i43, _s36, _a27, _r24, _n24, _o19, _h16, _l14, _u12, _zr_instances, d_fn10, f_fn9, m_fn4, g_fn5, c_fn3, p_fn3, b_fn4, A_fn4, _t73, _e52, _i44, _s37, _a28, _r25, _n25, _o20, _h17, _l15, _u13, _d11, _f10, _m9, _g9, _c9, _n26, _p7, _Dt_instances, b_get, A_fn5, y_get, C_fn3, E_fn3, v_fn3, _t74, _e53, _i45, _o21, _s38, _lt_static, a_fn8, _lt_instances, r_fn6, n_fn5, o_fn8;
  let dt, is, qe, gt, ce, ns, it, jt, ee;
  dt = typeof yt == "object" && yt + "" == "[object process]" && !yt.versions.nw && !(yt.versions.electron && yt.type && yt.type !== "browser");
  is = [
    1e-3,
    0,
    0,
    1e-3,
    0,
    0
  ];
  qe = 1.35;
  gt = {
    ANY: 1,
    DISPLAY: 2,
    PRINT: 4,
    ANNOTATIONS_FORMS: 16,
    ANNOTATIONS_STORAGE: 32,
    ANNOTATIONS_DISABLE: 64,
    IS_EDITING: 128,
    OPLIST: 256
  };
  Lt = {
    DISABLE: 0,
    ENABLE: 1,
    ENABLE_FORMS: 2,
    ENABLE_STORAGE: 3
  };
  ce = "pdfjs_internal_editor_";
  R = {
    DISABLE: -1,
    NONE: 0,
    FREETEXT: 3,
    HIGHLIGHT: 9,
    STAMP: 13,
    INK: 15,
    POPUP: 16,
    SIGNATURE: 101,
    COMMENT: 102
  };
  O = {
    RESIZE: 1,
    CREATE: 2,
    FREETEXT_SIZE: 11,
    FREETEXT_COLOR: 12,
    FREETEXT_OPACITY: 13,
    INK_COLOR: 21,
    INK_THICKNESS: 22,
    INK_OPACITY: 23,
    HIGHLIGHT_COLOR: 31,
    HIGHLIGHT_THICKNESS: 32,
    HIGHLIGHT_FREE: 33,
    HIGHLIGHT_SHOW_ALL: 34,
    DRAW_STEP: 41
  };
  Vi = {
    PRINT: 4,
    MODIFY_CONTENTS: 8,
    COPY: 16,
    MODIFY_ANNOTATIONS: 32,
    FILL_INTERACTIVE_FORMS: 256,
    COPY_FOR_ACCESSIBILITY: 512,
    ASSEMBLE: 1024,
    PRINT_HIGH_QUALITY: 2048
  };
  ns = {
    TRIANGLES: 1,
    LATTICE: 2
  };
  it = {
    FILL: 0,
    STROKE: 1,
    FILL_STROKE: 2,
    INVISIBLE: 3,
    FILL_STROKE_MASK: 3,
    ADD_TO_PATH_FLAG: 4
  };
  ke = {
    GRAYSCALE_1BPP: 1,
    RGB_24BPP: 2,
    RGBA_32BPP: 3
  };
  st = {
    TEXT: 1,
    LINK: 2,
    FREETEXT: 3,
    LINE: 4,
    SQUARE: 5,
    CIRCLE: 6,
    POLYGON: 7,
    POLYLINE: 8,
    HIGHLIGHT: 9,
    UNDERLINE: 10,
    SQUIGGLY: 11,
    STRIKEOUT: 12,
    STAMP: 13,
    CARET: 14,
    INK: 15,
    POPUP: 16,
    FILEATTACHMENT: 17,
    SOUND: 18,
    MOVIE: 19,
    WIDGET: 20,
    SCREEN: 21,
    PRINTERMARK: 22,
    TRAPNET: 23,
    WATERMARK: 24,
    THREED: 25,
    REDACT: 26
  };
  jt = {
    SOLID: 1,
    DASHED: 2,
    BEVELED: 3,
    INSET: 4,
    UNDERLINE: 5
  };
  Le = {
    ERRORS: 0,
    WARNINGS: 1,
    INFOS: 5
  };
  de = {
    dependency: 1,
    setLineWidth: 2,
    setLineCap: 3,
    setLineJoin: 4,
    setMiterLimit: 5,
    setDash: 6,
    setRenderingIntent: 7,
    setFlatness: 8,
    setGState: 9,
    save: 10,
    restore: 11,
    transform: 12,
    moveTo: 13,
    lineTo: 14,
    curveTo: 15,
    curveTo2: 16,
    curveTo3: 17,
    closePath: 18,
    rectangle: 19,
    stroke: 20,
    closeStroke: 21,
    fill: 22,
    eoFill: 23,
    fillStroke: 24,
    eoFillStroke: 25,
    closeFillStroke: 26,
    closeEOFillStroke: 27,
    endPath: 28,
    clip: 29,
    eoClip: 30,
    beginText: 31,
    endText: 32,
    setCharSpacing: 33,
    setWordSpacing: 34,
    setHScale: 35,
    setLeading: 36,
    setFont: 37,
    setTextRenderingMode: 38,
    setTextRise: 39,
    moveText: 40,
    setLeadingMoveText: 41,
    setTextMatrix: 42,
    nextLine: 43,
    showText: 44,
    showSpacedText: 45,
    nextLineShowText: 46,
    nextLineSetSpacingShowText: 47,
    setCharWidth: 48,
    setCharWidthAndBounds: 49,
    setStrokeColorSpace: 50,
    setFillColorSpace: 51,
    setStrokeColor: 52,
    setStrokeColorN: 53,
    setFillColor: 54,
    setFillColorN: 55,
    setStrokeGray: 56,
    setFillGray: 57,
    setStrokeRGBColor: 58,
    setFillRGBColor: 59,
    setStrokeCMYKColor: 60,
    setFillCMYKColor: 61,
    shadingFill: 62,
    beginInlineImage: 63,
    beginImageData: 64,
    endInlineImage: 65,
    paintXObject: 66,
    markPoint: 67,
    markPointProps: 68,
    beginMarkedContent: 69,
    beginMarkedContentProps: 70,
    endMarkedContent: 71,
    beginCompat: 72,
    endCompat: 73,
    paintFormXObjectBegin: 74,
    paintFormXObjectEnd: 75,
    beginGroup: 76,
    endGroup: 77,
    beginAnnotation: 80,
    endAnnotation: 81,
    paintImageMaskXObject: 83,
    paintImageMaskXObjectGroup: 84,
    paintImageXObject: 85,
    paintInlineImageXObject: 86,
    paintInlineImageXObjectGroup: 87,
    paintImageXObjectRepeat: 88,
    paintImageMaskXObjectRepeat: 89,
    paintSolidColorImageMask: 90,
    constructPath: 91,
    setStrokeTransparent: 92,
    setFillTransparent: 93,
    rawFillPath: 94
  };
  ee = {
    moveTo: 0,
    lineTo: 1,
    curveTo: 2,
    quadraticCurveTo: 3,
    closePath: 4
  };
  Wi = {
    NEED_PASSWORD: 1,
    INCORRECT_PASSWORD: 2
  };
  let Re = Le.WARNINGS;
  function Xi(d) {
    Number.isInteger(d) && (Re = d);
  }
  function Yi() {
    return Re;
  }
  function Fe(d) {
    Re >= Le.INFOS && console.info(`Info: ${d}`);
  }
  function F(d) {
    Re >= Le.WARNINGS && console.warn(`Warning: ${d}`);
  }
  function $(d) {
    throw new Error(d);
  }
  function B(d, t) {
    d || $(t);
  }
  function qi(d) {
    switch (d == null ? void 0 : d.protocol) {
      case "http:":
      case "https:":
      case "ftp:":
      case "mailto:":
      case "tel:":
        return true;
      default:
        return false;
    }
  }
  ci = function(d, t = null, e = null) {
    var _a29;
    if (!d) return null;
    if (e && typeof d == "string" && (e.addDefaultProtocol && d.startsWith("www.") && ((_a29 = d.match(/\./g)) == null ? void 0 : _a29.length) >= 2 && (d = `http://${d}`), e.tryConvertEncoding)) try {
      d = en(d);
    } catch {
    }
    const s = t ? URL.parse(d, t) : URL.parse(d);
    return qi(s) ? s : null;
  };
  di = function(d, t, e = false) {
    const s = URL.parse(d);
    return s ? (s.hash = t, s.href) : e && ci(d, "http://example.com") ? d.split("#", 1)[0] + `${t ? `#${t}` : ""}` : "";
  };
  function rs(d) {
    return d.substring(d.lastIndexOf("/") + 1);
  }
  L = function(d, t, e, s = false) {
    return Object.defineProperty(d, t, {
      value: e,
      enumerable: !s,
      configurable: true,
      writable: false
    }), e;
  };
  const Ut = (function() {
    function t(e, s) {
      this.message = e, this.name = s;
    }
    return t.prototype = new Error(), t.constructor = t, t;
  })();
  class Ns extends Ut {
    constructor(t, e) {
      super(t, "PasswordException"), this.code = e;
    }
  }
  class Ke extends Ut {
    constructor(t, e) {
      super(t, "UnknownErrorException"), this.details = e;
    }
  }
  as = class extends Ut {
    constructor(t) {
      super(t, "InvalidPDFException");
    }
  };
  Me = class extends Ut {
    constructor(t, e, s) {
      super(t, "ResponseException"), this.status = e, this.missing = s;
    }
  };
  class Ki extends Ut {
    constructor(t) {
      super(t, "FormatError");
    }
  }
  Rt = class extends Ut {
    constructor(t) {
      super(t, "AbortException");
    }
  };
  function Qi(d) {
    (typeof d != "object" || (d == null ? void 0 : d.length) === void 0) && $("Invalid argument for bytesToString");
    const t = d.length, e = 8192;
    if (t < e) return String.fromCharCode.apply(null, d);
    const s = [];
    for (let i = 0; i < t; i += e) {
      const n = Math.min(i + e, t), r = d.subarray(i, n);
      s.push(String.fromCharCode.apply(null, r));
    }
    return s.join("");
  }
  function Ne(d) {
    typeof d != "string" && $("Invalid argument for stringToBytes");
    const t = d.length, e = new Uint8Array(t);
    for (let s = 0; s < t; ++s) e[s] = d.charCodeAt(s) & 255;
    return e;
  }
  function Ji(d) {
    return String.fromCharCode(d >> 24 & 255, d >> 16 & 255, d >> 8 & 255, d & 255);
  }
  function Zi() {
    const d = new Uint8Array(4);
    return d[0] = 1, new Uint32Array(d.buffer, 0, 1)[0] === 1;
  }
  function tn() {
    try {
      return new Function(""), true;
    } catch {
      return false;
    }
  }
  nt = class {
    static get isLittleEndian() {
      return L(this, "isLittleEndian", Zi());
    }
    static get isEvalSupported() {
      return L(this, "isEvalSupported", tn());
    }
    static get isOffscreenCanvasSupported() {
      return L(this, "isOffscreenCanvasSupported", typeof OffscreenCanvas < "u");
    }
    static get isImageDecoderSupported() {
      return L(this, "isImageDecoderSupported", typeof ImageDecoder < "u");
    }
    static get isFloat16ArraySupported() {
      return L(this, "isFloat16ArraySupported", typeof Float16Array < "u");
    }
    static get isSanitizerSupported() {
      return L(this, "isSanitizerSupported", typeof Sanitizer < "u");
    }
    static get platform() {
      const { platform: t, userAgent: e } = navigator;
      return L(this, "platform", {
        isAndroid: e.includes("Android"),
        isLinux: t.includes("Linux"),
        isMac: t.includes("Mac"),
        isWindows: t.includes("Win"),
        isFirefox: e.includes("Firefox")
      });
    }
    static get isCSSRoundSupported() {
      var _a29, _b7;
      return L(this, "isCSSRoundSupported", (_b7 = (_a29 = globalThis.CSS) == null ? void 0 : _a29.supports) == null ? void 0 : _b7.call(_a29, "width: round(1.5px, 1px)"));
    }
  };
  const Qe = Array.from(Array(256).keys(), (d) => d.toString(16).padStart(2, "0"));
  T = (_a = class {
    static makeHexColor(t, e, s) {
      return `#${Qe[t]}${Qe[e]}${Qe[s]}`;
    }
    static domMatrixToTransform(t) {
      return [
        t.a,
        t.b,
        t.c,
        t.d,
        t.e,
        t.f
      ];
    }
    static scaleMinMax(t, e) {
      let s;
      t[0] ? (t[0] < 0 && (s = e[0], e[0] = e[2], e[2] = s), e[0] *= t[0], e[2] *= t[0], t[3] < 0 && (s = e[1], e[1] = e[3], e[3] = s), e[1] *= t[3], e[3] *= t[3]) : (s = e[0], e[0] = e[1], e[1] = s, s = e[2], e[2] = e[3], e[3] = s, t[1] < 0 && (s = e[1], e[1] = e[3], e[3] = s), e[1] *= t[1], e[3] *= t[1], t[2] < 0 && (s = e[0], e[0] = e[2], e[2] = s), e[0] *= t[2], e[2] *= t[2]), e[0] += t[4], e[1] += t[5], e[2] += t[4], e[3] += t[5];
    }
    static transform(t, e) {
      return [
        t[0] * e[0] + t[2] * e[1],
        t[1] * e[0] + t[3] * e[1],
        t[0] * e[2] + t[2] * e[3],
        t[1] * e[2] + t[3] * e[3],
        t[0] * e[4] + t[2] * e[5] + t[4],
        t[1] * e[4] + t[3] * e[5] + t[5]
      ];
    }
    static multiplyByDOMMatrix(t, e) {
      return [
        t[0] * e.a + t[2] * e.b,
        t[1] * e.a + t[3] * e.b,
        t[0] * e.c + t[2] * e.d,
        t[1] * e.c + t[3] * e.d,
        t[0] * e.e + t[2] * e.f + t[4],
        t[1] * e.e + t[3] * e.f + t[5]
      ];
    }
    static applyTransform(t, e, s = 0) {
      const i = t[s], n = t[s + 1];
      t[s] = i * e[0] + n * e[2] + e[4], t[s + 1] = i * e[1] + n * e[3] + e[5];
    }
    static applyTransformToBezier(t, e, s = 0) {
      const i = e[0], n = e[1], r = e[2], a = e[3], o = e[4], l = e[5];
      for (let h = 0; h < 6; h += 2) {
        const c = t[s + h], u = t[s + h + 1];
        t[s + h] = c * i + u * r + o, t[s + h + 1] = c * n + u * a + l;
      }
    }
    static applyInverseTransform(t, e) {
      const s = t[0], i = t[1], n = e[0] * e[3] - e[1] * e[2];
      t[0] = (s * e[3] - i * e[2] + e[2] * e[5] - e[4] * e[3]) / n, t[1] = (-s * e[1] + i * e[0] + e[4] * e[1] - e[5] * e[0]) / n;
    }
    static axialAlignedBoundingBox(t, e, s) {
      const i = e[0], n = e[1], r = e[2], a = e[3], o = e[4], l = e[5], h = t[0], c = t[1], u = t[2], f = t[3];
      let g = i * h + o, p = g, b = i * u + o, m = b, A = a * c + l, y = A, v = a * f + l, w = v;
      if (n !== 0 || r !== 0) {
        const S = n * h, E = n * u, _ = r * c, C = r * f;
        g += _, m += _, b += C, p += C, A += S, w += S, v += E, y += E;
      }
      s[0] = Math.min(s[0], g, b, p, m), s[1] = Math.min(s[1], A, v, y, w), s[2] = Math.max(s[2], g, b, p, m), s[3] = Math.max(s[3], A, v, y, w);
    }
    static inverseTransform(t) {
      const e = t[0] * t[3] - t[1] * t[2];
      return [
        t[3] / e,
        -t[1] / e,
        -t[2] / e,
        t[0] / e,
        (t[2] * t[5] - t[4] * t[3]) / e,
        (t[4] * t[1] - t[5] * t[0]) / e
      ];
    }
    static singularValueDecompose2dScale(t, e) {
      const s = t[0], i = t[1], n = t[2], r = t[3], a = s ** 2 + i ** 2, o = s * n + i * r, l = n ** 2 + r ** 2, h = (a + l) / 2, c = Math.sqrt(h ** 2 - (a * l - o ** 2));
      e[0] = Math.sqrt(h + c || 1), e[1] = Math.sqrt(h - c || 1);
    }
    static normalizeRect(t) {
      const e = t.slice(0);
      return t[0] > t[2] && (e[0] = t[2], e[2] = t[0]), t[1] > t[3] && (e[1] = t[3], e[3] = t[1]), e;
    }
    static intersect(t, e) {
      const s = Math.max(Math.min(t[0], t[2]), Math.min(e[0], e[2])), i = Math.min(Math.max(t[0], t[2]), Math.max(e[0], e[2]));
      if (s > i) return null;
      const n = Math.max(Math.min(t[1], t[3]), Math.min(e[1], e[3])), r = Math.min(Math.max(t[1], t[3]), Math.max(e[1], e[3]));
      return n > r ? null : [
        s,
        n,
        i,
        r
      ];
    }
    static pointBoundingBox(t, e, s) {
      s[0] = Math.min(s[0], t), s[1] = Math.min(s[1], e), s[2] = Math.max(s[2], t), s[3] = Math.max(s[3], e);
    }
    static rectBoundingBox(t, e, s, i, n) {
      n[0] = Math.min(n[0], t, s), n[1] = Math.min(n[1], e, i), n[2] = Math.max(n[2], t, s), n[3] = Math.max(n[3], e, i);
    }
    static bezierBoundingBox(t, e, s, i, n, r, a, o, l) {
      l[0] = Math.min(l[0], t, a), l[1] = Math.min(l[1], e, o), l[2] = Math.max(l[2], t, a), l[3] = Math.max(l[3], e, o), __privateMethod(this, _T_static, e_fn).call(this, t, s, n, a, e, i, r, o, 3 * (-t + 3 * (s - n) + a), 6 * (t - 2 * s + n), 3 * (s - t), l), __privateMethod(this, _T_static, e_fn).call(this, t, s, n, a, e, i, r, o, 3 * (-e + 3 * (i - r) + o), 6 * (e - 2 * i + r), 3 * (i - e), l);
    }
  }, _T_static = new WeakSet(), t_fn = function(t, e, s, i, n, r, a, o, l, h) {
    if (l <= 0 || l >= 1) return;
    const c = 1 - l, u = l * l, f = u * l, g = c * (c * (c * t + 3 * l * e) + 3 * u * s) + f * i, p = c * (c * (c * n + 3 * l * r) + 3 * u * a) + f * o;
    h[0] = Math.min(h[0], g), h[1] = Math.min(h[1], p), h[2] = Math.max(h[2], g), h[3] = Math.max(h[3], p);
  }, e_fn = function(t, e, s, i, n, r, a, o, l, h, c, u) {
    if (Math.abs(l) < 1e-12) {
      Math.abs(h) >= 1e-12 && __privateMethod(this, _T_static, t_fn).call(this, t, e, s, i, n, r, a, o, -c / h, u);
      return;
    }
    const f = h ** 2 - 4 * c * l;
    if (f < 0) return;
    const g = Math.sqrt(f), p = 2 * l;
    __privateMethod(this, _T_static, t_fn).call(this, t, e, s, i, n, r, a, o, (-h + g) / p, u), __privateMethod(this, _T_static, t_fn).call(this, t, e, s, i, n, r, a, o, (-h - g) / p, u);
  }, __privateAdd(_a, _T_static), _a);
  function en(d) {
    return decodeURIComponent(escape(d));
  }
  let Je = null, Os = null;
  sn = function(d) {
    return Je || (Je = /([\u00a0\u00b5\u037e\u0eb3\u2000-\u200a\u202f\u2126\ufb00-\ufb04\ufb06\ufb20-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufba1\ufba4-\ufba9\ufbae-\ufbb1\ufbd3-\ufbdc\ufbde-\ufbe7\ufbea-\ufbf8\ufbfc-\ufbfd\ufc00-\ufc5d\ufc64-\ufcf1\ufcf5-\ufd3d\ufd88\ufdf4\ufdfa-\ufdfb\ufe71\ufe77\ufe79\ufe7b\ufe7d]+)|(\ufb05+)/gu, Os = /* @__PURE__ */ new Map([
      [
        "\uFB05",
        "\u017Ft"
      ]
    ])), d.replaceAll(Je, (t, e, s) => e ? e.normalize("NFKC") : Os.get(s));
  };
  ui = function() {
    if (typeof crypto.randomUUID == "function") return crypto.randomUUID();
    const d = new Uint8Array(32);
    return crypto.getRandomValues(d), Qi(d);
  };
  const Vt = "pdfjs_internal_id_";
  function nn(d, t, e) {
    if (!Array.isArray(e) || e.length < 2) return false;
    const [s, i, ...n] = e;
    if (!d(s) && !Number.isInteger(s) || !t(i)) return false;
    const r = n.length;
    let a = true;
    switch (i.name) {
      case "XYZ":
        if (r < 2 || r > 3) return false;
        break;
      case "Fit":
      case "FitB":
        return r === 0;
      case "FitH":
      case "FitBH":
      case "FitV":
      case "FitBV":
        if (r > 1) return false;
        break;
      case "FitR":
        if (r !== 4) return false;
        a = false;
        break;
      default:
        return false;
    }
    for (const o of n) if (!(typeof o == "number" || a && o === null)) return false;
    return true;
  }
  fi = () => [];
  ys = () => /* @__PURE__ */ new Map();
  os = () => /* @__PURE__ */ Object.create(null);
  ot = function(d, t, e) {
    return Math.min(Math.max(d, t), e);
  };
  typeof Math.sumPrecise != "function" && (Math.sumPrecise = function(d) {
    return d.reduce((t, e) => t + e, 0);
  });
  class ue {
    static textContent(t) {
      const e = [], s = {
        items: e,
        styles: /* @__PURE__ */ Object.create(null)
      };
      function i(n) {
        var _a29;
        if (!n) return;
        let r = null;
        const a = n.name;
        if (a === "#text") r = n.value;
        else if (ue.shouldBuildText(a)) ((_a29 = n == null ? void 0 : n.attributes) == null ? void 0 : _a29.textContent) ? r = n.attributes.textContent : n.value && (r = n.value);
        else return;
        if (r !== null && e.push({
          str: r
        }), !!n.children) for (const o of n.children) i(o);
      }
      return i(t), s;
    }
    static shouldBuildText(t) {
      return !(t === "textarea" || t === "input" || t === "option" || t === "select");
    }
  }
  pi = class {
    static setupStorage(t, e, s, i, n) {
      const r = i.getValue(e, {
        value: null
      });
      switch (s.name) {
        case "textarea":
          if (r.value !== null && (t.textContent = r.value), n === "print") break;
          t.addEventListener("input", (a) => {
            i.setValue(e, {
              value: a.target.value
            });
          });
          break;
        case "input":
          if (s.attributes.type === "radio" || s.attributes.type === "checkbox") {
            if (r.value === s.attributes.xfaOn ? t.setAttribute("checked", true) : r.value === s.attributes.xfaOff && t.removeAttribute("checked"), n === "print") break;
            t.addEventListener("change", (a) => {
              i.setValue(e, {
                value: a.target.checked ? a.target.getAttribute("xfaOn") : a.target.getAttribute("xfaOff")
              });
            });
          } else {
            if (r.value !== null && t.setAttribute("value", r.value), n === "print") break;
            t.addEventListener("input", (a) => {
              i.setValue(e, {
                value: a.target.value
              });
            });
          }
          break;
        case "select":
          if (r.value !== null) {
            t.setAttribute("value", r.value);
            for (const a of s.children) a.attributes.value === r.value ? a.attributes.selected = true : a.attributes.hasOwnProperty("selected") && delete a.attributes.selected;
          }
          t.addEventListener("input", (a) => {
            const o = a.target.options, l = o.selectedIndex === -1 ? "" : o[o.selectedIndex].value;
            i.setValue(e, {
              value: l
            });
          });
          break;
      }
    }
    static setAttributes({ html: t, element: e, storage: s = null, intent: i, linkService: n }) {
      const { attributes: r } = e, a = t instanceof HTMLAnchorElement;
      r.type === "radio" && (r.name = `${r.name}-${i}`);
      for (const [o, l] of Object.entries(r)) if (l != null) switch (o) {
        case "class":
          l.length && t.setAttribute(o, l.join(" "));
          break;
        case "dataId":
          break;
        case "id":
          t.setAttribute("data-element-id", l);
          break;
        case "style":
          Object.assign(t.style, l);
          break;
        case "textContent":
          t.textContent = l;
          break;
        default:
          (!a || o !== "href" && o !== "newWindow") && t.setAttribute(o, l);
      }
      a && n.addLinkAttributes(t, r.href, r.newWindow), s && r.dataId && this.setupStorage(t, r.dataId, e, s);
    }
    static render(t) {
      var _a29, _b7;
      const e = t.annotationStorage, s = t.linkService, i = t.xfaHtml, n = t.intent || "display", r = document.createElement(i.name);
      i.attributes && this.setAttributes({
        html: r,
        element: i,
        intent: n,
        linkService: s
      });
      const a = n !== "richText", o = t.div;
      if (o.append(r), t.viewport) {
        const c = `matrix(${t.viewport.transform.join(",")})`;
        o.style.transform = c;
      }
      a && o.setAttribute("class", "xfaLayer xfaFont");
      const l = [];
      if (i.children.length === 0) {
        if (i.value) {
          const c = document.createTextNode(i.value);
          r.append(c), a && ue.shouldBuildText(i.name) && l.push(c);
        }
        return {
          textDivs: l
        };
      }
      const h = [
        [
          i,
          -1,
          r
        ]
      ];
      for (; h.length > 0; ) {
        const [c, u, f] = h.at(-1);
        if (u + 1 === c.children.length) {
          h.pop();
          continue;
        }
        const g = c.children[++h.at(-1)[1]];
        if (g === null) continue;
        const { name: p } = g;
        if (p === "#text") {
          const m = document.createTextNode(g.value);
          l.push(m), f.append(m);
          continue;
        }
        const b = ((_a29 = g == null ? void 0 : g.attributes) == null ? void 0 : _a29.xmlns) ? document.createElementNS(g.attributes.xmlns, p) : document.createElement(p);
        if (f.append(b), g.attributes && this.setAttributes({
          html: b,
          element: g,
          storage: e,
          intent: n,
          linkService: s
        }), ((_b7 = g.children) == null ? void 0 : _b7.length) > 0) h.push([
          g,
          -1,
          b
        ]);
        else if (g.value) {
          const m = document.createTextNode(g.value);
          a && ue.shouldBuildText(p) && l.push(m), b.append(m);
        }
      }
      for (const c of o.querySelectorAll(".xfaNonInteractive input, .xfaNonInteractive textarea")) c.setAttribute("readOnly", true);
      return {
        textDivs: l
      };
    }
    static update(t) {
      const e = `matrix(${t.viewport.transform.join(",")})`;
      t.div.style.transform = e, t.div.hidden = false;
    }
  };
  const Mt = "http://www.w3.org/2000/svg";
  Qt = (_b = class {
  }, __publicField(_b, "CSS", 96), __publicField(_b, "PDF", 72), __publicField(_b, "PDF_TO_CSS_UNITS", _b.CSS / _b.PDF), _b);
  ge = async function(d, t = "text") {
    if (re(d, document.baseURI)) {
      const e = await fetch(d);
      if (!e.ok) throw new Error(e.statusText);
      switch (t) {
        case "blob":
          return e.blob();
        case "bytes":
          return e.bytes();
        case "json":
          return e.json();
      }
      return e.text();
    }
    return new Promise((e, s) => {
      const i = new XMLHttpRequest();
      i.open("GET", d, true), i.responseType = t === "bytes" ? "arraybuffer" : t, i.onreadystatechange = () => {
        if (i.readyState === XMLHttpRequest.DONE) {
          if (i.status === 200 || i.status === 0) {
            switch (t) {
              case "bytes":
                e(new Uint8Array(i.response));
                return;
              case "blob":
              case "json":
                e(i.response);
                return;
            }
            e(i.responseText);
            return;
          }
          s(new Error(i.statusText));
        }
      }, i.send(null);
    });
  };
  class me {
    constructor({ viewBox: t, userUnit: e, scale: s, rotation: i, offsetX: n = 0, offsetY: r = 0, dontFlip: a = false }) {
      this.viewBox = t, this.userUnit = e, this.scale = s, this.rotation = i, this.offsetX = n, this.offsetY = r, s *= e;
      const o = (t[2] + t[0]) / 2, l = (t[3] + t[1]) / 2;
      let h, c, u, f;
      switch (i %= 360, i < 0 && (i += 360), i) {
        case 180:
          h = -1, c = 0, u = 0, f = 1;
          break;
        case 90:
          h = 0, c = 1, u = 1, f = 0;
          break;
        case 270:
          h = 0, c = -1, u = -1, f = 0;
          break;
        case 0:
          h = 1, c = 0, u = 0, f = -1;
          break;
        default:
          throw new Error("PageViewport: Invalid rotation, must be a multiple of 90 degrees.");
      }
      a && (u = -u, f = -f);
      let g, p, b, m;
      h === 0 ? (g = Math.abs(l - t[1]) * s + n, p = Math.abs(o - t[0]) * s + r, b = (t[3] - t[1]) * s, m = (t[2] - t[0]) * s) : (g = Math.abs(o - t[0]) * s + n, p = Math.abs(l - t[1]) * s + r, b = (t[2] - t[0]) * s, m = (t[3] - t[1]) * s), this.transform = [
        h * s,
        c * s,
        u * s,
        f * s,
        g - h * s * o - u * s * l,
        p - c * s * o - f * s * l
      ], this.width = b, this.height = m;
    }
    get rawDims() {
      const t = this.viewBox;
      return L(this, "rawDims", {
        pageWidth: t[2] - t[0],
        pageHeight: t[3] - t[1],
        pageX: t[0],
        pageY: t[1]
      });
    }
    clone({ scale: t = this.scale, rotation: e = this.rotation, offsetX: s = this.offsetX, offsetY: i = this.offsetY, dontFlip: n = false } = {}) {
      return new me({
        viewBox: this.viewBox.slice(),
        userUnit: this.userUnit,
        scale: t,
        rotation: e,
        offsetX: s,
        offsetY: i,
        dontFlip: n
      });
    }
    convertToViewportPoint(t, e) {
      const s = [
        t,
        e
      ];
      return T.applyTransform(s, this.transform), s;
    }
    convertToViewportRectangle(t) {
      const e = [
        t[0],
        t[1]
      ];
      T.applyTransform(e, this.transform);
      const s = [
        t[2],
        t[3]
      ];
      return T.applyTransform(s, this.transform), [
        e[0],
        e[1],
        s[0],
        s[1]
      ];
    }
    convertToPdfPoint(t, e) {
      const s = [
        t,
        e
      ];
      return T.applyInverseTransform(s, this.transform), s;
    }
  }
  As = class extends Ut {
    constructor(t, e = 0) {
      super(t, "RenderingCancelledException"), this.extraDelay = e;
    }
  };
  Oe = function(d) {
    const t = d.length;
    let e = 0;
    for (; e < t && d[e].trim() === ""; ) e++;
    return d.substring(e, e + 5).toLowerCase() === "data:";
  };
  ws = function(d) {
    return typeof d == "string" && /\.pdf$/i.test(d);
  };
  rn = function(d) {
    return [d] = d.split(/[#?]/, 1), rs(d);
  };
  an = function(d, t = "document.pdf") {
    if (typeof d != "string") return t;
    if (Oe(d)) return F('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.'), t;
    const s = ((a) => {
      try {
        return new URL(a);
      } catch {
        try {
          return new URL(decodeURIComponent(a));
        } catch {
          try {
            return new URL(a, "https://foo.bar");
          } catch {
            try {
              return new URL(decodeURIComponent(a), "https://foo.bar");
            } catch {
              return null;
            }
          }
        }
      }
    })(d);
    if (!s) return t;
    const i = (a) => {
      try {
        let o = decodeURIComponent(a);
        return o.includes("/") && (o = rs(o), /^\.pdf$/i.test(o)) ? a : o;
      } catch {
        return a;
      }
    }, n = /\.pdf$/i, r = rs(s.pathname);
    if (n.test(r)) return i(r);
    if (s.searchParams.size > 0) {
      const a = (l) => [
        ...l
      ].findLast((h) => n.test(h)), o = a(s.searchParams.values()) ?? a(s.searchParams.keys());
      if (o) return i(o);
    }
    if (s.hash) {
      const o = /[^/?#=]+\.pdf\b(?!.*\.pdf\b)/i.exec(s.hash);
      if (o) return i(o[0]);
    }
    return t;
  };
  class Bs {
    constructor() {
      __publicField(this, "started", /* @__PURE__ */ Object.create(null));
      __publicField(this, "times", []);
    }
    time(t) {
      t in this.started && F(`Timer is already running for ${t}`), this.started[t] = Date.now();
    }
    timeEnd(t) {
      t in this.started || F(`Timer has not been started for ${t}`), this.times.push({
        name: t,
        start: this.started[t],
        end: Date.now()
      }), delete this.started[t];
    }
    toString() {
      const t = [];
      let e = 0;
      for (const { name: s } of this.times) e = Math.max(s.length, e);
      for (const { name: s, start: i, end: n } of this.times) t.push(`${s.padEnd(e)} ${n - i}ms
`);
      return t.join("");
    }
  }
  function re(d, t) {
    const e = t ? URL.parse(d, t) : URL.parse(d);
    return /https?:/.test((e == null ? void 0 : e.protocol) ?? "");
  }
  St = function(d) {
    d.preventDefault();
  };
  K = function(d) {
    d.preventDefault(), d.stopPropagation();
  };
  function gi(d) {
    console.log("Deprecated API usage: " + d);
  }
  ls = (_c = class {
    static toDateObject(t) {
      if (t instanceof Date) return t;
      if (!t || typeof t != "string") return null;
      __privateGet(this, _t2) || __privateSet(this, _t2, new RegExp("^D:(\\d{4})(\\d{2})?(\\d{2})?(\\d{2})?(\\d{2})?(\\d{2})?([Z|+|-])?(\\d{2})?'?(\\d{2})?'?"));
      const e = __privateGet(this, _t2).exec(t);
      if (!e) return null;
      const s = parseInt(e[1], 10);
      let i = parseInt(e[2], 10);
      i = i >= 1 && i <= 12 ? i - 1 : 0;
      let n = parseInt(e[3], 10);
      n = n >= 1 && n <= 31 ? n : 1;
      let r = parseInt(e[4], 10);
      r = r >= 0 && r <= 23 ? r : 0;
      let a = parseInt(e[5], 10);
      a = a >= 0 && a <= 59 ? a : 0;
      let o = parseInt(e[6], 10);
      o = o >= 0 && o <= 59 ? o : 0;
      const l = e[7] || "Z";
      let h = parseInt(e[8], 10);
      h = h >= 0 && h <= 23 ? h : 0;
      let c = parseInt(e[9], 10) || 0;
      return c = c >= 0 && c <= 59 ? c : 0, l === "-" ? (r += h, a += c) : l === "+" && (r -= h, a -= c), new Date(Date.UTC(s, i, n, r, a, o));
    }
  }, _t2 = new WeakMap(), __privateAdd(_c, _t2), _c);
  on = function(d, { scale: t = 1, rotation: e = 0 }) {
    const { width: s, height: i } = d.attributes.style, n = [
      0,
      0,
      parseInt(s),
      parseInt(i)
    ];
    return new me({
      viewBox: n,
      userUnit: 1,
      scale: t,
      rotation: e
    });
  };
  be = function(d) {
    if (d.startsWith("#")) {
      const t = parseInt(d.slice(1), 16);
      return [
        (t & 16711680) >> 16,
        (t & 65280) >> 8,
        t & 255
      ];
    }
    return d.startsWith("rgb(") ? d.slice(4, -1).split(",").map((t) => parseInt(t)) : d.startsWith("rgba(") ? d.slice(5, -1).split(",").map((t) => parseInt(t)).slice(0, 3) : (F(`Not a valid color format: "${d}"`), [
      0,
      0,
      0
    ]);
  };
  function ln(d) {
    const t = document.createElement("span");
    t.style.visibility = "hidden", t.style.colorScheme = "only light", document.body.append(t);
    for (const e of d.keys()) {
      t.style.color = e;
      const s = window.getComputedStyle(t).color;
      d.set(e, be(s));
    }
    t.remove();
  }
  function Y(d) {
    const { a: t, b: e, c: s, d: i, e: n, f: r } = d.getTransform();
    return [
      t,
      e,
      s,
      i,
      n,
      r
    ];
  }
  function _t(d) {
    const { a: t, b: e, c: s, d: i, e: n, f: r } = d.getTransform().invertSelf();
    return [
      t,
      e,
      s,
      i,
      n,
      r
    ];
  }
  Ot = function(d, t, e = false, s = true) {
    if (t instanceof me) {
      const { pageWidth: i, pageHeight: n } = t.rawDims, { style: r } = d, a = nt.isCSSRoundSupported, o = `var(--total-scale-factor) * ${i}px`, l = `var(--total-scale-factor) * ${n}px`, h = a ? `round(down, ${o}, var(--scale-round-x))` : `calc(${o})`, c = a ? `round(down, ${l}, var(--scale-round-y))` : `calc(${l})`;
      !e || t.rotation % 180 === 0 ? (r.width = h, r.height = c) : (r.width = c, r.height = h);
    }
    s && d.setAttribute("data-main-rotation", t.rotation);
  };
  Pt = class {
    constructor() {
      const { pixelRatio: t } = Pt;
      this.sx = t, this.sy = t;
    }
    get scaled() {
      return this.sx !== 1 || this.sy !== 1;
    }
    get symmetric() {
      return this.sx === this.sy;
    }
    limitCanvas(t, e, s, i, n = -1) {
      let r = 1 / 0, a = 1 / 0, o = 1 / 0;
      s = Pt.capPixels(s, n), s > 0 && (r = Math.sqrt(s / (t * e))), i !== -1 && (a = i / t, o = i / e);
      const l = Math.min(r, a, o);
      return this.sx > l || this.sy > l ? (this.sx = l, this.sy = l, true) : false;
    }
    static get pixelRatio() {
      return globalThis.devicePixelRatio || 1;
    }
    static capPixels(t, e) {
      if (e >= 0) {
        const s = Math.ceil(window.screen.availWidth * window.screen.availHeight * this.pixelRatio ** 2 * (1 + e / 100));
        return t > 0 ? Math.min(t, s) : s;
      }
      return t;
    }
  };
  hs = [
    "image/apng",
    "image/avif",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "image/x-icon"
  ];
  class hn {
    static get isDarkMode() {
      var _a29;
      return L(this, "isDarkMode", !!((_a29 = window == null ? void 0 : window.matchMedia) == null ? void 0 : _a29.call(window, "(prefers-color-scheme: dark)").matches));
    }
  }
  cn = class {
    static get commentForegroundColor() {
      const t = document.createElement("span");
      t.classList.add("comment", "sidebar");
      const { style: e } = t;
      e.width = e.height = "0", e.display = "none", e.color = "var(--comment-fg-color)", document.body.append(t);
      const { color: s } = window.getComputedStyle(t);
      return t.remove(), L(this, "commentForegroundColor", be(s));
    }
  };
  dn = function(d, t, e, s) {
    s = ot(s ?? 1, 0, 1);
    const i = 255 * (1 - s);
    return d = Math.round(d * s + i), t = Math.round(t * s + i), e = Math.round(e * s + i), [
      d,
      t,
      e
    ];
  };
  function Us(d, t) {
    const e = d[0] / 255, s = d[1] / 255, i = d[2] / 255, n = Math.max(e, s, i), r = Math.min(e, s, i), a = (n + r) / 2;
    if (n === r) t[0] = t[1] = 0;
    else {
      const o = n - r;
      switch (t[1] = a < 0.5 ? o / (n + r) : o / (2 - n - r), n) {
        case e:
          t[0] = ((s - i) / o + (s < i ? 6 : 0)) * 60;
          break;
        case s:
          t[0] = ((i - e) / o + 2) * 60;
          break;
        case i:
          t[0] = ((e - s) / o + 4) * 60;
          break;
      }
    }
    t[2] = a;
  }
  function cs(d, t) {
    const e = d[0], s = d[1], i = d[2], n = (1 - Math.abs(2 * i - 1)) * s, r = n * (1 - Math.abs(e / 60 % 2 - 1)), a = i - n / 2;
    switch (Math.floor(e / 60)) {
      case 0:
        t[0] = n + a, t[1] = r + a, t[2] = a;
        break;
      case 1:
        t[0] = r + a, t[1] = n + a, t[2] = a;
        break;
      case 2:
        t[0] = a, t[1] = n + a, t[2] = r + a;
        break;
      case 3:
        t[0] = a, t[1] = r + a, t[2] = n + a;
        break;
      case 4:
        t[0] = r + a, t[1] = a, t[2] = n + a;
        break;
      case 5:
      case 6:
        t[0] = n + a, t[1] = a, t[2] = r + a;
        break;
    }
  }
  function Hs(d) {
    return d <= 0.03928 ? d / 12.92 : ((d + 0.055) / 1.055) ** 2.4;
  }
  function $s(d, t, e) {
    cs(d, e), e.map(Hs);
    const s = 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2];
    cs(t, e), e.map(Hs);
    const i = 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2];
    return s > i ? (s + 0.05) / (i + 0.05) : (i + 0.05) / (s + 0.05);
  }
  const js = /* @__PURE__ */ new Map();
  un = function(d, t) {
    const e = d[0] + d[1] * 256 + d[2] * 65536 + t[0] * 16777216 + t[1] * 4294967296 + t[2] * 1099511627776;
    let s = js.get(e);
    if (s) return s;
    const i = new Float32Array(9), n = i.subarray(0, 3), r = i.subarray(3, 6);
    Us(d, r);
    const a = i.subarray(6, 9);
    Us(t, a);
    const o = a[2] < 0.5, l = o ? 12 : 4.5;
    if (r[2] = o ? Math.sqrt(r[2]) : 1 - Math.sqrt(1 - r[2]), $s(r, a, n) < l) {
      let h, c;
      o ? (h = r[2], c = 1) : (h = 0, c = r[2]);
      const u = 5e-3;
      for (; c - h > u; ) {
        const f = r[2] = (h + c) / 2;
        o === $s(r, a, n) < l ? h = f : c = f;
      }
      r[2] = o ? c : h;
    }
    return cs(r, n), s = T.makeHexColor(Math.round(n[0] * 255), Math.round(n[1] * 255), Math.round(n[2] * 255)), js.set(e, s), s;
  };
  mi = function({ html: d, dir: t, className: e }, s) {
    const i = document.createDocumentFragment();
    if (typeof d == "string") {
      const n = document.createElement("p");
      n.dir = t || "auto";
      const r = d.split(/(?:\r\n?|\n)/);
      for (let a = 0, o = r.length; a < o; ++a) {
        const l = r[a];
        n.append(document.createTextNode(l)), a < o - 1 && n.append(document.createElement("br"));
      }
      i.append(n);
    } else pi.render({
      xfaHtml: d,
      div: i,
      intent: "richText"
    });
    i.firstElementChild.classList.add("richText", e), s.append(i);
  };
  function bi(d) {
    const t = new Path2D();
    if (!d) return t;
    for (let e = 0, s = d.length; e < s; ) switch (d[e++]) {
      case ee.moveTo:
        t.moveTo(d[e++], d[e++]);
        break;
      case ee.lineTo:
        t.lineTo(d[e++], d[e++]);
        break;
      case ee.curveTo:
        t.bezierCurveTo(d[e++], d[e++], d[e++], d[e++], d[e++], d[e++]);
        break;
      case ee.quadraticCurveTo:
        t.quadraticCurveTo(d[e++], d[e++], d[e++], d[e++]);
        break;
      case ee.closePath:
        t.closePath();
        break;
      default:
        F(`Unrecognized drawing path operator: ${d[e - 1]}`);
        break;
    }
    return t;
  }
  class fn {
    constructor() {
      __privateAdd(this, _fn_instances);
      __privateAdd(this, _t3, null);
      __privateAdd(this, _e2, null);
      __privateAdd(this, _i2, null);
      __privateAdd(this, _s2, 0);
      __privateAdd(this, _a2, []);
      __privateAdd(this, _r2, null);
      __privateAdd(this, _n2, null);
    }
    get pagesNumber() {
      return __privateGet(this, _s2);
    }
    set pagesNumber(t) {
      __privateGet(this, _s2) !== t && (__privateSet(this, _s2, t), __privateMethod(this, _fn_instances, o_fn).call(this));
    }
    addListener(t) {
      __privateGet(this, _a2).push(t);
    }
    removeListener(t) {
      const e = __privateGet(this, _a2).indexOf(t);
      e >= 0 && __privateGet(this, _a2).splice(e, 1);
    }
    movePages(t, e, s) {
      __privateMethod(this, _fn_instances, l_fn).call(this, true);
      const i = __privateGet(this, _e2), n = __privateGet(this, _t3), r = e.length, a = new Uint32Array(r);
      let o = 0;
      for (let u = 0; u < r; u++) {
        const f = e[u] - 1;
        a[u] = i[f], f < s && (o += 1);
      }
      const l = __privateGet(this, _s2);
      let h = s - o;
      const c = l - r;
      h = ot(h, 0, c);
      for (let u = 0, f = 0; u < l; u++) t.has(u + 1) || (i[f++] = i[u]);
      i.copyWithin(h + r, h, c), i.set(a, h), __privateMethod(this, _fn_instances, d_fn).call(this, n, null), __privateMethod(this, _fn_instances, u_fn).call(this), __privateMethod(this, _fn_instances, h_fn).call(this, {
        type: "move"
      }), i.every((u, f) => u === f + 1) && __privateMethod(this, _fn_instances, o_fn).call(this);
    }
    deletePages(t) {
      __privateMethod(this, _fn_instances, l_fn).call(this, true);
      const e = __privateGet(this, _e2), s = __privateGet(this, _t3);
      this.pagesNumber -= t.length, __privateMethod(this, _fn_instances, l_fn).call(this, false);
      const i = __privateGet(this, _e2);
      let n = 0, r = 0;
      for (const a of t) {
        const o = a - 1;
        o !== n && (i.set(e.subarray(n, o), r), r += o - n), n = o + 1;
      }
      n < e.length && i.set(e.subarray(n), r), __privateMethod(this, _fn_instances, d_fn).call(this, s, null), __privateMethod(this, _fn_instances, u_fn).call(this), __privateMethod(this, _fn_instances, h_fn).call(this, {
        type: "delete",
        pageNumbers: t
      });
    }
    copyPages(t) {
      __privateMethod(this, _fn_instances, l_fn).call(this, true), __privateSet(this, _n2, t), __privateSet(this, _r2, t.map((e) => __privateGet(this, _e2)[e - 1])), __privateMethod(this, _fn_instances, h_fn).call(this, {
        type: "copy",
        pageNumbers: t
      });
    }
    pastePages(t) {
      __privateMethod(this, _fn_instances, l_fn).call(this, true);
      const e = __privateGet(this, _e2), s = __privateGet(this, _t3), i = __privateGet(this, _n2), n = /* @__PURE__ */ new Map();
      let r = t;
      for (const o of i) n.set(++r, o);
      this.pagesNumber += i.length, __privateMethod(this, _fn_instances, l_fn).call(this, false);
      const a = __privateGet(this, _e2);
      a.set(e.subarray(0, t), 0), a.set(__privateGet(this, _r2), t), a.set(e.subarray(t), t + i.length), __privateMethod(this, _fn_instances, d_fn).call(this, s, n), __privateMethod(this, _fn_instances, u_fn).call(this), __privateMethod(this, _fn_instances, h_fn).call(this, {
        type: "paste"
      }), __privateSet(this, _r2, null);
    }
    hasBeenAltered() {
      return __privateGet(this, _e2) !== null;
    }
    getPageMappingForSaving() {
      const t = __privateGet(this, _t3);
      let e = 0;
      for (const i of t.values()) e = Math.max(e, i.length);
      const s = new Array(e);
      for (let i = 0; i < e; i++) s[i] = {
        document: null,
        pageIndices: [],
        includePages: []
      };
      for (const [i, n] of t) for (let r = 0, a = n.length; r < a; r++) s[r].includePages.push([
        i - 1,
        n[r] - 1
      ]);
      for (const { includePages: i, pageIndices: n } of s) {
        i.sort((r, a) => r[0] - a[0]);
        for (let r = 0, a = i.length; r < a; r++) n.push(i[r][1]), i[r] = i[r][0];
      }
      return s;
    }
    getPrevPageNumber(t) {
      return __privateGet(this, _i2)[t - 1] ?? 0;
    }
    getPageNumber(t) {
      var _a29;
      return __privateGet(this, _t3) ? ((_a29 = __privateGet(this, _t3).get(t)) == null ? void 0 : _a29[0]) ?? 0 : t;
    }
    getPageId(t) {
      var _a29;
      return ((_a29 = __privateGet(this, _e2)) == null ? void 0 : _a29[t - 1]) ?? t;
    }
    getMapping() {
      return __privateGet(this, _e2).subarray(0, this.pagesNumber);
    }
  }
  _t3 = new WeakMap();
  _e2 = new WeakMap();
  _i2 = new WeakMap();
  _s2 = new WeakMap();
  _a2 = new WeakMap();
  _r2 = new WeakMap();
  _n2 = new WeakMap();
  _fn_instances = new WeakSet();
  o_fn = function() {
    __privateSet(this, _e2, null), __privateSet(this, _t3, null);
  };
  h_fn = function(t) {
    for (const e of __privateGet(this, _a2)) e(t);
  };
  l_fn = function(t) {
    if (__privateGet(this, _e2)) return;
    const e = __privateGet(this, _s2), s = __privateSet(this, _e2, new Uint32Array(e));
    __privateSet(this, _i2, new Int32Array(s));
    const i = __privateSet(this, _t3, /* @__PURE__ */ new Map());
    if (t) for (let n = 1; n <= e; n++) s[n - 1] = n, i.set(n, [
      n
    ]);
  };
  u_fn = function() {
    const t = __privateGet(this, _t3), e = __privateGet(this, _e2);
    t.clear();
    for (let s = 0, i = __privateGet(this, _s2); s < i; s++) {
      const n = e[s], r = t.get(n);
      r ? r.push(s + 1) : t.set(n, [
        s + 1
      ]);
    }
  };
  d_fn = function(t, e) {
    var _a29;
    const s = __privateGet(this, _i2), i = __privateGet(this, _e2), n = /* @__PURE__ */ new Map();
    for (let r = 0, a = __privateGet(this, _s2); r < a; r++) {
      const o = e == null ? void 0 : e.get(r + 1);
      if (o) {
        s[r] = -o;
        continue;
      }
      const l = i[r], h = n.get(l) || 0;
      s[r] = (_a29 = t.get(l)) == null ? void 0 : _a29[h], n.set(l, h + 1);
    }
  };
  const _le = class _le {
    constructor(t) {
      __privateAdd(this, _le_instances);
      __privateAdd(this, _t4, null);
      __privateAdd(this, _e3, null);
      __privateAdd(this, _i3);
      __privateAdd(this, _s3, null);
      __privateAdd(this, _a3, null);
      __privateAdd(this, _r3, null);
      __privateAdd(this, _n3, null);
      __privateAdd(this, _o, null);
      __privateSet(this, _i3, t), __privateGet(_le, _h) || __privateSet(_le, _h, Object.freeze({
        freetext: "pdfjs-editor-remove-freetext-button",
        highlight: "pdfjs-editor-remove-highlight-button",
        ink: "pdfjs-editor-remove-ink-button",
        stamp: "pdfjs-editor-remove-stamp-button",
        signature: "pdfjs-editor-remove-signature-button"
      }));
    }
    render() {
      const t = __privateSet(this, _t4, document.createElement("div"));
      t.classList.add("editToolbar", "hidden"), t.setAttribute("role", "toolbar");
      const e = __privateGet(this, _i3)._uiManager._signal;
      e instanceof AbortSignal && !e.aborted && (t.addEventListener("contextmenu", St, {
        signal: e
      }), t.addEventListener("pointerdown", __privateMethod(_le, _le_static, l_fn2), {
        signal: e
      }));
      const s = __privateSet(this, _s3, document.createElement("div"));
      s.className = "buttons", t.append(s);
      const i = __privateGet(this, _i3).toolbarPosition;
      if (i) {
        const { style: n } = t, r = __privateGet(this, _i3)._uiManager.direction === "ltr" ? 1 - i[0] : i[0];
        n.insetInlineEnd = `${100 * r}%`, n.top = `calc(${100 * i[1]}% + var(--editor-toolbar-vert-offset))`;
      }
      return t;
    }
    get div() {
      return __privateGet(this, _t4);
    }
    hide() {
      var _a29;
      __privateGet(this, _t4).classList.add("hidden"), (_a29 = __privateGet(this, _e3)) == null ? void 0 : _a29.hideDropdown();
    }
    show() {
      var _a29, _b7;
      __privateGet(this, _t4).classList.remove("hidden"), (_a29 = __privateGet(this, _a3)) == null ? void 0 : _a29.shown(), (_b7 = __privateGet(this, _r3)) == null ? void 0 : _b7.shown();
    }
    addDeleteButton() {
      const { editorType: t, _uiManager: e } = __privateGet(this, _i3), s = document.createElement("button");
      s.classList.add("basic", "deleteButton"), s.tabIndex = 0, s.setAttribute("data-l10n-id", __privateGet(_le, _h)[t]), __privateMethod(this, _le_instances, f_fn).call(this, s) && s.addEventListener("click", (i) => {
        e.delete();
      }, {
        signal: e._signal
      }), __privateGet(this, _s3).append(s);
    }
    async addAltText(t) {
      const e = await t.render();
      __privateMethod(this, _le_instances, f_fn).call(this, e), __privateGet(this, _s3).append(e, __privateGet(this, _le_instances, m_get)), __privateSet(this, _a3, t);
    }
    addComment(t, e = null) {
      if (__privateGet(this, _r3)) return;
      const s = t.renderForToolbar();
      if (!s) return;
      __privateMethod(this, _le_instances, f_fn).call(this, s);
      const i = __privateSet(this, _n3, __privateGet(this, _le_instances, m_get));
      e ? (__privateGet(this, _s3).insertBefore(s, e), __privateGet(this, _s3).insertBefore(i, e)) : __privateGet(this, _s3).append(s, i), __privateSet(this, _r3, t), t.toolbar = this;
    }
    addColorPicker(t) {
      if (__privateGet(this, _e3)) return;
      __privateSet(this, _e3, t);
      const e = t.renderButton();
      __privateMethod(this, _le_instances, f_fn).call(this, e), __privateGet(this, _s3).append(e, __privateGet(this, _le_instances, m_get));
    }
    async addEditSignatureButton(t) {
      const e = __privateSet(this, _o, await t.renderEditButton(__privateGet(this, _i3)));
      __privateMethod(this, _le_instances, f_fn).call(this, e), __privateGet(this, _s3).append(e, __privateGet(this, _le_instances, m_get));
    }
    removeButton(t) {
      var _a29, _b7;
      t === "comment" && ((_a29 = __privateGet(this, _r3)) == null ? void 0 : _a29.removeToolbarCommentButton(), __privateSet(this, _r3, null), (_b7 = __privateGet(this, _n3)) == null ? void 0 : _b7.remove(), __privateSet(this, _n3, null));
    }
    async addButton(t, e) {
      switch (t) {
        case "colorPicker":
          e && this.addColorPicker(e);
          break;
        case "altText":
          e && await this.addAltText(e);
          break;
        case "editSignature":
          e && await this.addEditSignatureButton(e);
          break;
        case "delete":
          this.addDeleteButton();
          break;
        case "comment":
          e && this.addComment(e);
          break;
      }
    }
    async addButtonBefore(t, e, s) {
      if (!e && t === "comment") return;
      const i = __privateGet(this, _s3).querySelector(s);
      i && t === "comment" && this.addComment(e, i);
    }
    updateEditSignatureButton(t) {
      __privateGet(this, _o) && (__privateGet(this, _o).title = t);
    }
    remove() {
      var _a29;
      __privateGet(this, _t4).remove(), (_a29 = __privateGet(this, _e3)) == null ? void 0 : _a29.destroy(), __privateSet(this, _e3, null);
    }
  };
  _t4 = new WeakMap();
  _e3 = new WeakMap();
  _i3 = new WeakMap();
  _s3 = new WeakMap();
  _a3 = new WeakMap();
  _r3 = new WeakMap();
  _n3 = new WeakMap();
  _o = new WeakMap();
  _h = new WeakMap();
  _le_static = new WeakSet();
  l_fn2 = function(t) {
    t.stopPropagation();
  };
  _le_instances = new WeakSet();
  u_fn2 = function(t) {
    __privateGet(this, _i3)._focusEventsAllowed = false, K(t);
  };
  d_fn2 = function(t) {
    __privateGet(this, _i3)._focusEventsAllowed = true, K(t);
  };
  f_fn = function(t) {
    const e = __privateGet(this, _i3)._uiManager._signal;
    return !(e instanceof AbortSignal) || e.aborted ? false : (t.addEventListener("focusin", __privateMethod(this, _le_instances, u_fn2).bind(this), {
      capture: true,
      signal: e
    }), t.addEventListener("focusout", __privateMethod(this, _le_instances, d_fn2).bind(this), {
      capture: true,
      signal: e
    }), t.addEventListener("contextmenu", St, {
      signal: e
    }), true);
  };
  m_get = function() {
    const t = document.createElement("div");
    return t.className = "divider", t;
  };
  __privateAdd(_le, _le_static);
  __privateAdd(_le, _h, null);
  let le = _le;
  class pn {
    constructor(t) {
      __privateAdd(this, _pn_instances);
      __privateAdd(this, _t5, null);
      __privateAdd(this, _e4, null);
      __privateAdd(this, _i4);
      __privateSet(this, _i4, t);
    }
    show(t, e, s) {
      const [i, n] = __privateMethod(this, _pn_instances, a_fn).call(this, e, s), { style: r } = __privateGet(this, _e4) || __privateSet(this, _e4, __privateMethod(this, _pn_instances, s_fn).call(this));
      t.append(__privateGet(this, _e4)), r.insetInlineEnd = `${100 * i}%`, r.top = `calc(${100 * n}% + var(--editor-toolbar-vert-offset))`;
    }
    hide() {
      __privateGet(this, _e4).remove();
    }
  }
  _t5 = new WeakMap();
  _e4 = new WeakMap();
  _i4 = new WeakMap();
  _pn_instances = new WeakSet();
  s_fn = function() {
    const t = __privateSet(this, _e4, document.createElement("div"));
    t.className = "editToolbar", t.setAttribute("role", "toolbar");
    const e = __privateGet(this, _i4)._signal;
    e instanceof AbortSignal && !e.aborted && t.addEventListener("contextmenu", St, {
      signal: e
    });
    const s = __privateSet(this, _t5, document.createElement("div"));
    return s.className = "buttons", t.append(s), __privateGet(this, _i4).hasCommentManager() && __privateMethod(this, _pn_instances, r_fn).call(this, "commentButton", "pdfjs-comment-floating-button", "pdfjs-comment-floating-button-label", () => {
      __privateGet(this, _i4).commentSelection("floating_button");
    }), __privateMethod(this, _pn_instances, r_fn).call(this, "highlightButton", "pdfjs-highlight-floating-button1", "pdfjs-highlight-floating-button-label", () => {
      __privateGet(this, _i4).highlightSelection("floating_button");
    }), t;
  };
  a_fn = function(t, e) {
    let s = 0, i = 0;
    for (const n of t) {
      const r = n.y + n.height;
      if (r < s) continue;
      const a = n.x + (e ? n.width : 0);
      if (r > s) {
        i = a, s = r;
        continue;
      }
      e ? a > i && (i = a) : a < i && (i = a);
    }
    return [
      e ? 1 - i : i,
      s
    ];
  };
  r_fn = function(t, e, s, i) {
    const n = document.createElement("button");
    n.classList.add("basic", t), n.tabIndex = 0, n.setAttribute("data-l10n-id", e);
    const r = document.createElement("span");
    n.append(r), r.className = "visuallyHidden", r.setAttribute("data-l10n-id", s);
    const a = __privateGet(this, _i4)._signal;
    a instanceof AbortSignal && !a.aborted && (n.addEventListener("contextmenu", St, {
      signal: a
    }), n.addEventListener("click", i, {
      signal: a
    })), __privateGet(this, _t5).append(n);
  };
  function yi(d, t, e) {
    for (const s of e) t.addEventListener(s, d[s].bind(d));
  }
  const _H = class _H {
    static initializeAndAddPointerId(t) {
      (__privateGet(_H, _e5) || __privateSet(_H, _e5, /* @__PURE__ */ new Set())).add(t);
    }
    static setPointer(t, e) {
      __privateGet(_H, _t6) || __privateSet(_H, _t6, e), __privateGet(_H, _s4) ?? __privateSet(_H, _s4, t);
    }
    static setTimeStamp(t) {
      __privateSet(_H, _i5, t);
    }
    static isSamePointerId(t) {
      return __privateGet(_H, _t6) === t;
    }
    static isSamePointerIdOrRemove(t) {
      var _a29;
      return __privateGet(_H, _t6) === t ? true : ((_a29 = __privateGet(_H, _e5)) == null ? void 0 : _a29.delete(t), false);
    }
    static isSamePointerType(t) {
      return __privateGet(_H, _s4) === t;
    }
    static isInitializedAndDifferentPointerType(t) {
      return __privateGet(_H, _s4) !== null && !_H.isSamePointerType(t);
    }
    static isSameTimeStamp(t) {
      return __privateGet(_H, _i5) === t;
    }
    static isUsingMultiplePointers() {
      var _a29;
      return ((_a29 = __privateGet(_H, _e5)) == null ? void 0 : _a29.size) >= 1;
    }
    static clearPointerType() {
      __privateSet(_H, _s4, null);
    }
    static clearPointerIds() {
      __privateSet(_H, _t6, NaN), __privateSet(_H, _e5, null);
    }
    static clearTimeStamp() {
      __privateSet(_H, _i5, NaN);
    }
  };
  _t6 = new WeakMap();
  _e5 = new WeakMap();
  _i5 = new WeakMap();
  _s4 = new WeakMap();
  __privateAdd(_H, _t6, NaN);
  __privateAdd(_H, _e5, null);
  __privateAdd(_H, _i5, NaN);
  __privateAdd(_H, _s4, null);
  let H = _H;
  class gn {
    constructor() {
      __privateAdd(this, _t7, 0);
    }
    get id() {
      return `${ce}${__privateWrapper(this, _t7)._++}`;
    }
  }
  _t7 = new WeakMap();
  const _vs = class _vs {
    constructor() {
      __privateAdd(this, _vs_instances);
      __privateAdd(this, _t8, ui());
      __privateAdd(this, _e6, 0);
      __privateAdd(this, _i6, null);
    }
    static get _isSVGFittingCanvas() {
      const t = 'data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 1 1" width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" style="fill:red;"/></svg>', s = new OffscreenCanvas(1, 3).getContext("2d", {
        willReadFrequently: true
      }), i = new Image();
      i.src = t;
      const n = i.decode().then(() => (s.drawImage(i, 0, 0, 1, 1, 0, 0, 1, 3), new Uint32Array(s.getImageData(0, 0, 1, 1).data.buffer)[0] === 0));
      return L(this, "_isSVGFittingCanvas", n);
    }
    async getFromFile(t) {
      const { lastModified: e, name: s, size: i, type: n } = t;
      return __privateMethod(this, _vs_instances, s_fn2).call(this, `${e}_${s}_${i}_${n}`, t);
    }
    async getFromUrl(t) {
      return __privateMethod(this, _vs_instances, s_fn2).call(this, t, t);
    }
    async getFromBlob(t, e) {
      const s = await e;
      return __privateMethod(this, _vs_instances, s_fn2).call(this, t, s);
    }
    async getFromId(t) {
      __privateGet(this, _i6) || __privateSet(this, _i6, /* @__PURE__ */ new Map());
      const e = __privateGet(this, _i6).get(t);
      if (!e) return null;
      if (e.bitmap) return e.refCounter += 1, e;
      if (e.file) return this.getFromFile(e.file);
      if (e.blobPromise) {
        const { blobPromise: s } = e;
        return delete e.blobPromise, this.getFromBlob(e.id, s);
      }
      return this.getFromUrl(e.url);
    }
    getFromCanvas(t, e) {
      __privateGet(this, _i6) || __privateSet(this, _i6, /* @__PURE__ */ new Map());
      let s = __privateGet(this, _i6).get(t);
      if (s == null ? void 0 : s.bitmap) return s.refCounter += 1, s;
      const i = new OffscreenCanvas(e.width, e.height);
      return i.getContext("2d").drawImage(e, 0, 0), s = {
        bitmap: i.transferToImageBitmap(),
        id: `image_${__privateGet(this, _t8)}_${__privateWrapper(this, _e6)._++}`,
        refCounter: 1,
        isSvg: false
      }, __privateGet(this, _i6).set(t, s), __privateGet(this, _i6).set(s.id, s), s;
    }
    getSvgUrl(t) {
      const e = __privateGet(this, _i6).get(t);
      return (e == null ? void 0 : e.isSvg) ? e.svgUrl : null;
    }
    deleteId(t) {
      var _a29;
      __privateGet(this, _i6) || __privateSet(this, _i6, /* @__PURE__ */ new Map());
      const e = __privateGet(this, _i6).get(t);
      if (!e || (e.refCounter -= 1, e.refCounter !== 0)) return;
      const { bitmap: s } = e;
      if (!e.url && !e.file) {
        const i = new OffscreenCanvas(s.width, s.height);
        i.getContext("bitmaprenderer").transferFromImageBitmap(s), e.blobPromise = i.convertToBlob();
      }
      (_a29 = s.close) == null ? void 0 : _a29.call(s), e.bitmap = null;
    }
    isValidId(t) {
      return t.startsWith(`image_${__privateGet(this, _t8)}_`);
    }
  };
  _t8 = new WeakMap();
  _e6 = new WeakMap();
  _i6 = new WeakMap();
  _vs_instances = new WeakSet();
  s_fn2 = async function(t, e) {
    __privateGet(this, _i6) || __privateSet(this, _i6, /* @__PURE__ */ new Map());
    let s = __privateGet(this, _i6).get(t);
    if (s === null) return null;
    if (s == null ? void 0 : s.bitmap) return s.refCounter += 1, s;
    try {
      s || (s = {
        bitmap: null,
        id: `image_${__privateGet(this, _t8)}_${__privateWrapper(this, _e6)._++}`,
        refCounter: 0,
        isSvg: false
      });
      let i;
      if (typeof e == "string" ? (s.url = e, i = await ge(e, "blob")) : e instanceof File ? i = s.file = e : e instanceof Blob && (i = e), i.type === "image/svg+xml") {
        const n = _vs._isSVGFittingCanvas, r = new FileReader(), a = new Image(), o = new Promise((l, h) => {
          a.onload = () => {
            s.bitmap = a, s.isSvg = true, l();
          }, r.onload = async () => {
            const c = s.svgUrl = r.result;
            a.src = await n ? `${c}#svgView(preserveAspectRatio(none))` : c;
          }, a.onerror = r.onerror = h;
        });
        r.readAsDataURL(i), await o;
      } else s.bitmap = await createImageBitmap(i);
      s.refCounter = 1;
    } catch (i) {
      F(i), s = null;
    }
    return __privateGet(this, _i6).set(t, s), s && __privateGet(this, _i6).set(s.id, s), s;
  };
  let vs = _vs;
  class mn {
    constructor(t = 128) {
      __privateAdd(this, _t9, []);
      __privateAdd(this, _e7, false);
      __privateAdd(this, _i7);
      __privateAdd(this, _s5, -1);
      __privateSet(this, _i7, t);
    }
    add({ cmd: t, undo: e, post: s, mustExec: i, type: n = NaN, overwriteIfSameType: r = false, keepUndo: a = false }) {
      if (i && t(), __privateGet(this, _e7)) return;
      const o = {
        cmd: t,
        undo: e,
        post: s,
        type: n
      };
      if (__privateGet(this, _s5) === -1) {
        __privateGet(this, _t9).length > 0 && (__privateGet(this, _t9).length = 0), __privateSet(this, _s5, 0), __privateGet(this, _t9).push(o);
        return;
      }
      if (r && __privateGet(this, _t9)[__privateGet(this, _s5)].type === n) {
        a && (o.undo = __privateGet(this, _t9)[__privateGet(this, _s5)].undo), __privateGet(this, _t9)[__privateGet(this, _s5)] = o;
        return;
      }
      const l = __privateGet(this, _s5) + 1;
      l === __privateGet(this, _i7) ? __privateGet(this, _t9).splice(0, 1) : (__privateSet(this, _s5, l), l < __privateGet(this, _t9).length && __privateGet(this, _t9).splice(l)), __privateGet(this, _t9).push(o);
    }
    undo() {
      if (__privateGet(this, _s5) === -1) return;
      __privateSet(this, _e7, true);
      const { undo: t, post: e } = __privateGet(this, _t9)[__privateGet(this, _s5)];
      t(), e == null ? void 0 : e(), __privateSet(this, _e7, false), __privateSet(this, _s5, __privateGet(this, _s5) - 1);
    }
    redo() {
      if (__privateGet(this, _s5) < __privateGet(this, _t9).length - 1) {
        __privateSet(this, _s5, __privateGet(this, _s5) + 1), __privateSet(this, _e7, true);
        const { cmd: t, post: e } = __privateGet(this, _t9)[__privateGet(this, _s5)];
        t(), e == null ? void 0 : e(), __privateSet(this, _e7, false);
      }
    }
    hasSomethingToUndo() {
      return __privateGet(this, _s5) !== -1;
    }
    hasSomethingToRedo() {
      return __privateGet(this, _s5) < __privateGet(this, _t9).length - 1;
    }
    cleanType(t) {
      if (__privateGet(this, _s5) !== -1) {
        for (let e = __privateGet(this, _s5); e >= 0; e--) if (__privateGet(this, _t9)[e].type !== t) {
          __privateGet(this, _t9).splice(e + 1, __privateGet(this, _s5) - e), __privateSet(this, _s5, e);
          return;
        }
        __privateGet(this, _t9).length = 0, __privateSet(this, _s5, -1);
      }
    }
    destroy() {
      __privateSet(this, _t9, null);
    }
  }
  _t9 = new WeakMap();
  _e7 = new WeakMap();
  _i7 = new WeakMap();
  _s5 = new WeakMap();
  class ye {
    constructor(t) {
      __privateAdd(this, _ye_instances);
      this.buffer = [], this.callbacks = /* @__PURE__ */ new Map(), this.allKeys = /* @__PURE__ */ new Set();
      const { isMac: e } = nt.platform;
      for (const [s, i, n = {}] of t) for (const r of s) {
        const a = r.startsWith("mac+");
        e && a ? (this.callbacks.set(r.slice(4), {
          callback: i,
          options: n
        }), this.allKeys.add(r.split("+").at(-1))) : !e && !a && (this.callbacks.set(r, {
          callback: i,
          options: n
        }), this.allKeys.add(r.split("+").at(-1)));
      }
    }
    exec(t, e) {
      if (!this.allKeys.has(e.key)) return;
      const s = this.callbacks.get(__privateMethod(this, _ye_instances, t_fn2).call(this, e));
      if (!s) return;
      const { callback: i, options: { bubbles: n = false, args: r = [], checker: a = null } } = s;
      a && !a(t, e) || (i.bind(t, ...r, e)(), n || K(e));
    }
  }
  _ye_instances = new WeakSet();
  t_fn2 = function(t) {
    t.altKey && this.buffer.push("alt"), t.ctrlKey && this.buffer.push("ctrl"), t.metaKey && this.buffer.push("meta"), t.shiftKey && this.buffer.push("shift"), this.buffer.push(t.key);
    const e = this.buffer.join("+");
    return this.buffer.length = 0, e;
  };
  const _Ss = class _Ss {
    get _colors() {
      const t = /* @__PURE__ */ new Map([
        [
          "CanvasText",
          null
        ],
        [
          "Canvas",
          null
        ]
      ]);
      return ln(t), L(this, "_colors", t);
    }
    convert(t) {
      const e = be(t);
      if (!window.matchMedia("(forced-colors: active)").matches) return e;
      for (const [s, i] of this._colors) if (i.every((n, r) => n === e[r])) return _Ss._colorsMapping.get(s);
      return e;
    }
    getHexCode(t) {
      const e = this._colors.get(t);
      return e ? T.makeHexColor(...e) : t;
    }
  };
  __publicField(_Ss, "_colorsMapping", /* @__PURE__ */ new Map([
    [
      "CanvasText",
      [
        0,
        0,
        0
      ]
    ],
    [
      "Canvas",
      [
        255,
        255,
        255
      ]
    ]
  ]));
  let Ss = _Ss;
  Ft = (_d2 = class {
    constructor(t, e, s, i, n, r, a, o, l, h, c, u, f, g, p, b) {
      __privateAdd(this, _Ft_instances);
      __privateAdd(this, _t10, new AbortController());
      __privateAdd(this, _e8, null);
      __privateAdd(this, _i8, null);
      __privateAdd(this, _s6, /* @__PURE__ */ new Map());
      __privateAdd(this, _a4, /* @__PURE__ */ new Map());
      __privateAdd(this, _r4, null);
      __privateAdd(this, _n4, null);
      __privateAdd(this, _o2, null);
      __privateAdd(this, _h2, new mn());
      __privateAdd(this, _l, null);
      __privateAdd(this, _u, null);
      __privateAdd(this, _d, null);
      __privateAdd(this, _f, 0);
      __privateAdd(this, _m, /* @__PURE__ */ new Set());
      __privateAdd(this, _g, null);
      __privateAdd(this, _c2, null);
      __privateAdd(this, _p, /* @__PURE__ */ new Set());
      __publicField(this, "_editorUndoBar", null);
      __privateAdd(this, _b2, false);
      __privateAdd(this, _A, false);
      __privateAdd(this, _y, false);
      __privateAdd(this, _C, null);
      __privateAdd(this, _E, null);
      __privateAdd(this, _v, null);
      __privateAdd(this, _x, null);
      __privateAdd(this, _w, false);
      __privateAdd(this, __, null);
      __privateAdd(this, _M, new gn());
      __privateAdd(this, _P, false);
      __privateAdd(this, _k, false);
      __privateAdd(this, _O, false);
      __privateAdd(this, _I, null);
      __privateAdd(this, _R, null);
      __privateAdd(this, _B, null);
      __privateAdd(this, _F, null);
      __privateAdd(this, _G, null);
      __privateAdd(this, _T, R.NONE);
      __privateAdd(this, _S, /* @__PURE__ */ new Set());
      __privateAdd(this, _L, null);
      __privateAdd(this, _U, null);
      __privateAdd(this, _$, null);
      __privateAdd(this, _X, null);
      __privateAdd(this, _W, null);
      __privateAdd(this, _Y, {
        isEditing: false,
        isEmpty: true,
        hasSomethingToUndo: false,
        hasSomethingToRedo: false,
        hasSelectedEditor: false,
        hasSelectedText: false
      });
      __privateAdd(this, _j, [
        0,
        0
      ]);
      __privateAdd(this, _N, null);
      __privateAdd(this, _V, null);
      __privateAdd(this, _J, null);
      __privateAdd(this, _Z, null);
      __privateAdd(this, _H2, null);
      const m = this._signal = __privateGet(this, _t10).signal;
      __privateSet(this, _V, t), __privateSet(this, _J, e), __privateSet(this, _Z, s), __privateSet(this, _r4, i), __privateSet(this, _l, n), __privateSet(this, _U, r), __privateSet(this, _W, o), this._eventBus = a, a._on("editingaction", this.onEditingAction.bind(this), {
        signal: m
      }), a._on("pagechanging", this.onPageChanging.bind(this), {
        signal: m
      }), a._on("scalechanging", this.onScaleChanging.bind(this), {
        signal: m
      }), a._on("rotationchanging", this.onRotationChanging.bind(this), {
        signal: m
      }), a._on("setpreference", this.onSetPreference.bind(this), {
        signal: m
      }), a._on("switchannotationeditorparams", (A) => this.updateParams(A.type, A.value), {
        signal: m
      }), window.addEventListener("pointerdown", () => {
        __privateSet(this, _k, true);
      }, {
        capture: true,
        signal: m
      }), window.addEventListener("pointerup", () => {
        __privateSet(this, _k, false);
      }, {
        capture: true,
        signal: m
      }), window.addEventListener("beforeunload", __privateMethod(this, _Ft_instances, nt_fn).bind(this), {
        capture: true,
        signal: m
      }), __privateMethod(this, _Ft_instances, ot_fn).call(this), __privateMethod(this, _Ft_instances, ft_fn).call(this), __privateMethod(this, _Ft_instances, et_fn).call(this), __privateSet(this, _n4, o.annotationStorage), __privateSet(this, _C, o.filterFactory), __privateSet(this, _$, l), __privateSet(this, _x, h || null), __privateSet(this, _b2, c), __privateSet(this, _A, u), __privateSet(this, _y, f), __privateSet(this, _G, g || null), this.viewParameters = {
        realScale: Qt.PDF_TO_CSS_UNITS,
        rotation: 0
      }, this.isShiftKeyDown = false, this._editorUndoBar = p || null, this._supportsPinchToZoom = b !== false, n == null ? void 0 : n.setSidebarUiManager(this);
    }
    static get _keyboardManager() {
      const t = Ft.prototype, e = (r) => __privateGet(r, _V).contains(document.activeElement) && document.activeElement.tagName !== "BUTTON" && r.hasSomethingToControl(), s = (r, { target: a }) => {
        if (a instanceof HTMLInputElement) {
          const { type: o } = a;
          return o !== "text" && o !== "number";
        }
        return true;
      }, i = this.TRANSLATE_SMALL, n = this.TRANSLATE_BIG;
      return L(this, "_keyboardManager", new ye([
        [
          [
            "ctrl+a",
            "mac+meta+a"
          ],
          t.selectAll,
          {
            checker: s
          }
        ],
        [
          [
            "ctrl+z",
            "mac+meta+z"
          ],
          t.undo,
          {
            checker: s
          }
        ],
        [
          [
            "ctrl+y",
            "ctrl+shift+z",
            "mac+meta+shift+z",
            "ctrl+shift+Z",
            "mac+meta+shift+Z"
          ],
          t.redo,
          {
            checker: s
          }
        ],
        [
          [
            "Backspace",
            "alt+Backspace",
            "ctrl+Backspace",
            "shift+Backspace",
            "mac+Backspace",
            "mac+alt+Backspace",
            "mac+ctrl+Backspace",
            "Delete",
            "ctrl+Delete",
            "shift+Delete",
            "mac+Delete"
          ],
          t.delete,
          {
            checker: s
          }
        ],
        [
          [
            "Enter",
            "mac+Enter"
          ],
          t.addNewEditorFromKeyboard,
          {
            checker: (r, { target: a }) => !(a instanceof HTMLButtonElement) && __privateGet(r, _V).contains(a) && !r.isEnterHandled
          }
        ],
        [
          [
            " ",
            "mac+ "
          ],
          t.addNewEditorFromKeyboard,
          {
            checker: (r, { target: a }) => !(a instanceof HTMLButtonElement) && __privateGet(r, _V).contains(document.activeElement)
          }
        ],
        [
          [
            "Escape",
            "mac+Escape"
          ],
          t.unselectAll
        ],
        [
          [
            "ArrowLeft",
            "mac+ArrowLeft"
          ],
          t.translateSelectedEditors,
          {
            args: [
              -i,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowLeft",
            "mac+shift+ArrowLeft"
          ],
          t.translateSelectedEditors,
          {
            args: [
              -n,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowRight",
            "mac+ArrowRight"
          ],
          t.translateSelectedEditors,
          {
            args: [
              i,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowRight",
            "mac+shift+ArrowRight"
          ],
          t.translateSelectedEditors,
          {
            args: [
              n,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowUp",
            "mac+ArrowUp"
          ],
          t.translateSelectedEditors,
          {
            args: [
              0,
              -i
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowUp",
            "mac+shift+ArrowUp"
          ],
          t.translateSelectedEditors,
          {
            args: [
              0,
              -n
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowDown",
            "mac+ArrowDown"
          ],
          t.translateSelectedEditors,
          {
            args: [
              0,
              i
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowDown",
            "mac+shift+ArrowDown"
          ],
          t.translateSelectedEditors,
          {
            args: [
              0,
              n
            ],
            checker: e
          }
        ]
      ]));
    }
    destroy() {
      var _a29, _b7, _c10, _d12, _e54, _f11, _g10, _h18, _i46;
      (_a29 = __privateGet(this, _H2)) == null ? void 0 : _a29.resolve(), __privateSet(this, _H2, null), (_b7 = __privateGet(this, _t10)) == null ? void 0 : _b7.abort(), __privateSet(this, _t10, null), this._signal = null;
      for (const t of __privateGet(this, _a4).values()) t.destroy();
      __privateGet(this, _a4).clear(), __privateGet(this, _s6).clear(), __privateGet(this, _p).clear(), (_c10 = __privateGet(this, _F)) == null ? void 0 : _c10.clear(), __privateSet(this, _e8, null), __privateGet(this, _S).clear(), __privateGet(this, _h2).destroy(), (_d12 = __privateGet(this, _r4)) == null ? void 0 : _d12.destroy(), (_e54 = __privateGet(this, _l)) == null ? void 0 : _e54.destroy(), (_f11 = __privateGet(this, _U)) == null ? void 0 : _f11.destroy(), (_g10 = __privateGet(this, __)) == null ? void 0 : _g10.hide(), __privateSet(this, __, null), (_h18 = __privateGet(this, _B)) == null ? void 0 : _h18.destroy(), __privateSet(this, _B, null), __privateSet(this, _i8, null), __privateGet(this, _E) && (clearTimeout(__privateGet(this, _E)), __privateSet(this, _E, null)), __privateGet(this, _N) && (clearTimeout(__privateGet(this, _N)), __privateSet(this, _N, null)), (_i46 = this._editorUndoBar) == null ? void 0 : _i46.destroy(), __privateSet(this, _W, null);
    }
    combinedSignal(t) {
      return AbortSignal.any([
        this._signal,
        t.signal
      ]);
    }
    get mlManager() {
      return __privateGet(this, _G);
    }
    get useNewAltTextFlow() {
      return __privateGet(this, _A);
    }
    get useNewAltTextWhenAddingImage() {
      return __privateGet(this, _y);
    }
    get hcmFilter() {
      return L(this, "hcmFilter", __privateGet(this, _$) ? __privateGet(this, _C).addHCMFilter(__privateGet(this, _$).foreground, __privateGet(this, _$).background) : "none");
    }
    get direction() {
      return L(this, "direction", getComputedStyle(__privateGet(this, _V)).direction);
    }
    get _highlightColors() {
      return L(this, "_highlightColors", __privateGet(this, _x) ? new Map(__privateGet(this, _x).split(",").map((t) => (t = t.split("=").map((e) => e.trim()), t[1] = t[1].toUpperCase(), t))) : null);
    }
    get highlightColors() {
      const { _highlightColors: t } = this;
      if (!t) return L(this, "highlightColors", null);
      const e = /* @__PURE__ */ new Map(), s = !!__privateGet(this, _$);
      for (const [i, n] of t) {
        const r = i.endsWith("_HCM");
        if (s && r) {
          e.set(i.replace("_HCM", ""), n);
          continue;
        }
        !s && !r && e.set(i, n);
      }
      return L(this, "highlightColors", e);
    }
    get highlightColorNames() {
      return L(this, "highlightColorNames", this.highlightColors ? new Map(Array.from(this.highlightColors, (t) => t.reverse())) : null);
    }
    getNonHCMColor(t) {
      if (!this._highlightColors) return t;
      const e = this.highlightColorNames.get(t);
      return this._highlightColors.get(e) || t;
    }
    getNonHCMColorName(t) {
      return this.highlightColorNames.get(t) || t;
    }
    setCurrentDrawingSession(t) {
      t ? (this.unselectAll(), this.disableUserSelect(true)) : this.disableUserSelect(false), __privateSet(this, _d, t);
    }
    setMainHighlightColorPicker(t) {
      __privateSet(this, _B, t);
    }
    editAltText(t, e = false) {
      var _a29;
      (_a29 = __privateGet(this, _r4)) == null ? void 0 : _a29.editAltText(this, t, e);
    }
    hasCommentManager() {
      return !!__privateGet(this, _l);
    }
    editComment(t, e, s, i) {
      var _a29;
      (_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.showDialog(this, t, e, s, i);
    }
    selectComment(t, e) {
      var _a29, _b7;
      (_b7 = (_a29 = __privateGet(this, _a4).get(t)) == null ? void 0 : _a29.getEditorByUID(e)) == null ? void 0 : _b7.toggleComment(true, true);
    }
    updateComment(t) {
      var _a29;
      (_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.updateComment(t.getData());
    }
    updatePopupColor(t) {
      var _a29;
      (_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.updatePopupColor(t);
    }
    removeComment(t) {
      var _a29;
      (_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.removeComments([
        t.uid
      ]);
    }
    deleteComment(t, e) {
      const s = () => {
        t.comment = e;
      }, i = () => {
        var _a29;
        (_a29 = this._editorUndoBar) == null ? void 0 : _a29.show(s, "comment"), this.toggleComment(null), t.comment = null;
      };
      this.addCommands({
        cmd: i,
        undo: s,
        mustExec: true
      });
    }
    toggleComment(t, e, s = void 0) {
      var _a29;
      (_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.toggleCommentPopup(t, e, s);
    }
    makeCommentColor(t, e) {
      var _a29;
      return t && ((_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.makeCommentColor(t, e)) || null;
    }
    getCommentDialogElement() {
      var _a29;
      return ((_a29 = __privateGet(this, _l)) == null ? void 0 : _a29.dialogElement) || null;
    }
    async waitForEditorsRendered(t) {
      if (__privateGet(this, _a4).has(t - 1)) return;
      const { resolve: e, promise: s } = Promise.withResolvers(), i = (n) => {
        n.pageNumber === t && (this._eventBus._off("editorsrendered", i), e());
      };
      this._eventBus.on("editorsrendered", i), await s;
    }
    getSignature(t) {
      var _a29;
      (_a29 = __privateGet(this, _U)) == null ? void 0 : _a29.getSignature({
        uiManager: this,
        editor: t
      });
    }
    get signatureManager() {
      return __privateGet(this, _U);
    }
    switchToMode(t, e) {
      this._eventBus.on("annotationeditormodechanged", e, {
        once: true,
        signal: this._signal
      }), this._eventBus.dispatch("showannotationeditorui", {
        source: this,
        mode: t
      });
    }
    setPreference(t, e) {
      this._eventBus.dispatch("setpreference", {
        source: this,
        name: t,
        value: e
      });
    }
    onSetPreference({ name: t, value: e }) {
      t === "enableNewAltTextWhenAddingImage" && __privateSet(this, _y, e);
    }
    onPageChanging({ pageNumber: t }) {
      __privateSet(this, _f, t - 1);
    }
    deletePage(t) {
      for (const e of this.getEditors(t)) e.remove();
      __privateGet(this, _a4).delete(t), __privateGet(this, _f) === t && __privateSet(this, _f, 0);
    }
    focusMainContainer() {
      __privateGet(this, _V).focus();
    }
    findParent(t, e) {
      for (const s of __privateGet(this, _a4).values()) {
        const { x: i, y: n, width: r, height: a } = s.div.getBoundingClientRect();
        if (t >= i && t <= i + r && e >= n && e <= n + a) return s;
      }
      return null;
    }
    disableUserSelect(t = false) {
      __privateGet(this, _J).classList.toggle("noUserSelect", t);
    }
    addShouldRescale(t) {
      __privateGet(this, _p).add(t);
    }
    removeShouldRescale(t) {
      __privateGet(this, _p).delete(t);
    }
    onScaleChanging({ scale: t }) {
      var _a29;
      this.commitOrRemove(), this.viewParameters.realScale = t * Qt.PDF_TO_CSS_UNITS;
      for (const e of __privateGet(this, _p)) e.onScaleChanging();
      (_a29 = __privateGet(this, _d)) == null ? void 0 : _a29.onScaleChanging();
    }
    onRotationChanging({ pagesRotation: t }) {
      this.commitOrRemove(), this.viewParameters.rotation = t;
    }
    highlightSelection(t = "", e = false) {
      const s = document.getSelection();
      if (!s || s.isCollapsed) return;
      const { anchorNode: i, anchorOffset: n, focusNode: r, focusOffset: a } = s, o = s.toString(), h = __privateMethod(this, _Ft_instances, Q_fn).call(this, s).closest(".textLayer"), c = this.getSelectionBoxes(h);
      if (!c) return;
      s.empty();
      const u = __privateMethod(this, _Ft_instances, tt_fn).call(this, h), f = __privateGet(this, _T) === R.NONE, g = () => {
        const p = u == null ? void 0 : u.createAndAddNewEditor({
          x: 0,
          y: 0
        }, false, {
          methodOfCreation: t,
          boxes: c,
          anchorNode: i,
          anchorOffset: n,
          focusNode: r,
          focusOffset: a,
          text: o
        });
        f && this.showAllEditors("highlight", true, true), e && (p == null ? void 0 : p.editComment());
      };
      if (f) {
        this.switchToMode(R.HIGHLIGHT, g);
        return;
      }
      g();
    }
    commentSelection(t = "") {
      this.highlightSelection(t, true);
    }
    getAndRemoveDataFromAnnotationStorage(t) {
      if (!__privateGet(this, _n4)) return null;
      const e = `${ce}${t}`, s = __privateGet(this, _n4).getRawValue(e);
      return s && __privateGet(this, _n4).remove(e), s;
    }
    addToAnnotationStorage(t) {
      !t.isEmpty() && __privateGet(this, _n4) && !__privateGet(this, _n4).has(t.id) && __privateGet(this, _n4).setValue(t.id, t);
    }
    a11yAlert(t, e = null) {
      const s = __privateGet(this, _Z);
      s && (s.setAttribute("data-l10n-id", t), e ? s.setAttribute("data-l10n-args", JSON.stringify(e)) : s.removeAttribute("data-l10n-args"));
    }
    blur() {
      if (this.isShiftKeyDown = false, __privateGet(this, _w) && (__privateSet(this, _w, false), __privateMethod(this, _Ft_instances, q_fn).call(this, "main_toolbar")), !this.hasSelection) return;
      const { activeElement: t } = document;
      for (const e of __privateGet(this, _S)) if (e.div.contains(t)) {
        __privateSet(this, _R, [
          e,
          t
        ]), e._focusEventsAllowed = false;
        break;
      }
    }
    focus() {
      if (!__privateGet(this, _R)) return;
      const [t, e] = __privateGet(this, _R);
      __privateSet(this, _R, null), e.addEventListener("focusin", () => {
        t._focusEventsAllowed = true;
      }, {
        once: true,
        signal: this._signal
      }), e.focus();
    }
    addEditListeners() {
      __privateMethod(this, _Ft_instances, et_fn).call(this), this.setEditingState(true);
    }
    removeEditListeners() {
      __privateMethod(this, _Ft_instances, ct_fn).call(this), this.setEditingState(false);
    }
    dragOver(t) {
      for (const { type: e } of t.dataTransfer.items) for (const s of __privateGet(this, _c2)) if (s.isHandlingMimeForPasting(e)) {
        t.dataTransfer.dropEffect = "copy", t.preventDefault();
        return;
      }
    }
    drop(t) {
      for (const e of t.dataTransfer.items) for (const s of __privateGet(this, _c2)) if (s.isHandlingMimeForPasting(e.type)) {
        s.paste(e, this.currentLayer), t.preventDefault();
        return;
      }
    }
    copy(t) {
      var _a29;
      if (t.preventDefault(), (_a29 = __privateGet(this, _e8)) == null ? void 0 : _a29.commitOrRemove(), !this.hasSelection) return;
      const e = [];
      for (const s of __privateGet(this, _S)) {
        const i = s.serialize(true);
        i && e.push(i);
      }
      e.length !== 0 && t.clipboardData.setData("application/pdfjs", JSON.stringify(e));
    }
    cut(t) {
      this.copy(t), this.delete();
    }
    async paste(t) {
      t.preventDefault();
      const { clipboardData: e } = t;
      for (const n of e.items) for (const r of __privateGet(this, _c2)) if (r.isHandlingMimeForPasting(n.type)) {
        r.paste(n, this.currentLayer);
        return;
      }
      let s = e.getData("application/pdfjs");
      if (!s) return;
      try {
        s = JSON.parse(s);
      } catch (n) {
        F(`paste: "${n.message}".`);
        return;
      }
      if (!Array.isArray(s)) return;
      this.unselectAll();
      const i = this.currentLayer;
      try {
        const n = [];
        for (const o of s) {
          const l = await i.deserialize(o);
          if (!l) return;
          n.push(l);
        }
        const r = () => {
          for (const o of n) __privateMethod(this, _Ft_instances, st_fn).call(this, o);
          __privateMethod(this, _Ft_instances, it_fn).call(this, n);
        }, a = () => {
          for (const o of n) o.remove();
        };
        this.addCommands({
          cmd: r,
          undo: a,
          mustExec: true
        });
      } catch (n) {
        F(`paste: "${n.message}".`);
      }
    }
    keydown(t) {
      !this.isShiftKeyDown && t.key === "Shift" && (this.isShiftKeyDown = true), __privateGet(this, _T) !== R.NONE && !this.isEditorHandlingKeyboard && Ft._keyboardManager.exec(this, t);
    }
    keyup(t) {
      this.isShiftKeyDown && t.key === "Shift" && (this.isShiftKeyDown = false, __privateGet(this, _w) && (__privateSet(this, _w, false), __privateMethod(this, _Ft_instances, q_fn).call(this, "main_toolbar")));
    }
    onEditingAction({ name: t }) {
      switch (t) {
        case "undo":
        case "redo":
        case "delete":
        case "selectAll":
          this[t]();
          break;
        case "highlightSelection":
          this.highlightSelection("context_menu");
          break;
        case "commentSelection":
          this.commentSelection("context_menu");
          break;
      }
    }
    setEditingState(t) {
      t ? (__privateMethod(this, _Ft_instances, lt_fn).call(this), __privateMethod(this, _Ft_instances, dt_fn).call(this), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        isEditing: __privateGet(this, _T) !== R.NONE,
        isEmpty: __privateMethod(this, _Ft_instances, K_fn).call(this),
        hasSomethingToUndo: __privateGet(this, _h2).hasSomethingToUndo(),
        hasSomethingToRedo: __privateGet(this, _h2).hasSomethingToRedo(),
        hasSelectedEditor: false
      })) : (__privateMethod(this, _Ft_instances, ht_fn).call(this), __privateMethod(this, _Ft_instances, ut_fn).call(this), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        isEditing: false
      }), this.disableUserSelect(false));
    }
    registerEditorTypes(t) {
      if (!__privateGet(this, _c2)) {
        __privateSet(this, _c2, t);
        for (const e of __privateGet(this, _c2)) __privateMethod(this, _Ft_instances, z_fn).call(this, e.defaultPropertiesToUpdate);
      }
    }
    getId() {
      return __privateGet(this, _M).id;
    }
    get currentLayer() {
      return __privateGet(this, _a4).get(__privateGet(this, _f));
    }
    getLayer(t) {
      return __privateGet(this, _a4).get(t);
    }
    get currentPageIndex() {
      return __privateGet(this, _f);
    }
    addLayer(t) {
      __privateGet(this, _a4).set(t.pageIndex, t), __privateGet(this, _P) ? t.enable() : t.disable();
    }
    removeLayer(t) {
      __privateGet(this, _a4).delete(t.pageIndex);
    }
    async updateMode(t, e = null, s = false, i = false, n = false, r = false) {
      var _a29, _b7, _c10, _d12, _e54, _f11;
      if (__privateGet(this, _T) !== t && !(__privateGet(this, _H2) && (await __privateGet(this, _H2).promise, !__privateGet(this, _H2)))) {
        if (__privateSet(this, _H2, Promise.withResolvers()), (_a29 = __privateGet(this, _d)) == null ? void 0 : _a29.commitOrRemove(), __privateGet(this, _T) === R.POPUP && ((_b7 = __privateGet(this, _l)) == null ? void 0 : _b7.hideSidebar()), (_c10 = __privateGet(this, _l)) == null ? void 0 : _c10.destroyPopup(), __privateSet(this, _T, t), t === R.NONE) {
          this.setEditingState(false), __privateMethod(this, _Ft_instances, gt_fn).call(this);
          for (const a of __privateGet(this, _s6).values()) a.hideStandaloneCommentButton();
          (_d12 = this._editorUndoBar) == null ? void 0 : _d12.hide(), this.toggleComment(null), __privateGet(this, _H2).resolve();
          return;
        }
        for (const a of __privateGet(this, _s6).values()) a.addStandaloneCommentButton();
        t === R.SIGNATURE && await ((_e54 = __privateGet(this, _U)) == null ? void 0 : _e54.loadSignatures()), s && H.clearPointerType(), this.setEditingState(true), await __privateMethod(this, _Ft_instances, pt_fn).call(this), this.unselectAll();
        for (const a of __privateGet(this, _a4).values()) a.updateMode(t);
        if (t === R.POPUP) {
          __privateGet(this, _i8) || __privateSet(this, _i8, await __privateGet(this, _W).getAnnotationsByType(new Set(__privateGet(this, _c2).map((l) => l._editorType))));
          const a = /* @__PURE__ */ new Set(), o = [];
          for (const l of __privateGet(this, _s6).values()) {
            const { annotationElementId: h, hasComment: c, deleted: u } = l;
            h && a.add(h), c && !u && o.push(l.getData());
          }
          for (const l of __privateGet(this, _i8)) {
            const { id: h, popupRef: c, contentsObj: u } = l;
            c && (u == null ? void 0 : u.str) && !a.has(h) && !__privateGet(this, _m).has(h) && o.push(l);
          }
          (_f11 = __privateGet(this, _l)) == null ? void 0 : _f11.showSidebar(o);
        }
        if (!e) {
          i && this.addNewEditorFromKeyboard(), __privateGet(this, _H2).resolve();
          return;
        }
        for (const a of __privateGet(this, _s6).values()) a.uid === e ? (this.setSelected(a), r ? a.editComment() : n ? a.enterInEditMode() : a.focus()) : a.unselect();
        __privateGet(this, _H2).resolve();
      }
    }
    addNewEditorFromKeyboard() {
      this.currentLayer.canCreateNewEmptyEditor() && this.currentLayer.addNewEditor();
    }
    updateToolbar(t) {
      t.mode !== __privateGet(this, _T) && this._eventBus.dispatch("switchannotationeditormode", {
        source: this,
        ...t
      });
    }
    updateParams(t, e) {
      if (__privateGet(this, _c2)) {
        switch (t) {
          case O.CREATE:
            this.currentLayer.addNewEditor(e);
            return;
          case O.HIGHLIGHT_SHOW_ALL:
            this._eventBus.dispatch("reporttelemetry", {
              source: this,
              details: {
                type: "editing",
                data: {
                  type: "highlight",
                  action: "toggle_visibility"
                }
              }
            }), (__privateGet(this, _X) || __privateSet(this, _X, /* @__PURE__ */ new Map())).set(t, e), this.showAllEditors("highlight", e);
            break;
        }
        if (this.hasSelection) for (const s of __privateGet(this, _S)) s.updateParams(t, e);
        else for (const s of __privateGet(this, _c2)) s.updateDefaultParams(t, e);
      }
    }
    showAllEditors(t, e, s = false) {
      var _a29;
      for (const n of __privateGet(this, _s6).values()) n.editorType === t && n.show(e);
      (((_a29 = __privateGet(this, _X)) == null ? void 0 : _a29.get(O.HIGHLIGHT_SHOW_ALL)) ?? true) !== e && __privateMethod(this, _Ft_instances, z_fn).call(this, [
        [
          O.HIGHLIGHT_SHOW_ALL,
          e
        ]
      ]);
    }
    enableWaiting(t = false) {
      if (__privateGet(this, _O) !== t) {
        __privateSet(this, _O, t);
        for (const e of __privateGet(this, _a4).values()) t ? e.disableClick() : e.enableClick(), e.div.classList.toggle("waiting", t);
      }
    }
    *getEditors(t) {
      for (const e of __privateGet(this, _s6).values()) e.pageIndex === t && (yield e);
    }
    getEditor(t) {
      return __privateGet(this, _s6).get(t);
    }
    addEditor(t) {
      __privateGet(this, _s6).set(t.id, t);
    }
    removeEditor(t) {
      var _a29, _b7;
      t.div.contains(document.activeElement) && (__privateGet(this, _E) && clearTimeout(__privateGet(this, _E)), __privateSet(this, _E, setTimeout(() => {
        this.focusMainContainer(), __privateSet(this, _E, null);
      }, 0))), __privateGet(this, _s6).delete(t.id), t.annotationElementId && ((_a29 = __privateGet(this, _F)) == null ? void 0 : _a29.delete(t.annotationElementId)), this.unselect(t), (!t.annotationElementId || !__privateGet(this, _m).has(t.annotationElementId)) && ((_b7 = __privateGet(this, _n4)) == null ? void 0 : _b7.remove(t.id));
    }
    addDeletedAnnotationElement(t) {
      __privateGet(this, _m).add(t.annotationElementId), this.addChangedExistingAnnotation(t), t.deleted = true;
    }
    isDeletedAnnotationElement(t) {
      return __privateGet(this, _m).has(t);
    }
    removeDeletedAnnotationElement(t) {
      __privateGet(this, _m).delete(t.annotationElementId), this.removeChangedExistingAnnotation(t), t.deleted = false;
    }
    setActiveEditor(t) {
      __privateGet(this, _e8) !== t && (__privateSet(this, _e8, t), t && __privateMethod(this, _Ft_instances, z_fn).call(this, t.propertiesToUpdate));
    }
    updateUI(t) {
      __privateGet(this, _Ft_instances, mt_get) === t && __privateMethod(this, _Ft_instances, z_fn).call(this, t.propertiesToUpdate);
    }
    updateUIForDefaultProperties(t) {
      __privateMethod(this, _Ft_instances, z_fn).call(this, t.defaultPropertiesToUpdate);
    }
    toggleSelected(t) {
      if (__privateGet(this, _S).has(t)) {
        __privateGet(this, _S).delete(t), t.unselect(), __privateMethod(this, _Ft_instances, D_fn).call(this, {
          hasSelectedEditor: this.hasSelection
        });
        return;
      }
      __privateGet(this, _S).add(t), t.select(), __privateMethod(this, _Ft_instances, z_fn).call(this, t.propertiesToUpdate), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSelectedEditor: true
      });
    }
    setSelected(t) {
      var _a29;
      this.updateToolbar({
        mode: t.mode,
        editId: t.uid
      }), (_a29 = __privateGet(this, _d)) == null ? void 0 : _a29.commitOrRemove();
      for (const e of __privateGet(this, _S)) e !== t && e.unselect();
      __privateGet(this, _S).clear(), __privateGet(this, _S).add(t), t.select(), __privateMethod(this, _Ft_instances, z_fn).call(this, t.propertiesToUpdate), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSelectedEditor: true
      });
    }
    isSelected(t) {
      return __privateGet(this, _S).has(t);
    }
    get firstSelectedEditor() {
      return __privateGet(this, _S).values().next().value;
    }
    unselect(t) {
      t.unselect(), __privateGet(this, _S).delete(t), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSelectedEditor: this.hasSelection
      });
    }
    get hasSelection() {
      return __privateGet(this, _S).size !== 0;
    }
    get isEnterHandled() {
      return __privateGet(this, _S).size === 1 && this.firstSelectedEditor.isEnterHandled;
    }
    undo() {
      var _a29;
      __privateGet(this, _h2).undo(), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSomethingToUndo: __privateGet(this, _h2).hasSomethingToUndo(),
        hasSomethingToRedo: true,
        isEmpty: __privateMethod(this, _Ft_instances, K_fn).call(this)
      }), (_a29 = this._editorUndoBar) == null ? void 0 : _a29.hide();
    }
    redo() {
      __privateGet(this, _h2).redo(), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSomethingToUndo: true,
        hasSomethingToRedo: __privateGet(this, _h2).hasSomethingToRedo(),
        isEmpty: __privateMethod(this, _Ft_instances, K_fn).call(this)
      });
    }
    addCommands(t) {
      __privateGet(this, _h2).add(t), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSomethingToUndo: true,
        hasSomethingToRedo: false,
        isEmpty: __privateMethod(this, _Ft_instances, K_fn).call(this)
      });
    }
    cleanUndoStack(t) {
      __privateGet(this, _h2).cleanType(t);
    }
    delete() {
      var _a29;
      this.commitOrRemove();
      const t = (_a29 = this.currentLayer) == null ? void 0 : _a29.endDrawingSession(true);
      if (!this.hasSelection && !t) return;
      const e = t ? [
        t
      ] : [
        ...__privateGet(this, _S)
      ], s = () => {
        var _a30;
        (_a30 = this._editorUndoBar) == null ? void 0 : _a30.show(i, e.length === 1 ? e[0].editorType : e.length);
        for (const n of e) n.remove();
      }, i = () => {
        for (const n of e) __privateMethod(this, _Ft_instances, st_fn).call(this, n);
      };
      this.addCommands({
        cmd: s,
        undo: i,
        mustExec: true
      });
    }
    commitOrRemove() {
      var _a29;
      (_a29 = __privateGet(this, _e8)) == null ? void 0 : _a29.commitOrRemove();
    }
    hasSomethingToControl() {
      return __privateGet(this, _e8) || this.hasSelection;
    }
    selectAll() {
      for (const t of __privateGet(this, _S)) t.commit();
      __privateMethod(this, _Ft_instances, it_fn).call(this, __privateGet(this, _s6).values());
    }
    unselectAll() {
      var _a29;
      if (!(__privateGet(this, _e8) && (__privateGet(this, _e8).commitOrRemove(), __privateGet(this, _T) !== R.NONE)) && !((_a29 = __privateGet(this, _d)) == null ? void 0 : _a29.commitOrRemove()) && this.hasSelection) {
        for (const t of __privateGet(this, _S)) t.unselect();
        __privateGet(this, _S).clear(), __privateMethod(this, _Ft_instances, D_fn).call(this, {
          hasSelectedEditor: false
        });
      }
    }
    translateSelectedEditors(t, e, s = false) {
      if (s || this.commitOrRemove(), !this.hasSelection) return;
      __privateGet(this, _j)[0] += t, __privateGet(this, _j)[1] += e;
      const [i, n] = __privateGet(this, _j), r = [
        ...__privateGet(this, _S)
      ], a = 1e3;
      __privateGet(this, _N) && clearTimeout(__privateGet(this, _N)), __privateSet(this, _N, setTimeout(() => {
        __privateSet(this, _N, null), __privateGet(this, _j)[0] = __privateGet(this, _j)[1] = 0, this.addCommands({
          cmd: () => {
            for (const o of r) __privateGet(this, _s6).has(o.id) && (o.translateInPage(i, n), o.translationDone());
          },
          undo: () => {
            for (const o of r) __privateGet(this, _s6).has(o.id) && (o.translateInPage(-i, -n), o.translationDone());
          },
          mustExec: false
        });
      }, a));
      for (const o of r) o.translateInPage(t, e), o.translationDone();
    }
    setUpDragSession() {
      if (this.hasSelection) {
        this.disableUserSelect(true), __privateSet(this, _g, /* @__PURE__ */ new Map());
        for (const t of __privateGet(this, _S)) __privateGet(this, _g).set(t, {
          savedX: t.x,
          savedY: t.y,
          savedPageIndex: t.pageIndex,
          newX: 0,
          newY: 0,
          newPageIndex: -1
        });
      }
    }
    endDragSession() {
      if (!__privateGet(this, _g)) return false;
      this.disableUserSelect(false);
      const t = __privateGet(this, _g);
      __privateSet(this, _g, null);
      let e = false;
      for (const [{ x: i, y: n, pageIndex: r }, a] of t) a.newX = i, a.newY = n, a.newPageIndex = r, e || (e = i !== a.savedX || n !== a.savedY || r !== a.savedPageIndex);
      if (!e) return false;
      const s = (i, n, r, a) => {
        if (__privateGet(this, _s6).has(i.id)) {
          const o = __privateGet(this, _a4).get(a);
          o ? i._setParentAndPosition(o, n, r) : (i.pageIndex = a, i.x = n, i.y = r);
        }
      };
      return this.addCommands({
        cmd: () => {
          for (const [i, { newX: n, newY: r, newPageIndex: a }] of t) s(i, n, r, a);
        },
        undo: () => {
          for (const [i, { savedX: n, savedY: r, savedPageIndex: a }] of t) s(i, n, r, a);
        },
        mustExec: true
      }), true;
    }
    dragSelectedEditors(t, e) {
      if (__privateGet(this, _g)) for (const s of __privateGet(this, _g).keys()) s.drag(t, e);
    }
    rebuild(t) {
      if (t.parent === null) {
        const e = this.getLayer(t.pageIndex);
        e ? (e.changeParent(t), e.addOrRebuild(t)) : (this.addEditor(t), this.addToAnnotationStorage(t), t.rebuild());
      } else t.parent.addOrRebuild(t);
    }
    get isEditorHandlingKeyboard() {
      var _a29;
      return ((_a29 = this.getActive()) == null ? void 0 : _a29.shouldGetKeyboardEvents()) || __privateGet(this, _S).size === 1 && this.firstSelectedEditor.shouldGetKeyboardEvents();
    }
    isActive(t) {
      return __privateGet(this, _e8) === t;
    }
    getActive() {
      return __privateGet(this, _e8);
    }
    getMode() {
      return __privateGet(this, _T);
    }
    isEditingMode() {
      return __privateGet(this, _T) !== R.NONE;
    }
    get imageManager() {
      return L(this, "imageManager", new vs());
    }
    getSelectionBoxes(t) {
      if (!t) return null;
      const e = document.getSelection();
      for (let l = 0, h = e.rangeCount; l < h; l++) if (!t.contains(e.getRangeAt(l).commonAncestorContainer)) return null;
      const { x: s, y: i, width: n, height: r } = t.getBoundingClientRect();
      let a;
      switch (t.getAttribute("data-main-rotation")) {
        case "90":
          a = (l, h, c, u) => ({
            x: (h - i) / r,
            y: 1 - (l + c - s) / n,
            width: u / r,
            height: c / n
          });
          break;
        case "180":
          a = (l, h, c, u) => ({
            x: 1 - (l + c - s) / n,
            y: 1 - (h + u - i) / r,
            width: c / n,
            height: u / r
          });
          break;
        case "270":
          a = (l, h, c, u) => ({
            x: 1 - (h + u - i) / r,
            y: (l - s) / n,
            width: u / r,
            height: c / n
          });
          break;
        default:
          a = (l, h, c, u) => ({
            x: (l - s) / n,
            y: (h - i) / r,
            width: c / n,
            height: u / r
          });
          break;
      }
      const o = [];
      for (let l = 0, h = e.rangeCount; l < h; l++) {
        const c = e.getRangeAt(l);
        if (!c.collapsed) for (const { x: u, y: f, width: g, height: p } of c.getClientRects()) g === 0 || p === 0 || o.push(a(u, f, g, p));
      }
      return o.length === 0 ? null : o;
    }
    addChangedExistingAnnotation({ annotationElementId: t, id: e }) {
      (__privateGet(this, _o2) || __privateSet(this, _o2, /* @__PURE__ */ new Map())).set(t, e);
    }
    removeChangedExistingAnnotation({ annotationElementId: t }) {
      var _a29;
      (_a29 = __privateGet(this, _o2)) == null ? void 0 : _a29.delete(t);
    }
    renderAnnotationElement(t) {
      var _a29;
      const e = (_a29 = __privateGet(this, _o2)) == null ? void 0 : _a29.get(t.data.id);
      if (!e) return;
      const s = __privateGet(this, _n4).getRawValue(e);
      s && (__privateGet(this, _T) === R.NONE && !s.hasBeenModified || s.renderAnnotationElement(t));
    }
    setMissingCanvas(t, e, s) {
      var _a29;
      const i = (_a29 = __privateGet(this, _F)) == null ? void 0 : _a29.get(t);
      i && (i.setCanvas(e, s), __privateGet(this, _F).delete(t));
    }
    addMissingCanvas(t, e) {
      (__privateGet(this, _F) || __privateSet(this, _F, /* @__PURE__ */ new Map())).set(t, e);
    }
  }, _t10 = new WeakMap(), _e8 = new WeakMap(), _i8 = new WeakMap(), _s6 = new WeakMap(), _a4 = new WeakMap(), _r4 = new WeakMap(), _n4 = new WeakMap(), _o2 = new WeakMap(), _h2 = new WeakMap(), _l = new WeakMap(), _u = new WeakMap(), _d = new WeakMap(), _f = new WeakMap(), _m = new WeakMap(), _g = new WeakMap(), _c2 = new WeakMap(), _p = new WeakMap(), _b2 = new WeakMap(), _A = new WeakMap(), _y = new WeakMap(), _C = new WeakMap(), _E = new WeakMap(), _v = new WeakMap(), _x = new WeakMap(), _w = new WeakMap(), __ = new WeakMap(), _M = new WeakMap(), _P = new WeakMap(), _k = new WeakMap(), _O = new WeakMap(), _I = new WeakMap(), _R = new WeakMap(), _B = new WeakMap(), _F = new WeakMap(), _G = new WeakMap(), _T = new WeakMap(), _S = new WeakMap(), _L = new WeakMap(), _U = new WeakMap(), _$ = new WeakMap(), _X = new WeakMap(), _W = new WeakMap(), _Y = new WeakMap(), _j = new WeakMap(), _N = new WeakMap(), _V = new WeakMap(), _J = new WeakMap(), _Z = new WeakMap(), _H2 = new WeakMap(), _Ft_instances = new WeakSet(), Q_fn = function({ anchorNode: t }) {
    return t.nodeType === Node.TEXT_NODE ? t.parentElement : t;
  }, tt_fn = function(t) {
    const { currentLayer: e } = this;
    if (e.hasTextLayer(t)) return e;
    for (const s of __privateGet(this, _a4).values()) if (s.hasTextLayer(t)) return s;
    return null;
  }, nt_fn = function(t) {
    var _a29;
    this.commitOrRemove(), (_a29 = this.currentLayer) == null ? void 0 : _a29.endDrawingSession(false);
  }, rt_fn = function() {
    const t = document.getSelection();
    if (!t || t.isCollapsed) return;
    const s = __privateMethod(this, _Ft_instances, Q_fn).call(this, t).closest(".textLayer"), i = this.getSelectionBoxes(s);
    i && (__privateGet(this, __) || __privateSet(this, __, new pn(this)), __privateGet(this, __).show(s, i, this.direction === "ltr"));
  }, at_fn = function() {
    var _a29, _b7, _c10;
    const t = document.getSelection();
    if (!t || t.isCollapsed) {
      __privateGet(this, _L) && ((_a29 = __privateGet(this, __)) == null ? void 0 : _a29.hide(), __privateSet(this, _L, null), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSelectedText: false
      }));
      return;
    }
    const { anchorNode: e } = t;
    if (e === __privateGet(this, _L)) return;
    const i = __privateMethod(this, _Ft_instances, Q_fn).call(this, t).closest(".textLayer");
    if (!i) {
      __privateGet(this, _L) && ((_b7 = __privateGet(this, __)) == null ? void 0 : _b7.hide(), __privateSet(this, _L, null), __privateMethod(this, _Ft_instances, D_fn).call(this, {
        hasSelectedText: false
      }));
      return;
    }
    if ((_c10 = __privateGet(this, __)) == null ? void 0 : _c10.hide(), __privateSet(this, _L, e), __privateMethod(this, _Ft_instances, D_fn).call(this, {
      hasSelectedText: true
    }), !(__privateGet(this, _T) !== R.HIGHLIGHT && __privateGet(this, _T) !== R.NONE) && (__privateGet(this, _T) === R.HIGHLIGHT && this.showAllEditors("highlight", true, true), __privateSet(this, _w, this.isShiftKeyDown), !this.isShiftKeyDown)) {
      const n = __privateGet(this, _T) === R.HIGHLIGHT ? __privateMethod(this, _Ft_instances, tt_fn).call(this, i) : null;
      if (n == null ? void 0 : n.toggleDrawing(), __privateGet(this, _k)) {
        const r = new AbortController(), a = this.combinedSignal(r), o = (l) => {
          l.type === "pointerup" && l.button !== 0 || (r.abort(), n == null ? void 0 : n.toggleDrawing(true), l.type === "pointerup" && __privateMethod(this, _Ft_instances, q_fn).call(this, "main_toolbar"));
        };
        window.addEventListener("pointerup", o, {
          signal: a
        }), window.addEventListener("blur", o, {
          signal: a
        });
      } else n == null ? void 0 : n.toggleDrawing(true), __privateMethod(this, _Ft_instances, q_fn).call(this, "main_toolbar");
    }
  }, q_fn = function(t = "") {
    __privateGet(this, _T) === R.HIGHLIGHT ? this.highlightSelection(t) : __privateGet(this, _b2) && __privateMethod(this, _Ft_instances, rt_fn).call(this);
  }, ot_fn = function() {
    document.addEventListener("selectionchange", __privateMethod(this, _Ft_instances, at_fn).bind(this), {
      signal: this._signal
    });
  }, lt_fn = function() {
    if (__privateGet(this, _v)) return;
    __privateSet(this, _v, new AbortController());
    const t = this.combinedSignal(__privateGet(this, _v));
    window.addEventListener("focus", this.focus.bind(this), {
      signal: t
    }), window.addEventListener("blur", this.blur.bind(this), {
      signal: t
    });
  }, ht_fn = function() {
    var _a29;
    (_a29 = __privateGet(this, _v)) == null ? void 0 : _a29.abort(), __privateSet(this, _v, null);
  }, et_fn = function() {
    if (__privateGet(this, _I)) return;
    __privateSet(this, _I, new AbortController());
    const t = this.combinedSignal(__privateGet(this, _I));
    window.addEventListener("keydown", this.keydown.bind(this), {
      signal: t
    }), window.addEventListener("keyup", this.keyup.bind(this), {
      signal: t
    });
  }, ct_fn = function() {
    var _a29;
    (_a29 = __privateGet(this, _I)) == null ? void 0 : _a29.abort(), __privateSet(this, _I, null);
  }, dt_fn = function() {
    if (__privateGet(this, _u)) return;
    __privateSet(this, _u, new AbortController());
    const t = this.combinedSignal(__privateGet(this, _u));
    document.addEventListener("copy", this.copy.bind(this), {
      signal: t
    }), document.addEventListener("cut", this.cut.bind(this), {
      signal: t
    }), document.addEventListener("paste", this.paste.bind(this), {
      signal: t
    });
  }, ut_fn = function() {
    var _a29;
    (_a29 = __privateGet(this, _u)) == null ? void 0 : _a29.abort(), __privateSet(this, _u, null);
  }, ft_fn = function() {
    const t = this._signal;
    document.addEventListener("dragover", this.dragOver.bind(this), {
      signal: t
    }), document.addEventListener("drop", this.drop.bind(this), {
      signal: t
    });
  }, D_fn = function(t) {
    Object.entries(t).some(([s, i]) => __privateGet(this, _Y)[s] !== i) && (this._eventBus.dispatch("annotationeditorstateschanged", {
      source: this,
      details: Object.assign(__privateGet(this, _Y), t)
    }), __privateGet(this, _T) === R.HIGHLIGHT && t.hasSelectedEditor === false && __privateMethod(this, _Ft_instances, z_fn).call(this, [
      [
        O.HIGHLIGHT_FREE,
        true
      ]
    ]));
  }, z_fn = function(t) {
    this._eventBus.dispatch("annotationeditorparamschanged", {
      source: this,
      details: t
    });
  }, pt_fn = async function() {
    if (!__privateGet(this, _P)) {
      __privateSet(this, _P, true);
      const t = [];
      for (const e of __privateGet(this, _a4).values()) t.push(e.enable());
      await Promise.all(t);
      for (const e of __privateGet(this, _s6).values()) e.enable();
    }
  }, gt_fn = function() {
    if (this.unselectAll(), __privateGet(this, _P)) {
      __privateSet(this, _P, false);
      for (const t of __privateGet(this, _a4).values()) t.disable();
      for (const t of __privateGet(this, _s6).values()) t.disable();
    }
  }, st_fn = function(t) {
    const e = __privateGet(this, _a4).get(t.pageIndex);
    e ? e.addOrRebuild(t) : (this.addEditor(t), this.addToAnnotationStorage(t));
  }, mt_get = function() {
    let t = null;
    for (t of __privateGet(this, _S)) ;
    return t;
  }, K_fn = function() {
    if (__privateGet(this, _s6).size === 0) return true;
    if (__privateGet(this, _s6).size === 1) for (const t of __privateGet(this, _s6).values()) return t.isEmpty();
    return false;
  }, it_fn = function(t) {
    for (const e of __privateGet(this, _S)) e.unselect();
    __privateGet(this, _S).clear();
    for (const e of t) e.isEmpty() || (__privateGet(this, _S).add(e), e.select());
    __privateMethod(this, _Ft_instances, D_fn).call(this, {
      hasSelectedEditor: this.hasSelection
    });
  }, __publicField(_d2, "TRANSLATE_SMALL", 1), __publicField(_d2, "TRANSLATE_BIG", 10), _d2);
  const _xt = class _xt {
    constructor(t) {
      __privateAdd(this, _xt_instances);
      __privateAdd(this, _t11, null);
      __privateAdd(this, _e9, false);
      __privateAdd(this, _i9, null);
      __privateAdd(this, _s7, null);
      __privateAdd(this, _a5, null);
      __privateAdd(this, _r5, null);
      __privateAdd(this, _n5, false);
      __privateAdd(this, _o3, null);
      __privateAdd(this, _h3, null);
      __privateAdd(this, _l2, null);
      __privateAdd(this, _u2, null);
      __privateAdd(this, _d3, false);
      __privateSet(this, _h3, t), __privateSet(this, _d3, t._uiManager.useNewAltTextFlow), __privateGet(_xt, _f2) || __privateSet(_xt, _f2, Object.freeze({
        added: "pdfjs-editor-new-alt-text-added-button",
        "added-label": "pdfjs-editor-new-alt-text-added-button-label",
        missing: "pdfjs-editor-new-alt-text-missing-button",
        "missing-label": "pdfjs-editor-new-alt-text-missing-button-label",
        review: "pdfjs-editor-new-alt-text-to-review-button",
        "review-label": "pdfjs-editor-new-alt-text-to-review-button-label"
      }));
    }
    static initialize(t) {
      _xt._l10n ?? (_xt._l10n = t);
    }
    async render() {
      const t = __privateSet(this, _i9, document.createElement("button"));
      t.className = "altText", t.tabIndex = "0";
      const e = __privateSet(this, _s7, document.createElement("span"));
      t.append(e), __privateGet(this, _d3) ? (t.classList.add("new"), t.setAttribute("data-l10n-id", __privateGet(_xt, _f2).missing), e.setAttribute("data-l10n-id", __privateGet(_xt, _f2)["missing-label"])) : (t.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-button"), e.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-button-label"));
      const s = __privateGet(this, _h3)._uiManager._signal;
      t.addEventListener("contextmenu", St, {
        signal: s
      }), t.addEventListener("pointerdown", (n) => n.stopPropagation(), {
        signal: s
      });
      const i = (n) => {
        n.preventDefault(), __privateGet(this, _h3)._uiManager.editAltText(__privateGet(this, _h3)), __privateGet(this, _d3) && __privateGet(this, _h3)._reportTelemetry({
          action: "pdfjs.image.alt_text.image_status_label_clicked",
          data: {
            label: __privateGet(this, _xt_instances, m_get2)
          }
        });
      };
      return t.addEventListener("click", i, {
        capture: true,
        signal: s
      }), t.addEventListener("keydown", (n) => {
        n.target === t && n.key === "Enter" && (__privateSet(this, _n5, true), i(n));
      }, {
        signal: s
      }), await __privateMethod(this, _xt_instances, g_fn).call(this), t;
    }
    finish() {
      __privateGet(this, _i9) && (__privateGet(this, _i9).focus({
        focusVisible: __privateGet(this, _n5)
      }), __privateSet(this, _n5, false));
    }
    isEmpty() {
      return __privateGet(this, _d3) ? __privateGet(this, _t11) === null : !__privateGet(this, _t11) && !__privateGet(this, _e9);
    }
    hasData() {
      return __privateGet(this, _d3) ? __privateGet(this, _t11) !== null || !!__privateGet(this, _l2) : this.isEmpty();
    }
    get guessedText() {
      return __privateGet(this, _l2);
    }
    async setGuessedText(t) {
      __privateGet(this, _t11) === null && (__privateSet(this, _l2, t), __privateSet(this, _u2, await _xt._l10n.get("pdfjs-editor-new-alt-text-generated-alt-text-with-disclaimer", {
        generatedAltText: t
      })), __privateMethod(this, _xt_instances, g_fn).call(this));
    }
    toggleAltTextBadge(t = false) {
      var _a29;
      if (!__privateGet(this, _d3) || __privateGet(this, _t11)) {
        (_a29 = __privateGet(this, _o3)) == null ? void 0 : _a29.remove(), __privateSet(this, _o3, null);
        return;
      }
      if (!__privateGet(this, _o3)) {
        const e = __privateSet(this, _o3, document.createElement("div"));
        e.className = "noAltTextBadge", __privateGet(this, _h3).div.append(e);
      }
      __privateGet(this, _o3).classList.toggle("hidden", !t);
    }
    serialize(t) {
      let e = __privateGet(this, _t11);
      return !t && __privateGet(this, _l2) === e && (e = __privateGet(this, _u2)), {
        altText: e,
        decorative: __privateGet(this, _e9),
        guessedText: __privateGet(this, _l2),
        textWithDisclaimer: __privateGet(this, _u2)
      };
    }
    get data() {
      return {
        altText: __privateGet(this, _t11),
        decorative: __privateGet(this, _e9)
      };
    }
    set data({ altText: t, decorative: e, guessedText: s, textWithDisclaimer: i, cancel: n = false }) {
      s && (__privateSet(this, _l2, s), __privateSet(this, _u2, i)), !(__privateGet(this, _t11) === t && __privateGet(this, _e9) === e) && (n || (__privateSet(this, _t11, t), __privateSet(this, _e9, e)), __privateMethod(this, _xt_instances, g_fn).call(this));
    }
    toggle(t = false) {
      __privateGet(this, _i9) && (!t && __privateGet(this, _r5) && (clearTimeout(__privateGet(this, _r5)), __privateSet(this, _r5, null)), __privateGet(this, _i9).disabled = !t);
    }
    shown() {
      __privateGet(this, _h3)._reportTelemetry({
        action: "pdfjs.image.alt_text.image_status_label_displayed",
        data: {
          label: __privateGet(this, _xt_instances, m_get2)
        }
      });
    }
    destroy() {
      var _a29, _b7;
      (_a29 = __privateGet(this, _i9)) == null ? void 0 : _a29.remove(), __privateSet(this, _i9, null), __privateSet(this, _s7, null), __privateSet(this, _a5, null), (_b7 = __privateGet(this, _o3)) == null ? void 0 : _b7.remove(), __privateSet(this, _o3, null);
    }
  };
  _t11 = new WeakMap();
  _e9 = new WeakMap();
  _i9 = new WeakMap();
  _s7 = new WeakMap();
  _a5 = new WeakMap();
  _r5 = new WeakMap();
  _n5 = new WeakMap();
  _o3 = new WeakMap();
  _h3 = new WeakMap();
  _l2 = new WeakMap();
  _u2 = new WeakMap();
  _d3 = new WeakMap();
  _f2 = new WeakMap();
  _xt_instances = new WeakSet();
  m_get2 = function() {
    return __privateGet(this, _t11) && "added" || __privateGet(this, _t11) === null && this.guessedText && "review" || "missing";
  };
  g_fn = async function() {
    var _a29, _b7, _c10, _d12;
    const t = __privateGet(this, _i9);
    if (!t) return;
    if (__privateGet(this, _d3)) {
      if (t.classList.toggle("done", !!__privateGet(this, _t11)), t.setAttribute("data-l10n-id", __privateGet(_xt, _f2)[__privateGet(this, _xt_instances, m_get2)]), (_a29 = __privateGet(this, _s7)) == null ? void 0 : _a29.setAttribute("data-l10n-id", __privateGet(_xt, _f2)[`${__privateGet(this, _xt_instances, m_get2)}-label`]), !__privateGet(this, _t11)) {
        (_b7 = __privateGet(this, _a5)) == null ? void 0 : _b7.remove();
        return;
      }
    } else {
      if (!__privateGet(this, _t11) && !__privateGet(this, _e9)) {
        t.classList.remove("done"), (_c10 = __privateGet(this, _a5)) == null ? void 0 : _c10.remove();
        return;
      }
      t.classList.add("done"), t.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-edit-button");
    }
    let e = __privateGet(this, _a5);
    if (!e) {
      __privateSet(this, _a5, e = document.createElement("span")), e.className = "tooltip", e.setAttribute("role", "tooltip"), e.id = `alt-text-tooltip-${__privateGet(this, _h3).id}`;
      const i = 100, n = __privateGet(this, _h3)._uiManager._signal;
      n.addEventListener("abort", () => {
        clearTimeout(__privateGet(this, _r5)), __privateSet(this, _r5, null);
      }, {
        once: true
      }), t.addEventListener("mouseenter", () => {
        __privateSet(this, _r5, setTimeout(() => {
          __privateSet(this, _r5, null), __privateGet(this, _a5).classList.add("show"), __privateGet(this, _h3)._reportTelemetry({
            action: "alt_text_tooltip"
          });
        }, i));
      }, {
        signal: n
      }), t.addEventListener("mouseleave", () => {
        var _a30;
        __privateGet(this, _r5) && (clearTimeout(__privateGet(this, _r5)), __privateSet(this, _r5, null)), (_a30 = __privateGet(this, _a5)) == null ? void 0 : _a30.classList.remove("show");
      }, {
        signal: n
      });
    }
    __privateGet(this, _e9) ? e.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-decorative-tooltip") : (e.removeAttribute("data-l10n-id"), e.textContent = __privateGet(this, _t11)), e.parentNode || t.append(e), (_d12 = __privateGet(this, _h3).getElementForAltText()) == null ? void 0 : _d12.setAttribute("aria-describedby", e.id);
  };
  __privateAdd(_xt, _f2, null);
  __publicField(_xt, "_l10n", null);
  let xt = _xt;
  class we {
    constructor(t) {
      __privateAdd(this, _we_instances);
      __privateAdd(this, _t12, null);
      __privateAdd(this, _e10, null);
      __privateAdd(this, _i10, false);
      __privateAdd(this, _s8, null);
      __privateAdd(this, _a6, null);
      __privateAdd(this, _r6, null);
      __privateAdd(this, _n6, null);
      __privateAdd(this, _o4, null);
      __privateAdd(this, _h4, false);
      __privateAdd(this, _l3, null);
      __privateSet(this, _s8, t);
    }
    renderForToolbar() {
      const t = __privateSet(this, _e10, document.createElement("button"));
      return t.className = "comment", __privateMethod(this, _we_instances, u_fn3).call(this, t, false);
    }
    renderForStandalone() {
      const t = __privateSet(this, _t12, document.createElement("button"));
      t.className = "annotationCommentButton";
      const e = __privateGet(this, _s8).commentButtonPosition;
      if (e) {
        const { style: s } = t;
        s.insetInlineEnd = `calc(${100 * (__privateGet(this, _s8)._uiManager.direction === "ltr" ? 1 - e[0] : e[0])}% - var(--comment-button-dim))`, s.top = `calc(${100 * e[1]}% - var(--comment-button-dim))`;
        const i = __privateGet(this, _s8).commentButtonColor;
        i && (s.backgroundColor = i);
      }
      return __privateMethod(this, _we_instances, u_fn3).call(this, t, true);
    }
    focusButton() {
      setTimeout(() => {
        var _a29;
        (_a29 = __privateGet(this, _t12) ?? __privateGet(this, _e10)) == null ? void 0 : _a29.focus();
      }, 0);
    }
    onUpdatedColor() {
      if (!__privateGet(this, _t12)) return;
      const t = __privateGet(this, _s8).commentButtonColor;
      t && (__privateGet(this, _t12).style.backgroundColor = t), __privateGet(this, _s8)._uiManager.updatePopupColor(__privateGet(this, _s8));
    }
    get commentButtonWidth() {
      var _a29;
      return (((_a29 = __privateGet(this, _t12)) == null ? void 0 : _a29.getBoundingClientRect().width) ?? 0) / __privateGet(this, _s8).parent.boundingClientRect.width;
    }
    get commentPopupPositionInLayer() {
      if (__privateGet(this, _l3)) return __privateGet(this, _l3);
      if (!__privateGet(this, _t12)) return null;
      const { x: t, y: e, height: s } = __privateGet(this, _t12).getBoundingClientRect(), { x: i, y: n, width: r, height: a } = __privateGet(this, _s8).parent.boundingClientRect;
      return [
        (t - i) / r,
        (e + s - n) / a
      ];
    }
    set commentPopupPositionInLayer(t) {
      __privateSet(this, _l3, t);
    }
    hasDefaultPopupPosition() {
      return __privateGet(this, _l3) === null;
    }
    removeStandaloneCommentButton() {
      var _a29;
      (_a29 = __privateGet(this, _t12)) == null ? void 0 : _a29.remove(), __privateSet(this, _t12, null);
    }
    removeToolbarCommentButton() {
      var _a29;
      (_a29 = __privateGet(this, _e10)) == null ? void 0 : _a29.remove(), __privateSet(this, _e10, null);
    }
    setCommentButtonStates({ selected: t, hasPopup: e }) {
      __privateGet(this, _t12) && (__privateGet(this, _t12).classList.toggle("selected", t), __privateGet(this, _t12).ariaExpanded = e);
    }
    edit(t) {
      const e = this.commentPopupPositionInLayer;
      let s, i;
      if (e) [s, i] = e;
      else {
        [s, i] = __privateGet(this, _s8).commentButtonPosition;
        const { width: h, height: c, x: u, y: f } = __privateGet(this, _s8);
        s = u + s * h, i = f + i * c;
      }
      const n = __privateGet(this, _s8).parent.boundingClientRect, { x: r, y: a, width: o, height: l } = n;
      __privateGet(this, _s8)._uiManager.editComment(__privateGet(this, _s8), r + s * o, a + i * l, {
        ...t,
        parentDimensions: n
      });
    }
    finish() {
      __privateGet(this, _e10) && (__privateGet(this, _e10).focus({
        focusVisible: __privateGet(this, _i10)
      }), __privateSet(this, _i10, false));
    }
    isDeleted() {
      return __privateGet(this, _h4) || __privateGet(this, _n6) === "";
    }
    isEmpty() {
      return __privateGet(this, _n6) === null;
    }
    hasBeenEdited() {
      return this.isDeleted() || __privateGet(this, _n6) !== __privateGet(this, _a6);
    }
    serialize() {
      return this.data;
    }
    get data() {
      return {
        text: __privateGet(this, _n6),
        richText: __privateGet(this, _r6),
        date: __privateGet(this, _o4),
        deleted: this.isDeleted()
      };
    }
    set data(t) {
      if (t !== __privateGet(this, _n6) && __privateSet(this, _r6, null), t === null) {
        __privateSet(this, _n6, ""), __privateSet(this, _h4, true);
        return;
      }
      __privateSet(this, _n6, t), __privateSet(this, _o4, /* @__PURE__ */ new Date()), __privateSet(this, _h4, false);
    }
    restoreData({ text: t, richText: e, date: s }) {
      __privateSet(this, _n6, t), __privateSet(this, _r6, e), __privateSet(this, _o4, s), __privateSet(this, _h4, false);
    }
    setInitialText(t, e = null) {
      __privateSet(this, _a6, t), this.data = t, __privateSet(this, _o4, null), __privateSet(this, _r6, e);
    }
    shown() {
    }
    destroy() {
      var _a29, _b7;
      (_a29 = __privateGet(this, _e10)) == null ? void 0 : _a29.remove(), __privateSet(this, _e10, null), (_b7 = __privateGet(this, _t12)) == null ? void 0 : _b7.remove(), __privateSet(this, _t12, null), __privateSet(this, _n6, ""), __privateSet(this, _r6, null), __privateSet(this, _o4, null), __privateSet(this, _s8, null), __privateSet(this, _i10, false), __privateSet(this, _h4, false);
    }
  }
  _t12 = new WeakMap();
  _e10 = new WeakMap();
  _i10 = new WeakMap();
  _s8 = new WeakMap();
  _a6 = new WeakMap();
  _r6 = new WeakMap();
  _n6 = new WeakMap();
  _o4 = new WeakMap();
  _h4 = new WeakMap();
  _l3 = new WeakMap();
  _we_instances = new WeakSet();
  u_fn3 = function(t, e) {
    if (!__privateGet(this, _s8)._uiManager.hasCommentManager()) return null;
    t.tabIndex = "0", t.ariaHasPopup = "dialog", e ? (t.ariaControls = "commentPopup", t.setAttribute("data-l10n-id", "pdfjs-show-comment-button")) : (t.ariaControlsElements = [
      __privateGet(this, _s8)._uiManager.getCommentDialogElement()
    ], t.setAttribute("data-l10n-id", "pdfjs-editor-add-comment-button"));
    const s = __privateGet(this, _s8)._uiManager._signal;
    if (!(s instanceof AbortSignal) || s.aborted) return t;
    t.addEventListener("contextmenu", St, {
      signal: s
    }), e && (t.addEventListener("focusin", (n) => {
      __privateGet(this, _s8)._focusEventsAllowed = false, K(n);
    }, {
      capture: true,
      signal: s
    }), t.addEventListener("focusout", (n) => {
      __privateGet(this, _s8)._focusEventsAllowed = true, K(n);
    }, {
      capture: true,
      signal: s
    })), t.addEventListener("pointerdown", (n) => n.stopPropagation(), {
      signal: s
    });
    const i = (n) => {
      n.preventDefault(), t === __privateGet(this, _e10) ? this.edit() : __privateGet(this, _s8).toggleComment(true);
    };
    return t.addEventListener("click", i, {
      capture: true,
      signal: s
    }), t.addEventListener("keydown", (n) => {
      n.target === t && n.key === "Enter" && (__privateSet(this, _i10, true), i(n));
    }, {
      signal: s
    }), t.addEventListener("pointerenter", () => {
      __privateGet(this, _s8).toggleComment(false, true);
    }, {
      signal: s
    }), t.addEventListener("pointerleave", () => {
      __privateGet(this, _s8).toggleComment(false, false);
    }, {
      signal: s
    }), t;
  };
  Be = (_e12 = class {
    constructor({ container: t, isPinchingDisabled: e = null, isPinchingStopped: s = null, onPinchStart: i = null, onPinching: n = null, onPinchEnd: r = null, signal: a }) {
      __privateAdd(this, _Be_instances);
      __privateAdd(this, _t13);
      __privateAdd(this, _e11, false);
      __privateAdd(this, _i11, null);
      __privateAdd(this, _s9);
      __privateAdd(this, _a7);
      __privateAdd(this, _r7);
      __privateAdd(this, _n7);
      __privateAdd(this, _o5, null);
      __privateAdd(this, _h5);
      __privateAdd(this, _l4, null);
      __privateAdd(this, _u3);
      __privateAdd(this, _d4, null);
      __privateSet(this, _t13, t), __privateSet(this, _i11, s), __privateSet(this, _s9, e), __privateSet(this, _a7, i), __privateSet(this, _r7, n), __privateSet(this, _n7, r), __privateSet(this, _u3, new AbortController()), __privateSet(this, _h5, AbortSignal.any([
        a,
        __privateGet(this, _u3).signal
      ])), t.addEventListener("touchstart", __privateMethod(this, _Be_instances, f_fn2).bind(this), {
        passive: false,
        signal: __privateGet(this, _h5)
      });
    }
    get MIN_TOUCH_DISTANCE_TO_PINCH() {
      return 35 / Pt.pixelRatio;
    }
    destroy() {
      var _a29, _b7;
      (_a29 = __privateGet(this, _u3)) == null ? void 0 : _a29.abort(), __privateSet(this, _u3, null), (_b7 = __privateGet(this, _o5)) == null ? void 0 : _b7.abort(), __privateSet(this, _o5, null);
    }
  }, _t13 = new WeakMap(), _e11 = new WeakMap(), _i11 = new WeakMap(), _s9 = new WeakMap(), _a7 = new WeakMap(), _r7 = new WeakMap(), _n7 = new WeakMap(), _o5 = new WeakMap(), _h5 = new WeakMap(), _l4 = new WeakMap(), _u3 = new WeakMap(), _d4 = new WeakMap(), _Be_instances = new WeakSet(), f_fn2 = function(t) {
    var _a29, _b7, _c10;
    if ((_a29 = __privateGet(this, _s9)) == null ? void 0 : _a29.call(this)) return;
    if (t.touches.length === 1) {
      if (__privateGet(this, _o5)) return;
      const i = __privateSet(this, _o5, new AbortController()), n = AbortSignal.any([
        __privateGet(this, _h5),
        i.signal
      ]), r = __privateGet(this, _t13), a = {
        capture: true,
        signal: n,
        passive: false
      }, o = (l) => {
        var _a30;
        l.pointerType === "touch" && ((_a30 = __privateGet(this, _o5)) == null ? void 0 : _a30.abort(), __privateSet(this, _o5, null));
      };
      r.addEventListener("pointerdown", (l) => {
        l.pointerType === "touch" && (K(l), o(l));
      }, a), r.addEventListener("pointerup", o, a), r.addEventListener("pointercancel", o, a);
      return;
    }
    if (!__privateGet(this, _d4)) {
      __privateSet(this, _d4, new AbortController());
      const i = AbortSignal.any([
        __privateGet(this, _h5),
        __privateGet(this, _d4).signal
      ]), n = __privateGet(this, _t13), r = {
        signal: i,
        capture: false,
        passive: false
      };
      n.addEventListener("touchmove", __privateMethod(this, _Be_instances, m_fn).bind(this), r);
      const a = __privateMethod(this, _Be_instances, g_fn2).bind(this);
      n.addEventListener("touchend", a, r), n.addEventListener("touchcancel", a, r), r.capture = true, n.addEventListener("pointerdown", K, r), n.addEventListener("pointermove", K, r), n.addEventListener("pointercancel", K, r), n.addEventListener("pointerup", K, r), (_b7 = __privateGet(this, _a7)) == null ? void 0 : _b7.call(this);
    }
    if (K(t), t.touches.length !== 2 || ((_c10 = __privateGet(this, _i11)) == null ? void 0 : _c10.call(this))) {
      __privateSet(this, _l4, null);
      return;
    }
    let [e, s] = t.touches;
    e.identifier > s.identifier && ([e, s] = [
      s,
      e
    ]), __privateSet(this, _l4, {
      touch0X: e.screenX,
      touch0Y: e.screenY,
      touch1X: s.screenX,
      touch1Y: s.screenY
    });
  }, m_fn = function(t) {
    var _a29;
    if (!__privateGet(this, _l4) || t.touches.length !== 2) return;
    K(t);
    let [e, s] = t.touches;
    e.identifier > s.identifier && ([e, s] = [
      s,
      e
    ]);
    const { screenX: i, screenY: n } = e, { screenX: r, screenY: a } = s, o = __privateGet(this, _l4), { touch0X: l, touch0Y: h, touch1X: c, touch1Y: u } = o, f = c - l, g = u - h, p = r - i, b = a - n, m = Math.hypot(p, b) || 1, A = Math.hypot(f, g) || 1;
    if (!__privateGet(this, _e11) && Math.abs(A - m) <= Be.MIN_TOUCH_DISTANCE_TO_PINCH) return;
    if (o.touch0X = i, o.touch0Y = n, o.touch1X = r, o.touch1Y = a, !__privateGet(this, _e11)) {
      __privateSet(this, _e11, true);
      return;
    }
    const y = [
      (i + r) / 2,
      (n + a) / 2
    ];
    (_a29 = __privateGet(this, _r7)) == null ? void 0 : _a29.call(this, y, A, m);
  }, g_fn2 = function(t) {
    var _a29;
    t.touches.length >= 2 || (__privateGet(this, _d4) && (__privateGet(this, _d4).abort(), __privateSet(this, _d4, null), (_a29 = __privateGet(this, _n7)) == null ? void 0 : _a29.call(this)), __privateGet(this, _l4) && (K(t), __privateSet(this, _l4, null), __privateSet(this, _e11, false)));
  }, _e12);
  const _D = class _D {
    constructor(t) {
      __privateAdd(this, _D_instances);
      __privateAdd(this, _t14, null);
      __privateAdd(this, _e13, null);
      __privateAdd(this, _i12, null);
      __privateAdd(this, _s10, null);
      __privateAdd(this, _a8, null);
      __privateAdd(this, _r8, false);
      __privateAdd(this, _n8, null);
      __privateAdd(this, _o6, "");
      __privateAdd(this, _h6, null);
      __privateAdd(this, _l5, null);
      __privateAdd(this, _u4, null);
      __privateAdd(this, _d5, null);
      __privateAdd(this, _f3, null);
      __privateAdd(this, _m2, "");
      __privateAdd(this, _g2, false);
      __privateAdd(this, _c3, null);
      __privateAdd(this, _p2, false);
      __privateAdd(this, _b3, false);
      __privateAdd(this, _A2, false);
      __privateAdd(this, _y2, null);
      __privateAdd(this, _C2, 0);
      __privateAdd(this, _E2, 0);
      __privateAdd(this, _v2, null);
      __privateAdd(this, _x2, null);
      __publicField(this, "isSelected", false);
      __publicField(this, "_isCopy", false);
      __publicField(this, "_editToolbar", null);
      __publicField(this, "_initialOptions", /* @__PURE__ */ Object.create(null));
      __publicField(this, "_initialData", null);
      __publicField(this, "_isVisible", true);
      __publicField(this, "_uiManager", null);
      __publicField(this, "_focusEventsAllowed", true);
      __privateAdd(this, _w2, false);
      __privateAdd(this, __2, _D._zIndex++);
      this.parent = t.parent, this.id = t.id, this.width = this.height = null, this.pageIndex = t.parent.pageIndex, this.name = t.name, this.div = null, this._uiManager = t.uiManager, this.annotationElementId = null, this._willKeepAspectRatio = false, this._initialOptions.isCentered = t.isCentered, this._structTreeParentId = null, this.annotationElementId = t.annotationElementId || null, this.creationDate = t.creationDate || /* @__PURE__ */ new Date(), this.modificationDate = t.modificationDate || null, this.canAddComment = true;
      const { rotation: e, rawDims: { pageWidth: s, pageHeight: i, pageX: n, pageY: r } } = this.parent.viewport;
      this.rotation = e, this.pageRotation = (360 + e - this._uiManager.viewParameters.rotation) % 360, this.pageDimensions = [
        s,
        i
      ], this.pageTranslation = [
        n,
        r
      ];
      const [a, o] = this.parentDimensions;
      this.x = t.x / a, this.y = t.y / o, this.isAttachedToDOM = false, this.deleted = false;
    }
    static get _resizerKeyboardManager() {
      const t = _D.prototype._resizeWithKeyboard, e = Ft.TRANSLATE_SMALL, s = Ft.TRANSLATE_BIG;
      return L(this, "_resizerKeyboardManager", new ye([
        [
          [
            "ArrowLeft",
            "mac+ArrowLeft"
          ],
          t,
          {
            args: [
              -e,
              0
            ]
          }
        ],
        [
          [
            "ctrl+ArrowLeft",
            "mac+shift+ArrowLeft"
          ],
          t,
          {
            args: [
              -s,
              0
            ]
          }
        ],
        [
          [
            "ArrowRight",
            "mac+ArrowRight"
          ],
          t,
          {
            args: [
              e,
              0
            ]
          }
        ],
        [
          [
            "ctrl+ArrowRight",
            "mac+shift+ArrowRight"
          ],
          t,
          {
            args: [
              s,
              0
            ]
          }
        ],
        [
          [
            "ArrowUp",
            "mac+ArrowUp"
          ],
          t,
          {
            args: [
              0,
              -e
            ]
          }
        ],
        [
          [
            "ctrl+ArrowUp",
            "mac+shift+ArrowUp"
          ],
          t,
          {
            args: [
              0,
              -s
            ]
          }
        ],
        [
          [
            "ArrowDown",
            "mac+ArrowDown"
          ],
          t,
          {
            args: [
              0,
              e
            ]
          }
        ],
        [
          [
            "ctrl+ArrowDown",
            "mac+shift+ArrowDown"
          ],
          t,
          {
            args: [
              0,
              s
            ]
          }
        ],
        [
          [
            "Escape",
            "mac+Escape"
          ],
          _D.prototype._stopResizingWithKeyboard
        ]
      ]));
    }
    updatePageIndex(t) {
      this.pageIndex = t;
    }
    get editorType() {
      return Object.getPrototypeOf(this).constructor._type;
    }
    get mode() {
      return Object.getPrototypeOf(this).constructor._editorType;
    }
    static get isDrawer() {
      return false;
    }
    static get _defaultLineColor() {
      return L(this, "_defaultLineColor", this._colorManager.getHexCode("CanvasText"));
    }
    static deleteAnnotationElement(t) {
      const e = new bn({
        id: t.parent.getNextId(),
        parent: t.parent,
        uiManager: t._uiManager
      });
      e.annotationElementId = t.annotationElementId, e.deleted = true, e._uiManager.addToAnnotationStorage(e);
    }
    static initialize(t, e) {
      if (_D._l10n ?? (_D._l10n = t), _D._l10nResizer || (_D._l10nResizer = Object.freeze({
        topLeft: "pdfjs-editor-resizer-top-left",
        topMiddle: "pdfjs-editor-resizer-top-middle",
        topRight: "pdfjs-editor-resizer-top-right",
        middleRight: "pdfjs-editor-resizer-middle-right",
        bottomRight: "pdfjs-editor-resizer-bottom-right",
        bottomMiddle: "pdfjs-editor-resizer-bottom-middle",
        bottomLeft: "pdfjs-editor-resizer-bottom-left",
        middleLeft: "pdfjs-editor-resizer-middle-left"
      })), _D._borderLineWidth !== -1) return;
      const s = getComputedStyle(document.documentElement);
      _D._borderLineWidth = parseFloat(s.getPropertyValue("--outline-width")) || 0;
    }
    static updateDefaultParams(t, e) {
    }
    static get defaultPropertiesToUpdate() {
      return [];
    }
    static isHandlingMimeForPasting(t) {
      return false;
    }
    static paste(t, e) {
      $("Not implemented");
    }
    get propertiesToUpdate() {
      return [];
    }
    get _isDraggable() {
      return __privateGet(this, _w2);
    }
    set _isDraggable(t) {
      var _a29;
      __privateSet(this, _w2, t), (_a29 = this.div) == null ? void 0 : _a29.classList.toggle("draggable", t);
    }
    get uid() {
      return this.annotationElementId || this.id;
    }
    get isEnterHandled() {
      return true;
    }
    center() {
      const [t, e] = this.pageDimensions;
      switch (this.parentRotation) {
        case 90:
          this.x -= this.height * e / (t * 2), this.y += this.width * t / (e * 2);
          break;
        case 180:
          this.x += this.width / 2, this.y += this.height / 2;
          break;
        case 270:
          this.x += this.height * e / (t * 2), this.y -= this.width * t / (e * 2);
          break;
        default:
          this.x -= this.width / 2, this.y -= this.height / 2;
          break;
      }
      this.fixAndSetPosition();
    }
    addCommands(t) {
      this._uiManager.addCommands(t);
    }
    get currentLayer() {
      return this._uiManager.currentLayer;
    }
    setInBackground() {
      this.div.style.zIndex = 0;
    }
    setInForeground() {
      this.div.style.zIndex = __privateGet(this, __2);
    }
    setParent(t) {
      var _a29;
      t !== null ? (this.pageIndex = t.pageIndex, this.pageDimensions = t.pageDimensions) : (__privateMethod(this, _D_instances, N_fn).call(this), (_a29 = __privateGet(this, _d5)) == null ? void 0 : _a29.remove(), __privateSet(this, _d5, null)), this.parent = t;
    }
    focusin(t) {
      this._focusEventsAllowed && (__privateGet(this, _g2) ? __privateSet(this, _g2, false) : this.parent.setSelected(this));
    }
    focusout(t) {
      var _a29, _b7;
      !this._focusEventsAllowed || !this.isAttachedToDOM || ((_a29 = t.relatedTarget) == null ? void 0 : _a29.closest(`#${this.id}`)) || (t.preventDefault(), ((_b7 = this.parent) == null ? void 0 : _b7.isMultipleSelection) || this.commitOrRemove());
    }
    commitOrRemove() {
      this.isEmpty() ? this.remove() : this.commit();
    }
    commit() {
      this.isInEditMode() && this.addToAnnotationStorage();
    }
    addToAnnotationStorage() {
      this._uiManager.addToAnnotationStorage(this);
    }
    setAt(t, e, s, i) {
      const [n, r] = this.parentDimensions;
      [s, i] = this.screenToPageTranslation(s, i), this.x = (t + s) / n, this.y = (e + i) / r, this.fixAndSetPosition();
    }
    _moveAfterPaste(t, e) {
      const [s, i] = this.parentDimensions;
      this.setAt(t * s, e * i, this.width * s, this.height * i), this._onTranslated();
    }
    translate(t, e) {
      __privateMethod(this, _D_instances, M_fn).call(this, this.parentDimensions, t, e);
    }
    translateInPage(t, e) {
      __privateGet(this, _c3) || __privateSet(this, _c3, [
        this.x,
        this.y,
        this.width,
        this.height
      ]), __privateMethod(this, _D_instances, M_fn).call(this, this.pageDimensions, t, e), this.div.scrollIntoView({
        block: "nearest"
      });
    }
    translationDone() {
      this._onTranslated(this.x, this.y);
    }
    drag(t, e) {
      __privateGet(this, _c3) || __privateSet(this, _c3, [
        this.x,
        this.y,
        this.width,
        this.height
      ]);
      const { div: s, parentDimensions: [i, n] } = this;
      if (this.x += t / i, this.y += e / n, this.parent && (this.x < 0 || this.x > 1 || this.y < 0 || this.y > 1)) {
        const { x: c, y: u } = this.div.getBoundingClientRect();
        this.parent.findNewParent(this, c, u) && (this.x -= Math.floor(this.x), this.y -= Math.floor(this.y));
      }
      let { x: r, y: a } = this;
      const [o, l] = this.getBaseTranslation();
      r += o, a += l;
      const { style: h } = s;
      h.left = `${(100 * r).toFixed(2)}%`, h.top = `${(100 * a).toFixed(2)}%`, this._onTranslating(r, a), s.scrollIntoView({
        block: "nearest"
      });
    }
    _onTranslating(t, e) {
    }
    _onTranslated(t, e) {
    }
    get _hasBeenMoved() {
      return !!__privateGet(this, _c3) && (__privateGet(this, _c3)[0] !== this.x || __privateGet(this, _c3)[1] !== this.y);
    }
    get _hasBeenResized() {
      return !!__privateGet(this, _c3) && (__privateGet(this, _c3)[2] !== this.width || __privateGet(this, _c3)[3] !== this.height);
    }
    getBaseTranslation() {
      const [t, e] = this.parentDimensions, { _borderLineWidth: s } = _D, i = s / t, n = s / e;
      switch (this.rotation) {
        case 90:
          return [
            -i,
            n
          ];
        case 180:
          return [
            i,
            n
          ];
        case 270:
          return [
            i,
            -n
          ];
        default:
          return [
            -i,
            -n
          ];
      }
    }
    get _mustFixPosition() {
      return true;
    }
    fixAndSetPosition(t = this.rotation) {
      const { div: { style: e }, pageDimensions: [s, i] } = this;
      let { x: n, y: r, width: a, height: o } = this;
      if (a *= s, o *= i, n *= s, r *= i, this._mustFixPosition) switch (t) {
        case 0:
          n = ot(n, 0, s - a), r = ot(r, 0, i - o);
          break;
        case 90:
          n = ot(n, 0, s - o), r = ot(r, a, i);
          break;
        case 180:
          n = ot(n, a, s), r = ot(r, o, i);
          break;
        case 270:
          n = ot(n, o, s), r = ot(r, 0, i - a);
          break;
      }
      this.x = n /= s, this.y = r /= i;
      const [l, h] = this.getBaseTranslation();
      n += l, r += h, e.left = `${(100 * n).toFixed(2)}%`, e.top = `${(100 * r).toFixed(2)}%`, this.moveInDOM();
    }
    screenToPageTranslation(t, e) {
      var _a29;
      return __privateMethod(_a29 = _D, _D_static, P_fn).call(_a29, t, e, this.parentRotation);
    }
    pageTranslationToScreen(t, e) {
      var _a29;
      return __privateMethod(_a29 = _D, _D_static, P_fn).call(_a29, t, e, 360 - this.parentRotation);
    }
    get parentScale() {
      return this._uiManager.viewParameters.realScale;
    }
    get parentRotation() {
      return (this._uiManager.viewParameters.rotation + this.pageRotation) % 360;
    }
    get parentDimensions() {
      const { parentScale: t, pageDimensions: [e, s] } = this;
      return [
        e * t,
        s * t
      ];
    }
    setDims() {
      const { div: { style: t }, width: e, height: s } = this;
      t.width = `${(100 * e).toFixed(2)}%`, t.height = `${(100 * s).toFixed(2)}%`;
    }
    getInitialTranslation() {
      return [
        0,
        0
      ];
    }
    _onResized() {
    }
    static _round(t) {
      return Math.round(t * 1e4) / 1e4;
    }
    _onResizing() {
    }
    altTextFinish() {
      var _a29;
      (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.finish();
    }
    get toolbarButtons() {
      return null;
    }
    async addEditToolbar() {
      if (this._editToolbar || __privateGet(this, _b3)) return this._editToolbar;
      this._editToolbar = new le(this), this.div.append(this._editToolbar.render());
      const { toolbarButtons: t } = this;
      if (t) for (const [e, s] of t) await this._editToolbar.addButton(e, s);
      return this.hasComment || this._editToolbar.addButton("comment", this.addCommentButton()), this._editToolbar.addButton("delete"), this._editToolbar;
    }
    addCommentButtonInToolbar() {
      var _a29;
      (_a29 = this._editToolbar) == null ? void 0 : _a29.addButtonBefore("comment", this.addCommentButton(), ".deleteButton");
    }
    removeCommentButtonFromToolbar() {
      var _a29;
      (_a29 = this._editToolbar) == null ? void 0 : _a29.removeButton("comment");
    }
    removeEditToolbar() {
      var _a29, _b7;
      (_a29 = this._editToolbar) == null ? void 0 : _a29.remove(), this._editToolbar = null, (_b7 = __privateGet(this, _i12)) == null ? void 0 : _b7.destroy();
    }
    addContainer(t) {
      var _a29;
      const e = (_a29 = this._editToolbar) == null ? void 0 : _a29.div;
      e ? e.before(t) : this.div.append(t);
    }
    getClientDimensions() {
      return this.div.getBoundingClientRect();
    }
    createAltText() {
      return __privateGet(this, _i12) || (xt.initialize(_D._l10n), __privateSet(this, _i12, new xt(this)), __privateGet(this, _t14) && (__privateGet(this, _i12).data = __privateGet(this, _t14), __privateSet(this, _t14, null))), __privateGet(this, _i12);
    }
    get altTextData() {
      var _a29;
      return (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.data;
    }
    set altTextData(t) {
      __privateGet(this, _i12) && (__privateGet(this, _i12).data = t);
    }
    get guessedAltText() {
      var _a29;
      return (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.guessedText;
    }
    async setGuessedAltText(t) {
      var _a29;
      await ((_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.setGuessedText(t));
    }
    serializeAltText(t) {
      var _a29;
      return (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.serialize(t);
    }
    hasAltText() {
      return !!__privateGet(this, _i12) && !__privateGet(this, _i12).isEmpty();
    }
    hasAltTextData() {
      var _a29;
      return ((_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.hasData()) ?? false;
    }
    focusCommentButton() {
      var _a29;
      (_a29 = __privateGet(this, _s10)) == null ? void 0 : _a29.focusButton();
    }
    addCommentButton() {
      return this.canAddComment ? __privateGet(this, _s10) || __privateSet(this, _s10, new we(this)) : null;
    }
    addStandaloneCommentButton() {
      if (this._uiManager.hasCommentManager()) {
        if (__privateGet(this, _a8)) {
          this._uiManager.isEditingMode() && __privateGet(this, _a8).classList.remove("hidden");
          return;
        }
        this.hasComment && (__privateSet(this, _a8, __privateGet(this, _s10).renderForStandalone()), this.div.append(__privateGet(this, _a8)));
      }
    }
    removeStandaloneCommentButton() {
      __privateGet(this, _s10).removeStandaloneCommentButton(), __privateSet(this, _a8, null);
    }
    hideStandaloneCommentButton() {
      var _a29;
      (_a29 = __privateGet(this, _a8)) == null ? void 0 : _a29.classList.add("hidden");
    }
    get comment() {
      if (!__privateGet(this, _s10)) return null;
      const { data: { richText: t, text: e, date: s, deleted: i } } = __privateGet(this, _s10);
      return {
        text: e,
        richText: t,
        date: s,
        deleted: i,
        color: this.getNonHCMColor(),
        opacity: this.opacity ?? 1
      };
    }
    set comment(t) {
      __privateGet(this, _s10) || __privateSet(this, _s10, new we(this)), typeof t == "object" && t !== null ? __privateGet(this, _s10).restoreData(t) : __privateGet(this, _s10).data = t, this.hasComment ? (this.removeCommentButtonFromToolbar(), this.addStandaloneCommentButton(), this._uiManager.updateComment(this)) : (this.addCommentButtonInToolbar(), this.removeStandaloneCommentButton(), this._uiManager.removeComment(this));
    }
    setCommentData({ comment: t, popupRef: e, richText: s }) {
      if (!e || (__privateGet(this, _s10) || __privateSet(this, _s10, new we(this)), __privateGet(this, _s10).setInitialText(t, s), !this.annotationElementId)) return;
      const i = this._uiManager.getAndRemoveDataFromAnnotationStorage(this.annotationElementId);
      i && this.updateFromAnnotationLayer(i);
    }
    get hasEditedComment() {
      var _a29;
      return (_a29 = __privateGet(this, _s10)) == null ? void 0 : _a29.hasBeenEdited();
    }
    get hasDeletedComment() {
      var _a29;
      return (_a29 = __privateGet(this, _s10)) == null ? void 0 : _a29.isDeleted();
    }
    get hasComment() {
      return !!__privateGet(this, _s10) && !__privateGet(this, _s10).isEmpty() && !__privateGet(this, _s10).isDeleted();
    }
    async editComment(t) {
      __privateGet(this, _s10) || __privateSet(this, _s10, new we(this)), __privateGet(this, _s10).edit(t);
    }
    toggleComment(t, e = void 0) {
      this.hasComment && this._uiManager.toggleComment(this, t, e);
    }
    setSelectedCommentButton(t) {
      __privateGet(this, _s10).setSelectedButton(t);
    }
    addComment(t) {
      if (this.hasEditedComment) {
        const [, , , i] = t.rect, [n] = this.pageDimensions, [r] = this.pageTranslation, a = r + n + 1, o = i - 100, l = a + 180;
        t.popup = {
          contents: this.comment.text,
          deleted: this.comment.deleted,
          rect: [
            a,
            o,
            l,
            i
          ]
        };
      }
    }
    updateFromAnnotationLayer({ popup: { contents: t, deleted: e } }) {
      __privateGet(this, _s10).data = e ? null : t;
    }
    get parentBoundingClientRect() {
      return this.parent.boundingClientRect;
    }
    render() {
      var _a29;
      const t = this.div = document.createElement("div");
      t.setAttribute("data-editor-rotation", (360 - this.rotation) % 360), t.className = this.name, t.setAttribute("id", this.id), t.tabIndex = __privateGet(this, _r8) ? -1 : 0, t.setAttribute("role", "application"), this.defaultL10nId && t.setAttribute("data-l10n-id", this.defaultL10nId), this._isVisible || t.classList.add("hidden"), this.setInForeground(), __privateMethod(this, _D_instances, $_fn).call(this);
      const [e, s] = this.parentDimensions;
      this.parentRotation % 180 !== 0 && (t.style.maxWidth = `${(100 * s / e).toFixed(2)}%`, t.style.maxHeight = `${(100 * e / s).toFixed(2)}%`);
      const [i, n] = this.getInitialTranslation();
      return this.translate(i, n), yi(this, t, [
        "keydown",
        "pointerdown",
        "dblclick"
      ]), this.isResizable && this._uiManager._supportsPinchToZoom && (__privateGet(this, _x2) || __privateSet(this, _x2, new Be({
        container: t,
        isPinchingDisabled: () => !this.isSelected,
        onPinchStart: __privateMethod(this, _D_instances, G_fn).bind(this),
        onPinching: __privateMethod(this, _D_instances, T_fn).bind(this),
        onPinchEnd: __privateMethod(this, _D_instances, S_fn).bind(this),
        signal: this._uiManager._signal
      }))), this.addStandaloneCommentButton(), (_a29 = this._uiManager._editorUndoBar) == null ? void 0 : _a29.hide(), t;
    }
    pointerdown(t) {
      const { isMac: e } = nt.platform;
      if (t.button !== 0 || t.ctrlKey && e) {
        t.preventDefault();
        return;
      }
      if (__privateSet(this, _g2, true), this._isDraggable) {
        __privateMethod(this, _D_instances, U_fn).call(this, t);
        return;
      }
      __privateMethod(this, _D_instances, L_fn).call(this, t);
    }
    _onStartDragging() {
    }
    _onStopDragging() {
    }
    moveInDOM() {
      __privateGet(this, _y2) && clearTimeout(__privateGet(this, _y2)), __privateSet(this, _y2, setTimeout(() => {
        var _a29;
        __privateSet(this, _y2, null), (_a29 = this.parent) == null ? void 0 : _a29.moveEditorInDOM(this);
      }, 0));
    }
    _setParentAndPosition(t, e, s) {
      t.changeParent(this), this.x = e, this.y = s, this.fixAndSetPosition(), this._onTranslated();
    }
    getRect(t, e, s = this.rotation) {
      const i = this.parentScale, [n, r] = this.pageDimensions, [a, o] = this.pageTranslation, l = t / i, h = e / i, c = this.x * n, u = this.y * r, f = this.width * n, g = this.height * r;
      switch (s) {
        case 0:
          return [
            c + l + a,
            r - u - h - g + o,
            c + l + f + a,
            r - u - h + o
          ];
        case 90:
          return [
            c + h + a,
            r - u + l + o,
            c + h + g + a,
            r - u + l + f + o
          ];
        case 180:
          return [
            c - l - f + a,
            r - u + h + o,
            c - l + a,
            r - u + h + g + o
          ];
        case 270:
          return [
            c - h - g + a,
            r - u - l - f + o,
            c - h + a,
            r - u - l + o
          ];
        default:
          throw new Error("Invalid rotation");
      }
    }
    getRectInCurrentCoords(t, e) {
      const [s, i, n, r] = t, a = n - s, o = r - i;
      switch (this.rotation) {
        case 0:
          return [
            s,
            e - r,
            a,
            o
          ];
        case 90:
          return [
            s,
            e - i,
            o,
            a
          ];
        case 180:
          return [
            n,
            e - i,
            a,
            o
          ];
        case 270:
          return [
            n,
            e - r,
            o,
            a
          ];
        default:
          throw new Error("Invalid rotation");
      }
    }
    getPDFRect() {
      return this.getRect(0, 0);
    }
    getNonHCMColor() {
      return this.color && _D._colorManager.convert(this._uiManager.getNonHCMColor(this.color));
    }
    onUpdatedColor() {
      var _a29;
      (_a29 = __privateGet(this, _s10)) == null ? void 0 : _a29.onUpdatedColor();
    }
    getData() {
      const { comment: { text: t, color: e, date: s, opacity: i, deleted: n, richText: r }, uid: a, pageIndex: o, creationDate: l, modificationDate: h } = this;
      return {
        id: a,
        pageIndex: o,
        rect: this.getPDFRect(),
        richText: r,
        contentsObj: {
          str: t
        },
        creationDate: l,
        modificationDate: s || h,
        popupRef: !n,
        color: e,
        opacity: i
      };
    }
    onceAdded(t) {
    }
    isEmpty() {
      return false;
    }
    enableEditMode() {
      return this.isInEditMode() ? false : (this.parent.setEditingState(false), __privateSet(this, _b3, true), true);
    }
    disableEditMode() {
      return this.isInEditMode() ? (this.parent.setEditingState(true), __privateSet(this, _b3, false), true) : false;
    }
    isInEditMode() {
      return __privateGet(this, _b3);
    }
    shouldGetKeyboardEvents() {
      return __privateGet(this, _A2);
    }
    needsToBeRebuilt() {
      return this.div && !this.isAttachedToDOM;
    }
    get isOnScreen() {
      const { top: t, left: e, bottom: s, right: i } = this.getClientDimensions(), { innerHeight: n, innerWidth: r } = window;
      return e < r && i > 0 && t < n && s > 0;
    }
    rebuild() {
      __privateMethod(this, _D_instances, $_fn).call(this);
    }
    rotate(t) {
    }
    resize() {
    }
    serializeDeleted() {
      var _a29;
      return {
        id: this.annotationElementId,
        deleted: true,
        pageIndex: this.pageIndex,
        popupRef: ((_a29 = this._initialData) == null ? void 0 : _a29.popupRef) || ""
      };
    }
    serialize(t = false, e = null) {
      var _a29;
      return {
        annotationType: this.mode,
        pageIndex: this.pageIndex,
        rect: this.getPDFRect(),
        rotation: this.rotation,
        structTreeParentId: this._structTreeParentId,
        popupRef: ((_a29 = this._initialData) == null ? void 0 : _a29.popupRef) || ""
      };
    }
    static async deserialize(t, e, s) {
      const i = new this.prototype.constructor({
        parent: e,
        id: e.getNextId(),
        uiManager: s,
        annotationElementId: t.annotationElementId,
        creationDate: t.creationDate,
        modificationDate: t.modificationDate
      });
      i.rotation = t.rotation, __privateSet(i, _t14, t.accessibilityData), i._isCopy = t.isCopy || false;
      const [n, r] = i.pageDimensions, [a, o, l, h] = i.getRectInCurrentCoords(t.rect, r);
      return i.x = a / n, i.y = o / r, i.width = l / n, i.height = h / r, i;
    }
    get hasBeenModified() {
      return !!this.annotationElementId && (this.deleted || this.serialize() !== null);
    }
    remove() {
      var _a29, _b7, _c10;
      if ((_a29 = __privateGet(this, _f3)) == null ? void 0 : _a29.abort(), __privateSet(this, _f3, null), this.isEmpty() || this.commit(), this.parent ? this.parent.remove(this) : this._uiManager.removeEditor(this), this.hideCommentPopup(), __privateGet(this, _y2) && (clearTimeout(__privateGet(this, _y2)), __privateSet(this, _y2, null)), __privateMethod(this, _D_instances, N_fn).call(this), this.removeEditToolbar(), __privateGet(this, _v2)) {
        for (const t of __privateGet(this, _v2).values()) clearTimeout(t);
        __privateSet(this, _v2, null);
      }
      this.parent = null, (_b7 = __privateGet(this, _x2)) == null ? void 0 : _b7.destroy(), __privateSet(this, _x2, null), (_c10 = __privateGet(this, _d5)) == null ? void 0 : _c10.remove(), __privateSet(this, _d5, null);
    }
    get isResizable() {
      return false;
    }
    makeResizable() {
      this.isResizable && (__privateMethod(this, _D_instances, O_fn).call(this), __privateGet(this, _h6).classList.remove("hidden"));
    }
    get toolbarPosition() {
      return null;
    }
    get commentButtonPosition() {
      return this._uiManager.direction === "ltr" ? [
        1,
        0
      ] : [
        0,
        0
      ];
    }
    get commentButtonPositionInPage() {
      const { commentButtonPosition: [t, e] } = this, [s, i, n, r] = this.getPDFRect();
      return [
        _D._round(s + (n - s) * t),
        _D._round(i + (r - i) * (1 - e))
      ];
    }
    get commentButtonColor() {
      return this._uiManager.makeCommentColor(this.getNonHCMColor(), this.opacity);
    }
    get commentPopupPosition() {
      return __privateGet(this, _s10).commentPopupPositionInLayer;
    }
    set commentPopupPosition(t) {
      __privateGet(this, _s10).commentPopupPositionInLayer = t;
    }
    hasDefaultPopupPosition() {
      return __privateGet(this, _s10).hasDefaultPopupPosition();
    }
    get commentButtonWidth() {
      return __privateGet(this, _s10).commentButtonWidth;
    }
    get elementBeforePopup() {
      return this.div;
    }
    setCommentButtonStates(t) {
      var _a29;
      (_a29 = __privateGet(this, _s10)) == null ? void 0 : _a29.setCommentButtonStates(t);
    }
    keydown(t) {
      if (!this.isResizable || t.target !== this.div || t.key !== "Enter") return;
      this._uiManager.setSelected(this), __privateSet(this, _u4, {
        savedX: this.x,
        savedY: this.y,
        savedWidth: this.width,
        savedHeight: this.height
      });
      const e = __privateGet(this, _h6).children;
      if (!__privateGet(this, _e13)) {
        __privateSet(this, _e13, Array.from(e));
        const r = __privateMethod(this, _D_instances, X_fn).bind(this), a = __privateMethod(this, _D_instances, W_fn).bind(this), o = this._uiManager._signal;
        for (const l of __privateGet(this, _e13)) {
          const h = l.getAttribute("data-resizer-name");
          l.setAttribute("role", "spinbutton"), l.addEventListener("keydown", r, {
            signal: o
          }), l.addEventListener("blur", a, {
            signal: o
          }), l.addEventListener("focus", __privateMethod(this, _D_instances, Y_fn).bind(this, h), {
            signal: o
          }), l.setAttribute("data-l10n-id", _D._l10nResizer[h]);
        }
      }
      const s = __privateGet(this, _e13)[0];
      let i = 0;
      for (const r of e) {
        if (r === s) break;
        i++;
      }
      const n = (360 - this.rotation + this.parentRotation) % 360 / 90 * (__privateGet(this, _e13).length / 4);
      if (n !== i) {
        if (n < i) for (let a = 0; a < i - n; a++) __privateGet(this, _h6).append(__privateGet(this, _h6).firstElementChild);
        else if (n > i) for (let a = 0; a < n - i; a++) __privateGet(this, _h6).firstElementChild.before(__privateGet(this, _h6).lastElementChild);
        let r = 0;
        for (const a of e) {
          const l = __privateGet(this, _e13)[r++].getAttribute("data-resizer-name");
          a.setAttribute("data-l10n-id", _D._l10nResizer[l]);
        }
      }
      __privateMethod(this, _D_instances, j_fn).call(this, 0), __privateSet(this, _A2, true), __privateGet(this, _h6).firstElementChild.focus({
        focusVisible: true
      }), t.preventDefault(), t.stopImmediatePropagation();
    }
    _resizeWithKeyboard(t, e) {
      __privateGet(this, _A2) && __privateMethod(this, _D_instances, F_fn).call(this, __privateGet(this, _m2), {
        deltaX: t,
        deltaY: e,
        fromKeyboard: true
      });
    }
    _stopResizingWithKeyboard() {
      __privateMethod(this, _D_instances, N_fn).call(this), this.div.focus();
    }
    select() {
      var _a29, _b7, _c10;
      if (this.isSelected && this._editToolbar) {
        this._editToolbar.show();
        return;
      }
      if (this.isSelected = true, this.makeResizable(), (_a29 = this.div) == null ? void 0 : _a29.classList.add("selectedEditor"), !this._editToolbar) {
        this.addEditToolbar().then(() => {
          var _a30, _b8;
          ((_a30 = this.div) == null ? void 0 : _a30.classList.contains("selectedEditor")) && ((_b8 = this._editToolbar) == null ? void 0 : _b8.show());
        });
        return;
      }
      (_b7 = this._editToolbar) == null ? void 0 : _b7.show(), (_c10 = __privateGet(this, _i12)) == null ? void 0 : _c10.toggleAltTextBadge(false);
    }
    focus() {
      this.div && !this.div.contains(document.activeElement) && setTimeout(() => {
        var _a29;
        return (_a29 = this.div) == null ? void 0 : _a29.focus({
          preventScroll: true
        });
      }, 0);
    }
    unselect() {
      var _a29, _b7, _c10, _d12, _e54;
      this.isSelected && (this.isSelected = false, (_a29 = __privateGet(this, _h6)) == null ? void 0 : _a29.classList.add("hidden"), (_b7 = this.div) == null ? void 0 : _b7.classList.remove("selectedEditor"), ((_c10 = this.div) == null ? void 0 : _c10.contains(document.activeElement)) && this._uiManager.currentLayer.div.focus({
        preventScroll: true
      }), (_d12 = this._editToolbar) == null ? void 0 : _d12.hide(), (_e54 = __privateGet(this, _i12)) == null ? void 0 : _e54.toggleAltTextBadge(true), this.hideCommentPopup());
    }
    hideCommentPopup() {
      this.hasComment && this._uiManager.toggleComment(null);
    }
    updateParams(t, e) {
    }
    disableEditing() {
    }
    enableEditing() {
    }
    get canChangeContent() {
      return false;
    }
    enterInEditMode() {
      this.canChangeContent && (this.enableEditMode(), this.div.focus());
    }
    dblclick(t) {
      t.target.nodeName !== "BUTTON" && (this.enterInEditMode(), this.parent.updateToolbar({
        mode: this.constructor._editorType,
        editId: this.uid
      }));
    }
    getElementForAltText() {
      return this.div;
    }
    get contentDiv() {
      return this.div;
    }
    get isEditing() {
      return __privateGet(this, _p2);
    }
    set isEditing(t) {
      __privateSet(this, _p2, t), this.parent && (t ? (this.parent.setSelected(this), this.parent.setActiveEditor(this)) : this.parent.setActiveEditor(null));
    }
    static get MIN_SIZE() {
      return 16;
    }
    static canCreateNewEmptyEditor() {
      return true;
    }
    get telemetryInitialData() {
      return {
        action: "added"
      };
    }
    get telemetryFinalData() {
      return null;
    }
    _reportTelemetry(t, e = false) {
      if (e) {
        __privateGet(this, _v2) || __privateSet(this, _v2, /* @__PURE__ */ new Map());
        const { action: s } = t;
        let i = __privateGet(this, _v2).get(s);
        i && clearTimeout(i), i = setTimeout(() => {
          this._reportTelemetry(t), __privateGet(this, _v2).delete(s), __privateGet(this, _v2).size === 0 && __privateSet(this, _v2, null);
        }, _D._telemetryTimeout), __privateGet(this, _v2).set(s, i);
        return;
      }
      t.type || (t.type = this.editorType), this._uiManager._eventBus.dispatch("reporttelemetry", {
        source: this,
        details: {
          type: "editing",
          data: t
        }
      });
    }
    show(t = this._isVisible) {
      this.div.classList.toggle("hidden", !t), this._isVisible = t;
    }
    enable() {
      this.div && (this.div.tabIndex = 0), __privateSet(this, _r8, false);
    }
    disable() {
      this.div && (this.div.tabIndex = -1), __privateSet(this, _r8, true);
    }
    updateFakeAnnotationElement(t) {
      if (!__privateGet(this, _d5) && !this.deleted) {
        __privateSet(this, _d5, t.addFakeAnnotation(this));
        return;
      }
      if (this.deleted) {
        __privateGet(this, _d5).remove(), __privateSet(this, _d5, null);
        return;
      }
      (this.hasEditedComment || this._hasBeenMoved || this._hasBeenResized) && __privateGet(this, _d5).updateEdited({
        rect: this.getPDFRect(),
        popup: this.comment
      });
    }
    renderAnnotationElement(t) {
      if (this.deleted) return t.hide(), null;
      let e = t.container.querySelector(".annotationContent");
      if (!e) e = document.createElement("div"), e.classList.add("annotationContent", this.editorType), t.container.prepend(e);
      else if (e.nodeName === "CANVAS") {
        const s = e;
        e = document.createElement("div"), e.classList.add("annotationContent", this.editorType), s.before(e);
      }
      return e;
    }
    resetAnnotationElement(t) {
      const { firstElementChild: e } = t.container;
      (e == null ? void 0 : e.nodeName) === "DIV" && e.classList.contains("annotationContent") && e.remove();
    }
  };
  _t14 = new WeakMap();
  _e13 = new WeakMap();
  _i12 = new WeakMap();
  _s10 = new WeakMap();
  _a8 = new WeakMap();
  _r8 = new WeakMap();
  _n8 = new WeakMap();
  _o6 = new WeakMap();
  _h6 = new WeakMap();
  _l5 = new WeakMap();
  _u4 = new WeakMap();
  _d5 = new WeakMap();
  _f3 = new WeakMap();
  _m2 = new WeakMap();
  _g2 = new WeakMap();
  _c3 = new WeakMap();
  _p2 = new WeakMap();
  _b3 = new WeakMap();
  _A2 = new WeakMap();
  _y2 = new WeakMap();
  _C2 = new WeakMap();
  _E2 = new WeakMap();
  _v2 = new WeakMap();
  _x2 = new WeakMap();
  _w2 = new WeakMap();
  __2 = new WeakMap();
  _D_instances = new WeakSet();
  M_fn = function([t, e], s, i) {
    [s, i] = this.screenToPageTranslation(s, i), this.x += s / t, this.y += i / e, this._onTranslating(this.x, this.y), this.fixAndSetPosition();
  };
  _D_static = new WeakSet();
  P_fn = function(t, e, s) {
    switch (s) {
      case 90:
        return [
          e,
          -t
        ];
      case 180:
        return [
          -t,
          -e
        ];
      case 270:
        return [
          -e,
          t
        ];
      default:
        return [
          t,
          e
        ];
    }
  };
  k_fn = function(t) {
    switch (t) {
      case 90: {
        const [e, s] = this.pageDimensions;
        return [
          0,
          -e / s,
          s / e,
          0
        ];
      }
      case 180:
        return [
          -1,
          0,
          0,
          -1
        ];
      case 270: {
        const [e, s] = this.pageDimensions;
        return [
          0,
          e / s,
          -s / e,
          0
        ];
      }
      default:
        return [
          1,
          0,
          0,
          1
        ];
    }
  };
  O_fn = function() {
    if (__privateGet(this, _h6)) return;
    __privateSet(this, _h6, document.createElement("div")), __privateGet(this, _h6).classList.add("resizers");
    const t = this._willKeepAspectRatio ? [
      "topLeft",
      "topRight",
      "bottomRight",
      "bottomLeft"
    ] : [
      "topLeft",
      "topMiddle",
      "topRight",
      "middleRight",
      "bottomRight",
      "bottomMiddle",
      "bottomLeft",
      "middleLeft"
    ], e = this._uiManager._signal;
    for (const s of t) {
      const i = document.createElement("div");
      __privateGet(this, _h6).append(i), i.classList.add("resizer", s), i.setAttribute("data-resizer-name", s), i.addEventListener("pointerdown", __privateMethod(this, _D_instances, I_fn).bind(this, s), {
        signal: e
      }), i.addEventListener("contextmenu", St, {
        signal: e
      }), i.tabIndex = -1;
    }
    this.div.prepend(__privateGet(this, _h6));
  };
  I_fn = function(t, e) {
    var _a29;
    e.preventDefault();
    const { isMac: s } = nt.platform;
    if (e.button !== 0 || e.ctrlKey && s) return;
    (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.toggle(false);
    const i = this._isDraggable;
    this._isDraggable = false, __privateSet(this, _l5, [
      e.screenX,
      e.screenY
    ]);
    const n = new AbortController(), r = this._uiManager.combinedSignal(n);
    this.parent.togglePointerEvents(false), window.addEventListener("pointermove", __privateMethod(this, _D_instances, F_fn).bind(this, t), {
      passive: true,
      capture: true,
      signal: r
    }), window.addEventListener("touchmove", K, {
      passive: false,
      signal: r
    }), window.addEventListener("contextmenu", St, {
      signal: r
    }), __privateSet(this, _u4, {
      savedX: this.x,
      savedY: this.y,
      savedWidth: this.width,
      savedHeight: this.height
    });
    const a = this.parent.div.style.cursor, o = this.div.style.cursor;
    this.div.style.cursor = this.parent.div.style.cursor = window.getComputedStyle(e.target).cursor;
    const l = () => {
      var _a30;
      n.abort(), this.parent.togglePointerEvents(true), (_a30 = __privateGet(this, _i12)) == null ? void 0 : _a30.toggle(true), this._isDraggable = i, this.parent.div.style.cursor = a, this.div.style.cursor = o, __privateMethod(this, _D_instances, B_fn).call(this);
    };
    window.addEventListener("pointerup", l, {
      signal: r
    }), window.addEventListener("blur", l, {
      signal: r
    });
  };
  R_fn = function(t, e, s, i) {
    this.width = s, this.height = i, this.x = t, this.y = e, this.setDims(), this.fixAndSetPosition(), this._onResized();
  };
  B_fn = function() {
    if (!__privateGet(this, _u4)) return;
    const { savedX: t, savedY: e, savedWidth: s, savedHeight: i } = __privateGet(this, _u4);
    __privateSet(this, _u4, null);
    const n = this.x, r = this.y, a = this.width, o = this.height;
    n === t && r === e && a === s && o === i || this.addCommands({
      cmd: __privateMethod(this, _D_instances, R_fn).bind(this, n, r, a, o),
      undo: __privateMethod(this, _D_instances, R_fn).bind(this, t, e, s, i),
      mustExec: true
    });
  };
  F_fn = function(t, e) {
    const [s, i] = this.parentDimensions, n = this.x, r = this.y, a = this.width, o = this.height, l = _D.MIN_SIZE / s, h = _D.MIN_SIZE / i, c = __privateMethod(this, _D_instances, k_fn).call(this, this.rotation), u = (M, I) => [
      c[0] * M + c[2] * I,
      c[1] * M + c[3] * I
    ], f = __privateMethod(this, _D_instances, k_fn).call(this, 360 - this.rotation), g = (M, I) => [
      f[0] * M + f[2] * I,
      f[1] * M + f[3] * I
    ];
    let p, b, m = false, A = false;
    switch (t) {
      case "topLeft":
        m = true, p = (M, I) => [
          0,
          0
        ], b = (M, I) => [
          M,
          I
        ];
        break;
      case "topMiddle":
        p = (M, I) => [
          M / 2,
          0
        ], b = (M, I) => [
          M / 2,
          I
        ];
        break;
      case "topRight":
        m = true, p = (M, I) => [
          M,
          0
        ], b = (M, I) => [
          0,
          I
        ];
        break;
      case "middleRight":
        A = true, p = (M, I) => [
          M,
          I / 2
        ], b = (M, I) => [
          0,
          I / 2
        ];
        break;
      case "bottomRight":
        m = true, p = (M, I) => [
          M,
          I
        ], b = (M, I) => [
          0,
          0
        ];
        break;
      case "bottomMiddle":
        p = (M, I) => [
          M / 2,
          I
        ], b = (M, I) => [
          M / 2,
          0
        ];
        break;
      case "bottomLeft":
        m = true, p = (M, I) => [
          0,
          I
        ], b = (M, I) => [
          M,
          0
        ];
        break;
      case "middleLeft":
        A = true, p = (M, I) => [
          0,
          I / 2
        ], b = (M, I) => [
          M,
          I / 2
        ];
        break;
    }
    const y = p(a, o), v = b(a, o);
    let w = u(...v);
    const S = _D._round(n + w[0]), E = _D._round(r + w[1]);
    let _ = 1, C = 1, k, x;
    if (e.fromKeyboard) ({ deltaX: k, deltaY: x } = e);
    else {
      const { screenX: M, screenY: I } = e, [z, pt] = __privateGet(this, _l5);
      [k, x] = this.screenToPageTranslation(M - z, I - pt), __privateGet(this, _l5)[0] = M, __privateGet(this, _l5)[1] = I;
    }
    if ([k, x] = g(k / s, x / i), m) {
      const M = Math.hypot(a, o);
      _ = C = Math.max(Math.min(Math.hypot(v[0] - y[0] - k, v[1] - y[1] - x) / M, 1 / a, 1 / o), l / a, h / o);
    } else A ? _ = ot(Math.abs(v[0] - y[0] - k), l, 1) / a : C = ot(Math.abs(v[1] - y[1] - x), h, 1) / o;
    const j = _D._round(a * _), V = _D._round(o * C);
    w = u(...b(j, V));
    const N = S - w[0], J = E - w[1];
    __privateGet(this, _c3) || __privateSet(this, _c3, [
      this.x,
      this.y,
      this.width,
      this.height
    ]), this.width = j, this.height = V, this.x = N, this.y = J, this.setDims(), this.fixAndSetPosition(), this._onResizing();
  };
  G_fn = function() {
    var _a29;
    __privateSet(this, _u4, {
      savedX: this.x,
      savedY: this.y,
      savedWidth: this.width,
      savedHeight: this.height
    }), (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.toggle(false), this.parent.togglePointerEvents(false);
  };
  T_fn = function(t, e, s) {
    let n = 0.7 * (s / e) + 1 - 0.7;
    if (n === 1) return;
    const r = __privateMethod(this, _D_instances, k_fn).call(this, this.rotation), a = (S, E) => [
      r[0] * S + r[2] * E,
      r[1] * S + r[3] * E
    ], [o, l] = this.parentDimensions, h = this.x, c = this.y, u = this.width, f = this.height, g = _D.MIN_SIZE / o, p = _D.MIN_SIZE / l;
    n = Math.max(Math.min(n, 1 / u, 1 / f), g / u, p / f);
    const b = _D._round(u * n), m = _D._round(f * n);
    if (b === u && m === f) return;
    __privateGet(this, _c3) || __privateSet(this, _c3, [
      h,
      c,
      u,
      f
    ]);
    const A = a(u / 2, f / 2), y = _D._round(h + A[0]), v = _D._round(c + A[1]), w = a(b / 2, m / 2);
    this.x = y - w[0], this.y = v - w[1], this.width = b, this.height = m, this.setDims(), this.fixAndSetPosition(), this._onResizing();
  };
  S_fn = function() {
    var _a29;
    (_a29 = __privateGet(this, _i12)) == null ? void 0 : _a29.toggle(true), this.parent.togglePointerEvents(true), __privateMethod(this, _D_instances, B_fn).call(this);
  };
  L_fn = function(t) {
    const { isMac: e } = nt.platform;
    t.ctrlKey && !e || t.shiftKey || t.metaKey && e ? this.parent.toggleSelected(this) : this.parent.setSelected(this);
  };
  U_fn = function(t) {
    const { isSelected: e } = this;
    this._uiManager.setUpDragSession();
    let s = false;
    const i = new AbortController(), n = this._uiManager.combinedSignal(i), r = {
      capture: true,
      passive: false,
      signal: n
    }, a = (l) => {
      i.abort(), __privateSet(this, _n8, null), __privateSet(this, _g2, false), this._uiManager.endDragSession() || __privateMethod(this, _D_instances, L_fn).call(this, l), s && this._onStopDragging();
    };
    e && (__privateSet(this, _C2, t.clientX), __privateSet(this, _E2, t.clientY), __privateSet(this, _n8, t.pointerId), __privateSet(this, _o6, t.pointerType), window.addEventListener("pointermove", (l) => {
      s || (s = true, this._uiManager.toggleComment(this, true, false), this._onStartDragging());
      const { clientX: h, clientY: c, pointerId: u } = l;
      if (u !== __privateGet(this, _n8)) {
        K(l);
        return;
      }
      const [f, g] = this.screenToPageTranslation(h - __privateGet(this, _C2), c - __privateGet(this, _E2));
      __privateSet(this, _C2, h), __privateSet(this, _E2, c), this._uiManager.dragSelectedEditors(f, g);
    }, r), window.addEventListener("touchmove", K, r), window.addEventListener("pointerdown", (l) => {
      l.pointerType === __privateGet(this, _o6) && (__privateGet(this, _x2) || l.isPrimary) && a(l), K(l);
    }, r));
    const o = (l) => {
      if (!__privateGet(this, _n8) || __privateGet(this, _n8) === l.pointerId) {
        a(l);
        return;
      }
      K(l);
    };
    window.addEventListener("pointerup", o, {
      signal: n
    }), window.addEventListener("blur", o, {
      signal: n
    });
  };
  $_fn = function() {
    if (__privateGet(this, _f3) || !this.div) return;
    __privateSet(this, _f3, new AbortController());
    const t = this._uiManager.combinedSignal(__privateGet(this, _f3));
    this.div.addEventListener("focusin", this.focusin.bind(this), {
      signal: t
    }), this.div.addEventListener("focusout", this.focusout.bind(this), {
      signal: t
    });
  };
  X_fn = function(t) {
    _D._resizerKeyboardManager.exec(this, t);
  };
  W_fn = function(t) {
    var _a29;
    __privateGet(this, _A2) && ((_a29 = t.relatedTarget) == null ? void 0 : _a29.parentNode) !== __privateGet(this, _h6) && __privateMethod(this, _D_instances, N_fn).call(this);
  };
  Y_fn = function(t) {
    __privateSet(this, _m2, __privateGet(this, _A2) ? t : "");
  };
  j_fn = function(t) {
    if (__privateGet(this, _e13)) for (const e of __privateGet(this, _e13)) e.tabIndex = t;
  };
  N_fn = function() {
    __privateSet(this, _A2, false), __privateMethod(this, _D_instances, j_fn).call(this, -1), __privateMethod(this, _D_instances, B_fn).call(this);
  };
  __privateAdd(_D, _D_static);
  __publicField(_D, "_l10n", null);
  __publicField(_D, "_l10nResizer", null);
  __publicField(_D, "_borderLineWidth", -1);
  __publicField(_D, "_colorManager", new Ss());
  __publicField(_D, "_zIndex", 1);
  __publicField(_D, "_telemetryTimeout", 1e3);
  let D = _D;
  class bn extends D {
    constructor(t) {
      super(t), this.annotationElementId = t.annotationElementId, this.deleted = true;
    }
    serialize() {
      return this.serializeDeleted();
    }
  }
  const zs = 3285377520, At = 4294901760, Ct = 65535;
  class Ai {
    constructor(t) {
      this.h1 = t ? t & 4294967295 : zs, this.h2 = t ? t & 4294967295 : zs;
    }
    update(t) {
      let e, s;
      if (typeof t == "string") {
        e = new Uint8Array(t.length * 2), s = 0;
        for (let p = 0, b = t.length; p < b; p++) {
          const m = t.charCodeAt(p);
          m <= 255 ? e[s++] = m : (e[s++] = m >>> 8, e[s++] = m & 255);
        }
      } else if (ArrayBuffer.isView(t)) e = t.slice(), s = e.byteLength;
      else throw new Error("Invalid data format, must be a string or TypedArray.");
      const i = s >> 2, n = s - i * 4, r = new Uint32Array(e.buffer, 0, i);
      let a = 0, o = 0, l = this.h1, h = this.h2;
      const c = 3432918353, u = 461845907, f = c & Ct, g = u & Ct;
      for (let p = 0; p < i; p++) p & 1 ? (a = r[p], a = a * c & At | a * f & Ct, a = a << 15 | a >>> 17, a = a * u & At | a * g & Ct, l ^= a, l = l << 13 | l >>> 19, l = l * 5 + 3864292196) : (o = r[p], o = o * c & At | o * f & Ct, o = o << 15 | o >>> 17, o = o * u & At | o * g & Ct, h ^= o, h = h << 13 | h >>> 19, h = h * 5 + 3864292196);
      switch (a = 0, n) {
        case 3:
          a ^= e[i * 4 + 2] << 16;
        case 2:
          a ^= e[i * 4 + 1] << 8;
        case 1:
          a ^= e[i * 4], a = a * c & At | a * f & Ct, a = a << 15 | a >>> 17, a = a * u & At | a * g & Ct, i & 1 ? l ^= a : h ^= a;
      }
      this.h1 = l, this.h2 = h;
    }
    hexdigest() {
      let t = this.h1, e = this.h2;
      return t ^= e >>> 1, t = t * 3981806797 & At | t * 36045 & Ct, e = e * 4283543511 & At | ((e << 16 | t >>> 16) * 2950163797 & At) >>> 16, t ^= e >>> 1, t = t * 444984403 & At | t * 60499 & Ct, e = e * 3301882366 & At | ((e << 16 | t >>> 16) * 3120437893 & At) >>> 16, t ^= e >>> 1, (t >>> 0).toString(16).padStart(8, "0") + (e >>> 0).toString(16).padStart(8, "0");
    }
  }
  const fe = Object.freeze({
    map: null,
    hash: "",
    transfer: void 0
  });
  class Es {
    constructor() {
      __privateAdd(this, _Es_instances);
      __privateAdd(this, _t15, false);
      __privateAdd(this, _e14, null);
      __privateAdd(this, _i13, null);
      __privateAdd(this, _s11, /* @__PURE__ */ new Map());
      __publicField(this, "onSetModified", null);
      __publicField(this, "onResetModified", null);
      __publicField(this, "onAnnotationEditor", null);
    }
    getValue(t, e) {
      const s = __privateGet(this, _s11).get(t);
      return s === void 0 ? e : Object.assign(e, s);
    }
    getRawValue(t) {
      return __privateGet(this, _s11).get(t);
    }
    remove(t) {
      const e = __privateGet(this, _s11).get(t);
      if (e !== void 0 && (e instanceof D && __privateGet(this, _i13).delete(e.annotationElementId), __privateGet(this, _s11).delete(t), __privateGet(this, _s11).size === 0 && this.resetModified(), typeof this.onAnnotationEditor == "function")) {
        for (const s of __privateGet(this, _s11).values()) if (s instanceof D) return;
        this.onAnnotationEditor(null);
      }
    }
    setValue(t, e) {
      const s = __privateGet(this, _s11).get(t);
      let i = false;
      if (s !== void 0) for (const [n, r] of Object.entries(e)) s[n] !== r && (i = true, s[n] = r);
      else i = true, __privateGet(this, _s11).set(t, e);
      i && __privateMethod(this, _Es_instances, a_fn2).call(this), e instanceof D && ((__privateGet(this, _i13) || __privateSet(this, _i13, /* @__PURE__ */ new Map())).set(e.annotationElementId, e), typeof this.onAnnotationEditor == "function" && this.onAnnotationEditor(e.constructor._type));
    }
    has(t) {
      return __privateGet(this, _s11).has(t);
    }
    get size() {
      return __privateGet(this, _s11).size;
    }
    resetModified() {
      __privateGet(this, _t15) && (__privateSet(this, _t15, false), typeof this.onResetModified == "function" && this.onResetModified());
    }
    get print() {
      return new wi(this);
    }
    get serializable() {
      if (__privateGet(this, _s11).size === 0) return fe;
      const t = /* @__PURE__ */ new Map(), e = new Ai(), s = [], i = /* @__PURE__ */ Object.create(null);
      let n = false;
      for (const [r, a] of __privateGet(this, _s11)) {
        const o = a instanceof D ? a.serialize(false, i) : a;
        a.page && (a.pageIndex = a.page._pageIndex, delete a.page), o && (t.set(r, o), e.update(`${r}:${JSON.stringify(o)}`), n || (n = !!o.bitmap));
      }
      if (n) for (const r of t.values()) r.bitmap && s.push(r.bitmap);
      return t.size > 0 ? {
        map: t,
        hash: e.hexdigest(),
        transfer: s
      } : fe;
    }
    get editorStats() {
      let t = null;
      const e = /* @__PURE__ */ new Map();
      let s = 0, i = 0;
      for (const n of __privateGet(this, _s11).values()) {
        if (!(n instanceof D)) {
          n.popup && (n.popup.deleted ? i += 1 : s += 1);
          continue;
        }
        n.isCommentDeleted ? i += 1 : n.hasEditedComment && (s += 1);
        const r = n.telemetryFinalData;
        if (!r) continue;
        const { type: a } = r;
        e.has(a) || e.set(a, Object.getPrototypeOf(n).constructor), t || (t = /* @__PURE__ */ Object.create(null));
        const o = t[a] || (t[a] = /* @__PURE__ */ new Map());
        for (const [l, h] of Object.entries(r)) {
          if (l === "type") continue;
          const c = o.getOrInsertComputed(l, ys);
          c.set(h, (c.get(h) ?? 0) + 1);
        }
      }
      if ((i > 0 || s > 0) && (t || (t = /* @__PURE__ */ Object.create(null)), t.comments = {
        deleted: i,
        edited: s
      }), !t) return null;
      for (const [n, r] of e) t[n] = r.computeTelemetryFinalData(t[n]);
      return t;
    }
    resetModifiedIds() {
      __privateSet(this, _e14, null);
    }
    updateEditor(t, e) {
      var _a29;
      const s = (_a29 = __privateGet(this, _i13)) == null ? void 0 : _a29.get(t);
      return s ? (s.updateFromAnnotationLayer(e), true) : false;
    }
    getEditor(t) {
      var _a29;
      return ((_a29 = __privateGet(this, _i13)) == null ? void 0 : _a29.get(t)) || null;
    }
    get modifiedIds() {
      if (__privateGet(this, _e14)) return __privateGet(this, _e14);
      const t = [];
      if (__privateGet(this, _i13)) for (const e of __privateGet(this, _i13).values()) e.serialize() && t.push(e.annotationElementId);
      return __privateSet(this, _e14, {
        ids: new Set(t),
        hash: t.join(",")
      });
    }
    [Symbol.iterator]() {
      return __privateGet(this, _s11).entries();
    }
  }
  _t15 = new WeakMap();
  _e14 = new WeakMap();
  _i13 = new WeakMap();
  _s11 = new WeakMap();
  _Es_instances = new WeakSet();
  a_fn2 = function() {
    __privateGet(this, _t15) || (__privateSet(this, _t15, true), typeof this.onSetModified == "function" && this.onSetModified());
  };
  class wi extends Es {
    constructor(t) {
      super();
      __privateAdd(this, _t16, fe);
      const { serializable: e } = t;
      if (e === fe) return;
      const { map: s, hash: i, transfer: n } = e, r = structuredClone(s, n ? {
        transfer: n
      } : null);
      __privateSet(this, _t16, {
        map: r,
        hash: i,
        transfer: []
      });
    }
    get print() {
      $("Should not call PrintAnnotationStorage.print");
    }
    get serializable() {
      return __privateGet(this, _t16);
    }
    get modifiedIds() {
      return L(this, "modifiedIds", {
        ids: /* @__PURE__ */ new Set(),
        hash: ""
      });
    }
  }
  _t16 = new WeakMap();
  class yn {
    constructor({ ownerDocument: t = globalThis.document, styleElement: e = null }) {
      __privateAdd(this, _t17, /* @__PURE__ */ new Set());
      this._document = t, this.nativeFontFaces = /* @__PURE__ */ new Set(), this.styleElement = null, this.loadingRequests = [], this.loadTestFontId = 0;
    }
    addNativeFontFace(t) {
      this.nativeFontFaces.add(t), this._document.fonts.add(t);
    }
    removeNativeFontFace(t) {
      this.nativeFontFaces.delete(t), this._document.fonts.delete(t);
    }
    insertRule(t) {
      this.styleElement || (this.styleElement = this._document.createElement("style"), this._document.documentElement.getElementsByTagName("head")[0].append(this.styleElement));
      const e = this.styleElement.sheet;
      e.insertRule(t, e.cssRules.length);
    }
    clear() {
      for (const t of this.nativeFontFaces) this._document.fonts.delete(t);
      this.nativeFontFaces.clear(), __privateGet(this, _t17).clear(), this.styleElement && (this.styleElement.remove(), this.styleElement = null);
    }
    async loadSystemFont({ systemFontInfo: t, disableFontFace: e, _inspectFont: s }) {
      if (!(!t || __privateGet(this, _t17).has(t.loadedName))) {
        if (B(!e, "loadSystemFont shouldn't be called when `disableFontFace` is set."), this.isFontLoadingAPISupported) {
          const { loadedName: i, src: n, style: r } = t, a = new FontFace(i, n, r);
          this.addNativeFontFace(a);
          try {
            await a.load(), __privateGet(this, _t17).add(i), s == null ? void 0 : s(t);
          } catch {
            F(`Cannot load system font: ${t.baseFontName}, installing it could help to improve PDF rendering.`), this.removeNativeFontFace(a);
          }
          return;
        }
        $("Not implemented: loadSystemFont without the Font Loading API.");
      }
    }
    async bind(t) {
      if (t.attached || t.missingFile && !t.systemFontInfo) return;
      if (t.attached = true, t.systemFontInfo) {
        await this.loadSystemFont(t);
        return;
      }
      if (this.isFontLoadingAPISupported) {
        const s = t.createNativeFontFace();
        if (s) {
          this.addNativeFontFace(s);
          try {
            await s.loaded;
          } catch (i) {
            throw F(`Failed to load font '${s.family}': '${i}'.`), t.disableFontFace = true, i;
          }
        }
        return;
      }
      const e = t.createFontFaceRule();
      if (e) {
        if (this.insertRule(e), this.isSyncFontLoadingSupported) return;
        await new Promise((s) => {
          const i = this._queueLoadingCallback(s);
          this._prepareFontLoadEvent(t, i);
        });
      }
    }
    get isFontLoadingAPISupported() {
      var _a29;
      const t = !!((_a29 = this._document) == null ? void 0 : _a29.fonts);
      return L(this, "isFontLoadingAPISupported", t);
    }
    get isSyncFontLoadingSupported() {
      return L(this, "isSyncFontLoadingSupported", dt || nt.platform.isFirefox);
    }
    _queueLoadingCallback(t) {
      function e() {
        for (B(!i.done, "completeRequest() cannot be called twice."), i.done = true; s.length > 0 && s[0].done; ) {
          const n = s.shift();
          setTimeout(n.callback, 0);
        }
      }
      const { loadingRequests: s } = this, i = {
        done: false,
        complete: e,
        callback: t
      };
      return s.push(i), i;
    }
    get _loadTestFont() {
      const t = atob("T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQAFQAABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAAALwAAAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgAAAAGbmFtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1AAsD6AAAAADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD6AAAAAAD6AABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACMAooCvAAAAeAAMQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4DIP84AFoDIQAAAAAAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAAAAEAAQAAAAEAAAAAAAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUAAQAAAAEAAAAAAAYAAQAAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgABAAMAAQQJAAMAAgABAAMAAQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABYAAAAAAAAAwAAAAMAAAAcAAEAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAAAC7////TAAEAAAAAAAABBgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAAAAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgcA/gXBIwMAYuL+nz5tQXkD5j3CBLnEQACAQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYAAABAQAADwACAQEEE/t3Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQAAAAAAAABAAAAAMmJbzEAAAAAzgTjFQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA==");
      return L(this, "_loadTestFont", t);
    }
    _prepareFontLoadEvent(t, e) {
      function s(v, w) {
        return v.charCodeAt(w) << 24 | v.charCodeAt(w + 1) << 16 | v.charCodeAt(w + 2) << 8 | v.charCodeAt(w + 3) & 255;
      }
      function i(v, w, S, E) {
        const _ = v.substring(0, w), C = v.substring(w + S);
        return _ + E + C;
      }
      let n, r;
      const a = this._document.createElement("canvas");
      a.width = 1, a.height = 1;
      const o = a.getContext("2d");
      let l = 0;
      function h(v, w) {
        if (++l > 30) {
          F("Load test font never loaded."), w();
          return;
        }
        if (o.font = "30px " + v, o.fillText(".", 0, 20), o.getImageData(0, 0, 1, 1).data[3] > 0) {
          w();
          return;
        }
        setTimeout(h.bind(null, v, w));
      }
      const c = `lt${Date.now()}${this.loadTestFontId++}`;
      let u = this._loadTestFont;
      u = i(u, 976, c.length, c);
      const g = 16, p = 1482184792;
      let b = s(u, g);
      for (n = 0, r = c.length - 3; n < r; n += 4) b = b - p + s(c, n) | 0;
      n < c.length && (b = b - p + s(c + "XXX", n) | 0), u = i(u, g, 4, Ji(b));
      const m = `url(data:font/opentype;base64,${btoa(u)});`, A = `@font-face {font-family:"${c}";src:${m}}`;
      this.insertRule(A);
      const y = this._document.createElement("div");
      y.style.visibility = "hidden", y.style.width = y.style.height = "10px", y.style.position = "absolute", y.style.top = y.style.left = "0px";
      for (const v of [
        t.loadedName,
        c
      ]) {
        const w = this._document.createElement("span");
        w.textContent = "Hi", w.style.fontFamily = v, y.append(w);
      }
      this._document.body.append(y), h(c, () => {
        y.remove(), e.complete();
      });
    }
  }
  _t17 = new WeakMap();
  class An {
    constructor(t, e = null, s, i) {
      __privateAdd(this, _t18);
      this.compiledGlyphs = /* @__PURE__ */ Object.create(null), __privateSet(this, _t18, t), this._inspectFont = e, s && Object.assign(this, s), i && (this.charProcOperatorList = i);
    }
    createNativeFontFace() {
      var _a29;
      if (!this.data || this.disableFontFace) return null;
      let t;
      if (!this.cssFontInfo) t = new FontFace(this.loadedName, this.data, {});
      else {
        const e = {
          weight: this.cssFontInfo.fontWeight
        };
        this.cssFontInfo.italicAngle && (e.style = `oblique ${this.cssFontInfo.italicAngle}deg`), t = new FontFace(this.cssFontInfo.fontFamily, this.data, e);
      }
      return (_a29 = this._inspectFont) == null ? void 0 : _a29.call(this, this), t;
    }
    createFontFaceRule() {
      var _a29;
      if (!this.data || this.disableFontFace) return null;
      const t = `url(data:${this.mimetype};base64,${this.data.toBase64()});`;
      let e;
      if (!this.cssFontInfo) e = `@font-face {font-family:"${this.loadedName}";src:${t}}`;
      else {
        let s = `font-weight: ${this.cssFontInfo.fontWeight};`;
        this.cssFontInfo.italicAngle && (s += `font-style: oblique ${this.cssFontInfo.italicAngle}deg;`), e = `@font-face {font-family:"${this.cssFontInfo.fontFamily}";${s}src:${t}}`;
      }
      return (_a29 = this._inspectFont) == null ? void 0 : _a29.call(this, this, t), e;
    }
    getPathGenerator(t, e) {
      if (this.compiledGlyphs[e] !== void 0) return this.compiledGlyphs[e];
      const s = this.loadedName + "_path_" + e;
      let i;
      try {
        i = t.get(s);
      } catch (r) {
        F(`getPathGenerator - ignoring character: "${r}".`);
      }
      const n = bi(i == null ? void 0 : i.path);
      return this.fontExtraProperties || t.delete(s), this.compiledGlyphs[e] = n;
    }
    get black() {
      return __privateGet(this, _t18).black;
    }
    get bold() {
      return __privateGet(this, _t18).bold;
    }
    get disableFontFace() {
      return __privateGet(this, _t18).disableFontFace ?? false;
    }
    set disableFontFace(t) {
      L(this, "disableFontFace", !!t);
    }
    get fontExtraProperties() {
      return __privateGet(this, _t18).fontExtraProperties ?? false;
    }
    get isInvalidPDFjsFont() {
      return __privateGet(this, _t18).isInvalidPDFjsFont;
    }
    get isType3Font() {
      return __privateGet(this, _t18).isType3Font;
    }
    get italic() {
      return __privateGet(this, _t18).italic;
    }
    get missingFile() {
      return __privateGet(this, _t18).missingFile;
    }
    get remeasure() {
      return __privateGet(this, _t18).remeasure;
    }
    get vertical() {
      return __privateGet(this, _t18).vertical;
    }
    get ascent() {
      return __privateGet(this, _t18).ascent;
    }
    get defaultWidth() {
      return __privateGet(this, _t18).defaultWidth;
    }
    get descent() {
      return __privateGet(this, _t18).descent;
    }
    get bbox() {
      return __privateGet(this, _t18).bbox;
    }
    set bbox(t) {
      L(this, "bbox", t);
    }
    get fontMatrix() {
      return __privateGet(this, _t18).fontMatrix;
    }
    get fallbackName() {
      return __privateGet(this, _t18).fallbackName;
    }
    get loadedName() {
      return __privateGet(this, _t18).loadedName;
    }
    get mimetype() {
      return __privateGet(this, _t18).mimetype;
    }
    get name() {
      return __privateGet(this, _t18).name;
    }
    get data() {
      return __privateGet(this, _t18).data;
    }
    clearData() {
      __privateGet(this, _t18).clearData();
    }
    get cssFontInfo() {
      return __privateGet(this, _t18).cssFontInfo;
    }
    get systemFontInfo() {
      return __privateGet(this, _t18).systemFontInfo;
    }
    get defaultVMetrics() {
      return __privateGet(this, _t18).defaultVMetrics;
    }
  }
  _t18 = new WeakMap();
  const _Yt = class _Yt {
    constructor(t) {
      __privateAdd(this, _Yt_instances);
      __privateAdd(this, _t19);
      __privateAdd(this, _e15);
      __privateAdd(this, _i14);
      __privateSet(this, _t19, t), __privateSet(this, _e15, new DataView(__privateGet(this, _t19))), __privateSet(this, _i14, new TextDecoder());
    }
    static write(t) {
      const e = new TextEncoder(), s = {};
      let i = 0;
      for (const l of _Yt.strings) {
        const h = e.encode(t[l]);
        s[l] = h, i += 4 + h.length;
      }
      const n = new ArrayBuffer(i), r = new Uint8Array(n), a = new DataView(n);
      let o = 0;
      for (const l of _Yt.strings) {
        const h = s[l], c = h.length;
        a.setUint32(o, c), r.set(h, o + 4), o += 4 + c;
      }
      return B(o === n.byteLength, "CssFontInfo.write: Buffer overflow"), n;
    }
    get fontFamily() {
      return __privateMethod(this, _Yt_instances, s_fn3).call(this, 0);
    }
    get fontWeight() {
      return __privateMethod(this, _Yt_instances, s_fn3).call(this, 1);
    }
    get italicAngle() {
      return __privateMethod(this, _Yt_instances, s_fn3).call(this, 2);
    }
  };
  _t19 = new WeakMap();
  _e15 = new WeakMap();
  _i14 = new WeakMap();
  _Yt_instances = new WeakSet();
  s_fn3 = function(t) {
    B(t < _Yt.strings.length, "Invalid string index");
    let e = 0;
    for (let i = 0; i < t; i++) e += __privateGet(this, _e15).getUint32(e) + 4;
    const s = __privateGet(this, _e15).getUint32(e);
    return __privateGet(this, _i14).decode(new Uint8Array(__privateGet(this, _t19), e + 4, s));
  };
  __publicField(_Yt, "strings", [
    "fontFamily",
    "fontWeight",
    "italicAngle"
  ]);
  let Yt = _Yt;
  const _qt = class _qt {
    constructor(t) {
      __privateAdd(this, _qt_instances);
      __privateAdd(this, _t20);
      __privateAdd(this, _e16);
      __privateAdd(this, _i15);
      __privateSet(this, _t20, t), __privateSet(this, _e16, new DataView(__privateGet(this, _t20))), __privateSet(this, _i15, new TextDecoder());
    }
    static write(t) {
      const e = new TextEncoder(), s = {};
      let i = 0;
      for (const u of _qt.strings) {
        const f = e.encode(t[u]);
        s[u] = f, i += 4 + f.length;
      }
      i += 4;
      let n, r, a = 1 + i;
      t.style && (n = e.encode(t.style.style), r = e.encode(t.style.weight), a += 4 + n.length + 4 + r.length);
      const o = new ArrayBuffer(a), l = new Uint8Array(o), h = new DataView(o);
      let c = 0;
      h.setUint8(c++, t.guessFallback ? 1 : 0), h.setUint32(c, 0), c += 4, i = 0;
      for (const u of _qt.strings) {
        const f = s[u], g = f.length;
        i += 4 + g, h.setUint32(c, g), l.set(f, c + 4), c += 4 + g;
      }
      return h.setUint32(c - i - 4, i), t.style && (h.setUint32(c, n.length), l.set(n, c + 4), c += 4 + n.length, h.setUint32(c, r.length), l.set(r, c + 4), c += 4 + r.length), B(c <= o.byteLength, "SubstitionInfo.write: Buffer overflow"), o.transferToFixedLength(c);
    }
    get guessFallback() {
      return __privateGet(this, _e16).getUint8(0) !== 0;
    }
    get css() {
      return __privateMethod(this, _qt_instances, s_fn4).call(this, 0);
    }
    get loadedName() {
      return __privateMethod(this, _qt_instances, s_fn4).call(this, 1);
    }
    get baseFontName() {
      return __privateMethod(this, _qt_instances, s_fn4).call(this, 2);
    }
    get src() {
      return __privateMethod(this, _qt_instances, s_fn4).call(this, 3);
    }
    get style() {
      let t = 1;
      t += 4 + __privateGet(this, _e16).getUint32(t);
      const e = __privateGet(this, _e16).getUint32(t), s = __privateGet(this, _i15).decode(new Uint8Array(__privateGet(this, _t20), t + 4, e));
      t += 4 + e;
      const i = __privateGet(this, _e16).getUint32(t), n = __privateGet(this, _i15).decode(new Uint8Array(__privateGet(this, _t20), t + 4, i));
      return {
        style: s,
        weight: n
      };
    }
  };
  _t20 = new WeakMap();
  _e16 = new WeakMap();
  _i15 = new WeakMap();
  _qt_instances = new WeakSet();
  s_fn4 = function(t) {
    B(t < _qt.strings.length, "Invalid string index");
    let e = 5;
    for (let i = 0; i < t; i++) e += __privateGet(this, _e16).getUint32(e) + 4;
    const s = __privateGet(this, _e16).getUint32(e);
    return __privateGet(this, _i15).decode(new Uint8Array(__privateGet(this, _t20), e + 4, s));
  };
  __publicField(_qt, "strings", [
    "css",
    "loadedName",
    "baseFontName",
    "src"
  ]);
  let qt = _qt;
  const _G2 = class _G2 {
    constructor({ data: t, extra: e }) {
      __privateAdd(this, _G_instances);
      __privateAdd(this, _r9);
      __privateAdd(this, _n9);
      __privateAdd(this, _o7);
      __privateSet(this, _r9, t), __privateSet(this, _n9, new TextDecoder()), __privateSet(this, _o7, new DataView(__privateGet(this, _r9))), e && Object.assign(this, e);
    }
    get black() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 0);
    }
    get bold() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 1);
    }
    get disableFontFace() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 2);
    }
    get fontExtraProperties() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 3);
    }
    get isInvalidPDFjsFont() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 4);
    }
    get isType3Font() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 5);
    }
    get italic() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 6);
    }
    get missingFile() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 7);
    }
    get remeasure() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 8);
    }
    get vertical() {
      return __privateMethod(this, _G_instances, h_fn2).call(this, 9);
    }
    get ascent() {
      return __privateMethod(this, _G_instances, l_fn3).call(this, 0);
    }
    get defaultWidth() {
      return __privateMethod(this, _G_instances, l_fn3).call(this, 1);
    }
    get descent() {
      return __privateMethod(this, _G_instances, l_fn3).call(this, 2);
    }
    get bbox() {
      let t = __privateGet(_G2, _e17);
      if (__privateGet(this, _o7).getUint8(t) === 0) return;
      t += 1;
      const s = [];
      for (let i = 0; i < 4; i++) s.push(__privateGet(this, _o7).getInt16(t, true)), t += 2;
      return s;
    }
    get fontMatrix() {
      let t = __privateGet(_G2, _i16);
      if (__privateGet(this, _o7).getUint8(t) === 0) return;
      t += 1;
      const s = [];
      for (let i = 0; i < 6; i++) s.push(__privateGet(this, _o7).getFloat64(t, true)), t += 8;
      return s;
    }
    get defaultVMetrics() {
      let t = __privateGet(_G2, _s12);
      if (__privateGet(this, _o7).getUint8(t) === 0) return;
      t += 1;
      const s = [];
      for (let i = 0; i < 3; i++) s.push(__privateGet(this, _o7).getInt16(t, true)), t += 2;
      return s;
    }
    get fallbackName() {
      return __privateMethod(this, _G_instances, u_fn4).call(this, 0);
    }
    get loadedName() {
      return __privateMethod(this, _G_instances, u_fn4).call(this, 1);
    }
    get mimetype() {
      return __privateMethod(this, _G_instances, u_fn4).call(this, 2);
    }
    get name() {
      return __privateMethod(this, _G_instances, u_fn4).call(this, 3);
    }
    get data() {
      let t = __privateGet(_G2, _a9);
      const e = __privateGet(this, _o7).getUint32(t);
      t += 4 + e;
      const s = __privateGet(this, _o7).getUint32(t);
      t += 4 + s;
      const i = __privateGet(this, _o7).getUint32(t);
      t += 4 + i;
      const n = __privateGet(this, _o7).getUint32(t);
      if (n !== 0) return new Uint8Array(__privateGet(this, _r9), t + 4, n);
    }
    clearData() {
      let t = __privateGet(_G2, _a9);
      const e = __privateGet(this, _o7).getUint32(t);
      t += 4 + e;
      const s = __privateGet(this, _o7).getUint32(t);
      t += 4 + s;
      const i = __privateGet(this, _o7).getUint32(t);
      t += 4 + i;
      const n = __privateGet(this, _o7).getUint32(t);
      new Uint8Array(__privateGet(this, _r9), t + 4, n).fill(0), __privateGet(this, _o7).setUint32(t, 0);
    }
    get cssFontInfo() {
      let t = __privateGet(_G2, _a9);
      const e = __privateGet(this, _o7).getUint32(t);
      t += 4 + e;
      const s = __privateGet(this, _o7).getUint32(t);
      t += 4 + s;
      const i = __privateGet(this, _o7).getUint32(t);
      if (i === 0) return null;
      const n = new Uint8Array(i);
      return n.set(new Uint8Array(__privateGet(this, _r9), t + 4, i)), new Yt(n.buffer);
    }
    get systemFontInfo() {
      let t = __privateGet(_G2, _a9);
      const e = __privateGet(this, _o7).getUint32(t);
      t += 4 + e;
      const s = __privateGet(this, _o7).getUint32(t);
      if (s === 0) return null;
      const i = new Uint8Array(s);
      return i.set(new Uint8Array(__privateGet(this, _r9), t + 4, s)), new qt(i.buffer);
    }
    static write(t) {
      const e = t.systemFontInfo ? qt.write(t.systemFontInfo) : null, s = t.cssFontInfo ? Yt.write(t.cssFontInfo) : null, i = new TextEncoder(), n = {};
      let r = 0;
      for (const p of _G2.strings) n[p] = i.encode(t[p]), r += 4 + n[p].length;
      const a = __privateGet(_G2, _a9) + 4 + r + 4 + (e ? e.byteLength : 0) + 4 + (s ? s.byteLength : 0) + 4 + (t.data ? t.data.length : 0), o = new ArrayBuffer(a), l = new Uint8Array(o), h = new DataView(o);
      let c = 0;
      const u = _G2.bools.length;
      let f = 0, g = 0;
      for (let p = 0; p < u; p++) {
        const b = t[_G2.bools[p]];
        f |= (b === void 0 ? 0 : b ? 2 : 1) << g, g += 2, (g === 8 || p === u - 1) && (h.setUint8(c++, f), f = 0, g = 0);
      }
      B(c === __privateGet(_G2, _t21), "FontInfo.write: Boolean properties offset mismatch");
      for (const p of _G2.numbers) h.setFloat64(c, t[p]), c += 8;
      if (B(c === __privateGet(_G2, _e17), "FontInfo.write: Number properties offset mismatch"), t.bbox) {
        h.setUint8(c++, 4);
        for (const p of t.bbox) h.setInt16(c, p, true), c += 2;
      } else h.setUint8(c++, 0), c += 8;
      if (B(c === __privateGet(_G2, _i16), "FontInfo.write: BBox properties offset mismatch"), t.fontMatrix) {
        h.setUint8(c++, 6);
        for (const p of t.fontMatrix) h.setFloat64(c, p, true), c += 8;
      } else h.setUint8(c++, 0), c += 48;
      if (B(c === __privateGet(_G2, _s12), "FontInfo.write: FontMatrix properties offset mismatch"), t.defaultVMetrics) {
        h.setUint8(c++, 1);
        for (const p of t.defaultVMetrics) h.setInt16(c, p, true), c += 2;
      } else h.setUint8(c++, 0), c += 6;
      B(c === __privateGet(_G2, _a9), "FontInfo.write: DefaultVMetrics properties offset mismatch"), h.setUint32(__privateGet(_G2, _a9), 0), c += 4;
      for (const p of _G2.strings) {
        const b = n[p], m = b.length;
        h.setUint32(c, m), l.set(b, c + 4), c += 4 + m;
      }
      if (h.setUint32(__privateGet(_G2, _a9), c - __privateGet(_G2, _a9) - 4), !e) h.setUint32(c, 0), c += 4;
      else {
        const p = e.byteLength;
        h.setUint32(c, p), B(c + 4 + p <= o.byteLength, "FontInfo.write: Buffer overflow at systemFontInfo"), l.set(new Uint8Array(e), c + 4), c += 4 + p;
      }
      if (!s) h.setUint32(c, 0), c += 4;
      else {
        const p = s.byteLength;
        h.setUint32(c, p), B(c + 4 + p <= o.byteLength, "FontInfo.write: Buffer overflow at cssFontInfo"), l.set(new Uint8Array(s), c + 4), c += 4 + p;
      }
      return t.data === void 0 ? (h.setUint32(c, 0), c += 4) : (h.setUint32(c, t.data.length), l.set(t.data, c + 4), c += 4 + t.data.length), B(c <= o.byteLength, "FontInfo.write: Buffer overflow"), o.transferToFixedLength(c);
    }
  };
  _t21 = new WeakMap();
  _e17 = new WeakMap();
  _i16 = new WeakMap();
  _s12 = new WeakMap();
  _a9 = new WeakMap();
  _r9 = new WeakMap();
  _n9 = new WeakMap();
  _o7 = new WeakMap();
  _G_instances = new WeakSet();
  h_fn2 = function(t) {
    B(t < _G2.bools.length, "Invalid boolean index");
    const e = Math.floor(t / 4), s = t * 2 % 8, i = __privateGet(this, _o7).getUint8(e) >> s & 3;
    return i === 0 ? void 0 : i === 2;
  };
  l_fn3 = function(t) {
    return B(t < _G2.numbers.length, "Invalid number index"), __privateGet(this, _o7).getFloat64(__privateGet(_G2, _t21) + t * 8);
  };
  u_fn4 = function(t) {
    B(t < _G2.strings.length, "Invalid string index");
    let e = __privateGet(_G2, _a9) + 4;
    for (let n = 0; n < t; n++) e += __privateGet(this, _o7).getUint32(e) + 4;
    const s = __privateGet(this, _o7).getUint32(e), i = new Uint8Array(s);
    return i.set(new Uint8Array(__privateGet(this, _r9), e + 4, s)), __privateGet(this, _n9).decode(i);
  };
  __publicField(_G2, "bools", [
    "black",
    "bold",
    "disableFontFace",
    "fontExtraProperties",
    "isInvalidPDFjsFont",
    "isType3Font",
    "italic",
    "missingFile",
    "remeasure",
    "vertical"
  ]);
  __publicField(_G2, "numbers", [
    "ascent",
    "defaultWidth",
    "descent"
  ]);
  __publicField(_G2, "strings", [
    "fallbackName",
    "loadedName",
    "mimetype",
    "name"
  ]);
  __privateAdd(_G2, _t21, Math.ceil(_G2.bools.length * 2 / 8));
  __privateAdd(_G2, _e17, __privateGet(_G2, _t21) + _G2.numbers.length * 8);
  __privateAdd(_G2, _i16, __privateGet(_G2, _e17) + 1 + 8);
  __privateAdd(_G2, _s12, __privateGet(_G2, _i16) + 1 + 48);
  __privateAdd(_G2, _a9, __privateGet(_G2, _s12) + 1 + 6);
  let G = _G2;
  const _rt = class _rt {
    constructor(t) {
      this.buffer = t, this.view = new DataView(t), this.data = new Uint8Array(t);
    }
    static write(t) {
      let e, s = null, i = [], n = [], r = [], a = [], o = null, l = null;
      switch (t[0]) {
        case "RadialAxial":
          e = t[1] === "axial" ? 1 : 2, s = t[2], r = t[3], e === 1 ? i.push(...t[4], ...t[5]) : i.push(t[4][0], t[4][1], t[6], t[5][0], t[5][1], t[7]);
          break;
        case "Mesh":
          e = 3, o = t[1], i = t[2], n = t[3], a = t[4] || [], s = t[6], l = t[7];
          break;
        default:
          throw new Error(`Unsupported pattern type: ${t[0]}`);
      }
      const h = Math.floor(i.length / 2), c = Math.floor(n.length / 3), u = r.length, f = a.length;
      let g = 0;
      for (const w of a) g += 1, g = Math.ceil(g / 4) * 4, g += 4 + w.coords.length * 4, g += 4 + w.colors.length * 4, w.verticesPerRow !== void 0 && (g += 4);
      const p = 20 + h * 8 + c * 3 + u * 8 + (s ? 16 : 0) + (l ? 3 : 0) + g, b = new ArrayBuffer(p), m = new DataView(b), A = new Uint8Array(b);
      m.setUint8(__privateGet(_rt, _t22), e), m.setUint8(__privateGet(_rt, _e18), s ? 1 : 0), m.setUint8(__privateGet(_rt, _i17), l ? 1 : 0), m.setUint8(__privateGet(_rt, _s13), o), m.setUint32(__privateGet(_rt, _a10), h, true), m.setUint32(__privateGet(_rt, _r10), c, true), m.setUint32(__privateGet(_rt, _n10), u, true), m.setUint32(__privateGet(_rt, _o8), f, true);
      let y = 20;
      new Float32Array(b, y, h * 2).set(i), y += h * 8, A.set(n, y), y += c * 3;
      for (const [w, S] of r) m.setFloat32(y, w, true), y += 4, m.setUint32(y, parseInt(S.slice(1), 16), true), y += 4;
      if (s) for (const w of s) m.setFloat32(y, w, true), y += 4;
      l && (A.set(l, y), y += 3);
      for (let w = 0; w < a.length; w++) {
        const S = a[w];
        m.setUint8(y, S.type), y += 1, y = Math.ceil(y / 4) * 4, m.setUint32(y, S.coords.length, true), y += 4, new Int32Array(b, y, S.coords.length).set(S.coords), y += S.coords.length * 4, m.setUint32(y, S.colors.length, true), y += 4, new Int32Array(b, y, S.colors.length).set(S.colors), y += S.colors.length * 4, S.verticesPerRow !== void 0 && (m.setUint32(y, S.verticesPerRow, true), y += 4);
      }
      return b;
    }
    getIR() {
      const t = this.view, e = this.data[__privateGet(_rt, _t22)], s = !!this.data[__privateGet(_rt, _e18)], i = !!this.data[__privateGet(_rt, _i17)], n = t.getUint32(__privateGet(_rt, _a10), true), r = t.getUint32(__privateGet(_rt, _r10), true), a = t.getUint32(__privateGet(_rt, _n10), true), o = t.getUint32(__privateGet(_rt, _o8), true);
      let l = 20;
      const h = new Float32Array(this.buffer, l, n * 2);
      l += n * 8;
      const c = new Uint8Array(this.buffer, l, r * 3);
      l += r * 3;
      const u = [];
      for (let b = 0; b < a; ++b) {
        const m = t.getFloat32(l, true);
        l += 4;
        const A = t.getUint32(l, true);
        l += 4, u.push([
          m,
          `#${A.toString(16).padStart(6, "0")}`
        ]);
      }
      let f = null;
      if (s) {
        f = [];
        for (let b = 0; b < 4; ++b) f.push(t.getFloat32(l, true)), l += 4;
      }
      let g = null;
      i && (g = new Uint8Array(this.buffer, l, 3), l += 3);
      const p = [];
      for (let b = 0; b < o; ++b) {
        const m = t.getUint8(l);
        l += 1, l = Math.ceil(l / 4) * 4;
        const A = t.getUint32(l, true);
        l += 4;
        const y = new Int32Array(this.buffer, l, A);
        l += A * 4;
        const v = t.getUint32(l, true);
        l += 4;
        const w = new Int32Array(this.buffer, l, v);
        l += v * 4;
        const S = {
          type: m,
          coords: y,
          colors: w
        };
        m === ns.LATTICE && (S.verticesPerRow = t.getUint32(l, true), l += 4), p.push(S);
      }
      if (e === 1) return [
        "RadialAxial",
        "axial",
        f,
        u,
        Array.from(h.slice(0, 2)),
        Array.from(h.slice(2, 4)),
        null,
        null
      ];
      if (e === 2) return [
        "RadialAxial",
        "radial",
        f,
        u,
        [
          h[0],
          h[1]
        ],
        [
          h[3],
          h[4]
        ],
        h[2],
        h[5]
      ];
      if (e === 3) {
        const b = this.data[__privateGet(_rt, _s13)];
        let m = null;
        if (h.length > 0) {
          let A = h[0], y = h[0], v = h[1], w = h[1];
          for (let S = 0; S < h.length; S += 2) {
            const E = h[S], _ = h[S + 1];
            A = A > E ? E : A, v = v > _ ? _ : v, y = y < E ? E : y, w = w < _ ? _ : w;
          }
          m = [
            A,
            v,
            y,
            w
          ];
        }
        return [
          "Mesh",
          b,
          h,
          c,
          p,
          m,
          f,
          g
        ];
      }
      throw new Error(`Unsupported pattern kind: ${e}`);
    }
  };
  _t22 = new WeakMap();
  _e18 = new WeakMap();
  _i17 = new WeakMap();
  _s13 = new WeakMap();
  _a10 = new WeakMap();
  _r10 = new WeakMap();
  _n10 = new WeakMap();
  _o8 = new WeakMap();
  __privateAdd(_rt, _t22, 0);
  __privateAdd(_rt, _e18, 1);
  __privateAdd(_rt, _i17, 2);
  __privateAdd(_rt, _s13, 3);
  __privateAdd(_rt, _a10, 4);
  __privateAdd(_rt, _r10, 8);
  __privateAdd(_rt, _n10, 12);
  __privateAdd(_rt, _o8, 16);
  let rt = _rt;
  class wn {
    constructor(t) {
      __privateAdd(this, _t23);
      __privateSet(this, _t23, t);
    }
    static write(t) {
      let e, s;
      return nt.isFloat16ArraySupported ? (s = new ArrayBuffer(t.length * 2), e = new Float16Array(s)) : (s = new ArrayBuffer(t.length * 4), e = new Float32Array(s)), e.set(t), s;
    }
    get path() {
      return nt.isFloat16ArraySupported ? new Float16Array(__privateGet(this, _t23)) : new Float32Array(__privateGet(this, _t23));
    }
  }
  _t23 = new WeakMap();
  function vn(d) {
    if (d instanceof URL) return d;
    if (typeof d == "string") {
      if (dt) {
        if (/^[a-z][a-z0-9\-+.]+:/i.test(d)) return new URL(d);
        const e = yt.getBuiltinModule("url");
        return new URL(e.pathToFileURL(d));
      }
      const t = URL.parse(d, window.location);
      if (t) return t;
    }
    throw new Error("Invalid PDF url data: either string or URL-object is expected in the url property.");
  }
  function Sn(d) {
    if (dt && typeof Fs < "u" && d instanceof Fs) throw new Error("Please provide binary data as `Uint8Array`, rather than `Buffer`.");
    if (d instanceof Uint8Array && d.byteLength === d.buffer.byteLength) return d;
    if (typeof d == "string") return Ne(d);
    if (d instanceof ArrayBuffer || ArrayBuffer.isView(d) || typeof d == "object" && !isNaN(d == null ? void 0 : d.length)) return new Uint8Array(d);
    throw new Error("Invalid PDF binary data: either TypedArray, string, or array-like object is expected in the data property.");
  }
  function ve(d) {
    if (typeof d != "string") return null;
    if (d.endsWith("/")) return d;
    throw new Error(`Invalid factory url: "${d}" must include trailing slash.`);
  }
  let ds, En;
  ds = (d) => typeof d == "object" && Number.isInteger(d == null ? void 0 : d.num) && d.num >= 0 && Number.isInteger(d == null ? void 0 : d.gen) && d.gen >= 0;
  En = (d) => typeof d == "object" && typeof (d == null ? void 0 : d.name) == "string";
  _n = nn.bind(null, ds, En);
  class Cn {
    constructor() {
      __privateAdd(this, _t24, /* @__PURE__ */ new Map());
      __privateAdd(this, _e19, Promise.resolve());
    }
    postMessage(t, e) {
      const s = {
        data: structuredClone(t, e ? {
          transfer: e
        } : null)
      };
      __privateGet(this, _e19).then(() => {
        for (const [i] of __privateGet(this, _t24)) i.call(this, s);
      });
    }
    addEventListener(t, e, s = null) {
      let i = null;
      if ((s == null ? void 0 : s.signal) instanceof AbortSignal) {
        const { signal: n } = s;
        if (n.aborted) {
          F("LoopbackPort - cannot use an `aborted` signal.");
          return;
        }
        const r = () => this.removeEventListener(t, e);
        i = () => n.removeEventListener("abort", r), n.addEventListener("abort", r);
      }
      __privateGet(this, _t24).set(e, i);
    }
    removeEventListener(t, e) {
      var _a29;
      (_a29 = __privateGet(this, _t24).get(e)) == null ? void 0 : _a29(), __privateGet(this, _t24).delete(e);
    }
    terminate() {
      for (const [, t] of __privateGet(this, _t24)) t == null ? void 0 : t();
      __privateGet(this, _t24).clear();
    }
  }
  _t24 = new WeakMap();
  _e19 = new WeakMap();
  const Se = {
    DATA: 1,
    ERROR: 2
  }, et = {
    CANCEL: 1,
    CANCEL_COMPLETE: 2,
    CLOSE: 3,
    ENQUEUE: 4,
    ERROR: 5,
    PULL: 6,
    PULL_COMPLETE: 7,
    START_COMPLETE: 8
  };
  function Gs() {
  }
  function ut(d) {
    if (d instanceof Rt || d instanceof as || d instanceof Ns || d instanceof Me || d instanceof Ke) return d;
    switch (d instanceof Error || typeof d == "object" && d !== null || $('wrapReason: Expected "reason" to be a (possibly cloned) Error.'), d.name) {
      case "AbortException":
        return new Rt(d.message);
      case "InvalidPDFException":
        return new as(d.message);
      case "PasswordException":
        return new Ns(d.message, d.code);
      case "ResponseException":
        return new Me(d.message, d.status, d.missing);
      case "UnknownErrorException":
        return new Ke(d.message, d.details);
    }
    return new Ke(d.message, d.toString());
  }
  class ae {
    constructor(t, e, s) {
      __privateAdd(this, _ae_instances);
      __privateAdd(this, _t25, new AbortController());
      this.sourceName = t, this.targetName = e, this.comObj = s, this.callbackId = 1, this.streamId = 1, this.streamSinks = /* @__PURE__ */ Object.create(null), this.streamControllers = /* @__PURE__ */ Object.create(null), this.callbackCapabilities = /* @__PURE__ */ Object.create(null), this.actionHandler = /* @__PURE__ */ Object.create(null), s.addEventListener("message", __privateMethod(this, _ae_instances, e_fn2).bind(this), {
        signal: __privateGet(this, _t25).signal
      });
    }
    on(t, e) {
      const s = this.actionHandler;
      if (s[t]) throw new Error(`There is already an actionName called "${t}"`);
      s[t] = e;
    }
    send(t, e, s) {
      this.comObj.postMessage({
        sourceName: this.sourceName,
        targetName: this.targetName,
        action: t,
        data: e
      }, s);
    }
    sendWithPromise(t, e, s) {
      const i = this.callbackId++, n = Promise.withResolvers();
      this.callbackCapabilities[i] = n;
      try {
        this.comObj.postMessage({
          sourceName: this.sourceName,
          targetName: this.targetName,
          action: t,
          callbackId: i,
          data: e
        }, s);
      } catch (r) {
        n.reject(r);
      }
      return n.promise;
    }
    sendWithStream(t, e, s, i) {
      const n = this.streamId++, r = this.sourceName, a = this.targetName, o = this.comObj;
      return new ReadableStream({
        start: (l) => {
          const h = Promise.withResolvers();
          return this.streamControllers[n] = {
            controller: l,
            startCall: h,
            pullCall: null,
            cancelCall: null,
            isClosed: false
          }, o.postMessage({
            sourceName: r,
            targetName: a,
            action: t,
            streamId: n,
            data: e,
            desiredSize: l.desiredSize
          }, i), h.promise;
        },
        pull: (l) => {
          const h = Promise.withResolvers();
          return this.streamControllers[n].pullCall = h, o.postMessage({
            sourceName: r,
            targetName: a,
            stream: et.PULL,
            streamId: n,
            desiredSize: l.desiredSize
          }), h.promise;
        },
        cancel: (l) => {
          B(l instanceof Error, "cancel must have a valid reason");
          const h = Promise.withResolvers();
          return this.streamControllers[n].cancelCall = h, this.streamControllers[n].isClosed = true, o.postMessage({
            sourceName: r,
            targetName: a,
            stream: et.CANCEL,
            streamId: n,
            reason: ut(l)
          }), h.promise;
        }
      }, s);
    }
    destroy() {
      var _a29;
      (_a29 = __privateGet(this, _t25)) == null ? void 0 : _a29.abort(), __privateSet(this, _t25, null);
    }
  }
  _t25 = new WeakMap();
  _ae_instances = new WeakSet();
  e_fn2 = function({ data: t }) {
    if (t.targetName !== this.sourceName) return;
    if (t.stream) {
      __privateMethod(this, _ae_instances, s_fn5).call(this, t);
      return;
    }
    if (t.callback) {
      const s = t.callbackId, i = this.callbackCapabilities[s];
      if (!i) throw new Error(`Cannot resolve callback ${s}`);
      if (delete this.callbackCapabilities[s], t.callback === Se.DATA) i.resolve(t.data);
      else if (t.callback === Se.ERROR) i.reject(ut(t.reason));
      else throw new Error("Unexpected callback case");
      return;
    }
    const e = this.actionHandler[t.action];
    if (!e) throw new Error(`Unknown action from worker: ${t.action}`);
    if (t.callbackId) {
      const s = this.sourceName, i = t.sourceName, n = this.comObj;
      Promise.try(e, t.data).then(function(r) {
        n.postMessage({
          sourceName: s,
          targetName: i,
          callback: Se.DATA,
          callbackId: t.callbackId,
          data: r
        });
      }, function(r) {
        n.postMessage({
          sourceName: s,
          targetName: i,
          callback: Se.ERROR,
          callbackId: t.callbackId,
          reason: ut(r)
        });
      });
      return;
    }
    if (t.streamId) {
      __privateMethod(this, _ae_instances, i_fn).call(this, t);
      return;
    }
    e(t.data);
  };
  i_fn = function(t) {
    const e = t.streamId, s = this.sourceName, i = t.sourceName, n = this.comObj, r = this, a = this.actionHandler[t.action], o = {
      enqueue(l, h = 1, c) {
        if (this.isCancelled) return;
        const u = this.desiredSize;
        this.desiredSize -= h, u > 0 && this.desiredSize <= 0 && (this.sinkCapability = Promise.withResolvers(), this.ready = this.sinkCapability.promise), n.postMessage({
          sourceName: s,
          targetName: i,
          stream: et.ENQUEUE,
          streamId: e,
          chunk: l
        }, c);
      },
      close() {
        this.isCancelled || (this.isCancelled = true, n.postMessage({
          sourceName: s,
          targetName: i,
          stream: et.CLOSE,
          streamId: e
        }), delete r.streamSinks[e]);
      },
      error(l) {
        B(l instanceof Error, "error must have a valid reason"), !this.isCancelled && (this.isCancelled = true, n.postMessage({
          sourceName: s,
          targetName: i,
          stream: et.ERROR,
          streamId: e,
          reason: ut(l)
        }));
      },
      sinkCapability: Promise.withResolvers(),
      onPull: null,
      onCancel: null,
      isCancelled: false,
      desiredSize: t.desiredSize,
      ready: null
    };
    o.sinkCapability.resolve(), o.ready = o.sinkCapability.promise, this.streamSinks[e] = o, Promise.try(a, t.data, o).then(function() {
      n.postMessage({
        sourceName: s,
        targetName: i,
        stream: et.START_COMPLETE,
        streamId: e,
        success: true
      });
    }, function(l) {
      n.postMessage({
        sourceName: s,
        targetName: i,
        stream: et.START_COMPLETE,
        streamId: e,
        reason: ut(l)
      });
    });
  };
  s_fn5 = function(t) {
    const e = t.streamId, s = this.sourceName, i = t.sourceName, n = this.comObj, r = this.streamControllers[e], a = this.streamSinks[e];
    switch (t.stream) {
      case et.START_COMPLETE:
        t.success ? r.startCall.resolve() : r.startCall.reject(ut(t.reason));
        break;
      case et.PULL_COMPLETE:
        t.success ? r.pullCall.resolve() : r.pullCall.reject(ut(t.reason));
        break;
      case et.PULL:
        if (!a) {
          n.postMessage({
            sourceName: s,
            targetName: i,
            stream: et.PULL_COMPLETE,
            streamId: e,
            success: true
          });
          break;
        }
        a.desiredSize <= 0 && t.desiredSize > 0 && a.sinkCapability.resolve(), a.desiredSize = t.desiredSize, Promise.try(a.onPull || Gs).then(function() {
          n.postMessage({
            sourceName: s,
            targetName: i,
            stream: et.PULL_COMPLETE,
            streamId: e,
            success: true
          });
        }, function(l) {
          n.postMessage({
            sourceName: s,
            targetName: i,
            stream: et.PULL_COMPLETE,
            streamId: e,
            reason: ut(l)
          });
        });
        break;
      case et.ENQUEUE:
        if (B(r, "enqueue should have stream controller"), r.isClosed) break;
        r.controller.enqueue(t.chunk);
        break;
      case et.CLOSE:
        if (B(r, "close should have stream controller"), r.isClosed) break;
        r.isClosed = true, r.controller.close(), __privateMethod(this, _ae_instances, a_fn3).call(this, r, e);
        break;
      case et.ERROR:
        B(r, "error should have stream controller"), r.controller.error(ut(t.reason)), __privateMethod(this, _ae_instances, a_fn3).call(this, r, e);
        break;
      case et.CANCEL_COMPLETE:
        t.success ? r.cancelCall.resolve() : r.cancelCall.reject(ut(t.reason)), __privateMethod(this, _ae_instances, a_fn3).call(this, r, e);
        break;
      case et.CANCEL:
        if (!a) break;
        const o = ut(t.reason);
        Promise.try(a.onCancel || Gs, o).then(function() {
          n.postMessage({
            sourceName: s,
            targetName: i,
            stream: et.CANCEL_COMPLETE,
            streamId: e,
            success: true
          });
        }, function(l) {
          n.postMessage({
            sourceName: s,
            targetName: i,
            stream: et.CANCEL_COMPLETE,
            streamId: e,
            reason: ut(l)
          });
        }), a.sinkCapability.reject(o), a.isCancelled = true, delete this.streamSinks[e];
        break;
      default:
        throw new Error("Unexpected stream case");
    }
  };
  a_fn3 = async function(t, e) {
    var _a29, _b7, _c10;
    await Promise.allSettled([
      (_a29 = t.startCall) == null ? void 0 : _a29.promise,
      (_b7 = t.pullCall) == null ? void 0 : _b7.promise,
      (_c10 = t.cancelCall) == null ? void 0 : _c10.promise
    ]), delete this.streamControllers[e];
  };
  class vi {
    constructor({ enableHWA: t = false }) {
      __privateAdd(this, _t26, false);
      __privateSet(this, _t26, t);
    }
    create(t, e) {
      if (t <= 0 || e <= 0) throw new Error("Invalid canvas size");
      const s = this._createCanvas(t, e);
      return {
        canvas: s,
        context: s.getContext("2d", {
          willReadFrequently: !__privateGet(this, _t26)
        })
      };
    }
    reset(t, e, s) {
      if (!t.canvas) throw new Error("Canvas is not specified");
      if (e <= 0 || s <= 0) throw new Error("Invalid canvas size");
      t.canvas.width = e, t.canvas.height = s;
    }
    destroy(t) {
      if (!t.canvas) throw new Error("Canvas is not specified");
      t.canvas.width = 0, t.canvas.height = 0, t.canvas = null, t.context = null;
    }
    _createCanvas(t, e) {
      $("Abstract method `_createCanvas` called.");
    }
  }
  _t26 = new WeakMap();
  class Tn extends vi {
    constructor({ ownerDocument: t = globalThis.document, enableHWA: e = false }) {
      super({
        enableHWA: e
      }), this._document = t;
    }
    _createCanvas(t, e) {
      const s = this._document.createElement("canvas");
      return s.width = t, s.height = e, s;
    }
  }
  class Si {
    constructor({ baseUrl: t = null, isCompressed: e = true }) {
      this.baseUrl = t, this.isCompressed = e;
    }
    async fetch({ name: t }) {
      if (!this.baseUrl) throw new Error("Ensure that the `cMapUrl` and `cMapPacked` API parameters are provided.");
      if (!t) throw new Error("CMap name must be specified.");
      const e = this.baseUrl + t + (this.isCompressed ? ".bcmap" : "");
      return this._fetch(e).then((s) => ({
        cMapData: s,
        isCompressed: this.isCompressed
      })).catch((s) => {
        throw new Error(`Unable to load ${this.isCompressed ? "binary " : ""}CMap at: ${e}`);
      });
    }
    async _fetch(t) {
      $("Abstract method `_fetch` called.");
    }
  }
  class Vs extends Si {
    async _fetch(t) {
      const e = await ge(t, this.isCompressed ? "bytes" : "text");
      return e instanceof Uint8Array ? e : Ne(e);
    }
  }
  class Ei {
    addFilter(t) {
      return "none";
    }
    addHCMFilter(t, e) {
      return "none";
    }
    addAlphaFilter(t) {
      return "none";
    }
    addLuminosityFilter(t) {
      return "none";
    }
    addHighlightHCMFilter(t, e, s, i, n) {
      return "none";
    }
    destroy(t = false) {
    }
  }
  class xn extends Ei {
    constructor({ docId: t, ownerDocument: e = globalThis.document }) {
      super();
      __privateAdd(this, _xn_instances);
      __privateAdd(this, _t27);
      __privateAdd(this, _e20);
      __privateAdd(this, _i18);
      __privateAdd(this, _s14);
      __privateAdd(this, _a11);
      __privateAdd(this, _r11);
      __privateAdd(this, _n11, 0);
      __privateSet(this, _s14, t), __privateSet(this, _a11, e);
    }
    addFilter(t) {
      if (!t) return "none";
      let e = __privateGet(this, _xn_instances, o_get).get(t);
      if (e) return e;
      const [s, i, n] = __privateMethod(this, _xn_instances, u_fn5).call(this, t), r = t.length === 1 ? s : `${s}${i}${n}`;
      if (e = __privateGet(this, _xn_instances, o_get).get(r), e) return __privateGet(this, _xn_instances, o_get).set(t, e), e;
      const a = `g_${__privateGet(this, _s14)}_transfer_map_${__privateWrapper(this, _n11)._++}`, o = __privateMethod(this, _xn_instances, d_fn3).call(this, a);
      __privateGet(this, _xn_instances, o_get).set(t, o), __privateGet(this, _xn_instances, o_get).set(r, o);
      const l = __privateMethod(this, _xn_instances, g_fn3).call(this, a);
      return __privateMethod(this, _xn_instances, p_fn).call(this, s, i, n, l), o;
    }
    addHCMFilter(t, e) {
      var _a29;
      const s = `${t}-${e}`, i = "base";
      let n = __privateGet(this, _xn_instances, h_get).get(i);
      if ((n == null ? void 0 : n.key) === s || (n ? ((_a29 = n.filter) == null ? void 0 : _a29.remove(), n.key = s, n.url = "none", n.filter = null) : (n = {
        key: s,
        url: "none",
        filter: null
      }, __privateGet(this, _xn_instances, h_get).set(i, n)), !t || !e)) return n.url;
      const r = __privateMethod(this, _xn_instances, A_fn).call(this, t);
      t = T.makeHexColor(...r);
      const a = __privateMethod(this, _xn_instances, A_fn).call(this, e);
      if (e = T.makeHexColor(...a), __privateGet(this, _xn_instances, l_get).style.color = "", t === "#000000" && e === "#ffffff" || t === e) return n.url;
      const o = new Array(256);
      for (let f = 0; f <= 255; f++) {
        const g = f / 255;
        o[f] = g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
      }
      const l = o.join(","), h = `g_${__privateGet(this, _s14)}_hcm_filter`, c = n.filter = __privateMethod(this, _xn_instances, g_fn3).call(this, h);
      __privateMethod(this, _xn_instances, p_fn).call(this, l, l, l, c), __privateMethod(this, _xn_instances, m_fn2).call(this, c);
      const u = (f, g) => {
        const p = r[f] / 255, b = a[f] / 255, m = new Array(g + 1);
        for (let A = 0; A <= g; A++) m[A] = p + A / g * (b - p);
        return m.join(",");
      };
      return __privateMethod(this, _xn_instances, p_fn).call(this, u(0, 5), u(1, 5), u(2, 5), c), n.url = __privateMethod(this, _xn_instances, d_fn3).call(this, h), n.url;
    }
    addAlphaFilter(t) {
      let e = __privateGet(this, _xn_instances, o_get).get(t);
      if (e) return e;
      const [s] = __privateMethod(this, _xn_instances, u_fn5).call(this, [
        t
      ]), i = `alpha_${s}`;
      if (e = __privateGet(this, _xn_instances, o_get).get(i), e) return __privateGet(this, _xn_instances, o_get).set(t, e), e;
      const n = `g_${__privateGet(this, _s14)}_alpha_map_${__privateWrapper(this, _n11)._++}`, r = __privateMethod(this, _xn_instances, d_fn3).call(this, n);
      __privateGet(this, _xn_instances, o_get).set(t, r), __privateGet(this, _xn_instances, o_get).set(i, r);
      const a = __privateMethod(this, _xn_instances, g_fn3).call(this, n);
      return __privateMethod(this, _xn_instances, b_fn).call(this, s, a), r;
    }
    addLuminosityFilter(t) {
      let e = __privateGet(this, _xn_instances, o_get).get(t || "luminosity");
      if (e) return e;
      let s, i;
      if (t ? ([s] = __privateMethod(this, _xn_instances, u_fn5).call(this, [
        t
      ]), i = `luminosity_${s}`) : i = "luminosity", e = __privateGet(this, _xn_instances, o_get).get(i), e) return __privateGet(this, _xn_instances, o_get).set(t, e), e;
      const n = `g_${__privateGet(this, _s14)}_luminosity_map_${__privateWrapper(this, _n11)._++}`, r = __privateMethod(this, _xn_instances, d_fn3).call(this, n);
      __privateGet(this, _xn_instances, o_get).set(t, r), __privateGet(this, _xn_instances, o_get).set(i, r);
      const a = __privateMethod(this, _xn_instances, g_fn3).call(this, n);
      return __privateMethod(this, _xn_instances, f_fn3).call(this, a), t && __privateMethod(this, _xn_instances, b_fn).call(this, s, a), r;
    }
    addHighlightHCMFilter(t, e, s, i, n) {
      var _a29;
      const r = `${e}-${s}-${i}-${n}`;
      let a = __privateGet(this, _xn_instances, h_get).get(t);
      if ((a == null ? void 0 : a.key) === r || (a ? ((_a29 = a.filter) == null ? void 0 : _a29.remove(), a.key = r, a.url = "none", a.filter = null) : (a = {
        key: r,
        url: "none",
        filter: null
      }, __privateGet(this, _xn_instances, h_get).set(t, a)), !e || !s)) return a.url;
      const [o, l] = [
        e,
        s
      ].map(__privateMethod(this, _xn_instances, A_fn).bind(this));
      let h = Math.round(0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2]), c = Math.round(0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]), [u, f] = [
        i,
        n
      ].map(__privateMethod(this, _xn_instances, A_fn).bind(this));
      c < h && ([h, c, u, f] = [
        c,
        h,
        f,
        u
      ]), __privateGet(this, _xn_instances, l_get).style.color = "";
      const g = (m, A, y) => {
        const v = new Array(256), w = (c - h) / y, S = m / 255, E = (A - m) / (255 * y);
        let _ = 0;
        for (let C = 0; C <= y; C++) {
          const k = Math.round(h + C * w), x = S + C * E;
          for (let j = _; j <= k; j++) v[j] = x;
          _ = k + 1;
        }
        for (let C = _; C < 256; C++) v[C] = v[_ - 1];
        return v.join(",");
      }, p = `g_${__privateGet(this, _s14)}_hcm_${t}_filter`, b = a.filter = __privateMethod(this, _xn_instances, g_fn3).call(this, p);
      return __privateMethod(this, _xn_instances, m_fn2).call(this, b), __privateMethod(this, _xn_instances, p_fn).call(this, g(u[0], f[0], 5), g(u[1], f[1], 5), g(u[2], f[2], 5), b), a.url = __privateMethod(this, _xn_instances, d_fn3).call(this, p), a.url;
    }
    destroy(t = false) {
      var _a29, _b7, _c10, _d12;
      t && ((_a29 = __privateGet(this, _r11)) == null ? void 0 : _a29.size) || ((_b7 = __privateGet(this, _i18)) == null ? void 0 : _b7.parentNode.parentNode.remove(), __privateSet(this, _i18, null), (_c10 = __privateGet(this, _e20)) == null ? void 0 : _c10.clear(), __privateSet(this, _e20, null), (_d12 = __privateGet(this, _r11)) == null ? void 0 : _d12.clear(), __privateSet(this, _r11, null), __privateSet(this, _n11, 0));
    }
  }
  _t27 = new WeakMap();
  _e20 = new WeakMap();
  _i18 = new WeakMap();
  _s14 = new WeakMap();
  _a11 = new WeakMap();
  _r11 = new WeakMap();
  _n11 = new WeakMap();
  _xn_instances = new WeakSet();
  o_get = function() {
    return __privateGet(this, _e20) || __privateSet(this, _e20, /* @__PURE__ */ new Map());
  };
  h_get = function() {
    return __privateGet(this, _r11) || __privateSet(this, _r11, /* @__PURE__ */ new Map());
  };
  l_get = function() {
    if (!__privateGet(this, _i18)) {
      const t = __privateGet(this, _a11).createElement("div"), { style: e } = t;
      e.visibility = "hidden", e.contain = "strict", e.width = e.height = 0, e.position = "absolute", e.top = e.left = 0, e.zIndex = -1;
      const s = __privateGet(this, _a11).createElementNS(Mt, "svg");
      s.setAttribute("width", 0), s.setAttribute("height", 0), __privateSet(this, _i18, __privateGet(this, _a11).createElementNS(Mt, "defs")), t.append(s), s.append(__privateGet(this, _i18)), __privateGet(this, _a11).body.append(t);
    }
    return __privateGet(this, _i18);
  };
  u_fn5 = function(t) {
    if (t.length === 1) {
      const o = t[0], l = new Array(256);
      for (let c = 0; c < 256; c++) l[c] = o[c] / 255;
      const h = l.join(",");
      return [
        h,
        h,
        h
      ];
    }
    const [e, s, i] = t, n = new Array(256), r = new Array(256), a = new Array(256);
    for (let o = 0; o < 256; o++) n[o] = e[o] / 255, r[o] = s[o] / 255, a[o] = i[o] / 255;
    return [
      n.join(","),
      r.join(","),
      a.join(",")
    ];
  };
  d_fn3 = function(t) {
    if (__privateGet(this, _t27) === void 0) {
      __privateSet(this, _t27, "");
      const e = __privateGet(this, _a11).URL;
      e !== __privateGet(this, _a11).baseURI && (Oe(e) ? F('#createUrl: ignore "data:"-URL for performance reasons.') : __privateSet(this, _t27, di(e, "")));
    }
    return `url(${__privateGet(this, _t27)}#${t})`;
  };
  f_fn3 = function(t) {
    const e = __privateGet(this, _a11).createElementNS(Mt, "feColorMatrix");
    e.setAttribute("type", "matrix"), e.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0.59 0.11 0 0"), t.append(e);
  };
  m_fn2 = function(t) {
    const e = __privateGet(this, _a11).createElementNS(Mt, "feColorMatrix");
    e.setAttribute("type", "matrix"), e.setAttribute("values", "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"), t.append(e);
  };
  g_fn3 = function(t) {
    const e = __privateGet(this, _a11).createElementNS(Mt, "filter");
    return e.setAttribute("color-interpolation-filters", "sRGB"), e.setAttribute("id", t), __privateGet(this, _xn_instances, l_get).append(e), e;
  };
  c_fn = function(t, e, s) {
    const i = __privateGet(this, _a11).createElementNS(Mt, e);
    i.setAttribute("type", "discrete"), i.setAttribute("tableValues", s), t.append(i);
  };
  p_fn = function(t, e, s, i) {
    const n = __privateGet(this, _a11).createElementNS(Mt, "feComponentTransfer");
    i.append(n), __privateMethod(this, _xn_instances, c_fn).call(this, n, "feFuncR", t), __privateMethod(this, _xn_instances, c_fn).call(this, n, "feFuncG", e), __privateMethod(this, _xn_instances, c_fn).call(this, n, "feFuncB", s);
  };
  b_fn = function(t, e) {
    const s = __privateGet(this, _a11).createElementNS(Mt, "feComponentTransfer");
    e.append(s), __privateMethod(this, _xn_instances, c_fn).call(this, s, "feFuncA", t);
  };
  A_fn = function(t) {
    return __privateGet(this, _xn_instances, l_get).style.color = t, be(getComputedStyle(__privateGet(this, _xn_instances, l_get)).getPropertyValue("color"));
  };
  class _i {
    constructor({ baseUrl: t = null }) {
      this.baseUrl = t;
    }
    async fetch({ filename: t }) {
      if (!this.baseUrl) throw new Error("Ensure that the `standardFontDataUrl` API parameter is provided.");
      if (!t) throw new Error("Font filename must be specified.");
      const e = `${this.baseUrl}${t}`;
      return this._fetch(e).catch((s) => {
        throw new Error(`Unable to load font data at: ${e}`);
      });
    }
    async _fetch(t) {
      $("Abstract method `_fetch` called.");
    }
  }
  class Ws extends _i {
    async _fetch(t) {
      return ge(t, "bytes");
    }
  }
  class Ci {
    constructor({ baseUrl: t = null }) {
      this.baseUrl = t;
    }
    async fetch({ filename: t }) {
      if (!this.baseUrl) throw new Error("Ensure that the `wasmUrl` API parameter is provided.");
      if (!t) throw new Error("Wasm filename must be specified.");
      const e = `${this.baseUrl}${t}`;
      return this._fetch(e).catch((s) => {
        throw new Error(`Unable to load wasm data at: ${e}`);
      });
    }
    async _fetch(t) {
      $("Abstract method `_fetch` called.");
    }
  }
  class Xs extends Ci {
    async _fetch(t) {
      return ge(t, "bytes");
    }
  }
  dt && F("Please use the `legacy` build in Node.js environments.");
  async function _s(d) {
    const e = await yt.getBuiltinModule("fs").promises.readFile(d);
    return new Uint8Array(e);
  }
  class Pn extends Ei {
  }
  class kn extends vi {
    _createCanvas(t, e) {
      return yt.getBuiltinModule("module").createRequire(import.meta.url)("@napi-rs/canvas").createCanvas(t, e);
    }
  }
  class Mn extends Si {
    async _fetch(t) {
      return _s(t);
    }
  }
  class Dn extends _i {
    async _fetch(t) {
      return _s(t);
    }
  }
  class In extends Ci {
    async _fetch(t) {
      return _s(t);
    }
  }
  const $t = "__forcedDependency", { floor: Ys, ceil: qs } = Math;
  function Ee(d, t, e, s, i, n) {
    d[t * 4 + 0] = Math.min(d[t * 4 + 0], e), d[t * 4 + 1] = Math.min(d[t * 4 + 1], s), d[t * 4 + 2] = Math.max(d[t * 4 + 2], i), d[t * 4 + 3] = Math.max(d[t * 4 + 3], n);
  }
  const us = new Uint32Array(new Uint8Array([
    255,
    255,
    0,
    0
  ]).buffer)[0];
  class Ln {
    constructor(t, e) {
      __privateAdd(this, _t28);
      __privateAdd(this, _e21);
      __privateSet(this, _t28, t), __privateSet(this, _e21, e);
    }
    get length() {
      return __privateGet(this, _t28).length;
    }
    isEmpty(t) {
      return __privateGet(this, _t28)[t] === us;
    }
    minX(t) {
      return __privateGet(this, _e21)[t * 4 + 0] / 256;
    }
    minY(t) {
      return __privateGet(this, _e21)[t * 4 + 1] / 256;
    }
    maxX(t) {
      return (__privateGet(this, _e21)[t * 4 + 2] + 1) / 256;
    }
    maxY(t) {
      return (__privateGet(this, _e21)[t * 4 + 3] + 1) / 256;
    }
  }
  _t28 = new WeakMap();
  _e21 = new WeakMap();
  const _e = (d, t) => d == null ? void 0 : d.getOrInsertComputed(t, () => ({
    dependencies: /* @__PURE__ */ new Set(),
    isRenderingOperation: false
  }));
  class Rn {
    constructor(t, e, s = false) {
      __privateAdd(this, _Rn_instances);
      __privateAdd(this, _t29, {
        __proto__: null
      });
      __privateAdd(this, _e22, {
        __proto__: null,
        transform: [],
        moveText: [],
        sameLineText: [],
        [$t]: []
      });
      __privateAdd(this, _i19, /* @__PURE__ */ new Map());
      __privateAdd(this, _s15, []);
      __privateAdd(this, _a12, []);
      __privateAdd(this, _r12, [
        [
          1,
          0,
          0,
          1,
          0,
          0
        ]
      ]);
      __privateAdd(this, _n12, [
        -1 / 0,
        -1 / 0,
        1 / 0,
        1 / 0
      ]);
      __privateAdd(this, _o9, new Float64Array([
        1 / 0,
        1 / 0,
        -1 / 0,
        -1 / 0
      ]));
      __privateAdd(this, _h7, -1);
      __privateAdd(this, _l6, /* @__PURE__ */ new Set());
      __privateAdd(this, _u5, /* @__PURE__ */ new Map());
      __privateAdd(this, _d6, /* @__PURE__ */ new Map());
      __privateAdd(this, _f4);
      __privateAdd(this, _m3);
      __privateAdd(this, _g3);
      __privateAdd(this, _c4);
      __privateAdd(this, _p3);
      __privateSet(this, _f4, t.width), __privateSet(this, _m3, t.height), __privateMethod(this, _Rn_instances, b_fn2).call(this, e), s && __privateSet(this, _p3, /* @__PURE__ */ new Map());
    }
    growOperationsCount(t) {
      t >= __privateGet(this, _c4).length && __privateMethod(this, _Rn_instances, b_fn2).call(this, t, __privateGet(this, _c4));
    }
    save(t) {
      return __privateSet(this, _t29, {
        __proto__: __privateGet(this, _t29)
      }), __privateSet(this, _e22, {
        __proto__: __privateGet(this, _e22),
        transform: {
          __proto__: __privateGet(this, _e22).transform
        },
        moveText: {
          __proto__: __privateGet(this, _e22).moveText
        },
        sameLineText: {
          __proto__: __privateGet(this, _e22).sameLineText
        },
        [$t]: {
          __proto__: __privateGet(this, _e22)[$t]
        }
      }), __privateSet(this, _n12, {
        __proto__: __privateGet(this, _n12)
      }), __privateGet(this, _s15).push(t), this;
    }
    restore(t) {
      var _a29;
      const e = Object.getPrototypeOf(__privateGet(this, _t29));
      if (e === null) return this;
      __privateSet(this, _t29, e), __privateSet(this, _e22, Object.getPrototypeOf(__privateGet(this, _e22))), __privateSet(this, _n12, Object.getPrototypeOf(__privateGet(this, _n12)));
      const s = __privateGet(this, _s15).pop();
      return s !== void 0 && ((_a29 = _e(__privateGet(this, _p3), t)) == null ? void 0 : _a29.dependencies.add(s), __privateGet(this, _c4)[t] = __privateGet(this, _c4)[s]), this;
    }
    recordOpenMarker(t) {
      return __privateGet(this, _s15).push(t), this;
    }
    getOpenMarker() {
      return __privateGet(this, _s15).length === 0 ? null : __privateGet(this, _s15).at(-1);
    }
    recordCloseMarker(t) {
      var _a29;
      const e = __privateGet(this, _s15).pop();
      return e !== void 0 && ((_a29 = _e(__privateGet(this, _p3), t)) == null ? void 0 : _a29.dependencies.add(e), __privateGet(this, _c4)[t] = __privateGet(this, _c4)[e]), this;
    }
    beginMarkedContent(t) {
      return __privateGet(this, _a12).push(t), this;
    }
    endMarkedContent(t) {
      var _a29;
      const e = __privateGet(this, _a12).pop();
      return e !== void 0 && ((_a29 = _e(__privateGet(this, _p3), t)) == null ? void 0 : _a29.dependencies.add(e), __privateGet(this, _c4)[t] = __privateGet(this, _c4)[e]), this;
    }
    pushBaseTransform(t) {
      return __privateGet(this, _r12).push(T.multiplyByDOMMatrix(__privateGet(this, _r12).at(-1), t.getTransform())), this;
    }
    popBaseTransform() {
      return __privateGet(this, _r12).length > 1 && __privateGet(this, _r12).pop(), this;
    }
    recordSimpleData(t, e) {
      return __privateGet(this, _t29)[t] = e, this;
    }
    recordIncrementalData(t, e) {
      return __privateGet(this, _e22)[t].push(e), this;
    }
    resetIncrementalData(t, e) {
      return __privateGet(this, _e22)[t].length = 0, this;
    }
    recordNamedData(t, e) {
      return __privateGet(this, _i19).set(t, e), this;
    }
    recordSimpleDataFromNamed(t, e, s) {
      __privateGet(this, _t29)[t] = __privateGet(this, _i19).get(e) ?? s;
    }
    recordFutureForcedDependency(t, e) {
      return this.recordIncrementalData($t, e), this;
    }
    inheritSimpleDataAsFutureForcedDependencies(t) {
      for (const e of t) e in __privateGet(this, _t29) && this.recordFutureForcedDependency(e, __privateGet(this, _t29)[e]);
      return this;
    }
    inheritPendingDependenciesAsFutureForcedDependencies() {
      for (const t of __privateGet(this, _l6)) this.recordFutureForcedDependency($t, t);
      return this;
    }
    resetBBox(t) {
      return __privateGet(this, _h7) !== t && (__privateSet(this, _h7, t), __privateGet(this, _o9)[0] = 1 / 0, __privateGet(this, _o9)[1] = 1 / 0, __privateGet(this, _o9)[2] = -1 / 0, __privateGet(this, _o9)[3] = -1 / 0), this;
    }
    recordClipBox(t, e, s, i, n, r) {
      const a = T.multiplyByDOMMatrix(__privateGet(this, _r12).at(-1), e.getTransform()), o = [
        1 / 0,
        1 / 0,
        -1 / 0,
        -1 / 0
      ];
      T.axialAlignedBoundingBox([
        s,
        n,
        i,
        r
      ], a, o);
      const l = T.intersect(__privateGet(this, _n12), o);
      return l ? (__privateGet(this, _n12)[0] = l[0], __privateGet(this, _n12)[1] = l[1], __privateGet(this, _n12)[2] = l[2], __privateGet(this, _n12)[3] = l[3]) : (__privateGet(this, _n12)[0] = __privateGet(this, _n12)[1] = 1 / 0, __privateGet(this, _n12)[2] = __privateGet(this, _n12)[3] = -1 / 0), this;
    }
    recordBBox(t, e, s, i, n, r) {
      const a = __privateGet(this, _n12);
      if (a[0] === 1 / 0) return this;
      const o = T.multiplyByDOMMatrix(__privateGet(this, _r12).at(-1), e.getTransform());
      if (a[0] === -1 / 0) return T.axialAlignedBoundingBox([
        s,
        n,
        i,
        r
      ], o, __privateGet(this, _o9)), this;
      const l = [
        1 / 0,
        1 / 0,
        -1 / 0,
        -1 / 0
      ];
      return T.axialAlignedBoundingBox([
        s,
        n,
        i,
        r
      ], o, l), __privateGet(this, _o9)[0] = Math.min(__privateGet(this, _o9)[0], Math.max(l[0], a[0])), __privateGet(this, _o9)[1] = Math.min(__privateGet(this, _o9)[1], Math.max(l[1], a[1])), __privateGet(this, _o9)[2] = Math.max(__privateGet(this, _o9)[2], Math.min(l[2], a[2])), __privateGet(this, _o9)[3] = Math.max(__privateGet(this, _o9)[3], Math.min(l[3], a[3])), this;
    }
    recordCharacterBBox(t, e, s, i = 1, n = 0, r = 0, a) {
      const o = s.bbox;
      let l, h;
      if (o && (l = o[2] !== o[0] && o[3] !== o[1] && __privateGet(this, _d6).get(s), l !== false && (h = [
        0,
        0,
        0,
        0
      ], T.axialAlignedBoundingBox(o, s.fontMatrix, h), (i !== 1 || n !== 0 || r !== 0) && T.scaleMinMax([
        i,
        0,
        0,
        -i,
        n,
        r
      ], h), l))) return this.recordBBox(t, e, h[0], h[2], h[1], h[3]);
      if (!a) return this.recordFullPageBBox(t);
      const c = a();
      return o && h && l === void 0 && (l = h[0] <= n - c.actualBoundingBoxLeft && h[2] >= n + c.actualBoundingBoxRight && h[1] <= r - c.actualBoundingBoxAscent && h[3] >= r + c.actualBoundingBoxDescent, __privateGet(this, _d6).set(s, l), l) ? this.recordBBox(t, e, h[0], h[2], h[1], h[3]) : this.recordBBox(t, e, n - c.actualBoundingBoxLeft, n + c.actualBoundingBoxRight, r - c.actualBoundingBoxAscent, r + c.actualBoundingBoxDescent);
    }
    recordFullPageBBox(t) {
      return __privateGet(this, _o9)[0] = Math.max(0, __privateGet(this, _n12)[0]), __privateGet(this, _o9)[1] = Math.max(0, __privateGet(this, _n12)[1]), __privateGet(this, _o9)[2] = Math.min(__privateGet(this, _f4), __privateGet(this, _n12)[2]), __privateGet(this, _o9)[3] = Math.min(__privateGet(this, _m3), __privateGet(this, _n12)[3]), this;
    }
    getSimpleIndex(t) {
      return __privateGet(this, _t29)[t];
    }
    recordDependencies(t, e) {
      const s = __privateGet(this, _l6), i = __privateGet(this, _t29), n = __privateGet(this, _e22);
      for (const r of e) r in __privateGet(this, _t29) ? s.add(i[r]) : r in n && n[r].forEach(s.add, s);
      return this;
    }
    recordNamedDependency(t, e) {
      return __privateGet(this, _i19).has(e) && __privateGet(this, _l6).add(__privateGet(this, _i19).get(e)), this;
    }
    recordOperation(t, e = false) {
      if (this.recordDependencies(t, [
        $t
      ]), __privateGet(this, _p3)) {
        const s = _e(__privateGet(this, _p3), t), { dependencies: i } = s;
        __privateGet(this, _l6).forEach(i.add, i), __privateGet(this, _s15).forEach(i.add, i), __privateGet(this, _a12).forEach(i.add, i), i.delete(t), s.isRenderingOperation = true;
      }
      if (__privateGet(this, _h7) === t) {
        const s = Ys(__privateGet(this, _o9)[0] * 256 / __privateGet(this, _f4)), i = Ys(__privateGet(this, _o9)[1] * 256 / __privateGet(this, _m3)), n = qs(__privateGet(this, _o9)[2] * 256 / __privateGet(this, _f4)), r = qs(__privateGet(this, _o9)[3] * 256 / __privateGet(this, _m3));
        Ee(__privateGet(this, _g3), t, s, i, n, r);
        for (const a of __privateGet(this, _l6)) a !== t && Ee(__privateGet(this, _g3), a, s, i, n, r);
        for (const a of __privateGet(this, _s15)) a !== t && Ee(__privateGet(this, _g3), a, s, i, n, r);
        for (const a of __privateGet(this, _a12)) a !== t && Ee(__privateGet(this, _g3), a, s, i, n, r);
        e || (__privateGet(this, _l6).clear(), __privateSet(this, _h7, -1));
      }
      return this;
    }
    recordShowTextOperation(t, e = false) {
      const s = Array.from(__privateGet(this, _l6));
      this.recordOperation(t, e), this.recordIncrementalData("sameLineText", t);
      for (const i of s) this.recordIncrementalData("sameLineText", i);
      return this;
    }
    bboxToClipBoxDropOperation(t, e = false) {
      return __privateGet(this, _h7) === t && (__privateSet(this, _h7, -1), __privateGet(this, _n12)[0] = Math.max(__privateGet(this, _n12)[0], __privateGet(this, _o9)[0]), __privateGet(this, _n12)[1] = Math.max(__privateGet(this, _n12)[1], __privateGet(this, _o9)[1]), __privateGet(this, _n12)[2] = Math.min(__privateGet(this, _n12)[2], __privateGet(this, _o9)[2]), __privateGet(this, _n12)[3] = Math.min(__privateGet(this, _n12)[3], __privateGet(this, _o9)[3]), e || __privateGet(this, _l6).clear()), this;
    }
    _takePendingDependencies() {
      const t = __privateGet(this, _l6);
      return __privateSet(this, _l6, /* @__PURE__ */ new Set()), t;
    }
    _extractOperation(t) {
      const e = __privateGet(this, _u5).get(t);
      return __privateGet(this, _u5).delete(t), e;
    }
    _pushPendingDependencies(t) {
      for (const e of t) __privateGet(this, _l6).add(e);
    }
    take() {
      return __privateGet(this, _d6).clear(), new Ln(__privateGet(this, _c4), __privateGet(this, _g3));
    }
    takeDebugMetadata() {
      return __privateGet(this, _p3);
    }
  }
  _t29 = new WeakMap();
  _e22 = new WeakMap();
  _i19 = new WeakMap();
  _s15 = new WeakMap();
  _a12 = new WeakMap();
  _r12 = new WeakMap();
  _n12 = new WeakMap();
  _o9 = new WeakMap();
  _h7 = new WeakMap();
  _l6 = new WeakMap();
  _u5 = new WeakMap();
  _d6 = new WeakMap();
  _f4 = new WeakMap();
  _m3 = new WeakMap();
  _g3 = new WeakMap();
  _c4 = new WeakMap();
  _p3 = new WeakMap();
  _Rn_instances = new WeakSet();
  b_fn2 = function(t, e) {
    const s = new ArrayBuffer(t * 4);
    __privateSet(this, _g3, new Uint8ClampedArray(s)), __privateSet(this, _c4, new Uint32Array(s)), e && e.length > 0 ? (__privateGet(this, _c4).set(e), __privateGet(this, _c4).fill(us, e.length)) : __privateGet(this, _c4).fill(us);
  };
  const _De = class _De {
    constructor(t, e, s) {
      __privateAdd(this, _t30);
      __privateAdd(this, _e23);
      __privateAdd(this, _i20);
      __privateAdd(this, _s16, 0);
      __privateAdd(this, _a13, 0);
      if (t instanceof _De && __privateGet(t, _i20) === !!s) return t;
      __privateSet(this, _t30, t), __privateSet(this, _e23, e), __privateSet(this, _i20, !!s);
    }
    growOperationsCount() {
      throw new Error("Unreachable");
    }
    save(t) {
      return __privateWrapper(this, _a13)._++, __privateGet(this, _t30).save(__privateGet(this, _e23)), this;
    }
    restore(t) {
      return __privateGet(this, _a13) > 0 && (__privateGet(this, _t30).restore(__privateGet(this, _e23)), __privateWrapper(this, _a13)._--), this;
    }
    recordOpenMarker(t) {
      return __privateWrapper(this, _s16)._++, this;
    }
    getOpenMarker() {
      return __privateGet(this, _s16) > 0 ? __privateGet(this, _e23) : __privateGet(this, _t30).getOpenMarker();
    }
    recordCloseMarker(t) {
      return __privateWrapper(this, _s16)._--, this;
    }
    beginMarkedContent(t) {
      return this;
    }
    endMarkedContent(t) {
      return this;
    }
    pushBaseTransform(t) {
      return __privateGet(this, _t30).pushBaseTransform(t), this;
    }
    popBaseTransform() {
      return __privateGet(this, _t30).popBaseTransform(), this;
    }
    recordSimpleData(t, e) {
      return __privateGet(this, _t30).recordSimpleData(t, __privateGet(this, _e23)), this;
    }
    recordIncrementalData(t, e) {
      return __privateGet(this, _t30).recordIncrementalData(t, __privateGet(this, _e23)), this;
    }
    resetIncrementalData(t, e) {
      return __privateGet(this, _t30).resetIncrementalData(t, __privateGet(this, _e23)), this;
    }
    recordNamedData(t, e) {
      return this;
    }
    recordSimpleDataFromNamed(t, e, s) {
      return __privateGet(this, _t30).recordSimpleDataFromNamed(t, e, __privateGet(this, _e23)), this;
    }
    recordFutureForcedDependency(t, e) {
      return __privateGet(this, _t30).recordFutureForcedDependency(t, __privateGet(this, _e23)), this;
    }
    inheritSimpleDataAsFutureForcedDependencies(t) {
      return __privateGet(this, _t30).inheritSimpleDataAsFutureForcedDependencies(t), this;
    }
    inheritPendingDependenciesAsFutureForcedDependencies() {
      return __privateGet(this, _t30).inheritPendingDependenciesAsFutureForcedDependencies(), this;
    }
    resetBBox(t) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).resetBBox(__privateGet(this, _e23)), this;
    }
    recordClipBox(t, e, s, i, n, r) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).recordClipBox(__privateGet(this, _e23), e, s, i, n, r), this;
    }
    recordBBox(t, e, s, i, n, r) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).recordBBox(__privateGet(this, _e23), e, s, i, n, r), this;
    }
    recordCharacterBBox(t, e, s, i, n, r, a) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).recordCharacterBBox(__privateGet(this, _e23), e, s, i, n, r, a), this;
    }
    recordFullPageBBox(t) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).recordFullPageBBox(__privateGet(this, _e23)), this;
    }
    getSimpleIndex(t) {
      return __privateGet(this, _t30).getSimpleIndex(t);
    }
    recordDependencies(t, e) {
      return __privateGet(this, _t30).recordDependencies(__privateGet(this, _e23), e), this;
    }
    recordNamedDependency(t, e) {
      return __privateGet(this, _t30).recordNamedDependency(__privateGet(this, _e23), e), this;
    }
    recordOperation(t) {
      return __privateGet(this, _t30).recordOperation(__privateGet(this, _e23), true), this;
    }
    recordShowTextOperation(t) {
      return __privateGet(this, _t30).recordShowTextOperation(__privateGet(this, _e23), true), this;
    }
    bboxToClipBoxDropOperation(t) {
      return __privateGet(this, _i20) || __privateGet(this, _t30).bboxToClipBoxDropOperation(__privateGet(this, _e23), true), this;
    }
    take() {
      throw new Error("Unreachable");
    }
    takeDebugMetadata() {
      throw new Error("Unreachable");
    }
  };
  _t30 = new WeakMap();
  _e23 = new WeakMap();
  _i20 = new WeakMap();
  _s16 = new WeakMap();
  _a13 = new WeakMap();
  let De = _De;
  const wt = {
    stroke: [
      "path",
      "transform",
      "filter",
      "strokeColor",
      "strokeAlpha",
      "lineWidth",
      "lineCap",
      "lineJoin",
      "miterLimit",
      "dash"
    ],
    fill: [
      "path",
      "transform",
      "filter",
      "fillColor",
      "fillAlpha",
      "globalCompositeOperation",
      "SMask"
    ],
    imageXObject: [
      "transform",
      "SMask",
      "filter",
      "fillAlpha",
      "strokeAlpha",
      "globalCompositeOperation"
    ],
    rawFillPath: [
      "filter",
      "fillColor",
      "fillAlpha"
    ],
    showText: [
      "transform",
      "leading",
      "charSpacing",
      "wordSpacing",
      "hScale",
      "textRise",
      "moveText",
      "textMatrix",
      "font",
      "fontObj",
      "filter",
      "fillColor",
      "textRenderingMode",
      "SMask",
      "fillAlpha",
      "strokeAlpha",
      "globalCompositeOperation",
      "sameLineText"
    ],
    transform: [
      "transform"
    ],
    transformAndFill: [
      "transform",
      "fillColor"
    ]
  }, ct = {
    FILL: "Fill",
    STROKE: "Stroke",
    SHADING: "Shading"
  };
  function fs(d, t) {
    if (!t) return;
    const e = t[2] - t[0], s = t[3] - t[1], i = new Path2D();
    i.rect(t[0], t[1], e, s), d.clip(i);
  }
  class Cs {
    isModifyingCurrentTransform() {
      return false;
    }
    getPattern() {
      $("Abstract method `getPattern` called.");
    }
  }
  class Fn extends Cs {
    constructor(t) {
      super(), this._type = t[1], this._bbox = t[2], this._colorStops = t[3], this._p0 = t[4], this._p1 = t[5], this._r0 = t[6], this._r1 = t[7], this.matrix = null;
    }
    isOriginBased() {
      return this._p0[0] === 0 && this._p0[1] === 0 && (!this.isRadial() || this._p1[0] === 0 && this._p1[1] === 0);
    }
    isRadial() {
      return this._type === "radial";
    }
    _createGradient(t, e = null) {
      let s, i = this._p0, n = this._p1;
      if (e && (i = i.slice(), n = n.slice(), T.applyTransform(i, e), T.applyTransform(n, e)), this._type === "axial") s = t.createLinearGradient(i[0], i[1], n[0], n[1]);
      else if (this._type === "radial") {
        let r = this._r0, a = this._r1;
        if (e) {
          const o = new Float32Array(2);
          T.singularValueDecompose2dScale(e, o), r *= o[0], a *= o[0];
        }
        s = t.createRadialGradient(i[0], i[1], r, n[0], n[1], a);
      }
      for (const r of this._colorStops) s.addColorStop(r[0], r[1]);
      return s;
    }
    getPattern(t, e, s, i) {
      let n;
      if (i === ct.STROKE || i === ct.FILL) {
        if (this.isOriginBased()) {
          let u = T.transform(s, e.baseTransform);
          this.matrix && (u = T.transform(u, this.matrix));
          const f = 1e-3, g = Math.hypot(u[0], u[1]), p = Math.hypot(u[2], u[3]), b = (u[0] * u[2] + u[1] * u[3]) / (g * p);
          if (Math.abs(b) < f) if (this.isRadial()) {
            if (Math.abs(g - p) < f) return this._createGradient(t, u);
          } else return this._createGradient(t, u);
        }
        const r = e.current.getClippedPathBoundingBox(i, Y(t)) || [
          0,
          0,
          0,
          0
        ], a = Math.ceil(r[2] - r[0]) || 1, o = Math.ceil(r[3] - r[1]) || 1, l = e.cachedCanvases.getCanvas("pattern", a, o), h = l.context;
        h.clearRect(0, 0, h.canvas.width, h.canvas.height), h.beginPath(), h.rect(0, 0, h.canvas.width, h.canvas.height), h.translate(-r[0], -r[1]), s = T.transform(s, [
          1,
          0,
          0,
          1,
          r[0],
          r[1]
        ]), h.transform(...e.baseTransform), this.matrix && h.transform(...this.matrix), fs(h, this._bbox), h.fillStyle = this._createGradient(h), h.fill(), n = t.createPattern(l.canvas, "no-repeat");
        const c = new DOMMatrix(s);
        n.setTransform(c);
      } else fs(t, this._bbox), n = this._createGradient(t);
      return n;
    }
  }
  function Ze(d, t, e, s, i, n, r, a) {
    const o = t.coords, l = t.colors, h = d.data, c = d.width * 4;
    let u;
    o[e + 1] > o[s + 1] && (u = e, e = s, s = u, u = n, n = r, r = u), o[s + 1] > o[i + 1] && (u = s, s = i, i = u, u = r, r = a, a = u), o[e + 1] > o[s + 1] && (u = e, e = s, s = u, u = n, n = r, r = u);
    const f = (o[e] + t.offsetX) * t.scaleX, g = (o[e + 1] + t.offsetY) * t.scaleY, p = (o[s] + t.offsetX) * t.scaleX, b = (o[s + 1] + t.offsetY) * t.scaleY, m = (o[i] + t.offsetX) * t.scaleX, A = (o[i + 1] + t.offsetY) * t.scaleY;
    if (g >= A) return;
    const y = l[n], v = l[n + 1], w = l[n + 2], S = l[r], E = l[r + 1], _ = l[r + 2], C = l[a], k = l[a + 1], x = l[a + 2], j = Math.round(g), V = Math.round(A);
    let N, J, M, I, z, pt, kt, Z;
    for (let W = j; W <= V; W++) {
      if (W < b) {
        const tt = W < g ? 0 : (g - W) / (g - b);
        N = f - (f - p) * tt, J = y - (y - S) * tt, M = v - (v - E) * tt, I = w - (w - _) * tt;
      } else {
        let tt;
        W > A ? tt = 1 : b === A ? tt = 0 : tt = (b - W) / (b - A), N = p - (p - m) * tt, J = S - (S - C) * tt, M = E - (E - k) * tt, I = _ - (_ - x) * tt;
      }
      let X;
      W < g ? X = 0 : W > A ? X = 1 : X = (g - W) / (g - A), z = f - (f - m) * X, pt = y - (y - C) * X, kt = v - (v - k) * X, Z = w - (w - x) * X;
      const It = Math.round(Math.min(N, z)), Jt = Math.round(Math.max(N, z));
      let Et = c * W + It * 4;
      for (let tt = It; tt <= Jt; tt++) X = (N - tt) / (N - z), X < 0 ? X = 0 : X > 1 && (X = 1), h[Et++] = J - (J - pt) * X | 0, h[Et++] = M - (M - kt) * X | 0, h[Et++] = I - (I - Z) * X | 0, h[Et++] = 255;
    }
  }
  function Nn(d, t, e) {
    const s = t.coords, i = t.colors;
    let n, r;
    switch (t.type) {
      case ns.LATTICE:
        const a = t.verticesPerRow, o = Math.floor(s.length / a) - 1, l = a - 1;
        for (n = 0; n < o; n++) {
          let h = n * a;
          for (let c = 0; c < l; c++, h++) Ze(d, e, s[h], s[h + 1], s[h + a], i[h], i[h + 1], i[h + a]), Ze(d, e, s[h + a + 1], s[h + 1], s[h + a], i[h + a + 1], i[h + 1], i[h + a]);
        }
        break;
      case ns.TRIANGLES:
        for (n = 0, r = s.length; n < r; n += 3) Ze(d, e, s[n], s[n + 1], s[n + 2], i[n], i[n + 1], i[n + 2]);
        break;
      default:
        throw new Error("illegal figure");
    }
  }
  class On extends Cs {
    constructor(t) {
      super(), this._coords = t[2], this._colors = t[3], this._figures = t[4], this._bounds = t[5], this._bbox = t[6], this._background = t[7], this.matrix = null;
    }
    _createMeshCanvas(t, e, s) {
      const a = Math.floor(this._bounds[0]), o = Math.floor(this._bounds[1]), l = Math.ceil(this._bounds[2]) - a, h = Math.ceil(this._bounds[3]) - o, c = Math.min(Math.ceil(Math.abs(l * t[0] * 1.1)), 3e3), u = Math.min(Math.ceil(Math.abs(h * t[1] * 1.1)), 3e3), f = l / c, g = h / u, p = {
        coords: this._coords,
        colors: this._colors,
        offsetX: -a,
        offsetY: -o,
        scaleX: 1 / f,
        scaleY: 1 / g
      }, b = c + 4, m = u + 4, A = s.getCanvas("mesh", b, m), y = A.context, v = y.createImageData(c, u);
      if (e) {
        const S = v.data;
        for (let E = 0, _ = S.length; E < _; E += 4) S[E] = e[0], S[E + 1] = e[1], S[E + 2] = e[2], S[E + 3] = 255;
      }
      for (const S of this._figures) Nn(v, S, p);
      return y.putImageData(v, 2, 2), {
        canvas: A.canvas,
        offsetX: a - 2 * f,
        offsetY: o - 2 * g,
        scaleX: f,
        scaleY: g
      };
    }
    isModifyingCurrentTransform() {
      return true;
    }
    getPattern(t, e, s, i) {
      fs(t, this._bbox);
      const n = new Float32Array(2);
      if (i === ct.SHADING) T.singularValueDecompose2dScale(Y(t), n);
      else if (this.matrix) {
        T.singularValueDecompose2dScale(this.matrix, n);
        const [a, o] = n;
        T.singularValueDecompose2dScale(e.baseTransform, n), n[0] *= a, n[1] *= o;
      } else T.singularValueDecompose2dScale(e.baseTransform, n);
      const r = this._createMeshCanvas(n, i === ct.SHADING ? null : this._background, e.cachedCanvases);
      return i !== ct.SHADING && (t.setTransform(...e.baseTransform), this.matrix && t.transform(...this.matrix)), t.translate(r.offsetX, r.offsetY), t.scale(r.scaleX, r.scaleY), t.createPattern(r.canvas, "no-repeat");
    }
  }
  class Bn extends Cs {
    getPattern() {
      return "hotpink";
    }
  }
  function Un(d) {
    switch (d[0]) {
      case "RadialAxial":
        return new Fn(d);
      case "Mesh":
        return new On(d);
      case "Dummy":
        return new Bn();
    }
    throw new Error(`Unknown IR type: ${d[0]}`);
  }
  const Ks = {
    COLORED: 1,
    UNCOLORED: 2
  };
  const _Ts = class _Ts {
    constructor(t, e, s, i) {
      this.color = t[1], this.operatorList = t[2], this.matrix = t[3], this.bbox = t[4], this.xstep = t[5], this.ystep = t[6], this.paintType = t[7], this.tilingType = t[8], this.ctx = e, this.canvasGraphicsFactory = s, this.baseTransform = i;
    }
    createPatternCanvas(t, e) {
      var _a29, _b7;
      const { bbox: s, operatorList: i, paintType: n, tilingType: r, color: a, canvasGraphicsFactory: o } = this;
      let { xstep: l, ystep: h } = this;
      l = Math.abs(l), h = Math.abs(h), Fe("TilingType: " + r);
      const c = s[0], u = s[1], f = s[2], g = s[3], p = f - c, b = g - u, m = new Float32Array(2);
      T.singularValueDecompose2dScale(this.matrix, m);
      const [A, y] = m;
      T.singularValueDecompose2dScale(this.baseTransform, m);
      const v = A * m[0], w = y * m[1];
      let S = p, E = b, _ = false, C = false;
      const k = Math.ceil(l * v), x = Math.ceil(h * w), j = Math.ceil(p * v), V = Math.ceil(b * w);
      k >= j ? S = l : _ = true, x >= V ? E = h : C = true;
      const N = this.getSizeAndScale(S, this.ctx.canvas.width, v), J = this.getSizeAndScale(E, this.ctx.canvas.height, w), M = t.cachedCanvases.getCanvas("pattern", N.size, J.size), I = M.context, z = o.createCanvasGraphics(I, e);
      if (z.groupLevel = t.groupLevel, this.setFillAndStrokeStyleToContext(z, n, a), I.translate(-N.scale * c, -J.scale * u), z.transform(0, N.scale, 0, 0, J.scale, 0, 0), I.save(), (_a29 = z.dependencyTracker) == null ? void 0 : _a29.save(), this.clipBbox(z, c, u, f, g), z.baseTransform = Y(z.ctx), z.executeOperatorList(i), z.endDrawing(), (_b7 = z.dependencyTracker) == null ? void 0 : _b7.restore(), I.restore(), _ || C) {
        const pt = M.canvas;
        _ && (S = l), C && (E = h);
        const kt = this.getSizeAndScale(S, this.ctx.canvas.width, v), Z = this.getSizeAndScale(E, this.ctx.canvas.height, w), W = kt.size, X = Z.size, It = t.cachedCanvases.getCanvas("pattern-workaround", W, X), Jt = It.context, Et = _ ? Math.floor(p / l) : 0, tt = C ? Math.floor(b / h) : 0;
        for (let Zt = 0; Zt <= Et; Zt++) for (let te = 0; te <= tt; te++) Jt.drawImage(pt, W * Zt, X * te, W, X, 0, 0, W, X);
        return {
          canvas: It.canvas,
          scaleX: kt.scale,
          scaleY: Z.scale,
          offsetX: c,
          offsetY: u
        };
      }
      return {
        canvas: M.canvas,
        scaleX: N.scale,
        scaleY: J.scale,
        offsetX: c,
        offsetY: u
      };
    }
    getSizeAndScale(t, e, s) {
      const i = Math.max(_Ts.MAX_PATTERN_SIZE, e);
      let n = Math.ceil(t * s);
      return n >= i ? n = i : s = n / t, {
        scale: s,
        size: n
      };
    }
    clipBbox(t, e, s, i, n) {
      const r = i - e, a = n - s;
      t.ctx.rect(e, s, r, a), T.axialAlignedBoundingBox([
        e,
        s,
        i,
        n
      ], Y(t.ctx), t.current.minMax), t.clip(), t.endPath();
    }
    setFillAndStrokeStyleToContext(t, e, s) {
      const i = t.ctx, n = t.current;
      switch (e) {
        case Ks.COLORED:
          const { fillStyle: r, strokeStyle: a } = this.ctx;
          i.fillStyle = n.fillColor = r, i.strokeStyle = n.strokeColor = a;
          break;
        case Ks.UNCOLORED:
          i.fillStyle = i.strokeStyle = s, n.fillColor = n.strokeColor = s;
          break;
        default:
          throw new Ki(`Unsupported paint type: ${e}`);
      }
    }
    isModifyingCurrentTransform() {
      return false;
    }
    getPattern(t, e, s, i, n) {
      let r = s;
      i !== ct.SHADING && (r = T.transform(r, e.baseTransform), this.matrix && (r = T.transform(r, this.matrix)));
      const a = this.createPatternCanvas(e, n);
      let o = new DOMMatrix(r);
      o = o.translate(a.offsetX, a.offsetY), o = o.scale(1 / a.scaleX, 1 / a.scaleY);
      const l = t.createPattern(a.canvas, "repeat");
      return l.setTransform(o), l;
    }
  };
  __publicField(_Ts, "MAX_PATTERN_SIZE", 3e3);
  let Ts = _Ts;
  function Hn({ src: d, srcPos: t = 0, dest: e, width: s, height: i, nonBlackColor: n = 4294967295, inverseDecode: r = false }) {
    const a = nt.isLittleEndian ? 4278190080 : 255, [o, l] = r ? [
      n,
      a
    ] : [
      a,
      n
    ], h = s >> 3, c = s & 7, u = o ^ l, f = d.length;
    e = new Uint32Array(e.buffer);
    let g = 0;
    for (let p = 0; p < i; ++p) {
      for (const m = t + h; t < m; ++t, g += 8) {
        const A = d[t];
        e[g] = o ^ -(A >> 7 & 1) & u, e[g + 1] = o ^ -(A >> 6 & 1) & u, e[g + 2] = o ^ -(A >> 5 & 1) & u, e[g + 3] = o ^ -(A >> 4 & 1) & u, e[g + 4] = o ^ -(A >> 3 & 1) & u, e[g + 5] = o ^ -(A >> 2 & 1) & u, e[g + 6] = o ^ -(A >> 1 & 1) & u, e[g + 7] = o ^ -(A & 1) & u;
      }
      if (c === 0) continue;
      const b = t < f ? d[t++] : 255;
      for (let m = 0; m < c; ++m, ++g) e[g] = o ^ -(b >> 7 - m & 1) & u;
    }
    return {
      srcPos: t,
      destPos: g
    };
  }
  const Qs = 16, Js = 100, $n = 15, Zs = 10, ft = 16, ts = new DOMMatrix(), bt = new Float32Array(2), Wt = new Float32Array([
    1 / 0,
    1 / 0,
    -1 / 0,
    -1 / 0
  ]);
  function jn(d, t) {
    if (d._removeMirroring) throw new Error("Context is already forwarding operations.");
    d.__originalSave = d.save, d.__originalRestore = d.restore, d.__originalRotate = d.rotate, d.__originalScale = d.scale, d.__originalTranslate = d.translate, d.__originalTransform = d.transform, d.__originalSetTransform = d.setTransform, d.__originalResetTransform = d.resetTransform, d.__originalClip = d.clip, d.__originalMoveTo = d.moveTo, d.__originalLineTo = d.lineTo, d.__originalBezierCurveTo = d.bezierCurveTo, d.__originalRect = d.rect, d.__originalClosePath = d.closePath, d.__originalBeginPath = d.beginPath, d._removeMirroring = () => {
      d.save = d.__originalSave, d.restore = d.__originalRestore, d.rotate = d.__originalRotate, d.scale = d.__originalScale, d.translate = d.__originalTranslate, d.transform = d.__originalTransform, d.setTransform = d.__originalSetTransform, d.resetTransform = d.__originalResetTransform, d.clip = d.__originalClip, d.moveTo = d.__originalMoveTo, d.lineTo = d.__originalLineTo, d.bezierCurveTo = d.__originalBezierCurveTo, d.rect = d.__originalRect, d.closePath = d.__originalClosePath, d.beginPath = d.__originalBeginPath, delete d._removeMirroring;
    }, d.save = function() {
      t.save(), this.__originalSave();
    }, d.restore = function() {
      t.restore(), this.__originalRestore();
    }, d.translate = function(e, s) {
      t.translate(e, s), this.__originalTranslate(e, s);
    }, d.scale = function(e, s) {
      t.scale(e, s), this.__originalScale(e, s);
    }, d.transform = function(e, s, i, n, r, a) {
      t.transform(e, s, i, n, r, a), this.__originalTransform(e, s, i, n, r, a);
    }, d.setTransform = function(e, s, i, n, r, a) {
      t.setTransform(e, s, i, n, r, a), this.__originalSetTransform(e, s, i, n, r, a);
    }, d.resetTransform = function() {
      t.resetTransform(), this.__originalResetTransform();
    }, d.rotate = function(e) {
      t.rotate(e), this.__originalRotate(e);
    }, d.clip = function(e) {
      t.clip(e), this.__originalClip(e);
    }, d.moveTo = function(e, s) {
      t.moveTo(e, s), this.__originalMoveTo(e, s);
    }, d.lineTo = function(e, s) {
      t.lineTo(e, s), this.__originalLineTo(e, s);
    }, d.bezierCurveTo = function(e, s, i, n, r, a) {
      t.bezierCurveTo(e, s, i, n, r, a), this.__originalBezierCurveTo(e, s, i, n, r, a);
    }, d.rect = function(e, s, i, n) {
      t.rect(e, s, i, n), this.__originalRect(e, s, i, n);
    }, d.closePath = function() {
      t.closePath(), this.__originalClosePath();
    }, d.beginPath = function() {
      t.beginPath(), this.__originalBeginPath();
    };
  }
  class zn {
    constructor(t) {
      this.canvasFactory = t, this.cache = /* @__PURE__ */ Object.create(null);
    }
    getCanvas(t, e, s) {
      let i;
      return this.cache[t] !== void 0 ? (i = this.cache[t], this.canvasFactory.reset(i, e, s)) : (i = this.canvasFactory.create(e, s), this.cache[t] = i), i;
    }
    delete(t) {
      delete this.cache[t];
    }
    clear() {
      for (const t in this.cache) {
        const e = this.cache[t];
        this.canvasFactory.destroy(e), delete this.cache[t];
      }
    }
  }
  function Ce(d, t, e, s, i, n, r, a, o, l) {
    const [h, c, u, f, g, p] = Y(d);
    if (c === 0 && u === 0) {
      const A = r * h + g, y = Math.round(A), v = a * f + p, w = Math.round(v), S = (r + o) * h + g, E = Math.abs(Math.round(S) - y) || 1, _ = (a + l) * f + p, C = Math.abs(Math.round(_) - w) || 1;
      return d.setTransform(Math.sign(h), 0, 0, Math.sign(f), y, w), d.drawImage(t, e, s, i, n, 0, 0, E, C), d.setTransform(h, c, u, f, g, p), [
        E,
        C
      ];
    }
    if (h === 0 && f === 0) {
      const A = a * u + g, y = Math.round(A), v = r * c + p, w = Math.round(v), S = (a + l) * u + g, E = Math.abs(Math.round(S) - y) || 1, _ = (r + o) * c + p, C = Math.abs(Math.round(_) - w) || 1;
      return d.setTransform(0, Math.sign(c), Math.sign(u), 0, y, w), d.drawImage(t, e, s, i, n, 0, 0, C, E), d.setTransform(h, c, u, f, g, p), [
        C,
        E
      ];
    }
    d.drawImage(t, e, s, i, n, r, a, o, l);
    const b = Math.hypot(h, c), m = Math.hypot(u, f);
    return [
      b * o,
      m * l
    ];
  }
  class ti {
    constructor(t, e, s) {
      __publicField(this, "alphaIsShape", false);
      __publicField(this, "fontSize", 0);
      __publicField(this, "fontSizeScale", 1);
      __publicField(this, "textMatrix", null);
      __publicField(this, "textMatrixScale", 1);
      __publicField(this, "fontMatrix", is);
      __publicField(this, "leading", 0);
      __publicField(this, "x", 0);
      __publicField(this, "y", 0);
      __publicField(this, "lineX", 0);
      __publicField(this, "lineY", 0);
      __publicField(this, "charSpacing", 0);
      __publicField(this, "wordSpacing", 0);
      __publicField(this, "textHScale", 1);
      __publicField(this, "textRenderingMode", it.FILL);
      __publicField(this, "textRise", 0);
      __publicField(this, "fillColor", "#000000");
      __publicField(this, "strokeColor", "#000000");
      __publicField(this, "patternFill", false);
      __publicField(this, "patternStroke", false);
      __publicField(this, "fillAlpha", 1);
      __publicField(this, "strokeAlpha", 1);
      __publicField(this, "lineWidth", 1);
      __publicField(this, "activeSMask", null);
      __publicField(this, "transferMaps", "none");
      s == null ? void 0 : s(this), this.clipBox = new Float32Array([
        0,
        0,
        t,
        e
      ]), this.minMax = Wt.slice();
    }
    clone() {
      const t = Object.create(this);
      return t.clipBox = this.clipBox.slice(), t.minMax = this.minMax.slice(), t;
    }
    getPathBoundingBox(t = ct.FILL, e = null) {
      const s = this.minMax.slice();
      if (t === ct.STROKE) {
        e || $("Stroke bounding box must include transform."), T.singularValueDecompose2dScale(e, bt);
        const i = bt[0] * this.lineWidth / 2, n = bt[1] * this.lineWidth / 2;
        s[0] -= i, s[1] -= n, s[2] += i, s[3] += n;
      }
      return s;
    }
    updateClipFromPath() {
      const t = T.intersect(this.clipBox, this.getPathBoundingBox());
      this.startNewPathAndClipBox(t || [
        0,
        0,
        0,
        0
      ]);
    }
    isEmptyClip() {
      return this.minMax[0] === 1 / 0;
    }
    startNewPathAndClipBox(t) {
      this.clipBox.set(t, 0), this.minMax.set(Wt, 0);
    }
    getClippedPathBoundingBox(t = ct.FILL, e = null) {
      return T.intersect(this.clipBox, this.getPathBoundingBox(t, e));
    }
  }
  function ei(d, t) {
    if (t instanceof ImageData) {
      d.putImageData(t, 0, 0);
      return;
    }
    const e = t.height, s = t.width, i = e % ft, n = (e - i) / ft, r = i === 0 ? n : n + 1, a = d.createImageData(s, ft);
    let o = 0, l;
    const h = t.data, c = a.data;
    let u, f, g, p;
    if (t.kind === ke.GRAYSCALE_1BPP) {
      const b = h.byteLength, m = new Uint32Array(c.buffer, 0, c.byteLength >> 2), A = m.length, y = s + 7 >> 3, v = 4294967295, w = nt.isLittleEndian ? 4278190080 : 255;
      for (u = 0; u < r; u++) {
        for (g = u < n ? ft : i, l = 0, f = 0; f < g; f++) {
          const S = b - o;
          let E = 0;
          const _ = S > y ? s : S * 8 - 7, C = _ & -8;
          let k = 0, x = 0;
          for (; E < C; E += 8) x = h[o++], m[l++] = x & 128 ? v : w, m[l++] = x & 64 ? v : w, m[l++] = x & 32 ? v : w, m[l++] = x & 16 ? v : w, m[l++] = x & 8 ? v : w, m[l++] = x & 4 ? v : w, m[l++] = x & 2 ? v : w, m[l++] = x & 1 ? v : w;
          for (; E < _; E++) k === 0 && (x = h[o++], k = 128), m[l++] = x & k ? v : w, k >>= 1;
        }
        for (; l < A; ) m[l++] = 0;
        d.putImageData(a, 0, u * ft);
      }
    } else if (t.kind === ke.RGBA_32BPP) {
      for (f = 0, p = s * ft * 4, u = 0; u < n; u++) c.set(h.subarray(o, o + p)), o += p, d.putImageData(a, 0, f), f += ft;
      u < r && (p = s * i * 4, c.set(h.subarray(o, o + p)), d.putImageData(a, 0, f));
    } else if (t.kind === ke.RGB_24BPP) for (g = ft, p = s * g, u = 0; u < r; u++) {
      for (u >= n && (g = i, p = s * g), l = 0, f = p; f--; ) c[l++] = h[o++], c[l++] = h[o++], c[l++] = h[o++], c[l++] = 255;
      d.putImageData(a, 0, u * ft);
    }
    else throw new Error(`bad image kind: ${t.kind}`);
  }
  function si(d, t) {
    if (t.bitmap) {
      d.drawImage(t.bitmap, 0, 0);
      return;
    }
    const e = t.height, s = t.width, i = e % ft, n = (e - i) / ft, r = i === 0 ? n : n + 1, a = d.createImageData(s, ft);
    let o = 0;
    const l = t.data, h = a.data;
    for (let c = 0; c < r; c++) {
      const u = c < n ? ft : i;
      ({ srcPos: o } = Hn({
        src: l,
        srcPos: o,
        dest: h,
        width: s,
        height: u,
        nonBlackColor: 0
      })), d.putImageData(a, 0, c * ft);
    }
  }
  function se(d, t) {
    const e = [
      "strokeStyle",
      "fillStyle",
      "fillRule",
      "globalAlpha",
      "lineWidth",
      "lineCap",
      "lineJoin",
      "miterLimit",
      "globalCompositeOperation",
      "font",
      "filter"
    ];
    for (const s of e) d[s] !== void 0 && (t[s] = d[s]);
    d.setLineDash !== void 0 && (t.setLineDash(d.getLineDash()), t.lineDashOffset = d.lineDashOffset);
  }
  function Te(d) {
    d.strokeStyle = d.fillStyle = "#000000", d.fillRule = "nonzero", d.globalAlpha = 1, d.lineWidth = 1, d.lineCap = "butt", d.lineJoin = "miter", d.miterLimit = 10, d.globalCompositeOperation = "source-over", d.font = "10px sans-serif", d.setLineDash !== void 0 && (d.setLineDash([]), d.lineDashOffset = 0);
    const { filter: t } = d;
    t !== "none" && t !== "" && (d.filter = "none");
  }
  function ii(d, t) {
    if (t) return true;
    T.singularValueDecompose2dScale(d, bt);
    const e = Math.fround(Pt.pixelRatio * Qt.PDF_TO_CSS_UNITS);
    return bt[0] <= e && bt[1] <= e;
  }
  const Gn = [
    "butt",
    "round",
    "square"
  ], Vn = [
    "miter",
    "round",
    "bevel"
  ], Wn = {}, ni = {};
  const _Kt = class _Kt {
    constructor(t, e, s, i, n, { optionalContentConfig: r, markedContentStack: a = null }, o, l, h) {
      __privateAdd(this, _Kt_instances);
      this.ctx = t, this.current = new ti(this.ctx.canvas.width, this.ctx.canvas.height), this.stateStack = [], this.pendingClip = null, this.pendingEOFill = false, this.commonObjs = e, this.objs = s, this.canvasFactory = i, this.filterFactory = n, this.groupStack = [], this.baseTransform = null, this.baseTransformStack = [], this.groupLevel = 0, this.smaskStack = [], this.smaskCounter = 0, this.tempSMask = null, this.suspendedCtx = null, this.contentVisible = true, this.markedContentStack = a || [], this.optionalContentConfig = r, this.cachedCanvases = new zn(this.canvasFactory), this.cachedPatterns = /* @__PURE__ */ new Map(), this.annotationCanvasMap = o, this.viewportScale = 1, this.outputScaleX = 1, this.outputScaleY = 1, this.pageColors = l, this._cachedScaleForStroking = [
        -1,
        0
      ], this._cachedGetSinglePixelWidth = null, this._cachedBitmapsMap = /* @__PURE__ */ new Map(), this.dependencyTracker = h ?? null;
    }
    getObject(t, e, s = null) {
      var _a29;
      return typeof e == "string" ? ((_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordNamedDependency(t, e), e.startsWith("g_") ? this.commonObjs.get(e) : this.objs.get(e)) : s;
    }
    beginDrawing({ transform: t, viewport: e, transparency: s = false, background: i = null }) {
      const n = this.ctx.canvas.width, r = this.ctx.canvas.height, a = this.ctx.fillStyle;
      if (this.ctx.fillStyle = i || "#ffffff", this.ctx.fillRect(0, 0, n, r), this.ctx.fillStyle = a, s) {
        const o = this.cachedCanvases.getCanvas("transparent", n, r);
        this.compositeCtx = this.ctx, this.transparentCanvas = o.canvas, this.ctx = o.context, this.ctx.save(), this.ctx.transform(...Y(this.compositeCtx));
      }
      this.ctx.save(), Te(this.ctx), t && (this.ctx.transform(...t), this.outputScaleX = t[0], this.outputScaleY = t[0]), this.ctx.transform(...e.transform), this.viewportScale = e.scale, this.baseTransform = Y(this.ctx);
    }
    executeOperatorList(t, e, s, i, n) {
      var _a29;
      const r = t.argsArray, a = t.fnArray;
      let o = e || 0;
      const l = r.length;
      if (l === o) return o;
      const h = l - o > Zs && typeof s == "function", c = h ? Date.now() + $n : 0;
      let u = 0;
      const f = this.commonObjs, g = this.objs;
      let p, b;
      for (; ; ) {
        if (i !== void 0 && o === i.nextBreakPoint) return i.breakIt(o, s), o;
        if (!n || n(o)) if (p = a[o], b = r[o] ?? null, p !== de.dependency) b === null ? this[p](o) : this[p](o, ...b);
        else for (const m of b) {
          (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordNamedData(m, o);
          const A = m.startsWith("g_") ? f : g;
          if (!A.has(m)) return A.get(m, s), o;
        }
        if (o++, o === l) return o;
        if (h && ++u > Zs) {
          if (Date.now() > c) return s(), o;
          u = 0;
        }
      }
    }
    endDrawing() {
      __privateMethod(this, _Kt_instances, t_fn3).call(this), this.cachedCanvases.clear(), this.cachedPatterns.clear();
      for (const t of this._cachedBitmapsMap.values()) {
        for (const e of t.values()) typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement && (e.width = e.height = 0);
        t.clear();
      }
      this._cachedBitmapsMap.clear(), __privateMethod(this, _Kt_instances, e_fn3).call(this);
    }
    _scaleImage(t, e) {
      const s = t.width ?? t.displayWidth, i = t.height ?? t.displayHeight;
      let n = Math.max(Math.hypot(e[0], e[1]), 1), r = Math.max(Math.hypot(e[2], e[3]), 1), a = s, o = i, l = "prescale1", h, c;
      for (; n > 2 && a > 1 || r > 2 && o > 1; ) {
        let u = a, f = o;
        n > 2 && a > 1 && (u = a >= 16384 ? Math.floor(a / 2) - 1 || 1 : Math.ceil(a / 2), n /= a / u), r > 2 && o > 1 && (f = o >= 16384 ? Math.floor(o / 2) - 1 || 1 : Math.ceil(o) / 2, r /= o / f), h = this.cachedCanvases.getCanvas(l, u, f), c = h.context, c.clearRect(0, 0, u, f), c.drawImage(t, 0, 0, a, o, 0, 0, u, f), t = h.canvas, a = u, o = f, l = l === "prescale1" ? "prescale2" : "prescale1";
      }
      return {
        img: t,
        paintWidth: a,
        paintHeight: o
      };
    }
    _createMaskCanvas(t, e) {
      var _a29, _b7;
      const s = this.ctx, { width: i, height: n } = e, r = this.current.fillColor, a = this.current.patternFill, o = Y(s);
      let l, h, c, u;
      if ((e.bitmap || e.data) && e.count > 1) {
        const k = e.bitmap || e.data.buffer;
        h = JSON.stringify(a ? o : [
          o.slice(0, 4),
          r
        ]), l = this._cachedBitmapsMap.getOrInsertComputed(k, ys);
        const x = l.get(h);
        if (x && !a) {
          const j = Math.round(Math.min(o[0], o[2]) + o[4]), V = Math.round(Math.min(o[1], o[3]) + o[5]);
          return (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordDependencies(t, wt.transformAndFill), {
            canvas: x,
            offsetX: j,
            offsetY: V
          };
        }
        c = x;
      }
      c || (u = this.cachedCanvases.getCanvas("maskCanvas", i, n), si(u.context, e));
      let f = T.transform(o, [
        1 / i,
        0,
        0,
        -1 / n,
        0,
        0
      ]);
      f = T.transform(f, [
        1,
        0,
        0,
        1,
        0,
        -n
      ]);
      const g = Wt.slice();
      T.axialAlignedBoundingBox([
        0,
        0,
        i,
        n
      ], f, g);
      const [p, b, m, A] = g, y = Math.round(m - p) || 1, v = Math.round(A - b) || 1, w = this.cachedCanvases.getCanvas("fillCanvas", y, v), S = w.context, E = p, _ = b;
      S.translate(-E, -_), S.transform(...f), c || (c = this._scaleImage(u.canvas, _t(S)), c = c.img, l && a && l.set(h, c)), S.imageSmoothingEnabled = ii(Y(S), e.interpolate), Ce(S, c, 0, 0, c.width, c.height, 0, 0, i, n), S.globalCompositeOperation = "source-in";
      const C = T.transform(_t(S), [
        1,
        0,
        0,
        1,
        -E,
        -_
      ]);
      return S.fillStyle = a ? r.getPattern(s, this, C, ct.FILL, t) : r, S.fillRect(0, 0, i, n), l && !a && (this.cachedCanvases.delete("fillCanvas"), l.set(h, w.canvas)), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordDependencies(t, wt.transformAndFill), {
        canvas: w.canvas,
        offsetX: Math.round(E),
        offsetY: Math.round(_)
      };
    }
    setLineWidth(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("lineWidth", t), e !== this.current.lineWidth && (this._cachedScaleForStroking[0] = -1), this.current.lineWidth = e, this.ctx.lineWidth = e;
    }
    setLineCap(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("lineCap", t), this.ctx.lineCap = Gn[e];
    }
    setLineJoin(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("lineJoin", t), this.ctx.lineJoin = Vn[e];
    }
    setMiterLimit(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("miterLimit", t), this.ctx.miterLimit = e;
    }
    setDash(t, e, s) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("dash", t);
      const i = this.ctx;
      i.setLineDash !== void 0 && (i.setLineDash(e), i.lineDashOffset = s);
    }
    setRenderingIntent(t, e) {
    }
    setFlatness(t, e) {
    }
    setGState(t, e) {
      var _a29, _b7, _c10, _d12, _e54;
      for (const [s, i] of e) switch (s) {
        case "LW":
          this.setLineWidth(t, i);
          break;
        case "LC":
          this.setLineCap(t, i);
          break;
        case "LJ":
          this.setLineJoin(t, i);
          break;
        case "ML":
          this.setMiterLimit(t, i);
          break;
        case "D":
          this.setDash(t, i[0], i[1]);
          break;
        case "RI":
          this.setRenderingIntent(t, i);
          break;
        case "FL":
          this.setFlatness(t, i);
          break;
        case "Font":
          this.setFont(t, i[0], i[1]);
          break;
        case "CA":
          (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("strokeAlpha", t), this.current.strokeAlpha = i;
          break;
        case "ca":
          (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordSimpleData("fillAlpha", t), this.ctx.globalAlpha = this.current.fillAlpha = i;
          break;
        case "BM":
          (_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordSimpleData("globalCompositeOperation", t), this.ctx.globalCompositeOperation = i;
          break;
        case "SMask":
          (_d12 = this.dependencyTracker) == null ? void 0 : _d12.recordSimpleData("SMask", t), this.current.activeSMask = i ? this.tempSMask : null, this.tempSMask = null, this.checkSMaskState();
          break;
        case "TR":
          (_e54 = this.dependencyTracker) == null ? void 0 : _e54.recordSimpleData("filter", t), this.ctx.filter = this.current.transferMaps = this.filterFactory.addFilter(i);
          break;
      }
    }
    get inSMaskMode() {
      return !!this.suspendedCtx;
    }
    checkSMaskState() {
      const t = this.inSMaskMode;
      this.current.activeSMask && !t ? this.beginSMaskMode() : !this.current.activeSMask && t && this.endSMaskMode();
    }
    beginSMaskMode(t) {
      if (this.inSMaskMode) throw new Error("beginSMaskMode called while already in smask mode");
      const e = this.ctx.canvas.width, s = this.ctx.canvas.height, i = "smaskGroupAt" + this.groupLevel, n = this.cachedCanvases.getCanvas(i, e, s);
      this.suspendedCtx = this.ctx;
      const r = this.ctx = n.context;
      r.setTransform(this.suspendedCtx.getTransform()), se(this.suspendedCtx, r), jn(r, this.suspendedCtx), this.setGState(t, [
        [
          "BM",
          "source-over"
        ]
      ]);
    }
    endSMaskMode() {
      if (!this.inSMaskMode) throw new Error("endSMaskMode called while not in smask mode");
      this.ctx._removeMirroring(), se(this.ctx, this.suspendedCtx), this.ctx = this.suspendedCtx, this.suspendedCtx = null;
    }
    compose(t) {
      if (!this.current.activeSMask) return;
      t ? (t[0] = Math.floor(t[0]), t[1] = Math.floor(t[1]), t[2] = Math.ceil(t[2]), t[3] = Math.ceil(t[3])) : t = [
        0,
        0,
        this.ctx.canvas.width,
        this.ctx.canvas.height
      ];
      const e = this.current.activeSMask, s = this.suspendedCtx;
      this.composeSMask(s, e, this.ctx, t), this.ctx.save(), this.ctx.setTransform(1, 0, 0, 1, 0, 0), this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height), this.ctx.restore();
    }
    composeSMask(t, e, s, i) {
      const n = i[0], r = i[1], a = i[2] - n, o = i[3] - r;
      a === 0 || o === 0 || (this.genericComposeSMask(e.context, s, a, o, e.subtype, e.backdrop, e.transferMap, n, r, e.offsetX, e.offsetY), t.save(), t.globalAlpha = 1, t.globalCompositeOperation = "source-over", t.setTransform(1, 0, 0, 1, 0, 0), t.drawImage(s.canvas, 0, 0), t.restore());
    }
    genericComposeSMask(t, e, s, i, n, r, a, o, l, h, c) {
      let u = t.canvas, f = o - h, g = l - c;
      if (r) if (f < 0 || g < 0 || f + s > u.width || g + i > u.height) {
        const b = this.cachedCanvases.getCanvas("maskExtension", s, i), m = b.context;
        m.drawImage(u, -f, -g), m.globalCompositeOperation = "destination-atop", m.fillStyle = r, m.fillRect(0, 0, s, i), m.globalCompositeOperation = "source-over", u = b.canvas, f = g = 0;
      } else {
        t.save(), t.globalAlpha = 1, t.setTransform(1, 0, 0, 1, 0, 0);
        const b = new Path2D();
        b.rect(f, g, s, i), t.clip(b), t.globalCompositeOperation = "destination-atop", t.fillStyle = r, t.fillRect(f, g, s, i), t.restore();
      }
      e.save(), e.globalAlpha = 1, e.setTransform(1, 0, 0, 1, 0, 0), n === "Alpha" && a ? e.filter = this.filterFactory.addAlphaFilter(a) : n === "Luminosity" && (e.filter = this.filterFactory.addLuminosityFilter(a));
      const p = new Path2D();
      p.rect(o, l, s, i), e.clip(p), e.globalCompositeOperation = "destination-in", e.drawImage(u, f, g, s, i, o, l, s, i), e.restore();
    }
    save(t) {
      var _a29;
      this.inSMaskMode && se(this.ctx, this.suspendedCtx), this.ctx.save();
      const e = this.current;
      this.stateStack.push(e), this.current = e.clone(), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.save(t);
    }
    restore(t) {
      var _a29;
      if ((_a29 = this.dependencyTracker) == null ? void 0 : _a29.restore(t), this.stateStack.length === 0) {
        this.inSMaskMode && this.endSMaskMode();
        return;
      }
      this.current = this.stateStack.pop(), this.ctx.restore(), this.inSMaskMode && se(this.suspendedCtx, this.ctx), this.checkSMaskState(), this.pendingClip = null, this._cachedScaleForStroking[0] = -1, this._cachedGetSinglePixelWidth = null;
    }
    transform(t, e, s, i, n, r, a) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordIncrementalData("transform", t), this.ctx.transform(e, s, i, n, r, a), this._cachedScaleForStroking[0] = -1, this._cachedGetSinglePixelWidth = null;
    }
    constructPath(t, e, s, i) {
      let [n] = s;
      if (!i) {
        n || (n = s[0] = new Path2D()), this[e](t, n);
        return;
      }
      if (this.dependencyTracker !== null) {
        const r = e === de.stroke ? this.current.lineWidth / 2 : 0;
        this.dependencyTracker.resetBBox(t).recordBBox(t, this.ctx, i[0] - r, i[2] + r, i[1] - r, i[3] + r).recordDependencies(t, [
          "transform"
        ]);
      }
      n instanceof Path2D || (n = s[0] = bi(n)), T.axialAlignedBoundingBox(i, Y(this.ctx), this.current.minMax), this[e](t, n), this._pathStartIdx = t;
    }
    closePath(t) {
      this.ctx.closePath();
    }
    stroke(t, e, s = true) {
      var _a29;
      const i = this.ctx, n = this.current.strokeColor;
      if (i.globalAlpha = this.current.strokeAlpha, this.contentVisible) if (typeof n == "object" && (n == null ? void 0 : n.getPattern)) {
        const r = n.isModifyingCurrentTransform() ? i.getTransform() : null;
        if (i.save(), i.strokeStyle = n.getPattern(i, this, _t(i), ct.STROKE, t), r) {
          const a = new Path2D();
          a.addPath(e, i.getTransform().invertSelf().multiplySelf(r)), e = a;
        }
        this.rescaleAndStroke(e, false), i.restore();
      } else this.rescaleAndStroke(e, true);
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordDependencies(t, wt.stroke), s && this.consumePath(t, e, this.current.getClippedPathBoundingBox(ct.STROKE, Y(this.ctx))), i.globalAlpha = this.current.fillAlpha;
    }
    closeStroke(t, e) {
      this.stroke(t, e);
    }
    fill(t, e, s = true) {
      var _a29, _b7, _c10;
      const i = this.ctx, n = this.current.fillColor, r = this.current.patternFill;
      let a = false;
      if (r) {
        const l = n.isModifyingCurrentTransform() ? i.getTransform() : null;
        if ((_a29 = this.dependencyTracker) == null ? void 0 : _a29.save(t), i.save(), i.fillStyle = n.getPattern(i, this, _t(i), ct.FILL, t), l) {
          const h = new Path2D();
          h.addPath(e, i.getTransform().invertSelf().multiplySelf(l)), e = h;
        }
        a = true;
      }
      const o = this.current.getClippedPathBoundingBox();
      this.contentVisible && o !== null && (this.pendingEOFill ? (i.fill(e, "evenodd"), this.pendingEOFill = false) : i.fill(e)), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordDependencies(t, wt.fill), a && (i.restore(), (_c10 = this.dependencyTracker) == null ? void 0 : _c10.restore(t)), s && this.consumePath(t, e, o);
    }
    eoFill(t, e) {
      this.pendingEOFill = true, this.fill(t, e);
    }
    fillStroke(t, e) {
      this.fill(t, e, false), this.stroke(t, e, false), this.consumePath(t, e);
    }
    eoFillStroke(t, e) {
      this.pendingEOFill = true, this.fillStroke(t, e);
    }
    closeFillStroke(t, e) {
      this.fillStroke(t, e);
    }
    closeEOFillStroke(t, e) {
      this.pendingEOFill = true, this.fillStroke(t, e);
    }
    endPath(t, e) {
      this.consumePath(t, e);
    }
    rawFillPath(t, e) {
      var _a29;
      this.ctx.fill(e), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordDependencies(t, wt.rawFillPath).recordOperation(t);
    }
    clip(t) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordFutureForcedDependency("clipMode", t), this.pendingClip = Wn;
    }
    eoClip(t) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordFutureForcedDependency("clipMode", t), this.pendingClip = ni;
    }
    beginText(t) {
      var _a29;
      this.current.textMatrix = null, this.current.textMatrixScale = 1, this.current.x = this.current.lineX = 0, this.current.y = this.current.lineY = 0, (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordOpenMarker(t).resetIncrementalData("sameLineText").resetIncrementalData("moveText", t);
    }
    endText(t) {
      const e = this.pendingTextPaths, s = this.ctx;
      if (this.dependencyTracker) {
        const { dependencyTracker: i } = this;
        e !== void 0 && i.recordFutureForcedDependency("textClip", i.getOpenMarker()).recordFutureForcedDependency("textClip", t), i.recordCloseMarker(t);
      }
      if (e !== void 0) {
        const i = new Path2D(), n = s.getTransform().invertSelf();
        for (const { transform: r, x: a, y: o, fontSize: l, path: h } of e) h && i.addPath(h, new DOMMatrix(r).preMultiplySelf(n).translate(a, o).scale(l, -l));
        s.clip(i);
      }
      delete this.pendingTextPaths;
    }
    setCharSpacing(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("charSpacing", t), this.current.charSpacing = e;
    }
    setWordSpacing(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("wordSpacing", t), this.current.wordSpacing = e;
    }
    setHScale(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("hScale", t), this.current.textHScale = e / 100;
    }
    setLeading(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("leading", t), this.current.leading = -e;
    }
    setFont(t, e, s) {
      var _a29, _b7;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("font", t).recordSimpleDataFromNamed("fontObj", e, t);
      const i = this.commonObjs.get(e), n = this.current;
      if (!i) throw new Error(`Can't find font for ${e}`);
      if (n.fontMatrix = i.fontMatrix || is, (n.fontMatrix[0] === 0 || n.fontMatrix[3] === 0) && F("Invalid font matrix for font " + e), s < 0 ? (s = -s, n.fontDirection = -1) : n.fontDirection = 1, this.current.font = i, this.current.fontSize = s, i.isType3Font) return;
      const r = i.loadedName || "sans-serif", a = ((_b7 = i.systemFontInfo) == null ? void 0 : _b7.css) || `"${r}", ${i.fallbackName}`;
      let o = "normal";
      i.black ? o = "900" : i.bold && (o = "bold");
      const l = i.italic ? "italic" : "normal";
      let h = s;
      s < Qs ? h = Qs : s > Js && (h = Js), this.current.fontSizeScale = s / h, this.ctx.font = `${l} ${o} ${h}px ${a}`;
    }
    setTextRenderingMode(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("textRenderingMode", t), this.current.textRenderingMode = e;
    }
    setTextRise(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("textRise", t), this.current.textRise = e;
    }
    moveText(t, e, s) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetIncrementalData("sameLineText").recordIncrementalData("moveText", t), this.current.x = this.current.lineX += e, this.current.y = this.current.lineY += s;
    }
    setLeadingMoveText(t, e, s) {
      this.setLeading(t, -s), this.moveText(t, e, s);
    }
    setTextMatrix(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetIncrementalData("sameLineText").recordSimpleData("textMatrix", t);
      const { current: s } = this;
      s.textMatrix = e, s.textMatrixScale = Math.hypot(e[0], e[1]), s.x = s.lineX = 0, s.y = s.lineY = 0;
    }
    nextLine(t) {
      var _a29;
      this.moveText(t, 0, this.current.leading), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordIncrementalData("moveText", this.dependencyTracker.getSimpleIndex("leading") ?? t);
    }
    paintChar(t, e, s, i, n, r) {
      var _a29, _b7, _c10, _d12;
      const a = this.ctx, o = this.current, l = o.font, h = o.textRenderingMode, c = o.fontSize / o.fontSizeScale, u = h & it.FILL_STROKE_MASK, f = !!(h & it.ADD_TO_PATH_FLAG), g = o.patternFill && !l.missingFile, p = o.patternStroke && !l.missingFile;
      let b;
      if ((l.disableFontFace || f || g || p) && !l.missingFile && (b = l.getPathGenerator(this.commonObjs, e)), b && (l.disableFontFace || g || p)) {
        a.save(), a.translate(s, i), a.scale(c, -c), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordCharacterBBox(t, a, l);
        let m;
        if (u === it.FILL || u === it.FILL_STROKE) if (n) {
          m = a.getTransform(), a.setTransform(...n);
          const A = __privateMethod(this, _Kt_instances, i_fn2).call(this, b, m, n);
          a.fill(A);
        } else a.fill(b);
        if (u === it.STROKE || u === it.FILL_STROKE) if (r) {
          m || (m = a.getTransform()), a.setTransform(...r);
          const { a: A, b: y, c: v, d: w } = m, S = T.inverseTransform(r), E = T.transform([
            A,
            y,
            v,
            w,
            0,
            0
          ], S);
          T.singularValueDecompose2dScale(E, bt), a.lineWidth *= Math.max(bt[0], bt[1]) / c, a.stroke(__privateMethod(this, _Kt_instances, i_fn2).call(this, b, m, r));
        } else a.lineWidth /= c, a.stroke(b);
        a.restore();
      } else (u === it.FILL || u === it.FILL_STROKE) && (a.fillText(e, s, i), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordCharacterBBox(t, a, l, c, s, i, () => a.measureText(e))), (u === it.STROKE || u === it.FILL_STROKE) && (this.dependencyTracker && ((_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordCharacterBBox(t, a, l, c, s, i, () => a.measureText(e)).recordDependencies(t, wt.stroke)), a.strokeText(e, s, i));
      f && ((this.pendingTextPaths || (this.pendingTextPaths = [])).push({
        transform: Y(a),
        x: s,
        y: i,
        fontSize: c,
        path: b
      }), (_d12 = this.dependencyTracker) == null ? void 0 : _d12.recordCharacterBBox(t, a, l, c, s, i));
    }
    get isFontSubpixelAAEnabled() {
      const { context: t } = this.cachedCanvases.getCanvas("isFontSubpixelAAEnabled", 10, 10);
      t.scale(1.5, 1), t.fillText("I", 0, 10);
      const e = t.getImageData(0, 0, 10, 10).data;
      let s = false;
      for (let i = 3; i < e.length; i += 4) if (e[i] > 0 && e[i] < 255) {
        s = true;
        break;
      }
      return L(this, "isFontSubpixelAAEnabled", s);
    }
    showText(t, e) {
      var _a29, _b7, _c10, _d12;
      this.dependencyTracker && (this.dependencyTracker.recordDependencies(t, wt.showText).resetBBox(t), this.current.textRenderingMode & it.ADD_TO_PATH_FLAG && this.dependencyTracker.recordFutureForcedDependency("textClip", t).inheritPendingDependenciesAsFutureForcedDependencies());
      const s = this.current, i = s.font;
      if (i.isType3Font) {
        this.showType3Text(t, e), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordShowTextOperation(t);
        return;
      }
      const n = s.fontSize;
      if (n === 0) {
        (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordOperation(t);
        return;
      }
      const r = this.ctx, a = s.fontSizeScale, o = s.charSpacing, l = s.wordSpacing, h = s.fontDirection, c = s.textHScale * h, u = e.length, f = i.vertical, g = f ? 1 : -1, p = i.defaultVMetrics, b = n * s.fontMatrix[0], m = s.textRenderingMode === it.FILL && !i.disableFontFace && !s.patternFill;
      r.save(), s.textMatrix && r.transform(...s.textMatrix), r.translate(s.x, s.y + s.textRise), h > 0 ? r.scale(c, -1) : r.scale(c, 1);
      let A, y;
      const v = s.textRenderingMode & it.FILL_STROKE_MASK, w = v === it.FILL || v === it.FILL_STROKE, S = v === it.STROKE || v === it.FILL_STROKE;
      if (w && s.patternFill) {
        r.save();
        const x = s.fillColor.getPattern(r, this, _t(r), ct.FILL, t);
        A = Y(r), r.restore(), r.fillStyle = x;
      }
      if (S && s.patternStroke) {
        r.save();
        const x = s.strokeColor.getPattern(r, this, _t(r), ct.STROKE, t);
        y = Y(r), r.restore(), r.strokeStyle = x;
      }
      let E = s.lineWidth;
      const _ = s.textMatrixScale;
      if (_ === 0 || E === 0 ? S && (E = this.getSinglePixelWidth()) : E /= _, a !== 1 && (r.scale(a, a), E /= a), r.lineWidth = E, i.isInvalidPDFjsFont) {
        const x = [];
        let j = 0;
        for (const N of e) x.push(N.unicode), j += N.width;
        const V = x.join("");
        if (r.fillText(V, 0, 0), this.dependencyTracker !== null) {
          const N = r.measureText(V);
          this.dependencyTracker.recordBBox(t, this.ctx, -N.actualBoundingBoxLeft, N.actualBoundingBoxRight, -N.actualBoundingBoxAscent, N.actualBoundingBoxDescent).recordShowTextOperation(t);
        }
        s.x += j * b * c, r.restore(), this.compose();
        return;
      }
      let C = 0, k;
      for (k = 0; k < u; ++k) {
        const x = e[k];
        if (typeof x == "number") {
          C += g * x * n / 1e3;
          continue;
        }
        let j = false;
        const V = (x.isSpace ? l : 0) + o, N = x.fontChar, J = x.accent;
        let M, I, z = x.width;
        if (f) {
          const Z = x.vmetric || p, W = -(x.vmetric ? Z[1] : z * 0.5) * b, X = Z[2] * b;
          z = Z ? -Z[0] : z, M = W / a, I = (C + X) / a;
        } else M = C / a, I = 0;
        let pt;
        if (i.remeasure && z > 0) {
          pt = r.measureText(N);
          const Z = pt.width * 1e3 / n * a;
          if (z < Z && this.isFontSubpixelAAEnabled) {
            const W = z / Z;
            j = true, r.save(), r.scale(W, 1), M /= W;
          } else z !== Z && (M += (z - Z) / 2e3 * n / a);
        }
        if (this.contentVisible && (x.isInFont || i.missingFile)) {
          if (m && !J) r.fillText(N, M, I), (_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordCharacterBBox(t, r, pt ? {
            bbox: null
          } : i, n / a, M, I, () => pt ?? r.measureText(N));
          else if (this.paintChar(t, N, M, I, A, y), J) {
            const Z = M + n * J.offset.x / a, W = I - n * J.offset.y / a;
            this.paintChar(t, J.fontChar, Z, W, A, y);
          }
        }
        const kt = f ? z * b - V * h : z * b + V * h;
        C += kt, j && r.restore();
      }
      f ? s.y -= C : s.x += C * c, r.restore(), this.compose(), (_d12 = this.dependencyTracker) == null ? void 0 : _d12.recordShowTextOperation(t);
    }
    showType3Text(t, e) {
      const s = this.ctx, i = this.current, n = i.font, r = i.fontSize, a = i.fontDirection, o = n.vertical ? 1 : -1, l = i.charSpacing, h = i.wordSpacing, c = i.textHScale * a, u = i.fontMatrix || is, f = e.length, g = i.textRenderingMode === it.INVISIBLE;
      let p, b, m, A;
      if (g || r === 0) return;
      this._cachedScaleForStroking[0] = -1, this._cachedGetSinglePixelWidth = null, s.save(), i.textMatrix && s.transform(...i.textMatrix), s.translate(i.x, i.y + i.textRise), s.scale(c, a);
      const y = this.dependencyTracker;
      for (this.dependencyTracker = y ? new De(y, t) : null, p = 0; p < f; ++p) {
        if (b = e[p], typeof b == "number") {
          A = o * b * r / 1e3, this.ctx.translate(A, 0), i.x += A * c;
          continue;
        }
        const v = (b.isSpace ? h : 0) + l, w = n.charProcOperatorList[b.operatorListId];
        w ? this.contentVisible && (this.save(), s.scale(r, r), s.transform(...u), this.executeOperatorList(w), this.restore()) : F(`Type3 character "${b.operatorListId}" is not available.`);
        const S = [
          b.width,
          0
        ];
        T.applyTransform(S, u), m = S[0] * r + v, s.translate(m, 0), i.x += m * c;
      }
      s.restore(), y && (this.dependencyTracker = y);
    }
    setCharWidth(t, e, s) {
    }
    setCharWidthAndBounds(t, e, s, i, n, r, a) {
      var _a29;
      const o = new Path2D();
      o.rect(i, n, r - i, a - n), this.ctx.clip(o), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordBBox(t, this.ctx, i, r, n, a).recordClipBox(t, this.ctx, i, r, n, a), this.endPath(t);
    }
    getColorN_Pattern(t, e) {
      let s;
      if (e[0] === "TilingPattern") {
        const i = this.baseTransform || Y(this.ctx), n = {
          createCanvasGraphics: (r, a) => new _Kt(r, this.commonObjs, this.objs, this.canvasFactory, this.filterFactory, {
            optionalContentConfig: this.optionalContentConfig,
            markedContentStack: this.markedContentStack
          }, void 0, void 0, this.dependencyTracker ? new De(this.dependencyTracker, a, true) : null)
        };
        s = new Ts(e, this.ctx, n, i);
      } else s = this._getPattern(t, e[1], e[2]);
      return s;
    }
    setStrokeColorN(t, ...e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("strokeColor", t), this.current.strokeColor = this.getColorN_Pattern(t, e), this.current.patternStroke = true;
    }
    setFillColorN(t, ...e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("fillColor", t), this.current.fillColor = this.getColorN_Pattern(t, e), this.current.patternFill = true;
    }
    setStrokeRGBColor(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("strokeColor", t), this.ctx.strokeStyle = this.current.strokeColor = e, this.current.patternStroke = false;
    }
    setStrokeTransparent(t) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("strokeColor", t), this.ctx.strokeStyle = this.current.strokeColor = "transparent", this.current.patternStroke = false;
    }
    setFillRGBColor(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("fillColor", t), this.ctx.fillStyle = this.current.fillColor = e, this.current.patternFill = false;
    }
    setFillTransparent(t) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordSimpleData("fillColor", t), this.ctx.fillStyle = this.current.fillColor = "transparent", this.current.patternFill = false;
    }
    _getPattern(t, e, s = null) {
      let i;
      return this.cachedPatterns.has(e) ? i = this.cachedPatterns.get(e) : (i = Un(this.getObject(t, e)), this.cachedPatterns.set(e, i)), s && (i.matrix = s), i;
    }
    shadingFill(t, e) {
      var _a29;
      if (!this.contentVisible) return;
      const s = this.ctx;
      this.save(t);
      const i = this._getPattern(t, e);
      s.fillStyle = i.getPattern(s, this, _t(s), ct.SHADING, t);
      const n = _t(s);
      if (n) {
        const { width: r, height: a } = s.canvas, o = Wt.slice();
        T.axialAlignedBoundingBox([
          0,
          0,
          r,
          a
        ], n, o);
        const [l, h, c, u] = o;
        this.ctx.fillRect(l, h, c - l, u - h);
      } else this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t).recordFullPageBBox(t).recordDependencies(t, wt.transform).recordDependencies(t, wt.fill).recordOperation(t), this.compose(this.current.getClippedPathBoundingBox()), this.restore(t);
    }
    beginInlineImage() {
      $("Should not call beginInlineImage");
    }
    beginImageData() {
      $("Should not call beginImageData");
    }
    paintFormXObjectBegin(t, e, s) {
      var _a29;
      if (this.contentVisible && (this.save(t), this.baseTransformStack.push(this.baseTransform), e && this.transform(t, ...e), this.baseTransform = Y(this.ctx), s)) {
        T.axialAlignedBoundingBox(s, this.baseTransform, this.current.minMax);
        const [i, n, r, a] = s, o = new Path2D();
        o.rect(i, n, r - i, a - n), this.ctx.clip(o), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.recordClipBox(t, this.ctx, i, r, n, a), this.endPath(t);
      }
    }
    paintFormXObjectEnd(t) {
      this.contentVisible && (this.restore(t), this.baseTransform = this.baseTransformStack.pop());
    }
    beginGroup(t, e) {
      var _a29;
      if (!this.contentVisible) return;
      this.save(t), this.inSMaskMode && (this.endSMaskMode(), this.current.activeSMask = null);
      const s = this.ctx;
      e.isolated || Fe("TODO: Support non-isolated groups."), e.knockout && F("Knockout groups not supported.");
      const i = Y(s);
      if (e.matrix && s.transform(...e.matrix), !e.bbox) throw new Error("Bounding box is required.");
      let n = Wt.slice();
      T.axialAlignedBoundingBox(e.bbox, Y(s), n);
      const r = [
        0,
        0,
        s.canvas.width,
        s.canvas.height
      ];
      n = T.intersect(n, r) || [
        0,
        0,
        0,
        0
      ];
      const a = Math.floor(n[0]), o = Math.floor(n[1]), l = Math.max(Math.ceil(n[2]) - a, 1), h = Math.max(Math.ceil(n[3]) - o, 1);
      this.current.startNewPathAndClipBox([
        0,
        0,
        l,
        h
      ]);
      let c = "groupAt" + this.groupLevel;
      e.smask && (c += "_smask_" + this.smaskCounter++ % 2);
      const u = this.cachedCanvases.getCanvas(c, l, h), f = u.context;
      f.translate(-a, -o), f.transform(...i);
      let g = new Path2D();
      const [p, b, m, A] = e.bbox;
      if (g.rect(p, b, m - p, A - b), e.matrix) {
        const y = new Path2D();
        y.addPath(g, new DOMMatrix(e.matrix)), g = y;
      }
      f.clip(g), e.smask && this.smaskStack.push({
        canvas: u.canvas,
        context: f,
        offsetX: a,
        offsetY: o,
        subtype: e.smask.subtype,
        backdrop: e.smask.backdrop,
        transferMap: e.smask.transferMap || null,
        startTransformInverse: null
      }), (!e.smask || this.dependencyTracker) && (s.setTransform(1, 0, 0, 1, 0, 0), s.translate(a, o), s.save()), se(s, f), this.ctx = f, (_a29 = this.dependencyTracker) == null ? void 0 : _a29.inheritSimpleDataAsFutureForcedDependencies([
        "fillAlpha",
        "strokeAlpha",
        "globalCompositeOperation"
      ]).pushBaseTransform(s), this.setGState(t, [
        [
          "BM",
          "source-over"
        ],
        [
          "ca",
          1
        ],
        [
          "CA",
          1
        ],
        [
          "TR",
          null
        ]
      ]), this.groupStack.push(s), this.groupLevel++;
    }
    endGroup(t, e) {
      var _a29;
      if (!this.contentVisible) return;
      this.groupLevel--;
      const s = this.ctx, i = this.groupStack.pop();
      if (this.ctx = i, this.ctx.imageSmoothingEnabled = false, (_a29 = this.dependencyTracker) == null ? void 0 : _a29.popBaseTransform(), e.smask) this.tempSMask = this.smaskStack.pop(), this.restore(t), this.dependencyTracker && this.ctx.restore();
      else {
        this.ctx.restore();
        const n = Y(this.ctx);
        this.restore(t), this.ctx.save(), this.ctx.setTransform(...n);
        const r = Wt.slice();
        T.axialAlignedBoundingBox([
          0,
          0,
          s.canvas.width,
          s.canvas.height
        ], n, r), this.ctx.drawImage(s.canvas, 0, 0), this.ctx.restore(), this.compose(r);
      }
    }
    beginAnnotation(t, e, s, i, n, r) {
      if (__privateMethod(this, _Kt_instances, t_fn3).call(this), Te(this.ctx), this.ctx.save(), this.save(t), this.baseTransform && this.ctx.setTransform(...this.baseTransform), s) {
        const a = s[2] - s[0], o = s[3] - s[1];
        if (r && this.annotationCanvasMap) {
          i = i.slice(), i[4] -= s[0], i[5] -= s[1], s = s.slice(), s[0] = s[1] = 0, s[2] = a, s[3] = o, T.singularValueDecompose2dScale(Y(this.ctx), bt);
          const { viewportScale: l } = this, h = Math.ceil(a * this.outputScaleX * l), c = Math.ceil(o * this.outputScaleY * l);
          this.annotationCanvas = this.canvasFactory.create(h, c);
          const { canvas: u, context: f } = this.annotationCanvas;
          this.annotationCanvasMap.set(e, u), this.annotationCanvas.savedCtx = this.ctx, this.ctx = f, this.ctx.save(), this.ctx.setTransform(bt[0], 0, 0, -bt[1], 0, o * bt[1]), Te(this.ctx);
        } else {
          Te(this.ctx), this.endPath(t);
          const l = new Path2D();
          l.rect(s[0], s[1], a, o), this.ctx.clip(l);
        }
      }
      this.current = new ti(this.ctx.canvas.width, this.ctx.canvas.height), this.transform(t, ...i), this.transform(t, ...n);
    }
    endAnnotation(t) {
      this.annotationCanvas && (this.ctx.restore(), __privateMethod(this, _Kt_instances, e_fn3).call(this), this.ctx = this.annotationCanvas.savedCtx, delete this.annotationCanvas.savedCtx, delete this.annotationCanvas);
    }
    paintImageMaskXObject(t, e) {
      var _a29;
      if (!this.contentVisible) return;
      const s = e.count;
      e = this.getObject(t, e.data, e), e.count = s;
      const i = this.ctx, n = this._createMaskCanvas(t, e), r = n.canvas;
      i.save(), i.setTransform(1, 0, 0, 1, 0, 0), i.drawImage(r, n.offsetX, n.offsetY), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t).recordBBox(t, this.ctx, n.offsetX, n.offsetX + r.width, n.offsetY, n.offsetY + r.height).recordOperation(t), i.restore(), this.compose();
    }
    paintImageMaskXObjectRepeat(t, e, s, i = 0, n = 0, r, a) {
      var _a29, _b7, _c10;
      if (!this.contentVisible) return;
      e = this.getObject(t, e.data, e);
      const o = this.ctx;
      o.save();
      const l = Y(o);
      o.transform(s, i, n, r, 0, 0);
      const h = this._createMaskCanvas(t, e);
      o.setTransform(1, 0, 0, 1, h.offsetX - l[4], h.offsetY - l[5]), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t);
      for (let c = 0, u = a.length; c < u; c += 2) {
        const f = T.transform(l, [
          s,
          i,
          n,
          r,
          a[c],
          a[c + 1]
        ]);
        o.drawImage(h.canvas, f[4], f[5]), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordBBox(t, this.ctx, f[4], f[4] + h.canvas.width, f[5], f[5] + h.canvas.height);
      }
      o.restore(), this.compose(), (_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordOperation(t);
    }
    paintImageMaskXObjectGroup(t, e) {
      var _a29, _b7, _c10;
      if (!this.contentVisible) return;
      const s = this.ctx, i = this.current.fillColor, n = this.current.patternFill;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t).recordDependencies(t, wt.transformAndFill);
      for (const r of e) {
        const { data: a, width: o, height: l, transform: h } = r, c = this.cachedCanvases.getCanvas("maskCanvas", o, l), u = c.context;
        u.save();
        const f = this.getObject(t, a, r);
        si(u, f), u.globalCompositeOperation = "source-in", u.fillStyle = n ? i.getPattern(u, this, _t(s), ct.FILL, t) : i, u.fillRect(0, 0, o, l), u.restore(), s.save(), s.transform(...h), s.scale(1, -1), Ce(s, c.canvas, 0, 0, o, l, 0, -1, 1, 1), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordBBox(t, s, 0, o, 0, l), s.restore();
      }
      this.compose(), (_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordOperation(t);
    }
    paintImageXObject(t, e) {
      if (!this.contentVisible) return;
      const s = this.getObject(t, e);
      if (!s) {
        F("Dependent image isn't ready yet");
        return;
      }
      this.paintInlineImageXObject(t, s);
    }
    paintImageXObjectRepeat(t, e, s, i, n) {
      if (!this.contentVisible) return;
      const r = this.getObject(t, e);
      if (!r) {
        F("Dependent image isn't ready yet");
        return;
      }
      const a = r.width, o = r.height, l = [];
      for (let h = 0, c = n.length; h < c; h += 2) l.push({
        transform: [
          s,
          0,
          0,
          i,
          n[h],
          n[h + 1]
        ],
        x: 0,
        y: 0,
        w: a,
        h: o
      });
      this.paintInlineImageXObjectGroup(t, r, l);
    }
    applyTransferMapsToCanvas(t) {
      return this.current.transferMaps !== "none" && (t.filter = this.current.transferMaps, t.drawImage(t.canvas, 0, 0), t.filter = "none"), t.canvas;
    }
    applyTransferMapsToBitmap(t) {
      if (this.current.transferMaps === "none") return t.bitmap;
      const { bitmap: e, width: s, height: i } = t, n = this.cachedCanvases.getCanvas("inlineImage", s, i), r = n.context;
      return r.filter = this.current.transferMaps, r.drawImage(e, 0, 0), r.filter = "none", n.canvas;
    }
    paintInlineImageXObject(t, e) {
      var _a29;
      if (!this.contentVisible) return;
      const s = e.width, i = e.height, n = this.ctx;
      this.save(t);
      const { filter: r } = n;
      r !== "none" && r !== "" && (n.filter = "none"), n.scale(1 / s, -1 / i);
      let a;
      if (e.bitmap) a = this.applyTransferMapsToBitmap(e);
      else if (typeof HTMLElement == "function" && e instanceof HTMLElement || !e.data) a = e;
      else {
        const h = this.cachedCanvases.getCanvas("inlineImage", s, i).context;
        ei(h, e), a = this.applyTransferMapsToCanvas(h);
      }
      const o = this._scaleImage(a, _t(n));
      n.imageSmoothingEnabled = ii(Y(n), e.interpolate), (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t).recordBBox(t, n, 0, s, -i, 0).recordDependencies(t, wt.imageXObject).recordOperation(t), Ce(n, o.img, 0, 0, o.paintWidth, o.paintHeight, 0, -i, s, i), this.compose(), this.restore(t);
    }
    paintInlineImageXObjectGroup(t, e, s) {
      var _a29, _b7, _c10;
      if (!this.contentVisible) return;
      const i = this.ctx;
      let n;
      if (e.bitmap) n = e.bitmap;
      else {
        const r = e.width, a = e.height, l = this.cachedCanvases.getCanvas("inlineImage", r, a).context;
        ei(l, e), n = this.applyTransferMapsToCanvas(l);
      }
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t);
      for (const r of s) i.save(), i.transform(...r.transform), i.scale(1, -1), Ce(i, n, r.x, r.y, r.w, r.h, 0, -1, 1, 1), (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordBBox(t, i, 0, 1, -1, 0), i.restore();
      (_c10 = this.dependencyTracker) == null ? void 0 : _c10.recordOperation(t), this.compose();
    }
    paintSolidColorImageMask(t) {
      var _a29;
      this.contentVisible && ((_a29 = this.dependencyTracker) == null ? void 0 : _a29.resetBBox(t).recordBBox(t, this.ctx, 0, 1, 0, 1).recordDependencies(t, wt.fill).recordOperation(t), this.ctx.fillRect(0, 0, 1, 1), this.compose());
    }
    markPoint(t, e) {
    }
    markPointProps(t, e, s) {
    }
    beginMarkedContent(t, e) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.beginMarkedContent(t), this.markedContentStack.push({
        visible: true
      });
    }
    beginMarkedContentProps(t, e, s) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.beginMarkedContent(t), e === "OC" ? this.markedContentStack.push({
        visible: this.optionalContentConfig.isVisible(s)
      }) : this.markedContentStack.push({
        visible: true
      }), this.contentVisible = this.isContentVisible();
    }
    endMarkedContent(t) {
      var _a29;
      (_a29 = this.dependencyTracker) == null ? void 0 : _a29.endMarkedContent(t), this.markedContentStack.pop(), this.contentVisible = this.isContentVisible();
    }
    beginCompat(t) {
    }
    endCompat(t) {
    }
    consumePath(t, e, s) {
      var _a29, _b7;
      const i = this.current.isEmptyClip();
      this.pendingClip && this.current.updateClipFromPath(), this.pendingClip || this.compose(s);
      const n = this.ctx;
      this.pendingClip ? (i || (this.pendingClip === ni ? n.clip(e, "evenodd") : n.clip(e)), this.pendingClip = null, (_a29 = this.dependencyTracker) == null ? void 0 : _a29.bboxToClipBoxDropOperation(t).recordFutureForcedDependency("clipPath", t)) : (_b7 = this.dependencyTracker) == null ? void 0 : _b7.recordOperation(t), this.current.startNewPathAndClipBox(this.current.clipBox);
    }
    getSinglePixelWidth() {
      if (!this._cachedGetSinglePixelWidth) {
        const t = Y(this.ctx);
        if (t[1] === 0 && t[2] === 0) this._cachedGetSinglePixelWidth = 1 / Math.min(Math.abs(t[0]), Math.abs(t[3]));
        else {
          const e = Math.abs(t[0] * t[3] - t[2] * t[1]), s = Math.hypot(t[0], t[2]), i = Math.hypot(t[1], t[3]);
          this._cachedGetSinglePixelWidth = Math.max(s, i) / e;
        }
      }
      return this._cachedGetSinglePixelWidth;
    }
    getScaleForStroking() {
      if (this._cachedScaleForStroking[0] === -1) {
        const { lineWidth: t } = this.current, { a: e, b: s, c: i, d: n } = this.ctx.getTransform();
        let r, a;
        if (s === 0 && i === 0) {
          const o = Math.abs(e), l = Math.abs(n);
          if (o === l) if (t === 0) r = a = 1 / o;
          else {
            const h = o * t;
            r = a = h < 1 ? 1 / h : 1;
          }
          else if (t === 0) r = 1 / o, a = 1 / l;
          else {
            const h = o * t, c = l * t;
            r = h < 1 ? 1 / h : 1, a = c < 1 ? 1 / c : 1;
          }
        } else {
          const o = Math.abs(e * n - s * i), l = Math.hypot(e, s), h = Math.hypot(i, n);
          if (t === 0) r = h / o, a = l / o;
          else {
            const c = t * o;
            r = h > c ? h / c : 1, a = l > c ? l / c : 1;
          }
        }
        this._cachedScaleForStroking[0] = r, this._cachedScaleForStroking[1] = a;
      }
      return this._cachedScaleForStroking;
    }
    rescaleAndStroke(t, e) {
      const { ctx: s, current: { lineWidth: i } } = this, [n, r] = this.getScaleForStroking();
      if (n === r) {
        s.lineWidth = (i || 1) * n, s.stroke(t);
        return;
      }
      const a = s.getLineDash();
      e && s.save(), s.scale(n, r), ts.a = 1 / n, ts.d = 1 / r;
      const o = new Path2D();
      if (o.addPath(t, ts), a.length > 0) {
        const l = Math.max(n, r);
        s.setLineDash(a.map((h) => h / l)), s.lineDashOffset /= l;
      }
      s.lineWidth = i || 1, s.stroke(o), e && s.restore();
    }
    isContentVisible() {
      for (let t = this.markedContentStack.length - 1; t >= 0; t--) if (!this.markedContentStack[t].visible) return false;
      return true;
    }
  };
  _Kt_instances = new WeakSet();
  t_fn3 = function() {
    for (; this.stateStack.length || this.inSMaskMode; ) this.restore();
    this.current.activeSMask = null, this.ctx.restore(), this.transparentCanvas && (this.ctx = this.compositeCtx, this.ctx.save(), this.ctx.setTransform(1, 0, 0, 1, 0, 0), this.ctx.drawImage(this.transparentCanvas, 0, 0), this.ctx.restore(), this.transparentCanvas = null);
  };
  e_fn3 = function() {
    if (this.pageColors) {
      const t = this.filterFactory.addHCMFilter(this.pageColors.foreground, this.pageColors.background);
      if (t !== "none") {
        const e = this.ctx.filter;
        this.ctx.filter = t, this.ctx.drawImage(this.ctx.canvas, 0, 0), this.ctx.filter = e;
      }
    }
  };
  i_fn2 = function(t, e, s) {
    const i = new Path2D();
    return i.addPath(t, new DOMMatrix(s).invertSelf().multiplySelf(e)), i;
  };
  let Kt = _Kt;
  for (const d in de) Kt.prototype[d] !== void 0 && (Kt.prototype[de[d]] = Kt.prototype[d]);
  he = (_f5 = class {
    static get workerPort() {
      return __privateGet(this, _t31);
    }
    static set workerPort(t) {
      if (!(typeof Worker < "u" && t instanceof Worker) && t !== null) throw new Error("Invalid `workerPort` type.");
      __privateSet(this, _t31, t);
    }
    static get workerSrc() {
      return __privateGet(this, _e24);
    }
    static set workerSrc(t) {
      if (typeof t != "string") throw new Error("Invalid `workerSrc` type.");
      __privateSet(this, _e24, t);
    }
  }, _t31 = new WeakMap(), _e24 = new WeakMap(), __privateAdd(_f5, _t31, null), __privateAdd(_f5, _e24, ""), _f5);
  class Xn {
    constructor({ parsedData: t, rawData: e }) {
      __privateAdd(this, _t32);
      __privateAdd(this, _e25);
      __privateSet(this, _t32, t), __privateSet(this, _e25, e);
    }
    getRaw() {
      return __privateGet(this, _e25);
    }
    get(t) {
      return __privateGet(this, _t32).get(t) ?? null;
    }
    [Symbol.iterator]() {
      return __privateGet(this, _t32).entries();
    }
  }
  _t32 = new WeakMap();
  _e25 = new WeakMap();
  const zt = /* @__PURE__ */ Symbol("INTERNAL");
  class Yn {
    constructor(t, { name: e, intent: s, usage: i, rbGroups: n }) {
      __privateAdd(this, _t33, false);
      __privateAdd(this, _e26, false);
      __privateAdd(this, _i21, false);
      __privateAdd(this, _s17, true);
      __privateSet(this, _t33, !!(t & gt.DISPLAY)), __privateSet(this, _e26, !!(t & gt.PRINT)), this.name = e, this.intent = s, this.usage = i, this.rbGroups = n;
    }
    get visible() {
      if (__privateGet(this, _i21)) return __privateGet(this, _s17);
      if (!__privateGet(this, _s17)) return false;
      const { print: t, view: e } = this.usage;
      return __privateGet(this, _t33) ? (e == null ? void 0 : e.viewState) !== "OFF" : __privateGet(this, _e26) ? (t == null ? void 0 : t.printState) !== "OFF" : true;
    }
    _setVisible(t, e, s = false) {
      t !== zt && $("Internal method `_setVisible` called."), __privateSet(this, _i21, s), __privateSet(this, _s17, e);
    }
  }
  _t33 = new WeakMap();
  _e26 = new WeakMap();
  _i21 = new WeakMap();
  _s17 = new WeakMap();
  class qn {
    constructor(t, e = gt.DISPLAY) {
      __privateAdd(this, _qn_instances);
      __privateAdd(this, _t34, null);
      __privateAdd(this, _e27, /* @__PURE__ */ new Map());
      __privateAdd(this, _i22, null);
      __privateAdd(this, _s18, null);
      if (this.renderingIntent = e, this.name = null, this.creator = null, t !== null) {
        this.name = t.name, this.creator = t.creator, __privateSet(this, _s18, t.order);
        for (const s of t.groups) __privateGet(this, _e27).set(s.id, new Yn(e, s));
        if (t.baseState === "OFF") for (const s of __privateGet(this, _e27).values()) s._setVisible(zt, false);
        for (const s of t.on) __privateGet(this, _e27).get(s)._setVisible(zt, true);
        for (const s of t.off) __privateGet(this, _e27).get(s)._setVisible(zt, false);
        __privateSet(this, _i22, this.getHash());
      }
    }
    isVisible(t) {
      if (__privateGet(this, _e27).size === 0) return true;
      if (!t) return Fe("Optional content group not defined."), true;
      if (t.type === "OCG") return __privateGet(this, _e27).has(t.id) ? __privateGet(this, _e27).get(t.id).visible : (F(`Optional content group not found: ${t.id}`), true);
      if (t.type === "OCMD") {
        if (t.expression) return __privateMethod(this, _qn_instances, a_fn4).call(this, t.expression);
        if (!t.policy || t.policy === "AnyOn") {
          for (const e of t.ids) {
            if (!__privateGet(this, _e27).has(e)) return F(`Optional content group not found: ${e}`), true;
            if (__privateGet(this, _e27).get(e).visible) return true;
          }
          return false;
        } else if (t.policy === "AllOn") {
          for (const e of t.ids) {
            if (!__privateGet(this, _e27).has(e)) return F(`Optional content group not found: ${e}`), true;
            if (!__privateGet(this, _e27).get(e).visible) return false;
          }
          return true;
        } else if (t.policy === "AnyOff") {
          for (const e of t.ids) {
            if (!__privateGet(this, _e27).has(e)) return F(`Optional content group not found: ${e}`), true;
            if (!__privateGet(this, _e27).get(e).visible) return true;
          }
          return false;
        } else if (t.policy === "AllOff") {
          for (const e of t.ids) {
            if (!__privateGet(this, _e27).has(e)) return F(`Optional content group not found: ${e}`), true;
            if (__privateGet(this, _e27).get(e).visible) return false;
          }
          return true;
        }
        return F(`Unknown optional content policy ${t.policy}.`), true;
      }
      return F(`Unknown group type ${t.type}.`), true;
    }
    setVisibility(t, e = true, s = true) {
      var _a29;
      const i = __privateGet(this, _e27).get(t);
      if (!i) {
        F(`Optional content group not found: ${t}`);
        return;
      }
      if (s && e && i.rbGroups.length) for (const n of i.rbGroups) for (const r of n) r !== t && ((_a29 = __privateGet(this, _e27).get(r)) == null ? void 0 : _a29._setVisible(zt, false, true));
      i._setVisible(zt, !!e, true), __privateSet(this, _t34, null);
    }
    setOCGState({ state: t, preserveRB: e }) {
      let s;
      for (const i of t) {
        switch (i) {
          case "ON":
          case "OFF":
          case "Toggle":
            s = i;
            continue;
        }
        const n = __privateGet(this, _e27).get(i);
        if (n) switch (s) {
          case "ON":
            this.setVisibility(i, true, e);
            break;
          case "OFF":
            this.setVisibility(i, false, e);
            break;
          case "Toggle":
            this.setVisibility(i, !n.visible, e);
            break;
        }
      }
      __privateSet(this, _t34, null);
    }
    get hasInitialVisibility() {
      return __privateGet(this, _i22) === null || this.getHash() === __privateGet(this, _i22);
    }
    getOrder() {
      return __privateGet(this, _e27).size ? __privateGet(this, _s18) ? __privateGet(this, _s18).slice() : [
        ...__privateGet(this, _e27).keys()
      ] : null;
    }
    getGroup(t) {
      return __privateGet(this, _e27).get(t) || null;
    }
    getHash() {
      if (__privateGet(this, _t34) !== null) return __privateGet(this, _t34);
      const t = new Ai();
      for (const [e, s] of __privateGet(this, _e27)) t.update(`${e}:${s.visible}`);
      return __privateSet(this, _t34, t.hexdigest());
    }
    [Symbol.iterator]() {
      return __privateGet(this, _e27).entries();
    }
  }
  _t34 = new WeakMap();
  _e27 = new WeakMap();
  _i22 = new WeakMap();
  _s18 = new WeakMap();
  _qn_instances = new WeakSet();
  a_fn4 = function(t) {
    const e = t.length;
    if (e < 2) return true;
    const s = t[0];
    for (let i = 1; i < e; i++) {
      const n = t[i];
      let r;
      if (Array.isArray(n)) r = __privateMethod(this, _qn_instances, a_fn4).call(this, n);
      else if (__privateGet(this, _e27).has(n)) r = __privateGet(this, _e27).get(n).visible;
      else return F(`Optional content group not found: ${n}`), true;
      switch (s) {
        case "And":
          if (!r) return false;
          break;
        case "Or":
          if (r) return true;
          break;
        case "Not":
          return !r;
        default:
          return true;
      }
    }
    return s === "And";
  };
  class Ue {
    constructor(t, e, s) {
      __privateAdd(this, _t35, null);
      __privateAdd(this, _e28, null);
      __publicField(this, "_fullReader", null);
      __publicField(this, "_rangeReaders", /* @__PURE__ */ new Set());
      __publicField(this, "_source", null);
      this._source = t, __privateSet(this, _t35, e), __privateSet(this, _e28, s);
    }
    get _progressiveDataLength() {
      var _a29;
      return ((_a29 = this._fullReader) == null ? void 0 : _a29._loaded) ?? 0;
    }
    getFullReader() {
      return B(!this._fullReader, "BasePDFStream.getFullReader can only be called once."), this._fullReader = new (__privateGet(this, _t35))(this);
    }
    getRangeReader(t, e) {
      if (e <= this._progressiveDataLength) return null;
      const s = new (__privateGet(this, _e28))(this, t, e);
      return this._rangeReaders.add(s), s;
    }
    cancelAllRequests(t) {
      var _a29;
      (_a29 = this._fullReader) == null ? void 0 : _a29.cancel(t);
      for (const e of new Set(this._rangeReaders)) e.cancel(t);
    }
  }
  _t35 = new WeakMap();
  _e28 = new WeakMap();
  class He {
    constructor(t) {
      __publicField(this, "onProgress", null);
      __publicField(this, "_contentLength", 0);
      __publicField(this, "_filename", null);
      __publicField(this, "_headersCapability", Promise.withResolvers());
      __publicField(this, "_isRangeSupported", false);
      __publicField(this, "_isStreamingSupported", false);
      __publicField(this, "_loaded", 0);
      __publicField(this, "_stream", null);
      this._stream = t;
    }
    _callOnProgress() {
      var _a29;
      (_a29 = this.onProgress) == null ? void 0 : _a29.call(this, {
        loaded: this._loaded,
        total: this._contentLength
      });
    }
    get headersReady() {
      return this._headersCapability.promise;
    }
    get filename() {
      return this._filename;
    }
    get contentLength() {
      return this._contentLength;
    }
    get isRangeSupported() {
      return this._isRangeSupported;
    }
    get isStreamingSupported() {
      return this._isStreamingSupported;
    }
    async read() {
      $("Abstract method `read` called");
    }
    cancel(t) {
      $("Abstract method `cancel` called");
    }
  }
  class $e {
    constructor(t, e, s) {
      __publicField(this, "_stream", null);
      this._stream = t;
    }
    async read() {
      $("Abstract method `read` called");
    }
    cancel(t) {
      $("Abstract method `cancel` called");
    }
  }
  function ri(d) {
    return d instanceof Uint8Array && d.byteLength === d.buffer.byteLength ? d.buffer : new Uint8Array(d).buffer;
  }
  function je() {
    for (const d of this._requests) d.resolve({
      value: void 0,
      done: true
    });
    this._requests.length = 0;
  }
  class Kn extends Ue {
    constructor(t) {
      super(t, Qn, Jn);
      __privateAdd(this, _Kn_instances);
      __publicField(this, "_progressiveDone", false);
      __publicField(this, "_queuedChunks", []);
      const { pdfDataRangeTransport: e } = t, { initialData: s, progressiveDone: i } = e;
      if ((s == null ? void 0 : s.length) > 0) {
        const n = ri(s);
        this._queuedChunks.push(n);
      }
      this._progressiveDone = i, e.addRangeListener((n, r) => {
        __privateMethod(this, _Kn_instances, t_fn4).call(this, n, r);
      }), e.addProgressiveReadListener((n) => {
        __privateMethod(this, _Kn_instances, t_fn4).call(this, void 0, n);
      }), e.addProgressiveDoneListener(() => {
        var _a29;
        (_a29 = this._fullReader) == null ? void 0 : _a29.progressiveDone(), this._progressiveDone = true;
      }), e.transportReady();
    }
    getFullReader() {
      const t = super.getFullReader();
      return this._queuedChunks = null, t;
    }
    getRangeReader(t, e) {
      const s = super.getRangeReader(t, e);
      return s && (s.onDone = () => this._rangeReaders.delete(s), this._source.pdfDataRangeTransport.requestDataRange(t, e)), s;
    }
    cancelAllRequests(t) {
      super.cancelAllRequests(t), this._source.pdfDataRangeTransport.abort();
    }
  }
  _Kn_instances = new WeakSet();
  t_fn4 = function(t, e) {
    const s = ri(e);
    if (t === void 0) this._fullReader ? this._fullReader._enqueue(s) : this._queuedChunks.push(s);
    else {
      const i = this._rangeReaders.keys().find((n) => n._begin === t);
      B(i, "#onReceiveData - no `PDFDataTransportStreamRangeReader` instance found."), i._enqueue(s);
    }
  };
  class Qn extends He {
    constructor(t) {
      super(t);
      __privateAdd(this, _t36, je.bind(this));
      __publicField(this, "_done", false);
      __publicField(this, "_queuedChunks", null);
      __publicField(this, "_requests", []);
      const { pdfDataRangeTransport: e, disableRange: s, disableStream: i } = t._source, { length: n, contentDispositionFilename: r } = e;
      this._queuedChunks = t._queuedChunks || [];
      for (const o of this._queuedChunks) this._loaded += o.byteLength;
      this._done = t._progressiveDone, this._contentLength = n, this._isStreamingSupported = !i, this._isRangeSupported = !s, ws(r) && (this._filename = r), this._headersCapability.resolve();
      const a = this._loaded;
      Promise.resolve().then(() => {
        a > 0 && this._loaded === a && this._callOnProgress();
      });
    }
    _enqueue(t) {
      this._done || (this._requests.length > 0 ? this._requests.shift().resolve({
        value: t,
        done: false
      }) : this._queuedChunks.push(t), this._loaded += t.byteLength, this._callOnProgress());
    }
    async read() {
      if (this._queuedChunks.length > 0) return {
        value: this._queuedChunks.shift(),
        done: false
      };
      if (this._done) return {
        value: void 0,
        done: true
      };
      const t = Promise.withResolvers();
      return this._requests.push(t), t.promise;
    }
    cancel(t) {
      this._done = true, __privateGet(this, _t36).call(this);
    }
    progressiveDone() {
      this._done || (this._done = true), this._queuedChunks.length === 0 && __privateGet(this, _t36).call(this);
    }
  }
  _t36 = new WeakMap();
  class Jn extends $e {
    constructor(t, e, s) {
      super(t, e, s);
      __privateAdd(this, _t37, je.bind(this));
      __publicField(this, "onDone", null);
      __publicField(this, "_begin", -1);
      __publicField(this, "_done", false);
      __publicField(this, "_queuedChunk", null);
      __publicField(this, "_requests", []);
      this._begin = e;
    }
    _enqueue(t) {
      var _a29;
      this._done || (this._requests.length === 0 ? this._queuedChunk = t : (this._requests.shift().resolve({
        value: t,
        done: false
      }), __privateGet(this, _t37).call(this)), this._done = true, (_a29 = this.onDone) == null ? void 0 : _a29.call(this));
    }
    async read() {
      if (this._queuedChunk) {
        const e = this._queuedChunk;
        return this._queuedChunk = null, {
          value: e,
          done: false
        };
      }
      if (this._done) return {
        value: void 0,
        done: true
      };
      const t = Promise.withResolvers();
      return this._requests.push(t), t.promise;
    }
    cancel(t) {
      var _a29;
      this._done = true, __privateGet(this, _t37).call(this), (_a29 = this.onDone) == null ? void 0 : _a29.call(this);
    }
  }
  _t37 = new WeakMap();
  function Zn(d) {
    let t = true, e = s("filename\\*", "i").exec(d);
    if (e) {
      e = e[1];
      let h = a(e);
      return h = unescape(h), h = o(h), h = l(h), n(h);
    }
    if (e = r(d), e) {
      const h = l(e);
      return n(h);
    }
    if (e = s("filename", "i").exec(d), e) {
      e = e[1];
      let h = a(e);
      return h = l(h), n(h);
    }
    function s(h, c) {
      return new RegExp("(?:^|;)\\s*" + h + '\\s*=\\s*([^";\\s][^;\\s]*|"(?:[^"\\\\]|\\\\"?)+"?)', c);
    }
    function i(h, c) {
      if (h) {
        if (!/^[\x00-\xFF]+$/.test(c)) return c;
        try {
          const u = new TextDecoder(h, {
            fatal: true
          }), f = Ne(c);
          c = u.decode(f), t = false;
        } catch {
        }
      }
      return c;
    }
    function n(h) {
      return t && /[\x80-\xff]/.test(h) && (h = i("utf-8", h), t && (h = i("iso-8859-1", h))), h;
    }
    function r(h) {
      const c = [];
      let u;
      const f = s("filename\\*((?!0\\d)\\d+)(\\*?)", "ig");
      for (; (u = f.exec(h)) !== null; ) {
        let [, p, b, m] = u;
        if (p = parseInt(p, 10), p in c) {
          if (p === 0) break;
          continue;
        }
        c[p] = [
          b,
          m
        ];
      }
      const g = [];
      for (let p = 0; p < c.length && p in c; ++p) {
        let [b, m] = c[p];
        m = a(m), b && (m = unescape(m), p === 0 && (m = o(m))), g.push(m);
      }
      return g.join("");
    }
    function a(h) {
      if (h.startsWith('"')) {
        const c = h.slice(1).split('\\"');
        for (let u = 0; u < c.length; ++u) {
          const f = c[u].indexOf('"');
          f !== -1 && (c[u] = c[u].slice(0, f), c.length = u + 1), c[u] = c[u].replaceAll(/\\(.)/g, "$1");
        }
        h = c.join('"');
      }
      return h;
    }
    function o(h) {
      const c = h.indexOf("'");
      if (c === -1) return h;
      const u = h.slice(0, c), g = h.slice(c + 1).replace(/^[^']*'/, "");
      return i(u, g);
    }
    function l(h) {
      return !h.startsWith("=?") || /[\x00-\x19\x80-\xff]/.test(h) ? h : h.replaceAll(/=\?([\w-]*)\?([QqBb])\?((?:[^?]|\?(?!=))*)\?=/g, function(c, u, f, g) {
        if (f === "q" || f === "Q") return g = g.replaceAll("_", " "), g = g.replaceAll(/=([0-9a-fA-F]{2})/g, function(p, b) {
          return String.fromCharCode(parseInt(b, 16));
        }), i(u, g);
        try {
          g = atob(g);
        } catch {
        }
        return i(u, g);
      });
    }
    return "";
  }
  function Ti(d, t) {
    const e = new Headers();
    if (!d || !t || typeof t != "object") return e;
    for (const s in t) {
      const i = t[s];
      i !== void 0 && e.append(s, i);
    }
    return e;
  }
  function ze(d) {
    var _a29;
    return ((_a29 = URL.parse(d)) == null ? void 0 : _a29.origin) ?? null;
  }
  function xi({ responseHeaders: d, isHttp: t, rangeChunkSize: e, disableRange: s }) {
    const i = {
      allowRangeRequests: false,
      suggestedLength: void 0
    }, n = parseInt(d.get("Content-Length"), 10);
    return !Number.isInteger(n) || (i.suggestedLength = n, n <= 2 * e) || s || !t || d.get("Accept-Ranges") !== "bytes" || (d.get("Content-Encoding") || "identity") !== "identity" || (i.allowRangeRequests = true), i;
  }
  function Pi(d) {
    const t = d.get("Content-Disposition");
    if (t) {
      let e = Zn(t);
      if (e.includes("%")) try {
        e = decodeURIComponent(e);
      } catch {
      }
      if (ws(e)) return e;
    }
    return null;
  }
  function Ge(d, t) {
    return new Me(`Unexpected server response (${d}) while retrieving PDF "${t.href}".`, d, d === 404 || d === 0 && t.protocol === "file:");
  }
  function ki(d, t) {
    if (d !== t) throw new Error(`Expected range response-origin "${d}" to match "${t}".`);
  }
  function Mi(d, t, e, s) {
    return fetch(d, {
      method: "GET",
      headers: t,
      signal: s.signal,
      mode: "cors",
      credentials: e ? "include" : "same-origin",
      redirect: "follow"
    });
  }
  function Di(d, t) {
    if (d !== 200 && d !== 206) throw Ge(d, t);
  }
  function Ve(d) {
    if (d instanceof Uint8Array) return d.buffer;
    if (d instanceof ArrayBuffer) return d;
    throw new Error(`getArrayBuffer - unexpected data: ${d}`);
  }
  class tr extends Ue {
    constructor(t) {
      super(t, er, sr);
      __publicField(this, "_responseOrigin", null);
      const { httpHeaders: e, url: s } = t;
      B(/https?:/.test(s.protocol), "PDFFetchStream only supports http(s):// URLs."), this.headers = Ti(true, e);
    }
  }
  class er extends He {
    constructor(t) {
      super(t);
      __publicField(this, "_abortController", new AbortController());
      __publicField(this, "_reader", null);
      const { disableRange: e, disableStream: s, length: i, rangeChunkSize: n, url: r, withCredentials: a } = t._source;
      this._contentLength = i, this._isStreamingSupported = !s, this._isRangeSupported = !e;
      const o = new Headers(t.headers);
      Mi(r, o, a, this._abortController).then((l) => {
        t._responseOrigin = ze(l.url), Di(l.status, r), this._reader = l.body.getReader();
        const h = l.headers, { allowRangeRequests: c, suggestedLength: u } = xi({
          responseHeaders: h,
          isHttp: true,
          rangeChunkSize: n,
          disableRange: e
        });
        this._isRangeSupported = c, this._contentLength = u || this._contentLength, this._filename = Pi(h), !this._isStreamingSupported && this._isRangeSupported && this.cancel(new Rt("Streaming is disabled.")), this._headersCapability.resolve();
      }).catch(this._headersCapability.reject);
    }
    async read() {
      await this._headersCapability.promise;
      const { value: t, done: e } = await this._reader.read();
      return e ? {
        value: t,
        done: e
      } : (this._loaded += t.byteLength, this._callOnProgress(), {
        value: Ve(t),
        done: false
      });
    }
    cancel(t) {
      var _a29;
      (_a29 = this._reader) == null ? void 0 : _a29.cancel(t), this._abortController.abort();
    }
  }
  class sr extends $e {
    constructor(t, e, s) {
      super(t, e, s);
      __publicField(this, "_abortController", new AbortController());
      __publicField(this, "_readCapability", Promise.withResolvers());
      __publicField(this, "_reader", null);
      const { url: i, withCredentials: n } = t._source, r = new Headers(t.headers);
      r.append("Range", `bytes=${e}-${s - 1}`), Mi(i, r, n, this._abortController).then((a) => {
        const o = ze(a.url);
        ki(o, t._responseOrigin), Di(a.status, i), this._reader = a.body.getReader(), this._readCapability.resolve();
      }).catch(this._readCapability.reject);
    }
    async read() {
      await this._readCapability.promise;
      const { value: t, done: e } = await this._reader.read();
      return e ? {
        value: t,
        done: e
      } : {
        value: Ve(t),
        done: false
      };
    }
    cancel(t) {
      var _a29;
      (_a29 = this._reader) == null ? void 0 : _a29.cancel(t), this._abortController.abort();
    }
  }
  const es = 200, ai = 206;
  function ir(d) {
    return typeof d != "string" ? d : Ne(d).buffer;
  }
  class nr extends Ue {
    constructor(t) {
      super(t, rr, ar);
      __privateAdd(this, _nr_instances);
      __privateAdd(this, _t38, /* @__PURE__ */ new WeakMap());
      __publicField(this, "_responseOrigin", null);
      const { httpHeaders: e, url: s } = t;
      this.url = s, this.isHttp = /https?:/.test(s.protocol), this.headers = Ti(this.isHttp, e);
    }
    _request(t) {
      const e = new XMLHttpRequest(), s = {
        validateStatus: null,
        onHeadersReceived: t.onHeadersReceived,
        onDone: t.onDone,
        onError: t.onError,
        onProgress: t.onProgress
      };
      __privateGet(this, _t38).set(e, s), e.open("GET", this.url), e.withCredentials = this._source.withCredentials;
      for (const [i, n] of this.headers) e.setRequestHeader(i, n);
      return this.isHttp && "begin" in t && "end" in t ? (e.setRequestHeader("Range", `bytes=${t.begin}-${t.end - 1}`), s.validateStatus = (i) => i === ai || i === es) : s.validateStatus = (i) => i === es, e.responseType = "arraybuffer", B(t.onError, "Expected `onError` callback to be provided."), e.onerror = () => t.onError(e.status), e.onreadystatechange = __privateMethod(this, _nr_instances, i_fn3).bind(this, e), e.onprogress = __privateMethod(this, _nr_instances, e_fn4).bind(this, e), e.send(null), e;
    }
    _abortRequest(t) {
      __privateGet(this, _t38).has(t) && (__privateGet(this, _t38).delete(t), t.abort());
    }
    getRangeReader(t, e) {
      const s = super.getRangeReader(t, e);
      return s && (s.onClosed = () => this._rangeReaders.delete(s)), s;
    }
  }
  _t38 = new WeakMap();
  _nr_instances = new WeakSet();
  e_fn4 = function(t, e) {
    var _a29, _b7;
    (_b7 = (_a29 = __privateGet(this, _t38).get(t)) == null ? void 0 : _a29.onProgress) == null ? void 0 : _b7.call(_a29, e);
  };
  i_fn3 = function(t, e) {
    const s = __privateGet(this, _t38).get(t);
    if (!s || (t.readyState >= 2 && s.onHeadersReceived && (s.onHeadersReceived(), delete s.onHeadersReceived), t.readyState !== 4) || !__privateGet(this, _t38).has(t)) return;
    if (__privateGet(this, _t38).delete(t), t.status === 0 && this.isHttp) {
      s.onError(t.status);
      return;
    }
    const i = t.status || es;
    if (!s.validateStatus(i)) {
      s.onError(t.status);
      return;
    }
    const n = ir(t.response);
    if (i === ai) {
      const r = t.getResponseHeader("Content-Range");
      /bytes (\d+)-(\d+)\/(\d+)/.test(r) ? s.onDone(n) : (F('Missing or invalid "Content-Range" header.'), s.onError(0));
    } else n ? s.onDone(n) : s.onError(t.status);
  };
  class rr extends He {
    constructor(t) {
      super(t);
      __privateAdd(this, _rr_instances);
      __privateAdd(this, _t39, je.bind(this));
      __publicField(this, "_cachedChunks", []);
      __publicField(this, "_done", false);
      __publicField(this, "_requests", []);
      __publicField(this, "_storedError", null);
      const { length: e } = t._source;
      this._contentLength = e, this._fullRequestXhr = t._request({
        onHeadersReceived: __privateMethod(this, _rr_instances, e_fn5).bind(this),
        onDone: __privateMethod(this, _rr_instances, i_fn4).bind(this),
        onError: __privateMethod(this, _rr_instances, s_fn6).bind(this),
        onProgress: __privateMethod(this, _rr_instances, a_fn5).bind(this)
      });
    }
    async read() {
      if (await this._headersCapability.promise, this._storedError) throw this._storedError;
      if (this._cachedChunks.length > 0) return {
        value: this._cachedChunks.shift(),
        done: false
      };
      if (this._done) return {
        value: void 0,
        done: true
      };
      const t = Promise.withResolvers();
      return this._requests.push(t), t.promise;
    }
    cancel(t) {
      this._done = true, this._headersCapability.reject(t), __privateGet(this, _t39).call(this), this._stream._abortRequest(this._fullRequestXhr), this._fullRequestXhr = null;
    }
  }
  _t39 = new WeakMap();
  _rr_instances = new WeakSet();
  e_fn5 = function() {
    const t = this._stream, { disableRange: e, rangeChunkSize: s } = t._source, i = this._fullRequestXhr;
    t._responseOrigin = ze(i.responseURL);
    const n = i.getAllResponseHeaders(), r = new Headers(n ? n.trimStart().replace(/[^\S ]+$/, "").split(/[\r\n]+/).map((l) => {
      const [h, ...c] = l.split(": ");
      return [
        h,
        c.join(": ")
      ];
    }) : []), { allowRangeRequests: a, suggestedLength: o } = xi({
      responseHeaders: r,
      isHttp: t.isHttp,
      rangeChunkSize: s,
      disableRange: e
    });
    a && (this._isRangeSupported = true), this._contentLength = o || this._contentLength, this._filename = Pi(r), this._isRangeSupported && t._abortRequest(i), this._headersCapability.resolve();
  };
  i_fn4 = function(t) {
    this._requests.length > 0 ? this._requests.shift().resolve({
      value: t,
      done: false
    }) : this._cachedChunks.push(t), this._done = true, this._cachedChunks.length === 0 && __privateGet(this, _t39).call(this);
  };
  s_fn6 = function(t) {
    this._storedError = Ge(t, this._stream.url), this._headersCapability.reject(this._storedError);
    for (const e of this._requests) e.reject(this._storedError);
    this._requests.length = 0, this._cachedChunks.length = 0;
  };
  a_fn5 = function(t) {
    var _a29;
    (_a29 = this.onProgress) == null ? void 0 : _a29.call(this, {
      loaded: t.loaded,
      total: t.lengthComputable ? t.total : this._contentLength
    });
  };
  class ar extends $e {
    constructor(t, e, s) {
      super(t, e, s);
      __privateAdd(this, _ar_instances);
      __privateAdd(this, _t40, je.bind(this));
      __publicField(this, "onClosed", null);
      __publicField(this, "_done", false);
      __publicField(this, "_queuedChunk", null);
      __publicField(this, "_requests", []);
      __publicField(this, "_storedError", null);
      this._requestXhr = t._request({
        begin: e,
        end: s,
        onHeadersReceived: __privateMethod(this, _ar_instances, e_fn6).bind(this),
        onDone: __privateMethod(this, _ar_instances, i_fn5).bind(this),
        onError: __privateMethod(this, _ar_instances, s_fn7).bind(this),
        onProgress: null
      });
    }
    async read() {
      if (this._storedError) throw this._storedError;
      if (this._queuedChunk !== null) {
        const e = this._queuedChunk;
        return this._queuedChunk = null, {
          value: e,
          done: false
        };
      }
      if (this._done) return {
        value: void 0,
        done: true
      };
      const t = Promise.withResolvers();
      return this._requests.push(t), t.promise;
    }
    cancel(t) {
      var _a29;
      this._done = true, __privateGet(this, _t40).call(this), this._stream._abortRequest(this._requestXhr), (_a29 = this.onClosed) == null ? void 0 : _a29.call(this);
    }
  }
  _t40 = new WeakMap();
  _ar_instances = new WeakSet();
  e_fn6 = function() {
    var _a29;
    const t = ze((_a29 = this._requestXhr) == null ? void 0 : _a29.responseURL);
    try {
      ki(t, this._stream._responseOrigin);
    } catch (e) {
      this._storedError = e, __privateMethod(this, _ar_instances, s_fn7).call(this, 0);
    }
  };
  i_fn5 = function(t) {
    var _a29;
    this._requests.length > 0 ? this._requests.shift().resolve({
      value: t,
      done: false
    }) : this._queuedChunk = t, this._done = true, __privateGet(this, _t40).call(this), (_a29 = this.onClosed) == null ? void 0 : _a29.call(this);
  };
  s_fn7 = function(t) {
    this._storedError ?? (this._storedError = Ge(t, this._stream.url));
    for (const e of this._requests) e.reject(this._storedError);
    this._requests.length = 0, this._queuedChunk = null;
  };
  function Ii(d) {
    const { Readable: t } = yt.getBuiltinModule("stream");
    return typeof t.toWeb == "function" ? t.toWeb(d) : yt.getBuiltinModule("module").createRequire(import.meta.url)("node-readable-to-web-readable-stream").makeDefaultReadableStreamFromNodeReadable(d);
  }
  class or extends Ue {
    constructor(t) {
      super(t, lr, hr);
      const { url: e } = t;
      B(e.protocol === "file:", "PDFNodeStream only supports file:// URLs.");
    }
  }
  class lr extends He {
    constructor(t) {
      super(t);
      __publicField(this, "_reader", null);
      const { disableRange: e, disableStream: s, length: i, rangeChunkSize: n, url: r } = t._source;
      this._contentLength = i, this._isStreamingSupported = !s, this._isRangeSupported = !e;
      const a = yt.getBuiltinModule("fs");
      a.promises.lstat(r).then((o) => {
        const l = a.createReadStream(r), h = Ii(l);
        this._reader = h.getReader();
        const { size: c } = o;
        c <= 2 * n && (this._isRangeSupported = false), this._contentLength = c, !this._isStreamingSupported && this._isRangeSupported && this.cancel(new Rt("Streaming is disabled.")), this._headersCapability.resolve();
      }).catch((o) => {
        o.code === "ENOENT" && (o = Ge(0, r)), this._headersCapability.reject(o);
      });
    }
    async read() {
      await this._headersCapability.promise;
      const { value: t, done: e } = await this._reader.read();
      return e ? {
        value: t,
        done: e
      } : (this._loaded += t.byteLength, this._callOnProgress(), {
        value: Ve(t),
        done: false
      });
    }
    cancel(t) {
      var _a29;
      (_a29 = this._reader) == null ? void 0 : _a29.cancel(t);
    }
  }
  class hr extends $e {
    constructor(t, e, s) {
      super(t, e, s);
      __publicField(this, "_readCapability", Promise.withResolvers());
      __publicField(this, "_reader", null);
      const { url: i } = t._source, n = yt.getBuiltinModule("fs");
      try {
        const r = n.createReadStream(i, {
          start: e,
          end: s - 1
        }), a = Ii(r);
        this._reader = a.getReader(), this._readCapability.resolve();
      } catch (r) {
        this._readCapability.reject(r);
      }
    }
    async read() {
      await this._readCapability.promise;
      const { value: t, done: e } = await this._reader.read();
      return e ? {
        value: t,
        done: e
      } : {
        value: Ve(t),
        done: false
      };
    }
    cancel(t) {
      var _a29;
      (_a29 = this._reader) == null ? void 0 : _a29.cancel(t);
    }
  }
  const oe = /* @__PURE__ */ Symbol("INITIAL_DATA"), cr = () => ({
    ...Promise.withResolvers(),
    data: oe
  });
  class Li {
    constructor() {
      __privateAdd(this, _Li_instances);
      __privateAdd(this, _t41, /* @__PURE__ */ new Map());
    }
    get(t, e = null) {
      if (e) {
        const i = __privateMethod(this, _Li_instances, e_fn7).call(this, t);
        return i.promise.then(() => e(i.data)), null;
      }
      const s = __privateGet(this, _t41).get(t);
      if (!s || s.data === oe) throw new Error(`Requesting object that isn't resolved yet ${t}.`);
      return s.data;
    }
    has(t) {
      const e = __privateGet(this, _t41).get(t);
      return !!e && e.data !== oe;
    }
    delete(t) {
      const e = __privateGet(this, _t41).get(t);
      return !e || e.data === oe ? false : (__privateGet(this, _t41).delete(t), true);
    }
    resolve(t, e = null) {
      const s = __privateMethod(this, _Li_instances, e_fn7).call(this, t);
      s.data = e, s.resolve();
    }
    clear() {
      var _a29;
      for (const { data: t } of __privateGet(this, _t41).values()) (_a29 = t == null ? void 0 : t.bitmap) == null ? void 0 : _a29.close();
      __privateGet(this, _t41).clear();
    }
    *[Symbol.iterator]() {
      for (const [t, { data: e }] of __privateGet(this, _t41)) e !== oe && (yield [
        t,
        e
      ]);
    }
  }
  _t41 = new WeakMap();
  _Li_instances = new WeakSet();
  e_fn7 = function(t) {
    return __privateGet(this, _t41).getOrInsertComputed(t, cr);
  };
  const dr = 1e5, oi = 30;
  mt = (_h9 = class {
    constructor({ textContentSource: t, container: e, viewport: s }) {
      __privateAdd(this, _mt_instances);
      __privateAdd(this, _t42, Promise.withResolvers());
      __privateAdd(this, _e29, null);
      __privateAdd(this, _i23, false);
      __privateAdd(this, _s19, !!((_g4 = globalThis.FontInspector) == null ? void 0 : _g4.enabled));
      __privateAdd(this, _a14, null);
      __privateAdd(this, _r13, null);
      __privateAdd(this, _n13, 0);
      __privateAdd(this, _o10, 0);
      __privateAdd(this, _h8, null);
      __privateAdd(this, _l7, null);
      __privateAdd(this, _u6, 0);
      __privateAdd(this, _d7, 0);
      __privateAdd(this, _f6, /* @__PURE__ */ Object.create(null));
      __privateAdd(this, _m4, []);
      __privateAdd(this, _g5, null);
      __privateAdd(this, _c5, []);
      __privateAdd(this, _p4, /* @__PURE__ */ new WeakMap());
      __privateAdd(this, _b4, null);
      var _a29;
      if (t instanceof ReadableStream) __privateSet(this, _g5, t);
      else if (typeof t == "object") __privateSet(this, _g5, new ReadableStream({
        start(o) {
          o.enqueue(t), o.close();
        }
      }));
      else throw new Error('No "textContentSource" parameter specified.');
      __privateSet(this, _e29, __privateSet(this, _l7, e)), __privateSet(this, _d7, s.scale * Pt.pixelRatio), __privateSet(this, _u6, s.rotation), __privateSet(this, _r13, {
        div: null,
        properties: null,
        ctx: null
      });
      const { pageWidth: i, pageHeight: n, pageX: r, pageY: a } = s.rawDims;
      __privateSet(this, _b4, [
        1,
        0,
        0,
        -1,
        -r,
        a + n
      ]), __privateSet(this, _o10, i), __privateSet(this, _n13, n), __privateMethod(_a29 = mt, _mt_static, k_fn2).call(_a29), e.style.setProperty("--min-font-size", __privateGet(mt, _E3)), Ot(e, s), __privateGet(this, _t42).promise.finally(() => {
        __privateGet(mt, _v3).delete(this), __privateSet(this, _r13, null), __privateSet(this, _f6, null);
      }).catch(() => {
      });
    }
    static get fontFamilyMap() {
      const { isWindows: t, isFirefox: e } = nt.platform;
      return L(this, "fontFamilyMap", /* @__PURE__ */ new Map([
        [
          "sans-serif",
          `${t && e ? "Calibri, " : ""}sans-serif`
        ],
        [
          "monospace",
          `${t && e ? "Lucida Console, " : ""}monospace`
        ]
      ]));
    }
    render() {
      const t = () => {
        __privateGet(this, _h8).read().then(({ value: e, done: s }) => {
          if (s) {
            __privateGet(this, _t42).resolve();
            return;
          }
          __privateGet(this, _a14) ?? __privateSet(this, _a14, e.lang), Object.assign(__privateGet(this, _f6), e.styles), __privateMethod(this, _mt_instances, x_fn).call(this, e.items), t();
        }, __privateGet(this, _t42).reject);
      };
      return __privateSet(this, _h8, __privateGet(this, _g5).getReader()), __privateGet(mt, _v3).add(this), t(), __privateGet(this, _t42).promise;
    }
    update({ viewport: t, onBefore: e = null }) {
      var _a29;
      const s = t.scale * Pt.pixelRatio, i = t.rotation;
      if (i !== __privateGet(this, _u6) && (e == null ? void 0 : e(), __privateSet(this, _u6, i), Ot(__privateGet(this, _l7), {
        rotation: i
      })), s !== __privateGet(this, _d7)) {
        e == null ? void 0 : e(), __privateSet(this, _d7, s);
        const n = {
          div: null,
          properties: null,
          ctx: __privateMethod(_a29 = mt, _mt_static, M_fn2).call(_a29, __privateGet(this, _a14))
        };
        for (const r of __privateGet(this, _c5)) n.properties = __privateGet(this, _p4).get(r), n.div = r, __privateMethod(this, _mt_instances, __fn).call(this, n);
      }
    }
    cancel() {
      var _a29;
      const t = new Rt("TextLayer task cancelled.");
      (_a29 = __privateGet(this, _h8)) == null ? void 0 : _a29.cancel(t).catch(() => {
      }), __privateSet(this, _h8, null), __privateGet(this, _t42).reject(t);
    }
    get textDivs() {
      return __privateGet(this, _c5);
    }
    get textContentItemsStr() {
      return __privateGet(this, _m4);
    }
    static cleanup() {
      if (!(__privateGet(this, _v3).size > 0)) {
        __privateGet(this, _A3).clear();
        for (const { canvas: t } of __privateGet(this, _y3).values()) t.remove();
        __privateGet(this, _y3).clear();
      }
    }
  }, _t42 = new WeakMap(), _e29 = new WeakMap(), _i23 = new WeakMap(), _s19 = new WeakMap(), _a14 = new WeakMap(), _r13 = new WeakMap(), _n13 = new WeakMap(), _o10 = new WeakMap(), _h8 = new WeakMap(), _l7 = new WeakMap(), _u6 = new WeakMap(), _d7 = new WeakMap(), _f6 = new WeakMap(), _m4 = new WeakMap(), _g5 = new WeakMap(), _c5 = new WeakMap(), _p4 = new WeakMap(), _b4 = new WeakMap(), _A3 = new WeakMap(), _y3 = new WeakMap(), _C3 = new WeakMap(), _E3 = new WeakMap(), _v3 = new WeakMap(), _mt_instances = new WeakSet(), x_fn = function(t) {
    var _a29, _b7;
    if (__privateGet(this, _i23)) return;
    (_b7 = __privateGet(this, _r13)).ctx ?? (_b7.ctx = __privateMethod(_a29 = mt, _mt_static, M_fn2).call(_a29, __privateGet(this, _a14)));
    const e = __privateGet(this, _c5), s = __privateGet(this, _m4);
    for (const i of t) {
      if (e.length > dr) {
        F("Ignoring additional textDivs for performance reasons."), __privateSet(this, _i23, true);
        return;
      }
      if (i.str === void 0) {
        if (i.type === "beginMarkedContentProps" || i.type === "beginMarkedContent") {
          const n = __privateGet(this, _e29);
          __privateSet(this, _e29, document.createElement("span")), __privateGet(this, _e29).classList.add("markedContent"), i.id && __privateGet(this, _e29).setAttribute("id", `${i.id}`), i.tag === "Artifact" && (__privateGet(this, _e29).ariaHidden = true), n.append(__privateGet(this, _e29));
        } else i.type === "endMarkedContent" && __privateSet(this, _e29, __privateGet(this, _e29).parentNode);
        continue;
      }
      s.push(i.str), __privateMethod(this, _mt_instances, w_fn).call(this, i);
    }
  }, w_fn = function(t) {
    var _a29;
    const e = document.createElement("span"), s = {
      angle: 0,
      canvasWidth: 0,
      hasText: t.str !== "",
      hasEOL: t.hasEOL,
      fontSize: 0
    };
    __privateGet(this, _c5).push(e);
    const i = T.transform(__privateGet(this, _b4), t.transform);
    let n = Math.atan2(i[1], i[0]);
    const r = __privateGet(this, _f6)[t.fontName];
    r.vertical && (n += Math.PI / 2);
    let a = __privateGet(this, _s19) && r.fontSubstitution || r.fontFamily;
    a = mt.fontFamilyMap.get(a) || a;
    const o = Math.hypot(i[2], i[3]), l = o * __privateMethod(_a29 = mt, _mt_static, O_fn2).call(_a29, a, r, __privateGet(this, _a14));
    let h, c;
    n === 0 ? (h = i[4], c = i[5] - l) : (h = i[4] + l * Math.sin(n), c = i[5] - l * Math.cos(n));
    const u = e.style;
    u.left = `${(100 * h / __privateGet(this, _o10)).toFixed(2)}%`, u.top = `${(100 * c / __privateGet(this, _n13)).toFixed(2)}%`, u.setProperty("--font-height", `${o.toFixed(2)}px`), u.fontFamily = a, s.fontSize = o, e.setAttribute("role", "presentation"), e.textContent = t.str, e.dir = t.dir, __privateGet(this, _s19) && (e.dataset.fontName = r.fontSubstitutionLoadedName || t.fontName), n !== 0 && (s.angle = n * (180 / Math.PI));
    let f = false;
    if (t.str.length > 1) f = true;
    else if (t.str !== " " && t.transform[0] !== t.transform[3]) {
      const g = Math.abs(t.transform[0]), p = Math.abs(t.transform[3]);
      g !== p && Math.max(g, p) / Math.min(g, p) > 1.5 && (f = true);
    }
    if (f && (s.canvasWidth = r.vertical ? t.height : t.width), __privateGet(this, _p4).set(e, s), __privateGet(this, _r13).div = e, __privateGet(this, _r13).properties = s, __privateMethod(this, _mt_instances, __fn).call(this, __privateGet(this, _r13)), s.hasText && __privateGet(this, _e29).append(e), s.hasEOL) {
      const g = document.createElement("br");
      g.setAttribute("role", "presentation"), __privateGet(this, _e29).append(g);
    }
  }, __fn = function(t) {
    var _a29;
    const { div: e, properties: s, ctx: i } = t, { style: n } = e;
    if (s.canvasWidth !== 0 && s.hasText) {
      const { fontFamily: r } = n, { canvasWidth: a, fontSize: o } = s;
      __privateMethod(_a29 = mt, _mt_static, P_fn2).call(_a29, i, o * __privateGet(this, _d7), r);
      const { width: l } = i.measureText(e.textContent);
      l > 0 && n.setProperty("--scale-x", a * __privateGet(this, _d7) / l);
    }
    s.angle !== 0 && n.setProperty("--rotate", `${s.angle}deg`);
  }, _mt_static = new WeakSet(), M_fn2 = function(t = null) {
    let e = __privateGet(this, _y3).get(t || (t = ""));
    if (!e) {
      const s = document.createElement("canvas");
      s.className = "hiddenCanvasElement", s.lang = t, document.body.append(s), e = s.getContext("2d", {
        alpha: false,
        willReadFrequently: true
      }), __privateGet(this, _y3).set(t, e), __privateGet(this, _C3).set(e, {
        size: 0,
        family: ""
      });
    }
    return e;
  }, P_fn2 = function(t, e, s) {
    const i = __privateGet(this, _C3).get(t);
    e === i.size && s === i.family || (t.font = `${e}px ${s}`, i.size = e, i.family = s);
  }, k_fn2 = function() {
    if (__privateGet(this, _E3) !== null) return;
    const t = document.createElement("div");
    t.style.opacity = 0, t.style.lineHeight = 1, t.style.fontSize = "1px", t.style.position = "absolute", t.textContent = "X", document.body.append(t), __privateSet(this, _E3, t.getBoundingClientRect().height), t.remove();
  }, O_fn2 = function(t, e, s) {
    const i = __privateGet(this, _A3).get(t);
    if (i) return i;
    const n = __privateMethod(this, _mt_static, M_fn2).call(this, s);
    n.canvas.width = n.canvas.height = oi, __privateMethod(this, _mt_static, P_fn2).call(this, n, oi, t);
    const r = n.measureText(""), a = r.fontBoundingBoxAscent, o = Math.abs(r.fontBoundingBoxDescent);
    n.canvas.width = n.canvas.height = 0;
    let l = 0.8;
    return a ? l = a / (a + o) : (nt.platform.isFirefox && F("Enable the `dom.textMetrics.fontBoundingBox.enabled` preference in `about:config` to improve TextLayer rendering."), e.ascent ? l = e.ascent : e.descent && (l = 1 + e.descent)), __privateGet(this, _A3).set(t, l), l;
  }, __privateAdd(_h9, _mt_static), __privateAdd(_h9, _A3, /* @__PURE__ */ new Map()), __privateAdd(_h9, _y3, /* @__PURE__ */ new Map()), __privateAdd(_h9, _C3, /* @__PURE__ */ new WeakMap()), __privateAdd(_h9, _E3, null), __privateAdd(_h9, _v3, /* @__PURE__ */ new Set()), _h9);
  const ur = 100;
  fr = function(d = {}) {
    typeof d == "string" || d instanceof URL ? d = {
      url: d
    } : (d instanceof ArrayBuffer || ArrayBuffer.isView(d)) && (d = {
      data: d
    });
    const t = new xs(), { docId: e } = t, s = d.url ? vn(d.url) : null, i = d.data ? Sn(d.data) : null, n = d.httpHeaders || null, r = d.withCredentials === true, a = d.password ?? null, o = d.range instanceof Ri ? d.range : null, l = Number.isInteger(d.rangeChunkSize) && d.rangeChunkSize > 0 ? d.rangeChunkSize : 2 ** 16;
    let h = d.worker instanceof ht ? d.worker : null;
    const c = d.verbosity, u = typeof d.docBaseUrl == "string" && !Oe(d.docBaseUrl) ? d.docBaseUrl : null, f = ve(d.cMapUrl), g = d.cMapPacked !== false, p = d.CMapReaderFactory || (dt ? Mn : Vs), b = ve(d.iccUrl), m = ve(d.standardFontDataUrl), A = d.StandardFontDataFactory || (dt ? Dn : Ws), y = ve(d.wasmUrl), v = d.WasmFactory || (dt ? In : Xs), w = d.stopAtErrors !== true, S = Number.isInteger(d.maxImageSize) && d.maxImageSize > -1 ? d.maxImageSize : -1, E = d.isEvalSupported !== false, _ = typeof d.isOffscreenCanvasSupported == "boolean" ? d.isOffscreenCanvasSupported : !dt, C = typeof d.isImageDecoderSupported == "boolean" ? d.isImageDecoderSupported : !dt && (nt.platform.isFirefox || !globalThis.chrome), k = Number.isInteger(d.canvasMaxAreaInBytes) ? d.canvasMaxAreaInBytes : -1, x = typeof d.disableFontFace == "boolean" ? d.disableFontFace : dt, j = d.fontExtraProperties === true, V = d.enableXfa === true, N = d.ownerDocument || globalThis.document, J = d.disableRange === true, M = d.disableStream === true, I = d.disableAutoFetch === true, z = d.pdfBug === true, pt = d.CanvasFactory || (dt ? kn : Tn), kt = d.FilterFactory || (dt ? Pn : xn), Z = d.enableHWA === true, W = d.useWasm !== false, X = d.pagesMapper || new fn(), It = o ? o.length : d.length ?? NaN, Jt = typeof d.useSystemFonts == "boolean" ? d.useSystemFonts : !dt && !x, Et = typeof d.useWorkerFetch == "boolean" ? d.useWorkerFetch : !!(p === Vs && A === Ws && v === Xs && f && m && y && re(f, document.baseURI) && re(m, document.baseURI) && re(y, document.baseURI)), tt = null;
    Xi(c);
    const Zt = {
      canvasFactory: new pt({
        ownerDocument: N,
        enableHWA: Z
      }),
      filterFactory: new kt({
        docId: e,
        ownerDocument: N
      }),
      cMapReaderFactory: Et ? null : new p({
        baseUrl: f,
        isCompressed: g
      }),
      standardFontDataFactory: Et ? null : new A({
        baseUrl: m
      }),
      wasmFactory: Et ? null : new v({
        baseUrl: y
      })
    };
    h || (h = ht.create({
      verbosity: c,
      port: he.workerPort
    }), t._worker = h);
    const te = {
      docId: e,
      apiVersion: "5.5.207",
      data: i,
      password: a,
      disableAutoFetch: I,
      rangeChunkSize: l,
      length: It,
      docBaseUrl: u,
      enableXfa: V,
      evaluatorOptions: {
        maxImageSize: S,
        disableFontFace: x,
        ignoreErrors: w,
        isEvalSupported: E,
        isOffscreenCanvasSupported: _,
        isImageDecoderSupported: C,
        canvasMaxAreaInBytes: k,
        fontExtraProperties: j,
        useSystemFonts: Jt,
        useWasm: W,
        useWorkerFetch: Et,
        cMapUrl: f,
        iccUrl: b,
        standardFontDataUrl: m,
        wasmUrl: y
      }
    }, ji = {
      ownerDocument: N,
      pdfBug: z,
      styleElement: tt,
      enableHWA: Z,
      loadingParams: {
        disableAutoFetch: I,
        enableXfa: V
      }
    };
    return h.promise.then(function() {
      if (t.destroyed) throw new Error("Loading aborted");
      if (h.destroyed) throw new Error("Worker was destroyed");
      const zi = h.messageHandler.sendWithPromise("GetDocRequest", te, i ? [
        i.buffer
      ] : null);
      let Xe;
      if (o) Xe = new Kn({
        pdfDataRangeTransport: o,
        disableRange: J,
        disableStream: M
      });
      else if (!i) {
        if (!s) throw new Error("getDocument - no `url` parameter provided.");
        const Ye = re(s) ? tr : dt ? or : nr;
        Xe = new Ye({
          url: s,
          length: It,
          httpHeaders: n,
          withCredentials: r,
          rangeChunkSize: l,
          disableRange: J,
          disableStream: M
        });
      }
      return zi.then((Ye) => {
        if (t.destroyed) throw new Error("Loading aborted");
        if (h.destroyed) throw new Error("Worker was destroyed");
        const Rs = new ae(e, Ye, h.port), Gi = new mr(Rs, t, Xe, ji, Zt, X);
        t._transport = Gi, Rs.send("Ready", null);
      });
    }).catch(t._capability.reject), t;
  };
  const _xs = class _xs {
    constructor() {
      __publicField(this, "_capability", Promise.withResolvers());
      __publicField(this, "_transport", null);
      __publicField(this, "_worker", null);
      __publicField(this, "docId", `d${__privateWrapper(_xs, _t43)._++}`);
      __publicField(this, "destroyed", false);
      __publicField(this, "onPassword", null);
      __publicField(this, "onProgress", null);
    }
    get promise() {
      return this._capability.promise;
    }
    async destroy() {
      var _a29, _b7, _c10, _d12;
      this.destroyed = true;
      try {
        ((_a29 = this._worker) == null ? void 0 : _a29.port) && (this._worker._pendingDestroy = true), await ((_b7 = this._transport) == null ? void 0 : _b7.destroy());
      } catch (t) {
        throw ((_c10 = this._worker) == null ? void 0 : _c10.port) && delete this._worker._pendingDestroy, t;
      }
      this._transport = null, (_d12 = this._worker) == null ? void 0 : _d12.destroy(), this._worker = null;
    }
    async getData() {
      return this._transport.getData();
    }
  };
  _t43 = new WeakMap();
  __privateAdd(_xs, _t43, 0);
  let xs = _xs;
  Ri = (_i25 = class {
    constructor(t, e, s = false, i = null) {
      __privateAdd(this, _t44, Promise.withResolvers());
      __privateAdd(this, _e30, []);
      __privateAdd(this, _i24, []);
      __privateAdd(this, _s20, []);
      this.length = t, this.initialData = e, this.progressiveDone = s, this.contentDispositionFilename = i, Object.defineProperty(this, "onDataProgress", {
        value: () => {
          gi("`PDFDataRangeTransport.prototype.onDataProgress` - method was removed, since loading progress is now reported automatically through the `PDFDataTransportStream` class (and related code).");
        }
      });
    }
    addRangeListener(t) {
      __privateGet(this, _s20).push(t);
    }
    addProgressiveReadListener(t) {
      __privateGet(this, _i24).push(t);
    }
    addProgressiveDoneListener(t) {
      __privateGet(this, _e30).push(t);
    }
    onDataRange(t, e) {
      for (const s of __privateGet(this, _s20)) s(t, e);
    }
    onDataProgressiveRead(t) {
      __privateGet(this, _t44).promise.then(() => {
        for (const e of __privateGet(this, _i24)) e(t);
      });
    }
    onDataProgressiveDone() {
      __privateGet(this, _t44).promise.then(() => {
        for (const t of __privateGet(this, _e30)) t();
      });
    }
    transportReady() {
      __privateGet(this, _t44).resolve();
    }
    requestDataRange(t, e) {
      $("Abstract method PDFDataRangeTransport.requestDataRange");
    }
    abort() {
    }
  }, _t44 = new WeakMap(), _e30 = new WeakMap(), _i24 = new WeakMap(), _s20 = new WeakMap(), _i25);
  class pr {
    constructor(t, e) {
      this._pdfInfo = t, this._transport = e;
    }
    get pagesMapper() {
      return this._transport.pagesMapper;
    }
    get annotationStorage() {
      return this._transport.annotationStorage;
    }
    get canvasFactory() {
      return this._transport.canvasFactory;
    }
    get filterFactory() {
      return this._transport.filterFactory;
    }
    get numPages() {
      return this._pdfInfo.numPages;
    }
    get fingerprints() {
      return this._pdfInfo.fingerprints;
    }
    get isPureXfa() {
      return L(this, "isPureXfa", !!this._transport._htmlForXfa);
    }
    get allXfaHtml() {
      return this._transport._htmlForXfa;
    }
    getPage(t) {
      return this._transport.getPage(t);
    }
    getPageIndex(t) {
      return this._transport.getPageIndex(t);
    }
    getDestinations() {
      return this._transport.getDestinations();
    }
    getDestination(t) {
      return this._transport.getDestination(t);
    }
    getPageLabels() {
      return this._transport.getPageLabels();
    }
    getPageLayout() {
      return this._transport.getPageLayout();
    }
    getPageMode() {
      return this._transport.getPageMode();
    }
    getViewerPreferences() {
      return this._transport.getViewerPreferences();
    }
    getOpenAction() {
      return this._transport.getOpenAction();
    }
    getAttachments() {
      return this._transport.getAttachments();
    }
    getAnnotationsByType(t, e) {
      return this._transport.getAnnotationsByType(t, e);
    }
    getJSActions() {
      return this._transport.getDocJSActions();
    }
    getOutline() {
      return this._transport.getOutline();
    }
    getOptionalContentConfig({ intent: t = "display" } = {}) {
      const { renderingIntent: e } = this._transport.getRenderingIntent(t);
      return this._transport.getOptionalContentConfig(e);
    }
    getPermissions() {
      return this._transport.getPermissions();
    }
    getMetadata() {
      return this._transport.getMetadata();
    }
    getMarkInfo() {
      return this._transport.getMarkInfo();
    }
    getData() {
      return this._transport.getData();
    }
    saveDocument() {
      return this._transport.saveDocument();
    }
    extractPages(t) {
      return this._transport.extractPages(t);
    }
    getDownloadInfo() {
      return this._transport.downloadInfoCapability.promise;
    }
    cleanup(t = false) {
      return this._transport.startCleanup(t || this.isPureXfa);
    }
    destroy() {
      return this.loadingTask.destroy();
    }
    cachedPageNumber(t) {
      return this._transport.cachedPageNumber(t);
    }
    get loadingParams() {
      return this._transport.loadingParams;
    }
    get loadingTask() {
      return this._transport.loadingTask;
    }
    getFieldObjects() {
      return this._transport.getFieldObjects();
    }
    hasJSActions() {
      return this._transport.hasJSActions();
    }
    getCalculationOrderIds() {
      return this._transport.getCalculationOrderIds();
    }
  }
  class gr {
    constructor(t, e, s, i, n = false) {
      __privateAdd(this, _gr_instances);
      __privateAdd(this, _t45, false);
      __privateAdd(this, _e31, null);
      this._pageIndex = t, this._pageInfo = e, this._transport = s, this._stats = n ? new Bs() : null, this._pdfBug = n, this.commonObjs = s.commonObjs, this.objs = new Li(), this._intentStates = /* @__PURE__ */ new Map(), this.destroyed = false, this.recordedBBoxes = null, __privateSet(this, _e31, i);
    }
    get pageNumber() {
      return this._pageIndex + 1;
    }
    set pageNumber(t) {
      this._pageIndex = t - 1;
    }
    get rotate() {
      return this._pageInfo.rotate;
    }
    get ref() {
      return this._pageInfo.ref;
    }
    get userUnit() {
      return this._pageInfo.userUnit;
    }
    get view() {
      return this._pageInfo.view;
    }
    getViewport({ scale: t, rotation: e = this.rotate, offsetX: s = 0, offsetY: i = 0, dontFlip: n = false } = {}) {
      return new me({
        viewBox: this.view,
        userUnit: this.userUnit,
        scale: t,
        rotation: e,
        offsetX: s,
        offsetY: i,
        dontFlip: n
      });
    }
    getAnnotations({ intent: t = "display" } = {}) {
      const { renderingIntent: e } = this._transport.getRenderingIntent(t);
      return this._transport.getAnnotations(this._pageIndex, e);
    }
    getJSActions() {
      return this._transport.getPageJSActions(this._pageIndex);
    }
    get filterFactory() {
      return this._transport.filterFactory;
    }
    get isPureXfa() {
      return L(this, "isPureXfa", !!this._transport._htmlForXfa);
    }
    async getXfa() {
      var _a29;
      return ((_a29 = this._transport._htmlForXfa) == null ? void 0 : _a29.children[this._pageIndex]) || null;
    }
    render({ canvasContext: t, canvas: e = t.canvas, viewport: s, intent: i = "display", annotationMode: n = Lt.ENABLE, transform: r = null, background: a = null, optionalContentConfigPromise: o = null, annotationCanvasMap: l = null, pageColors: h = null, printAnnotationStorage: c = null, isEditing: u = false, recordOperations: f = false, operationsFilter: g = null }) {
      var _a29, _b7, _c10;
      (_a29 = this._stats) == null ? void 0 : _a29.time("Overall");
      const p = this._transport.getRenderingIntent(i, n, c, u), { renderingIntent: b, cacheKey: m } = p;
      __privateSet(this, _t45, false), o || (o = this._transport.getOptionalContentConfig(b));
      const A = this._intentStates.getOrInsertComputed(m, os);
      A.streamReaderCancelTimeout && (clearTimeout(A.streamReaderCancelTimeout), A.streamReaderCancelTimeout = null);
      const y = !!(b & gt.PRINT);
      A.displayReadyCapability || (A.displayReadyCapability = Promise.withResolvers(), A.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
        separateAnnots: null
      }, (_b7 = this._stats) == null ? void 0 : _b7.time("Page Request"), this._pumpOperatorList(p));
      const v = !!(this._pdfBug && ((_c10 = globalThis.StepperManager) == null ? void 0 : _c10.enabled)), w = !this.recordedBBoxes && (f || v), S = (C) => {
        var _a30, _b8;
        if (A.renderTasks.delete(E), w) {
          const k = (_a30 = E.gfx) == null ? void 0 : _a30.dependencyTracker.take();
          k && (E.stepper && E.stepper.setOperatorBBoxes(k, E.gfx.dependencyTracker.takeDebugMetadata()), f && (this.recordedBBoxes = k));
        }
        y && __privateSet(this, _t45, true), __privateMethod(this, _gr_instances, i_fn6).call(this), C ? (E.capability.reject(C), this._abortOperatorList({
          intentState: A,
          reason: C instanceof Error ? C : new Error(C)
        })) : E.capability.resolve(), this._stats && (this._stats.timeEnd("Rendering"), this._stats.timeEnd("Overall"), ((_b8 = globalThis.Stats) == null ? void 0 : _b8.enabled) && globalThis.Stats.add(this.pageNumber, this._stats));
      }, E = new Xt({
        callback: S,
        params: {
          canvas: e,
          canvasContext: t,
          dependencyTracker: w ? new Rn(e, A.operatorList.length, v) : null,
          viewport: s,
          transform: r,
          background: a
        },
        objs: this.objs,
        commonObjs: this.commonObjs,
        annotationCanvasMap: l,
        operatorList: A.operatorList,
        pageIndex: this._pageIndex,
        canvasFactory: this._transport.canvasFactory,
        filterFactory: this._transport.filterFactory,
        useRequestAnimationFrame: !y,
        pdfBug: this._pdfBug,
        pageColors: h,
        enableHWA: this._transport.enableHWA,
        operationsFilter: g
      });
      (A.renderTasks || (A.renderTasks = /* @__PURE__ */ new Set())).add(E);
      const _ = E.task;
      return Promise.all([
        A.displayReadyCapability.promise,
        o
      ]).then(([C, k]) => {
        var _a30;
        if (this.destroyed) {
          S();
          return;
        }
        if ((_a30 = this._stats) == null ? void 0 : _a30.time("Rendering"), !(k.renderingIntent & b)) throw new Error("Must use the same `intent`-argument when calling the `PDFPageProxy.render` and `PDFDocumentProxy.getOptionalContentConfig` methods.");
        E.initializeGraphics({
          transparency: C,
          optionalContentConfig: k
        }), E.operatorListChanged();
      }).catch(S), _;
    }
    getOperatorList({ intent: t = "display", annotationMode: e = Lt.ENABLE, printAnnotationStorage: s = null, isEditing: i = false } = {}) {
      var _a29;
      function n() {
        a.operatorList.lastChunk && (a.opListReadCapability.resolve(a.operatorList), a.renderTasks.delete(o));
      }
      const r = this._transport.getRenderingIntent(t, e, s, i, true), a = this._intentStates.getOrInsertComputed(r.cacheKey, os);
      let o;
      return a.opListReadCapability || (o = /* @__PURE__ */ Object.create(null), o.operatorListChanged = n, a.opListReadCapability = Promise.withResolvers(), (a.renderTasks || (a.renderTasks = /* @__PURE__ */ new Set())).add(o), a.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
        separateAnnots: null
      }, (_a29 = this._stats) == null ? void 0 : _a29.time("Page Request"), this._pumpOperatorList(r)), a.opListReadCapability.promise;
    }
    streamTextContent({ includeMarkedContent: t = false, disableNormalization: e = false } = {}) {
      return this._transport.messageHandler.sendWithStream("GetTextContent", {
        pageId: __privateGet(this, _e31).getPageId(this._pageIndex + 1) - 1,
        pageIndex: this._pageIndex,
        includeMarkedContent: t === true,
        disableNormalization: e === true
      }, {
        highWaterMark: 100,
        size(i) {
          return i.items.length;
        }
      });
    }
    async getTextContent(t = {}) {
      if (this._transport._htmlForXfa) return this.getXfa().then((i) => ue.textContent(i));
      const e = this.streamTextContent(t), s = {
        items: [],
        styles: /* @__PURE__ */ Object.create(null),
        lang: null
      };
      for await (const i of e) s.lang ?? (s.lang = i.lang), Object.assign(s.styles, i.styles), s.items.push(...i.items);
      return s;
    }
    getStructTree() {
      return this._transport.getStructTree(this._pageIndex);
    }
    _destroy() {
      this.destroyed = true;
      const t = [];
      for (const e of this._intentStates.values()) if (this._abortOperatorList({
        intentState: e,
        reason: new Error("Page was destroyed."),
        force: true
      }), !e.opListReadCapability) for (const s of e.renderTasks) t.push(s.completed), s.cancel();
      return this.objs.clear(), __privateSet(this, _t45, false), Promise.all(t);
    }
    cleanup(t = false) {
      __privateSet(this, _t45, true);
      const e = __privateMethod(this, _gr_instances, i_fn6).call(this);
      return t && e && (this._stats && (this._stats = new Bs())), e;
    }
    _startRenderPage(t, e) {
      var _a29, _b7;
      const s = this._intentStates.get(e);
      s && ((_a29 = this._stats) == null ? void 0 : _a29.timeEnd("Page Request"), (_b7 = s.displayReadyCapability) == null ? void 0 : _b7.resolve(t));
    }
    _renderPageChunk(t, e) {
      for (let s = 0, i = t.length; s < i; s++) e.operatorList.fnArray.push(t.fnArray[s]), e.operatorList.argsArray.push(t.argsArray[s]);
      e.operatorList.lastChunk = t.lastChunk, e.operatorList.separateAnnots = t.separateAnnots;
      for (const s of e.renderTasks) s.operatorListChanged();
      t.lastChunk && __privateMethod(this, _gr_instances, i_fn6).call(this);
    }
    _pumpOperatorList({ renderingIntent: t, cacheKey: e, annotationStorageSerializable: s, modifiedIds: i }) {
      const { map: n, transfer: r } = s, o = this._transport.messageHandler.sendWithStream("GetOperatorList", {
        pageId: __privateGet(this, _e31).getPageId(this._pageIndex + 1) - 1,
        pageIndex: this._pageIndex,
        intent: t,
        cacheKey: e,
        annotationStorage: n,
        modifiedIds: i
      }, void 0, r).getReader(), l = this._intentStates.get(e);
      l.streamReader = o;
      const h = () => {
        o.read().then(({ value: c, done: u }) => {
          if (u) {
            l.streamReader = null;
            return;
          }
          this._transport.destroyed || (this._renderPageChunk(c, l), h());
        }, (c) => {
          if (l.streamReader = null, !this._transport.destroyed) {
            if (l.operatorList) {
              l.operatorList.lastChunk = true;
              for (const u of l.renderTasks) u.operatorListChanged();
              __privateMethod(this, _gr_instances, i_fn6).call(this);
            }
            if (l.displayReadyCapability) l.displayReadyCapability.reject(c);
            else if (l.opListReadCapability) l.opListReadCapability.reject(c);
            else throw c;
          }
        });
      };
      h();
    }
    _abortOperatorList({ intentState: t, reason: e, force: s = false }) {
      if (t.streamReader) {
        if (t.streamReaderCancelTimeout && (clearTimeout(t.streamReaderCancelTimeout), t.streamReaderCancelTimeout = null), !s) {
          if (t.renderTasks.size > 0) return;
          if (e instanceof As) {
            let i = ur;
            e.extraDelay > 0 && e.extraDelay < 1e3 && (i += e.extraDelay), t.streamReaderCancelTimeout = setTimeout(() => {
              t.streamReaderCancelTimeout = null, this._abortOperatorList({
                intentState: t,
                reason: e,
                force: true
              });
            }, i);
            return;
          }
        }
        if (t.streamReader.cancel(new Rt(e.message)).catch(() => {
        }), t.streamReader = null, !this._transport.destroyed) {
          for (const [i, n] of this._intentStates) if (n === t) {
            this._intentStates.delete(i);
            break;
          }
          this.cleanup();
        }
      }
    }
    get stats() {
      return this._stats;
    }
  }
  _t45 = new WeakMap();
  _e31 = new WeakMap();
  _gr_instances = new WeakSet();
  i_fn6 = function() {
    if (!__privateGet(this, _t45) || this.destroyed) return false;
    for (const { renderTasks: t, operatorList: e } of this._intentStates.values()) if (t.size > 0 || !e.lastChunk) return false;
    return this._intentStates.clear(), this.objs.clear(), __privateSet(this, _t45, false), true;
  };
  ht = (_j2 = class {
    constructor({ name: t = null, port: e = null, verbosity: s = Yi() } = {}) {
      __privateAdd(this, __this_instances);
      __privateAdd(this, _t46, Promise.withResolvers());
      __privateAdd(this, _e32, null);
      __privateAdd(this, _i26, null);
      __privateAdd(this, _s21, null);
      if (this.name = t, this.destroyed = false, this.verbosity = s, e) {
        if (__privateGet(ht, _n14).has(e)) throw new Error("Cannot use more than one PDFWorker per port.");
        __privateGet(ht, _n14).set(e, this), __privateMethod(this, __this_instances, h_fn3).call(this, e);
      } else __privateMethod(this, __this_instances, l_fn4).call(this);
    }
    get promise() {
      return __privateGet(this, _t46).promise;
    }
    get port() {
      return __privateGet(this, _i26);
    }
    get messageHandler() {
      return __privateGet(this, _e32);
    }
    destroy() {
      var _a29, _b7;
      this.destroyed = true, (_a29 = __privateGet(this, _s21)) == null ? void 0 : _a29.terminate(), __privateSet(this, _s21, null), __privateGet(ht, _n14).delete(__privateGet(this, _i26)), __privateSet(this, _i26, null), (_b7 = __privateGet(this, _e32)) == null ? void 0 : _b7.destroy(), __privateSet(this, _e32, null);
    }
    static create(t) {
      const e = __privateGet(this, _n14).get(t == null ? void 0 : t.port);
      if (e) {
        if (e._pendingDestroy) throw new Error("PDFWorker.create - the worker is being destroyed.\nPlease remember to await `PDFDocumentLoadingTask.destroy()`-calls.");
        return e;
      }
      return new ht(t);
    }
    static get workerSrc() {
      if (he.workerSrc) return he.workerSrc;
      throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
    }
    static get _setupFakeWorkerGlobal() {
      return L(this, "_setupFakeWorkerGlobal", (async () => __privateGet(this, __this_static, d_get) ? __privateGet(this, __this_static, d_get) : (await import(this.workerSrc).then(async (m) => {
        await m.__tla;
        return m;
      })).WorkerMessageHandler)());
    }
  }, _t46 = new WeakMap(), _e32 = new WeakMap(), _i26 = new WeakMap(), _s21 = new WeakMap(), _a15 = new WeakMap(), _r14 = new WeakMap(), _n14 = new WeakMap(), __this_instances = new WeakSet(), o_fn2 = function() {
    __privateGet(this, _t46).resolve(), __privateGet(this, _e32).send("configure", {
      verbosity: this.verbosity
    });
  }, h_fn3 = function(t) {
    __privateSet(this, _i26, t), __privateSet(this, _e32, new ae("main", "worker", t)), __privateGet(this, _e32).on("ready", () => {
    }), __privateMethod(this, __this_instances, o_fn2).call(this);
  }, l_fn4 = function() {
    if (__privateGet(ht, _r14) || __privateGet(ht, __this_static, d_get)) {
      __privateMethod(this, __this_instances, u_fn6).call(this);
      return;
    }
    let { workerSrc: t } = ht;
    try {
      ht._isSameOrigin(window.location, t) || (t = ht._createCDNWrapper(new URL(t, window.location).href));
      const e = new Worker(t, {
        type: "module"
      }), s = new ae("main", "worker", e), i = () => {
        n.abort(), s.destroy(), e.terminate(), this.destroyed ? __privateGet(this, _t46).reject(new Error("Worker was destroyed")) : __privateMethod(this, __this_instances, u_fn6).call(this);
      }, n = new AbortController();
      e.addEventListener("error", () => {
        __privateGet(this, _s21) || i();
      }, {
        signal: n.signal
      }), s.on("test", (a) => {
        if (n.abort(), this.destroyed || !a) {
          i();
          return;
        }
        __privateSet(this, _e32, s), __privateSet(this, _i26, e), __privateSet(this, _s21, e), __privateMethod(this, __this_instances, o_fn2).call(this);
      }), s.on("ready", (a) => {
        if (n.abort(), this.destroyed) {
          i();
          return;
        }
        try {
          r();
        } catch {
          __privateMethod(this, __this_instances, u_fn6).call(this);
        }
      });
      const r = () => {
        const a = new Uint8Array();
        s.send("test", a, [
          a.buffer
        ]);
      };
      r();
      return;
    } catch {
      Fe("The worker has been disabled.");
    }
    __privateMethod(this, __this_instances, u_fn6).call(this);
  }, u_fn6 = function() {
    __privateGet(ht, _r14) || (F("Setting up fake worker."), __privateSet(ht, _r14, true)), ht._setupFakeWorkerGlobal.then((t) => {
      if (this.destroyed) {
        __privateGet(this, _t46).reject(new Error("Worker was destroyed"));
        return;
      }
      const e = new Cn();
      __privateSet(this, _i26, e);
      const s = `fake${__privateWrapper(ht, _a15)._++}`, i = new ae(s + "_worker", s, e);
      t.setup(i, e), __privateSet(this, _e32, new ae(s, s + "_worker", e)), __privateMethod(this, __this_instances, o_fn2).call(this);
    }).catch((t) => {
      __privateGet(this, _t46).reject(new Error(`Setting up fake worker failed: "${t.message}".`));
    });
  }, __this_static = new WeakSet(), d_get = function() {
    var _a29;
    try {
      return ((_a29 = globalThis.pdfjsWorker) == null ? void 0 : _a29.WorkerMessageHandler) || null;
    } catch {
      return null;
    }
  }, __privateAdd(_j2, __this_static), __privateAdd(_j2, _a15, 0), __privateAdd(_j2, _r14, false), __privateAdd(_j2, _n14, /* @__PURE__ */ new WeakMap()), dt && (__privateSet(_j2, _r14, true), he.workerSrc || (he.workerSrc = "./pdf.worker.mjs")), _j2._isSameOrigin = (t, e) => {
    const s = URL.parse(t);
    if (!(s == null ? void 0 : s.origin) || s.origin === "null") return false;
    const i = new URL(e, s);
    return s.origin === i.origin;
  }, _j2._createCDNWrapper = (t) => {
    const e = `await import("${t}");`;
    return URL.createObjectURL(new Blob([
      e
    ], {
      type: "text/javascript"
    }));
  }, _j2.fromPort = (t) => {
    if (gi("`PDFWorker.fromPort` - please use `PDFWorker.create` instead."), !(t == null ? void 0 : t.port)) throw new Error("PDFWorker.fromPort - invalid method signature.");
    return _j2.create(t);
  }, _j2);
  class mr {
    constructor(t, e, s, i, n, r) {
      __privateAdd(this, _mr_instances);
      __publicField(this, "downloadInfoCapability", Promise.withResolvers());
      __privateAdd(this, _t47, null);
      __privateAdd(this, _e33, /* @__PURE__ */ new Map());
      __privateAdd(this, _i27, null);
      __privateAdd(this, _s22, /* @__PURE__ */ new Map());
      __privateAdd(this, _a16, /* @__PURE__ */ new Map());
      __privateAdd(this, _r15, /* @__PURE__ */ new Map());
      __privateAdd(this, _n15, null);
      __privateAdd(this, _o11, null);
      this.messageHandler = t, this.loadingTask = e, __privateSet(this, _i27, s), this.commonObjs = new Li(), this.fontLoader = new yn({
        ownerDocument: i.ownerDocument,
        styleElement: i.styleElement
      }), this.enableHWA = i.enableHWA, this.loadingParams = i.loadingParams, this._params = i, this.canvasFactory = n.canvasFactory, this.filterFactory = n.filterFactory, this.cMapReaderFactory = n.cMapReaderFactory, this.standardFontDataFactory = n.standardFontDataFactory, this.wasmFactory = n.wasmFactory, this.destroyed = false, this.destroyCapability = null, this.setupMessageHandler(), this.pagesMapper = r, this.pagesMapper.addListener(__privateMethod(this, _mr_instances, h_fn4).bind(this));
    }
    get annotationStorage() {
      return L(this, "annotationStorage", new Es());
    }
    getRenderingIntent(t, e = Lt.ENABLE, s = null, i = false, n = false) {
      let r = gt.DISPLAY, a = fe;
      switch (t) {
        case "any":
          r = gt.ANY;
          break;
        case "display":
          break;
        case "print":
          r = gt.PRINT;
          break;
        default:
          F(`getRenderingIntent - invalid intent: ${t}`);
      }
      const o = r & gt.PRINT && s instanceof wi ? s : this.annotationStorage;
      switch (e) {
        case Lt.DISABLE:
          r += gt.ANNOTATIONS_DISABLE;
          break;
        case Lt.ENABLE:
          break;
        case Lt.ENABLE_FORMS:
          r += gt.ANNOTATIONS_FORMS;
          break;
        case Lt.ENABLE_STORAGE:
          r += gt.ANNOTATIONS_STORAGE, a = o.serializable;
          break;
        default:
          F(`getRenderingIntent - invalid annotationMode: ${e}`);
      }
      i && (r += gt.IS_EDITING), n && (r += gt.OPLIST);
      const { ids: l, hash: h } = o.modifiedIds, c = [
        r,
        a.hash,
        h
      ];
      return {
        renderingIntent: r,
        cacheKey: c.join("_"),
        annotationStorageSerializable: a,
        modifiedIds: l
      };
    }
    destroy() {
      var _a29;
      if (this.destroyCapability) return this.destroyCapability.promise;
      this.destroyed = true, this.destroyCapability = Promise.withResolvers(), (_a29 = __privateGet(this, _n15)) == null ? void 0 : _a29.reject(new Error("Worker was destroyed during onPassword callback"));
      const t = [];
      for (const s of __privateGet(this, _s22).values()) t.push(s._destroy());
      __privateGet(this, _s22).clear(), __privateGet(this, _a16).clear(), __privateGet(this, _r15).clear(), this.hasOwnProperty("annotationStorage") && this.annotationStorage.resetModified();
      const e = this.messageHandler.sendWithPromise("Terminate", null);
      return t.push(e), Promise.all(t).then(() => {
        var _a30, _b7;
        this.commonObjs.clear(), this.fontLoader.clear(), __privateGet(this, _e33).clear(), this.filterFactory.destroy(), mt.cleanup(), (_a30 = __privateGet(this, _i27)) == null ? void 0 : _a30.cancelAllRequests(new Rt("Worker was terminated.")), (_b7 = this.messageHandler) == null ? void 0 : _b7.destroy(), this.messageHandler = null, this.destroyCapability.resolve();
      }, this.destroyCapability.reject), this.destroyCapability.promise;
    }
    setupMessageHandler() {
      const { messageHandler: t, loadingTask: e } = this;
      t.on("GetReader", (s, i) => {
        B(__privateGet(this, _i27), "GetReader - no `BasePDFStream` instance available."), __privateSet(this, _t47, __privateGet(this, _i27).getFullReader()), __privateGet(this, _t47).onProgress = (n) => __privateMethod(this, _mr_instances, u_fn7).call(this, n), i.onPull = () => {
          __privateGet(this, _t47).read().then(function({ value: n, done: r }) {
            if (r) {
              i.close();
              return;
            }
            B(n instanceof ArrayBuffer, "GetReader - expected an ArrayBuffer."), i.enqueue(new Uint8Array(n), 1, [
              n
            ]);
          }).catch((n) => {
            i.error(n);
          });
        }, i.onCancel = (n) => {
          __privateGet(this, _t47).cancel(n), i.ready.catch((r) => {
            if (!this.destroyed) throw r;
          });
        };
      }), t.on("ReaderHeadersReady", async (s) => {
        await __privateGet(this, _t47).headersReady;
        const { isStreamingSupported: i, isRangeSupported: n, contentLength: r } = __privateGet(this, _t47);
        return i && n && (__privateGet(this, _t47).onProgress = null), {
          isStreamingSupported: i,
          isRangeSupported: n,
          contentLength: r
        };
      }), t.on("GetRangeReader", (s, i) => {
        B(__privateGet(this, _i27), "GetRangeReader - no `BasePDFStream` instance available.");
        const n = __privateGet(this, _i27).getRangeReader(s.begin, s.end);
        if (!n) {
          i.close();
          return;
        }
        i.onPull = () => {
          n.read().then(function({ value: r, done: a }) {
            if (a) {
              i.close();
              return;
            }
            B(r instanceof ArrayBuffer, "GetRangeReader - expected an ArrayBuffer."), i.enqueue(new Uint8Array(r), 1, [
              r
            ]);
          }).catch((r) => {
            i.error(r);
          });
        }, i.onCancel = (r) => {
          n.cancel(r), i.ready.catch((a) => {
            if (!this.destroyed) throw a;
          });
        };
      }), t.on("GetDoc", ({ pdfInfo: s }) => {
        this.pagesMapper.pagesNumber = s.numPages, this._numPages = s.numPages, this._htmlForXfa = s.htmlForXfa, delete s.htmlForXfa, e._capability.resolve(new pr(s, this));
      }), t.on("DocException", (s) => {
        e._capability.reject(ut(s));
      }), t.on("PasswordRequest", (s) => {
        __privateSet(this, _n15, Promise.withResolvers());
        try {
          if (!e.onPassword) throw ut(s);
          const i = (n) => {
            n instanceof Error ? __privateGet(this, _n15).reject(n) : __privateGet(this, _n15).resolve({
              password: n
            });
          };
          e.onPassword(i, s.code);
        } catch (i) {
          __privateGet(this, _n15).reject(i);
        }
        return __privateGet(this, _n15).promise;
      }), t.on("DataLoaded", (s) => {
        __privateMethod(this, _mr_instances, u_fn7).call(this, {
          loaded: s.length,
          total: s.length
        }), this.downloadInfoCapability.resolve(s);
      }), t.on("StartRenderPage", (s) => {
        if (this.destroyed) return;
        __privateGet(this, _s22).get(s.pageIndex)._startRenderPage(s.transparency, s.cacheKey);
      }), t.on("commonobj", ([s, i, n]) => {
        var _a29;
        if (this.destroyed || this.commonObjs.has(s)) return null;
        switch (i) {
          case "Font":
            if ("error" in n) {
              const c = n.error;
              F(`Error during font loading: ${c}`), this.commonObjs.resolve(s, c);
              break;
            }
            const r = new G(n), a = this._params.pdfBug && ((_a29 = globalThis.FontInspector) == null ? void 0 : _a29.enabled) ? (c, u) => globalThis.FontInspector.fontAdded(c, u) : null, o = new An(r, a, n.extra, n.charProcOperatorList);
            this.fontLoader.bind(o).catch(() => t.sendWithPromise("FontFallback", {
              id: s
            })).finally(() => {
              !o.fontExtraProperties && o.data && o.clearData(), this.commonObjs.resolve(s, o);
            });
            break;
          case "CopyLocalImage":
            const { imageRef: l } = n;
            B(l, "The imageRef must be defined.");
            for (const c of __privateGet(this, _s22).values()) for (const [, u] of c.objs) if ((u == null ? void 0 : u.ref) === l) return u.dataLen ? (this.commonObjs.resolve(s, structuredClone(u)), u.dataLen) : null;
            break;
          case "FontPath":
            this.commonObjs.resolve(s, new wn(n));
            break;
          case "Image":
            this.commonObjs.resolve(s, n);
            break;
          case "Pattern":
            const h = new rt(n);
            this.commonObjs.resolve(s, h.getIR());
            break;
          default:
            throw new Error(`Got unknown common object type ${i}`);
        }
        return null;
      }), t.on("obj", ([s, i, n, r]) => {
        var _a29;
        if (this.destroyed) return;
        const a = __privateGet(this, _s22).get(i);
        if (!a.objs.has(s)) {
          if (a._intentStates.size === 0) {
            (_a29 = r == null ? void 0 : r.bitmap) == null ? void 0 : _a29.close();
            return;
          }
          switch (n) {
            case "Image":
            case "Pattern":
              a.objs.resolve(s, r);
              break;
            default:
              throw new Error(`Got unknown object type ${n}`);
          }
        }
      }), t.on("DocProgress", (s) => {
        this.destroyed || __privateMethod(this, _mr_instances, u_fn7).call(this, s);
      }), t.on("FetchBinaryData", async (s) => {
        if (this.destroyed) throw new Error("Worker was destroyed.");
        const i = this[s.type];
        if (!i) throw new Error(`${s.type} not initialized, see the \`useWorkerFetch\` parameter.`);
        return i.fetch(s);
      });
    }
    getData() {
      return this.messageHandler.sendWithPromise("GetData", null);
    }
    saveDocument() {
      var _a29;
      this.annotationStorage.size <= 0 && F("saveDocument called while `annotationStorage` is empty, please use the getData-method instead.");
      const { map: t, transfer: e } = this.annotationStorage.serializable;
      return this.messageHandler.sendWithPromise("SaveDocument", {
        isPureXfa: !!this._htmlForXfa,
        numPages: this._numPages,
        annotationStorage: t,
        filename: ((_a29 = __privateGet(this, _t47)) == null ? void 0 : _a29.filename) ?? null
      }, e).finally(() => {
        this.annotationStorage.resetModified();
      });
    }
    extractPages(t) {
      return this.messageHandler.sendWithPromise("ExtractPages", {
        pageInfos: t
      });
    }
    getPage(t) {
      if (!Number.isInteger(t) || t <= 0 || t > this.pagesMapper.pagesNumber) return Promise.reject(new Error("Invalid page request."));
      const e = t - 1, s = this.pagesMapper.getPageId(t) - 1, i = __privateGet(this, _a16).get(e);
      if (i) return i;
      const n = this.messageHandler.sendWithPromise("GetPage", {
        pageIndex: s
      }).then((r) => {
        if (this.destroyed) throw new Error("Transport destroyed");
        r.refStr && __privateGet(this, _r15).set(r.refStr, s);
        const a = new gr(e, r, this, this.pagesMapper, this._params.pdfBug);
        return __privateGet(this, _s22).set(e, a), a;
      });
      return __privateGet(this, _a16).set(e, n), n;
    }
    async getPageIndex(t) {
      if (!ds(t)) throw new Error("Invalid pageIndex request.");
      const e = await this.messageHandler.sendWithPromise("GetPageIndex", {
        num: t.num,
        gen: t.gen
      }), s = this.pagesMapper.getPageNumber(e + 1);
      if (s === 0) throw new Error("GetPageIndex: page has been removed.");
      return s - 1;
    }
    getAnnotations(t, e) {
      return this.messageHandler.sendWithPromise("GetAnnotations", {
        pageIndex: this.pagesMapper.getPageId(t + 1) - 1,
        intent: e
      });
    }
    getFieldObjects() {
      return __privateMethod(this, _mr_instances, l_fn5).call(this, "GetFieldObjects");
    }
    hasJSActions() {
      return __privateMethod(this, _mr_instances, l_fn5).call(this, "HasJSActions");
    }
    getCalculationOrderIds() {
      return this.messageHandler.sendWithPromise("GetCalculationOrderIds", null);
    }
    getDestinations() {
      return this.messageHandler.sendWithPromise("GetDestinations", null);
    }
    getDestination(t) {
      return typeof t != "string" ? Promise.reject(new Error("Invalid destination request.")) : this.messageHandler.sendWithPromise("GetDestination", {
        id: t
      });
    }
    getPageLabels() {
      return this.messageHandler.sendWithPromise("GetPageLabels", null);
    }
    getPageLayout() {
      return this.messageHandler.sendWithPromise("GetPageLayout", null);
    }
    getPageMode() {
      return this.messageHandler.sendWithPromise("GetPageMode", null);
    }
    getViewerPreferences() {
      return this.messageHandler.sendWithPromise("GetViewerPreferences", null);
    }
    getOpenAction() {
      return this.messageHandler.sendWithPromise("GetOpenAction", null);
    }
    getAttachments() {
      return this.messageHandler.sendWithPromise("GetAttachments", null);
    }
    getAnnotationsByType(t, e) {
      return this.messageHandler.sendWithPromise("GetAnnotationsByType", {
        types: t,
        pageIndexesToSkip: e
      });
    }
    getDocJSActions() {
      return __privateMethod(this, _mr_instances, l_fn5).call(this, "GetDocJSActions");
    }
    getPageJSActions(t) {
      return this.messageHandler.sendWithPromise("GetPageJSActions", {
        pageIndex: this.pagesMapper.getPageId(t + 1) - 1
      });
    }
    getStructTree(t) {
      return this.messageHandler.sendWithPromise("GetStructTree", {
        pageIndex: this.pagesMapper.getPageId(t + 1) - 1
      });
    }
    getOutline() {
      return this.messageHandler.sendWithPromise("GetOutline", null);
    }
    getOptionalContentConfig(t) {
      return __privateMethod(this, _mr_instances, l_fn5).call(this, "GetOptionalContentConfig").then((e) => new qn(e, t));
    }
    getPermissions() {
      return this.messageHandler.sendWithPromise("GetPermissions", null);
    }
    getMetadata() {
      const t = "GetMetadata";
      return __privateGet(this, _e33).getOrInsertComputed(t, () => this.messageHandler.sendWithPromise(t, null).then((e) => {
        var _a29, _b7;
        return {
          info: e[0],
          metadata: e[1] ? new Xn(e[1]) : null,
          contentDispositionFilename: ((_a29 = __privateGet(this, _t47)) == null ? void 0 : _a29.filename) ?? null,
          contentLength: ((_b7 = __privateGet(this, _t47)) == null ? void 0 : _b7.contentLength) ?? null,
          hasStructTree: e[2]
        };
      }));
    }
    getMarkInfo() {
      return this.messageHandler.sendWithPromise("GetMarkInfo", null);
    }
    async startCleanup(t = false) {
      if (!this.destroyed) {
        await this.messageHandler.sendWithPromise("Cleanup", null);
        for (const e of __privateGet(this, _s22).values()) if (!e.cleanup()) throw new Error(`startCleanup: Page ${e.pageNumber} is currently rendering.`);
        this.commonObjs.clear(), t || this.fontLoader.clear(), __privateGet(this, _e33).clear(), this.filterFactory.destroy(true), mt.cleanup();
      }
    }
    cachedPageNumber(t) {
      if (!ds(t)) return null;
      const e = t.gen === 0 ? `${t.num}R` : `${t.num}R${t.gen}`, s = __privateGet(this, _r15).get(e);
      if (s >= 0) {
        const i = this.pagesMapper.getPageNumber(s + 1);
        if (i !== 0) return i;
      }
      return null;
    }
  }
  _t47 = new WeakMap();
  _e33 = new WeakMap();
  _i27 = new WeakMap();
  _s22 = new WeakMap();
  _a16 = new WeakMap();
  _r15 = new WeakMap();
  _n15 = new WeakMap();
  _o11 = new WeakMap();
  _mr_instances = new WeakSet();
  h_fn4 = function({ type: t, pageNumbers: e }) {
    var _a29;
    if (t === "copy") {
      __privateSet(this, _o11, /* @__PURE__ */ new Map());
      for (const r of e) __privateGet(this, _o11).set(r, {
        proxy: __privateGet(this, _s22).get(r - 1) || null,
        promise: __privateGet(this, _a16).get(r - 1) || null
      });
      return;
    }
    if (t === "delete") for (const r of e) __privateGet(this, _s22).delete(r - 1), __privateGet(this, _a16).delete(r - 1);
    const s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), { pagesMapper: n } = this;
    for (let r = 0, a = n.pagesNumber; r < a; r++) {
      const o = n.getPrevPageNumber(r + 1);
      if (o < 0) {
        const { proxy: u, promise: f } = ((_a29 = __privateGet(this, _o11)) == null ? void 0 : _a29.get(-o)) || {};
        u && s.set(r, u), f && i.set(r, f);
        continue;
      }
      const l = o - 1, h = __privateGet(this, _s22).get(l);
      h && s.set(r, h);
      const c = __privateGet(this, _a16).get(l);
      c && i.set(r, c);
    }
    __privateSet(this, _s22, s), __privateSet(this, _a16, i);
  };
  l_fn5 = function(t, e = null) {
    return __privateGet(this, _e33).getOrInsertComputed(t, () => this.messageHandler.sendWithPromise(t, e));
  };
  u_fn7 = function({ loaded: t, total: e }) {
    var _a29, _b7;
    (_b7 = (_a29 = this.loadingTask).onProgress) == null ? void 0 : _b7.call(_a29, {
      loaded: t,
      total: e,
      percent: ot(Math.round(t / e * 100), 0, 100)
    });
  };
  class br {
    constructor(t) {
      __publicField(this, "_internalRenderTask", null);
      __publicField(this, "onContinue", null);
      __publicField(this, "onError", null);
      this._internalRenderTask = t;
    }
    get promise() {
      return this._internalRenderTask.capability.promise;
    }
    cancel(t = 0) {
      this._internalRenderTask.cancel(null, t);
    }
    get separateAnnots() {
      const { separateAnnots: t } = this._internalRenderTask.operatorList;
      if (!t) return false;
      const { annotationCanvasMap: e } = this._internalRenderTask;
      return t.form || t.canvas && (e == null ? void 0 : e.size) > 0;
    }
  }
  const _Xt = class _Xt {
    constructor({ callback: t, params: e, objs: s, commonObjs: i, annotationCanvasMap: n, operatorList: r, pageIndex: a, canvasFactory: o, filterFactory: l, useRequestAnimationFrame: h = false, pdfBug: c = false, pageColors: u = null, enableHWA: f = false, operationsFilter: g = null }) {
      __privateAdd(this, _t48, null);
      this.callback = t, this.params = e, this.objs = s, this.commonObjs = i, this.annotationCanvasMap = n, this.operatorListIdx = null, this.operatorList = r, this._pageIndex = a, this.canvasFactory = o, this.filterFactory = l, this._pdfBug = c, this.pageColors = u, this.running = false, this.graphicsReadyCallback = null, this.graphicsReady = false, this._useRequestAnimationFrame = h === true && typeof window < "u", this.cancelled = false, this.capability = Promise.withResolvers(), this.task = new br(this), this._cancelBound = this.cancel.bind(this), this._continueBound = this._continue.bind(this), this._scheduleNextBound = this._scheduleNext.bind(this), this._nextBound = this._next.bind(this), this._canvas = e.canvas, this._canvasContext = e.canvas ? null : e.canvasContext, this._enableHWA = f, this._dependencyTracker = e.dependencyTracker, this._operationsFilter = g;
    }
    get completed() {
      return this.capability.promise.catch(function() {
      });
    }
    initializeGraphics({ transparency: t = false, optionalContentConfig: e }) {
      var _a29, _b7;
      if (this.cancelled) return;
      if (this._canvas) {
        if (__privateGet(_Xt, _e34).has(this._canvas)) throw new Error("Cannot use the same canvas during multiple render() operations. Use different canvas or ensure previous operations were cancelled or completed.");
        __privateGet(_Xt, _e34).add(this._canvas);
      }
      this._pdfBug && ((_a29 = globalThis.StepperManager) == null ? void 0 : _a29.enabled) && (this.stepper = globalThis.StepperManager.create(this._pageIndex), this.stepper.init(this.operatorList), this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint());
      const { viewport: s, transform: i, background: n, dependencyTracker: r } = this.params, a = this._canvasContext || this._canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: !this._enableHWA
      });
      this.gfx = new Kt(a, this.commonObjs, this.objs, this.canvasFactory, this.filterFactory, {
        optionalContentConfig: e
      }, this.annotationCanvasMap, this.pageColors, r), this.gfx.beginDrawing({
        transform: i,
        viewport: s,
        transparency: t,
        background: n
      }), this.operatorListIdx = 0, this.graphicsReady = true, (_b7 = this.graphicsReadyCallback) == null ? void 0 : _b7.call(this);
    }
    cancel(t = null, e = 0) {
      var _a29, _b7, _c10;
      this.running = false, this.cancelled = true, (_a29 = this.gfx) == null ? void 0 : _a29.endDrawing(), __privateGet(this, _t48) && (window.cancelAnimationFrame(__privateGet(this, _t48)), __privateSet(this, _t48, null)), __privateGet(_Xt, _e34).delete(this._canvas), t || (t = new As(`Rendering cancelled, page ${this._pageIndex + 1}`, e)), this.callback(t), (_c10 = (_b7 = this.task).onError) == null ? void 0 : _c10.call(_b7, t);
    }
    operatorListChanged() {
      var _a29, _b7;
      if (!this.graphicsReady) {
        this.graphicsReadyCallback || (this.graphicsReadyCallback = this._continueBound);
        return;
      }
      (_a29 = this.gfx.dependencyTracker) == null ? void 0 : _a29.growOperationsCount(this.operatorList.fnArray.length), (_b7 = this.stepper) == null ? void 0 : _b7.updateOperatorList(this.operatorList), !this.running && this._continue();
    }
    _continue() {
      this.running = true, !this.cancelled && (this.task.onContinue ? this.task.onContinue(this._scheduleNextBound) : this._scheduleNext());
    }
    _scheduleNext() {
      this._useRequestAnimationFrame ? __privateSet(this, _t48, window.requestAnimationFrame(() => {
        __privateSet(this, _t48, null), this._nextBound().catch(this._cancelBound);
      })) : Promise.resolve().then(this._nextBound).catch(this._cancelBound);
    }
    async _next() {
      this.cancelled || (this.operatorListIdx = this.gfx.executeOperatorList(this.operatorList, this.operatorListIdx, this._continueBound, this.stepper, this._operationsFilter), this.operatorListIdx === this.operatorList.argsArray.length && (this.running = false, this.operatorList.lastChunk && (this.gfx.endDrawing(), __privateGet(_Xt, _e34).delete(this._canvas), this.callback())));
    }
  };
  _t48 = new WeakMap();
  _e34 = new WeakMap();
  __privateAdd(_Xt, _e34, /* @__PURE__ */ new WeakSet());
  let Xt = _Xt;
  yr = "5.5.207";
  Ar = "527964698";
  vt = (_k2 = class {
    constructor({ editor: t = null, uiManager: e = null }) {
      __privateAdd(this, _vt_instances);
      __privateAdd(this, _t49, null);
      __privateAdd(this, _e35, null);
      __privateAdd(this, _i28);
      __privateAdd(this, _s23, null);
      __privateAdd(this, _a17, false);
      __privateAdd(this, _r16, false);
      __privateAdd(this, _n16, null);
      __privateAdd(this, _o12);
      __privateAdd(this, _h10, null);
      __privateAdd(this, _l8, null);
      var _a29, _b7;
      t ? (__privateSet(this, _r16, false), __privateSet(this, _n16, t)) : __privateSet(this, _r16, true), __privateSet(this, _l8, (t == null ? void 0 : t._uiManager) || e), __privateSet(this, _o12, __privateGet(this, _l8)._eventBus), __privateSet(this, _i28, ((_a29 = t == null ? void 0 : t.color) == null ? void 0 : _a29.toUpperCase()) || ((_b7 = __privateGet(this, _l8)) == null ? void 0 : _b7.highlightColors.values().next().value) || "#FFFF98"), __privateGet(vt, _u7) || __privateSet(vt, _u7, Object.freeze({
        blue: "pdfjs-editor-colorpicker-blue",
        green: "pdfjs-editor-colorpicker-green",
        pink: "pdfjs-editor-colorpicker-pink",
        red: "pdfjs-editor-colorpicker-red",
        yellow: "pdfjs-editor-colorpicker-yellow"
      }));
    }
    static get _keyboardManager() {
      return L(this, "_keyboardManager", new ye([
        [
          [
            "Escape",
            "mac+Escape"
          ],
          vt.prototype._hideDropdownFromKeyboard
        ],
        [
          [
            " ",
            "mac+ "
          ],
          vt.prototype._colorSelectFromKeyboard
        ],
        [
          [
            "ArrowDown",
            "ArrowRight",
            "mac+ArrowDown",
            "mac+ArrowRight"
          ],
          vt.prototype._moveToNext
        ],
        [
          [
            "ArrowUp",
            "ArrowLeft",
            "mac+ArrowUp",
            "mac+ArrowLeft"
          ],
          vt.prototype._moveToPrevious
        ],
        [
          [
            "Home",
            "mac+Home"
          ],
          vt.prototype._moveToBeginning
        ],
        [
          [
            "End",
            "mac+End"
          ],
          vt.prototype._moveToEnd
        ]
      ]));
    }
    renderButton() {
      const t = __privateSet(this, _t49, document.createElement("button"));
      t.className = "colorPicker", t.tabIndex = "0", t.setAttribute("data-l10n-id", "pdfjs-editor-colorpicker-button"), t.ariaHasPopup = "true", __privateGet(this, _n16) && (t.ariaControls = `${__privateGet(this, _n16).id}_colorpicker_dropdown`);
      const e = __privateGet(this, _l8)._signal;
      t.addEventListener("click", __privateMethod(this, _vt_instances, g_fn4).bind(this), {
        signal: e
      }), t.addEventListener("keydown", __privateMethod(this, _vt_instances, m_fn3).bind(this), {
        signal: e
      });
      const s = __privateSet(this, _e35, document.createElement("span"));
      return s.className = "swatch", s.ariaHidden = "true", s.style.backgroundColor = __privateGet(this, _i28), t.append(s), t;
    }
    renderMainDropdown() {
      const t = __privateSet(this, _s23, __privateMethod(this, _vt_instances, d_fn4).call(this));
      return t.ariaOrientation = "horizontal", t.ariaLabelledBy = "highlightColorPickerLabel", t;
    }
    _colorSelectFromKeyboard(t) {
      if (t.target === __privateGet(this, _t49)) {
        __privateMethod(this, _vt_instances, g_fn4).call(this, t);
        return;
      }
      const e = t.target.getAttribute("data-color");
      e && __privateMethod(this, _vt_instances, f_fn4).call(this, e, t);
    }
    _moveToNext(t) {
      var _a29, _b7;
      if (!__privateGet(this, _vt_instances, p_get)) {
        __privateMethod(this, _vt_instances, g_fn4).call(this, t);
        return;
      }
      if (t.target === __privateGet(this, _t49)) {
        (_a29 = __privateGet(this, _s23).firstElementChild) == null ? void 0 : _a29.focus();
        return;
      }
      (_b7 = t.target.nextSibling) == null ? void 0 : _b7.focus();
    }
    _moveToPrevious(t) {
      var _a29, _b7;
      if (t.target === ((_a29 = __privateGet(this, _s23)) == null ? void 0 : _a29.firstElementChild) || t.target === __privateGet(this, _t49)) {
        __privateGet(this, _vt_instances, p_get) && this._hideDropdownFromKeyboard();
        return;
      }
      __privateGet(this, _vt_instances, p_get) || __privateMethod(this, _vt_instances, g_fn4).call(this, t), (_b7 = t.target.previousSibling) == null ? void 0 : _b7.focus();
    }
    _moveToBeginning(t) {
      var _a29;
      if (!__privateGet(this, _vt_instances, p_get)) {
        __privateMethod(this, _vt_instances, g_fn4).call(this, t);
        return;
      }
      (_a29 = __privateGet(this, _s23).firstElementChild) == null ? void 0 : _a29.focus();
    }
    _moveToEnd(t) {
      var _a29;
      if (!__privateGet(this, _vt_instances, p_get)) {
        __privateMethod(this, _vt_instances, g_fn4).call(this, t);
        return;
      }
      (_a29 = __privateGet(this, _s23).lastElementChild) == null ? void 0 : _a29.focus();
    }
    hideDropdown() {
      var _a29, _b7;
      (_a29 = __privateGet(this, _s23)) == null ? void 0 : _a29.classList.add("hidden"), __privateGet(this, _t49).ariaExpanded = "false", (_b7 = __privateGet(this, _h10)) == null ? void 0 : _b7.abort(), __privateSet(this, _h10, null);
    }
    _hideDropdownFromKeyboard() {
      var _a29;
      if (!__privateGet(this, _r16)) {
        if (!__privateGet(this, _vt_instances, p_get)) {
          (_a29 = __privateGet(this, _n16)) == null ? void 0 : _a29.unselect();
          return;
        }
        this.hideDropdown(), __privateGet(this, _t49).focus({
          preventScroll: true,
          focusVisible: __privateGet(this, _a17)
        });
      }
    }
    updateColor(t) {
      if (__privateGet(this, _e35) && (__privateGet(this, _e35).style.backgroundColor = t), !__privateGet(this, _s23)) return;
      const e = __privateGet(this, _l8).highlightColors.values();
      for (const s of __privateGet(this, _s23).children) s.ariaSelected = e.next().value === t.toUpperCase();
    }
    destroy() {
      var _a29, _b7;
      (_a29 = __privateGet(this, _t49)) == null ? void 0 : _a29.remove(), __privateSet(this, _t49, null), __privateSet(this, _e35, null), (_b7 = __privateGet(this, _s23)) == null ? void 0 : _b7.remove(), __privateSet(this, _s23, null);
    }
  }, _t49 = new WeakMap(), _e35 = new WeakMap(), _i28 = new WeakMap(), _s23 = new WeakMap(), _a17 = new WeakMap(), _r16 = new WeakMap(), _n16 = new WeakMap(), _o12 = new WeakMap(), _h10 = new WeakMap(), _l8 = new WeakMap(), _u7 = new WeakMap(), _vt_instances = new WeakSet(), d_fn4 = function() {
    const t = document.createElement("div"), e = __privateGet(this, _l8)._signal;
    t.addEventListener("contextmenu", St, {
      signal: e
    }), t.className = "dropdown", t.role = "listbox", t.ariaMultiSelectable = "false", t.ariaOrientation = "vertical", t.setAttribute("data-l10n-id", "pdfjs-editor-colorpicker-dropdown"), __privateGet(this, _n16) && (t.id = `${__privateGet(this, _n16).id}_colorpicker_dropdown`);
    for (const [s, i] of __privateGet(this, _l8).highlightColors) {
      const n = document.createElement("button");
      n.tabIndex = "0", n.role = "option", n.setAttribute("data-color", i), n.title = s, n.setAttribute("data-l10n-id", __privateGet(vt, _u7)[s]);
      const r = document.createElement("span");
      n.append(r), r.className = "swatch", r.style.backgroundColor = i, n.ariaSelected = i === __privateGet(this, _i28), n.addEventListener("click", __privateMethod(this, _vt_instances, f_fn4).bind(this, i), {
        signal: e
      }), t.append(n);
    }
    return t.addEventListener("keydown", __privateMethod(this, _vt_instances, m_fn3).bind(this), {
      signal: e
    }), t;
  }, f_fn4 = function(t, e) {
    e.stopPropagation(), __privateGet(this, _o12).dispatch("switchannotationeditorparams", {
      source: this,
      type: O.HIGHLIGHT_COLOR,
      value: t
    }), this.updateColor(t);
  }, m_fn3 = function(t) {
    vt._keyboardManager.exec(this, t);
  }, g_fn4 = function(t) {
    if (__privateGet(this, _vt_instances, p_get)) {
      this.hideDropdown();
      return;
    }
    if (__privateSet(this, _a17, t.detail === 0), __privateGet(this, _h10) || (__privateSet(this, _h10, new AbortController()), window.addEventListener("pointerdown", __privateMethod(this, _vt_instances, c_fn2).bind(this), {
      signal: __privateGet(this, _l8).combinedSignal(__privateGet(this, _h10))
    })), __privateGet(this, _t49).ariaExpanded = "true", __privateGet(this, _s23)) {
      __privateGet(this, _s23).classList.remove("hidden");
      return;
    }
    const e = __privateSet(this, _s23, __privateMethod(this, _vt_instances, d_fn4).call(this));
    __privateGet(this, _t49).append(e);
  }, c_fn2 = function(t) {
    var _a29;
    ((_a29 = __privateGet(this, _s23)) == null ? void 0 : _a29.contains(t.target)) || this.hideDropdown();
  }, p_get = function() {
    return __privateGet(this, _s23) && !__privateGet(this, _s23).classList.contains("hidden");
  }, __privateAdd(_k2, _u7, null), _k2);
  const _pe = class _pe {
    constructor(t) {
      __privateAdd(this, _t50, null);
      __privateAdd(this, _e36, null);
      __privateAdd(this, _i29, null);
      __privateSet(this, _e36, t), __privateSet(this, _i29, t._uiManager), __privateGet(_pe, _s24) || __privateSet(_pe, _s24, Object.freeze({
        freetext: "pdfjs-editor-color-picker-free-text-input",
        ink: "pdfjs-editor-color-picker-ink-input"
      }));
    }
    renderButton() {
      if (__privateGet(this, _t50)) return __privateGet(this, _t50);
      const { editorType: t, colorType: e, color: s } = __privateGet(this, _e36), i = __privateSet(this, _t50, document.createElement("input"));
      return i.type = "color", i.value = s || "#000000", i.className = "basicColorPicker", i.tabIndex = 0, i.setAttribute("data-l10n-id", __privateGet(_pe, _s24)[t]), i.addEventListener("input", () => {
        __privateGet(this, _i29).updateParams(e, i.value);
      }, {
        signal: __privateGet(this, _i29)._signal
      }), i;
    }
    update(t) {
      __privateGet(this, _t50) && (__privateGet(this, _t50).value = t);
    }
    destroy() {
      var _a29;
      (_a29 = __privateGet(this, _t50)) == null ? void 0 : _a29.remove(), __privateSet(this, _t50, null);
    }
    hideDropdown() {
    }
  };
  _t50 = new WeakMap();
  _e36 = new WeakMap();
  _i29 = new WeakMap();
  _s24 = new WeakMap();
  __privateAdd(_pe, _s24, null);
  let pe = _pe;
  function li(d) {
    return Math.floor(Math.max(0, Math.min(1, d)) * 255).toString(16).padStart(2, "0");
  }
  function ie(d) {
    return Math.max(0, Math.min(255, 255 * d));
  }
  class hi {
    static CMYK_G([t, e, s, i]) {
      return [
        "G",
        1 - Math.min(1, 0.3 * t + 0.59 * s + 0.11 * e + i)
      ];
    }
    static G_CMYK([t]) {
      return [
        "CMYK",
        0,
        0,
        0,
        1 - t
      ];
    }
    static G_RGB([t]) {
      return [
        "RGB",
        t,
        t,
        t
      ];
    }
    static G_rgb([t]) {
      return t = ie(t), [
        t,
        t,
        t
      ];
    }
    static G_HTML([t]) {
      const e = li(t);
      return `#${e}${e}${e}`;
    }
    static RGB_G([t, e, s]) {
      return [
        "G",
        0.3 * t + 0.59 * e + 0.11 * s
      ];
    }
    static RGB_rgb(t) {
      return t.map(ie);
    }
    static RGB_HTML(t) {
      return `#${t.map(li).join("")}`;
    }
    static T_HTML() {
      return "#00000000";
    }
    static T_rgb() {
      return [
        null
      ];
    }
    static CMYK_RGB([t, e, s, i]) {
      return [
        "RGB",
        1 - Math.min(1, t + i),
        1 - Math.min(1, s + i),
        1 - Math.min(1, e + i)
      ];
    }
    static CMYK_rgb([t, e, s, i]) {
      return [
        ie(1 - Math.min(1, t + i)),
        ie(1 - Math.min(1, s + i)),
        ie(1 - Math.min(1, e + i))
      ];
    }
    static CMYK_HTML(t) {
      const e = this.CMYK_RGB(t).slice(1);
      return this.RGB_HTML(e);
    }
    static RGB_CMYK([t, e, s]) {
      const i = 1 - t, n = 1 - e, r = 1 - s, a = Math.min(i, n, r);
      return [
        "CMYK",
        i,
        n,
        r,
        a
      ];
    }
  }
  class wr {
    create(t, e, s = false) {
      if (t <= 0 || e <= 0) throw new Error("Invalid SVG dimensions");
      const i = this._createSVG("svg:svg");
      return i.setAttribute("version", "1.1"), s || (i.setAttribute("width", `${t}px`), i.setAttribute("height", `${e}px`)), i.setAttribute("preserveAspectRatio", "none"), i.setAttribute("viewBox", `0 0 ${t} ${e}`), i;
    }
    createElement(t) {
      if (typeof t != "string") throw new Error("Invalid SVG element type");
      return this._createSVG(t);
    }
    _createSVG(t) {
      $("Abstract method `_createSVG` called.");
    }
  }
  Ie = class extends wr {
    _createSVG(t) {
      return document.createElementNS(Mt, t);
    }
  };
  const vr = 9, Bt = /* @__PURE__ */ new WeakSet(), Sr = (/* @__PURE__ */ new Date()).getTimezoneOffset() * 60 * 1e3;
  class ss {
    static create(t) {
      switch (t.data.annotationType) {
        case st.LINK:
          return new Ps(t);
        case st.TEXT:
          return new _r(t);
        case st.WIDGET:
          switch (t.data.fieldType) {
            case "Tx":
              return new Cr(t);
            case "Btn":
              return t.data.radioButton ? new Fi(t) : t.data.checkBox ? new xr(t) : new Pr(t);
            case "Ch":
              return new kr(t);
            case "Sig":
              return new Tr(t);
          }
          return new Ht(t);
        case st.POPUP:
          return new ps(t);
        case st.FREETEXT:
          return new Ni(t);
        case st.LINE:
          return new Dr(t);
        case st.SQUARE:
          return new Ir(t);
        case st.CIRCLE:
          return new Lr(t);
        case st.POLYLINE:
          return new Oi(t);
        case st.CARET:
          return new Fr(t);
        case st.INK:
          return new ks(t);
        case st.POLYGON:
          return new Rr(t);
        case st.HIGHLIGHT:
          return new Bi(t);
        case st.UNDERLINE:
          return new Nr(t);
        case st.SQUIGGLY:
          return new Or(t);
        case st.STRIKEOUT:
          return new Br(t);
        case st.STAMP:
          return new Ui(t);
        case st.FILEATTACHMENT:
          return new Ur(t);
        default:
          return new q(t);
      }
    }
  }
  const _q = class _q {
    constructor(t, { isRenderable: e = false, ignoreBorder: s = false, createQuadrilaterals: i = false } = {}) {
      __privateAdd(this, _q_instances);
      __privateAdd(this, _t51, null);
      __privateAdd(this, _e37, false);
      __privateAdd(this, _i30, null);
      this.isRenderable = e, this.data = t.data, this.layer = t.layer, this.linkService = t.linkService, this.downloadManager = t.downloadManager, this.imageResourcesPath = t.imageResourcesPath, this.renderForms = t.renderForms, this.svgFactory = t.svgFactory, this.annotationStorage = t.annotationStorage, this.enableComment = t.enableComment, this.enableScripting = t.enableScripting, this.hasJSActions = t.hasJSActions, this._fieldObjects = t.fieldObjects, this.parent = t.parent, this.hasOwnCommentButton = false, e && (this.contentElement = this.container = this._createContainer(s)), i && this._createQuadrilaterals();
    }
    static _hasPopupData({ contentsObj: t, richText: e }) {
      return !!((t == null ? void 0 : t.str) || (e == null ? void 0 : e.str));
    }
    get _isEditable() {
      return this.data.isEditable;
    }
    get hasPopupData() {
      return _q._hasPopupData(this.data) || this.enableComment && !!this.commentText;
    }
    get commentData() {
      var _a29;
      const { data: t } = this, e = (_a29 = this.annotationStorage) == null ? void 0 : _a29.getEditor(t.id);
      return e ? e.getData() : t;
    }
    get hasCommentButton() {
      return this.enableComment && this.hasPopupElement;
    }
    get commentButtonPosition() {
      var _a29;
      const t = (_a29 = this.annotationStorage) == null ? void 0 : _a29.getEditor(this.data.id);
      if (t) return t.commentButtonPositionInPage;
      const { quadPoints: e, inkLists: s, rect: i } = this.data;
      let n = -1 / 0, r = -1 / 0;
      if ((e == null ? void 0 : e.length) >= 8) {
        for (let a = 0; a < e.length; a += 8) e[a + 1] > r ? (r = e[a + 1], n = e[a + 2]) : e[a + 1] === r && (n = Math.max(n, e[a + 2]));
        return [
          n,
          r
        ];
      }
      if ((s == null ? void 0 : s.length) >= 1) {
        for (const a of s) for (let o = 0, l = a.length; o < l; o += 2) a[o + 1] > r ? (r = a[o + 1], n = a[o]) : a[o + 1] === r && (n = Math.max(n, a[o]));
        if (n !== 1 / 0) return [
          n,
          r
        ];
      }
      return i ? [
        i[2],
        i[3]
      ] : null;
    }
    _normalizePoint(t) {
      const { page: { view: e }, viewport: { rawDims: { pageWidth: s, pageHeight: i, pageX: n, pageY: r } } } = this.parent;
      return t[1] = e[3] - t[1] + e[1], t[0] = 100 * (t[0] - n) / s, t[1] = 100 * (t[1] - r) / i, t;
    }
    get commentText() {
      var _a29, _b7, _c10;
      const { data: t } = this;
      return ((_b7 = (_a29 = this.annotationStorage.getRawValue(`${ce}${t.id}`)) == null ? void 0 : _a29.popup) == null ? void 0 : _b7.contents) || ((_c10 = t.contentsObj) == null ? void 0 : _c10.str) || "";
    }
    set commentText(t) {
      const { data: e } = this, s = {
        deleted: !t,
        contents: t || ""
      };
      this.annotationStorage.updateEditor(e.id, {
        popup: s
      }) || this.annotationStorage.setValue(`${ce}${e.id}`, {
        id: e.id,
        annotationType: e.annotationType,
        page: this.parent.page,
        popup: s,
        popupRef: e.popupRef,
        modificationDate: /* @__PURE__ */ new Date()
      }), t || this.removePopup();
    }
    removePopup() {
      var _a29, _b7;
      (_b7 = ((_a29 = __privateGet(this, _i30)) == null ? void 0 : _a29.popup) || this.popup) == null ? void 0 : _b7.remove(), __privateSet(this, _i30, this.popup = null);
    }
    updateEdited(t) {
      var _a29;
      if (!this.container) return;
      t.rect && (__privateGet(this, _t51) || __privateSet(this, _t51, {
        rect: this.data.rect.slice(0)
      }));
      const { rect: e, popup: s } = t;
      e && __privateMethod(this, _q_instances, s_fn8).call(this, e);
      let i = ((_a29 = __privateGet(this, _i30)) == null ? void 0 : _a29.popup) || this.popup;
      !i && (s == null ? void 0 : s.text) && (this._createPopup(s), i = __privateGet(this, _i30).popup), i && (i.updateEdited(t), (s == null ? void 0 : s.deleted) && (i.remove(), __privateSet(this, _i30, null), this.popup = null));
    }
    resetEdited() {
      var _a29;
      __privateGet(this, _t51) && (__privateMethod(this, _q_instances, s_fn8).call(this, __privateGet(this, _t51).rect), (_a29 = __privateGet(this, _i30)) == null ? void 0 : _a29.popup.resetEdited(), __privateSet(this, _t51, null));
    }
    _createContainer(t) {
      const { data: e, parent: { page: s, viewport: i } } = this, n = document.createElement("section");
      n.setAttribute("data-annotation-id", e.id), !(this instanceof Ht) && !(this instanceof Ps) && (n.tabIndex = 0);
      const { style: r } = n;
      if (r.zIndex = this.parent.zIndex, this.parent.zIndex += 2, e.alternativeText && (n.title = e.alternativeText), e.noRotate && n.classList.add("norotate"), !e.rect || this instanceof ps) {
        const { rotation: p } = e;
        return !e.hasOwnCanvas && p !== 0 && this.setRotation(p, n), n;
      }
      const { width: a, height: o } = this;
      if (!t && e.borderStyle.width > 0) {
        r.borderWidth = `${e.borderStyle.width}px`;
        const p = e.borderStyle.horizontalCornerRadius, b = e.borderStyle.verticalCornerRadius;
        if (p > 0 || b > 0) {
          const A = `calc(${p}px * var(--total-scale-factor)) / calc(${b}px * var(--total-scale-factor))`;
          r.borderRadius = A;
        } else if (this instanceof Fi) {
          const A = `calc(${a}px * var(--total-scale-factor)) / calc(${o}px * var(--total-scale-factor))`;
          r.borderRadius = A;
        }
        switch (e.borderStyle.style) {
          case jt.SOLID:
            r.borderStyle = "solid";
            break;
          case jt.DASHED:
            r.borderStyle = "dashed";
            break;
          case jt.BEVELED:
            F("Unimplemented border style: beveled");
            break;
          case jt.INSET:
            F("Unimplemented border style: inset");
            break;
          case jt.UNDERLINE:
            r.borderBottomStyle = "solid";
            break;
        }
        const m = e.borderColor || null;
        m ? (__privateSet(this, _e37, true), r.borderColor = T.makeHexColor(m[0] | 0, m[1] | 0, m[2] | 0)) : r.borderWidth = 0;
      }
      const l = T.normalizeRect([
        e.rect[0],
        s.view[3] - e.rect[1] + s.view[1],
        e.rect[2],
        s.view[3] - e.rect[3] + s.view[1]
      ]), { pageWidth: h, pageHeight: c, pageX: u, pageY: f } = i.rawDims;
      r.left = `${100 * (l[0] - u) / h}%`, r.top = `${100 * (l[1] - f) / c}%`;
      const { rotation: g } = e;
      return e.hasOwnCanvas || g === 0 ? (r.width = `${100 * a / h}%`, r.height = `${100 * o / c}%`) : this.setRotation(g, n), n;
    }
    setRotation(t, e = this.container) {
      if (!this.data.rect) return;
      const { pageWidth: s, pageHeight: i } = this.parent.viewport.rawDims;
      let { width: n, height: r } = this;
      t % 180 !== 0 && ([n, r] = [
        r,
        n
      ]), e.style.width = `${100 * n / s}%`, e.style.height = `${100 * r / i}%`, e.setAttribute("data-main-rotation", (360 - t) % 360);
    }
    get _commonActions() {
      const t = (e, s, i) => {
        const n = i.detail[e], r = n[0], a = n.slice(1);
        i.target.style[s] = hi[`${r}_HTML`](a), this.annotationStorage.setValue(this.data.id, {
          [s]: hi[`${r}_rgb`](a)
        });
      };
      return L(this, "_commonActions", {
        display: (e) => {
          const { display: s } = e.detail, i = s % 2 === 1;
          this.container.style.visibility = i ? "hidden" : "visible", this.annotationStorage.setValue(this.data.id, {
            noView: i,
            noPrint: s === 1 || s === 2
          });
        },
        print: (e) => {
          this.annotationStorage.setValue(this.data.id, {
            noPrint: !e.detail.print
          });
        },
        hidden: (e) => {
          const { hidden: s } = e.detail;
          this.container.style.visibility = s ? "hidden" : "visible", this.annotationStorage.setValue(this.data.id, {
            noPrint: s,
            noView: s
          });
        },
        focus: (e) => {
          setTimeout(() => e.target.focus({
            preventScroll: false
          }), 0);
        },
        userName: (e) => {
          e.target.title = e.detail.userName;
        },
        readonly: (e) => {
          e.target.disabled = e.detail.readonly;
        },
        required: (e) => {
          this._setRequired(e.target, e.detail.required);
        },
        bgColor: (e) => {
          t("bgColor", "backgroundColor", e);
        },
        fillColor: (e) => {
          t("fillColor", "backgroundColor", e);
        },
        fgColor: (e) => {
          t("fgColor", "color", e);
        },
        textColor: (e) => {
          t("textColor", "color", e);
        },
        borderColor: (e) => {
          t("borderColor", "borderColor", e);
        },
        strokeColor: (e) => {
          t("strokeColor", "borderColor", e);
        },
        rotation: (e) => {
          const s = e.detail.rotation;
          this.setRotation(s), this.annotationStorage.setValue(this.data.id, {
            rotation: s
          });
        }
      });
    }
    _dispatchEventFromSandbox(t, e) {
      var _a29;
      const s = this._commonActions;
      for (const i of Object.keys(e.detail)) (_a29 = t[i] || s[i]) == null ? void 0 : _a29(e);
    }
    _setDefaultPropertiesFromJS(t) {
      if (!this.enableScripting) return;
      const e = this.annotationStorage.getRawValue(this.data.id);
      if (!e) return;
      const s = this._commonActions;
      for (const [i, n] of Object.entries(e)) {
        const r = s[i];
        if (r) {
          const a = {
            detail: {
              [i]: n
            },
            target: t
          };
          r(a), delete e[i];
        }
      }
    }
    _createQuadrilaterals() {
      if (!this.container) return;
      const { quadPoints: t } = this.data;
      if (!t) return;
      const [e, s, i, n] = this.data.rect.map((p) => Math.fround(p));
      if (t.length === 8) {
        const [p, b, m, A] = t.subarray(2, 6);
        if (i === p && n === b && e === m && s === A) return;
      }
      const { style: r } = this.container;
      let a;
      if (__privateGet(this, _e37)) {
        const { borderColor: p, borderWidth: b } = r;
        r.borderWidth = 0, a = [
          "url('data:image/svg+xml;utf8,",
          '<svg xmlns="http://www.w3.org/2000/svg"',
          ' preserveAspectRatio="none" viewBox="0 0 1 1">',
          `<g fill="transparent" stroke="${p}" stroke-width="${b}">`
        ], this.container.classList.add("hasBorder");
      }
      const o = i - e, l = n - s, { svgFactory: h } = this, c = h.createElement("svg");
      c.classList.add("quadrilateralsContainer"), c.setAttribute("width", 0), c.setAttribute("height", 0), c.role = "none";
      const u = h.createElement("defs");
      c.append(u);
      const f = h.createElement("clipPath"), g = `clippath_${this.data.id}`;
      f.setAttribute("id", g), f.setAttribute("clipPathUnits", "objectBoundingBox"), u.append(f);
      for (let p = 2, b = t.length; p < b; p += 8) {
        const m = t[p], A = t[p + 1], y = t[p + 2], v = t[p + 3], w = h.createElement("rect"), S = (y - e) / o, E = (n - A) / l, _ = (m - y) / o, C = (A - v) / l;
        w.setAttribute("x", S), w.setAttribute("y", E), w.setAttribute("width", _), w.setAttribute("height", C), f.append(w), a == null ? void 0 : a.push(`<rect vector-effect="non-scaling-stroke" x="${S}" y="${E}" width="${_}" height="${C}"/>`);
      }
      __privateGet(this, _e37) && (a.push("</g></svg>')"), r.backgroundImage = a.join("")), this.container.append(c), this.container.style.clipPath = `url(#${g})`;
    }
    _createPopup(t = null) {
      const { data: e } = this;
      let s, i;
      t ? (s = {
        str: t.text
      }, i = t.date) : (s = e.contentsObj, i = e.modificationDate), __privateSet(this, _i30, new ps({
        data: {
          color: e.color,
          titleObj: e.titleObj,
          modificationDate: i,
          contentsObj: s,
          richText: e.richText,
          parentRect: e.rect,
          borderStyle: 0,
          id: `popup_${e.id}`,
          rotation: e.rotation,
          noRotate: true
        },
        linkService: this.linkService,
        parent: this.parent,
        elements: [
          this
        ]
      }));
    }
    get hasPopupElement() {
      return !!(__privateGet(this, _i30) || this.popup || this.data.popupRef);
    }
    get extraPopupElement() {
      return __privateGet(this, _i30);
    }
    render() {
      $("Abstract method `AnnotationElement.render` called");
    }
    _getElementsByName(t, e = null) {
      const s = [];
      if (this._fieldObjects) {
        const i = this._fieldObjects[t];
        if (i) for (const { page: n, id: r, exportValues: a } of i) {
          if (n === -1 || r === e) continue;
          const o = typeof a == "string" ? a : null, l = document.querySelector(`[data-element-id="${r}"]`);
          if (l && !Bt.has(l)) {
            F(`_getElementsByName - element not allowed: ${r}`);
            continue;
          }
          s.push({
            id: r,
            exportValue: o,
            domElement: l
          });
        }
        return s;
      }
      for (const i of document.getElementsByName(t)) {
        const { exportValue: n } = i, r = i.getAttribute("data-element-id");
        r !== e && Bt.has(i) && s.push({
          id: r,
          exportValue: n,
          domElement: i
        });
      }
      return s;
    }
    show() {
      var _a29;
      this.container && (this.container.hidden = false), (_a29 = this.popup) == null ? void 0 : _a29.maybeShow();
    }
    hide() {
      var _a29;
      this.container && (this.container.hidden = true), (_a29 = this.popup) == null ? void 0 : _a29.forceHide();
    }
    getElementsToTriggerPopup() {
      return this.container;
    }
    addHighlightArea() {
      const t = this.getElementsToTriggerPopup();
      if (Array.isArray(t)) for (const e of t) e.classList.add("highlightArea");
      else t.classList.add("highlightArea");
    }
    _editOnDoubleClick() {
      if (!this._isEditable) return;
      const { annotationEditorType: t, data: { id: e } } = this;
      this.container.addEventListener("dblclick", () => {
        var _a29;
        (_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("switchannotationeditormode", {
          source: this,
          mode: t,
          editId: e,
          mustEnterInEditMode: true
        });
      });
    }
    get width() {
      return this.data.rect[2] - this.data.rect[0];
    }
    get height() {
      return this.data.rect[3] - this.data.rect[1];
    }
  };
  _t51 = new WeakMap();
  _e37 = new WeakMap();
  _i30 = new WeakMap();
  _q_instances = new WeakSet();
  s_fn8 = function(t) {
    const { container: { style: e }, data: { rect: s, rotation: i }, parent: { viewport: { rawDims: { pageWidth: n, pageHeight: r, pageX: a, pageY: o } } } } = this;
    s == null ? void 0 : s.splice(0, 4, ...t), e.left = `${100 * (t[0] - a) / n}%`, e.top = `${100 * (r - t[3] + o) / r}%`, i === 0 ? (e.width = `${100 * (t[2] - t[0]) / n}%`, e.height = `${100 * (t[3] - t[1]) / r}%`) : this.setRotation(i);
  };
  let q = _q;
  class Er extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      }), this.editor = t.editor;
    }
    render() {
      return this.container.className = "editorAnnotation", this.container;
    }
    createOrUpdatePopup() {
      const { editor: t } = this;
      t.hasComment && this._createPopup(t.comment);
    }
    get hasCommentButton() {
      return this.enableComment && this.editor.hasComment;
    }
    get commentButtonPosition() {
      return this.editor.commentButtonPositionInPage;
    }
    get commentText() {
      return this.editor.comment.text;
    }
    set commentText(t) {
      this.editor.comment = t, t || this.removePopup();
    }
    get commentData() {
      return this.editor.getData();
    }
    remove() {
      this.parent.removeAnnotation(this.data.id), this.container.remove(), this.container = null, this.removePopup();
    }
  }
  class Ps extends q {
    constructor(t, e = null) {
      super(t, {
        isRenderable: true,
        ignoreBorder: !!(e == null ? void 0 : e.ignoreBorder),
        createQuadrilaterals: true
      });
      __privateAdd(this, _Ps_instances);
      this.isTooltipOnly = t.data.isTooltipOnly;
    }
    render() {
      const { data: t, linkService: e } = this, s = document.createElement("a");
      s.setAttribute("data-element-id", t.id);
      let i = false;
      return t.url ? (e.addLinkAttributes(s, t.url, t.newWindow), i = true) : t.action ? (this._bindNamedAction(s, t.action, t.overlaidText), i = true) : t.attachment ? (__privateMethod(this, _Ps_instances, e_fn8).call(this, s, t.attachment, t.overlaidText, t.attachmentDest), i = true) : t.setOCGState ? (__privateMethod(this, _Ps_instances, i_fn7).call(this, s, t.setOCGState, t.overlaidText), i = true) : t.dest ? (this._bindLink(s, t.dest, t.overlaidText), i = true) : (t.actions && (t.actions.Action || t.actions["Mouse Up"] || t.actions["Mouse Down"]) && this.enableScripting && this.hasJSActions && (this._bindJSAction(s, t), i = true), t.resetForm ? (this._bindResetFormAction(s, t.resetForm), i = true) : this.isTooltipOnly && !i && (this._bindLink(s, ""), i = true)), this.container.classList.add("linkAnnotation"), i && (this.contentElement = s, this.container.append(s)), this.container;
    }
    _bindLink(t, e, s = "") {
      t.href = this.linkService.getDestinationHash(e), t.onclick = () => (e && this.linkService.goToDestination(e), false), (e || e === "") && __privateMethod(this, _Ps_instances, t_fn5).call(this), s && (t.title = s);
    }
    _bindNamedAction(t, e, s = "") {
      t.href = this.linkService.getAnchorUrl(""), t.onclick = () => (this.linkService.executeNamedAction(e), false), s && (t.title = s), __privateMethod(this, _Ps_instances, t_fn5).call(this);
    }
    _bindJSAction(t, e) {
      t.href = this.linkService.getAnchorUrl("");
      const s = /* @__PURE__ */ new Map([
        [
          "Action",
          "onclick"
        ],
        [
          "Mouse Up",
          "onmouseup"
        ],
        [
          "Mouse Down",
          "onmousedown"
        ]
      ]);
      for (const i of Object.keys(e.actions)) {
        const n = s.get(i);
        n && (t[n] = () => {
          var _a29;
          return (_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("dispatcheventinsandbox", {
            source: this,
            detail: {
              id: e.id,
              name: i
            }
          }), false;
        });
      }
      e.overlaidText && (t.title = e.overlaidText), t.onclick || (t.onclick = () => false), __privateMethod(this, _Ps_instances, t_fn5).call(this);
    }
    _bindResetFormAction(t, e) {
      const s = t.onclick;
      if (s || (t.href = this.linkService.getAnchorUrl("")), __privateMethod(this, _Ps_instances, t_fn5).call(this), !this._fieldObjects) {
        F('_bindResetFormAction - "resetForm" action not supported, ensure that the `fieldObjects` parameter is provided.'), s || (t.onclick = () => false);
        return;
      }
      t.onclick = () => {
        var _a29;
        s == null ? void 0 : s();
        const { fields: i, refs: n, include: r } = e, a = [];
        if (i.length !== 0 || n.length !== 0) {
          const h = new Set(n);
          for (const c of i) {
            const u = this._fieldObjects[c] || [];
            for (const { id: f } of u) h.add(f);
          }
          for (const c of Object.values(this._fieldObjects)) for (const u of c) h.has(u.id) === r && a.push(u);
        } else for (const h of Object.values(this._fieldObjects)) a.push(...h);
        const o = this.annotationStorage, l = [];
        for (const h of a) {
          const { id: c } = h;
          switch (l.push(c), h.type) {
            case "text": {
              const f = h.defaultValue || "";
              o.setValue(c, {
                value: f
              });
              break;
            }
            case "checkbox":
            case "radiobutton": {
              const f = h.defaultValue === h.exportValues;
              o.setValue(c, {
                value: f
              });
              break;
            }
            case "combobox":
            case "listbox": {
              const f = h.defaultValue || "";
              o.setValue(c, {
                value: f
              });
              break;
            }
            default:
              continue;
          }
          const u = document.querySelector(`[data-element-id="${c}"]`);
          if (u) {
            if (!Bt.has(u)) {
              F(`_bindResetFormAction - element not allowed: ${c}`);
              continue;
            }
          } else continue;
          u.dispatchEvent(new Event("resetform"));
        }
        return this.enableScripting && ((_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: "app",
            ids: l,
            name: "ResetForm"
          }
        })), false;
      };
    }
  }
  _Ps_instances = new WeakSet();
  t_fn5 = function() {
    this.container.setAttribute("data-internal-link", "");
  };
  e_fn8 = function(t, e, s = "", i = null) {
    t.href = this.linkService.getAnchorUrl(""), e.description ? t.title = e.description : s && (t.title = s), t.onclick = () => {
      var _a29;
      return (_a29 = this.downloadManager) == null ? void 0 : _a29.openOrDownloadData(e.content, e.filename, i), false;
    }, __privateMethod(this, _Ps_instances, t_fn5).call(this);
  };
  i_fn7 = function(t, e, s = "") {
    t.href = this.linkService.getAnchorUrl(""), t.onclick = () => (this.linkService.executeSetOCGState(e), false), s && (t.title = s), __privateMethod(this, _Ps_instances, t_fn5).call(this);
  };
  class _r extends q {
    constructor(t) {
      super(t, {
        isRenderable: true
      });
    }
    render() {
      this.container.classList.add("textAnnotation");
      const t = document.createElement("img");
      return t.src = this.imageResourcesPath + "annotation-" + this.data.name.toLowerCase() + ".svg", t.setAttribute("data-l10n-id", "pdfjs-text-annotation-type"), t.setAttribute("data-l10n-args", JSON.stringify({
        type: this.data.name
      })), !this.data.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.append(t), this.container;
    }
  }
  class Ht extends q {
    render() {
      return this.container;
    }
    showElementAndHideCanvas(t) {
      var _a29;
      this.data.hasOwnCanvas && (((_a29 = t.previousSibling) == null ? void 0 : _a29.nodeName) === "CANVAS" && (t.previousSibling.hidden = true), t.hidden = false);
    }
    _getKeyModifier(t) {
      return nt.platform.isMac ? t.metaKey : t.ctrlKey;
    }
    _setEventListener(t, e, s, i, n) {
      s.includes("mouse") ? t.addEventListener(s, (r) => {
        var _a29;
        (_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: this.data.id,
            name: i,
            value: n(r),
            shift: r.shiftKey,
            modifier: this._getKeyModifier(r)
          }
        });
      }) : t.addEventListener(s, (r) => {
        var _a29;
        if (s === "blur") {
          if (!e.focused || !r.relatedTarget) return;
          e.focused = false;
        } else if (s === "focus") {
          if (e.focused) return;
          e.focused = true;
        }
        n && ((_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: this.data.id,
            name: i,
            value: n(r)
          }
        }));
      });
    }
    _setEventListeners(t, e, s, i) {
      var _a29, _b7, _c10;
      for (const [n, r] of s) (r === "Action" || ((_a29 = this.data.actions) == null ? void 0 : _a29[r])) && ((r === "Focus" || r === "Blur") && (e || (e = {
        focused: false
      })), this._setEventListener(t, e, n, r, i), r === "Focus" && !((_b7 = this.data.actions) == null ? void 0 : _b7.Blur) ? this._setEventListener(t, e, "blur", "Blur", null) : r === "Blur" && !((_c10 = this.data.actions) == null ? void 0 : _c10.Focus) && this._setEventListener(t, e, "focus", "Focus", null));
    }
    _setBackgroundColor(t) {
      const e = this.data.backgroundColor || null;
      t.style.backgroundColor = e === null ? "transparent" : T.makeHexColor(e[0], e[1], e[2]);
    }
    _setTextStyle(t) {
      const e = [
        "left",
        "center",
        "right"
      ], { fontColor: s } = this.data.defaultAppearanceData, i = this.data.defaultAppearanceData.fontSize || vr, n = t.style;
      let r;
      const a = 2, o = (l) => Math.round(10 * l) / 10;
      if (this.data.multiLine) {
        const l = Math.abs(this.data.rect[3] - this.data.rect[1] - a), h = Math.round(l / (qe * i)) || 1, c = l / h;
        r = Math.min(i, o(c / qe));
      } else {
        const l = Math.abs(this.data.rect[3] - this.data.rect[1] - a);
        r = Math.min(i, o(l / qe));
      }
      n.fontSize = `calc(${r}px * var(--total-scale-factor))`, n.color = T.makeHexColor(s[0], s[1], s[2]), this.data.textAlignment !== null && (n.textAlign = e[this.data.textAlignment]);
    }
    _setRequired(t, e) {
      e ? t.setAttribute("required", true) : t.removeAttribute("required"), t.setAttribute("aria-required", e);
    }
  }
  class Cr extends Ht {
    constructor(t) {
      const e = t.renderForms || t.data.hasOwnCanvas || !t.data.hasAppearance && !!t.data.fieldValue;
      super(t, {
        isRenderable: e
      });
    }
    setPropertyOnSiblings(t, e, s, i) {
      const n = this.annotationStorage;
      for (const r of this._getElementsByName(t.name, t.id)) r.domElement && (r.domElement[e] = s), n.setValue(r.id, {
        [i]: s
      });
    }
    render() {
      var _a29, _b7;
      const t = this.annotationStorage, e = this.data.id;
      this.container.classList.add("textWidgetAnnotation");
      let s = null;
      if (this.renderForms) {
        const i = t.getValue(e, {
          value: this.data.fieldValue
        });
        let n = i.value || "";
        const r = t.getValue(e, {
          charLimit: this.data.maxLen
        }).charLimit;
        r && n.length > r && (n = n.slice(0, r));
        let a = i.formattedValue || ((_a29 = this.data.textContent) == null ? void 0 : _a29.join(`
`)) || null;
        a && this.data.comb && (a = a.replaceAll(/\s+/g, ""));
        const o = {
          userValue: n,
          formattedValue: a,
          lastCommittedValue: null,
          commitKey: 1,
          focused: false
        };
        this.data.multiLine ? (s = document.createElement("textarea"), s.textContent = a ?? n, this.data.doNotScroll && (s.style.overflowY = "hidden")) : (s = document.createElement("input"), s.type = this.data.password ? "password" : "text", s.setAttribute("value", a ?? n), this.data.doNotScroll && (s.style.overflowX = "hidden")), this.data.hasOwnCanvas && (s.hidden = true), Bt.add(s), this.contentElement = s, s.setAttribute("data-element-id", e), s.disabled = this.data.readOnly, s.name = this.data.fieldName, s.tabIndex = 0;
        const { datetimeFormat: l, datetimeType: h, timeStep: c } = this.data, u = !!h && this.enableScripting;
        l && (s.title = l), this._setRequired(s, this.data.required), r && (s.maxLength = r), s.addEventListener("input", (g) => {
          t.setValue(e, {
            value: g.target.value
          }), this.setPropertyOnSiblings(s, "value", g.target.value, "value"), o.formattedValue = null;
        }), s.addEventListener("resetform", (g) => {
          const p = this.data.defaultFieldValue ?? "";
          s.value = o.userValue = p, o.formattedValue = null;
        });
        let f = (g) => {
          const { formattedValue: p } = o;
          p != null && (g.target.value = p), g.target.scrollLeft = 0;
        };
        if (this.enableScripting && this.hasJSActions) {
          s.addEventListener("focus", (p) => {
            var _a30;
            if (o.focused) return;
            const { target: b } = p;
            if (u && (b.type = h, c && (b.step = c)), o.userValue) {
              const m = o.userValue;
              if (u) if (h === "time") {
                const A = new Date(m), y = [
                  A.getHours(),
                  A.getMinutes(),
                  A.getSeconds()
                ];
                b.value = y.map((v) => v.toString().padStart(2, "0")).join(":");
              } else b.value = new Date(m - Sr).toISOString().split(h === "date" ? "T" : ".", 1)[0];
              else b.value = m;
            }
            o.lastCommittedValue = b.value, o.commitKey = 1, ((_a30 = this.data.actions) == null ? void 0 : _a30.Focus) || (o.focused = true);
          }), s.addEventListener("updatefromsandbox", (p) => {
            this.showElementAndHideCanvas(p.target);
            const b = {
              value(m) {
                o.userValue = m.detail.value ?? "", u || t.setValue(e, {
                  value: o.userValue.toString()
                }), m.target.value = o.userValue;
              },
              formattedValue(m) {
                const { formattedValue: A } = m.detail;
                o.formattedValue = A, A != null && m.target !== document.activeElement && (m.target.value = A);
                const y = {
                  formattedValue: A
                };
                u && (y.value = A), t.setValue(e, y);
              },
              selRange(m) {
                m.target.setSelectionRange(...m.detail.selRange);
              },
              charLimit: (m) => {
                var _a30;
                const { charLimit: A } = m.detail, { target: y } = m;
                if (A === 0) {
                  y.removeAttribute("maxLength");
                  return;
                }
                y.setAttribute("maxLength", A);
                let v = o.userValue;
                !v || v.length <= A || (v = v.slice(0, A), y.value = o.userValue = v, t.setValue(e, {
                  value: v
                }), (_a30 = this.linkService.eventBus) == null ? void 0 : _a30.dispatch("dispatcheventinsandbox", {
                  source: this,
                  detail: {
                    id: e,
                    name: "Keystroke",
                    value: v,
                    willCommit: true,
                    commitKey: 1,
                    selStart: y.selectionStart,
                    selEnd: y.selectionEnd
                  }
                }));
              }
            };
            this._dispatchEventFromSandbox(b, p);
          }), s.addEventListener("keydown", (p) => {
            var _a30;
            o.commitKey = 1;
            let b = -1;
            if (p.key === "Escape" ? b = 0 : p.key === "Enter" && !this.data.multiLine ? b = 2 : p.key === "Tab" && (o.commitKey = 3), b === -1) return;
            const { value: m } = p.target;
            o.lastCommittedValue !== m && (o.lastCommittedValue = m, o.userValue = m, (_a30 = this.linkService.eventBus) == null ? void 0 : _a30.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id: e,
                name: "Keystroke",
                value: m,
                willCommit: true,
                commitKey: b,
                selStart: p.target.selectionStart,
                selEnd: p.target.selectionEnd
              }
            }));
          });
          const g = f;
          f = null, s.addEventListener("blur", (p) => {
            var _a30, _b8;
            if (!o.focused || !p.relatedTarget) return;
            ((_a30 = this.data.actions) == null ? void 0 : _a30.Blur) || (o.focused = false);
            const { target: b } = p;
            let { value: m } = b;
            if (u) {
              if (m && h === "time") {
                const A = m.split(":").map((y) => parseInt(y, 10));
                m = new Date(2e3, 0, 1, A[0], A[1], A[2] || 0).valueOf(), b.step = "";
              } else m.includes("T") || (m = `${m}T00:00`), m = new Date(m).valueOf();
              b.type = "text";
            }
            o.userValue = m, o.lastCommittedValue !== m && ((_b8 = this.linkService.eventBus) == null ? void 0 : _b8.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id: e,
                name: "Keystroke",
                value: m,
                willCommit: true,
                commitKey: o.commitKey,
                selStart: p.target.selectionStart,
                selEnd: p.target.selectionEnd
              }
            })), g(p);
          }), ((_b7 = this.data.actions) == null ? void 0 : _b7.Keystroke) && s.addEventListener("beforeinput", (p) => {
            var _a30;
            o.lastCommittedValue = null;
            const { data: b, target: m } = p, { value: A, selectionStart: y, selectionEnd: v } = m;
            let w = y, S = v;
            switch (p.inputType) {
              case "deleteWordBackward": {
                const E = A.substring(0, y).match(/\w*[^\w]*$/);
                E && (w -= E[0].length);
                break;
              }
              case "deleteWordForward": {
                const E = A.substring(y).match(/^[^\w]*\w*/);
                E && (S += E[0].length);
                break;
              }
              case "deleteContentBackward":
                y === v && (w -= 1);
                break;
              case "deleteContentForward":
                y === v && (S += 1);
                break;
            }
            p.preventDefault(), (_a30 = this.linkService.eventBus) == null ? void 0 : _a30.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id: e,
                name: "Keystroke",
                value: A,
                change: b || "",
                willCommit: false,
                selStart: w,
                selEnd: S
              }
            });
          }), this._setEventListeners(s, o, [
            [
              "focus",
              "Focus"
            ],
            [
              "blur",
              "Blur"
            ],
            [
              "mousedown",
              "Mouse Down"
            ],
            [
              "mouseenter",
              "Mouse Enter"
            ],
            [
              "mouseleave",
              "Mouse Exit"
            ],
            [
              "mouseup",
              "Mouse Up"
            ]
          ], (p) => p.target.value);
        }
        if (f && s.addEventListener("blur", f), this.data.comb) {
          const p = (this.data.rect[2] - this.data.rect[0]) / r;
          s.classList.add("comb"), s.style.letterSpacing = `calc(${p}px * var(--total-scale-factor) - 1ch)`;
        }
      } else s = document.createElement("div"), s.textContent = this.data.fieldValue, s.style.verticalAlign = "middle", s.style.display = "table-cell", this.data.hasOwnCanvas && (s.hidden = true);
      return this._setTextStyle(s), this._setBackgroundColor(s), this._setDefaultPropertiesFromJS(s), this.container.append(s), this.container;
    }
  }
  class Tr extends Ht {
    constructor(t) {
      super(t, {
        isRenderable: !!t.data.hasOwnCanvas
      });
    }
  }
  class xr extends Ht {
    constructor(t) {
      super(t, {
        isRenderable: t.renderForms
      });
    }
    render() {
      const t = this.annotationStorage, e = this.data, s = e.id;
      let i = t.getValue(s, {
        value: e.exportValue === e.fieldValue
      }).value;
      typeof i == "string" && (i = i !== "Off", t.setValue(s, {
        value: i
      })), this.container.classList.add("buttonWidgetAnnotation", "checkBox");
      const n = document.createElement("input");
      return Bt.add(n), n.setAttribute("data-element-id", s), n.disabled = e.readOnly, this._setRequired(n, this.data.required), n.type = "checkbox", n.name = e.fieldName, i && n.setAttribute("checked", true), n.setAttribute("exportValue", e.exportValue), n.tabIndex = 0, n.addEventListener("change", (r) => {
        const { name: a, checked: o } = r.target;
        for (const l of this._getElementsByName(a, s)) {
          const h = o && l.exportValue === e.exportValue;
          l.domElement && (l.domElement.checked = h), t.setValue(l.id, {
            value: h
          });
        }
        t.setValue(s, {
          value: o
        });
      }), n.addEventListener("resetform", (r) => {
        const a = e.defaultFieldValue || "Off";
        r.target.checked = a === e.exportValue;
      }), this.enableScripting && this.hasJSActions && (n.addEventListener("updatefromsandbox", (r) => {
        const a = {
          value(o) {
            o.target.checked = o.detail.value !== "Off", t.setValue(s, {
              value: o.target.checked
            });
          }
        };
        this._dispatchEventFromSandbox(a, r);
      }), this._setEventListeners(n, null, [
        [
          "change",
          "Validate"
        ],
        [
          "change",
          "Action"
        ],
        [
          "focus",
          "Focus"
        ],
        [
          "blur",
          "Blur"
        ],
        [
          "mousedown",
          "Mouse Down"
        ],
        [
          "mouseenter",
          "Mouse Enter"
        ],
        [
          "mouseleave",
          "Mouse Exit"
        ],
        [
          "mouseup",
          "Mouse Up"
        ]
      ], (r) => r.target.checked)), this._setBackgroundColor(n), this._setDefaultPropertiesFromJS(n), this.container.append(n), this.container;
    }
  }
  class Fi extends Ht {
    constructor(t) {
      super(t, {
        isRenderable: t.renderForms
      });
    }
    render() {
      this.container.classList.add("buttonWidgetAnnotation", "radioButton");
      const t = this.annotationStorage, e = this.data, s = e.id;
      let i = t.getValue(s, {
        value: e.fieldValue === e.buttonValue
      }).value;
      if (typeof i == "string" && (i = i !== e.buttonValue, t.setValue(s, {
        value: i
      })), i) for (const r of this._getElementsByName(e.fieldName, s)) t.setValue(r.id, {
        value: false
      });
      const n = document.createElement("input");
      if (Bt.add(n), n.setAttribute("data-element-id", s), n.disabled = e.readOnly, this._setRequired(n, this.data.required), n.type = "radio", n.name = e.fieldName, i && n.setAttribute("checked", true), n.tabIndex = 0, n.addEventListener("change", (r) => {
        const { name: a, checked: o } = r.target;
        for (const l of this._getElementsByName(a, s)) t.setValue(l.id, {
          value: false
        });
        t.setValue(s, {
          value: o
        });
      }), n.addEventListener("resetform", (r) => {
        const a = e.defaultFieldValue;
        r.target.checked = a != null && a === e.buttonValue;
      }), this.enableScripting && this.hasJSActions) {
        const r = e.buttonValue;
        n.addEventListener("updatefromsandbox", (a) => {
          const o = {
            value: (l) => {
              const h = r === l.detail.value;
              for (const c of this._getElementsByName(l.target.name)) {
                const u = h && c.id === s;
                c.domElement && (c.domElement.checked = u), t.setValue(c.id, {
                  value: u
                });
              }
            }
          };
          this._dispatchEventFromSandbox(o, a);
        }), this._setEventListeners(n, null, [
          [
            "change",
            "Validate"
          ],
          [
            "change",
            "Action"
          ],
          [
            "focus",
            "Focus"
          ],
          [
            "blur",
            "Blur"
          ],
          [
            "mousedown",
            "Mouse Down"
          ],
          [
            "mouseenter",
            "Mouse Enter"
          ],
          [
            "mouseleave",
            "Mouse Exit"
          ],
          [
            "mouseup",
            "Mouse Up"
          ]
        ], (a) => a.target.checked);
      }
      return this._setBackgroundColor(n), this._setDefaultPropertiesFromJS(n), this.container.append(n), this.container;
    }
  }
  class Pr extends Ps {
    constructor(t) {
      super(t, {
        ignoreBorder: t.data.hasAppearance
      });
    }
    render() {
      const t = super.render();
      t.classList.add("buttonWidgetAnnotation", "pushButton");
      const e = t.lastChild;
      return this.enableScripting && this.hasJSActions && e && (this._setDefaultPropertiesFromJS(e), e.addEventListener("updatefromsandbox", (s) => {
        this._dispatchEventFromSandbox({}, s);
      })), t;
    }
  }
  class kr extends Ht {
    constructor(t) {
      super(t, {
        isRenderable: t.renderForms
      });
    }
    render() {
      this.container.classList.add("choiceWidgetAnnotation");
      const t = this.annotationStorage, e = this.data.id, s = t.getValue(e, {
        value: this.data.fieldValue
      }), i = document.createElement("select");
      Bt.add(i), i.setAttribute("data-element-id", e), i.disabled = this.data.readOnly, this._setRequired(i, this.data.required), i.name = this.data.fieldName, i.tabIndex = 0;
      let n = this.data.combo && this.data.options.length > 0;
      this.data.combo || (i.size = this.data.options.length, this.data.multiSelect && (i.multiple = true)), i.addEventListener("resetform", (h) => {
        const c = this.data.defaultFieldValue;
        for (const u of i.options) u.selected = u.value === c;
      });
      for (const h of this.data.options) {
        const c = document.createElement("option");
        c.textContent = h.displayValue, c.value = h.exportValue, s.value.includes(h.exportValue) && (c.setAttribute("selected", true), n = false), i.append(c);
      }
      let r = null;
      if (n) {
        const h = document.createElement("option");
        h.value = " ", h.setAttribute("hidden", true), h.setAttribute("selected", true), i.prepend(h), r = () => {
          h.remove(), i.removeEventListener("input", r), r = null;
        }, i.addEventListener("input", r);
      }
      const a = (h) => {
        const c = h ? "value" : "textContent", { options: u, multiple: f } = i;
        return f ? Array.prototype.filter.call(u, (g) => g.selected).map((g) => g[c]) : u.selectedIndex === -1 ? null : u[u.selectedIndex][c];
      };
      let o = a(false);
      const l = (h) => {
        const c = h.target.options;
        return Array.prototype.map.call(c, (u) => ({
          displayValue: u.textContent,
          exportValue: u.value
        }));
      };
      return this.enableScripting && this.hasJSActions ? (i.addEventListener("updatefromsandbox", (h) => {
        const c = {
          value(u) {
            r == null ? void 0 : r();
            const f = u.detail.value, g = new Set(Array.isArray(f) ? f : [
              f
            ]);
            for (const p of i.options) p.selected = g.has(p.value);
            t.setValue(e, {
              value: a(true)
            }), o = a(false);
          },
          multipleSelection(u) {
            i.multiple = true;
          },
          remove(u) {
            const f = i.options, g = u.detail.remove;
            f[g].selected = false, i.remove(g), f.length > 0 && Array.prototype.findIndex.call(f, (b) => b.selected) === -1 && (f[0].selected = true), t.setValue(e, {
              value: a(true),
              items: l(u)
            }), o = a(false);
          },
          clear(u) {
            for (; i.length !== 0; ) i.remove(0);
            t.setValue(e, {
              value: null,
              items: []
            }), o = a(false);
          },
          insert(u) {
            const { index: f, displayValue: g, exportValue: p } = u.detail.insert, b = i.children[f], m = document.createElement("option");
            m.textContent = g, m.value = p, b ? b.before(m) : i.append(m), t.setValue(e, {
              value: a(true),
              items: l(u)
            }), o = a(false);
          },
          items(u) {
            const { items: f } = u.detail;
            for (; i.length !== 0; ) i.remove(0);
            for (const g of f) {
              const { displayValue: p, exportValue: b } = g, m = document.createElement("option");
              m.textContent = p, m.value = b, i.append(m);
            }
            i.options.length > 0 && (i.options[0].selected = true), t.setValue(e, {
              value: a(true),
              items: l(u)
            }), o = a(false);
          },
          indices(u) {
            const f = new Set(u.detail.indices);
            for (const g of u.target.options) g.selected = f.has(g.index);
            t.setValue(e, {
              value: a(true)
            }), o = a(false);
          },
          editable(u) {
            u.target.disabled = !u.detail.editable;
          }
        };
        this._dispatchEventFromSandbox(c, h);
      }), i.addEventListener("input", (h) => {
        var _a29;
        const c = a(true), u = a(false);
        t.setValue(e, {
          value: c
        }), h.preventDefault(), (_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: e,
            name: "Keystroke",
            value: o,
            change: u,
            changeEx: c,
            willCommit: false,
            commitKey: 1,
            keyDown: false
          }
        });
      }), this._setEventListeners(i, null, [
        [
          "focus",
          "Focus"
        ],
        [
          "blur",
          "Blur"
        ],
        [
          "mousedown",
          "Mouse Down"
        ],
        [
          "mouseenter",
          "Mouse Enter"
        ],
        [
          "mouseleave",
          "Mouse Exit"
        ],
        [
          "mouseup",
          "Mouse Up"
        ],
        [
          "input",
          "Action"
        ],
        [
          "input",
          "Validate"
        ]
      ], (h) => h.target.value)) : i.addEventListener("input", function(h) {
        t.setValue(e, {
          value: a(true)
        });
      }), this.data.combo && this._setTextStyle(i), this._setBackgroundColor(i), this._setDefaultPropertiesFromJS(i), this.container.append(i), this.container;
    }
  }
  class ps extends q {
    constructor(t) {
      const { data: e, elements: s, parent: i } = t, n = !!i._commentManager;
      super(t, {
        isRenderable: !n && q._hasPopupData(e)
      });
      __privateAdd(this, _ps_instances);
      if (this.elements = s, n && q._hasPopupData(e)) {
        const r = this.popup = __privateMethod(this, _ps_instances, t_fn6).call(this);
        for (const a of s) a.popup = r;
      } else this.popup = null;
    }
    render() {
      const { container: t } = this;
      t.classList.add("popupAnnotation"), t.role = "comment";
      const e = this.popup = __privateMethod(this, _ps_instances, t_fn6).call(this), s = [];
      for (const i of this.elements) i.popup = e, i.container.ariaHasPopup = "dialog", s.push(i.data.id), i.addHighlightArea();
      return this.container.setAttribute("aria-controls", s.map((i) => `${Vt}${i}`).join(",")), this.container;
    }
  }
  _ps_instances = new WeakSet();
  t_fn6 = function() {
    return new Mr({
      container: this.container,
      color: this.data.color,
      titleObj: this.data.titleObj,
      modificationDate: this.data.modificationDate || this.data.creationDate,
      contentsObj: this.data.contentsObj,
      richText: this.data.richText,
      rect: this.data.rect,
      parentRect: this.data.parentRect || null,
      parent: this.parent,
      elements: this.elements,
      open: this.data.open,
      commentManager: this.parent._commentManager
    });
  };
  class Mr {
    constructor({ container: t, color: e, elements: s, titleObj: i, modificationDate: n, contentsObj: r, richText: a, parent: o, rect: l, parentRect: h, open: c, commentManager: u = null }) {
      __privateAdd(this, _Mr_instances);
      __privateAdd(this, _t52, null);
      __privateAdd(this, _e38, __privateMethod(this, _Mr_instances, G_fn2).bind(this));
      __privateAdd(this, _i31, __privateMethod(this, _Mr_instances, U_fn2).bind(this));
      __privateAdd(this, _s25, __privateMethod(this, _Mr_instances, L_fn2).bind(this));
      __privateAdd(this, _a18, __privateMethod(this, _Mr_instances, S_fn2).bind(this));
      __privateAdd(this, _r17, null);
      __privateAdd(this, _n17, null);
      __privateAdd(this, _o13, null);
      __privateAdd(this, _h11, null);
      __privateAdd(this, _l9, null);
      __privateAdd(this, _u8, null);
      __privateAdd(this, _d8, null);
      __privateAdd(this, _f7, false);
      __privateAdd(this, _m5, null);
      __privateAdd(this, _g6, null);
      __privateAdd(this, _c6, null);
      __privateAdd(this, _p5, null);
      __privateAdd(this, _b5, null);
      __privateAdd(this, _A4, null);
      __privateAdd(this, _y4, null);
      __privateAdd(this, _C4, null);
      __privateAdd(this, _E4, null);
      __privateAdd(this, _v4, null);
      __privateAdd(this, _x3, false);
      __privateAdd(this, _w3, null);
      __privateAdd(this, __3, null);
      __privateSet(this, _n17, t), __privateSet(this, _E4, i), __privateSet(this, _o13, r), __privateSet(this, _C4, a), __privateSet(this, _u8, o), __privateSet(this, _r17, e), __privateSet(this, _y4, l), __privateSet(this, _d8, h), __privateSet(this, _l9, s), __privateSet(this, _t52, u), __privateSet(this, _w3, s[0]), __privateSet(this, _h11, ls.toDateObject(n)), this.trigger = s.flatMap((f) => f.getElementsToTriggerPopup()), u || (__privateMethod(this, _Mr_instances, M_fn3).call(this), __privateGet(this, _n17).hidden = true, c && __privateMethod(this, _Mr_instances, S_fn2).call(this));
    }
    renderCommentButton() {
      if (__privateGet(this, _p5)) {
        __privateGet(this, _p5).parentNode || __privateGet(this, _w3).container.after(__privateGet(this, _p5));
        return;
      }
      if (__privateGet(this, _b5) || __privateMethod(this, _Mr_instances, P_fn3).call(this), !__privateGet(this, _b5)) return;
      const { signal: t } = __privateSet(this, _g6, new AbortController()), e = __privateGet(this, _w3).hasOwnCommentButton, s = () => {
        __privateGet(this, _t52).toggleCommentPopup(this, true, void 0, !e);
      }, i = () => {
        __privateGet(this, _t52).toggleCommentPopup(this, false, true, !e);
      }, n = () => {
        __privateGet(this, _t52).toggleCommentPopup(this, false, false);
      };
      if (e) {
        __privateSet(this, _p5, __privateGet(this, _w3).container);
        for (const r of this.trigger) r.ariaHasPopup = "dialog", r.ariaControls = "commentPopup", r.addEventListener("keydown", __privateGet(this, _e38), {
          signal: t
        }), r.addEventListener("click", s, {
          signal: t
        }), r.addEventListener("pointerenter", i, {
          signal: t
        }), r.addEventListener("pointerleave", n, {
          signal: t
        }), r.classList.add("popupTriggerArea");
      } else {
        const r = __privateSet(this, _p5, document.createElement("button"));
        r.className = "annotationCommentButton";
        const a = __privateGet(this, _w3).container;
        r.style.zIndex = a.style.zIndex + 1, r.tabIndex = 0, r.ariaHasPopup = "dialog", r.ariaControls = "commentPopup", r.setAttribute("data-l10n-id", "pdfjs-show-comment-button"), __privateMethod(this, _Mr_instances, O_fn3).call(this), __privateMethod(this, _Mr_instances, k_fn3).call(this), r.addEventListener("keydown", __privateGet(this, _e38), {
          signal: t
        }), r.addEventListener("click", s, {
          signal: t
        }), r.addEventListener("pointerenter", i, {
          signal: t
        }), r.addEventListener("pointerleave", n, {
          signal: t
        }), a.after(r);
      }
    }
    get commentButtonColor() {
      const { color: t, opacity: e } = __privateGet(this, _w3).commentData;
      return t ? __privateGet(this, _u8)._commentManager.makeCommentColor(t, e) : null;
    }
    focusCommentButton() {
      setTimeout(() => {
        var _a29;
        (_a29 = __privateGet(this, _p5)) == null ? void 0 : _a29.focus();
      }, 0);
    }
    getData() {
      const { richText: t, color: e, opacity: s, creationDate: i, modificationDate: n } = __privateGet(this, _w3).commentData;
      return {
        contentsObj: {
          str: this.comment
        },
        richText: t,
        color: e,
        opacity: s,
        creationDate: i,
        modificationDate: n
      };
    }
    get elementBeforePopup() {
      return __privateGet(this, _p5);
    }
    get comment() {
      return __privateGet(this, __3) || __privateSet(this, __3, __privateGet(this, _w3).commentText), __privateGet(this, __3);
    }
    set comment(t) {
      t !== this.comment && (__privateGet(this, _w3).commentText = __privateSet(this, __3, t));
    }
    focus() {
      var _a29;
      (_a29 = __privateGet(this, _w3).container) == null ? void 0 : _a29.focus();
    }
    get parentBoundingClientRect() {
      return __privateGet(this, _w3).layer.getBoundingClientRect();
    }
    setCommentButtonStates({ selected: t, hasPopup: e }) {
      __privateGet(this, _p5) && (__privateGet(this, _p5).classList.toggle("selected", t), __privateGet(this, _p5).ariaExpanded = e);
    }
    setSelectedCommentButton(t) {
      __privateGet(this, _p5).classList.toggle("selected", t);
    }
    get commentPopupPosition() {
      if (__privateGet(this, _A4)) return __privateGet(this, _A4);
      const { x: t, y: e, height: s } = __privateGet(this, _p5).getBoundingClientRect(), { x: i, y: n, width: r, height: a } = __privateGet(this, _w3).layer.getBoundingClientRect();
      return [
        (t - i) / r,
        (e + s - n) / a
      ];
    }
    set commentPopupPosition(t) {
      __privateSet(this, _A4, t);
    }
    hasDefaultPopupPosition() {
      return __privateGet(this, _A4) === null;
    }
    get commentButtonPosition() {
      return __privateGet(this, _b5);
    }
    get commentButtonWidth() {
      return __privateGet(this, _p5).getBoundingClientRect().width / this.parentBoundingClientRect.width;
    }
    editComment(t) {
      const [e, s] = __privateGet(this, _A4) || this.commentButtonPosition.map((l) => l / 100), i = this.parentBoundingClientRect, { x: n, y: r, width: a, height: o } = i;
      __privateGet(this, _t52).showDialog(null, this, n + e * a, r + s * o, {
        ...t,
        parentDimensions: i
      });
    }
    render() {
      var _a29, _b7;
      if (__privateGet(this, _m5)) return;
      const t = __privateSet(this, _m5, document.createElement("div"));
      if (t.className = "popup", __privateGet(this, _r17)) {
        const s = t.style.outlineColor = T.makeHexColor(...__privateGet(this, _r17));
        t.style.backgroundColor = `color-mix(in srgb, ${s} 30%, white)`;
      }
      const e = document.createElement("span");
      if (e.className = "header", (_a29 = __privateGet(this, _E4)) == null ? void 0 : _a29.str) {
        const s = document.createElement("span");
        s.className = "title", e.append(s), { dir: s.dir, str: s.textContent } = __privateGet(this, _E4);
      }
      if (t.append(e), __privateGet(this, _h11)) {
        const s = document.createElement("time");
        s.className = "popupDate", s.setAttribute("data-l10n-id", "pdfjs-annotation-date-time-string"), s.setAttribute("data-l10n-args", JSON.stringify({
          dateObj: __privateGet(this, _h11).valueOf()
        })), s.dateTime = __privateGet(this, _h11).toISOString(), e.append(s);
      }
      mi({
        html: __privateGet(this, _Mr_instances, I_get) || __privateGet(this, _o13).str,
        dir: (_b7 = __privateGet(this, _o13)) == null ? void 0 : _b7.dir,
        className: "popupContent"
      }, t), __privateGet(this, _n17).append(t);
    }
    updateEdited({ rect: t, popup: e, deleted: s }) {
      var _a29;
      if (__privateGet(this, _t52)) {
        s ? (this.remove(), __privateSet(this, __3, null)) : e && (e.deleted ? this.remove() : (__privateMethod(this, _Mr_instances, O_fn3).call(this), __privateSet(this, __3, e.text))), t && (__privateSet(this, _b5, null), __privateMethod(this, _Mr_instances, P_fn3).call(this), __privateMethod(this, _Mr_instances, k_fn3).call(this));
        return;
      }
      if (s || (e == null ? void 0 : e.deleted)) {
        this.remove();
        return;
      }
      __privateMethod(this, _Mr_instances, M_fn3).call(this), __privateGet(this, _v4) || __privateSet(this, _v4, {
        contentsObj: __privateGet(this, _o13),
        richText: __privateGet(this, _C4)
      }), t && __privateSet(this, _c6, null), e && e.text && (__privateSet(this, _C4, __privateMethod(this, _Mr_instances, F_fn2).call(this, e.text)), __privateSet(this, _h11, ls.toDateObject(e.date)), __privateSet(this, _o13, null)), (_a29 = __privateGet(this, _m5)) == null ? void 0 : _a29.remove(), __privateSet(this, _m5, null);
    }
    resetEdited() {
      var _a29;
      __privateGet(this, _v4) && ({ contentsObj: __privateWrapper(this, _o13)._, richText: __privateWrapper(this, _C4)._ } = __privateGet(this, _v4), __privateSet(this, _v4, null), (_a29 = __privateGet(this, _m5)) == null ? void 0 : _a29.remove(), __privateSet(this, _m5, null), __privateSet(this, _c6, null));
    }
    remove() {
      var _a29, _b7, _c10;
      if ((_a29 = __privateGet(this, _g6)) == null ? void 0 : _a29.abort(), __privateSet(this, _g6, null), (_b7 = __privateGet(this, _m5)) == null ? void 0 : _b7.remove(), __privateSet(this, _m5, null), __privateSet(this, _x3, false), __privateSet(this, _f7, false), (_c10 = __privateGet(this, _p5)) == null ? void 0 : _c10.remove(), __privateSet(this, _p5, null), this.trigger) for (const t of this.trigger) t.classList.remove("popupTriggerArea");
    }
    forceHide() {
      __privateSet(this, _x3, this.isVisible), __privateGet(this, _x3) && (__privateGet(this, _n17).hidden = true);
    }
    maybeShow() {
      __privateGet(this, _t52) || (__privateMethod(this, _Mr_instances, M_fn3).call(this), __privateGet(this, _x3) && (__privateGet(this, _m5) || __privateMethod(this, _Mr_instances, L_fn2).call(this), __privateSet(this, _x3, false), __privateGet(this, _n17).hidden = false));
    }
    get isVisible() {
      return __privateGet(this, _t52) ? false : __privateGet(this, _n17).hidden === false;
    }
  }
  _t52 = new WeakMap();
  _e38 = new WeakMap();
  _i31 = new WeakMap();
  _s25 = new WeakMap();
  _a18 = new WeakMap();
  _r17 = new WeakMap();
  _n17 = new WeakMap();
  _o13 = new WeakMap();
  _h11 = new WeakMap();
  _l9 = new WeakMap();
  _u8 = new WeakMap();
  _d8 = new WeakMap();
  _f7 = new WeakMap();
  _m5 = new WeakMap();
  _g6 = new WeakMap();
  _c6 = new WeakMap();
  _p5 = new WeakMap();
  _b5 = new WeakMap();
  _A4 = new WeakMap();
  _y4 = new WeakMap();
  _C4 = new WeakMap();
  _E4 = new WeakMap();
  _v4 = new WeakMap();
  _x3 = new WeakMap();
  _w3 = new WeakMap();
  __3 = new WeakMap();
  _Mr_instances = new WeakSet();
  M_fn3 = function() {
    var _a29;
    if (__privateGet(this, _g6)) return;
    __privateSet(this, _g6, new AbortController());
    const { signal: t } = __privateGet(this, _g6);
    for (const e of this.trigger) e.addEventListener("click", __privateGet(this, _a18), {
      signal: t
    }), e.addEventListener("pointerenter", __privateGet(this, _s25), {
      signal: t
    }), e.addEventListener("pointerleave", __privateGet(this, _i31), {
      signal: t
    }), e.classList.add("popupTriggerArea");
    for (const e of __privateGet(this, _l9)) (_a29 = e.container) == null ? void 0 : _a29.addEventListener("keydown", __privateGet(this, _e38), {
      signal: t
    });
  };
  P_fn3 = function() {
    const t = __privateGet(this, _l9).find((e) => e.hasCommentButton);
    t && __privateSet(this, _b5, t._normalizePoint(t.commentButtonPosition));
  };
  k_fn3 = function() {
    if (__privateGet(this, _w3).extraPopupElement && !__privateGet(this, _w3).editor) return;
    __privateGet(this, _p5) || this.renderCommentButton();
    const [t, e] = __privateGet(this, _b5), { style: s } = __privateGet(this, _p5);
    s.left = `calc(${t}%)`, s.top = `calc(${e}% - var(--comment-button-dim))`;
  };
  O_fn3 = function() {
    __privateGet(this, _w3).extraPopupElement || (__privateGet(this, _p5) || this.renderCommentButton(), __privateGet(this, _p5).style.backgroundColor = this.commentButtonColor || "");
  };
  I_get = function() {
    const t = __privateGet(this, _C4), e = __privateGet(this, _o13);
    return (t == null ? void 0 : t.str) && (!(e == null ? void 0 : e.str) || e.str === t.str) && __privateGet(this, _C4).html || null;
  };
  R_get = function() {
    var _a29, _b7, _c10;
    return ((_c10 = (_b7 = (_a29 = __privateGet(this, _Mr_instances, I_get)) == null ? void 0 : _a29.attributes) == null ? void 0 : _b7.style) == null ? void 0 : _c10.fontSize) || 0;
  };
  B_get = function() {
    var _a29, _b7, _c10;
    return ((_c10 = (_b7 = (_a29 = __privateGet(this, _Mr_instances, I_get)) == null ? void 0 : _a29.attributes) == null ? void 0 : _b7.style) == null ? void 0 : _c10.color) || null;
  };
  F_fn2 = function(t) {
    const e = [], s = {
      str: t,
      html: {
        name: "div",
        attributes: {
          dir: "auto"
        },
        children: [
          {
            name: "p",
            children: e
          }
        ]
      }
    }, i = {
      style: {
        color: __privateGet(this, _Mr_instances, B_get),
        fontSize: __privateGet(this, _Mr_instances, R_get) ? `calc(${__privateGet(this, _Mr_instances, R_get)}px * var(--total-scale-factor))` : ""
      }
    };
    for (const n of t.split(`
`)) e.push({
      name: "span",
      value: n,
      attributes: i
    });
    return s;
  };
  G_fn2 = function(t) {
    t.altKey || t.shiftKey || t.ctrlKey || t.metaKey || (t.key === "Enter" || t.key === "Escape" && __privateGet(this, _f7)) && __privateMethod(this, _Mr_instances, S_fn2).call(this);
  };
  T_fn2 = function() {
    if (__privateGet(this, _c6) !== null) return;
    const { page: { view: t }, viewport: { rawDims: { pageWidth: e, pageHeight: s, pageX: i, pageY: n } } } = __privateGet(this, _u8);
    let r = !!__privateGet(this, _d8), a = r ? __privateGet(this, _d8) : __privateGet(this, _y4);
    for (const g of __privateGet(this, _l9)) if (!a || T.intersect(g.data.rect, a) !== null) {
      a = g.data.rect, r = true;
      break;
    }
    const o = T.normalizeRect([
      a[0],
      t[3] - a[1] + t[1],
      a[2],
      t[3] - a[3] + t[1]
    ]), h = r ? a[2] - a[0] + 5 : 0, c = o[0] + h, u = o[1];
    __privateSet(this, _c6, [
      100 * (c - i) / e,
      100 * (u - n) / s
    ]);
    const { style: f } = __privateGet(this, _n17);
    f.left = `${__privateGet(this, _c6)[0]}%`, f.top = `${__privateGet(this, _c6)[1]}%`;
  };
  S_fn2 = function() {
    if (__privateGet(this, _t52)) {
      __privateGet(this, _t52).toggleCommentPopup(this, false);
      return;
    }
    __privateSet(this, _f7, !__privateGet(this, _f7)), __privateGet(this, _f7) ? (__privateMethod(this, _Mr_instances, L_fn2).call(this), __privateGet(this, _n17).addEventListener("click", __privateGet(this, _a18)), __privateGet(this, _n17).addEventListener("keydown", __privateGet(this, _e38))) : (__privateMethod(this, _Mr_instances, U_fn2).call(this), __privateGet(this, _n17).removeEventListener("click", __privateGet(this, _a18)), __privateGet(this, _n17).removeEventListener("keydown", __privateGet(this, _e38)));
  };
  L_fn2 = function() {
    __privateGet(this, _m5) || this.render(), this.isVisible ? __privateGet(this, _f7) && __privateGet(this, _n17).classList.add("focused") : (__privateMethod(this, _Mr_instances, T_fn2).call(this), __privateGet(this, _n17).hidden = false, __privateGet(this, _n17).style.zIndex = parseInt(__privateGet(this, _n17).style.zIndex) + 1e3);
  };
  U_fn2 = function() {
    __privateGet(this, _n17).classList.remove("focused"), !(__privateGet(this, _f7) || !this.isVisible) && (__privateGet(this, _n17).hidden = true, __privateGet(this, _n17).style.zIndex = parseInt(__privateGet(this, _n17).style.zIndex) - 1e3);
  };
  class Ni extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      }), this.textContent = t.data.textContent, this.textPosition = t.data.textPosition, this.annotationEditorType = R.FREETEXT;
    }
    render() {
      if (this.container.classList.add("freeTextAnnotation"), this.textContent) {
        const t = this.contentElement = document.createElement("div");
        t.classList.add("annotationTextContent"), t.setAttribute("role", "comment");
        for (const e of this.textContent) {
          const s = document.createElement("span");
          s.textContent = e, t.append(s);
        }
        this.container.append(t);
      }
      return !this.data.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this._editOnDoubleClick(), this.container;
    }
  }
  class Dr extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
      __privateAdd(this, _t53, null);
    }
    render() {
      this.container.classList.add("lineAnnotation");
      const { data: t, width: e, height: s } = this, i = this.svgFactory.create(e, s, true), n = __privateSet(this, _t53, this.svgFactory.createElement("svg:line"));
      return n.setAttribute("x1", t.rect[2] - t.lineCoordinates[0]), n.setAttribute("y1", t.rect[3] - t.lineCoordinates[1]), n.setAttribute("x2", t.rect[2] - t.lineCoordinates[2]), n.setAttribute("y2", t.rect[3] - t.lineCoordinates[3]), n.setAttribute("stroke-width", t.borderStyle.width || 1), n.setAttribute("stroke", "transparent"), n.setAttribute("fill", "transparent"), i.append(n), this.container.append(i), !t.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container;
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _t53);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t53 = new WeakMap();
  class Ir extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
      __privateAdd(this, _t54, null);
    }
    render() {
      this.container.classList.add("squareAnnotation");
      const { data: t, width: e, height: s } = this, i = this.svgFactory.create(e, s, true), n = t.borderStyle.width, r = __privateSet(this, _t54, this.svgFactory.createElement("svg:rect"));
      return r.setAttribute("x", n / 2), r.setAttribute("y", n / 2), r.setAttribute("width", e - n), r.setAttribute("height", s - n), r.setAttribute("stroke-width", n || 1), r.setAttribute("stroke", "transparent"), r.setAttribute("fill", "transparent"), i.append(r), this.container.append(i), !t.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container;
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _t54);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t54 = new WeakMap();
  class Lr extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
      __privateAdd(this, _t55, null);
    }
    render() {
      this.container.classList.add("circleAnnotation");
      const { data: t, width: e, height: s } = this, i = this.svgFactory.create(e, s, true), n = t.borderStyle.width, r = __privateSet(this, _t55, this.svgFactory.createElement("svg:ellipse"));
      return r.setAttribute("cx", e / 2), r.setAttribute("cy", s / 2), r.setAttribute("rx", e / 2 - n / 2), r.setAttribute("ry", s / 2 - n / 2), r.setAttribute("stroke-width", n || 1), r.setAttribute("stroke", "transparent"), r.setAttribute("fill", "transparent"), i.append(r), this.container.append(i), !t.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container;
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _t55);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t55 = new WeakMap();
  class Oi extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
      __privateAdd(this, _t56, null);
      this.containerClassName = "polylineAnnotation", this.svgElementName = "svg:polyline";
    }
    render() {
      this.container.classList.add(this.containerClassName);
      const { data: { rect: t, vertices: e, borderStyle: s, popupRef: i }, width: n, height: r } = this;
      if (!e) return this.container;
      const a = this.svgFactory.create(n, r, true);
      let o = [];
      for (let h = 0, c = e.length; h < c; h += 2) {
        const u = e[h] - t[0], f = t[3] - e[h + 1];
        o.push(`${u},${f}`);
      }
      o = o.join(" ");
      const l = __privateSet(this, _t56, this.svgFactory.createElement(this.svgElementName));
      return l.setAttribute("points", o), l.setAttribute("stroke-width", s.width || 1), l.setAttribute("stroke", "transparent"), l.setAttribute("fill", "transparent"), a.append(l), this.container.append(a), !i && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container;
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _t56);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t56 = new WeakMap();
  class Rr extends Oi {
    constructor(t) {
      super(t), this.containerClassName = "polygonAnnotation", this.svgElementName = "svg:polygon";
    }
  }
  class Fr extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
    }
    render() {
      return this.container.classList.add("caretAnnotation"), !this.data.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container;
    }
  }
  class ks extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      });
      __privateAdd(this, _ks_instances);
      __privateAdd(this, _t57, null);
      __privateAdd(this, _e39, []);
      this.containerClassName = "inkAnnotation", this.svgElementName = "svg:polyline", this.annotationEditorType = this.data.it === "InkHighlight" ? R.HIGHLIGHT : R.INK;
    }
    render() {
      this.container.classList.add(this.containerClassName);
      const { data: { rect: t, rotation: e, inkLists: s, borderStyle: i, popupRef: n } } = this, { transform: r, width: a, height: o } = __privateMethod(this, _ks_instances, i_fn8).call(this, e, t), l = this.svgFactory.create(a, o, true), h = __privateSet(this, _t57, this.svgFactory.createElement("svg:g"));
      l.append(h), h.setAttribute("stroke-width", i.width || 1), h.setAttribute("stroke-linecap", "round"), h.setAttribute("stroke-linejoin", "round"), h.setAttribute("stroke-miterlimit", 10), h.setAttribute("stroke", "transparent"), h.setAttribute("fill", "transparent"), h.setAttribute("transform", r);
      for (let c = 0, u = s.length; c < u; c++) {
        const f = this.svgFactory.createElement(this.svgElementName);
        __privateGet(this, _e39).push(f), f.setAttribute("points", s[c].join(",")), h.append(f);
      }
      return !n && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.append(l), this._editOnDoubleClick(), this.container;
    }
    updateEdited(t) {
      super.updateEdited(t);
      const { thickness: e, points: s, rect: i } = t, n = __privateGet(this, _t57);
      if (e >= 0 && n.setAttribute("stroke-width", e || 1), s) for (let r = 0, a = __privateGet(this, _e39).length; r < a; r++) __privateGet(this, _e39)[r].setAttribute("points", s[r].join(","));
      if (i) {
        const { transform: r, width: a, height: o } = __privateMethod(this, _ks_instances, i_fn8).call(this, this.data.rotation, i);
        n.parentElement.setAttribute("viewBox", `0 0 ${a} ${o}`), n.setAttribute("transform", r);
      }
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _e39);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t57 = new WeakMap();
  _e39 = new WeakMap();
  _ks_instances = new WeakSet();
  i_fn8 = function(t, e) {
    switch (t) {
      case 90:
        return {
          transform: `rotate(90) translate(${-e[0]},${e[1]}) scale(1,-1)`,
          width: e[3] - e[1],
          height: e[2] - e[0]
        };
      case 180:
        return {
          transform: `rotate(180) translate(${-e[2]},${e[1]}) scale(1,-1)`,
          width: e[2] - e[0],
          height: e[3] - e[1]
        };
      case 270:
        return {
          transform: `rotate(270) translate(${-e[2]},${e[3]}) scale(1,-1)`,
          width: e[3] - e[1],
          height: e[2] - e[0]
        };
      default:
        return {
          transform: `translate(${-e[0]},${e[3]}) scale(1,-1)`,
          width: e[2] - e[0],
          height: e[3] - e[1]
        };
    }
  };
  class Bi extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true,
        createQuadrilaterals: true
      }), this.annotationEditorType = R.HIGHLIGHT;
    }
    render() {
      const { data: { overlaidText: t, popupRef: e } } = this;
      if (!e && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.classList.add("highlightAnnotation"), this._editOnDoubleClick(), t) {
        const s = document.createElement("mark");
        s.classList.add("overlaidText"), s.textContent = t, this.container.append(s);
      }
      return this.container;
    }
  }
  class Nr extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true,
        createQuadrilaterals: true
      });
    }
    render() {
      const { data: { overlaidText: t, popupRef: e } } = this;
      if (!e && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.classList.add("underlineAnnotation"), t) {
        const s = document.createElement("u");
        s.classList.add("overlaidText"), s.textContent = t, this.container.append(s);
      }
      return this.container;
    }
  }
  class Or extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true,
        createQuadrilaterals: true
      });
    }
    render() {
      const { data: { overlaidText: t, popupRef: e } } = this;
      if (!e && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.classList.add("squigglyAnnotation"), t) {
        const s = document.createElement("u");
        s.classList.add("overlaidText"), s.textContent = t, this.container.append(s);
      }
      return this.container;
    }
  }
  class Br extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true,
        createQuadrilaterals: true
      });
    }
    render() {
      const { data: { overlaidText: t, popupRef: e } } = this;
      if (!e && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this.container.classList.add("strikeoutAnnotation"), t) {
        const s = document.createElement("s");
        s.classList.add("overlaidText"), s.textContent = t, this.container.append(s);
      }
      return this.container;
    }
  }
  class Ui extends q {
    constructor(t) {
      super(t, {
        isRenderable: true,
        ignoreBorder: true
      }), this.annotationEditorType = R.STAMP;
    }
    render() {
      return this.container.classList.add("stampAnnotation"), this.container.setAttribute("role", "img"), !this.data.popupRef && this.hasPopupData && (this.hasOwnCommentButton = true, this._createPopup()), this._editOnDoubleClick(), this.container;
    }
  }
  class Ur extends q {
    constructor(t) {
      var _a29;
      super(t, {
        isRenderable: true
      });
      __privateAdd(this, _Ur_instances);
      __privateAdd(this, _t58, null);
      const { file: e } = this.data;
      this.filename = e.filename, this.content = e.content, (_a29 = this.linkService.eventBus) == null ? void 0 : _a29.dispatch("fileattachmentannotation", {
        source: this,
        ...e
      });
    }
    render() {
      this.container.classList.add("fileAttachmentAnnotation");
      const { container: t, data: e } = this;
      let s;
      e.hasAppearance || e.fillAlpha === 0 ? s = document.createElement("div") : (s = document.createElement("img"), s.src = `${this.imageResourcesPath}annotation-${/paperclip/i.test(e.name) ? "paperclip" : "pushpin"}.svg`, e.fillAlpha && e.fillAlpha < 1 && (s.style = `filter: opacity(${Math.round(e.fillAlpha * 100)}%);`)), s.addEventListener("dblclick", __privateMethod(this, _Ur_instances, e_fn9).bind(this)), __privateSet(this, _t58, s);
      const { isMac: i } = nt.platform;
      return t.addEventListener("keydown", (n) => {
        n.key === "Enter" && (i ? n.metaKey : n.ctrlKey) && __privateMethod(this, _Ur_instances, e_fn9).call(this);
      }), !e.popupRef && this.hasPopupData ? (this.hasOwnCommentButton = true, this._createPopup()) : s.classList.add("popupTriggerArea"), t.append(s), t;
    }
    getElementsToTriggerPopup() {
      return __privateGet(this, _t58);
    }
    addHighlightArea() {
      this.container.classList.add("highlightArea");
    }
  }
  _t58 = new WeakMap();
  _Ur_instances = new WeakSet();
  e_fn9 = function() {
    var _a29;
    (_a29 = this.downloadManager) == null ? void 0 : _a29.openOrDownloadData(this.content, this.filename);
  };
  Ms = (_l10 = class {
    constructor({ div: t, accessibilityManager: e, annotationCanvasMap: s, annotationEditorUIManager: i, page: n, viewport: r, structTreeLayer: a, commentManager: o, linkService: l, annotationStorage: h }) {
      __privateAdd(this, _Ms_instances);
      __privateAdd(this, _t59, null);
      __privateAdd(this, _e40, null);
      __privateAdd(this, _i32, null);
      __privateAdd(this, _s26, /* @__PURE__ */ new Map());
      __privateAdd(this, _a19, null);
      __privateAdd(this, _r18, null);
      __privateAdd(this, _n18, []);
      __privateAdd(this, _o14, false);
      this.div = t, __privateSet(this, _t59, e), __privateSet(this, _e40, s), __privateSet(this, _a19, a || null), __privateSet(this, _r18, l || null), __privateSet(this, _i32, h || new Es()), this.page = n, this.viewport = r, this.zIndex = 0, this._annotationEditorUIManager = i, this._commentManager = o || null;
    }
    hasEditableAnnotations() {
      return __privateGet(this, _s26).size > 0;
    }
    async render(t) {
      var _a29;
      const { annotations: e } = t, s = this.div;
      Ot(s, this.viewport);
      const i = /* @__PURE__ */ new Map(), n = [], r = {
        data: null,
        layer: s,
        linkService: __privateGet(this, _r18),
        downloadManager: t.downloadManager,
        imageResourcesPath: t.imageResourcesPath || "",
        renderForms: t.renderForms !== false,
        svgFactory: new Ie(),
        annotationStorage: __privateGet(this, _i32),
        enableComment: t.enableComment === true,
        enableScripting: t.enableScripting === true,
        hasJSActions: t.hasJSActions,
        fieldObjects: t.fieldObjects,
        parent: this,
        elements: null
      };
      for (const a of e) {
        if (a.noHTML) continue;
        const o = a.annotationType === st.POPUP;
        if (o) {
          const c = i.get(a.id);
          if (!c) continue;
          if (!this._commentManager) {
            n.push(a);
            continue;
          }
          r.elements = c;
        } else if (a.rect[2] === a.rect[0] || a.rect[3] === a.rect[1]) continue;
        r.data = a;
        const l = ss.create(r);
        if (!l.isRenderable) continue;
        o || (__privateGet(this, _n18).push(l), a.popupRef && i.getOrInsertComputed(a.popupRef, fi).push(l));
        const h = l.render();
        a.hidden && (h.style.visibility = "hidden"), l._isEditable && (__privateGet(this, _s26).set(l.data.id, l), (_a29 = this._annotationEditorUIManager) == null ? void 0 : _a29.renderAnnotationElement(l));
      }
      await __privateMethod(this, _Ms_instances, h_fn5).call(this);
      for (const a of n) {
        const o = r.elements = i.get(a.id);
        r.data = a;
        const l = ss.create(r);
        if (!l.isRenderable) continue;
        const h = l.render();
        l.contentElement.id = `${Vt}${a.id}`, a.hidden && (h.style.visibility = "hidden"), o.at(-1).container.after(h);
      }
      __privateMethod(this, _Ms_instances, l_fn6).call(this);
    }
    async addLinkAnnotations(t) {
      const e = {
        data: null,
        layer: this.div,
        linkService: __privateGet(this, _r18),
        svgFactory: new Ie(),
        parent: this
      };
      for (const s of t) {
        s.borderStyle || (s.borderStyle = Ms._defaultBorderStyle), e.data = s;
        const i = ss.create(e);
        i.isRenderable && (i.render(), i.contentElement.id = `${Vt}${s.id}`, __privateGet(this, _n18).push(i));
      }
      await __privateMethod(this, _Ms_instances, h_fn5).call(this);
    }
    update({ viewport: t }) {
      const e = this.div;
      this.viewport = t, Ot(e, {
        rotation: t.rotation
      }), __privateMethod(this, _Ms_instances, l_fn6).call(this), e.hidden = false;
    }
    getEditableAnnotations() {
      return Array.from(__privateGet(this, _s26).values());
    }
    getEditableAnnotation(t) {
      return __privateGet(this, _s26).get(t);
    }
    addFakeAnnotation(t) {
      const { div: e } = this, { id: s, rotation: i } = t, n = new Er({
        data: {
          id: s,
          rect: t.getPDFRect(),
          rotation: i
        },
        editor: t,
        layer: e,
        parent: this,
        enableComment: !!this._commentManager,
        linkService: __privateGet(this, _r18),
        annotationStorage: __privateGet(this, _i32)
      });
      return n.render(), n.contentElement.id = `${Vt}${s}`, n.createOrUpdatePopup(), __privateGet(this, _n18).push(n), n;
    }
    removeAnnotation(t) {
      var _a29;
      const e = __privateGet(this, _n18).findIndex((i) => i.data.id === t);
      if (e < 0) return;
      const [s] = __privateGet(this, _n18).splice(e, 1);
      (_a29 = __privateGet(this, _t59)) == null ? void 0 : _a29.removePointerInTextLayer(s.contentElement);
    }
    updateFakeAnnotations(t) {
      if (t.length !== 0) {
        for (const e of t) e.updateFakeAnnotationElement(this);
        __privateMethod(this, _Ms_instances, h_fn5).call(this);
      }
    }
    togglePointerEvents(t = false) {
      this.div.classList.toggle("disabled", !t);
    }
    static get _defaultBorderStyle() {
      return L(this, "_defaultBorderStyle", Object.freeze({
        width: 1,
        rawWidth: 1,
        style: jt.SOLID,
        dashArray: [
          3
        ],
        horizontalCornerRadius: 0,
        verticalCornerRadius: 0
      }));
    }
  }, _t59 = new WeakMap(), _e40 = new WeakMap(), _i32 = new WeakMap(), _s26 = new WeakMap(), _a19 = new WeakMap(), _r18 = new WeakMap(), _n18 = new WeakMap(), _o14 = new WeakMap(), _Ms_instances = new WeakSet(), h_fn5 = async function() {
    var _a29, _b7, _c10;
    if (__privateGet(this, _n18).length === 0) return;
    this.div.replaceChildren();
    const t = [];
    if (!__privateGet(this, _o14)) {
      __privateSet(this, _o14, true);
      for (const { contentElement: s, data: { id: i } } of __privateGet(this, _n18)) {
        const n = s.id = `${Vt}${i}`;
        t.push((_a29 = __privateGet(this, _a19)) == null ? void 0 : _a29.getAriaAttributes(n).then((r) => {
          if (r) for (const [a, o] of r) s.setAttribute(a, o);
        }));
      }
    }
    __privateGet(this, _n18).sort(({ data: { rect: [s, i, n, r] } }, { data: { rect: [a, o, l, h] } }) => {
      if (s === n && i === r) return 1;
      if (a === l && o === h) return -1;
      const c = r, u = i, f = (i + r) / 2, g = h, p = o, b = (o + h) / 2;
      if (f >= g && b <= u) return -1;
      if (b >= c && f <= p) return 1;
      const m = (s + n) / 2, A = (a + l) / 2;
      return m - A;
    });
    const e = document.createDocumentFragment();
    for (const s of __privateGet(this, _n18)) e.append(s.container), this._commentManager ? (_c10 = ((_b7 = s.extraPopupElement) == null ? void 0 : _b7.popup) || s.popup) == null ? void 0 : _c10.renderCommentButton() : s.extraPopupElement && e.append(s.extraPopupElement.render());
    if (this.div.append(e), await Promise.all(t), __privateGet(this, _t59)) for (const s of __privateGet(this, _n18)) __privateGet(this, _t59).addPointerInTextLayer(s.contentElement, false);
  }, l_fn6 = function() {
    var _a29;
    if (!__privateGet(this, _e40)) return;
    const t = this.div;
    for (const [e, s] of __privateGet(this, _e40)) {
      const i = t.querySelector(`[data-annotation-id="${e}"]`);
      if (!i) continue;
      s.className = "annotationContent";
      const { firstChild: n } = i;
      n ? n.nodeName === "CANVAS" ? n.replaceWith(s) : n.classList.contains("annotationContent") ? n.after(s) : n.before(s) : i.append(s);
      const r = __privateGet(this, _s26).get(e);
      r && (r._hasNoCanvas ? ((_a29 = this._annotationEditorUIManager) == null ? void 0 : _a29.setMissingCanvas(e, i.id, s), r._hasNoCanvas = false) : r.canvas = s);
    }
    __privateGet(this, _e40).clear();
  }, _l10);
  const xe = /\r\n?|\n/g;
  const _at = class _at extends D {
    constructor(t) {
      super({
        ...t,
        name: "freeTextEditor"
      });
      __privateAdd(this, _at_instances);
      __privateAdd(this, _t60, "");
      __privateAdd(this, _e41, `${this.id}-editor`);
      __privateAdd(this, _i33, null);
      __privateAdd(this, _s27);
      __publicField(this, "_colorPicker", null);
      this.color = t.color || _at._defaultColor || D._defaultLineColor, __privateSet(this, _s27, t.fontSize || _at._defaultFontSize), this.annotationElementId || this._uiManager.a11yAlert("pdfjs-editor-freetext-added-alert"), this.canAddComment = false;
    }
    static get _keyboardManager() {
      const t = _at.prototype, e = (n) => n.isEmpty(), s = Ft.TRANSLATE_SMALL, i = Ft.TRANSLATE_BIG;
      return L(this, "_keyboardManager", new ye([
        [
          [
            "ctrl+s",
            "mac+meta+s",
            "ctrl+p",
            "mac+meta+p"
          ],
          t.commitOrRemove,
          {
            bubbles: true
          }
        ],
        [
          [
            "ctrl+Enter",
            "mac+meta+Enter",
            "Escape",
            "mac+Escape"
          ],
          t.commitOrRemove
        ],
        [
          [
            "ArrowLeft",
            "mac+ArrowLeft"
          ],
          t._translateEmpty,
          {
            args: [
              -s,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowLeft",
            "mac+shift+ArrowLeft"
          ],
          t._translateEmpty,
          {
            args: [
              -i,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowRight",
            "mac+ArrowRight"
          ],
          t._translateEmpty,
          {
            args: [
              s,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowRight",
            "mac+shift+ArrowRight"
          ],
          t._translateEmpty,
          {
            args: [
              i,
              0
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowUp",
            "mac+ArrowUp"
          ],
          t._translateEmpty,
          {
            args: [
              0,
              -s
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowUp",
            "mac+shift+ArrowUp"
          ],
          t._translateEmpty,
          {
            args: [
              0,
              -i
            ],
            checker: e
          }
        ],
        [
          [
            "ArrowDown",
            "mac+ArrowDown"
          ],
          t._translateEmpty,
          {
            args: [
              0,
              s
            ],
            checker: e
          }
        ],
        [
          [
            "ctrl+ArrowDown",
            "mac+shift+ArrowDown"
          ],
          t._translateEmpty,
          {
            args: [
              0,
              i
            ],
            checker: e
          }
        ]
      ]));
    }
    static initialize(t, e) {
      D.initialize(t, e);
      const s = getComputedStyle(document.documentElement);
      this._internalPadding = parseFloat(s.getPropertyValue("--freetext-padding"));
    }
    static updateDefaultParams(t, e) {
      switch (t) {
        case O.FREETEXT_SIZE:
          _at._defaultFontSize = e;
          break;
        case O.FREETEXT_COLOR:
          _at._defaultColor = e;
          break;
      }
    }
    updateParams(t, e) {
      switch (t) {
        case O.FREETEXT_SIZE:
          __privateMethod(this, _at_instances, a_fn6).call(this, e);
          break;
        case O.FREETEXT_COLOR:
          __privateMethod(this, _at_instances, r_fn2).call(this, e);
          break;
      }
    }
    static get defaultPropertiesToUpdate() {
      return [
        [
          O.FREETEXT_SIZE,
          _at._defaultFontSize
        ],
        [
          O.FREETEXT_COLOR,
          _at._defaultColor || D._defaultLineColor
        ]
      ];
    }
    get propertiesToUpdate() {
      return [
        [
          O.FREETEXT_SIZE,
          __privateGet(this, _s27)
        ],
        [
          O.FREETEXT_COLOR,
          this.color
        ]
      ];
    }
    get toolbarButtons() {
      return this._colorPicker || (this._colorPicker = new pe(this)), [
        [
          "colorPicker",
          this._colorPicker
        ]
      ];
    }
    get colorType() {
      return O.FREETEXT_COLOR;
    }
    onUpdatedColor() {
      var _a29;
      this.editorDiv.style.color = this.color, (_a29 = this._colorPicker) == null ? void 0 : _a29.update(this.color), super.onUpdatedColor();
    }
    _translateEmpty(t, e) {
      this._uiManager.translateSelectedEditors(t, e, true);
    }
    getInitialTranslation() {
      const t = this.parentScale;
      return [
        -_at._internalPadding * t,
        -(_at._internalPadding + __privateGet(this, _s27)) * t
      ];
    }
    rebuild() {
      this.parent && (super.rebuild(), this.div !== null && (this.isAttachedToDOM || this.parent.add(this)));
    }
    enableEditMode() {
      if (!super.enableEditMode()) return false;
      this.overlayDiv.classList.remove("enabled"), this.editorDiv.contentEditable = true, this._isDraggable = false, this.div.removeAttribute("aria-activedescendant"), __privateSet(this, _i33, new AbortController());
      const t = this._uiManager.combinedSignal(__privateGet(this, _i33));
      return this.editorDiv.addEventListener("keydown", this.editorDivKeydown.bind(this), {
        signal: t
      }), this.editorDiv.addEventListener("focus", this.editorDivFocus.bind(this), {
        signal: t
      }), this.editorDiv.addEventListener("blur", this.editorDivBlur.bind(this), {
        signal: t
      }), this.editorDiv.addEventListener("input", this.editorDivInput.bind(this), {
        signal: t
      }), this.editorDiv.addEventListener("paste", this.editorDivPaste.bind(this), {
        signal: t
      }), true;
    }
    disableEditMode() {
      var _a29;
      return super.disableEditMode() ? (this.overlayDiv.classList.add("enabled"), this.editorDiv.contentEditable = false, this.div.setAttribute("aria-activedescendant", __privateGet(this, _e41)), this._isDraggable = true, (_a29 = __privateGet(this, _i33)) == null ? void 0 : _a29.abort(), __privateSet(this, _i33, null), this.div.focus({
        preventScroll: true
      }), this.isEditing = false, this.parent.div.classList.add("freetextEditing"), true) : false;
    }
    focusin(t) {
      this._focusEventsAllowed && (super.focusin(t), t.target !== this.editorDiv && this.editorDiv.focus());
    }
    onceAdded(t) {
      var _a29;
      this.width || (this.enableEditMode(), t && this.editorDiv.focus(), ((_a29 = this._initialOptions) == null ? void 0 : _a29.isCentered) && this.center(), this._initialOptions = null);
    }
    isEmpty() {
      return !this.editorDiv || this.editorDiv.innerText.trim() === "";
    }
    remove() {
      this.isEditing = false, this.parent && (this.parent.setEditingState(true), this.parent.div.classList.add("freetextEditing")), super.remove();
    }
    commit() {
      if (!this.isInEditMode()) return;
      super.commit(), this.disableEditMode();
      const t = __privateGet(this, _t60), e = __privateSet(this, _t60, __privateMethod(this, _at_instances, n_fn).call(this).trimEnd());
      if (t === e) return;
      const s = (i) => {
        if (__privateSet(this, _t60, i), !i) {
          this.remove();
          return;
        }
        __privateMethod(this, _at_instances, l_fn7).call(this), this._uiManager.rebuild(this), __privateMethod(this, _at_instances, o_fn3).call(this);
      };
      this.addCommands({
        cmd: () => {
          s(e);
        },
        undo: () => {
          s(t);
        },
        mustExec: false
      }), __privateMethod(this, _at_instances, o_fn3).call(this);
    }
    shouldGetKeyboardEvents() {
      return this.isInEditMode();
    }
    enterInEditMode() {
      this.enableEditMode(), this.editorDiv.focus();
    }
    keydown(t) {
      t.target === this.div && t.key === "Enter" && (this.enterInEditMode(), t.preventDefault());
    }
    editorDivKeydown(t) {
      _at._keyboardManager.exec(this, t);
    }
    editorDivFocus(t) {
      this.isEditing = true;
    }
    editorDivBlur(t) {
      this.isEditing = false;
    }
    editorDivInput(t) {
      this.parent.div.classList.toggle("freetextEditing", this.isEmpty());
    }
    disableEditing() {
      this.editorDiv.setAttribute("role", "comment"), this.editorDiv.removeAttribute("aria-multiline");
    }
    enableEditing() {
      this.editorDiv.setAttribute("role", "textbox"), this.editorDiv.setAttribute("aria-multiline", true);
    }
    get canChangeContent() {
      return true;
    }
    render() {
      if (this.div) return this.div;
      let t, e;
      (this._isCopy || this.annotationElementId) && (t = this.x, e = this.y), super.render(), this.editorDiv = document.createElement("div"), this.editorDiv.className = "internal", this.editorDiv.setAttribute("id", __privateGet(this, _e41)), this.editorDiv.setAttribute("data-l10n-id", "pdfjs-free-text2"), this.editorDiv.setAttribute("data-l10n-attrs", "default-content"), this.enableEditing(), this.editorDiv.contentEditable = true;
      const { style: s } = this.editorDiv;
      if (s.fontSize = `calc(${__privateGet(this, _s27)}px * var(--total-scale-factor))`, s.color = this.color, this.div.append(this.editorDiv), this.overlayDiv = document.createElement("div"), this.overlayDiv.classList.add("overlay", "enabled"), this.div.append(this.overlayDiv), this._isCopy || this.annotationElementId) {
        const [i, n] = this.parentDimensions;
        if (this.annotationElementId) {
          const { position: r } = this._initialData;
          let [a, o] = this.getInitialTranslation();
          [a, o] = this.pageTranslationToScreen(a, o);
          const [l, h] = this.pageDimensions, [c, u] = this.pageTranslation;
          let f, g;
          switch (this.rotation) {
            case 0:
              f = t + (r[0] - c) / l, g = e + this.height - (r[1] - u) / h;
              break;
            case 90:
              f = t + (r[0] - c) / l, g = e - (r[1] - u) / h, [a, o] = [
                o,
                -a
              ];
              break;
            case 180:
              f = t - this.width + (r[0] - c) / l, g = e - (r[1] - u) / h, [a, o] = [
                -a,
                -o
              ];
              break;
            case 270:
              f = t + (r[0] - c - this.height * h) / l, g = e + (r[1] - u - this.width * l) / h, [a, o] = [
                -o,
                a
              ];
              break;
          }
          this.setAt(f * i, g * n, a, o);
        } else this._moveAfterPaste(t, e);
        __privateMethod(this, _at_instances, l_fn7).call(this), this._isDraggable = true, this.editorDiv.contentEditable = false;
      } else this._isDraggable = false, this.editorDiv.contentEditable = true;
      return this.div;
    }
    editorDivPaste(t) {
      var _a29, _b7, _c10;
      const e = t.clipboardData || window.clipboardData, { types: s } = e;
      if (s.length === 1 && s[0] === "text/plain") return;
      t.preventDefault();
      const i = __privateMethod(_a29 = _at, _at_static, d_fn5).call(_a29, e.getData("text") || "").replaceAll(xe, `
`);
      if (!i) return;
      const n = window.getSelection();
      if (!n.rangeCount) return;
      this.editorDiv.normalize(), n.deleteFromDocument();
      const r = n.getRangeAt(0);
      if (!i.includes(`
`)) {
        r.insertNode(document.createTextNode(i)), this.editorDiv.normalize(), n.collapseToStart();
        return;
      }
      const { startContainer: a, startOffset: o } = r, l = [], h = [];
      if (a.nodeType === Node.TEXT_NODE) {
        const f = a.parentElement;
        if (h.push(a.nodeValue.slice(o).replaceAll(xe, "")), f !== this.editorDiv) {
          let g = l;
          for (const p of this.editorDiv.childNodes) {
            if (p === f) {
              g = h;
              continue;
            }
            g.push(__privateMethod(_b7 = _at, _at_static, h_fn6).call(_b7, p));
          }
        }
        l.push(a.nodeValue.slice(0, o).replaceAll(xe, ""));
      } else if (a === this.editorDiv) {
        let f = l, g = 0;
        for (const p of this.editorDiv.childNodes) g++ === o && (f = h), f.push(__privateMethod(_c10 = _at, _at_static, h_fn6).call(_c10, p));
      }
      __privateSet(this, _t60, `${l.join(`
`)}${i}${h.join(`
`)}`), __privateMethod(this, _at_instances, l_fn7).call(this);
      const c = new Range();
      let u = Math.sumPrecise(l.map((f) => f.length));
      for (const { firstChild: f } of this.editorDiv.childNodes) if (f.nodeType === Node.TEXT_NODE) {
        const g = f.nodeValue.length;
        if (u <= g) {
          c.setStart(f, u), c.setEnd(f, u);
          break;
        }
        u -= g;
      }
      n.removeAllRanges(), n.addRange(c);
    }
    get contentDiv() {
      return this.editorDiv;
    }
    getPDFRect() {
      const t = _at._internalPadding * this.parentScale;
      return this.getRect(t, t);
    }
    static async deserialize(t, e, s) {
      var _a29;
      let i = null;
      if (t instanceof Ni) {
        const { data: { defaultAppearanceData: { fontSize: r, fontColor: a }, rect: o, rotation: l, id: h, popupRef: c, richText: u, contentsObj: f, creationDate: g, modificationDate: p }, textContent: b, textPosition: m, parent: { page: { pageNumber: A } } } = t;
        if (!b || b.length === 0) return null;
        i = t = {
          annotationType: R.FREETEXT,
          color: Array.from(a),
          fontSize: r,
          value: b.join(`
`),
          position: m,
          pageIndex: A - 1,
          rect: o.slice(0),
          rotation: l,
          annotationElementId: h,
          id: h,
          deleted: false,
          popupRef: c,
          comment: (f == null ? void 0 : f.str) || null,
          richText: u,
          creationDate: g,
          modificationDate: p
        };
      }
      const n = await super.deserialize(t, e, s);
      return __privateSet(n, _s27, t.fontSize), n.color = T.makeHexColor(...t.color), __privateSet(n, _t60, __privateMethod(_a29 = _at, _at_static, d_fn5).call(_a29, t.value)), n._initialData = i, t.comment && n.setCommentData(t), n;
    }
    serialize(t = false) {
      if (this.isEmpty()) return null;
      if (this.deleted) return this.serializeDeleted();
      const e = D._colorManager.convert(this.isAttachedToDOM ? getComputedStyle(this.editorDiv).color : this.color), s = Object.assign(super.serialize(t), {
        color: e,
        fontSize: __privateGet(this, _s27),
        value: __privateMethod(this, _at_instances, u_fn8).call(this)
      });
      return this.addComment(s), t ? (s.isCopy = true, s) : this.annotationElementId && !__privateMethod(this, _at_instances, f_fn5).call(this, s) ? null : (s.id = this.annotationElementId, s);
    }
    renderAnnotationElement(t) {
      const e = super.renderAnnotationElement(t);
      if (!e) return null;
      const { style: s } = e;
      s.fontSize = `calc(${__privateGet(this, _s27)}px * var(--total-scale-factor))`, s.color = this.color, e.replaceChildren();
      for (const i of __privateGet(this, _t60).split(`
`)) {
        const n = document.createElement("div");
        n.append(i ? document.createTextNode(i) : document.createElement("br")), e.append(n);
      }
      return t.updateEdited({
        rect: this.getPDFRect(),
        popup: this._uiManager.hasCommentManager() || this.hasEditedComment ? this.comment : {
          text: __privateGet(this, _t60)
        }
      }), e;
    }
    resetAnnotationElement(t) {
      super.resetAnnotationElement(t), t.resetEdited();
    }
  };
  _t60 = new WeakMap();
  _e41 = new WeakMap();
  _i33 = new WeakMap();
  _s27 = new WeakMap();
  _at_instances = new WeakSet();
  a_fn6 = function(t) {
    const e = (i) => {
      this.editorDiv.style.fontSize = `calc(${i}px * var(--total-scale-factor))`, this.translate(0, -(i - __privateGet(this, _s27)) * this.parentScale), __privateSet(this, _s27, i), __privateMethod(this, _at_instances, o_fn3).call(this);
    }, s = __privateGet(this, _s27);
    this.addCommands({
      cmd: e.bind(this, t),
      undo: e.bind(this, s),
      post: this._uiManager.updateUI.bind(this._uiManager, this),
      mustExec: true,
      type: O.FREETEXT_SIZE,
      overwriteIfSameType: true,
      keepUndo: true
    });
  };
  r_fn2 = function(t) {
    const e = (i) => {
      this.color = i, this.onUpdatedColor();
    }, s = this.color;
    this.addCommands({
      cmd: e.bind(this, t),
      undo: e.bind(this, s),
      post: this._uiManager.updateUI.bind(this._uiManager, this),
      mustExec: true,
      type: O.FREETEXT_COLOR,
      overwriteIfSameType: true,
      keepUndo: true
    });
  };
  n_fn = function() {
    var _a29;
    const t = [];
    this.editorDiv.normalize();
    let e = null;
    for (const s of this.editorDiv.childNodes) (e == null ? void 0 : e.nodeType) === Node.TEXT_NODE && s.nodeName === "BR" || (t.push(__privateMethod(_a29 = _at, _at_static, h_fn6).call(_a29, s)), e = s);
    return t.join(`
`);
  };
  o_fn3 = function() {
    const [t, e] = this.parentDimensions;
    let s;
    if (this.isAttachedToDOM) s = this.div.getBoundingClientRect();
    else {
      const { currentLayer: i, div: n } = this, r = n.style.display, a = n.classList.contains("hidden");
      n.classList.remove("hidden"), n.style.display = "hidden", i.div.append(this.div), s = n.getBoundingClientRect(), n.remove(), n.style.display = r, n.classList.toggle("hidden", a);
    }
    this.rotation % 180 === this.parentRotation % 180 ? (this.width = s.width / t, this.height = s.height / e) : (this.width = s.height / t, this.height = s.width / e), this.fixAndSetPosition();
  };
  _at_static = new WeakSet();
  h_fn6 = function(t) {
    return (t.nodeType === Node.TEXT_NODE ? t.nodeValue : t.innerText).replaceAll(xe, "");
  };
  l_fn7 = function() {
    if (this.editorDiv.replaceChildren(), !!__privateGet(this, _t60)) for (const t of __privateGet(this, _t60).split(`
`)) {
      const e = document.createElement("div");
      e.append(t ? document.createTextNode(t) : document.createElement("br")), this.editorDiv.append(e);
    }
  };
  u_fn8 = function() {
    return __privateGet(this, _t60).replaceAll("\xA0", " ");
  };
  d_fn5 = function(t) {
    return t.replaceAll(" ", "\xA0");
  };
  f_fn5 = function(t) {
    const { value: e, fontSize: s, color: i, pageIndex: n } = this._initialData;
    return this.hasEditedComment || this._hasBeenMoved || t.value !== e || t.fontSize !== s || t.color.some((r, a) => r !== i[a]) || t.pageIndex !== n;
  };
  __privateAdd(_at, _at_static);
  __publicField(_at, "_freeTextDefaultContent", "");
  __publicField(_at, "_internalPadding", 0);
  __publicField(_at, "_defaultColor", null);
  __publicField(_at, "_defaultFontSize", 10);
  __publicField(_at, "_type", "freetext");
  __publicField(_at, "_editorType", R.FREETEXT);
  let at = _at;
  class P {
    toSVGPath() {
      $("Abstract method `toSVGPath` must be implemented.");
    }
    get box() {
      $("Abstract getter `box` must be implemented.");
    }
    serialize(t, e) {
      $("Abstract method `serialize` must be implemented.");
    }
    static _rescale(t, e, s, i, n, r) {
      r || (r = new Float32Array(t.length));
      for (let a = 0, o = t.length; a < o; a += 2) r[a] = e + t[a] * i, r[a + 1] = s + t[a + 1] * n;
      return r;
    }
    static _rescaleAndSwap(t, e, s, i, n, r) {
      r || (r = new Float32Array(t.length));
      for (let a = 0, o = t.length; a < o; a += 2) r[a] = e + t[a + 1] * i, r[a + 1] = s + t[a] * n;
      return r;
    }
    static _translate(t, e, s, i) {
      i || (i = new Float32Array(t.length));
      for (let n = 0, r = t.length; n < r; n += 2) i[n] = e + t[n], i[n + 1] = s + t[n + 1];
      return i;
    }
    static svgRound(t) {
      return Math.round(t * 1e4);
    }
    static _normalizePoint(t, e, s, i, n) {
      switch (n) {
        case 90:
          return [
            1 - e / s,
            t / i
          ];
        case 180:
          return [
            1 - t / s,
            1 - e / i
          ];
        case 270:
          return [
            e / s,
            1 - t / i
          ];
        default:
          return [
            t / s,
            e / i
          ];
      }
    }
    static _normalizePagePoint(t, e, s) {
      switch (s) {
        case 90:
          return [
            1 - e,
            t
          ];
        case 180:
          return [
            1 - t,
            1 - e
          ];
        case 270:
          return [
            e,
            1 - t
          ];
        default:
          return [
            t,
            e
          ];
      }
    }
    static createBezierPoints(t, e, s, i, n, r) {
      return [
        (t + 5 * s) / 6,
        (e + 5 * i) / 6,
        (5 * s + n) / 6,
        (5 * i + r) / 6,
        (s + n) / 2,
        (i + r) / 2
      ];
    }
  }
  __publicField(P, "PRECISION", 1e-4);
  const _Nt = class _Nt {
    constructor({ x: t, y: e }, s, i, n, r, a = 0) {
      __privateAdd(this, _Nt_instances);
      __privateAdd(this, _t61);
      __privateAdd(this, _e42, []);
      __privateAdd(this, _i34);
      __privateAdd(this, _s28);
      __privateAdd(this, _a20, []);
      __privateAdd(this, _r19, new Float32Array(18));
      __privateAdd(this, _n19);
      __privateAdd(this, _o15);
      __privateAdd(this, _h12);
      __privateAdd(this, _l11);
      __privateAdd(this, _u9);
      __privateAdd(this, _d9);
      __privateAdd(this, _f8, []);
      __privateSet(this, _t61, s), __privateSet(this, _d9, n * i), __privateSet(this, _s28, r), __privateGet(this, _r19).set([
        NaN,
        NaN,
        NaN,
        NaN,
        t,
        e
      ], 6), __privateSet(this, _i34, a), __privateSet(this, _l11, __privateGet(_Nt, _m6) * i), __privateSet(this, _h12, __privateGet(_Nt, _c7) * i), __privateSet(this, _u9, i), __privateGet(this, _f8).push(t, e);
    }
    isEmpty() {
      return isNaN(__privateGet(this, _r19)[8]);
    }
    add({ x: t, y: e }) {
      var _a29;
      __privateSet(this, _n19, t), __privateSet(this, _o15, e);
      const [s, i, n, r] = __privateGet(this, _t61);
      let [a, o, l, h] = __privateGet(this, _r19).subarray(8, 12);
      const c = t - l, u = e - h, f = Math.hypot(c, u);
      if (f < __privateGet(this, _h12)) return false;
      const g = f - __privateGet(this, _l11), p = g / f, b = p * c, m = p * u;
      let A = a, y = o;
      a = l, o = h, l += b, h += m, (_a29 = __privateGet(this, _f8)) == null ? void 0 : _a29.push(t, e);
      const v = -m / g, w = b / g, S = v * __privateGet(this, _d9), E = w * __privateGet(this, _d9);
      return __privateGet(this, _r19).set(__privateGet(this, _r19).subarray(2, 8), 0), __privateGet(this, _r19).set([
        l + S,
        h + E
      ], 4), __privateGet(this, _r19).set(__privateGet(this, _r19).subarray(14, 18), 12), __privateGet(this, _r19).set([
        l - S,
        h - E
      ], 16), isNaN(__privateGet(this, _r19)[6]) ? (__privateGet(this, _a20).length === 0 && (__privateGet(this, _r19).set([
        a + S,
        o + E
      ], 2), __privateGet(this, _a20).push(NaN, NaN, NaN, NaN, (a + S - s) / n, (o + E - i) / r), __privateGet(this, _r19).set([
        a - S,
        o - E
      ], 14), __privateGet(this, _e42).push(NaN, NaN, NaN, NaN, (a - S - s) / n, (o - E - i) / r)), __privateGet(this, _r19).set([
        A,
        y,
        a,
        o,
        l,
        h
      ], 6), !this.isEmpty()) : (__privateGet(this, _r19).set([
        A,
        y,
        a,
        o,
        l,
        h
      ], 6), Math.abs(Math.atan2(y - o, A - a) - Math.atan2(m, b)) < Math.PI / 2 ? ([a, o, l, h] = __privateGet(this, _r19).subarray(2, 6), __privateGet(this, _a20).push(NaN, NaN, NaN, NaN, ((a + l) / 2 - s) / n, ((o + h) / 2 - i) / r), [a, o, A, y] = __privateGet(this, _r19).subarray(14, 18), __privateGet(this, _e42).push(NaN, NaN, NaN, NaN, ((A + a) / 2 - s) / n, ((y + o) / 2 - i) / r), true) : ([A, y, a, o, l, h] = __privateGet(this, _r19).subarray(0, 6), __privateGet(this, _a20).push(((A + 5 * a) / 6 - s) / n, ((y + 5 * o) / 6 - i) / r, ((5 * a + l) / 6 - s) / n, ((5 * o + h) / 6 - i) / r, ((a + l) / 2 - s) / n, ((o + h) / 2 - i) / r), [l, h, a, o, A, y] = __privateGet(this, _r19).subarray(12, 18), __privateGet(this, _e42).push(((A + 5 * a) / 6 - s) / n, ((y + 5 * o) / 6 - i) / r, ((5 * a + l) / 6 - s) / n, ((5 * o + h) / 6 - i) / r, ((a + l) / 2 - s) / n, ((o + h) / 2 - i) / r), true));
    }
    toSVGPath() {
      if (this.isEmpty()) return "";
      const t = __privateGet(this, _a20), e = __privateGet(this, _e42);
      if (isNaN(__privateGet(this, _r19)[6]) && !this.isEmpty()) return __privateMethod(this, _Nt_instances, b_fn3).call(this);
      const s = [];
      s.push(`M${t[4]} ${t[5]}`);
      for (let i = 6; i < t.length; i += 6) isNaN(t[i]) ? s.push(`L${t[i + 4]} ${t[i + 5]}`) : s.push(`C${t[i]} ${t[i + 1]} ${t[i + 2]} ${t[i + 3]} ${t[i + 4]} ${t[i + 5]}`);
      __privateMethod(this, _Nt_instances, y_fn).call(this, s);
      for (let i = e.length - 6; i >= 6; i -= 6) isNaN(e[i]) ? s.push(`L${e[i + 4]} ${e[i + 5]}`) : s.push(`C${e[i]} ${e[i + 1]} ${e[i + 2]} ${e[i + 3]} ${e[i + 4]} ${e[i + 5]}`);
      return __privateMethod(this, _Nt_instances, A_fn2).call(this, s), s.join(" ");
    }
    newFreeDrawOutline(t, e, s, i, n, r) {
      return new Hi(t, e, s, i, n, r);
    }
    getOutlines() {
      var _a29;
      const t = __privateGet(this, _a20), e = __privateGet(this, _e42), s = __privateGet(this, _r19), [i, n, r, a] = __privateGet(this, _t61), o = new Float32Array((((_a29 = __privateGet(this, _f8)) == null ? void 0 : _a29.length) ?? 0) + 2);
      for (let c = 0, u = o.length - 2; c < u; c += 2) o[c] = (__privateGet(this, _f8)[c] - i) / r, o[c + 1] = (__privateGet(this, _f8)[c + 1] - n) / a;
      if (o[o.length - 2] = (__privateGet(this, _n19) - i) / r, o[o.length - 1] = (__privateGet(this, _o15) - n) / a, isNaN(s[6]) && !this.isEmpty()) return __privateMethod(this, _Nt_instances, C_fn).call(this, o);
      const l = new Float32Array(__privateGet(this, _a20).length + 24 + __privateGet(this, _e42).length);
      let h = t.length;
      for (let c = 0; c < h; c += 2) {
        if (isNaN(t[c])) {
          l[c] = l[c + 1] = NaN;
          continue;
        }
        l[c] = t[c], l[c + 1] = t[c + 1];
      }
      h = __privateMethod(this, _Nt_instances, v_fn).call(this, l, h);
      for (let c = e.length - 6; c >= 6; c -= 6) for (let u = 0; u < 6; u += 2) {
        if (isNaN(e[c + u])) {
          l[h] = l[h + 1] = NaN, h += 2;
          continue;
        }
        l[h] = e[c + u], l[h + 1] = e[c + u + 1], h += 2;
      }
      return __privateMethod(this, _Nt_instances, E_fn).call(this, l, h), this.newFreeDrawOutline(l, o, __privateGet(this, _t61), __privateGet(this, _u9), __privateGet(this, _i34), __privateGet(this, _s28));
    }
  };
  _t61 = new WeakMap();
  _e42 = new WeakMap();
  _i34 = new WeakMap();
  _s28 = new WeakMap();
  _a20 = new WeakMap();
  _r19 = new WeakMap();
  _n19 = new WeakMap();
  _o15 = new WeakMap();
  _h12 = new WeakMap();
  _l11 = new WeakMap();
  _u9 = new WeakMap();
  _d9 = new WeakMap();
  _f8 = new WeakMap();
  _m6 = new WeakMap();
  _g7 = new WeakMap();
  _c7 = new WeakMap();
  _Nt_instances = new WeakSet();
  p_fn2 = function() {
    const t = __privateGet(this, _r19).subarray(4, 6), e = __privateGet(this, _r19).subarray(16, 18), [s, i, n, r] = __privateGet(this, _t61);
    return [
      (__privateGet(this, _n19) + (t[0] - e[0]) / 2 - s) / n,
      (__privateGet(this, _o15) + (t[1] - e[1]) / 2 - i) / r,
      (__privateGet(this, _n19) + (e[0] - t[0]) / 2 - s) / n,
      (__privateGet(this, _o15) + (e[1] - t[1]) / 2 - i) / r
    ];
  };
  b_fn3 = function() {
    const [t, e, s, i] = __privateGet(this, _t61), [n, r, a, o] = __privateMethod(this, _Nt_instances, p_fn2).call(this);
    return `M${(__privateGet(this, _r19)[2] - t) / s} ${(__privateGet(this, _r19)[3] - e) / i} L${(__privateGet(this, _r19)[4] - t) / s} ${(__privateGet(this, _r19)[5] - e) / i} L${n} ${r} L${a} ${o} L${(__privateGet(this, _r19)[16] - t) / s} ${(__privateGet(this, _r19)[17] - e) / i} L${(__privateGet(this, _r19)[14] - t) / s} ${(__privateGet(this, _r19)[15] - e) / i} Z`;
  };
  A_fn2 = function(t) {
    const e = __privateGet(this, _e42);
    t.push(`L${e[4]} ${e[5]} Z`);
  };
  y_fn = function(t) {
    const [e, s, i, n] = __privateGet(this, _t61), r = __privateGet(this, _r19).subarray(4, 6), a = __privateGet(this, _r19).subarray(16, 18), [o, l, h, c] = __privateMethod(this, _Nt_instances, p_fn2).call(this);
    t.push(`L${(r[0] - e) / i} ${(r[1] - s) / n} L${o} ${l} L${h} ${c} L${(a[0] - e) / i} ${(a[1] - s) / n}`);
  };
  C_fn = function(t) {
    const e = __privateGet(this, _r19), [s, i, n, r] = __privateGet(this, _t61), [a, o, l, h] = __privateMethod(this, _Nt_instances, p_fn2).call(this), c = new Float32Array(36);
    return c.set([
      NaN,
      NaN,
      NaN,
      NaN,
      (e[2] - s) / n,
      (e[3] - i) / r,
      NaN,
      NaN,
      NaN,
      NaN,
      (e[4] - s) / n,
      (e[5] - i) / r,
      NaN,
      NaN,
      NaN,
      NaN,
      a,
      o,
      NaN,
      NaN,
      NaN,
      NaN,
      l,
      h,
      NaN,
      NaN,
      NaN,
      NaN,
      (e[16] - s) / n,
      (e[17] - i) / r,
      NaN,
      NaN,
      NaN,
      NaN,
      (e[14] - s) / n,
      (e[15] - i) / r
    ], 0), this.newFreeDrawOutline(c, t, __privateGet(this, _t61), __privateGet(this, _u9), __privateGet(this, _i34), __privateGet(this, _s28));
  };
  E_fn = function(t, e) {
    const s = __privateGet(this, _e42);
    return t.set([
      NaN,
      NaN,
      NaN,
      NaN,
      s[4],
      s[5]
    ], e), e += 6;
  };
  v_fn = function(t, e) {
    const s = __privateGet(this, _r19).subarray(4, 6), i = __privateGet(this, _r19).subarray(16, 18), [n, r, a, o] = __privateGet(this, _t61), [l, h, c, u] = __privateMethod(this, _Nt_instances, p_fn2).call(this);
    return t.set([
      NaN,
      NaN,
      NaN,
      NaN,
      (s[0] - n) / a,
      (s[1] - r) / o,
      NaN,
      NaN,
      NaN,
      NaN,
      l,
      h,
      NaN,
      NaN,
      NaN,
      NaN,
      c,
      u,
      NaN,
      NaN,
      NaN,
      NaN,
      (i[0] - n) / a,
      (i[1] - r) / o
    ], e), e += 24;
  };
  __privateAdd(_Nt, _m6, 8);
  __privateAdd(_Nt, _g7, 2);
  __privateAdd(_Nt, _c7, __privateGet(_Nt, _m6) + __privateGet(_Nt, _g7));
  let Nt = _Nt;
  class Hi extends P {
    constructor(t, e, s, i, n, r) {
      super();
      __privateAdd(this, _Hi_instances);
      __privateAdd(this, _t62);
      __privateAdd(this, _e43, new Float32Array(4));
      __privateAdd(this, _i35);
      __privateAdd(this, _s29);
      __privateAdd(this, _a21);
      __privateAdd(this, _r20);
      __privateAdd(this, _n20);
      __privateSet(this, _n20, t), __privateSet(this, _a21, e), __privateSet(this, _t62, s), __privateSet(this, _r20, i), __privateSet(this, _i35, n), __privateSet(this, _s29, r), this.firstPoint = [
        NaN,
        NaN
      ], this.lastPoint = [
        NaN,
        NaN
      ], __privateMethod(this, _Hi_instances, o_fn4).call(this, r);
      const [a, o, l, h] = __privateGet(this, _e43);
      for (let c = 0, u = t.length; c < u; c += 2) t[c] = (t[c] - a) / l, t[c + 1] = (t[c + 1] - o) / h;
      for (let c = 0, u = e.length; c < u; c += 2) e[c] = (e[c] - a) / l, e[c + 1] = (e[c + 1] - o) / h;
    }
    toSVGPath() {
      const t = [
        `M${__privateGet(this, _n20)[4]} ${__privateGet(this, _n20)[5]}`
      ];
      for (let e = 6, s = __privateGet(this, _n20).length; e < s; e += 6) {
        if (isNaN(__privateGet(this, _n20)[e])) {
          t.push(`L${__privateGet(this, _n20)[e + 4]} ${__privateGet(this, _n20)[e + 5]}`);
          continue;
        }
        t.push(`C${__privateGet(this, _n20)[e]} ${__privateGet(this, _n20)[e + 1]} ${__privateGet(this, _n20)[e + 2]} ${__privateGet(this, _n20)[e + 3]} ${__privateGet(this, _n20)[e + 4]} ${__privateGet(this, _n20)[e + 5]}`);
      }
      return t.push("Z"), t.join(" ");
    }
    serialize([t, e, s, i], n) {
      const r = s - t, a = i - e;
      let o, l;
      switch (n) {
        case 0:
          o = P._rescale(__privateGet(this, _n20), t, i, r, -a), l = P._rescale(__privateGet(this, _a21), t, i, r, -a);
          break;
        case 90:
          o = P._rescaleAndSwap(__privateGet(this, _n20), t, e, r, a), l = P._rescaleAndSwap(__privateGet(this, _a21), t, e, r, a);
          break;
        case 180:
          o = P._rescale(__privateGet(this, _n20), s, e, -r, a), l = P._rescale(__privateGet(this, _a21), s, e, -r, a);
          break;
        case 270:
          o = P._rescaleAndSwap(__privateGet(this, _n20), s, i, -r, -a), l = P._rescaleAndSwap(__privateGet(this, _a21), s, i, -r, -a);
          break;
      }
      return {
        outline: Array.from(o),
        points: [
          Array.from(l)
        ]
      };
    }
    get box() {
      return __privateGet(this, _e43);
    }
    newOutliner(t, e, s, i, n, r = 0) {
      return new Nt(t, e, s, i, n, r);
    }
    getNewOutline(t, e) {
      const [s, i, n, r] = __privateGet(this, _e43), [a, o, l, h] = __privateGet(this, _t62), c = n * l, u = r * h, f = s * l + a, g = i * h + o, p = this.newOutliner({
        x: __privateGet(this, _a21)[0] * c + f,
        y: __privateGet(this, _a21)[1] * u + g
      }, __privateGet(this, _t62), __privateGet(this, _r20), t, __privateGet(this, _s29), e ?? __privateGet(this, _i35));
      for (let b = 2; b < __privateGet(this, _a21).length; b += 2) p.add({
        x: __privateGet(this, _a21)[b] * c + f,
        y: __privateGet(this, _a21)[b + 1] * u + g
      });
      return p.getOutlines();
    }
  }
  _t62 = new WeakMap();
  _e43 = new WeakMap();
  _i35 = new WeakMap();
  _s29 = new WeakMap();
  _a21 = new WeakMap();
  _r20 = new WeakMap();
  _n20 = new WeakMap();
  _Hi_instances = new WeakSet();
  o_fn4 = function(t) {
    const e = __privateGet(this, _n20);
    let s = e[4], i = e[5];
    const n = [
      s,
      i,
      s,
      i
    ];
    let r = s, a = i, o = s, l = i;
    const h = t ? Math.max : Math.min, c = new Float32Array(4);
    for (let f = 6, g = e.length; f < g; f += 6) {
      const p = e[f + 4], b = e[f + 5];
      isNaN(e[f]) ? (T.pointBoundingBox(p, b, n), a > b ? (r = p, a = b) : a === b && (r = h(r, p)), l < b ? (o = p, l = b) : l === b && (o = h(o, p))) : (c[0] = c[1] = 1 / 0, c[2] = c[3] = -1 / 0, T.bezierBoundingBox(s, i, ...e.slice(f, f + 6), c), T.rectBoundingBox(c[0], c[1], c[2], c[3], n), a > c[1] ? (r = c[0], a = c[1]) : a === c[1] && (r = h(r, c[0])), l < c[3] ? (o = c[2], l = c[3]) : l === c[3] && (o = h(o, c[2]))), s = p, i = b;
    }
    const u = __privateGet(this, _e43);
    u[0] = n[0] - __privateGet(this, _i35), u[1] = n[1] - __privateGet(this, _i35), u[2] = n[2] - n[0] + 2 * __privateGet(this, _i35), u[3] = n[3] - n[1] + 2 * __privateGet(this, _i35), this.firstPoint = [
      r,
      a
    ], this.lastPoint = [
      o,
      l
    ];
  };
  class gs {
    constructor(t, e = 0, s = 0, i = true) {
      __privateAdd(this, _gs_instances);
      __privateAdd(this, _t63);
      __privateAdd(this, _e44);
      __privateAdd(this, _i36);
      __privateAdd(this, _s30, []);
      __privateAdd(this, _a22, []);
      const n = [
        1 / 0,
        1 / 0,
        -1 / 0,
        -1 / 0
      ], r = 10 ** -4;
      for (const { x: p, y: b, width: m, height: A } of t) {
        const y = Math.floor((p - e) / r) * r, v = Math.ceil((p + m + e) / r) * r, w = Math.floor((b - e) / r) * r, S = Math.ceil((b + A + e) / r) * r, E = [
          y,
          w,
          S,
          true
        ], _ = [
          v,
          w,
          S,
          false
        ];
        __privateGet(this, _s30).push(E, _), T.rectBoundingBox(y, w, v, S, n);
      }
      const a = n[2] - n[0] + 2 * s, o = n[3] - n[1] + 2 * s, l = n[0] - s, h = n[1] - s;
      let c = i ? -1 / 0 : 1 / 0, u = 1 / 0;
      const f = __privateGet(this, _s30).at(i ? -1 : -2), g = [
        f[0],
        f[2]
      ];
      for (const p of __privateGet(this, _s30)) {
        const [b, m, A, y] = p;
        !y && i ? m < u ? (u = m, c = b) : m === u && (c = Math.max(c, b)) : y && !i && (m < u ? (u = m, c = b) : m === u && (c = Math.min(c, b))), p[0] = (b - l) / a, p[1] = (m - h) / o, p[2] = (A - h) / o;
      }
      __privateSet(this, _t63, new Float32Array([
        l,
        h,
        a,
        o
      ])), __privateSet(this, _e44, [
        c,
        u
      ]), __privateSet(this, _i36, g);
    }
    getOutlines() {
      __privateGet(this, _s30).sort((e, s) => e[0] - s[0] || e[1] - s[1] || e[2] - s[2]);
      const t = [];
      for (const e of __privateGet(this, _s30)) e[3] ? (t.push(...__privateMethod(this, _gs_instances, l_fn8).call(this, e)), __privateMethod(this, _gs_instances, o_fn5).call(this, e)) : (__privateMethod(this, _gs_instances, h_fn7).call(this, e), t.push(...__privateMethod(this, _gs_instances, l_fn8).call(this, e)));
      return __privateMethod(this, _gs_instances, r_fn3).call(this, t);
    }
  }
  _t63 = new WeakMap();
  _e44 = new WeakMap();
  _i36 = new WeakMap();
  _s30 = new WeakMap();
  _a22 = new WeakMap();
  _gs_instances = new WeakSet();
  r_fn3 = function(t) {
    const e = [], s = /* @__PURE__ */ new Set();
    for (const r of t) {
      const [a, o, l] = r;
      e.push([
        a,
        o,
        r
      ], [
        a,
        l,
        r
      ]);
    }
    e.sort((r, a) => r[1] - a[1] || r[0] - a[0]);
    for (let r = 0, a = e.length; r < a; r += 2) {
      const o = e[r][2], l = e[r + 1][2];
      o.push(l), l.push(o), s.add(o), s.add(l);
    }
    const i = [];
    let n;
    for (; s.size > 0; ) {
      const r = s.values().next().value;
      let [a, o, l, h, c] = r;
      s.delete(r);
      let u = a, f = o;
      for (n = [
        a,
        l
      ], i.push(n); ; ) {
        let g;
        if (s.has(h)) g = h;
        else if (s.has(c)) g = c;
        else break;
        s.delete(g), [a, o, l, h, c] = g, u !== a && (n.push(u, f, a, f === o ? o : l), u = a), f = f === o ? l : o;
      }
      n.push(u, f);
    }
    return new Hr(i, __privateGet(this, _t63), __privateGet(this, _e44), __privateGet(this, _i36));
  };
  n_fn2 = function(t) {
    const e = __privateGet(this, _a22);
    let s = 0, i = e.length - 1;
    for (; s <= i; ) {
      const n = s + i >> 1, r = e[n][0];
      if (r === t) return n;
      r < t ? s = n + 1 : i = n - 1;
    }
    return i + 1;
  };
  o_fn5 = function([, t, e]) {
    const s = __privateMethod(this, _gs_instances, n_fn2).call(this, t);
    __privateGet(this, _a22).splice(s, 0, [
      t,
      e
    ]);
  };
  h_fn7 = function([, t, e]) {
    const s = __privateMethod(this, _gs_instances, n_fn2).call(this, t);
    for (let i = s; i < __privateGet(this, _a22).length; i++) {
      const [n, r] = __privateGet(this, _a22)[i];
      if (n !== t) break;
      if (n === t && r === e) {
        __privateGet(this, _a22).splice(i, 1);
        return;
      }
    }
    for (let i = s - 1; i >= 0; i--) {
      const [n, r] = __privateGet(this, _a22)[i];
      if (n !== t) break;
      if (n === t && r === e) {
        __privateGet(this, _a22).splice(i, 1);
        return;
      }
    }
  };
  l_fn8 = function(t) {
    const [e, s, i] = t, n = [
      [
        e,
        s,
        i
      ]
    ], r = __privateMethod(this, _gs_instances, n_fn2).call(this, i);
    for (let a = 0; a < r; a++) {
      const [o, l] = __privateGet(this, _a22)[a];
      for (let h = 0, c = n.length; h < c; h++) {
        const [, u, f] = n[h];
        if (!(l <= u || f <= o)) {
          if (u >= o) {
            if (f > l) n[h][1] = l;
            else {
              if (c === 1) return [];
              n.splice(h, 1), h--, c--;
            }
            continue;
          }
          n[h][2] = o, f > l && n.push([
            e,
            l,
            f
          ]);
        }
      }
    }
    return n;
  };
  class Hr extends P {
    constructor(t, e, s, i) {
      super();
      __privateAdd(this, _t64);
      __privateAdd(this, _e45);
      __privateSet(this, _e45, t), __privateSet(this, _t64, e), this.firstPoint = s, this.lastPoint = i;
    }
    toSVGPath() {
      const t = [];
      for (const e of __privateGet(this, _e45)) {
        let [s, i] = e;
        t.push(`M${s} ${i}`);
        for (let n = 2; n < e.length; n += 2) {
          const r = e[n], a = e[n + 1];
          r === s ? (t.push(`V${a}`), i = a) : a === i && (t.push(`H${r}`), s = r);
        }
        t.push("Z");
      }
      return t.join(" ");
    }
    serialize([t, e, s, i], n) {
      const r = [], a = s - t, o = i - e;
      for (const l of __privateGet(this, _e45)) {
        const h = new Array(l.length);
        for (let c = 0; c < l.length; c += 2) h[c] = t + l[c] * a, h[c + 1] = i - l[c + 1] * o;
        r.push(h);
      }
      return r;
    }
    get box() {
      return __privateGet(this, _t64);
    }
    get classNamesForOutlining() {
      return [
        "highlightOutline"
      ];
    }
  }
  _t64 = new WeakMap();
  _e45 = new WeakMap();
  class ms extends Nt {
    newFreeDrawOutline(t, e, s, i, n, r) {
      return new $r(t, e, s, i, n, r);
    }
  }
  class $r extends Hi {
    newOutliner(t, e, s, i, n, r = 0) {
      return new ms(t, e, s, i, n, r);
    }
  }
  const _Q = class _Q extends D {
    constructor(t) {
      super({
        ...t,
        name: "highlightEditor"
      });
      __privateAdd(this, _Q_instances);
      __privateAdd(this, _t65, null);
      __privateAdd(this, _e46, 0);
      __privateAdd(this, _i37);
      __privateAdd(this, _s31, null);
      __privateAdd(this, _a23, null);
      __privateAdd(this, _r21, null);
      __privateAdd(this, _n21, null);
      __privateAdd(this, _o16, 0);
      __privateAdd(this, _h13, null);
      __privateAdd(this, _l12, null);
      __privateAdd(this, _u10, null);
      __privateAdd(this, _d10, false);
      __privateAdd(this, _f9, null);
      __privateAdd(this, _m7, null);
      __privateAdd(this, _g8, null);
      __privateAdd(this, _c8, "");
      __privateAdd(this, _p6);
      __privateAdd(this, _b6, "");
      this.color = t.color || _Q._defaultColor, __privateSet(this, _p6, t.thickness || _Q._defaultThickness), this.opacity = t.opacity || _Q._defaultOpacity, __privateSet(this, _i37, t.boxes || null), __privateSet(this, _b6, t.methodOfCreation || ""), __privateSet(this, _c8, t.text || ""), this._isDraggable = false, this.defaultL10nId = "pdfjs-editor-highlight-editor", t.highlightId > -1 ? (__privateSet(this, _d10, true), __privateMethod(this, _Q_instances, y_fn2).call(this, t), __privateMethod(this, _Q_instances, w_fn2).call(this)) : __privateGet(this, _i37) && (__privateSet(this, _t65, t.anchorNode), __privateSet(this, _e46, t.anchorOffset), __privateSet(this, _n21, t.focusNode), __privateSet(this, _o16, t.focusOffset), __privateMethod(this, _Q_instances, A_fn3).call(this), __privateMethod(this, _Q_instances, w_fn2).call(this), this.rotate(this.rotation)), this.annotationElementId || this._uiManager.a11yAlert("pdfjs-editor-highlight-added-alert");
    }
    static get _keyboardManager() {
      const t = _Q.prototype;
      return L(this, "_keyboardManager", new ye([
        [
          [
            "ArrowLeft",
            "mac+ArrowLeft"
          ],
          t._moveCaret,
          {
            args: [
              0
            ]
          }
        ],
        [
          [
            "ArrowRight",
            "mac+ArrowRight"
          ],
          t._moveCaret,
          {
            args: [
              1
            ]
          }
        ],
        [
          [
            "ArrowUp",
            "mac+ArrowUp"
          ],
          t._moveCaret,
          {
            args: [
              2
            ]
          }
        ],
        [
          [
            "ArrowDown",
            "mac+ArrowDown"
          ],
          t._moveCaret,
          {
            args: [
              3
            ]
          }
        ]
      ]));
    }
    get telemetryInitialData() {
      return {
        action: "added",
        type: __privateGet(this, _d10) ? "free_highlight" : "highlight",
        color: this._uiManager.getNonHCMColorName(this.color),
        thickness: __privateGet(this, _p6),
        methodOfCreation: __privateGet(this, _b6)
      };
    }
    get telemetryFinalData() {
      return {
        type: "highlight",
        color: this._uiManager.getNonHCMColorName(this.color)
      };
    }
    static computeTelemetryFinalData(t) {
      return {
        numberOfColors: t.get("color").size
      };
    }
    static initialize(t, e) {
      var _a29;
      D.initialize(t, e), _Q._defaultColor || (_Q._defaultColor = ((_a29 = e.highlightColors) == null ? void 0 : _a29.values().next().value) || "#fff066");
    }
    static updateDefaultParams(t, e) {
      switch (t) {
        case O.HIGHLIGHT_COLOR:
          _Q._defaultColor = e;
          break;
        case O.HIGHLIGHT_THICKNESS:
          _Q._defaultThickness = e;
          break;
      }
    }
    translateInPage(t, e) {
    }
    get toolbarPosition() {
      return __privateGet(this, _m7);
    }
    get commentButtonPosition() {
      return __privateGet(this, _f9);
    }
    updateParams(t, e) {
      switch (t) {
        case O.HIGHLIGHT_COLOR:
          __privateMethod(this, _Q_instances, C_fn2).call(this, e);
          break;
        case O.HIGHLIGHT_THICKNESS:
          __privateMethod(this, _Q_instances, E_fn2).call(this, e);
          break;
      }
    }
    static get defaultPropertiesToUpdate() {
      return [
        [
          O.HIGHLIGHT_COLOR,
          _Q._defaultColor
        ],
        [
          O.HIGHLIGHT_THICKNESS,
          _Q._defaultThickness
        ]
      ];
    }
    get propertiesToUpdate() {
      return [
        [
          O.HIGHLIGHT_COLOR,
          this.color || _Q._defaultColor
        ],
        [
          O.HIGHLIGHT_THICKNESS,
          __privateGet(this, _p6) || _Q._defaultThickness
        ],
        [
          O.HIGHLIGHT_FREE,
          __privateGet(this, _d10)
        ]
      ];
    }
    onUpdatedColor() {
      var _a29, _b7;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(__privateGet(this, _u10), {
        root: {
          fill: this.color,
          "fill-opacity": this.opacity
        }
      }), (_b7 = __privateGet(this, _a23)) == null ? void 0 : _b7.updateColor(this.color), super.onUpdatedColor();
    }
    get toolbarButtons() {
      return this._uiManager.highlightColors ? [
        [
          "colorPicker",
          __privateSet(this, _a23, new vt({
            editor: this
          }))
        ]
      ] : super.toolbarButtons;
    }
    disableEditing() {
      super.disableEditing(), this.div.classList.toggle("disabled", true);
    }
    enableEditing() {
      super.enableEditing(), this.div.classList.toggle("disabled", false);
    }
    fixAndSetPosition() {
      return super.fixAndSetPosition(__privateMethod(this, _Q_instances, k_fn4).call(this));
    }
    getBaseTranslation() {
      return [
        0,
        0
      ];
    }
    getRect(t, e) {
      return super.getRect(t, e, __privateMethod(this, _Q_instances, k_fn4).call(this));
    }
    onceAdded(t) {
      this.annotationElementId || this.parent.addUndoableEditor(this), t && this.div.focus();
    }
    remove() {
      __privateMethod(this, _Q_instances, x_fn2).call(this), this._reportTelemetry({
        action: "deleted"
      }), super.remove();
    }
    rebuild() {
      this.parent && (super.rebuild(), this.div !== null && (__privateMethod(this, _Q_instances, w_fn2).call(this), this.isAttachedToDOM || this.parent.add(this)));
    }
    setParent(t) {
      var _a29;
      let e = false;
      this.parent && !t ? __privateMethod(this, _Q_instances, x_fn2).call(this) : t && (__privateMethod(this, _Q_instances, w_fn2).call(this, t), e = !this.parent && ((_a29 = this.div) == null ? void 0 : _a29.classList.contains("selectedEditor"))), super.setParent(t), this.show(this._isVisible), e && this.select();
    }
    rotate(t) {
      var _a29, _b7, _c10;
      const { drawLayer: e } = this.parent;
      let s;
      __privateGet(this, _d10) ? (t = (t - this.rotation + 360) % 360, s = __privateMethod(_a29 = _Q, _Q_static, __fn2).call(_a29, __privateGet(this, _l12).box, t)) : s = __privateMethod(_b7 = _Q, _Q_static, __fn2).call(_b7, [
        this.x,
        this.y,
        this.width,
        this.height
      ], t), e.updateProperties(__privateGet(this, _u10), {
        bbox: s,
        root: {
          "data-main-rotation": t
        }
      }), e.updateProperties(__privateGet(this, _g8), {
        bbox: __privateMethod(_c10 = _Q, _Q_static, __fn2).call(_c10, __privateGet(this, _r21).box, t),
        root: {
          "data-main-rotation": t
        }
      });
    }
    render() {
      if (this.div) return this.div;
      const t = super.render();
      __privateGet(this, _c8) && (t.setAttribute("aria-label", __privateGet(this, _c8)), t.setAttribute("role", "mark")), __privateGet(this, _d10) ? t.classList.add("free") : this.div.addEventListener("keydown", __privateMethod(this, _Q_instances, M_fn4).bind(this), {
        signal: this._uiManager._signal
      });
      const e = __privateSet(this, _h13, document.createElement("div"));
      return t.append(e), e.setAttribute("aria-hidden", "true"), e.className = "internal", e.style.clipPath = __privateGet(this, _s31), this.setDims(), yi(this, __privateGet(this, _h13), [
        "pointerover",
        "pointerleave"
      ]), this.enableEditing(), t;
    }
    pointerover() {
      var _a29;
      this.isSelected || ((_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(__privateGet(this, _g8), {
        rootClass: {
          hovered: true
        }
      }));
    }
    pointerleave() {
      var _a29;
      this.isSelected || ((_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(__privateGet(this, _g8), {
        rootClass: {
          hovered: false
        }
      }));
    }
    _moveCaret(t) {
      switch (this.parent.unselect(this), t) {
        case 0:
        case 2:
          __privateMethod(this, _Q_instances, P_fn4).call(this, true);
          break;
        case 1:
        case 3:
          __privateMethod(this, _Q_instances, P_fn4).call(this, false);
          break;
      }
    }
    select() {
      var _a29;
      super.select(), __privateGet(this, _g8) && ((_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(__privateGet(this, _g8), {
        rootClass: {
          hovered: false,
          selected: true
        }
      }));
    }
    unselect() {
      var _a29;
      super.unselect(), __privateGet(this, _g8) && ((_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(__privateGet(this, _g8), {
        rootClass: {
          selected: false
        }
      }), __privateGet(this, _d10) || __privateMethod(this, _Q_instances, P_fn4).call(this, false));
    }
    get _mustFixPosition() {
      return !__privateGet(this, _d10);
    }
    show(t = this._isVisible) {
      super.show(t), this.parent && (this.parent.drawLayer.updateProperties(__privateGet(this, _u10), {
        rootClass: {
          hidden: !t
        }
      }), this.parent.drawLayer.updateProperties(__privateGet(this, _g8), {
        rootClass: {
          hidden: !t
        }
      }));
    }
    static startHighlighting(t, e, { target: s, x: i, y: n }) {
      const { x: r, y: a, width: o, height: l } = s.getBoundingClientRect(), h = new AbortController(), c = t.combinedSignal(h), u = (f) => {
        h.abort(), __privateMethod(this, _Q_static, B_fn2).call(this, t, f);
      };
      window.addEventListener("blur", u, {
        signal: c
      }), window.addEventListener("pointerup", u, {
        signal: c
      }), window.addEventListener("pointerdown", K, {
        capture: true,
        passive: false,
        signal: c
      }), window.addEventListener("contextmenu", St, {
        signal: c
      }), s.addEventListener("pointermove", __privateMethod(this, _Q_static, R_fn2).bind(this, t), {
        signal: c
      }), this._freeHighlight = new ms({
        x: i,
        y: n
      }, [
        r,
        a,
        o,
        l
      ], t.scale, this._defaultThickness / 2, e, 1e-3), { id: this._freeHighlightId, clipPathId: this._freeHighlightClipId } = t.drawLayer.draw({
        bbox: [
          0,
          0,
          1,
          1
        ],
        root: {
          viewBox: "0 0 1 1",
          fill: this._defaultColor,
          "fill-opacity": this._defaultOpacity
        },
        rootClass: {
          highlight: true,
          free: true
        },
        path: {
          d: this._freeHighlight.toSVGPath()
        }
      }, true, true);
    }
    static async deserialize(t, e, s) {
      var _a29, _b7, _c10, _d12;
      let i = null;
      if (t instanceof Bi) {
        const { data: { quadPoints: g, rect: p, rotation: b, id: m, color: A, opacity: y, popupRef: v, richText: w, contentsObj: S, creationDate: E, modificationDate: _ }, parent: { page: { pageNumber: C } } } = t;
        i = t = {
          annotationType: R.HIGHLIGHT,
          color: Array.from(A),
          opacity: y,
          quadPoints: g,
          boxes: null,
          pageIndex: C - 1,
          rect: p.slice(0),
          rotation: b,
          annotationElementId: m,
          id: m,
          deleted: false,
          popupRef: v,
          richText: w,
          comment: (S == null ? void 0 : S.str) || null,
          creationDate: E,
          modificationDate: _
        };
      } else if (t instanceof ks) {
        const { data: { inkLists: g, rect: p, rotation: b, id: m, color: A, borderStyle: { rawWidth: y }, popupRef: v, richText: w, contentsObj: S, creationDate: E, modificationDate: _ }, parent: { page: { pageNumber: C } } } = t;
        i = t = {
          annotationType: R.HIGHLIGHT,
          color: Array.from(A),
          thickness: y,
          inkLists: g,
          boxes: null,
          pageIndex: C - 1,
          rect: p.slice(0),
          rotation: b,
          annotationElementId: m,
          id: m,
          deleted: false,
          popupRef: v,
          richText: w,
          comment: (S == null ? void 0 : S.str) || null,
          creationDate: E,
          modificationDate: _
        };
      }
      const { color: n, quadPoints: r, inkLists: a, opacity: o } = t, l = await super.deserialize(t, e, s);
      l.color = T.makeHexColor(...n), l.opacity = o || 1, a && __privateSet(l, _p6, t.thickness), l._initialData = i, t.comment && l.setCommentData(t);
      const [h, c] = l.pageDimensions, [u, f] = l.pageTranslation;
      if (r) {
        const g = __privateSet(l, _i37, []);
        for (let p = 0; p < r.length; p += 8) g.push({
          x: (r[p] - u) / h,
          y: 1 - (r[p + 1] - f) / c,
          width: (r[p + 2] - r[p]) / h,
          height: (r[p + 1] - r[p + 5]) / c
        });
        __privateMethod(_a29 = l, _Q_instances, A_fn3).call(_a29), __privateMethod(_b7 = l, _Q_instances, w_fn2).call(_b7), l.rotate(l.rotation);
      } else if (a) {
        __privateSet(l, _d10, true);
        const g = a[0], p = {
          x: g[0] - u,
          y: c - (g[1] - f)
        }, b = new ms(p, [
          0,
          0,
          h,
          c
        ], 1, __privateGet(l, _p6) / 2, true, 1e-3);
        for (let y = 0, v = g.length; y < v; y += 2) p.x = g[y] - u, p.y = c - (g[y + 1] - f), b.add(p);
        const { id: m, clipPathId: A } = e.drawLayer.draw({
          bbox: [
            0,
            0,
            1,
            1
          ],
          root: {
            viewBox: "0 0 1 1",
            fill: l.color,
            "fill-opacity": l._defaultOpacity
          },
          rootClass: {
            highlight: true,
            free: true
          },
          path: {
            d: b.toSVGPath()
          }
        }, true, true);
        __privateMethod(_c10 = l, _Q_instances, y_fn2).call(_c10, {
          highlightOutlines: b.getOutlines(),
          highlightId: m,
          clipPathId: A
        }), __privateMethod(_d12 = l, _Q_instances, w_fn2).call(_d12), l.rotate(l.parentRotation);
      }
      return l;
    }
    serialize(t = false) {
      if (this.isEmpty() || t) return null;
      if (this.deleted) return this.serializeDeleted();
      const e = D._colorManager.convert(this._uiManager.getNonHCMColor(this.color)), s = super.serialize(t);
      return Object.assign(s, {
        color: e,
        opacity: this.opacity,
        thickness: __privateGet(this, _p6),
        quadPoints: __privateMethod(this, _Q_instances, O_fn4).call(this),
        outlines: __privateMethod(this, _Q_instances, I_fn2).call(this, s.rect)
      }), this.addComment(s), this.annotationElementId && !__privateMethod(this, _Q_instances, F_fn3).call(this, s) ? null : (s.id = this.annotationElementId, s);
    }
    renderAnnotationElement(t) {
      return this.deleted ? (t.hide(), null) : (t.updateEdited({
        rect: this.getPDFRect(),
        popup: this.comment
      }), null);
    }
    static canCreateNewEmptyEditor() {
      return false;
    }
  };
  _t65 = new WeakMap();
  _e46 = new WeakMap();
  _i37 = new WeakMap();
  _s31 = new WeakMap();
  _a23 = new WeakMap();
  _r21 = new WeakMap();
  _n21 = new WeakMap();
  _o16 = new WeakMap();
  _h13 = new WeakMap();
  _l12 = new WeakMap();
  _u10 = new WeakMap();
  _d10 = new WeakMap();
  _f9 = new WeakMap();
  _m7 = new WeakMap();
  _g8 = new WeakMap();
  _c8 = new WeakMap();
  _p6 = new WeakMap();
  _b6 = new WeakMap();
  _Q_instances = new WeakSet();
  A_fn3 = function() {
    const t = new gs(__privateGet(this, _i37), 1e-3);
    __privateSet(this, _l12, t.getOutlines()), [this.x, this.y, this.width, this.height] = __privateGet(this, _l12).box;
    const e = new gs(__privateGet(this, _i37), 25e-4, 1e-3, this._uiManager.direction === "ltr");
    __privateSet(this, _r21, e.getOutlines());
    const { firstPoint: s } = __privateGet(this, _l12);
    __privateSet(this, _f9, [
      (s[0] - this.x) / this.width,
      (s[1] - this.y) / this.height
    ]);
    const { lastPoint: i } = __privateGet(this, _r21);
    __privateSet(this, _m7, [
      (i[0] - this.x) / this.width,
      (i[1] - this.y) / this.height
    ]);
  };
  y_fn2 = function({ highlightOutlines: t, highlightId: e, clipPathId: s }) {
    var _a29, _b7;
    __privateSet(this, _l12, t);
    const i = 1.5;
    if (__privateSet(this, _r21, t.getNewOutline(__privateGet(this, _p6) / 2 + i, 25e-4)), e >= 0) __privateSet(this, _u10, e), __privateSet(this, _s31, s), this.parent.drawLayer.finalizeDraw(e, {
      bbox: t.box,
      path: {
        d: t.toSVGPath()
      }
    }), __privateSet(this, _g8, this.parent.drawLayer.drawOutline({
      rootClass: {
        highlightOutline: true,
        free: true
      },
      bbox: __privateGet(this, _r21).box,
      path: {
        d: __privateGet(this, _r21).toSVGPath()
      }
    }, true));
    else if (this.parent) {
      const c = this.parent.viewport.rotation;
      this.parent.drawLayer.updateProperties(__privateGet(this, _u10), {
        bbox: __privateMethod(_a29 = _Q, _Q_static, __fn2).call(_a29, __privateGet(this, _l12).box, (c - this.rotation + 360) % 360),
        path: {
          d: t.toSVGPath()
        }
      }), this.parent.drawLayer.updateProperties(__privateGet(this, _g8), {
        bbox: __privateMethod(_b7 = _Q, _Q_static, __fn2).call(_b7, __privateGet(this, _r21).box, c),
        path: {
          d: __privateGet(this, _r21).toSVGPath()
        }
      });
    }
    const [n, r, a, o] = t.box;
    switch (this.rotation) {
      case 0:
        this.x = n, this.y = r, this.width = a, this.height = o;
        break;
      case 90: {
        const [c, u] = this.parentDimensions;
        this.x = r, this.y = 1 - n, this.width = a * u / c, this.height = o * c / u;
        break;
      }
      case 180:
        this.x = 1 - n, this.y = 1 - r, this.width = a, this.height = o;
        break;
      case 270: {
        const [c, u] = this.parentDimensions;
        this.x = 1 - r, this.y = n, this.width = a * u / c, this.height = o * c / u;
        break;
      }
    }
    const { firstPoint: l } = t;
    __privateSet(this, _f9, [
      (l[0] - n) / a,
      (l[1] - r) / o
    ]);
    const { lastPoint: h } = __privateGet(this, _r21);
    __privateSet(this, _m7, [
      (h[0] - n) / a,
      (h[1] - r) / o
    ]);
  };
  C_fn2 = function(t) {
    const e = (n, r) => {
      this.color = n, this.opacity = r, this.onUpdatedColor();
    }, s = this.color, i = this.opacity;
    this.addCommands({
      cmd: e.bind(this, t, _Q._defaultOpacity),
      undo: e.bind(this, s, i),
      post: this._uiManager.updateUI.bind(this._uiManager, this),
      mustExec: true,
      type: O.HIGHLIGHT_COLOR,
      overwriteIfSameType: true,
      keepUndo: true
    }), this._reportTelemetry({
      action: "color_changed",
      color: this._uiManager.getNonHCMColorName(t)
    }, true);
  };
  E_fn2 = function(t) {
    const e = __privateGet(this, _p6), s = (i) => {
      __privateSet(this, _p6, i), __privateMethod(this, _Q_instances, v_fn2).call(this, i);
    };
    this.addCommands({
      cmd: s.bind(this, t),
      undo: s.bind(this, e),
      post: this._uiManager.updateUI.bind(this._uiManager, this),
      mustExec: true,
      type: O.INK_THICKNESS,
      overwriteIfSameType: true,
      keepUndo: true
    }), this._reportTelemetry({
      action: "thickness_changed",
      thickness: t
    }, true);
  };
  v_fn2 = function(t) {
    __privateGet(this, _d10) && (__privateMethod(this, _Q_instances, y_fn2).call(this, {
      highlightOutlines: __privateGet(this, _l12).getNewOutline(t / 2)
    }), this.fixAndSetPosition(), this.setDims());
  };
  x_fn2 = function() {
    __privateGet(this, _u10) === null || !this.parent || (this.parent.drawLayer.remove(__privateGet(this, _u10)), __privateSet(this, _u10, null), this.parent.drawLayer.remove(__privateGet(this, _g8)), __privateSet(this, _g8, null));
  };
  w_fn2 = function(t = this.parent) {
    __privateGet(this, _u10) === null && ({ id: __privateWrapper(this, _u10)._, clipPathId: __privateWrapper(this, _s31)._ } = t.drawLayer.draw({
      bbox: __privateGet(this, _l12).box,
      root: {
        viewBox: "0 0 1 1",
        fill: this.color,
        "fill-opacity": this.opacity
      },
      rootClass: {
        highlight: true,
        free: __privateGet(this, _d10)
      },
      path: {
        d: __privateGet(this, _l12).toSVGPath()
      }
    }, false, true), __privateSet(this, _g8, t.drawLayer.drawOutline({
      rootClass: {
        highlightOutline: true,
        free: __privateGet(this, _d10)
      },
      bbox: __privateGet(this, _r21).box,
      path: {
        d: __privateGet(this, _r21).toSVGPath()
      }
    }, __privateGet(this, _d10))), __privateGet(this, _h13) && (__privateGet(this, _h13).style.clipPath = __privateGet(this, _s31)));
  };
  _Q_static = new WeakSet();
  __fn2 = function([t, e, s, i], n) {
    switch (n) {
      case 90:
        return [
          1 - e - i,
          t,
          i,
          s
        ];
      case 180:
        return [
          1 - t - s,
          1 - e - i,
          s,
          i
        ];
      case 270:
        return [
          e,
          1 - t - s,
          i,
          s
        ];
    }
    return [
      t,
      e,
      s,
      i
    ];
  };
  M_fn4 = function(t) {
    _Q._keyboardManager.exec(this, t);
  };
  P_fn4 = function(t) {
    if (!__privateGet(this, _t65)) return;
    const e = window.getSelection();
    t ? e.setPosition(__privateGet(this, _t65), __privateGet(this, _e46)) : e.setPosition(__privateGet(this, _n21), __privateGet(this, _o16));
  };
  k_fn4 = function() {
    return __privateGet(this, _d10) ? this.rotation : 0;
  };
  O_fn4 = function() {
    if (__privateGet(this, _d10)) return null;
    const [t, e] = this.pageDimensions, [s, i] = this.pageTranslation, n = __privateGet(this, _i37), r = new Float32Array(n.length * 8);
    let a = 0;
    for (const { x: o, y: l, width: h, height: c } of n) {
      const u = o * t + s, f = (1 - l) * e + i;
      r[a] = r[a + 4] = u, r[a + 1] = r[a + 3] = f, r[a + 2] = r[a + 6] = u + h * t, r[a + 5] = r[a + 7] = f - c * e, a += 8;
    }
    return r;
  };
  I_fn2 = function(t) {
    return __privateGet(this, _l12).serialize(t, __privateMethod(this, _Q_instances, k_fn4).call(this));
  };
  R_fn2 = function(t, e) {
    this._freeHighlight.add(e) && t.drawLayer.updateProperties(this._freeHighlightId, {
      path: {
        d: this._freeHighlight.toSVGPath()
      }
    });
  };
  B_fn2 = function(t, e) {
    this._freeHighlight.isEmpty() ? t.drawLayer.remove(this._freeHighlightId) : t.createAndAddNewEditor(e, false, {
      highlightId: this._freeHighlightId,
      highlightOutlines: this._freeHighlight.getOutlines(),
      clipPathId: this._freeHighlightClipId,
      methodOfCreation: "main_toolbar"
    }), this._freeHighlightId = -1, this._freeHighlight = null, this._freeHighlightClipId = "";
  };
  F_fn3 = function(t) {
    const { color: e } = this._initialData;
    return this.hasEditedComment || t.color.some((s, i) => s !== e[i]);
  };
  __privateAdd(_Q, _Q_static);
  __publicField(_Q, "_defaultColor", null);
  __publicField(_Q, "_defaultOpacity", 1);
  __publicField(_Q, "_defaultThickness", 12);
  __publicField(_Q, "_type", "highlight");
  __publicField(_Q, "_editorType", R.HIGHLIGHT);
  __publicField(_Q, "_freeHighlightId", -1);
  __publicField(_Q, "_freeHighlight", null);
  __publicField(_Q, "_freeHighlightClipId", "");
  let Q = _Q;
  class $i {
    constructor() {
      __privateAdd(this, _t66, /* @__PURE__ */ Object.create(null));
    }
    updateProperty(t, e) {
      this[t] = e, this.updateSVGProperty(t, e);
    }
    updateProperties(t) {
      if (t) for (const [e, s] of Object.entries(t)) e.startsWith("_") || this.updateProperty(e, s);
    }
    updateSVGProperty(t, e) {
      __privateGet(this, _t66)[t] = e;
    }
    toSVGProperties() {
      const t = __privateGet(this, _t66);
      return __privateSet(this, _t66, /* @__PURE__ */ Object.create(null)), {
        root: t
      };
    }
    reset() {
      __privateSet(this, _t66, /* @__PURE__ */ Object.create(null));
    }
    updateAll(t = this) {
      this.updateProperties(t);
    }
    clone() {
      $("Not implemented");
    }
  }
  _t66 = new WeakMap();
  const _U2 = class _U2 extends D {
    constructor(t) {
      super(t);
      __privateAdd(this, _U_instances);
      __privateAdd(this, _t67, null);
      __privateAdd(this, _e47);
      __publicField(this, "_colorPicker", null);
      __publicField(this, "_drawId", null);
      __privateSet(this, _e47, t.mustBeCommitted || false), this._addOutlines(t);
    }
    onUpdatedColor() {
      var _a29;
      (_a29 = this._colorPicker) == null ? void 0 : _a29.update(this.color), super.onUpdatedColor();
    }
    _addOutlines(t) {
      t.drawOutlines && (__privateMethod(this, _U_instances, r_fn4).call(this, t), __privateMethod(this, _U_instances, h_fn8).call(this));
    }
    static _mergeSVGProperties(t, e) {
      const s = new Set(Object.keys(t));
      for (const [i, n] of Object.entries(e)) s.has(i) ? Object.assign(t[i], n) : t[i] = n;
      return t;
    }
    static getDefaultDrawingOptions(t) {
      $("Not implemented");
    }
    static get typesMap() {
      $("Not implemented");
    }
    static get isDrawer() {
      return true;
    }
    static get supportMultipleDrawings() {
      return false;
    }
    static updateDefaultParams(t, e) {
      const s = this.typesMap.get(t);
      s && this._defaultDrawingOptions.updateProperty(s, e), this._currentParent && (__privateGet(_U2, _i38).updateProperty(s, e), this._currentParent.drawLayer.updateProperties(this._currentDrawId, this._defaultDrawingOptions.toSVGProperties()));
    }
    updateParams(t, e) {
      const s = this.constructor.typesMap.get(t);
      s && this._updateProperty(t, s, e);
    }
    static get defaultPropertiesToUpdate() {
      const t = [], e = this._defaultDrawingOptions;
      for (const [s, i] of this.typesMap) t.push([
        s,
        e[i]
      ]);
      return t;
    }
    get propertiesToUpdate() {
      const t = [], { _drawingOptions: e } = this;
      for (const [s, i] of this.constructor.typesMap) t.push([
        s,
        e[i]
      ]);
      return t;
    }
    _updateProperty(t, e, s) {
      const i = this._drawingOptions, n = i[e], r = (a) => {
        var _a29;
        i.updateProperty(e, a);
        const o = __privateGet(this, _t67).updateProperty(e, a);
        o && __privateMethod(this, _U_instances, d_fn6).call(this, o), (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, i.toSVGProperties()), t === this.colorType && this.onUpdatedColor();
      };
      this.addCommands({
        cmd: r.bind(this, s),
        undo: r.bind(this, n),
        post: this._uiManager.updateUI.bind(this._uiManager, this),
        mustExec: true,
        type: t,
        overwriteIfSameType: true,
        keepUndo: true
      });
    }
    _onResizing() {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, _U2._mergeSVGProperties(__privateGet(this, _t67).getPathResizingSVGProperties(__privateMethod(this, _U_instances, u_fn9).call(this)), {
        bbox: __privateMethod(this, _U_instances, f_fn6).call(this)
      }));
    }
    _onResized() {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, _U2._mergeSVGProperties(__privateGet(this, _t67).getPathResizedSVGProperties(__privateMethod(this, _U_instances, u_fn9).call(this)), {
        bbox: __privateMethod(this, _U_instances, f_fn6).call(this)
      }));
    }
    _onTranslating(t, e) {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, {
        bbox: __privateMethod(this, _U_instances, f_fn6).call(this)
      });
    }
    _onTranslated() {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, _U2._mergeSVGProperties(__privateGet(this, _t67).getPathTranslatedSVGProperties(__privateMethod(this, _U_instances, u_fn9).call(this), this.parentDimensions), {
        bbox: __privateMethod(this, _U_instances, f_fn6).call(this)
      }));
    }
    _onStartDragging() {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, {
        rootClass: {
          moving: true
        }
      });
    }
    _onStopDragging() {
      var _a29;
      (_a29 = this.parent) == null ? void 0 : _a29.drawLayer.updateProperties(this._drawId, {
        rootClass: {
          moving: false
        }
      });
    }
    commit() {
      super.commit(), this.disableEditMode(), this.disableEditing();
    }
    disableEditing() {
      super.disableEditing(), this.div.classList.toggle("disabled", true);
    }
    enableEditing() {
      super.enableEditing(), this.div.classList.toggle("disabled", false);
    }
    getBaseTranslation() {
      return [
        0,
        0
      ];
    }
    get isResizable() {
      return true;
    }
    onceAdded(t) {
      this.annotationElementId || this.parent.addUndoableEditor(this), this._isDraggable = true, __privateGet(this, _e47) && (__privateSet(this, _e47, false), this.commit(), this.parent.setSelected(this), t && this.isOnScreen && this.div.focus());
    }
    remove() {
      __privateMethod(this, _U_instances, o_fn6).call(this), super.remove();
    }
    rebuild() {
      this.parent && (super.rebuild(), this.div !== null && (__privateMethod(this, _U_instances, h_fn8).call(this), __privateMethod(this, _U_instances, d_fn6).call(this, __privateGet(this, _t67).box), this.isAttachedToDOM || this.parent.add(this)));
    }
    setParent(t) {
      var _a29;
      let e = false;
      this.parent && !t ? (this._uiManager.removeShouldRescale(this), __privateMethod(this, _U_instances, o_fn6).call(this)) : t && (this._uiManager.addShouldRescale(this), __privateMethod(this, _U_instances, h_fn8).call(this, t), e = !this.parent && ((_a29 = this.div) == null ? void 0 : _a29.classList.contains("selectedEditor"))), super.setParent(t), e && this.select();
    }
    rotate() {
      this.parent && this.parent.drawLayer.updateProperties(this._drawId, _U2._mergeSVGProperties({
        bbox: __privateMethod(this, _U_instances, f_fn6).call(this)
      }, __privateGet(this, _t67).updateRotation((this.parentRotation - this.rotation + 360) % 360)));
    }
    onScaleChanging() {
      this.parent && __privateMethod(this, _U_instances, d_fn6).call(this, __privateGet(this, _t67).updateParentDimensions(this.parentDimensions, this.parent.scale));
    }
    static onScaleChangingWhenDrawing() {
    }
    render() {
      if (this.div) return this.div;
      let t, e;
      this._isCopy && (t = this.x, e = this.y);
      const s = super.render();
      s.classList.add("draw");
      const i = document.createElement("div");
      return s.append(i), i.setAttribute("aria-hidden", "true"), i.className = "internal", this.setDims(), this._uiManager.addShouldRescale(this), this.disableEditing(), this._isCopy && this._moveAfterPaste(t, e), s;
    }
    static createDrawerInstance(t, e, s, i, n) {
      $("Not implemented");
    }
    static startDrawing(t, e, s, i) {
      var _a29;
      const { target: n, offsetX: r, offsetY: a, pointerId: o, pointerType: l } = i;
      if (H.isInitializedAndDifferentPointerType(l)) return;
      const { viewport: { rotation: h } } = t, { width: c, height: u } = n.getBoundingClientRect(), f = __privateSet(_U2, _s32, new AbortController()), g = t.combinedSignal(f);
      if (H.setPointer(l, o), window.addEventListener("pointerup", (p) => {
        H.isSamePointerIdOrRemove(p.pointerId) && this._endDraw(p);
      }, {
        signal: g
      }), window.addEventListener("pointercancel", (p) => {
        H.isSamePointerIdOrRemove(p.pointerId) && this._currentParent.endDrawingSession();
      }, {
        signal: g
      }), window.addEventListener("pointerdown", (p) => {
        H.isSamePointerType(p.pointerType) && (H.initializeAndAddPointerId(p.pointerId), __privateGet(_U2, _i38).isCancellable() && (__privateGet(_U2, _i38).removeLastElement(), __privateGet(_U2, _i38).isEmpty() ? this._currentParent.endDrawingSession(true) : this._endDraw(null)));
      }, {
        capture: true,
        passive: false,
        signal: g
      }), window.addEventListener("contextmenu", St, {
        signal: g
      }), n.addEventListener("pointermove", this._drawMove.bind(this), {
        signal: g
      }), n.addEventListener("touchmove", (p) => {
        H.isSameTimeStamp(p.timeStamp) && K(p);
      }, {
        signal: g
      }), t.toggleDrawing(), (_a29 = e._editorUndoBar) == null ? void 0 : _a29.hide(), __privateGet(_U2, _i38)) {
        t.drawLayer.updateProperties(this._currentDrawId, __privateGet(_U2, _i38).startNew(r, a, c, u, h));
        return;
      }
      e.updateUIForDefaultProperties(this), __privateSet(_U2, _i38, this.createDrawerInstance(r, a, c, u, h)), __privateSet(_U2, _a24, this.getDefaultDrawingOptions()), this._currentParent = t, { id: this._currentDrawId } = t.drawLayer.draw(this._mergeSVGProperties(__privateGet(_U2, _a24).toSVGProperties(), __privateGet(_U2, _i38).defaultSVGProperties), true, false);
    }
    static _drawMove(t) {
      if (H.isSameTimeStamp(t.timeStamp), !__privateGet(_U2, _i38)) return;
      const { offsetX: e, offsetY: s, pointerId: i } = t;
      if (H.isSamePointerId(i)) {
        if (H.isUsingMultiplePointers()) {
          this._endDraw(t);
          return;
        }
        this._currentParent.drawLayer.updateProperties(this._currentDrawId, __privateGet(_U2, _i38).add(e, s)), H.setTimeStamp(t.timeStamp), K(t);
      }
    }
    static _cleanup(t) {
      t && (this._currentDrawId = -1, this._currentParent = null, __privateSet(_U2, _i38, null), __privateSet(_U2, _a24, null), H.clearTimeStamp()), __privateGet(_U2, _s32) && (__privateGet(_U2, _s32).abort(), __privateSet(_U2, _s32, null), H.clearPointerIds());
    }
    static _endDraw(t) {
      const e = this._currentParent;
      if (e) {
        if (e.toggleDrawing(true), this._cleanup(false), (t == null ? void 0 : t.target) === e.div && e.drawLayer.updateProperties(this._currentDrawId, __privateGet(_U2, _i38).end(t.offsetX, t.offsetY)), this.supportMultipleDrawings) {
          const s = __privateGet(_U2, _i38), i = this._currentDrawId, n = s.getLastElement();
          e.addCommands({
            cmd: () => {
              e.drawLayer.updateProperties(i, s.setLastElement(n));
            },
            undo: () => {
              e.drawLayer.updateProperties(i, s.removeLastElement());
            },
            mustExec: false,
            type: O.DRAW_STEP
          });
          return;
        }
        this.endDrawing(false);
      }
    }
    static endDrawing(t) {
      const e = this._currentParent;
      if (!e) return null;
      if (e.toggleDrawing(true), e.cleanUndoStack(O.DRAW_STEP), !__privateGet(_U2, _i38).isEmpty()) {
        const { pageDimensions: [s, i], scale: n } = e, r = e.createAndAddNewEditor({
          offsetX: 0,
          offsetY: 0
        }, false, {
          drawId: this._currentDrawId,
          drawOutlines: __privateGet(_U2, _i38).getOutlines(s * n, i * n, n, this._INNER_MARGIN),
          drawingOptions: __privateGet(_U2, _a24),
          mustBeCommitted: !t
        });
        return this._cleanup(true), r;
      }
      return e.drawLayer.remove(this._currentDrawId), this._cleanup(true), null;
    }
    createDrawingOptions(t) {
    }
    static deserializeDraw(t, e, s, i, n, r) {
      $("Not implemented");
    }
    static async deserialize(t, e, s) {
      var _a29, _b7;
      const { rawDims: { pageWidth: i, pageHeight: n, pageX: r, pageY: a } } = e.viewport, o = this.deserializeDraw(r, a, i, n, this._INNER_MARGIN, t), l = await super.deserialize(t, e, s);
      return l.createDrawingOptions(t), __privateMethod(_a29 = l, _U_instances, r_fn4).call(_a29, {
        drawOutlines: o
      }), __privateMethod(_b7 = l, _U_instances, h_fn8).call(_b7), l.onScaleChanging(), l.rotate(), l;
    }
    serializeDraw(t) {
      const [e, s] = this.pageTranslation, [i, n] = this.pageDimensions;
      return __privateGet(this, _t67).serialize([
        e,
        s,
        i,
        n
      ], t);
    }
    renderAnnotationElement(t) {
      return t.updateEdited({
        rect: this.getPDFRect()
      }), null;
    }
    static canCreateNewEmptyEditor() {
      return false;
    }
  };
  _t67 = new WeakMap();
  _e47 = new WeakMap();
  _i38 = new WeakMap();
  _s32 = new WeakMap();
  _a24 = new WeakMap();
  _U_instances = new WeakSet();
  r_fn4 = function({ drawOutlines: t, drawId: e, drawingOptions: s }) {
    __privateSet(this, _t67, t), this._drawingOptions || (this._drawingOptions = s), this.annotationElementId || this._uiManager.a11yAlert(`pdfjs-editor-${this.editorType}-added-alert`), e >= 0 ? (this._drawId = e, this.parent.drawLayer.finalizeDraw(e, t.defaultProperties)) : this._drawId = __privateMethod(this, _U_instances, n_fn3).call(this, t, this.parent), __privateMethod(this, _U_instances, d_fn6).call(this, t.box);
  };
  n_fn3 = function(t, e) {
    const { id: s } = e.drawLayer.draw(_U2._mergeSVGProperties(this._drawingOptions.toSVGProperties(), t.defaultSVGProperties), false, false);
    return s;
  };
  o_fn6 = function() {
    this._drawId === null || !this.parent || (this.parent.drawLayer.remove(this._drawId), this._drawId = null, this._drawingOptions.reset());
  };
  h_fn8 = function(t = this.parent) {
    if (!(this._drawId !== null && this.parent === t)) {
      if (this._drawId !== null) {
        this.parent.drawLayer.updateParent(this._drawId, t.drawLayer);
        return;
      }
      this._drawingOptions.updateAll(), this._drawId = __privateMethod(this, _U_instances, n_fn3).call(this, __privateGet(this, _t67), t);
    }
  };
  l_fn9 = function([t, e, s, i]) {
    const { parentDimensions: [n, r], rotation: a } = this;
    switch (a) {
      case 90:
        return [
          e,
          1 - t,
          s * (r / n),
          i * (n / r)
        ];
      case 180:
        return [
          1 - t,
          1 - e,
          s,
          i
        ];
      case 270:
        return [
          1 - e,
          t,
          s * (r / n),
          i * (n / r)
        ];
      default:
        return [
          t,
          e,
          s,
          i
        ];
    }
  };
  u_fn9 = function() {
    const { x: t, y: e, width: s, height: i, parentDimensions: [n, r], rotation: a } = this;
    switch (a) {
      case 90:
        return [
          1 - e,
          t,
          s * (n / r),
          i * (r / n)
        ];
      case 180:
        return [
          1 - t,
          1 - e,
          s,
          i
        ];
      case 270:
        return [
          e,
          1 - t,
          s * (n / r),
          i * (r / n)
        ];
      default:
        return [
          t,
          e,
          s,
          i
        ];
    }
  };
  d_fn6 = function(t) {
    [this.x, this.y, this.width, this.height] = __privateMethod(this, _U_instances, l_fn9).call(this, t), this.div && (this.fixAndSetPosition(), this.setDims()), this._onResized();
  };
  f_fn6 = function() {
    const { x: t, y: e, width: s, height: i, rotation: n, parentRotation: r, parentDimensions: [a, o] } = this;
    switch ((n * 4 + r) / 90) {
      case 1:
        return [
          1 - e - i,
          t,
          i,
          s
        ];
      case 2:
        return [
          1 - t - s,
          1 - e - i,
          s,
          i
        ];
      case 3:
        return [
          e,
          1 - t - s,
          i,
          s
        ];
      case 4:
        return [
          t,
          e - s * (a / o),
          i * (o / a),
          s * (a / o)
        ];
      case 5:
        return [
          1 - e,
          t,
          s * (a / o),
          i * (o / a)
        ];
      case 6:
        return [
          1 - t - i * (o / a),
          1 - e,
          i * (o / a),
          s * (a / o)
        ];
      case 7:
        return [
          e - s * (a / o),
          1 - t - i * (o / a),
          s * (a / o),
          i * (o / a)
        ];
      case 8:
        return [
          t - s,
          e - i,
          s,
          i
        ];
      case 9:
        return [
          1 - e,
          t - s,
          i,
          s
        ];
      case 10:
        return [
          1 - t,
          1 - e,
          s,
          i
        ];
      case 11:
        return [
          e - i,
          1 - t,
          i,
          s
        ];
      case 12:
        return [
          t - i * (o / a),
          e,
          i * (o / a),
          s * (a / o)
        ];
      case 13:
        return [
          1 - e - s * (a / o),
          t - i * (o / a),
          s * (a / o),
          i * (o / a)
        ];
      case 14:
        return [
          1 - t,
          1 - e - s * (a / o),
          i * (o / a),
          s * (a / o)
        ];
      case 15:
        return [
          e,
          1 - t,
          s * (a / o),
          i * (o / a)
        ];
      default:
        return [
          t,
          e,
          s,
          i
        ];
    }
  };
  __publicField(_U2, "_currentDrawId", -1);
  __publicField(_U2, "_currentParent", null);
  __privateAdd(_U2, _i38, null);
  __privateAdd(_U2, _s32, null);
  __privateAdd(_U2, _a24, null);
  __publicField(_U2, "_INNER_MARGIN", 3);
  let U = _U2;
  class jr {
    constructor(t, e, s, i, n, r) {
      __privateAdd(this, _jr_instances);
      __privateAdd(this, _t68, new Float64Array(6));
      __privateAdd(this, _e48);
      __privateAdd(this, _i39);
      __privateAdd(this, _s33);
      __privateAdd(this, _a25);
      __privateAdd(this, _r22);
      __privateAdd(this, _n22, "");
      __privateAdd(this, _o17, 0);
      __privateAdd(this, _h14, new Ae());
      __privateAdd(this, _l13);
      __privateAdd(this, _u11);
      __privateSet(this, _l13, s), __privateSet(this, _u11, i), __privateSet(this, _s33, n), __privateSet(this, _a25, r), [t, e] = __privateMethod(this, _jr_instances, d_fn7).call(this, t, e);
      const a = __privateSet(this, _e48, [
        NaN,
        NaN,
        NaN,
        NaN,
        t,
        e
      ]);
      __privateSet(this, _r22, [
        t,
        e
      ]), __privateSet(this, _i39, [
        {
          line: a,
          points: __privateGet(this, _r22)
        }
      ]), __privateGet(this, _t68).set(a, 0);
    }
    updateProperty(t, e) {
      t === "stroke-width" && __privateSet(this, _a25, e);
    }
    isEmpty() {
      return !__privateGet(this, _i39) || __privateGet(this, _i39).length === 0;
    }
    isCancellable() {
      return __privateGet(this, _r22).length <= 10;
    }
    add(t, e) {
      [t, e] = __privateMethod(this, _jr_instances, d_fn7).call(this, t, e);
      const [s, i, n, r] = __privateGet(this, _t68).subarray(2, 6), a = t - n, o = e - r;
      return Math.hypot(__privateGet(this, _l13) * a, __privateGet(this, _u11) * o) <= 2 ? null : (__privateGet(this, _r22).push(t, e), isNaN(s) ? (__privateGet(this, _t68).set([
        n,
        r,
        t,
        e
      ], 2), __privateGet(this, _e48).push(NaN, NaN, NaN, NaN, t, e), {
        path: {
          d: this.toSVGPath()
        }
      }) : (isNaN(__privateGet(this, _t68)[0]) && __privateGet(this, _e48).splice(6, 6), __privateGet(this, _t68).set([
        s,
        i,
        n,
        r,
        t,
        e
      ], 0), __privateGet(this, _e48).push(...P.createBezierPoints(s, i, n, r, t, e)), {
        path: {
          d: this.toSVGPath()
        }
      }));
    }
    end(t, e) {
      const s = this.add(t, e);
      return s || (__privateGet(this, _r22).length === 2 ? {
        path: {
          d: this.toSVGPath()
        }
      } : null);
    }
    startNew(t, e, s, i, n) {
      __privateSet(this, _l13, s), __privateSet(this, _u11, i), __privateSet(this, _s33, n), [t, e] = __privateMethod(this, _jr_instances, d_fn7).call(this, t, e);
      const r = __privateSet(this, _e48, [
        NaN,
        NaN,
        NaN,
        NaN,
        t,
        e
      ]);
      __privateSet(this, _r22, [
        t,
        e
      ]);
      const a = __privateGet(this, _i39).at(-1);
      return a && (a.line = new Float32Array(a.line), a.points = new Float32Array(a.points)), __privateGet(this, _i39).push({
        line: r,
        points: __privateGet(this, _r22)
      }), __privateGet(this, _t68).set(r, 0), __privateSet(this, _o17, 0), this.toSVGPath(), null;
    }
    getLastElement() {
      return __privateGet(this, _i39).at(-1);
    }
    setLastElement(t) {
      return __privateGet(this, _i39) ? (__privateGet(this, _i39).push(t), __privateSet(this, _e48, t.line), __privateSet(this, _r22, t.points), __privateSet(this, _o17, 0), {
        path: {
          d: this.toSVGPath()
        }
      }) : __privateGet(this, _h14).setLastElement(t);
    }
    removeLastElement() {
      if (!__privateGet(this, _i39)) return __privateGet(this, _h14).removeLastElement();
      __privateGet(this, _i39).pop(), __privateSet(this, _n22, "");
      for (let t = 0, e = __privateGet(this, _i39).length; t < e; t++) {
        const { line: s, points: i } = __privateGet(this, _i39)[t];
        __privateSet(this, _e48, s), __privateSet(this, _r22, i), __privateSet(this, _o17, 0), this.toSVGPath();
      }
      return {
        path: {
          d: __privateGet(this, _n22)
        }
      };
    }
    toSVGPath() {
      const t = P.svgRound(__privateGet(this, _e48)[4]), e = P.svgRound(__privateGet(this, _e48)[5]);
      if (__privateGet(this, _r22).length === 2) return __privateSet(this, _n22, `${__privateGet(this, _n22)} M ${t} ${e} Z`), __privateGet(this, _n22);
      if (__privateGet(this, _r22).length <= 6) {
        const i = __privateGet(this, _n22).lastIndexOf("M");
        __privateSet(this, _n22, `${__privateGet(this, _n22).slice(0, i)} M ${t} ${e}`), __privateSet(this, _o17, 6);
      }
      if (__privateGet(this, _r22).length === 4) {
        const i = P.svgRound(__privateGet(this, _e48)[10]), n = P.svgRound(__privateGet(this, _e48)[11]);
        return __privateSet(this, _n22, `${__privateGet(this, _n22)} L ${i} ${n}`), __privateSet(this, _o17, 12), __privateGet(this, _n22);
      }
      const s = [];
      __privateGet(this, _o17) === 0 && (s.push(`M ${t} ${e}`), __privateSet(this, _o17, 6));
      for (let i = __privateGet(this, _o17), n = __privateGet(this, _e48).length; i < n; i += 6) {
        const [r, a, o, l, h, c] = __privateGet(this, _e48).slice(i, i + 6).map(P.svgRound);
        s.push(`C${r} ${a} ${o} ${l} ${h} ${c}`);
      }
      return __privateSet(this, _n22, __privateGet(this, _n22) + s.join(" ")), __privateSet(this, _o17, __privateGet(this, _e48).length), __privateGet(this, _n22);
    }
    getOutlines(t, e, s, i) {
      const n = __privateGet(this, _i39).at(-1);
      return n.line = new Float32Array(n.line), n.points = new Float32Array(n.points), __privateGet(this, _h14).build(__privateGet(this, _i39), t, e, s, __privateGet(this, _s33), __privateGet(this, _a25), i), __privateSet(this, _t68, null), __privateSet(this, _e48, null), __privateSet(this, _i39, null), __privateSet(this, _n22, null), __privateGet(this, _h14);
    }
    get defaultSVGProperties() {
      return {
        root: {
          viewBox: "0 0 10000 10000"
        },
        rootClass: {
          draw: true
        },
        bbox: [
          0,
          0,
          1,
          1
        ]
      };
    }
  }
  _t68 = new WeakMap();
  _e48 = new WeakMap();
  _i39 = new WeakMap();
  _s33 = new WeakMap();
  _a25 = new WeakMap();
  _r22 = new WeakMap();
  _n22 = new WeakMap();
  _o17 = new WeakMap();
  _h14 = new WeakMap();
  _l13 = new WeakMap();
  _u11 = new WeakMap();
  _jr_instances = new WeakSet();
  d_fn7 = function(t, e) {
    return P._normalizePoint(t, e, __privateGet(this, _l13), __privateGet(this, _u11), __privateGet(this, _s33));
  };
  class Ae extends P {
    constructor() {
      super(...arguments);
      __privateAdd(this, _Ae_instances);
      __privateAdd(this, _t69);
      __privateAdd(this, _e49, 0);
      __privateAdd(this, _i40);
      __privateAdd(this, _s34);
      __privateAdd(this, _a26);
      __privateAdd(this, _r23);
      __privateAdd(this, _n23);
      __privateAdd(this, _o18);
      __privateAdd(this, _h15);
    }
    build(t, e, s, i, n, r, a) {
      __privateSet(this, _a26, e), __privateSet(this, _r23, s), __privateSet(this, _n23, i), __privateSet(this, _o18, n), __privateSet(this, _h15, r), __privateSet(this, _i40, a ?? 0), __privateSet(this, _s34, t), __privateMethod(this, _Ae_instances, d_fn8).call(this);
    }
    get thickness() {
      return __privateGet(this, _h15);
    }
    setLastElement(t) {
      return __privateGet(this, _s34).push(t), {
        path: {
          d: this.toSVGPath()
        }
      };
    }
    removeLastElement() {
      return __privateGet(this, _s34).pop(), {
        path: {
          d: this.toSVGPath()
        }
      };
    }
    toSVGPath() {
      const t = [];
      for (const { line: e } of __privateGet(this, _s34)) {
        if (t.push(`M${P.svgRound(e[4])} ${P.svgRound(e[5])}`), e.length === 6) {
          t.push("Z");
          continue;
        }
        if (e.length === 12 && isNaN(e[6])) {
          t.push(`L${P.svgRound(e[10])} ${P.svgRound(e[11])}`);
          continue;
        }
        for (let s = 6, i = e.length; s < i; s += 6) {
          const [n, r, a, o, l, h] = e.subarray(s, s + 6).map(P.svgRound);
          t.push(`C${n} ${r} ${a} ${o} ${l} ${h}`);
        }
      }
      return t.join("");
    }
    serialize([t, e, s, i], n) {
      const r = [], a = [], [o, l, h, c] = __privateMethod(this, _Ae_instances, u_fn10).call(this);
      let u, f, g, p, b, m, A, y, v;
      switch (__privateGet(this, _o18)) {
        case 0:
          v = P._rescale, u = t, f = e + i, g = s, p = -i, b = t + o * s, m = e + (1 - l - c) * i, A = t + (o + h) * s, y = e + (1 - l) * i;
          break;
        case 90:
          v = P._rescaleAndSwap, u = t, f = e, g = s, p = i, b = t + l * s, m = e + o * i, A = t + (l + c) * s, y = e + (o + h) * i;
          break;
        case 180:
          v = P._rescale, u = t + s, f = e, g = -s, p = i, b = t + (1 - o - h) * s, m = e + l * i, A = t + (1 - o) * s, y = e + (l + c) * i;
          break;
        case 270:
          v = P._rescaleAndSwap, u = t + s, f = e + i, g = -s, p = -i, b = t + (1 - l - c) * s, m = e + (1 - o - h) * i, A = t + (1 - l) * s, y = e + (1 - o) * i;
          break;
      }
      for (const { line: w, points: S } of __privateGet(this, _s34)) r.push(v(w, u, f, g, p, n ? new Array(w.length) : null)), a.push(v(S, u, f, g, p, n ? new Array(S.length) : null));
      return {
        lines: r,
        points: a,
        rect: [
          b,
          m,
          A,
          y
        ]
      };
    }
    static deserialize(t, e, s, i, n, { paths: { lines: r, points: a }, rotation: o, thickness: l }) {
      const h = [];
      let c, u, f, g, p;
      switch (o) {
        case 0:
          p = P._rescale, c = -t / s, u = e / i + 1, f = 1 / s, g = -1 / i;
          break;
        case 90:
          p = P._rescaleAndSwap, c = -e / i, u = -t / s, f = 1 / i, g = 1 / s;
          break;
        case 180:
          p = P._rescale, c = t / s + 1, u = -e / i, f = -1 / s, g = 1 / i;
          break;
        case 270:
          p = P._rescaleAndSwap, c = e / i + 1, u = t / s + 1, f = -1 / i, g = -1 / s;
          break;
      }
      if (!r) {
        r = [];
        for (const m of a) {
          const A = m.length;
          if (A === 2) {
            r.push(new Float32Array([
              NaN,
              NaN,
              NaN,
              NaN,
              m[0],
              m[1]
            ]));
            continue;
          }
          if (A === 4) {
            r.push(new Float32Array([
              NaN,
              NaN,
              NaN,
              NaN,
              m[0],
              m[1],
              NaN,
              NaN,
              NaN,
              NaN,
              m[2],
              m[3]
            ]));
            continue;
          }
          const y = new Float32Array(3 * (A - 2));
          r.push(y);
          let [v, w, S, E] = m.subarray(0, 4);
          y.set([
            NaN,
            NaN,
            NaN,
            NaN,
            v,
            w
          ], 0);
          for (let _ = 4; _ < A; _ += 2) {
            const C = m[_], k = m[_ + 1];
            y.set(P.createBezierPoints(v, w, S, E, C, k), (_ - 2) * 3), [v, w, S, E] = [
              S,
              E,
              C,
              k
            ];
          }
        }
      }
      for (let m = 0, A = r.length; m < A; m++) h.push({
        line: p(r[m].map((y) => y ?? NaN), c, u, f, g),
        points: p(a[m].map((y) => y ?? NaN), c, u, f, g)
      });
      const b = new this.prototype.constructor();
      return b.build(h, s, i, 1, o, l, n), b;
    }
    get box() {
      return __privateGet(this, _t69);
    }
    updateProperty(t, e) {
      return t === "stroke-width" ? __privateMethod(this, _Ae_instances, f_fn7).call(this, e) : null;
    }
    updateParentDimensions([t, e], s) {
      const [i, n] = __privateMethod(this, _Ae_instances, l_fn10).call(this);
      __privateSet(this, _a26, t), __privateSet(this, _r23, e), __privateSet(this, _n23, s);
      const [r, a] = __privateMethod(this, _Ae_instances, l_fn10).call(this), o = r - i, l = a - n, h = __privateGet(this, _t69);
      return h[0] -= o, h[1] -= l, h[2] += 2 * o, h[3] += 2 * l, h;
    }
    updateRotation(t) {
      return __privateSet(this, _e49, t), {
        path: {
          transform: this.rotationTransform
        }
      };
    }
    get viewBox() {
      return __privateGet(this, _t69).map(P.svgRound).join(" ");
    }
    get defaultProperties() {
      const [t, e] = __privateGet(this, _t69);
      return {
        root: {
          viewBox: this.viewBox
        },
        path: {
          "transform-origin": `${P.svgRound(t)} ${P.svgRound(e)}`
        }
      };
    }
    get rotationTransform() {
      const [, , t, e] = __privateGet(this, _t69);
      let s = 0, i = 0, n = 0, r = 0, a = 0, o = 0;
      switch (__privateGet(this, _e49)) {
        case 90:
          i = e / t, n = -t / e, a = t;
          break;
        case 180:
          s = -1, r = -1, a = t, o = e;
          break;
        case 270:
          i = -e / t, n = t / e, o = e;
          break;
        default:
          return "";
      }
      return `matrix(${s} ${i} ${n} ${r} ${P.svgRound(a)} ${P.svgRound(o)})`;
    }
    getPathResizingSVGProperties([t, e, s, i]) {
      const [n, r] = __privateMethod(this, _Ae_instances, l_fn10).call(this), [a, o, l, h] = __privateGet(this, _t69);
      if (Math.abs(l - n) <= P.PRECISION || Math.abs(h - r) <= P.PRECISION) {
        const p = t + s / 2 - (a + l / 2), b = e + i / 2 - (o + h / 2);
        return {
          path: {
            "transform-origin": `${P.svgRound(t)} ${P.svgRound(e)}`,
            transform: `${this.rotationTransform} translate(${p} ${b})`
          }
        };
      }
      const c = (s - 2 * n) / (l - 2 * n), u = (i - 2 * r) / (h - 2 * r), f = l / s, g = h / i;
      return {
        path: {
          "transform-origin": `${P.svgRound(a)} ${P.svgRound(o)}`,
          transform: `${this.rotationTransform} scale(${f} ${g}) translate(${P.svgRound(n)} ${P.svgRound(r)}) scale(${c} ${u}) translate(${P.svgRound(-n)} ${P.svgRound(-r)})`
        }
      };
    }
    getPathResizedSVGProperties([t, e, s, i]) {
      const [n, r] = __privateMethod(this, _Ae_instances, l_fn10).call(this), a = __privateGet(this, _t69), [o, l, h, c] = a;
      if (a[0] = t, a[1] = e, a[2] = s, a[3] = i, Math.abs(h - n) <= P.PRECISION || Math.abs(c - r) <= P.PRECISION) {
        const b = t + s / 2 - (o + h / 2), m = e + i / 2 - (l + c / 2);
        for (const { line: A, points: y } of __privateGet(this, _s34)) P._translate(A, b, m, A), P._translate(y, b, m, y);
        return {
          root: {
            viewBox: this.viewBox
          },
          path: {
            "transform-origin": `${P.svgRound(t)} ${P.svgRound(e)}`,
            transform: this.rotationTransform || null,
            d: this.toSVGPath()
          }
        };
      }
      const u = (s - 2 * n) / (h - 2 * n), f = (i - 2 * r) / (c - 2 * r), g = -u * (o + n) + t + n, p = -f * (l + r) + e + r;
      if (u !== 1 || f !== 1 || g !== 0 || p !== 0) for (const { line: b, points: m } of __privateGet(this, _s34)) P._rescale(b, g, p, u, f, b), P._rescale(m, g, p, u, f, m);
      return {
        root: {
          viewBox: this.viewBox
        },
        path: {
          "transform-origin": `${P.svgRound(t)} ${P.svgRound(e)}`,
          transform: this.rotationTransform || null,
          d: this.toSVGPath()
        }
      };
    }
    getPathTranslatedSVGProperties([t, e], s) {
      const [i, n] = s, r = __privateGet(this, _t69), a = t - r[0], o = e - r[1];
      if (__privateGet(this, _a26) === i && __privateGet(this, _r23) === n) for (const { line: l, points: h } of __privateGet(this, _s34)) P._translate(l, a, o, l), P._translate(h, a, o, h);
      else {
        const l = __privateGet(this, _a26) / i, h = __privateGet(this, _r23) / n;
        __privateSet(this, _a26, i), __privateSet(this, _r23, n);
        for (const { line: c, points: u } of __privateGet(this, _s34)) P._rescale(c, a, o, l, h, c), P._rescale(u, a, o, l, h, u);
        r[2] *= l, r[3] *= h;
      }
      return r[0] = t, r[1] = e, {
        root: {
          viewBox: this.viewBox
        },
        path: {
          d: this.toSVGPath(),
          "transform-origin": `${P.svgRound(t)} ${P.svgRound(e)}`
        }
      };
    }
    get defaultSVGProperties() {
      const t = __privateGet(this, _t69);
      return {
        root: {
          viewBox: this.viewBox
        },
        rootClass: {
          draw: true
        },
        path: {
          d: this.toSVGPath(),
          "transform-origin": `${P.svgRound(t[0])} ${P.svgRound(t[1])}`,
          transform: this.rotationTransform || null
        },
        bbox: t
      };
    }
  }
  _t69 = new WeakMap();
  _e49 = new WeakMap();
  _i40 = new WeakMap();
  _s34 = new WeakMap();
  _a26 = new WeakMap();
  _r23 = new WeakMap();
  _n23 = new WeakMap();
  _o18 = new WeakMap();
  _h15 = new WeakMap();
  _Ae_instances = new WeakSet();
  l_fn10 = function(t = __privateGet(this, _h15)) {
    const e = __privateGet(this, _i40) + t / 2 * __privateGet(this, _n23);
    return __privateGet(this, _o18) % 180 === 0 ? [
      e / __privateGet(this, _a26),
      e / __privateGet(this, _r23)
    ] : [
      e / __privateGet(this, _r23),
      e / __privateGet(this, _a26)
    ];
  };
  u_fn10 = function() {
    const [t, e, s, i] = __privateGet(this, _t69), [n, r] = __privateMethod(this, _Ae_instances, l_fn10).call(this, 0);
    return [
      t + n,
      e + r,
      s - 2 * n,
      i - 2 * r
    ];
  };
  d_fn8 = function() {
    const t = __privateSet(this, _t69, new Float32Array([
      1 / 0,
      1 / 0,
      -1 / 0,
      -1 / 0
    ]));
    for (const { line: i } of __privateGet(this, _s34)) {
      if (i.length <= 12) {
        for (let a = 4, o = i.length; a < o; a += 6) T.pointBoundingBox(i[a], i[a + 1], t);
        continue;
      }
      let n = i[4], r = i[5];
      for (let a = 6, o = i.length; a < o; a += 6) {
        const [l, h, c, u, f, g] = i.subarray(a, a + 6);
        T.bezierBoundingBox(n, r, l, h, c, u, f, g, t), n = f, r = g;
      }
    }
    const [e, s] = __privateMethod(this, _Ae_instances, l_fn10).call(this);
    t[0] = ot(t[0] - e, 0, 1), t[1] = ot(t[1] - s, 0, 1), t[2] = ot(t[2] + e, 0, 1), t[3] = ot(t[3] + s, 0, 1), t[2] -= t[0], t[3] -= t[1];
  };
  f_fn7 = function(t) {
    const [e, s] = __privateMethod(this, _Ae_instances, l_fn10).call(this);
    __privateSet(this, _h15, t);
    const [i, n] = __privateMethod(this, _Ae_instances, l_fn10).call(this), [r, a] = [
      i - e,
      n - s
    ], o = __privateGet(this, _t69);
    return o[0] -= r, o[1] -= a, o[2] += 2 * r, o[3] += 2 * a, o;
  };
  class We extends $i {
    constructor(t) {
      super(), this._viewParameters = t, super.updateProperties({
        fill: "none",
        stroke: D._defaultLineColor,
        "stroke-opacity": 1,
        "stroke-width": 1,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-miterlimit": 10
      });
    }
    updateSVGProperty(t, e) {
      t === "stroke-width" && (e ?? (e = this["stroke-width"]), e *= this._viewParameters.realScale), super.updateSVGProperty(t, e);
    }
    clone() {
      const t = new We(this._viewParameters);
      return t.updateAll(this), t;
    }
  }
  const _Ds = class _Ds extends U {
    constructor(t) {
      super({
        ...t,
        name: "inkEditor"
      });
      __privateAdd(this, _Ds_instances);
      this._willKeepAspectRatio = true, this.defaultL10nId = "pdfjs-editor-ink-editor";
    }
    static initialize(t, e) {
      D.initialize(t, e), this._defaultDrawingOptions = new We(e.viewParameters);
    }
    static getDefaultDrawingOptions(t) {
      const e = this._defaultDrawingOptions.clone();
      return e.updateProperties(t), e;
    }
    static get supportMultipleDrawings() {
      return true;
    }
    static get typesMap() {
      return L(this, "typesMap", /* @__PURE__ */ new Map([
        [
          O.INK_THICKNESS,
          "stroke-width"
        ],
        [
          O.INK_COLOR,
          "stroke"
        ],
        [
          O.INK_OPACITY,
          "stroke-opacity"
        ]
      ]));
    }
    static createDrawerInstance(t, e, s, i, n) {
      return new jr(t, e, s, i, n, this._defaultDrawingOptions["stroke-width"]);
    }
    static deserializeDraw(t, e, s, i, n, r) {
      return Ae.deserialize(t, e, s, i, n, r);
    }
    static async deserialize(t, e, s) {
      let i = null;
      if (t instanceof ks) {
        const { data: { inkLists: r, rect: a, rotation: o, id: l, color: h, opacity: c, borderStyle: { rawWidth: u }, popupRef: f, richText: g, contentsObj: p, creationDate: b, modificationDate: m }, parent: { page: { pageNumber: A } } } = t;
        i = t = {
          annotationType: R.INK,
          color: Array.from(h),
          thickness: u,
          opacity: c,
          paths: {
            points: r
          },
          boxes: null,
          pageIndex: A - 1,
          rect: a.slice(0),
          rotation: o,
          annotationElementId: l,
          id: l,
          deleted: false,
          popupRef: f,
          richText: g,
          comment: (p == null ? void 0 : p.str) || null,
          creationDate: b,
          modificationDate: m
        };
      }
      const n = await super.deserialize(t, e, s);
      return n._initialData = i, t.comment && n.setCommentData(t), n;
    }
    get toolbarButtons() {
      return this._colorPicker || (this._colorPicker = new pe(this)), [
        [
          "colorPicker",
          this._colorPicker
        ]
      ];
    }
    get colorType() {
      return O.INK_COLOR;
    }
    get color() {
      return this._drawingOptions.stroke;
    }
    get opacity() {
      return this._drawingOptions["stroke-opacity"];
    }
    onScaleChanging() {
      if (!this.parent) return;
      super.onScaleChanging();
      const { _drawId: t, _drawingOptions: e, parent: s } = this;
      e.updateSVGProperty("stroke-width"), s.drawLayer.updateProperties(t, e.toSVGProperties());
    }
    static onScaleChangingWhenDrawing() {
      const t = this._currentParent;
      t && (super.onScaleChangingWhenDrawing(), this._defaultDrawingOptions.updateSVGProperty("stroke-width"), t.drawLayer.updateProperties(this._currentDrawId, this._defaultDrawingOptions.toSVGProperties()));
    }
    createDrawingOptions({ color: t, thickness: e, opacity: s }) {
      this._drawingOptions = _Ds.getDefaultDrawingOptions({
        stroke: T.makeHexColor(...t),
        "stroke-width": e,
        "stroke-opacity": s
      });
    }
    serialize(t = false) {
      if (this.isEmpty()) return null;
      if (this.deleted) return this.serializeDeleted();
      const { lines: e, points: s } = this.serializeDraw(t), { _drawingOptions: { stroke: i, "stroke-opacity": n, "stroke-width": r } } = this, a = Object.assign(super.serialize(t), {
        color: D._colorManager.convert(i),
        opacity: n,
        thickness: r,
        paths: {
          lines: e,
          points: s
        }
      });
      return this.addComment(a), t ? (a.isCopy = true, a) : this.annotationElementId && !__privateMethod(this, _Ds_instances, t_fn7).call(this, a) ? null : (a.id = this.annotationElementId, a);
    }
    renderAnnotationElement(t) {
      if (this.deleted) return t.hide(), null;
      const { points: e, rect: s } = this.serializeDraw(false);
      return t.updateEdited({
        rect: s,
        thickness: this._drawingOptions["stroke-width"],
        points: e,
        popup: this.comment
      }), null;
    }
  };
  _Ds_instances = new WeakSet();
  t_fn7 = function(t) {
    const { color: e, thickness: s, opacity: i, pageIndex: n } = this._initialData;
    return this.hasEditedComment || this._hasBeenMoved || this._hasBeenResized || t.color.some((r, a) => r !== e[a]) || t.thickness !== s || t.opacity !== i || t.pageIndex !== n;
  };
  __publicField(_Ds, "_type", "ink");
  __publicField(_Ds, "_editorType", R.INK);
  __publicField(_Ds, "_defaultDrawingOptions", null);
  let Ds = _Ds;
  class bs extends Ae {
    toSVGPath() {
      let t = super.toSVGPath();
      return t.endsWith("Z") || (t += "Z"), t;
    }
  }
  const Pe = 8, ne = 3;
  Gt = (_m8 = class {
    static extractContoursFromText(t, { fontFamily: e, fontStyle: s, fontWeight: i }, n, r, a, o) {
      let l = new OffscreenCanvas(1, 1), h = l.getContext("2d", {
        alpha: false
      });
      const c = 200, u = h.font = `${s} ${i} ${c}px ${e}`, { actualBoundingBoxLeft: f, actualBoundingBoxRight: g, actualBoundingBoxAscent: p, actualBoundingBoxDescent: b, fontBoundingBoxAscent: m, fontBoundingBoxDescent: A, width: y } = h.measureText(t), v = 1.5, w = Math.ceil(Math.max(Math.abs(f) + Math.abs(g) || 0, y) * v), S = Math.ceil(Math.max(Math.abs(p) + Math.abs(b) || c, Math.abs(m) + Math.abs(A) || c) * v);
      l = new OffscreenCanvas(w, S), h = l.getContext("2d", {
        alpha: true,
        willReadFrequently: true
      }), h.font = u, h.filter = "grayscale(1)", h.fillStyle = "white", h.fillRect(0, 0, w, S), h.fillStyle = "black", h.fillText(t, w * (v - 1) / 2, S * (3 - v) / 2);
      const E = __privateMethod(this, _Gt_static, u_fn11).call(this, h.getImageData(0, 0, w, S).data), _ = __privateMethod(this, _Gt_static, l_fn11).call(this, E), C = __privateMethod(this, _Gt_static, d_fn9).call(this, _), k = __privateMethod(this, _Gt_static, r_fn5).call(this, E, w, S, C);
      return this.processDrawnLines({
        lines: {
          curves: k,
          width: w,
          height: S
        },
        pageWidth: n,
        pageHeight: r,
        rotation: a,
        innerMargin: o,
        mustSmooth: true,
        areContours: true
      });
    }
    static process(t, e, s, i, n) {
      const [r, a, o] = __privateMethod(this, _Gt_static, f_fn8).call(this, t), [l, h] = __privateMethod(this, _Gt_static, h_fn9).call(this, r, a, o, Math.hypot(a, o) * __privateGet(this, _t70).sigmaSFactor, __privateGet(this, _t70).sigmaR, __privateGet(this, _t70).kernelSize), c = __privateMethod(this, _Gt_static, d_fn9).call(this, h), u = __privateMethod(this, _Gt_static, r_fn5).call(this, l, a, o, c);
      return this.processDrawnLines({
        lines: {
          curves: u,
          width: a,
          height: o
        },
        pageWidth: e,
        pageHeight: s,
        rotation: i,
        innerMargin: n,
        mustSmooth: true,
        areContours: true
      });
    }
    static processDrawnLines({ lines: t, pageWidth: e, pageHeight: s, rotation: i, innerMargin: n, mustSmooth: r, areContours: a }) {
      i % 180 !== 0 && ([e, s] = [
        s,
        e
      ]);
      const { curves: o, width: l, height: h } = t, c = t.thickness ?? 0, u = [], f = Math.min(e / l, s / h), g = f / e, p = f / s, b = [];
      for (const { points: A } of o) {
        const y = r ? __privateMethod(this, _Gt_static, o_fn7).call(this, A) : A;
        if (!y) continue;
        b.push(y);
        const v = y.length, w = new Float32Array(v), S = new Float32Array(3 * (v === 2 ? 2 : v - 2));
        if (u.push({
          line: S,
          points: w
        }), v === 2) {
          w[0] = y[0] * g, w[1] = y[1] * p, S.set([
            NaN,
            NaN,
            NaN,
            NaN,
            w[0],
            w[1]
          ], 0);
          continue;
        }
        let [E, _, C, k] = y;
        E *= g, _ *= p, C *= g, k *= p, w.set([
          E,
          _,
          C,
          k
        ], 0), S.set([
          NaN,
          NaN,
          NaN,
          NaN,
          E,
          _
        ], 0);
        for (let x = 4; x < v; x += 2) {
          const j = w[x] = y[x] * g, V = w[x + 1] = y[x + 1] * p;
          S.set(P.createBezierPoints(E, _, C, k, j, V), (x - 2) * 3), [E, _, C, k] = [
            C,
            k,
            j,
            V
          ];
        }
      }
      if (u.length === 0) return null;
      const m = a ? new bs() : new Ae();
      return m.build(u, e, s, 1, i, a ? 0 : c, n), {
        outline: m,
        newCurves: b,
        areContours: a,
        thickness: c,
        width: l,
        height: h
      };
    }
    static async compressSignature({ outlines: t, areContours: e, thickness: s, width: i, height: n }) {
      let r = 1 / 0, a = -1 / 0, o = 0;
      for (const y of t) {
        o += y.length;
        for (let v = 2, w = y.length; v < w; v++) {
          const S = y[v] - y[v - 2];
          r = Math.min(r, S), a = Math.max(a, S);
        }
      }
      let l;
      r >= -128 && a <= 127 ? l = Int8Array : r >= -32768 && a <= 32767 ? l = Int16Array : l = Int32Array;
      const h = t.length, c = Pe + ne * h, u = new Uint32Array(c);
      let f = 0;
      u[f++] = c * Uint32Array.BYTES_PER_ELEMENT + (o - 2 * h) * l.BYTES_PER_ELEMENT, u[f++] = 0, u[f++] = i, u[f++] = n, u[f++] = e ? 0 : 1, u[f++] = Math.max(0, Math.floor(s ?? 0)), u[f++] = h, u[f++] = l.BYTES_PER_ELEMENT;
      for (const y of t) u[f++] = y.length - 2, u[f++] = y[0], u[f++] = y[1];
      const g = new CompressionStream("deflate-raw"), p = g.writable.getWriter();
      await p.ready, p.write(u);
      const b = l.prototype.constructor;
      for (const y of t) {
        const v = new b(y.length - 2);
        for (let w = 2, S = y.length; w < S; w++) v[w - 2] = y[w] - y[w - 2];
        p.write(v);
      }
      p.close();
      const m = await new Response(g.readable).arrayBuffer();
      return new Uint8Array(m).toBase64();
    }
    static async decompressSignature(t) {
      try {
        const e = Uint8Array.fromBase64(t), { readable: s, writable: i } = new DecompressionStream("deflate-raw"), n = i.getWriter();
        await n.ready, n.write(e).then(async () => {
          await n.ready, await n.close();
        }).catch(() => {
        });
        let r = null, a = 0;
        for await (const y of s) r || (r = new Uint8Array(new Uint32Array(y.buffer, 0, 4)[0])), r.set(y, a), a += y.length;
        const o = new Uint32Array(r.buffer, 0, r.length >> 2), l = o[1];
        if (l !== 0) throw new Error(`Invalid version: ${l}`);
        const h = o[2], c = o[3], u = o[4] === 0, f = o[5], g = o[6], p = o[7], b = [], m = (Pe + ne * g) * Uint32Array.BYTES_PER_ELEMENT;
        let A;
        switch (p) {
          case Int8Array.BYTES_PER_ELEMENT:
            A = new Int8Array(r.buffer, m);
            break;
          case Int16Array.BYTES_PER_ELEMENT:
            A = new Int16Array(r.buffer, m);
            break;
          case Int32Array.BYTES_PER_ELEMENT:
            A = new Int32Array(r.buffer, m);
            break;
        }
        a = 0;
        for (let y = 0; y < g; y++) {
          const v = o[ne * y + Pe], w = new Float32Array(v + 2);
          b.push(w);
          for (let S = 0; S < ne - 1; S++) w[S] = o[ne * y + Pe + S + 1];
          for (let S = 0; S < v; S++) w[S + 2] = w[S] + A[a++];
        }
        return {
          areContours: u,
          thickness: f,
          outlines: b,
          width: h,
          height: c
        };
      } catch (e) {
        return F(`decompressSignature: ${e}`), null;
      }
    }
  }, _t70 = new WeakMap(), _Gt_static = new WeakSet(), e_fn10 = function(t, e, s, i) {
    return s -= t, i -= e, s === 0 ? i > 0 ? 0 : 4 : s === 1 ? i + 6 : 2 - i;
  }, _i41 = new WeakMap(), s_fn9 = function(t, e, s, i, n, r, a) {
    const o = __privateMethod(this, _Gt_static, e_fn10).call(this, s, i, n, r);
    for (let l = 0; l < 8; l++) {
      const h = (-l + o - a + 16) % 8, c = __privateGet(this, _i41)[2 * h], u = __privateGet(this, _i41)[2 * h + 1];
      if (t[(s + c) * e + (i + u)] !== 0) return h;
    }
    return -1;
  }, a_fn7 = function(t, e, s, i, n, r, a) {
    const o = __privateMethod(this, _Gt_static, e_fn10).call(this, s, i, n, r);
    for (let l = 0; l < 8; l++) {
      const h = (l + o + a + 16) % 8, c = __privateGet(this, _i41)[2 * h], u = __privateGet(this, _i41)[2 * h + 1];
      if (t[(s + c) * e + (i + u)] !== 0) return h;
    }
    return -1;
  }, r_fn5 = function(t, e, s, i) {
    const n = t.length, r = new Int32Array(n);
    for (let h = 0; h < n; h++) r[h] = t[h] <= i ? 1 : 0;
    for (let h = 1; h < s - 1; h++) r[h * e] = r[h * e + e - 1] = 0;
    for (let h = 0; h < e; h++) r[h] = r[e * s - 1 - h] = 0;
    let a = 1, o;
    const l = [];
    for (let h = 1; h < s - 1; h++) {
      o = 1;
      for (let c = 1; c < e - 1; c++) {
        const u = h * e + c, f = r[u];
        if (f === 0) continue;
        let g = h, p = c;
        if (f === 1 && r[u - 1] === 0) a += 1, p -= 1;
        else if (f >= 1 && r[u + 1] === 0) a += 1, p += 1, f > 1 && (o = f);
        else {
          f !== 1 && (o = Math.abs(f));
          continue;
        }
        const b = [
          c,
          h
        ], m = p === c + 1, A = {
          isHole: m,
          points: b,
          id: a,
          parent: 0
        };
        l.push(A);
        let y;
        for (const x of l) if (x.id === o) {
          y = x;
          break;
        }
        y ? y.isHole ? A.parent = m ? y.parent : o : A.parent = m ? o : y.parent : A.parent = m ? o : 0;
        const v = __privateMethod(this, _Gt_static, s_fn9).call(this, r, e, h, c, g, p, 0);
        if (v === -1) {
          r[u] = -a, r[u] !== 1 && (o = Math.abs(r[u]));
          continue;
        }
        let w = __privateGet(this, _i41)[2 * v], S = __privateGet(this, _i41)[2 * v + 1];
        const E = h + w, _ = c + S;
        g = E, p = _;
        let C = h, k = c;
        for (; ; ) {
          const x = __privateMethod(this, _Gt_static, a_fn7).call(this, r, e, C, k, g, p, 1);
          w = __privateGet(this, _i41)[2 * x], S = __privateGet(this, _i41)[2 * x + 1];
          const j = C + w, V = k + S;
          b.push(V, j);
          const N = C * e + k;
          if (r[N + 1] === 0 ? r[N] = -a : r[N] === 1 && (r[N] = a), j === h && V === c && C === E && k === _) {
            r[u] !== 1 && (o = Math.abs(r[u]));
            break;
          } else g = C, p = k, C = j, k = V;
        }
      }
    }
    return l;
  }, n_fn4 = function(t, e, s, i) {
    if (s - e <= 4) {
      for (let E = e; E < s - 2; E += 2) i.push(t[E], t[E + 1]);
      return;
    }
    const n = t[e], r = t[e + 1], a = t[s - 4] - n, o = t[s - 3] - r, l = Math.hypot(a, o), h = a / l, c = o / l, u = h * r - c * n, f = o / a, g = 1 / l, p = Math.atan(f), b = Math.cos(p), m = Math.sin(p), A = g * (Math.abs(b) + Math.abs(m)), y = g * (1 - A + A ** 2), v = Math.max(Math.atan(Math.abs(m + b) * y), Math.atan(Math.abs(m - b) * y));
    let w = 0, S = e;
    for (let E = e + 2; E < s - 2; E += 2) {
      const _ = Math.abs(u - h * t[E + 1] + c * t[E]);
      _ > w && (S = E, w = _);
    }
    w > (l * v) ** 2 ? (__privateMethod(this, _Gt_static, n_fn4).call(this, t, e, S + 2, i), __privateMethod(this, _Gt_static, n_fn4).call(this, t, S, s, i)) : i.push(n, r);
  }, o_fn7 = function(t) {
    const e = [], s = t.length;
    return __privateMethod(this, _Gt_static, n_fn4).call(this, t, 0, s, e), e.push(t[s - 2], t[s - 1]), e.length <= 4 ? null : e;
  }, h_fn9 = function(t, e, s, i, n, r) {
    const a = new Float32Array(r ** 2), o = -2 * i ** 2, l = r >> 1;
    for (let p = 0; p < r; p++) {
      const b = (p - l) ** 2;
      for (let m = 0; m < r; m++) a[p * r + m] = Math.exp((b + (m - l) ** 2) / o);
    }
    const h = new Float32Array(256), c = -2 * n ** 2;
    for (let p = 0; p < 256; p++) h[p] = Math.exp(p ** 2 / c);
    const u = t.length, f = new Uint8Array(u), g = new Uint32Array(256);
    for (let p = 0; p < s; p++) for (let b = 0; b < e; b++) {
      const m = p * e + b, A = t[m];
      let y = 0, v = 0;
      for (let S = 0; S < r; S++) {
        const E = p + S - l;
        if (!(E < 0 || E >= s)) for (let _ = 0; _ < r; _++) {
          const C = b + _ - l;
          if (C < 0 || C >= e) continue;
          const k = t[E * e + C], x = a[S * r + _] * h[Math.abs(k - A)];
          y += k * x, v += x;
        }
      }
      const w = f[m] = Math.round(y / v);
      g[w]++;
    }
    return [
      f,
      g
    ];
  }, l_fn11 = function(t) {
    const e = new Uint32Array(256);
    for (const s of t) e[s]++;
    return e;
  }, u_fn11 = function(t) {
    const e = t.length, s = new Uint8ClampedArray(e >> 2);
    let i = -1 / 0, n = 1 / 0;
    for (let a = 0, o = s.length; a < o; a++) {
      const l = s[a] = t[a << 2];
      i = Math.max(i, l), n = Math.min(n, l);
    }
    const r = 255 / (i - n);
    for (let a = 0, o = s.length; a < o; a++) s[a] = (s[a] - n) * r;
    return s;
  }, d_fn9 = function(t) {
    let e, s = -1 / 0, i = -1 / 0;
    const n = t.findIndex((o) => o !== 0);
    let r = n, a = n;
    for (e = n; e < 256; e++) {
      const o = t[e];
      o > s && (e - r > i && (i = e - r, a = e - 1), s = o, r = e);
    }
    for (e = a - 1; e >= 0 && !(t[e] > t[e + 1]); e--) ;
    return e;
  }, f_fn8 = function(t) {
    const e = t, { width: s, height: i } = t, { maxDim: n } = __privateGet(this, _t70);
    let r = s, a = i;
    if (s > n || i > n) {
      let u = s, f = i, g = Math.log2(Math.max(s, i) / n);
      const p = Math.floor(g);
      g = g === p ? p - 1 : p;
      for (let m = 0; m < g; m++) {
        r = Math.ceil(u / 2), a = Math.ceil(f / 2);
        const A = new OffscreenCanvas(r, a);
        A.getContext("2d").drawImage(t, 0, 0, u, f, 0, 0, r, a), u = r, f = a, t !== e && t.close(), t = A.transferToImageBitmap();
      }
      const b = Math.min(n / r, n / a);
      r = Math.round(r * b), a = Math.round(a * b);
    }
    const l = new OffscreenCanvas(r, a).getContext("2d", {
      willReadFrequently: true
    });
    l.fillStyle = "white", l.fillRect(0, 0, r, a), l.filter = "grayscale(1)", l.drawImage(t, 0, 0, t.width, t.height, 0, 0, r, a);
    const h = l.getImageData(0, 0, r, a).data;
    return [
      __privateMethod(this, _Gt_static, u_fn11).call(this, h),
      r,
      a
    ];
  }, __privateAdd(_m8, _Gt_static), __privateAdd(_m8, _t70, {
    maxDim: 512,
    sigmaSFactor: 0.02,
    sigmaR: 25,
    kernelSize: 16
  }), __privateAdd(_m8, _i41, new Int32Array([
    0,
    1,
    -1,
    1,
    -1,
    0,
    -1,
    -1,
    0,
    -1,
    1,
    -1,
    1,
    0,
    1,
    1
  ])), _m8);
  class Is extends $i {
    constructor() {
      super(), super.updateProperties({
        fill: D._defaultLineColor,
        "stroke-width": 0
      });
    }
    clone() {
      const t = new Is();
      return t.updateAll(this), t;
    }
  }
  class Ls extends We {
    constructor(t) {
      super(t), super.updateProperties({
        stroke: D._defaultLineColor,
        "stroke-width": 1
      });
    }
    clone() {
      const t = new Ls(this._viewParameters);
      return t.updateAll(this), t;
    }
  }
  const _Tt = class _Tt extends U {
    constructor(t) {
      super({
        ...t,
        mustBeCommitted: true,
        name: "signatureEditor"
      });
      __privateAdd(this, _t71, false);
      __privateAdd(this, _e50, null);
      __privateAdd(this, _i42, null);
      __privateAdd(this, _s35, null);
      this._willKeepAspectRatio = true, __privateSet(this, _i42, t.signatureData || null), __privateSet(this, _e50, null), this.defaultL10nId = "pdfjs-editor-signature-editor1";
    }
    static initialize(t, e) {
      D.initialize(t, e), this._defaultDrawingOptions = new Is(), this._defaultDrawnSignatureOptions = new Ls(e.viewParameters);
    }
    static getDefaultDrawingOptions(t) {
      const e = this._defaultDrawingOptions.clone();
      return e.updateProperties(t), e;
    }
    static get supportMultipleDrawings() {
      return false;
    }
    static get typesMap() {
      return L(this, "typesMap", /* @__PURE__ */ new Map());
    }
    static get isDrawer() {
      return false;
    }
    get telemetryFinalData() {
      return {
        type: "signature",
        hasDescription: !!__privateGet(this, _e50)
      };
    }
    static computeTelemetryFinalData(t) {
      const e = t.get("hasDescription");
      return {
        hasAltText: e.get(true) ?? 0,
        hasNoAltText: e.get(false) ?? 0
      };
    }
    get isResizable() {
      return true;
    }
    onScaleChanging() {
      this._drawId !== null && super.onScaleChanging();
    }
    render() {
      if (this.div) return this.div;
      let t, e;
      const { _isCopy: s } = this;
      if (s && (this._isCopy = false, t = this.x, e = this.y), super.render(), this._drawId === null) if (__privateGet(this, _i42)) {
        const { lines: i, mustSmooth: n, areContours: r, description: a, uuid: o, heightInPage: l } = __privateGet(this, _i42), { rawDims: { pageWidth: h, pageHeight: c }, rotation: u } = this.parent.viewport, f = Gt.processDrawnLines({
          lines: i,
          pageWidth: h,
          pageHeight: c,
          rotation: u,
          innerMargin: _Tt._INNER_MARGIN,
          mustSmooth: n,
          areContours: r
        });
        this.addSignature(f, l, a, o);
      } else this.div.setAttribute("data-l10n-args", JSON.stringify({
        description: ""
      })), this.div.hidden = true, this._uiManager.getSignature(this);
      else this.div.setAttribute("data-l10n-args", JSON.stringify({
        description: __privateGet(this, _e50) || ""
      }));
      return s && (this._isCopy = true, this._moveAfterPaste(t, e)), this.div;
    }
    setUuid(t) {
      __privateSet(this, _s35, t), this.addEditToolbar();
    }
    getUuid() {
      return __privateGet(this, _s35);
    }
    get description() {
      return __privateGet(this, _e50);
    }
    set description(t) {
      __privateSet(this, _e50, t), this.div && (this.div.setAttribute("data-l10n-args", JSON.stringify({
        description: t
      })), super.addEditToolbar().then((e) => {
        e == null ? void 0 : e.updateEditSignatureButton(t);
      }));
    }
    getSignaturePreview() {
      const { newCurves: t, areContours: e, thickness: s, width: i, height: n } = __privateGet(this, _i42), r = Math.max(i, n), a = Gt.processDrawnLines({
        lines: {
          curves: t.map((o) => ({
            points: o
          })),
          thickness: s,
          width: i,
          height: n
        },
        pageWidth: r,
        pageHeight: r,
        rotation: 0,
        innerMargin: 0,
        mustSmooth: false,
        areContours: e
      });
      return {
        areContours: e,
        outline: a.outline
      };
    }
    get toolbarButtons() {
      return this._uiManager.signatureManager ? [
        [
          "editSignature",
          this._uiManager.signatureManager
        ]
      ] : super.toolbarButtons;
    }
    addSignature(t, e, s, i) {
      const { x: n, y: r } = this, { outline: a } = __privateSet(this, _i42, t);
      __privateSet(this, _t71, a instanceof bs), this.description = s;
      let o;
      __privateGet(this, _t71) ? o = _Tt.getDefaultDrawingOptions() : (o = _Tt._defaultDrawnSignatureOptions.clone(), o.updateProperties({
        "stroke-width": a.thickness
      })), this._addOutlines({
        drawOutlines: a,
        drawingOptions: o
      });
      const [, l] = this.pageDimensions;
      let h = e / l;
      h = h >= 1 ? 0.5 : h, this.width *= h / this.height, this.width >= 1 && (h *= 0.9 / this.width, this.width = 0.9), this.height = h, this.setDims(), this.x = n, this.y = r, this.center(), this._onResized(), this.onScaleChanging(), this.rotate(), this._uiManager.addToAnnotationStorage(this), this.setUuid(i), this._reportTelemetry({
        action: "pdfjs.signature.inserted",
        data: {
          hasBeenSaved: !!i,
          hasDescription: !!s
        }
      }), this.div.hidden = false;
    }
    getFromImage(t) {
      const { rawDims: { pageWidth: e, pageHeight: s }, rotation: i } = this.parent.viewport;
      return Gt.process(t, e, s, i, _Tt._INNER_MARGIN);
    }
    getFromText(t, e) {
      const { rawDims: { pageWidth: s, pageHeight: i }, rotation: n } = this.parent.viewport;
      return Gt.extractContoursFromText(t, e, s, i, n, _Tt._INNER_MARGIN);
    }
    getDrawnSignature(t) {
      const { rawDims: { pageWidth: e, pageHeight: s }, rotation: i } = this.parent.viewport;
      return Gt.processDrawnLines({
        lines: t,
        pageWidth: e,
        pageHeight: s,
        rotation: i,
        innerMargin: _Tt._INNER_MARGIN,
        mustSmooth: false,
        areContours: false
      });
    }
    createDrawingOptions({ areContours: t, thickness: e }) {
      t ? this._drawingOptions = _Tt.getDefaultDrawingOptions() : (this._drawingOptions = _Tt._defaultDrawnSignatureOptions.clone(), this._drawingOptions.updateProperties({
        "stroke-width": e
      }));
    }
    serialize(t = false) {
      if (this.isEmpty()) return null;
      const { lines: e, points: s } = this.serializeDraw(t), { _drawingOptions: { "stroke-width": i } } = this, n = Object.assign(super.serialize(t), {
        isSignature: true,
        areContours: __privateGet(this, _t71),
        color: [
          0,
          0,
          0
        ],
        thickness: __privateGet(this, _t71) ? 0 : i
      });
      return this.addComment(n), t ? (n.paths = {
        lines: e,
        points: s
      }, n.uuid = __privateGet(this, _s35), n.isCopy = true) : n.lines = e, __privateGet(this, _e50) && (n.accessibilityData = {
        type: "Figure",
        alt: __privateGet(this, _e50)
      }), n;
    }
    static deserializeDraw(t, e, s, i, n, r) {
      return r.areContours ? bs.deserialize(t, e, s, i, n, r) : Ae.deserialize(t, e, s, i, n, r);
    }
    static async deserialize(t, e, s) {
      var _a29;
      const i = await super.deserialize(t, e, s);
      return __privateSet(i, _t71, t.areContours), i.description = ((_a29 = t.accessibilityData) == null ? void 0 : _a29.alt) || "", __privateSet(i, _s35, t.uuid), i;
    }
  };
  _t71 = new WeakMap();
  _e50 = new WeakMap();
  _i42 = new WeakMap();
  _s35 = new WeakMap();
  __publicField(_Tt, "_type", "signature");
  __publicField(_Tt, "_editorType", R.SIGNATURE);
  __publicField(_Tt, "_defaultDrawingOptions", null);
  let Tt = _Tt;
  class zr extends D {
    constructor(t) {
      super({
        ...t,
        name: "stampEditor"
      });
      __privateAdd(this, _zr_instances);
      __privateAdd(this, _t72, null);
      __privateAdd(this, _e51, null);
      __privateAdd(this, _i43, null);
      __privateAdd(this, _s36, null);
      __privateAdd(this, _a27, null);
      __privateAdd(this, _r24, "");
      __privateAdd(this, _n24, null);
      __privateAdd(this, _o19, false);
      __privateAdd(this, _h16, null);
      __privateAdd(this, _l14, false);
      __privateAdd(this, _u12, false);
      __privateSet(this, _s36, t.bitmapUrl), __privateSet(this, _a27, t.bitmapFile), this.defaultL10nId = "pdfjs-editor-stamp-editor";
    }
    static initialize(t, e) {
      D.initialize(t, e);
    }
    static isHandlingMimeForPasting(t) {
      return hs.includes(t);
    }
    static paste(t, e) {
      e.pasteEditor({
        mode: R.STAMP
      }, {
        bitmapFile: t.getAsFile()
      });
    }
    altTextFinish() {
      this._uiManager.useNewAltTextFlow && (this.div.hidden = false), super.altTextFinish();
    }
    get telemetryFinalData() {
      var _a29;
      return {
        type: "stamp",
        hasAltText: !!((_a29 = this.altTextData) == null ? void 0 : _a29.altText)
      };
    }
    static computeTelemetryFinalData(t) {
      const e = t.get("hasAltText");
      return {
        hasAltText: e.get(true) ?? 0,
        hasNoAltText: e.get(false) ?? 0
      };
    }
    async mlGuessAltText(t = null, e = true) {
      if (this.hasAltTextData()) return null;
      const { mlManager: s } = this._uiManager;
      if (!s) throw new Error("No ML.");
      if (!await s.isEnabledFor("altText")) throw new Error("ML isn't enabled for alt text.");
      const { data: i, width: n, height: r } = t || this.copyCanvas(null, null, true).imageData, a = await s.guess({
        name: "altText",
        request: {
          data: i,
          width: n,
          height: r,
          channels: i.length / (n * r)
        }
      });
      if (!a) throw new Error("No response from the AI service.");
      if (a.error) throw new Error("Error from the AI service.");
      if (a.cancel) return null;
      if (!a.output) throw new Error("No valid response from the AI service.");
      const o = a.output;
      return await this.setGuessedAltText(o), e && !this.hasAltTextData() && (this.altTextData = {
        alt: o,
        decorative: false
      }), o;
    }
    remove() {
      var _a29;
      __privateGet(this, _e51) && (__privateSet(this, _t72, null), this._uiManager.imageManager.deleteId(__privateGet(this, _e51)), (_a29 = __privateGet(this, _n24)) == null ? void 0 : _a29.remove(), __privateSet(this, _n24, null), __privateGet(this, _h16) && (clearTimeout(__privateGet(this, _h16)), __privateSet(this, _h16, null))), super.remove();
    }
    rebuild() {
      if (!this.parent) {
        __privateGet(this, _e51) && __privateMethod(this, _zr_instances, m_fn4).call(this);
        return;
      }
      super.rebuild(), this.div !== null && (__privateGet(this, _e51) && __privateGet(this, _n24) === null && __privateMethod(this, _zr_instances, m_fn4).call(this), this.isAttachedToDOM || this.parent.add(this));
    }
    onceAdded(t) {
      this._isDraggable = true, t && this.div.focus();
    }
    isEmpty() {
      return !(__privateGet(this, _i43) || __privateGet(this, _t72) || __privateGet(this, _s36) || __privateGet(this, _a27) || __privateGet(this, _e51) || __privateGet(this, _o19));
    }
    get toolbarButtons() {
      return [
        [
          "altText",
          this.createAltText()
        ]
      ];
    }
    get isResizable() {
      return true;
    }
    render() {
      if (this.div) return this.div;
      let t, e;
      return this._isCopy && (t = this.x, e = this.y), super.render(), this.div.hidden = true, this.createAltText(), __privateGet(this, _o19) || (__privateGet(this, _t72) ? __privateMethod(this, _zr_instances, g_fn5).call(this) : __privateMethod(this, _zr_instances, m_fn4).call(this)), this._isCopy && this._moveAfterPaste(t, e), this._uiManager.addShouldRescale(this), this.div;
    }
    setCanvas(t, e) {
      const { id: s, bitmap: i } = this._uiManager.imageManager.getFromCanvas(t, e);
      e.remove(), s && this._uiManager.imageManager.isValidId(s) && (__privateSet(this, _e51, s), i && __privateSet(this, _t72, i), __privateSet(this, _o19, false), __privateMethod(this, _zr_instances, g_fn5).call(this));
    }
    _onResized() {
      this.onScaleChanging();
    }
    onScaleChanging() {
      if (!this.parent) return;
      __privateGet(this, _h16) !== null && clearTimeout(__privateGet(this, _h16));
      const t = 200;
      __privateSet(this, _h16, setTimeout(() => {
        __privateSet(this, _h16, null), __privateMethod(this, _zr_instances, p_fn3).call(this);
      }, t));
    }
    copyCanvas(t, e, s = false) {
      t || (t = 224);
      const { width: i, height: n } = __privateGet(this, _t72), r = new Pt();
      let a = __privateGet(this, _t72), o = i, l = n, h = null;
      if (e) {
        if (i > e || n > e) {
          const S = Math.min(e / i, e / n);
          o = Math.floor(i * S), l = Math.floor(n * S);
        }
        h = document.createElement("canvas");
        const u = h.width = Math.ceil(o * r.sx), f = h.height = Math.ceil(l * r.sy);
        __privateGet(this, _l14) || (a = __privateMethod(this, _zr_instances, c_fn3).call(this, u, f));
        const g = h.getContext("2d");
        g.filter = this._uiManager.hcmFilter;
        let p = "white", b = "#cfcfd8";
        this._uiManager.hcmFilter !== "none" ? b = "black" : hn.isDarkMode && (p = "#8f8f9d", b = "#42414d");
        const m = 15, A = m * r.sx, y = m * r.sy, v = new OffscreenCanvas(A * 2, y * 2), w = v.getContext("2d");
        w.fillStyle = p, w.fillRect(0, 0, A * 2, y * 2), w.fillStyle = b, w.fillRect(0, 0, A, y), w.fillRect(A, y, A, y), g.fillStyle = g.createPattern(v, "repeat"), g.fillRect(0, 0, u, f), g.drawImage(a, 0, 0, a.width, a.height, 0, 0, u, f);
      }
      let c = null;
      if (s) {
        let u, f;
        if (r.symmetric && a.width < t && a.height < t) u = a.width, f = a.height;
        else if (a = __privateGet(this, _t72), i > t || n > t) {
          const b = Math.min(t / i, t / n);
          u = Math.floor(i * b), f = Math.floor(n * b), __privateGet(this, _l14) || (a = __privateMethod(this, _zr_instances, c_fn3).call(this, u, f));
        }
        const p = new OffscreenCanvas(u, f).getContext("2d", {
          willReadFrequently: true
        });
        p.drawImage(a, 0, 0, a.width, a.height, 0, 0, u, f), c = {
          width: u,
          height: f,
          data: p.getImageData(0, 0, u, f).data
        };
      }
      return {
        canvas: h,
        width: o,
        height: l,
        imageData: c
      };
    }
    static async deserialize(t, e, s) {
      var _a29;
      let i = null, n = false;
      if (t instanceof Ui) {
        const { data: { rect: p, rotation: b, id: m, structParent: A, popupRef: y, richText: v, contentsObj: w, creationDate: S, modificationDate: E }, container: _, parent: { page: { pageNumber: C } }, canvas: k } = t;
        let x, j;
        k ? (delete t.canvas, { id: x, bitmap: j } = s.imageManager.getFromCanvas(_.id, k), k.remove()) : (n = true, t._hasNoCanvas = true);
        const V = ((_a29 = await e._structTree.getAriaAttributes(`${Vt}${m}`)) == null ? void 0 : _a29.get("aria-label")) || "";
        i = t = {
          annotationType: R.STAMP,
          bitmapId: x,
          bitmap: j,
          pageIndex: C - 1,
          rect: p.slice(0),
          rotation: b,
          annotationElementId: m,
          id: m,
          deleted: false,
          accessibilityData: {
            decorative: false,
            altText: V
          },
          isSvg: false,
          structParent: A,
          popupRef: y,
          richText: v,
          comment: (w == null ? void 0 : w.str) || null,
          creationDate: S,
          modificationDate: E
        };
      }
      const r = await super.deserialize(t, e, s), { rect: a, bitmap: o, bitmapUrl: l, bitmapId: h, isSvg: c, accessibilityData: u } = t;
      n ? (s.addMissingCanvas(t.id, r), __privateSet(r, _o19, true)) : h && s.imageManager.isValidId(h) ? (__privateSet(r, _e51, h), o && __privateSet(r, _t72, o)) : __privateSet(r, _s36, l), __privateSet(r, _l14, c);
      const [f, g] = r.pageDimensions;
      return r.width = (a[2] - a[0]) / f, r.height = (a[3] - a[1]) / g, u && (r.altTextData = u), r._initialData = i, t.comment && r.setCommentData(t), __privateSet(r, _u12, !!i), r;
    }
    serialize(t = false, e = null) {
      if (this.isEmpty()) return null;
      if (this.deleted) return this.serializeDeleted();
      const s = Object.assign(super.serialize(t), {
        bitmapId: __privateGet(this, _e51),
        isSvg: __privateGet(this, _l14)
      });
      if (this.addComment(s), t) return s.bitmapUrl = __privateMethod(this, _zr_instances, b_fn4).call(this, true), s.accessibilityData = this.serializeAltText(true), s.isCopy = true, s;
      const { decorative: i, altText: n } = this.serializeAltText(false);
      if (!i && n && (s.accessibilityData = {
        type: "Figure",
        alt: n
      }), this.annotationElementId) {
        const a = __privateMethod(this, _zr_instances, A_fn4).call(this, s);
        return a.isSame ? null : (a.isSameAltText ? delete s.accessibilityData : s.accessibilityData.structParent = this._initialData.structParent ?? -1, s.id = this.annotationElementId, delete s.bitmapId, s);
      }
      if (e === null) return s;
      e.stamps || (e.stamps = /* @__PURE__ */ new Map());
      const r = __privateGet(this, _l14) ? (s.rect[2] - s.rect[0]) * (s.rect[3] - s.rect[1]) : null;
      if (!e.stamps.has(__privateGet(this, _e51))) e.stamps.set(__privateGet(this, _e51), {
        area: r,
        serialized: s
      }), s.bitmap = __privateMethod(this, _zr_instances, b_fn4).call(this, false);
      else if (__privateGet(this, _l14)) {
        const a = e.stamps.get(__privateGet(this, _e51));
        r > a.area && (a.area = r, a.serialized.bitmap.close(), a.serialized.bitmap = __privateMethod(this, _zr_instances, b_fn4).call(this, false));
      }
      return s;
    }
    renderAnnotationElement(t) {
      return this.deleted ? (t.hide(), null) : (t.updateEdited({
        rect: this.getPDFRect(),
        popup: this.comment
      }), null);
    }
  }
  _t72 = new WeakMap();
  _e51 = new WeakMap();
  _i43 = new WeakMap();
  _s36 = new WeakMap();
  _a27 = new WeakMap();
  _r24 = new WeakMap();
  _n24 = new WeakMap();
  _o19 = new WeakMap();
  _h16 = new WeakMap();
  _l14 = new WeakMap();
  _u12 = new WeakMap();
  _zr_instances = new WeakSet();
  d_fn10 = function(t, e = false) {
    if (!t) {
      this.remove();
      return;
    }
    __privateSet(this, _t72, t.bitmap), e || (__privateSet(this, _e51, t.id), __privateSet(this, _l14, t.isSvg)), t.file && __privateSet(this, _r24, t.file.name), __privateMethod(this, _zr_instances, g_fn5).call(this);
  };
  f_fn9 = function() {
    if (__privateSet(this, _i43, null), this._uiManager.enableWaiting(false), !!__privateGet(this, _n24)) {
      if (this._uiManager.useNewAltTextWhenAddingImage && this._uiManager.useNewAltTextFlow && __privateGet(this, _t72)) {
        this.addEditToolbar().then(() => {
          this._editToolbar.hide(), this._uiManager.editAltText(this, true);
        });
        return;
      }
      if (!this._uiManager.useNewAltTextWhenAddingImage && this._uiManager.useNewAltTextFlow && __privateGet(this, _t72)) {
        this._reportTelemetry({
          action: "pdfjs.image.image_added",
          data: {
            alt_text_modal: false,
            alt_text_type: "empty"
          }
        });
        try {
          this.mlGuessAltText();
        } catch {
        }
      }
      this.div.focus();
    }
  };
  m_fn4 = function() {
    if (__privateGet(this, _e51)) {
      this._uiManager.enableWaiting(true), this._uiManager.imageManager.getFromId(__privateGet(this, _e51)).then((s) => __privateMethod(this, _zr_instances, d_fn10).call(this, s, true)).finally(() => __privateMethod(this, _zr_instances, f_fn9).call(this));
      return;
    }
    if (__privateGet(this, _s36)) {
      const s = __privateGet(this, _s36);
      __privateSet(this, _s36, null), this._uiManager.enableWaiting(true), __privateSet(this, _i43, this._uiManager.imageManager.getFromUrl(s).then((i) => __privateMethod(this, _zr_instances, d_fn10).call(this, i)).finally(() => __privateMethod(this, _zr_instances, f_fn9).call(this)));
      return;
    }
    if (__privateGet(this, _a27)) {
      const s = __privateGet(this, _a27);
      __privateSet(this, _a27, null), this._uiManager.enableWaiting(true), __privateSet(this, _i43, this._uiManager.imageManager.getFromFile(s).then((i) => __privateMethod(this, _zr_instances, d_fn10).call(this, i)).finally(() => __privateMethod(this, _zr_instances, f_fn9).call(this)));
      return;
    }
    const t = document.createElement("input");
    t.type = "file", t.accept = hs.join(",");
    const e = this._uiManager._signal;
    __privateSet(this, _i43, new Promise((s) => {
      t.addEventListener("change", async () => {
        if (!t.files || t.files.length === 0) this.remove();
        else {
          this._uiManager.enableWaiting(true);
          const i = await this._uiManager.imageManager.getFromFile(t.files[0]);
          this._reportTelemetry({
            action: "pdfjs.image.image_selected",
            data: {
              alt_text_modal: this._uiManager.useNewAltTextFlow
            }
          }), __privateMethod(this, _zr_instances, d_fn10).call(this, i);
        }
        s();
      }, {
        signal: e
      }), t.addEventListener("cancel", () => {
        this.remove(), s();
      }, {
        signal: e
      });
    }).finally(() => __privateMethod(this, _zr_instances, f_fn9).call(this))), t.click();
  };
  g_fn5 = function() {
    var _a29;
    const { div: t } = this;
    let { width: e, height: s } = __privateGet(this, _t72);
    const [i, n] = this.pageDimensions, r = 0.75;
    if (this.width) e = this.width * i, s = this.height * n;
    else if (e > r * i || s > r * n) {
      const o = Math.min(r * i / e, r * n / s);
      e *= o, s *= o;
    }
    this._uiManager.enableWaiting(false);
    const a = __privateSet(this, _n24, document.createElement("canvas"));
    a.setAttribute("role", "img"), this.addContainer(a), this.width = e / i, this.height = s / n, this.setDims(), ((_a29 = this._initialOptions) == null ? void 0 : _a29.isCentered) ? this.center() : this.fixAndSetPosition(), this._initialOptions = null, (!this._uiManager.useNewAltTextWhenAddingImage || !this._uiManager.useNewAltTextFlow || this.annotationElementId) && (t.hidden = false), __privateMethod(this, _zr_instances, p_fn3).call(this), __privateGet(this, _u12) || (this.parent.addUndoableEditor(this), __privateSet(this, _u12, true)), this._reportTelemetry({
      action: "inserted_image"
    }), __privateGet(this, _r24) && this.div.setAttribute("aria-description", __privateGet(this, _r24)), this.annotationElementId || this._uiManager.a11yAlert("pdfjs-editor-stamp-added-alert");
  };
  c_fn3 = function(t, e) {
    const { width: s, height: i } = __privateGet(this, _t72);
    let n = s, r = i, a = __privateGet(this, _t72);
    for (; n > 2 * t || r > 2 * e; ) {
      const o = n, l = r;
      n > 2 * t && (n = n >= 16384 ? Math.floor(n / 2) - 1 : Math.ceil(n / 2)), r > 2 * e && (r = r >= 16384 ? Math.floor(r / 2) - 1 : Math.ceil(r / 2));
      const h = new OffscreenCanvas(n, r);
      h.getContext("2d").drawImage(a, 0, 0, o, l, 0, 0, n, r), a = h.transferToImageBitmap();
    }
    return a;
  };
  p_fn3 = function() {
    const [t, e] = this.parentDimensions, { width: s, height: i } = this, n = new Pt(), r = Math.ceil(s * t * n.sx), a = Math.ceil(i * e * n.sy), o = __privateGet(this, _n24);
    if (!o || o.width === r && o.height === a) return;
    o.width = r, o.height = a;
    const l = __privateGet(this, _l14) ? __privateGet(this, _t72) : __privateMethod(this, _zr_instances, c_fn3).call(this, r, a), h = o.getContext("2d");
    h.filter = this._uiManager.hcmFilter, h.drawImage(l, 0, 0, l.width, l.height, 0, 0, r, a);
  };
  b_fn4 = function(t) {
    if (t) {
      if (__privateGet(this, _l14)) {
        const i = this._uiManager.imageManager.getSvgUrl(__privateGet(this, _e51));
        if (i) return i;
      }
      const e = document.createElement("canvas");
      return { width: e.width, height: e.height } = __privateGet(this, _t72), e.getContext("2d").drawImage(__privateGet(this, _t72), 0, 0), e.toDataURL();
    }
    if (__privateGet(this, _l14)) {
      const [e, s] = this.pageDimensions, i = Math.round(this.width * e * Qt.PDF_TO_CSS_UNITS), n = Math.round(this.height * s * Qt.PDF_TO_CSS_UNITS), r = new OffscreenCanvas(i, n);
      return r.getContext("2d").drawImage(__privateGet(this, _t72), 0, 0, __privateGet(this, _t72).width, __privateGet(this, _t72).height, 0, 0, i, n), r.transferToImageBitmap();
    }
    return structuredClone(__privateGet(this, _t72));
  };
  A_fn4 = function(t) {
    var _a29;
    const { pageIndex: e, accessibilityData: { altText: s } } = this._initialData, i = t.pageIndex === e, n = (((_a29 = t.accessibilityData) == null ? void 0 : _a29.alt) || "") === s;
    return {
      isSame: !this.hasEditedComment && !this._hasBeenMoved && !this._hasBeenResized && i && n,
      isSameAltText: n
    };
  };
  __publicField(zr, "_type", "stamp");
  __publicField(zr, "_editorType", R.STAMP);
  Dt = (_n26 = class {
    constructor({ uiManager: t, pageIndex: e, div: s, structTreeLayer: i, accessibilityManager: n, annotationLayer: r, drawLayer: a, textLayer: o, viewport: l, l10n: h }) {
      __privateAdd(this, _Dt_instances);
      __privateAdd(this, _t73);
      __privateAdd(this, _e52, false);
      __privateAdd(this, _i44, null);
      __privateAdd(this, _s37, null);
      __privateAdd(this, _a28, null);
      __privateAdd(this, _r25, /* @__PURE__ */ new Map());
      __privateAdd(this, _n25, false);
      __privateAdd(this, _o20, false);
      __privateAdd(this, _h17, false);
      __privateAdd(this, _l15, null);
      __privateAdd(this, _u13, null);
      __privateAdd(this, _d11, null);
      __privateAdd(this, _f10, null);
      __privateAdd(this, _m9, null);
      __privateAdd(this, _g9, -1);
      __privateAdd(this, _c9);
      const c = [
        ...__privateGet(Dt, _p7).values()
      ];
      if (!Dt._initialized) {
        Dt._initialized = true;
        for (const u of c) u.initialize(h, t);
      }
      t.registerEditorTypes(c), __privateSet(this, _c9, t), this.pageIndex = e, this.div = s, __privateSet(this, _t73, n), __privateSet(this, _i44, r), this.viewport = l, __privateSet(this, _d11, o), this.drawLayer = a, this._structTree = i, __privateGet(this, _c9).addLayer(this);
    }
    updatePageIndex(t) {
      for (const e of __privateGet(this, _Dt_instances, b_get)) e.updatePageIndex(t);
      this.pageIndex = t, __privateGet(this, _c9).addLayer(this);
    }
    async setClonedFrom(t) {
      if (!t) return;
      const e = [];
      for (const s of __privateGet(t, _Dt_instances, b_get)) {
        const i = s.serialize(true);
        i && (i.isCopy = false, e.push(this.deserialize(i).then((n) => {
          n && this.addOrRebuild(n);
        })));
      }
      await Promise.all(e);
    }
    get isEmpty() {
      return __privateGet(this, _r25).size === 0;
    }
    get isInvisible() {
      return this.isEmpty && __privateGet(this, _c9).getMode() === R.NONE;
    }
    updateToolbar(t) {
      __privateGet(this, _c9).updateToolbar(t);
    }
    updateMode(t = __privateGet(this, _c9).getMode()) {
      switch (__privateMethod(this, _Dt_instances, v_fn3).call(this), t) {
        case R.NONE:
          this.div.classList.toggle("nonEditing", true), this.disableTextSelection(), this.togglePointerEvents(false), this.toggleAnnotationLayerPointerEvents(true), this.disableClick();
          return;
        case R.INK:
          this.disableTextSelection(), this.togglePointerEvents(true), this.enableClick();
          break;
        case R.HIGHLIGHT:
          this.enableTextSelection(), this.togglePointerEvents(false), this.disableClick();
          break;
        default:
          this.disableTextSelection(), this.togglePointerEvents(true), this.enableClick();
      }
      this.toggleAnnotationLayerPointerEvents(false);
      const { classList: e } = this.div;
      if (e.toggle("nonEditing", false), t === R.POPUP) e.toggle("commentEditing", true);
      else {
        e.toggle("commentEditing", false);
        for (const s of __privateGet(Dt, _p7).values()) e.toggle(`${s._type}Editing`, t === s._editorType);
      }
      this.div.hidden = false;
    }
    hasTextLayer(t) {
      var _a29;
      return t === ((_a29 = __privateGet(this, _d11)) == null ? void 0 : _a29.div);
    }
    setEditingState(t) {
      __privateGet(this, _c9).setEditingState(t);
    }
    addCommands(t) {
      __privateGet(this, _c9).addCommands(t);
    }
    cleanUndoStack(t) {
      __privateGet(this, _c9).cleanUndoStack(t);
    }
    toggleDrawing(t = false) {
      this.div.classList.toggle("drawing", !t);
    }
    togglePointerEvents(t = false) {
      this.div.classList.toggle("disabled", !t);
    }
    toggleAnnotationLayerPointerEvents(t = false) {
      var _a29;
      (_a29 = __privateGet(this, _i44)) == null ? void 0 : _a29.togglePointerEvents(t);
    }
    async enable() {
      var _a29;
      __privateSet(this, _h17, true), this.div.tabIndex = 0, this.togglePointerEvents(true), this.div.classList.toggle("nonEditing", false), (_a29 = __privateGet(this, _m9)) == null ? void 0 : _a29.abort(), __privateSet(this, _m9, null);
      const t = /* @__PURE__ */ new Set();
      for (const s of __privateGet(this, _Dt_instances, b_get)) s.enableEditing(), s.show(true), s.annotationElementId && (__privateGet(this, _c9).removeChangedExistingAnnotation(s), t.add(s.annotationElementId));
      const e = __privateGet(this, _i44);
      if (e) for (const s of e.getEditableAnnotations()) {
        if (s.hide(), __privateGet(this, _c9).isDeletedAnnotationElement(s.data.id) || t.has(s.data.id)) continue;
        const i = await this.deserialize(s);
        i && (this.addOrRebuild(i), i.enableEditing());
      }
      __privateSet(this, _h17, false), __privateGet(this, _c9)._eventBus.dispatch("editorsrendered", {
        source: this,
        pageNumber: this.pageIndex + 1
      });
    }
    disable() {
      var _a29;
      if (__privateSet(this, _o20, true), this.div.tabIndex = -1, this.togglePointerEvents(false), this.div.classList.toggle("nonEditing", true), __privateGet(this, _d11) && !__privateGet(this, _m9)) {
        __privateSet(this, _m9, new AbortController());
        const i = __privateGet(this, _c9).combinedSignal(__privateGet(this, _m9));
        __privateGet(this, _d11).div.addEventListener("pointerdown", (n) => {
          const { clientX: a, clientY: o, timeStamp: l } = n, h = __privateGet(this, _g9);
          if (l - h > 500) {
            __privateSet(this, _g9, l);
            return;
          }
          __privateSet(this, _g9, -1);
          const { classList: c } = this.div;
          c.toggle("getElements", true);
          const u = document.elementsFromPoint(a, o);
          if (c.toggle("getElements", false), !this.div.contains(u[0])) return;
          let f;
          const g = new RegExp(`^${ce}[0-9]+$`);
          for (const b of u) if (g.test(b.id)) {
            f = b.id;
            break;
          }
          if (!f) return;
          const p = __privateGet(this, _r25).get(f);
          (p == null ? void 0 : p.annotationElementId) === null && (n.stopPropagation(), n.preventDefault(), p.dblclick(n));
        }, {
          signal: i,
          capture: true
        });
      }
      const t = __privateGet(this, _i44), e = [];
      if (t) {
        const i = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
        for (const a of __privateGet(this, _Dt_instances, b_get)) {
          if (a.disableEditing(), !a.annotationElementId) {
            e.push(a);
            continue;
          }
          if (a.serialize() !== null) {
            i.set(a.annotationElementId, a);
            continue;
          } else n.set(a.annotationElementId, a);
          (_a29 = this.getEditableAnnotation(a.annotationElementId)) == null ? void 0 : _a29.show(), a.remove();
        }
        const r = t.getEditableAnnotations();
        for (const a of r) {
          const { id: o } = a.data;
          if (__privateGet(this, _c9).isDeletedAnnotationElement(o)) {
            a.updateEdited({
              deleted: true
            });
            continue;
          }
          let l = n.get(o);
          if (l) {
            l.resetAnnotationElement(a), l.show(false), a.show();
            continue;
          }
          l = i.get(o), l && (__privateGet(this, _c9).addChangedExistingAnnotation(l), l.renderAnnotationElement(a) && l.show(false)), a.show();
        }
      }
      __privateMethod(this, _Dt_instances, v_fn3).call(this), this.isEmpty && (this.div.hidden = true);
      const { classList: s } = this.div;
      for (const i of __privateGet(Dt, _p7).values()) s.remove(`${i._type}Editing`);
      this.disableTextSelection(), this.toggleAnnotationLayerPointerEvents(true), t == null ? void 0 : t.updateFakeAnnotations(e), __privateSet(this, _o20, false);
    }
    getEditableAnnotation(t) {
      var _a29;
      return ((_a29 = __privateGet(this, _i44)) == null ? void 0 : _a29.getEditableAnnotation(t)) || null;
    }
    setActiveEditor(t) {
      __privateGet(this, _c9).getActive() !== t && __privateGet(this, _c9).setActiveEditor(t);
    }
    enableTextSelection() {
      var _a29;
      if (this.div.tabIndex = -1, ((_a29 = __privateGet(this, _d11)) == null ? void 0 : _a29.div) && !__privateGet(this, _f10)) {
        __privateSet(this, _f10, new AbortController());
        const t = __privateGet(this, _c9).combinedSignal(__privateGet(this, _f10));
        __privateGet(this, _d11).div.addEventListener("pointerdown", __privateMethod(this, _Dt_instances, A_fn5).bind(this), {
          signal: t
        }), __privateGet(this, _d11).div.classList.add("highlighting");
      }
    }
    disableTextSelection() {
      var _a29;
      this.div.tabIndex = 0, ((_a29 = __privateGet(this, _d11)) == null ? void 0 : _a29.div) && __privateGet(this, _f10) && (__privateGet(this, _f10).abort(), __privateSet(this, _f10, null), __privateGet(this, _d11).div.classList.remove("highlighting"));
    }
    enableClick() {
      if (__privateGet(this, _s37)) return;
      __privateSet(this, _s37, new AbortController());
      const t = __privateGet(this, _c9).combinedSignal(__privateGet(this, _s37));
      this.div.addEventListener("pointerdown", this.pointerdown.bind(this), {
        signal: t
      });
      const e = this.pointerup.bind(this);
      this.div.addEventListener("pointerup", e, {
        signal: t
      }), this.div.addEventListener("pointercancel", e, {
        signal: t
      });
    }
    disableClick() {
      var _a29;
      (_a29 = __privateGet(this, _s37)) == null ? void 0 : _a29.abort(), __privateSet(this, _s37, null);
    }
    attach(t) {
      __privateGet(this, _r25).set(t.id, t);
      const { annotationElementId: e } = t;
      e && __privateGet(this, _c9).isDeletedAnnotationElement(e) && __privateGet(this, _c9).removeDeletedAnnotationElement(t);
    }
    detach(t) {
      var _a29;
      __privateGet(this, _r25).delete(t.id), (_a29 = __privateGet(this, _t73)) == null ? void 0 : _a29.removePointerInTextLayer(t.contentDiv), !__privateGet(this, _o20) && t.annotationElementId && __privateGet(this, _c9).addDeletedAnnotationElement(t);
    }
    remove(t) {
      this.detach(t), __privateGet(this, _c9).removeEditor(t), t.div.remove(), t.isAttachedToDOM = false;
    }
    changeParent(t) {
      var _a29;
      t.parent !== this && (t.parent && t.annotationElementId && (__privateGet(this, _c9).addDeletedAnnotationElement(t), D.deleteAnnotationElement(t), t.annotationElementId = null), this.attach(t), (_a29 = t.parent) == null ? void 0 : _a29.detach(t), t.setParent(this), t.div && t.isAttachedToDOM && (t.div.remove(), this.div.append(t.div)));
    }
    add(t) {
      if (!(t.parent === this && t.isAttachedToDOM)) {
        if (this.changeParent(t), __privateGet(this, _c9).addEditor(t), this.attach(t), !t.isAttachedToDOM) {
          const e = t.render();
          this.div.append(e), t.isAttachedToDOM = true;
        }
        t.fixAndSetPosition(), t.onceAdded(!__privateGet(this, _h17)), __privateGet(this, _c9).addToAnnotationStorage(t), t._reportTelemetry(t.telemetryInitialData);
      }
    }
    moveEditorInDOM(t) {
      var _a29;
      if (!t.isAttachedToDOM) return;
      const { activeElement: e } = document;
      t.div.contains(e) && !__privateGet(this, _a28) && (t._focusEventsAllowed = false, __privateSet(this, _a28, setTimeout(() => {
        __privateSet(this, _a28, null), t.div.contains(document.activeElement) ? t._focusEventsAllowed = true : (t.div.addEventListener("focusin", () => {
          t._focusEventsAllowed = true;
        }, {
          once: true,
          signal: __privateGet(this, _c9)._signal
        }), e.focus());
      }, 0))), t._structTreeParentId = (_a29 = __privateGet(this, _t73)) == null ? void 0 : _a29.moveElementInDOM(this.div, t.div, t.contentDiv, true);
    }
    addOrRebuild(t) {
      t.needsToBeRebuilt() ? (t.parent || (t.parent = this), t.rebuild(), t.show()) : this.add(t);
    }
    addUndoableEditor(t) {
      const e = () => t._uiManager.rebuild(t), s = () => {
        t.remove();
      };
      this.addCommands({
        cmd: e,
        undo: s,
        mustExec: false
      });
    }
    getEditorByUID(t) {
      for (const e of __privateGet(this, _r25).values()) if (e.uid === t) return e;
      return null;
    }
    getNextId() {
      return __privateGet(this, _c9).getId();
    }
    combinedSignal(t) {
      return __privateGet(this, _c9).combinedSignal(t);
    }
    canCreateNewEmptyEditor() {
      var _a29;
      return (_a29 = __privateGet(this, _Dt_instances, y_get)) == null ? void 0 : _a29.canCreateNewEmptyEditor();
    }
    async pasteEditor(t, e) {
      this.updateToolbar(t), await __privateGet(this, _c9).updateMode(t.mode);
      const { offsetX: s, offsetY: i } = __privateMethod(this, _Dt_instances, E_fn3).call(this), n = this.getNextId(), r = __privateMethod(this, _Dt_instances, C_fn3).call(this, {
        parent: this,
        id: n,
        x: s,
        y: i,
        uiManager: __privateGet(this, _c9),
        isCentered: true,
        ...e
      });
      r && this.add(r);
    }
    async deserialize(t) {
      var _a29;
      return await ((_a29 = __privateGet(Dt, _p7).get(t.annotationType ?? t.annotationEditorType)) == null ? void 0 : _a29.deserialize(t, this, __privateGet(this, _c9))) || null;
    }
    createAndAddNewEditor(t, e, s = {}) {
      const i = this.getNextId(), n = __privateMethod(this, _Dt_instances, C_fn3).call(this, {
        parent: this,
        id: i,
        x: t.offsetX,
        y: t.offsetY,
        uiManager: __privateGet(this, _c9),
        isCentered: e,
        ...s
      });
      return n && this.add(n), n;
    }
    get boundingClientRect() {
      return this.div.getBoundingClientRect();
    }
    addNewEditor(t = {}) {
      this.createAndAddNewEditor(__privateMethod(this, _Dt_instances, E_fn3).call(this), true, t);
    }
    setSelected(t) {
      __privateGet(this, _c9).setSelected(t);
    }
    toggleSelected(t) {
      __privateGet(this, _c9).toggleSelected(t);
    }
    unselect(t) {
      __privateGet(this, _c9).unselect(t);
    }
    pointerup(t) {
      var _a29;
      const { isMac: e } = nt.platform;
      if (t.button !== 0 || t.ctrlKey && e || t.target !== this.div || !__privateGet(this, _n25) || (__privateSet(this, _n25, false), ((_a29 = __privateGet(this, _Dt_instances, y_get)) == null ? void 0 : _a29.isDrawer) && __privateGet(this, _Dt_instances, y_get).supportMultipleDrawings)) return;
      if (!__privateGet(this, _e52)) {
        __privateSet(this, _e52, true);
        return;
      }
      const s = __privateGet(this, _c9).getMode();
      if (s === R.STAMP || s === R.SIGNATURE) {
        __privateGet(this, _c9).unselectAll();
        return;
      }
      this.createAndAddNewEditor(t, false);
    }
    pointerdown(t) {
      var _a29;
      if (__privateGet(this, _c9).getMode() === R.HIGHLIGHT && this.enableTextSelection(), __privateGet(this, _n25)) {
        __privateSet(this, _n25, false);
        return;
      }
      const { isMac: e } = nt.platform;
      if (t.button !== 0 || t.ctrlKey && e || t.target !== this.div) return;
      if (__privateSet(this, _n25, true), (_a29 = __privateGet(this, _Dt_instances, y_get)) == null ? void 0 : _a29.isDrawer) {
        this.startDrawingSession(t);
        return;
      }
      const s = __privateGet(this, _c9).getActive();
      __privateSet(this, _e52, !s || s.isEmpty());
    }
    startDrawingSession(t) {
      if (this.div.focus({
        preventScroll: true
      }), __privateGet(this, _l15)) {
        __privateGet(this, _Dt_instances, y_get).startDrawing(this, __privateGet(this, _c9), false, t);
        return;
      }
      __privateGet(this, _c9).setCurrentDrawingSession(this), __privateSet(this, _l15, new AbortController());
      const e = __privateGet(this, _c9).combinedSignal(__privateGet(this, _l15));
      this.div.addEventListener("blur", ({ relatedTarget: s }) => {
        s && !this.div.contains(s) && (__privateSet(this, _u13, null), this.commitOrRemove());
      }, {
        signal: e
      }), __privateGet(this, _Dt_instances, y_get).startDrawing(this, __privateGet(this, _c9), false, t);
    }
    pause(t) {
      if (t) {
        const { activeElement: e } = document;
        this.div.contains(e) && __privateSet(this, _u13, e);
        return;
      }
      __privateGet(this, _u13) && setTimeout(() => {
        var _a29;
        (_a29 = __privateGet(this, _u13)) == null ? void 0 : _a29.focus(), __privateSet(this, _u13, null);
      }, 0);
    }
    endDrawingSession(t = false) {
      return __privateGet(this, _l15) ? (__privateGet(this, _c9).setCurrentDrawingSession(null), __privateGet(this, _l15).abort(), __privateSet(this, _l15, null), __privateSet(this, _u13, null), __privateGet(this, _Dt_instances, y_get).endDrawing(t)) : null;
    }
    findNewParent(t, e, s) {
      const i = __privateGet(this, _c9).findParent(e, s);
      return i === null || i === this ? false : (i.changeParent(t), true);
    }
    commitOrRemove() {
      return __privateGet(this, _l15) ? (this.endDrawingSession(), true) : false;
    }
    onScaleChanging() {
      __privateGet(this, _l15) && __privateGet(this, _Dt_instances, y_get).onScaleChangingWhenDrawing(this);
    }
    destroy() {
      var _a29, _b7;
      this.commitOrRemove(), ((_a29 = __privateGet(this, _c9).getActive()) == null ? void 0 : _a29.parent) === this && (__privateGet(this, _c9).commitOrRemove(), __privateGet(this, _c9).setActiveEditor(null)), __privateGet(this, _a28) && (clearTimeout(__privateGet(this, _a28)), __privateSet(this, _a28, null));
      for (const t of __privateGet(this, _r25).values()) (_b7 = __privateGet(this, _t73)) == null ? void 0 : _b7.removePointerInTextLayer(t.contentDiv), t.setParent(null), t.isAttachedToDOM = false, t.div.remove();
      this.div = null, __privateGet(this, _r25).clear(), __privateGet(this, _c9).removeLayer(this);
    }
    render({ viewport: t }) {
      this.viewport = t, Ot(this.div, t);
      for (const e of __privateGet(this, _c9).getEditors(this.pageIndex)) this.add(e), e.rebuild();
      this.updateMode();
    }
    update({ viewport: t }) {
      __privateGet(this, _c9).commitOrRemove(), __privateMethod(this, _Dt_instances, v_fn3).call(this);
      const e = this.viewport.rotation, s = t.rotation;
      if (this.viewport = t, Ot(this.div, {
        rotation: s
      }), e !== s) for (const i of __privateGet(this, _r25).values()) i.rotate(s);
    }
    get pageDimensions() {
      const { pageWidth: t, pageHeight: e } = this.viewport.rawDims;
      return [
        t,
        e
      ];
    }
    get scale() {
      return __privateGet(this, _c9).viewParameters.realScale;
    }
  }, _t73 = new WeakMap(), _e52 = new WeakMap(), _i44 = new WeakMap(), _s37 = new WeakMap(), _a28 = new WeakMap(), _r25 = new WeakMap(), _n25 = new WeakMap(), _o20 = new WeakMap(), _h17 = new WeakMap(), _l15 = new WeakMap(), _u13 = new WeakMap(), _d11 = new WeakMap(), _f10 = new WeakMap(), _m9 = new WeakMap(), _g9 = new WeakMap(), _c9 = new WeakMap(), _p7 = new WeakMap(), _Dt_instances = new WeakSet(), b_get = function() {
    return __privateGet(this, _r25).size !== 0 ? __privateGet(this, _r25).values() : __privateGet(this, _c9).getEditors(this.pageIndex);
  }, A_fn5 = function(t) {
    __privateGet(this, _c9).unselectAll();
    const { target: e } = t;
    if (e === __privateGet(this, _d11).div || (e.getAttribute("role") === "img" || e.classList.contains("endOfContent")) && __privateGet(this, _d11).div.contains(e)) {
      const { isMac: s } = nt.platform;
      if (t.button !== 0 || t.ctrlKey && s) return;
      __privateGet(this, _c9).showAllEditors("highlight", true, true), __privateGet(this, _d11).div.classList.add("free"), this.toggleDrawing(), Q.startHighlighting(this, __privateGet(this, _c9).direction === "ltr", {
        target: __privateGet(this, _d11).div,
        x: t.x,
        y: t.y
      }), __privateGet(this, _d11).div.addEventListener("pointerup", () => {
        __privateGet(this, _d11).div.classList.remove("free"), this.toggleDrawing(true);
      }, {
        once: true,
        signal: __privateGet(this, _c9)._signal
      }), t.preventDefault();
    }
  }, y_get = function() {
    return __privateGet(Dt, _p7).get(__privateGet(this, _c9).getMode());
  }, C_fn3 = function(t) {
    const e = __privateGet(this, _Dt_instances, y_get);
    return e ? new e.prototype.constructor(t) : null;
  }, E_fn3 = function() {
    const { x: t, y: e, width: s, height: i } = this.boundingClientRect, n = Math.max(0, t), r = Math.max(0, e), a = Math.min(window.innerWidth, t + s), o = Math.min(window.innerHeight, e + i), l = (n + a) / 2 - t, h = (r + o) / 2 - e, [c, u] = this.viewport.rotation % 180 === 0 ? [
      l,
      h
    ] : [
      h,
      l
    ];
    return {
      offsetX: c,
      offsetY: u
    };
  }, v_fn3 = function() {
    for (const t of __privateGet(this, _r25).values()) t.isEmpty() && t.remove();
  }, __publicField(_n26, "_initialized", false), __privateAdd(_n26, _p7, new Map([
    at,
    Ds,
    zr,
    Q,
    Tt
  ].map((t) => [
    t._editorType,
    t
  ]))), _n26);
  lt = (_o21 = class {
    constructor() {
      __privateAdd(this, _lt_instances);
      __privateAdd(this, _t74, null);
      __privateAdd(this, _e53, /* @__PURE__ */ new Map());
      __privateAdd(this, _i45, /* @__PURE__ */ new Map());
    }
    setParent(t) {
      if (!__privateGet(this, _t74)) {
        __privateSet(this, _t74, t);
        return;
      }
      if (__privateGet(this, _t74) !== t) {
        if (__privateGet(this, _e53).size > 0) for (const e of __privateGet(this, _e53).values()) e.remove(), t.append(e);
        __privateSet(this, _t74, t);
      }
    }
    static get _svgFactory() {
      return L(this, "_svgFactory", new Ie());
    }
    draw(t, e = false, s = false) {
      const i = __privateWrapper(lt, _s38)._++, n = __privateMethod(this, _lt_instances, r_fn6).call(this), r = lt._svgFactory.createElement("defs");
      n.append(r);
      const a = lt._svgFactory.createElement("path");
      r.append(a);
      const o = `path_${i}`;
      a.setAttribute("id", o), a.setAttribute("vector-effect", "non-scaling-stroke"), e && __privateGet(this, _i45).set(i, a);
      const l = s ? __privateMethod(this, _lt_instances, n_fn5).call(this, r, o) : null, h = lt._svgFactory.createElement("use");
      return n.append(h), h.setAttribute("href", `#${o}`), this.updateProperties(n, t), __privateGet(this, _e53).set(i, n), {
        id: i,
        clipPathId: `url(#${l})`
      };
    }
    drawOutline(t, e) {
      const s = __privateWrapper(lt, _s38)._++, i = __privateMethod(this, _lt_instances, r_fn6).call(this), n = lt._svgFactory.createElement("defs");
      i.append(n);
      const r = lt._svgFactory.createElement("path");
      n.append(r);
      const a = `path_${s}`;
      r.setAttribute("id", a), r.setAttribute("vector-effect", "non-scaling-stroke");
      let o;
      if (e) {
        const c = lt._svgFactory.createElement("mask");
        n.append(c), o = `mask_${s}`, c.setAttribute("id", o), c.setAttribute("maskUnits", "objectBoundingBox");
        const u = lt._svgFactory.createElement("rect");
        c.append(u), u.setAttribute("width", "1"), u.setAttribute("height", "1"), u.setAttribute("fill", "white");
        const f = lt._svgFactory.createElement("use");
        c.append(f), f.setAttribute("href", `#${a}`), f.setAttribute("stroke", "none"), f.setAttribute("fill", "black"), f.setAttribute("fill-rule", "nonzero"), f.classList.add("mask");
      }
      const l = lt._svgFactory.createElement("use");
      i.append(l), l.setAttribute("href", `#${a}`), o && l.setAttribute("mask", `url(#${o})`);
      const h = l.cloneNode();
      return i.append(h), l.classList.add("mainOutline"), h.classList.add("secondaryOutline"), this.updateProperties(i, t), __privateGet(this, _e53).set(s, i), s;
    }
    finalizeDraw(t, e) {
      __privateGet(this, _i45).delete(t), this.updateProperties(t, e);
    }
    updateProperties(t, e) {
      var _a29;
      if (!e) return;
      const { root: s, bbox: i, rootClass: n, path: r } = e, a = typeof t == "number" ? __privateGet(this, _e53).get(t) : t;
      if (a) {
        if (s && __privateMethod(this, _lt_instances, o_fn8).call(this, a, s), i && __privateMethod(_a29 = lt, _lt_static, a_fn8).call(_a29, a, i), n) {
          const { classList: o } = a;
          for (const [l, h] of Object.entries(n)) o.toggle(l, h);
        }
        if (r) {
          const l = a.firstElementChild.firstElementChild;
          __privateMethod(this, _lt_instances, o_fn8).call(this, l, r);
        }
      }
    }
    updateParent(t, e) {
      if (e === this) return;
      const s = __privateGet(this, _e53).get(t);
      s && (__privateGet(e, _t74).append(s), __privateGet(this, _e53).delete(t), __privateGet(e, _e53).set(t, s));
    }
    remove(t) {
      __privateGet(this, _i45).delete(t), __privateGet(this, _t74) !== null && (__privateGet(this, _e53).get(t).remove(), __privateGet(this, _e53).delete(t));
    }
    destroy() {
      __privateSet(this, _t74, null);
      for (const t of __privateGet(this, _e53).values()) t.remove();
      __privateGet(this, _e53).clear(), __privateGet(this, _i45).clear();
    }
  }, _t74 = new WeakMap(), _e53 = new WeakMap(), _i45 = new WeakMap(), _s38 = new WeakMap(), _lt_static = new WeakSet(), a_fn8 = function(t, [e, s, i, n]) {
    const { style: r } = t;
    r.top = `${100 * s}%`, r.left = `${100 * e}%`, r.width = `${100 * i}%`, r.height = `${100 * n}%`;
  }, _lt_instances = new WeakSet(), r_fn6 = function() {
    const t = lt._svgFactory.create(1, 1, true);
    return __privateGet(this, _t74).append(t), t.setAttribute("aria-hidden", true), t;
  }, n_fn5 = function(t, e) {
    const s = lt._svgFactory.createElement("clipPath");
    t.append(s);
    const i = `clip_${e}`;
    s.setAttribute("id", i), s.setAttribute("clipPathUnits", "objectBoundingBox");
    const n = lt._svgFactory.createElement("use");
    return s.append(n), n.setAttribute("href", `#${e}`), n.classList.add("clip"), i;
  }, o_fn8 = function(t, e) {
    for (const [s, i] of Object.entries(e)) i === null ? t.removeAttribute(s) : t.setAttribute(s, i);
  }, __privateAdd(_o21, _lt_static), __privateAdd(_o21, _s38, 0), _o21);
  globalThis._pdfjsTestingUtils = {
    HighlightOutliner: gs
  };
  globalThis.pdfjsLib = {
    AbortException: Rt,
    AnnotationEditorLayer: Dt,
    AnnotationEditorParamsType: O,
    AnnotationEditorType: R,
    AnnotationEditorUIManager: Ft,
    AnnotationLayer: Ms,
    AnnotationMode: Lt,
    AnnotationType: st,
    applyOpacity: dn,
    build: Ar,
    ColorPicker: vt,
    createValidAbsoluteUrl: ci,
    CSSConstants: cn,
    DOMSVGFactory: Ie,
    DrawLayer: lt,
    FeatureTest: nt,
    fetchData: ge,
    findContrastColor: un,
    getDocument: fr,
    getFilenameFromUrl: rn,
    getPdfFilenameFromUrl: an,
    getRGB: be,
    getUuid: ui,
    getXfaPageViewport: on,
    GlobalWorkerOptions: he,
    ImageKind: ke,
    InvalidPDFException: as,
    isDataScheme: Oe,
    isPdfFile: ws,
    isValidExplicitDest: _n,
    makeArr: fi,
    makeMap: ys,
    makeObj: os,
    MathClamp: ot,
    noContextMenu: St,
    normalizeUnicode: sn,
    OPS: de,
    OutputScale: Pt,
    PasswordResponses: Wi,
    PDFDataRangeTransport: Ri,
    PDFDateString: ls,
    PDFWorker: ht,
    PermissionFlag: Vi,
    PixelsPerInch: Qt,
    RenderingCancelledException: As,
    renderRichText: mi,
    ResponseException: Me,
    setLayerDimensions: Ot,
    shadow: L,
    SignatureExtractor: Gt,
    stopEvent: K,
    SupportedImageMimeTypes: hs,
    TextLayer: mt,
    TouchManager: Be,
    updateUrlHash: di,
    Util: T,
    VerbosityLevel: Le,
    version: yr,
    XfaLayer: pi
  };
});
export {
  Rt as AbortException,
  Dt as AnnotationEditorLayer,
  O as AnnotationEditorParamsType,
  R as AnnotationEditorType,
  Ft as AnnotationEditorUIManager,
  Ms as AnnotationLayer,
  Lt as AnnotationMode,
  st as AnnotationType,
  cn as CSSConstants,
  vt as ColorPicker,
  Ie as DOMSVGFactory,
  lt as DrawLayer,
  nt as FeatureTest,
  he as GlobalWorkerOptions,
  ke as ImageKind,
  as as InvalidPDFException,
  ot as MathClamp,
  de as OPS,
  Pt as OutputScale,
  Ri as PDFDataRangeTransport,
  ls as PDFDateString,
  ht as PDFWorker,
  Wi as PasswordResponses,
  Vi as PermissionFlag,
  Qt as PixelsPerInch,
  As as RenderingCancelledException,
  Me as ResponseException,
  Gt as SignatureExtractor,
  hs as SupportedImageMimeTypes,
  mt as TextLayer,
  Be as TouchManager,
  T as Util,
  Le as VerbosityLevel,
  pi as XfaLayer,
  __tla,
  dn as applyOpacity,
  Ar as build,
  ci as createValidAbsoluteUrl,
  ge as fetchData,
  un as findContrastColor,
  fr as getDocument,
  rn as getFilenameFromUrl,
  an as getPdfFilenameFromUrl,
  be as getRGB,
  ui as getUuid,
  on as getXfaPageViewport,
  Oe as isDataScheme,
  ws as isPdfFile,
  _n as isValidExplicitDest,
  fi as makeArr,
  ys as makeMap,
  os as makeObj,
  St as noContextMenu,
  sn as normalizeUnicode,
  mi as renderRichText,
  Ot as setLayerDimensions,
  L as shadow,
  K as stopEvent,
  di as updateUrlHash,
  yr as version
};
