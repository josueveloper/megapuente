# Ensambla index.html: top.html (estilos y estructura) + logic.js (cálculo) + ui.js (interfaz).
# Las tipografías de src/fonts se incrustan en base64 donde top.html dice /*FONT:archivo.woff2*/.
import base64, pathlib, re
d = pathlib.Path(__file__).parent
html = ''.join((d / f).read_text(encoding='utf-8') for f in ('top.html', 'logic.js', 'ui.js'))
html = re.sub(r'/\*FONT:([\w.-]+)\*/', lambda m: base64.b64encode((d / 'fonts' / m.group(1)).read_bytes()).decode(), html)
(d.parent / 'index.html').write_text(html, encoding='utf-8')
