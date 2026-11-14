/* 13/11 (João: «integrar o configurador deles no website, exatamente todas as features, sem inventar a roda; eles autorizam»).
   O configurador oficial de Pantiera Yachts (config.pantiera.com) embutido tal como está, já com a configuração do cliente.
   Computador: carrega sozinho quando a secção se aproxima e fica numa moldura quase em ecrã inteiro.
   Telemóvel: só abre com um toque e em ecrã inteiro, com botão de fechar, para nunca prender o scroll do dedo. */
(() => {
  const sec = document.querySelector('[data-cfg]'); if (!sec) return;
  const mold = sec.querySelector('[data-cfg-moldura]'), abre = sec.querySelector('[data-cfg-abre]'), fecha = sec.querySelector('[data-cfg-fecha]');
  const expande = sec.querySelector('[data-cfg-expande]');
  const tel = matchMedia('(max-width: 899px)');
  let frame = null;
  const poe = () => {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.src = mold.dataset.src; frame.title = 'Configurador 3D oficial del Pantiera 32';
    frame.allow = 'fullscreen; xr-spatial-tracking; clipboard-write'; frame.allowFullscreen = true; frame.className = 'cfg-frame';
    mold.append(frame); mold.classList.add('com-frame');
  };
  // 13/11 (João: «a página do configurador tem de abrir em ecrã inteiro quando clico no botão»): no computador e no
  // telemóvel, o botão abre o configurador a ocupar o ecrã todo, por cima do site, com um botão para fechar.
  const abrir = () => {
    poe();
    mold.classList.add('cheio'); document.documentElement.style.overflow = 'hidden'; document.body.classList.add('cfg-cheio');
    fecha.hidden = false; fecha.focus({ preventScroll: true });
  };
  const fechar = () => {
    mold.classList.remove('cheio'); document.documentElement.style.overflow = ''; document.body.classList.remove('cfg-cheio'); fecha.hidden = true;
    if (location.hash === '#construir') history.replaceState(null, '', location.pathname + location.search);
    (tel.matches || !expande ? abre : expande).focus({ preventScroll: true });
  };
  abre.addEventListener('click', abrir);
  // no computador, o configurador na página tem um botão de vidro para passar a ecrã inteiro
  if (expande) expande.addEventListener('click', abrir);
  fecha.addEventListener('click', fechar);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mold.classList.contains('cheio')) fechar(); });
  // as âncoras #construir do resto da página (e da home) abrem-no logo
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-mp-construir], a[href$="#construir"], a[href$="#configurador"]'); if (a) { e.preventDefault(); abrir(); } });
  // quem chega pelo botão da home (…/models/#construir) entra logo com o configurador em ecrã inteiro
  // (o 00-core.js tira o #construir do endereço logo ao abrir e guarda-o em DA.hashInicial)
  if (((window.DA && DA.hashInicial) || location.hash) === '#construir') abrir();
  // a barra de contacto fixa sai do caminho enquanto o configurador está à vista (o painel deles fica em baixo à direita)
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => document.body.classList.toggle('cfg-vista', e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.6] }).observe(mold);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e], io) => { if (e.isIntersecting && !tel.matches) { poe(); io.disconnect(); } }, { rootMargin: '60% 0px' }).observe(mold);
  }
})();
