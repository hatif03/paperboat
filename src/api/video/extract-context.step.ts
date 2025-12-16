import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getVertexService } from '../../services/vertex-service'
import { createContextExtractionPrompt } from '../../utils/prompt-builder'

const responseSchema = {
  200: z.object({
    entities: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        appearance: z.string(),
      })
    ),
    environment: z.string(),
    style: z.string(),
  }),
  400: z.object({
    error: z.string(),
  }),
  500: z.object({
    error: z.string(),
    raw: z.string().optional(),
  }),
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ExtractContext',
  description: 'Extract structured scene information from a video using AI',
  path: '/extract-context',
  method: 'POST',
  emits: [],
  flows: ['video-analysis'],
  middleware: [errorMiddleware],
  responseSchema,
}

export const handler: Handlers['ExtractContext'] = async (req, { logger }) => {
  try {
    // Parse the video from the request body
    const body = req.body as {
      video?: Buffer | string
    }

    if (!body.video) {
      return {
        status: 400,
        body: { error: 'No video file provided' },
      }
    }

    logger.info('Extracting context from video')

    // Convert video to Buffer if needed
    const videoBuffer =
      typeof body.video === 'string' ? Buffer.from(body.video, 'base64') : Buffer.from(body.video)

    // Get the prompt for context extraction
    const prompt = createContextExtractionPrompt()

    // Analyze the video
    const vertexService = getVertexService()
    const rawResponse = await vertexService.analyzeVideoContent(prompt, videoBuffer)

    // Clean up the response (strip markdown if present)
    let cleaned = rawResponse.trim()
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n')
      cleaned = lines.slice(1).join('\n')
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    // Parse the JSON response
    try {
      const parsed = JSON.parse(cleaned)

      logger.info('Context extracted successfully')

      return {
        status: 200,
        body: {
          entities: parsed.entities || [],
          environment: parsed.environment || '',
          style: parsed.style || '',
        },
      }
    } catch (parseError) {
      logger.error('Failed to parse context JSON', { raw: rawResponse })
      return {
        status: 500,
        body: { error: 'Failed to parse JSON', raw: rawResponse },
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to extract context', { error: errorMessage })
    return {
      status: 500,
      body: { error: errorMessage },
    }
  }
}

