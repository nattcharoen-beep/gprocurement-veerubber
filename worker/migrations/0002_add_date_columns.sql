ALTER TABLE announcements ADD COLUMN doc_start_date TEXT;
ALTER TABLE announcements ADD COLUMN doc_end_date TEXT;
ALTER TABLE announcements ADD COLUMN bid_date TEXT;
ALTER TABLE announcements ADD COLUMN bid_time TEXT;
ALTER TABLE announcements ADD COLUMN doc_verified INTEGER DEFAULT 0;