/* ---------- Fechas (números de día en UTC, sin horarios de verano) ---------- */
const DAY = 86400000;
const dn = (y, m, d) => Math.round(Date.UTC(y, m, d) / DAY);
const P = n => { const t = new Date(n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), w: t.getUTCDay() }; };
const iso = n => new Date(n * DAY).toISOString().slice(0, 10);
const fromIso = s => { const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return a ? dn(+a[1], a[2] - 1, +a[3]) : NaN; };
const todayDn = () => { const t = new Date(); return dn(t.getFullYear(), t.getMonth(), t.getDate()); };

const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DOW1 = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
let showYear = false;
const fmt = (n, o = {}) => { const p = P(n); return `${o.noDow ? '' : DOW[p.w] + ' '}${p.d} ${MON[p.m]}${(o.year ?? showYear) ? ' ' + p.y : ''}`; };
const runs = a => { const r = []; for (const n of a) { const l = r[r.length - 1]; if (l && l[1] === n - 1) l[1] = n; else r.push([n, n]); } return r; };
const fmtList = a => runs(a).map(([x, y]) => x === y ? fmt(x) : `${fmt(x)} – ${fmt(y)}`).join(', ');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

/* ---------- Feriados ---------- */
const nthDow = (y, m, dow, nth) => dn(y, m, 1 + ((dow - P(dn(y, m, 1)).w + 7) % 7) + (nth - 1) * 7);
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return dn(y, mo - 1, da);
}
const RULES = [
  { id: 'anio', name: 'Año Nuevo', off: 1, f: y => dn(y, 0, 1) },
  { id: 'const', name: 'Día de la Constitución', off: 1, f: y => nthDow(y, 1, 1, 1) },
  { id: 'juarez', name: 'Natalicio de Benito Juárez', off: 1, f: y => nthDow(y, 2, 1, 3) },
  { id: 'trabajo', name: 'Día del Trabajo', off: 1, f: y => dn(y, 4, 1) },
  { id: 'eleccion', name: 'Jornada electoral federal', off: 1, f: y => y % 3 === 2 ? nthDow(y, 5, 0, 1) : null },
  { id: 'indep', name: 'Día de la Independencia', off: 1, f: y => dn(y, 8, 16) },
  { id: 'poder', name: 'Transmisión del Poder Ejecutivo', off: 1, f: y => y % 6 === 2 ? dn(y, 9, 1) : null },
  { id: 'rev', name: 'Día de la Revolución', off: 1, f: y => nthDow(y, 10, 1, 3) },
  { id: 'navidad', name: 'Navidad', off: 1, f: y => dn(y, 11, 25) },
  { id: 'jsanto', name: 'Jueves Santo', f: y => easter(y) - 3 },
  { id: 'vsanto', name: 'Viernes Santo', f: y => easter(y) - 2 },
  { id: 'sgloria', name: 'Sábado de Gloria', f: y => easter(y) - 1 },
  { id: 'puebla', name: 'Batalla de Puebla', f: y => dn(y, 4, 5) },
  { id: 'madres', name: 'Día de las Madres', f: y => dn(y, 4, 10) },
  { id: 'muertos', name: 'Día de Muertos', f: y => dn(y, 10, 2) },
  { id: 'guadalupe', name: 'Día de la Virgen de Guadalupe', f: y => dn(y, 11, 12) },
  { id: 'nochebuena', name: 'Nochebuena', f: y => dn(y, 11, 24) },
  { id: 'finanio', name: 'Fin de año', f: y => dn(y, 11, 31) },
];
const holOn = r => state.hol[r.id] ?? !!r.off;
const customDates = (c, y0, y1) => {
  const n = fromIso(c.date); if (isNaN(n)) return [];
  if (!c.yearly) return [n];
  const p = P(n), out = [];
  for (let y = y0; y <= y1; y++) { const q = dn(y, p.m, p.d); if (P(q).m === p.m) out.push(q); }
  return out;
};
function holidayMap(y0, y1) {
  const map = new Map(), add = (n, h) => { if (!map.has(n)) map.set(n, []); map.get(n).push(h); };
  for (let y = y0; y <= y1; y++) for (const r of RULES) if (holOn(r)) { const n = r.f(y); if (n != null) add(n, { name: r.name, src: 'rule', id: r.id }); }
  state.custom.forEach((c, idx) => { for (const n of customDates(c, y0, y1)) add(n, { name: c.name || 'Día libre de la empresa', src: 'custom', idx }); });
  return map;
}

