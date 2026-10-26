import { Outlet } from 'react-router'

// 로그인한 사용자만 들어오는 화면의 가드. 로그인 확인은 REQ-MEAL-01에서 구현한다.
export default function RequireAuth() {
  return <Outlet />
}
