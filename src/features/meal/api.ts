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
  type: Database['public']['Enums']['meal_type']
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
