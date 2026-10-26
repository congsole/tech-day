import { useState, type FormEvent } from 'react'
import { Box, Button, Card, PinInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router'
import { requestLoginCode, verifyLoginCode } from './api'

const CODE_LENGTH = 6

// REQ-MEAL-01 이메일 OTP 로그인. 이메일 입력 → 6자리 코드 입력 두 단계.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('이메일을 입력해 주세요.')
      return
    }
    setLoading(true)
    const result = await requestLoginCode(trimmed)
    setLoading(false)
    setError(result.error)
    if (!result.error) {
      setSentTo(trimmed)
      setCode('')
    }
  }

  async function handleVerify(value: string) {
    if (!sentTo || value.length !== CODE_LENGTH) {
      setError(`${CODE_LENGTH}자리 코드를 입력해 주세요.`)
      return
    }
    setLoading(true)
    const result = await verifyLoginCode(sentTo, value)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  function handleVerifySubmit(e: FormEvent) {
    e.preventDefault()
    handleVerify(code)
  }

  function handleBack() {
    setSentTo(null)
    setCode('')
    setError(null)
  }

  return (
    <Box maw={560} mx="auto" mt="xl">
      <Card p="lg" bg="white">
        <Stack>
          <Title order={1}>겸상 로그인</Title>
          {sentTo === null ? (
            <form onSubmit={handleRequest}>
              <Stack>
                <Text size="sm" c="dimmed">
                  사내 이메일로 인증 코드를 보내 드립니다. 비밀번호는 없습니다.
                </Text>
                <TextInput
                  label="이메일"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  error={error}
                  disabled={loading}
                />
                <Button type="submit" size="md" loading={loading}>
                  인증 코드 받기
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit}>
              <Stack>
                <Text size="sm" c="dimmed">
                  {sentTo}(으)로 보낸 {CODE_LENGTH}자리 코드를 입력해 주세요.
                </Text>
                <Stack gap={4}>
                  <Text component="label" size="sm" fw={500}>
                    인증 코드
                  </Text>
                  <PinInput
                    length={CODE_LENGTH}
                    type="number"
                    oneTimeCode
                    size="md"
                    value={code}
                    onChange={setCode}
                    onComplete={handleVerify}
                    error={error !== null}
                    disabled={loading}
                    aria-label="인증 코드"
                  />
                  {error && (
                    <Text size="sm" c="red.9">
                      {error}
                    </Text>
                  )}
                </Stack>
                <Button type="submit" size="md" loading={loading}>
                  로그인
                </Button>
                <Button variant="light" size="md" onClick={handleBack} disabled={loading}>
                  이메일 다시 입력
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Card>
    </Box>
  )
}
