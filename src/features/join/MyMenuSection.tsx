import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Group, Loader, Modal, Stack, Text, TextInput, Title } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { addMenuItem, cancelParticipation, deleteMenuItem, getMyMenu, updateMenuItem } from './api'
import { validateMenuInput } from './menu-input'

type Props = {
  meal: MealDetail
  userId: string
  now: number
  // 참여 상태·잠금은 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75)
  onChanged: () => Promise<void>
}

// SCR-JOIN-02 / REQ-JOIN-02·03. 주문 확정은 후속 요구사항 범위.
export default function MyMenuSection({ meal, userId, now, onChanged }: Props) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getMyMenu>> | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [errors, setErrors] = useState<{ nameError: string | null; priceError: string | null }>({ nameError: null, priceError: null })
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editErrors, setEditErrors] = useState({ nameError: null as string | null, priceError: null as string | null })
  const [cancelOpened, setCancelOpened] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
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
    getMyMenu(meal.id, userId).then((next) => { if (!ignore) setResult(next) })
    return () => { ignore = true }
  }, [meal.id, userId])

  let locked: string | null = null
  if (meal.status === 'canceled') locked = '취소된 겸상입니다'
  else if (meal.status === 'ordered' || meal.status === 'settling') locked = '주문이 마감되어 변경할 수 없습니다'
  else if (meal.status === 'ordering' || new Date(meal.orderTime).getTime() <= now) locked = '주문 예정 시간이 되어 메뉴와 참여가 잠겼습니다'
  else if (meal.myConfirmedAt) locked = '주문 확정 후에는 메뉴 변경과 참여 취소를 할 수 없습니다'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || locked || !result?.data) return
    if (new Date(meal.orderTime).getTime() <= Date.now()) {
      await onChanged()
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
    const saved = await addMenuItem(meal.id, name, price)
    // 저장 성공일 때만 입력 초기화. 재조회 실패 시 이전 목록·합계를 성공 결과로 표시하지 않는다.
    if (!saved.error) { setName(''); setPrice('') }
    setActionError(saved.error)
    setResult(null)
    // 잠금·제외 여부는 부모가 다시 조회한다. 참여자가 아니게 되면 이 영역은 사라진다
    await onChanged()
    setResult(await getMyMenu(meal.id, userId))
    focusAfterSave.current = !saved.error
    setSaving(false)
    inFlight.current = false
  }

  async function handleChangeMenu(itemId: string, remove: boolean, requestedAt: number) {
    if (inFlight.current || locked || !result?.data) return
    if (new Date(meal.orderTime).getTime() <= requestedAt) { await onChanged(); return }
    if (!remove) {
      const input = validateMenuInput(editName, editPrice)
      setEditErrors(input)
      if (input.nameError || input.priceError) return
    }
    inFlight.current = true
    setSaving(true)
    setActionError(null)
    const changed = remove ? await deleteMenuItem(meal.id, userId, itemId)
      : await updateMenuItem(meal.id, userId, itemId, editName, editPrice)
    if (!changed.error) setEditingId(null)
    setActionError(changed.error)
    setResult(null)
    await onChanged()
    setResult(await getMyMenu(meal.id, userId))
    setSaving(false)
    inFlight.current = false
  }

  async function handleCancel() {
    if (inFlight.current || locked || meal.isHost) return
    if (new Date(meal.orderTime).getTime() <= Date.now()) { await onChanged(); return }
    inFlight.current = true
    setSaving(true)
    setCancelError(null)
    const canceled = await cancelParticipation(meal.id, userId)
    setCancelError(canceled.error)
    if (!canceled.error) setCancelOpened(false)
    await onChanged()
    setSaving(false)
    inFlight.current = false
  }

  const items = result?.data
  return (
    <Card p="lg" bg="white">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={2}>내 메뉴</Title>
          <Badge variant="light">{meal.myConfirmedAt ? '확정됨' : '미확정'}</Badge>
        </Group>
        {locked && <Text role="status" c="dimmed">{locked}</Text>}
        {!result ? <Group role="status"><Loader size="sm" aria-hidden /><Text>내 메뉴를 불러오는 중입니다</Text></Group>
          : result.error ? <Alert color="red" role="alert">{result.error}</Alert>
          : items && <>
            {!locked && !meal.isHost && items.length === 0 && (
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
                {items.map((item) => <Stack component="li" key={item.id} gap="xs">
                  {editingId === item.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); void handleChangeMenu(item.id, false, Date.now()) }} noValidate>
                      <Stack gap="xs">
                        <TextInput label="수정 메뉴명" value={editName} onChange={(event) => setEditName(event.currentTarget.value)}
                          error={editErrors.nameError} disabled={Boolean(locked) || saving} autoFocus />
                        <TextInput label="수정 금액 (원)" inputMode="decimal" value={editPrice} onChange={(event) => setEditPrice(event.currentTarget.value)}
                          error={editErrors.priceError} disabled={Boolean(locked) || saving} />
                        <Group>
                          <Button type="submit" disabled={Boolean(locked) || saving}>저장</Button>
                          <Button variant="outline" disabled={saving} onClick={() => setEditingId(null)}>수정 취소</Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : (
                    <Group justify="space-between" align="flex-start">
                      <Text style={{ flex: '1 1 160px', minWidth: 0, overflowWrap: 'anywhere' }}>{item.name}</Text>
                      <Text>{item.price.toLocaleString('ko-KR')}원</Text>
                      <Group gap="xs">
                        <Button variant="outline" disabled={Boolean(locked) || saving} onClick={() => {
                          setEditingId(item.id); setEditName(item.name); setEditPrice(String(item.price))
                          setEditErrors({ nameError: null, priceError: null })
                        }}>수정</Button>
                        <Button color="red.9" variant="light" disabled={Boolean(locked) || saving} onClick={() => void handleChangeMenu(item.id, true, Date.now())}>삭제</Button>
                      </Group>
                    </Group>
                  )}
                </Stack>)}
              </Stack>
            )}
            <Text fw={700} aria-live="polite">내 부담액 {items.reduce((total, item) => total + item.price, 0).toLocaleString('ko-KR')}원</Text>
          </>}
        {meal.isHost ? <Text c="dimmed">Host는 참여를 취소할 수 없습니다. Host 넘기기 또는 겸상 취소를 이용해 주세요</Text> : <>
          <Text c="dimmed">참여를 취소하면 입력한 메뉴도 삭제됩니다</Text>
          <Button color="red.9" variant="outline" disabled={Boolean(locked) || saving} onClick={() => { setCancelError(null); setCancelOpened(true) }}>참여 취소</Button>
        </>}
        <Modal opened={cancelOpened} onClose={() => { if (!inFlight.current) setCancelOpened(false) }} title="참여 취소"
          closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving}>
          <Stack>
            <Text>참여를 취소하면 입력한 메뉴도 삭제됩니다</Text>
            {locked && <Text role="status">{locked}</Text>}
            {cancelError && <Alert color="red" role="alert">{cancelError}</Alert>}
            <Group justify="flex-end">
              <Button variant="outline" disabled={saving} onClick={() => setCancelOpened(false)}>돌아가기</Button>
              <Button color="red.9" loading={saving} disabled={Boolean(locked) || meal.isHost} onClick={() => void handleCancel()}>참여 취소</Button>
            </Group>
          </Stack>
        </Modal>
        {actionError && <Alert color="red" role="alert">{actionError}</Alert>}
      </Stack>
    </Card>
  )
}
