// Zahlenschmelze – Kacheln schieben, gleiche Zahlen verschmelzen zur doppelten.

const N = 4, S = 320, GAP = 8, C = (S - GAP * (N + 1)) / N;
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

// Indizes einer Reihe/Spalte, beginnend an der Wand, zu der geschoben wird
const line = (dir, k) => [0, 1, 2, 3].map((i) => (
  dir === 'left' ? k * N + i
    : dir === 'right' ? k * N + (N - 1 - i)
      : dir === 'up' ? i * N + k
        : (N - 1 - i) * N + k
));

export default {
  id: 'merge',
  name: 'Zahlenschmelze',
  icon: '🔢',
  desc: 'Gleiche Zahlen zusammenschieben.',
  help: 'Pfeiltasten schieben alle Kacheln · gleiche Zahlen verschmelzen',
  touch: 'Wischen schiebt alle Kacheln · gleiche Zahlen verschmelzen',

  start(ctx) {
    const { g } = ctx.canvas(S, S);
    const cells = Array(N * N).fill(0);
    let score = 0;

    function add() {
      const empty = [];
      cells.forEach((v, i) => { if (!v) empty.push(i); });
      if (empty.length) cells[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    }

    function canMove() {
      return cells.some((v, i) => !v ||
        (i % N < N - 1 && v === cells[i + 1]) ||
        (i < N * (N - 1) && v === cells[i + N]));
    }

    function slide(dir) {
      let moved = false;
      for (let k = 0; k < N; k++) {
        const idx = line(dir, k);
        const vals = idx.map((i) => cells[i]).filter(Boolean);
        const out = [];
        for (let i = 0; i < vals.length; i++) {
          if (vals[i] === vals[i + 1]) {
            out.push(vals[i] * 2);
            score += vals[i] * 2;
            i++;
          } else out.push(vals[i]);
        }
        while (out.length < N) out.push(0);
        idx.forEach((ci, j) => {
          if (cells[ci] !== out[j]) moved = true;
          cells[ci] = out[j];
        });
      }
      if (!moved) return;
      add();
      status();
      draw();
      if (!canMove()) ctx.end(score);
    }

    const status = () => { ctx.score(score); ctx.info(`Höchste ${Math.max(...cells)}`); };

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, S, S);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      cells.forEach((v, i) => {
        const x = GAP + (i % N) * (C + GAP), y = GAP + Math.floor(i / N) * (C + GAP);
        const p = v ? Math.log2(v) : 0;
        g.fillStyle = v ? `hsl(${(165 + p * 27) % 360} 55% ${Math.max(40, 66 - p * 2)}%)` : '#1b2130';
        g.beginPath();
        g.roundRect(x, y, C, C, 10);
        g.fill();
        if (!v) return;
        g.fillStyle = '#0c0f16';
        g.font = `bold ${v < 100 ? 30 : v < 1000 ? 25 : 19}px system-ui, sans-serif`;
        g.fillText(v, x + C / 2, y + C / 2 + 1);
      });
    }

    ctx.keys((k) => {
      if (!KEYS[k]) return false;
      slide(KEYS[k]);
      return true;
    });
    ctx.swipe((d) => { if (d !== 'tap') slide(d); });

    add();
    add();
    status();
    draw();
  },
};
