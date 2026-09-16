// 트윗덱 클래식 UI
// X(twitter.com/x.com) 화면에 예전 트윗덱 느낌의 컬럼 헤더를 삽입하고,
// 켬/끔 상태·색상 테마·스티커를 <html> 요소와 storage 값을 기준으로 반영한다.
// 실제 배색·여백 변경은 content.css가 tdc-enabled 클래스와 CSS 변수를
// 기준으로 적용하고, 이 파일은 그 변수 값과 스티커 DOM만 관리한다.
(function () {
  'use strict';

  var root = document.documentElement;

  // 미리 정의된 색상 테마 — 팝업에서 고르면 아래 값이 CSS 변수로 적용된다.
  // "classic"은 원조 트윗덱 남색+파랑 배색, 나머지는 자유도를 위한 변형.
  var THEMES = {
    classic: { bg: '#15202b', columnBg: '#192734', headerBg: '#1c2732', border: '#38444d', accent: '#1da1f2', text: '#d9d9d9', textDim: '#8899a6' },
    midnight: { bg: '#0e0b1a', columnBg: '#161129', headerBg: '#1a1430', border: '#332a55', accent: '#8b5cf6', text: '#e6e1ff', textDim: '#a599c9' },
    forest: { bg: '#0e1a14', columnBg: '#13251c', headerBg: '#162b20', border: '#2c4a3a', accent: '#22c55e', text: '#d8f5e4', textDim: '#8fb8a2' },
    sunset: { bg: '#1a1210', columnBg: '#261a17', headerBg: '#2b1e1a', border: '#4a3530', accent: '#fb923c', text: '#ffe9d9', textDim: '#c2a191' },
    paper: { bg: '#f2f2f0', columnBg: '#ffffff', headerBg: '#eceae6', border: '#d8d5cf', accent: '#0f6fb3', text: '#20242a', textDim: '#5b6470' }
  };
  var DEFAULT_STATE = { enabled: true, theme: 'classic', accent: '', stickers: [] };

  function applyTheme(themeKey, customAccent) {
    var theme = THEMES[themeKey] || THEMES.classic;
    root.style.setProperty('--tdc-bg', theme.bg);
    root.style.setProperty('--tdc-column-bg', theme.columnBg);
    root.style.setProperty('--tdc-header-bg', theme.headerBg);
    root.style.setProperty('--tdc-border', theme.border);
    root.style.setProperty('--tdc-accent', customAccent || theme.accent);
    root.style.setProperty('--tdc-text', theme.text);
    root.style.setProperty('--tdc-text-dim', theme.textDim);
  }

  function applyEnabled(enabled) {
    root.classList.toggle('tdc-enabled', !!enabled);
  }

  // ---- 스티커: 팝업에서 고른 이모지를 화면 위 아무 곳에나 붙여두고 드래그로 옮길 수 있음 ----
  var stickerLayer = null;
  function getStickerLayer() {
    if (!stickerLayer || !stickerLayer.isConnected) {
      stickerLayer = document.createElement('div');
      stickerLayer.id = 'tdc-sticker-layer';
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
    el.className = 'tdc-sticker';
    el.style.left = sticker.x + 'vw';
    el.style.top = sticker.y + 'vh';
    el.textContent = sticker.emoji;
    el.dataset.id = sticker.id;

    var removeBtn = document.createElement('span');
    removeBtn.className = 'tdc-sticker-remove';
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
      el.classList.add('tdc-dragging');
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = e.clientX; startY = e.clientY;
      var rect = el.getBoundingClientRect();
      var newLeftVw = ((rect.left + dx) / window.innerWidth) * 100;
      var newTopVh = ((rect.top + dy) / window.innerHeight) * 100;
      el.style.left = newLeftVw + 'vw';
      el.style.top = newTopVh + 'vh';
    });
    function stopDrag(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('tdc-dragging');
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

  // ---- 트윗덱 스타일 컬럼 헤더를 타임라인 맨 위에 한 번만 삽입 ----
  // X는 SPA라 홈/알림 등을 오가도 페이지가 새로 로드되지 않으므로
  // MutationObserver로 primaryColumn이 (재)생성될 때마다 확인한다.
  function ensureColumnHeader() {
    var column = document.querySelector('[data-testid="primaryColumn"]');
    if (!column) return;
    if (column.querySelector(':scope > .tdc-column-header')) return;

    var header = document.createElement('div');
    header.className = 'tdc-column-header';

    var dot = document.createElement('span');
    dot.className = 'tdc-dot';
    header.appendChild(dot);

    var title = document.createElement('span');
    title.textContent = document.title.replace(/\s*\/\s*X$/, '').trim() || 'HOME';
    header.appendChild(title);

    var refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = '새로고침';
    refresh.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // X 자체의 "새 게시물 보기" 버튼이 떠 있으면 대신 눌러 타임라인을 갱신한다.
      var nativeRefresh = document.querySelector('[data-testid="primaryColumn"] [role="button"][aria-live], [data-testid="primaryColumn"] a[href="/home"]');
      if (nativeRefresh) nativeRefresh.click();
    });
    header.appendChild(refresh);

    column.insertBefore(header, column.firstChild);
  }

  var observer = new MutationObserver(function () {
    ensureColumnHeader();
  });

  function start() {
    ensureColumnHeader();
    getStickerLayer();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
