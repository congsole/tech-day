import { useState } from 'react'
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'

type Props = {
  opened: boolean
  // 제목과 확인 버튼 문구. SCR-SETTLE-ORDER-CONFIRM·SCR-SETTLE-START-CONFIRM
  title: string
  message: string
  onClose: () => void
  // 실패하면 대화상자에 표시할 안내를 돌려준다
  onConfirm: () => Promise<{ error: string | null }>
}

// 되돌릴 수 없는 상태 전환의 확인 대화상자. 확인 버튼을 눌러야 요청한다.
export default function ConfirmTransitionModal({ opened, title, message, onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    if (submitting) return
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const result = await onConfirm()
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <Modal opened={opened} onClose={close} title={title} closeOnClickOutside={!submitting} closeOnEscape={!submitting}
      withCloseButton={!submitting}>
      <Stack>
        <Text>{message}</Text>
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="outline" disabled={submitting} onClick={close}>돌아가기</Button>
          <Button loading={submitting} onClick={() => void handleConfirm()}>{title}</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
