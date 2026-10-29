import type { Database } from '../../shared/database.types'
import { supabase } from '../../shared/supabase'
import { validateMenuInput } from './menu-input'

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

export async function updateMenuItem(mealId: string, userId: string, itemId: string, name: string, price: string): Promise<{ error: string | null }> {
  const input = validateMenuInput(name, price)
  if (input.nameError || input.priceError) return { error: input.nameError ?? input.priceError }
  try {
    const { data, error } = await supabase.from('order_items').update({ name: name.trim(), price: input.amount })
      .eq('meal_id', mealId).eq('user_id', userId).eq('id', itemId).select('id')
    if (error || data?.length !== 1) return { error: '메뉴를 수정하지 못했습니다. 참여 여부와 주문 마감·확정 상태를 확인해 주세요.' }
    return { error: null }
  } catch {
    return { error: '메뉴 수정 결과를 확인하지 못했습니다. 새로 고침해 메뉴를 확인해 주세요.' }
  }
}

export async function deleteMenuItem(mealId: string, userId: string, itemId: string): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.from('order_items').delete()
      .eq('meal_id', mealId).eq('user_id', userId).eq('id', itemId).select('id')
    if (error || data?.length !== 1) return { error: '메뉴를 삭제하지 못했습니다. 참여 여부와 주문 마감·확정 상태를 확인해 주세요.' }
    return { error: null }
  } catch {
    return { error: '메뉴 삭제 결과를 확인하지 못했습니다. 새로 고침해 메뉴를 확인해 주세요.' }
  }
}

export async function cancelParticipation(mealId: string, userId: string): Promise<{ error: string | null }> {
  try {
    // 메뉴는 FK cascade로 함께 삭제한다. RLS가 Host·확정·마감을 최종 검사한다.
    const { data, error } = await supabase.from('meal_members').delete()
      .eq('meal_id', mealId).eq('user_id', userId).select('user_id')
    if (error || data?.length !== 1) return { error: '참여를 취소하지 못했습니다. Host 여부와 주문 마감·확정 상태를 확인해 주세요.' }
    return { error: null }
  } catch {
    return { error: '참여 취소 결과를 확인하지 못했습니다. 새로 고침해 참여 상태를 확인해 주세요.' }
  }
}

export async function confirmOrder(mealId: string): Promise<{ error: string | null }> {
  try {
    // 호출자·메뉴·마감 검증과 확정 시각 기록은 서버 RPC에서 처리한다.
    const { error } = await supabase.rpc('confirm_order', { p_meal_id: mealId })
    if (!error) return { error: null }
    switch (error.message) {
      case 'no_items':
        return { error: '메뉴를 하나 이상 입력해 주세요' }
      case 'already_confirmed':
        return { error: '이미 주문을 확정했습니다.' }
      case 'not_member':
        return { error: '겸상에 참여한 후 주문을 확정해 주세요.' }
      case 'meal_not_recruiting':
        return { error: '모집이 마감되어 주문을 확정할 수 없습니다.' }
      case 'meal_not_found':
        return { error: '겸상을 찾을 수 없습니다.' }
      default:
        return { error: '주문을 확정하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
    }
  } catch {
    return { error: '주문 확정 결과를 확인하지 못했습니다. 새로 고침해 확정 상태를 확인해 주세요.' }
  }
}
