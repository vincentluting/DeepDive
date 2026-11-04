// lib/share/generate-share-card.ts
// Quick Dive share card generation — html-to-image based PNG export

const CARD_SIZE = 1080
const PIXEL_RATIO = 2

/**
 * Generate a share card PNG as a data URL from a DOM element.
 * The element should be exactly 1080x1080 logical pixels.
 */
export async function generateShareCardDataUrl(
  element: HTMLElement
): Promise<string> {
  const { toPng } = await import('html-to-image')
  return toPng(element, {
    width: CARD_SIZE,
    height: CARD_SIZE,
    pixelRatio: PIXEL_RATIO,
    cacheBust: true,
  })
}

/**
 * Convert a data URL to a Blob (avoids re-rendering for the share action).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}
