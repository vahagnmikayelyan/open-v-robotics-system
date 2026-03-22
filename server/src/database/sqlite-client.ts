import * as fs from 'node:fs';
import path from 'path';
import Database from 'better-sqlite3';

const configsTableQuery = `
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

const programsTableQuery = `
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    aiModel TEXT,
    systemInstruction TEXT,
    modules TEXT DEFAULT '[]',
    addTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    editTime DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

class SqliteClient {
  private readonly db;

  constructor(dbPath: string) {
    const dbDirectory = path.dirname(dbPath);

    if (!fs.existsSync(dbDirectory)) {
      fs.mkdirSync(dbDirectory);
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.init();
  }

  init() {
    this.db.exec(configsTableQuery);
    this.db.exec(programsTableQuery);
    console.log(`[DB] SQLite initialized. Tables verified.`);
  }

  getInstance() {
    return this.db;
  }
}

export default SqliteClient;
