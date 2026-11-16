# Ensambla index.html: top.html (estilos y estructura) + logic.js (cálculo) + ui.js (interfaz).
# - Las tipografías de src/fonts se incrustan en base64 donde top.html dice /*FONT:archivo.woff2*/.
# - El bloque fijo de feriados y puentes sale de infoHtml() en logic.js (lo imprime info.js con Node), el mismo código
#   que usa la página al abrir; así el texto que leen los buscadores y el que ve la gente no se pueden desfasar.
import base64, pathlib, re, subprocess
d = pathlib.Path(__file__).parent
html = ''.join((d / f).read_text(encoding='utf-8') for f in ('top.html', 'logic.js', 'ui.js'))
html = re.sub(r'/\*FONT:([\w.-]+)\*/', lambda m: base64.b64encode((d / 'fonts' / m.group(1)).read_bytes()).decode(), html)
info = subprocess.run(['node', str(d / 'info.js')], check=True, capture_output=True, text=True).stdout.strip()
assert html.count('<!--INFO-->') == 1 and info.startswith('<h2>'), 'no se pudo generar el bloque de feriados'
html = html.replace('<!--INFO-->', info)
(d.parent / 'index.html').write_text(html, encoding='utf-8')
