# 참여 + 메뉴 + 주문 확정 요구사항

담당: yooge0902 (검증·디자인). `docs/common/planning.md` §4 B 슬라이스.

### REQ-JOIN-01 겸상 참여
- 동작: 로그인한 사용자가 모집중 겸상에 참여한다. 정원이 차면 참여할 수 없고, 한 사용자는 한 겸상에 한 번만 참여한다.
- 인수 조건:
  - Given 정원에 여유가 있는 모집중 겸상 / When 사용자가 참여 / Then Member로 추가되고 현재 인원이 1 증가한다
  - Given 정원이 가득 찬 겸상 / When 참여 시도 / Then 참여되지 않고 마감 안내가 표시된다
  - Given 마지막 한 자리에 여러 명이 동시에 참여 / When 처리 / Then 정원을 초과하지 않는다
  - Given 이미 참여한 사용자 / When 다시 참여 시도 / Then 중복 참여되지 않는다
- 참조: `docs/common/planning.md` §3 정원, `docs/common/domain.md` Member·정원

### REQ-JOIN-02 메뉴 입력
- 동작: 참여자가 본인 메뉴명과 금액(원, 정수)을 입력한다. 메뉴 항목은 여러 개 넣을 수 있다.
- 인수 조건:
  - Given 겸상에 참여한 사용자 / When 메뉴명과 금액을 입력하고 추가 / Then 본인 메뉴 항목으로 저장된다
  - Given 금액이 비었거나 정수가 아님 / When 추가 / Then 저장되지 않고 안내가 표시된다
  - Given 본인 메뉴 항목이 여러 개 / When 조회 / Then 부담액이 금액의 합으로 표시된다
- 참조: `docs/common/planning.md` §3 메뉴 취합·정산·통화, `docs/common/domain.md` 메뉴 항목(OrderItem)·부담액

### REQ-JOIN-03 메뉴 수정·참여 취소
- 동작: 본인이 "주문 확정"을 누르기 전까지 메뉴를 수정·삭제하거나 참여를 취소할 수 있다.
- 인수 조건:
  - Given 주문 확정 전인 참여자 / When 본인 메뉴 항목을 수정·삭제 / Then 반영된다
  - Given 주문 확정 전인 참여자 / When 참여 취소 / Then Member에서 빠지고 현재 인원이 1 감소한다
  - Given 정원이 찼던 겸상에서 취소로 자리가 남 / When 다른 사용자가 참여 / Then 다시 참여할 수 있다
  - Given 이미 주문 확정한 참여자 / When 수정·취소 시도 / Then 잠겨 있어 불가 안내가 표시된다
- 참조: `docs/common/planning.md` §3 수정·취소·정원, `docs/common/domain.md` 주문 확정

### REQ-JOIN-04 주문 확정
- 동작: 참여자가 본인 메뉴를 최종 확정한다. 확정하면 본인 메뉴가 잠기고 확정 시각이 기록된다.
- 인수 조건:
  - Given 메뉴 항목이 하나 이상인 참여자 / When 주문 확정 / Then 본인 메뉴가 잠기고 확정 시각이 기록된다
  - Given 메뉴 항목이 하나도 없는 참여자 / When 주문 확정 시도 / Then 확정되지 않고 안내가 표시된다
  - Given 확정한 참여자 / When 상태 조회 / Then '확정됨'으로 표시된다
- 참조: `docs/common/planning.md` §3 주문 확정, `docs/common/domain.md` 주문 확정(confirm)

### REQ-JOIN-05 취합·확정 현황 보기 (Host)
- 동작: Host가 참여자별 메뉴·금액과 확정 여부를 한 화면에서 본다.
- 인수 조건:
  - Given 참여자들이 메뉴를 입력한 겸상 / When Host가 현황 화면에 진입 / Then 참여자별 메뉴·금액 목록이 보인다
  - Given Host가 현황 화면을 봄 / When 참여자 정보 표시 / Then 각 참여자의 이름(본명)과 이메일 주소가 함께 표시된다
  - Given 각 참여자 / When 현황 표시 / Then 확정/미확정이 구분되어 보인다
  - Given 현황 화면 / When 조회 / Then 전체 합계 금액이 표시된다
- 참조: `docs/common/planning.md` §3 메뉴 취합·개인정보 노출, `docs/common/domain.md` 부담액·주문 확정
