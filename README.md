# 구 트윗덱 커스텀 (OldTweetDeck Custom)

이 저장소는 [dimdenGD/OldTweetDeck](https://github.com/dimdenGD/OldTweetDeck) (MIT License)의 **포크**입니다. `x.com/i/tweetdeck`에서 예전 트윗덱(TweetDeck) 웹앱을 실제로 그대로 복원해 동작시키는 원본 코드를 손대지 않고 그대로 가져왔고, 여기에 색상·모양을 자유롭게 바꾸는 커스터마이징, Apple 리퀴드 글래스풍 반투명 모드, 직접 업로드하는 이미지 스티커 같은 개인화 기능만 추가했습니다.

> **구 트윗덱의 모든 기능은 원본 OldTweetDeck과 동일하게 그대로 동작합니다.** 컬럼 구성, 검색, DM, 예약 트윗 등 원본이 지원하는 기능 전부를 이 포크에서도 그대로 쓸 수 있습니다(자세한 사용법·FAQ·업데이트 방식은 [원본 저장소 문서](https://github.com/dimdenGD/OldTweetDeck/blob/main/docs/README_KO.md) 참고).

## 이 포크에서 고친 버그

- **`x.com/i/tweetdeck` 접속 시 그냥 홈(`/home`)으로 넘어가버리는 문제** — 원본의 매니페스트 V3용 `ruleset.json`에는 `content-security-policy`/`x-frame-options` 응답 헤더만 제거하도록 되어 있었는데, X가 이 주소에 `Location` 헤더(리다이렉트)를 함께 내려주는 경우 확장 스크립트가 실행되기도 전에 브라우저가 곧장 리다이렉트를 따라가버려 구 트윗덱이 전혀 뜨지 않는 문제가 있었습니다. 원본의 레거시 매니페스트 V2 스크립트(`src/background.js`, 현재 미사용)에는 이미 이 헤더도 함께 제거하는 로직이 있었던 것으로 보아 V3로 옮기며 빠진 것으로 보입니다 — `ruleset.json`에 `location` 헤더 제거를 추가해 해결했습니다.

## 크레딧 / 라이선스

- 원본 프로젝트: [OldTweetDeck](https://github.com/dimdenGD/OldTweetDeck) — 제작: [dimdenGD](https://github.com/dimdenGD) (dimden.dev)
- 라이선스: MIT License (원본 `LICENSE` 파일을 그대로 포함하고 있습니다)
- `src/`, `files/`, `images/`, `manifest.json`(커스텀 레이어 추가분 제외), `ruleset.json`, `pack.js`는 원본 그대로이며, 이 포크가 직접 작성한 코드는 `custom/` 폴더뿐입니다.

## 이 포크에서 추가된 것 (`custom/`)

원본 기능에는 전혀 관여하지 않는 별도 레이어로, 화면 위에 색상·모양만 덧입히고 스티커를 얹습니다.

- **색상 테마 5종**(클래식/미드나잇/포레스트/선셋/페이퍼(라이트)) — 툴바 아이콘 팝업에서 선택하면 빠르게 시작 가능
- **색상 6종 직접 조정** — 배경/컬럼 배경/상단바/테두리/강조색/글자색을 각각 컬러 피커로 원하는 대로 지정(테마는 시작점일 뿐, 전부 따로 덮어쓸 수 있음)
- **모양 커스터마이징** — 모서리 둥글기(0~24px), 컬럼 폭(260~460px, 원본 고정폭 310px보다 넓게/좁게)을 슬라이더로 조절
- **리퀴드 글래스 모드** — Apple의 "Liquid Glass" 디자인 언어에서 영감을 받은 반투명 블러 효과. 상단바·컬럼·드롭다운을 `backdrop-filter: blur()`로 유리처럼 흐리게 비치게 하고, 옅은 흰 테두리·그림자로 유리 가장자리 하이라이트를 표현. 켜고 끌 수 있으며 위에서 고른 색상을 그대로 반투명하게 사용
- **스티커** — 이모지를 클릭하거나 **컴퓨터에 있는 이미지를 직접 업로드**해서 화면 위에 붙일 수 있음. 드래그로 위치를 옮기고, 모서리 손잡이로 크기를 조절하고, 마우스를 올려 ✕로 지울 수 있음(업로드한 이미지는 자동으로 축소돼 저장되고, 외부로 전송되지 않으며 이 브라우저에만 남음)
- 색상·모양은 `.app-header`, `.column`, `.column-nav`, `.app-nav-link` 등 구 트윗덱의 실제 CSS 클래스를 기준으로 적용됩니다(원본 `files/bundle.css`는 수정하지 않고, 그 위에 별도 스타일시트로 덮어씀)

## 설치 (개발자 모드로 압축해제된 확장 프로그램 로드)

1. 이 저장소를 다운로드(.zip) 후 압축 해제
2. Chrome/Edge에서 `chrome://extensions` (엣지는 `edge://extensions`) 접속
3. 우측 상단 "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭 후 이 저장소 폴더 선택
5. `https://x.com/i/tweetdeck` 접속 — 구 트윗덱이 뜨고, 위에 커스텀 색상·모양이 함께 적용됩니다
6. 툴바의 확장 프로그램 아이콘을 눌러 색상·모양·글래스 모드·스티커를 바꿀 수 있습니다

## 폴더 구조

```
manifest.json      확장 프로그램 매니페스트 (Manifest V3) — action/커스텀 content_script·unlimitedStorage 권한만 추가, 나머지는 원본 그대로
src/                원본 OldTweetDeck 핵심 로직(요청 가로채기·인증·알림 등) — 수정 없음
files/              원본이 보관해둔 예전 트윗덱 웹앱 아카이브(bundle.js/css 등) — 수정 없음
images/             원본 아이콘 — 수정 없음
ruleset.json        원본 declarativeNetRequest 규칙 — 수정 없음
custom/             ★ 이 포크에서 추가한 커스터마이징 레이어
  theme.css           색상/모양 CSS 변수 + 리퀴드 글래스 + 스티커 스타일
  customize.js        색상/모양/글래스/스티커 상태를 storage에서 읽어 반영 (content script)
  popup.html/js       툴바 아이콘 팝업 — 테마 프리셋, 색상 6종 피커, 모양 슬라이더, 글래스 토글, 스티커(이모지+이미지 업로드)
LICENSE             원본 MIT 라이선스 (그대로 유지)
```

## 동작 원리

- 구 트윗덱 자체의 복원 방식(요청 가로채기로 아카이브된 웹앱을 서빙하고, 인증 토큰을 가로채 현재 X API와 통신)은 원본 OldTweetDeck의 `src/` 코드를 그대로 사용합니다.
- `custom/customize.js`는 같은 페이지(`x.com/i/tweetdeck`)에 별도 content script로 얹혀서 `chrome.storage.sync`의 색상·모양·글래스 값을 읽어 `<html>`에 `otdc-enabled`/`otdc-glass` 클래스와 `--otdc-*` CSS 변수(색상은 hex와, 리퀴드 글래스의 `rgba()` 반투명 배경을 위한 "r,g,b" 형태 둘 다)를 설정하고, `custom/theme.css`가 이 값을 기준으로 원본 UI의 배경·테두리·모서리·강조색만 덮어씁니다.
- 스티커는 이모지(글자)와 이미지(업로드한 파일) 두 종류를 같은 방식으로 다룹니다. 이미지는 팝업에서 `<canvas>`로 최대 480px까지 축소한 뒤 PNG data URL로 `chrome.storage.local`(용량이 큰 값도 허용하도록 `unlimitedStorage` 권한 사용)에 저장하고, 화면에는 고정 레이어(`#otdc-sticker-layer`)에 그려집니다. `pointerdown`/`pointermove`로 드래그해 위치(`vw`/`vh` 비율)를 옮기고, 모서리 손잡이로 크기를 조절할 수 있으며 둘 다 다음에 열어도 유지됩니다.
