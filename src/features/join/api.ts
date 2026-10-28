import { supabase } from '../../shared/supabase'

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
