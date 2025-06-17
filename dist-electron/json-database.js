"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const path_1 = require("path");
const electron_1 = require("electron");
const fs_1 = require("fs");
class DatabaseManager {
    dbPath;
    data = {
        scanLogs: [],
        equipment: [],
        categories: [],
        nextId: 1
    };
    constructor() {
        this.dbPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'surgical-inventory.json');
    }
    async initialize() {
        try {
            const fileContent = await fs_1.promises.readFile(this.dbPath, 'utf-8');
            this.data = JSON.parse(fileContent);
            // Convert timestamp strings back to Date objects
            this.data.scanLogs = this.data.scanLogs.map(log => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
        }
        catch (error) {
            // File doesn't exist or is corrupted, start with empty data
            console.log('Creating new database file');
            await this.saveData();
        }
    }
    async saveData() {
        try {
            await fs_1.promises.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Failed to save database:', error);
            throw error;
        }
    }
    async addScanLog(log) {
        const newLog = {
            ...log,
            id: this.data.nextId++,
            timestamp: new Date(log.timestamp)
        };
        this.data.scanLogs.push(newLog);
        await this.saveData();
        return newLog.id;
    }
    async getScanLogs(filters = {}) {
        let filteredLogs = [...this.data.scanLogs];
        // Apply filters
        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
        }
        if (filters.category) {
            filteredLogs = filteredLogs.filter(log => log.category === filters.category);
        }
        if (filters.action) {
            filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Apply limit
        if (filters.limit) {
            filteredLogs = filteredLogs.slice(0, filters.limit);
        }
        return filteredLogs;
    }
    async getLastScanForBarcode(barcode) {
        const logs = this.data.scanLogs
            .filter(log => log.barcode === barcode)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return logs[0] || null;
    }
    async getStatistics() {
        const logs = this.data.scanLogs;
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayLogs = logs.filter(log => log.timestamp >= todayStart);
        const categories = {};
        logs.forEach(log => {
            categories[log.category] = (categories[log.category] || 0) + 1;
        });
        return {
            totalScans: logs.length,
            checkouts: logs.filter(log => log.action === 'checkout').length,
            checkins: logs.filter(log => log.action === 'checkin').length,
            categoriesUsed: Object.keys(categories).length,
            todayScans: todayLogs.length,
            categories
        };
    }
    async close() {
        // Save final state
        await this.saveData();
    }
}
exports.DatabaseManager = DatabaseManager;
