import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";

/**
 * Create a new menu item (Admin only)
 */
export const createMenuItem = async (data) => {
  const { name, category, price, unit, isAvailable } = data;

  // Check if item with same name exists (only check available items or all items)
  const existing = await prisma.menuItem.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (existing) {
    // If existing item is disabled, provide a more helpful error message
    if (!existing.isAvailable) {
      throw new ApiError(
        400,
        `Menu item "${name}" already exists but is currently disabled. Please enable the existing item instead or use a different name.`
      );
    }
    throw new ApiError(400, `Menu item "${name}" already exists`);
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      category,
      price,
      unit: unit || "piece",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    },
  });

  return menuItem;
};

/**
 * Update a menu item (Admin only)
 */
export const updateMenuItem = async (id, data) => {
  const existing = await prisma.menuItem.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, "Menu item not found");
  }

  // Check for duplicate name if name is being changed
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.menuItem.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new ApiError(400, `Menu item "${data.name}" already exists`);
    }
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      unit: data.unit,
      isAvailable: data.isAvailable,
    },
  });

  return menuItem;
};

/**
 * Delete a menu item (Admin only)
 */
export const deleteMenuItem = async (id) => {
  const existing = await prisma.menuItem.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, "Menu item not found");
  }

  // Check if item has been used in orders
  const ordersCount = await prisma.orderItem.count({
    where: { menuItemId: id },
  });

  if (ordersCount > 0) {
    // Soft delete - just mark as unavailable
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
    return {
      menuItem,
      message: "Item marked as unavailable (has order history)",
    };
  }

  // Hard delete if no orders
  await prisma.menuItem.delete({ where: { id } });
  return { message: "Menu item deleted successfully" };
};

/**
 * Get all menu items (with optional filters)
 */
export const getAllMenuItems = async (filters = {}) => {
  const { category, isAvailable, search } = filters;

  const where = {};

  if (category) {
    where.category = category;
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable === "true" || isAvailable === true;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Group by category for easier display
  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return {
    items: menuItems,
    grouped,
    total: menuItems.length,
  };
};

/**
 * Get available menu items only (for canteen manager & students)
 */
export const getAvailableMenu = async (category = null) => {
  const where = { isAvailable: true };

  if (category) {
    where.category = category;
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      unit: true,
    },
  });

  // Group by category
  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return {
    items: menuItems,
    grouped,
    total: menuItems.length,
  };
};

/**
 * Get a single menu item by ID
 */
export const getMenuItemById = async (id) => {
  const menuItem = await prisma.menuItem.findUnique({ where: { id } });

  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }

  return menuItem;
};

/**
 * Bulk create menu items (Admin - for initial setup)
 */
export const bulkCreateMenuItems = async (items) => {
  const created = await prisma.menuItem.createMany({
    data: items.map((item) => ({
      name: item.name,
      category: item.category,
      price: item.price,
      unit: item.unit || "piece",
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
    })),
    skipDuplicates: true,
  });

  return { count: created.count };
};

/**
 * Toggle item availability (Admin)
 */
export const toggleAvailability = async (id) => {
  const existing = await prisma.menuItem.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, "Menu item not found");
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !existing.isAvailable },
  });

  return menuItem;
};

/**
 * Update prices in bulk (Admin)
 */
export const bulkUpdatePrices = async (updates) => {
  // updates = [{ id: "xxx", price: 50 }, ...]
  const results = await Promise.all(
    updates.map((update) =>
      prisma.menuItem.update({
        where: { id: update.id },
        data: { price: update.price },
      })
    )
  );

  return { updated: results.length, items: results };
};
