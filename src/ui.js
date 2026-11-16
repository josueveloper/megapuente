/* ---------- Pixel art: dibujos hechos con mapas de caracteres ---------- */
const PAL = { Y: '#ffd23f', O: '#fff0a0', o: '#f0a31f', K: '#2a1f3d', W: '#ffffff', G: '#39d98a', g: '#1c9a5c', T: '#c07f45', t: '#8d5527', C: '#5d3a1c', R: '#ff7676', r: '#d8485a', M: '#f6f2d4', m: '#cfc9a3', n: '#b4ad88', p: '#f3b7b0',
  c: 'var(--cloud)', s: 'var(--cloud-s)', B: 'var(--bird)' };
function sprite(rows, cls = '') {
  const w = Math.max(...rows.map(r => r.length)); let r = '';
  rows.forEach((row, y) => { for (let x = 0; x < row.length;) { const c = row[x]; let e = x; while (e < row.length && row[e] === c) e++; if (c !== '.') r += `<rect x="${x}" y="${y}" width="${e - x}" height="1" ${PAL[c][0] === 'v' ? `style="fill:${PAL[c]}"` : `fill="${PAL[c]}"`}/>`; x = e; } });
  return `<svg xmlns="http://www.w3.org/2000/svg" class="spr ${cls}" viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
const pad = (rows, n) => { const e = '.'.repeat(rows[0].length + 2 * n); return [...Array(n).fill(e), ...rows.map(r => '.'.repeat(n) + r + '.'.repeat(n)), ...Array(n).fill(e)]; };
const dots = (size, pts, ch) => { const g = Array.from({ length: size }, () => Array(size).fill('.')); for (const [x, y] of pts) g[y][x] = ch; return g.map(r => r.join('')); };
const frames = (a, b, t) => `<span class="fr" style="--t:${t}s">${sprite(a, 'fa')}${sprite(b, 'fb')}</span>`;   // dos cuadros alternados
const SUN = ['....YYYY....', '..YYOOYYYY..', '.YYOYYYYYYY.', '.YOYYYYYYYY.', 'KKKKKKKKKKKK', 'YKWKKYYKWKKY', 'YYKKKYYKKKYY', 'YYYYYYYYYYYY', '.YYKYYYYKYo.', '.YYYKKKKYoo.', '..YYYYYYoo..', '....YYoo....'];
const SUN_B = SUN.map((r, i) => i === 5 ? 'YKKWKYYKKWKY' : i === 6 ? 'YYKKWYYKKWYY' : r);   // el brillo recorre los lentes
const RAY_A = dots(18, [[8, 0], [9, 0], [8, 1], [9, 1], [8, 16], [9, 16], [8, 17], [9, 17], [0, 8], [0, 9], [1, 8], [1, 9], [16, 8], [16, 9], [17, 8], [17, 9]], 'Y');
const RAY_B = dots(18, [[2, 2], [3, 3], [15, 2], [14, 3], [2, 15], [3, 14], [15, 15], [14, 14]], 'O');
// Luna para el modo oscuro: despierta parpadea (ojos con brillo) y luego se queda dormida un rato, con «z» flotando.
const MOON = ['....MMMM....', '..MMmMMMMM..', '.MMMMMMMMMM.', '.MMMMMMMMmn.', 'MMWKMMMWKMMn', 'MMKKMMMKKMnn', 'MpMMMMMMMpnn', 'MMMKMMMKMMnn', '.MMMKKKMMnn.', '.MMMMMmMnnn.', '..MMMMnnnn..', '....nnnn....'];
const MOON_SHUT = MOON.map((r, i) => i === 4 ? 'MMMMMMMMMMMn' : r);
const ZZ_A = dots(18, [[14, 3], [15, 3], [16, 3], [15, 4], [14, 5], [15, 5], [16, 5]], 'M');
const ZZ_B = dots(18, [[14, 0], [15, 0], [16, 0], [17, 0], [16, 1], [15, 2], [14, 3], [15, 3], [16, 3], [17, 3]], 'M');
const SPARK_A = dots(18, [[2, 1], [1, 2], [2, 2], [3, 2], [2, 3], [15, 15]], 'M');
const SPARK_B = dots(18, [[2, 2], [15, 14], [14, 15], [15, 15], [16, 15], [15, 16]], 'M');
const CLOUD = ['.....cccc.......', '...cccccccc.....', '..cccccccccccc..', '.cccccccccccccc.', 'cccccccccccccccc', 'cccccccccccccccc', '.ssssssssssssss.'];
const CLOUD2 = ['...cccc...', '.cccccccc.', 'cccccccccc', 'cccccccccc', '.ssssssss.'];
const PALM = [
  '......GGGG....GGGG..', '....GGGGGGG.GGGGGGG.', '...GGggGGGGGGGGGggGG', '..GGg..gGGGGGGg..gGG', '.GGg..GGGGGGGGGG..gG', '.Gg..GGggGGGGggGG..G',
  '.G..GGg.gTTTg.gGG...', '....Gg..CTTC...gG...', '...GG...TTt....GG...', '...G....TTt.....G...', '........TTt.........', '.......TTt..........',
  '.......TTt..........', '.......TTt..........', '......TTt...........', '......TTt...........', '......TTt...........', '.....TTTt...........'];
const PALM_B = PALM.map((r, i) => i < 5 ? '.' + r.slice(0, -1) : r);   // las hojas se mecen
const BIRD_A = ['B...B', '.B.B.', '..B..'], BIRD_B = ['.....', 'BB.BB', '..B..'];
const BOAT = ['....K....', '...WK....', '..WWKR...', '.WWWKRR..', 'WWWWK....', '....K....', 'TTTTTTTTT', '.ttttttt.'];
const CRAB_A = ['R.......R', 'RR.....RR', '.RRRRRRR.', '.RKRRRKR.', '.RrrrrrR.', 'R.R...R.R'];
const CRAB_B = ['.........', 'RR.....RR', 'RRRRRRRRR', '.RKRRRKR.', '.RrrrrrR.', '.R.R.R.R.'];
const KIND = len => len >= 9 ? ['k4', 'Vacaciones'] : len >= 6 ? ['k3', 'Megapuente'] : len >= 4 ? ['k2', 'Puente'] : len === 3 ? ['', 'Finde largo'] : ['', 'Día libre'];

/* ---------- Interfaz: configuración ---------- */
const $ = s => document.querySelector(s);
$('#logo').innerHTML = sprite(SUN, '');
{ const l = document.createElement('link'); l.rel = 'icon'; l.href = 'data:image/svg+xml,' + encodeURIComponent(sprite(SUN, '')); document.head.appendChild(l); }
const lawDays = y => y <= 5 ? 10 + 2 * y : 22 + 2 * Math.floor((y - 6) / 5);
const hn = (M, n) => (M.hmap.get(n) || []).map(h => h.name).join(' / ');

function presets() {
  const t = todayDn(), Y = P(t).y;
  return [
    { id: 'rest', l: `Resto de ${Y}`, s: iso(t), e: `${Y}-12-31` },
    { l: `${Y + 1}`, s: `${Y + 1}-01-01`, e: `${Y + 1}-12-31` },
    { l: `${Y + 2}`, s: `${Y + 2}-01-01`, e: `${Y + 2}-12-31` },
    { id: '12m', l: 'Próximos 12 meses', s: iso(t), e: iso(t + 364) },
  ];
}
/* Al abrir la página, un periodo relativo («Resto del año», «Próximos 12 meses») se recalcula con la fecha de hoy,
   y uno de fechas fijas que ya venció se cambia por el periodo por defecto. */
function syncPeriod() {
  const p = state.preset && presets().find(x => x.id === state.preset);
  if (p) { state.start = p.s; state.end = p.e; return; }
  state.preset = null;
  if (fromIso(state.end) < todayDn()) { const d = defaults(); state.start = d.start; state.end = d.end; state.preset = d.preset; }
}
function renderConfig() {
  $('#days').value = state.days;
  $('#start').value = state.start; $('#end').value = state.end;
  const t = todayDn(), from = s => Math.max(fromIso(s), t);   // lo que ya pasó no cuenta: «2027» abierto en 2027 equivale a «Resto de 2027»
  $('#chips').innerHTML = presets().map((p, i) =>
    `<button type="button" class="chip" data-i="${i}" aria-pressed="${from(p.s) === from(state.start) && p.e === state.end}">${p.l}</button>`).join('');
  $('#dows').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(w =>
    `<button type="button" data-w="${w}" aria-pressed="${state.rest.includes(w)}" aria-label="${DOW[w]}">${DOW[w]}</button>`).join('');
  renderHolidays();
}
function holRange() {
  const t = todayDn(), e = fromIso(state.end), s0 = fromIso(state.start), ok = !isNaN(s0) && !isNaN(e) && e >= s0 && e >= t;
  const s = ok ? Math.max(s0, t) : s0;   // los feriados que ya pasaron no cuentan
  const y0 = ok ? P(s).y : P(t).y;
  return { s, e, ok, y0, y1: ok ? P(e).y : y0 };
}
function renderHolidays() {
  const { s, e, ok, y0, y1 } = holRange(), multi = y1 > y0;
  const dates = list => {
    const inR = list.filter(n => !ok || (n >= s && n <= e));
    if (!inR.length) return '<span class="na">no cae en el periodo</span>';
    return inR.map(n => { const r = state.rest.includes(P(n).w); return `<span class="${r ? 'dim' : ''}" title="${r ? 'Cae en tu día de descanso' : ''}">${fmt(n, { year: multi })}</span>`; }).join('<br>');
  };
  const row = r => {
    const list = []; for (let y = y0; y <= y1; y++) { const n = r.f(y); if (n != null) list.push(n); }
    return `<label class="hrow"><input type="checkbox" data-hol="${r.id}" ${holOn(r) ? 'checked' : ''}><span class="hn">${r.name}</span><span class="hd">${dates(list)}</span></label>`;
  };
  $('#hol-off').innerHTML = RULES.filter(r => r.off).map(row).join('');
  $('#hol-opt').innerHTML = RULES.filter(r => !r.off).map(row).join('');
  $('#hol-cus').innerHTML = state.custom.length ? state.custom.map((c, i) =>
    `<div class="hrow" style="cursor:default"><span class="hn">${esc(c.name || 'Día libre de la empresa')}${c.yearly ? ' <small style="color:var(--muted)">(cada año)</small>' : ''}</span><span class="hd">${dates(customDates(c, y0, y1))}</span><button type="button" class="x" data-del="${i}" aria-label="Quitar">X</button></div>`).join('')
    : '<div class="hint" style="margin:4px 0">Cumpleaños, aniversario, cierre de fin de año… También puedes tocar un día en el calendario.</div>';
  updateHolSum();
}
function updateHolSum() {
  const { s, e, ok, y0, y1 } = holRange(), inP = n => !ok || (n >= s && n <= e);
  let a = 0, b = 0;
  for (const r of RULES) if (holOn(r)) for (let y = y0; y <= y1; y++) { const n = r.f(y); if (n != null && inP(n)) r.off ? a++ : b++; }
  for (const c of state.custom) b += customDates(c, y0, y1).filter(inP).length;
  $('#holsum').textContent = `${plural(a, 'oficial', 'oficiales')} · ${b} de tu empresa`;
}

/* ---------- Marcas con deshacer ---------- */
const undoStack = [];
const snap = () => JSON.stringify({ fixed: state.fixed, blocked: state.blocked, custom: state.custom, hol: state.hol });
function mark(fn, msg) {
  undoStack.push(snap()); if (undoStack.length > 40) undoStack.shift();
  fn(); renderHolidays(); render(); toast(msg, true);
}
function undo() {
  const s = undoStack.pop(); if (!s) return;
  Object.assign(state, JSON.parse(s)); renderHolidays(); render(); toast('Cambio deshecho');
}
const setFixed = (k, on) => { state.fixed = state.fixed.filter(x => x !== k); if (on) { state.fixed.push(k); state.blocked = state.blocked.filter(x => x !== k); } };
const setBlocked = (k, on) => { state.blocked = state.blocked.filter(x => x !== k); if (on) { state.blocked.push(k); state.fixed = state.fixed.filter(x => x !== k); } };
let toastT;
function toast(msg, canUndo) {
  const t = $('#toast'); $('#toastmsg').textContent = msg; $('#undo').hidden = !canUndo;
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), canUndo ? 6000 : 2200);
}

/* ---------- Plan ---------- */
function makePlan(M, st) {
  const K = Math.max(0, state.days - M.fixedCount), N = M.N, chosen = optimize(M, K, st).chosen;
  // Descansos finales: rachas de días libres con al menos un día de vacaciones.
  const blocks = [], inB = new Int16Array(N).fill(-1);
  for (let i = 0; i < N;) {
    if (!(M.off[i] || chosen[i])) { i++; continue; }
    let j = i, has = false;
    while (j < N && (M.off[j] || chosen[j])) { if (chosen[j] || M.fix[j]) has = true; j++; }
    if (has) {
      const b = { a: i, b: j - 1, len: j - i, vac: [], hols: [], pinned: true, anyFix: false };
      for (let x = i; x < j; x++) {
        inB[x] = blocks.length;
        if (chosen[x] || M.fix[x]) { b.vac.push(M.p0 + x); if (M.fix[x]) b.anyFix = true; else b.pinned = false; }
        if (M.hmap.has(M.p0 + x)) b.hols.push(M.p0 + x);
      }
      blocks.push(b);
    }
    i = j;
  }
  return {
    chosen, blocks, inB, used: blocks.reduce((a, b) => a + b.vac.length, 0),
    total: blocks.reduce((a, b) => a + b.len, 0), longest: blocks.reduce((a, b) => Math.max(a, b.len), 0),
  };
}

/* Totales de los otros estilos, calculados en segundo plano para poder compararlos. */
let prevKey = '', prevVals = {}, prevTimer = 0;
function schedulePreviews(M) {
  const key = JSON.stringify([state.days, state.start, state.end, state.rest, state.hol, state.custom, state.fixed, state.blocked, M.today]);
  if (key !== prevKey) { prevKey = key; prevVals = {}; }
  prevVals[state.style] = last.total;
  clearTimeout(prevTimer);
  const paint = () => { for (const id in STYLES) { const el = document.querySelector(`[data-sv="${id}"]`); if (el) el.textContent = prevVals[id] != null ? `${prevVals[id]} días` : ''; } };
  paint();
  if (M.N * (Math.max(0, state.days - M.fixedCount) + 1) > 20000) return;
  const step = () => {
    const id = Object.keys(STYLES).find(i => prevVals[i] == null); if (!id) return;
    prevVals[id] = makePlan(M, STYLES[id]).total; paint(); prevTimer = setTimeout(step, 0);
  };
  prevTimer = setTimeout(step, 40);
}

/* ---------- Interfaz: resultados ---------- */
let last = null;
const bird = cls => `<span class="bird ${cls}">${frames(BIRD_A, BIRD_B, .5)}</span>`;
$('#res').innerHTML = `
  <div class="hero intro" id="hero" hidden>
    <div class="skybox">
      <div class="scene" aria-hidden="true">
        <i class="dz d1"></i><i class="dz d2"></i><i class="dz d3"></i>
        <i class="stars s1"></i><i class="stars s2"></i><i class="shoot"></i>
        <div class="cl c1">${sprite(CLOUD)}</div><div class="cl c2">${sprite(CLOUD2)}</div><div class="cl c3">${sprite(CLOUD2)}</div>
        <div class="sunw"><div class="day">${frames(RAY_A, RAY_B, 1.2)}${frames(pad(SUN, 3), pad(SUN_B, 3), 3.2)}</div><div class="night">${frames(SPARK_A, SPARK_B, 1.6)}<div class="zz">${frames(ZZ_A, ZZ_B, 2.4)}</div>${sprite(pad(MOON, 3))}${sprite(pad(MOON_SHUT, 3), 'shut')}</div></div>
        <div class="cl f1">${bird('')}${bird('b2')}</div><div class="cl f2">${bird('')}</div>
      </div>
      <div class="hero-top">
        <div class="hero-n"><span id="h-n">0</span></div>
        <div class="hero-c"><div class="hero-t" id="h-t"></div><div class="hero-s" id="h-s"></div></div>
      </div>
      <div class="huds">
        <span class="hud y"><span id="h-combo"></span><small>días libres por día pedido</small></span>
        <span class="hud"><span id="h-desc"></span><small id="h-long"></small></span>
      </div>
    </div>
    <div class="sea" aria-hidden="true"><i class="glit"></i><div class="cl sail"><span class="boat">${sprite(BOAT)}</span></div></div>
    <div class="beach">
      <div class="palm" aria-hidden="true">${frames(PALM, PALM_B, 2.6)}</div>
      <div class="cl crabw" aria-hidden="true"><span class="crab">${frames(CRAB_A, CRAB_B, .5)}</span></div>
      <div class="tl">
        <div class="tl-track" id="h-tl"></div>
        <div class="tl-lab" id="h-lab"></div>
        <div class="tl-cap"><span><i class="k1"></i>Tus descansos</span><span><i class="k2"></i>Feriados entre semana</span></div>
      </div>
    </div>
  </div>
  <div id="body"></div>`;
// Fuera de pantalla la escena se pausa (y aparece la barra inferior en el celular).
if ('IntersectionObserver' in window) new IntersectionObserver(es => { for (const e of es) { $('#mbar').classList.toggle('away', e.isIntersecting); e.target.classList.toggle('paused', !e.isIntersecting); } }).observe($('#hero'));
setTimeout(() => $('#hero').classList.remove('intro'), 3000);
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
let shownTotal = null, countT = 0;
function setHero(pl, tl, labs) {
  const { total, used, blocks, longest } = pl;
  $('#hero').hidden = false;
  $('#h-t').textContent = `${total === 1 ? 'día' : 'días'} de descanso`;
  $('#h-s').innerHTML = `con <b>${used}</b> de tus ${plural(state.days, 'día', 'días')} de vacaciones`;
  $('#h-combo').textContent = `Combo ${used ? '×' + (total / used).toFixed(1) : '—'}`;
  $('#h-desc').textContent = plural(blocks.length, 'descanso', 'descansos');
  $('#h-long').textContent = longest ? `el más largo, ${longest} días` : 'aún sin plan';
  $('#h-tl').innerHTML = tl; $('#h-lab').innerHTML = labs;
  // El número cuenta hasta el nuevo total y muestra cuánto ganaste o perdiste.
  const el = $('#h-n'), first = shownTotal === null, from = first ? 0 : shownTotal, d = total - from;
  clearInterval(countT); shownTotal = total;
  if (!d || calm) { el.textContent = total; return; }
  const n = Math.min(Math.abs(d), 16); let k = 0;
  countT = setInterval(() => { k++; el.textContent = Math.round(from + d * k / n); if (k >= n) clearInterval(countT); }, first ? 30 : 45);
  if (first) return;
  const box = el.parentNode;
  box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
  const fl = document.createElement('span'); fl.className = 'delta ' + (d > 0 ? 'up' : 'down'); fl.textContent = (d > 0 ? '+' : '-') + Math.abs(d);
  box.appendChild(fl); fl.addEventListener('animationend', () => fl.remove());
}
function setBar(total, used) {
  const b = $('#mbar');
  if (total == null) { b.hidden = true; return; }
  b.hidden = false; $('#mbar-n').textContent = total; $('#mbar-s').textContent = `con ${used} de ${plural(state.days, 'día', 'días')} de vacaciones`;
}
/* Al recalcular cambia el alto de lo que está arriba (avisos, tarjetas del plan). Para que la pantalla no brinque,
   se recuerda dónde estaba el día que se tocó (o, si no hay, la sección visible más cercana al borde superior)
   y después de redibujar se ajusta el scroll para dejarlo exactamente en el mismo lugar. */
function getAnchor() {
  const vh = innerHeight, vis = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh ? r : null; };
  if (popN != null) {
    const sel = `#body [data-n="${popN}"]`, el = document.querySelector(sel), r = el && vis(el);
    if (r) return { sel, top: r.top };
  }
  let best = null;
  for (const el of document.querySelectorAll('#body [data-anchor]')) {
    const r = vis(el);
    if (r && (!best || Math.abs(r.top) < Math.abs(best.top))) best = { sel: `#body [data-anchor="${el.dataset.anchor}"]`, top: r.top };
  }
  return best;
}
function restoreAnchor(a) {
  const el = a && document.querySelector(a.sel); if (!el) return;
  const d = el.getBoundingClientRect().top - a.top;
  if (Math.abs(d) >= 1) window.scrollBy({ top: d, left: 0, behavior: 'instant' });
}
function render() {
  save(); const anchor = getAnchor(); closePop();
  const res = $('#body'), M = build();
  updateHolSum();
  if (M.error) { last = null; clearTimeout(prevTimer); $('#hero').hidden = true; res.innerHTML = `<div class="note" data-k="UPS">${M.error}</div>`; setBar(); return; }
  showYear = P(M.eff).y !== P(M.e).y;
  const pl = makePlan(M, STYLES[state.style]), { chosen, blocks, inB, used, total, longest } = pl, N = M.N;
  last = { M, ...pl };

  const notes = [];
  if (M.fixedCount > state.days) notes.push(['OJO', `Fijaste ${M.fixedCount} días en el calendario, pero solo tienes ${state.days}. Quita algunos o aumenta tus días disponibles.`]);
  else if (state.days > 0 && used < state.days) notes.push(['OJO', `Te sobran ${plural(state.days - used, 'día', 'días')}: con este estilo y periodo no hay más descansos donde usarlos. Prueba otro estilo o amplía el periodo.`]);
  if (state.days === 0) notes.push(['TIP', 'Dime cuántos días de vacaciones tienes y te armo el plan.']);
  if (!RULES.some(r => !r.off && holOn(r)) && !state.custom.length) notes.push(['TIP', '¿Tu empresa da Jueves y Viernes Santo, el 2 de noviembre u otros días? Márcalos en «Feriados de tu empresa» y el plan mejora.']);

  // Resumen con línea de tiempo del periodo (de hoy en adelante: lo que ya pasó no se dibuja)
  const v0 = M.eff, span = M.e - v0 + 1, pct = n => ((n - v0) / span * 100).toFixed(2);
  const months = [];
  for (let y = P(v0).y, m = P(v0).m; y < P(M.e).y || (y === P(M.e).y && m <= P(M.e).m); m === 11 ? (y++, m = 0) : m++) months.push([y, m]);
  let tl = '', labs = '';
  months.forEach(([y, m], k) => {
    const n = Math.max(dn(y, m, 1), v0);
    if (k) tl += `<i class="tl-m" style="left:${pct(n)}%"></i>`;
    if (k === 0 && months.length > 1 && (dn(y, m + 1, 1) - v0) / span < 0.05) return;
    if (months.length <= 14 || k % 2 === 0) labs += `<span style="left:${pct(n)}%">${MON[m]}</span>`;
  });
  for (let i = 0; i < N; i++) { const n = M.p0 + i; if (M.holW[i] && n >= v0 && n <= M.e) tl += `<i class="tl-h" style="left:${pct(n + 0.5)}%" title="${esc(hn(M, n))} · ${fmt(n)}"></i>`; }
  blocks.forEach((b, i) => {
    const n0 = Math.max(M.p0 + b.a, v0), n1 = Math.min(M.p0 + b.b, M.e); if (n1 < n0) return;
    const t = `${fmt(M.p0 + b.a)} → ${fmt(M.p0 + b.b)} · ${plural(b.len, 'día', 'días')}`;
    tl += `<button type="button" class="seg" data-seg="${i}" style="left:${pct(n0)}%;width:${((n1 - n0 + 1) / span * 100).toFixed(2)}%;--i:${i}" title="${t}" aria-label="${t}"></button>`;
  });
  setHero(pl, tl, labs);

  const stylesHtml = `
    <div class="card noprint" data-anchor="styles">
      <h2>Elige tu estilo</h2>
      <div class="styles">${Object.entries(STYLES).map(([id, s]) =>
        `<button type="button" data-s="${id}" aria-pressed="${id === state.style}"><span class="st-n">${s.name}</span><span class="st-v" data-sv="${id}"></span><small>${s.desc}</small></button>`).join('')}</div>
    </div>`;

  const strip = b => { let h = ''; for (let x = b.a; x <= b.b; x++) { const n = M.p0 + x, v = chosen[x] || M.fix[x]; h += `<i class="${v ? 'v' : M.hmap.has(n) ? 'h' : ''}" title="${fmt(n)}">${DOW1[P(n).w]}</i>`; } return h; };
  const planHtml = blocks.length ? `<ol class="plan">${blocks.map((b, i) => `
      <li class="pb" id="pb${i}" data-anchor="b${M.p0 + b.a}">
        <div><div class="num">${b.len}<small>${b.len === 1 ? 'día' : 'días'}</small></div><div class="ratio" title="Días libres por cada día de vacaciones">×${(b.len / b.vac.length).toFixed(1)}</div></div>
        <div>
          <div class="kinds"><span class="kind ${KIND(b.len)[0]}">${KIND(b.len)[1]}</span>${b.pinned ? '<span class="kind pin">Fijado</span>' : b.anyFix ? '<span class="kind pin">Con día fijo</span>' : ''}</div>
          <div class="pt">${fmt(M.p0 + b.a)} <span class="arr">→</span> ${fmt(M.p0 + b.b)}</div>
          <div class="ps">Pide <b>${plural(b.vac.length, 'día', 'días')}</b>: ${fmtList(b.vac)}</div>
          ${b.hols.length ? `<div class="ph">${b.hols.map(n => `${esc(hn(M, n))} (${fmt(n)})`).join(' · ')}</div>` : ''}
          <div class="strip">${strip(b)}</div>
          <div class="pb-a">
            <button type="button" class="tb" data-go="${i}" title="Ver en el calendario">Ver<span class="xs-hide"> en calendario</span></button>
            <button type="button" class="tb" data-pin="${i}" title="${b.pinned ? 'Deja de fijar estos días' : 'Mantener este descanso aunque cambie lo demás'}">${b.pinned ? 'Soltar' : 'Fijar'}</button>
            <button type="button" class="tb" data-drop="${i}" title="No me sirve: proponer otra cosa">Descartar</button>
          </div>
        </div>
      </li>`).join('')}</ol>` : '<div class="empty">Todavía no hay descansos en el plan.</div>';

  // Calendario
  const hasMarks = state.fixed.length || state.blocked.length;
  let cal = '';
  for (const [y, m] of months) {
    const first = dn(y, m, 1), nd = dn(y, m + 1, 1) - first;
    let cells = '<div class="c"></div>'.repeat((P(first).w + 6) % 7);
    for (let d = 0; d < nd; d++) {
      const n = first + d, i = n - M.p0, inModel = i >= 0 && i < N, inRange = n >= M.eff && n <= M.e;
      const r = M.rest.has(P(n).w), h = M.hmap.has(n), cls = ['d'], tip = [];
      if (h) { cls.push('hol'); tip.push(hn(M, n)); } else if (r) cls.push('we');
      if (!inRange) cls.push('out');
      else if (!r && !h) {
        if (M.fix[i]) { cls.push('fix'); tip.push('Vacación fija'); }
        else if (M.blocked.has(n)) { cls.push('blk'); tip.push('No puedes faltar'); }
        else if (chosen[i]) { cls.push('vac'); tip.push('Vacación sugerida'); }
      }
      if (n === M.today) { cls.push('today'); tip.push('Hoy'); }
      const bi = inModel ? inB[i] : -1, ccls = bi >= 0 ? ` b${i === blocks[bi].a ? ' bs' : ''}${i === blocks[bi].b ? ' be' : ''}` : '';
      const t = esc(`${fmt(n, { year: true })}${tip.length ? ' · ' + tip.join(' · ') : ''}`);
      cells += `<div class="c${ccls}"${bi >= 0 ? ` data-b="${bi}"` : ''}>${inRange && !r
        ? `<button type="button" class="${cls.join(' ')}" data-n="${n}" title="${t}" aria-label="${t}">${d + 1}</button>`
        : `<span class="${cls.join(' ')}" title="${t}">${d + 1}</span>`}</div>`;
    }
    cal += `<div class="month" data-anchor="m${y}-${m}"><h4>${MONL[m]} <span>${y}</span></h4><div class="grid">${[1, 2, 3, 4, 5, 6, 0].map(w => `<span class="wd">${DOW1[w]}</span>`).join('')}${cells}</div></div>`;
  }

  // Mejores puentes
  const opps = opportunities(M);
  const oppHtml = opps.length ? `<ul class="opps">${opps.map(o => {
    const vac = [], names = [];
    for (let x = o.a; x <= o.b; x++) { if (!M.off[x]) vac.push(M.p0 + x); if (M.holW[x]) names.push(hn(M, M.p0 + x)); }
    const inPlan = vac.every(n => chosen[n - M.p0]);
    return `<li><div><b>${plural(o.cost, 'día', 'días')} → ${o.len} días libres</b> · ${fmt(M.p0 + o.a)} – ${fmt(M.p0 + o.b)}<div class="sub">Pide ${fmtList(vac)} · ${esc([...new Set(names)].join(', '))}</div></div>
      ${inPlan ? '<span class="tag">En tu plan</span>' : `<button type="button" class="btn" data-opp="${vac.join(',')}">Agregar</button>`}</li>`;
  }).join('')}</ul>` : '<div class="empty">No hay feriados entre semana en este periodo que se puedan aprovechar.</div>';

  res.innerHTML = `
    ${notes.map(([k, n]) => `<div class="note" data-k="${k}">${n}</div>`).join('')}
    ${stylesHtml}
    <div class="card" id="plan" data-anchor="plan">
      <div class="head"><div><h2>Tu plan</h2><span class="per">${fmt(v0, { noDow: true, year: true })} – ${fmt(M.e, { noDow: true, year: true })}</span></div>
        <div class="row"><button type="button" class="btn" id="copy" ${blocks.length ? '' : 'disabled'}>Copiar</button><button type="button" class="btn" id="ics" ${blocks.length ? '' : 'disabled'}>Exportar ICS</button><button type="button" class="btn" id="print">Imprimir</button></div></div>
      ${planHtml}
    </div>
    <div class="card" data-anchor="cal">
      <div class="head"><h2>Calendario</h2>${hasMarks ? '<button type="button" class="link" id="clear">Quitar mis marcas</button>' : ''}</div>
      <div class="legend">
        <span><i class="lg vac"></i>Vacación sugerida</span>
        <span><i class="lg fix"></i>Vacación fija</span>
        <span><i class="lg hol"></i>Feriado</span>
        <span><i class="lg band"></i>Descanso completo</span>
        <span><i class="lg blk"></i>No puedo faltar</span>
      </div>
      <div class="hint noprint">Toca un día para fijarlo como vacación, marcar que no puedes faltar o agregarlo como día libre de tu empresa. El plan se recalcula solo.</div>
      <div class="months" id="cal">${cal}</div>
    </div>
    <div class="card noprint" data-anchor="opps">
      <h2>Top puentes del periodo</h2>
      ${oppHtml}
    </div>
    <details class="how"><summary>¿Cómo se calcula?</summary>
      <p>Un descanso es una racha de días libres seguidos (fines de semana, feriados y vacaciones) que incluye al menos un día de vacaciones. La página prueba todas las combinaciones posibles y elige la que suma más días de descanso con tus días disponibles, respetando el estilo que elegiste; si varios planes dan lo mismo, prefiere el que gasta menos días y reparte mejor los descansos a lo largo del periodo.</p>
      <p>Los feriados oficiales son los del artículo 74 de la Ley Federal del Trabajo. El mínimo de vacaciones por antigüedad corresponde a la reforma vigente desde 2023. Todo se guarda solo en este navegador.</p>
    </details>
    <div class="foot">Hecho con ☕ para quienes ya quieren puente.</div>`;
  restoreAnchor(anchor);
  setBar(total, used);
  $('#live').textContent = `${total} días de descanso con ${used} días de vacaciones.`;
  schedulePreviews(M);
}
function flash(sel) {
  const els = document.querySelectorAll(sel); if (!els.length) return;
  els[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.forEach(x => { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); });
}

