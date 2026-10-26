import { useEffect, useState } from 'react'
import { Center, Loader } from '@mantine/core'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Outlet, useLocation } from 'react-router'
import { watchSession } from '../features/meal/api'

// 로그인한 사용자만 들어오는 화면의 가드 (REQ-MEAL-01). 세션이 없으면 로그인 화면으로 보낸다.
export default function RequireAuth() {
  const location = useLocation()
  // undefined: 저장된 세션 확인 중
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => watchSession(setSession), [])

  if (session === undefined) {
    return (
      <Center mih="50dvh">
        <Loader aria-label="로그인 확인 중" />
      </Center>
    )
  }
  if (session === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