/* ---------- Texto fijo: feriados y puentes de dos años ----------
   build.py incrusta este bloque en index.html (para buscadores y para quien llega buscando «puentes 2027») y la página
   lo vuelve a generar al abrir, así que los años nunca quedan viejos. Los consejos suponen descanso en sábado y domingo. */
const DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function infoYears() { const p = P(todayDn()), y = p.m >= 9 ? p.y + 1 : p.y; return [y, y + 1]; }   // de octubre en adelante ya se planea el año siguiente
function bridgeTip(n) {
  const w = P(n).w, f = x => fmt(x, { year: false });
  if (w === 0 || w === 6) return `Cae en ${DOWL[w]}: este año no da puente.`;
  if (w === 1) return `Puente de 3 días (${f(n - 2)} – ${f(n)}). Si pides el ${f(n - 3)} o el ${f(n + 1)}, son 4.`;
  if (w === 5) return `Puente de 3 días (${f(n)} – ${f(n + 2)}). Si pides el ${f(n - 1)} o el ${f(n + 3)}, son 4.`;
  if (w === 2) return `Pide el ${f(n - 1)} y descansas 4 días (${f(n - 3)} – ${f(n)}).`;
  if (w === 4) return `Pide el ${f(n + 1)} y descansas 4 días (${f(n)} – ${f(n + 3)}).`;
  return `Pide lunes y martes (${f(n - 4)} – ${f(n)}) o jueves y viernes (${f(n)} – ${f(n + 4)}) y descansas 5 días.`;
}
function infoHtml() {
  const ys = infoYears(), f = n => fmt(n, { year: false });
  const year = y => {
    const off = [], opt = [];
    for (const r of RULES) { const n = r.f(y); if (n != null) (r.off ? off : opt).push([n, r.name]); }
    off.sort((a, b) => a[0] - b[0]); opt.sort((a, b) => a[0] - b[0]);
    const puentes = off.filter(([n]) => P(n).w >= 1 && P(n).w <= 5).length;
    return `<details class="yr"><summary><h3>Puentes y feriados ${y}</h3><span>${puentes} de ${off.length} feriados dan puente</span></summary><ul class="hl">${off.map(([n, name]) => `<li><b>${f(n)}</b><span>${name}<small>${bridgeTip(n)}</small></span></li>`).join('')}</ul>`
      + `<p class="hl-x">No son obligatorios, pero muchas empresas los dan: ${opt.map(([n, name]) => `${name} (${f(n)})`).join(', ')}.</p></details>`;
  };
  return `<h2>Puentes y feriados de México en ${ys[0]} y ${ys[1]}</h2>`
    + '<p>Estos son los días de descanso obligatorio de la Ley Federal del Trabajo (artículo 74) y cómo convertir cada uno en puente si descansas sábado y domingo. Con tus días de vacaciones, el optimizador de arriba arma el plan completo del año.</p>'
    + `<div class="info-y">${ys.map(year).join('')}</div>`;
}

/* ---------- Estilos de descanso ---------- */
const STYLES = {
  mix: { name: 'Equilibrado', desc: 'Una vacación larga y el resto en puentes', min: 3, max: 16, long: 9 },
  puentes: { name: 'Puentes', desc: 'Muchos fines de semana largos', min: 3, max: 5 },
  escapadas: { name: 'Escapadas', desc: 'Descansos medianos, de 5 a 9 días', min: 5, max: 9 },
  largas: { name: 'Vacaciones largas', desc: 'Pocos descansos de 9 días o más', min: 9, max: 23 },
};

/* ---------- Estado ---------- */
const KEY = 'megapuente-v1';
function defaults() {
  const t = todayDn(), p = P(t);
  const next = p.m >= 9;
  return {
    days: 12,
    start: next ? `${p.y + 1}-01-01` : iso(t),
    end: next ? `${p.y + 1}-12-31` : `${p.y}-12-31`,
    preset: next ? null : 'rest',   // periodo relativo a hoy (ver syncPeriod); null = fechas fijas
    rest: [0, 6], style: 'mix', hol: {}, custom: [], fixed: [], blocked: [],
  };
}
/* Limpia un estado que viene de fuera (localStorage o un enlace compartido): lo que falta o no es válido toma su valor
   por defecto, para que un dato dañado no deje la página en blanco. Sin «preset» (versión anterior) las fechas son fijas. */
