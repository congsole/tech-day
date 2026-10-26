import { Box, Container } from '@mantine/core'
import { Outlet } from 'react-router'

// 화면 배경 gray.0, 본문 최대 960px, 좌우 여백 16px(48em 이상 24px). docs/common/design-system.md §4
export default function Layout() {
  return (
    <Box bg="gray.0" mih="100dvh">
      <Container size={960} px={{ base: 'md', sm: 'lg' }} py="md">
        <Outlet />
      </Container>
    </Box>
  )
}
