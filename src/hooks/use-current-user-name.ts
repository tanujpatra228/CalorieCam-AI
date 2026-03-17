import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data: { user }, error } = await createClient().auth.getUser()
      if (error || !user) {
        return
      }

      setName(
        user.user_metadata?.full_name ??
        user.email ??
        '?'
      )
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
