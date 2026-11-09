class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

const STATUS_TEXT = {
  400: "Bad Request",
  404: "Not Found",
  409: "Conflict",
  413: "Payload Too Large",
  415: "Unsupported Media Type",
  500: "Internal Server Error",
};

function badRequest(message, fields) {
  return new HttpError(400, message, fields ? { fields } : undefined);
}

function notFound(message) {
  return new HttpError(404, message);
}

function conflict(message) {
  return new HttpError(409, message);
}

function sendError(res, status, message, extra) {
  const body = {
    error: STATUS_TEXT[status] || "Error",
    message,
  };

  if (extra) {
    Object.assign(body, extra);
  }

  res.status(status).json(body);
}

module.exports = {
  HttpError,
  badRequest,
  notFound,
  conflict,
  sendError,
};
