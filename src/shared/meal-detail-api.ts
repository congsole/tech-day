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
  restaurantName: string | null
  menuUrl: string | null
  orderTime: string
  capacity: number
  memo: string | null
  memberCount: number
  isMember: boolean
  isHost: boolean
}

export type MealDetailResult = { meal: MealDetail; error: null } | { meal: null; error: string }

const loadError = '겸상 정보를 불러오지 못했습니다. 새로 고침해 주세요.'

// 조회 실패를 인원 0명이나 비참여로 바꾸지 않는다. REQ-MEAL-03, REQ-JOIN-01, REQ-NOTICE-01
export async function getMealDetail(mealId: string, userId: string): Promise<MealDetailResult> {
  try {
    const [meal, member] = await Promise.all([
      supabase
        .from('meals')
        .select('id, host_id, title, type, status, restaurant_name, menu_url, order_time, capacity, memo, meal_members(count)')
        .eq('id', mealId)
        .maybeSingle(),
      supabase.from('meal_members').select('user_id').eq('meal_id', mealId).eq('user_id', userId).maybeSingle(),
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
        restaurantName: meal.data.restaurant_name,
        menuUrl: meal.data.menu_url,
        orderTime: meal.data.order_time,
        capacity: meal.data.capacity,
        memo: meal.data.memo,
        memberCount,
        isMember: isHost || member.data !== null,
        isHost,
      },
      error: null,
    }
  } catch {
    return { meal: null, error: loadError }
  }
}
