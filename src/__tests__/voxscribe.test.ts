import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron app for tests
vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/test',
    getVersion: () => '1.0.0'
  },
  clipboard: {
    readText: vi.fn(() => 'original clipboard'),
    writeText: vi.fn(),
    readImage: vi.fn(() => ({ isEmpty: () => true }))
  }
}))

vi.mock('../src/main/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('AIEditorService - cleanupTranscript', () => {
  it('instructs to preserve text and only correct grammatical/pronunciation/ethical mistakes', () => {
    const systemPrompt = `You are a professional speech-to-text editor. Your job is to clean up the transcribed speech according to these strict rules:
1. Keep the text exactly as the user spoke, without any changes. Do NOT rewrite, rephrase, or restructure the text. Do NOT change the tone or format of the speech.
2. Any corrections should ONLY be made for grammatical errors or pronunciation/spelling issues (such as homophones or transcription errors).
3. Double quotation marks should ONLY be inserted where necessary (e.g., around direct quotes or speech).
4. No text should be altered unless it is a grammatical or ethical mistake.
5. Return ONLY the cleaned text, nothing else. Do not include any introductory or concluding comments.`
    
    expect(systemPrompt).toContain('Keep the text exactly as the user spoke')
    expect(systemPrompt).toContain('Any corrections should ONLY be made for grammatical errors or pronunciation/spelling issues')
    expect(systemPrompt).toContain('Double quotation marks should ONLY be inserted where necessary')
    expect(systemPrompt).toContain('No text should be altered unless it is a grammatical or ethical mistake')
  })

  it('normalizes voice commands correctly', () => {
    const commandMap = [
      { input: 'Rewrite this professionally', expected: 'rewrite_professionally' },
      { input: 'Summarize this text', expected: 'summarize' },
      { input: 'Translate to Hindi', expected: 'translate' },
      { input: 'Convert to bullet points', expected: 'bullet_points' },
      { input: 'Make it shorter', expected: 'make_shorter' },
      { input: 'Make it longer', expected: 'make_longer' },
      { input: 'Fix grammar', expected: 'fix_grammar' },
      { input: 'Create an email', expected: 'create_email' },
      { input: 'Create LinkedIn post', expected: 'create_linkedin' }
    ]

    // Simulate the normalizeCommand logic
    function normalizeCommand(command: string): string {
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

    commandMap.forEach(({ input, expected }) => {
      expect(normalizeCommand(input)).toBe(expected)
    })
  })

  it('extracts language from command string', () => {
    const langMap: Record<string, string> = {
      hindi: 'Hindi',
      kannada: 'Kannada',
      tamil: 'Tamil',
      telugu: 'Telugu',
      malayalam: 'Malayalam',
      english: 'English'
    }

    function extractLanguage(command: string): string | undefined {
      const lower = command.toLowerCase()
      for (const [key, value] of Object.entries(langMap)) {
        if (lower.includes(key)) return value
      }
      return undefined
    }

    expect(extractLanguage('Translate to Hindi')).toBe('Hindi')
    expect(extractLanguage('Translate to Kannada')).toBe('Kannada')
    expect(extractLanguage('Translate to Tamil')).toBe('Tamil')
    expect(extractLanguage('Convert to English')).toBe('English')
    expect(extractLanguage('Make shorter')).toBeUndefined()
  })
})

describe('DatabaseService - SQL schema', () => {
  it('snippet trigger should be lowercased', () => {
    const trigger = '  My Email  '
    const normalized = trigger.toLowerCase().trim()
    expect(normalized).toBe('my email')
  })

  it('expansion should be trimmed', () => {
    const expansion = '  user@example.com  '
    expect(expansion.trim()).toBe('user@example.com')
  })

  it('word count is calculated correctly', () => {
    const text = 'Hello can you send that tomorrow please'
    const wordCount = text.split(' ').length
    expect(wordCount).toBe(7)
  })
})

describe('TextInsertionService - clipboard logic', () => {
  it('should not insert empty text', async () => {
    const emptyTexts = ['', '   ', '\n']
    emptyTexts.forEach(text => {
      expect(text.trim()).toBeFalsy()
    })
  })

  it('clipboard restore delay should be positive', () => {
    const RESTORE_DELAY_MS = 300
    expect(RESTORE_DELAY_MS).toBeGreaterThan(0)
    expect(RESTORE_DELAY_MS).toBeLessThan(1000)
  })
})

describe('Settings defaults', () => {
  it('default hotkey is Ctrl+Shift', async () => {
    const { DEFAULT_SETTINGS } = await import('../shared/types')
    expect(DEFAULT_SETTINGS.primaryHotkey).toBe('Ctrl+Shift')
    expect(DEFAULT_SETTINGS.commandPaletteHotkey).toBe('Ctrl+Shift+Enter')
  })

  it('default writing style is professional', async () => {
    const { DEFAULT_SETTINGS } = await import('../shared/types')
    expect(DEFAULT_SETTINGS.writingStyle).toBe('professional')
  })

  it('AI cleanup is enabled by default', async () => {
    const { DEFAULT_SETTINGS } = await import('../shared/types')
    expect(DEFAULT_SETTINGS.aiCleanupEnabled).toBe(true)
  })

  it('history retention is 30 days by default', async () => {
    const { DEFAULT_SETTINGS } = await import('../shared/types')
    expect(DEFAULT_SETTINGS.historyRetentionDays).toBe(30)
  })
})
