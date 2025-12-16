import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { authMiddleware } from '../../../middlewares/auth.middleware'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getVideoMergeService } from '../../services/video-merge-service'

const bodySchema = z.object({
  videoUrls: z.array(z.string().url()).min(2, 'At least 2 video URLs are required for merging'),
})

const responseSchema = {
  200: z.object({
    videoUrl: z.string(),
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
  name: 'MergeVideos',
  description: 'Merge multiple videos from URLs into a single video',
  path: '/video/merge',
  method: 'POST',
  emits: [],
  flows: ['video-processing'],
  middleware: [errorMiddleware, authMiddleware],
  bodySchema,
  responseSchema,
}

export const handler: Handlers['MergeVideos'] = async (req, { logger }) => {
  const userId = (req as any).userId

  if (!userId) {
    return {
      status: 401,
      body: { error: 'Unauthorized' },
    }
  }

  try {
    // Validate request body
    const parsed = bodySchema.safeParse(req.body)
    if (!parsed.success) {
      return {
        status: 400,
        body: { error: parsed.error.errors[0]?.message || 'Invalid request body' },
      }
    }

    const { videoUrls } = parsed.data

    logger.info('Merging videos', { userId, videoCount: videoUrls.length })

    // Merge the videos
    const videoMergeService = getVideoMergeService()
    const mergedVideoUrl = await videoMergeService.mergeVideos(videoUrls, userId)

    logger.info('Videos merged successfully', { userId, mergedVideoUrl })

    return {
      status: 200,
      body: { videoUrl: mergedVideoUrl },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to merge videos', { error: errorMessage, userId })
    return {
      status: 500,
      body: { error: errorMessage },
    }
  }
}

