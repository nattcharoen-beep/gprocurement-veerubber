CREATE INDEX IF NOT EXISTS idx_announcements_budget ON announcements(budget);
CREATE INDEX IF NOT EXISTS idx_announcements_province ON announcements(province);
CREATE INDEX IF NOT EXISTS idx_announcements_announce_date ON announcements(announce_date);
CREATE INDEX IF NOT EXISTS idx_announcements_product_group_type ON announcements(product_group, announce_type);
