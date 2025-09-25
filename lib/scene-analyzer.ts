// Scene analysis and description extraction
export interface SceneAnalysis {
  setting: string
  timeOfDay: string
  mood: string
  atmosphere: string
  keyActions: string[]
  characters: string[]
  objects: string[]
  emotions: string[]
}

export class SceneAnalyzer {
  private static settings = [
    "forest",
    "castle",
    "house",
    "room",
    "kitchen",
    "bedroom",
    "garden",
    "park",
    "city",
    "village",
    "town",
    "street",
    "road",
    "path",
    "bridge",
    "river",
    "mountain",
    "hill",
    "valley",
    "cave",
    "dungeon",
    "tower",
    "church",
    "school",
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
    "sunrise",
    "sunset",
    "twilight",
  ]

  private static moodWords = [
    "dark",
    "bright",
    "gloomy",
    "cheerful",
    "mysterious",
    "peaceful",
    "chaotic",
    "tense",
    "calm",
    "exciting",
    "scary",
    "beautiful",
    "ugly",
    "serene",
    "violent",
  ]

  private static actionWords = [
    "walked",
    "ran",
    "jumped",
    "climbed",
    "fell",
    "stood",
    "sat",
    "lay",
    "opened",
    "closed",
    "grabbed",
    "threw",
    "caught",
    "hit",
    "kicked",
    "spoke",
    "whispered",
    "shouted",
    "laughed",
    "cried",
    "smiled",
    "frowned",
  ]

  private static emotionWords = [
    "happy",
    "sad",
    "angry",
    "afraid",
    "excited",
    "nervous",
    "calm",
    "worried",
    "surprised",
    "confused",
    "disappointed",
    "relieved",
    "proud",
    "ashamed",
  ]

  private static objects = [
    "sword",
    "shield",
    "book",
    "letter",
    "key",
    "door",
    "window",
    "table",
    "chair",
    "bed",
    "fire",
    "candle",
    "lamp",
    "mirror",
    "painting",
    "flower",
  ]

  static analyzeScene(sceneContent: string, characters: string[]): SceneAnalysis {
    const lowerContent = sceneContent.toLowerCase()

    return {
      setting: this.extractSetting(lowerContent),
      timeOfDay: this.extractTimeOfDay(lowerContent),
      mood: this.extractMood(lowerContent),
      atmosphere: this.extractAtmosphere(sceneContent),
      keyActions: this.extractActions(lowerContent),
      characters: this.findCharactersInScene(sceneContent, characters),
      objects: this.extractObjects(lowerContent),
      emotions: this.extractEmotions(lowerContent),
    }
  }

  private static extractSetting(content: string): string {
    const foundSettings = this.settings.filter((setting) => content.includes(setting))

    if (foundSettings.length > 0) {
      return foundSettings[0]
    }

    // Look for "in the" or "at the" patterns
    const locationPattern = /(?:in|at)\s+the\s+([a-z]+)/g
    const matches = content.match(locationPattern)
    if (matches && matches.length > 0) {
      const location = matches[0].replace(/(?:in|at)\s+the\s+/, "")
      return location
    }

    return "unknown location"
  }

  private static extractTimeOfDay(content: string): string {
    const foundTimes = this.timeIndicators.filter((time) => content.includes(time))

    return foundTimes.length > 0 ? foundTimes[0] : "unspecified time"
  }

  private static extractMood(content: string): string {
    const foundMoods = this.moodWords.filter((mood) => content.includes(mood))

    if (foundMoods.length > 0) {
      return foundMoods[0]
    }

    // Analyze sentence structure for mood
    if (content.includes("!")) {
      return "exciting"
    } else if (content.includes("...")) {
      return "mysterious"
    } else if (content.includes("?")) {
      return "uncertain"
    }

    return "neutral"
  }

  private static extractAtmosphere(content: string): string {
    const sentences = content.split(/[.!?]+/)
    const descriptiveSentences = sentences.filter(
      (sentence) =>
        sentence.includes("was") ||
        sentence.includes("were") ||
        sentence.includes("seemed") ||
        sentence.includes("appeared"),
    )

    if (descriptiveSentences.length > 0) {
      return descriptiveSentences[0].trim().substring(0, 100) + "..."
    }

    return "The scene unfolds with quiet intensity"
  }

  private static extractActions(content: string): string[] {
    const foundActions = this.actionWords.filter((action) => content.includes(action))

    return foundActions.slice(0, 5) // Limit to top 5 actions
  }

  private static findCharactersInScene(content: string, allCharacters: string[]): string[] {
    return allCharacters.filter((character) => content.toLowerCase().includes(character.toLowerCase()))
  }

  private static extractObjects(content: string): string[] {
    const foundObjects = this.objects.filter((object) => content.includes(object))

    return foundObjects.slice(0, 5)
  }

  private static extractEmotions(content: string): string[] {
    const foundEmotions = this.emotionWords.filter((emotion) => content.includes(emotion))

    return foundEmotions.slice(0, 3)
  }

  static generateScenePrompt(analysis: SceneAnalysis): string {
    const parts: string[] = []

    if (analysis.setting !== "unknown location") {
      parts.push(`A ${analysis.setting}`)
    }

    if (analysis.timeOfDay !== "unspecified time") {
      parts.push(`during ${analysis.timeOfDay}`)
    }

    if (analysis.mood !== "neutral") {
      parts.push(`with a ${analysis.mood} atmosphere`)
    }

    if (analysis.objects.length > 0) {
      parts.push(`featuring ${analysis.objects.slice(0, 2).join(" and ")}`)
    }

    if (analysis.emotions.length > 0) {
      parts.push(`evoking ${analysis.emotions[0]} feelings`)
    }

    return parts.join(", ") || "A scene from the story"
  }
}
