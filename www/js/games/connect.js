// Viererreihe – abwechselnd Steine einwerfen; wer zuerst vier in einer Linie hat, gewinnt.

const COLS = 7, ROWS = 6, C = 46, TOP = 38;
const W = COLS * C, H = TOP + ROWS * C;
const ORDER = [3, 2, 4, 1, 5, 0, 6]; // Mitte zuerst: bessere Züge, schnelleres Abschneiden
const DEPTH = 6;
const WEIGHT = [0, 1, 6, 40, 0];
const COLOR = ['#0c0f16', '#4fd1a5', '#ef6b73'];

// Alle möglichen Vierer-Linien als Indexlisten
const LINES = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const er = r + dr * 3, ec = c + dc * 3;
      if (er >= ROWS || ec < 0 || ec >= COLS) continue;
      LINES.push([0, 1, 2, 3].map((k) => (r + dr * k) * COLS + c + dc * k));
    }
  }
}

export default {
  id: 'connect',
  name: 'Viererreihe',
  icon: '🟢',
  desc: 'Vier in eine Linie – gegen den Computer.',
  help: 'Spalte anklicken oder ← → wählen und Leertaste',

  start(ctx) {
    const { g, pos } = ctx.canvas(W, H);
    const b = Array(COLS * ROWS).fill(0); // 1 = Mensch, 2 = Computer
    let col = 3, turn = 1, moves = 0, win = null;

    const freeRow = (c) => {
      for (let r = ROWS - 1; r >= 0; r--) if (!b[r * COLS + c]) return r;
      return -1;
    };
    const won = (p) => LINES.find((l) => l.every((i) => b[i] === p));
    const full = () => ORDER.every((c) => b[c]);

    function evaluate(p) {
      let s = 0;
      for (const l of LINES) {
        let mine = 0, theirs = 0;
        for (const i of l) { if (b[i] === p) mine++; else if (b[i]) theirs++; }
        if (!theirs) s += WEIGHT[mine];
        else if (!mine) s -= WEIGHT[theirs];
      }
      return s;
    }

    // Negamax mit Alpha-Beta; Wert aus Sicht von p (am Zug)
    function search(depth, alpha, beta, p) {
      if (won(3 - p)) return -(100000 + depth);
      if (full()) return 0;
      if (!depth) return evaluate(p);
      for (const c of ORDER) {
        const r = freeRow(c);
        if (r < 0) continue;
        b[r * COLS + c] = p;
        const v = -search(depth - 1, -beta, -alpha, 3 - p);
        b[r * COLS + c] = 0;
        if (v > alpha) alpha = v;
        if (alpha >= beta) break;
      }
      return alpha;
    }

    function bestMove() {
      let best = -1, bestV = -Infinity;
      for (const c of ORDER) {
        const r = freeRow(c);
        if (r < 0) continue;
        b[r * COLS + c] = 2;
        const v = -search(DEPTH - 1, -Infinity, -bestV, 1);
        b[r * COLS + c] = 0;
        if (v > bestV) { bestV = v; best = c; }
      }
      return best;
    }

    // true, wenn das Spiel danach beendet ist
    function play(c, p) {
      b[freeRow(c) * COLS + c] = p;
      moves++;
      win = won(p);
      draw();
      if (win) {
        ctx.info(p === 1 ? 'Du gewinnst' : 'Computer gewinnt');
        ctx.end(p === 1 ? Math.max(100, 1000 - moves * 20) : 0, p === 1);
        return true;
      }
      if (full()) {
        ctx.info('Unentschieden');
        ctx.end(50);
        return true;
      }
      return false;
    }

    function drop(c) {
      if (turn !== 1 || freeRow(c) < 0) return;
      col = c;
      if (play(c, 1)) return;
      turn = 2;
      ctx.info('Computer denkt …');
      draw();
      ctx.later(() => {
        if (!play(bestMove(), 2)) {
          turn = 1;
          ctx.info('Du bist dran');
          draw();
        }
      }, 350);
    }

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, W, H);
      if (turn === 1 && !win) {
        g.fillStyle = COLOR[1];
        g.globalAlpha = 0.6;
        g.beginPath();
        g.arc(col * C + C / 2, TOP / 2, C / 2 - 7, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
      g.fillStyle = '#25345c';
      g.beginPath();
      g.roundRect(0, TOP, W, ROWS * C, 10);
      g.fill();
      b.forEach((v, i) => {
        const x = (i % COLS) * C + C / 2, y = TOP + Math.floor(i / COLS) * C + C / 2;
        g.fillStyle = COLOR[v];
        g.beginPath();
        g.arc(x, y, C / 2 - 5, 0, Math.PI * 2);
        g.fill();
        if (win && win.includes(i)) {
          g.strokeStyle = '#fff';
          g.lineWidth = 3;
          g.stroke();
        }
      });
    }

    const colAt = (e) => Math.max(0, Math.min(COLS - 1, Math.floor(pos(e).x / C)));
    ctx.on(ctx.stage, 'pointermove', (e) => {
      if (ctx.over || ctx.paused) return;
      col = colAt(e);
      draw();
    });
    ctx.on(ctx.stage, 'pointerup', (e) => { if (!ctx.over && !ctx.paused) drop(colAt(e)); });
    ctx.keys((k) => {
      if (k === 'ArrowLeft') col = Math.max(0, col - 1);
      else if (k === 'ArrowRight') col = Math.min(COLS - 1, col + 1);
      else if (k === ' ' || k === 'Enter' || k === 'ArrowDown') drop(col);
      else return false;
      draw();
      return true;
    });

    ctx.info('Du bist dran');
    draw();
  },
};
