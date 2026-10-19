# DB 설계

겸상의 DB 스키마. **스키마의 유일한 원천**이며, `supabase/migrations/`의 마이그레이션은 이 문서를 따른다.
기능 규칙은 `docs/common/planning.md` §3, 용어·상태는 `docs/common/domain.md`를 따른다.

## 1. 설계 원칙

- Supabase(PostgreSQL) `public` 스키마에 둔다. 모든 테이블에 RLS를 켠다.
- 신원은 Supabase Auth(`auth.users`)가 관리한다. 이메일은 `auth.users.email` 한 곳에만 두고 `public`에 복제하지 않는다.
- 단순 조회·입력은 테이블에 직접 하고(RLS로 제한), **상태 전환과 여러 행을 함께 바꾸는 동작은 RPC 함수**로만 한다.
  - 클라이언트가 바꿀 수 있는 컬럼은 컬럼 단위 권한(`grant insert/update (컬럼)`)으로 제한한다. `status`, `host_id`, `confirmed_at`은 클라이언트가 직접 바꿀 수 없다.
- 금액은 원(KRW) 정수(`integer`). 시각은 `timestamptz`.
- PK는 `uuid`(`gen_random_uuid()`). 단, 참여(`meal_members`)는 `(meal_id, user_id)` 복합 PK로 중복 참여를 막는다.
- 부담액·총액·현재 인원은 저장하지 않고 조회 시 계산한다.

## 2. 관계

```
auth.users 1─1 profiles
profiles(Host) 1─* meals 1─* meal_members *─1 profiles
                    │            └ 1─* order_items
                    ├ 1─* notices
                    └ 1─* host_handovers 1─* host_handover_rejections
```

## 3. 열거형 (enum)

### `meal_type` — 유형
| 값 | 도메인 용어 |
|---|---|
| `dine` | 식사 (같이 식사) |
| `delivery` | 배달 (배달 소분) |

### `meal_status` — 상태
| 값 | 도메인 용어 |
|---|---|
| `recruiting` | 모집중 |
| `ordered` | 주문완료 |
| `settling` | 정산 |
| `canceled` | 취소 |

### `handover_status` — Host 넘기기 상태
| 값 | 뜻 |
|---|---|
| `pending` | 수락 대기 중 |
| `accepted` | 참여자 한 명이 수락함 (새 Host 확정) |
| `failed` | 전원 거절 또는 주문 예정 시간까지 미수락 → 겸상 취소 |

## 4. 테이블

### `profiles` — 사용자(User)
`auth.users`에 사용자가 생기면 트리거(`handle_new_user`)가 같은 `id`로 행을 만든다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, FK `auth.users(id)` on delete cascade | 사용자 ID |
| `display_name` | text | null 허용, 값이 있으면 공백만으로 불가 | 표시 이름(본명). null이면 이름 설정 전 |
| `created_at` | timestamptz | not null, default `now()` | |

- 이메일은 `auth.users.email`을 쓴다. 본인 이메일은 세션(`auth.getUser()`)에서, 참여자 이메일은 Host만 `get_meal_member_emails`로 얻는다.
- 관련: REQ-MEAL-01, REQ-MEAL-02

### `meals` — 겸상(Meal)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | |
| `host_id` | uuid | not null, FK `profiles(id)`, default `auth.uid()` | 현재 Host. Host 넘기기 수락 시 바뀜 |
| `title` | text | not null, 공백만으로 불가 | 제목 |
| `type` | `meal_type` | not null | 유형 |
| `restaurant_name` | text | null 허용 | 식당/가게명 |
| `menu_url` | text | null 허용 | 가게 메뉴판 링크 (외부 링크만 저장) |
| `place` | text | null 허용 | 집합/수령 장소 |
| `order_time` | timestamptz | [확인 필요: not null 여부. planning §3은 필수처럼 쓰였고 REQ-MEAL-03 필수값에는 없음. Host 넘기기 수락 마감 기준이라 null이면 마감이 없음] | 주문 예정 시간 |
| `capacity` | integer | not null, `>= 1` | 정원 |
| `memo` | text | null 허용 | 메모 |
| `status` | `meal_status` | not null, default `recruiting` | 상태 |
| `created_at` | timestamptz | not null, default `now()` | |

