export const validate = (schema) => (req, res, next) => {
  try {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query,
    };
    schema.parse(data);
    next();
  } catch (error) {
    const formatted = error?.issues?.map((issue) => issue.message).join(', ') || 'Validation error';
    res.status(400).json({ message: formatted });
  }
};

