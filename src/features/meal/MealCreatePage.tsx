import { useState, type FormEvent } from 'react'
import { Box, Button, Card, Group, NumberInput, Radio, Stack, Text, Textarea, TextInput, Title } from '@mantine/core'
import { useNavigate } from 'react-router'
import { createMeal, type MealType } from './api'
import { MEAL_TYPE_LABEL } from './labels'

type Field = 'title' | 'type' | 'restaurantName' | 'menuUrl' | 'place' | 'orderTime' | 'capacity'
type Errors = Partial<Record<Field, string>>

function optional(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// REQ-MEAL-03 겸상 열기
export default function MealCreatePage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<MealType | ''>('')
  const [restaurantName, setRestaurantName] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [place, setPlace] = useState('')
  // datetime-local 입력값 (로컬 시각 YYYY-MM-DDTHH:mm)
  const [orderTime, setOrderTime] = useState('')
  const [capacity, setCapacity] = useState<number | string>('')
  const [memo, setMemo] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): Errors {
    const next: Errors = {}
    if (!title.trim()) next.title = '제목을 입력해 주세요.'
    if (!type) next.type = '유형을 선택해 주세요.'
    if (!restaurantName.trim()) next.restaurantName = '식당/가게명을 입력해 주세요.'
    if (!place.trim()) next.place = '집합/수령 장소를 입력해 주세요.'
    const url = menuUrl.trim()
    if (url && !isHttpUrl(url)) next.menuUrl = 'http:// 또는 https://로 시작하는 주소를 입력해 주세요.'
    if (!orderTime) next.orderTime = '주문 예정 시간을 입력해 주세요.'
    else if (new Date(orderTime).getTime() <= Date.now()) next.orderTime = '현재 이후 시각을 입력해 주세요.'
    if (capacity === '') next.capacity = '정원을 입력해 주세요.'
    else if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) next.capacity = '1 이상의 정수를 입력해 주세요.'
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    setSubmitError(null)
    if (Object.keys(next).length > 0 || !type) return

    setLoading(true)
    const result = await createMeal({
      title: title.trim(),
      type,
      restaurantName: restaurantName.trim(),
      menuUrl: optional(menuUrl),
      place: place.trim(),
      orderTime: new Date(orderTime),
      capacity: Number(capacity),
      memo: optional(memo),
    })
    setLoading(false)
    if (result.error || !result.mealId) {
      setSubmitError(result.error)
      return
    }
    navigate(`/meals/${result.mealId}`, { replace: true })
  }

  return (
    <Box maw={560} mx="auto">
      <Card p="lg" bg="white">
        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <Title order={1}>겸상 열기</Title>
            <TextInput
              label="제목"
              withAsterisk
              size="md"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              error={errors.title}
              disabled={loading}
            />
            <Radio.Group
              label="유형"
              withAsterisk
              value={type}
              onChange={(value) => setType(value as MealType)}
              error={errors.type}
            >
              <Group mt={4}>
                {(Object.keys(MEAL_TYPE_LABEL) as MealType[]).map((value) => (
                  <Radio key={value} value={value} label={MEAL_TYPE_LABEL[value]} disabled={loading} />
                ))}
              </Group>
            </Radio.Group>
            <TextInput
              label="식당/가게명"
              withAsterisk
              size="md"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.currentTarget.value)}
              error={errors.restaurantName}
              disabled={loading}
            />
            <TextInput
              label="가게 메뉴판 링크 (선택)"
              type="url"
              placeholder="https://"
              size="md"
              value={menuUrl}
              onChange={(e) => setMenuUrl(e.currentTarget.value)}
              error={errors.menuUrl}
              disabled={loading}
            />
            <TextInput
              label="집합/수령 장소"
              withAsterisk
              size="md"
              value={place}
              onChange={(e) => setPlace(e.currentTarget.value)}
              error={errors.place}
              disabled={loading}
            />
            <TextInput
              label="주문 예정 시간"
              withAsterisk
              type="datetime-local"
              size="md"
              value={orderTime}
              onChange={(e) => setOrderTime(e.currentTarget.value)}
              error={errors.orderTime}
              description="이 시각이 되면 참여·메뉴 변경이 잠깁니다."
              disabled={loading}
            />
            <NumberInput
              label="정원"
              withAsterisk
              description="Host 본인을 포함한 최대 인원입니다."
              size="md"
              min={1}
              allowDecimal={false}
              allowNegative={false}
              value={capacity}
              onChange={setCapacity}
              error={errors.capacity}
              disabled={loading}
            />
            <Textarea
              label="메모 (선택)"
              size="md"
              autosize
              minRows={2}
              value={memo}
              onChange={(e) => setMemo(e.currentTarget.value)}
              disabled={loading}
            />
            {submitError && (
              <Text size="sm" c="var(--mantine-color-error)">
                {submitError}
              </Text>
            )}
            <Button type="submit" size="md" loading={loading}>
              겸상 열기
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  )
}
