import catchAsync from "../utils/catchAsync.js";
import { getCaretakerDashboardStats } from "../services/statsService.js";

/**
 * Get caretaker dashboard statistics
 */
export const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await getCaretakerDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
});
