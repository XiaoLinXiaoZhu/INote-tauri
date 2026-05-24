console.log('[vendor] mock.js starting...');
window.addEventListener('error', e => {
  console.error(
    '[vendor] GLOBAL ERROR:',
    e.message,
    'at',
    e.filename,
    ':',
    e.lineno,
  );
});
// Browser global mocks required by Obsidian's app.js
console.log('[vendor] mock.js executing...');
// Load i18n translations
window.OBSIDIAN_DEFAULT_I18N = {};
i18next.init({
  fallbackLng: 'en',
  ns: ['app'],
  defaultNS: 'app',
  initImmediate: false,
  interpolation: { escapeValue: false },
});

// Load translation bundle asynchronously
fetch((window.__assetBase || '') + '/i18n/en.json') // [PATCHED] use configurable base path
  .then(r => r.json())
  .then(data => {
    window.OBSIDIAN_DEFAULT_I18N = data;
    i18next.addResourceBundle('en', 'app', data);
  })
  .catch(() => {
    i18next.addResourceBundle('en', 'app', {});
  });
window.DOMPurify = {
  sanitize(h) {
    return h;
  },
  addHook() {},
  removeHook() {},
  setConfig() {},
  isSupported: true,
};
window.activeWindow = window;
window.activeDocument = document;
window.initVimMode = () => ({ Vim: {} });
window.CodeMirrorAdapter = {};
window.process = {
  platform: 'win32',
  env: {},
  versions: { electron: '28.0.0' },
  cwd() {
    return '/';
  },
};
window.ready = () => {};

if (!Event.prototype.detach) Event.prototype.detach = () => {};
console.log('[vendor] mock.js done, __cm6:', typeof window.__cm6);
