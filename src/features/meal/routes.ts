import { createElement } from 'react'
import type { RouteObject } from 'react-router'
import { NAME_SETUP_PATH } from '../../shared/RequireAuth'
import LoginPage from './LoginPage'
import MealCreatePage from './MealCreatePage'
import MealListPage from './MealListPage'
import NameSetupPage from './NameSetupPage'

// 로그인 전에 들어오는 화면 라우트
export const mealPublicRoutes: RouteObject[] = [{ path: 'login', element: createElement(LoginPage) }]

// meal 화면 라우트. 로그인한 사용자만 들어온다.
export const mealRoutes: RouteObject[] = [
  { index: true, element: createElement(MealListPage) },
  { path: NAME_SETUP_PATH, element: createElement(NameSetupPage) },
  { path: 'meals/new', element: createElement(MealCreatePage) },
]
