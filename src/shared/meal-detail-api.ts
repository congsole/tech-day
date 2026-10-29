import type { Database } from './database.types'
import { supabase } from './supabase'

type Meal = Database['public']['Tables']['meals']['Row']

// 겸상 상세의 여러 섹션이 함께 쓰는 값. MealDetailPage가 조회해 각 섹션에 props로 내려준다(#75).
// 섹션 전용 데이터(공지 목록, 메뉴 항목 등)는 각 기능의 api.ts에서 조회한다.
export type MealDetail = {
  id: string
  hostId: string
  title: string
  type: Meal['type']
  status: Meal['status']
  cancelReason: string | null
  restaurantName: string | null
  menuUrl: string | null
  orderTime: string
  capacity: number
  memo: string | null
  memberCount: number
  isMember: boolean
  isHost: boolean
  // 내 주문 확정 시각. 확정 전이거나 참여자가 아니면 null
  myConfirmedAt: string | null
}

export type MealDetailResult = { meal: MealDetail; error: null } | { meal: null; error: string }

const loadError = '겸상 정보를 불러오지 못했습니다. 새로 고침해 주세요.'

// 조회 실패를 인원 0명이나 비참여로 바꾸지 않는다. REQ-MEAL-03, REQ-JOIN-01, REQ-NOTICE-01
export async function getMealDetail(mealId: string, userId: string): Promise<MealDetailResult> {
  try {
    const [meal, member] = await Promise.all([
      supabase
        .from('meals')
        .select('id, host_id, title, type, status, cancel_reason, restaurant_name, menu_url, order_time, capacity, memo, meal_members(count)')
        .eq('id', mealId)
        .maybeSingle(),
      supabase.from('meal_members').select('user_id, confirmed_at').eq('meal_id', mealId).eq('user_id', userId).maybeSingle(),
    ])
    if (meal.error || member.error) return { meal: null, error: loadError }
    if (!meal.data) return { meal: null, error: '겸상을 찾을 수 없습니다.' }
    const memberCount = meal.data.meal_members[0]?.count
    if (memberCount === undefined) return { meal: null, error: loadError }

    const isHost = meal.data.host_id === userId
    return {
      meal: {
        id: meal.data.id,
        hostId: meal.data.host_id,
        title: meal.data.title,
        type: meal.data.type,
        status: meal.data.status,
        cancelReason: meal.data.cancel_reason,
        restaurantName: meal.data.restaurant_name,
        menuUrl: meal.data.menu_url,
        orderTime: meal.data.order_time,
        capacity: meal.data.capacity,
        memo: meal.data.memo,
        memberCount,
        isMember: isHost || member.data !== null,
        isHost,
        myConfirmedAt: member.data?.confirmed_at ?? null,
      },
      error: null,
    }
  } catch {
    return { meal: null, error: loadError }
  }
}

// 이 겸상의 meals·meal_members 변경을 알린다(#81). 수신하면 getMealDetail로 다시 조회한다.
// 반환 함수로 구독을 해제한다. docs/common/db-schema.md §10
export function subscribeMealDetail(mealId: string, onChange: () => void): () => void {
  // 같은 이름의 채널은 재사용되므로, 해제 중인 채널을 다시 받지 않도록 구독마다 이름을 새로 만든다
  const channel = supabase
    .channel(`meal-detail:${mealId}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meals', filter: `id=eq.${mealId}` }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meal_members', filter: `meal_id=eq.${mealId}` }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meal_members', filter: `meal_id=eq.${mealId}` }, onChange)
    // 삭제 이벤트는 필터를 쓸 수 없어 이전 행의 PK로 해당 겸상인지 확인한다
    .on<{ meal_id: string }>('postgres_changes', { event: 'DELETE', schema: 'public', table: 'meal_members' }, (payload) => {
      if (payload.old.meal_id === mealId) onChange()
    })
    // 연결 전이나 끊긴 동안의 변경은 이벤트로 오지 않으므로, 연결(재연결 포함)될 때마다 다시 조회한다
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onChange()
    })
  return () => {
    void supabase.removeChannel(channel)
  }
}
