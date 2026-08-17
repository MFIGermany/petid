document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('submit', (e) => {
      if (!window.confirm(el.dataset.confirm || 'Deseja continuar?')) e.preventDefault();
    });
  });

  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (toggle && menu) {
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
  }

  const lightboxTriggers = document.querySelectorAll('[data-pet-lightbox]');

  if (lightboxTriggers.length) {
    const overlay = document.createElement('div');
    overlay.className = 'pet-photo-lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Foto ampliada do pet');
    overlay.innerHTML = `
      <button class="pet-photo-lightbox-close" type="button" aria-label="Fechar foto ampliada">×</button>
      <div class="pet-photo-lightbox-content">
        <img class="pet-photo-lightbox-image" src="" alt="">
      </div>
    `;
    document.body.appendChild(overlay);

    const lightboxImage = overlay.querySelector('.pet-photo-lightbox-image');
    const closeButton = overlay.querySelector('.pet-photo-lightbox-close');
    let lastTrigger = null;

    const openLightbox = (trigger) => {
      lastTrigger = trigger;
      lightboxImage.src = trigger.currentSrc || trigger.src;
      lightboxImage.alt = trigger.alt || 'Foto do pet';
      overlay.hidden = false;
      document.body.classList.add('pet-photo-lightbox-open');
      closeButton.focus();
    };

    const closeLightbox = () => {
      if (overlay.hidden) return;
      overlay.hidden = true;
      lightboxImage.src = '';
      document.body.classList.remove('pet-photo-lightbox-open');
      if (lastTrigger) lastTrigger.focus();
    };

    lightboxTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => openLightbox(trigger));
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(trigger);
        }
      });
    });

    closeButton.addEventListener('click', closeLightbox);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.classList.contains('pet-photo-lightbox-content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay.hidden) {
        closeLightbox();
      }
    });
  }
});
