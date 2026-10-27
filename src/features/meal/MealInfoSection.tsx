import { useEffect, useState } from 'react'
import { Anchor, Badge, Button, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useOutletContext, useParams } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import { getMealDetail, type MealDetail } from './api'
import { MEAL_STATUS_LABEL, MEAL_TYPE_LABEL } from './labels'
import MealCancelModal from './MealCancelModal'
import MealOrderTimeModal from './MealOrderTimeModal'

const orderTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

type Loaded = { mealId: string; loadedAt: number; error: string | null; meal: MealDetail | null }

// 겸상 상세의 meal 섹션. 겸상 정보(REQ-MEAL-03)와 Host 관리 동작(REQ-MEAL-05~07)
// 집합/수령 장소 항목은 이 섹션 안에 들어온다(SCR-MEAL-INFO). 표시·수정 UI는 REQ-NOTICE-02 구현 후 붙인다.
export default function MealInfoSection() {
  const { mealId } = useParams()
  const { userId } = useOutletContext<AuthContext>()
  // null: 불러오는 중
  const [result, setResult] = useState<Loaded | null>(null)
  // 값이 바뀌면 겸상 정보를 다시 불러온다
  const [reloadKey, setReloadKey] = useState(0)
  const [cancelOpened, setCancelOpened] = useState(false)
  const [orderTimeOpened, setOrderTimeOpened] = useState(false)

  useEffect(() => {
    if (!mealId) return
    let ignore = false
    getMealDetail(mealId).then((next) => {
      if (!ignore) setResult({ mealId, loadedAt: Date.now(), ...next })
    })
    return () => {
      ignore = true
    }
  }, [mealId, reloadKey])

  if (!result || result.mealId !== mealId) {
    return (
      <Center py="xl">
        <Loader aria-label="겸상 정보 불러오는 중" />
      </Center>
    )
  }
  if (result.error || !result.meal) {
    return <Text c="var(--mantine-color-error)">{result.error}</Text>
  }

  const meal = result.meal
  // 열려 있음: 모집중이고 주문 예정 시간 전. db-schema.md is_meal_open과 같은 기준
  const isOpen = meal.status === 'recruiting' && new Date(meal.orderTime).getTime() > result.loadedAt
  const canManage = meal.hostId === userId && isOpen

  return (
    <Stack gap="sm">
      <Card p="lg" bg="white">
        <Stack gap="sm">
          <Group gap="xs">
            <Badge variant="light">{MEAL_TYPE_LABEL[meal.type]}</Badge>
            <Badge variant="outline" color="gray">
              {MEAL_STATUS_LABEL[meal.status]}
            </Badge>
          </Group>
          {meal.status === 'canceled' && meal.cancelReason && (
            <Text c="var(--mantine-color-error)" style={{ whiteSpace: 'pre-wrap' }}>
              취소 사유: {meal.cancelReason}
            </Text>
          )}
          <Title order={1}>{meal.title}</Title>
          <Stack gap={4}>
            {meal.restaurantName && <Text>{meal.restaurantName}</Text>}
            {meal.menuUrl && (
              <Anchor href={meal.menuUrl} target="_blank" rel="noopener noreferrer">
                가게 메뉴판 보기
              </Anchor>
            )}
            <Text>주문 예정 시간 {orderTimeFormat.format(new Date(meal.orderTime))}</Text>
            <Text>
              인원 {meal.memberCount}/{meal.capacity}명
            </Text>
          </Stack>
          {meal.memo && (
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
              {meal.memo}
            </Text>
          )}
        </Stack>
      </Card>
      {canManage && (
        <>
          <Group>
            <Button variant="default" size="md" onClick={() => setOrderTimeOpened(true)}>
              주문 예정 시간 수정
            </Button>
            <Button variant="outline" color="red" size="md" onClick={() => setCancelOpened(true)}>
              겸상 취소
            </Button>
          </Group>
          <MealOrderTimeModal
            // 다시 불러온 시각으로 입력 초기값을 맞춘다
            key={meal.orderTime}
            mealId={meal.id}
            orderTime={meal.orderTime}
            opened={orderTimeOpened}
            onClose={() => setOrderTimeOpened(false)}
            onUpdated={() => {
              setOrderTimeOpened(false)
              setReloadKey((key) => key + 1)
            }}
          />
          <MealCancelModal
            mealId={meal.id}
            opened={cancelOpened}
            onClose={() => setCancelOpened(false)}
            onCanceled={() => {
              setCancelOpened(false)
              setReloadKey((key) => key + 1)
            }}
          />
        </>
      )}
    </Stack>
  )
}
