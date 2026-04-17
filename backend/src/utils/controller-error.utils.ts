export function getStatusCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
}

export function getErrorData(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (typeof error === 'string') {
    return error;
  }

  return error ?? null;
}
