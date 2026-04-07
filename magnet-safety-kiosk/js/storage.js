/* storage.js — Shared localStorage abstraction for kiosk + admin */

const STORAGE_KEY = 'kiosk_config';

const DEFAULT_SAFETY_MESSAGES = [
  { id: 's1', icon: '\u26A0\uFE0F', text: 'WARNING: Strong magnetic fields present. Pacemaker and medical device wearers must check in before entering production areas.', active: true },
  { id: 's2', icon: '\uD83E\uDDF2', text: 'Remove all loose metallic items — watches, jewelry, belt buckles, tools — before entering magnet production zones.', active: true },
  { id: 's3', icon: '\u2757', text: 'PINCH/CRUSH HAZARD: Keep hands and fingers clear of magnetic assemblies. Magnets can attract with extreme force without warning.', active: true },
  { id: 's4', icon: '\uD83D\uDCB3', text: 'No credit cards, USB drives, or magnetic media in production areas. Strong fields will erase stored data permanently.', active: true },
  { id: 's5', icon: '\uD83D\uDC53', text: 'Eye protection REQUIRED in all grinding, cutting, and machining areas. Safety glasses available at each entrance.', active: true },
  { id: 's6', icon: '\uD83D\uDD0A', text: 'Hearing protection REQUIRED in designated high-noise zones. Check posted signage for specific requirements.', active: true },
  { id: 's7', icon: '\uD83D\uDCDE', text: 'Report any injury, near-miss, or safety concern immediately to your supervisor or call ext. 200.', active: true },
  { id: 's8', icon: '\uD83D\uDEAA', text: 'Emergency exits are marked with illuminated signs. Know your evacuation route and muster point BEFORE starting work.', active: true },
  { id: 's9', icon: '\uD83D\uDCAA', text: 'Proper lifting technique required for all magnet assemblies over 10 lbs. Request assistance for loads over 35 lbs.', active: true },
  { id: 's10', icon: '\uD83D\uDC64', text: 'Visitors must be accompanied by a Bunting employee at all times in production areas. No exceptions.', active: true }
];

const DEFAULT_CONFIG = {
  visitors: [],
  safety_messages: DEFAULT_SAFETY_MESSAGES,
  settings: {
    rotation_interval_ms: 30000,
    ticker_speed: 'medium',
    default_mode: 'brand_rotation',
    brand_tagline: 'Innovative Magnetic Solutions'
  }
};

function getConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDefaults();
    const config = JSON.parse(raw);
    if (!config.visitors || !config.safety_messages || !config.settings) {
      return seedDefaults();
    }
    return config;
  } catch {
    return seedDefaults();
  }
}

function setConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(config)
  }));
}

function seedDefaults() {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return config;
}

function updateVisitors(visitors) {
  const config = getConfig();
  config.visitors = visitors;
  setConfig(config);
}

function updateSafetyMessages(messages) {
  const config = getConfig();
  config.safety_messages = messages;
  setConfig(config);
}

function updateSettings(settings) {
  const config = getConfig();
  config.settings = { ...config.settings, ...settings };
  setConfig(config);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function exportConfig() {
  const config = getConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kiosk-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importConfig(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        if (!config.visitors || !config.safety_messages || !config.settings) {
          reject(new Error('Invalid config file'));
          return;
        }
        setConfig(config);
        resolve(config);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
