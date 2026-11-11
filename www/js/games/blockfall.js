// Blockfall – fallende Blöcke stapeln und volle Reihen räumen.

const W = 10, H = 20, C = 20, SIDE = 100;

const SHAPES = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
];
const COLORS = ['#4fd1a5', '#f2c14e', '#b388eb', '#5aa9e6', '#f08a5d', '#ef6b73', '#8bd450'];
const LINE_POINTS = [0, 100, 300, 500, 800];

export default {
  id: 'blockfall',
  name: 'Blockfall',
  icon: '🧱',
  desc: 'Blöcke stapeln, Reihen räumen.',
  help: '← → bewegen · ↑ drehen · ↓ schneller · Leertaste fallen lassen · P Pause',

  start(ctx) {
    const { g } = ctx.canvas(W * C + SIDE, H * C);
    const grid = Array.from({ length: H }, () => Array(W).fill(0)); // 0 = leer, sonst Farbindex+1
    let bag = [];
    const draw7 = () => {
      if (!bag.length) {
        bag = [0, 1, 2, 3, 4, 5, 6];
        for (let i = 6; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      return bag.pop();
    };
    const spawn = (id) => ({
      id,
      m: SHAPES[id].map((r) => [...r]),
      x: Math.floor((W - SHAPES[id].length) / 2),
      y: id === 0 ? -1 : 0,
    });

    let cur = spawn(draw7());
    let next = draw7();
    let score = 0, lines = 0, level = 1, acc = 0;

    const hits = (m, x, y) => m.some((row, r) => row.some((v, c) => {
      if (!v) return false;
      const X = x + c, Y = y + r;
      return X < 0 || X >= W || Y >= H || (Y >= 0 && grid[Y][X]);
    }));

    const status = () => { ctx.score(score); ctx.info(`Level ${level} · Reihen ${lines}`); };

    function lock() {
      cur.m.forEach((row, r) => row.forEach((v, c) => {
        if (v && cur.y + r >= 0) grid[cur.y + r][cur.x + c] = cur.id + 1;
      }));
      let cleared = 0;
      for (let y = H - 1; y >= 0; y--) {
        if (grid[y].every(Boolean)) {
          grid.splice(y, 1);
          grid.unshift(Array(W).fill(0));
          cleared++;
          y++;
        }
      }
      if (cleared) {
        score += LINE_POINTS[cleared] * level;
        lines += cleared;
        level = 1 + Math.floor(lines / 10);
      }
      cur = spawn(next);
      next = draw7();
      acc = 0;
      status();
      if (hits(cur.m, cur.x, cur.y)) { draw(); ctx.end(score); }
    }

    function move(dx) {
      if (!hits(cur.m, cur.x + dx, cur.y)) cur.x += dx;
    }
    function rotate() {
      const m = cur.m[0].map((_, c) => cur.m.map((row) => row[c]).reverse());
      for (const k of [0, -1, 1, -2, 2]) {
        if (!hits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; return; }
      }
    }
    function step(soft) {
      if (hits(cur.m, cur.x, cur.y + 1)) return lock();
      cur.y++;
      if (soft) { score += 1; ctx.score(score); }
    }
    function hardDrop() {
      while (!hits(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 2; }
      lock();
    }

    function cell(x, y, color, alpha = 1) {
      g.globalAlpha = alpha;
      g.fillStyle = color;
      g.beginPath();
      g.roundRect(x + 1, y + 1, C - 2, C - 2, 4);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.22)';
      g.fillRect(x + 4, y + 3, C - 8, 2);
      g.globalAlpha = 1;
    }

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, W * C + SIDE, H * C);
      g.fillStyle = '#141925';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.fillRect(x * C + C / 2 - 1, y * C + C / 2 - 1, 2, 2);

      grid.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x * C, y * C, COLORS[v - 1]); }));

      let gy = cur.y;
      while (!hits(cur.m, cur.x, gy + 1)) gy++;
      cur.m.forEach((row, r) => row.forEach((v, c) => {
        if (!v) return;
        if (gy + r >= 0) cell((cur.x + c) * C, (gy + r) * C, COLORS[cur.id], 0.2);
        if (cur.y + r >= 0) cell((cur.x + c) * C, (cur.y + r) * C, COLORS[cur.id]);
      }));

      // Seitenleiste
      const sx = W * C;
      g.fillStyle = '#1b2130';
      g.fillRect(sx, 0, SIDE, H * C);
      g.fillStyle = '#8f9ab3';
      g.font = '11px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('NÄCHSTER', sx + SIDE / 2, 24);
      const nm = SHAPES[next];
      const ox = sx + (SIDE - nm.length * C) / 2;
      nm.forEach((row, r) => row.forEach((v, c) => { if (v) cell(ox + c * C, 36 + r * C, COLORS[next]); }));
      g.fillStyle = '#8f9ab3';
      g.fillText('LEVEL', sx + SIDE / 2, 150);
      g.fillText('REIHEN', sx + SIDE / 2, 210);
      g.fillStyle = '#e8ecf4';
      g.font = 'bold 20px system-ui, sans-serif';
      g.fillText(level, sx + SIDE / 2, 175);
      g.fillText(lines, sx + SIDE / 2, 235);
    }

    ctx.keys((k) => {
      if (k === 'ArrowLeft') move(-1);
      else if (k === 'ArrowRight') move(1);
      else if (k === 'ArrowUp') rotate();
      else if (k === 'ArrowDown') step(true);
      else if (k === ' ') hardDrop();
      else return false;
      return true;
    });

    ctx.pad([
      { label: '◀', fn: () => move(-1), repeat: 110 },
      { label: '▶', fn: () => move(1), repeat: 110 },
      { label: '⟳', fn: rotate },
      { label: '▼', fn: () => step(true), repeat: 60 },
      { label: '⤓', fn: hardDrop },
    ]);

    status();
    ctx.loop((dt) => {
      acc += dt;
      const interval = Math.max(80, 800 - (level - 1) * 70);
      if (acc >= interval) { acc = 0; step(false); }
      if (!ctx.over) draw();
    });
  },
};
