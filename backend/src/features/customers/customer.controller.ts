import type { Request, Response } from "express";
import { customerService } from "@/features/customers/customer.service";
import {
  createCustomerSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from "@/features/customers/customer.schema";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const customerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = createCustomerSchema.parse(req.body);
    const customer = await customerService.create(user.organizationId, user.userId, input);
    res.status(201).json(customer);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = updateCustomerSchema.parse(req.body);
    const customer = await customerService.update(
      user.organizationId,
      user.userId,
      req.params.id,
      input
    );
    res.status(200).json(customer);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await customerService.softDelete(user.organizationId, user.userId, req.params.id);
    res.status(204).send();
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const customer = await customerService.getById(user.organizationId, req.params.id);
    res.status(200).json(customer);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = customerQuerySchema.parse(req.query);
    const result = await customerService.list(user.organizationId, query);
    res.status(200).json(result);
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const history = await customerService.getHistory(user.organizationId, req.params.id);
    res.status(200).json(history);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const analytics = await customerService.getAnalytics(user.organizationId);
    res.status(200).json(analytics);
  }),
};
