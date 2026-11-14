/* 14/11 (João: «usa o barco em wireframe, com uma ferramenta que diga que vamos personalizar o barco; não um botão
   normal, um botão construído, com outra estrutura»). O acesso ao configurador é uma folha de desenho técnico com o
   Pantiera 32 em wireframe, uma ferramenta, pontos de configuração e uma placa com o nome. A cada 3,4 s uma luz vermelha
   passa pelo barco e pinta-o com a cor seguinte da paleta (o gesto do configurador). A linha vermelha da banda desce
   até à folha e continua por baixo dela até ao barco da secção seguinte (js/48-capitulos.js). */
(() => {
  const t = document.querySelector('[data-taller]'); if (!t) return;
  const banda = t.closest('.banda-cfg');
  const linha = banda && banda.querySelector('.banda-cfg-linha'), fio = banda && banda.querySelector('.banda-cfg-fio');
  const tinta = t.querySelector('[data-taller-tinta]'), nova = t.querySelector('[data-taller-nova]');
  const cores = [...t.querySelectorAll('.taller-cores i')];
  const acerta = () => {
    if (!t.offsetHeight) return;
    if (linha) linha.style.height = Math.round(t.offsetTop) + 'px';
    if (fio) fio.style.top = Math.round(t.offsetTop + t.offsetHeight) + 'px';
  };
  acerta();
  addEventListener('resize', acerta, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(acerta);
  if ('ResizeObserver' in window && banda) new ResizeObserver(acerta).observe(banda);

  // a pintura: a camada nova entra por uma cortina da popa para a proa, com a luz vermelha à frente
  const calmo = matchMedia('(prefers-reduced-motion: reduce)'), toque = matchMedia('(hover: none)');
  let i = 0, ocupado = false;
  const cor = (k) => getComputedStyle(cores[k]).getPropertyValue('--c').trim();
  const marca = () => cores.forEach((c, k) => c.classList.toggle('on', k === i));
  const pinta = () => {
    if (ocupado || !cores.length) return;
    ocupado = true;
    const j = (i + 1) % cores.length;
    nova.style.setProperty('--tc', cor(j));
    t.classList.remove('pinta'); void t.offsetWidth; t.classList.add('pinta');
    setTimeout(() => { i = j; tinta.style.setProperty('--tc', cor(i)); marca(); t.classList.remove('pinta'); ocupado = false; }, 1150);
  };
  marca();
  setInterval(() => {
    // só com a folha inteira (a construção anda com o scroll, js/51-pausas.js) e com a banda no ecrã
    if (calmo.matches || document.hidden || !banda.classList.contains('pronta') || !banda.classList.contains('anima')) return;
    pinta();
  }, 3400);
  t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !calmo.matches && banda.classList.contains('pronta')) pinta(); });

  // ao tocar: a folha avança para quem toca e só depois a página muda (no computador a camada abre ao mesmo tempo)
  t.addEventListener('click', (e) => {
    t.classList.add('abre'); setTimeout(() => t.classList.remove('abre'), 1200);
    if (toque.matches && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setTimeout(() => { location.href = t.href; }, 380); }
  });
})();
