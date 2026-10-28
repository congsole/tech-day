import { useEffect, useState } from 'react'
import { Anchor, Badge, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useParams } from 'react-router'
import { getMealDetail, type MealDetail } from './api'
import { MEAL_STATUS_LABEL, MEAL_TYPE_LABEL } from './labels'

const orderTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

// 겸상 상세의 meal 섹션. 겸상 정보(REQ-MEAL-03)와 Host 관리 동작(REQ-MEAL-05~07)
// 집합/수령 장소 항목은 이 섹션 안에 들어온다(SCR-MEAL-INFO). 표시·수정 UI는 REQ-NOTICE-02 구현 후 붙인다.
export default function MealInfoSection() {
  const { mealId } = useParams()
  // null: 불러오는 중
  const [result, setResult] = useState<{ mealId: string; error: string | null; meal: MealDetail | null } | null>(null)

  useEffect(() => {
    if (!mealId) return
    let ignore = false
    getMealDetail(mealId).then((next) => {
      if (!ignore) setResult({ mealId, ...next })
    })
    return () => {
      ignore = true
    }
  }, [mealId])

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
  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Group gap="xs">
          <Badge variant="light">{MEAL_TYPE_LABEL[meal.type]}</Badge>
          <Badge variant="outline" color="gray">
            {MEAL_STATUS_LABEL[meal.status]}
          </Badge>
        </Group>
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
  )
}
