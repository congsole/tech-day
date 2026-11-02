import { useState, type FormEvent } from 'react'
import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { requestHandover } from './api'

type Props = {
  mealId: string
  opened: boolean
  // 대화상자가 열린 채 주문 예정 시간이 지남
  closed: boolean
  onClose: () => void
  onRequested: () => void
}

// REQ-MEAL-05 Host 넘기기 대화상자 (SCR-MEAL-HANDOVER)
export default function MealHandoverModal({ mealId, opened, closed, onClose, onRequested }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function close() {
    if (loading) return
    setReason('')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (closed) return
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('넘기는 사유를 입력해 주세요.')
      return
    }
    setLoading(true)
    const result = await requestHandover(mealId, trimmed)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setReason('')
    setError(null)
    onRequested()
  }

  return (
    <Modal opened={opened} onClose={close} title="Host 넘기기" centered>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <Text size="sm">참여자 한 명이 수락하면 Host가 바뀌고, 내 참여와 메뉴는 삭제됩니다. 주문 예정 시간까지 아무도 수락하지 않거나 모두 거절하면 겸상이 취소됩니다.</Text>
          <Textarea
            label="넘기는 사유"
            withAsterisk
            size="md"
            autosize
            minRows={3}
            placeholder="메뉴 변경 등"
            data-autofocus
            value={reason}
            onChange={(e) => {
              setReason(e.currentTarget.value)
              setError(null)
            }}
            error={closed ? '모집중일 때만 Host를 넘길 수 있습니다.' : error}
            disabled={loading}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" size="md" onClick={close} disabled={loading}>
              돌아가기
            </Button>
            <Button type="submit" size="md" loading={loading} disabled={closed}>
              넘기기 요청
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