function sanitize(o) {
  const d = defaults(), okDate = v => typeof v === 'string' && !isNaN(fromIso(v));
  const today = todayDn(), dates = a => Array.isArray(a) ? [...new Set(a.filter(v => okDate(v) && fromIso(v) >= today))].slice(0, 400) : [];   // las marcas de días que ya pasaron se descartan
  const preset = o.preset === 'rest' || o.preset === '12m' ? o.preset : null, per = okDate(o.start) && okDate(o.end);
  const hol = {};
  if (o.hol && typeof o.hol === 'object') for (const r of RULES) if (typeof o.hol[r.id] === 'boolean') hol[r.id] = o.hol[r.id];
  return {
    days: Number.isFinite(o.days) ? Math.max(0, Math.min(60, Math.round(o.days))) : d.days,
    start: per ? o.start : d.start, end: per ? o.end : d.end, preset: preset || (per ? null : d.preset),
    rest: Array.isArray(o.rest) ? [...new Set(o.rest.filter(w => Number.isInteger(w) && w >= 0 && w <= 6))] : d.rest,
    style: Object.prototype.hasOwnProperty.call(STYLES, o.style) ? o.style : d.style,
    hol,
    custom: Array.isArray(o.custom) ? o.custom.filter(c => c && okDate(c.date)).slice(0, 200)
      .map(c => ({ date: c.date, name: typeof c.name === 'string' ? c.name.slice(0, 60) : '', yearly: !!c.yearly })) : [],
    fixed: dates(o.fixed), blocked: dates(o.blocked),
  };
}
const readSaved = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? sanitize(s) : null; } catch (e) { return null; } };
let state = readSaved() || defaults();
let shared = false;   // se está viendo el plan de un enlace compartido: no se guarda (el propio sigue intacto) hasta adoptarlo
const save = () => { if (shared) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

/* Enlace para compartir: la configuración viaja en el #fragmento de la dirección (base64url de un JSON), que no se envía a ningún servidor. */
const b64u = {
  enc: s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))),
};
function shareCode() {
  const o = { days: state.days, rest: state.rest, style: state.style };
  if (state.preset) o.preset = state.preset; else { o.start = state.start; o.end = state.end; }
  if (Object.keys(state.hol).length) o.hol = state.hol;
  for (const k of ['custom', 'fixed', 'blocked']) if (state[k].length) o[k] = state[k];
  return b64u.enc(JSON.stringify(o));
}
function fromShareCode(code) { try { const o = JSON.parse(b64u.dec(code)); return o && typeof o === 'object' ? sanitize(o) : null; } catch (e) { return null; } }

