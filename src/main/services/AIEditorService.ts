import Groq from 'groq-sdk'
import { logger } from '../logger'
import type { IAIEditor } from './interfaces'
import type { WritingStyle } from '../../shared/types'
import { getSettingsStore } from '../store'

const STYLE_PROMPTS: Record<WritingStyle, string> = {
  casual: 'casual and conversational, like texting a friend',
  professional: 'professional and polished, suitable for business communication',
  technical: 'precise and technical, using domain-appropriate terminology',
  executive: 'executive-level, concise and authoritative',
  friendly: 'warm and friendly, approachable and personable'
}

const COMMAND_PROMPTS: Record<string, (text: string, lang?: string) => string> = {
  rewrite_professionally: (t) =>
    `Rewrite the following text in a professional tone:\n\n${t}`,
  summarize: (t) =>
    `Summarize the following text concisely:\n\n${t}`,
  translate: (t, lang) =>
    `Translate the following text to ${lang || 'Hindi'}:\n\n${t}`,
  bullet_points: (t) =>
    `Convert the following text into clear bullet points:\n\n${t}`,
  make_shorter: (t) =>
    `Make the following text shorter while preserving the key information:\n\n${t}`,
  make_longer: (t) =>
    `Expand the following text with more detail and context:\n\n${t}`,
  fix_grammar: (t) =>
    `Fix the grammar, spelling, and punctuation in the following text. Return only the corrected text:\n\n${t}`,
  create_email: (t) =>
    `Write a professional email based on the following notes/points:\n\n${t}`,
  create_linkedin: (t) =>
    `Write an engaging LinkedIn post based on the following:\n\n${t}`
}

export class AIEditorService implements IAIEditor {
  private client: Groq
  private fastModel: string
  private accurateModel: string
  private useAccurateMode: boolean

  constructor(useAccurateMode = false) {
    const apiKey = getSettingsStore().get('groqApiKey') || process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('Groq API Key is not set in settings or environment')
    }
    this.client = new Groq({ apiKey })
    this.fastModel = process.env.GROQ_EDITOR_MODEL_FAST || 'llama-3.1-8b-instant'
    this.accurateModel = process.env.GROQ_EDITOR_MODEL_ACCURATE || process.env.GROQ_EDITOR_MODEL || 'llama-3.3-70b-versatile'
    this.useAccurateMode = useAccurateMode
    logger.info(`[AIEditor] Initialized. Fast=${this.fastModel}, Accurate=${this.accurateModel}`)
  }

  get currentModel(): string {
    return this.useAccurateMode ? this.accurateModel : this.fastModel
  }

  async cleanupTranscript(
    text: string,
    style: WritingStyle,
    vocabulary: string[]
  ): Promise<string> {
    if (!text.trim()) return text

    const vocabNote =
      vocabulary.length > 0
        ? `\n\nIMPORTANT: Preserve these exact terms as spelled: ${vocabulary.join(', ')}`
        : ''

    const systemPrompt = `You are a professional speech-to-text editor. Your job is to clean up the transcribed speech according to these strict rules:
1. Keep the text exactly as the user spoke, without any changes. Do NOT rewrite, rephrase, or restructure the text. Do NOT change the tone or format of the speech.
2. Any corrections should ONLY be made for grammatical errors or pronunciation/spelling issues (such as homophones or transcription errors).
3. Double quotation marks should ONLY be inserted where necessary (e.g., around direct quotes or speech).
4. No text should be altered unless it is a grammatical or ethical mistake.
5. Remove filler words (uh, um, ah, like, you know, basically, literally, right, so, well)
6. Return ONLY the cleaned text, nothing else. Do not include any introductory or concluding comments. Do NOT wrap the entire output in quotation marks unless they were explicitly spoken.${vocabNote}`

    const userPrompt = `Clean up this transcribed speech:\n\n${text}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.currentModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })

      let cleaned = response.choices[0]?.message?.content?.trim() || text
      
      // Strip outer quotes if they were added by the model and were not in the original text
      if (cleaned.startsWith('"') && cleaned.endsWith('"') && !text.startsWith('"') && !text.endsWith('"')) {
        cleaned = cleaned.slice(1, -1).trim()
      }
      if (cleaned.startsWith('“') && cleaned.endsWith('”') && !text.startsWith('“') && !text.endsWith('”')) {
        cleaned = cleaned.slice(1, -1).trim()
      }
      
      logger.info(`[AIEditor] Cleaned transcript: "${text.substring(0, 50)}..." → "${cleaned.substring(0, 50)}..."`)
      return cleaned
    } catch (err: any) {
      logger.error(`[AIEditor] Cleanup failed: ${err.message}`)
      return text // Return original on failure
    }
  }

  async executeCommand(command: string, selectedText: string): Promise<string> {
    const normalizedCommand = this.normalizeCommand(command)
    const promptFn = COMMAND_PROMPTS[normalizedCommand]

    let promptText: string
    if (promptFn) {
      const lang = this.extractLanguage(command)
      promptText = promptFn(selectedText, lang)
    } else {
      // Custom command
      promptText = `${command}:\n\n${selectedText}`
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.currentModel,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful writing assistant. Return ONLY the transformed text, no explanations.'
          },
          { role: 'user', content: promptText }
        ],
        temperature: 0.5,
        max_tokens: 4096
      })

      return response.choices[0]?.message?.content?.trim() || selectedText
    } catch (err: any) {
      logger.error(`[AIEditor] Command execution failed: ${err.message}`)
      throw err
    }
  }

  async rewrite(text: string, instruction: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.currentModel,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful writing assistant. Return ONLY the rewritten text, no explanations or commentary.'
          },
          {
            role: 'user',
            content: `${instruction}:\n\n${text}`
          }
        ],
        temperature: 0.5,
        max_tokens: 4096
      })

      return response.choices[0]?.message?.content?.trim() || text
    } catch (err: any) {
      logger.error(`[AIEditor] Rewrite failed: ${err.message}`)
      throw err
    }
  }

  private normalizeCommand(command: string): string {
    const lower = command.toLowerCase()
    if (lower.includes('professional')) return 'rewrite_professionally'
    if (lower.includes('summarize') || lower.includes('summary')) return 'summarize'
    if (lower.includes('translat')) return 'translate'
    if (lower.includes('bullet')) return 'bullet_points'
    if (lower.includes('shorter') || lower.includes('concise')) return 'make_shorter'
    if (lower.includes('longer') || lower.includes('expand')) return 'make_longer'
    if (lower.includes('grammar') || lower.includes('fix')) return 'fix_grammar'
    if (lower.includes('email')) return 'create_email'
    if (lower.includes('linkedin')) return 'create_linkedin'
    return 'custom'
  }

  private extractLanguage(command: string): string | undefined {
    const langMap: Record<string, string> = {
      hindi: 'Hindi',
      kannada: 'Kannada',
      tamil: 'Tamil',
      telugu: 'Telugu',
      malayalam: 'Malayalam',
      english: 'English'
    }
    const lower = command.toLowerCase()
    for (const [key, value] of Object.entries(langMap)) {
      if (lower.includes(key)) return value
    }
    return undefined
  }
}
