// Text processing utilities for story analysis
export interface TextSegment {
  text: string
  startIndex: number
  endIndex: number
  type: "paragraph" | "dialogue" | "description"
}

export interface SceneMarker {
  index: number
  confidence: number
  reason: string
}

export class TextProcessor {
  private static sceneTransitionWords = [
    "meanwhile",
    "later",
    "suddenly",
    "then",
    "next",
    "after",
    "before",
    "hours later",
    "days later",
    "weeks later",
    "months later",
    "years later",
    "the next day",
    "that evening",
    "that morning",
    "that night",
    "elsewhere",
    "back at",
    "across town",
    "in another",
    "far away",
  ]

  private static timeIndicators = [
    "morning",
    "afternoon",
    "evening",
    "night",
    "dawn",
    "dusk",
    "midnight",
    "noon",
    "today",
    "yesterday",
    "tomorrow",
    "now",
    "then",
  ]

  private static locationIndicators = [
    "at the",
    "in the",
    "on the",
    "near the",
    "inside",
    "outside",
    "upstairs",
    "downstairs",
    "across",
    "beyond",
    "through",
  ]

  static preprocessText(text: string): string {
    // Clean and normalize text
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .trim()
  }

  static segmentIntoSentences(text: string): string[] {
    // Simple sentence segmentation
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    return sentences
  }

  static segmentIntoParagraphs(text: string): TextSegment[] {
    const paragraphs = text.split(/\n\s*\n/)
    let currentIndex = 0

    return paragraphs
      .map((paragraph) => {
        const trimmed = paragraph.trim()
        const startIndex = currentIndex
        const endIndex = currentIndex + trimmed.length
        currentIndex = endIndex + 2 // Account for paragraph breaks

        return {
          text: trimmed,
          startIndex,
          endIndex,
          type: this.classifyTextType(trimmed),
        }
      })
      .filter((segment) => segment.text.length > 0)
  }

  private static classifyTextType(text: string): "paragraph" | "dialogue" | "description" {
    // Simple classification based on quotation marks and content
    if (text.includes('"') || text.includes("'")) {
      return "dialogue"
    }

    // Check for descriptive language
    const descriptiveWords = ["looked", "appeared", "seemed", "was", "were", "had", "could see"]
    const hasDescriptive = descriptiveWords.some((word) => text.toLowerCase().includes(word))

    if (hasDescriptive) {
      return "description"
    }

    return "paragraph"
  }

  static detectSceneBreaks(segments: TextSegment[]): SceneMarker[] {
    const sceneMarkers: SceneMarker[] = []

    segments.forEach((segment, index) => {
      if (index === 0) return // Skip first segment

      const text = segment.text.toLowerCase()
      let confidence = 0
      const reasons: string[] = []

      // Check for transition words
      this.sceneTransitionWords.forEach((word) => {
        if (text.includes(word)) {
          confidence += 0.3
          reasons.push(`transition word: "${word}"`)
        }
      })

      // Check for time indicators
      this.timeIndicators.forEach((indicator) => {
        if (text.includes(indicator)) {
          confidence += 0.2
          reasons.push(`time change: "${indicator}"`)
        }
      })

      // Check for location indicators
      this.locationIndicators.forEach((indicator) => {
        if (text.includes(indicator)) {
          confidence += 0.2
          reasons.push(`location change: "${indicator}"`)
        }
      })

      // Check for paragraph length (very short paragraphs might be scene breaks)
      if (segment.text.length < 50) {
        confidence += 0.1
        reasons.push("short paragraph")
      }

      // Check for significant gap in original text (double line breaks)
      const prevSegment = segments[index - 1]
      if (segment.startIndex - prevSegment.endIndex > 10) {
        confidence += 0.3
        reasons.push("text gap detected")
      }

      if (confidence > 0.4) {
        sceneMarkers.push({
          index,
          confidence,
          reason: reasons.join(", "),
        })
      }
    })

    return sceneMarkers
  }

  static extractScenes(text: string): Array<{
    id: number
    title: string
    content: string
    startIndex: number
    endIndex: number
  }> {
    const preprocessed = this.preprocessText(text)
    const segments = this.segmentIntoParagraphs(preprocessed)
    const sceneBreaks = this.detectSceneBreaks(segments)

    const scenes: Array<{
      id: number
      title: string
      content: string
      startIndex: number
      endIndex: number
    }> = []

    let currentSceneStart = 0

    sceneBreaks.forEach((marker, index) => {
      const sceneSegments = segments.slice(currentSceneStart, marker.index)
      const content = sceneSegments.map((s) => s.text).join("\n\n")

      if (content.trim().length > 0) {
        scenes.push({
          id: scenes.length + 1,
          title: this.generateSceneTitle(content),
          content,
          startIndex: sceneSegments[0]?.startIndex || 0,
          endIndex: sceneSegments[sceneSegments.length - 1]?.endIndex || 0,
        })
      }

      currentSceneStart = marker.index
    })

    // Add final scene
    const finalSegments = segments.slice(currentSceneStart)
    const finalContent = finalSegments.map((s) => s.text).join("\n\n")

    if (finalContent.trim().length > 0) {
      scenes.push({
        id: scenes.length + 1,
        title: this.generateSceneTitle(finalContent),
        content: finalContent,
        startIndex: finalSegments[0]?.startIndex || 0,
        endIndex: finalSegments[finalSegments.length - 1]?.endIndex || 0,
      })
    }

    return scenes
  }

  private static generateSceneTitle(content: string): string {
    // Extract first meaningful sentence or phrase for title
    const sentences = this.segmentIntoSentences(content)
    if (sentences.length === 0) return "Untitled Scene"

    const firstSentence = sentences[0]

    // Look for location or setting mentions
    const locationWords = [
      "forest",
      "castle",
      "room",
      "house",
      "cave",
      "mountain",
      "river",
      "city",
      "village",
      "garden",
    ]
    const foundLocation = locationWords.find((word) => firstSentence.toLowerCase().includes(word))

    if (foundLocation) {
      return `The ${foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1)}`
    }

    // Look for character names (capitalized words)
    const words = firstSentence.split(" ")
    const capitalizedWords = words.filter((word) => /^[A-Z][a-z]+$/.test(word) && word.length > 2)

    if (capitalizedWords.length > 0) {
      return `${capitalizedWords[0]}'s Scene`
    }

    // Fallback to first few words
    const firstWords = words.slice(0, 3).join(" ")
    return firstWords.length > 30 ? firstWords.substring(0, 30) + "..." : firstWords
  }

  static extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)

    // Remove common stop words
    const stopWords = new Set([
      "the",
      "and",
      "but",
      "for",
      "are",
      "with",
      "his",
      "her",
      "him",
      "she",
      "was",
      "were",
      "been",
      "have",
      "had",
      "has",
      "will",
      "would",
      "could",
      "this",
      "that",
      "they",
      "them",
      "their",
      "there",
      "then",
      "than",
      "from",
      "into",
      "over",
      "under",
      "about",
      "after",
      "before",
    ])

    const filteredWords = words.filter((word) => !stopWords.has(word))

    // Count frequency
    const wordCount = new Map<string, number>()
    filteredWords.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top keywords
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }
}
