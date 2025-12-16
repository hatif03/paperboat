import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getJobService } from '../services/job-service'

const responseSchema = {
  200: z.object({
    status: z.string(),
    redis: z.boolean(),
  }),
  500: z.object({
    status: z.string(),
    redis: z.boolean(),
  }),
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'HealthCheck',
  description: 'Health check endpoint',
  path: '/health',
  method: 'GET',
  emits: [],
  flows: ['system'],
  responseSchema,
}

export const handler: Handlers['HealthCheck'] = async (_req, { logger }) => {
  try {
    const jobService = getJobService()
    const redisHealthy = await jobService.healthCheck()

    if (redisHealthy) {
      return {
        status: 200,
        body: { status: 'healthy', redis: true },
      }
    } else {
      return {
        status: 200,
        body: { status: 'degraded', redis: false },
      }
    }
  } catch (error) {
    logger.error('Health check failed', { error })
    return {
      status: 500,
      body: { status: 'unhealthy', redis: false },
    }
  }
}

