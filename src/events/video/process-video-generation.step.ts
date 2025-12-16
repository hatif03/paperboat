import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getVertexService } from '../../services/vertex-service'
import { getJobService } from '../../services/job-service'
import { getImageService } from '../../services/image-service'
import { createVideoPrompt } from '../../utils/prompt-builder'

const inputSchema = z.object({
  jobId: z.string(),
  userId: z.string(),
  startingImage: z.string(), // Base64 encoded
  endingImage: z.string().optional(), // Base64 encoded
  customPrompt: z.string(),
  globalContext: z.string(),
  durationSeconds: z.number().default(6),
})

export const config: EventConfig = {
  type: 'event',
  name: 'ProcessVideoGeneration',
  description: 'Background task that processes video generation using Vertex AI',
  subscribes: ['process-video-generation'],
  emits: [],
  input: inputSchema,
  flows: ['video-generation'],
}

export const handler: Handlers['ProcessVideoGeneration'] = async (input, { logger }) => {
  const { jobId, userId, startingImage, endingImage, customPrompt, globalContext, durationSeconds } = input

  const jobService = getJobService()
  const vertexService = getVertexService()
  const imageService = getImageService()

  logger.info('Processing video generation', { jobId, userId })

  try {
    // Convert base64 back to Buffer
    const startingImageBuffer = Buffer.from(startingImage, 'base64')
    const endingImageBuffer = endingImage ? Buffer.from(endingImage, 'base64') : undefined

    // Run parallel tasks for annotation analysis and image cleanup
    const [annotationDescription, cleanedStartingImage] = await Promise.all([
      imageService.analyzeAnnotations(startingImageBuffer),
      imageService.removeAnnotations(startingImageBuffer),
    ])

    let cleanedEndingImage: string | undefined
    if (endingImageBuffer) {
      cleanedEndingImage = await imageService.removeAnnotations(endingImageBuffer)
    }

    // Build the video generation prompt
    const prompt = createVideoPrompt(customPrompt, globalContext, annotationDescription)

    logger.info('Generated video prompt', { jobId, promptLength: prompt.length })

    // Convert cleaned images back to Buffer (they're base64 from the image service)
    const cleanedStartingImageBuffer = Buffer.from(cleanedStartingImage, 'base64')
    const cleanedEndingImageBuffer = cleanedEndingImage
      ? Buffer.from(cleanedEndingImage, 'base64')
      : undefined

    // Generate video using Vertex AI
    const operation = await vertexService.generateVideoContent(
      prompt,
      cleanedStartingImageBuffer,
      cleanedEndingImageBuffer,
      durationSeconds
    )

    logger.info('Video generation started', { jobId, operationName: operation.name })

    // Store the job with operation name for status polling
    await jobService.storeVideoJob(jobId, operation.name!, {
      annotationDescription,
      userId,
    })

    logger.info('Video job stored successfully', { jobId })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Video generation failed', { jobId, error: errorMessage })

    // Store the error
    await jobService.storeJobError(jobId, errorMessage)
  }
}