- 필수값은 REQ-MEAL-03의 제목·유형·정원을 따른다.
- [확인 필요: Host가 겸상을 열 때 자동으로 참여자(`meal_members`)가 되는지. 자동이면 생성 트리거로 Host 행을 넣는다. 어느 쪽이든 Host가 참여자이면 정원에 포함된다]
- 인덱스: `(status, created_at desc)` — 모집중 목록 조회용
- 관련: REQ-MEAL-03, REQ-MEAL-04, REQ-NOTICE-02, REQ-SETTLE-01, REQ-SETTLE-03

### `meal_members` — 참여(Member)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `meal_id` | uuid | PK, FK `meals(id)` on delete cascade | |
| `user_id` | uuid | PK, FK `profiles(id)`, default `auth.uid()` | |
| `confirmed_at` | timestamptz | null 허용 | 주문 확정 시각. null이면 미확정, 값이 있으면 확정(잠김) |
| `joined_at` | timestamptz | not null, default `now()` | |

- PK `(meal_id, user_id)`로 한 사용자는 한 겸상에 한 번만 참여한다.
- 참여 시 트리거(`check_meal_capacity`)가 겸상 행을 잠그고(`for update`) 상태와 정원을 확인한다. 동시에 참여해도 정원을 넘지 않는다.
- 현재 인원 = 해당 겸상의 `meal_members` 행 수.
- 인덱스: `(user_id)`
- 관련: REQ-JOIN-01, REQ-JOIN-03, REQ-JOIN-04, REQ-JOIN-05

### `order_items` — 메뉴 항목(OrderItem)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | |
| `meal_id` | uuid | not null | |
| `user_id` | uuid | not null, default `auth.uid()` | |
| `name` | text | not null, 공백만으로 불가 | 메뉴명 (자유 텍스트) |
| `price` | integer | not null, `>= 0` | 금액(원) |
| `created_at` | timestamptz | not null, default `now()` | |

- FK `(meal_id, user_id)` → `meal_members(meal_id, user_id)` on delete cascade. 참여를 취소하면 메뉴 항목도 함께 지워진다.
- 부담액 = 같은 `(meal_id, user_id)`의 `price` 합. 메뉴 항목이 없으면 0.
- 총액 = 같은 `meal_id`의 `price` 합.
- 인덱스: `(meal_id, user_id)`
- 관련: REQ-JOIN-02, REQ-JOIN-03, REQ-JOIN-05, REQ-SETTLE-02

### `notices` — 공지(Notice)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | |
| `meal_id` | uuid | not null, FK `meals(id)` on delete cascade | |
| `author_id` | uuid | not null, FK `profiles(id)`, default `auth.uid()` | 작성 당시 Host |
| `content` | text | not null, 공백만으로 불가 | 공지 내용 |
| `created_at` | timestamptz | not null, default `now()` | |

- 인덱스: `(meal_id, created_at desc)` — 최신순 조회용
- 관련: REQ-NOTICE-01

### `host_handovers` — Host 넘기기 요청

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | |
| `meal_id` | uuid | not null, FK `meals(id)` on delete cascade | |
| `from_host_id` | uuid | not null, FK `profiles(id)` | 넘기는 Host |
| `reason` | text | not null, 공백만으로 불가 | 사유 |
| `status` | `handover_status` | not null, default `pending` | |
| `accepted_by` | uuid | null 허용, FK `profiles(id)` | 수락한 참여자(새 Host) |
| `created_at` | timestamptz | not null, default `now()` | |
| `resolved_at` | timestamptz | null 허용 | 수락 또는 실패 처리 시각 |

