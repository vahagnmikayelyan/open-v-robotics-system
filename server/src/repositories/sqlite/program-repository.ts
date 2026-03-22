import { IProgram, IProgramRepository } from '../../types/program.js';
import SqliteClient from '../../database/sqlite-client.js';

class ProgramRepository implements IProgramRepository {
  private readonly db: any;

  constructor(dbClient: SqliteClient['db']) {
    this.db = dbClient;
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM programs').all();
    return (rows as IProgram[]).map((row) => ({
      ...row,
      modules: JSON.parse((row.modules as any) || '[]'),
    }));
  }

  getById(id: number) {
    const row = this.db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, modules: JSON.parse(row.modules || '[]') };
  }

  create(data: IProgram) {
    const insert = this.db.prepare(`INSERT INTO programs (name, aiModel, systemInstruction, modules)
                                    VALUES (?, ?, ?, ?)`);
    const modulesJson = JSON.stringify(data.modules || []);
    const result = insert.run(data.name, data.aiModel, data.systemInstruction, modulesJson);

    return { ...data, id: result.lastInsertRowid };
  }

  update(id: number, data: IProgram) {
    const updateStmt = this.db.prepare(
      `UPDATE programs SET name = ?, aiModel = ?, systemInstruction = ?, modules = ? WHERE id = ?`,
    );
    const modulesJson = JSON.stringify(data.modules || []);
    const result = updateStmt.run(data.name, data.aiModel, data.systemInstruction, modulesJson, id);
    return result.changes > 0;
  }

  delete(id: number) {
    const result = this.db.prepare('DELETE FROM programs WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export default ProgramRepository;
