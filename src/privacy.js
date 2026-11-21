// Opt-out is available if and only if actual analytics is enabled.
import { ANALYTICS, OPT_OUT_KEY } from './config.js';

const button = document.querySelector('[data-optout]');
const status = document.querySelector('[data-optout-status]');
const notice = document.querySelector('[data-measurement-status]');
const enabled = ANALYTICS.provider === 'umami' &&
  Boolean(ANALYTICS.umami?.scriptUrl && ANALYTICS.umami?.websiteId);

function read() {
  try { return localStorage.getItem(OPT_OUT_KEY) !== null; }
  catch { return null; }
}
function render() {
  if (!enabled) {
    button.hidden = true;
    notice.textContent = 'La medición de uso todavía no está activada.';
    status.textContent = 'No se envían estadísticas a Umami.';
    return;
  }
  notice.textContent = 'Utilizamos analítica sin cookies para conocer cómo se usa la página.';
  const disabled = read();
  if (disabled === null) {
    button.hidden = true;
    status.textContent = 'Tu navegador no permite guardar esta preferencia. La medición no se cargará.';
    return;
  }
  button.hidden = false;
  button.textContent = disabled ? 'Volver a contar mis visitas' : 'No contar mis visitas';
  status.textContent = disabled
    ? 'La medición está desactivada en este navegador.'
    : 'La medición está activada en este navegador.';
}
button.addEventListener('click', () => {
  try {
    if (read()) localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, '1');
  } catch { /* fail closed by not loading analytics */ }
  render();
});
render();
