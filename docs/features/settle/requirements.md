# 주문 + 정산 요구사항

담당: congsole (통합·스키마). `docs/common/planning.md` §4 C 슬라이스.

### REQ-SETTLE-01 주문완료 전환 (Host)
- 동작: Host가 주문중 겸상을 주문완료로 전환한다. (참여·메뉴는 주문중에서 이미 잠겨 있다)
- 인수 조건:
  - Given 주문중 상태의 겸상 Host / When 주문완료로 전환 / Then 상태가 주문완료가 된다
  - Given Host가 아닌 참여자 / When 주문완료 시도 / Then 전환되지 않는다
  - Given 주문완료된 겸상 / When 목록 조회 / Then 모집중 목록에 나타나지 않는다
- 참조: `docs/common/planning.md` §3 상태 흐름, `docs/common/domain.md` status·상태 모델

### REQ-SETTLE-02 정산 화면
- 동작: 주문완료/정산 상태에서 참여자별 부담액과 전체 총액을 본다.
- 인수 조건:
  - Given 메뉴가 입력된 주문완료 겸상 / When 정산 화면에 진입 / Then 참여자별 부담액(본인 메뉴 금액 합)이 표시된다
  - Given 정산 화면 / When 조회 / Then 전체 총액이 표시된다
  - Given 메뉴 항목이 없는 참여자 / When 정산 표시 / Then 부담액 0원으로 표시된다
- 참조: `docs/common/planning.md` §3 정산 방식·통화, `docs/common/domain.md` 부담액(amountDue)

### REQ-SETTLE-03 정산 상태 전환 (Host)
- 동작: Host가 주문완료 겸상을 정산 상태로 전환한다.
- 인수 조건:
  - Given 주문완료 상태의 겸상 Host / When 정산 시작 / Then 상태가 정산이 된다
  - Given Host가 아닌 사용자 / When 정산 전환 시도 / Then 전환되지 않는다
- 참조: `docs/common/planning.md` §3 상태 흐름, `docs/common/domain.md` status·상태 모델

### REQ-SETTLE-04 주문중 자동 전환
- 동작: 주문 예정 시간이 되면 겸상이 자동으로 주문중으로 전환되어 잠기고, 메뉴를 입력하지 않은 참여자는 제외된다(Host는 제외하지 않는다). 제외 후 메뉴 입력자가 0명이면 주문중 대신 취소로 전환된다.
- 인수 조건:
  - Given 모집중 겸상 / When 주문 예정 시간이 도래 / Then 상태가 주문중이 되고 참여·취소·메뉴 변경이 모두 차단된다
  - Given 주문중 전환 시점에 메뉴를 하나도 입력하지 않은 참여자(Host 아님) / When 전환 / Then 그 참여자는 제외되고 정산에 포함되지 않는다
  - Given 메뉴를 입력한 참여자 / When 주문중 전환 / Then 확정 여부와 무관하게 포함되고 메뉴가 잠긴다
  - Given 메뉴가 없는 Host / When 주문중 전환 / Then 제외되지 않고 부담액 0원으로 포함된다
  - Given 전환 시점에 메뉴 입력자가 한 명도 없는 겸상 / When 전환 / Then 주문중이 아니라 취소로 전환된다
- 참조: `docs/common/planning.md` §3 주문 예정 시간·주문중 전환·Host 참여, `docs/common/domain.md` status·상태 모델
