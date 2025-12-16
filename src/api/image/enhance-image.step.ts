import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { authMiddleware } from '../../../middlewares/auth.middleware'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getImageService } from '../../services/image-service'

const responseSchema = {
  200: z.object({
    imageBytes: z.string(), // Base64 encoded image
  }),
  400: z.object({
    error: z.string(),
  }),
  401: z.object({
    error: z.string(),
  }),
  500: z.object({
    error: z.string(),
  }),
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'EnhanceImage',
  description: 'Enhance an image by filling in missing details using AI',
  path: '/image',
  method: 'POST',
  emits: [],
  flows: ['image-processing'],
  middleware: [errorMiddleware, authMiddleware],
  responseSchema,
}

export const handler: Handlers['EnhanceImage'] = async (req, { logger }) => {
  const userId = (req as any).userId

  if (!userId) {
    return {
      status: 401,
      body: { error: 'Unauthorized' },
    }
  }

  try {
    // Parse the image from the request body
    const body = req.body as {
      image?: Buffer | string
    }

    if (!body.image) {
      return {
        status: 400,
        body: { error: 'No image file provided' },
      }
    }

    logger.info('Enhancing image', { userId })

    // Convert image to Buffer if needed
    const imageBuffer =
      typeof body.image === 'string' ? Buffer.from(body.image, 'base64') : Buffer.from(body.image)

    // Enhance the image
    const imageService = getImageService()
    const enhancedImage = await imageService.enhanceImage(imageBuffer)

    logger.info('Image enhanced successfully', { userId })

    return {
      status: 200,
      body: { imageBytes: enhancedImage },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to enhance image', { error: errorMessage, userId })
    return {
      status: 500,
      body: { error: 'Failed to enhance image' },
    }
  }
}

