import { ApiMiddleware, ApiRequest, ApiResponse } from 'motia'
import { getSupabaseService } from '../src/services/supabase-service'

// Extend the request type to include userId
declare module 'motia' {
  interface ApiRequest {
    userId?: string
  }
}

/**
 * Authentication middleware that validates Supabase JWT tokens
 * and attaches the user ID to the request context.
 * 
 * If authentication fails, returns a 401 Unauthorized response.
 */
export const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization
    
    if (!authHeader || typeof authHeader !== 'string') {
      logger.warn('Missing or invalid Authorization header')
      return {
        status: 401,
        body: { error: 'Unauthorized: Missing authentication token' },
      }
    }

    const supabaseService = getSupabaseService()
    const userId = await supabaseService.getUserIdFromAuthHeader(authHeader)

    if (!userId) {
      logger.warn('Invalid authentication token')
      return {
        status: 401,
        body: { error: 'Unauthorized: Invalid or expired token' },
      }
    }

    // Attach user ID to request for use in handlers
    req.userId = userId
    logger.info('User authenticated', { userId })

    return await next()
  } catch (error) {
    logger.error('Authentication error', { error })
    return {
      status: 401,
      body: { error: 'Unauthorized: Authentication failed' },
    }
  }
}

/**
 * Optional authentication middleware that attaches user ID if present
 * but doesn't block the request if authentication fails.
 * 
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
export const optionalAuthMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization

    if (authHeader && typeof authHeader === 'string') {
      const supabaseService = getSupabaseService()
      const userId = await supabaseService.getUserIdFromAuthHeader(authHeader)

      if (userId) {
        req.userId = userId
        logger.info('User authenticated (optional)', { userId })
      }
    }
  } catch (error) {
    // Log but don't fail - auth is optional
    logger.debug('Optional auth failed', { error })
  }

  return await next()
}

