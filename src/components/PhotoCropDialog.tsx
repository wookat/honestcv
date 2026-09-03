import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const OUTPUT_SIZE = 256
const MAX_ZOOM = 3
const VIEWPORT = 192 // matches the size-48 crop area

export interface PhotoDraft {
  /** Object URL for the picked image (revoked by the caller on close) */
  url: string
  width: number
  height: number
}

interface Props {
  draft: PhotoDraft
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

/**
 * Square crop editor for the profile photo: zoom slider plus drag or
 * arrow keys to reposition. The default state (centered, 1x) matches the automatic
 * center crop. Save renders the chosen source rect to a 256x256 JPEG.
 */
export function PhotoCropDialog({ draft, onSave, onCancel }: Props) {
  const [zoom, setZoom] = useState(1)
  // Crop-center offset from the image center, in source pixels
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  const side = Math.min(draft.width, draft.height)
  const crop = side / zoom
  const maxX = (draft.width - crop) / 2
  const maxY = (draft.height - crop) / 2
  const clamp = (v: number, max: number) => Math.min(max, Math.max(-max, v))
  const cx = clamp(offset.x, maxX)
  const cy = clamp(offset.y, maxY)

  const s = VIEWPORT / crop

  const srcRect = () => ({
    sx: (draft.width - crop) / 2 + cx,
    sy: (draft.height - crop) / 2 + cy,
    size: crop,
  })

  const save = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { sx, sy, size } = srcRect()
      ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      onSave(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = draft.url
  }

  const { sx, sy } = srcRect()

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xs sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
          <DialogDescription>
            Drag or use arrow keys to reposition, zoom to crop tighter.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div
            className="focus-visible:ring-ring relative size-48 touch-none overflow-hidden rounded border bg-slate-200 select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            role="application"
            aria-label="Photo crop area — drag or use arrow keys to reposition"
            tabIndex={0}
            onKeyDown={(e) => {
              const dir = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              }[e.key]
              if (!dir) return
              e.preventDefault()
              const step = (e.shiftKey ? 32 : 8) / s
              setOffset({
                x: clamp(cx + dir[0] * step, maxX),
                y: clamp(cy + dir[1] * step, maxY),
              })
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              dragRef.current = { startX: e.clientX, startY: e.clientY, ox: cx, oy: cy }
            }}
            onPointerMove={(e) => {
              const d = dragRef.current
              if (!d) return
              setOffset({
                x: clamp(d.ox - (e.clientX - d.startX) / s, maxX),
                y: clamp(d.oy - (e.clientY - d.startY) / s, maxY),
              })
            }}
            onPointerUp={() => {
              dragRef.current = null
            }}
            onPointerCancel={() => {
              dragRef.current = null
            }}
          >
            <img
              src={draft.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: draft.width * s,
                height: draft.height * s,
                left: -sx * s,
                top: -sy * s,
              }}
            />
          </div>
          <label className="flex w-full items-center gap-2 text-xs">
            Zoom
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              className="accent-primary w-full"
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-10 sm:min-h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="min-h-10 sm:min-h-9" onClick={save}>
            Save photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
