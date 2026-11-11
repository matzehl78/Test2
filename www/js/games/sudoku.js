// Sudoku – jede Zeile, Spalte und jeder 3×3-Block enthält die Ziffern 1–9 genau einmal.
// Rätsel werden zufällig erzeugt und haben immer genau eine Lösung.

const REMOVE = 46; // Zielzahl leerer Felder

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sameUnit = (a, b) => {
  const ra = Math.floor(a / 9), rb = Math.floor(b / 9), ca = a % 9, cb = b % 9;
  return ra === rb || ca === cb || (Math.floor(ra / 3) === Math.floor(rb / 3) && Math.floor(ca / 3) === Math.floor(cb / 3));
};

function candidates(grid, i) {
  const r = Math.floor(i / 9), c = i % 9, br = r - r % 3, bc = c - c % 3;
  const used = new Set();
  for (let k = 0; k < 9; k++) {
    used.add(grid[r * 9 + k]);
    used.add(grid[k * 9 + c]);
    used.add(grid[(br + Math.floor(k / 3)) * 9 + bc + k % 3]);
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => !used.has(v));
}

// Zählt Lösungen bis limit. Mit keep=true bleibt die erste gefundene Lösung im Gitter stehen
// (zufällige Reihenfolge), sonst wird das Gitter unverändert zurückgelassen.
function search(grid, limit, keep) {
  let best = -1, opts = null;
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, i);
    if (!c.length) return 0;
    if (!opts || c.length < opts.length) { best = i; opts = c; }
  }
  if (best < 0) return 1;
  if (keep) shuffle(opts);
  let n = 0;
  for (const v of opts) {
    grid[best] = v;
    n += search(grid, limit - n, keep);
    if (n >= limit) {
      if (!keep) grid[best] = 0;
      return n;
    }
  }
  grid[best] = 0;
  return n;
}

function generate() {
  const solution = Array(81).fill(0);
  search(solution, 1, true);
  const puzzle = [...solution];
  let removed = 0;
  for (const i of shuffle([...Array(81).keys()])) {
    if (removed >= REMOVE) break;
    const v = puzzle[i];
    puzzle[i] = 0;
    if (search(puzzle, 2, false) === 1) removed++;
    else puzzle[i] = v;
  }
  return { solution, puzzle };
}

export default {
  id: 'sudoku',
  name: 'Sudoku',
  icon: '🧩',
  desc: 'Ziffern 1–9 logisch eintragen.',
  help: 'Feld wählen, Ziffer tippen · Entf löscht · Pfeiltasten bewegen',

  start(ctx) {
    const { solution, puzzle } = generate();
    const vals = [...puzzle];
    let sel = puzzle.indexOf(0), errors = 0, time = 0;

    const board = document.createElement('div');
    board.className = 'board sudoku';
    board.style.gridTemplateColumns = 'repeat(9, 1fr)';
    ctx.stage.append(board);

    const status = () => ctx.info(`Fehler ${errors} · ⏱ ${Math.floor(time)}s`);

    const btns = vals.map((_, i) => {
      const b = document.createElement('button');
      if (puzzle[i]) b.classList.add('given');
      ctx.on(b, 'click', () => {
        if (ctx.over || ctx.paused) return;
        sel = i;
        render();
      });
      board.append(b);
      return b;
    });

    function render() {
      btns.forEach((b, i) => {
        const v = vals[i];
        b.textContent = v || '';
        b.classList.toggle('sel', i === sel);
        b.classList.toggle('peer', i !== sel && sameUnit(i, sel));
        b.classList.toggle('same', i !== sel && v !== 0 && v === vals[sel]);
        b.classList.toggle('wrong', v !== 0 && v !== solution[i]);
      });
    }

    function set(v) {
      if (puzzle[sel] || vals[sel] === v) return;
      vals[sel] = v;
      if (v && v !== solution[sel]) errors++;
      status();
      render();
      if (vals.every((x, i) => x === solution[i])) {
        ctx.end(Math.max(50, 1000 - Math.floor(time) - errors * 50), true);
      }
    }

    ctx.keys((k) => {
      if (k >= '1' && k <= '9') set(Number(k));
      else if (k === '0' || k === 'Backspace' || k === 'Delete') set(0);
      else if (k === 'ArrowLeft' && sel % 9 > 0) sel--;
      else if (k === 'ArrowRight' && sel % 9 < 8) sel++;
      else if (k === 'ArrowUp' && sel >= 9) sel -= 9;
      else if (k === 'ArrowDown' && sel < 72) sel += 9;
      else return k.startsWith('Arrow');
      render();
      return true;
    });

    const pad = ctx.pad([
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ label: String(n), fn: () => set(n) })),
      { label: '⌫', fn: () => set(0) },
    ], true);
    pad[0].parentElement.classList.add('compact');

    status();
    render();
    ctx.loop((dt) => {
      const before = Math.floor(time);
      time += dt / 1000;
      if (Math.floor(time) !== before) status();
    });
  },
};
