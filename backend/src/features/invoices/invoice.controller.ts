import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { invoiceService } from "@/features/invoices/invoice.service";
import {
  createInvoiceSchema,
  invoiceQuerySchema,
  updateInvoiceSchema,
} from "@/features/invoices/invoice.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const invoiceController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = createInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.create(user.organizationId, user.userId, input);
    res.status(201).json(invoice);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = updateInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.update(user.organizationId, user.userId, req.params.id, input);
    res.status(200).json(invoice);
  }),

  issue: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const invoice = await invoiceService.issue(user.organizationId, user.userId, req.params.id);
    res.status(200).json(invoice);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const invoice = await invoiceService.cancel(user.organizationId, user.userId, req.params.id);
    res.status(200).json(invoice);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await invoiceService.softDelete(user.organizationId, user.userId, req.params.id);
    res.status(204).send();
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const invoice = await invoiceService.getById(user.organizationId, req.params.id);
    res.status(200).json(invoice);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = invoiceQuerySchema.parse(req.query);
    const result = await invoiceService.list(user.organizationId, query);
    res.status(200).json(result);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const analytics = await invoiceService.getAnalytics(user.organizationId);
    res.status(200).json(analytics);
  }),

  exportJson: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await invoiceService.toJsonExport(user.organizationId, req.params.id);
    res.status(200).json(data);
  }),
};
