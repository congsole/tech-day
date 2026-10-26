import { Card, Input, createTheme, rem, type CSSVariablesResolver } from '@mantine/core'

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
    Input: Input.extend({
      styles: (_, props) => ({
        // 포커스는 input의 변수로, 오류·성공은 Mantine 상태 스타일로 처리한다.
        wrapper: {
          '--input-bd':
            (!props.variant || props.variant === 'default') &&
            !(props.error && props.withErrorStyles !== false) &&
            !(props.success && !props.error && props.withSuccessStyles !== false)
              ? 'var(--mantine-color-gray-6)'
              : undefined,
        },
      }),
    }),
    Card: Card.extend({ defaultProps: { radius: 'lg', withBorder: true } }),
  },
})

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
    '--mantine-color-default-border': 'var(--mantine-color-gray-3)',
    '--mantine-color-disabled': 'var(--mantine-color-gray-1)',
    '--mantine-color-disabled-color': 'var(--mantine-color-gray-6)',
    '--mantine-color-error': 'var(--mantine-color-red-9)',
    '--mantine-color-success': 'var(--mantine-color-green-9)',
    // light 변형의 기본 배경만 맞추고 hover·focus 동작은 Mantine을 유지한다.
    '--mantine-color-teal-light': 'var(--mantine-color-teal-0)',
    '--mantine-color-red-light': 'var(--mantine-color-red-0)',
    '--mantine-color-orange-light': 'var(--mantine-color-orange-0)',
    '--mantine-color-green-light': 'var(--mantine-color-green-0)',
  },
  dark: {},
})