- 부분 유니크 인덱스: `(meal_id) where status = 'pending'` — 겸상 하나에 대기 중인 요청은 하나만
- 관련: REQ-MEAL-05

### `host_handover_rejections` — Host 넘기기 거절

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `handover_id` | uuid | PK, FK `host_handovers(id)` on delete cascade | |
| `user_id` | uuid | PK, FK `profiles(id)` | 거절한 참여자 |
| `created_at` | timestamptz | not null, default `now()` | |

- 수락은 `host_handovers.accepted_by`에 기록하고, 거절만 이 테이블에 쌓는다.
- 관련: REQ-MEAL-05

## 5. 권한 (RLS · 컬럼 권한)

대상 역할은 `authenticated`(로그인 사용자)다. `anon`에는 아무 권한도 주지 않는다.
표에서 "참여자"는 해당 겸상의 `meal_members`에 행이 있는 사용자다.

| 테이블 | 조회 | 생성 | 수정 | 삭제 |
|---|---|---|---|---|
| `profiles` | 전체 | 불가 (트리거가 생성) | 본인 행의 `display_name`만 | 불가 |
| `meals` | 전체 | 누구나. 컬럼은 `title`, `type`, `restaurant_name`, `menu_url`, `place`, `order_time`, `capacity`, `memo`만 | Host가 `recruiting`일 때 `place`만 | 불가 |
| `meal_members` | 전체 (현재 인원·참여자 이름 표시용) | 본인 행만. 컬럼은 `meal_id`만 (나머지는 default) | 불가 (확정은 RPC) | 본인 행, `confirmed_at is null`, 겸상 `recruiting`일 때 |
| `order_items` | 그 겸상의 Host와 참여자 | 본인 행, 본인 미확정, 겸상 `recruiting`일 때. 컬럼은 `meal_id`, `name`, `price`만 | 생성과 같은 조건. 컬럼은 `name`, `price`만 | 생성과 같은 조건 |
| `notices` | 그 겸상의 Host와 참여자 | 그 겸상의 현재 Host. 컬럼은 `meal_id`, `content`만 | 불가 | 불가 |
| `host_handovers` | 그 겸상의 Host와 참여자 | 불가 (RPC) | 불가 (RPC) | 불가 |
| `host_handover_rejections` | 그 겸상의 Host와 참여자 | 불가 (RPC) | 불가 | 불가 |

- RLS 정책 안에서 참여 여부를 볼 때는 보조 함수 `is_meal_member(meal_id)`(security definer, stable)를 쓴다. `meal_members` 정책이 자기 자신을 조회하며 재귀하는 것을 막기 위함.
- 다른 참여자의 이메일은 어느 테이블로도 조회되지 않는다. Host만 `get_meal_member_emails`로 본다.

## 6. RPC 함수

모두 `security definer`, `search_path = ''`로 만들고 `authenticated`에만 실행 권한을 준다. 함수 안에서 `auth.uid()`로 호출자를 확인한다.
실패하면 `raise exception`으로 §8의 에러 코드를 메시지에 담아 던진다. 화면 문구는 `api.ts`에서 코드에 맞춰 만든다.

