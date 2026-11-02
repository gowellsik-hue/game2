# HWPX Generator GitHub Pages v0.17

사용 흐름: 원본 Word/Excel/HWPX 드래그 → 목표 양식 선택 → HWPX 생성 → `rhwptopdf` WASM으로 생성 HWPX를 PDF 렌더 → 미리보기 → HWPX 저장.

문서 파일은 서버로 업로드하지 않습니다. 파싱, HWPX 생성, PDF 렌더는 브라우저 안에서 수행됩니다. GitHub Pages는 정적 HTML/JS/WASM만 제공합니다.

## 배포

이 폴더 내용을 GitHub 저장소 `main` 브랜치에 올리고 Settings → Pages → Source를 **GitHub Actions**로 설정합니다. `pages.yml`이 `rhwptopdf`의 UMD/WASM을 빌드 시 가져와 같은 사이트에 배치합니다.

배포 후 `?render_test=1`을 URL 뒤에 붙이면 내부 HWPX 생성 → WASM PDF 변환 자체검증을 실행합니다. 화면 상태에 `RHWPTOPDF PASS`가 떠야 합니다.

## Renderer attribution

Preview rendering uses `sanguneo/rhwptopdf` (MIT) and its upstream `edwardkim/rhwp` parser/renderer components (Apache-2.0 attribution applies upstream). See upstream repositories for current LICENSE/NOTICE terms.


## 미리보기 글꼴

PDF 미리보기는 Chrome/Edge의 Local Font Access API로 PC에 설치된 한글 글꼴을 사용합니다. 첫 미리보기 때 브라우저가 로컬 글꼴 권한을 요청하면 허용해야 합니다. 권한이 없으면 가짜 미리보기로 대체하지 않고 저장을 차단합니다.
