// Schlange – Futter sammeln, wachsen, nicht anstoßen.

const N = 20, C = 16;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

export default {
  id: 'snake',
  name: 'Schlange',
  icon: '🐍',
  desc: 'Futter sammeln und wachsen.',
  help: 'Pfeiltasten lenken · P Pause',
  touch: 'Wischen lenkt die Schlange',

  start(ctx) {
    const { g } = ctx.canvas(N * C, N * C);
    let body = [[9, 10], [8, 10], [7, 10]]; // Kopf zuerst
    let dir = DIRS.right;
    const queue = [];
    let food = placeFood();
    let score = 0, acc = 0;

    function placeFood() {
      let p;
      do { p = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; }
      while (body.some(([x, y]) => x === p[0] && y === p[1]));
      return p;
    }

    function turn(name) {
      const d = DIRS[name];
      if (!d) return;
      const last = queue.length ? queue[queue.length - 1] : dir;
      if (d[0] === -last[0] && d[1] === -last[1]) return; // keine Kehrtwende
      if (d === last) return;
      if (queue.length < 2) queue.push(d);
    }

    function step() {
      if (queue.length) dir = queue.shift();
      const head = [body[0][0] + dir[0], body[0][1] + dir[1]];
      const grows = head[0] === food[0] && head[1] === food[1];
      const tail = grows ? body : body.slice(0, -1);
      if (head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N ||
          tail.some(([x, y]) => x === head[0] && y === head[1])) {
        return ctx.end(score);
      }
      body = [head, ...tail];
      if (grows) {
        score += 10;
        ctx.score(score);
        if (body.length === N * N) return ctx.end(score, true);
        food = placeFood();
      }
    }

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, N * C, N * C);
      g.fillStyle = '#ef6b73';
      g.beginPath();
      g.arc(food[0] * C + C / 2, food[1] * C + C / 2, C / 2 - 2, 0, Math.PI * 2);
      g.fill();
      body.forEach(([x, y], i) => {
        g.fillStyle = i === 0 ? '#8ff0cf' : '#4fd1a5';
        g.beginPath();
        g.roundRect(x * C + 1, y * C + 1, C - 2, C - 2, 4);
        g.fill();
      });
    }

    ctx.keys((k) => {
      if (!KEYS[k]) return false;
      turn(KEYS[k]);
      return true;
    });
    ctx.swipe(turn, true);
    ctx.pad([
      { label: '◀', fn: () => turn('left') },
      { label: '▲', fn: () => turn('up') },
      { label: '▼', fn: () => turn('down') },
      { label: '▶', fn: () => turn('right') },
    ]);

    ctx.loop((dt) => {
      acc += dt;
      const interval = Math.max(60, 150 - body.length * 2);
      if (acc >= interval) { acc = 0; step(); }
      if (!ctx.over) draw();
    });
  },
};
