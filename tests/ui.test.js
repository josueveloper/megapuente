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
const PAGE = 'file://' + path.resolve(__dirname, '../index.html'), KEY = 'megapuente-v1';
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
  estado: __vac.state(), guardado: JSON.parse(localStorage.getItem('megapuente-v1')),
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
prueba('la medición de visitas solo se carga en megapuente.com', async () => {
  // Abierta como archivo local (pruebas, desarrollo) no pide nada a Cloudflare.
  let p = await abrir(); const pedidos = []; p.on('request', r => pedidos.push(r.url()));
  await p.reload(); await p.waitForTimeout(400);
  assert.ok(!pedidos.some(u => /cloudflareinsights/.test(u)), 'pidió la baliza fuera del sitio publicado');
  assert.strictEqual(await p.locator('script[data-cf-beacon]').count(), 0);
  // Servida como https://megapuente.com (respuestas simuladas, sin salir a internet) sí inserta la baliza con su token.
  const ctx = await browser.newContext(), q = await ctx.newPage(); let baliza = 0;
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://megapuente.com/')) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8') });
    if (/static\.cloudflareinsights\.com\/beacon\.min\.js/.test(u)) { baliza++; return r.fulfill({ contentType: 'application/javascript', body: '' }); }
    return r.abort(); });
  await q.goto('https://megapuente.com/'); await q.waitForTimeout(400);
  assert.strictEqual(baliza, 1);
  assert.match(await q.getAttribute('script[data-cf-beacon]', 'data-cf-beacon'), /^\{"token": "[0-9a-f]{32}"\}$/);
});
prueba('metadatos para publicar', async () => {
  const p = await abrir();
  const m = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('meta[name],meta[property]')].map(x => [x.getAttribute('name') || x.getAttribute('property'), x.content])));
  for (const k of ['description', 'theme-color', 'og:title', 'og:description', 'og:type', 'og:locale', 'twitter:card']) assert.ok(m[k], 'falta ' + k);
  assert.strictEqual(m['og:url'], 'https://megapuente.com/'); assert.strictEqual(m['og:image'], 'https://megapuente.com/og.png');
  assert.strictEqual(await p.evaluate(() => document.querySelector('link[rel=canonical]').href), 'https://megapuente.com/');
  const png = fs.readFileSync(path.resolve(__dirname, '../og.png'));   // la imagen existe y mide lo que dicen los metadatos
  assert.deepStrictEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [+m['og:image:width'], +m['og:image:height']]);
});
prueba('marca Megapuente y texto fijo de puentes y preguntas (también sin JavaScript)', async () => {
  let p = await abrir();
  assert.match(await p.title(), /^Megapuente · /); assert.strictEqual(await p.textContent('h1'), 'Megapuente');
  const info = () => p.evaluate(() => document.querySelector('#info-years').textContent.replace(/\s+/g, ' '));
  assert.match(await info(), /Puentes y feriados de México en 2027 y 2028.*jue 16 sep.*Pide el vie 17 sep y descansas 4 días/);
  assert.strictEqual(await p.locator('.faq h3').count(), 6); assert.strictEqual(await p.locator('.foot').count(), 1);
  assert.match(await p.textContent('.faq'), /no se envía a ningún servidor\. Lo único que se mide es cuántas visitas .* sin cookies/);
  assert.strictEqual(JSON.parse(await p.textContent('script[type="application/ld+json"]')).name, 'Megapuente');
  // Abierta casi un año después, el bloque se actualiza solo aunque index.html no se haya reconstruido.
  p = await abrir({ hoy: '2027-10-05T10:00:00-06:00' });
  assert.match(await info(), /Puentes y feriados de México en 2028 y 2029/);
  // Sin JavaScript (como lo ve un buscador sencillo) el texto ya viene en el archivo.
  const ctx = await browser.newContext({ javaScriptEnabled: false }), q = await ctx.newPage();
  await q.goto(PAGE);
  assert.match(await q.textContent('#info-years'), /Puentes y feriados de México en \d{4} y \d{4}.*Día de la Independencia/s);
  assert.match(await q.textContent('.faq'), /¿Qué es un puente y qué es un megapuente\?/);
  for (const f of ['robots.txt', 'sitemap.xml']) assert.match(fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8'), /https:\/\/megapuente\.com\//);
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
prueba('Top puentes: solo aparece si aporta; muestra la variante del plan y cuenta los días fijos', async () => {
  // 2027 con 12 días: el plan ya aprovecha los 5 puentes, así que basta una línea en «Tu plan».
  let p = await abrir({ guardado: A2027 }), v = await ver(p);
  assert.strictEqual(v.puentes.length, 0); assert.strictEqual(await p.locator('[data-anchor="opps"]').count(), 0);
  assert.strictEqual((await p.textContent('.plan-note')).trim(), 'Tu plan ya incluye los 5 mejores puentes del periodo.');
  // Con 2 días no caben todos: aparece la lista, con los del plan marcados y el resto con «Agregar».
  p = await abrir({ guardado: { ...A2027, days: 2, style: 'puentes' } }); v = await ver(p);
  assert.strictEqual(v.puentes.length, 5); assert.strictEqual(await p.locator('.plan-note').count(), 0);
  assert.ok(v.puentes.some(t => /En tu plan$/.test(t)) && v.puentes.some(t => /Agregar$/.test(t)), v.puentes.join(' | '));
  // Un viernes fijo antes del lunes feriado cuenta como día pedido y sale «En tu plan».
  v = await ver(await abrir({ guardado: { ...A2027, days: 2, fixed: ['2027-01-29'] } }));
  const feb = v.puentes.find(t => /Día de la Constitución/.test(t));
  assert.match(feb, /^1 día → 4 días libres · vie 29 ene – lun 1 feb ?Pide vie 29 ene .* En tu plan$/);
  // Sin feriados entre semana en el periodo, no hay tarjeta vacía.
  p = await abrir({ guardado: { days: 5, start: '2027-07-01', end: '2027-08-31' } });
  assert.strictEqual(await p.locator('[data-anchor="opps"], .plan-note').count(), 0);
});
prueba('celular: el resultado va primero y la configuración plegada en un resumen', async () => {
  const p = await abrir({ guardado: A2027, movil: true }), top = s => p.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, s);
  assert.ok(await top('#hero') < await top('#cfgsum') && await top('#cfgsum') < await top('#plan'), 'orden: resultado, resumen, plan');
  assert.ok(await top('#hero') < 844, 'el resultado se ve sin desplazar');
  assert.strictEqual(await p.isVisible('#days'), false);
  assert.strictEqual((await p.textContent('#cfgsum-t')).trim(), '12 días · 2027 · descansas sáb y dom');
  await p.locator('#cfgsum').tap(); await p.waitForTimeout(100);
  assert.strictEqual(await p.isVisible('#days'), true); assert.strictEqual(await p.textContent('#cfgsum-b'), 'Listo');
  await p.locator('#plus').tap(); await p.locator('[data-w="5"]').tap(); await p.waitForTimeout(150);
  assert.strictEqual((await p.textContent('#cfgsum-t')).trim(), '13 días · 2027 · descansas vie, sáb y dom');
  await p.locator('#cfgdone').tap(); await p.waitForTimeout(900);
  assert.strictEqual(await p.isVisible('#days'), false); assert.strictEqual(await p.textContent('#cfgsum-b'), 'Cambiar');
  assert.ok(Math.abs(await p.evaluate(() => document.querySelector('#hero').getBoundingClientRect().top)) < 40, 'regresó al resultado');
  // Con un periodo vencido la configuración se abre sola para corregirlo.
  const q = await abrir({ guardado: { days: 12, start: '2027-06-01', end: '2027-01-01' }, movil: true });
  assert.match((await ver(q)).notas.join(' '), /posterior a la inicial/); assert.strictEqual(await q.isVisible('#days'), true);
  // En escritorio no hay resumen: la configuración se ve completa.
  const d = await abrir({ guardado: A2027 });
  assert.strictEqual(await d.isVisible('#cfgsum'), false); assert.strictEqual(await d.isVisible('#days'), true); assert.strictEqual(await d.isVisible('#cfgdone'), false);
});
prueba('tarjetas del plan: sin tira de días y con las acciones en un menú «⋯»', async () => {
  const p = await abrir({ guardado: A2027 });
  assert.strictEqual(await p.locator('.strip, .pb-a').count(), 0);
  assert.strictEqual(await p.locator('.pb-m').count(), await p.locator('.pb').count());
  assert.strictEqual(await p.isVisible('.pb-m [data-pin="0"]'), false);
  await p.locator('#pb0 summary').click(); assert.strictEqual(await p.isVisible('#pb0 [data-pin]'), true);
  await p.locator('#pb1 summary').click(); await p.waitForTimeout(50);
  assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('.pb-m[open]')].map(d => d.closest('.pb').id)), ['pb1'], 'uno a la vez');
  await p.keyboard.press('Escape'); assert.strictEqual(await p.locator('.pb-m[open]').count(), 0);
  await p.locator('#pb2 summary').click(); await p.mouse.click(5, 5); assert.strictEqual(await p.locator('.pb-m[open]').count(), 0, 'se cierra al tocar fuera');
  await p.locator('#pb0 summary').click(); await p.locator('#pb0 [data-pin]').click(); await p.waitForTimeout(150);
  assert.deepStrictEqual((await ver(p)).estado.fixed, ['2027-01-04']);
  assert.match(await p.textContent('#pb0 .kinds'), /Fijado/);
  await p.locator('#pb1 summary').click(); await p.locator('#pb1 [data-drop]').click(); await p.waitForTimeout(150);
  assert.ok((await ver(p)).estado.blocked.includes('2027-02-02'));
});
prueba('celular: el calendario va plegado hasta que se pide', async () => {
  const p = await abrir({ guardado: A2027, movil: true }), visible = s => p.isVisible(s);
  assert.strictEqual(await visible('#cal'), false); assert.strictEqual(await visible('.cal-card .legend'), false);
  assert.strictEqual((await p.textContent('#calall')).trim(), 'Ver calendario');
  await p.locator('#calall').tap(); await p.waitForTimeout(150);
  assert.strictEqual(await visible('#cal'), true); assert.strictEqual(await p.locator('.month').evaluateAll(ms => ms.filter(m => m.offsetParent).length), 12);
  await p.locator('#plus').evaluate(b => b.click()); await p.waitForTimeout(150);
  assert.strictEqual(await visible('#cal'), true, 'sigue abierto al recalcular');
  await p.locator('#calall').tap(); await p.waitForTimeout(150); assert.strictEqual(await visible('#cal'), false);
  // «Ver en el calendario» desde un descanso lo abre y lleva a esos días.
  await p.locator('#pb1 summary').tap(); await p.locator('#pb1 [data-go]').tap(); await p.waitForTimeout(900);
  assert.strictEqual(await visible('#cal'), true);
  const y = await p.locator('.c[data-b="1"]').first().evaluate(c => c.getBoundingClientRect().top);
  assert.ok(y > 0 && y < 844, 'los días del descanso quedaron en pantalla');
  // En escritorio el calendario se ve siempre y no hay botón.
  const d = await abrir({ guardado: A2027 });
  assert.strictEqual(await d.isVisible('#cal'), true); assert.strictEqual(await d.isVisible('#calall'), false);
});
prueba('el aviso de Semana Santa se puede cerrar y no vuelve a salir', async () => {
  const p = await abrir({ guardado: A2027 }), aviso = async () => (await ver(p)).notas.some(n => /Jueves y Viernes Santo/.test(n));
  assert.ok(await aviso());
  await p.locator('[data-dismiss="feriados"]').click(); await p.waitForTimeout(100);
  assert.ok(!(await aviso()));
  await p.reload(); await p.waitForTimeout(250); assert.ok(!(await aviso()), 'sigue cerrado al volver a abrir');
  p.on('dialog', d => d.accept()); await p.locator('#reset').click(); await p.waitForTimeout(250);
  assert.ok(await aviso(), '«Restablecer todo» lo vuelve a mostrar');
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
  await p.locator('#calall').tap(); await p.waitForTimeout(150);   // en celular el calendario va plegado
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
  assert.ok(uids.length >= 2 && new Set(uids).size === uids.length); assert.ok(uids.every(u => /^UID:descanso-\d{8}-\d{8}@megapuente\.com$/.test(u)), uids[0]);
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
