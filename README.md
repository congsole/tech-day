# tech-day

테크데이 준비 리포. 3명이 AI 에이전트와 함께 웹앱을 만들며, AI 협업 방식을 실험하는 곳.

## 3줄 요약

1. **문서 먼저, 코드는 나중.** 문서에 없는 건 에이전트도 만들지 않음
2. **모든 길은 `dev`로.** `dev`에서 브랜치를 따고, `dev`로 PR
3. **정한 건 `decision`, 느낀 건 `retro`.** 둘 다 이슈로 기록

## 시작 전 5분

1. `gh auth login` — 이슈는 `gh`로 관리
2. 쓰는 에이전트에 `규칙 확인` 입력 → `TECHDAY-OK`가 나오면 준비 완료
3. 에이전트가 따르는 규칙이 궁금하면 `AGENTS.md`

## 지금 어디쯤?

- [ ] 0번 PR: 규칙과 문서 틀
- [ ] `planning.md`: 기능 목록, 담당자 확정
- [ ] 공통 설계 (병렬): 도메인·DB / 디자인 / 기술 스택
- [ ] 기능별 개발: 아래 흐름 반복

## 기능 하나 만들기: 로그인 예시

A가 작성하고 B가 검토하는 경우.

**1. A — 요구사항 작성**
- 직접 작성 또는 에이전트 사용하여 작성
- `requirements.md`에 `REQ-LOGIN-01` 같은 요구사항 작성
- 참조할 테이블·용어 등이 공통 문서에 없으면 같은 브랜치에서 공통 문서도 수정
- `dev`로 문서 PR. 공통 문서가 포함되면 전원 승인

**2. B — 문서 PR 검토**

- 만들 대상이 맞는지 검토 → 승인 → 머지
- 이제 `dev`의 이 문서가 승인된 문서

**3. A — 에이전트에게 이슈 생성 요청**

> login 요구사항으로 이슈 만들어줘

```
[기능] login
  └─ [REQ-LOGIN-01] 이메일 로그인 성공
```

- 이슈에는 문서 경로와 ID만. 내용은 문서에만 존재

**4. A — 구현**
> #n 구현해줘

- 에이전트는 문서를 읽고 인수 조건대로 구현 → PR 본문에 `Closes #n`

**5. B — 구현 PR 검토**

- 문서대로 만들었는지 검토 → 머지 → 이슈 자동으로 닫힘
- 문서를 검토한 B가 코드도 검토. 내용을 이미 알고 있으니까

## 누가 승인해요?

| 바꾸는 것 | 승인 |
|---|---|
| 기능 문서, 코드 | 순환 검토자 1명 (A→B→C→A) |
| `docs/common/`, `README.md`, `AGENTS.md` | 작성자 빼고 전원 |

## 이럴 땐?

**에이전트에게 문서에 없는 걸 시키고 싶다**
→ 문서에 먼저 추가

**아직 못 정한 부분이 있다**
→ `[확인 필요: 무엇이 미정인지]`로 표시. 에이전트는 이 요구사항을 구현하지 않음

**버그를 발견했다**
→ 기획이 틀렸으면 문서 먼저, 구현이 틀렸으면 코드만 수정

**구현하다 문서가 틀린 걸 발견했다**
→ 작으면 feature PR에 함께 수정, 크면 docs PR을 따로

**공통 문서(db-schema 등)를 바꿔야 한다**
→ 원래는 요구사항 작성 단계에서 문서 PR에 함께 포함
→ 구현 중에 발견하면 에이전트는 멈춤. 같은 feature PR에서 공통 문서를 먼저 수정 후 구현. 이 PR도 전원 승인

**규칙을 바꾸고 싶다**
→ `AGENTS.md` 수정 PR + `README.md` 함께 수정 + `rules` 라벨 + 전원 승인

## 기록 남기기

- 무언가 정했다 → `decision` 이슈 (결정, 이유, 기각한 대안)
- 해보니 좋았다, 아쉬웠다 → `retro` 이슈 (발표 재료)
- 직접 써도 되고 에이전트에게 맡겨도 됨. 에이전트가 먼저 제안하면 초안 보고 승인

## 약속

- 검토 요청은 하루 안에 응답

## 문서 지도

```
README.md                  사람용 협업 가이드 (이 문서)
AGENTS.md                  에이전트 규칙
docs/
  common/
    planning.md            기획서: 기능 목록, 담당자
    domain.md              도메인 모델, 용어집
    db-schema.md           DB 설계
    design-system.md       디자인 규칙
  features/
    _template/             새 기능 문서 틀
    <기능>/
      requirements.md      요구사항 정의서
      screen.md            화면 설계
      test-report.md       테스트 결과서
```

## 왜 이렇게 하나요?

| 결정 | 한 줄 이유 |
|---|---|
| [#7 문서 주도 개발](https://github.com/congsole/tech-day/issues/7) | AI와 협업할 때는 문서가 곧 지시이고 경계 |
| [#8 기능 흐름](https://github.com/congsole/tech-day/issues/8) | 승인된 문서만 개발의 원천으로 삼기 위함 |
| [#5 순환 리뷰](https://github.com/congsole/tech-day/issues/5) | 본인 검토는 허술하고, 전원 검토는 느림 |
| [#6 전원 승인](https://github.com/congsole/tech-day/issues/6) | 공통 문서는 모두에게 영향 |
| [#10 요구사항 이슈 생성](https://github.com/congsole/tech-day/issues/10) | 문서 형식이 정해져 있어 기계적으로 생성 가능 |
| [#13 브랜치 전략](https://github.com/congsole/tech-day/issues/13) | `Closes #n`은 기본 브랜치에서만 동작 |
| [#11 규칙 파일 구조](https://github.com/congsole/tech-day/issues/11) | 4개 도구가 규칙 하나를 공유 |
| [#12 규칙 문서 이원화](https://github.com/congsole/tech-day/issues/12) | 에이전트용과 사람용 문서를 함께 관리 |
| [#3 gh CLI](https://github.com/congsole/tech-day/issues/3) | 팀원 모두 별도 토큰 없이 사용 가능 |
| [#2 decision 이슈](https://github.com/congsole/tech-day/issues/2) | 결과는 문서에, 이유는 이슈에 |
| [#4 retro 이슈](https://github.com/congsole/tech-day/issues/4) | 협업 중 관찰을 발표 재료로 |
| [#9 이슈 작성 규칙](https://github.com/congsole/tech-day/issues/9) | 기록 누락 방지, 생성 전 검토 |

[전체 결정 목록 보기](https://github.com/congsole/tech-day/issues?q=label%3Adecision)
