import { useCallback, useEffect, useState } from 'react'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useOutletContext, useParams } from 'react-router'
import MealInfoSection from '../features/meal/MealInfoSection'
import JoinSection from '../features/join/JoinSection'
import NoticeSection from '../features/notice/NoticeSection'
import SettleSection from '../features/settle/SettleSection'
import type { AuthContext } from './RequireAuth'
import { getMealDetail, type MealDetailResult } from './meal-detail-api'

// 겸상 상세는 여러 기능이 함께 쓰므로 섹션 단위로 나눈다. 각 섹션은 담당 기능 폴더에서 구현한다.
// 공지는 맨 위의 띠로 둔다. docs/features/notice/screen.md SCR-NOTICE-01
// 겸상 정보·내 참여 여부는 여기서 조회해 props로 내려주고, 섹션 행동으로 바뀌면 다시 조회한다(#75).
export default function MealDetailPage() {
  const { mealId } = useParams()
  const { userId } = useOutletContext<AuthContext>()
  if (!mealId) return null
  // 다른 겸상으로 이동하거나 사용자가 바뀌면 이전 조회 결과를 버린다.
  return <MealDetailContent key={`${mealId}:${userId}`} mealId={mealId} userId={userId} />
}

function MealDetailContent({ mealId, userId }: { mealId: string; userId: string }) {
  // null: 불러오는 중
  const [result, setResult] = useState<MealDetailResult | null>(null)

  const reload = useCallback(async () => {
    setResult(await getMealDetail(mealId, userId))
  }, [mealId, userId])

  useEffect(() => {
    let ignore = false
    getMealDetail(mealId, userId).then((next) => {
      if (!ignore) setResult(next)
    })
    return () => {
      ignore = true
    }
  }, [mealId, userId])

  if (!result) {
    return (
      <Center py="xl">
        <Loader aria-label="겸상 정보 불러오는 중" />
      </Center>
    )
  }
  if (result.error !== null) {
    return <Text c="var(--mantine-color-error)">{result.error}</Text>
  }

  const meal = result.meal
  return (
    <Stack>
      <NoticeSection meal={meal} />
      <MealInfoSection meal={meal} />
      <JoinSection meal={meal} onChanged={reload} />
      <SettleSection />
    </Stack>
  )
}
