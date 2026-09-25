CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('viewer', 'admin')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    receive_email INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT NOT NULL,
    announce_type TEXT NOT NULL, -- P0, B0, 15, D0, W0
    announce_date DATETIME,
    budget REAL,
    department TEXT,
    province TEXT,
    product_group TEXT, -- sport_flooring, playground, factory_flooring, waterproofing
    url TEXT,
    -- Winner fields (W0)
    winner_name TEXT,
    winner_price REAL,
    winner_tax_id TEXT,
    discount_percent REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    announcement_id TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(announcement_id) REFERENCES announcements(id)
);

CREATE TABLE IF NOT EXISTS fetch_logs (
    id TEXT PRIMARY KEY,
    run_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    items_fetched INTEGER DEFAULT 0,
    errors TEXT
);

CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(announce_type);
CREATE INDEX IF NOT EXISTS idx_announcements_group ON announcements(product_group);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(announce_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
