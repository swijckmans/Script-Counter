const Database = require("better-sqlite3");
const path = require("path");

class DatabaseManager {
  constructor() {
    const dbPath = path.join(process.cwd(), "script_counts.db");
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS script_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        final_url TEXT,
        first_party_count INTEGER NOT NULL,
        third_party_count INTEGER NOT NULL,
        inline_count INTEGER NOT NULL,
        first_party_scripts TEXT,
        third_party_scripts TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_url ON script_counts(url);
      CREATE INDEX IF NOT EXISTS idx_created_at ON script_counts(created_at);
    `);
  }

  saveScriptCount(data) {
    const stmt = this.db.prepare(`
      INSERT INTO script_counts (
        url,
        final_url,
        first_party_count,
        third_party_count,
        inline_count,
        first_party_scripts,
        third_party_scripts
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.requestedUrl,
      data.pageUrl,
      data.firstPartyScriptCount,
      data.thirdPartyScriptCount,
      data.inlineScriptCount,
      JSON.stringify(data.firstPartyScripts || []),
      JSON.stringify(data.thirdPartyScripts || [])
    );

    return result.lastInsertRowid;
  }

  getScriptCounts(limit = 100, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM script_counts
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
  }

  getScriptCountByUrl(url) {
    const stmt = this.db.prepare(`
      SELECT * FROM script_counts
      WHERE url = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);

    return stmt.get(url);
  }

  getStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_scans,
        AVG(first_party_count) as avg_first_party,
        AVG(third_party_count) as avg_third_party,
        AVG(inline_count) as avg_inline,
        MAX(created_at) as last_scan
      FROM script_counts
    `);

    return stmt.get();
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
