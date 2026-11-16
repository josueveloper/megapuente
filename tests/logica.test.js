// Pruebas del cálculo (src/logic.js). Uso: node tests/logica.test.js [casos de fuerza bruta, por defecto 300]
const assert = require('assert'), load = require('./harness.js');
let fallas = 0;
const prueba = (nombre, fn) => { try { fn(); console.log('  ok  ' + nombre); } catch (e) { fallas++; console.log('FALLA ' + nombre + '\n      ' + String(e.message).split('\n').join('\n      ')); } };

/* Días de descanso y de vacaciones de un plan, contados desde cero (sin usar el optimizador). */
function totales(M, chosen) {
  let tot = 0, used = 0; const rachas = [];
  for (let i = 0; i < M.N;) {
    if (!(M.off[i] || chosen[i])) { i++; continue; }
    let j = i, c = 0, f = false;
    while (j < M.N && (M.off[j] || chosen[j])) { if (chosen[j]) c++; if (M.fix[j]) f = true; j++; }
    if (c || f) tot += j - i;
    if (c) rachas.push({ len: j - i, c, a: i, b: j - 1 });
    used += c; i = j;
  }
  return { tot, used, rachas };
}
/* Mejor plan probando todas las combinaciones de días (solo sirve para periodos cortos). */
function fuerzaBruta(M, K, st, need) {
  const idx = []; for (let i = 0; i < M.N; i++) if (M.take[i]) idx.push(i);
  let best = null; const chosen = new Uint8Array(M.N);
  const rec = (p, k) => {
    if (p === idx.length) {
      const t = totales(M, chosen); let largas = 0;
      for (const r of t.rachas) { if (r.len < st.min || r.len > st.max || r.len <= r.c) return; if (st.long && r.len >= st.long) largas++; }
      if (largas < need) return;
      if (!best || t.tot > best.tot || (t.tot === best.tot && t.used < best.used)) best = { tot: t.tot, used: t.used };
      return;
    }
    rec(p + 1, k);
    if (k > 0) { chosen[idx[p]] = 1; rec(p + 1, k - 1); chosen[idx[p]] = 0; }
  };
  rec(0, K);
  return best;
}
const plan = (L, estado, estilo) => {
  L.setState({ ...L.defaults(), ...estado });
  const M = L.build(), K = Math.max(0, L.getState().days - M.fixedCount), r = L.optimize(M, K, L.STYLES[estilo || L.getState().style]);
  return { M, r, ...totales(M, r.chosen), pedir: [...r.chosen].map((v, i) => (v ? L.iso(M.p0 + i) : null)).filter(Boolean) };
};

console.log('Feriados y fechas');
prueba('feriados oficiales y Semana Santa de 2024 a 2030', () => {
  const L = load(), f = (id, y) => { const n = L.RULES.find(r => r.id === id).f(y); return n == null ? null : L.iso(n); };
  assert.deepStrictEqual([2024, 2025, 2026, 2027, 2028].map(y => f('const', y)), ['2024-02-05', '2025-02-03', '2026-02-02', '2027-02-01', '2028-02-07']);
  assert.deepStrictEqual([2024, 2026, 2027].map(y => f('juarez', y)), ['2024-03-18', '2026-03-16', '2027-03-15']);
  assert.deepStrictEqual([2024, 2026, 2027].map(y => f('rev', y)), ['2024-11-18', '2026-11-16', '2027-11-15']);
  assert.deepStrictEqual([2024, 2025, 2026, 2027, 2028, 2030].map(y => f('vsanto', y)), ['2024-03-29', '2025-04-18', '2026-04-03', '2027-03-26', '2028-04-14', '2030-04-19']);
  assert.deepStrictEqual([2024, 2025, 2026, 2027, 2030].map(y => f('eleccion', y)), ['2024-06-02', null, null, '2027-06-06', '2030-06-02']);
  assert.deepStrictEqual([2024, 2027, 2030].map(y => f('poder', y)), ['2024-10-01', null, '2030-10-01']);
});
prueba('un día libre que se repite el 29 de febrero solo cae en años bisiestos', () => {
  const L = load();
  assert.deepStrictEqual(L.customDates({ date: '2024-02-29', yearly: true }, 2027, 2028).map(L.iso), ['2028-02-29']);
});

