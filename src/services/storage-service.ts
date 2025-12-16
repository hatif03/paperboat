import { Storage, Bucket } from '@google-cloud/storage'

export class StorageService {
  private client: Storage | null = null
  private bucket: Bucket | null = null
  private bucketName: string

  constructor() {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    const projectId = process.env.GOOGLE_CLOUD_PROJECT

    this.bucketName = bucketName || ''

    if (!bucketName) {
      console.warn('Warning: GOOGLE_CLOUD_BUCKET_NAME not set in environment')
      return
    }

    try {
      // Initialize client - will use GOOGLE_APPLICATION_CREDENTIALS automatically
      this.client = new Storage({
        projectId,
      })

      this.bucket = this.client.bucket(bucketName)
      console.log(`Successfully initialized Google Cloud Storage with bucket: ${bucketName}`)
    } catch (error) {
      console.error(`Warning: Could not initialize Google Cloud Storage: ${error}`)
      this.client = null
      this.bucket = null
    }
  }

  /**
   * Upload a file to Google Cloud Storage
   * Returns the public URL of the uploaded file
   */
  async uploadFile(itemName: string, fileData: Buffer): Promise<string> {
    if (!this.bucket) {
      throw new Error('Google Cloud Storage not configured. Set GOOGLE_CLOUD_BUCKET_NAME in .env')
    }

    const blob = this.bucket.file(itemName)

    await blob.save(fileData, {
      resumable: false,
    })

    // Try to make the blob publicly readable
    try {
      await blob.makePublic()
      return `https://storage.googleapis.com/${this.bucketName}/${itemName}`
    } catch {
      // If uniform bucket-level access is enabled, return the public URL format anyway
      return `https://storage.googleapis.com/${this.bucketName}/${itemName}`
    }
  }

  /**
   * Download a file from a URL
   */
  async downloadFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file from ${url}: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Check if storage is configured
   */
  isConfigured(): boolean {
    return this.bucket !== null
  }
}

// Singleton instance
let storageServiceInstance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService()
  }
  return storageServiceInstance
}

