import { useEffect, useState } from 'react'
import { Anchor, Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { MEAL_STATUS_LABEL, MEAL_TYPE_LABEL } from './labels'
import MealCancelModal from './MealCancelModal'
import MealOrderTimeModal from './MealOrderTimeModal'
import PlaceItem from '../notice/PlaceItem'

const orderTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

// setTimeout이 다룰 수 있는 최대 지연(약 24일). 그보다 먼 주문 예정 시간은 타이머를 걸지 않는다
const MAX_TIMEOUT = 2 ** 31 - 1

// 겸상 상세의 meal 섹션. 겸상 정보(REQ-MEAL-03)와 Host 관리 동작(REQ-MEAL-05~07)
// 집합/수령 장소 항목은 이 섹션 안에 들어온다(SCR-MEAL-INFO). 표시·수정 UI는 notice의 PlaceItem(REQ-NOTICE-02)
type Props = {
  meal: MealDetail
  // 겸상 정보는 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75)
  onChanged: () => Promise<void>
}

export default function MealInfoSection({ meal, onChanged }: Props) {
  // 처음 표시한 시각. 이미 지난 주문 예정 시간을 판단하는 기준
  const [shownAt] = useState(() => Date.now())
  const [cancelOpened, setCancelOpened] = useState(false)
  const [orderTimeOpened, setOrderTimeOpened] = useState(false)
  // 상세를 보는 중 지나간 주문 예정 시간. 이 값과 같으면 겸상이 닫힌 것으로 본다
  const [passedOrderTime, setPassedOrderTime] = useState<string | null>(null)
  const orderTime = meal.orderTime

  // 주문 예정 시간이 되면 새로 고침 없이 Host 관리 동작을 닫는다
  useEffect(() => {
    const delay = new Date(orderTime).getTime() - Date.now()
    if (delay <= 0 || delay > MAX_TIMEOUT) return
    const timer = setTimeout(() => setPassedOrderTime(orderTime), delay)
    return () => clearTimeout(timer)
  }, [orderTime])

  // 열려 있음: 모집중이고 주문 예정 시간 전. db-schema.md is_meal_open과 같은 기준
  const isOpen =
    meal.status === 'recruiting' && new Date(meal.orderTime).getTime() > shownAt && passedOrderTime !== meal.orderTime
  const isHost = meal.isHost
  const canManage = isHost && isOpen

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
            <PlaceItem meal={meal} onChanged={onChanged} />
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
        <Group>
          <Button variant="default" size="md" onClick={() => setOrderTimeOpened(true)}>
            주문 예정 시간 수정
          </Button>
          <Button variant="outline" color="red" size="md" onClick={() => setCancelOpened(true)}>
            겸상 취소
          </Button>
        </Group>
      )}
      {/* 열린 대화상자는 겸상이 닫혀도 입력을 유지하도록 Host에게는 계속 렌더링한다 */}
      {isHost && (
        <>
          <MealOrderTimeModal
            // 다시 불러온 시각으로 입력 초기값을 맞춘다
            key={meal.orderTime}
            mealId={meal.id}
            orderTime={meal.orderTime}
            opened={orderTimeOpened}
            closed={!isOpen}
            onClose={() => setOrderTimeOpened(false)}
            onUpdated={() => {
              setOrderTimeOpened(false)
              onChanged()
            }}
          />
          <MealCancelModal
            mealId={meal.id}
            opened={cancelOpened}
            closed={!isOpen}
            onClose={() => setCancelOpened(false)}
            onCanceled={() => {
              setCancelOpened(false)
              onChanged()
            }}
          />
        </>
      )}
    </Stack>
  )
}
