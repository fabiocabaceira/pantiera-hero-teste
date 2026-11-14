/* 13/11: luz vermelha que segue o rato no fundo do fecho; o barco balança um pouco quando o rato lhe passa por cima. */
(() => {
  const sec = document.querySelector('.fecho'); if (!sec) return;
  const foto = sec.querySelector('.fecho-foto'); const reduz = document.documentElement.classList.contains('sem-mov');
  // 13/11 (João: «todas as animações também no telemóvel»): sem rato, a luz vermelha segue o scroll e passeia devagar
  // pela secção, e o barco balança com o movimento; só corre enquanto o fecho está no ecrã
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let ve = false, raf = 0, sx = 72, sy = 40;
    const passo = (now) => {
      raf = 0; if (!ve) return;
      const r = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      const tx = reduz ? 60 : 50 + 22 * Math.sin(now / 2600), ty = 22 + 46 * p; // com «reduzir movimento» a luz só segue o scroll
      sx += (tx - sx) * 0.08; sy += (ty - sy) * 0.08;
      sec.style.setProperty('--lx', sx.toFixed(2) + '%'); sec.style.setProperty('--ly', sy.toFixed(2) + '%');
      if (!reduz) { const o = Math.sin(now / 1900); sec.style.setProperty('--bx', (o * 6).toFixed(1) + 'px'); sec.style.setProperty('--br', (o * 0.5).toFixed(2) + 'deg'); sec.style.setProperty('--by', (Math.cos(now / 1500) * 2).toFixed(1) + 'px'); }
      raf = requestAnimationFrame(passo);
    };
    new IntersectionObserver(([e]) => { ve = e.isIntersecting; if (ve && !raf) raf = requestAnimationFrame(passo); }).observe(sec);
    return;
  }
  let alvo = null, cx = 72, cy = 45, tx = 72, ty = 45, raf = 0;
  const anda = () => { cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12; sec.style.setProperty('--lx', cx.toFixed(2) + '%'); sec.style.setProperty('--ly', cy.toFixed(2) + '%'); raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(anda) : 0; };
  sec.addEventListener('pointermove', (e) => {
    const r = sec.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width) * 100; ty = ((e.clientY - r.top) / r.height) * 100;
    if (!raf) raf = requestAnimationFrame(anda);
    if (reduz || !foto) return;
    const f = foto.getBoundingClientRect();
    const dentro = e.clientX > f.left && e.clientX < f.right && e.clientY > f.top && e.clientY < f.bottom;
    if (dentro) { const nx = (e.clientX - (f.left + f.width / 2)) / f.width; sec.style.setProperty('--bx', (nx * -18).toFixed(1) + 'px'); sec.style.setProperty('--br', (nx * -1.2).toFixed(2) + 'deg'); sec.style.setProperty('--by', '-4px'); }
    else { sec.style.setProperty('--bx', '0px'); sec.style.setProperty('--br', '0deg'); sec.style.setProperty('--by', '0px'); }
  }, { passive: true });
  sec.addEventListener('pointerleave', () => { tx = 72; ty = 45; if (!raf) raf = requestAnimationFrame(anda); ['--bx', '--by'].forEach((k) => sec.style.setProperty(k, '0px')); sec.style.setProperty('--br', '0deg'); });
})();
