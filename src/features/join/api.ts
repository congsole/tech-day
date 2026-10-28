import type { Database } from '../../shared/database.types'
import { supabase } from '../../shared/supabase'
import { validateMenuInput } from './menu-input'

type Meal = Database['public']['Tables']['meals']['Row']
export type Participation = Pick<Meal, 'id' | 'status' | 'order_time' | 'capacity' | 'host_id'> & {
  memberCount: number
  confirmedAt: string | null
  isMember: boolean
}
type Result<T> = { data: T; error: null } | { data: null; error: string }
export type MenuItem = Pick<Database['public']['Tables']['order_items']['Row'], 'id' | 'name' | 'price'>

export async function getMyMenu(mealId: string, userId: string): Promise<Result<MenuItem[]>> {
  try {
    const { data, error } = await supabase.from('order_items').select('id, name, price')
      .eq('meal_id', mealId).eq('user_id', userId).order('created_at').order('id')
    if (error || !data) return { data: null, error: '내 메뉴를 불러오지 못했습니다. 새로 고침해 주세요.' }
    return { data, error: null }
  } catch {
    return { data: null, error: '내 메뉴를 불러오지 못했습니다. 새로 고침해 주세요.' }
  }
}

export async function addMenuItem(mealId: string, name: string, price: string): Promise<{ error: string | null }> {
  const input = validateMenuInput(name, price)
  if (input.nameError || input.priceError) return { error: input.nameError ?? input.priceError }
  try {
    // user_id는 auth.uid() 기본값. 참여·확정·시간 잠금은 RLS가 최종 검사한다.
    const { error } = await supabase.from('order_items').insert({ meal_id: mealId, name: name.trim(), price: input.amount })
    if (!error) return { error: null }
    if (error.code === '42501' || error.code === '23503') {
      return { error: '메뉴를 추가할 수 없습니다. 참여 여부와 주문 마감·확정 상태를 확인해 주세요.' }
    }
    return { error: '메뉴를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  } catch {
    return { error: '메뉴 저장 결과를 확인하지 못했습니다. 새로 고침해 메뉴를 확인해 주세요.' }
  }
}

// REQ-JOIN-01: 조회 실패를 미참여나 인원 0명으로 바꾸지 않는다.
export async function getParticipation(mealId: string, userId: string): Promise<Result<Participation>> {
  try {
    const [meal, member] = await Promise.all([
      supabase.from('meals').select('id, status, order_time, capacity, host_id, meal_members(count)').eq('id', mealId).maybeSingle(),
      supabase.from('meal_members').select('user_id, confirmed_at').eq('meal_id', mealId).eq('user_id', userId).maybeSingle(),
    ])
    if (meal.error || member.error) {
      return { data: null, error: '참여 상태를 불러오지 못했습니다. 새로 고침해 주세요.' }
    }
    if (!meal.data) return { data: null, error: '겸상을 찾을 수 없습니다.' }
    const memberCount = meal.data.meal_members[0]?.count
    if (memberCount === undefined) {
      return { data: null, error: '참여 인원을 불러오지 못했습니다. 새로 고침해 주세요.' }
    }
    return {
      data: {
        id: meal.data.id,
        status: meal.data.status,
        order_time: meal.data.order_time,
        capacity: meal.data.capacity,
        host_id: meal.data.host_id,
        confirmedAt: member.data?.confirmed_at ?? null,
        memberCount,
        isMember: member.data !== null,
      },
      error: null,
    }
  } catch {
    return { data: null, error: '참여 상태를 불러오지 못했습니다. 새로 고침해 주세요.' }
  }
}

// 사용자 ID는 DB default(auth.uid()). 정원·마감은 check_meal_capacity,
// 중복 참여는 meal_members 복합 PK가 최종 보장한다. upsert로 기존 행을 덮지 않는다.
export async function joinMeal(mealId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('meal_members').insert({ meal_id: mealId })
    if (!error) return { error: null }
    if (error.code === '23505') return { error: '이미 참여한 겸상입니다.' }
    switch (error.message) {
      case 'meal_full':
        return { error: '정원이 가득 찼습니다.' }
      case 'meal_not_recruiting':
        return { error: '모집이 마감되어 참여할 수 없습니다.' }
      case 'meal_not_found':
        return { error: '겸상을 찾을 수 없습니다.' }
      default:
        return { error: '참여하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
    }
  } catch {
    return { error: '참여하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}
