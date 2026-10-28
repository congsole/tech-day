import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Stack, Text, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { joinMeal } from './api'

type Props = {
  meal: MealDetail
  // 겸상 정보·참여 여부는 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75).
  onChanged: () => Promise<void>
}

// REQ-JOIN-01 / SCR-JOIN-01
export default function JoinSection({ meal, onChanged }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef(false)
  const deadline = new Date(meal.orderTime).getTime()

  // 서버 주기 조회 없이, 조회한 주문 예정 시간에 화면을 잠근다.
  useEffect(() => {
    if (deadline <= now) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(Math.max(deadline - Date.now(), 0), 2_147_483_647))
    return () => window.clearTimeout(timer)
  }, [deadline, now])

  let unavailable: string | null = null
  if (meal.status === 'canceled') unavailable = '취소된 겸상입니다'
  else if (meal.status !== 'recruiting') unavailable = '모집이 마감되어 참여할 수 없습니다'
  else if (deadline <= now) unavailable = '주문 예정 시간이 되어 참여할 수 없습니다'
  else if (meal.memberCount >= meal.capacity) unavailable = '정원이 가득 찼습니다'

  async function handleJoin() {
    if (meal.isMember || unavailable || inFlight.current) return
    // 타이머 실행이 지연됐어도 마감 이후 요청하지 않는다. 서버 검사도 유지한다.
    if (deadline <= Date.now()) {
      setNow(Date.now())
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setActionError(null)
    const joined = await joinMeal(meal.id)
    // 성공뿐 아니라 정원 마감·중복·잠금 응답도 최신 상태로 다시 확인한다.
    await onChanged()
    setNow(Date.now())
    setActionError(joined.error)
    setSubmitting(false)
    inFlight.current = false
  }

  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Title order={2}>참여 상태</Title>
        <Text>인원 {meal.memberCount}/{meal.capacity}명</Text>
        {meal.isMember ? (
          <Text role="status">참여중</Text>
        ) : (
          <>
            {unavailable && <Text c="dimmed" role="status">{unavailable}</Text>}
            <Button size="md" mih={44} loading={submitting} disabled={Boolean(unavailable)} onClick={handleJoin}>
              참여하기
            </Button>
          </>
        )}
        {actionError && <Alert color="red" role="alert">{actionError}</Alert>}
      </Stack>
    </Card>
  )
}
