"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatavisualController = void 0;
const chart_1 = require("./chart");
class DatavisualController {
    constructor() { }
    async getDataVisual(req, res, next) {
        try {
            res.json(chart_1.dataVisualizationChart);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DatavisualController = DatavisualController;
