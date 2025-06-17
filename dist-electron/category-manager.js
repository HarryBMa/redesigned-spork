"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryManager = void 0;
class CategoryManager {
    store;
    categories;
    constructor(store) {
        this.store = store;
        this.categories = new Map();
        this.loadCategories();
    }
    loadCategories() {
        const savedCategories = this.store.get('categories', {});
        // Load saved categories
        Object.entries(savedCategories).forEach(([prefix, category]) => {
            this.categories.set(prefix.toUpperCase(), category);
        });
        // Add default categories if none exist
        if (this.categories.size === 0) {
            this.addDefaultCategories();
        }
    }
    addDefaultCategories() {
        const defaultCategories = [
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
    getCategoryFromBarcode(barcode) {
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
    addCategory(category) {
        this.categories.set(category.prefix.toUpperCase(), category);
        this.saveCategories();
    }
    removeCategory(prefix) {
        const removed = this.categories.delete(prefix.toUpperCase());
        if (removed) {
            this.saveCategories();
        }
        return removed;
    }
    updateCategory(prefix, updates) {
        const category = this.categories.get(prefix.toUpperCase());
        if (category) {
            const updatedCategory = { ...category, ...updates };
            this.categories.set(prefix.toUpperCase(), updatedCategory);
            this.saveCategories();
            return true;
        }
        return false;
    }
    getAllCategories() {
        return Array.from(this.categories.values());
    }
    getCategory(prefix) {
        return this.categories.get(prefix.toUpperCase()) || null;
    }
    saveCategories() {
        const categoriesToSave = {};
        this.categories.forEach((category, prefix) => {
            categoriesToSave[prefix] = category;
        });
        this.store.set('categories', categoriesToSave);
    }
    // Get category statistics
    getCategoryPrefixes() {
        return Array.from(this.categories.keys());
    }
    getCategoryNames() {
        return Array.from(this.categories.values()).map(c => c.name);
    }
}
exports.CategoryManager = CategoryManager;
