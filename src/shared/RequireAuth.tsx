import { useEffect, useState } from 'react'
import { Center, Loader, Text } from '@mantine/core'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Outlet, useLocation } from 'react-router'
import { getMyDisplayName, watchSession } from '../features/meal/api'

export const NAME_SETUP_PATH = '/setup-name'

// 로그인한 화면에서 useOutletContext로 읽는 값
export type AuthContext = {
  userId: string
  displayName: string | null
  setDisplayName: (displayName: string) => void
}

type Profile = { userId: string; displayName: string | null; error: string | null }

// 로그인한 사용자만 들어오는 화면의 가드.
// 세션이 없으면 로그인 화면으로(REQ-MEAL-01), 표시 이름이 없으면 이름 설정 화면으로(REQ-MEAL-02) 보낸다.
export default function RequireAuth() {
  const location = useLocation()
  // undefined: 저장된 세션 확인 중
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const userId = session?.user.id

  useEffect(() => watchSession(setSession), [])

  useEffect(() => {
    if (!userId) return
    let ignore = false
    getMyDisplayName(userId).then((result) => {
      if (!ignore) setProfile({ userId, displayName: result.displayName, error: result.error })
    })
    return () => {
      ignore = true
    }
  }, [userId])

  if (session === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (!userId || profile?.userId !== userId) {
    return (
      <Center mih="50dvh">
        <Loader aria-label="로그인 확인 중" />
      </Center>
    )
  }
  if (profile.error) {
    return (
      <Center mih="50dvh">
        <Text c="var(--mantine-color-error)">{profile.error}</Text>
      </Center>
    )
  }
  if (profile.displayName === null && location.pathname !== NAME_SETUP_PATH) {
    return <Navigate to={NAME_SETUP_PATH} replace state={{ from: location.pathname + location.search }} />
  }

  const context: AuthContext = {
    userId,
    displayName: profile.displayName,
    setDisplayName: (displayName) => setProfile({ userId, displayName, error: null }),
  }
  return <Outlet context={context} />
}
