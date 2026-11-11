// Spielekiste – Launcher, Routing und gemeinsame Spiel-Infrastruktur.
// Ein Spiel ist ein Modul { id, name, icon, desc, help, start(ctx) }.
// Alles, was ein Spiel über ctx registriert (Listener, Loop, Timer), wird
// beim Verlassen oder Neustart automatisch aufgeräumt.

import blockfall from './games/blockfall.js';
import snake from './games/snake.js';
import breaker from './games/breaker.js';
import mines from './games/mines.js';
import pairs from './games/pairs.js';
import merge from './games/merge.js';
import connect from './games/connect.js';
import sudoku from './games/sudoku.js';
import shooter from './games/shooter.js';
import match3 from './games/match3.js';

const GAMES = [blockfall, snake, breaker, mines, pairs, merge, connect, sudoku, shooter, match3];
const STORE_KEY = 'spielekiste.best';

const $ = (id) => document.getElementById(id);
const el = {
  menu: $('menu'), grid: $('grid'), game: $('game'), title: $('title'),
  info: $('info'), score: $('score'), best: $('best'), stage: $('stage'),
  overlay: $('overlay'), ovTitle: $('ov-title'), ovText: $('ov-text'), ovBtn: $('ov-btn'),
  help: $('help'), pad: $('pad'),
};

// ---------- Bestwerte ----------
function loadBest() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveBest(id, value) {
  const all = loadBest();
  all[id] = value;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch { /* Speicher gesperrt */ }
}

// ---------- Menü ----------
function renderMenu() {
  const best = loadBest();
  el.grid.replaceChildren(...GAMES.map((g) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = `<span class="icon">${g.icon}</span><span class="name">${g.name}</span>
      <span class="desc">${g.desc}</span><span class="best">${best[g.id] ? 'Best: ' + best[g.id] : '&nbsp;'}</span>`;
    b.onclick = () => { location.hash = g.id; };
    return b;
  }));
}

// ---------- Spiel-Laufzeit ----------
let session = null; // { game, ctx, stop }

function showOverlay(title, text, btn, action) {
  el.ovTitle.textContent = title;
  el.ovText.textContent = text;
  el.ovBtn.textContent = btn;
  el.ovBtn.onclick = action;
  el.overlay.hidden = false;
}

function setPaused(p) {
  if (!session || session.ctx.over) return;
  session.ctx.paused = p;
  if (p) showOverlay('Pause', '', 'Weiter', () => setPaused(false));
  else el.overlay.hidden = true;
}

function startGame(game) {
  stopGame();
  const cleanups = [];
  let alive = true;
  let best = loadBest()[game.id] || 0;

  el.title.textContent = game.name;
  el.help.textContent = game.help || '';
  el.score.textContent = '0';
  el.best.textContent = best;
  el.info.textContent = '';
  el.overlay.hidden = true;
  el.stage.replaceChildren();
  el.pad.replaceChildren();
  el.pad.className = '';

  const ctx = {
    stage: el.stage,
    paused: false,
    over: false,

    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    },

    // fn(key, event) -> true, wenn die Taste verarbeitet wurde
    keys(fn) {
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused || ctx.over) return;
        if (fn(e.key, e)) e.preventDefault();
      });
    },

    // fn(dt in ms); steht bei Pause und nach Spielende
    loop(fn) {
      let last = performance.now();
      const tick = (now) => {
        if (!alive) return;
        const dt = Math.min(50, now - last);
        last = now;
        if (!ctx.paused && !ctx.over) fn(dt);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },

    later(fn, ms) {
      const t = setTimeout(() => { if (alive) fn(); }, ms);
      cleanups.push(() => clearTimeout(t));
    },

    // Canvas mit logischer Größe w×h, skaliert auf die verfügbare Fläche
    canvas(w, h) {
      const canvas = document.createElement('canvas');
      const res = 2;
      canvas.width = w * res;
      canvas.height = h * res;
      const g = canvas.getContext('2d');
      g.scale(res, res);
      el.stage.append(canvas);
      const fit = () => {
        const s = Math.min(el.stage.clientWidth / w, el.stage.clientHeight / h);
        canvas.style.width = Math.floor(w * s) + 'px';
        canvas.style.height = Math.floor(h * s) + 'px';
      };
      const ro = new ResizeObserver(fit);
      ro.observe(el.stage);
      cleanups.push(() => ro.disconnect());
      fit();
      // Zeigerposition in logischen Koordinaten
      const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height };
      };
      return { canvas, g, pos };
    },

    // Touch-Tasten: [{ label, fn, repeat?: ms }]; always = auch am Desktop zeigen
    pad(buttons, always = false) {
      el.pad.classList.toggle('always', always);
      return buttons.map((def) => {
        const b = document.createElement('button');
        b.textContent = def.label;
        let timer = 0;
        const stop = () => { clearInterval(timer); timer = 0; };
        ctx.on(b, 'pointerdown', (e) => {
          e.preventDefault();
          if (ctx.paused || ctx.over) return;
          def.fn(b);
          if (def.repeat) {
            stop();
            timer = setInterval(() => { if (!ctx.paused && !ctx.over) def.fn(b); }, def.repeat);
          }
        });
        for (const t of ['pointerup', 'pointerleave', 'pointercancel']) ctx.on(b, t, stop);
        cleanups.push(stop);
        el.pad.append(b);
        return b;
      });
    },

    // fn('left' | 'right' | 'up' | 'down' | 'tap')
    swipe(fn) {
      let sx = 0, sy = 0, down = false;
      ctx.on(el.stage, 'pointerdown', (e) => { sx = e.clientX; sy = e.clientY; down = true; });
      ctx.on(el.stage, 'pointerup', (e) => {
        if (!down || ctx.paused || ctx.over) return;
        down = false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return fn('tap');
        fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      });
    },

    score(n) { el.score.textContent = n; },
    info(text) { el.info.textContent = text; },

    end(score, won = false) {
      if (ctx.over) return;
      ctx.over = true;
      el.score.textContent = score;
      let text = `Punkte: ${score}`;
      if (score > best) {
        best = score;
        saveBest(game.id, best);
        el.best.textContent = best;
        text += '\nNeuer Bestwert!';
      }
      showOverlay(won ? 'Geschafft!' : 'Game Over', text, 'Nochmal', () => startGame(game));
    },
  };

  session = {
    game, ctx,
    stop() { alive = false; cleanups.forEach((c) => c()); },
  };
  game.start(ctx);
}

function stopGame() {
  if (session) session.stop();
  session = null;
}

// ---------- Routing ----------
function route() {
  const game = GAMES.find((g) => g.id === location.hash.slice(1));
  if (game) {
    el.menu.hidden = true;
    el.game.hidden = false; // vor dem Start, damit die Bühne messbar ist
    startGame(game);
  } else {
    stopGame();
    el.game.hidden = true;
    el.menu.hidden = false;
    renderMenu();
  }
}

$('back').onclick = () => { location.hash = ''; };
$('restart').onclick = () => { if (session) startGame(session.game); };
$('pause').onclick = () => { if (session) setPaused(!session.ctx.paused); };
window.addEventListener('hashchange', route);
window.addEventListener('keydown', (e) => {
  if (!session) return;
  if (e.key === 'Escape') location.hash = '';
  else if (e.key === 'p' || e.key === 'P') setPaused(!session.ctx.paused);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

route();

// In der Store-App liegen alle Dateien im Paket – der Service Worker ist nur im Browser nötig
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.Capacitor) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
