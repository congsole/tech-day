import { Stack } from '@mantine/core'
import MealInfoSection from '../features/meal/MealInfoSection'
import JoinSection from '../features/join/JoinSection'
import NoticeSection from '../features/notice/NoticeSection'
import SettleSection from '../features/settle/SettleSection'

// 겸상 상세는 여러 기능이 함께 쓰므로 섹션 단위로 나눈다. 각 섹션은 담당 기능 폴더에서 구현한다.
// 공지는 맨 위의 띠로 둔다. docs/features/notice/screen.md SCR-NOTICE-01
export default function MealDetailPage() {
  return (
    <Stack>
      <NoticeSection />
      <MealInfoSection />
      <JoinSection />
      <SettleSection />
    </Stack>
  )
}
