# 공지 요구사항

담당: congsole (통합·스키마). `docs/common/planning.md` §4 공지.

### REQ-NOTICE-01 Host 공지 작성·열람
- 동작: Host가 겸상에 텍스트 공지를 올리고, 그 겸상의 참여자는 읽기만 한다. 배달 위치·배달 완료·변경 사항 등을 공유한다. 겸상 상태와 관계없이 현재 Host가 올릴 수 있다.
- 인수 조건:
  - Given 겸상의 Host / When 공지 내용을 입력해 게시 / Then 공지가 등록되고 그 겸상의 공지 목록에 보인다
  - Given 내용이 비었거나 공백만 있음 / When 게시 / Then 등록되지 않고 입력창 아래에 안내가 표시된다
  - Given Host가 아닌 참여자 / When 겸상 상세를 봄 / Then 공지 작성 입력창 없이 공지 목록만 보인다
  - Given 공지가 여러 개인 겸상의 참여자 / When 공지 목록을 봄 / Then 최신순으로 각 공지의 내용과 작성 시각이 보인다
  - Given 그 겸상의 참여자가 아닌 사용자 / When 겸상 상세를 봄 / Then 공지가 보이지 않는다
- 참조: `docs/common/planning.md` §3 Host 공지, `docs/common/domain.md` 공지(Notice), `docs/common/db-schema.md` `notices`·§5 권한

### REQ-NOTICE-02 집합/수령 장소 수정 (Host)
- 동작: Host가 모집중 겸상의 집합/수령 장소를 수정한다. 장소는 겸상을 열 때 입력하며(REQ-MEAL-03), 유형이 식사면 집합 장소, 배달이면 수령 장소로 표시한다. 장소는 겸상의 값(`meals.place`)이며 공지(REQ-NOTICE-01)와 연동되지 않는다. 기획서 §4에서 공지 담당에 묶여 있어 이 문서에 둔다.
- 인수 조건:
  - Given 모집중 겸상의 Host / When 장소를 수정해 저장 / Then 바뀐 장소가 겸상 상세에 표시된다
  - Given 장소가 있는 겸상 / When 겸상 상세를 봄 / Then 유형이 식사면 집합 장소, 배달이면 수령 장소라는 이름으로 장소가 보인다
  - Given Host가 아닌 사용자 / When 장소 수정을 요청 / Then 수정되지 않는다
  - Given 모집중이 아닌 겸상 / When Host가 장소 수정을 요청 / Then 수정되지 않고 안내가 표시된다
- 참조: `docs/common/planning.md` §3 집합/수령 장소, `docs/common/domain.md` 집합/수령 장소(place), `docs/common/db-schema.md` `meals.place`·§5 권한
