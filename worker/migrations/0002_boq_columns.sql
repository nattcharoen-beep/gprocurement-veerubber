-- Add in-memory BOQ scanner columns to announcements table
ALTER TABLE announcements ADD COLUMN boq_summary TEXT;
ALTER TABLE announcements ADD COLUMN boq_matches TEXT;
