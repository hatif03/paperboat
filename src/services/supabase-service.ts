import { createClient, SupabaseClient } from '@supabase/supabase-js'

export class SupabaseService {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseSecretKey)
  }

  /**
   * Return the Supabase user id from a JWT access token.
   * Uses GoTrue to validate the token and fetch the user.
   * Returns null if invalid or user not found.
   */
  async getUserIdFromToken(token: string): Promise<string | null> {
    if (!token) {
      return null
    }

    try {
      const { data, error } = await this.supabase.auth.getUser(token)
      if (error || !data.user) {
        return null
      }
      return data.user.id
    } catch {
      return null
    }
  }

  /**
   * Extract Bearer token from Authorization header and return user id.
   */
  async getUserIdFromAuthHeader(authHeader: string | undefined): Promise<string | null> {
    if (!authHeader) {
      return null
    }

    try {
      const lowerAuth = authHeader.toLowerCase()
      if (lowerAuth.startsWith('bearer ')) {
        const token = authHeader.slice(7).trim()
        return this.getUserIdFromToken(token)
      }
      return null
    } catch {
      return null
    }
  }
}

// Singleton instance
let supabaseServiceInstance: SupabaseService | null = null

export function getSupabaseService(): SupabaseService {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = new SupabaseService()
  }
  return supabaseServiceInstance
}
