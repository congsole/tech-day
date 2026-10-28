import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Alert, Badge, Button, Card, Divider, Drawer, Group, Stack, Text, Textarea } from '@mantine/core'
import type { MealDetail } from '../../shared/meal-detail-api'
import { createNotice, getNotices, type Notice } from './api'

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const emptyText = '아직 올라온 공지가 없습니다'

// 겸상 상세의 notice 섹션. 공지와 집합/수령 장소(REQ-NOTICE-01~02)
// 참여 여부·Host 여부는 겸상 상세가 내려준다(#75). 공지 목록만 이 섹션에서 조회한다.
// 화면 배치: docs/features/notice/screen.md SCR-NOTICE-01 공지 띠, SCR-NOTICE-02 공지 패널
export default function NoticeSection({ meal }: { meal: MealDetail }) {
  const { id: mealId, isMember, isHost } = meal
  const wide = useMediaQuery('(min-width: 48em)')
  // null: 불러오는 중
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [panelOpened, setPanelOpened] = useState(false)
  const [writing, setWriting] = useState(false)
  const [content, setContent] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 참여 직후에도 띠가 보이도록 참여 여부가 바뀌면 다시 조회한다
  useEffect(() => {
    if (!isMember) return
    let ignore = false
    getNotices(mealId).then((result) => {
      if (ignore) return
      setNotices(result.data ?? null)
      setLoadError(result.error ?? null)
    })
    return () => {
      ignore = true
    }
  }, [mealId, isMember])

  function closeForm() {
    setWriting(false)
    setContent('')
    setInputError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!content.trim()) {
      setInputError('공지 내용을 입력하세요.')
      return
    }
    setSubmitting(true)
    const created = await createNotice(mealId, content)
    if (created.error) {
      setInputError(created.error)
    } else {
      closeForm()
      const reloaded = await getNotices(mealId)
      setNotices(reloaded.data ?? null)
      setLoadError(reloaded.error ?? null)
    }
    setSubmitting(false)
  }

  // 참여자가 아니면 띠와 패널을 보여주지 않는다
  if (!isMember) return null
  if (loadError) {
    return (
      <Alert color="red" title="공지">
        {loadError}
      </Alert>
    )
  }
  if (!notices) return null

  const latest = notices[0]

  return (
    <>
      <Card
        component="button"
        type="button"
        onClick={() => setPanelOpened(true)}
        mih={44}
        py="sm"
        style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-haspopup="dialog"
      >
        <Group gap="xs" wrap="nowrap">
          <Text fw={700}>공지</Text>
          {latest && (
            <Badge variant="light" color="gray">
              {notices.length}
            </Badge>
          )}
          <Text truncate c={latest ? undefined : 'dimmed'} style={{ flex: 1, minWidth: 0 }}>
            {latest ? latest.content : emptyText}
          </Text>
          <Text c="dimmed" aria-hidden>
            ›
          </Text>
        </Group>
      </Card>

      <Drawer.Root
        opened={panelOpened}
        onClose={() => setPanelOpened(false)}
        position={wide ? 'right' : 'bottom'}
        size={wide ? 400 : '80%'}
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Group gap="xs">
              <Drawer.Title fz="xl" fw={700}>
                공지
              </Drawer.Title>
              {latest && (
                <Badge variant="light" color="gray">
                  {notices.length}
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              {isHost && !writing && (
                <Button variant="light" onClick={() => setWriting(true)}>
                  공지 쓰기
                </Button>
              )}
              <Drawer.CloseButton aria-label="닫기" />
            </Group>
          </Drawer.Header>
          <Drawer.Body>
            <Stack>
              {writing && (
                <form onSubmit={handleSubmit}>
                  <Stack gap="xs">
                    <Textarea
                      label="공지 내용"
                      placeholder="배달 위치, 배달 완료, 변경 사항 등"
                      autosize
                      minRows={3}
                      autoFocus
                      value={content}
                      onChange={(event) => {
                        setContent(event.currentTarget.value)
                        setInputError(null)
                      }}
                      error={inputError}
                    />
                    <Group justify="flex-end" gap="xs">
                      <Button variant="default" onClick={closeForm} disabled={submitting}>
                        취소
                      </Button>
                      <Button type="submit" loading={submitting}>
                        게시
                      </Button>
                    </Group>
                  </Stack>
                </form>
              )}

              {notices.length === 0 ? (
                <Text c="dimmed" ta="center" py="lg">
                  {emptyText}.
                </Text>
              ) : (
                <Stack gap={0}>
                  {notices.map((notice, index) => (
                    <Fragment key={notice.id}>
                      {index > 0 && <Divider />}
                      <Stack gap={4} py="sm">
                        <Text size="sm" c="dimmed">
                          {timeFormat.format(new Date(notice.created_at))}
                        </Text>
                        <Text style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{notice.content}</Text>
                      </Stack>
                    </Fragment>
                  ))}
                </Stack>
              )}
            </Stack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  )
}
