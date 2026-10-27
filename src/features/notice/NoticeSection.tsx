import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { useMediaQuery } from '@mantine/hooks'
import { Alert, Badge, Button, Card, Divider, Drawer, Group, Loader, Stack, Text, Textarea } from '@mantine/core'
import { createNotice, getNoticeView, type NoticeView } from './api'

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const emptyText = '아직 올라온 공지가 없습니다'

// 겸상 상세의 notice 섹션. 공지와 집합/수령 장소(REQ-NOTICE-01~02)
// 겸상 ID는 useParams()의 mealId로 읽는다.
// 화면 배치: docs/features/notice/screen.md SCR-NOTICE-01 공지 띠, SCR-NOTICE-02 공지 패널
export default function NoticeSection() {
  const { mealId = '' } = useParams()
  const wide = useMediaQuery('(min-width: 48em)')
  const [view, setView] = useState<NoticeView | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [panelOpened, setPanelOpened] = useState(false)
  const [writing, setWriting] = useState(false)
  const [content, setContent] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    getNoticeView(mealId).then((result) => {
      if (ignore) return
      setView(result.data ?? null)
      setLoadError(result.error ?? null)
    })
    return () => {
      ignore = true
    }
  }, [mealId])

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
      const reloaded = await getNoticeView(mealId)
      setView(reloaded.data ?? null)
      setLoadError(reloaded.error ?? null)
    }
    setSubmitting(false)
  }

  if (loadError) {
    return (
      <Alert color="red" title="공지">
        {loadError}
      </Alert>
    )
  }
  if (!view) {
    return (
      <Card mih={44}>
        <Loader size="sm" aria-label="공지를 불러오는 중" />
      </Card>
    )
  }
  // 참여자가 아니면 공지 띠와 패널을 보여주지 않는다
  if (!view.isMember) return null

  const latest = view.notices[0]

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
              {view.notices.length}
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
                  {view.notices.length}
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              {view.isHost && !writing && (
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

              {view.notices.length === 0 ? (
                <Text c="dimmed" ta="center" py="lg">
                  {emptyText}.
                </Text>
              ) : (
                <Stack gap={0}>
                  {view.notices.map((notice, index) => (
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
