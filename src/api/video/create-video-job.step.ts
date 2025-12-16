import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { authMiddleware } from '../../../middlewares/auth.middleware'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getJobService } from '../../services/job-service'

const responseSchema = {
  200: z.object({
    jobId: z.string(),
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
  name: 'CreateVideoJob',
  description: 'Starts a video generation job from an image and returns a job ID for polling',
  path: '/video',
  method: 'POST',
  emits: ['process-video-generation'],
  flows: ['video-generation'],
  middleware: [errorMiddleware, authMiddleware],
  responseSchema,
}

export const handler: Handlers['CreateVideoJob'] = async (req, { emit, logger }) => {
  const userId = (req as any).userId

  if (!userId) {
    return {
      status: 401,
      body: { error: 'Unauthorized' },
    }
  }

  try {
    // Parse multipart form data - body contains form fields
    const body = req.body as {
      customPrompt?: string
      globalContext?: string
      durationSeconds?: string
      startingImage?: Buffer | string
      endingImage?: Buffer | string
    }

    if (!body.startingImage) {
      return {
        status: 400,
        body: { error: 'No starting image file provided' },
      }
    }

    // Create a pending job entry
    const jobService = getJobService()
    const jobId = await jobService.createPendingJob()

    logger.info('Video job created', { jobId, userId })

    // Convert image data to base64 if needed
    const startingImageBase64 =
      typeof body.startingImage === 'string'
        ? body.startingImage
        : Buffer.from(body.startingImage).toString('base64')

    const endingImageBase64 = body.endingImage
      ? typeof body.endingImage === 'string'
        ? body.endingImage
        : Buffer.from(body.endingImage).toString('base64')
      : undefined

    // Emit event for background processing
    await emit({
      topic: 'process-video-generation',
      data: {
        jobId,
        userId,
        startingImage: startingImageBase64,
        endingImage: endingImageBase64,
        customPrompt: body.customPrompt || '',
        globalContext: body.globalContext || '',
        durationSeconds: parseInt(body.durationSeconds || '6', 10),
      },
    })

    return {
      status: 200,
      body: { jobId },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to create video job', { error: errorMessage, userId })
    return {
      status: 500,
      body: { error: 'Failed to create video job' },
    }
  }
}

