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

// Host가 모집중일 때만 수정할 수 있다(RLS). 막히면 오류 없이 0행이 되므로 반영된 행으로 판단한다. REQ-NOTICE-02
export async function updatePlace(mealId: string, place: string): Promise<Result<null>> {
  const { data, error } = await supabase.from('meals').update({ place: place.trim() }).eq('id', mealId).select('id')
  if (error?.code === '23514') return { error: '장소를 입력하세요.' }
  if (error) return { error: '장소를 저장하지 못했습니다.' }
  if (data.length !== 1) return { error: '모집중일 때만 장소를 수정할 수 있습니다.' }
  return { data: null }
}
