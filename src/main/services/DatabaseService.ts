import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { logger } from '../logger'
import type { DictationEntry, Snippet, WritingStyle } from '../../shared/types'

export class DatabaseService {
  private db!: Database
  private dbPath!: string
  private static instance: DatabaseService
  private initialized = false

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    this.dbPath = path.join(app.getPath('userData'), 'flowclone.db')
    logger.info(`[DB] Initializing database at: ${this.dbPath}`)

    // Find the sql.js WASM file
    const wasmPath = path.join(
      path.dirname(require.resolve('sql.js')),
      '..',
      'dist',
      'sql-wasm.wasm'
    )

    const SQL = await initSqlJs({
      locateFile: () => wasmPath
    })

    // Load existing DB or create new
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath)
      this.db = new SQL.Database(fileBuffer)
      logger.info('[DB] Loaded existing database')
    } else {
      this.db = new SQL.Database()
      logger.info('[DB] Created new database')
    }

    this.migrate()
    this.initialized = true
    logger.info('[DB] Database ready')
  }

  private save(): void {
    const data = this.db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(this.dbPath, buffer)
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS dictation_history (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp        DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_ms      INTEGER  DEFAULT 0,
        original_transcript TEXT NOT NULL,
        cleaned_transcript  TEXT,
        language_detected   TEXT,
        writing_style       TEXT,
        word_count          INTEGER DEFAULT 0,
        app_name            TEXT
      );

      CREATE TABLE IF NOT EXISTS snippets (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger     TEXT NOT NULL UNIQUE,
        expansion   TEXT NOT NULL,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vocabulary (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        term       TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_history_timestamp
        ON dictation_history(timestamp DESC);
    `)
    this.save()
    logger.info('[DB] Migrations complete')
  }

  // ─── Dictation History ───────────────────────────────────────────────────────

  insertHistory(entry: {
    durationMs: number
    originalTranscript: string
    cleanedTranscript?: string
    languageDetected?: string
    writingStyle?: WritingStyle
    wordCount?: number
    appName?: string
  }): void {
    const wordCount = entry.wordCount ?? entry.originalTranscript.split(' ').length
    this.db.run(
      `INSERT INTO dictation_history
        (duration_ms, original_transcript, cleaned_transcript, language_detected, writing_style, word_count, app_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.durationMs,
        entry.originalTranscript,
        entry.cleanedTranscript ?? null,
        entry.languageDetected ?? null,
        entry.writingStyle ?? null,
        wordCount,
        entry.appName ?? null
      ]
    )
    this.save()
  }

  getHistory(query?: string, limit = 100): DictationEntry[] {
    let stmt
    if (query) {
      stmt = this.db.prepare(
        `SELECT * FROM dictation_history
         WHERE original_transcript LIKE ? OR cleaned_transcript LIKE ?
         ORDER BY timestamp DESC LIMIT ?`
      )
      stmt.bind([`%${query}%`, `%${query}%`, limit])
    } else {
      stmt = this.db.prepare(
        `SELECT * FROM dictation_history ORDER BY timestamp DESC LIMIT ?`
      )
      stmt.bind([limit])
    }

    const rows: DictationEntry[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      rows.push(this.mapHistoryRow(row))
    }
    stmt.free()
    return rows
  }

  deleteHistory(id: number): void {
    this.db.run('DELETE FROM dictation_history WHERE id = ?', [id])
    this.save()
  }

  clearHistory(): void {
    this.db.run('DELETE FROM dictation_history')
    this.save()
  }

  pruneHistory(retentionDays: number): void {
    this.db.run(
      `DELETE FROM dictation_history
       WHERE timestamp < datetime('now', '-' || ? || ' days')`,
      [retentionDays]
    )
    this.save()
  }

  private mapHistoryRow(row: any): DictationEntry {
    return {
      id: row.id as number,
      timestamp: row.timestamp as string,
      durationMs: row.duration_ms as number,
      originalTranscript: row.original_transcript as string,
      cleanedTranscript: row.cleaned_transcript as string | null,
      languageDetected: row.language_detected as string | null,
      writingStyle: row.writing_style as WritingStyle | null,
      wordCount: row.word_count as number,
      appName: row.app_name as string | null
    }
  }

  // ─── Snippets ────────────────────────────────────────────────────────────────

  getSnippets(): Snippet[] {
    const stmt = this.db.prepare('SELECT * FROM snippets ORDER BY trigger ASC')
    const rows: Snippet[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      rows.push({
        id: row.id as number,
        trigger: row.trigger as string,
        expansion: row.expansion as string,
        createdAt: row.created_at as string
      })
    }
    stmt.free()
    return rows
  }

  upsertSnippet(trigger: string, expansion: string): void {
    this.db.run(
      `INSERT INTO snippets (trigger, expansion) VALUES (?, ?)
       ON CONFLICT(trigger) DO UPDATE SET expansion = excluded.expansion`,
      [trigger.toLowerCase().trim(), expansion.trim()]
    )
    this.save()
  }

  deleteSnippet(id: number): void {
    this.db.run('DELETE FROM snippets WHERE id = ?', [id])
    this.save()
  }

  findSnippet(trigger: string): string | null {
    const stmt = this.db.prepare('SELECT expansion FROM snippets WHERE trigger = ?')
    stmt.bind([trigger.toLowerCase().trim()])
    if (stmt.step()) {
      const row = stmt.getAsObject()
      stmt.free()
      return row.expansion as string
    }
    stmt.free()
    return null
  }

  // ─── Vocabulary ──────────────────────────────────────────────────────────────

  getVocabulary(): string[] {
    const stmt = this.db.prepare('SELECT term FROM vocabulary ORDER BY term ASC')
    const terms: string[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      terms.push(row.term as string)
    }
    stmt.free()
    return terms
  }

  addVocabularyTerm(term: string): void {
    this.db.run(
      `INSERT INTO vocabulary (term) VALUES (?)
       ON CONFLICT(term) DO NOTHING`,
      [term.trim()]
    )
    this.save()
  }

  deleteVocabularyTerm(term: string): void {
    this.db.run('DELETE FROM vocabulary WHERE term = ?', [term.trim()])
    this.save()
  }

  close(): void {
    if (this.initialized) {
      this.save()
      this.db.close()
    }
  }
}
