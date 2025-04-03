import { create } from 'zustand';

export interface Tag {
  id: string;
  value: string;
  type: 'operand' | 'number' | 'variable';
}

interface FormulaState {
  formula: string;
  tags: Tag[];
  setFormula: (value: string) => void;
  addTag: (tag: Tag) => void;
  removeLastTag: () => void;
  removeTagById: (id: string) => void;
  calculate: () => number | string;
}

export const useFormulaStore = create<FormulaState>((set, get) => ({
  formula: '',
  tags: [],
  setFormula: (value) => set({ formula: value }),
  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag],
      formula: state.formula + (tag.type === 'operand' ? tag.value : `{${tag.value}}`),
    })),
  removeLastTag: () =>
    set((state) => {
      const newTags = state.tags.slice(0, -1);
      const newFormula = newTags.map((tag) => (tag.type === 'operand' ? tag.value : `{${tag.value}}`)).join('');
      return { tags: newTags, formula: newFormula };
    }),
  removeTagById: (id) =>
    set((state) => {
      const newTags = state.tags.filter((tag) => tag.id !== id);
      const newFormula = newTags.map((tag) => (tag.type === 'operand' ? tag.value : `{${tag.value}}`)).join('');
      return { tags: newTags, formula: newFormula };
    }),
  calculate: () => {
    const { tags } = get();
    try {
      let expression = '';
      const dummyValues = { x: 10, y: 5, z: 2 };
      tags.forEach((tag) => {
        if (tag.type === 'operand') {
          expression += tag.value;
        } else if (tag.type === 'number') {
          expression += tag.value;
        } else {
          expression += dummyValues[tag.value as keyof typeof dummyValues] || 0;
        }
      });
      return eval(expression); // Note: Use a safer library like math.js in production
    } catch (error) {
      return 'Error';
    }
  },
}));