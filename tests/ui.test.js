// Pruebas de la página en Chromium (Playwright) con la fecha simulada. Uso: node tests/ui.test.js
// Abre index.html, así que antes hay que reconstruirlo: python src/build.py
const path = require('path'), fs = require('fs'), assert = require('assert');
const TOOLS = process.env.TOOLS_DIR || '/workspace/.tools';
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(TOOLS, 'browser/pw-browsers');
  const arch = require('os').arch() === 'arm64' ? 'aarch64-linux-gnu' : 'x86_64-linux-gnu';
  process.env.LD_LIBRARY_PATH = ['libs/usr/lib/' + arch, 'libs/lib/' + arch].map(d => path.join(TOOLS, d)).filter(fs.existsSync).concat(process.env.LD_LIBRARY_PATH || []).join(':');
  ({ chromium } = require(path.join(TOOLS, 'browser/node_modules/playwright')));
}
const PAGE = 'file://' + path.resolve(__dirname, '../index.html'), KEY = 'optimizador-vacaciones-mx-v1';
const DESK = { width: 1280, height: 900 }, PHONE = { width: 390, height: 844 };
const HOY = '2026-11-16T10:00:00-06:00';   // lunes 16 nov 2026 (feriado), hora de Ciudad de México

let browser, fallas = 0; const pruebas = [];
const prueba = (nombre, fn) => pruebas.push([nombre, fn]);

