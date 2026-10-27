import { useState, type FormEvent } from 'react'
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'
import { updateOrderTime } from './api'

type Props = {
  mealId: string
  // 현재 주문 예정 시간 (ISO 문자열)
  orderTime: string
  opened: boolean
  onClose: () => void
  onUpdated: () => void
}

// datetime-local 입력값 (로컬 시각 YYYY-MM-DDTHH:mm)
function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// REQ-MEAL-07 주문 예정 시간 수정 대화상자 (SCR-MEAL-ORDER-TIME)
export default function MealOrderTimeModal({ mealId, orderTime, opened, onClose, onUpdated }: Props) {
  const [value, setValue] = useState(() => toLocalInput(orderTime))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function close() {
    if (loading) return
    setValue(toLocalInput(orderTime))
    setError(null)
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value || new Date(value).getTime() <= Date.now()) {
      setError('현재 이후 시각을 입력해 주세요.')
      return
    }
    setLoading(true)
    const result = await updateOrderTime(mealId, new Date(value))
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setError(null)
    onUpdated()
  }

  return (
    <Modal opened={opened} onClose={close} title="주문 예정 시간 수정" centered>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <TextInput
            label="주문 예정 시간"
            withAsterisk
            type="datetime-local"
            size="md"
            data-autofocus
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value)
              setError(null)
            }}
            error={error}
            description="이 시각이 되면 참여·메뉴 변경이 잠깁니다."
            disabled={loading}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" size="md" onClick={close} disabled={loading}>
              돌아가기
            </Button>
            <Button type="submit" size="md" loading={loading}>
              저장
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
