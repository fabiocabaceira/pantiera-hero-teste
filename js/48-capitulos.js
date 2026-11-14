/* 13/11 (João: «cinema fotográfico; a entrada do barco tem de meter respeito; depois a secção do barco capítulo a
   capítulo, com luz nas linhas, o barco a subir, letras em roleta suave, fundo fixo»).
   Palco preso ao ecrã enquanto a secção passa. Coreografia (tudo pelo scroll, em curvas suaves, nunca a saltar):
   · A: o filme oficial em ecrã inteiro (o barco ao centro, a luz vermelha de proa a popa);
   · B: o desenho técnico nasce POR CIMA do barco do filme, no mesmo sítio e tamanho, de proa a popa (--w), e o filme
     apaga-se por completo (--f);
   · C: só depois do filme ido, o desenho desliza para a direita (computador) ou encolhe para cima (telemóvel) (--mv)
     e o texto entra (--tx);
   · depois, cada capítulo acende uma zona das linhas, passa uma luz pelo barco e o texto muda em roleta suave.
   As medidas usam a altura do palco (100svh): a barra do Safari a abrir e fechar não mexe em nada. */
(() => {
  const raiz = document.querySelector('[data-cap]'); if (!raiz || !window.DA) return;
  const { reduz } = DA;
  const arts = [...raiz.querySelectorAll('[data-cap-art]')], N = arts.length;
  const palco = raiz.querySelector('.cap-palco'), barco = raiz.querySelector('[data-cap-barco]');
  const tela = raiz.querySelector('[data-cap-tela]'), conta = raiz.querySelector('[data-cap-conta]');
  const scan = raiz.querySelector('.cap-scan');
  const prog = [...raiz.querySelectorAll('.cap-prog li')];
  // a entrada em «ecrãs» de scroll; os capítulos ocupam N - 1 ecrãs depois dela
  const ENTRADA = 2.2;
  const PASSOS = ENTRADA + N;
  raiz.style.setProperty('--passos', String(PASSOS));
  // onde está o barco dentro do fotograma do filme (medido nos fotogramas: proa a 7,9 %, a planta inteira ocupa 93 %)
  const FILME = { h: { w: 1920, h: 1080, top: 0.079, alt: 0.93 }, v: { w: 720, h: 1280, top: 0.078, alt: 0.915 } };
  let atual = -1, pedido = 0, geo = null;

  const vert = () => matchMedia('(max-width: 899px)').matches;
  const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  const semMov = document.documentElement.classList.contains('sem-mov');

  /* 14/11 (João: «análise frame a frame do scroll: o barco não aparece, tudo tem de aparecer no seu tempo»).
     O filme do barco já não toca por relógio: anda com o scroll, imagem a imagem, num canvas (o motor da yacht-hero).
     Medido antes: 0,8 a 0,9 s de palco preto e, no telemóvel, o barco só aparecia com o topo da secção já passado.
     Regras do motor: as 101 imagens pedem-se depois do primeiro gesto, com a secção a 3 ecrãs (durante os reels),
     primeiro uma em cada 8; ficam comprimidas e só ±10 descomprimidas (createImageBitmap); desenha só quando a imagem muda; mistura
     as vizinhas; amortecimento de 0,085 por imagem de 60 Hz, igual a 120 Hz. Com «Reducir movimiento» do rodapé,
     só a última imagem, parada. */
  const filme = (() => {
    const ctx = tela.getContext('2d', { alpha: false });
    const n = +tela.dataset.n || 101, JANELA = 10, AMORTECE = 0.14;
    let pasta = '', blobs = [], bms = new Map(), aCaminho = new Set();
    let alvo = semMov ? n - 1 : 0, agora = alvo, rodando = false, t0 = 0, desenhado = '', ouvinte = null;
    const url = (i) => pasta + String(i).padStart(4, '0') + '.webp';
    const janela = (c) => {
      const p = pasta;
      for (let i = Math.max(0, c - JANELA); i <= Math.min(n - 1, c + JANELA); i++) {
        if (!blobs[i] || bms.has(i) || aCaminho.has(i)) continue;
        aCaminho.add(i);
        createImageBitmap(blobs[i]).then((bm) => { aCaminho.delete(i); if (p !== pasta) return bm.close(); bms.set(i, bm); pede(); }, () => aCaminho.delete(i));
      }
      for (const [i, bm] of bms) if (Math.abs(i - c) > JANELA + 6) { bm.close(); bms.delete(i); }
    };
    const carrega = () => {
      const nova = vert() ? tela.dataset.m : tela.dataset.d;
      if (nova === pasta) return;
      bms.forEach((bm) => bm.close()); bms = new Map(); aCaminho = new Set(); blobs = []; desenhado = '';
      pasta = nova; const p = pasta;
      const ordem = semMov ? [n - 1] : [0];
      if (!semMov) { const visto = new Set([0]); for (const passo of [8, 4, 2, 1]) for (let i = 0; i < n; i += passo) if (!visto.has(i)) { visto.add(i); ordem.push(i); } }
      let prox = 0, ativos = 0;
      const segue = () => {
        while (ativos < 6 && prox < ordem.length) {
          const i = ordem[prox++]; ativos++;
          fetch(url(i)).then((r) => (r.ok ? r.blob() : null)).then((bl) => {
            if (bl && p === pasta) { blobs[i] = bl; if (Math.abs(i - Math.round(agora)) <= JANELA) janela(Math.round(agora)); }
          }, () => {}).finally(() => { ativos--; segue(); });
        }
      };
      segue();
    };
    const perto = (i) => { for (let d = 0; d <= JANELA + 6; d++) { if (bms.has(i - d)) return bms.get(i - d); if (bms.has(i + d)) return bms.get(i + d); } return null; };
    const cobre = (bm, a) => {
      if (tela.width !== bm.width || tela.height !== bm.height) { tela.width = bm.width; tela.height = bm.height; }
      ctx.globalAlpha = a; ctx.drawImage(bm, 0, 0);
    };
    const desenha = () => {
      const a = Math.floor(agora), f = agora - a, chave = a + ':' + Math.round(f * 20);
      if (chave === desenhado) return;
      janela(a);
      const base = bms.get(a) || perto(a);
      if (!base) return;
      desenhado = chave;
      cobre(base, 1);
      if (bms.has(a) && bms.has(a + 1) && f > 0.05 && Math.abs(alvo - agora) < 1.5) cobre(bms.get(a + 1), f);
      ctx.globalAlpha = 1;
      tela.dataset.q = String(Math.round(agora));
    };
    const tick = (t) => {
      const dt = Math.min(64, t - t0); t0 = t;
      agora += (alvo - agora) * (1 - Math.pow(1 - AMORTECE, dt / 16.667));
      if (Math.abs(alvo - agora) < 0.004) agora = alvo;
      desenha();
      if (ouvinte) ouvinte(agora / (n - 1));
      if (agora !== alvo) requestAnimationFrame(tick); else rodando = false;
    };
    function pede() { desenhado = ''; if (!rodando) { rodando = true; t0 = performance.now(); requestAnimationFrame(tick); } }
    // p de 0 a 1: o ponto do filme que o scroll pede
    const vai = (p) => { if (semMov) return; const novo = p * (n - 1); if (novo !== alvo) { alvo = novo; pede(); } };
    // com o palco fora do ecrã não se anima: salta-se para o ponto certo (quem sobe depressa e volta não vê o filme
    // a andar para trás quando o palco reentra)
    const salta = (p) => {
      if (semMov) return; const novo = p * (n - 1);
      if (novo === alvo && agora === alvo) return;
      alvo = agora = novo; desenhado = ''; desenha(); if (ouvinte) ouvinte(agora / (n - 1));
    };
    // quem quer saber onde o filme vai (o título do telemóvel só entra com o filme parado na última imagem)
    const ouve = (fn) => { ouvinte = fn; };
    return { carrega, vai, salta, pede, ouve };
  })();
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // a caixa do barco no capítulo (a do CSS, sem transformações) e a caixa do barco do filme (object-fit:cover)
  const mede = () => {
    const W = palco.clientWidth, H = palco.clientHeight;
    const f = vert() ? FILME.v : FILME.h;
    const s = Math.max(W / f.w, H / f.h), fh = f.h * s, oy = (H - fh) / 2;
    const bh = fh * f.alt, bw = bh * 800 / 2432;
    const a = { x: barco.offsetLeft, y: barco.offsetTop, w: barco.offsetWidth, h: barco.offsetHeight };
    const b = { x: W / 2 - bw / 2, y: oy + fh * f.top, w: bw, h: bh };
    geo = { H, dx: b.x - a.x, dy: b.y - a.y, s: b.h / (a.h || 1) };
  };

  const mostra = (i) => {
    if (i === atual) return;
    const ant = atual; atual = i;
    arts.forEach((a, k) => { a.classList.toggle('atual', k === i); a.classList.toggle('antes', k < i); a.classList.toggle('depois', k > i); a.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    prog.forEach((li, k) => li.classList.toggle('on', k <= i));
    conta.textContent = `${String(i).padStart(2, '0')} / ${String(N - 1).padStart(2, '0')}`;
    const a = arts[i];
    raiz.style.setProperty('--zy', a.dataset.y); raiz.style.setProperty('--zx', a.dataset.x);
    raiz.classList.toggle('cap-todo', a.dataset.todo === '1');
    // a «transição de capítulo»: o barco roda um pouco para um lado e para o outro
    raiz.style.setProperty('--rot', `${i === 0 ? 0 : (i % 2 ? -1.6 : 1.6)}deg`);
    raiz.dataset.dir = ant < i ? 'baixo' : 'cima';
    // a luz que varre o barco a cada capítulo (a animação recomeça)
    if (ant !== -1 && scan) { scan.classList.remove('vai'); void scan.offsetWidth; scan.classList.add('vai'); }
  };

  // 13/11 (Cynhas, via João): no telemóvel não há capítulos presos ao scroll («senão fica um scroll infinito»).
  // Fica uma secção curta: o filme do barco anda com o palco (14/11), acaba no barco com a luz na popa, entra o título
  // e a página segue.
  const curto = matchMedia('(max-width: 899px)');
  // 14/11 (João: «a linha vermelha tem de continuar até ao barco»). A linha da banda continua dentro do palco, do topo
  // até à proa do barco do filme (--fio-h), desenhada pelo scroll (--fl), e chega lá quando a luz da proa acende.
  const fioH = () => {
    const W = palco.clientWidth, H = palco.clientHeight, f = vert() ? FILME.v : FILME.h;
    const s = Math.max(W / f.w, H / f.h), fh = f.h * s;
    raiz.style.setProperty('--fio-h', Math.round((H - fh) / 2 + fh * f.top) + 'px');
  };
  let curtoFeito = false, pedidoC = 0, pediuFilme = false;
  // telemóvel: o palco não prende. O barco acende-se quando a proa entra no ecrã (palco a 93 %), a linha chega à proa
  // com o palco a 82 % e a luz corre de proa a popa até o palco chegar ao topo do ecrã; aí entra o título.
  const curtoPinta = () => {
    pedidoC = 0;
    if (!curto.matches) return;
    const r = palco.getBoundingClientRect(), vh = DA.ecra.h; // altura fixa: a barra do browser não mexe no progresso
    const q = -r.top / vh;
    // a proa entra no ecrã com o palco a 93 %: o barco acende-se aí e a luz corre até à popa com o palco no topo
    raiz.style.setProperty('--fl', lin(-1, -0.82, q).toFixed(4));
    // (verificação 14/11) as 3 primeiras imagens são pretas: começa na 3; e acaba com o palco a 15 % do topo, para o
    // título entrar ainda com o palco à vista a quem desce a ritmo normal
    const fp = 0.03 + 0.97 * lin(-0.93, -0.15, q);
    if (r.top < vh && r.bottom > 0) filme.vai(fp); else filme.salta(fp);
  };
  // o título entra quando o filme chega à última imagem e pára (fluidez, 14/11: o vidro desfocado do título por cima de
  // um canvas ainda a desenhar dava até 11 % de imagens lentas no telemóvel lento); sai se se voltar para cima
  filme.ouve((k) => { if (curto.matches) raiz.classList.toggle('cap-curto-fim', k >= 0.985); });
  if (semMov) raiz.classList.add('cap-curto-fim');
  const modoCurto = () => {
    raiz.classList.toggle('cap-curto', curto.matches);
    fioH(); if (pediuFilme) filme.carrega();
    if (!curto.matches || curtoFeito) return;
    curtoFeito = true; mostra(0);
    addEventListener('scroll', () => { if (!pedidoC) pedidoC = requestAnimationFrame(curtoPinta); }, { passive: true });
    curtoPinta();
  };
  modoCurto();
  curto.addEventListener('change', modoCurto);

  const pinta = () => {
    pedido = 0;
    if (curto.matches) return;
    if (!geo) mede();
    const r = raiz.getBoundingClientRect(), H = geo.H;
    const p = Math.min(PASSOS - 1, Math.max(0, -r.top / H)); // ecrãs andados desde que o palco prendeu
    const w = suave(0.45, 1.25, p);    // B: o desenho nasce de proa a popa
    const f = suave(0.85, 1.45, p);    // B: o filme apaga-se
    const mv = suave(1.5, 2.15, p);    // C: o desenho vai para o seu lugar (só depois do filme ido)
    const tx = suave(1.7, 2.2, p);     // C: o texto entra
    const k = 1 - mv;
    const st = raiz.style;
    st.setProperty('--w', w.toFixed(4)); st.setProperty('--f', f.toFixed(4));
    st.setProperty('--mv', mv.toFixed(4)); st.setProperty('--tx', tx.toFixed(4));
    st.setProperty('--wh', Math.sin(Math.PI * w).toFixed(4)); // a cabeça de luz da linha que desenha
    st.setProperty('--bx', (geo.dx * k).toFixed(2) + 'px'); st.setProperty('--by', (geo.dy * k).toFixed(2) + 'px');
    st.setProperty('--bs', (1 + (geo.s - 1) * k).toFixed(4));
    raiz.classList.toggle('cap-desenhado', w >= 1);
    raiz.classList.toggle('cap-sem-filme', f >= 1);
    raiz.classList.toggle('cap-pronto', tx >= 0.98);
    // 14/11: a linha da banda desce dentro do palco e chega à proa com o palco a 45 % do ecrã; o filme anda com o
    // scroll: o barco acende-se com o palco a 75 %, a luz da proa acende quando a linha chega e corre até à popa já
    // com o palco preso, até p = 0,45, onde o desenho técnico começa a nascer por cima (B).
    // (13/11, João: «não se pode ver a animação do barco antes do stop do botão»: o palco só entra depois da pausa.)
    const q = -r.top / H;
    st.setProperty('--fl', lin(-1, -0.45, q).toFixed(4));
    const fp = lin(-0.75, 0.45, q);
    if (r.top < H && f < 1) filme.vai(fp); else filme.salta(fp);
    const c = (p - ENTRADA) / ((N - 1) / N);
    mostra(Math.min(N - 1, Math.max(0, Math.floor(c))));
  };
  const agenda = () => { if (!pedido) pedido = requestAnimationFrame(pinta); };

  if (reduz) raiz.classList.add('cap-calmo');
  addEventListener('scroll', agenda, { passive: true });
  // só a largura muda as contas: a barra do Safari a mexer na altura não refaz nada (o palco é 100svh)
  let largura = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== largura || !geo || palco.clientHeight !== geo.H) { largura = innerWidth; geo = null; fioH(); } agenda(); });
  // as imagens do filme pedem-se com a secção a 3 ecrãs (durante os reels), para estarem cá quando o palco entra, e
  // nunca antes do primeiro gesto (regra 1 da yacht-hero: o Lighthouse não faz scroll e a porta PageSpeed conta tudo)
  let perto = false, gesto = scrollY > 0;
  const tenta = () => { if (perto && gesto && !pediuFilme) { pediuFilme = true; filme.carrega(); filme.pede(); } };
  const GESTOS = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'];
  const primeiro = () => { GESTOS.forEach((g) => removeEventListener(g, primeiro)); gesto = true; tenta(); };
  if (!gesto) GESTOS.forEach((g) => addEventListener(g, primeiro, { passive: true }));
  new IntersectionObserver(([en], o) => { if (!en.isIntersecting) return; o.disconnect(); perto = true; tenta(); }, { rootMargin: '0px 0px 300% 0px' }).observe(raiz);
  if (document.fonts) document.fonts.ready.then(() => { geo = null; agenda(); });
  pinta();
})();
