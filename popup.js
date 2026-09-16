(function () {
  'use strict';

  // content.js와 동일한 팔레트 — 팝업 스와치 미리보기용으로 여기도 하나 둔다
  // (팝업/콘텐츠 스크립트는 별도 컨텍스트라 파일을 공유하지 않으므로 값만 맞춰둠).
  var THEMES = {
    classic: { label: '클래식', accent: '#1da1f2', bg: '#15202b' },
    midnight: { label: '미드나잇', accent: '#8b5cf6', bg: '#0e0b1a' },
    forest: { label: '포레스트', accent: '#22c55e', bg: '#0e1a14' },
    sunset: { label: '선셋', accent: '#fb923c', bg: '#1a1210' },
    paper: { label: '페이퍼(라이트)', accent: '#0f6fb3', bg: '#f2f2f0' }
  };
  var STICKER_EMOJIS = ['⭐', '💙', '🐦', '🎉', '🔥', '💜', '🌙', '✨', '☕', '🍀'];
  var DEFAULT_STATE = { enabled: true, theme: 'classic', accent: '', stickers: [] };

  var checkbox = document.getElementById('toggle-enabled');
  var themeRow = document.getElementById('theme-row');
  var accentPicker = document.getElementById('accent-picker');
  var accentReset = document.getElementById('accent-reset');
  var stickerRow = document.getElementById('sticker-row');
  var stickersClear = document.getElementById('stickers-clear');

  function setActiveSwatch(themeKey) {
    themeRow.querySelectorAll('.theme-swatch').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });
  }

  Object.keys(THEMES).forEach(function (key) {
    var theme = THEMES[key];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-swatch';
    btn.title = theme.label;
    btn.dataset.theme = key;
    btn.style.background = 'linear-gradient(135deg, ' + theme.bg + ' 50%, ' + theme.accent + ' 50%)';
    btn.addEventListener('click', function () {
      chrome.storage.sync.set({ theme: key, accent: '' });
      accentPicker.value = theme.accent;
      setActiveSwatch(key);
    });
    themeRow.appendChild(btn);
  });

  STICKER_EMOJIS.forEach(function (emoji) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sticker-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', function () {
      chrome.storage.sync.get({ stickers: [] }, function (items) {
        var sticker = {
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          emoji: emoji,
          x: 10 + Math.random() * 60,
          y: 15 + Math.random() * 60
        };
        chrome.storage.sync.set({ stickers: items.stickers.concat(sticker) });
      });
    });
    stickerRow.appendChild(btn);
  });

  chrome.storage.sync.get(DEFAULT_STATE, function (state) {
    checkbox.checked = !!state.enabled;
    setActiveSwatch(state.theme);
    accentPicker.value = state.accent || THEMES[state.theme || 'classic'].accent;
  });

  checkbox.addEventListener('change', function () {
    chrome.storage.sync.set({ enabled: checkbox.checked });
  });

  accentPicker.addEventListener('input', function () {
    chrome.storage.sync.set({ accent: accentPicker.value });
  });

  accentReset.addEventListener('click', function () {
    chrome.storage.sync.get({ theme: 'classic' }, function (state) {
      chrome.storage.sync.set({ accent: '' });
      accentPicker.value = THEMES[state.theme || 'classic'].accent;
    });
  });

  stickersClear.addEventListener('click', function () {
    chrome.storage.sync.set({ stickers: [] });
  });
})();
