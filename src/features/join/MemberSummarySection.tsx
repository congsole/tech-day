import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Badge, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { getMemberSummary, subscribeOrderItems } from './api'

// REQ-JOIN-05 / SCR-JOIN-03. 부모의 공유 데이터 재조회마다, 메뉴 항목이 바뀔 때마다(#101) 현황을 갱신한다.
export default function MemberSummarySection({ meal }: { meal: MealDetail }) {
  // null: 최초 조회 중. 다시 조회하는 동안에는 이전 현황을 유지한다
  const [result, setResult] = useState<Awaited<ReturnType<typeof getMemberSummary>> | null>(null)
  // 마지막으로 보낸 조회 번호. 조회가 겹치면 늦게 도착한 이전 응답이 최신 현황을 덮지 않게 한다
  const latestLoad = useRef(0)
  // 표시 중인 메뉴 항목 id. 삭제 이벤트가 이 겸상의 것인지 확인한다
  const shownItemIds = useRef(new Set<string>())
  const mealId = meal.id

  const load = useCallback(async () => {
    const request = ++latestLoad.current
    const next = await getMemberSummary(mealId)
    if (request !== latestLoad.current) return
    shownItemIds.current = new Set(next.data?.flatMap((member) => member.items.map((item) => item.id)) ?? [])
    setResult(next)
  }, [mealId])

  // 참여·취소·확정은 부모가 다시 조회해 새 meal을 내려주므로 그때마다 다시 조회한다
  useEffect(() => {
    if (!meal.isHost) return
    void load()
  }, [meal, load])

  useEffect(() => {
    if (!meal.isHost) return
    return subscribeOrderItems(mealId, (itemId) => shownItemIds.current.has(itemId), () => void load())
  }, [mealId, meal.isHost, load])

  if (!meal.isHost) return null
  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Title order={2}>취합 현황</Title>
        {!result ? <Group role="status"><Loader size="sm" aria-hidden /><Text>취합 현황을 불러오는 중입니다</Text></Group>
          : result.error !== null ? <Alert color="red" role="alert">{result.error}</Alert>
          : <>
            <Stack component="ul" gap="sm" p={0} m={0} style={{ listStyle: 'none' }}>
              {result.data.map((member) => (
                <Stack component="li" key={member.userId} gap="sm" p="sm"
                  style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                      <Text fw={700}>{member.displayName}</Text>
                      <Text c="dimmed" size="sm">{member.email}</Text>
                    </Stack>
                    <Badge variant="light" style={{ flexShrink: 0 }}>{member.confirmedAt ? '확정' : '미확정'}</Badge>
                  </Group>
                  {member.items.length === 0 ? <Text c="dimmed">메뉴 미입력</Text>
                    : <Stack component="ul" gap="xs" p={0} m={0} style={{ listStyle: 'none' }}>
                      {member.items.map((item) => (
                        <Group component="li" key={item.id} wrap="nowrap" align="flex-start">
                          <Text style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{item.name}</Text>
                          <Text style={{ flexShrink: 0 }}>{item.price.toLocaleString('ko-KR')}원</Text>
                        </Group>
                      ))}
                    </Stack>}
                  <Text fw={700}>부담액 {member.amountDue.toLocaleString('ko-KR')}원</Text>
                </Stack>
              ))}
            </Stack>
            <Text fw={700} aria-live="polite">전체 합계 {result.data.reduce((total, member) => total + member.amountDue, 0).toLocaleString('ko-KR')}원</Text>
          </>}
      </Stack>
    </Card>
  )
}
