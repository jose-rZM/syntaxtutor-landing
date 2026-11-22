import { DOWNLOADS, VERSION } from './config.js';
import { initAnalytics, track } from './analytics.js';
import { createTutor } from './demo-tutor.js';

// ---------------------------------------------------------------- OS hint
// Only used to highlight a download and show a note. All three downloads are
// always visible, because detection can be wrong (and cannot tell an Intel
// Mac from an Apple Silicon one).
function detectOS() {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const iPadAsMac = /Mac/.test(platform) && navigator.maxTouchPoints > 1;
  if (/Android|iPhone|iPad|iPod/i.test(ua) || iPadAsMac) return 'mobile';
  if (/Win/i.test(platform) || /Windows/.test(ua)) return 'windows';
  if (/Mac/i.test(platform) || /Mac OS X/.test(ua)) return 'macos';
  if (/CrOS/.test(ua)) return 'unknown';
  if (/Linux/i.test(platform) || /Linux/.test(ua)) return 'linux';
  return 'unknown';
}

const OS_NOTES = {
  mobile:
    'Parece que estás en un móvil o una tableta. SyntaxTutor solo funciona en ' +
    'ordenadores con Windows, macOS o Linux. Desde aquí puedes probar la ' +
    'demostración o consultar el manual.',
  macos:
    'En Mac solo funciona con Apple Silicon. Para comprobarlo, abre el menú ' +
    'Apple › Acerca de este Mac: junto a «Chip» debe aparecer Apple M1 o posterior.',
};

function setupDownloads() {
  const os = detectOS();
  document.documentElement.dataset.os = os;

  for (const [key, d] of Object.entries(DOWNLOADS)) {
    const link = document.querySelector(`[data-dl="${key}"]`);
    if (link) link.href = d.url;
  }
  document.querySelectorAll('[data-version]').forEach((el) => {
    el.textContent = VERSION;
  });

  const item = document.querySelector(`.dl-item[data-os="${os}"]`);
  if (item) {
    item.classList.add('is-detected');
    item.querySelector('.dl-tag').hidden = false;
  }
  const note = document.querySelector('[data-os-note]');
  if (note && OS_NOTES[os]) {
    note.textContent = OS_NOTES[os];
    note.hidden = false;
  }
}

// ------------------------------------------------------------------- Demo
function setupDemo() {
  const root = document.querySelector('[data-demo]');
  if (!root) return;

  const log = root.querySelector('[data-log]');
  const form = root.querySelector('[data-form]');
  const input = form.querySelector('input');
  const startPanel = root.querySelector('[data-start-panel]');
  const startBtn = root.querySelector('[data-start]');
  startBtn.hidden = false; // hidden in the HTML so that it only appears when the demo can run
  const rightEl = root.querySelector('[data-right]');
  const wrongEl = root.querySelector('[data-wrong]');

  let tutor = null;
  let treeNoteShown = false;

  const scrollLog = () => {
    log.scrollTop = log.scrollHeight;
  };

  function addMessage(kind, text, extraClass) {
    const li = document.createElement('li');
    li.className = `msg msg-${kind}${extraClass ? ` ${extraClass}` : ''}`;
    if (kind !== 'note') {
      const who = document.createElement('span');
      who.className = 'msg-who';
      who.textContent = kind === 'tutor' ? 'Tutor' : 'Tú';
      li.append(who);
    }
    const body = document.createElement('div');
    body.className = 'msg-body';
    body.textContent = text;
    li.append(body);
    log.append(li);
    scrollLog();
    return li;
  }

  function updateCounters() {
    rightEl.textContent = tutor.right;
    wrongEl.textContent = tutor.wrong;
  }

  function finish() {
    form.hidden = true;
    addMessage(
      'note',
      'Fin de la demostración. En la aplicación, el ejercicio seguiría con las ' +
        'reglas de T y terminaría con la tabla LL(1).',
    );
    const actions = document.createElement('li');
    actions.className = 'msg msg-actions';
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'btn btn-secondary btn-small';
    again.textContent = 'Repetir la demostración';
    again.addEventListener('click', start);
    const dl = document.createElement('a');
    dl.className = 'btn btn-primary btn-small';
    dl.href = '#descargar';
    dl.textContent = 'Ir a las descargas';
    actions.append(again, dl);
    log.append(actions);
    scrollLog();
    again.focus({ preventScroll: true });
    track('demo_completed', { wrong_answers: tutor.wrong });
  }

  function start() {
    tutor = createTutor();
    treeNoteShown = false;
    log.replaceChildren();
    updateCounters();
    startPanel.hidden = true;
    form.hidden = false;
    addMessage(
      'note',
      'En la aplicación, antes habrías respondido el tamaño de la tabla y los ' +
        'símbolos directores de las reglas anteriores. La demostración empieza ' +
        "en la regla E' → + T E'.",
    );
    addMessage('tutor', tutor.currentQuestion());
    input.value = '';
    // On touch screens focusing would open the keyboard and cover the page;
    // the visitor taps the field when ready to answer.
    if (!window.matchMedia('(pointer: coarse)').matches) {
      input.focus({ preventScroll: true });
    }
    track('demo_started');
  }

  startBtn.addEventListener('click', start);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!tutor || tutor.done) return;
    const value = input.value.trim();
    const stateBefore = tutor.state;
    const userMsg = addMessage('user', value || ' ');
    const { correct, feedback } = tutor.answer(value);
    updateCounters();

    const status = document.createElement('span');
    status.className = 'visually-hidden';
    status.textContent = correct ? ' (correcta)' : ' (incorrecta)';
    userMsg.querySelector('.msg-body').append(status);

    if (!correct) {
      userMsg.classList.add('is-wrong');
      addMessage('tutor', feedback);
      if (stateBefore === 'B1' && !treeNoteShown) {
        treeNoteShown = true;
        addMessage(
          'note',
          'En la aplicación se abre además una ventana con el árbol de ' +
            'derivación del conjunto cabecera.',
        );
      }
    }
    input.value = '';
    if (tutor.done) finish();
    else addMessage('tutor', tutor.currentQuestion());
  });
}

initAnalytics();
setupDownloads();
setupDemo();
