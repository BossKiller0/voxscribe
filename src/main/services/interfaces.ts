import type { WritingStyle, TranscriptionResult } from '../shared/types'

// ─── ITranscriptionProvider ───────────────────────────────────────────────────
// Implement this to support OpenAI, Gemini, Local Whisper, etc.

export interface ITranscriptionProvider {
  /**
   * Transcribe an audio file to text.
   * @param audioPath Absolute path to the audio file (WAV/MP3/WebM)
   * @param language  BCP-47 language code or 'auto' for detection
   */
  transcribeAudio(audioPath: string, language?: string): Promise<TranscriptionResult>

  /**
   * Translate audio to English text.
   */
  translateAudio(audioPath: string): Promise<string>

  /**
   * Detect the spoken language in an audio file.
   * Returns a BCP-47 language code string.
   */
  detectLanguage(audioPath: string): Promise<string>
}

// ─── IAIEditor ────────────────────────────────────────────────────────────────
// Implement this to support different LLM backends for AI cleanup.

export interface IAIEditor {
  /**
   * Clean up a raw transcript: remove filler words, fix punctuation/grammar,
   * apply writing style, preserve custom vocabulary terms.
   */
  cleanupTranscript(
    text: string,
    style: WritingStyle,
    vocabulary: string[]
  ): Promise<string>

  /**
   * Execute a voice command on selected text.
   * e.g., "Rewrite professionally", "Translate to Hindi", "Make shorter"
   */
  executeCommand(command: string, selectedText: string): Promise<string>

  /**
   * Rewrite text with a specific instruction.
   */
  rewrite(text: string, instruction: string): Promise<string>
}

// ─── ICommandProcessor ────────────────────────────────────────────────────────
// Handles parsing voice commands and routing them to the correct handler.

export interface ICommandProcessor {
  /**
   * Parse a spoken command string and return a structured command.
   */
  parseCommand(spokenText: string): ParsedCommand | null

  /**
   * Execute a structured command and return the transformed text.
   */
  executeCommand(command: ParsedCommand, context: string): Promise<string>
}

export interface ParsedCommand {
  type:
    | 'rewrite'
    | 'summarize'
    | 'translate'
    | 'bullet_points'
    | 'make_shorter'
    | 'make_longer'
    | 'fix_grammar'
    | 'create_email'
    | 'create_linkedin'
    | 'custom'
  language?: string        // for translate commands
  instruction?: string    // for custom commands
  originalText: string
}