/* ---------- Menú de un día del calendario ---------- */
const pop = $('#pop'), popbg = $('#popbg');
let popN = null, popY = 0;
function closePop() { pop.hidden = true; popbg.hidden = true; popN = null; }
function openPop(btn) {
  if (!last) return;
  const { M, chosen } = last, n = +btn.dataset.n, i = n - M.p0, hol = M.hmap.get(n);
  const opt = (act, arg, sw, title, sub, on) => `<button type="button" class="po${on ? ' on' : ''}" data-act="${act}" data-arg="${esc(arg)}"><i class="sw ${sw}"></i><span><b>${title}</b><small>${sub}</small></span>${on ? '<em>OK</em>' : ''}</button>`;
  let status, o;
  if (hol) {
    status = `Feriado · ${esc(hn(M, n))}`;
    o = hol.map(h => h.src === 'custom'
      ? opt('delc', h.idx, 'x', 'Quitar este día libre', esc(h.name), false)
      : opt('unrule', h.id, 'x', 'Mi empresa no lo da', `Desmarcar «${esc(h.name)}»`, false)).join('');
  } else {
    const fx = M.fix[i], bl = M.blocked.has(n), sg = chosen[i];
    status = fx ? 'Vacación fija' : bl ? 'No puedes faltar' : sg ? 'Vacación sugerida' : 'Día laboral';
    o = opt('fix', '', 'vac', fx ? 'Vacación fija' : sg ? 'Fijar esta vacación' : 'Tomar vacación', fx ? 'Toca para soltarla' : 'Se queda en tu plan aunque cambie lo demás', fx)
      + opt('block', '', 'blk', 'No puedo faltar', bl ? 'Toca para quitar la marca' : 'No sugerir vacaciones este día', bl)
      + opt('hol', '', 'hol', 'Mi empresa lo da libre', 'Agregarlo como feriado', false);
  }
  pop.innerHTML = `<div class="pop-h"><div><b>${fmt(n, { year: true })}</b><span>${status}</span></div><button type="button" class="x" data-act="close" aria-label="Cerrar">X</button></div>${o}`;
  popN = n; popY = scrollY;
  const sheet = matchMedia('(max-width:640px)').matches;
  pop.classList.toggle('sheet', sheet); popbg.hidden = !sheet; pop.hidden = false;
  if (sheet) { pop.style.left = pop.style.top = ''; }
  else {
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let y = r.bottom + 8; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    pop.style.top = y + 'px';
  }
  const f = pop.querySelector('.po'); if (f) f.focus({ preventScroll: true });
}
const refocusDay = n => { const b = document.querySelector(`button[data-n="${n}"]`); if (b) b.focus({ preventScroll: true }); };
pop.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, arg = b.dataset.arg, n = popN, k = iso(n), on = b.classList.contains('on');
  if (act === 'close') { closePop(); refocusDay(n); return; }
  if (act === 'fix') mark(() => setFixed(k, !on), on ? 'Vacación soltada' : 'Vacación fijada');
  else if (act === 'block') mark(() => setBlocked(k, !on), on ? 'Marca quitada' : 'Ese día no se te sugerirá');
  else if (act === 'hol') mark(() => {
    setFixed(k, false); setBlocked(k, false);
    state.custom.push({ date: k, name: 'Día libre de la empresa', yearly: false });
    state.custom.sort((a, b) => a.date.localeCompare(b.date));
  }, 'Día libre agregado');
  else if (act === 'delc') mark(() => state.custom.splice(+arg, 1), 'Día libre quitado');
  else if (act === 'unrule') mark(() => { state.hol[arg] = false; }, 'Feriado desmarcado');
  refocusDay(n);
});
popbg.addEventListener('click', closePop);
document.addEventListener('click', e => { if (!pop.hidden && !e.target.closest('#pop') && !e.target.closest('button[data-n]')) closePop(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !pop.hidden) { const n = popN; closePop(); refocusDay(n); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && undoStack.length && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
});
window.addEventListener('scroll', () => { if (!pop.hidden && !pop.classList.contains('sheet') && Math.abs(scrollY - popY) > 60) closePop(); }, { passive: true });
window.addEventListener('resize', closePop);

/* ---------- Exportar ---------- */
function planText() {
  const { M, blocks, used, total } = last;
  const L = [`Plan de vacaciones · ${fmt(M.eff, { noDow: true, year: true })} – ${fmt(M.e, { noDow: true, year: true })}`,
    `${plural(used, 'día', 'días')} de vacaciones → ${total} días de descanso`, ''];
  blocks.forEach((b, i) => {
    L.push(`${i + 1}) ${fmt(M.p0 + b.a)} → ${fmt(M.p0 + b.b)} (${plural(b.len, 'día', 'días')})`);
    L.push(`   Pedir: ${fmtList(b.vac)}`);
    if (b.hols.length) L.push(`   Feriados: ${b.hols.map(n => `${hn(M, n)} (${fmt(n)})`).join(', ')}`);
  });
  return L.join('\n');
}
function planIcs() {
  const { M, blocks } = last, c = n => iso(n).replace(/-/g, ''), e = s => s.replace(/([,;\\])/g, '\\$1');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Optimizador de vacaciones//ES', 'CALSCALE:GREGORIAN'];
  blocks.forEach((b, i) => L.push('BEGIN:VEVENT', `UID:descanso-${c(M.p0 + b.a)}-${i}@optimizador-vacaciones`,
    `DTSTAMP:${c(M.today)}T000000Z`, `DTSTART;VALUE=DATE:${c(M.p0 + b.a)}`, `DTEND;VALUE=DATE:${c(M.p0 + b.b + 1)}`,
    `SUMMARY:${e(`Descanso de ${b.len} días (pedir ${b.vac.length})`)}`,
    `DESCRIPTION:${e(`Días de vacaciones a pedir: ${fmtList(b.vac)}`)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT'));
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast('Plan copiado');
}

/* ---------- Eventos ---------- */
const setDays = v => { state.days = Math.max(0, Math.min(60, Math.round(+v) || 0)); $('#days').value = state.days; $('#anti').value = ''; render(); };
$('#anti').innerHTML = '<option value="">elige tus años en la empresa…</option>' + Array.from({ length: 35 }, (_, i) => `<option value="${i + 1}">${plural(i + 1, 'año', 'años')} → ${lawDays(i + 1)} días</option>`).join('');
$('#anti').addEventListener('change', e => { if (e.target.value) { state.days = lawDays(+e.target.value); $('#days').value = state.days; render(); } });
$('#days').addEventListener('input', e => { if (e.target.value !== '') { state.days = Math.max(0, Math.min(60, Math.round(+e.target.value) || 0)); render(); } });
$('#days').addEventListener('change', e => setDays(e.target.value));
$('#days').addEventListener('focus', e => e.target.select());
$('#minus').addEventListener('click', () => setDays(state.days - 1));
$('#plus').addEventListener('click', () => setDays(state.days + 1));
const periodChanged = () => { renderConfig(); render(); };
$('#start').addEventListener('change', e => { state.start = e.target.value; state.preset = null; periodChanged(); });
$('#end').addEventListener('change', e => { state.end = e.target.value; state.preset = null; periodChanged(); });
$('#chips').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const p = presets()[+b.dataset.i]; state.start = p.s; state.end = p.e; state.preset = p.id || null; periodChanged(); });
$('#dows').addEventListener('click', e => {
  const b = e.target.closest('[data-w]'); if (!b) return; const w = +b.dataset.w;
  state.rest = state.rest.includes(w) ? state.rest.filter(x => x !== w) : [...state.rest, w];
  periodChanged();
});
document.addEventListener('change', e => { const id = e.target.dataset && e.target.dataset.hol; if (id) { state.hol[id] = e.target.checked; render(); } });
$('#hol-cus').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; mark(() => state.custom.splice(+b.dataset.del, 1), 'Día libre quitado'); });
$('#addh').addEventListener('submit', e => {
  e.preventDefault(); const date = $('#cdate').value; if (!date) return;
  state.custom.push({ date, name: $('#cname').value.trim(), yearly: $('#cyear').checked });
  state.custom.sort((a, b) => a.date.localeCompare(b.date));
  $('#cname').value = ''; $('#cdate').value = ''; $('#cyear').checked = false;
  renderHolidays(); render(); toast('Día libre agregado');
});
$('#reset').addEventListener('click', () => { if (confirm('¿Borrar tus datos y empezar de nuevo?')) { try { localStorage.removeItem(KEY); } catch (e) {} state = defaults(); undoStack.length = 0; renderConfig(); render(); } });
$('#undo').addEventListener('click', undo);
$('#mbar-go').addEventListener('click', () => { const p = $('#hero'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#res').addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let b;
  if ((b = q('button[data-n]'))) { openPop(b); return; }
  if ((b = q('[data-s]'))) {
    state.style = b.dataset.s; render();
    const again = document.querySelector(`[data-s="${state.style}"]`); if (again) again.focus({ preventScroll: true });
    return;
  }
  if (!last) return;
  const { M, blocks } = last;
  if ((b = q('[data-seg]'))) { flash(`#pb${b.dataset.seg}`); return; }
  if ((b = q('[data-go]'))) { flash(`.c[data-b="${b.dataset.go}"]`); return; }
  if ((b = q('[data-pin]'))) {
    const bl = blocks[+b.dataset.pin], ks = bl.vac.map(iso), on = !bl.pinned;
    mark(() => ks.forEach(k => setFixed(k, on)), on ? 'Descanso fijado' : 'Descanso soltado'); return;
  }
  if ((b = q('[data-drop]'))) {
    // Se bloquean sus días y el día laboral de cada lado, para que no reaparezca el mismo puente recorrido.
    const bl = blocks[+b.dataset.drop], ks = bl.vac.map(iso);
    for (const x of [bl.a - 1, bl.b + 1]) if (x >= 0 && x < M.N && M.take[x]) ks.push(iso(M.p0 + x));
    mark(() => ks.forEach(k => setBlocked(k, true)), 'Descanso descartado'); return;
  }
  if ((b = q('[data-opp]'))) { const ks = b.dataset.opp.split(',').map(n => iso(+n)); mark(() => ks.forEach(k => setFixed(k, true)), 'Puente agregado a tu plan'); return; }
  if (e.target.id === 'clear') { mark(() => { state.fixed = []; state.blocked = []; }, 'Marcas quitadas'); return; }
  if (e.target.id === 'copy') { copyText(planText()); return; }
  if (e.target.id === 'print') { window.print(); return; }
  if (e.target.id === 'ics') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([planIcs()], { type: 'text/calendar' }));
    a.download = 'vacaciones.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});

$('#holcard').open = matchMedia('(min-width:901px)').matches;
syncPeriod();
renderConfig();
render();
window.__vac = { planText: () => last ? planText() : '', planIcs: () => last ? planIcs() : '', state: () => state };
})();
</script>
</body>
</html>
