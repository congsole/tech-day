import { supabase } from '../../shared/supabase'
import type { Database } from '../../shared/database.types'

export type Notice = Pick<Database['public']['Tables']['notices']['Row'], 'id' | 'content' | 'created_at'>

export type NoticeView = {
  isMember: boolean
  isHost: boolean
  notices: Notice[]
}

type Result<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

// 공지 영역에 필요한 값. 참여자가 아니면 공지를 조회하지 않는다. REQ-NOTICE-01
export async function getNoticeView(mealId: string): Promise<Result<NoticeView>> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { data: { isMember: false, isHost: false, notices: [] } }

  const [meal, member] = await Promise.all([
    supabase.from('meals').select('host_id').eq('id', mealId).maybeSingle(),
    supabase.from('meal_members').select('user_id').eq('meal_id', mealId).eq('user_id', userId).maybeSingle(),
  ])
  if (meal.error || member.error) return { error: '공지를 불러오지 못했습니다.' }

  const isHost = meal.data?.host_id === userId
  const isMember = isHost || member.data !== null
  if (!isMember) return { data: { isMember, isHost, notices: [] } }

  const { data, error } = await supabase
    .from('notices')
    .select('id, content, created_at')
    .eq('meal_id', mealId)
    .order('created_at', { ascending: false })
  if (error) return { error: '공지를 불러오지 못했습니다.' }

  return { data: { isMember, isHost, notices: data } }
}

// 현재 Host만 올릴 수 있다(RLS). 빈 내용은 화면에서 먼저 막는다.
export async function createNotice(mealId: string, content: string): Promise<Result<null>> {
  const { error } = await supabase.from('notices').insert({ meal_id: mealId, content: content.trim() })
  if (!error) return { data: null }
  if (error.code === '42501') return { error: 'Host만 공지를 올릴 수 있습니다.' }
  if (error.code === '23514') return { error: '공지 내용을 입력하세요.' }
  return { error: '공지를 올리지 못했습니다.' }
}
