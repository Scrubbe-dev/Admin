"use strict";
// import { Request, Response } from 'express';
// import { PostmortemService } from './postmortem.services';
// import { IncidentStatus, Priority } from '@prisma/client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostmortemController = void 0;
const postmortem_services_1 = require("./postmortem.services");
const client_1 = require("@prisma/client");
class PostmortemController {
    static async getPostmortems(req, res) {
        try {
            // Parse and validate query parameters
            const filters = {
                incidentId: req.query.incidentId,
                status: req.query.status,
                priority: req.query.priority,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };
            // Validate enum values
            if (filters.status && !Object.values(client_1.IncidentStatus).includes(filters.status)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid status value'
                });
                return;
            }
            if (filters.priority && !Object.values(client_1.Priority).includes(filters.priority)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid priority value'
                });
                return;
            }
            // Validate page number if provided
            if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid page number'
                });
                return;
            }
            const postmortems = await postmortem_services_1.PostmortemService.getPostmortems(filters);
            res.status(200).json({
                status: 'success',
                message: 'Postmortems retrieved successfully',
                data: postmortems,
                pagination: {
                    page: filters.page || 1,
                    count: postmortems.length
                }
            });
        }
        catch (error) {
            console.error('Error retrieving postmortems:', error);
            // Handle specific error messages
            if (error instanceof Error) {
                if (error.message === 'Invalid start date format' || error.message === 'Invalid end date format') {
                    res.status(400).json({
                        status: 'error',
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving postmortems'
            });
        }
    }
}
exports.PostmortemController = PostmortemController;