/* Abre la página. guardado: lo que hay en localStorage antes de cargar; hoy: fecha simulada; url: p. ej. un enlace compartido. */
async function abrir({ guardado, hoy = HOY, movil = false, url = PAGE, ctx } = {}) {
  ctx = ctx || await browser.newContext({ timezoneId: 'America/Mexico_City', viewport: movil ? PHONE : DESK, isMobile: movil, hasTouch: movil });
  const p = await ctx.newPage(); p.errores = [];
  p.on('pageerror', e => p.errores.push(e.message)); p.on('console', m => m.type() === 'error' && p.errores.push(m.text()));
  await p.clock.setFixedTime(new Date(hoy));
  if (guardado !== undefined) await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('sembrado')) { sessionStorage.setItem('sembrado', '1'); localStorage.setItem(k, v); } }, [KEY, typeof guardado === 'string' ? guardado : JSON.stringify(guardado)]);
  await p.goto(url); await p.waitForTimeout(250);
  return p;
}
const ver = p => p.evaluate(() => ({
  estado: __vac.state(), guardado: JSON.parse(localStorage.getItem('optimizador-vacaciones-mx-v1')),
  periodo: document.querySelector('.per')?.textContent || '', meses: document.querySelectorAll('.month').length, primerMes: document.querySelector('.month h4')?.textContent || '',
  chip: [...document.querySelectorAll('.chip[aria-pressed=true]')].map(c => c.textContent).join(','), feriados: document.querySelector('#holsum').textContent,
  notas: [...document.querySelectorAll('.note')].map(x => x.textContent), plan: __vac.planText(), heroOculto: document.querySelector('#hero').hidden,
  puentes: [...document.querySelectorAll('.opps li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), toast: document.querySelector('#toastmsg').textContent,
  estilos: [...document.querySelectorAll('.styles button')].map(b => b.querySelector('small').textContent), hash: location.hash,
}));
const A2027 = { days: 12, start: '2027-01-01', end: '2027-12-31' };

prueba('carga por defecto sin errores ni desborde (escritorio y celular)', async () => {
  for (const movil of [false, true]) {
    const p = await abrir({ movil }), v = await ver(p);
    assert.deepStrictEqual(p.errores, []);
    assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, 'desborde horizontal');
    assert.strictEqual(v.periodo, '1 ene 2027 – 31 dic 2027'); assert.strictEqual(v.chip, '2027'); assert.strictEqual(v.meses, 12);
    assert.match(v.plan, /12 días de vacaciones → 37 días de descanso/);
  }
});
prueba('metadatos para publicar', async () => {
  const p = await abrir();
  const m = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('meta[name],meta[property]')].map(x => [x.getAttribute('name') || x.getAttribute('property'), x.content])));
  for (const k of ['description', 'theme-color', 'og:title', 'og:description', 'og:type', 'og:locale', 'twitter:card']) assert.ok(m[k], 'falta ' + k);
});
prueba('no sugiere pedir el día de hoy; fijarlo a mano sí funciona', async () => {
  const p = await abrir({ hoy: '2026-11-20T18:00:00-06:00', guardado: { days: 3, start: '2026-11-20', end: '2026-12-31', style: 'puentes' } });
  assert.doesNotMatch((await ver(p)).plan, /Pedir: vie 20 nov/);
  await p.locator('button.today[data-n]').click(); await p.locator('#pop [data-act="fix"]').click(); await p.waitForTimeout(150);
  assert.match((await ver(p)).plan, /Pedir: vie 20 nov/);
});
prueba('un periodo guardado hace meses se dibuja de hoy en adelante', async () => {
  const p = await abrir({ guardado: { days: 12, start: '2026-01-15', end: '2026-12-31' } }), v = await ver(p);
  assert.strictEqual(v.periodo, '16 nov 2026 – 31 dic 2026'); assert.strictEqual(v.meses, 2); assert.strictEqual(v.primerMes, 'Noviembre 2026');
  assert.strictEqual(v.chip, 'Resto de 2026'); assert.match(v.feriados, /^2 oficiales/);
  assert.deepStrictEqual([v.estado.start, v.estado.preset], ['2026-01-15', null], 'las fechas escritas no se tocan');
});
prueba('periodos relativos y vencidos al abrir otro día', async () => {
  const caso = async (guardado, hoy) => { const v = await ver(await abrir({ guardado, hoy })); return [v.estado.start, v.estado.end, v.estado.preset, v.chip]; };
  assert.deepStrictEqual(await caso({ days: 12, start: '2026-03-01', end: '2026-12-31', preset: 'rest' }, '2026-07-10T10:00:00-06:00'), ['2026-07-10', '2026-12-31', 'rest', 'Resto de 2026']);
  assert.deepStrictEqual(await caso({ days: 12, start: '2026-03-01', end: '2026-12-31', preset: 'rest' }, '2027-02-03T10:00:00-06:00'), ['2027-02-03', '2027-12-31', 'rest', 'Resto de 2027']);
  assert.deepStrictEqual(await caso({ days: 12, start: '2026-03-01', end: '2027-02-28', preset: '12m' }, '2026-07-10T10:00:00-06:00'), ['2026-07-10', '2027-07-09', '12m', 'Próximos 12 meses']);
  assert.deepStrictEqual(await caso({ days: 12, start: '2026-11-16', end: '2026-12-31' }, '2027-01-02T10:00:00-06:00'), ['2027-01-02', '2027-12-31', 'rest', 'Resto de 2027'], 'vencido → por defecto');
  assert.deepStrictEqual(await caso(A2027, '2027-05-04T10:00:00-06:00'), ['2027-01-01', '2027-12-31', null, 'Resto de 2027'], 'año fijo ya empezado');
});
prueba('un estado guardado dañado no rompe la página', async () => {
  for (const malo of [{ rest: 'x' }, { custom: null }, { fixed: 5 }, { days: 'abc' }, { hol: null }, { rest: null }, { custom: [null, { date: 'x' }] }, { start: 5 }, { style: 'constructor' }, { blocked: [1, '2027-13-99x'] }, '[]', '"hola"', '{mal json']) {
    const p = await abrir({ guardado: malo }), v = await ver(p);
    assert.deepStrictEqual(p.errores, [], JSON.stringify(malo)); assert.strictEqual(v.heroOculto, false, JSON.stringify(malo)); assert.match(v.plan, /días de descanso/);
    await p.context().close();
  }
});
prueba('Top puentes: muestra la variante que ya está en el plan y cuenta los días fijos', async () => {
  let v = await ver(await abrir({ guardado: A2027 }));
  assert.strictEqual(v.puentes.length, 5); assert.ok(v.puentes.every(t => /En tu plan$/.test(t)), 'hay puentes del plan con «Agregar»: ' + v.puentes.join(' | '));
  assert.ok(v.puentes.some(t => /sáb 30 ene – mar 2 feb/.test(t)), v.puentes[1]);
  v = await ver(await abrir({ guardado: { ...A2027, fixed: ['2027-01-29'] } }));   // viernes fijo antes del lunes feriado
  const feb = v.puentes.find(t => /Día de la Constitución/.test(t));
  assert.match(feb, /^1 día → 4 días libres · vie 29 ene – lun 1 feb ?Pide vie 29 ene .* En tu plan$/);
});
prueba('«Equilibrado»: texto con 16 días o más y aviso cuando no cabe la vacación larga', async () => {
  let v = await ver(await abrir({ guardado: A2027 }));
  assert.strictEqual(v.estilos[0], 'Una vacación larga y el resto en puentes'); assert.ok(!v.notas.some(n => /busca/.test(n)));
  v = await ver(await abrir({ guardado: { ...A2027, days: 16 } }));
  assert.strictEqual(v.estilos[0], 'Dos vacaciones largas y el resto en puentes'); assert.ok(!v.notas.some(n => /busca/.test(n)));
  v = await ver(await abrir({ guardado: { ...A2027, days: 1 } }));
  assert.ok(v.notas.some(n => /«Equilibrado» busca una vacación larga \(de 9 días o más\), pero con tus días y este periodo no cabe\./.test(n)), v.notas.join(' | '));
  v = await ver(await abrir({ guardado: { days: 16, start: '2027-06-07', end: '2027-06-18' } }));
  assert.ok(v.notas.some(n => /busca dos vacaciones largas .* solo cabe una/.test(n)), v.notas.join(' | '));
  v = await ver(await abrir({ guardado: { ...A2027, days: 1, style: 'puentes' } }));
  assert.ok(!v.notas.some(n => /busca/.test(n)), 'el aviso solo aplica a Equilibrado');
});
prueba('«Quitar mis marcas» solo aparece con marcas a la vista y no borra las de otros periodos', async () => {
  const hay = p => p.evaluate(() => !!document.querySelector('#clear'));
  // Marcas pasadas, de otro año o tapadas por un feriado o un fin de semana: no se ven, así que no hay botón.
  let p = await abrir({ guardado: { ...A2027, fixed: ['2026-03-13', '2028-02-08', '2027-02-01'], blocked: ['2026-10-01', '2028-02-09', '2027-03-06'] } }), v = await ver(p);
  assert.strictEqual(await hay(p), false);
  assert.deepStrictEqual([v.estado.fixed, v.estado.blocked], [['2028-02-08', '2027-02-01'], ['2028-02-09', '2027-03-06']], 'las pasadas se descartan al abrir');
  // Con marcas a la vista: el botón quita las del periodo y deja las de 2028; Deshacer las regresa.
  p = await abrir({ guardado: { ...A2027, fixed: ['2027-03-04', '2028-02-08'], blocked: ['2027-03-05', '2028-02-09'] } });
  assert.strictEqual(await hay(p), true);
  await p.locator('#clear').click(); await p.waitForTimeout(200); v = await ver(p);
  assert.deepStrictEqual([v.estado.fixed, v.estado.blocked], [['2028-02-08'], ['2028-02-09']]); assert.strictEqual(await hay(p), false);
  assert.strictEqual(await p.locator('.d.fix, .d.blk').count(), 0);
  await p.locator('#undo').click(); await p.waitForTimeout(200); v = await ver(p);
  assert.deepStrictEqual([v.estado.fixed, v.estado.blocked], [['2027-03-04', '2028-02-08'], ['2027-03-05', '2028-02-09']]); assert.strictEqual(await hay(p), true);
  // Al cambiar a 2028 sus marcas siguen ahí.
  await p.locator('.chip', { hasText: '2028' }).click(); await p.waitForTimeout(200);
  assert.strictEqual(await hay(p), true); assert.strictEqual(await p.locator('.d.fix').count(), 1); assert.strictEqual(await p.locator('.d.blk').count(), 1);
});
prueba('menú de un día: Tab no se sale y Escape lo cierra', async () => {
  const p = await abrir({ guardado: A2027 });
  await p.locator('button[data-n].vac').first().click();
  for (let i = 0; i < 7; i++) { await p.keyboard.press(i === 4 ? 'Shift+Tab' : 'Tab'); assert.ok(await p.evaluate(() => !!document.activeElement.closest('#pop')), 'el foco salió del menú'); }
  await p.keyboard.press('Escape');
  assert.ok(await p.evaluate(() => document.querySelector('#pop').hidden && document.activeElement.matches('button[data-n]')));
});
prueba('celular: la hoja del día no se cierra al cambiar el alto ni deja desplazar la página', async () => {
  const p = await abrir({ guardado: A2027, movil: true }), dia = p.locator('button[data-n].vac').first(), abierta = () => p.evaluate(() => !document.querySelector('#pop').hidden);
  const cdp = await p.context().newCDPSession(p), toque = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 195, y }] });
  const arrastrar = async () => { await toque('touchStart', 420); for (let y = 400; y >= 120; y -= 40) { await toque('touchMove', y); await p.waitForTimeout(20); } await toque('touchEnd'); await p.waitForTimeout(250); };
  await arrastrar();
  assert.ok(await p.evaluate(() => scrollY) > 100, 'control: sin la hoja, arrastrar sí desplaza la página');
  await dia.scrollIntoViewIfNeeded(); await dia.tap(); await p.waitForTimeout(250);
  assert.ok(await abierta());
  await p.setViewportSize({ width: 390, height: 788 }); await p.waitForTimeout(150);
  assert.ok(await abierta(), 'se cerró al ocultarse la barra de direcciones');
  const y0 = await p.evaluate(() => scrollY);
  await p.mouse.move(195, 200); await p.mouse.wheel(0, 400); await p.waitForTimeout(150);
  await arrastrar();
  assert.strictEqual(await p.evaluate(() => scrollY), y0, 'la página se desplazó detrás de la hoja');
  assert.ok(await abierta());
  await p.setViewportSize({ width: 800, height: 400 }); await p.waitForTimeout(150);
  assert.ok(!(await abierta()), 'al girar el teléfono sí se cierra');
});
prueba('ICS: líneas plegadas a 75 bytes, UID por fechas y sin duplicar al reexportar', async () => {
  const p = await abrir({ guardado: { ...A2027, days: 20, style: 'largas' } });
  const ics = await p.evaluate(() => __vac.planIcs()), lineas = ics.split('\r\n');
  assert.ok(ics.endsWith('END:VCALENDAR\r\n')); assert.ok(!/[^\r]\n/.test(ics), 'saltos de línea sin CR');
  assert.ok(lineas.every(l => Buffer.byteLength(l) <= 75), 'línea de más de 75 bytes');
  const plano = ics.replace(/\r\n /g, '').split('\r\n');
  assert.ok(plano.some(l => Buffer.byteLength(l) > 75), 'el caso debería tener una línea larga que plegar');
  assert.ok(plano.some(l => /^DESCRIPTION:Días de vacaciones a pedir: .* – /.test(l)));
  const uids = plano.filter(l => l.startsWith('UID:'));
  assert.ok(uids.length >= 2 && new Set(uids).size === uids.length); assert.ok(uids.every(u => /^UID:descanso-\d{8}-\d{8}@optimizador-vacaciones$/.test(u)), uids[0]);
  assert.ok(plano.every(l => !l.startsWith('DTSTAMP:') || /^DTSTAMP:\d{8}T\d{6}Z$/.test(l)));
  // Con un día menos el plan cambia, pero los descansos que siguen igual conservan su UID.
  await p.locator('#minus').click(); await p.waitForTimeout(200);
  const uids2 = (await p.evaluate(() => __vac.planIcs())).replace(/\r\n /g, '').split('\r\n').filter(l => l.startsWith('UID:'));
  assert.ok(uids2.some(u => uids.includes(u)), 'ningún UID se conservó');
});
prueba('compartir: el enlace reproduce el plan, sin pisar el de quien lo abre', async () => {
  const origen = { ...A2027, days: 15, style: 'escapadas', rest: [0], hol: { jsanto: true, vsanto: true }, custom: [{ date: '2027-08-20', name: 'Cumpleaños de la señora Ñ <b>', yearly: true }], fixed: ['2027-03-04'], blocked: ['2027-03-05'] };
  const a = await abrir({ guardado: origen }), va = await ver(a);
  await a.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await a.locator('#share').click(); await a.waitForTimeout(200);
  assert.match((await ver(a)).toast, /Enlace copiado/);
  const link = await a.evaluate(() => __vac.shareLink());
  assert.match(link, /#plan=[\w-]+$/);
  // 1) Quien no tenía nada guardado: se queda con el plan y la dirección se limpia.
  let b = await abrir({ url: link }), vb = await ver(b);
  assert.deepStrictEqual(b.errores, []); assert.strictEqual(vb.plan, va.plan); assert.strictEqual(vb.hash, ''); assert.deepStrictEqual(vb.guardado, va.guardado);
  assert.ok(!vb.notas.some(n => /compartido/.test(n)));
  // 2) Quien ya tenía otro plan: lo ve, pero su plan guardado no cambia aunque toque cosas.
  b = await abrir({ url: link, guardado: { ...A2027, days: 7 } }); vb = await ver(b);
  assert.strictEqual(vb.plan, va.plan); assert.ok(vb.notas.some(n => /plan compartido/.test(n))); assert.strictEqual(vb.guardado.days, 7);
  await b.locator('#plus').click(); await b.locator('[data-s="puentes"]').click(); await b.waitForTimeout(200);
  assert.strictEqual((await ver(b)).guardado.days, 7, 'se guardó encima del plan propio');
  await b.reload(); await b.waitForTimeout(250);
  assert.strictEqual((await ver(b)).plan, va.plan, 'al recargar se sigue viendo el compartido');
  await b.locator('#mine').click(); await b.waitForTimeout(200); vb = await ver(b);
  assert.strictEqual(vb.estado.days, 7); assert.strictEqual(vb.hash, ''); assert.ok(!vb.notas.some(n => /compartido/.test(n))); assert.strictEqual(await b.inputValue('#days'), '7');
  // 3) «Quedarme con este» lo guarda.
  b = await abrir({ url: link, guardado: { ...A2027, days: 7 } });
  await b.locator('#adopt').click(); await b.waitForTimeout(200); vb = await ver(b);
  assert.strictEqual(vb.guardado.days, 15); assert.strictEqual(vb.hash, ''); assert.ok(!vb.notas.some(n => /compartido/.test(n)));
  // 4) Abrir el enlace de tu propio plan no muestra aviso; un enlace dañado deja tu plan.
  b = await abrir({ url: link, guardado: origen });
  assert.ok(!(await ver(b)).notas.some(n => /compartido/.test(n)));
  b = await abrir({ url: PAGE + '#plan=esto-no-es-un-plan', guardado: { ...A2027, days: 7 } }); vb = await ver(b);
  assert.deepStrictEqual(b.errores, []); assert.strictEqual(vb.estado.days, 7); assert.match(vb.toast, /no es válido/); assert.strictEqual(vb.hash, '');
  // 5) El nombre con HTML llega como texto.
  assert.strictEqual(await a.evaluate(() => document.querySelectorAll('#hol-cus b, .ph b, .opps b b').length), 0);
});
prueba('compartir un periodo relativo se recalcula con la fecha de quien lo abre', async () => {
  const a = await abrir({ guardado: { days: 12, start: '2026-11-16', end: '2026-12-31', preset: 'rest' } }), link = await a.evaluate(() => __vac.shareLink());
  const v = await ver(await abrir({ url: link, hoy: '2027-03-10T10:00:00-06:00' }));
  assert.deepStrictEqual([v.estado.start, v.estado.end, v.chip], ['2027-03-10', '2027-12-31', 'Resto de 2027']);
});

(async () => {
  browser = await chromium.launch();
  for (const [nombre, fn] of pruebas) {
    try { await fn(); console.log('  ok  ' + nombre); } catch (e) { fallas++; console.log('FALLA ' + nombre + '\n      ' + String(e.message).split('\n').slice(0, 12).join('\n      ')); }
    for (const c of browser.contexts()) await c.close();
  }
  await browser.close();
  console.log(fallas ? `\n${fallas} prueba(s) con fallas` : '\nTodo bien');
  process.exit(fallas ? 1 : 0);
})();
