'use client'

import dynamic from 'next/dynamic'

const HomeClient = dynamic(
  () => import('@/components/HomeClient').then((m) => m.HomeClient),
  { ssr: false }
)

export function DynamicHome() {
  return <HomeClient />
}
