import { useState } from 'react'
import { Button, Card, Group, Modal, Stack, Text, Title } from '@mantine/core'
import { acceptHandover, rejectHandover, type Handover } from './api'

type Props = {
  handover: Handover
  // 이미 거절함
  rejected: boolean
  // 겸상이 열려 있음 (모집중이고 주문 예정 시간 전)
  isOpen: boolean
  // 수락·거절 성공 후 겸상 정보를 다시 불러온다
  onChanged: () => void
}

// REQ-MEAL-08·09 Host 넘기기 응답 상자 (SCR-MEAL-HANDOVER-RESPONSE). Host가 아닌 참여자에게 보인다.
export default function MealHandoverResponse({ handover, rejected, isOpen, onChanged }: Props) {
  const [confirmOpened, setConfirmOpened] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  // 이미 닫힌 요청이라 응답 버튼을 숨김
  const [closed, setClosed] = useState(false)

  async function respond(kind: 'accept' | 'reject') {
    setLoading(kind)
    setError(null)
    const result = kind === 'accept' ? await acceptHandover(handover.id) : await rejectHandover(handover.id)
    setLoading(null)
    setConfirmOpened(false)
    if (result.error) {
      setError(result.error)
      setClosed(result.closed)
      return
    }
    onChanged()
  }

  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Title order={2}>Host 넘기기 요청</Title>
        <Text style={{ whiteSpace: 'pre-wrap' }}>{handover.reason}</Text>
        <Text size="sm" c="dimmed">
          수락하면 이 겸상의 Host가 됩니다. 주문 예정 시간까지 아무도 수락하지 않거나 모두 거절하면 겸상이 취소됩니다.
        </Text>
        {rejected ? (
          <Text role="status">거절했습니다.</Text>
        ) : (
          isOpen &&
          !closed && (
            <Group>
              <Button size="md" onClick={() => setConfirmOpened(true)} disabled={loading !== null}>
                수락
              </Button>
              <Button
                variant="default"
                size="md"
                onClick={() => respond('reject')}
                loading={loading === 'reject'}
                disabled={loading === 'accept'}
              >
                거절
              </Button>
            </Group>
          )
        )}
        {error && (
          <Text size="sm" c="var(--mantine-color-error)">
            {error}
          </Text>
        )}
      </Stack>
      <Modal
        opened={confirmOpened}
        onClose={() => loading === null && setConfirmOpened(false)}
        title="Host를 넘겨받을까요?"
        centered
      >
        <Group justify="flex-end" gap="xs">
          <Button variant="default" size="md" onClick={() => setConfirmOpened(false)} disabled={loading !== null}>
            돌아가기
          </Button>
          <Button size="md" onClick={() => respond('accept')} loading={loading === 'accept'} disabled={!isOpen}>
            수락
          </Button>
        </Group>
      </Modal>
    </Card>
  )
}
