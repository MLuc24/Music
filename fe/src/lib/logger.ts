interface LogContext {
  [key: string]: unknown;
}

function formatContext(context?: LogContext) {
  return context ? JSON.stringify(context) : '';
}

export function logAppError(scope: string, message: string, error: unknown, context?: LogContext) {
  console.error(`[${scope}] ${message}`, {
    error,
    context: formatContext(context),
    at: new Date().toISOString(),
  });
}
