import { CalculatorExperience } from '@/components/calculator/CalculatorExperience'
import { getPublicCalculatorData } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await getPublicCalculatorData()
  return <CalculatorExperience goods={data.goods} settings={data.settings} />
}
