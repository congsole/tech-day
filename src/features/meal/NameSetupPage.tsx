import { useState, type FormEvent } from 'react'
import { Box, Button, Card, Stack, Text, TextInput, Title } from '@mantine/core'
import { Navigate, useLocation, useNavigate, useOutletContext } from 'react-router'
import type { AuthContext } from '../../shared/RequireAuth'
import { saveDisplayName } from './api'

// REQ-MEAL-02 이름(본명) 설정. 표시 이름이 없는 최초 로그인 사용자만 들어온다.
export default function NameSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const { userId, displayName, setDisplayName } = useOutletContext<AuthContext>()

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 이미 이름이 있으면 이 단계를 건너뛴다
  if (displayName !== null) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('이름을 입력해 주세요.')
      return
    }
    setLoading(true)
    const result = await saveDisplayName(userId, trimmed)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDisplayName(trimmed)
    navigate(from, { replace: true })
  }

  return (
    <Box maw={560} mx="auto" mt="xl">
      <Card p="lg" bg="white">
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={1}>이름 설정</Title>
            <Text size="sm" c="dimmed">
              본명(실명)을 입력해 주세요. 겸상에서 다른 사람에게 보이는 이름입니다.
            </Text>
            <TextInput
              label="이름(본명)"
              size="md"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              error={error}
              disabled={loading}
            />
            <Button type="submit" size="md" loading={loading}>
              저장
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  )
}
