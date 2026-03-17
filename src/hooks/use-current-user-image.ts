import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const { data: { user }, error } = await createClient().auth.getUser()
      if (error || !user) {
        return
      }

      setImage(user.user_metadata?.avatar_url ?? null)
    }
    fetchUserImage()
  }, [])

  return image
}
