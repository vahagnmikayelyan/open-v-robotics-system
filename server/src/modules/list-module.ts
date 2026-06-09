import { defineModule, IModuleDeps } from '../types/module.js';

function parseItems(items: any): string[] {
  if (Array.isArray(items)) {
    return items;
  }
  if (typeof items === 'string') {
    return items.split(',').map((i) => i.trim()).filter(Boolean);
  }
  return [];
}

export default defineModule({
  id: 'list',
  name: 'List',
  description: 'Creates and manages interactive lists on the screen (e.g., shopping lists)',
  category: 'service',

  getTools: () => [
    {
      module: 'list',
      name: 'list_createList',
      description: 'Creates a new list and displays it on the screen. Replaces any previously active list.',
      parameters: [
        {
          name: 'items',
          description: 'An array of text items to add to the list',
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
    {
      module: 'list',
      name: 'list_addItems',
      description: 'Adds new items to the currently active list on the screen.',
      parameters: [
        {
          name: 'items',
          description: 'An array of text items to add',
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
    {
      module: 'list',
      name: 'list_removeItems',
      description: 'Removes items from the list by text (case-insensitive match).',
      parameters: [
        {
          name: 'items',
          description: 'An array of item texts to remove from the list',
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
    {
      module: 'list',
      name: 'list_checkItems',
      description: 'Toggles the checked/completed status of items in the list.',
      parameters: [
        {
          name: 'items',
          description: 'An array of item texts to check or uncheck',
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
    {
      module: 'list',
      name: 'list_getList',
      description: 'Returns the current list data including items and their checked status. Use this to retrieve the list contents for sending to other modules (e.g., Telegram, Google Docs).',
      parameters: [],
    },
    {
      module: 'list',
      name: 'list_clearList',
      description: 'Clears the list data and hides it from the screen.',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new ListModule(deps);
  },
});

class ListModule {
  private items: Array<{ text: string; checked: boolean }> = [];

  constructor(private deps: IModuleDeps) {}

  private emitListUpdate() {
    this.deps.emitToUI('showList', {
      items: this.items,
    });
  }

  async createList({ items }: { items: any }): Promise<{ message: string; count: number }> {
    console.log('[ListModule] createList received items:', items);
    const parsed = parseItems(items);
    this.items = parsed.map((text) => ({ text, checked: false }));
    this.emitListUpdate();
    return { message: 'List created', count: this.items.length };
  }

  async addItems({ items }: { items: any }): Promise<{ message: string; count: number }> {
    console.log('[ListModule] addItems received items:', items);
    if (this.items.length === 0) {
      return { message: 'No active list. Create a list first.', count: 0 };
    }
    const parsed = parseItems(items);
    const newItems = parsed.map((text) => ({ text, checked: false }));
    this.items.push(...newItems);
    this.emitListUpdate();
    return { message: `Added ${parsed.length} items`, count: this.items.length };
  }

  async removeItems({ items }: { items: any }): Promise<{ message: string; removed: string[]; count: number }> {
    console.log('[ListModule] removeItems received items:', items);
    const parsed = parseItems(items);
    const lowerItems = parsed.map((i) => i.toLowerCase());
    const removed: string[] = [];

    this.items = this.items.filter((item) => {
      if (lowerItems.includes(item.text.toLowerCase())) {
        removed.push(item.text);
        return false;
      }
      return true;
    });

    if (this.items.length > 0) {
      this.emitListUpdate();
    } else {
      this.deps.emitToUI('clearList');
    }

    return { message: `Removed ${removed.length} items`, removed, count: this.items.length };
  }

  async checkItems({ items }: { items: any }): Promise<{ message: string }> {
    console.log('[ListModule] checkItems received items:', items);
    const parsed = parseItems(items);
    const lowerItems = parsed.map((i) => i.toLowerCase());
    for (const item of this.items) {
      if (lowerItems.includes(item.text.toLowerCase())) {
        item.checked = !item.checked;
      }
    }
    this.emitListUpdate();
    return { message: 'Items updated' };
  }

  async getList(): Promise<{ items: Array<{ text: string; checked: boolean }>; count: number }> {
    return {
      items: [...this.items],
      count: this.items.length,
    };
  }

  async clearList(): Promise<{ message: string }> {
    this.items = [];
    this.deps.emitToUI('clearList');
    return { message: 'List cleared' };
  }

  // UI interaction handlers (called from touchscreen, not from AI)

  async toggleItem({ item }: { item: string }): Promise<{ success: boolean }> {
    const found = this.items.find((i) => i.text.toLowerCase() === item.toLowerCase());
    if (found) {
      found.checked = !found.checked;
      this.emitListUpdate();
    }
    return { success: !!found };
  }

  async deleteItem({ item }: { item: string }): Promise<{ success: boolean }> {
    const index = this.items.findIndex((i) => i.text.toLowerCase() === item.toLowerCase());
    if (index !== -1) {
      this.items.splice(index, 1);
      if (this.items.length > 0) {
        this.emitListUpdate();
      } else {
        this.deps.emitToUI('clearList');
      }
    }
    return { success: index !== -1 };
  }
}