console.log('Plan');
prueba('2027 con 12 días: totales por estilo', () => {
  const L = load(), y = { start: '2027-01-01', end: '2027-12-31', days: 12 };
  assert.deepStrictEqual(['mix', 'puentes', 'escapadas', 'largas'].map(s => { const p = plan(L, y, s); return [p.tot, p.used]; }), [[37, 12], [41, 12], [29, 12], [27, 12]]);
});
prueba('no sugiere pedir el día de hoy, pero sí se puede fijar a mano', () => {
  const L = load({ hoy: [2026, 11, 20] });   // viernes
  const p = plan(L, { start: '2026-11-20', end: '2026-12-31', days: 3 }, 'puentes');
  assert.ok(!p.pedir.includes('2026-11-20'), 'pidió hoy: ' + p.pedir);
  assert.ok(p.pedir.every(d => d > '2026-11-20'));
  const q = plan(L, { start: '2026-11-20', end: '2026-12-31', days: 3, fixed: ['2026-11-20'] }, 'puentes');
  assert.strictEqual(q.M.fixedCount, 1);
});
prueba('un periodo que empezó hace meses se calcula de hoy en adelante', () => {
  const L = load({ hoy: [2026, 11, 16] }), p = plan(L, { start: '2026-01-15', end: '2026-12-31', days: 6 }, 'puentes');
  assert.strictEqual(L.iso(p.M.eff), '2026-11-16');
  assert.ok(p.pedir.length && p.pedir.every(d => d > '2026-11-16'));
});
prueba('errores de periodo', () => {
  const L = load();
  const err = s => { L.setState({ ...L.defaults(), ...s }); return L.build().error || ''; };
  assert.match(err({ start: '', end: '2027-01-01' }), /dos fechas/);
  assert.match(err({ start: '2027-02-01', end: '2027-01-01' }), /posterior/);
  assert.match(err({ start: '2025-01-01', end: '2025-12-31' }), /ya pasó/);
  assert.match(err({ start: '2027-01-01', end: '2030-01-01' }), /dos años/);
});

prueba('«Equilibrado» avisa cuántas vacaciones largas quería y cuántas no cupieron', () => {
  const L = load(), y = { start: '2027-01-01', end: '2027-12-31' }, wm = (estado, estilo) => { const { r } = plan(L, estado, estilo); return [r.want, r.missing]; };
  assert.deepStrictEqual(wm({ ...y, days: 12 }, 'mix'), [1, 0]);
  assert.deepStrictEqual(wm({ ...y, days: 16 }, 'mix'), [2, 0]);
  assert.deepStrictEqual(wm({ ...y, days: 1 }, 'mix'), [1, 1]);
  assert.deepStrictEqual(wm({ days: 16, start: '2027-06-07', end: '2027-06-18' }, 'mix'), [2, 1]);
  assert.deepStrictEqual(wm({ ...y, days: 1 }, 'puentes'), [0, 0]);
  assert.deepStrictEqual(wm({ ...y, days: 0 }, 'mix'), [0, 0]);
});

console.log('Top puentes');
prueba('entre puentes equivalentes muestra el que ya está en el plan', () => {
  const L = load(), { M, r } = plan(L, { start: '2027-01-01', end: '2027-12-31', days: 12 }, 'mix'), o = L.opportunities(M, r.chosen);
  assert.strictEqual(o.length, 5);
  assert.ok(o.every(x => x.mine), 'el plan aprovecha los cinco feriados, pero alguno sale como pendiente');
  assert.deepStrictEqual(o.map(x => [x.cost, x.len]), [[1, 4], [1, 4], [1, 4], [1, 4], [1, 4]]);
  const libres = L.opportunities(M, new Uint8Array(M.N));
  assert.ok(libres.length === 5 && libres.every(x => !x.mine), 'sin plan, ninguno está «en tu plan»');
});
prueba('un día fijado cuenta como día pedido', () => {
  const L = load(), { M, r } = plan(L, { start: '2027-01-01', end: '2027-12-31', days: 12, fixed: ['2027-01-29'] }, 'mix');
  const feb = L.opportunities(M, r.chosen).find(x => L.iso(M.p0 + x.b) >= '2027-02-01' && L.iso(M.p0 + x.a) <= '2027-02-01');
  assert.deepStrictEqual([L.iso(M.p0 + feb.a), L.iso(M.p0 + feb.b), feb.cost, feb.len, feb.mine], ['2027-01-29', '2027-02-01', 1, 4, true]);
});

