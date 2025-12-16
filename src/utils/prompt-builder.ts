/**
 * Create a video generation prompt from user inputs and annotation analysis
 */
export function createVideoPrompt(
  customPrompt: string,
  globalContext: string,
  annotationDescription: string
): string {
  return `
    context: ${globalContext}
    Generate a creative video based on the following input: ${customPrompt}
    Here are the animation annotations detected in the source image: ${annotationDescription}
    The image will have annotations describing how the scene should look. the annotations guide the momvement and visual style, YOU MUST REMOVE THEM IN THE final video.
    The video should be visually engaging and dynamic. stay true to the style of the source material. If request is difficult, perform a HARD cut. 
    `.trim()
}

/**
 * Create a context extraction prompt for video analysis
 */
export function createContextExtractionPrompt(): string {
  return `Extract structured scene information from this video.
Respond with ONLY valid JSON. No explanations, no markdown, no backticks.
Follow this exact structure, keys required:
{
  "entities": [
    { "id": "id-1", "description": "...", "appearance": "..." }
  ],
  "environment": "...",
  "style": "..."
}
If information is missing, use empty strings.`
}

