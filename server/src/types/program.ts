export interface IProgram {
  id: number;
  name: string;
  aiModel: string;
  systemInstruction: string;
  modules: string[];
  addTime: string;
  editTime: string;
}

export interface IProgramRepository {
  getAll: () => IProgram[];
  getById: (id: number) => IProgram;
  create: (program: IProgram) => IProgram;
  update: (id: number, program: IProgram) => boolean;
  delete: (id: number) => boolean;
}

export interface IProgramController {
  getPrograms: () => IProgram[];
  getProgram: (id: number) => IProgram;
  createProgram: (data: IProgram) => IProgram;
  updateProgram: (id: number, data: IProgram) => IProgram;
  deleteProgram: (id: number) => void;
}
