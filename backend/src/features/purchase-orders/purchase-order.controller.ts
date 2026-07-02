import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { purchaseOrderService } from "@/features/purchase-orders/purchase-order.service";
import {
  createPurchaseOrderSchema,
  purchaseOrderQuerySchema,
  updatePurchaseOrderSchema,
} from "@/features/purchase-orders/purchase-order.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const purchaseOrderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = createPurchaseOrderSchema.parse(req.body);
    const po = await purchaseOrderService.create(user.organizationId, user.userId, input);
    res.status(201).json(po);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = updatePurchaseOrderSchema.parse(req.body);
    const po = await purchaseOrderService.update(user.organizationId, user.userId, req.params.id, input);
    res.status(200).json(po);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await purchaseOrderService.softDelete(user.organizationId, user.userId, req.params.id);
    res.status(204).send();
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const po = await purchaseOrderService.getById(user.organizationId, req.params.id);
    res.status(200).json(po);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = purchaseOrderQuerySchema.parse(req.query);
    const result = await purchaseOrderService.list(user.organizationId, query);
    res.status(200).json(result);
  }),
};
