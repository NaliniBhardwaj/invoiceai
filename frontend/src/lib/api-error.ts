export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function extractErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: ApiErrorBody } }).response;
    return resp?.data?.error?.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
