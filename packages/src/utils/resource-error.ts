export const defaultResourceTimeout = 30000;

type ResourceType = 'font' | 'font manifest' | 'image';
type ReadyErrorCode = 'RESOURCE_FAILED' | 'RESOURCE_TIMEOUT' | 'READY_TIMEOUT' | 'CARD_DESTROYED';

export interface ReadyError extends Error {
  code: ReadyErrorCode;
}

export interface ResourceError extends ReadyError {
  resourceType: ResourceType;
  resource: string;
}

export const resourceError = (type: ResourceType, resource: string, cause: unknown) => {
  const error = new Error(`Failed to load ${type}: ${resource}`, { cause }) as ResourceError;
  error.name = 'CardReadyError';
  error.code = 'RESOURCE_FAILED';
  error.resourceType = type;
  error.resource = resource;
  return error;
};

export const readyError = (code: ReadyErrorCode, message: string) => {
  const error = new Error(message) as ReadyError;
  error.name = 'CardReadyError';
  error.code = code;
  return error;
};

export const loadWithTimeout = <T>(load: () => T | PromiseLike<T>, resource: string, onTimeout?: () => void) => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(readyError('RESOURCE_TIMEOUT', `Resource loading timed out: ${resource}`));
    }, defaultResourceTimeout);
    Promise.resolve().then(load).then(resolve, reject).finally(() => clearTimeout(timer));
  });
};
