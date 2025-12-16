import { ApiMiddleware } from 'motia'
import { ZodError } from 'zod'

/**
 * Error handling middleware that catches and formats errors appropriately.
 * Handles Zod validation errors with detailed error messages.
 */
export const errorMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx

  try {
    return await next()
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logger.error('Validation error', {
        errors: error.errors,
      })

      return {
        status: 400,
        body: {
          error: 'Invalid request body',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      }
    }

    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error('Request error', {
      error: errorMessage,
      stack: errorStack,
    })

    return {
      status: 500,
      body: { error: 'Internal Server Error' },
    }
  }
}

