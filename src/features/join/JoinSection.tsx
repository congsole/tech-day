import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useOutletContext, useParams } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import { getParticipation, joinMeal } from './api'

// REQ-JOIN-01 / SCR-JOIN-01. 섹션 간 공유 데이터 갱신은 #75 통합 범위.
export default function JoinSection() {
  const { mealId } = useParams()
  const { userId } = useOutletContext<AuthContext>()
  if (!mealId) return null
  // 상세 이동·로그인 사용자 변경 시 이전 조회 및 참여 요청의 결과를 분리한다.
  return <ParticipationSection key={`${mealId}:${userId}`} mealId={mealId} userId={userId} />
}

function ParticipationSection({ mealId, userId }: { mealId: string; userId: string }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getParticipation>> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef(false)

  useEffect(() => {
    let ignore = false
    getParticipation(mealId, userId).then((next) => {
      if (ignore) return
      setResult(next)
      setNow(Date.now())
    })
    return () => { ignore = true }
  }, [mealId, userId])

  const view = result?.data
  const deadline = view ? new Date(view.order_time).getTime() : null

  // 서버 주기 조회 없이, 조회한 주문 예정 시간에 화면을 잠근다.
  useEffect(() => {
    if (deadline === null || deadline <= now) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(Math.max(deadline - Date.now(), 0), 2_147_483_647))
    return () => window.clearTimeout(timer)
  }, [deadline, now])

  let unavailable: string | null = null
  if (view) {
    if (view.status === 'canceled') unavailable = '취소된 겸상입니다'
    else if (view.status !== 'recruiting') unavailable = '모집이 마감되어 참여할 수 없습니다'
    else if (deadline !== null && deadline <= now) unavailable = '주문 예정 시간이 되어 참여할 수 없습니다'
    else if (view.memberCount >= view.capacity) unavailable = '정원이 가득 찼습니다'
  }

  async function handleJoin() {
    if (!view || view.isMember || unavailable || inFlight.current) return
    // 타이머 실행이 지연됐어도 마감 이후 요청하지 않는다. 서버 검사도 유지한다.
    if (new Date(view.order_time).getTime() <= Date.now()) {
      setNow(Date.now())
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setActionError(null)
    const joined = await joinMeal(mealId)
    // 성공뿐 아니라 정원 마감·중복·잠금 응답도 최신 상태로 다시 확인한다.
    const refreshed = await getParticipation(mealId, userId)
    setResult(refreshed)
    setNow(Date.now())
    setActionError(joined.error)
    setSubmitting(false)
    inFlight.current = false
  }

  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Title order={2}>참여 상태</Title>
        {!result ? (
          <Group role="status">
            <Loader size="sm" aria-hidden />
            <Text>참여 상태를 불러오는 중입니다</Text>
          </Group>
        ) : result.error ? (
          <Alert color="red" role="alert">{result.error}</Alert>
        ) : view && (
          <>
            <Text>인원 {view.memberCount}/{view.capacity}명</Text>
            {view.isMember ? (
              <Text role="status">참여중</Text>
            ) : (
              <>
                {unavailable && <Text c="dimmed" role="status">{unavailable}</Text>}
                <Button size="md" mih={44} loading={submitting} disabled={Boolean(unavailable)} onClick={handleJoin}>
                  참여하기
                </Button>
              </>
            )}
          </>
        )}
        {actionError && <Alert color="red" role="alert">{actionError}</Alert>}
      </Stack>
    </Card>
  )
}
