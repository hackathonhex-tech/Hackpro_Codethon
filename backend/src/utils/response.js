export const successResponse = (res, data = null, statusCode = 200, pagination = null) => {
  const payload = {
    success: true,
    data,
  };
  if (pagination) {
    payload.pagination = pagination;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
