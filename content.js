// TweetDeck Classic UI
// X(twitter.com/x.com) 화면에 예전 트윗덱 느낌의 컬럼 헤더를 삽입하고,
// 켬/끔 상태를 <html> 요소의 tdc-enabled 클래스로 반영한다. 실제 색상·
// 여백 변경은 content.css가 이 클래스를 기준으로 적용한다.
(function () {
  'use strict';

  var root = document.documentElement;

  function applyState(enabled) {
    root.classList.toggle('tdc-enabled', !!enabled);
  }

  // 저장된 값(기본값: 켜짐)을 읽어 즉시 반영. document_start 시점이라
  // <body>가 아직 없을 수 있으므로 documentElement에만 클래스를 건다.
  chrome.storage.sync.get({ enabled: true }, function (items) {
    applyState(items.enabled);
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'sync' && changes.enabled) {
      applyState(changes.enabled.newValue);
    }
  });

  // 트윗덱 스타일 컬럼 헤더를 타임라인 맨 위에 한 번만 삽입한다.
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
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
