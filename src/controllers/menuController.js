import catchAsync from "../utils/catchAsync.js";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  getAvailableMenu,
  getMenuItemById,
  bulkCreateMenuItems,
  toggleAvailability,
  bulkUpdatePrices,
} from "../services/menuService.js";

/**
 * Create a new menu item (Admin only)
 */
export const create = catchAsync(async (req, res) => {
  const menuItem = await createMenuItem(req.body);
  res.status(201).json({
    success: true,
    message: "Menu item created successfully",
    data: menuItem,
  });
});

/**
 * Update a menu item (Admin only)
 */
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const menuItem = await updateMenuItem(id, req.body);
  res.json({
    success: true,
    message: "Menu item updated successfully",
    data: menuItem,
  });
});

/**
 * Delete a menu item (Admin only)
 */
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await deleteMenuItem(id);
  res.json({
    success: true,
    message: result.message || "Menu item deleted successfully",
    data: result.menuItem || null,
  });
});

/**
 * Get all menu items with filters (Admin)
 */
export const getAll = catchAsync(async (req, res) => {
  const { category, isAvailable, search } = req.query;
  const result = await getAllMenuItems({ category, isAvailable, search });
  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get available menu items (Canteen Manager & Students)
 */
export const getAvailable = catchAsync(async (req, res) => {
  const { category } = req.query;
  const result = await getAvailableMenu(category);
  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get single menu item by ID
 */
export const getOne = catchAsync(async (req, res) => {
  const { id } = req.params;
  const menuItem = await getMenuItemById(id);
  res.json({
    success: true,
    data: menuItem,
  });
});

/**
 * Bulk create menu items (Admin - initial setup)
 */
export const bulkCreate = catchAsync(async (req, res) => {
  const { items } = req.body;
  const result = await bulkCreateMenuItems(items);
  res.status(201).json({
    success: true,
    message: `${result.count} menu items created`,
    data: result,
  });
});

/**
 * Toggle item availability (Admin)
 */
export const toggle = catchAsync(async (req, res) => {
  const { id } = req.params;
  const menuItem = await toggleAvailability(id);
  res.json({
    success: true,
    message: `Item is now ${menuItem.isAvailable ? "available" : "unavailable"}`,
    data: menuItem,
  });
});

/**
 * Bulk update prices (Admin)
 */
export const updatePrices = catchAsync(async (req, res) => {
  const { updates } = req.body;
  const result = await bulkUpdatePrices(updates);
  res.json({
    success: true,
    message: `${result.updated} prices updated`,
    data: result.items,
  });
});

