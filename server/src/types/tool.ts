export interface IToolDeclaration {
  module: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    description: string;
    isRequired: boolean;
    type: string;
    items?: { type: string };
  }>;
}

