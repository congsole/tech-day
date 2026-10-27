import type { MealStatus, MealType } from './api'

// 화면 표시 이름. docs/common/domain.md 용어집 유형·상태
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  dine: '식사',
  delivery: '배달',
}

export const MEAL_STATUS_LABEL: Record<MealStatus, string> = {
  recruiting: '모집중',
  ordering: '주문중',
  ordered: '주문완료',
  settling: '정산',
  canceled: '취소',
}
