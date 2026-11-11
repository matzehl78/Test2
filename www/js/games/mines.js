// Minenfeld – alle Felder ohne Mine aufdecken. Zahlen zeigen die Minen in der Nachbarschaft.

const N = 9, MINES = 10;

export default {
  id: 'mines',
  name: 'Minenfeld',
  icon: '💣',
  desc: 'Logisch aufdecken, Minen meiden.',
  help: 'Klick deckt auf · Rechtsklick setzt eine Flagge',
  touch: 'Tippen deckt auf · lang drücken oder 🚩-Modus setzt eine Flagge',

  start(ctx) {
    const cells = []; // { mine, open, flag, n, btn }
    let placed = false, opened = 0, flags = 0, time = 0, flagMode = false;

    const board = document.createElement('div');
    board.className = 'board mines';
    board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    ctx.stage.append(board);

    const neighbors = (i) => {
      const x = i % N, y = Math.floor(i / N), out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if ((dx || dy) && X >= 0 && X < N && Y >= 0 && Y < N) out.push(Y * N + X);
      }
      return out;
    };

    const status = () => ctx.info(`💣 ${MINES - flags} · ⏱ ${Math.floor(time)}s`);

    // Minen erst beim ersten Klick legen, damit der Start immer sicher ist
    function place(safe) {
      const blocked = new Set([safe, ...neighbors(safe)]);
      let left = MINES;
      while (left) {
        const i = Math.floor(Math.random() * N * N);
        if (blocked.has(i) || cells[i].mine) continue;
        cells[i].mine = true;
        left--;
      }
      cells.forEach((c, i) => { c.n = neighbors(i).filter((j) => cells[j].mine).length; });
      placed = true;
    }

    function open(i) {
      const stack = [i];
      while (stack.length) {
        const j = stack.pop();
        const c = cells[j];
        if (c.open || c.flag) continue;
        c.open = true;
        opened++;
        c.btn.classList.add('open');
        if (c.n) { c.btn.textContent = c.n; c.btn.classList.add('n' + c.n); }
        else stack.push(...neighbors(j));
      }
    }

    function toggleFlag(i) {
      const c = cells[i];
      if (c.open) return;
      c.flag = !c.flag;
      flags += c.flag ? 1 : -1;
      c.btn.textContent = c.flag ? '🚩' : '';
      status();
    }

    function reveal(i) {
      const c = cells[i];
      if (c.open || c.flag) return;
      if (!placed) place(i);
      if (c.mine) {
        cells.forEach((m) => { if (m.mine) m.btn.textContent = '💣'; });
        c.btn.classList.add('boom');
        return ctx.end(0);
      }
      open(i);
      if (opened === N * N - MINES) ctx.end(Math.max(1, 999 - Math.floor(time)), true);
    }

    for (let i = 0; i < N * N; i++) {
      const btn = document.createElement('button');
      const c = { mine: false, open: false, flag: false, n: 0, btn };
      cells.push(c);
      let press = 0, longPressed = false;
      ctx.on(btn, 'pointerdown', (e) => {
        longPressed = false;
        if (e.pointerType === 'mouse') return;
        press = setTimeout(() => {
          if (ctx.over || ctx.paused) return;
          longPressed = true;
          toggleFlag(i);
          if (navigator.vibrate) navigator.vibrate(30);
        }, 450);
      });
      for (const t of ['pointerup', 'pointerleave', 'pointercancel']) ctx.on(btn, t, () => clearTimeout(press));
      ctx.on(btn, 'click', () => {
        if (ctx.over || ctx.paused || longPressed) return;
        if (flagMode) toggleFlag(i); else reveal(i);
      });
      ctx.on(btn, 'contextmenu', (e) => {
        e.preventDefault();
        if (!ctx.over && !ctx.paused && !longPressed) toggleFlag(i);
      });
      board.append(btn);
    }

    ctx.pad([{
      label: '🚩',
      fn: (b) => { flagMode = !flagMode; b.classList.toggle('on', flagMode); },
    }]);

    status();
    ctx.loop((dt) => {
      if (!placed) return;
      const before = Math.floor(time);
      time += dt / 1000;
      if (Math.floor(time) !== before) status();
    });
  },
};