console.log('Estado guardado y enlace para compartir');
prueba('un estado dañado se limpia en vez de romper', () => {
  const L = load(), d = L.defaults();
  assert.deepStrictEqual(L.sanitize({}), { ...d });
  const s = L.sanitize({ days: 'abc', start: 5, rest: 'x', style: 'constructor', hol: null, custom: [null, { date: 'x' }, { date: '2027-05-05', name: 7, yearly: 1 }], fixed: 5, blocked: [1, '2027-02-30x', '2027-03-04', '2027-03-04'] });
  assert.deepStrictEqual(s, { ...d, custom: [{ date: '2027-05-05', name: '', yearly: true }], blocked: ['2027-03-04'] });
  assert.deepStrictEqual(L.sanitize({ days: 99.6, rest: [6, 6, 9, '0', 0], hol: { jsanto: true, navidad: 'no', inventado: true } }), { ...d, days: 60, rest: [6, 0], hol: { jsanto: true } });
  assert.strictEqual(L.sanitize({ start: '2027-01-01', end: '2027-06-30' }).preset, null, 'lo guardado sin «preset» conserva sus fechas');
  assert.strictEqual(L.sanitize({ preset: 'rest' }).preset, 'rest');
});
prueba('las marcas de días que ya pasaron se descartan (hoy y lo futuro se conservan)', () => {
  const L = load({ hoy: [2026, 11, 16] }), s = L.sanitize({ fixed: ['2026-03-13', '2026-11-15', '2026-11-16', '2027-01-05'], blocked: ['2025-12-24', '2028-02-01'] });
  assert.deepStrictEqual([s.fixed, s.blocked], [['2026-11-16', '2027-01-05'], ['2028-02-01']]);
});
prueba('lo que hay en localStorage se lee ya limpio', () => {
  assert.strictEqual(load({ guardado: { days: 20, fixed: 5, custom: null } }).getState().days, 20);
  assert.deepStrictEqual(load({ guardado: { days: 20, fixed: 5, custom: null } }).getState().fixed, []);
  for (const malo of ['{mal json', '[]', '"hola"', 'null']) { const L = load({ guardado: malo }); assert.deepStrictEqual(L.getState(), malo === '[]' ? L.sanitize([]) : L.defaults()); }
});
prueba('el enlace conserva el plan (acentos y emojis incluidos) y uno dañado se descarta', () => {
  const L = load(), est = L.sanitize({ days: 15, start: '2027-01-01', end: '2027-12-31', rest: [0], style: 'escapadas', hol: { jsanto: true, navidad: false }, custom: [{ date: '2027-08-20', name: 'Cumpleaños de la señora Ñ 🎂', yearly: true }], fixed: ['2027-03-04'], blocked: ['2027-03-05'] });
  L.setState(est);
  const code = L.shareCode();
  assert.match(code, /^[\w-]+$/);
  assert.deepStrictEqual(L.fromShareCode(code), est);
  L.setState({ ...est, rest: [], preset: '12m' });
  assert.deepStrictEqual([L.fromShareCode(L.shareCode()).rest, L.fromShareCode(L.shareCode()).preset], [[], '12m']);
  for (const malo of ['', '%%%', 'bnVsbA', 'abc']) assert.strictEqual(L.fromShareCode(malo), null);
});
prueba('save() escribe el estado actual en localStorage', () => {   // que no guarde mientras se ve un plan compartido se prueba en ui.test.js
  const L = load({ guardado: { days: 7 } });
  L.setState({ ...L.getState(), days: 30 }); L.save();
  assert.strictEqual(JSON.parse(L.store.get('optimizador-vacaciones-mx-v1')).days, 30);
});

console.log('Optimizador contra fuerza bruta');
prueba('mismo total de descanso y de días gastados que probando todas las combinaciones', () => {
  const L = load(), casos = +process.argv[2] || 300;
  let seed = 20261116; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const descansos = [[0, 6], [0, 6], [0, 6], [0], [0, 1], [5, 6]];
  let n = 0;
  for (let t = 0; t < casos; t++) {
    const s = L.dn(2027, ri(0, 11), ri(1, 28)), e = s + ri(8, 24);
    const st0 = { ...L.defaults(), days: ri(0, 6), start: L.iso(s), end: L.iso(e), rest: descansos[ri(0, descansos.length - 1)], custom: [], fixed: [], blocked: [] };
    for (let x = ri(0, 3); x > 0; x--) st0.custom.push({ date: L.iso(ri(s - 3, e + 3)), name: 'x', yearly: false });
    for (let x = ri(0, 3); x > 0; x--) st0.fixed.push(L.iso(ri(s, e)));
    for (let x = ri(0, 4); x > 0; x--) st0.blocked.push(L.iso(ri(s, e)));
    st0.fixed = [...new Set(st0.fixed)]; st0.blocked = st0.blocked.filter(k => !st0.fixed.includes(k));
    L.setState(st0);
    const M = L.build(), K = Math.max(0, st0.days - M.fixedCount), base = totales(M, new Uint8Array(M.N)).tot;
    for (const st of [L.STYLES.mix, L.STYLES.puentes, L.STYLES.escapadas, L.STYLES.largas, { min: 2, max: 4 }, { min: 3, max: 12, long: 6 }, { min: 1, max: 30 }]) {
      n++;
      const r = L.optimize(M, K, st), got = totales(M, r.chosen), ctx = () => JSON.stringify({ st, K, estado: st0 });
      assert.ok(got.used <= K, 'gasta más días de los que hay ' + ctx());
      for (let i = 0; i < M.N; i++) assert.ok(!r.chosen[i] || M.take[i], 'eligió un día que no se puede pedir ' + ctx());
      for (const x of got.rachas) assert.ok(x.len >= st.min && x.len <= st.max && x.len > x.c, 'descanso fuera del estilo ' + ctx());
      let need = st.long ? Math.max(0, (K >= 16 ? 2 : 1) - M.fixedRuns.filter(l => l >= st.long).length) : 0, b = null;
      if (K > 0) { b = fuerzaBruta(M, K, st, need); while (!b && need > 0) b = fuerzaBruta(M, K, st, --need); }
      b = b || { tot: base, used: 0 };
      assert.deepStrictEqual([got.tot, got.used], [b.tot, b.used], 'no es el óptimo ' + ctx());
    }
  }
  console.log(`      ${n} combinaciones de periodo y estilo`);
});

console.log(fallas ? `\n${fallas} prueba(s) con fallas` : '\nTodo bien');
process.exit(fallas ? 1 : 0);
