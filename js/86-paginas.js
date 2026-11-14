/* Páginas próprias do telemóvel: no ecrã estreito, gama, prémios, dealers e proposta vivem em /models/, /awards/, /dealers/ e /quote/.
   No computador a home fica como está e o «Configure in 3D» abre o configurador por cima da página. */
(() => {
  const { $, $$ } = DA;
  const mq = matchMedia('(max-width:900px)');
  const eu = document.querySelector('script[src*="86-paginas"]');
  const RAIZ = eu ? eu.getAttribute('src').replace(/js\/86-paginas.*$/, '') : '';
  const PAGINA = { '#gama': 'models/', '#mundo': 'dealers/', '#proposta': 'quote/' };
  const home = document.body.classList.contains('pg-home');

  // o configurador sozinho, para abrir por cima da home no computador
  if (new URLSearchParams(location.search).get('so') === 'construir') document.documentElement.classList.add('so-construir');

  // chegar à home no telemóvel com #proposta, #mundo… ou ?modelo= leva à página certa
  if (home && mq.matches) {
    const hash = DA.hashInicial || '', modelo = new URLSearchParams(DA.buscaInicial || '').get('modelo');
    const pag = PAGINA[hash] || (modelo ? 'quote/' : null);
    if (pag) { location.replace(RAIZ + pag + (pag === 'quote/' && modelo ? '?modelo=' + encodeURIComponent(modelo) : '')); return; }
  }

  const destino = (a) => {
    if (!a.dataset.hrefPc) a.dataset.hrefPc = a.getAttribute('href');
    const h = a.dataset.hrefPc, i = h.indexOf('#');
    if (i < 0) return h;
    const pag = PAGINA[h.slice(i)];
    if (!pag || !mq.matches) return h;
    const m = a.dataset.modelo || (h.match(/[?&]modelo=([^#&]+)/) || [])[1];
    return RAIZ + pag + (m && pag === 'quote/' ? '?modelo=' + encodeURIComponent(decodeURIComponent(m)) : '');
  };
  const ajusta = () => $$('a[href]').forEach((a) => { const d = destino(a); if (a.getAttribute('href') !== d) a.setAttribute('href', d); });
  ajusta();
  mq.addEventListener('change', ajusta);
  // links que mudam de destino depois (o modelo escolhido no configurador) acertam-se no próprio toque
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    if (a.dataset.hrefPc && a.dataset.hrefPc !== a.getAttribute('href') && !mq.matches) a.dataset.hrefPc = a.getAttribute('href');
    if (mq.matches) { delete a.dataset.hrefPc; const d = destino(a); if (d !== a.getAttribute('href')) a.setAttribute('href', d); }
  }, true);

  // páginas sem a travessia: as rotas do mapa acendem logo
  if (!$('[data-travessia]')) $$('[data-mapa]').forEach((m) => m.classList.add('acende'));

  // computador, na home: «Configure in 3D» abre o configurador por cima, sem sair da página
  if (!home) return;
  const CFG_OFICIAL = 'https://config.pantiera.com/pantiera-32/?lang=es&c=2.0.10011000000000.0.0000000000001';
  let camada = null, voltar = null;
  const fecha = () => {
    if (!camada) return;
    camada.classList.remove('aberta');
    document.documentElement.classList.remove('com-camada');
    const c = camada; camada = null;
    setTimeout(() => c.remove(), 700);
    if (voltar) voltar.focus();
  };
  const abre = (href, origem) => {
    voltar = origem;
    const u = new URL(href, location.href);
    camada = document.createElement('div');
    camada.className = 'camada-3d';
    camada.setAttribute('role', 'dialog'); camada.setAttribute('aria-modal', 'true'); camada.setAttribute('aria-label', 'Configurador 3D oficial del Pantiera 32');
    // 13/11 (João: «a página do configurador tem de abrir em ecrã inteiro quando clico no botão»): a camada abre já o
    // configurador oficial de Pantiera Yachts, a ocupar o ecrã todo (antes abria a página do modelo, com título e
    // margens, e o configurador ficava pequeno). O fechar fica à esquerda: à direita estão as ferramentas deles.
    camada.innerHTML = `<button type="button" class="camada-fecha" aria-label="Cerrar el configurador"><span></span><span></span></button><p class="camada-carrega" aria-hidden="true"><i></i>Configurador 3D oficial</p><iframe title="Configurador 3D oficial del Pantiera 32" src="${CFG_OFICIAL}" allow="fullscreen; xr-spatial-tracking; clipboard-write" allowfullscreen loading="eager"></iframe>`;
    const fr = $('iframe', camada); fr.addEventListener('load', () => camada && camada.classList.add('carregou'), { once: true });
    document.body.appendChild(camada);
    document.documentElement.classList.add('com-camada');
    requestAnimationFrame(() => requestAnimationFrame(() => camada.classList.add('aberta')));
    $('.camada-fecha', camada).addEventListener('click', fecha);
    $('.camada-fecha', camada).focus();
  };
  document.addEventListener('click', (e) => {
    // 13/11 (controlo de qualidade): só os atalhos do 3D abrem a camada, e só se a home não tiver já o configurador
    // oficial embutido (#configurador). «Pantiera 32» e as outras ligações seguem para a página do barco.
    const a = e.target.closest('a[href*="models/"][href$="#construir"]');
    if (!a || mq.matches || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const cfg = document.getElementById('configurador');
    if (cfg) { e.preventDefault(); cfg.scrollIntoView({ behavior: 'smooth' }); return; }
    e.preventDefault(); abre(a.getAttribute('href'), a);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
})();
// telemóvel: o cabeçalho ganha fundo depois do primeiro ecrã (só muda a classe quando o estado muda)
(() => {
  let rolou = null;
  DA.aCada((t, ecra) => { const r = ecra.y > ecra.h * 0.6; if (r !== rolou) { rolou = r; document.body.classList.toggle('rolou', r); } });
})();
