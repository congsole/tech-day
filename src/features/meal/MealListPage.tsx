import { useEffect, useState, type ReactNode } from 'react'
import { Badge, Button, Card, Center, Group, Loader, Stack, Tabs, Text, Title, rem } from '@mantine/core'
import { Link, useOutletContext, useSearchParams } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import { getMyMeals, getRecruitingMeals, type MyMeal, type RecruitingMeal } from './api'
import { MEAL_STATUS_LABEL, MEAL_TYPE_LABEL } from './labels'

const orderTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

// 탭마다 따로 불러온다. 한 탭이 실패해도 다른 탭은 표시한다 (SCR-MEAL-LIST)
type Loaded<T> = { error: string | null; meals: T[] } | null

// 주소의 탭 값. 없거나 모르는 값이면 모집중 탭을 보여준다
const MINE_TAB = 'mine'
const RECRUITING_TAB = 'recruiting'

// REQ-MEAL-04 모집중 겸상 목록, REQ-MEAL-10 내 겸상
export default function MealListPage() {
  const { userId } = useOutletContext<AuthContext>()
  // 선택한 탭은 주소에 남겨 상세에서 뒤로 가기로 돌아와도 유지한다
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === MINE_TAB ? MINE_TAB : RECRUITING_TAB
  // null: 불러오는 중
  const [recruiting, setRecruiting] = useState<Loaded<RecruitingMeal>>(null)
  const [mine, setMine] = useState<Loaded<MyMeal>>(null)

  useEffect(() => {
    let ignore = false
    getRecruitingMeals().then((next) => {
      if (!ignore) setRecruiting(next)
    })
    getMyMeals(userId).then((next) => {
      if (!ignore) setMine(next)
    })
    return () => {
      ignore = true
    }
  }, [userId])

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>겸상 목록</Title>
        <Button component={Link} to="/meals/new" size="md">
          겸상 열기
        </Button>
      </Group>
      <Tabs
        value={tab}
        onChange={(next) => setSearchParams(next === MINE_TAB ? { tab: MINE_TAB } : {}, { replace: true })}
        styles={{ tab: { minHeight: rem(44) } }}
      >
        <Tabs.List grow>
          <Tabs.Tab value={RECRUITING_TAB}>모집중인 겸상</Tabs.Tab>
          <Tabs.Tab value={MINE_TAB}>내 겸상</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value={RECRUITING_TAB} pt="md">
          <MealCards
            result={recruiting}
            loadingLabel="겸상 목록 불러오는 중"
            emptyText="모집중인 겸상이 없습니다."
            render={(meal) => (
              <>
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
              </>
            )}
          />
        </Tabs.Panel>
        <Tabs.Panel value={MINE_TAB} pt="md">
          <MealCards
            result={mine}
            loadingLabel="내 겸상 불러오는 중"
            emptyText="참여 중인 겸상이 없습니다."
            render={(meal) => (
              <>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Text fw={600} lineClamp={2}>
                    {meal.title}
                  </Text>
                  <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Badge variant="light">{MEAL_TYPE_LABEL[meal.type]}</Badge>
                    <Badge variant="outline" color="gray">
                      {MEAL_STATUS_LABEL[meal.status]}
                    </Badge>
                  </Group>
                </Group>
                <Text size="sm" c="dimmed">
                  {orderTimeFormat.format(new Date(meal.orderTime))}
                </Text>
              </>
            )}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

type MealCardsProps<T> = {
  result: Loaded<T>
  loadingLabel: string
  emptyText: string
  render: (meal: T) => ReactNode
}

// 카드 전체를 누르면 해당 겸상 상세로 이동한다
function MealCards<T extends { id: string }>({ result, loadingLabel, emptyText, render }: MealCardsProps<T>) {
  if (result === null) {
    return (
      <Center py="xl">
        <Loader aria-label={loadingLabel} />
      </Center>
    )
  }
  if (result.error) return <Text c="var(--mantine-color-error)">{result.error}</Text>
  if (result.meals.length === 0) return <Text c="dimmed">{emptyText}</Text>
  return (
    <Stack>
      {result.meals.map((meal) => (
        <Card key={meal.id} component={Link} to={`/meals/${meal.id}`} p="md" bg="white">
          <Stack gap="xs">{render(meal)}</Stack>
        </Card>
      ))}
    </Stack>
  )
}
