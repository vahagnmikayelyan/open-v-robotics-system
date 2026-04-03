import { IProgram, IProgramRepository } from '../../types/program.js';
import SqliteClient from '../../database/sqlite-client.js';

interface IDbProgramRow {
  id: number;
  name: string;
  aiModel: string;
  systemInstruction: string;
  voice: string;
  modules: string;
  addTime: string;
  editTime: string;
}

function rowToProgram(row: IDbProgramRow): IProgram {
  return {
    id: row.id,
    name: row.name,
    aiModel: row.aiModel,
    systemInstruction: row.systemInstruction,
    voice: row.voice,
    modules: JSON.parse(row.modules || '[]') as string[],
    addTime: row.addTime,
    editTime: row.editTime,
  };
}

class ProgramRepository implements IProgramRepository {
  private readonly db: SqliteClient['db'];

  constructor(dbClient: SqliteClient['db']) {
    this.db = dbClient;
  }

  getAll(): IProgram[] {
    const rows = this.db.prepare('SELECT * FROM programs').all() as IDbProgramRow[];
    return rows.map(rowToProgram);
  }

  getById(id: number): IProgram | null {
    const row = this.db.prepare('SELECT * FROM programs WHERE id = ?').get(id) as IDbProgramRow | undefined;
    if (!row) return null;
    return rowToProgram(row);
  }

  create(data: IProgram) {
    const insert = this.db.prepare(`INSERT INTO programs (name, aiModel, systemInstruction, modules, voice)
                                    VALUES (?, ?, ?, ?, ?)`);
    const modulesJson = JSON.stringify(data.modules || []);
    const result = insert.run(data.name, data.aiModel, data.systemInstruction, modulesJson, data.voice);

    return { ...data, id: Number(result.lastInsertRowid) };
  }

  update(id: number, data: IProgram) {
    const updateStmt = this.db.prepare(
      `UPDATE programs SET name = ?, aiModel = ?, systemInstruction = ?, modules = ?, voice = ? WHERE id = ?`,
    );
    const modulesJson = JSON.stringify(data.modules || []);
    const result = updateStmt.run(data.name, data.aiModel, data.systemInstruction, modulesJson, data.voice, id);
    return result.changes > 0;
  }

  delete(id: number) {
    const result = this.db.prepare('DELETE FROM programs WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export default ProgramRepository;
