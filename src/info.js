// Imprime el bloque de feriados y puentes (infoHtml de logic.js) para que build.py lo incruste en index.html.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'logic.js'), 'utf8');
const localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
process.stdout.write(new Function('localStorage', `${src}; return infoHtml();`)(localStorage));
