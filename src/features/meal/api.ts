import type { AuthError, Session } from '@supabase/supabase-js'
import type { Database } from '../../shared/database.types'
import { supabase } from '../../shared/supabase'

// 실패하면 화면에 보일 메시지를 담는다
export type ApiResult = { error: string | null }

function authErrorMessage(error: AuthError, fallback: string): string {
  switch (error.code) {
    case 'email_address_invalid':
    case 'validation_failed':
      return '이메일 주소를 확인해 주세요.'
    case 'over_email_send_rate_limit':
      return '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
    case 'otp_expired':
      return '코드가 올바르지 않거나 만료되었습니다. 다시 확인해 주세요.'
    default:
      return fallback
  }
}

// REQ-MEAL-01: 이메일로 6자리 인증 코드 발송. 처음 로그인하는 이메일이면 사용자가 생성된다.
export async function requestLoginCode(email: string): Promise<ApiResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) return { error: authErrorMessage(error, '인증 코드를 보내지 못했습니다. 다시 시도해 주세요.') }
  return { error: null }
}

// REQ-MEAL-01: 인증 코드 확인 후 로그인. 세션은 Supabase 클라이언트가 브라우저에 유지한다.
export async function verifyLoginCode(email: string, code: string): Promise<ApiResult> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) return { error: authErrorMessage(error, '로그인하지 못했습니다. 다시 시도해 주세요.') }
  return { error: null }
}

// REQ-MEAL-01: 저장된 세션을 읽고 이후 로그인 상태 변화를 구독한다. 반환값은 구독 해제 함수.
export function watchSession(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session))
  return () => data.subscription.unsubscribe()
}

// REQ-MEAL-02: 본인 표시 이름 조회. null이면 이름 설정 전이다.
export async function getMyDisplayName(
  userId: string,
): Promise<ApiResult & { displayName: string | null }> {
  const { data, error } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
  if (error || !data) return { error: '사용자 정보를 불러오지 못했습니다. 새로 고침해 주세요.', displayName: null }
  return { error: null, displayName: data.display_name }
}

// REQ-MEAL-02: 본인 표시 이름(본명) 저장
export async function saveDisplayName(userId: string, displayName: string): Promise<ApiResult> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select('id')
  if (error || data.length === 0) return { error: '이름을 저장하지 못했습니다. 다시 시도해 주세요.' }
  return { error: null }
}

export type RecruitingMeal = {
  id: string
  title: string
  type: MealType
  capacity: number
  memberCount: number
}

// REQ-MEAL-04: 모집중 겸상 목록. 주문 예정 시간이 지난 겸상은 자동 전환 전이어도 제외한다 (db-schema.md §5 열려 있음).
export async function getRecruitingMeals(): Promise<ApiResult & { meals: RecruitingMeal[] }> {
  const { data, error } = await supabase
    .from('meals')
    .select('id, title, type, capacity, meal_members(count)')
    .eq('status', 'recruiting')
    .gt('order_time', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) return { error: '겸상 목록을 불러오지 못했습니다. 새로 고침해 주세요.', meals: [] }
  return {
    error: null,
    meals: data.map((meal) => ({
      id: meal.id,
      title: meal.title,
      type: meal.type,
      capacity: meal.capacity,
      memberCount: meal.meal_members[0]?.count ?? 0,
    })),
  }
}

export type MealType = Database['public']['Enums']['meal_type']
export type MealStatus = Database['public']['Enums']['meal_status']

export type NewMeal = {
  title: string
  type: MealType
  restaurantName: string | null
  menuUrl: string | null
  place: string | null
  orderTime: Date
  capacity: number
  memo: string | null
}

// REQ-MEAL-03: 겸상 열기. host_id·status는 DB default로 들어가고, 트리거가 Host를 참여자로 추가한다.
export async function createMeal(meal: NewMeal): Promise<ApiResult & { mealId: string | null }> {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      title: meal.title,
      type: meal.type,
      restaurant_name: meal.restaurantName,
      menu_url: meal.menuUrl,
      place: meal.place,
      order_time: meal.orderTime.toISOString(),
      capacity: meal.capacity,
      memo: meal.memo,
    })
    .select('id')
    .single()
  if (error) return { error: '겸상을 열지 못했습니다. 입력값을 확인하고 다시 시도해 주세요.', mealId: null }
  return { error: null, mealId: data.id }
}

export type MealDetail = {
  id: string
  hostId: string
  title: string
  type: MealType
  status: MealStatus
  cancelReason: string | null
  restaurantName: string | null
  menuUrl: string | null
  orderTime: string
  capacity: number
  memo: string | null
  memberCount: number
}

// REQ-MEAL-03: 겸상 상세의 겸상 정보
export async function getMealDetail(mealId: string): Promise<ApiResult & { meal: MealDetail | null }> {
  const { data, error } = await supabase
    .from('meals')
    .select(
      'id, host_id, title, type, status, cancel_reason, restaurant_name, menu_url, order_time, capacity, memo, meal_members(count)',
    )
    .eq('id', mealId)
    .maybeSingle()
  if (error) return { error: '겸상 정보를 불러오지 못했습니다. 새로 고침해 주세요.', meal: null }
  if (!data) return { error: '겸상을 찾을 수 없습니다.', meal: null }
  return {
    error: null,
    meal: {
      id: data.id,
      hostId: data.host_id,
      title: data.title,
      type: data.type,
      status: data.status,
      cancelReason: data.cancel_reason,
      restaurantName: data.restaurant_name,
      menuUrl: data.menu_url,
      orderTime: data.order_time,
      capacity: data.capacity,
      memo: data.memo,
      memberCount: data.meal_members[0]?.count ?? 0,
    },
  }
}

