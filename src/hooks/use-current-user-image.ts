import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const supabase = createClient()

      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        setImage(user.user_metadata?.avatar_url ?? null)
        return
      }

      // Fallback: read from local session
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (session?.user) {
        setImage(session.user.user_metadata?.avatar_url ?? null)
      }
    }
    fetchUserImage()
  }, [])

  return image
}
