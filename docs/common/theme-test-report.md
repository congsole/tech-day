# 공통 Theme 검증 결과

- 검증일: 2026-10-26
- 근거: `docs/common/design-system.md` §3 기본 시각 규칙, §6 적용과 검토
- 대상: `src/shared/theme.ts`, Mantine 9.7.3
- 배경: #35에서 미반영으로 기록한 공통 색상과 의미별 색상의 문서 기준 반영

## 보완 내용

| 항목 | 기존 기본값 | 문서 기준에 맞춘 값 |
|---|---|---|
| 기본 입력창 테두리 | gray.4 | gray.6 |
| 비활성 배경 / 글자 | gray.2 / gray.5 | gray.1 / gray.6 |
| 입력 오류 색 | red.6 | red.9 |
| 입력 성공 색 | teal.8 | green.9 |
| teal·red·orange·green의 light 배경 | 각 색상의 1단계 | 각 색상의 0단계 |

- 일반 입력창의 wrapper 변수만 변경하여 input의 focus 스타일 유지
- 오류·성공 상태와 filled·unstyled 입력 변형은 기존 상태 처리 유지
- light 배경은 기본 색 이름을 사용하는 경우에 적용하며, 명시적인 색 단계 등 화면별 재정의는 별도 검토 대상
- hover 색상과 포커스 동작은 Mantine 기본 동작 유지

## 완료한 검증

| 검증 | 방법 | 결과 |
|---|---|---|
| 의존성 설치 | 잠금 파일 기준 `npm ci --ignore-scripts` | 통과 |
| 정적 검사 | `npm run lint` | 통과 |
| 타입 검사·배포 빌드 | `npm run build` | 통과 |
| 의미별 색상 | Mantine 기본 Theme와 프로젝트 Theme를 병합한 CSS 변수 대조 | 비활성·오류·성공 색 일치 |
| 연한 배경 | teal·red·orange·green의 light 변수 대조 | 배경 0단계·글자 9단계, hover는 기존 2단계 유지 |
| 입력 컴포넌트 적용 | 임시 Vite SSR 검증 코드에서 실제 MantineProvider와 TextInput·Textarea·Select를 renderToStaticMarkup으로 렌더링 | 일반·비활성 입력에 gray.6 테두리 변수 적용 |
| 상태별 예외 | 오류·성공·filled·unstyled 입력을 SSR 렌더링 | 일반 테두리 재정의 미적용, Mantine 상태 처리 유지 |
| 오류·잠금 속성 | SSR 결과의 aria-invalid·disabled 확인 | 유지 |
| 오류 스타일 해제 | withErrorStyles=false 입력 SSR 렌더링 | 일반 테두리 적용 |
| 포커스 설정 | 병합 Theme와 설치 버전 Input 스타일 소스 대조 | focusRing=auto, 주요 색 teal.9 유지 |

SSR 검증은 HTML 속성·스타일 변수와 설정을 확인한 결과이며 브라우저의 최종 계산 스타일이나 실제 조작 검증을 대체하지 않는다. 검증용 임시 코드는 제품 라우트에 추가하지 않았다.

## 남은 화면 검증

연결된 브라우저가 없어 아래 항목은 미실시. 화면 검증 완료 후 결과 갱신 필요.

- 모바일·데스크톱에서 기본·hover·focus·disabled 버튼과 입력창의 최종 색상 및 가독성 확인
- 키보드 Tab 이동 시 포커스 표시와 비활성 요소 건너뛰기 확인
- 오류·성공 입력의 포커스 진입·해제 및 상태 전환 확인
- 연한 강조·오류·주의·성공 배경과 글자 조합 확인

기능별 문구·금액·반응형 화면 구성은 각 기능 구현 시 해당 기능 테스트 결과서에서 검증한다.
