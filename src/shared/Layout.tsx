import { Anchor, Box, Container } from '@mantine/core'
import { Link, Outlet, useLocation } from 'react-router'

// LAYOUT-HEADER: 로그인 화면을 제외한 공통 목록 이동 경로. 인증·이름 설정은 기존 가드가 처리한다.
export default function Layout() {
  const { pathname } = useLocation()
  const showHeader = pathname.replace(/\/+$/, '') !== '/login'

  return (
    <Box bg="gray.0" mih="100dvh">
      {showHeader && (
        <Box component="header" bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Container size={960} px={{ base: 'md', sm: 'lg' }} mih={56} style={{ display: 'flex', alignItems: 'center' }}>
            <Anchor
              component={Link}
              to="/"
              aria-label="겸상 목록으로 이동"
              c="teal.9"
              fz={20}
              fw={700}
              miw={44}
              mih={44}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              겸상
            </Anchor>
          </Container>
        </Box>
      )}
      <Container size={960} px={{ base: 'md', sm: 'lg' }} py="md">
        <Outlet />
      </Container>
    </Box>
  )
}
