import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { dashboardService } from "@/features/dashboard/dashboard.service";

export const dashboardController = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const summary = await dashboardService.getSummary(req.user.organizationId);
    res.status(200).json(summary);
  }),
};
