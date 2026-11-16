# Optimizador de vacaciones · México

Página de un solo archivo (`index.html`) que dice qué días de vacaciones pedir para juntar más días libres
con fines de semana, feriados y puentes. No tiene servidor ni dependencias: todo se calcula y se guarda en el navegador.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página lista para abrir o publicar. **Se genera**; no se edita a mano. |
| `src/top.html` | Estilos y estructura. |
| `src/logic.js` | Fechas, feriados, estado guardado, enlace para compartir y el optimizador. |
| `src/ui.js` | Interfaz: configuración, plan, calendario, exportar. |
| `src/build.py` | Une los tres archivos e incrusta las tipografías de `src/fonts/`. |
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
- **Estado**: en `localStorage` (`optimizador-vacaciones-mx-v1`). Todo lo que se lee de ahí o de un enlace pasa por
  `sanitize`, que descarta lo que no sea válido.
- **Compartir**: el botón copia un enlace `…#plan=<código>` con la configuración (base64url de un JSON) en el fragmento
  de la dirección, que no se envía a ningún servidor. Quien lo abre sin tener nada guardado se queda con ese plan; quien ya
  tenía uno distinto solo lo ve (no se guarda) hasta que elige «Quedarme con este» o «Volver al mío».
- **ICS**: un evento de día completo por descanso. El UID depende de las fechas del descanso, así que volver a importar
  un descanso que no cambió no lo duplica. Si un descanso cambia de fechas, el evento anterior hay que borrarlo a mano
  en el calendario (un archivo ICS no puede borrar eventos ya importados).

## Al publicar

La página ya trae descripción, `theme-color` y Open Graph básico. Faltan `og:url` y `og:image`, que necesitan la
dirección pública definitiva (se añaden en `src/top.html`).

Tipografías: Press Start 2P y DotGothic16 (SIL OFL 1.1, licencias en `src/fonts/`).
