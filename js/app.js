// Fetch image from Wikipedia REST API
async function fetchImage(word) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.thumbnail && data.thumbnail.source) {
      return data.thumbnail.source;
    }
    return null;
  } catch {
    return null;
  }
}

// Handle show/hide image toggle on a card
async function toggleImage(card) {
  const imageArea = card.querySelector('.card-image-area');
  const btn = card.querySelector('.reveal-btn');
  const word = card.dataset.word;
  const emoji = card.dataset.emoji;

  // Already loaded — just toggle visibility
  if (imageArea.children.length > 0) {
    const isHidden = imageArea.classList.toggle('hidden');
    imageArea.classList.toggle('visible', !isHidden);
    btn.textContent = isHidden ? 'Show Picture' : 'Hide Picture';
    return;
  }

  // First time: fetch image
  btn.textContent = 'Loading...';
  btn.disabled = true;

  const imageUrl = await fetchImage(word);

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = word;
    img.className = 'card-img';
    img.onerror = function () {
      img.remove();
      const fallback = document.createElement('span');
      fallback.className = 'card-emoji';
      fallback.textContent = emoji;
      imageArea.appendChild(fallback);
    };
    imageArea.appendChild(img);
  } else {
    const fallback = document.createElement('span');
    fallback.className = 'card-emoji';
    fallback.textContent = emoji;
    imageArea.appendChild(fallback);
  }

  imageArea.classList.add('visible');
  btn.textContent = 'Hide Picture';
  btn.disabled = false;
}

// Render alphabet cards
function renderAlphabets() {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';

  Object.keys(ALPHABET_WORDS).forEach(function (letter, index) {
    const entry = ALPHABET_WORDS[letter];
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.word = entry.word;
    card.dataset.emoji = entry.emoji;
    card.style.animationDelay = (index * 0.03) + 's';

    card.innerHTML =
      '<div class="card-letter">' + letter + ' ' + letter.toLowerCase() + '</div>' +
      '<div class="card-label">' + entry.word + '</div>' +
      '<div class="card-image-area"></div>' +
      '<button class="reveal-btn">Show Picture</button>';

    grid.appendChild(card);
  });
}

// Render word cards for a given length
function renderWords(length) {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';

  const wordList = WORDS[length] || [];
  wordList.forEach(function (entry, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.word = entry.word;
    card.dataset.emoji = entry.emoji;
    card.style.animationDelay = (index * 0.03) + 's';

    card.innerHTML =
      '<div class="card-word">' + entry.word + '</div>' +
      '<div class="card-image-area"></div>' +
      '<button class="reveal-btn">Show Picture</button>';

    grid.appendChild(card);
  });
}

