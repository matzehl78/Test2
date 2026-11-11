// Dreierkette – zwei benachbarte Steine tauschen, um Reihen aus drei oder mehr zu bilden.

const N = 7, C = 46, S = N * C, TYPES = 6, MOVES = 25;
const COLORS = ['#ef6b73', '#5aa9e6', '#f2c14e', '#4fd1a5', '#b388eb', '#f08a5d'];

export default {
  id: 'match3',
  name: 'Dreierkette',
  icon: '💎',
  desc: 'Steine tauschen, Dreierreihen bilden.',
  help: 'Stein anklicken, dann Nachbarn anklicken – oder Stein in eine Richtung ziehen',

  start(ctx) {
    const { g, pos } = ctx.canvas(S, S);
    let b = [], sel = -1, moves = MOVES, score = 0, chain = 0;
    let busy = false, clearing = null, fade = 0, down = null;

    const rnd = () => Math.floor(Math.random() * TYPES);
    const status = () => { ctx.score(score); ctx.info(`Züge ${moves}`); };
    const swap = (i, j) => { [b[i], b[j]] = [b[j], b[i]]; };
    const adjacent = (i, j) => (Math.abs(i - j) === 1 && Math.floor(i / N) === Math.floor(j / N)) || Math.abs(i - j) === N;

    function matches() {
      const m = new Set();
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const i = r * N + c, v = b[i];
          if (v < 0) continue;
          if (c <= N - 3 && v === b[i + 1] && v === b[i + 2]) { m.add(i); m.add(i + 1); m.add(i + 2); }
          if (r <= N - 3 && v === b[i + N] && v === b[i + 2 * N]) { m.add(i); m.add(i + N); m.add(i + 2 * N); }
        }
      }
      return m;
    }

    function hasMove() {
      for (let i = 0; i < N * N; i++) {
        for (const j of [i + 1, i + N]) {
          if (j >= N * N || !adjacent(i, j)) continue;
          swap(i, j);
          const ok = matches().size > 0;
          swap(i, j);
          if (ok) return true;
        }
      }
      return false;
    }

    // Startfeld ohne fertige Reihen, aber mit mindestens einem möglichen Zug
    function fill() {
      do {
        b = Array.from({ length: N * N }, rnd);
        for (let m = matches(); m.size; m = matches()) m.forEach((i) => { b[i] = rnd(); });
      } while (!hasMove());
    }

    function collapse() {
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) {
          const v = b[r * N + c];
          if (v < 0) continue;
          b[r * N + c] = -1;
          b[w * N + c] = v;
          w--;
        }
        for (; w >= 0; w--) b[w * N + c] = rnd();
      }
    }

    function resolve() {
      const m = matches();
      if (!m.size) {
        busy = false;
        chain = 0;
        if (moves <= 0) return ctx.end(score, true);
        if (!hasMove()) fill(); // Sackgasse: neu mischen
        return;
      }
      chain++;
      score += m.size * 10 * chain;
      ctx.score(score);
      clearing = m;
      fade = 1;
      ctx.later(() => {
        m.forEach((i) => { b[i] = -1; });
        clearing = null;
        collapse();
        ctx.later(resolve, 180);
      }, 220);
    }

    function trySwap(i, j) {
      sel = -1;
      if (busy) return;
      swap(i, j);
      if (!matches().size) return swap(i, j); // kein Treffer: Tausch zurücknehmen
      moves--;
      busy = true;
      status();
      resolve();
    }

    function shape(type, x, y, r) {
      g.beginPath();
      if (type === 0) g.arc(x, y, r, 0, Math.PI * 2);
      else if (type === 1) g.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, 5);
      else {
        // Dreieck, Raute, Sechseck, Stern
        const n = [0, 0, 3, 4, 6, 10][type];
        for (let k = 0; k < n; k++) {
          const a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
          const rr = type === 5 && k % 2 ? r * 0.5 : type === 2 ? r * 1.15 : r;
          const yy = type === 2 ? y + r * 0.2 : y;
          g.lineTo(x + Math.cos(a) * rr, yy + Math.sin(a) * rr);
        }
        g.closePath();
      }
      g.fill();
    }

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, S, S);
      for (let i = 0; i < N * N; i++) {
        const x = (i % N) * C, y = Math.floor(i / N) * C;
        g.fillStyle = i === sel ? '#333d55' : '#161b28';
        g.beginPath();
        g.roundRect(x + 2, y + 2, C - 4, C - 4, 8);
        g.fill();
        if (b[i] < 0) continue;
        const scale = clearing && clearing.has(i) ? Math.max(0, fade) : 1;
        g.fillStyle = COLORS[b[i]];
        shape(b[i], x + C / 2, y + C / 2, 14 * scale);
      }
    }

    const cellAt = (p) => {
      const c = Math.floor(p.x / C), r = Math.floor(p.y / C);
      return c < 0 || c >= N || r < 0 || r >= N ? -1 : r * N + c;
    };

    ctx.on(ctx.stage, 'pointerdown', (e) => {
      if (ctx.over || ctx.paused || busy) return;
      const p = pos(e), i = cellAt(p);
      down = i < 0 ? null : { i, ...p };
    });
    ctx.on(window, 'pointerup', (e) => {
      if (!down || ctx.over || ctx.paused) return;
      const { i, x, y } = down;
      down = null;
      const p = pos(e), dx = p.x - x, dy = p.y - y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > C * 0.35) {
        // Ziehen: Nachbar in Zugrichtung
        const c = i % N, r = Math.floor(i / N);
        const horizontal = Math.abs(dx) > Math.abs(dy);
        const nc = c + (horizontal ? Math.sign(dx) : 0), nr = r + (horizontal ? 0 : Math.sign(dy));
        if (nc >= 0 && nc < N && nr >= 0 && nr < N) trySwap(i, nr * N + nc);
      } else if (sel >= 0 && adjacent(sel, i)) trySwap(sel, i);
      else sel = sel === i ? -1 : i;
    });

    fill();
    status();
    ctx.loop((dt) => {
      fade -= dt / 220;
      draw();
    });
  },
};
