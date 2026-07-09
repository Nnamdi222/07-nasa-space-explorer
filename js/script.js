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
      // For videos, provide a link and optional thumbnail
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'View video on external site';
      mediaEl = link;
    }

    // Description
    const desc = document.createElement('p');
    desc.textContent = truncate(item.explanation, 220);

    // Clickable area opens full-resolution if available
    const wrapper = document.createElement('a');
    wrapper.style.textDecoration = 'none';
    wrapper.style.color = 'inherit';
    wrapper.target = '_blank';
    wrapper.rel = 'noopener';
    wrapper.href = item.hdurl || item.url || '#';

    wrapper.appendChild(title);
    wrapper.appendChild(mediaEl);
    wrapper.appendChild(desc);

    card.appendChild(wrapper);
    container.appendChild(card);
  });
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
});
// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);
