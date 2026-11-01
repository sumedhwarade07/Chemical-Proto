/**
 * Gallery Filter and Lightbox Modal Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initGalleryFilters();
  initGalleryLightbox();
});

function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('#gallery-filters .filter-chip');
  const items = document.querySelectorAll('#gallery-masonry .masonry-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'flex';
          item.classList.remove('filtered-out');
        } else {
          item.style.display = 'none';
          item.classList.add('filtered-out');
        }
      });
    });
  });
}

function initGalleryLightbox() {
  const modal = document.getElementById('gallery-lightbox');
  const modalImg = document.getElementById('gallery-lightbox-img');
  const modalCaption = document.getElementById('gallery-lightbox-caption');
  const closeBtn = document.getElementById('gallery-lightbox-close');
  const prevBtn = document.getElementById('gallery-lightbox-prev');
  const nextBtn = document.getElementById('gallery-lightbox-next');
  const allItems = Array.from(document.querySelectorAll('#gallery-masonry .masonry-item'));

  if (!modal || !allItems.length) return;

  let currentVisibleIndex = 0;

  function getVisibleItems() {
    return allItems.filter(item => item.style.display !== 'none');
  }

  function openLightbox(item) {
    const visibleItems = getVisibleItems();
    currentVisibleIndex = visibleItems.indexOf(item);
    if (currentVisibleIndex === -1) currentVisibleIndex = 0;

    const target = visibleItems[currentVisibleIndex] || item;
    const imgSrc = target.dataset.full || target.querySelector('img').src;
    const caption = target.dataset.caption || target.querySelector('h4').textContent;

    modalImg.src = imgSrc;
    modalImg.alt = caption;
    modalCaption.textContent = caption;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showNext() {
    const visibleItems = getVisibleItems();
    if (!visibleItems.length) return;
    currentVisibleIndex = (currentVisibleIndex + 1) % visibleItems.length;
    openLightbox(visibleItems[currentVisibleIndex]);
  }

  function showPrev() {
    const visibleItems = getVisibleItems();
    if (!visibleItems.length) return;
    currentVisibleIndex = (currentVisibleIndex - 1 + visibleItems.length) % visibleItems.length;
    openLightbox(visibleItems[currentVisibleIndex]);
  }

  allItems.forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
  });

  closeBtn?.addEventListener('click', closeLightbox);
  nextBtn?.addEventListener('click', showNext);
  prevBtn?.addEventListener('click', showPrev);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') showNext();
    else if (e.key === 'ArrowLeft') showPrev();
  });
}
