import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { ApiError } from "@/shared/utils/api-error";
import { buildPaginationMeta, toSkipTake, type PaginatedResult } from "@/shared/utils/pagination";
import { parseGstCsv } from "@/features/reconciliation/parsers/gst-csv.parser";
import { parseGstJson } from "@/features/reconciliation/parsers/gst-json.parser";
import {
  detectAmountMismatch,
  detectDuplicateGstEntries,
  detectDuplicateInvoices,
  detectGstMismatch,
  detectMissingGstEntries,
  detectMissingInvoices,
  detectMissingPayments,
  detectTaxMismatch,
  type InvoiceRecord,
} from "@/features/reconciliation/detectors/index";
import type {
  ReconciliationQuery,
  StartReconciliationInput,
} from "@/features/reconciliation/reconciliation.schema";

// Local row shapes for query results
interface InvoiceQueryRow {
  id: string;
  invoiceNumber: string;
  grandTotal: { toString(): string };
  cgst: { toString(): string };
  sgst: { toString(): string };
  igst: { toString(): string };
  status: string;
  customer: { gstNumber: string | null };
}

interface PaymentQueryRow {
  invoiceId: string;
}

interface RunRow {
  id: string;
  period: string;
  sourceType: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  _count: { findings: number };
}

interface FindingRow {
  id: string;
  type: string;
  severity: string;
  invoiceId: string | null;
  description: string;
  expectedValue: string | null;
  actualValue: string | null;
}

interface RunWithFindings extends RunRow {
  findings: FindingRow[];
}

export interface ReconciliationRunDTO {
  id: string;
  period: string;
  sourceType: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  findingCount: number;
}

export interface ReconciliationReportDTO {
  runId: string;
  period: string;
  status: string;
  summary: {
    totalFindings: number;
    byType: Array<{ type: string; count: number; severity: string }>;
    byPeriodInvoices: number;
    byPeriodGstEntries: number;
  };
  gstMismatches: Array<{ description: string; expected: string | null; actual: string | null; invoiceId: string | null }>;
  taxDifferences: Array<{ description: string; expected: string | null; actual: string | null; invoiceId: string | null }>;
  unpaidInvoices: Array<{ invoiceId: string | null; description: string; expectedValue: string | null }>;
}

class ReconciliationService {
  async run(
    organizationId: string,
    actorId: string,
    input: StartReconciliationInput
  ): Promise<ReconciliationRunDTO> {
    const recon = await prisma.reconciliationRun.create({
      data: {
        organizationId,
        period: input.period,
        sourceType: input.sourceType,
        status: "PROCESSING",
      },
      include: { _count: { select: { findings: true } } },
    });

    await eventBus.emit(
      EventTypes.GST_SOURCE_UPLOADED,
      organizationId,
      { entityType: "ReconciliationRun", entityId: recon.id, sourceType: input.sourceType, period: input.period },
      actorId
    );

    await eventBus.emit(
      EventTypes.RECONCILIATION_RUN_STARTED,
      organizationId,
      { entityType: "ReconciliationRun", entityId: recon.id, period: input.period },
      actorId
    );

    // Run detectors asynchronously so the API responds immediately with
    // the run ID; the client polls GET /reconciliation/:id for completion.
    setImmediate(() => {
      void this.executeDetectors(organizationId, actorId, recon.id, input);
    });

    return this.toRunDTO(recon);
  }

