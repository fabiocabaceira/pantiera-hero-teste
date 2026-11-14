/* 13/11 (João: «o vídeo oficial integrado no website, interação com o background, animações; sem som»).
   O filme oficial completo da Pantiera como vídeo do próprio site: sem som, em loop, pedido só quando a secção
   se aproxima. O fundo da secção lê a cor do filme (8×4 píxeis, 5 vezes por segundo) e acompanha-o, com um
   brilho à volta da moldura, como a luz de um ecrã num quarto escuro. A moldura cresce ao entrar (no CSS). */
(() => {
  const { $, reduz } = DA;
  const sec = $('[data-filme-sec]'); if (!sec) return;
  const v = $('[data-filme-video]', sec), prog = $('[data-filme-prog]', sec);
  const escolhe = () => {
    const lista = v.dataset.src.split(',').map((s) => { const [u, w] = s.trim().split(' '); return { u, w: +w }; });
    const precisa = innerWidth * Math.min(devicePixelRatio || 1, 2) * 0.66;
    return (lista.find((o) => o.w >= precisa) || lista[lista.length - 1]).u;
  };

  // a cor do filme: média de uma imagem de 8×4, suavizada para não piscar entre planos
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 9;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  let cor = [20, 24, 30], borda = [8, 8, 9], ultimo = 0, dentro = false;
  const le = (t) => {
    if (dentro && !v.paused && v.readyState >= 2 && t - ultimo > 200) {
      ultimo = t;
      try {
        cx.drawImage(v, 0, 0, 16, 9);
        const d = cx.getImageData(0, 0, 16, 9).data; let r = 0, g = 0, b = 0, br = 0, bg = 0, bb = 0, nb = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i]; g += d[i + 1]; b += d[i + 2];
          const px = (i / 4) % 16, py = Math.floor(i / 64);
          if (px === 0 || px === 15 || py === 0 || py === 8) { br += d[i]; bg += d[i + 1]; bb += d[i + 2]; nb++; } // anel de fora = a cor do fundo
        }
        const n = d.length / 4, k = 0.35;
        cor = [cor[0] + (r / n - cor[0]) * k, cor[1] + (g / n - cor[1]) * k, cor[2] + (b / n - cor[2]) * k];
        borda = [borda[0] + (br / nb - borda[0]) * k, borda[1] + (bg / nb - borda[1]) * k, borda[2] + (bb / nb - borda[2]) * k];
        sec.style.setProperty('--amb', `${cor[0] | 0} ${cor[1] | 0} ${cor[2] | 0}`);
        sec.style.setProperty('--borda', `${borda[0] | 0} ${borda[1] | 0} ${borda[2] | 0}`);
      } catch (e) { /* sem leitura de píxeis: o fundo fica na cor da marca */ }
    }
    if (v.duration) prog.style.transform = `scaleX(${v.currentTime / v.duration})`;
    requestAnimationFrame(le);
  };
  requestAnimationFrame(le);

  if (reduz) return; // com «Reducir movimiento» fica a capa
  // 13/11 (João: «o vídeo começa no scroll»): o ficheiro pede-se um pouco antes, mas o filme só arranca, do início,
  // quando um quarto dele está à vista; sai do ecrã, pára
  const pre = new IntersectionObserver(([e]) => { if (e.isIntersecting && !v.src) { v.src = escolhe(); v.preload = 'auto'; pre.disconnect(); } }, { rootMargin: '60% 0px' });
  pre.observe(sec);
  let comecou = false;
  const io = new IntersectionObserver(([e]) => {
    dentro = e.isIntersecting;
    if (dentro) { if (!v.src) v.src = escolhe(); if (!comecou) { comecou = true; try { v.currentTime = 0; } catch (x) {} } v.muted = true; v.play().catch(() => {}); } else v.pause();
  }, { threshold: 0.25 });
  io.observe(sec);
  document.addEventListener('visibilitychange', () => (document.hidden ? v.pause() : dentro && v.play().catch(() => {})));
})();
