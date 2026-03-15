import SqliteClient from '../../database/sqlite-client.js';
import { IConfig, IConfigRepository } from '../../types/config.js';

class ConfigRepository implements IConfigRepository {
  private db;

  constructor(dbClient: SqliteClient['db']) {
    this.db = dbClient;
  }

  getAll(): IConfig[] {
    const rows = this.db.prepare('SELECT * FROM config').all();

    return (rows as IConfig[]).map((row) => ({
      key: row.key,
      value: JSON.parse(row.value as string),
    }));
  }

  getValue(key: string, defaultValue?: unknown): IConfig['value'] {
    const row = this.db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return row ? JSON.parse((row as IConfig).value as string) : defaultValue;
  }

  set({ key, value }: IConfig): IConfig {
    const query = `
          INSERT INTO config (key, value)
          VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `;

    const stringValue = JSON.stringify(value);
    this.db.prepare(query).run(key, stringValue);

    return { key, value };
  }

  setMany(configsArray: IConfig[]) {
    const query = `
        INSERT INTO config (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `;

    const stmt = this.db.prepare(query);

    const transaction = this.db.transaction((configs: IConfig[]) => {
      for (const config of configs) {
        const stringValue = JSON.stringify(config.value);
        stmt.run(config.key, stringValue);
      }
    });

    transaction(configsArray);
  }
}

export default ConfigRepository;
