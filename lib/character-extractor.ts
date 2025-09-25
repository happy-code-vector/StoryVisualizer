// Character extraction and analysis utilities
export interface Character {
  name: string
  mentions: number
  descriptions: string[]
  attributes: string[]
  relationships: string[]
  firstMention: number
}

export class CharacterExtractor {
  private static namePatterns = [
    /\b[A-Z][a-z]{2,}\b/g, // Capitalized words (potential names)
  ]

  private static descriptiveWords = [
    "tall",
    "short",
    "young",
    "old",
    "beautiful",
    "handsome",
    "strong",
    "weak",
    "brave",
    "cowardly",
    "kind",
    "cruel",
    "wise",
    "foolish",
    "dark",
    "light",
    "blonde",
    "brunette",
    "red-haired",
    "blue-eyed",
    "green-eyed",
    "brown-eyed",
  ]

  private static relationshipWords = [
    "friend",
    "enemy",
    "brother",
    "sister",
    "father",
    "mother",
    "son",
    "daughter",
    "husband",
    "wife",
    "lover",
    "partner",
    "ally",
    "rival",
    "mentor",
    "student",
  ]

  static extractCharacters(text: string): Character[] {
    const preprocessed = text.replace(/[""]/g, '"') // Normalize quotes
    const sentences = preprocessed.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    // Find potential character names
    const potentialNames = new Map<
      string,
      {
        count: number
        contexts: string[]
        firstIndex: number
      }
    >()

    sentences.forEach((sentence, index) => {
      const matches = sentence.match(this.namePatterns[0])
      if (matches) {
        matches.forEach((match) => {
          const name = match.trim()

          // Filter out common words that aren't names
          if (this.isLikelyName(name, sentence)) {
            if (!potentialNames.has(name)) {
              potentialNames.set(name, {
                count: 0,
                contexts: [],
                firstIndex: index,
              })
            }

            const entry = potentialNames.get(name)!
            entry.count++
            entry.contexts.push(sentence.trim())
          }
        })
      }
    })

    // Filter and process characters
    const characters: Character[] = []

    potentialNames.forEach((data, name) => {
      // Only consider names mentioned multiple times or in descriptive contexts
      if (data.count >= 2 || this.hasDescriptiveContext(data.contexts)) {
        const character: Character = {
          name,
          mentions: data.count,
          descriptions: this.extractDescriptions(name, data.contexts),
          attributes: this.extractAttributes(name, data.contexts),
          relationships: this.extractRelationships(name, data.contexts),
          firstMention: data.firstIndex,
        }

        characters.push(character)
      }
    })

    // Sort by mention count and first appearance
    return characters.sort((a, b) => {
      if (a.mentions !== b.mentions) {
        return b.mentions - a.mentions
      }
      return a.firstMention - b.firstMention
    })
  }

  private static isLikelyName(word: string, context: string): boolean {
    // Filter out common words that aren't names
    const commonWords = new Set([
      "The",
      "And",
      "But",
      "For",
      "Are",
      "With",
      "His",
      "Her",
      "She",
      "Him",
      "Was",
      "Were",
      "Been",
      "Have",
      "Had",
      "Has",
      "Will",
      "Would",
      "Could",
      "This",
      "That",
      "They",
      "Them",
      "Their",
      "There",
      "Then",
      "Than",
      "From",
      "Into",
      "Over",
      "Under",
      "About",
      "After",
      "Before",
      "Where",
      "When",
      "What",
      "Who",
      "Why",
      "How",
      "Which",
      "While",
      "During",
    ])

    if (commonWords.has(word)) {
      return false
    }

    // Check if it appears in name-like contexts
    const nameContexts = [
      new RegExp(`${word}\\s+(said|asked|replied|whispered|shouted)`, "i"),
      new RegExp(`(said|asked|replied|whispered|shouted)\\s+${word}`, "i"),
      new RegExp(`${word}'s`, "i"),
      new RegExp(`${word}\\s+(was|is|had|has)`, "i"),
    ]

    return nameContexts.some((pattern) => pattern.test(context))
  }

  private static hasDescriptiveContext(contexts: string[]): boolean {
    return contexts.some((context) => this.descriptiveWords.some((word) => context.toLowerCase().includes(word)))
  }

  private static extractDescriptions(name: string, contexts: string[]): string[] {
    const descriptions: string[] = []

    contexts.forEach((context) => {
      const lowerContext = context.toLowerCase()
      const lowerName = name.toLowerCase()

      // Look for descriptive patterns
      const patterns = [
        new RegExp(`${lowerName}\\s+was\\s+([^.!?]+)`, "i"),
        new RegExp(`${lowerName}\\s+had\\s+([^.!?]+)`, "i"),
        new RegExp(`${lowerName}\\s+looked\\s+([^.!?]+)`, "i"),
        new RegExp(`${lowerName}\\s+appeared\\s+([^.!?]+)`, "i"),
        new RegExp(`the\\s+([^\\s]+)\\s+${lowerName}`, "i"),
      ]

      patterns.forEach((pattern) => {
        const match = context.match(pattern)
        if (match && match[1]) {
          const description = match[1].trim()
          if (description.length > 3 && description.length < 100) {
            descriptions.push(description)
          }
        }
      })
    })

    return [...new Set(descriptions)] // Remove duplicates
  }

  private static extractAttributes(name: string, contexts: string[]): string[] {
    const attributes: string[] = []

    contexts.forEach((context) => {
      this.descriptiveWords.forEach((word) => {
        if (context.toLowerCase().includes(word) && context.toLowerCase().includes(name.toLowerCase())) {
          attributes.push(word)
        }
      })
    })

    return [...new Set(attributes)]
  }

  private static extractRelationships(name: string, contexts: string[]): string[] {
    const relationships: string[] = []

    contexts.forEach((context) => {
      this.relationshipWords.forEach((relationship) => {
        if (context.toLowerCase().includes(relationship) && context.toLowerCase().includes(name.toLowerCase())) {
          relationships.push(relationship)
        }
      })
    })

    return [...new Set(relationships)]
  }

  static generateCharacterDescription(character: Character): string {
    const parts: string[] = []

    if (character.attributes.length > 0) {
      parts.push(character.attributes.slice(0, 3).join(", "))
    }

    if (character.descriptions.length > 0) {
      parts.push(character.descriptions[0])
    }

    if (character.relationships.length > 0) {
      parts.push(`known as ${character.relationships[0]}`)
    }

    return parts.join(", ") || "A character in the story"
  }
}
