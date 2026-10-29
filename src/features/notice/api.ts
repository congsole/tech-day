import { supabase } from '../../shared/supabase'
import type { Database } from '../../shared/database.types'

export type Notice = Pick<Database['public']['Tables']['notices']['Row'], 'id' | 'content' | 'created_at'>

type Result<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

// 공지 목록(최신순). 참여자만 조회할 수 있다(RLS). 참여 여부는 겸상 상세가 내려준다(#75). REQ-NOTICE-01
export async function getNotices(mealId: string): Promise<Result<Notice[]>> {
  const { data, error } = await supabase
    .from('notices')
    .select('id, content, created_at')
    .eq('meal_id', mealId)
    .order('created_at', { ascending: false })
  if (error) return { error: '공지를 불러오지 못했습니다.' }
  return { data }
}

// 현재 Host만 올릴 수 있다(RLS). 빈 내용은 화면에서 먼저 막는다.
export async function createNotice(mealId: string, content: string): Promise<Result<null>> {
  const { error } = await supabase.from('notices').insert({ meal_id: mealId, content: content.trim() })
  if (!error) return { data: null }
  if (error.code === '42501') return { error: 'Host만 공지를 올릴 수 있습니다.' }
  if (error.code === '23514') return { error: '공지 내용을 입력하세요.' }
  return { error: '공지를 올리지 못했습니다.' }
}

// 이 겸상에 공지가 올라오면 알린다(#81). 수신하면 getNotices로 다시 조회한다.
// 참여자에게만 전달된다(RLS). 반환 함수로 구독을 해제한다. docs/common/db-schema.md §10
export function subscribeNotices(mealId: string, onChange: () => void): () => void {
  // 같은 이름의 채널은 재사용되므로, 해제 중인 채널을 다시 받지 않도록 구독마다 이름을 새로 만든다
  const channel = supabase
    .channel(`notices:${mealId}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices', filter: `meal_id=eq.${mealId}` }, onChange)
    // 연결 전이나 끊긴 동안의 변경은 이벤트로 오지 않으므로, 연결(재연결 포함)될 때마다 다시 조회한다
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onChange()
    })
  return () => {
    void supabase.removeChannel(channel)
  }
}
