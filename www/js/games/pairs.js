// Paare – zwei gleiche Karten finden, mit möglichst wenigen Zügen.

const SYMBOLS = ['🍎', '🚀', '🎲', '🌙', '⚓', '🎈', '🔑', '🌵'];

export default {
  id: 'pairs',
  name: 'Paare',
  icon: '🃏',
  desc: 'Gleiche Karten aufdecken.',
  help: 'Zwei Karten anklicken – gleiche Paare bleiben offen',

  start(ctx) {
    const deck = [...SYMBOLS, ...SYMBOLS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const board = document.createElement('div');
    board.className = 'board pairs';
    board.style.gridTemplateColumns = 'repeat(4, 1fr)';
    ctx.stage.append(board);

    let open = [], locked = false, moves = 0, found = 0, time = 0, started = false;
    const status = () => ctx.info(`Züge ${moves} · ⏱ ${Math.floor(time)}s`);
    const show = (card, up) => {
      card.btn.textContent = up ? card.sym : '';
      card.btn.classList.toggle('up', up);
    };

    deck.forEach((sym) => {
      const btn = document.createElement('button');
      const card = { sym, btn, done: false };
      ctx.on(btn, 'click', () => {
        if (ctx.over || ctx.paused || locked || card.done || open.includes(card)) return;
        started = true;
        show(card, true);
        open.push(card);
        if (open.length < 2) return;

        moves++;
        status();
        const [a, b] = open;
        open = [];
        if (a.sym === b.sym) {
          for (const c of [a, b]) { c.done = true; c.btn.classList.add('done'); }
          if (++found === SYMBOLS.length) {
            ctx.end(Math.max(10, 500 - moves * 15 - Math.floor(time)), true);
          }
        } else {
          locked = true;
          ctx.later(() => { show(a, false); show(b, false); locked = false; }, 750);
        }
      });
      board.append(btn);
    });

    status();
    ctx.loop((dt) => {
      if (!started) return;
      const before = Math.floor(time);
      time += dt / 1000;
      if (Math.floor(time) !== before) status();
    });
  },
};
