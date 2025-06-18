export const successStatusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
} as const;

export const errorStatusCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,

  LENGTH_REQUIRED: 411,
  REQUEST_ENTITY_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  TOO_EARLY: 425,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type SuccessType = keyof typeof successStatusCodes;
export type SuccessStatusCode = (typeof successStatusCodes)[SuccessType];

export const allStatusCodes = { ...errorStatusCodes, ...successStatusCodes };

export type ErrorType = keyof typeof errorStatusCodes;
export type ErrorStatusCode = (typeof errorStatusCodes)[ErrorType];

export type AllStatusCodes = ErrorStatusCode | SuccessStatusCode;
export type AllType = ErrorType | SuccessType;
