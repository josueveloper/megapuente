# Megapuente · optimizador de vacaciones para México

**https://megapuente.com** · Página de un solo archivo (`index.html`) que dice qué días de vacaciones pedir para juntar más días libres
con fines de semana, feriados y puentes. No tiene servidor ni dependencias: todo se calcula y se guarda en el navegador.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página lista para abrir o publicar. **Se genera**; no se edita a mano. |
| `src/top.html` | Estilos y estructura. |
| `src/logic.js` | Fechas, feriados, estado guardado, enlace para compartir y el optimizador. |
| `src/ui.js` | Interfaz: configuración, plan, calendario, exportar. |
| `src/build.py` | Une los tres archivos, incrusta las tipografías de `src/fonts/` y el bloque fijo de feriados (necesita Node). |
| `src/info.js` | Imprime ese bloque fijo (`infoHtml` de `logic.js`) para `build.py`. |
| `og.png`, `src/og-image.js` | Imagen que se ve al compartir la dirección (1200×630) y el script que la genera. |
| `CNAME`, `.nojekyll` | Publicación en GitHub Pages con el dominio `megapuente.com`, sirviendo los archivos tal cual. |
| `robots.txt`, `sitemap.xml` | Para buscadores. |
| `tests/` | Pruebas del cálculo y de la página. |

## Cambiar algo

```bash
python3 src/build.py          # regenera index.html
node tests/logica.test.js     # cálculo (unos segundos)
node tests/ui.test.js         # la página en Chromium, con la fecha simulada
```

- `logica.test.js` compara el optimizador con probar todas las combinaciones en periodos cortos, y revisa feriados,
  periodos, «Top puentes», el estado guardado y el enlace para compartir.
- `ui.test.js` necesita Playwright con Chromium. Usa el `playwright` que encuentre Node o, si no hay, el de
  `/workspace/.tools/browser` (se cambia con `TOOLS_DIR`). Abre `index.html`, así que hay que reconstruir antes.

## Cómo funciona

- **Descanso**: racha de días libres seguidos (descanso semanal, feriados y vacaciones) con al menos un día de vacaciones.
  El optimizador (programación dinámica, `solve` en `logic.js`) maximiza la suma de días de descanso; si hay empate,
  gasta menos días y reparte mejor los descansos.
- **Estilos**: límites de largo de cada descanso (`STYLES`). «Equilibrado» pide además una vacación larga (dos con 16 días
  o más); si no cabe, arma el plan sin ella y lo avisa.
- **Hoy no se sugiere**: el plan propone días de mañana en adelante. Hoy sí se puede fijar a mano en el calendario.
- **Periodo**: «Resto del año» y «Próximos 12 meses» se guardan como relativos y se recalculan al abrir la página;
  un año o unas fechas escritas a mano se quedan fijos, y lo que ya pasó no se dibuja. Un periodo vencido vuelve al de por defecto.
- **Estado**: en `localStorage` (`megapuente-v1`). Todo lo que se lee de ahí o de un enlace pasa por
  `sanitize`, que descarta lo que no sea válido y las marcas de días que ya pasaron.
- **Marcas** (vacación fija, «no puedo faltar»): las de fuera del periodo se conservan por si se vuelve a él.
  «Quitar mis marcas» solo aparece si hay alguna a la vista y solo quita las del periodo mostrado.
- **Compartir**: el botón copia un enlace `…#plan=<código>` con la configuración (base64url de un JSON) en el fragmento
  de la dirección, que no se envía a ningún servidor. Quien lo abre sin tener nada guardado se queda con ese plan; quien ya
  tenía uno distinto solo lo ve (no se guarda) hasta que elige «Quedarme con este» o «Volver al mío».
- **Celular** (hasta 900 px de ancho): el resultado va primero y la configuración queda plegada en un resumen de una
  línea («Cambiar» la abre); el calendario también va plegado y se abre con «Ver calendario» o desde el menú «⋯» de un
  descanso. En escritorio todo se ve completo.
- **Modo claro u oscuro**: lo decide el atributo `data-theme` de `<html>`, que un script corto del `<head>` pone antes de
  dibujar (sin parpadeo). Sin elección propia sigue al sistema; el botón del encabezado la guarda en `localStorage`
  (`megapuente-tema`) y «Restablecer todo» la borra. Los estilos oscuros van bajo `[data-theme=dark]` en `src/top.html`.
- **Avisos que se cierran** (p. ej. el de Semana Santa): se recuerdan en `localStorage` (`megapuente-avisos-v1`);
  «Restablecer todo» los vuelve a mostrar.
- **Texto fijo** (al final de la página): feriados y puentes de dos años y preguntas frecuentes, para quien llega buscando
  «puentes 2027» y para los buscadores. El bloque de los años sale de `infoHtml()`: `build.py` lo deja escrito en `index.html`
  y la página lo regenera al abrir, así que no queda viejo aunque no se reconstruya. De octubre en adelante muestra los dos
  años siguientes.
- **ICS**: un evento de día completo por descanso. El UID depende de las fechas del descanso, así que volver a importar
  un descanso que no cambió no lo duplica. Si un descanso cambia de fechas, el evento anterior hay que borrarlo a mano
  en el calendario (un archivo ICS no puede borrar eventos ya importados).

## Publicación

GitHub Pages sirve la rama `main` en `https://megapuente.com` (dominio en Cloudflare, con registros DNS hacia GitHub).
Publicar un cambio es reconstruir `index.html`, pasar las pruebas y hacer `git push`.

Las visitas se cuentan con Cloudflare Web Analytics (anónimo, sin cookies). El script va al final de `src/ui.js` y solo se
carga cuando la página se sirve desde `megapuente.com`.

Los metadatos (descripción, `theme-color`, Open Graph con `og:url` y `og:image`) están en `src/top.html`. Si cambia el
aspecto del resumen, `node src/og-image.js` regenera `og.png`.

Tipografías: Press Start 2P y DotGothic16 (SIL OFL 1.1, licencias en `src/fonts/`).
