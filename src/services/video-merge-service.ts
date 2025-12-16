import { spawn, execSync } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { getStorageService, StorageService } from './storage-service'

export class VideoMergeService {
  private storageService: StorageService

  constructor() {
    this.storageService = getStorageService()
    this.checkFfmpeg()
  }

  private checkFfmpeg(): void {
    // Check if ffmpeg is available
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' })
    } catch {
      console.warn(
        'Warning: ffmpeg is not installed or not in PATH. Video merging functionality will not work.'
      )
    }
  }

  /**
   * Merges multiple videos from URLs into a single video using FFmpeg with HTTP inputs.
   * This is the fastest approach - FFmpeg downloads and merges in one pass, no temporary files.
   */
  async mergeVideos(videoUrls: string[], userId: string): Promise<string> {
    const startTime = Date.now()
    console.log(`[VIDEO MERGE] Starting merge for user ${userId}: ${videoUrls.length} videos`)

    if (!videoUrls.length) {
      throw new Error('No video URLs provided')
    }

    if (videoUrls.length === 1) {
      // Single video, just return the URL
      return videoUrls[0]
    }

    try {
      // Merge videos using FFmpeg with HTTP inputs directly
      const mergedVideoData = await this.mergeWithFfmpegHttp(videoUrls)

      // Upload to storage
      const videoId = uuidv4()
      const videoPath = `videos/${userId}/merged_${videoId}.mp4`

      const publicUrl = await this.storageService.uploadFile(videoPath, mergedVideoData)

      const totalDuration = Date.now() - startTime
      console.log(`[VIDEO MERGE] Complete in ${totalDuration}ms`)

      return publicUrl
    } catch (error) {
      console.error('[VIDEO MERGE] Error:', error)
      throw error
    }
  }

  /**
   * Merges videos using FFmpeg with HTTP inputs directly.
   * FFmpeg downloads and merges in one pass - no temporary files, no intermediate downloads.
   */
  private async mergeWithFfmpegHttp(videoUrls: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Build concat file content in memory
      const concatContent = videoUrls.map((url) => `file '${url}'`).join('\n')

      // FFmpeg command using concat demuxer with stdin for concat file
      const ffmpegArgs = [
        '-protocol_whitelist',
        'file,http,https,tcp,tls,fd,pipe',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        '-', // Read concat file from stdin
        '-c',
        'copy', // Stream copy (no re-encoding)
        '-f',
        'mp4',
        '-movflags',
        'frag_keyframe+empty_moov',
        '-', // Output to stdout
      ]

      const ffmpeg = spawn('ffmpeg', ffmpegArgs)

      const chunks: Buffer[] = []
      const errorChunks: Buffer[] = []

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      ffmpeg.stderr.on('data', (chunk: Buffer) => {
        errorChunks.push(chunk)
      })

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          const errorMsg = Buffer.concat(errorChunks).toString()
          reject(new Error(`FFmpeg failed with code ${code}: ${errorMsg}`))
          return
        }

        resolve(Buffer.concat(chunks))
      })

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`))
      })

      // Write concat file to stdin
      ffmpeg.stdin.write(concatContent)
      ffmpeg.stdin.end()
    })
  }
}

// Singleton instance
let videoMergeServiceInstance: VideoMergeService | null = null

export function getVideoMergeService(): VideoMergeService {
  if (!videoMergeServiceInstance) {
    videoMergeServiceInstance = new VideoMergeService()
  }
  return videoMergeServiceInstance
}

