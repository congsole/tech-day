import { createElement } from 'react'
import type { RouteObject } from 'react-router'
import LoginPage from './LoginPage'

// 로그인 전에 들어오는 화면 라우트
export const mealPublicRoutes: RouteObject[] = [{ path: 'login', element: createElement(LoginPage) }]

// meal 화면 라우트. 로그인한 사용자만 들어온다.
export const mealRoutes: RouteObject[] = []
