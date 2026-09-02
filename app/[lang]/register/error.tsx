'use client'

import AuthErrorState from '@/components/auth/AuthErrorState'

export default function RegisterError({ reset }: { error: Error; reset: () => void }) {
  return <AuthErrorState reset={reset} />
}
