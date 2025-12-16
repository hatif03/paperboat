import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { errorMiddleware } from '../../../middlewares/error.middleware'
import { getStorageService } from '../../services/storage-service'

const responseSchema = {
  200: z.object({
    url: z.string(),
  }),
  400: z.object({
    error: z.string(),
  }),
  500: z.object({
    error: z.string(),
  }),
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UploadVideo',
  description: 'Upload a video file to Google Cloud Storage',
  path: '/video/:itemName',
  method: 'PUT',
  emits: [],
  flows: ['file-management'],
  middleware: [errorMiddleware],
  responseSchema,
}

export const handler: Handlers['UploadVideo'] = async (req, { logger }) => {
  const { itemName } = req.pathParams

  if (!itemName) {
    return {
      status: 400,
      body: { error: 'Item name is required' },
    }
  }

  try {
    // Parse the file from the request body
    const body = req.body as {
      file?: Buffer | string
    }

    if (!body.file) {
      return {
        status: 400,
        body: { error: 'No file provided' },
      }
    }

    logger.info('Uploading video', { itemName })

    // Convert file to Buffer if needed
    const fileBuffer =
      typeof body.file === 'string' ? Buffer.from(body.file, 'base64') : Buffer.from(body.file)

    // Upload to Google Cloud Storage
    const storageService = getStorageService()
    const url = await storageService.uploadFile(itemName, fileBuffer)

    logger.info('Video uploaded successfully', { itemName, url })

    return {
      status: 200,
      body: { url },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to upload video', { error: errorMessage, itemName })
    return {
      status: 500,
      body: { error: 'Failed to upload video' },
    }
  }
}

