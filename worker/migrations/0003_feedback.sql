-- Migration: 0003_feedback.sql
-- Stores user feedback on whether announcements match Vee Rubber business (ใช่งาน / ไม่ใช่งาน)

CREATE TABLE IF NOT EXISTS project_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    announcement_id TEXT NOT NULL,
    project_id TEXT,
    is_match INTEGER NOT NULL, -- 1 = ใช่งานตรงสาย, 0 = ไม่ใช่งาน
    reason TEXT,               -- e.g. 'not_tires', 'asphalt_road', 'services', 'supplies', 'other'
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_match ON project_feedback(is_match);
CREATE INDEX IF NOT EXISTS idx_feedback_announcement ON project_feedback(announcement_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON project_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON project_feedback(project_id);
