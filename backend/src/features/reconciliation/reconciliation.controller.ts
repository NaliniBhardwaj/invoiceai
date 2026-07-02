import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { reconciliationService } from "@/features/reconciliation/reconciliation.service";
import {
  reconciliationQuerySchema,
  startReconciliationSchema,
} from "@/features/reconciliation/reconciliation.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const reconciliationController = {
  start: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = startReconciliationSchema.parse(req.body);
    const run = await reconciliationService.run(user.organizationId, user.userId, input);
    res.status(202).json(run);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const run = await reconciliationService.getById(user.organizationId, req.params.id);
    res.status(200).json(run);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = reconciliationQuerySchema.parse(req.query);
    const result = await reconciliationService.list(user.organizationId, query);
    res.status(200).json(result);
  }),

  getReport: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const report = await reconciliationService.getReport(user.organizationId, req.params.id);
    res.status(200).json(report);
  }),
};
