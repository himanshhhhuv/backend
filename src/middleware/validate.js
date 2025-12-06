export const validate = (schema) => (req, res, next) => {
  try {
    // Debug: Log received body
    console.log("📥 Request body received:", JSON.stringify(req.body));
    
    const data = {
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
    };
    schema.parse(data);
    next();
  } catch (error) {
    // Handle Zod v4 error format
    let formatted = "Validation error";

    if (error?.issues && Array.isArray(error.issues)) {
      formatted = error.issues
        .map((issue) => {
          // Get field path (e.g., "body.email" -> "email")
          const path = issue.path?.slice(1).join(".") || "";
          const message = issue.message || "Invalid value";
          return path ? `${path}: ${message}` : message;
        })
        .join(", ");
    } else if (error?.message) {
      formatted = error.message;
    }

    console.log("❌ Validation error:", formatted);
    res.status(400).json({ success: false, message: formatted });
  }
};

