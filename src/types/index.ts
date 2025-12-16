// Video Generation Types
export interface VideoGenerationInput {
  customPrompt: string
  globalContext: string
  durationSeconds?: number
}

export interface VideoJobRequest {
  startingImage: Buffer
  globalContext: string
  customPrompt: string
  durationSeconds?: number
  endingImage?: Buffer
}

export type JobStatusType = 'done' | 'waiting' | 'pending' | 'error'

export interface JobStatus {
  status: JobStatusType
  jobStartTime: Date
  jobEndTime?: Date
  videoUrl?: string
  error?: string
  metadata?: Record<string, unknown>
}

export interface VideoJob {
  jobId: string
  operationName: string
  jobStartTime: string
  metadata: Record<string, unknown>
}

// Context Extraction Types
export interface Entity {
  id: string
  description: string
  appearance: string
}

export interface ExtractedContext {
  entities: Entity[]
  environment: string
  style: string
}

// API Response Types
export interface VideoJobResponse {
  jobId: string
}

export interface JobStatusResponse {
  status: JobStatusType
  jobStartTime: string
  jobEndTime?: string
  videoUrl?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export interface ImageEnhanceResponse {
  imageBytes: string
}

export interface MergeVideosResponse {
  videoUrl: string
}

// Error Types
export interface ApiError {
  error: string
}
