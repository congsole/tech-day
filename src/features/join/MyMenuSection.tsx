import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core'
import { addMenuItem, getMyMenu, type Participation } from './api'
import { validateMenuInput } from './menu-input'

type Props = {
  view: Participation
  userId: string
  now: number
  refreshParticipation: () => Promise<Participation | null>
}

// SCR-JOIN-02 / REQ-JOIN-02. 수정·삭제·확정·참여 취소는 후속 요구사항 범위.
export default function MyMenuSection({ view, userId, now, refreshParticipation }: Props) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getMyMenu>> | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [errors, setErrors] = useState<{ nameError: string | null; priceError: string | null }>({ nameError: null, priceError: null })
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const priceInput = useRef<HTMLInputElement>(null)
  const focusAfterSave = useRef(false)

  useEffect(() => {
    if (!saving && focusAfterSave.current) {
      nameInput.current?.focus()
      focusAfterSave.current = false
    }
  }, [saving])

  useEffect(() => {
    let ignore = false
    getMyMenu(view.id, userId).then((next) => { if (!ignore) setResult(next) })
    return () => { ignore = true }
  }, [view.id, userId])

  let locked: string | null = null
  if (view.status === 'canceled') locked = '취소된 겸상입니다'
  else if (view.status === 'ordered' || view.status === 'settling') locked = '주문이 마감되어 변경할 수 없습니다'
  else if (view.status === 'ordering' || new Date(view.order_time).getTime() <= now) locked = '주문 예정 시간이 되어 메뉴와 참여가 잠겼습니다'
  else if (view.confirmedAt) locked = '주문 확정 후에는 메뉴 변경과 참여 취소를 할 수 없습니다'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || locked || !result?.data) return
    if (new Date(view.order_time).getTime() <= Date.now()) {
      await refreshParticipation()
      return
    }
    const input = validateMenuInput(name, price)
    setErrors(input)
    if (input.nameError || input.priceError) {
      const invalidInput = input.nameError ? nameInput : priceInput
      invalidInput.current?.focus()
      return
    }
    inFlight.current = true
    setSaving(true)
    setActionError(null)
    const saved = await addMenuItem(view.id, name, price)
    // 저장 성공일 때만 입력 초기화. 재조회 실패 시 이전 목록·합계를 성공 결과로 표시하지 않는다.
    if (!saved.error) { setName(''); setPrice('') }
    setActionError(saved.error)
    setResult(null)
    const latest = await refreshParticipation()
    if (latest?.isMember) setResult(await getMyMenu(view.id, userId))
    focusAfterSave.current = !saved.error
    setSaving(false)
    inFlight.current = false
  }

  const items = result?.data
  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={2}>내 메뉴</Title>
          <Badge variant="light">{view.confirmedAt ? '확정됨' : '미확정'}</Badge>
        </Group>
        {locked && <Text role="status" c="dimmed">{locked}</Text>}
        {!result ? <Group role="status"><Loader size="sm" aria-hidden /><Text>내 메뉴를 불러오는 중입니다</Text></Group>
          : result.error ? <Alert color="red" role="alert">{result.error}</Alert>
          : items && <>
            {!locked && view.host_id !== userId && items.length === 0 && (
              <Alert color="orange">주문 예정 시간까지 메뉴를 입력하지 않으면 참여자에서 제외됩니다</Alert>
            )}
            <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: 560, marginInline: 'auto' }}>
              <Stack gap="sm">
                <TextInput ref={nameInput} label="메뉴명" value={name} onChange={(event) => setName(event.currentTarget.value)}
                  error={errors.nameError} disabled={Boolean(locked) || saving} size="md" />
                <TextInput ref={priceInput} label="금액 (원)" inputMode="decimal" value={price} onChange={(event) => setPrice(event.currentTarget.value)}
                  error={errors.priceError} disabled={Boolean(locked) || saving} size="md" />
                <Button type="submit" size="md" mih={44} loading={saving} disabled={Boolean(locked)}>메뉴 추가</Button>
              </Stack>
            </form>
            {items.length === 0 ? <Text c="dimmed">아직 입력한 메뉴가 없습니다</Text> : (
              <Stack component="ul" gap="sm" p={0} m={0} style={{ listStyle: 'none' }}>
                {items.map((item) => <Group component="li" key={item.id} justify="space-between" align="flex-start">
                  <Text style={{ flex: '1 1 160px', minWidth: 0, overflowWrap: 'anywhere' }}>{item.name}</Text>
                  <Text>{item.price.toLocaleString('ko-KR')}원</Text>
                </Group>)}
              </Stack>
            )}
            <Text fw={700} aria-live="polite">내 부담액 {items.reduce((total, item) => total + item.price, 0).toLocaleString('ko-KR')}원</Text>
          </>}
        {actionError && <Alert color="red" role="alert">{actionError}</Alert>}
      </Stack>
    </Card>
  )
}
