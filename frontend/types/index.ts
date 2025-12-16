// Navigation Types
export interface NavItem {
  label: string
  href: string
}

// Video Types
export interface VideoClip {
  videoUrl: string
  trimEnd?: number
  duration?: number
}

// API Response Types
export interface VideoJobResponse {
  jobId: string
}

export interface JobStatusResponse {
  status: 'done' | 'waiting' | 'pending' | 'error'
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

export interface ExtractContextResponse {
  entities: Array<{
    id: string
    description: string
    appearance: string
  }>
  environment: string
  style: string
}
