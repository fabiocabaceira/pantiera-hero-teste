/* 13/11 (João: «um stop nos reels, um stop no botão — ainda a ver-se os reels — e só depois a entrada do barco»).
   A secção dos reels tem um palco preso ao ecrã e um trilho que sobe com o scroll, em três tempos:
   1. pausa nos reels (o carrossel parado ao centro);
   2. o trilho sobe e a banda do configurador entra por baixo, com os reels ainda à vista em cima;
   3. pausa no botão «Configura tu Pantiera 32» (a banda acaba em preto no fundo do ecrã; o barco ainda não se vê).
   Depois a secção solta-se e o palco preto do barco entra por baixo, sem costura. */
(() => {
  const sec = document.querySelector('.so-reels'), pin = document.querySelector('[data-reels-pin]');
  const trilho = document.querySelector('[data-reels-trilho]'), banda = document.querySelector('.banda-cfg');
  if (!sec || !pin || !trilho || !banda) return;
  // raio-X: a cena a cores é uma cópia da cena em negativo, vista só dentro da faixa que desce
  const cena = banda.querySelector('[data-raiox-cena]'), pct = banda.querySelector('[data-raiox-pct]');
  if (cena) { const real = cena.cloneNode(true); real.classList.replace('raiox-base', 'raiox-real'); real.removeAttribute('data-raiox-cena'); cena.after(real); }
  // em «ecrãs»: pausa nos reels, subida, pausa no botão (a altura da secção no CSS é 1 + a soma destes)
  const PAUSA_REELS = 0.6, SUBIDA = 0.55, PAUSA_BOTAO = 0.9;
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // a construção do botão: de 30 % a 92 % da subida, inteira antes de a banda parar
  // (verificação 14/11: a banda pára a 1,13 ecrãs; o botão tem de estar inteiro antes disso)
  const C0 = PAUSA_REELS + SUBIDA * 0.3, C1 = PAUSA_REELS + SUBIDA * 0.92;
  const fase = (c, a, b) => { const t = Math.min(1, Math.max(0, (c - a) / (b - a))); return (t * t * (3 - 2 * t)).toFixed(4); };
  const semMov = document.documentElement.classList.contains('sem-mov');
  const movel = matchMedia('(max-width: 899px)');
  let pedido = 0, H = 0, bh = 0;
  const mede = () => { H = pin.clientHeight; bh = banda.offsetHeight; };
  const pinta = () => {
    pedido = 0; if (!H) mede();
    const y = -sec.getBoundingClientRect().top / H; // ecrãs andados desde que o palco prendeu
    // 14/11 (João: «na versão mobile tira todos os stops do scroll»): no telemóvel não há palco preso; a banda vem a
    // seguir aos reels no fluxo normal e a construção do botão segue a posição dela no ecrã
    const solto = movel.matches;
    const k = solto ? 0 : suave(PAUSA_REELS, PAUSA_REELS + SUBIDA, y);
    trilho.style.transform = solto ? '' : `translate3d(0,${(-k * bh).toFixed(1)}px,0)`;
    const bt = solto ? banda.getBoundingClientRect().top / innerHeight : 0;
    // 14/11 (João: «o botão não está a aparecer a tempo»). Medido frame a frame: a entrada corria por relógio, com
    // atrasos até 2,5 s, e ao chegar à pausa o botão ainda estava invisível (69 % das imagens com ele incompleto).
    // Agora anda com o scroll: a linha desce, a folha abre do centro, o barco ganha nitidez, a placa entra e por fim a
    // chave, os pontos e as cores, tudo enquanto a banda sobe; fica inteiro logo no início da pausa, nos dois sentidos.
    const c = semMov ? 1 : solto ? (0.98 - bt) / 0.5 : (y - C0) / (C1 - C0);
    const st = banda.style;
    st.setProperty('--cl', fase(c, 0, 0.3)); st.setProperty('--cf', fase(c, 0.25, 0.6));
    // (iPhone 14/11) o barco aparece com a folha: com o scroll parado a meio, a folha nunca fica branca
    st.setProperty('--cb', fase(c, 0.22, 0.55)); st.setProperty('--cp', fase(c, 0.5, 0.85)); st.setProperty('--cd', fase(c, 0.72, 1));
    banda.classList.toggle('vista', c > 0);
    banda.classList.toggle('pronta', c >= 1);
    // durante a pausa, a linha continua por baixo da placa até ao fundo da banda (e daí até à proa, js/48-capitulos.js)
    const sv = semMov ? 1 : solto ? suave(0.5, 0.1, bt) : suave(C1, PAUSA_REELS + SUBIDA + PAUSA_BOTAO * 0.85, y);
    st.setProperty('--s', sv.toFixed(4));
    if (pct) pct.textContent = String(Math.round(sv * 100)).padStart(3, '0');
  };
  // (auditoria do telemóvel) só trabalha enquanto a secção está no ecrã; fora dela as animações do botão-barco param
  let ve = true;
  const agenda = () => { if (ve && !pedido) pedido = requestAnimationFrame(pinta); };
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { ve = e.isIntersecting; banda.classList.toggle('anima', ve); if (ve) agenda(); }, { rootMargin: '10% 0px' }).observe(sec);
  else banda.classList.add('anima');
  addEventListener('scroll', agenda, { passive: true });
  let largura = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== largura || pin.clientHeight !== H) { largura = innerWidth; H = 0; } agenda(); });
  if (document.fonts) document.fonts.ready.then(() => { H = 0; agenda(); });
  pinta();
})();
