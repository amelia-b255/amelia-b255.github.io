/* Lightbox with AB watermark overlay + section-scoped prev/next navigation */
/* Extended: video lightbox with dark overlay and prev/next nav */
(function() {
  // Inject styles
  var css = document.createElement('style');
  css.textContent = `
    .ab-lightbox-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.88);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
      cursor: pointer;
    }
    .ab-lightbox-overlay.active { opacity: 1; }
    .ab-lightbox-wrap {
      position: relative;
      max-width: 90vw; max-height: 90vh;
    }
    .ab-lightbox-wrap img.ab-lightbox-img {
      max-width: 90vw; max-height: 90vh;
      object-fit: contain;
      display: block;
    }
    .ab-lightbox-wrap.video-mode {
      width: min(90vw, 1400px);
      aspect-ratio: 16 / 9;
      max-width: none;
      max-height: 85vh;
    }
    .ab-lightbox-wrap video.ab-lightbox-vid {
      width: 100%; height: 100%;
      object-fit: contain;
      display: none;
      border-radius: 6px;
      cursor: default;
      background: #000;
    }
    .ab-lightbox-watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 30%;
      min-width: 120px;
      max-width: 300px;
      opacity: 0.38;
      pointer-events: none;
      filter: drop-shadow(0 0 8px rgba(0,0,0,0.4));
    }
    .ab-lightbox-close {
      position: fixed; top: 20px; right: 30px;
      color: #fff; font-size: 36px;
      font-family: Arial, sans-serif;
      cursor: pointer; z-index: 10001;
      opacity: 0.7; transition: opacity 0.2s;
      line-height: 1;
    }
    .ab-lightbox-close:hover { opacity: 1; }
    .ab-lightbox-prev,
    .ab-lightbox-next {
      position: fixed; top: 50%; transform: translateY(-50%);
      background: none; border: none;
      color: #fff; font-size: 48px;
      cursor: pointer; z-index: 10001;
      opacity: 0.6; transition: opacity 0.2s;
      padding: 16px; line-height: 1;
      font-family: Arial, sans-serif;
      user-select: none;
    }
    .ab-lightbox-prev { left: 16px; }
    .ab-lightbox-next { right: 16px; }
    .ab-lightbox-prev:hover,
    .ab-lightbox-next:hover { opacity: 1; }
    .ab-lightbox-prev.hidden,
    .ab-lightbox-next.hidden { visibility: hidden; }
  `;
  document.head.appendChild(css);

  // Create overlay
  var overlay = document.createElement('div');
  overlay.className = 'ab-lightbox-overlay';
  overlay.innerHTML = `
    <span class="ab-lightbox-close">&times;</span>
    <button class="ab-lightbox-prev">&#8249;</button>
    <div class="ab-lightbox-wrap">
      <img class="ab-lightbox-img" src="" alt="">
      <video class="ab-lightbox-vid" controls playsinline controlslist="nodownload"></video>
      <img class="ab-lightbox-watermark" src="shared/AB logo.png" alt="">
    </div>
    <button class="ab-lightbox-next">&#8250;</button>
  `;
  document.body.appendChild(overlay);

  var lbImg      = overlay.querySelector('.ab-lightbox-img');
  var lbVid      = overlay.querySelector('.ab-lightbox-vid');
  var lbWatermark = overlay.querySelector('.ab-lightbox-watermark');
  var prevBtn    = overlay.querySelector('.ab-lightbox-prev');
  var nextBtn    = overlay.querySelector('.ab-lightbox-next');
  var lbWrap     = overlay.querySelector('.ab-lightbox-wrap');

  // Stop overlay close when clicking directly on the video player
  lbVid.addEventListener('click', function(e) { e.stopPropagation(); });

  /* ── Image lightbox ── */

  var imgExts = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
  var sectionLinks = [];
  var currentIdx = 0;

  function getSectionLinks(link) {
    var scope = link.closest('.card-stack') || link.closest('section') || document;
    return Array.from(scope.querySelectorAll('a')).filter(function(a) {
      return imgExts.test(a.getAttribute('href'));
    });
  }

  function showAt(idx) {
    if (sectionLinks.length === 0) return;
    currentIdx = ((idx % sectionLinks.length) + sectionLinks.length) % sectionLinks.length;
    var link = sectionLinks[currentIdx];
    var rotate = link.getAttribute('data-rotate');
    var alt = link.querySelector('img') ? link.querySelector('img').alt : '';
    lbImg.src = link.href;
    lbImg.alt = alt || '';
    lbWatermark.style.display = link.closest('[data-no-watermark]') ? 'none' : '';
    if (rotate) {
      lbImg.style.transform = 'rotate(' + rotate + 'deg)';
      lbImg.style.maxWidth = '90vh';
      lbImg.style.maxHeight = '90vw';
      lbWrap.style.maxWidth = '90vh';
      lbWrap.style.maxHeight = '90vw';
    } else {
      lbImg.style.transform = '';
      lbImg.style.maxWidth = '90vw';
      lbImg.style.maxHeight = '90vh';
      lbWrap.style.maxWidth = '90vw';
      lbWrap.style.maxHeight = '90vh';
    }
    prevBtn.classList.toggle('hidden', sectionLinks.length <= 1);
    nextBtn.classList.toggle('hidden', sectionLinks.length <= 1);
  }

  function openLightbox(link) {
    isVideoMode = false;
    lbImg.style.display = '';
    lbVid.style.display = 'none';
    lbVid.pause(); lbVid.src = '';
    lbWatermark.style.display = '';
    sectionLinks = getSectionLinks(link);
    currentIdx = sectionLinks.indexOf(link);
    if (currentIdx === -1) currentIdx = 0;
    showAt(currentIdx);
    overlay.style.display = 'flex';
    requestAnimationFrame(function() { overlay.classList.add('active'); });
    document.body.style.overflow = 'hidden';
  }

  /* ── Video lightbox ── */

  var isVideoMode = false;
  var sectionVideoCards = [];
  var currentVideoIdx = 0;

  function getVideoCards(card) {
    var scope = card.closest('.card-stack') || card.closest('section') || document;
    return Array.from(scope.querySelectorAll('.stack-card')).filter(function(c) {
      return !!c.querySelector('video');
    });
  }

  function showVideoAt(idx, startTime) {
    if (sectionVideoCards.length === 0) return;
    currentVideoIdx = ((idx % sectionVideoCards.length) + sectionVideoCards.length) % sectionVideoCards.length;
    var card = sectionVideoCards[currentVideoIdx];
    var vid  = card.querySelector('video');
    var src  = vid.querySelector('source') ? vid.querySelector('source').getAttribute('src') : vid.getAttribute('src');
    lbVid.pause();
    lbVid.src = src || '';
    lbVid.load();
    if (typeof startTime === 'number' && !isNaN(startTime)) {
      var seek = function() { try { lbVid.currentTime = startTime; } catch(e){} lbVid.removeEventListener('loadedmetadata', seek); };
      lbVid.addEventListener('loadedmetadata', seek);
    }
    lbVid.play().catch(function() {});
    prevBtn.classList.toggle('hidden', sectionVideoCards.length <= 1);
    nextBtn.classList.toggle('hidden', sectionVideoCards.length <= 1);
  }

  function openVideoLightbox(card, startTime) {
    isVideoMode = true;
    sectionVideoCards = getVideoCards(card);
    currentVideoIdx = sectionVideoCards.indexOf(card);
    if (currentVideoIdx === -1) currentVideoIdx = 0;
    lbImg.style.display = 'none';
    lbWatermark.style.display = 'none';
    lbVid.style.display = 'block';
    lbWrap.classList.add('video-mode');
    showVideoAt(currentVideoIdx, startTime);
    overlay.style.display = 'flex';
    requestAnimationFrame(function() { overlay.classList.add('active'); });
    document.body.style.overflow = 'hidden';
  }

  // Expose globally so page scripts (music.html, tram.html) can trigger the spotlight
  // when the user presses the native fullscreen button on a card video.
  window.abOpenVideoSpotlight = openVideoLightbox;

  /* ── Close ── */

  function closeLightbox() {
    overlay.classList.remove('active');
    lbVid.pause();
    setTimeout(function() {
      overlay.style.display = 'none';
      lbImg.src = '';
      lbVid.src = '';
      lbWrap.classList.remove('video-mode');
      isVideoMode = false;
    }, 300);
    document.body.style.overflow = '';
  }

  overlay.style.display = 'none';

  /* ── Prev / next buttons ── */

  prevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isVideoMode) showVideoAt(currentVideoIdx - 1); else showAt(currentIdx - 1);
  });
  nextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isVideoMode) showVideoAt(currentVideoIdx + 1); else showAt(currentIdx + 1);
  });

  /* ── Close on overlay background or × ── */

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('ab-lightbox-close')) {
      closeLightbox();
    }
  });

  /* ── Keyboard navigation ── */

  document.addEventListener('keydown', function(e) {
    if (overlay.style.display === 'none') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  { if (isVideoMode) showVideoAt(currentVideoIdx - 1); else showAt(currentIdx - 1); }
    if (e.key === 'ArrowRight') { if (isVideoMode) showVideoAt(currentVideoIdx + 1); else showAt(currentIdx + 1); }
  });

  /* ── Click interception ── */

  document.addEventListener('click', function(e) {
    // Image links
    var link = e.target.closest('a');
    if (link && imgExts.test(link.getAttribute('href'))) {
      e.preventDefault();
      openLightbox(link);
      return;
    }
    // (Video cards play in-place — no lightbox interception. Native fullscreen
    //  button is available via the controls bar if the user wants fullscreen.)
  });

  /* ── Image download protection ── */

  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG' || e.target.closest('.ab-lightbox-overlay')) {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') e.preventDefault();
  });

  var protectCss = document.createElement('style');
  protectCss.textContent = `
    img {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
  `;
  document.head.appendChild(protectCss);
})();
