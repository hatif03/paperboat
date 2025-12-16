import { supabase } from './supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

export async function apiFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {})

  // Don't override existing Authorization header
  if (!headers.has('Authorization')) {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  // Construct full URL
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`

  return fetch(url, { ...init, headers })
}

// Type definitions for API responses
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

// API functions
export async function createVideoJob(formData: FormData): Promise<VideoJobResponse> {
  const response = await apiFetch('/video', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create video job')
  }

  return response.json()
}

export async function getVideoJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await apiFetch(`/video/${jobId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get job status')
  }

  return response.json()
}

export async function enhanceImage(formData: FormData): Promise<ImageEnhanceResponse> {
  const response = await apiFetch('/image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to enhance image')
  }

  return response.json()
}

export async function extractContext(formData: FormData): Promise<ExtractContextResponse> {
  const response = await apiFetch('/extract-context', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extract context')
  }

  return response.json()
}

export async function mergeVideos(videoUrls: string[]): Promise<MergeVideosResponse> {
  const response = await apiFetch('/video/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoUrls }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to merge videos')
  }

  return response.json()
}

export async function uploadVideo(itemName: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch(`/video/${encodeURIComponent(itemName)}`, {
    method: 'PUT',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload video')
  }

  return response.json()
}

