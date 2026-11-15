export const defaultResourceTimeout = 30000;

export const resourceError = (type, resource, cause) => {
  const error = new Error(`Failed to load ${type}: ${resource}`, { cause });
  error.name = 'CardReadyError';
  error.code = 'RESOURCE_FAILED';
  error.resourceType = type;
  error.resource = resource;
  return error;
};

export const readyError = (code, message) => {
  const error = new Error(message);
  error.name = 'CardReadyError';
  error.code = code;
  return error;
};

export const loadWithTimeout = (load, resource, onTimeout) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(readyError('RESOURCE_TIMEOUT', `Resource loading timed out: ${resource}`));
    }, defaultResourceTimeout);
    Promise.resolve().then(load).then(resolve, reject).finally(() => clearTimeout(timer));
  });
};
