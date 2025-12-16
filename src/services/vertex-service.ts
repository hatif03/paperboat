import { GoogleGenAI, GenerateVideosOperation } from '@google/genai'
import type { JobStatus } from '../types/index'

export class VertexService {
  private client: GoogleGenAI
  private bucketName: string

  constructor() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true'
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT must be set in environment variables')
    }

    if (!bucketName) {
      throw new Error('GOOGLE_CLOUD_BUCKET_NAME must be set in environment variables')
    }

    this.bucketName = bucketName
    this.client = new GoogleGenAI({
      vertexai: useVertexAI,
      project: projectId,
      location,
    })
  }

  /**
   * Generate video content from an image and prompt
   */
  async generateVideoContent(
    prompt: string,
    imageData: Buffer,
    endingImageData?: Buffer,
    durationSeconds: number = 6
  ): Promise<GenerateVideosOperation> {
    const endingFrame = endingImageData
      ? {
          imageBytes: endingImageData.toString('base64'),
          mimeType: 'image/png',
        }
      : undefined

    const operation = await this.client.models.generateVideos({
      model: 'veo-3.1-fast-generate-001',
      prompt,
      image: {
        imageBytes: imageData.toString('base64'),
        mimeType: 'image/png',
      },
      config: {
        aspectRatio: '16:9',
        durationSeconds,
        outputGcsUri: `gs://${this.bucketName}/videos/`,
        negativePrompt: 'text, captions, subtitles, annotations, low quality, static, ugly, weird physics',
        lastFrame: endingFrame,
      },
    })

    return operation
  }

  /**
   * Generate enhanced image content from an image and prompt
   */
  async generateImageContent(prompt: string, image: Buffer): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: image.toString('base64'),
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
        },
        candidateCount: 1,
      },
    })

    if (!response.candidates?.[0]?.content?.parts?.[0]) {
      throw new Error('Failed to generate image: ' + JSON.stringify(response))
    }

    const part = response.candidates[0].content.parts[0]
    if ('inlineData' in part && part.inlineData?.data) {
      return part.inlineData.data
    }

    throw new Error('Failed to extract image data from response')
  }

  /**
   * Get video generation status by operation name
   */
  async getVideoStatusByName(operationName: string): Promise<JobStatus> {
    const operation = await this.client.operations.get({ name: operationName })

    if (operation.done && operation.result?.generatedVideos?.[0]) {
      return {
        status: 'done',
        jobStartTime: new Date(),
        videoUrl: operation.result.generatedVideos[0].video?.uri,
      }
    }

    return {
      status: 'waiting',
      jobStartTime: new Date(),
    }
  }

  /**
   * Analyze video content using Gemini
   */
  analyzeVideoContent(prompt: string, videoData: Buffer): Promise<string> {
    return this.client.models
      .generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: videoData.toString('base64'),
                  mimeType: 'video/mp4',
                },
              },
              { text: prompt },
            ],
          },
        ],
      })
      .then((response) => {
        const text = response.candidates?.[0]?.content?.parts?.[0]
        if (text && 'text' in text) {
          return text.text || ''
        }
        return ''
      })
  }

  /**
   * Analyze image content using Gemini
   */
  async analyzeImageContent(prompt: string, imageData: Buffer): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: imageData.toString('base64'),
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      ],
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]
    if (text && 'text' in text) {
      return (text.text || '').trim()
    }
    return ''
  }

  /**
   * Test the service connection
   */
  async testService(): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: 'Hi there, does u work?' }] }],
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]
    if (text && 'text' in text) {
      return text.text || 'No response'
    }
    return 'No response'
  }
}

// Singleton instance
let vertexServiceInstance: VertexService | null = null

export function getVertexService(): VertexService {
  if (!vertexServiceInstance) {
    vertexServiceInstance = new VertexService()
  }
  return vertexServiceInstance
}

