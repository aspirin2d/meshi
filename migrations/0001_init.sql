-- Migration number: 0001 	 2025-04-29T08:56:31.612Z
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    username TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER update_profiles_updated_at
AFTER UPDATE ON profiles
FOR EACH ROW
BEGIN
    UPDATE profiles SET updated_at = datetime('now') WHERE id = OLD.id;
END;


CREATE TABLE game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_game_sessions_updated_at
AFTER UPDATE ON game_sessions
FOR EACH ROW
BEGIN
    UPDATE game_sessions SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TABLE heroes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_session_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    stats TEXT, -- could be a JSON string if you store stats dynamically
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

CREATE TRIGGER update_heroes_updated_at
AFTER UPDATE ON heroes
FOR EACH ROW
BEGIN
    UPDATE heroes SET updated_at = datetime('now') WHERE id = OLD.id;
END;
-- Migration ends here
