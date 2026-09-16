# 구 트윗덱 커스텀 (OldTweetDeck Custom)

이 저장소는 [dimdenGD/OldTweetDeck](https://github.com/dimdenGD/OldTweetDeck) (MIT License)의 **포크**입니다. `x.com/i/tweetdeck`에서 예전 트윗덱(TweetDeck) 웹앱을 실제로 그대로 복원해 동작시키는 원본 코드를 손대지 않고 그대로 가져왔고, 여기에 색상 테마와 스티커 같은 개인화 기능만 추가했습니다.

> **구 트윗덱의 모든 기능은 원본 OldTweetDeck과 동일하게 그대로 동작합니다.** 컬럼 구성, 검색, DM, 예약 트윗 등 원본이 지원하는 기능 전부를 이 포크에서도 그대로 쓸 수 있습니다(자세한 사용법·FAQ·업데이트 방식은 [원본 저장소 문서](https://github.com/dimdenGD/OldTweetDeck/blob/main/docs/README_KO.md) 참고).

## 크레딧 / 라이선스

- 원본 프로젝트: [OldTweetDeck](https://github.com/dimdenGD/OldTweetDeck) — 제작: [dimdenGD](https://github.com/dimdenGD) (dimden.dev)
- 라이선스: MIT License (원본 `LICENSE` 파일을 그대로 포함하고 있습니다)
- `src/`, `files/`, `images/`, `manifest.json`(커스텀 레이어 추가분 제외), `ruleset.json`, `pack.js`는 원본 그대로이며, 이 포크가 직접 작성한 코드는 `custom/` 폴더뿐입니다.

## 이 포크에서 추가된 것 (`custom/`)

원본 기능에는 전혀 관여하지 않는 별도 레이어로, 화면 위에 색상만 덧입히고 스티커를 얹습니다.

- **색상 테마 5종**(클래식/미드나잇/포레스트/선셋/페이퍼(라이트)) — 툴바 아이콘 팝업에서 선택
- **강조색 직접 지정** — 컬러 피커로 원하는 색을 바로 지정
- **스티커** — 팝업에서 이모지를 클릭하면 화면 위에 붙고, 드래그로 위치를 옮기거나 ✕로 지울 수 있음(위치는 `chrome.storage.sync`에 저장)
- 테마 색상은 `.app-header`, `.column`, `.column-nav`, `.app-nav-link` 등 구 트윗덱의 실제 CSS 클래스를 기준으로 적용됩니다(원본 `files/bundle.css`는 수정하지 않고, 그 위에 별도 스타일시트로 덮어씀)

## 설치 (개발자 모드로 압축해제된 확장 프로그램 로드)

1. 이 저장소를 다운로드(.zip) 후 압축 해제
2. Chrome/Edge에서 `chrome://extensions` (엣지는 `edge://extensions`) 접속
3. 우측 상단 "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭 후 이 저장소 폴더 선택
5. `https://x.com/i/tweetdeck` 접속 — 구 트윗덱이 뜨고, 위에 색상 테마·스티커가 함께 적용됩니다
6. 툴바의 확장 프로그램 아이콘을 눌러 테마·스티커를 바꿀 수 있습니다

## 폴더 구조

```
manifest.json      확장 프로그램 매니페스트 (Manifest V3) — action/커스텀 content_script만 추가, 나머지는 원본 그대로
src/                원본 OldTweetDeck 핵심 로직(요청 가로채기·인증·알림 등) — 수정 없음
files/              원본이 보관해둔 예전 트윗덱 웹앱 아카이브(bundle.js/css 등) — 수정 없음
images/             원본 아이콘 — 수정 없음
ruleset.json        원본 declarativeNetRequest 규칙 — 수정 없음
custom/             ★ 이 포크에서 추가한 커스터마이징 레이어
  theme.css           색상 테마 CSS 변수 + 스티커 스타일
  customize.js        테마/스티커 상태를 storage에서 읽어 반영 (content script)
  popup.html/js       툴바 아이콘 팝업 — 테마 선택, 강조색 피커, 스티커 팔레트
LICENSE             원본 MIT 라이선스 (그대로 유지)
```

## 동작 원리

- 구 트윗덱 자체의 복원 방식(요청 가로채기로 아카이브된 웹앱을 서빙하고, 인증 토큰을 가로채 현재 X API와 통신)은 원본 OldTweetDeck의 `src/` 코드를 그대로 사용합니다.
- `custom/customize.js`는 같은 페이지(`x.com/i/tweetdeck`)에 별도 content script로 얹혀서 `chrome.storage.sync`의 테마·스티커 값을 읽어 `<html>`에 `otdc-enabled` 클래스와 `--otdc-*` CSS 변수를 설정하고, `custom/theme.css`가 이 값을 기준으로 원본 UI의 배경·강조색만 덮어씁니다.
- 스티커는 화면에 고정된 레이어(`#otdc-sticker-layer`)에 이모지 `div`로 그려지며, `pointerdown`/`pointermove`로 드래그해 옮긴 위치(`vw`/`vh` 비율)를 `chrome.storage.sync`에 저장해 다음에 열어도 유지됩니다.
