import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull(), // 'tenant', 'landlord', 'broker', 'admin'
  phoneNumber: varchar("phone_number"),
  reraId: varchar("rera_id"), // RERA Registration Number for brokers
  isVerified: boolean("is_verified").default(false), // Admin verification status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  location: varchar("location").notNull(),
  propertyType: varchar("property_type").notNull(), // 'apartment', 'villa', 'house', 'office'
  listingType: varchar("listing_type").notNull(), // 'rent', 'sale'
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  imageUrl: varchar("image_url"), // Keep for backward compatibility
  status: varchar("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  listingStatus: varchar("listing_status").notNull().default("active"), // 'active', 'sold', 'rented', 'inactive'
  isVerified: boolean("is_verified").default(false),
  ownerId: varchar("owner_id").notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  needsReview: boolean("needs_review").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property images table
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  imageUrl: varchar("image_url").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Duplicate listing attempts table
export const duplicateListings = pgTable("duplicate_listings", {
  id: serial("id").primaryKey(),
  attemptedTitle: varchar("attempted_title").notNull(),
  attemptedLocation: varchar("attempted_location").notNull(),
  attemptedByUserId: varchar("attempted_by_user_id").notNull(),
  existingPropertyId: integer("existing_property_id").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
  reviewed: boolean("reviewed").default(false),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  images: many(propertyImages),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const duplicateListingsRelations = relations(duplicateListings, ({ one }) => ({
  attemptedBy: one(users, {
    fields: [duplicateListings.attemptedByUserId],
    references: [users.id],
  }),
  existingProperty: one(properties, {
    fields: [duplicateListings.existingPropertyId],
    references: [properties.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
});

export const brokerRegistrationSchema = insertUserSchema.extend({
  reraId: z.string().min(1, "RERA Registration Number is required"),
}).refine((data) => data.role === "broker" ? !!data.reraId : true, {
  message: "RERA Registration Number is required for brokers",
  path: ["reraId"],
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
});

export const insertPropertyImageSchema = createInsertSchema(propertyImages).omit({
  id: true,
  createdAt: true,
});

export const insertDuplicateListingSchema = createInsertSchema(duplicateListings).omit({
  id: true,
  attemptedAt: true,
  reviewed: true,
});

export const updatePropertyStatusSchema = z.object({
  listingStatus: z.enum(["active", "sold", "rented", "inactive"]),
});

export const propertySearchSchema = z.object({
  location: z.string().optional(),
  propertyType: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  bedrooms: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type DuplicateListing = typeof duplicateListings.$inferSelect;
export type InsertDuplicateListing = z.infer<typeof insertDuplicateListingSchema>;
export type PropertyWithOwner = Property & { owner: User };
export type PropertyWithImages = Property & { images: PropertyImage[] };
export type PropertyWithOwnerAndImages = Property & { owner: User; images: PropertyImage[] };
export type DuplicateListingWithDetails = DuplicateListing & { 
  attemptedBy: User; 
  existingProperty: Property & { owner: User }; 
};
export type PropertySearch = z.infer<typeof propertySearchSchema>;
export type UpdatePropertyStatus = z.infer<typeof updatePropertyStatusSchema>;
