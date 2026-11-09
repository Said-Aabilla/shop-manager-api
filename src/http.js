const { sendError } = require("./errors");

function wrap(handler) {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function requireJson(req, res, next) {
  const type = (req.get("Content-Type") || "").toLowerCase();

  if (!type.includes("application/json")) {
    sendError(
      res,
      415,
      "The body must be JSON. Set the header Content-Type to application/json."
    );
    return;
  }

  next();
}

module.exports = { wrap, requireJson };
