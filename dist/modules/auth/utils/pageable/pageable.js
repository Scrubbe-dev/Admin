"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pageable = void 0;
class Pageable {
    data;
    total;
    page;
    limit;
    totalPages;
    hasNext;
    hasPrevious;
    constructor({ data, total, page, limit }) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = Math.ceil(total / limit);
        this.hasNext = page < this.totalPages;
        this.hasPrevious = page > 1;
    }
}
exports.Pageable = Pageable;
