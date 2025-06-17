"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportManager = void 0;
const electron_1 = require("electron");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const date_fns_1 = require("date-fns");
class ExportManager {
    dbManager;
    constructor(dbManager) {
        this.dbManager = dbManager;
    }
    async exportData(fileFormat, filters) {
        try {
            const logs = await this.dbManager.getScanLogs(filters);
            const timestamp = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd_HH-mm-ss');
            const fileName = `surgical-inventory-${timestamp}.${fileFormat}`;
            const filePath = (0, path_1.join)(electron_1.app.getPath('documents'), fileName);
            let content;
            if (fileFormat === 'csv') {
                content = this.generateCSV(logs);
            }
            else {
                content = this.generateJSON(logs);
            }
            await (0, promises_1.writeFile)(filePath, content, 'utf8');
            return {
                success: true,
                filePath
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async exportWithDialog(fileFormat) {
        try {
            const timestamp = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd_HH-mm-ss');
            const defaultPath = `surgical-inventory-${timestamp}.${fileFormat}`;
            const result = await electron_1.dialog.showSaveDialog({
                title: `Export as ${fileFormat.toUpperCase()}`,
                defaultPath,
                filters: [
                    {
                        name: fileFormat.toUpperCase(),
                        extensions: [fileFormat]
                    },
                    {
                        name: 'All Files',
                        extensions: ['*']
                    }
                ]
            });
            if (result.canceled || !result.filePath) {
                return {
                    success: false,
                    error: 'Export canceled'
                };
            }
            const logs = await this.dbManager.getScanLogs();
            let content;
            if (fileFormat === 'csv') {
                content = this.generateCSV(logs);
            }
            else {
                content = this.generateJSON(logs);
            }
            await (0, promises_1.writeFile)(result.filePath, content, 'utf8');
            return {
                success: true,
                filePath: result.filePath
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    generateCSV(logs) {
        const headers = ['ID', 'Barcode', 'Category', 'Action', 'Timestamp', 'Metadata'];
        const csvLines = [headers.join(',')];
        logs.forEach(log => {
            const row = [
                log.id?.toString() || '',
                `"${log.barcode}"`,
                `"${log.category}"`,
                log.action,
                log.timestamp.toISOString(),
                log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
            ];
            csvLines.push(row.join(','));
        });
        return csvLines.join('\n');
    }
    generateJSON(logs) {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            totalRecords: logs.length,
            data: logs.map(log => ({
                id: log.id,
                barcode: log.barcode,
                category: log.category,
                action: log.action,
                timestamp: log.timestamp.toISOString(),
                metadata: log.metadata
            }))
        };
        return JSON.stringify(exportData, null, 2);
    }
    async generateDailyReport(date) {
        try {
            const targetDate = date || new Date();
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            const logs = await this.dbManager.getScanLogs({
                startDate: startOfDay,
                endDate: endOfDay
            });
            const statistics = await this.dbManager.getStatistics();
            const reportData = {
                date: (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd'),
                summary: {
                    totalScans: logs.length,
                    checkouts: logs.filter(l => l.action === 'checkout').length,
                    checkins: logs.filter(l => l.action === 'checkin').length,
                    categoriesUsed: new Set(logs.map(l => l.category)).size
                },
                categoryBreakdown: this.getCategoryBreakdown(logs),
                detailedLogs: logs
            };
            const fileName = `daily-report-${(0, date_fns_1.format)(targetDate, 'yyyy-MM-dd')}.json`;
            const filePath = (0, path_1.join)(electron_1.app.getPath('documents'), fileName);
            await (0, promises_1.writeFile)(filePath, JSON.stringify(reportData, null, 2), 'utf8');
            return {
                success: true,
                filePath
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    getCategoryBreakdown(logs) {
        const breakdown = {};
        logs.forEach(log => {
            if (!breakdown[log.category]) {
                breakdown[log.category] = { checkouts: 0, checkins: 0 };
            }
            if (log.action === 'checkout') {
                breakdown[log.category].checkouts++;
            }
            else {
                breakdown[log.category].checkins++;
            }
        });
        return breakdown;
    }
}
exports.ExportManager = ExportManager;
