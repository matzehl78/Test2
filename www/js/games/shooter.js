// Sternenwacht – Angreiferwellen abwehren. Das Schiff feuert von selbst.

const W = 320, H = 420, PY = 392;
const FOE_COLOR = ['#b388eb', '#f08a5d', '#f2c14e'];

export default {
  id: 'shooter',
  name: 'Sternenwacht',
  icon: '🚀',
  desc: 'Angreiferwellen abwehren.',
  help: 'Maus oder ← → steuert das Schiff · es feuert automatisch',

  start(ctx) {
    const { g, pos } = ctx.canvas(W, H);
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: 0.3 + Math.random(),
    }));
    const held = { left: false, right: false };
    let px = W / 2, lives = 3, score = 0, wave = 0;
    let toSpawn = 0, spawnT = 0, fireT = 0, safe = 0, banner = 0;
    let shots = [], foes = [], bombs = [], sparks = [];

    const status = () => { ctx.score(score); ctx.info(`Welle ${wave} · ${'♥'.repeat(Math.max(0, lives))}`); };

    function nextWave() {
      wave++;
      toSpawn = 6 + wave * 2;
      spawnT = 1.2;
      banner = 1.6;
      status();
    }

    // Typ 0: pendelt, Typ 1: stürzt schnell, Typ 2: langsam, robust, wirft Bomben
    function spawn() {
      const r = Math.random();
      const type = wave >= 3 && r < 0.2 ? 2 : wave >= 2 && r < 0.45 ? 1 : 0;
      const x = 50 + Math.random() * (W - 100);
      foes.push({ type, x, bx: x, y: -14, t: Math.random() * 6, hp: type === 2 ? 3 : 1, cool: 1 });
    }

    function burst(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4, color });
      }
    }

    function hit() {
      if (safe > 0) return;
      lives--;
      safe = 1.5;
      burst(px, PY, '#8ff0cf');
      status();
      if (lives <= 0) ctx.end(score);
    }

    function update(t) {
      if (held.left) px -= 300 * t;
      if (held.right) px += 300 * t;
      px = Math.max(14, Math.min(W - 14, px));
      safe -= t;
      banner -= t;

      fireT -= t;
      if (fireT <= 0) { shots.push({ x: px, y: PY - 12 }); fireT = 0.28; }

      if (toSpawn > 0) {
        spawnT -= t;
        if (spawnT <= 0) { spawn(); toSpawn--; spawnT = Math.max(0.35, 1.1 - wave * 0.06); }
      } else if (!foes.length) nextWave();

      for (const s of shots) s.y -= 440 * t;
      shots = shots.filter((s) => s.y > -10 && !s.dead);

      for (const f of foes) {
        f.t += t;
        if (f.type === 0) { f.y += (45 + wave * 4) * t; f.x = f.bx + Math.sin(f.t * 2) * 36; }
        else if (f.type === 1) f.y += (110 + wave * 6) * t;
        else {
          f.y += 30 * t;
          f.cool -= t;
          if (f.cool <= 0 && f.y > 0) { bombs.push({ x: f.x, y: f.y + 10 }); f.cool = 1.7; }
        }
        for (const s of shots) {
          if (s.dead || Math.abs(s.x - f.x) > 13 || Math.abs(s.y - f.y) > 12) continue;
          s.dead = true;
          if (--f.hp <= 0) {
            score += (f.type === 2 ? 30 : 10) * wave;
            burst(f.x, f.y, FOE_COLOR[f.type]);
            ctx.score(score);
            break;
          }
        }
        if (f.hp > 0 && Math.abs(f.x - px) < 20 && Math.abs(f.y - PY) < 16) { f.hp = 0; hit(); }
        if (f.hp > 0 && f.y > H + 14) { f.hp = 0; hit(); } // durchgebrochen
      }
      foes = foes.filter((f) => f.hp > 0);

      for (const b of bombs) {
        b.y += 190 * t;
        if (Math.abs(b.x - px) < 11 && Math.abs(b.y - PY) < 10) { b.y = H + 99; hit(); }
      }
      bombs = bombs.filter((b) => b.y < H + 10);

      for (const s of sparks) { s.x += s.vx * t; s.y += s.vy * t; s.life -= t; }
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of stars) { s.y += s.s * 30 * t; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    }

    function poly(points) {
      g.beginPath();
      points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fill();
    }

    function draw() {
      g.fillStyle = '#080a12';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#56607a';
      for (const s of stars) g.fillRect(s.x, s.y, s.s + 0.5, s.s + 0.5);

      g.fillStyle = '#8ff0cf';
      for (const s of shots) g.fillRect(s.x - 1.5, s.y - 6, 3, 10);
      g.fillStyle = '#ff5d6c';
      for (const b of bombs) { g.beginPath(); g.arc(b.x, b.y, 3.5, 0, Math.PI * 2); g.fill(); }

      for (const f of foes) {
        g.fillStyle = FOE_COLOR[f.type];
        const { x, y } = f;
        if (f.type === 0) poly([[x, y - 10], [x + 12, y], [x, y + 10], [x - 12, y]]);
        else if (f.type === 1) poly([[x - 9, y - 10], [x + 9, y - 10], [x, y + 12]]);
        else poly([[x - 13, y - 8], [x + 13, y - 8], [x + 8, y + 9], [x - 8, y + 9]]);
        g.fillStyle = '#080a12';
        g.fillRect(x - 2, y - 2, 4, 4);
      }

      if (safe <= 0 || Math.floor(safe * 10) % 2) {
        g.fillStyle = '#4fd1a5';
        poly([[px, PY - 13], [px + 13, PY + 10], [px, PY + 4], [px - 13, PY + 10]]);
      }

      for (const s of sparks) {
        g.globalAlpha = Math.max(0, s.life / 0.4);
        g.fillStyle = s.color;
        g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
      }
      g.globalAlpha = 1;

      if (banner > 0) {
        g.globalAlpha = Math.min(1, banner);
        g.fillStyle = '#e8ecf4';
        g.font = 'bold 22px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText(`Welle ${wave}`, W / 2, H / 2 - 20);
        g.globalAlpha = 1;
      }
    }

    const follow = (e) => { if (!ctx.paused && !ctx.over) px = pos(e).x; };
    ctx.on(ctx.stage, 'pointermove', follow);
    ctx.on(ctx.stage, 'pointerdown', follow);
    ctx.keys((k) => {
      if (k === 'ArrowLeft') held.left = true;
      else if (k === 'ArrowRight') held.right = true;
      else return false;
      return true;
    });
    ctx.on(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft') held.left = false;
      if (e.key === 'ArrowRight') held.right = false;
    });

    ctx.loop((dt) => {
      update(dt / 1000);
      draw();
    });
  },
};
