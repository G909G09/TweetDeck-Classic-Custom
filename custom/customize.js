// 커스텀 레이어 (dimdenGD/OldTweetDeck 포크에 추가됨)
// 원본 구 트윗덱 기능(src/*.js)에는 전혀 관여하지 않고, 화면 위에
// 색상·모양 CSS 변수를 주입하고 스티커 레이어만 얹는다.
// 색상/모양 설정은 chrome.storage.sync(작은 값, 계정 간 동기화)에,
// 스티커(이미지 데이터 포함)는 chrome.storage.local(큰 값 허용)에 둔다.
(function () {
  'use strict';

  var root = document.documentElement;

  // theme.css의 :root 변수와 값을 맞춰둔 팔레트. "classic"은 원조 구
  // 트윗덱 배색(#1da1f2/#15202b) 그대로, 나머지는 자유도를 위한 변형.
  // 색상 6종을 팝업에서 개별적으로 직접 바꿀 수도 있다(THEMES는 그 시작값).
  var THEMES = {
    classic: { bg: '#15202b', columnBg: '#192734', headerBg: '#1c2732', border: '#38444d', accent: '#1da1f2', text: '#d9d9d9' },
    midnight: { bg: '#0e0b1a', columnBg: '#161129', headerBg: '#1a1430', border: '#332a55', accent: '#8b5cf6', text: '#e6e1ff' },
    forest: { bg: '#0e1a14', columnBg: '#13251c', headerBg: '#162b20', border: '#2c4a3a', accent: '#22c55e', text: '#d8f5e4' },
    sunset: { bg: '#1a1210', columnBg: '#261a17', headerBg: '#2b1e1a', border: '#4a3530', accent: '#fb923c', text: '#ffe9d9' },
    paper: { bg: '#f2f2f0', columnBg: '#ffffff', headerBg: '#eceae6', border: '#d8d5cf', accent: '#0f6fb3', text: '#20242a' }
  };
  var DEFAULT_SYNC_STATE = {
    enabled: true,
    theme: 'classic',
    colors: THEMES.classic,
    glass: false,
    radius: 8,
    columnWidth: 310
  };
  var DEFAULT_STICKERS = [];

  function hexToRgbStr(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return '21, 32, 43';
    return parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16);
  }

  function applyColors(colors) {
    var c = Object.assign({}, THEMES.classic, colors || {});
    root.style.setProperty('--otdc-bg', c.bg);
    root.style.setProperty('--otdc-column-bg', c.columnBg);
    root.style.setProperty('--otdc-header-bg', c.headerBg);
    root.style.setProperty('--otdc-border', c.border);
    root.style.setProperty('--otdc-accent', c.accent);
    root.style.setProperty('--otdc-text', c.text);
    root.style.setProperty('--otdc-bg-rgb', hexToRgbStr(c.bg));
    root.style.setProperty('--otdc-column-bg-rgb', hexToRgbStr(c.columnBg));
    root.style.setProperty('--otdc-header-bg-rgb', hexToRgbStr(c.headerBg));
    root.style.setProperty('--otdc-accent-rgb', hexToRgbStr(c.accent));
  }

  function applyEnabled(enabled) {
    root.classList.toggle('otdc-enabled', !!enabled);
  }

  function applyGlass(glass) {
    root.classList.toggle('otdc-glass', !!glass);
  }

  function applyShape(radius, columnWidth) {
    root.style.setProperty('--otdc-radius', (radius || 8) + 'px');
    root.style.setProperty('--otdc-column-width', (columnWidth || 310) + 'px');
  }

  // ---- 스티커 (이모지 또는 사용자가 올린 이미지) ----
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
    chrome.storage.local.set({ stickers: stickers });
  }

  function renderStickers(stickers) {
    var layer = getStickerLayer();
    layer.innerHTML = '';
    (stickers || []).forEach(function (sticker) {
      layer.appendChild(buildStickerEl(sticker, stickers));
    });
  }

  function buildStickerEl(sticker, allStickers) {
    var isImage = sticker.type === 'image';
    var el = document.createElement('div');
    el.className = 'otdc-sticker ' + (isImage ? 'otdc-sticker-image' : 'otdc-sticker-emoji');
    el.style.left = sticker.x + 'vw';
    el.style.top = sticker.y + 'vh';
    var size = sticker.size || (isImage ? 100 : 60);
    el.style.setProperty('--otdc-sticker-size', size + 'px');
    el.dataset.id = sticker.id;

    if (isImage) {
      var img = document.createElement('img');
      img.src = sticker.content;
      img.alt = '';
      el.appendChild(img);
    } else {
      el.appendChild(document.createTextNode(sticker.content));
    }

    var removeBtn = document.createElement('span');
    removeBtn.className = 'otdc-sticker-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var next = allStickers.filter(function (s) { return s.id !== sticker.id; });
      saveStickers(next);
    });
    el.appendChild(removeBtn);

    var resizeHandle = document.createElement('span');
    resizeHandle.className = 'otdc-sticker-resize';
    el.appendChild(resizeHandle);

    function commit(patch) {
      var next = allStickers.map(function (s) {
        return s.id === sticker.id ? Object.assign({}, s, patch) : s;
      });
      saveStickers(next);
    }

    // 드래그로 위치 이동
    var dragging = false, dragX = 0, dragY = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.target === removeBtn || e.target === resizeHandle) return;
      dragging = true;
      el.classList.add('otdc-dragging');
      el.setPointerCapture(e.pointerId);
      dragX = e.clientX;
      dragY = e.clientY;
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX, dy = e.clientY - dragY;
      dragX = e.clientX; dragY = e.clientY;
      var rect = el.getBoundingClientRect();
      el.style.left = ((rect.left + dx) / window.innerWidth) * 100 + 'vw';
      el.style.top = ((rect.top + dy) / window.innerHeight) * 100 + 'vh';
    });
    el.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('otdc-dragging');
      var rect = el.getBoundingClientRect();
      commit({ x: (rect.left / window.innerWidth) * 100, y: (rect.top / window.innerHeight) * 100 });
    });

    // 모서리 손잡이 드래그로 크기 조절
    var resizing = false, resizeStartX = 0, resizeStartSize = size;
    resizeHandle.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      resizing = true;
      resizeHandle.setPointerCapture(e.pointerId);
      resizeStartX = e.clientX;
      resizeStartSize = size;
    });
    resizeHandle.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      var delta = e.clientX - resizeStartX;
      var next = Math.max(24, Math.min(320, resizeStartSize + delta));
      el.style.setProperty('--otdc-sticker-size', next + 'px');
    });
    resizeHandle.addEventListener('pointerup', function () {
      if (!resizing) return;
      resizing = false;
      var current = parseFloat(getComputedStyle(el).getPropertyValue('--otdc-sticker-size')) || size;
      commit({ size: current });
    });

    return el;
  }

  // ---- storage 로드 + 실시간 반영 ----
  chrome.storage.sync.get(DEFAULT_SYNC_STATE, function (state) {
    applyEnabled(state.enabled);
    applyColors(state.colors);
    applyGlass(state.glass);
    applyShape(state.radius, state.columnWidth);
  });
  chrome.storage.local.get({ stickers: DEFAULT_STICKERS }, function (state) {
    renderStickers(state.stickers);
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'sync') {
      if (changes.enabled) applyEnabled(changes.enabled.newValue);
      if (changes.colors) applyColors(changes.colors.newValue);
      if (changes.glass) applyGlass(changes.glass.newValue);
      if (changes.radius || changes.columnWidth) {
        chrome.storage.sync.get(DEFAULT_SYNC_STATE, function (state) {
          applyShape(state.radius, state.columnWidth);
        });
      }
    } else if (area === 'local') {
      if (changes.stickers) renderStickers(changes.stickers.newValue);
    }
  });

  if (document.body) getStickerLayer();
  else document.addEventListener('DOMContentLoaded', getStickerLayer, { once: true });
})();