// Render length selector buttons
function renderLengthSelector(activeLength) {
  const selector = document.getElementById('length-selector');
  selector.innerHTML = '';

  [2, 3, 4, 5, 6].forEach(function (len) {
    const btn = document.createElement('button');
    btn.className = 'length-btn' + (len === activeLength ? ' active' : '');
    btn.textContent = len;
    btn.addEventListener('click', function () {
      // Update active state
      selector.querySelectorAll('.length-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      // Update hash, render, and rebuild slideshow items
      window.location.hash = len;
      renderWords(len);
      slideItems = buildWordSlides(len);
    });
    selector.appendChild(btn);
  });
}

// Event delegation for reveal buttons
document.getElementById('card-grid').addEventListener('click', function (e) {
  if (e.target.classList.contains('reveal-btn')) {
    var card = e.target.closest('.card');
    if (card) toggleImage(card);
  }
});

// ===== Generic Slideshow =====

// slideItems: array of { primary: "A a", secondary: "Apple", word: "Apple", emoji: "🍎" }
var slideItems = [];
var slideshowIndex = 0;

function buildAlphabetSlides() {
  return Object.keys(ALPHABET_WORDS).map(function (letter) {
    var entry = ALPHABET_WORDS[letter];
    return { primary: letter + ' ' + letter.toLowerCase(), secondary: entry.word, word: entry.word, emoji: entry.emoji };
  });
}

function buildWordSlides(length) {
  var wordList = WORDS[length] || [];
  return wordList.map(function (entry) {
    return { primary: entry.word, secondary: '', word: entry.word, emoji: entry.emoji };
  });
}

function openSlideshow(startIndex) {
  var el = document.getElementById('slideshow');
  if (!el || slideItems.length === 0) return;
  slideshowIndex = startIndex || 0;
  el.hidden = false;
  renderSlide();
}

function closeSlideshow() {
  var el = document.getElementById('slideshow');
  if (!el) return;
  el.hidden = true;
}

function renderSlide() {
  var item = slideItems[slideshowIndex];
  if (!item) return;

  document.getElementById('slide-letter').textContent = item.primary;
  var wordEl = document.getElementById('slide-word');
  wordEl.textContent = item.secondary;
  wordEl.style.display = item.secondary ? '' : 'none';
  document.getElementById('slide-counter').textContent = (slideshowIndex + 1) + ' / ' + slideItems.length;

  // Reset image area
  var imageArea = document.getElementById('slide-image-area');
  imageArea.innerHTML = '';
  var revealBtn = document.getElementById('slide-reveal');
  revealBtn.textContent = 'Show Picture';
  revealBtn.disabled = false;

  // Re-trigger the pop animation
  var content = document.querySelector('.slideshow-content');
  content.style.animation = 'none';
  content.offsetHeight; // force reflow
  content.style.animation = '';
}

function slideNext() {
  slideshowIndex = (slideshowIndex + 1) % slideItems.length;
  renderSlide();
}

function slidePrev() {
  slideshowIndex = (slideshowIndex - 1 + slideItems.length) % slideItems.length;
  renderSlide();
}

async function toggleSlideImage() {
  var imageArea = document.getElementById('slide-image-area');
  var btn = document.getElementById('slide-reveal');
  var item = slideItems[slideshowIndex];

  // Already loaded — toggle visibility
  if (imageArea.children.length > 0) {
    if (imageArea.style.display === 'none') {
      imageArea.style.display = 'flex';
      btn.textContent = 'Hide Picture';
    } else {
      imageArea.style.display = 'none';
      btn.textContent = 'Show Picture';
    }
    return;
  }

  btn.textContent = 'Loading...';
  btn.disabled = true;

  var imageUrl = await fetchImage(item.word);

  if (imageUrl) {
    var img = document.createElement('img');
    img.src = imageUrl;
    img.alt = item.word;
    img.className = 'card-img';
    img.onerror = function () {
      img.remove();
      var fallback = document.createElement('span');
      fallback.className = 'card-emoji';
      fallback.textContent = item.emoji;
      imageArea.appendChild(fallback);
    };
    imageArea.appendChild(img);
  } else {
    var fallback = document.createElement('span');
    fallback.className = 'card-emoji';
    fallback.textContent = item.emoji;
    imageArea.appendChild(fallback);
  }

  btn.textContent = 'Hide Picture';
  btn.disabled = false;
}

function initSlideshow() {
  var startBtn = document.getElementById('slideshow-start');
  var closeBtn = document.getElementById('slideshow-close');
  var prevBtn = document.getElementById('slide-prev');
  var nextBtn = document.getElementById('slide-next');
  var revealBtn = document.getElementById('slide-reveal');

  if (!startBtn) return;

  startBtn.addEventListener('click', function () { openSlideshow(0); });
  closeBtn.addEventListener('click', closeSlideshow);
  prevBtn.addEventListener('click', slidePrev);
  nextBtn.addEventListener('click', slideNext);
  revealBtn.addEventListener('click', toggleSlideImage);

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    var el = document.getElementById('slideshow');
    if (!el || el.hidden) return;

    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      slideNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      slidePrev();
    } else if (e.key === 'Escape') {
      closeSlideshow();
    }
  });

  // Swipe support for mobile
  var slideEl = document.getElementById('slideshow');
  var touchStartX = 0;
  var touchStartY = 0;

  slideEl.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  slideEl.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].screenX - touchStartX;
    var dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) slideNext();
      else slidePrev();
    }
  }, { passive: true });

  // Click a card to open slideshow at that item
  document.getElementById('card-grid').addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card || e.target.classList.contains('reveal-btn')) return;
    var word = card.dataset.word;
    for (var i = 0; i < slideItems.length; i++) {
      if (slideItems[i].word === word) {
        openSlideshow(i);
        return;
      }
    }
  });
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', function () {
  var page = document.body.dataset.page;

  if (page === 'alphabets') {
    renderAlphabets();
    slideItems = buildAlphabetSlides();
    initSlideshow();
  } else if (page === 'words') {
    var hash = parseInt(window.location.hash.slice(1), 10);
    var defaultLength = (hash >= 2 && hash <= 6) ? hash : 3;
    renderLengthSelector(defaultLength);
    renderWords(defaultLength);
    slideItems = buildWordSlides(defaultLength);
    initSlideshow();
  }
});
