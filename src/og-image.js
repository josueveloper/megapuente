// Genera og.png (1200×630), la imagen que muestran WhatsApp, X, Facebook, etc. al compartir la dirección de la página.
// Uso: node src/og-image.js   (después de python3 src/build.py; necesita Playwright con Chromium, igual que tests/ui.test.js)
const path = require('path'), fs = require('fs');
const TOOLS = process.env.TOOLS_DIR || '/workspace/.tools';
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(TOOLS, 'browser/pw-browsers');
  const arch = require('os').arch() === 'arm64' ? 'aarch64-linux-gnu' : 'x86_64-linux-gnu';
  process.env.LD_LIBRARY_PATH = ['libs/usr/lib/' + arch, 'libs/lib/' + arch].map(d => path.join(TOOLS, d)).filter(fs.existsSync).concat(process.env.LD_LIBRARY_PATH || []).join(':');
  ({ chromium } = require(path.join(TOOLS, 'browser/node_modules/playwright')));
}
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });
  await p.clock.setFixedTime(new Date('2026-11-16T10:00:00-06:00'));   // siempre el mismo plan de ejemplo: 2027 con 12 días
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  // Solo el encabezado y el resumen, ampliados hasta llenar la imagen.
  await p.addStyleTag({ content: 'aside,#body,.mbar,.toast,.flag{display:none!important}.wrap{display:block;padding:0 22px}.top{padding:26px 22px 14px}html{zoom:1.42}body{padding:0;overflow:hidden}.hero{margin-bottom:0}' });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: path.resolve(__dirname, '../og.png') });
  await b.close();
})();
