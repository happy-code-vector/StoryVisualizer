import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'story-visualizer.db')
const db = new Database(dbPath)

// Initialize video generator tables
export function initVideoGeneratorTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      idea TEXT,
      story TEXT,
      settings TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS video_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      segment_index INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      video_url TEXT,
      status TEXT DEFAULT 'pending',
      duration INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES video_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      video_url TEXT NOT NULL,
      duration INTEGER,
      file_size INTEGER,
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES video_projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON video_projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_video_segments_project_id ON video_segments(project_id);
    CREATE INDEX IF NOT EXISTS idx_video_outputs_project_id ON video_outputs(project_id);
  `)
}

// Video Project operations
export interface VideoProject {
  id?: number
  user_id: number
  title: string
  idea: string
  story: string
  settings: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
  created_at?: string
  updated_at?: string
}

export function createVideoProject(project: Omit<VideoProject, 'id' | 'created_at' | 'updated_at'>) {
  const stmt = db.prepare(`
    INSERT INTO video_projects (user_id, title, idea, story, settings, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    project.user_id,
    project.title,
    project.idea,
    project.story,
    project.settings,
    project.status
  )
  
  return result.lastInsertRowid
}

export function getVideoProject(id: number) {
  const stmt = db.prepare('SELECT * FROM video_projects WHERE id = ?')
  return stmt.get(id) as VideoProject | undefined
}

export function getUserVideoProjects(userId: number) {
  const stmt = db.prepare(`
    SELECT * FROM video_projects 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `)
  return stmt.all(userId) as VideoProject[]
}

export function updateVideoProject(id: number, updates: Partial<VideoProject>) {
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ')
  
  const stmt = db.prepare(`
    UPDATE video_projects 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `)
  
  stmt.run(...Object.values(updates), id)
}

export function deleteVideoProject(id: number) {
  const stmt = db.prepare('DELETE FROM video_projects WHERE id = ?')
  stmt.run(id)
}

// Video Segment operations
export interface VideoSegment {
  id?: number
  project_id: number
  segment_index: number
  prompt: string
  video_url?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  duration?: number
  error_message?: string
  created_at?: string
}

export function createVideoSegment(segment: Omit<VideoSegment, 'id' | 'created_at'>) {
  const stmt = db.prepare(`
    INSERT INTO video_segments (project_id, segment_index, prompt, video_url, status, duration, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    segment.project_id,
    segment.segment_index,
    segment.prompt,
    segment.video_url || null,
    segment.status,
    segment.duration || null,
    segment.error_message || null
  )
  
  return result.lastInsertRowid
}

export function getProjectSegments(projectId: number) {
  const stmt = db.prepare(`
    SELECT * FROM video_segments 
    WHERE project_id = ? 
    ORDER BY segment_index ASC
  `)
  return stmt.all(projectId) as VideoSegment[]
}

export function updateVideoSegment(id: number, updates: Partial<VideoSegment>) {
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ')
  
  const stmt = db.prepare(`
    UPDATE video_segments 
    SET ${fields} 
    WHERE id = ?
  `)
  
  stmt.run(...Object.values(updates), id)
}

// Video Output operations
export interface VideoOutput {
  id?: number
  project_id: number
  video_url: string
  duration?: number
  file_size?: number
  thumbnail_url?: string
  created_at?: string
}

export function createVideoOutput(output: Omit<VideoOutput, 'id' | 'created_at'>) {
  const stmt = db.prepare(`
    INSERT INTO video_outputs (project_id, video_url, duration, file_size, thumbnail_url)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    output.project_id,
    output.video_url,
    output.duration || null,
    output.file_size || null,
    output.thumbnail_url || null
  )
  
  return result.lastInsertRowid
}

export function getProjectOutput(projectId: number) {
  const stmt = db.prepare(`
    SELECT * FROM video_outputs 
    WHERE project_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `)
  return stmt.get(projectId) as VideoOutput | undefined
}

// Statistics
export function getVideoGenerationStats(userId?: number) {
  const baseQuery = `
    SELECT 
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
      SUM(CASE WHEN status = 'generating' THEN 1 ELSE 0 END) as in_progress_projects,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_projects
    FROM video_projects
  `
  
  const stmt = userId 
    ? db.prepare(`${baseQuery} WHERE user_id = ?`)
    : db.prepare(baseQuery)
  
  return userId ? stmt.get(userId) : stmt.get()
}

// Initialize tables on import
initVideoGeneratorTables()

export default db
