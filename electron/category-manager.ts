import Store from 'electron-store';

export interface Category {
  name: string;
  prefix: string;
  description?: string;
  color?: string;
}

export class CategoryManager {
  private store: Store;
  private categories: Map<string, Category>;

  constructor(store: Store) {
    this.store = store;
    this.categories = new Map();
    this.loadCategories();
  }

  private loadCategories() {
    const savedCategories = this.store.get('categories', {}) as { [key: string]: Category };
    
    // Load saved categories
    Object.entries(savedCategories).forEach(([prefix, category]) => {
      this.categories.set(prefix.toUpperCase(), category);
    });

    // Add default categories if none exist
    if (this.categories.size === 0) {
      this.addDefaultCategories();
    }
  }

  private addDefaultCategories() {
    const defaultCategories: Category[] = [
      {
        name: 'Käkkirurgi',
        prefix: 'KÄKX',
        description: 'Käkkirurgiska instrument',
        color: '#3B82F6'
      },
      {
        name: 'Ortopedi',
        prefix: 'ORTO',
        description: 'Ortopediska instrument',
        color: '#10B981'
      },
      {
        name: 'Kardio',
        prefix: 'CARD',
        description: 'Kardiovaskulära instrument',
        color: '#EF4444'
      },
      {
        name: 'Neuro',
        prefix: 'NEUR',
        description: 'Neurokirurgiska instrument',
        color: '#8B5CF6'
      },
      {
        name: 'Allmän Kirurgi',
        prefix: 'ALLM',
        description: 'Allmänkirurgiska instrument',
        color: '#F59E0B'
      },
      {
        name: 'Plastik',
        prefix: 'PLAS',
        description: 'Plastikkirurgiska instrument',
        color: '#EC4899'
      },
      {
        name: 'Urologi',
        prefix: 'UROL',
        description: 'Urologiska instrument',
        color: '#06B6D4'
      },
      {
        name: 'Gynekologi',
        prefix: 'GYNE',
        description: 'Gynekologiska instrument',
        color: '#84CC16'
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.prefix, category);
    });

    this.saveCategories();
  }

  getCategoryFromBarcode(barcode: string): string | null {
    const upperBarcode = barcode.toUpperCase();
    
    // Check for exact prefix matches first
    for (const [prefix, category] of this.categories) {
      if (upperBarcode.startsWith(prefix)) {
        return category.name;
      }
    }

    // Check for partial matches (minimum 3 characters)
    for (const [prefix, category] of this.categories) {
      if (prefix.length >= 3 && upperBarcode.startsWith(prefix.substring(0, 3))) {
        return category.name;
      }
    }

    return null;
  }

  addCategory(category: Category): void {
    this.categories.set(category.prefix.toUpperCase(), category);
    this.saveCategories();
  }

  removeCategory(prefix: string): boolean {
    const removed = this.categories.delete(prefix.toUpperCase());
    if (removed) {
      this.saveCategories();
    }
    return removed;
  }

  updateCategory(prefix: string, updates: Partial<Category>): boolean {
    const category = this.categories.get(prefix.toUpperCase());
    if (category) {
      const updatedCategory = { ...category, ...updates };
      this.categories.set(prefix.toUpperCase(), updatedCategory);
      this.saveCategories();
      return true;
    }
    return false;
  }

  getAllCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  getCategory(prefix: string): Category | null {
    return this.categories.get(prefix.toUpperCase()) || null;
  }

  private saveCategories(): void {
    const categoriesToSave: { [key: string]: Category } = {};
    this.categories.forEach((category, prefix) => {
      categoriesToSave[prefix] = category;
    });
    this.store.set('categories', categoriesToSave);
  }

  // Get category statistics
  getCategoryPrefixes(): string[] {
    return Array.from(this.categories.keys());
  }

  getCategoryNames(): string[] {
    return Array.from(this.categories.values()).map(c => c.name);
  }
}