/* ---------- Modelo del calendario ---------- */
function build() {
  const today = todayDn(), s = fromIso(state.start), e = fromIso(state.end);
  if (isNaN(s) || isNaN(e)) return { error: 'Elige las dos fechas del periodo.' };
  if (e < s) return { error: 'La fecha final del periodo debe ser posterior a la inicial.' };
  if (e - s > 800) return { error: 'El periodo máximo es de unos dos años.' };
  if (e < today) return { error: 'Ese periodo ya pasó. Elige fechas de hoy en adelante.' };
  const eff = Math.max(s, today), p0 = Math.max(eff - 10, today), p1 = e + 10, N = p1 - p0 + 1;
  const hmap = holidayMap(P(Math.min(s, p0)).y, P(p1).y);
  const rest = new Set(state.rest), fixed = new Set(state.fixed.map(fromIso)), blocked = new Set(state.blocked.map(fromIso));
  const off = new Uint8Array(N), take = new Uint8Array(N), fix = new Uint8Array(N), holW = new Uint8Array(N);
  let fixedCount = 0;
  for (let i = 0; i < N; i++) {
    const n = p0 + i, r = rest.has(P(n).w), h = hmap.has(n), inR = n >= eff && n <= e;
    if (!r && !h && inR && fixed.has(n)) { fix[i] = 1; fixedCount++; }
    off[i] = r || h || fix[i] ? 1 : 0;
    take[i] = !off[i] && inR && n > today && !blocked.has(n) ? 1 : 0;   // hoy ya no se sugiere: es tarde para pedirlo (sí se puede fijar a mano)
    holW[i] = h && !r ? 1 : 0;
  }
  // Rachas libres que ya incluyen un día fijo: su largo ya cuenta, así que alargarlas solo suma la diferencia.
  const pre = new Int32Array(N + 1), fixedRuns = [], nextFix = new Int32Array(N + 2).fill(1e9), fixEnd = new Int32Array(N + 1);
  for (let i = 0; i < N;) {
    if (!off[i]) { pre[i + 1] = pre[i]; i++; continue; }
    let j = i, has = false; while (j < N && off[j]) { if (fix[j]) has = true; j++; }
    const L = has ? j - i : 0; if (has) { fixedRuns.push(L); nextFix[i] = i; fixEnd[i] = j - 1; }
    for (let x = i; x < j; x++) pre[x + 1] = pre[i] + L;
    i = j;
  }
  for (let x = N - 1; x >= 0; x--) if (nextFix[x] !== x) nextFix[x] = nextFix[x + 1];   // inicio de la siguiente racha fija
  return { s, e, eff, p0, p1, N, hmap, rest, blocked, off, take, fix, holW, fixedCount, today, pre, fixedRuns, nextFix, fixEnd };
}

/* ---------- Optimizador (programación dinámica) ----------
   Un "descanso" es una racha de días libres seguidos que incluye al menos un día de vacaciones.
   Se maximiza la suma de días de todos los descansos con a lo más K días de vacaciones. */
