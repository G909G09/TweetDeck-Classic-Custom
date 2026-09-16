// 커스텀 레이어 (dimdenGD/OldTweetDeck 포크에 추가됨)
// 원본 구 트윗덱 기능(src/*.js)에는 전혀 관여하지 않고, 화면 위에
// 색상 테마 CSS 변수를 주입하고 스티커 레이어만 얹는다.
(function () {
  'use strict';

  var root = document.documentElement;

  // theme.css의 :root 변수와 값을 맞춰둔 팔레트. "classic"은 원조 구
  // 트윗덱 배색(#1da1f2/#15202b) 그대로, 나머지는 자유도를 위한 변형.
  var THEMES = {
    classic: { bg: '#15202b', columnBg: '#192734', headerBg: '#1c2732', border: '#38444d', accent: '#1da1f2', text: '#d9d9d9' },
    midnight: { bg: '#0e0b1a', columnBg: '#161129', headerBg: '#1a1430', border: '#332a55', accent: '#8b5cf6', text: '#e6e1ff' },
    forest: { bg: '#0e1a14', columnBg: '#13251c', headerBg: '#162b20', border: '#2c4a3a', accent: '#22c55e', text: '#d8f5e4' },
    sunset: { bg: '#1a1210', columnBg: '#261a17', headerBg: '#2b1e1a', border: '#4a3530', accent: '#fb923c', text: '#ffe9d9' },
    paper: { bg: '#f2f2f0', columnBg: '#ffffff', headerBg: '#eceae6', border: '#d8d5cf', accent: '#0f6fb3', text: '#20242a' }
  };
  var DEFAULT_STATE = { enabled: true, theme: 'classic', accent: '', stickers: [] };

  function applyTheme(themeKey, customAccent) {
    var theme = THEMES[themeKey] || THEMES.classic;
    root.style.setProperty('--otdc-bg', theme.bg);
    root.style.setProperty('--otdc-column-bg', theme.columnBg);
    root.style.setProperty('--otdc-header-bg', theme.headerBg);
    root.style.setProperty('--otdc-border', theme.border);
    root.style.setProperty('--otdc-accent', customAccent || theme.accent);
    root.style.setProperty('--otdc-text', theme.text);
  }

  function applyEnabled(enabled) {
    root.classList.toggle('otdc-enabled', !!enabled);
  }

  // ---- 스티커 ----
  var stickerLayer = null;
  function getStickerLayer() {
    if (!stickerLayer || !stickerLayer.isConnected) {
      stickerLayer = document.createElement('div');
      stickerLayer.id = 'otdc-sticker-layer';
      (document.body || document.documentElement).appendChild(stickerLayer);
    }
    return stickerLayer;
  }

  function saveStickers(stickers) {
    chrome.storage.sync.set({ stickers: stickers });
  }

  function renderStickers(stickers) {
    var layer = getStickerLayer();
    layer.innerHTML = '';
    (stickers || []).forEach(function (sticker) {
      layer.appendChild(buildStickerEl(sticker, stickers));
    });
  }

  function buildStickerEl(sticker, allStickers) {
    var el = document.createElement('div');
    el.className = 'otdc-sticker';
    el.style.left = sticker.x + 'vw';
    el.style.top = sticker.y + 'vh';
    el.textContent = sticker.emoji;
    el.dataset.id = sticker.id;

    var removeBtn = document.createElement('span');
    removeBtn.className = 'otdc-sticker-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var next = allStickers.filter(function (s) { return s.id !== sticker.id; });
      saveStickers(next);
    });
    el.appendChild(removeBtn);

    var dragging = false, startX = 0, startY = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.target === removeBtn) return;
      dragging = true;
      el.classList.add('otdc-dragging');
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = e.clientX; startY = e.clientY;
      var rect = el.getBoundingClientRect();
      el.style.left = ((rect.left + dx) / window.innerWidth) * 100 + 'vw';
      el.style.top = ((rect.top + dy) / window.innerHeight) * 100 + 'vh';
    });
    function stopDrag() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('otdc-dragging');
      var rect = el.getBoundingClientRect();
      var x = (rect.left / window.innerWidth) * 100;
      var y = (rect.top / window.innerHeight) * 100;
      var next = allStickers.map(function (s) {
        return s.id === sticker.id ? Object.assign({}, s, { x: x, y: y }) : s;
      });
      saveStickers(next);
    }
    el.addEventListener('pointerup', stopDrag);
    el.addEventListener('pointercancel', stopDrag);
    return el;
  }

  // ---- storage 로드 + 실시간 반영 ----
  chrome.storage.sync.get(DEFAULT_STATE, function (state) {
    applyEnabled(state.enabled);
    applyTheme(state.theme, state.accent);
    renderStickers(state.stickers);
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'sync') return;
    if (changes.enabled) applyEnabled(changes.enabled.newValue);
    if (changes.theme || changes.accent) {
      chrome.storage.sync.get(DEFAULT_STATE, function (state) {
        applyTheme(state.theme, state.accent);
      });
    }
    if (changes.stickers) renderStickers(changes.stickers.newValue);
  });

  if (document.body) getStickerLayer();
  else document.addEventListener('DOMContentLoaded', getStickerLayer, { once: true });
})();
