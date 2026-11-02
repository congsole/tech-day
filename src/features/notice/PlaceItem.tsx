import { useState, type FormEvent } from 'react'
import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { updatePlace } from './api'

type Props = {
  meal: MealDetail
  // 장소는 공유 데이터라 부모(MealDetailPage)가 다시 조회한다(#75)
  onChanged: () => Promise<void>
}

// 겸상 정보 안의 집합/수령 장소 항목(REQ-NOTICE-02). 위치는 SCR-MEAL-INFO, 모양과 동작은
// docs/features/notice/screen.md SCR-NOTICE-03
export default function PlaceItem({ meal, onChanged }: Props) {
  const label = meal.type === 'dine' ? '집합 장소' : '수령 장소'
  // 수정은 RLS와 같이 Host이고 모집중일 때만 연다
  const canEdit = meal.isHost && meal.status === 'recruiting'
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setValue(meal.place)
    setError(null)
    setEditing(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!value.trim()) {
      setError('장소를 입력하세요.')
      return
    }
    setSaving(true)
    const saved = await updatePlace(meal.id, value)
    if (saved.error) {
      setError(saved.error)
    } else {
      await onChanged()
      setEditing(false)
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit}>
        <Stack gap="xs">
          <TextInput
            label={label}
            autoFocus
            value={value}
            onChange={(event) => {
              setValue(event.currentTarget.value)
              setError(null)
            }}
            error={error}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setEditing(false)} disabled={saving}>
              취소
            </Button>
            <Button type="submit" loading={saving}>
              저장
            </Button>
          </Group>
        </Stack>
      </form>
    )
  }

  return (
    <Group gap="xs" wrap="nowrap" align="center">
      <Text style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
        {label} {meal.place}
      </Text>
      {canEdit && (
        <Button variant="default" onClick={startEdit}>
          수정
        </Button>
      )}
    </Group>
  )
}
