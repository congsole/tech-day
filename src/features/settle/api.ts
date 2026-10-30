import type { Database } from '../../shared/database.types'
import { supabase } from '../../shared/supabase'

type Result<T> = { data: T; error: null } | { data: null; error: string }

export type SettleMember = {
  userId: Database['public']['Tables']['meal_members']['Row']['user_id']
  displayName: Database['public']['Tables']['profiles']['Row']['display_name']
  amountDue: number
}

export type Settlement = { members: SettleMember[]; total: number }

// SCR-SETTLE-LIST: 참여자별 부담액은 본인 메뉴 항목 금액의 합(1/N 아님). docs/common/db-schema.md §9
// 메뉴 항목은 그 겸상의 Host·참여자만 조회된다(RLS). 일부 실패를 빈 목록·0원으로 표시하지 않는다.
export async function getSettlement(mealId: string): Promise<Result<Settlement>> {
  const loadError = '정산 내역을 불러오지 못했습니다. 새로 고침해 주세요.'
  try {
    const { data, error } = await supabase
      .from('meal_members')
      .select('user_id, profiles(display_name), order_items(price)')
      .eq('meal_id', mealId)
      .order('joined_at')
      .order('user_id')
    if (error || !data) return { data: null, error: loadError }
    const members: SettleMember[] = []
    for (const member of data) {
      if (!member.profiles || !member.order_items) return { data: null, error: loadError }
      members.push({
        userId: member.user_id,
        displayName: member.profiles.display_name,
        amountDue: member.order_items.reduce((total, item) => total + item.price, 0),
      })
    }
    return { data: { members, total: members.reduce((total, member) => total + member.amountDue, 0) }, error: null }
  } catch {
    return { data: null, error: loadError }
  }
}

// REQ-SETTLE-01. Host·주문중 여부는 mark_meal_ordered RPC가 확인한다.
export async function markOrdered(mealId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc('mark_meal_ordered', { p_meal_id: mealId })
    if (!error) return { error: null }
    if (error.message === 'invalid_status') return { error: '주문중일 때만 주문완료로 바꿀 수 있습니다.' }
    if (error.message === 'not_host') return { error: 'Host만 주문완료로 바꿀 수 있습니다.' }
    return { error: '주문완료로 바꾸지 못했습니다. 다시 시도해 주세요.' }
  } catch {
    return { error: '주문완료로 바꾸지 못했습니다. 다시 시도해 주세요.' }
  }
}

// REQ-SETTLE-03. Host·주문완료 여부는 start_settlement RPC가 확인한다.
export async function startSettlement(mealId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc('start_settlement', { p_meal_id: mealId })
    if (!error) return { error: null }
    if (error.message === 'invalid_status') return { error: '주문완료일 때만 정산을 시작할 수 있습니다.' }
    if (error.message === 'not_host') return { error: 'Host만 정산을 시작할 수 있습니다.' }
    return { error: '정산을 시작하지 못했습니다. 다시 시도해 주세요.' }
  } catch {
    return { error: '정산을 시작하지 못했습니다. 다시 시도해 주세요.' }
  }
}
