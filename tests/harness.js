// Carga src/logic.js en Node (sin navegador) y expone sus funciones para las pruebas.
// `hoy` ([año, mes 1-12, día]) fija la fecha del sistema que ve el código; `guardado` simula lo que hay en localStorage.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/logic.js'), 'utf8');
const NAMES = (src.match(/^(?:const|let|function) +[A-Za-z_$][\w$]*/gm) || []).map(d => d.split(/ +/)[1]).filter(n => n !== 'state');

module.exports = function load({ hoy = [2026, 11, 16], guardado } = {}) {
  const now = new Date(hoy[0], hoy[1] - 1, hoy[2], 12).getTime();
  class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } }
  const store = new Map(guardado === undefined ? [] : [['megapuente-v1', typeof guardado === 'string' ? guardado : JSON.stringify(guardado)]]);
  const localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const api = new Function('Date', 'localStorage', `${src}; return { ${NAMES.join(', ')}, setState: s => { state = s; }, getState: () => state };`)(FakeDate, localStorage);
  api.store = store;
  return api;
};
