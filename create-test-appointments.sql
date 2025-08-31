-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    shop_id TEXT,
    barber_id TEXT,
    guest_name TEXT,
    start_time INTEGER,
    end_time INTEGER,
    status TEXT,
    created_at INTEGER,
    deleted_at INTEGER
);

-- Insert test appointments for today (Aug 31, 2025)
-- 9:00 AM - 9:45 AM: Fade Cut
INSERT OR REPLACE INTO appointments VALUES (
    'apt-1',
    '6ac05b41-85e2-4b3e-9985-e5c7ad813684',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Future Client 1',
    1756627200000, -- 2025-08-31 09:00:00 UTC
    1756629900000, -- 2025-08-31 09:45:00 UTC
    'scheduled',
    1756627200000,
    NULL
);

-- 10:30 AM - 11:15 AM: Hot Towel Shave
INSERT OR REPLACE INTO appointments VALUES (
    'apt-2',
    '6ac05b41-85e2-4b3e-9985-e5c7ad813684',
    'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
    'Future Client 2',
    1756632600000, -- 2025-08-31 10:30:00 UTC
    1756635300000, -- 2025-08-31 11:15:00 UTC
    'scheduled',
    1756627200000,
    NULL
);
