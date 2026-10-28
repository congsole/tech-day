# 인증 + 겸상 열기 + 목록 요구사항

담당: wgmin0416 (컨텍스트·기획). `docs/common/planning.md` §4 A 슬라이스.

### REQ-MEAL-01 이메일 OTP 로그인
- 동작: 사내 이메일로 6자리 인증 코드를 받아 입력해 로그인한다. 매직 링크는 쓰지 않는다. 비밀번호는 없다.
- 인수 조건:
  - Given 로그인하지 않은 사용자가 앱에 진입 / When 이메일을 입력하고 코드를 요청 / Then 해당 이메일로 6자리 인증 코드가 발송된다
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
- 동작: Host가 제목·유형·식당/가게명·가게 메뉴판 링크(선택)·집합/수령 장소·주문 예정 시간·정원·메모(선택)를 입력해 겸상을 생성한다. 주문 예정 시간은 현재 이후 시각, 가게 메뉴판 링크는 http(s) 주소만 받는다. 생성 직후 상태는 모집중이고 새 겸상 상세 화면으로 이동한다.
- 인수 조건:
  - Given 로그인한 사용자 / When 제목·유형·식당/가게명·집합/수령 장소·주문 예정 시간·정원을 포함해 겸상 열기를 제출 / Then 상태 '모집중'인 겸상이 생성되고 생성자가 Host가 된다
  - Given 겸상이 생성됨 / When 완료 / Then Host는 자동으로 참여자가 되고 정원에 포함된다
  - Given 필수값(제목·유형·식당/가게명·집합/수령 장소·주문 예정 시간·정원)이 비어 있거나 공백만 있거나, 주문 예정 시간이 현재 이후가 아니거나, 가게 메뉴판 링크가 http(s) 주소가 아님 / When 제출 / Then 생성되지 않고 해당 입력에 안내가 표시된다
  - Given 가게 메뉴판 링크가 입력된 겸상 / When 참여자가 상세를 봄 / Then 링크를 눌러 외부 메뉴판을 볼 수 있다
  - Given 겸상이 생성됨 / When 완료 / Then 모집중 목록에 노출된다
- 참조: `docs/common/planning.md` §3 겸상 열기 입력·집합/수령 장소·메뉴판 공유·유형·정원, `docs/common/domain.md` Meal·status, `docs/common/db-schema.md` `meals`

### REQ-MEAL-04 모집중 겸상 목록 보기
- 동작: 상태가 모집중인 겸상을 목록으로 본다.
- 인수 조건:
  - Given 여러 상태의 겸상이 있음 / When 목록 화면에 진입 / Then 모집중 상태만 노출된다 (주문중·주문완료·정산·취소 제외)
  - Given 각 겸상 / When 목록에 표시 / Then 제목·유형·현재 인원/정원이 보인다
- 참조: `docs/common/planning.md` §3 목록 화면, `docs/common/domain.md` status

### REQ-MEAL-05 Host 넘기기 요청
- 동작: 모집중 겸상의 Host가 사유(예: 메뉴 변경)를 적고 Host 넘기기를 요청한다. Host 외 참여자가 있어야 요청할 수 있고, 대기 중인 요청은 겸상마다 하나다. 수락·거절은 REQ-MEAL-08, REQ-MEAL-09에서 다룬다.
- 인수 조건:
  - Given 모집중 겸상의 Host / When 사유를 적고 Host 넘기기를 요청 / Then 참여자들에게 수락/거절 요청이 표시된다
  - Given Host 외 참여자가 없는 겸상의 Host / When Host 넘기기 요청 시도 / Then 요청되지 않고 겸상 취소를 이용하라는 안내가 표시된다
  - Given 모집중 겸상의 Host / When 사유를 비우거나 공백만 적고 요청 / Then 요청되지 않고 사유 입력에 안내가 표시된다
  - Given Host 넘기기 대기 중인 겸상의 Host / When 겸상 상세를 봄 / Then 대기 중임과 사유가 보이고 주문 예정 시간 수정은 잠금 이유와 함께 비활성으로 보인다