// REQ-MEAL-06: Host의 겸상 취소. Host·열려 있음 확인은 cancel_meal RPC가 한다.
export async function cancelMeal(mealId: string, reason: string): Promise<ApiResult> {
  const { error } = await supabase.rpc('cancel_meal', { p_meal_id: mealId, p_reason: reason })
  if (!error) return { error: null }
  switch (error.message) {
    case 'meal_not_recruiting':
      return { error: '모집중일 때만 겸상을 취소할 수 있습니다.' }
    case 'not_host':
      return { error: 'Host만 겸상을 취소할 수 있습니다.' }
    default:
      return { error: '겸상을 취소하지 못했습니다. 다시 시도해 주세요.' }
  }
}

// REQ-MEAL-07: Host의 주문 예정 시간 수정. Host·열려 있음·넘기기 대기·현재 이후 확인은 update_order_time RPC가 한다.
export async function updateOrderTime(mealId: string, orderTime: Date): Promise<ApiResult> {
  const { error } = await supabase.rpc('update_order_time', {
    p_meal_id: mealId,
    p_order_time: orderTime.toISOString(),
  })
  if (!error) return { error: null }
  switch (error.message) {
    case 'handover_pending':
      return { error: 'Host 넘기기 대기 중에는 주문 예정 시간을 수정할 수 없습니다.' }
    case 'meal_not_recruiting':
      return { error: '모집중일 때만 주문 예정 시간을 수정할 수 있습니다.' }
    case 'invalid_order_time':
      return { error: '현재 이후 시각을 입력해 주세요.' }
    case 'not_host':
      return { error: 'Host만 주문 예정 시간을 수정할 수 있습니다.' }
    default:
      return { error: '주문 예정 시간을 수정하지 못했습니다. 다시 시도해 주세요.' }
  }
}

export type Handover = {
  id: string
  fromHostId: string
  reason: string
  status: Database['public']['Enums']['handover_status']
  rejectedUserIds: string[]
}

// REQ-MEAL-05·08·09: 겸상의 가장 최근 Host 넘기기 요청. RLS로 그 겸상의 Host와 참여자만 조회된다.
export async function getLatestHandover(mealId: string): Promise<ApiResult & { handover: Handover | null }> {
  const { data, error } = await supabase
    .from('host_handovers')
    .select('id, from_host_id, reason, status, host_handover_rejections(user_id)')
    .eq('meal_id', mealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { error: 'Host 넘기기 정보를 불러오지 못했습니다. 새로 고침해 주세요.', handover: null }
  if (!data) return { error: null, handover: null }
  return {
    error: null,
    handover: {
      id: data.id,
      fromHostId: data.from_host_id,
      reason: data.reason,
      status: data.status,
      rejectedUserIds: data.host_handover_rejections.map((rejection) => rejection.user_id),
    },
  }
}

// REQ-MEAL-05: Host 넘기기 요청. Host·열려 있음·대기 중 여부·다른 참여자 확인은 request_host_handover RPC가 한다.
export async function requestHandover(mealId: string, reason: string): Promise<ApiResult> {
  const { error } = await supabase.rpc('request_host_handover', { p_meal_id: mealId, p_reason: reason })
  if (!error) return { error: null }
  switch (error.message) {
    case 'no_other_members':
      return { error: '다른 참여자가 없으면 Host를 넘길 수 없습니다. 겸상 취소를 이용해 주세요.' }
    case 'handover_pending':
      return { error: '이미 Host 넘기기를 요청했습니다.' }
    case 'meal_not_recruiting':
      return { error: '모집중일 때만 Host를 넘길 수 있습니다.' }
    case 'not_host':
      return { error: 'Host만 Host를 넘길 수 있습니다.' }
    default:
      return { error: 'Host 넘기기를 요청하지 못했습니다. 다시 시도해 주세요.' }
  }
}

// closed: 요청이 이미 닫혀 더 응답할 수 없음
type HandoverResponseResult = ApiResult & { closed: boolean }

function handoverResponseError(message: string, fallback: string): HandoverResponseResult {
  switch (message) {
    case 'handover_not_pending':
      return { error: '이미 처리된 요청입니다. 새로 고침해 주세요.', closed: true }
    case 'handover_expired':
      return { error: '주문 예정 시간이 지나 수락할 수 없습니다.', closed: true }
    case 'not_member':
      return { error: '참여자만 응답할 수 있습니다.', closed: true }
    default:
      return { error: fallback, closed: false }
  }
}

// REQ-MEAL-08: Host 넘기기 수락. 수락하면 호출자가 새 Host가 되고 기존 Host의 참여·메뉴가 삭제된다.
export async function acceptHandover(handoverId: string): Promise<HandoverResponseResult> {
  const { error } = await supabase.rpc('accept_host_handover', { p_handover_id: handoverId })
  if (!error) return { error: null, closed: false }
  return handoverResponseError(error.message, 'Host 넘기기를 수락하지 못했습니다. 다시 시도해 주세요.')
}

// REQ-MEAL-09: Host 넘기기 거절. 전원 거절이면 reject_host_handover RPC가 겸상을 취소한다.
export async function rejectHandover(handoverId: string): Promise<HandoverResponseResult> {
  const { error } = await supabase.rpc('reject_host_handover', { p_handover_id: handoverId })
  if (!error) return { error: null, closed: false }
  return handoverResponseError(error.message, 'Host 넘기기를 거절하지 못했습니다. 다시 시도해 주세요.')
}
