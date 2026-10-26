import { useEffect, useState } from 'react'
import { Badge, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { getRecruitingMeals, type RecruitingMeal } from './api'

// 유형 표시 이름. docs/common/domain.md 용어집 유형
const MEAL_TYPE_LABEL: Record<RecruitingMeal['type'], string> = {
  dine: '식사',
  delivery: '배달',
}

// REQ-MEAL-04 모집중 겸상 목록
export default function MealListPage() {
  // null: 불러오는 중
  const [result, setResult] = useState<{ error: string | null; meals: RecruitingMeal[] } | null>(null)

  useEffect(() => {
    let ignore = false
    getRecruitingMeals().then((next) => {
      if (!ignore) setResult(next)
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <Stack>
      <Title order={1}>모집중인 겸상</Title>
      {result === null ? (
        <Center py="xl">
          <Loader aria-label="겸상 목록 불러오는 중" />
        </Center>
      ) : result.error ? (
        <Text c="var(--mantine-color-error)">{result.error}</Text>
      ) : result.meals.length === 0 ? (
        <Text c="dimmed">모집중인 겸상이 없습니다.</Text>
      ) : (
        result.meals.map((meal) => (
          <Card key={meal.id} component={Link} to={`/meals/${meal.id}`} p="md" bg="white">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Text fw={600} lineClamp={2}>
                  {meal.title}
                </Text>
                <Badge variant="light" style={{ flexShrink: 0 }}>
                  {MEAL_TYPE_LABEL[meal.type]}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {meal.memberCount}/{meal.capacity}명
              </Text>
            </Stack>
          </Card>
        ))
      )}
    </Stack>
  )
}
