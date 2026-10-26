# 주문 + 정산 요구사항

담당: congsole (통합·스키마). `docs/common/planning.md` §4 C 슬라이스.

### REQ-SETTLE-01 주문완료 전환 (Host)
- 동작: Host가 주문중 겸상을 주문완료로 전환한다. 참여·메뉴는 주문중에서 이미 잠겨 있으므로 Host는 잠긴 메뉴대로 주문을 넣은 뒤 전환한다. 주문할 메뉴와 확정 현황은 REQ-JOIN-05 화면에서 본다.
- 인수 조건:
  - Given 주문중 겸상의 Host / When 주문완료로 전환 / Then 상태가 주문완료가 된다
  - Given 주문중 겸상의 Host가 아닌 참여자 / When 겸상 상세를 봄 / Then 주문완료 전환 버튼이 보이지 않는다
  - Given Host가 아닌 사용자 / When 주문완료 전환을 요청 / Then 전환되지 않는다
  - Given 주문중이 아닌 겸상 / When Host가 주문완료 전환을 요청 / Then 전환되지 않고 안내가 표시된다
- 참조: `docs/common/planning.md` §3 상태 흐름, `docs/common/domain.md` 상태 모델, `docs/common/db-schema.md` §6 `mark_meal_ordered`·§8 `not_host`·`invalid_status`

### REQ-SETTLE-02 정산 내역 보기
- 동작: 주문완료 또는 정산 상태의 겸상에서 그 겸상의 Host와 참여자가 참여자별 부담액과 총액을 본다. 부담액은 본인이 입력한 메뉴 항목 금액의 합이다(1/N 아님).
- 인수 조건:
  - Given 메뉴가 입력된 주문완료 또는 정산 겸상의 참여자 / When 겸상 상세를 봄 / Then 참여자별 표시 이름과 부담액(본인 메뉴 항목 금액 합)이 보인다
  - Given 주문완료 또는 정산 겸상 / When 정산 내역을 봄 / Then 총액(그 겸상의 메뉴 항목 금액 합)이 강조되어 보인다
  - Given 메뉴 없이 남은 Host / When 정산 내역을 봄 / Then Host의 부담액이 0원으로 보인다
  - Given 모집중·주문중·취소 상태의 겸상 / When 겸상 상세를 봄 / Then 정산 내역이 보이지 않는다
  - Given 그 겸상의 참여자가 아닌 사용자(주문중 전환 때 제외된 사람 포함) / When 겸상 상세를 봄 / Then 정산 내역이 보이지 않는다
- 참조: `docs/common/planning.md` §3 정산 방식·통화 단위, `docs/common/domain.md` 부담액(amountDue), `docs/common/db-schema.md` `order_items`·§5 권한·§9 조회 예시, `docs/common/design-system.md` §4 컴포넌트(금액)

### REQ-SETTLE-03 정산 상태 전환 (Host)
- 동작: Host가 주문완료 겸상을 정산 상태로 전환한다.
- 인수 조건:
  - Given 주문완료 겸상의 Host / When 정산 시작 / Then 상태가 정산이 된다
  - Given 주문완료 겸상의 Host가 아닌 참여자 / When 겸상 상세를 봄 / Then 정산 시작 버튼이 보이지 않는다
  - Given Host가 아닌 사용자 / When 정산 시작을 요청 / Then 전환되지 않는다
  - Given 주문완료가 아닌 겸상 / When Host가 정산 시작을 요청 / Then 전환되지 않고 안내가 표시된다
- 참조: `docs/common/planning.md` §3 상태 흐름, `docs/common/domain.md` 상태 모델, `docs/common/db-schema.md` §6 `start_settlement`·§8 `not_host`·`invalid_status`

### REQ-SETTLE-04 주문중 자동 전환
- 동작: 주문 예정 시간이 되면 겸상이 자동으로 주문중으로 전환되어 잠긴다. 메뉴를 하나도 입력하지 않은 참여자는 제외되고(Host는 제외하지 않음), 메뉴를 입력한 참여자는 확정 여부와 무관하게 남는다. 제외 후 메뉴 항목이 하나도 없으면 주문중 대신 취소로 전환된다. 전환은 예약 작업이 1분마다 처리하므로 최대 1분 늦을 수 있고, 그 사이 변경은 주문 예정 시간 기준으로 막힌다.
- 인수 조건:
  - Given 모집중 겸상 / When 주문 예정 시간이 지남 / Then 1분 안에 상태가 주문중이 된다
  - Given 주문 예정 시간이 지난 겸상 / When 참여·참여 취소·메뉴 추가·수정·삭제·주문 확정을 시도 / Then 상태 전환 전이라도 모두 반영되지 않는다
  - Given 메뉴가 없는 참여자 A(Host 아님)와 메뉴가 있는 미확정 참여자 B / When 주문중으로 전환 / Then A는 참여에서 제외되고 B는 남는다
  - Given 메뉴가 없는 Host와 메뉴가 있는 참여자 / When 주문중으로 전환 / Then Host는 제외되지 않고 겸상이 주문중이 된다
  - Given 메뉴 항목이 하나도 없는 겸상 / When 주문 예정 시간이 지남 / Then 주문중이 아니라 취소가 된다
- 참조: `docs/common/planning.md` §3 주문 예정 시간·주문중 전환·Host 참여, `docs/common/domain.md` 상태 모델, `docs/common/db-schema.md` §5 열려 있음(`is_meal_open`)·§6 `start_due_orders`·§7 `close-due-meals`
