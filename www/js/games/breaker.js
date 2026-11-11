// Mauerbrecher – Ball mit dem Schläger im Spiel halten und alle Steine abräumen.

const W = 320, H = 420;
const PW = 64, PH = 8, PY = 392, R = 5;
const COLS = 8, BW = 36, BH = 14, GAP = 3, TOP = 40;
const LEFT = (W - (COLS * BW + (COLS - 1) * GAP)) / 2;
const ROW_COLORS = ['#ef6b73', '#f08a5d', '#f2c14e', '#8bd450', '#4fd1a5', '#5aa9e6', '#b388eb', '#e8ecf4'];

export default {
  id: 'breaker',
  name: 'Mauerbrecher',
  icon: '🏓',
  desc: 'Ball abprallen lassen, Mauer abräumen.',
  help: 'Maus oder ← → bewegt den Schläger · Klick/Leertaste startet den Ball',
  touch: 'Finger ziehen bewegt den Schläger · Tippen startet den Ball',

  start(ctx) {
    const { g, pos } = ctx.canvas(W, H);
    let px = W / 2, score = 0, lives = 3, level = 1;
    let bricks = [];
    let ball = { x: 0, y: 0, vx: 0, vy: 0, stuck: true };
    const held = { left: false, right: false };

    const speed = () => 210 + level * 25;
    const status = () => { ctx.score(score); ctx.info(`Level ${level} · ${'♥'.repeat(lives)}`); };

    function build() {
      bricks = [];
      const rows = Math.min(3 + level, 8);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < COLS; c++) {
          bricks.push({ x: LEFT + c * (BW + GAP), y: TOP + r * (BH + GAP), color: ROW_COLORS[r] });
        }
      }
    }

    function launch() {
      if (!ball.stuck) return;
      ball.stuck = false;
      const a = (Math.random() - 0.5) * 0.8;
      ball.vx = speed() * Math.sin(a);
      ball.vy = -speed() * Math.cos(a);
    }

    function movePaddle(x) {
      px = Math.max(PW / 2, Math.min(W - PW / 2, x));
    }

    // Ein Teilschritt; maximal wenige Pixel, damit nichts durchtunnelt
    function advance(t) {
      ball.x += ball.vx * t;
      ball.y += ball.vy * t;

      if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }

      if (ball.vy > 0 && ball.y + R >= PY && ball.y - R <= PY + PH && Math.abs(ball.x - px) <= PW / 2 + R) {
        const a = Math.max(-1, Math.min(1, (ball.x - px) / (PW / 2))) * (Math.PI / 3);
        ball.vx = speed() * Math.sin(a);
        ball.vy = -speed() * Math.cos(a);
        ball.y = PY - R;
      }

      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        const dx = ball.x - Math.max(b.x, Math.min(ball.x, b.x + BW));
        const dy = ball.y - Math.max(b.y, Math.min(ball.y, b.y + BH));
        if (dx * dx + dy * dy >= R * R) continue;
        if (Math.abs(dx) > Math.abs(dy)) ball.vx = Math.sign(dx) * Math.abs(ball.vx);
        else ball.vy = (dy === 0 ? -Math.sign(ball.vy) : Math.sign(dy)) * Math.abs(ball.vy);
        bricks.splice(i, 1);
        score += 10 * level;
        status();
        break;
      }

      if (!bricks.length) {
        level++;
        score += 100;
        build();
        ball.stuck = true;
        status();
      } else if (ball.y - R > H) {
        lives--;
        status();
        if (lives <= 0) return ctx.end(score);
        ball.stuck = true;
      }
    }

    function draw() {
      g.fillStyle = '#0c0f16';
      g.fillRect(0, 0, W, H);
      for (const b of bricks) {
        g.fillStyle = b.color;
        g.beginPath();
        g.roundRect(b.x, b.y, BW, BH, 3);
        g.fill();
      }
      g.fillStyle = '#e8ecf4';
      g.beginPath();
      g.roundRect(px - PW / 2, PY, PW, PH, 4);
      g.fill();
      g.fillStyle = '#f2c14e';
      g.beginPath();
      g.arc(ball.x, ball.y, R, 0, Math.PI * 2);
      g.fill();
      if (ball.stuck) {
        g.fillStyle = '#8f9ab3';
        g.font = '12px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('Tippen zum Starten', W / 2, H / 2 + 40);
      }
    }

    // Maus: Schläger folgt dem Zeiger. Touch: Finger zieht relativ, damit er den Schläger nicht verdeckt.
    let lastX = null;
    ctx.on(ctx.stage, 'pointerdown', (e) => {
      if (e.pointerType === 'mouse') movePaddle(pos(e).x); else lastX = pos(e).x;
    });
    ctx.on(ctx.stage, 'pointermove', (e) => {
      if (ctx.paused || ctx.over) return;
      const x = pos(e).x;
      if (e.pointerType === 'mouse') movePaddle(x);
      else if (lastX !== null) { movePaddle(px + (x - lastX) * 1.4); lastX = x; }
    });
    ctx.on(ctx.stage, 'pointerup', () => { lastX = null; if (!ctx.paused && !ctx.over) launch(); });
    ctx.on(ctx.stage, 'pointercancel', () => { lastX = null; });
    ctx.keys((k) => {
      if (k === 'ArrowLeft') held.left = true;
      else if (k === 'ArrowRight') held.right = true;
      else if (k === ' ') launch();
      else return false;
      return true;
    });
    ctx.on(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft') held.left = false;
      if (e.key === 'ArrowRight') held.right = false;
    });

    build();
    status();
    ctx.loop((dt) => {
      const t = dt / 1000;
      if (held.left) movePaddle(px - 380 * t);
      if (held.right) movePaddle(px + 380 * t);
      if (ball.stuck) {
        ball.x = px;
        ball.y = PY - R;
      } else {
        const steps = Math.ceil(speed() * t / 3);
        for (let i = 0; i < steps && !ball.stuck && !ctx.over; i++) advance(t / steps);
      }
      if (!ctx.over) draw();
    });
  },
};
