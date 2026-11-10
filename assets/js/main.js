'use strict';
// La web se lee entera sin JavaScript. Esto añade el movimiento y los detalles.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* 1. Cabecera: cambia de color según la sección y muestra el avance de lectura */
const header = $('.top');
const darkSections = $$('.hero, .band, .method, .contact');
const navLinks = $$('.top__nav a[href^="#"]');
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  header.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

  const probe = 36; // mitad de la cabecera
  const overDark = darkSections.some(s => {
    const r = s.getBoundingClientRect();
    return r.top <= probe && r.bottom >= probe;
  });
  const atTop = y < 10;
  header.classList.toggle('is-light', !overDark);
  header.classList.toggle('is-dark', overDark && !atTop);

  // Enlace de la sección en la que estás
  let current = null;
  navLinks.forEach(a => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec && sec.getBoundingClientRect().top <= innerHeight * .4) current = a;
  });
  navLinks.forEach(a => a.classList.toggle('is-here', a === current && !a.classList.contains('top__cta')));

  updateSteps();
}

/* 2. Portada: rejilla de puntos que se ilumina alrededor del ratón */
const canvas = $('.hero__grid');
if (canvas && !reduced) {
  const ctx = canvas.getContext('2d');
  let w, h, dpr, dots = [], mouse = { x: -999, y: -999 }, t = 0, visible = true;
  const GAP = 28;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let x = GAP / 2; x < w; x += GAP) for (let y = GAP / 2; y < h; y += GAP) dots.push({ x, y, s: Math.random() * Math.PI * 2 });
  }
  function draw() {
    if (!visible) return requestAnimationFrame(draw);
    t += 0.012;
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      const dx = d.x - mouse.x, dy = d.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = Math.max(0, 1 - dist / 170);
      const wave = (Math.sin(t + d.s + d.x * 0.01) + 1) / 2;
      const a = 0.06 + wave * 0.06 + near * 0.75;
      const r = 1 + near * 1.8;
      const push = near * 7;
      const px = d.x + (dist ? dx / dist * push : 0);
      const py = d.y + (dist ? dy / dist * push : 0);
      ctx.fillStyle = near > 0.02 ? `rgba(217,185,120,${a})` : `rgba(250,250,247,${a})`;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  const host = canvas.parentElement;
  host.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  addEventListener('resize', resize);
  resize(); draw();
}

/* 3. Portada: programo, diseño y conecto, y al final la frase completa con la barra parpadeando */
const typed = $('.hero__typed');
if (typed && !reduced) {
  const lines = [
    'programo webs y aplicaciones',
    'diseño interfaces claras y atractivas',
    'conecto cada web con sus datos',
    'programo, diseño y conecto',
  ];
  let li = 0, ci = 0, deleting = false;
  typed.textContent = '';
  const step = () => {
    const text = lines[li];
    if (!deleting) {
      typed.textContent = text.slice(0, ++ci);
      if (ci < text.length) return setTimeout(step, 50);
      if (li === lines.length - 1) return; // la última se queda escrita
      deleting = true;
      return setTimeout(step, 2000);
    }
    typed.textContent = text.slice(0, --ci);
    if (ci > 0) return setTimeout(step, 22);
    deleting = false; li++;
    setTimeout(step, 300);
  };
  setTimeout(step, 1500);
}

/* 4. Portada: foto y tarjetas se mueven un poco con el ratón (profundidad) */
const side = $('.hero__side');
if (side && finePointer && !reduced) {
  const layers = $$('[data-depth]', side);
  side.addEventListener('pointermove', e => {
    const r = side.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    layers.forEach(l => { const d = +l.dataset.depth; l.style.transform = `translate3d(${nx * d}px, ${ny * d}px, 0)`; });
  });
  side.addEventListener('pointerleave', () => layers.forEach(l => { l.style.transform = ''; }));
}

/* 5. Aparición de los bloques al bajar */
const reveals = $$('.reveal');
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('is-in'));
}

/* 6. Esquema de AI Visual Composer: las tarjetas se encienden una tras otra */
const flow = $('.flow');
if (flow) {
  const cards = $$('.flow__step', flow);
  const toggle = $('.flow__toggle', flow);
  const pct = $('.flow__pct', flow);
  let i = -1, timer = null, visible = false, pausedByUser = false;

  const paint = () => {
    cards.forEach((c, n) => {
      c.classList.toggle('is-on', n === i);
      c.classList.toggle('is-done', n < i);
    });
  };
  const tick = () => {
    i = (i + 1) % (cards.length + 1);   // un paso de más deja todo apagado antes de repetir
    if (i === cards.length) { i = -1; }
    paint();
  };
  const run = () => { if (!timer) timer = setInterval(tick, 1300); };
  const stop = () => { clearInterval(timer); timer = null; };
  const sync = () => (visible && !pausedByUser && !reduced) ? run() : stop();

  if (reduced) {
    // Sin movimiento: todo se ve terminado y el botón no hace falta
    i = cards.length - 1; paint();
    cards.forEach(c => c.classList.add('is-done'));
    toggle.hidden = true;
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: .3 }).observe(flow);
    toggle.addEventListener('click', () => {
      pausedByUser = !pausedByUser;
      toggle.setAttribute('aria-pressed', String(pausedByUser));
      toggle.textContent = pausedByUser ? 'Reanudar animación' : 'Pausar animación';
      flow.classList.toggle('no-anim', pausedByUser);
      sync();
    });
  }
}

