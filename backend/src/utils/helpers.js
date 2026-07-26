// Helper functions (can be extended)
module.exports = {
  // Example: format date
  formatDate: (date) => {
    return new Date(date).toISOString().split('T')[0];
  },
  // Example: pagination params
  getPagination: (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
  },
};
