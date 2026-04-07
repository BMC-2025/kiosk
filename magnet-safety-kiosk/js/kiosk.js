/* kiosk.js — Display logic for kiosk main screen */

(function() {
  'use strict';

  let config = getConfig();
  let currentVisitorIndex = 0;
  let currentSlideVariant = 0;
  let rotationTimer = null;
  const SLIDE_VARIANTS = [
    { tagline: config.settings.brand_tagline, cls: 'slide-variant-1' },
    { tagline: 'World Leader in Magnetic Technology', cls: 'slide-variant-2' },
    { tagline: 'Solving Problems with Magnets Since 1959', cls: 'slide-variant-3' }
  ];

  // --- INIT ---
  function init() {
    renderTicker();
    startDisplay();
    listenForUpdates();
    scheduleMidnightClear();
  }

  // --- TOP ZONE: VISITOR / DEFAULT MODE ---
  function startDisplay() {
    clearInterval(rotationTimer);
    const activeVisitors = config.visitors.filter(v => v.active);

    if (activeVisitors.length > 0) {
      showVisitorMode(activeVisitors);
    } else {
      showDefaultMode();
    }
  }

  function showDefaultMode() {
    const defaultSlide = document.getElementById('default-slide');
    const visitorSlide = document.getElementById('visitor-slide');
    const welcomeZone = document.getElementById('welcome-zone');

    visitorSlide.classList.remove('active');
    defaultSlide.classList.add('active');
    updateTagline(SLIDE_VARIANTS[currentSlideVariant].tagline);
    welcomeZone.className = SLIDE_VARIANTS[currentSlideVariant].cls;

    rotationTimer = setInterval(() => {
      currentSlideVariant = (currentSlideVariant + 1) % SLIDE_VARIANTS.length;
      // Fade out then in
      defaultSlide.classList.remove('active');
      setTimeout(() => {
        updateTagline(SLIDE_VARIANTS[currentSlideVariant].tagline);
        welcomeZone.className = SLIDE_VARIANTS[currentSlideVariant].cls;
        defaultSlide.classList.add('active');
      }, 600);
    }, config.settings.rotation_interval_ms);
  }

  function showVisitorMode(visitors) {
    const defaultSlide = document.getElementById('default-slide');
    const visitorSlide = document.getElementById('visitor-slide');

    currentVisitorIndex = 0;
    displayVisitor(visitors[currentVisitorIndex]);
    defaultSlide.classList.remove('active');
    visitorSlide.classList.add('active');

    if (visitors.length > 1) {
      rotationTimer = setInterval(() => {
        visitorSlide.classList.remove('active');
        setTimeout(() => {
          currentVisitorIndex = (currentVisitorIndex + 1) % visitors.length;
          displayVisitor(visitors[currentVisitorIndex]);
          visitorSlide.classList.add('active');
        }, 600);
      }, config.settings.rotation_interval_ms);
    }
  }

  function displayVisitor(visitor) {
    document.getElementById('visitor-name').textContent = visitor.name;
    document.getElementById('visitor-company').textContent = visitor.company;
    const hostEl = document.getElementById('visitor-host');
    if (visitor.host) {
      hostEl.textContent = 'Host: ' + visitor.host;
      hostEl.style.display = 'block';
    } else {
      hostEl.style.display = 'none';
    }
  }

  function updateTagline(text) {
    document.getElementById('tagline').textContent = text;
  }

  // --- SAFETY TICKER ---
  function renderTicker() {
    const track = document.getElementById('ticker-track');
    const activeMessages = config.safety_messages.filter(m => m.active);

    if (activeMessages.length === 0) {
      track.innerHTML = '';
      return;
    }

    // Build one set of messages
    let html = '';
    activeMessages.forEach((msg, i) => {
      html += '<span class="ticker-message"><span class="icon">' + msg.icon + '</span>' + escapeHtml(msg.text) + '</span>';
      if (i < activeMessages.length - 1) {
        html += '<span class="ticker-divider">\u25C6</span>';
      }
    });

    // Duplicate for seamless loop
    track.innerHTML = html + '<span class="ticker-divider">\u25C6</span>' + html + '<span class="ticker-divider">\u25C6</span>';

    // Set ticker speed
    const speeds = { slow: 80, medium: 55, fast: 35 };
    const duration = speeds[config.settings.ticker_speed] || 55;
    track.style.setProperty('--ticker-duration', duration + 's');
    // Reset animation to apply new duration
    track.style.animation = 'none';
    track.offsetHeight; // force reflow
    track.style.animation = '';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- STORAGE EVENT LISTENER ---
  function listenForUpdates() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        config = getConfig();
        SLIDE_VARIANTS[0].tagline = config.settings.brand_tagline;
        renderTicker();
        startDisplay();
      }
    });

    // Fallback: poll every 5s for same-tab updates (admin in same window)
    setInterval(() => {
      const current = JSON.stringify(config);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== current) {
        config = JSON.parse(stored);
        SLIDE_VARIANTS[0].tagline = config.settings.brand_tagline;
        renderTicker();
        startDisplay();
      }
    }, 5000);
  }

  // --- MIDNIGHT AUTO-CLEAR ---
  function scheduleMidnightClear() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      config.visitors = config.visitors.map(v => ({ ...v, active: false }));
      setConfig(config);
      startDisplay();
      // Reschedule for next midnight
      scheduleMidnightClear();
    }, msUntilMidnight);
  }

  // --- START ---
  document.addEventListener('DOMContentLoaded', init);
})();
