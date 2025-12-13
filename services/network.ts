const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number, label?: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return new Promise<T>((resolve, reject) => {
    const name = label || 'Operación';
    timeoutId = setTimeout(() => {
      reject(new Error(`${name} excedió ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export interface NetworkRetryOptions {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  label?: string;
}

export const runWithRetryAndTimeout = async <T>(
  operation: () => Promise<T>,
  options?: NetworkRetryOptions
): Promise<T> => {
  const { timeoutMs = 15000, retries = 2, backoffMs = 1200, label } = options ?? {};
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await withTimeout(operation, timeoutMs, label);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await delay(backoffMs * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError;
};
