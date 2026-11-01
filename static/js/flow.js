/**
 * Flowchart Interactive Controller
 * Tooltip positioning on SVG node hover/tap & Canva diagram zoom modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFlowTooltips();
  initCanvaZoomModal();
});

function initFlowTooltips() {
  const tooltip = document.getElementById('flow-node-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipDesc = document.getElementById('tooltip-desc');
  const nodes = document.querySelectorAll('.flow-node');

  if (!tooltip || !nodes.length) return;

  nodes.forEach(node => {
    function show(e) {
      const title = node.dataset.title;
      const desc = node.dataset.desc;
      if (!title || !desc) return;

      tooltipTitle.textContent = title;
      tooltipDesc.textContent = desc;

      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      // Position tooltip with offset
      let posX = clientX + 15;
      let posY = clientY + 15;

      // Ensure within viewport
      if (posX + 260 > window.innerWidth) {
        posX = clientX - 265;
      }
      if (posY + 100 > window.innerHeight) {
        posY = clientY - 80;
      }

      tooltip.style.left = `${posX}px`;
      tooltip.style.top = `${posY}px`;
      tooltip.classList.add('visible');
    }

    function hide() {
      tooltip.classList.remove('visible');
    }

    node.addEventListener('mouseenter', show);
    node.addEventListener('mousemove', show);
    node.addEventListener('mouseleave', hide);

    // Touch support for mobile tablets
    node.addEventListener('touchstart', (e) => {
      show(e);
      e.stopPropagation();
    }, { passive: true });
  });

  document.addEventListener('touchstart', () => {
    tooltip.classList.remove('visible');
  }, { passive: true });
}

function initCanvaZoomModal() {
  const trigger = document.getElementById('canva-zoom-trigger');
  const modal = document.getElementById('canva-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');

  if (!trigger || !modal) return;

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Esc key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}