/* 7. Tarjetas de los programas: luz que sigue al ratón e inclinación 3D */
if (finePointer && !reduced) {
  $$('.app__shot').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.style.setProperty('--ry', (x - .5) * 8 + 'deg');
      card.style.setProperty('--rx', (.5 - y) * 8 + 'deg');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  });
}

/* 8. Método: cada paso enciende su pantalla en la ventana de la derecha */
function updateSteps() {} // la línea dorada ya no depende del scroll
const stepBtns = $$('.step');
const termBox = $('#term');
if (stepBtns.length && termBox) {
  const code = $('.term__code code', termBox);
  const title = $('.term__title', termBox);
  const mobileDesc = $('.term__mobile', termBox);
  const list = $('.steps');
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const scenes = [
    { title: 'project-manager', lines: code.innerHTML.split('\n') },
    { title: 'ia · asesor', lines: [
      '<span class="term__tab is-on">Claude</span> <span class="term__tab">Codex</span>',
      '',
      '<span class="term__you">Juan  </span> ¿Qué hago ahora con la sección de proyectos?',
      '<span class="term__ai">Claude</span> Te recomiendo quitar el texto de la derecha',
      '       y dejar el título solo. <i># menos ruido</i>',
      '<span class="term__ai">Codex </span> De acuerdo. Cambio listo para aplicar.',
      '<span class="term__you">Juan  </span> Adelante.',
      '',
      '<span class="term__ok">✓ Decisión anotada en AGENT_AI/ESTADO.md</span>',
    ]},
    { title: 'desarrollo', lines: [
      '<span class="term__cmd">&gt; aplicar cambio en index.html</span>',
      '',
      '<i>@@ sección proyectos @@</i>',
      '<span class="term__del">- ' + esc('<p>Programas que uso cada día…</p>') + '</span>',
      '<span class="term__add">+ ' + esc('<h2>Proyectos</h2>') + '</span>',
      '<span class="term__add">+ ' + esc('<ul class="facts">16:9 y 9:16</ul>') + '</span>',
      '',
      '<span class="term__ok">✓ Revisado por Juan</span>',
      '<span class="term__ok">✓ Anotado en la bitácora del proyecto</span>',
    ]},
    { title: 'pruebas', lines: [
      '<span class="term__cmd">&gt; python -m unittest discover tests</span>',
      '',
      'crear proyecto General ........... <span class="term__ok">✓</span>',
      'crear proyecto Documento ......... <span class="term__ok">✓</span>',
      'crear proyecto Proyecto .......... <span class="term__ok">✓</span>',
      'rellenar etiquetas [PROYECTO] .... <span class="term__ok">✓</span>',
      'avisar si falta una plantilla .... <span class="term__ok">✓</span>',
      '',
      '<i>Ran 15 tests in 0.84s</i>',
      '<span class="term__ok">OK · 15 pruebas superadas</span>',
      '<span class="term__ok">✓ Probado a mano en Windows</span>',
    ]},
    { title: 'entrega', lines: [
      '<span class="term__cmd">&gt; git commit -m "Versión 1.2.0"</span>',
      '<span class="term__cmd">&gt; git push</span>',
      '',
      '<span class="term__ok">✓ Documentación lista · README y CHANGELOG</span>',
      '<span class="term__ok">✓ Publicado en GitHub · v1.2.0</span>',
      '<span class="term__ok">✓ Entregado al cliente</span>',
      '',
      '<i># Proyecto terminado. Siguiente idea.</i>',
    ]},
  ];
  let current = 0, typing = null, auto = null, userPicked = false, visible = false;

  function show(i, animate = true) {
    current = i;
    stepBtns.forEach((b, n) => {
      b.setAttribute('aria-pressed', String(n === i));
      b.classList.toggle('is-past', n < i);
    });
    list.style.setProperty('--fill', (i / (stepBtns.length - 1)).toFixed(3));
    title.textContent = scenes[i].title;
    mobileDesc.textContent = $('.step__d', stepBtns[i]).textContent;
    clearTimeout(typing);
    const lines = scenes[i].lines;
    if (!animate || reduced) { code.innerHTML = lines.join('\n'); return; }
    let n = 0;
    const next = () => {
      n++;
      code.innerHTML = lines.slice(0, n).join('\n') + (n < lines.length ? '\n<span class="term__cursor"></span>' : '');
      if (n < lines.length) typing = setTimeout(next, n === 1 ? 350 : 160);
    };
    code.innerHTML = '<span class="term__cursor"></span>';
    typing = setTimeout(next, 250);
  }
  const startAuto = () => {
    if (auto || userPicked || reduced) return;
    auto = setInterval(() => show((current + 1) % scenes.length), 5200);
  };
  const stopAuto = () => { clearInterval(auto); auto = null; };

  stepBtns.forEach((b, n) => b.addEventListener('click', () => {
    userPicked = true; stopAuto(); show(n);
  }));
  show(0, false);
  if ('IntersectionObserver' in window) {
    let first = true;
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && first) { first = false; show(0); }
      visible ? startAuto() : stopAuto();
    }, { threshold: .35 }).observe(termBox);
  }
}

/* 10. Filtro de tecnologías */
const filters = $$('.filter');
const techs = $$('.tech');
filters.forEach(btn => btn.addEventListener('click', () => {
  const f = btn.dataset.filter;
  filters.forEach(b => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  techs.forEach(t => t.classList.toggle('is-off', f !== 'todo' && t.dataset.group !== f));
}));

/* 12. Año del pie */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();
