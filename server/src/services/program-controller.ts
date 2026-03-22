import { IProgram, IProgramController, IProgramRepository } from '../types/program.js';

class ProgramController implements IProgramController {
  private readonly repository: IProgramRepository;

  constructor(repository: IProgramRepository) {
    this.repository = repository;
  }

  getPrograms() {
    return this.repository.getAll();
  }

  getProgram(id: number) {
    const program = this.repository.getById(id);
    if (!program) throw new Error('Program not found');
    return program;
  }

  createProgram(data: IProgram) {
    return this.repository.create(data);
  }

  updateProgram(id: number, data: IProgram) {
    const success = this.repository.update(id, data);
    if (!success) throw new Error('Program not found');
    return { ...data, id };
  }

  deleteProgram(id: number) {
    const success = this.repository.delete(id);
    if (!success) throw new Error('Program not found');
    return { success: true, id };
  }
}

export default ProgramController;
