import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'story-visualizer.db')
const db = new Database(dbPath)

// Initialize test results table
export function initTestResultsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('image', 'video')),
      url TEXT NOT NULL,
      prompt TEXT,
      model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_test_results_type ON test_results(type);
    CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at DESC);
  `)
}

export interface TestResult {
  id?: number
  type: 'image' | 'video'
  url: string
  prompt?: string
  model?: string
  created_at?: string
}

export function createTestResult(result: Omit<TestResult, 'id' | 'created_at'>) {
  const stmt = db.prepare(`
    INSERT INTO test_results (type, url, prompt, model)
    VALUES (?, ?, ?, ?)
  `)

  const insertResult = stmt.run(
    result.type,
    result.url,
    result.prompt || null,
    result.model || null
  )

  return insertResult.lastInsertRowid
}

export function getAllTestResults(limit?: number): TestResult[] {
  const query = limit
    ? `SELECT * FROM test_results ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM test_results ORDER BY created_at DESC`

  const stmt = db.prepare(query)
  return limit ? stmt.all(limit) as TestResult[] : stmt.all() as TestResult[]
}

export function getTestResultsByType(type: 'image' | 'video', limit?: number): TestResult[] {
  const query = limit
    ? `SELECT * FROM test_results WHERE type = ? ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM test_results WHERE type = ? ORDER BY created_at DESC`

  const stmt = db.prepare(query)
  return limit ? stmt.all(type, limit) as TestResult[] : stmt.all(type) as TestResult[]
}

export function deleteTestResult(id: number) {
  const stmt = db.prepare('DELETE FROM test_results WHERE id = ?')
  stmt.run(id)
}

export function deleteAllTestResults() {
  db.exec('DELETE FROM test_results')
}

// Initialize table on import
initTestResultsTable()

export default db
