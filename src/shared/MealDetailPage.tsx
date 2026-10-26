import { Stack } from '@mantine/core'
import MealInfoSection from '../features/meal/MealInfoSection'
import JoinSection from '../features/join/JoinSection'
import NoticeSection from '../features/notice/NoticeSection'
import SettleSection from '../features/settle/SettleSection'

// 겸상 상세는 여러 기능이 함께 쓰므로 섹션 단위로 나눈다. 각 섹션은 담당 기능 폴더에서 구현한다.
export default function MealDetailPage() {
  return (
    <Stack>
      <MealInfoSection />
      <JoinSection />
      <NoticeSection />
      <SettleSection />
    </Stack>
  )
}
