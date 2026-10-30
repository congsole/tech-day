import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Divider, Group, Loader, Stack, Text, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { getSettlement, markOrdered, startSettlement } from './api'
import ConfirmTransitionModal from './ConfirmTransitionModal'

type Props = {
  meal: MealDetail
  // 상태는 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75)
  onChanged: () => Promise<void>
}

// 겸상 상세의 settle 섹션. 주문완료·정산(REQ-SETTLE-01~03)
// 상태·보는 사람별 표시는 docs/features/settle/screen.md §1 표를 따른다.
export default function SettleSection({ meal, onChanged }: Props) {
  const showOrder = meal.status === 'ordering' && meal.isHost
  const showList = (meal.status === 'ordered' || meal.status === 'settling') && meal.isMember
  const showStart = meal.status === 'ordered' && meal.isHost
  const [confirming, setConfirming] = useState<'order' | 'start' | null>(null)

  // 성공하면 대화상자를 닫고 상태를 다시 조회한다
  async function transition(request: (mealId: string) => Promise<{ error: string | null }>) {
    const result = await request(meal.id)
    if (!result.error) {
      setConfirming(null)
      await onChanged()
    }
    return result
  }

  if (!showOrder && !showList) return null
  return (
    <Stack gap="sm">
      {showOrder && (
        <Card p="lg" bg="white">
          <Stack gap="sm">
            <Text>취합 현황대로 주문을 넣은 뒤 주문완료로 바꿔 주세요.</Text>
            <Group>
              <Button size="md" onClick={() => setConfirming('order')}>주문완료</Button>
            </Group>
          </Stack>
        </Card>
      )}
      {showList && <SettleList meal={meal} />}
      {showStart && (
        <Group>
          <Button size="md" onClick={() => setConfirming('start')}>정산 시작</Button>
        </Group>
      )}
      {meal.isHost && (
        <>
          <ConfirmTransitionModal opened={confirming === 'order'} title="주문완료"
            message="주문완료로 바꾸면 되돌릴 수 없습니다. 주문을 넣었는지 확인해 주세요."
            onClose={() => setConfirming(null)} onConfirm={() => transition(markOrdered)} />
          <ConfirmTransitionModal opened={confirming === 'start'} title="정산 시작"
            message="정산을 시작하면 되돌릴 수 없습니다."
            onClose={() => setConfirming(null)} onConfirm={() => transition(startSettlement)} />
        </>
      )}
    </Stack>
  )
}

// SCR-SETTLE-LIST. 공유 데이터가 다시 조회될 때마다 다시 조회한다. 주문중 이후 참여·메뉴가 잠겨 별도 구독은 없다.
function SettleList({ meal }: { meal: MealDetail }) {
  // null: 최초 조회 중. 다시 조회하는 동안에는 이전 내역을 유지한다
  const [result, setResult] = useState<Awaited<ReturnType<typeof getSettlement>> | null>(null)
  // 마지막으로 보낸 조회 번호. 조회가 겹치면 늦게 도착한 이전 응답이 최신 내역을 덮지 않게 한다
  const latestLoad = useRef(0)
  const mealId = meal.id

  const load = useCallback(async () => {
    const request = ++latestLoad.current
    const next = await getSettlement(mealId)
    if (request === latestLoad.current) setResult(next)
  }, [mealId])

  useEffect(() => {
    void load()
  }, [meal, load])

  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Title order={2}>정산 내역</Title>
        {!result ? (
          <Group role="status"><Loader size="sm" aria-hidden /><Text>정산 내역을 불러오는 중입니다</Text></Group>
        ) : result.error !== null ? (
          <Alert color="red" role="alert">{result.error}</Alert>
        ) : (
          <>
            <Stack component="ul" gap="xs" p={0} m={0} style={{ listStyle: 'none' }}>
              {result.data.members.map((member) => (
                <Group component="li" key={member.userId} wrap="nowrap" align="flex-start">
                  <Text style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{member.displayName}</Text>
                  <Text style={{ flexShrink: 0 }}>{member.amountDue.toLocaleString('ko-KR')}원</Text>
                </Group>
              ))}
            </Stack>
            <Divider />
            <Group wrap="nowrap" justify="space-between">
              <Text fw={700}>총액</Text>
              <Text fw={700}>{result.data.total.toLocaleString('ko-KR')}원</Text>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  )
}
