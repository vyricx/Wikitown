CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_category ON pages(category);

CREATE TABLE IF NOT EXISTS category_images (
  category TEXT PRIMARY KEY,
  image TEXT NOT NULL
);

-- Seed a sample page
INSERT INTO pages (slug, title, content, summary, category) VALUES
  ('main-page', 'Main Page', 'Welcome to **Wikitown**, your free encyclopedia.\n\nThis is a community-built wiki with articles on a wide range of topics. Use the search bar above or browse by category to explore.', 'The main landing page of Wikitown.', 'General');
