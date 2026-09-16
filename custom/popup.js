(function () {
  'use strict';

  // custom/customize.js와 동일한 팔레트 — 팝업 스와치 미리보기용으로
  // 여기도 하나 둔다(팝업/콘텐츠 스크립트는 별도 컨텍스트라 값만 맞춰둠).
  var THEMES = {
    classic: { label: '클래식', bg: '#15202b', columnBg: '#192734', headerBg: '#1c2732', border: '#38444d', accent: '#1da1f2', text: '#d9d9d9' },
    midnight: { label: '미드나잇', bg: '#0e0b1a', columnBg: '#161129', headerBg: '#1a1430', border: '#332a55', accent: '#8b5cf6', text: '#e6e1ff' },
    forest: { label: '포레스트', bg: '#0e1a14', columnBg: '#13251c', headerBg: '#162b20', border: '#2c4a3a', accent: '#22c55e', text: '#d8f5e4' },
    sunset: { label: '선셋', bg: '#1a1210', columnBg: '#261a17', headerBg: '#2b1e1a', border: '#4a3530', accent: '#fb923c', text: '#ffe9d9' },
    paper: { label: '페이퍼(라이트)', bg: '#f2f2f0', columnBg: '#ffffff', headerBg: '#eceae6', border: '#d8d5cf', accent: '#0f6fb3', text: '#20242a' }
  };
  var STICKER_EMOJIS = ['⭐', '💙', '🐦', '🎉', '🔥', '💜', '🌙', '✨', '☕', '🍀'];
  var DEFAULT_SYNC_STATE = { enabled: true, theme: 'classic', colors: THEMES.classic, glass: false, radius: 8, columnWidth: 310 };
  var COLOR_FIELDS = ['bg', 'columnBg', 'headerBg', 'border', 'accent', 'text'];
  var MAX_STICKER_DIMENSION = 480; // 업로드한 이미지는 이 크기로 축소해 저장 용량을 아낀다

  var checkbox = document.getElementById('toggle-enabled');
  var themeRow = document.getElementById('theme-row');
  var radiusSlider = document.getElementById('radius-slider');
  var radiusVal = document.getElementById('radius-val');
  var widthSlider = document.getElementById('width-slider');
  var widthVal = document.getElementById('width-val');
  var glassToggle = document.getElementById('toggle-glass');
  var stickerRow = document.getElementById('sticker-row');
  var stickersClear = document.getElementById('stickers-clear');
  var uploadBtn = document.getElementById('sticker-upload-btn');
  var uploadInput = document.getElementById('sticker-upload-input');

  var colorInputs = {};
  COLOR_FIELDS.forEach(function (field) {
    colorInputs[field] = document.getElementById('color-' + field);
  });

  function setActiveSwatch(themeKey) {
    themeRow.querySelectorAll('.theme-swatch').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });
  }

  function setColorInputs(colors) {
    var c = Object.assign({}, THEMES.classic, colors || {});
    COLOR_FIELDS.forEach(function (field) {
      colorInputs[field].value = c[field];
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
      chrome.storage.sync.set({ theme: key, colors: theme });
      setColorInputs(theme);
      setActiveSwatch(key);
    });
    themeRow.appendChild(btn);
  });

  // ---- 색상 직접 조정: 하나라도 바꾸면 테마는 "커스텀" 취급(스와치 활성 표시 해제) ----
  COLOR_FIELDS.forEach(function (field) {
    colorInputs[field].addEventListener('input', function () {
      chrome.storage.sync.get({ colors: THEMES.classic }, function (state) {
        var next = Object.assign({}, THEMES.classic, state.colors, {});
        next[field] = colorInputs[field].value;
        chrome.storage.sync.set({ colors: next, theme: 'custom' });
        setActiveSwatch('custom');
      });
    });
  });

  // ---- 모양: 모서리 둥글기 / 컬럼 폭 ----
  radiusSlider.addEventListener('input', function () {
    radiusVal.textContent = radiusSlider.value + 'px';
    chrome.storage.sync.set({ radius: Number(radiusSlider.value) });
  });
  widthSlider.addEventListener('input', function () {
    widthVal.textContent = widthSlider.value + 'px';
    chrome.storage.sync.set({ columnWidth: Number(widthSlider.value) });
  });

  glassToggle.addEventListener('change', function () {
    chrome.storage.sync.set({ glass: glassToggle.checked });
  });

  checkbox.addEventListener('change', function () {
    chrome.storage.sync.set({ enabled: checkbox.checked });
  });

  chrome.storage.sync.get(DEFAULT_SYNC_STATE, function (state) {
    checkbox.checked = !!state.enabled;
    setActiveSwatch(state.theme);
    setColorInputs(state.colors);
    radiusSlider.value = state.radius;
    radiusVal.textContent = state.radius + 'px';
    widthSlider.value = state.columnWidth;
    widthVal.textContent = state.columnWidth + 'px';
    glassToggle.checked = !!state.glass;
  });

  // ---- 스티커 (이모지 빠른 팔레트 + 사용자 이미지 업로드) ----
  function addSticker(sticker) {
    chrome.storage.local.get({ stickers: [] }, function (items) {
      chrome.storage.local.set({ stickers: items.stickers.concat(sticker) });
    });
  }

  function randomStickerPos() {
    return { x: 10 + Math.random() * 60, y: 15 + Math.random() * 60 };
  }

  STICKER_EMOJIS.forEach(function (emoji) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sticker-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', function () {
      var pos = randomStickerPos();
      addSticker({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        type: 'emoji',
        content: emoji,
        size: 60,
        x: pos.x,
        y: pos.y
      });
    });
    stickerRow.insertBefore(btn, uploadBtn);
  });

  uploadBtn.addEventListener('click', function () {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', function () {
    var file = uploadInput.files && uploadInput.files[0];
    uploadInput.value = '';
    if (!file || !/^image\//.test(file.type)) return;

    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, MAX_STICKER_DIMENSION / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/png');
        var pos = randomStickerPos();
        addSticker({
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          type: 'image',
          content: dataUrl,
          size: Math.min(160, Math.max(60, w > h ? 140 : 140 * (w / h))),
          x: pos.x,
          y: pos.y
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  stickersClear.addEventListener('click', function () {
    chrome.storage.local.set({ stickers: [] });
  });
})();