function solve(M, K, st, need) {
  // Puntaje (lexicográfico): 1) más días de descanso, 2) menos días de vacaciones gastados,
  // 3) descansos mejor repartidos (bono cóncavo por la separación entre vecinos consecutivos;
  //    los vecinos son los descansos que se eligen y las rachas con días fijados por el usuario).
  const N = M.N, G = need + 1, W = K + 1, NEG = -1e15, D = 56, MID = 4096, BIG = MID * 64;
  const bon = Array.from({ length: D + 1 }, (_, d) => 8 * Math.sqrt(d));
  const sz = (N + 1) * W * G, at = (i, k, g) => (Math.min(i, N) * W + k) * G + g;
  const S = new Float64Array(sz).fill(NEG);   // mejor puntaje con un descanso que empieza justo en i
  const F = new Float64Array(sz).fill(NEG);   // mejor puntaje de i en adelante (vecino anterior lejano)
  const E = new Float64Array(sz).fill(NEG);   // mejor continuación tras un vecino que termina en i
  const chS = new Int16Array(sz).fill(-1), chE = new Int16Array(sz).fill(-1);
  for (let k = 0; k <= K; k++) F[at(N, k, 0)] = 0;
  const cb = [], cc = [], cg = [];
  for (let i = N - 1; i >= 0; i--) {
    const nf = M.nextFix[i + 1], gapF = nf - i - 1, viaFix = gapF < D;
    for (let k = 0; k <= K; k++) for (let g = 0; g < G; g++) {
      let best = viaFix ? E[at(M.fixEnd[nf], k, g)] : F[at(i + 1 + D, k, g)], c = viaFix ? -3 : -2;
      best = best > NEG / 2 ? best + bon[viaFix ? gapF : D] : NEG;
      for (let d = 1; d < D && i + 1 + d < N && i + 1 + d <= nf; d++) {
        const v = S[at(i + 1 + d, k, g)];
        if (v > NEG / 2 && v + bon[d] > best) { best = v + bon[d]; c = i + 1 + d; }
      }
      E[at(i, k, g)] = best; chE[at(i, k, g)] = c;
    }
    cb.length = 0; cc.length = 0; cg.length = 0;
    if (i === 0 || !M.off[i - 1]) {
      let cost = 0;
      for (let b = i; b < N && b - i < st.max; b++) {
        if (!M.off[b]) { if (!M.take[b]) break; if (++cost > K) break; }
        if (cost && b - i + 1 > cost && b - i + 1 >= st.min && (b === N - 1 || !M.off[b + 1])) { cb.push(b); cc.push(cost); cg.push(b - i + 1 - (M.pre[b + 1] - M.pre[i])); }
      }
    }
    const fs = M.nextFix[i] === i;
    for (let k = 0; k <= K; k++) for (let g = 0; g < G; g++) {
      let best = NEG, bc = -1;
      for (let c = 0; c < cb.length && cc[c] <= k; c++) {
        const len = cb[c] - i + 1, g2 = g && len >= st.long ? g - 1 : g, nx = E[at(cb[c], k - cc[c], g2)];
        const v = cg[c] * BIG - cc[c] * MID + nx;
        if (nx > NEG / 2 && v > best) { best = v; bc = cb[c]; }
      }
      S[at(i, k, g)] = best; chS[at(i, k, g)] = bc;
      F[at(i, k, g)] = Math.max(fs ? E[at(M.fixEnd[i], k, g)] : F[at(i + 1, k, g)], best);
    }
  }
  const chosen = new Uint8Array(N);
  if (F[at(0, K, G - 1)] < NEG / 2) return { value: -1, chosen };
  // Reconstrucción. modo 0: libre; 1: descanso que empieza en i; 2: continuar tras el vecino que termina en i.
  let i = 0, k = K, g = G - 1, value = 0, mode = 0;
  while (i < N) {
    if (mode === 0) {
      if (chS[at(i, k, g)] >= 0 && S[at(i, k, g)] === F[at(i, k, g)]) mode = 1;
      else if (M.nextFix[i] === i) { i = M.fixEnd[i]; mode = 2; }
      else i++;
    } else if (mode === 1) {
      const b = chS[at(i, k, g)];
      if (b < 0) break;
      for (let j = i; j <= b; j++) if (!M.off[j]) { chosen[j] = 1; k--; }
      value += b - i + 1;
      if (g && b - i + 1 >= st.long) g--;
      i = b; mode = 2;
    } else {
      const c = chE[at(i, k, g)];
      if (c === -2) { i = i + 1 + D; mode = 0; }
      else if (c === -3) i = M.fixEnd[M.nextFix[i + 1]];
      else if (c >= 0) { i = c; mode = 1; }
      else break;
    }
  }
  return { value, chosen };
}
function optimize(M, K, st) {
  if (K <= 0) return { value: 0, chosen: new Uint8Array(M.N), want: 0, missing: 0 };
  // «Equilibrado» exige una vacación larga (dos si hay 16 días o más); si no cabe, se relaja y se avisa (want/missing).
  const want = st.long ? Math.max(0, (K >= 16 ? 2 : 1) - M.fixedRuns.filter(L => L >= st.long).length) : 0;
  let need = want, r = solve(M, K, st, need);
  while (r.value < 0 && need > 0) r = solve(M, K, st, --need);
  r.want = want; r.missing = want - need;
  return r;
}

/* Mejores puentes: descansos alrededor de un feriado, ordenados por días libres por día pedido.
   Los días fijados cuentan como días pedidos. `mine` indica que todos sus días ya están en el plan (`chosen` o fijos);
   entre puentes equivalentes (mismo feriado, mismo largo y costo) se muestra el que ya está en el plan. */
function opportunities(M, chosen) {
  const all = [];
  for (let a = 0; a < M.N; a++) {
    if (a > 0 && M.off[a - 1]) continue;
    let cost = 0, hol = false, mine = true;
    for (let b = a; b < M.N && b - a < 12; b++) {
      if (M.fix[b]) { if (++cost > 5) break; }
      else if (!M.off[b]) { if (!M.take[b]) break; if (++cost > 5) break; if (!chosen[b]) mine = false; }
      if (M.holW[b]) hol = true;
      if (cost && hol && (b === M.N - 1 || !M.off[b + 1])) all.push({ a, b, cost, len: b - a + 1, r: (b - a + 1) / cost, mine });
    }
  }
  all.sort((x, y) => y.r - x.r || y.len - x.len || y.mine - x.mine || x.a - y.a);
  const out = [];
  for (const o of all) {
    if (o.r < 2) break;
    if (out.some(p => o.a <= p.b + 1 && o.b >= p.a - 1)) continue;
    out.push(o); if (out.length === 6) break;
  }
  return out.sort((x, y) => x.a - y.a);
}

