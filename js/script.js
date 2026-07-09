const API_KEY = 'bzr3XefvuQ1Kwyfo0B6Fc7Vbo32DZI5wIgLeueDe';
const API_BASE = 'https://api.nasa.gov/planetary/apod';

function $(sel) {
  return document.querySelector(sel);
}

function showLoading(container) {
  container.innerHTML = '<div class="placeholder">Loading images…</div>';
}

function showError(container, message) {
  container.innerHTML = `<div class="placeholder">Error: ${message}</div>`;
}

function truncate(text, max = 200) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function renderGallery(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔭</div>
        <p>No images available for the selected range.</p>
      </div>`;
    return;
  }

  // Show newest first
  items = items.slice().reverse();

  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'gallery-item';

    // Title
    const title = document.createElement('h3');
    title.textContent = item.title || item.date || 'Untitled';

    // Media (image or video)
    let mediaEl;
    if (item.media_type === 'image') {
      mediaEl = document.createElement('img');
      mediaEl.src = item.url;
      mediaEl.alt = item.title || 'NASA image';
    } else {
      // Video: show thumbnail if available, otherwise show a simple play badge
      if (item.thumbnail_url) {
        mediaEl = document.createElement('img');
        mediaEl.src = item.thumbnail_url;
        mediaEl.alt = item.title || 'NASA video thumbnail';
      } else {
        const vidBox = document.createElement('div');
        vidBox.style.height = '200px';
        vidBox.style.display = 'flex';
        vidBox.style.alignItems = 'center';
        vidBox.style.justifyContent = 'center';
        vidBox.style.background = '#000';
        vidBox.style.color = '#fff';
        vidBox.textContent = '▶ Video';
        mediaEl = vidBox;
      }
    }

    // Description
    const desc = document.createElement('p');
    desc.textContent = truncate(item.explanation, 220);

    // Clickable area opens modal with full details
    const wrapper = document.createElement('div');
    wrapper.style.cursor = 'pointer';
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.appendChild(title);
    wrapper.appendChild(mediaEl);
    wrapper.appendChild(desc);

    wrapper.addEventListener('click', () => openModal(item));
    wrapper.addEventListener('keyup', (e) => { if (e.key === 'Enter') openModal(item); });

    card.appendChild(wrapper);
    container.appendChild(card);
  });
}

// Modal handling
function openModal(item) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = item.title || item.date || '';

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = item.date || '';

  modalBody.appendChild(title);
  modalBody.appendChild(meta);

  if (item.media_type === 'image') {
    const img = document.createElement('img');
    img.src = item.hdurl || item.url;
    img.alt = item.title || 'NASA image';
    modalBody.appendChild(img);
  } else {
    // Try to embed video: convert YouTube watch URLs to embed form if needed
    let src = item.url;
    if (src && src.includes('watch?v=')) {
      src = src.replace('watch?v=', 'embed/');
    }
    if (src && src.includes('youtu.be/')) {
      const id = src.split('youtu.be/')[1];
      src = `https://www.youtube.com/embed/${id}`;
    }
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    modalBody.appendChild(iframe);
  }

  const expl = document.createElement('p');
  expl.textContent = item.explanation || '';
  modalBody.appendChild(expl);

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  const modalBody = document.getElementById('modalBody');
  if (modalBody) modalBody.innerHTML = '';
}

async function fetchAPODRange(startDate, endDate) {
  const url = `${API_BASE}?api_key=${API_KEY}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data;
}

document.addEventListener('DOMContentLoaded', () => {
  const startInput = $('#startDate');
  const endInput = $('#endDate');
  const button = document.querySelector('.filters button');
  const gallery = $('#gallery');

  // Initialize date inputs using helper from js/dateRange.js
  if (typeof setupDateInputs === 'function') {
    setupDateInputs(startInput, endInput);
  }

  async function load() {
    const start = startInput.value;
    const end = endInput.value;
    if (!start || !end) {
      showError(gallery, 'Please select a valid start and end date.');
      return;
    }

    showLoading(gallery);
    try {
      const data = await fetchAPODRange(start, end);
      renderGallery(gallery, data);
    } catch (err) {
      showError(gallery, err.message || 'Failed to fetch images');
      console.error(err);
    }
  }

  // Load on button click
  button.addEventListener('click', load);

  // Also allow Enter key while focusing date inputs
  [startInput, endInput].forEach(el => {
    el.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') load();
    });
  });

  // Initial load to show recent images
  load();
  // Modal close handlers
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keyup', (e) => { if (e.key === 'Escape') closeModal(); });

  // Show a random "Did You Know?" fact
  const facts = [
    'The Hubble Space Telescope has provided data for over 1.4 million observations.',
    'Saturn could float in water because it is mostly made of gas.',
    'A day on Venus is longer than its year.',
    'There are more trees on Earth than stars in the Milky Way (estimated).',
    'Neutron stars can spin up to 716 times per second.'
  ];
  const factBox = document.getElementById('didYouKnow');
  if (factBox) {
    const pick = facts[Math.floor(Math.random() * facts.length)];
    factBox.textContent = `Did you know? ${pick}`;
  }
});
