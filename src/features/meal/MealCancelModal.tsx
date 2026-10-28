import { useState, type FormEvent } from 'react'
import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { cancelMeal } from './api'

type Props = {
  mealId: string
  opened: boolean
  // 대화상자가 열린 채 주문 예정 시간이 지남
  closed: boolean
  onClose: () => void
  onCanceled: () => void
}

// REQ-MEAL-06 겸상 취소 대화상자 (SCR-MEAL-CANCEL)
export default function MealCancelModal({ mealId, opened, closed, onClose, onCanceled }: Props) {
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
      setError('취소 사유를 입력해 주세요.')
      return
    }
    setLoading(true)
    const result = await cancelMeal(mealId, trimmed)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setReason('')
    setError(null)
    onCanceled()
  }

  return (
    <Modal opened={opened} onClose={close} title="겸상 취소" centered>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <Text size="sm">취소하면 되돌릴 수 없고, 겸상이 목록에서 사라집니다.</Text>
          <Textarea
            label="취소 사유"
            withAsterisk
            size="md"
            autosize
            minRows={3}
            data-autofocus
            value={reason}
            onChange={(e) => {
              setReason(e.currentTarget.value)
              setError(null)
            }}
            error={closed ? '모집중일 때만 겸상을 취소할 수 있습니다.' : error}
            disabled={loading}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" size="md" onClick={close} disabled={loading}>
              돌아가기
            </Button>
            <Button type="submit" color="red" size="md" loading={loading} disabled={closed}>
              겸상 취소
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
