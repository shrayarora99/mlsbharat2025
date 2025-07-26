# MLSBharat Real Estate Platform

## Overview

MLSBharat is a comprehensive real estate platform built with a modern full-stack architecture. The application enables property listing, management, and search functionality with role-based access control for tenants, landlords, brokers, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Data Storage
- **Primary Database**: PostgreSQL hosted on Neon
- **Session Storage**: PostgreSQL sessions table
- **File Storage**: Local file system for image uploads (with plans for cloud storage)
- **Database Schema**: Centralized in `shared/schema.ts` with Drizzle ORM

## Key Components

### Authentication System
- **Provider**: Firebase Authentication with Google sign-in (migrated from Replit Auth)
- **Session Management**: Firebase JWT tokens for stateless authentication
- **Authorization**: Role-based access control (tenant, landlord, broker, admin)
- **User Management**: Firebase user sync to PostgreSQL database with role selection
- **Token Verification**: Firebase Admin SDK for server-side JWT verification
- **Domain Authorization**: Successfully configured for Replit development environment
- **Auth Methods**: Redirect and popup fallback for comprehensive browser support

### Property Management
- **CRUD Operations**: Full property lifecycle management
- **Image Upload**: Multer-based file upload with validation
- **Search & Filtering**: Advanced property search with multiple criteria
- **Status Management**: Property approval workflow for admin oversight
- **Verification System**: Admin verification for property listings

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Comprehensive UI components from Radix UI
- **Form Management**: Type-safe forms with validation
- **Toast Notifications**: User feedback system
- **Loading States**: Proper loading and error handling

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user records
2. **Property Listing**: Landlords/brokers create property listings with image uploads
3. **Admin Review**: Admins review and approve/reject property listings
4. **Property Search**: Users search and filter properties based on criteria
5. **Communication**: Direct WhatsApp integration for property inquiries

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **multer**: File upload middleware
- **react-hook-form**: Form handling
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

### Authentication
- **openid-client**: OpenID Connect client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Build
- **Frontend**: Vite build to `dist/public` directory
- **Backend**: ESBuild compilation to `dist/index.js`
- **Static Assets**: Served by Express in production
- **Process Management**: Single Node.js process serving both API and static files

### Database Management
- **Migrations**: Drizzle Kit for schema migrations
- **Schema**: Centralized schema definition with TypeScript types
- **Connection**: Pooled connections for optimal performance

### Key Configuration Files
- **drizzle.config.ts**: Database configuration and migration settings
- **vite.config.ts**: Frontend build configuration with path aliases
- **tsconfig.json**: TypeScript configuration with path mapping
- **tailwind.config.ts**: Tailwind CSS configuration with custom variables

The application follows a monorepo structure with shared types and schemas, enabling type safety across the full stack while maintaining clear separation of concerns between frontend and backend code.

## Recent Changes

### July 24, 2025 - Authentication System Updates

#### Bug Fixes and Domain Authorization
- Fixed broken `/api/login` redirects across all pages (property-details, broker-dashboard, admin-dashboard, create-listing, home, landing)
- Created proper Firebase logout helper function for consistent authentication handling
- Enhanced Firebase error handling with specific error codes and user-friendly messages
- Added popup-based authentication as fallback method for redirect failures
- Successfully configured Firebase domain authorization for Replit development environment
- Fixed role selection functionality to work with Firebase authentication tokens

#### Multi-Provider Authentication Implementation
- Added comprehensive Firebase Authentication UI supporting multiple sign-in methods:
  - Google OAuth (existing, enhanced)
  - Apple Sign-In (new)
  - Email/Password authentication (new)
- Implemented email/password features:
  - User registration with optional display name
  - Secure sign-in with password visibility toggle
  - Password reset functionality
  - Form validation and error handling
- Enhanced authentication error handling with provider-specific error messages
- Added seamless mode switching between sign-in, sign-up, and password reset
- Integrated social login buttons with branded icons (Google, Apple)

#### System Verification
- Verified all core functionality: database (2 properties), file uploads (4 images), API endpoints, and authentication flow
- Confirmed role selection redirects users to appropriate dashboards after authentication

### July 24, 2025 - Comprehensive RERA Verification & UX Enhancement

#### RERA Verification Trust Signals Implementation
- Created reusable VerificationBadge component with green check icon and tooltip displaying RERA ID
- Added verification badges to all property cards (home, broker dashboard, property details)
- Enhanced property details page with dedicated "Listed by a RERA Verified Broker" section
- Updated admin dashboard to display RERA IDs and verification status across all property listings
- Integrated verification badges in broker dashboard navigation to show user's own verification status

#### Enhanced User Experience & Interface Polish  
- Improved role selection cards with enhanced hover effects (scale, shadow, border transitions)
- Added "Selected" visual state with blue background and primary border for role cards
- Enhanced success messaging with celebratory emojis and specific role-based messages
- Improved error handling in create-listing with detailed, actionable error messages
- Extended redirect timing to allow users to read success messages (1.5-3 seconds)

#### Trust & Credibility Features
- RERA verification badges appear on property cards when broker has verified RERA ID
- Admin dashboard shows comprehensive broker verification table with RERA IDs
- Property details page highlights RERA verification prominently for buyer confidence  
- Verification badges include tooltips with RERA ID details for transparency
- Consistent green color scheme for all verification elements across the platform

#### Form & Messaging Improvements
- Role selection success: "Profile Updated Successfully! 🎉" with personalized messages
- Broker registration: "Broker Registration Submitted! 🎉" with approval status explanation
- Create listing success: "Property Listed Successfully! 🎉" with review timeline information
- Enhanced error messages with specific, actionable guidance for form failures
- Improved redirect flows directing users to appropriate dashboards based on roles