  private async executeDetectors(
    organizationId: string,
    actorId: string,
    runId: string,
    input: StartReconciliationInput
  ): Promise<void> {
    try {
      const [year, month] = input.period.split("-").map(Number);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59);

      const [invoiceRows, paymentRows] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            organizationId,
            deletedAt: null,
            invoiceDate: { gte: periodStart, lte: periodEnd },
          },
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            cgst: true,
            sgst: true,
            igst: true,
            status: true,
            customer: { select: { gstNumber: true } },
          },
        }),
        prisma.payment.findMany({
          where: { organizationId, deletedAt: null },
          select: { invoiceId: true },
        }),
      ]);

      const systemInvoices: InvoiceRecord[] = (invoiceRows as InvoiceQueryRow[]).map(
        (inv: InvoiceQueryRow) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerGstNumber: inv.customer.gstNumber,
          grandTotal: inv.grandTotal.toString(),
          cgst: inv.cgst.toString(),
          sgst: inv.sgst.toString(),
          igst: inv.igst.toString(),
          status: inv.status,
        })
      );

      const paidInvoiceIds = new Set<string>(
        (paymentRows as PaymentQueryRow[]).map((p: PaymentQueryRow) => p.invoiceId)
      );

      const gstEntries =
        input.sourceType === "GST_CSV"
          ? parseGstCsv(input.sourceData)
          : parseGstJson(input.sourceData);

      const allFindings = [
        ...detectMissingInvoices(gstEntries, systemInvoices),
        ...detectMissingGstEntries(gstEntries, systemInvoices),
        ...detectGstMismatch(gstEntries, systemInvoices),
        ...detectAmountMismatch(gstEntries, systemInvoices),
        ...detectTaxMismatch(gstEntries, systemInvoices),
        ...detectDuplicateInvoices(systemInvoices),
        ...detectDuplicateGstEntries(gstEntries),
        ...detectMissingPayments(systemInvoices, paidInvoiceIds),
      ];

      if (allFindings.length > 0) {
        await prisma.reconciliationFinding.createMany({
          data: allFindings.map((f) => ({
            runId,
            type: f.type,
            severity: f.severity,
            invoiceId: f.invoiceId ?? null,
            description: f.description,
            expectedValue: f.expectedValue ?? null,
            actualValue: f.actualValue ?? null,
          })),
        });
      }

      await prisma.reconciliationRun.update({
        where: { id: runId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await eventBus.emit(
        EventTypes.RECONCILIATION_RUN_COMPLETED,
        organizationId,
        {
          entityType: "ReconciliationRun",
          entityId: runId,
          findingCount: allFindings.length,
        },
        actorId
      );
    } catch (error) {
      await prisma.reconciliationRun.update({
        where: { id: runId },
        data: { status: "FAILED", completedAt: new Date() },
      });
      throw error;
    }
  }

  async getById(organizationId: string, runId: string): Promise<ReconciliationRunDTO> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, organizationId },
      include: { _count: { select: { findings: true } } },
    });
    if (!run) throw ApiError.notFound("Reconciliation run not found");
    return this.toRunDTO(run);
  }

  async list(
    organizationId: string,
    query: ReconciliationQuery
  ): Promise<PaginatedResult<ReconciliationRunDTO>> {
    const where = {
      organizationId,
      ...(query.period ? { period: query.period } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const { skip, take } = toSkipTake(query);
    const [runs, total] = await Promise.all([
      prisma.reconciliationRun.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: { _count: { select: { findings: true } } },
      }),
      prisma.reconciliationRun.count({ where }),
    ]);
    return {
      data: (runs as RunRow[]).map((r: RunRow) => this.toRunDTO(r)),
      meta: buildPaginationMeta(total as number, query.page, query.limit),
    };
  }

  async getReport(organizationId: string, runId: string): Promise<ReconciliationReportDTO> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, organizationId },
      include: {
        findings: true,
        _count: { select: { findings: true } },
      },
    });
    if (!run) throw ApiError.notFound("Reconciliation run not found");

    const typedRun = run as RunWithFindings;
    if (typedRun.status !== "COMPLETED") throw ApiError.badRequest("Reconciliation run is not yet completed");

    const byType = typedRun.findings.reduce(
      (acc: Array<{ type: string; count: number; severity: string }>, f: FindingRow) => {
        const key = f.type;
        const existing = acc.find((r: { type: string }) => r.type === key);
        if (existing) existing.count++;
        else acc.push({ type: key, count: 1, severity: f.severity });
        return acc;
      },
      [] as Array<{ type: string; count: number; severity: string }>
    );

    const fmt = (f: FindingRow) => ({
      invoiceId: f.invoiceId,
      description: f.description,
      expected: f.expectedValue,
      actual: f.actualValue,
    });

    return {
      runId: typedRun.id,
      period: typedRun.period,
      status: typedRun.status,
      summary: {
        totalFindings: typedRun._count.findings,
        byType,
        byPeriodInvoices: 0,
        byPeriodGstEntries: 0,
      },
      gstMismatches: typedRun.findings.filter((f: FindingRow) => f.type === "GST_MISMATCH").map(fmt),
      taxDifferences: typedRun.findings.filter((f: FindingRow) => f.type === "TAX_MISMATCH").map(fmt),
      unpaidInvoices: typedRun.findings
        .filter((f: FindingRow) => f.type === "MISSING_PAYMENT")
        .map((f: FindingRow) => ({
          invoiceId: f.invoiceId,
          description: f.description,
          expectedValue: f.expectedValue,
        })),
    };
  }

  private toRunDTO(run: {
    id: string;
    period: string;
    sourceType: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
    _count: { findings: number };
  }): ReconciliationRunDTO {
    return {
      id: run.id,
      period: run.period,
      sourceType: run.sourceType,
      status: run.status,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
      findingCount: run._count.findings,
    };
  }
}

export const reconciliationService = new ReconciliationService();
