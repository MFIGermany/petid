document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('submit', (e) => {
      if (!window.confirm(el.dataset.confirm || 'Deseja continuar?')) e.preventDefault();
    });
  });

  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (!toggle || !menu) return;

  const setMenuOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    toggle.classList.toggle('is-open', open);
    menu.hidden = !open;
    document.body.classList.toggle('mobile-menu-open', open);
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760 && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
    }
  });
});
