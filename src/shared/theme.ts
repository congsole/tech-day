import { Card, createTheme, rem, type CSSVariablesResolver } from '@mantine/core'

// 값의 근거: docs/common/design-system.md §3
export const theme = createTheme({
  primaryColor: 'teal',
  primaryShade: 9,
  black: '#212529', // gray.9 제목·본문
  // 4px 간격은 rem(4)로 직접 쓴다
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  headings: {
    sizes: {
      h1: { fontSize: rem(24) }, // 화면 제목
      h2: { fontSize: rem(20) }, // 영역 제목
    },
  },
  defaultRadius: 'md',
  radius: {
    md: rem(8), // 입력창·버튼
    lg: rem(12), // 카드
  },
  components: {
    Card: Card.extend({ defaultProps: { radius: 'lg', withBorder: true } }),
  },
})

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
    '--mantine-color-default-border': 'var(--mantine-color-gray-3)',
  },
  dark: {},
})
