var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  brokerRegistrationSchema: () => brokerRegistrationSchema,
  duplicateListings: () => duplicateListings,
  duplicateListingsRelations: () => duplicateListingsRelations,
  insertDuplicateListingSchema: () => insertDuplicateListingSchema,
  insertPropertyImageSchema: () => insertPropertyImageSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertUserSchema: () => insertUserSchema,
  properties: () => properties,
  propertiesRelations: () => propertiesRelations,
  propertyImages: () => propertyImages,
  propertyImagesRelations: () => propertyImagesRelations,
  propertySearchSchema: () => propertySearchSchema,
  sessions: () => sessions,
  updatePropertyStatusSchema: () => updatePropertyStatusSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
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
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull(),
  // 'tenant', 'landlord', 'broker', 'admin'
  phoneNumber: varchar("phone_number"),
  reraId: varchar("rera_id"),
  // RERA Registration Number for brokers
  isVerified: boolean("is_verified").default(false),
  // Admin verification status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  location: varchar("location").notNull(),
  propertyType: varchar("property_type").notNull(),
  // 'apartment', 'villa', 'house', 'office'
  listingType: varchar("listing_type").notNull(),
  // 'rent', 'sale'
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  imageUrl: varchar("image_url"),
  // Keep for backward compatibility
  status: varchar("status").notNull().default("pending"),
  // 'pending', 'approved', 'rejected'
  listingStatus: varchar("listing_status").notNull().default("active"),
  // 'active', 'sold', 'rented', 'inactive'
  isVerified: boolean("is_verified").default(false),
  ownerId: varchar("owner_id").notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  needsReview: boolean("needs_review").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  imageUrl: varchar("image_url").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var duplicateListings = pgTable("duplicate_listings", {
  id: serial("id").primaryKey(),
  attemptedTitle: varchar("attempted_title").notNull(),
  attemptedLocation: varchar("attempted_location").notNull(),
  attemptedByUserId: varchar("attempted_by_user_id").notNull(),
  existingPropertyId: integer("existing_property_id").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
  reviewed: boolean("reviewed").default(false)
});
var usersRelations = relations(users, ({ many }) => ({
  properties: many(properties)
}));
var propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id]
  }),
  images: many(propertyImages)
}));
var propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id]
  })
}));
var duplicateListingsRelations = relations(duplicateListings, ({ one }) => ({
  attemptedBy: one(users, {
    fields: [duplicateListings.attemptedByUserId],
    references: [users.id]
  }),
  existingProperty: one(properties, {
    fields: [duplicateListings.existingPropertyId],
    references: [properties.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true
});
var brokerRegistrationSchema = insertUserSchema.extend({
  reraId: z.string().min(1, "RERA Registration Number is required")
}).refine((data) => data.role === "broker" ? !!data.reraId : true, {
  message: "RERA Registration Number is required for brokers",
  path: ["reraId"]
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true
});
var insertPropertyImageSchema = createInsertSchema(propertyImages).omit({
  id: true,
  createdAt: true
});
var insertDuplicateListingSchema = createInsertSchema(duplicateListings).omit({
  id: true,
  attemptedAt: true,
  reviewed: true
});
var updatePropertyStatusSchema = z.object({
  listingStatus: z.enum(["active", "sold", "rented", "inactive"])
});
var propertySearchSchema = z.object({
  location: z.string().optional(),
  propertyType: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  bedrooms: z.string().optional()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, like } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserProfile(id, updates) {
    const [user] = await db.update(users).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserVerification(id, isVerified) {
    const [user] = await db.update(users).set({
      isVerified,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async getPendingBrokers() {
    return await db.select().from(users).where(and(eq(users.role, "broker"), eq(users.isVerified, false)));
  }
  // Property operations
  async createProperty(property) {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }
  async getPropertyById(id) {
    const [property] = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.id, id));
    if (!property) return void 0;
    const images = await this.getPropertyImages(id);
    return {
      ...property.properties,
      owner: property.users,
      images
    };
  }
  async getPropertiesByOwner(ownerId) {
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.ownerId, ownerId)).orderBy(properties.createdAt);
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages.reverse();
  }
  async getApprovedProperties() {
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(and(
      eq(properties.status, "approved"),
      eq(properties.listingStatus, "active")
    ));
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages;
  }
  async searchProperties(filters) {
    const conditions = [
      eq(properties.status, "approved"),
      eq(properties.listingStatus, "active")
    ];
    if (filters.location) {
      conditions.push(like(properties.location, `%${filters.location}%`));
    }
    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }
    if (filters.listingType) {
      conditions.push(eq(properties.listingType, filters.listingType));
    }
    if (filters.minPrice) {
      conditions.push(gte(properties.price, filters.minPrice));
    }
    if (filters.maxPrice) {
      conditions.push(lte(properties.price, filters.maxPrice));
    }
    if (filters.bedrooms) {
      conditions.push(eq(properties.bedrooms, parseInt(filters.bedrooms)));
    }
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(and(...conditions));
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages;
  }
  async getPendingProperties() {
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.status, "pending"));
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages;
  }
  async updatePropertyStatus(id, status, isVerified) {
    const updateData = { status, updatedAt: /* @__PURE__ */ new Date() };
    if (isVerified !== void 0) {
      updateData.isVerified = isVerified;
    }
    const [updatedProperty] = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
    return updatedProperty;
  }
  async getAllProperties() {
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id));
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages;
  }
  // Property image operations
  async createPropertyImages(propertyId, imageUrls) {
    const imageData = imageUrls.map((url, index2) => ({
      propertyId,
      imageUrl: url,
      displayOrder: index2
    }));
    const images = await db.insert(propertyImages).values(imageData).returning();
    return images;
  }
  async getPropertyImages(propertyId) {
    return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, propertyId)).orderBy(propertyImages.displayOrder);
  }
  async deletePropertyImages(propertyId) {
    await db.delete(propertyImages).where(eq(propertyImages.propertyId, propertyId));
  }
  // New methods for enhanced functionality
  async updatePropertyListingStatus(id, listingStatus) {
    const [property] = await db.update(properties).set({
      listingStatus,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(properties.id, id)).returning();
    return property;
  }
  async checkDuplicateProperty(title, location) {
    const [property] = await db.select().from(properties).where(and(
      eq(properties.title, title),
      eq(properties.location, location),
      eq(properties.listingStatus, "active")
    ));
    return property;
  }
  async markPropertyForReview(id) {
    const [property] = await db.update(properties).set({
      needsReview: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(properties.id, id)).returning();
    return property;
  }
  async getPropertiesNeedingReview() {
    const results = await db.select().from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.needsReview, true));
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users,
          images
        };
      })
    );
    return propertiesWithImages;
  }
  // Duplicate listing operations
  async createDuplicateListing(duplicate) {
    const [newDuplicate] = await db.insert(duplicateListings).values(duplicate).returning();
    return newDuplicate;
  }
  async getDuplicateListings() {
    const results = await db.select().from(duplicateListings).leftJoin(users, eq(duplicateListings.attemptedByUserId, users.id)).leftJoin(properties, eq(duplicateListings.existingPropertyId, properties.id)).where(eq(duplicateListings.reviewed, false));
    const duplicatesWithDetails = await Promise.all(
      results.map(async (result) => {
        const [existingPropertyOwner] = await db.select().from(users).where(eq(users.id, result.properties.ownerId));
        return {
          ...result.duplicate_listings,
          attemptedBy: result.users,
          existingProperty: {
            ...result.properties,
            owner: existingPropertyOwner
          }
        };
      })
    );
    return duplicatesWithDetails;
  }
  async markDuplicateListingReviewed(id) {
    const [duplicate] = await db.update(duplicateListings).set({
      reviewed: true
    }).where(eq(duplicateListings.id, id)).returning();
    return duplicate;
  }
};
var storage = new DatabaseStorage();

