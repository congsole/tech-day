import { useCallback, useEffect, useRef, useState } from 'react'
import { Anchor, Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { useOutletContext } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import type { MealDetail } from '../../shared/meal-detail-api'
import { getLatestHandover, subscribeHandover, type Handover } from './api'
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

// setTimeout이 다룰 수 있는 최대 지연(약 24일). 그보다 먼 주문 예정 시간은 타이머를 걸지 않는다
const MAX_TIMEOUT = 2 ** 31 - 1

// 겸상 상세의 meal 섹션. 겸상 정보(REQ-MEAL-03), Host 관리 동작(REQ-MEAL-05~07), Host 넘기기 응답(REQ-MEAL-08~09)
// 집합/수령 장소 항목은 이 섹션 안에 들어온다(SCR-MEAL-INFO). 표시·수정 UI는 REQ-NOTICE-02 구현 후 붙인다.
type Props = {
  meal: MealDetail
  // 겸상 정보는 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75)
  onChanged: () => Promise<void>
}

export default function MealInfoSection({ meal, onChanged }: Props) {
  const { userId } = useOutletContext<AuthContext>()
  // 처음 표시한 시각. 이미 지난 주문 예정 시간을 판단하는 기준
  const [shownAt] = useState(() => Date.now())
  const [cancelOpened, setCancelOpened] = useState(false)
  const [orderTimeOpened, setOrderTimeOpened] = useState(false)
  const [handoverOpened, setHandoverOpened] = useState(false)
  // 상세를 보는 중 지나간 주문 예정 시간. 이 값과 같으면 겸상이 닫힌 것으로 본다
  const [passedOrderTime, setPassedOrderTime] = useState<string | null>(null)
  // Host 넘기기는 meal 섹션만 쓰는 데이터라 여기서 조회한다. null: 불러오는 중
  const [loadedHandover, setLoadedHandover] = useState<{ error: string | null; handover: Handover | null } | null>(null)
  // 마지막으로 보낸 조회 번호. 조회가 겹치면 늦게 도착한 이전 응답이 최신 상태를 덮지 않게 한다
  const latestHandoverLoad = useRef(0)
  const orderTime = meal.orderTime

  const loadHandover = useCallback(async () => {
    const request = ++latestHandoverLoad.current
    const latest = await getLatestHandover(meal.id)
    if (request === latestHandoverLoad.current) setLoadedHandover(latest)
  }, [meal.id])

  useEffect(() => {
    void loadHandover()
  }, [loadHandover])

  // 다른 사용자의 넘기기 요청·거절·수락을 새로 고침 없이 반영한다(#81)
  const pendingHandoverId = loadedHandover?.handover?.status === 'pending' ? loadedHandover.handover.id : null
  useEffect(
    () => subscribeHandover(meal.id, pendingHandoverId, () => void loadHandover()),
    [meal.id, pendingHandoverId, loadHandover],
  )

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
  // 넘기기 정보를 처음 불러오기 전에는 대기 여부를 모르므로 Host 관리 동작을 보이지 않는다
  const canManage = isHost && isOpen && loadedHandover !== null
  const handover = loadedHandover?.handover ?? null
  const handoverPending = handover?.status === 'pending'
  // Host를 뺀 참여자 수. 넘기기 대상
  const otherMemberCount = meal.memberCount - 1
  // 넘기기·취소·시간 수정은 겸상 정보(공유)와 넘기기 정보를 함께 바꿀 수 있다
  const reload = () => {
    void loadHandover()
    void onChanged()
  }

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
      {loadedHandover?.error && (
        <Text size="sm" c="var(--mantine-color-error)">
          {loadedHandover.error}
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
