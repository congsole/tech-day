import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { cssVariablesResolver, theme } from './shared/theme'
import Layout from './shared/Layout'
import RequireAuth from './shared/RequireAuth'
import MealDetailPage from './shared/MealDetailPage'
import { mealPublicRoutes, mealRoutes } from './features/meal/routes'
import { joinRoutes } from './features/join/routes'
import { settleRoutes } from './features/settle/routes'
import { noticeRoutes } from './features/notice/routes'

// 라우트는 각 기능의 routes.ts에 추가한다. 이 파일은 합치기만 한다.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      ...mealPublicRoutes,
      {
        element: <RequireAuth />,
        children: [
          { path: 'meals/:mealId', element: <MealDetailPage /> },
          ...mealRoutes,
          ...joinRoutes,
          ...settleRoutes,
          ...noticeRoutes,
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
      <RouterProvider router={router} />
    </MantineProvider>
  )
}