// server/firebaseAuth.ts
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "mlsbharat-7be4b"
    });
  }
  return getApp();
}
var app = initializeFirebaseAdmin();
var auth = getAuth(app);
var verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No valid authorization header found" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// server/routes.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  }
});
async function registerRoutes(app3) {
  app3.get("/api/auth/user", verifyFirebaseToken, async (req, res) => {
    try {
      const firebaseUser = req.firebaseUser;
      console.log("Fetching user with Firebase UID:", firebaseUser.uid);
      if (!firebaseUser.uid) {
        console.log("No Firebase UID found");
        return res.status(400).json({ message: "User ID not found" });
      }
      let user = await storage.getUser(firebaseUser.uid);
      if (!user) {
        console.log("User not found in database, creating from Firebase user");
        const newUser = await storage.upsertUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          firstName: firebaseUser.name?.split(" ")[0] || "",
          lastName: firebaseUser.name?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: firebaseUser.picture || null,
          role: "tenant"
          // Default role
        });
        console.log("New user created:", newUser);
        return res.json(newUser);
      }
      console.log("User found:", user);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app3.post("/api/auth/update-role", verifyFirebaseToken, async (req, res) => {
    try {
      console.log("Update role request body:", req.body);
      const userId = req.firebaseUser.uid;
      const { role, phoneNumber, reraId } = req.body;
      if (!role || !phoneNumber) {
        return res.status(400).json({ message: "Role and phone number are required" });
      }
      if (!["tenant", "landlord", "broker"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (phoneNumber.length < 10) {
        return res.status(400).json({ message: "Phone number must be at least 10 digits" });
      }
      if (role === "broker" && !reraId) {
        return res.status(400).json({ message: "RERA Registration Number is required for brokers" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updateData = {
        ...user,
        role,
        phoneNumber
      };
      if (role === "broker") {
        updateData.reraId = reraId;
        updateData.isVerified = false;
      }
      console.log("Updating user with data:", updateData);
      const updatedUser = await storage.upsertUser(updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app3.post("/api/properties", verifyFirebaseToken, upload.array("images", 10), async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !["landlord", "broker"].includes(user.role)) {
        return res.status(403).json({ message: "Only landlords and brokers can create listings" });
      }
      const { title, location } = req.body;
      const existingProperty = await storage.checkDuplicateProperty(title, location);
      if (existingProperty) {
        await storage.createDuplicateListing({
          attemptedTitle: title,
          attemptedLocation: location,
          attemptedByUserId: userId,
          existingPropertyId: existingProperty.id
        });
        return res.status(409).json({
          message: "A listing for this property already exists on MLS Bharat. Please contact support if you believe this is an error."
        });
      }
      const imageUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
      const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);
      const propertyData = insertPropertySchema.parse({
        title: req.body.title,
        description: req.body.description || "",
        price: req.body.price,
        location: req.body.location,
        propertyType: req.body.propertyType,
        listingType: req.body.listingType,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : null,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : null,
        ownerId: userId,
        imageUrl: firstImageUrl,
        // Keep for backward compatibility
        status: "pending",
        // Ensure all new properties start as pending
        listingStatus: "active",
        needsReview: false
      });
      const property = await storage.createProperty(propertyData);
      if (imageUrls.length > 0) {
        await storage.createPropertyImages(property.id, imageUrls);
      }
      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  app3.get("/api/properties", async (req, res) => {
    try {
      const properties2 = await storage.getApprovedProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app3.get("/api/properties/search", async (req, res) => {
    try {
      const filters = propertySearchSchema.parse(req.query);
      const properties2 = await storage.searchProperties(filters);
      res.json(properties2);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });
  app3.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app3.get("/api/properties/owner/:ownerId", verifyFirebaseToken, async (req, res) => {
    try {
      const ownerId = req.params.ownerId;
      const userId = req.firebaseUser.uid;
      if (ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const properties2 = await storage.getPropertiesByOwner(ownerId);
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching owner properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app3.patch("/api/properties/:id/status", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      const propertyId = parseInt(req.params.id);
      if (!user || !["landlord", "broker"].includes(user.role)) {
        return res.status(403).json({ message: "Only landlords and brokers can update listing status" });
      }
      const property = await storage.getPropertyById(propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(403).json({ message: "You can only update your own properties" });
      }
      const { listingStatus } = updatePropertyStatusSchema.parse(req.body);
      const updatedProperty = await storage.updatePropertyListingStatus(propertyId, listingStatus);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property listing status:", error);
      res.status(500).json({ message: "Failed to update property status" });
    }
  });
  app3.get("/api/admin/properties", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const properties2 = await storage.getAllProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching admin properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app3.get("/api/admin/properties/pending", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const properties2 = await storage.getPendingProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching pending properties:", error);
      res.status(500).json({ message: "Failed to fetch pending properties" });
    }
  });
  app3.patch("/api/admin/properties/:id/status", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const { status, isVerified } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const property = await storage.updatePropertyStatus(id, status, isVerified);
      res.json(property);
    } catch (error) {
      console.error("Error updating property status:", error);
      res.status(500).json({ message: "Failed to update property status" });
    }
  });
  app3.get("/api/admin/brokers/pending", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const brokers = await storage.getPendingBrokers();
      res.json(brokers);
    } catch (error) {
      console.error("Error fetching pending brokers:", error);
      res.status(500).json({ message: "Failed to fetch pending brokers" });
    }
  });
  app3.patch("/api/admin/brokers/:id/verify", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const brokerId = req.params.id;
      const { isVerified } = req.body;
      if (typeof isVerified !== "boolean") {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }
      const broker = await storage.updateUserVerification(brokerId, isVerified);
      res.json(broker);
    } catch (error) {
      console.error("Error updating broker verification:", error);
      res.status(500).json({ message: "Failed to update broker verification" });
    }
  });
  app3.get("/api/admin/duplicates", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const duplicates = await storage.getDuplicateListings();
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching duplicate listings:", error);
      res.status(500).json({ message: "Failed to fetch duplicate listings" });
    }
  });
  app3.patch("/api/admin/duplicates/:id/review", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const duplicateId = parseInt(req.params.id);
      const duplicate = await storage.markDuplicateListingReviewed(duplicateId);
      res.json(duplicate);
    } catch (error) {
      console.error("Error reviewing duplicate listing:", error);
      res.status(500).json({ message: "Failed to review duplicate listing" });
    }
  });
  app3.get("/api/admin/properties/review", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const properties2 = await storage.getPropertiesNeedingReview();
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching properties needing review:", error);
      res.status(500).json({ message: "Failed to fetch properties needing review" });
    }
  });
  app3.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  const httpServer = createServer(app3);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app3, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app3.use(vite.middlewares);
  app3.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app3) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app3.use(express2.static(distPath));
  app3.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app2 = express3();
app2.use(express3.json({ limit: "10mb" }));
app2.use(express3.urlencoded({ extended: true, limit: "10mb" }));
app2.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app2.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} [express] ${req.method} ${req.url} - Starting`);
  res.send = function(body) {
    const duration = Date.now() - start;
    const bodyPreview = typeof body === "string" ? body.slice(0, 100) : JSON.stringify(body).slice(0, 100);
    console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} [express] ${req.method} ${req.url} ${res.statusCode} in ${duration}ms :: ${bodyPreview}`);
    return originalSend.call(this, body);
  };
  next();
});
app2.use((error, req, res, next) => {
  console.error("Global error handler caught:", error);
  console.error("Error stack:", error.stack);
  console.error("Request URL:", req.url);
  console.error("Request method:", req.method);
  console.error("Request body:", req.body);
  console.error("Request headers:", req.headers);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
  });
});
(async () => {
  const server = await registerRoutes(app2);
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app2.get("env") === "development") {
    await setupVite(app2, server);
  } else {
    serveStatic(app2);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
