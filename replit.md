# Overview

This is a full-stack web application built with Express.js backend and React frontend that implements a "Square Battle Simulation" game. The application features a Canvas-based 2D game where colored squares (blue, red, green) battle against each other with physics simulation and collision detection. The game includes real-time rendering, sound effects, and interactive UI controls.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/bundling
- **UI Library**: Comprehensive shadcn/ui component system built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: Zustand stores for game state and audio management
- **Game Engine**: Custom Canvas-based 2D game engine with physics simulation
- **Asset Support**: GLSL shaders, 3D models (GLTF/GLB), and audio files

## Backend Architecture
- **Framework**: Express.js with TypeScript in ESM module format
- **Development Setup**: Hot reloading with Vite integration and runtime error overlay
- **Storage Layer**: Pluggable storage interface with in-memory implementation (MemStorage)
- **API Structure**: RESTful endpoints with `/api` prefix and centralized error handling
- **Build Process**: esbuild for production bundling with Node.js platform targeting

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver integration
- **ORM**: Drizzle ORM with schema-first approach and migration support
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Development Storage**: In-memory storage fallback for development/testing

## Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User Schema**: Basic user model with username/password authentication
- **Validation**: Zod schema validation for user input and API requests

## External Dependencies

### Database Services
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Session Store**: PostgreSQL-backed session management
- **Connection**: Environment variable-based database URL configuration

### UI and Styling Libraries
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Fonts**: Inter font family via Fontsource

### Game and Media Libraries
- **3D Graphics**: React Three Fiber ecosystem (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- **Data Fetching**: TanStack React Query for server state management
- **Utility Libraries**: clsx, class-variance-authority, date-fns, cmdk

### Development and Build Tools
- **Build System**: Vite with React plugin and GLSL shader support
- **Type Checking**: TypeScript with strict configuration
- **Runtime**: tsx for TypeScript execution in development
- **Error Handling**: Replit-specific runtime error modal integration

### Third-Party Integrations
- **Audio System**: HTML5 Audio API with Zustand state management
- **Canvas Rendering**: Native HTML5 Canvas API with custom game engine
- **Database Migrations**: Drizzle Kit for schema migrations and database pushing