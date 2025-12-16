import { createClient, RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'
import type { JobStatus, VideoJob } from '../types/index'

export class JobService {
  private redis: RedisClientType | null = null
  private connected: boolean = false

  constructor() {
    this.initRedis()
  }

  private async initRedis() {
    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      console.log('No REDIS_URL set, using Motia state for job management')
      return
    }

    try {
      this.redis = createClient({ url: redisUrl })
      this.redis.on('error', (err) => console.error('Redis Client Error', err))
      await this.redis.connect()
      this.connected = true
      console.log('Connected to Redis for job management')
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.redis = null
    }
  }

  private serialize(data: Record<string, unknown>): string {
    return JSON.stringify(data)
  }

  private deserialize(data: string | null): Record<string, unknown> | null {
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  /**
   * Create a pending job entry in Redis
   * Returns the job ID
   */
  async createPendingJob(): Promise<string> {
    const jobId = uuidv4()

    const pendingJob = {
      status: 'pending',
      jobStartTime: new Date().toISOString(),
    }

    if (this.redis && this.connected) {
      await this.redis.setEx(`job:${jobId}:pending`, 300, this.serialize(pendingJob))
    }

    return jobId
  }

  /**
   * Store a video job with operation name after video generation starts
   */
  async storeVideoJob(jobId: string, operationName: string, metadata?: Record<string, unknown>): Promise<void> {
    const job: VideoJob = {
      jobId,
      operationName,
      jobStartTime: new Date().toISOString(),
      metadata: metadata || {},
    }

    if (this.redis && this.connected) {
      // Remove pending status
      await this.redis.del(`job:${jobId}:pending`)
      // Store actual job
      await this.redis.setEx(`job:${jobId}`, 300, this.serialize(job as unknown as Record<string, unknown>))
    }
  }

  /**
   * Store an error for a job
   */
  async storeJobError(jobId: string, error: string): Promise<void> {
    const errorJob = {
      status: 'error',
      error,
      jobStartTime: new Date().toISOString(),
    }

    if (this.redis && this.connected) {
      // Remove pending status
      await this.redis.del(`job:${jobId}:pending`)
      // Store error
      await this.redis.setEx(`job:${jobId}:error`, 300, this.serialize(errorJob))
    }
  }

  /**
   * Get the raw job data from Redis
   */
  async getJobData(jobId: string): Promise<{
    type: 'pending' | 'error' | 'job' | 'not_found'
    data: Record<string, unknown> | null
  }> {
    if (!this.redis || !this.connected) {
      return { type: 'not_found', data: null }
    }

    // Check pending
    const pendingData = await this.redis.get(`job:${jobId}:pending`)
    if (pendingData) {
      return { type: 'pending', data: this.deserialize(pendingData) }
    }

    // Check error
    const errorData = await this.redis.get(`job:${jobId}:error`)
    if (errorData) {
      return { type: 'error', data: this.deserialize(errorData) }
    }

    // Check job
    const jobData = await this.redis.get(`job:${jobId}`)
    if (jobData) {
      return { type: 'job', data: this.deserialize(jobData) }
    }

    return { type: 'not_found', data: null }
  }

  /**
   * Remove a completed job from Redis
   */
  async removeJob(jobId: string): Promise<void> {
    if (this.redis && this.connected) {
      await this.redis.del(`job:${jobId}`)
    }
  }

  /**
   * Check Redis health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.redis || !this.connected) {
      return false
    }

    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis && this.connected) {
      await this.redis.quit()
      this.connected = false
    }
  }
}

// Singleton instance
let jobServiceInstance: JobService | null = null

export function getJobService(): JobService {
  if (!jobServiceInstance) {
    jobServiceInstance = new JobService()
  }
  return jobServiceInstance
}

