import { z } from "zod";

const menuCategories = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACKS",
  "FRUITS",
  "BEVERAGES",
  "EXTRAS",
];

const mealTypes = ["BREAKFAST", "LUNCH", "EVENING_SNACKS", "DINNER", "OTHER"];

export const menuSchemas = {
  // Create menu item
  createItem: z.object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      category: z.enum(menuCategories, {
        errorMap: () => ({
          message: `Category must be one of: ${menuCategories.join(", ")}`,
        }),
      }),
      price: z.number().positive("Price must be a positive number"),
      unit: z.string().optional(),
      isAvailable: z.boolean().optional(),
    }),
  }),

  // Update menu item
  updateItem: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      category: z.enum(menuCategories).optional(),
      price: z.number().positive().optional(),
      unit: z.string().optional(),
      isAvailable: z.boolean().optional(),
    }),
  }),

  // Bulk create items
  bulkCreate: z.object({
    body: z.object({
      items: z
        .array(
          z.object({
            name: z.string().min(2),
            category: z.enum(menuCategories),
            price: z.number().positive(),
            unit: z.string().optional(),
            isAvailable: z.boolean().optional(),
          })
        )
        .min(1, "At least one item required"),
    }),
  }),

  // Bulk update prices
  bulkUpdatePrices: z.object({
    body: z.object({
      updates: z
        .array(
          z.object({
            id: z.string().min(1),
            price: z.number().positive(),
          })
        )
        .min(1, "At least one update required"),
    }),
  }),
};

export const orderSchemas = {
  // Create order by student ID
  createOrder: z.object({
    body: z.object({
      studentId: z.string().min(6, "Student ID is required"),
      mealType: z.enum(mealTypes, {
        errorMap: () => ({
          message: `Meal type must be one of: ${mealTypes.join(", ")}`,
        }),
      }),
      items: z
        .array(
          z.object({
            menuItemId: z.string().min(1, "Menu item ID is required"),
            quantity: z
              .number()
              .int()
              .positive("Quantity must be a positive integer"),
          })
        )
        .min(1, "At least one item required"),
    }),
  }),

  // Create order by roll number (quick billing)
  createOrderByRollNo: z.object({
    body: z.object({
      rollNo: z.string().min(6, "Roll number is required"),
      mealType: z.enum(mealTypes, {
        errorMap: () => ({
          message: `Meal type must be one of: ${mealTypes.join(", ")}`,
        }),
      }),
      items: z
        .array(
          z.object({
            menuItemId: z.string().min(1, "Menu item ID is required"),
            quantity: z
              .number()
              .int()
              .positive("Quantity must be a positive integer"),
          })
        )
        .min(1, "At least one item required"),
    }),
  }),
};
