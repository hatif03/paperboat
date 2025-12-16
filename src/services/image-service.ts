import { getVertexService, VertexService } from './vertex-service'

export class ImageService {
  private vertexService: VertexService

  constructor() {
    this.vertexService = getVertexService()
  }

  /**
   * Enhance an image by filling in missing details
   */
  async enhanceImage(imageData: Buffer): Promise<string> {
    const prompt =
      "Improve the attached image and fill in any missing details (There may be annotations and stuff but don't remove them or follow them, treat them like they dont exist unless they explicitly say to do so). Do not deviate from the original art style too much, simply understand the artist's idea and enhance it a bit."

    return this.vertexService.generateImageContent(prompt, imageData)
  }

  /**
   * Remove annotations from an image
   */
  async removeAnnotations(imageData: Buffer): Promise<string> {
    const prompt =
      'Remove all text, captions, subtitles, annotations from this image. Generate a clean version of the image with no text. Keep everything else the exact same.'

    return this.vertexService.generateImageContent(prompt, imageData)
  }

  /**
   * Analyze annotation descriptions in an image
   */
  async analyzeAnnotations(imageData: Buffer): Promise<string> {
    const prompt =
      'Describe any animation annotations you see. Use this description to inform a video director. Be descriptive about location and purpose of the annotations.'

    return this.vertexService.analyzeImageContent(prompt, imageData)
  }
}

// Singleton instance
let imageServiceInstance: ImageService | null = null

export function getImageService(): ImageService {
  if (!imageServiceInstance) {
    imageServiceInstance = new ImageService()
  }
  return imageServiceInstance
}