- 참조: `docs/common/planning.md` §3 Host 넘기기·주문 예정 시간, `docs/common/domain.md` 상태 모델·Host 넘기기, `docs/common/db-schema.md` `host_handovers`·§6 `request_host_handover`

### REQ-MEAL-06 겸상 취소 (Host)
- 동작: 모집중일 때 Host가 사유를 적고 겸상을 바로 취소한다. 취소된 겸상은 목록에서 제외된다.
- 인수 조건:
  - Given 모집중 겸상의 Host / When 사유를 적고 겸상 취소 / Then 상태가 취소가 된다
  - Given Host가 아닌 참여자 / When 겸상 취소 시도 / Then 취소되지 않는다
  - Given 취소된 겸상 / When 목록 조회 / Then 모집중 목록에서 제외된다
  - Given 모집중 겸상의 Host / When 사유를 비우거나 공백만 적고 겸상 취소 / Then 취소되지 않고 사유 입력에 안내가 표시된다
- 참조: `docs/common/planning.md` §3 겸상 취소, `docs/common/domain.md` 상태 모델, `docs/common/db-schema.md` `meals.cancel_reason`·§6 `cancel_meal`

### REQ-MEAL-07 주문 예정 시간 수정 (Host)
- 동작: 모집중일 때 Host가 주문 예정 시간을 현재 이후 시각으로 수정한다. Host 넘기기 대기 중에는 수정할 수 없다.
- 인수 조건:
  - Given 모집중 겸상의 Host / When 현재 이후 시각으로 주문 예정 시간을 수정 / Then 변경이 반영되고 자동 전환·넘기기 마감 기준이 그 시각으로 바뀐다
  - Given 현재보다 과거 시각 / When 수정 시도 / Then 저장되지 않고 안내가 표시된다
  - Given Host 넘기기 대기 중인 겸상 / When 주문 예정 시간 수정 시도 / Then 수정되지 않는다
- 참조: `docs/common/planning.md` §3 주문 예정 시간, `docs/common/domain.md` 상태 모델, `docs/common/db-schema.md` §6 `update_order_time`

### REQ-MEAL-08 Host 넘기기 수락
- 동작: Host 넘기기 대기 중인 겸상의 참여자 한 명이 수락하면 새 Host가 된다. 겸상은 모집중으로 유지되고, 기존 Host의 참여와 메뉴는 삭제된다. REQ-MEAL-05에서 나눔.
- 인수 조건:
  - Given Host 넘기기 요청 / When 참여자 한 명이 수락 / Then 그 참여자가 새 Host가 되고 겸상은 모집중으로 유지되며 기존 Host의 참여·메뉴는 삭제된다
  - Given 이미 다른 참여자가 수락했거나 실패로 닫힌 요청 / When 수락 시도 / Then 수락되지 않고 이미 처리된 요청이라는 안내가 표시된다
  - Given 주문 예정 시간이 지난 요청 / When 수락 시도 / Then 수락되지 않고 안내가 표시된다
- 참조: `docs/common/planning.md` §3 Host 넘기기, `docs/common/domain.md` Host 넘기기, `docs/common/db-schema.md` §6 `accept_host_handover`

### REQ-MEAL-09 Host 넘기기 거절·만료
- 동작: 참여자는 Host 넘기기를 거절할 수 있다. 기존 Host를 뺀 참여자 전원이 거절하거나 주문 예정 시간까지 아무도 수락하지 않으면 겸상이 취소된다. REQ-MEAL-05에서 나눔.
- 인수 조건:
  - Given Host 넘기기 요청 / When 참여자 전원이 거절 / Then 겸상 상태가 취소가 된다
  - Given Host 넘기기 요청 / When 주문 예정 시간까지 아무도 수락하지 않음 / Then 겸상 상태가 취소가 된다
  - Given Host 넘기기 실패로 취소된 겸상 / When 목록 조회 / Then 모집중 목록에서 제외된다
- 참조: `docs/common/planning.md` §3 Host 넘기기, `docs/common/domain.md` 상태 모델·Host 넘기기, `docs/common/db-schema.md` `host_handover_rejections`·§6 `reject_host_handover`·`resolve_host_handover`·§7 `close-due-meals`
