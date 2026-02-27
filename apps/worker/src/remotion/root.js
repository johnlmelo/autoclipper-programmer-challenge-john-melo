import React from "react"
import { AbsoluteFill, Audio, Composition, Img, Sequence, useCurrentFrame, useVideoConfig } from "remotion"

const DEFAULT_FPS = 30
const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080
const DEFAULT_DURATION_SECONDS = 1

const getNumber = (value, fallback) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

const getElementFrameWindow = (element, fps) => {
  const start = Math.max(0, Math.floor(getNumber(element?.startInSeconds, 0) * fps))
  const end = Math.max(start + 1, Math.floor(getNumber(element?.endInSeconds, 0) * fps))
  return { start, durationInFrames: end - start }
}

const getImageSource = (element) => {
  if (typeof element?.sourceUrl === "string" && element.sourceUrl.length > 0) {
    return element.sourceUrl
  }
  if (typeof element?.url === "string" && element.url.length > 0) {
    return element.url
  }
  return null
}

const RenderComposition = (props) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const elements = Array.isArray(props?.elements) ? props.elements : []

  const activeSolid = elements.find((element) => {
    if (element?.type !== "solid") {
      return false
    }
    const start = getNumber(element.startInSeconds, 0)
    const end = getNumber(element.endInSeconds, 0)
    const second = frame / fps
    return second >= start && second < end
  })

  return (
    <AbsoluteFill style={{ backgroundColor: activeSolid?.color ?? "#111111" }}>
      {elements.map((element, index) => {
        const { start, durationInFrames } = getElementFrameWindow(element, fps)

        if (element?.type === "text") {
          const style = element.style ?? {}
          return (
            <Sequence key={`text-${index}`} from={start} durationInFrames={durationInFrames}>
              <AbsoluteFill
                style={{
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  pointerEvents: "none"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: getNumber(style.x, 100),
                    top: getNumber(style.y, 100),
                    fontSize: getNumber(style.fontSize, 48),
                    color: typeof style.color === "string" ? style.color : "#ffffff",
                    backgroundColor: typeof style.backgroundColor === "string" ? style.backgroundColor : "transparent",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontFamily: "Arial, sans-serif",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {String(element.content ?? "")}
                </div>
              </AbsoluteFill>
            </Sequence>
          )
        }

        if (element?.type === "image") {
          const style = element.style ?? {}
          const source = getImageSource(element)
          if (!source) {
            return null
          }

          return (
            <Sequence key={`image-${index}`} from={start} durationInFrames={durationInFrames}>
              <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Img
                  src={source}
                  style={{
                    position: "absolute",
                    left: getNumber(style.x, 0),
                    top: getNumber(style.y, 0),
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    opacity: getNumber(style.opacity, 100) / 100
                  }}
                />
              </AbsoluteFill>
            </Sequence>
          )
        }

        if (element?.type === "audio" && typeof element?.sourceUrl === "string" && element.sourceUrl.length > 0) {
          return (
            <Sequence key={`audio-${index}`} from={start} durationInFrames={durationInFrames}>
              <Audio src={element.sourceUrl} volume={getNumber(element?.style?.volume, 100) / 100} />
            </Sequence>
          )
        }

        return null
      })}
    </AbsoluteFill>
  )
}

export const RemotionRoot = () => {
  return (
    <Composition
      id="RenderComposition"
      component={RenderComposition}
      durationInFrames={DEFAULT_FPS * DEFAULT_DURATION_SECONDS}
      fps={DEFAULT_FPS}
      width={DEFAULT_WIDTH}
      height={DEFAULT_HEIGHT}
      defaultProps={{
        durationInSeconds: DEFAULT_DURATION_SECONDS,
        fps: DEFAULT_FPS,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        elements: []
      }}
      calculateMetadata={async ({ props }) => {
        const fps = Math.max(1, Math.round(getNumber(props?.fps, DEFAULT_FPS)))
        const durationInSeconds = Math.max(1, getNumber(props?.durationInSeconds, DEFAULT_DURATION_SECONDS))
        const width = Math.max(1, Math.round(getNumber(props?.width, DEFAULT_WIDTH)))
        const height = Math.max(1, Math.round(getNumber(props?.height, DEFAULT_HEIGHT)))

        return {
          fps,
          durationInFrames: Math.max(1, Math.round(durationInSeconds * fps)),
          width,
          height
        }
      }}
    />
  )
}
