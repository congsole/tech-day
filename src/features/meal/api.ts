import type { AuthError, Session } from '@supabase/supabase-js'
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
