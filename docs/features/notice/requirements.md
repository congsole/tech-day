# 공지 요구사항

담당: congsole (통합·스키마). `docs/common/planning.md` §4 공지.

### REQ-NOTICE-01 Host 공지 작성·열람
- 동작: Host가 공지(텍스트)를 올리고 참여자는 읽는다. 배달 위치·배달 완료·변경 사항 등을 공유한다.
- 인수 조건:
  - Given 겸상 Host / When 공지 내용을 작성해 게시 / Then 공지가 등록되고 참여자에게 보인다
  - Given Host가 아닌 참여자 / When 공지 작성 시도 / Then 작성할 수 없다 (읽기 전용)
  - Given 공지가 여러 개 / When 조회 / Then 최신순으로 보인다
- 참조: `docs/common/planning.md` §3 Host 공지, `docs/common/domain.md` 공지(Notice)

### REQ-NOTICE-02 집합/수령 장소 설정·수정
- 동작: Host가 집합 장소(같이 식사) 또는 수령 장소(배달)를 정하고 수정한다. 참여자 모두에게 표시된다.
- 인수 조건:
  - Given 겸상 열기 또는 모집중 겸상의 Host / When 집합/수령 장소를 입력·수정 / Then 참여자 모두에게 표시된다
  - Given Host가 아닌 참여자 / When 장소 수정 시도 / Then 수정할 수 없다
- 참조: `docs/common/planning.md` §3 집합/수령 장소, `docs/common/domain.md` 집합/수령 장소(place)
