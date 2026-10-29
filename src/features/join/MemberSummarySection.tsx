import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { getMemberSummary } from './api'

// REQ-JOIN-05 / SCR-JOIN-03. 부모의 공유 데이터 재조회마다 현황도 갱신한다.
export default function MemberSummarySection({ meal }: { meal: MealDetail }) {
  const [loaded, setLoaded] = useState<{
    meal: MealDetail
    result: Awaited<ReturnType<typeof getMemberSummary>>
  } | null>(null)

  useEffect(() => {
    if (!meal.isHost) return
    let ignore = false
    getMemberSummary(meal.id).then((result) => {
      if (!ignore) setLoaded({ meal, result })
    })
    return () => { ignore = true }
  }, [meal])

  if (!meal.isHost) return null
  const result = loaded?.meal === meal ? loaded.result : null
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
