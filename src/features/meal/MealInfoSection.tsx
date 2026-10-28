import { useEffect, useState } from 'react'
import { Anchor, Badge, Button, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useOutletContext, useParams } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import { getLatestHandover, getMealDetail, type Handover, type MealDetail } from './api'
import { MEAL_STATUS_LABEL, MEAL_TYPE_LABEL } from './labels'
import MealCancelModal from './MealCancelModal'
import MealHandoverModal from './MealHandoverModal'
import MealHandoverResponse from './MealHandoverResponse'
import MealOrderTimeModal from './MealOrderTimeModal'

const orderTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

type Loaded = {
  mealId: string
  loadedAt: number
  error: string | null
  meal: MealDetail | null
  handoverError: string | null
  handover: Handover | null
}

// setTimeout이 다룰 수 있는 최대 지연(약 24일). 그보다 먼 주문 예정 시간은 타이머를 걸지 않는다
const MAX_TIMEOUT = 2 ** 31 - 1

// 겸상 상세의 meal 섹션. 겸상 정보(REQ-MEAL-03), Host 관리 동작(REQ-MEAL-05~07), Host 넘기기 응답(REQ-MEAL-08~09)
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
  const [handoverOpened, setHandoverOpened] = useState(false)
  // 상세를 보는 중 지나간 주문 예정 시간. 이 값과 같으면 겸상이 닫힌 것으로 본다
  const [passedOrderTime, setPassedOrderTime] = useState<string | null>(null)
  const orderTime = result?.meal?.orderTime

  useEffect(() => {
    if (!mealId) return
    let ignore = false
    Promise.all([getMealDetail(mealId), getLatestHandover(mealId)]).then(([detail, latest]) => {
      if (ignore) return
      setResult({
        mealId,
        loadedAt: Date.now(),
        ...detail,
        handoverError: latest.error,
        handover: latest.handover,
      })
    })
    return () => {
      ignore = true
    }
  }, [mealId, reloadKey])

  // 주문 예정 시간이 되면 새로 고침 없이 Host 관리 동작을 닫는다
  useEffect(() => {
    if (!orderTime) return
    const delay = new Date(orderTime).getTime() - Date.now()
    if (delay <= 0 || delay > MAX_TIMEOUT) return
    const timer = setTimeout(() => setPassedOrderTime(orderTime), delay)
    return () => clearTimeout(timer)
  }, [orderTime])

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
  const isOpen =
    meal.status === 'recruiting' &&
    new Date(meal.orderTime).getTime() > result.loadedAt &&
    passedOrderTime !== meal.orderTime
  const isHost = meal.hostId === userId
  const canManage = isHost && isOpen
  const handover = result.handover
  const handoverPending = handover?.status === 'pending'
  // Host를 뺀 참여자 수. 넘기기 대상
  const otherMemberCount = meal.memberCount - 1
  const reload = () => setReloadKey((key) => key + 1)

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
          {meal.status === 'canceled' && !meal.cancelReason && handover?.status === 'failed' && (
            <Text c="var(--mantine-color-error)">Host 넘기기가 수락되지 않아 취소되었습니다.</Text>
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
      {result.handoverError && (
        <Text size="sm" c="var(--mantine-color-error)">
          {result.handoverError}
        </Text>
      )}
      {canManage && handoverPending && handover && (
        <Card p="lg" bg="white">
          <Stack gap="xs">
            <Title order={2}>Host 넘기기 대기 중</Title>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{handover.reason}</Text>
            <Text size="sm" c="dimmed">
              거절 {handover.rejectedUserIds.length}명 / 대상 {otherMemberCount}명
            </Text>
          </Stack>
        </Card>
      )}
      {!isHost && isOpen && handoverPending && handover && (
        <MealHandoverResponse
          key={handover.id}
          handover={handover}
          rejected={handover.rejectedUserIds.includes(userId)}
          isOpen={isOpen}
          onChanged={reload}
        />
      )}
      {canManage && (
        <Stack gap="xs">
          <Group>
            <Button
              variant="default"
              size="md"
              onClick={() => setOrderTimeOpened(true)}
              disabled={handoverPending}
            >
              주문 예정 시간 수정
            </Button>
            {!handoverPending && (
              <Button
                variant="default"
                size="md"
                onClick={() => setHandoverOpened(true)}
                disabled={otherMemberCount < 1}
              >
                Host 넘기기
              </Button>
            )}
            <Button variant="outline" color="red" size="md" onClick={() => setCancelOpened(true)}>
              겸상 취소
            </Button>
          </Group>
          {handoverPending && (
            <Text size="sm" c="dimmed">
              Host 넘기기 대기 중에는 주문 예정 시간을 수정할 수 없습니다.
            </Text>
          )}
          {!handoverPending && otherMemberCount < 1 && (
            <Text size="sm" c="dimmed">
              다른 참여자가 없으면 Host를 넘길 수 없습니다. 겸상 취소를 이용해 주세요.
            </Text>
          )}
        </Stack>
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
              reload()
            }}
          />
          <MealHandoverModal
            mealId={meal.id}
            opened={handoverOpened}
            closed={!isOpen}
            onClose={() => setHandoverOpened(false)}
            onRequested={() => {
              setHandoverOpened(false)
              reload()
            }}
          />
          <MealCancelModal
            mealId={meal.id}
            opened={cancelOpened}
            closed={!isOpen}
            onClose={() => setCancelOpened(false)}
            onCanceled={() => {
              setCancelOpened(false)
              reload()
            }}
          />
        </>
      )}
    </Stack>
  )
}
