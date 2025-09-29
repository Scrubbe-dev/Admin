"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLA_RULES = void 0;
exports.getSLARule = getSLARule;
exports.calculateSLADeadlines = calculateSLADeadlines;
exports.formatTimeRemaining = formatTimeRemaining;
exports.calculateHalfTimeDeadline = calculateHalfTimeDeadline;
// SLA Configuration
exports.SLA_RULES = [
    { severity: 'critical', responseTimeMinutes: 15, resolveTimeMinutes: 120 },
    { severity: 'high', responseTimeMinutes: 30, resolveTimeMinutes: 240 },
    { severity: 'medium', responseTimeMinutes: 120, resolveTimeMinutes: 1440 },
    { severity: 'low', responseTimeMinutes: 240, resolveTimeMinutes: 2880 }
];
// Get SLA Rule by Severity
function getSLARule(severity) {
    const rule = exports.SLA_RULES.find(rule => rule.severity === severity.toLowerCase());
    if (!rule) {
        console.warn(`Invalid severity "${severity}", defaulting to "medium"`);
        return exports.SLA_RULES.find(rule => rule.severity === 'medium');
    }
    return rule;
}
// Calculate SLA Deadlines
function calculateSLADeadlines(severity, createdAt) {
    const rule = getSLARule(severity);
    return {
        respondBy: new Date(createdAt.getTime() + rule.responseTimeMinutes * 60000),
        resolveBy: new Date(createdAt.getTime() + rule.resolveTimeMinutes * 60000)
    };
}
// Format time remaining for display
function formatTimeRemaining(targetDate) {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0)
        return '0s';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0)
        return `${days}d ${hours}h`;
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
// Calculate half-time deadline
function calculateHalfTimeDeadline(createdAt, totalMinutes) {
    return new Date(createdAt.getTime() + (totalMinutes / 2) * 60000);
}