| 함수 | 인자 | 하는 일 | 관련 |
|---|---|---|---|
| `confirm_order` | `p_meal_id uuid` | 호출자가 참여자이고 미확정이며 겸상이 `recruiting`이고 메뉴 항목이 1개 이상이면 `confirmed_at = now()` | REQ-JOIN-04 |
| `get_meal_member_emails` | `p_meal_id uuid` | 호출자가 Host면 참여자별 `(user_id, email)` 반환 (`auth.users` 조회) | REQ-JOIN-05 |
| `mark_meal_ordered` | `p_meal_id uuid` | 호출자가 Host이고 `recruiting`이면 `ordered`로 전환. [확인 필요: Host 넘기기 요청이 대기 중일 때 전환을 막을지] | REQ-SETTLE-01 |
| `start_settlement` | `p_meal_id uuid` | 호출자가 Host이고 `ordered`면 `settling`으로 전환 | REQ-SETTLE-03 |
| `request_host_handover` | `p_meal_id uuid`, `p_reason text` | 호출자가 Host이고 `recruiting`이며 대기 중인 요청이 없으면 `host_handovers`에 `pending` 생성. [확인 필요: 다른 참여자가 없을 때 요청을 막을지, 받자마자 겸상을 취소할지] | REQ-MEAL-05 |
| `accept_host_handover` | `p_handover_id uuid` | 요청 행을 잠그고, `pending`이며 호출자가 기존 Host가 아닌 참여자이고 주문 예정 시간 전이면 `meals.host_id = 호출자`, 요청을 `accepted`로. [확인 필요: 기존 Host가 참여자였다면 그대로 남는지, 메뉴 항목과 함께 빠지는지] | REQ-MEAL-05 |
| `reject_host_handover` | `p_handover_id uuid` | `pending`이며 호출자가 기존 Host가 아닌 참여자면 `host_handover_rejections`에 추가. 이어서 `resolve_host_handover` 실행 | REQ-MEAL-05 |

내부 함수 (클라이언트 실행 권한 없음)

| 함수 | 하는 일 |
|---|---|
| `resolve_host_handover(p_handover_id uuid)` | `pending` 요청에 대해, 주문 예정 시간이 지났거나 기존 Host를 뺀 참여자 전원이 거절했으면 요청을 `failed`로, 겸상을 `canceled`로 |
| `expire_host_handovers()` | 모든 `pending` 요청에 `resolve_host_handover` 실행. 예약 작업이 호출 |

## 7. 트리거 · 예약 작업

| 이름 | 시점 | 하는 일 |
|---|---|---|
| `handle_new_user` | `auth.users` after insert | `profiles(id)` 행 생성 (`display_name`은 null) |
| `check_meal_capacity` | `meal_members` before insert | 겸상 행을 `for update`로 잠근 뒤, `recruiting`이 아니면 `meal_not_recruiting`, 현재 인원 ≥ 정원이면 `meal_full` |
| `expire-host-handovers` (pg_cron) | 1분마다 | `expire_host_handovers()` 실행. 주문 예정 시간이 지난 미수락 요청을 취소 처리 (최대 1분 늦을 수 있음) |

- 예약 작업은 Supabase `pg_cron` 확장을 쓴다 (무료 플랜 사용 가능).

## 8. 에러 코드

함수·트리거가 던지는 예외 메시지. 그 밖의 DB 에러(중복 참여 PK 위반 `23505`, RLS 거부, check 제약 위반)는 `api.ts`에서 상황에 맞게 처리한다.

| 코드 | 뜻 |
|---|---|
| `meal_not_found` | 겸상이 없음 |
| `meal_not_recruiting` | 모집중이 아님 (참여·확정·넘기기 불가) |
| `meal_full` | 정원이 참 |
| `not_member` | 해당 겸상의 참여자가 아님 |
| `not_host` | Host가 아님 |
| `already_confirmed` | 이미 주문 확정함 |
| `no_items` | 메뉴 항목이 없어 확정 불가 |
| `invalid_status` | 현재 상태에서 할 수 없는 전환 |
| `handover_pending` | 대기 중인 Host 넘기기가 이미 있음 |
| `handover_not_pending` | 이미 처리된 Host 넘기기 요청 |
| `handover_expired` | 주문 예정 시간이 지나 수락 불가 |

## 9. 조회 예시

- 모집중 목록과 현재 인원: `meals`를 `status = 'recruiting'`로 거르고 `meal_members(count)`를 함께 조회
- 참여자별 부담액: `meal_members`와 `profiles(display_name)`, `order_items(price)`를 함께 조회해 `api.ts`에서 합산
- 공지: `notices`를 `meal_id`로 거르고 `created_at` 내림차순
