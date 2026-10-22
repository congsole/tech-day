# 인증 + 겸상 열기 + 목록 요구사항

담당: wgmin0416 (컨텍스트·기획). `docs/common/planning.md` §4 A 슬라이스.

### REQ-MEAL-01 이메일 OTP 로그인
- 동작: 사내 이메일로 OTP(매직링크 또는 6자리 코드)를 받아 로그인한다. 비밀번호는 없다.
- 인수 조건:
  - Given 로그인하지 않은 사용자가 앱에 진입 / When 이메일을 입력하고 코드를 요청 / Then 해당 이메일로 인증 코드(또는 링크)가 발송된다
  - Given 인증 코드를 받은 사용자 / When 올바른 코드를 입력 / Then 로그인되고 세션이 유지된다
  - Given 이미 로그인한 사용자가 재방문 / When 앱에 진입 / Then 다시 인증하지 않고 로그인 상태가 유지된다
- 참조: `docs/common/planning.md` §3 사용자 식별, `docs/common/domain.md` 용어집 User, `docs/common/db-schema.md` (Supabase Auth 연계)

### REQ-MEAL-02 이름(본명) 설정
- 동작: 최초 로그인 시 화면에 보일 이름을 본명(실명)으로 입력한다.
- 인수 조건:
  - Given 표시 이름이 없는 최초 로그인 사용자 / When 본명을 입력하고 저장 / Then 표시 이름으로 저장되고 이후 화면에 노출된다
  - Given 이름 입력 화면 / When 표시 / Then 본명을 입력하라는 안내가 보인다
  - Given 표시 이름이 이미 있는 사용자 / When 로그인 / Then 이름 설정 단계를 건너뛴다
- 참조: `docs/common/planning.md` §3 사용자 식별, `docs/common/domain.md` 표시 이름(displayName)

### REQ-MEAL-03 겸상 열기
- 동작: Host가 제목·유형·식당/가게명·가게 메뉴판 링크(선택)·집합/수령 장소(선택)·주문 예정 시간·정원·메모를 입력해 겸상을 생성한다. 생성 직후 상태는 모집중이다.
- 인수 조건:
  - Given 로그인한 사용자 / When 제목·유형·주문 예정 시간·정원을 포함해 겸상 열기를 제출 / Then 상태 '모집중'인 겸상이 생성되고 생성자가 Host가 된다
  - Given 겸상이 생성됨 / When 완료 / Then Host는 자동으로 참여자가 되고 정원에 포함된다
  - Given 필수값(제목·유형·주문 예정 시간·정원)이 비어 있음 / When 제출 / Then 생성되지 않고 안내가 표시된다
  - Given 가게 메뉴판 링크가 입력된 겸상 / When 참여자가 상세를 봄 / Then 링크를 눌러 외부 메뉴판을 볼 수 있다
  - Given 겸상이 생성됨 / When 완료 / Then 모집중 목록에 노출된다
- 참조: `docs/common/planning.md` §3 겸상 열기 입력·메뉴판 공유·유형·정원, `docs/common/domain.md` Meal·status

### REQ-MEAL-04 모집중 겸상 목록 보기
- 동작: 상태가 모집중인 겸상을 목록으로 본다.
- 인수 조건:
  - Given 여러 상태의 겸상이 있음 / When 목록 화면에 진입 / Then 모집중 상태만 노출된다 (주문중·주문완료·정산·취소 제외)
  - Given 각 겸상 / When 목록에 표시 / Then 제목·유형·현재 인원/정원이 보인다
- 참조: `docs/common/planning.md` §3 목록 화면, `docs/common/domain.md` status

### REQ-MEAL-05 Host 넘기기·겸상 취소
- 동작: Host가 사유(예: 메뉴 변경)를 적고 Host 역할을 넘긴다. 참여자 한 명이 수락하면 새 Host가 되고 겸상은 유지된다. 주문 예정 시간까지 아무도 수락하지 않거나 전원 거절하면 겸상이 취소된다.
- 인수 조건:
  - Given 모집중 겸상의 Host / When 사유를 적고 Host 넘기기를 요청 / Then 참여자들에게 수락/거절 요청이 표시된다
  - Given Host 넘기기 요청 / When 참여자 한 명이 수락 / Then 그 참여자가 새 Host가 되고 겸상은 모집중으로 유지된다
  - Given Host 넘기기 요청 / When 참여자 전원이 거절 / Then 겸상 상태가 취소가 된다
  - Given Host 넘기기 요청 / When 주문 예정 시간까지 아무도 수락하지 않음 / Then 겸상 상태가 취소가 된다
  - Given 겸상이 취소됨 / When 목록 조회 / Then 모집중 목록에서 제외된다
- 참조: `docs/common/planning.md` §3 Host 이탈·겸상 취소·주문 예정 시간, `docs/common/domain.md` 상태 모델·Host 넘기기
