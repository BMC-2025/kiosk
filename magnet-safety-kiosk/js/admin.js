/* admin.js — Admin panel CRUD for kiosk configuration */

(function() {
  'use strict';

  let config = getConfig();

  // --- INIT ---
  function init() {
    setupTabs();
    renderVisitors();
    renderSafetyMessages();
    loadSettings();
    bindActions();
    addToast();
  }

  // --- TAB NAVIGATION ---
  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      });
    });
  }

  // --- VISITOR CRUD ---
  function renderVisitors() {
    const list = document.getElementById('visitor-list');
    if (config.visitors.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center">No visitors queued. Add one above.</p>';
      return;
    }
    list.innerHTML = config.visitors.map(v => {
      return '<div class="list-item ' + (v.active ? '' : 'inactive') + '" data-id="' + v.id + '">' +
        '<div class="item-content">' +
          '<div class="item-name">' + escapeHtml(v.name) + '</div>' +
          '<div class="item-detail">' + escapeHtml(v.company || 'No company') +
            (v.host ? ' &middot; Host: ' + escapeHtml(v.host) : '') + '</div>' +
        '</div>' +
        '<label class="toggle">' +
          '<input type="checkbox" ' + (v.active ? 'checked' : '') + ' onchange="toggleVisitor(\'' + v.id + '\')">' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
        '<div class="item-actions">' +
          '<button class="btn btn-danger btn-sm" onclick="removeVisitor(\'' + v.id + '\')">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.toggleVisitor = function(id) {
    config.visitors = config.visitors.map(v =>
      v.id === id ? { ...v, active: !v.active } : v
    );
    save();
    renderVisitors();
  };

  window.removeVisitor = function(id) {
    config.visitors = config.visitors.filter(v => v.id !== id);
    save();
    renderVisitors();
    showToast('Visitor removed');
  };

  function addVisitor() {
    const name = document.getElementById('v-name').value.trim();
    const company = document.getElementById('v-company').value.trim();
    const host = document.getElementById('v-host').value.trim();

    if (!name) return;

    config.visitors.push({
      id: generateId(),
      name: name,
      company: company,
      host: host,
      active: true
    });

    save();
    renderVisitors();
    document.getElementById('v-name').value = '';
    document.getElementById('v-company').value = '';
    document.getElementById('v-host').value = '';
    document.getElementById('v-name').focus();
    showToast('Visitor added');
  }

  // --- SAFETY MESSAGE CRUD ---
  function renderSafetyMessages() {
    const list = document.getElementById('safety-list');
    list.innerHTML = config.safety_messages.map(m => {
      return '<div class="list-item ' + (m.active ? '' : 'inactive') + '" data-id="' + m.id + '">' +
        '<div class="item-icon">' + m.icon + '</div>' +
        '<div class="item-content">' +
          '<div class="item-detail" style="font-size:14px;color:var(--text)">' + escapeHtml(m.text) + '</div>' +
        '</div>' +
        '<label class="toggle">' +
          '<input type="checkbox" ' + (m.active ? 'checked' : '') + ' onchange="toggleSafety(\'' + m.id + '\')">' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
        '<div class="item-actions">' +
          '<button class="btn btn-danger btn-sm" onclick="removeSafety(\'' + m.id + '\')">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.toggleSafety = function(id) {
    config.safety_messages = config.safety_messages.map(m =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    save();
    renderSafetyMessages();
  };

  window.removeSafety = function(id) {
    config.safety_messages = config.safety_messages.filter(m => m.id !== id);
    save();
    renderSafetyMessages();
    showToast('Message removed');
  };

  function addSafetyMessage() {
    const icon = document.getElementById('s-icon').value.trim() || '\u26A0\uFE0F';
    const text = document.getElementById('s-text').value.trim();

    if (!text) return;

    config.safety_messages.push({
      id: generateId(),
      icon: icon,
      text: text,
      active: true
    });

    save();
    renderSafetyMessages();
    document.getElementById('s-icon').value = '';
    document.getElementById('s-text').value = '';
    document.getElementById('s-text').focus();
    showToast('Safety message added');
  }

  // --- SETTINGS ---
  function loadSettings() {
    document.getElementById('set-rotation').value = config.settings.rotation_interval_ms;
    document.getElementById('set-ticker-speed').value = config.settings.ticker_speed;
    document.getElementById('set-tagline').value = config.settings.brand_tagline;
  }

  function saveSettings() {
    updateSettings({
      rotation_interval_ms: parseInt(document.getElementById('set-rotation').value),
      ticker_speed: document.getElementById('set-ticker-speed').value,
      brand_tagline: document.getElementById('set-tagline').value.trim() || 'Innovative Magnetic Solutions'
    });
    config = getConfig();
    showToast('Settings saved');
  }

  // --- BIND ACTIONS ---
  function bindActions() {
    document.getElementById('btn-add-visitor').addEventListener('click', addVisitor);
    document.getElementById('v-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addVisitor();
    });

    document.getElementById('btn-add-safety').addEventListener('click', addSafetyMessage);
    document.getElementById('s-text').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addSafetyMessage();
    });

    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

    document.getElementById('btn-preview').addEventListener('click', () => {
      window.open('index.html', '_blank');
    });

    document.getElementById('btn-export').addEventListener('click', exportConfig);

    document.getElementById('file-import').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importConfig(file);
        config = getConfig();
        renderVisitors();
        renderSafetyMessages();
        loadSettings();
        showToast('Config imported');
      } catch (err) {
        showToast('Import failed: ' + err.message);
      }
      e.target.value = '';
    });
  }

  // --- SAVE + SYNC ---
  function save() {
    setConfig(config);
  }

  // --- TOAST ---
  function addToast() {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- START ---
  document.addEventListener('DOMContentLoaded', init);
})();
