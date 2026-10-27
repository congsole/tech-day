import { useEffect, useState } from 'react'
import { Badge, Button, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { getRecruitingMeals, type RecruitingMeal } from './api'
import { MEAL_TYPE_LABEL } from './labels'

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
      <Group justify="space-between">
        <Title order={1}>모집중인 겸상</Title>
        <Button component={Link} to="/meals/new" size="md">
          겸상 열기
        </Button>
      </Group>
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
