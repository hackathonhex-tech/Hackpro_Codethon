export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const rawLimit = parseInt(query.limit || '20', 10);
  const limit = Math.min(10000, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    formatResponse: (items, total) => ({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }),
  };
};
