import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const supabase = createClient()

      // Try getUser first (validates with server), fall back to getSession (local)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        setName(user.user_metadata?.full_name ?? user.email ?? '?')
        return
      }

      // Fallback: read from local session
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (session?.user) {
        setName(
          session.user.user_metadata?.full_name ??
          session.user.email ??
          '?'
        )
      }
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
