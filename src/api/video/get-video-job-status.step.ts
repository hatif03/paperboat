import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getJobService } from '../../services/job-service'
import { getVertexService } from '../../services/vertex-service'

const responseSchema = {
  200: z.object({
    status: z.enum(['done', 'waiting', 'pending', 'error']),
    jobStartTime: z.string(),
    jobEndTime: z.string().optional(),
    videoUrl: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  404: z.object({
    error: z.string(),
  }),
  500: z.object({
    error: z.string(),
    errorMessage: z.string().optional(),
  }),
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetVideoJobStatus',
  description: 'Get the status of a video generation job',
  path: '/video/:jobId',
  method: 'GET',
  emits: [],
  flows: ['video-generation'],
  middleware: [errorMiddleware],
  responseSchema,
}

export const handler: Handlers['GetVideoJobStatus'] = async (req, { logger }) => {
  const { jobId } = req.pathParams

  if (!jobId) {
    return {
      status: 404,
      body: { error: 'Job ID is required' },
    }
  }

  try {
    const jobService = getJobService()
    const jobData = await jobService.getJobData(jobId)

    // Job not found
    if (jobData.type === 'not_found') {
      return {
        status: 404,
        body: { error: 'Job not found' },
      }
    }

    // Job is still pending (being prepared)
    if (jobData.type === 'pending') {
      return {
        status: 200,
        body: {
          status: 'waiting' as const,
          jobStartTime: (jobData.data?.jobStartTime as string) || new Date().toISOString(),
        },
      }
    }

    // Job had an error
    if (jobData.type === 'error') {
      return {
        status: 500,
        body: {
          status: 'error' as const,
          error: 'Video generation failed',
          errorMessage: jobData.data?.error as string,
        },
      }
    }

    // Job exists, check with Vertex AI for actual status
    const operationName = jobData.data?.operationName as string
    if (!operationName) {
      return {
        status: 500,
        body: { error: 'Invalid job data' },
      }
    }

    const vertexService = getVertexService()
    const result = await vertexService.getVideoStatusByName(operationName)

    if (result.status === 'done') {
      // Clean up the job from Redis
      await jobService.removeJob(jobId)

      // Convert gs:// URL to https:// URL
      const videoUrl = result.videoUrl?.replace('gs://', 'https://storage.googleapis.com/')

      return {
        status: 200,
        body: {
          status: 'done' as const,
          jobStartTime: (jobData.data?.jobStartTime as string) || new Date().toISOString(),
          jobEndTime: new Date().toISOString(),
          videoUrl,
          metadata: jobData.data?.metadata as Record<string, unknown>,
        },
      }
    }

    // Still processing
    return {
      status: 200,
      body: {
        status: 'waiting' as const,
        jobStartTime: (jobData.data?.jobStartTime as string) || new Date().toISOString(),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get job status', { jobId, error: errorMessage })
    return {
      status: 500,
      body: { error: 'Failed to get job status' },
    }
  }
}

