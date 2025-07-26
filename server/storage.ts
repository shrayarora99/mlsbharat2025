import {
  users,
  properties,
  propertyImages,
  duplicateListings,
  type User,
  type UpsertUser,
  type InsertProperty,
  type Property,
  type PropertyWithOwner,
  type PropertyWithOwnerAndImages,
  type PropertyImage,
  type PropertySearch,
  type DuplicateListing,
  type InsertDuplicateListing,
  type DuplicateListingWithDetails,
  type UpdatePropertyStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: Partial<UpsertUser>): Promise<User>;
  updateUserVerification(id: string, isVerified: boolean): Promise<User>;
  getPendingBrokers(): Promise<User[]>;
  
  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getPropertyById(id: number): Promise<PropertyWithOwnerAndImages | undefined>;
  getPropertiesByOwner(ownerId: string): Promise<PropertyWithOwnerAndImages[]>;
  getApprovedProperties(): Promise<PropertyWithOwnerAndImages[]>;
  searchProperties(filters: PropertySearch): Promise<PropertyWithOwnerAndImages[]>;
  getPendingProperties(): Promise<PropertyWithOwnerAndImages[]>;
  updatePropertyStatus(id: number, status: string, isVerified?: boolean): Promise<Property>;
  updatePropertyListingStatus(id: number, listingStatus: string): Promise<Property>;
  getAllProperties(): Promise<PropertyWithOwnerAndImages[]>;
  checkDuplicateProperty(title: string, location: string): Promise<Property | undefined>;
  markPropertyForReview(id: number): Promise<Property>;
  getPropertiesNeedingReview(): Promise<PropertyWithOwnerAndImages[]>;
  
  // Duplicate listing operations
  createDuplicateListing(duplicate: InsertDuplicateListing): Promise<DuplicateListing>;
  getDuplicateListings(): Promise<DuplicateListingWithDetails[]>;
  markDuplicateListingReviewed(id: number): Promise<DuplicateListing>;
  
  // Property image operations
  createPropertyImages(propertyId: number, imageUrls: string[]): Promise<PropertyImage[]>;
  getPropertyImages(propertyId: number): Promise<PropertyImage[]>;
  deletePropertyImages(propertyId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserVerification(id: string, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isVerified,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPendingBrokers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "broker"), eq(users.isVerified, false)));
  }

  // Property operations
  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async getPropertyById(id: number): Promise<PropertyWithOwnerAndImages | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.id, id));
    
    if (!property) return undefined;
    
    const images = await this.getPropertyImages(id);
    
    return {
      ...property.properties,
      owner: property.users!,
      images,
    };
  }

  async getPropertiesByOwner(ownerId: string): Promise<PropertyWithOwnerAndImages[]> {
    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.ownerId, ownerId))
      .orderBy(properties.createdAt);
      
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages.reverse(); // Most recent first
  }

  async getApprovedProperties(): Promise<PropertyWithOwnerAndImages[]> {
    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(and(
        eq(properties.status, "approved"),
        eq(properties.listingStatus, "active")
      ));
    
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages;
  }

  async searchProperties(filters: PropertySearch): Promise<PropertyWithOwnerAndImages[]> {
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

    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(and(...conditions));
    
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages;
  }

  async getPendingProperties(): Promise<PropertyWithOwnerAndImages[]> {
    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.status, "pending"));
    
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages;
  }

  async updatePropertyStatus(id: number, status: string, isVerified?: boolean): Promise<Property> {
    const updateData: any = { status, updatedAt: new Date() };
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
    }

    const [updatedProperty] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();
    
    return updatedProperty;
  }

  async getAllProperties(): Promise<PropertyWithOwnerAndImages[]> {
    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id));
    
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages;
  }

  // Property image operations
  async createPropertyImages(propertyId: number, imageUrls: string[]): Promise<PropertyImage[]> {
    const imageData = imageUrls.map((url, index) => ({
      propertyId,
      imageUrl: url,
      displayOrder: index,
    }));

    const images = await db
      .insert(propertyImages)
      .values(imageData)
      .returning();
    
    return images;
  }

  async getPropertyImages(propertyId: number): Promise<PropertyImage[]> {
    return await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(propertyImages.displayOrder);
  }

  async deletePropertyImages(propertyId: number): Promise<void> {
    await db
      .delete(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));
  }

  // New methods for enhanced functionality
  async updatePropertyListingStatus(id: number, listingStatus: string): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({
        listingStatus,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async checkDuplicateProperty(title: string, location: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.title, title),
        eq(properties.location, location),
        eq(properties.listingStatus, "active")
      ));
    return property;
  }

  async markPropertyForReview(id: number): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({
        needsReview: true,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async getPropertiesNeedingReview(): Promise<PropertyWithOwnerAndImages[]> {
    const results = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.needsReview, true));
    
    const propertiesWithImages = await Promise.all(
      results.map(async (result) => {
        const images = await this.getPropertyImages(result.properties.id);
        return {
          ...result.properties,
          owner: result.users!,
          images,
        };
      })
    );
    
    return propertiesWithImages;
  }

  // Duplicate listing operations
  async createDuplicateListing(duplicate: InsertDuplicateListing): Promise<DuplicateListing> {
    const [newDuplicate] = await db
      .insert(duplicateListings)
      .values(duplicate)
      .returning();
    return newDuplicate;
  }

  async getDuplicateListings(): Promise<DuplicateListingWithDetails[]> {
    const results = await db
      .select()
      .from(duplicateListings)
      .leftJoin(users, eq(duplicateListings.attemptedByUserId, users.id))
      .leftJoin(properties, eq(duplicateListings.existingPropertyId, properties.id))
      .where(eq(duplicateListings.reviewed, false));

    const duplicatesWithDetails = await Promise.all(
      results.map(async (result) => {
        // Get the owner of the existing property
        const [existingPropertyOwner] = await db
          .select()
          .from(users)
          .where(eq(users.id, result.properties!.ownerId));

        return {
          ...result.duplicate_listings,
          attemptedBy: result.users!,
          existingProperty: {
            ...result.properties!,
            owner: existingPropertyOwner,
          },
        };
      })
    );

    return duplicatesWithDetails;
  }

  async markDuplicateListingReviewed(id: number): Promise<DuplicateListing> {
    const [duplicate] = await db
      .update(duplicateListings)
      .set({
        reviewed: true,
      })
      .where(eq(duplicateListings.id, id))
      .returning();
    return duplicate;
  }
}

export const storage = new DatabaseStorage();
