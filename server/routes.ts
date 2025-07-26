import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyFirebaseToken, optionalFirebaseAuth } from "./firebaseAuth";
import { insertPropertySchema, propertySearchSchema, updatePropertyStatusSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Login redirect route
  app.get('/api/login', (req, res) => {
    const redirect = req.query.redirect || '/';
    // For now, just redirect to the main page - Firebase handles auth
    res.redirect(redirect as string);
  });

  // Auth routes
  app.get('/api/auth/user', verifyFirebaseToken, async (req: any, res) => {
    try {
      const firebaseUser = req.firebaseUser;
      console.log('Fetching user with Firebase UID:', firebaseUser.uid);
      
      if (!firebaseUser.uid) {
        console.log('No Firebase UID found');
        return res.status(400).json({ message: "User ID not found" });
      }
      
      let user = await storage.getUser(firebaseUser.uid);
      
      if (!user) {
        console.log('User not found in database, creating from Firebase user');
        // Create new user from Firebase data
        const newUser = await storage.upsertUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.name?.split(' ')[0] || '',
          lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: firebaseUser.picture || null,
          role: "tenant", // Default role
        });
        console.log('New user created:', newUser);
        return res.json(newUser);
      }
      
      console.log('User found:', user);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      console.error("Firebase user in request:", req.firebaseUser);
      console.error("Error details:", (error as Error).message);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role
  app.post('/api/auth/update-role', verifyFirebaseToken, async (req: any, res) => {
    try {
      console.log('Update role request body:', req.body);
      const userId = req.firebaseUser.uid;
      const { role, phoneNumber, reraId } = req.body;

      // Validate input
      if (!role || !phoneNumber) {
        return res.status(400).json({ message: "Role and phone number are required" });
      }

      if (!['tenant', 'landlord', 'broker'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Validate phone number
      if (phoneNumber.length < 10) {
        return res.status(400).json({ message: "Phone number must be at least 10 digits" });
      }

      // Validate RERA ID for brokers
      if (role === 'broker' && !reraId) {
        return res.status(400).json({ message: "RERA Registration Number is required for brokers" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData: any = {
        ...user,
        role,
        phoneNumber,
      };

      if (role === 'broker') {
        updateData.reraId = reraId;
        updateData.isVerified = false; // Brokers need admin verification
      }

      console.log('Updating user with data:', updateData);
      const updatedUser = await storage.upsertUser(updateData);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Property routes
  app.post('/api/properties', verifyFirebaseToken, upload.array('images', 10), async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || !['landlord', 'broker'].includes(user.role)) {
        return res.status(403).json({ message: "Only landlords and brokers can create listings" });
      }

      const { title, location } = req.body;

      // Check for duplicate property
      const existingProperty = await storage.checkDuplicateProperty(title, location);
      if (existingProperty) {
        // Log the duplicate attempt
        await storage.createDuplicateListing({
          attemptedTitle: title,
          attemptedLocation: location,
          attemptedByUserId: userId,
          existingPropertyId: existingProperty.id,
        });

        return res.status(409).json({ 
          message: "A listing for this property already exists on MLS Bharat. Please contact support if you believe this is an error." 
        });
      }

      // Handle backward compatibility with single image
      const imageUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      
      const propertyData = insertPropertySchema.parse({
        title: req.body.title,
        description: req.body.description || '',
        price: req.body.price,
        location: req.body.location,
        propertyType: req.body.propertyType,
        listingType: req.body.listingType,
        bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : null,
        bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : null,
        ownerId: userId,
        imageUrl: firstImageUrl, // Keep for backward compatibility
        status: "pending", // Ensure all new properties start as pending
        listingStatus: "active",
        needsReview: false,
      });

      const property = await storage.createProperty(propertyData);
      
      // Create multiple images if provided
      if (imageUrls.length > 0) {
        await storage.createPropertyImages(property.id, imageUrls);
      }

      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.get('/api/properties', async (req, res) => {
    try {
      const properties = await storage.getApprovedProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get('/api/properties/search', async (req, res) => {
    try {
      const filters = propertySearchSchema.parse(req.query);
      const properties = await storage.searchProperties(filters);
      res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get('/api/properties/:id', async (req, res) => {
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

  app.get('/api/properties/owner/:ownerId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const ownerId = req.params.ownerId;
      const userId = req.firebaseUser.uid;

      // Users can only view their own properties
      if (ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const properties = await storage.getPropertiesByOwner(ownerId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching owner properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Property status management routes
  app.patch('/api/properties/:id/status', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);
      const propertyId = parseInt(req.params.id);

      if (!user || !['landlord', 'broker'].includes(user.role)) {
        return res.status(403).json({ message: "Only landlords and brokers can update listing status" });
      }

      // Check if user owns this property
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

  // Admin routes
  app.get('/api/admin/properties', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching admin properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get('/api/admin/properties/pending', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const properties = await storage.getPendingProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching pending properties:", error);
      res.status(500).json({ message: "Failed to fetch pending properties" });
    }
  });

  app.patch('/api/admin/properties/:id/status', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const { status, isVerified } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const property = await storage.updatePropertyStatus(id, status, isVerified);
      res.json(property);
    } catch (error) {
      console.error("Error updating property status:", error);
      res.status(500).json({ message: "Failed to update property status" });
    }
  });

  // Broker verification routes
  app.get('/api/admin/brokers/pending', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const brokers = await storage.getPendingBrokers();
      res.json(brokers);
    } catch (error) {
      console.error("Error fetching pending brokers:", error);
      res.status(500).json({ message: "Failed to fetch pending brokers" });
    }
  });

  app.patch('/api/admin/brokers/:id/verify', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const brokerId = req.params.id;
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }

      const broker = await storage.updateUserVerification(brokerId, isVerified);
      res.json(broker);
    } catch (error) {
      console.error("Error updating broker verification:", error);
      res.status(500).json({ message: "Failed to update broker verification" });
    }
  });

  // Duplicate listings management
  app.get('/api/admin/duplicates', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const duplicates = await storage.getDuplicateListings();
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching duplicate listings:", error);
      res.status(500).json({ message: "Failed to fetch duplicate listings" });
    }
  });

  app.patch('/api/admin/duplicates/:id/review', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
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

  // Properties needing review
  app.get('/api/admin/properties/review', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser.uid;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const properties = await storage.getPropertiesNeedingReview();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties needing review:", error);
      res.status(500).json({ message: "Failed to fetch properties needing review" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
