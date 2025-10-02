# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
- **Start dev server**: `npm run dev` or `pnpm dev`
- **Build production**: `npm run build` or `pnpm build`
- **Start production**: `npm run start` or `pnpm start`
- **Lint code**: `npm run lint` or `pnpm lint`

### Database & User Management Scripts
- **Create root user**: `npm run create-root-user`
- **Verify user**: `npm run verify-user`
- **Check users**: `npm run check-users`
- **Migrate new schema**: `npm run migrate-new-schema`

### Package Management
This project supports multiple package managers but uses pnpm primarily (evidenced by pnpm-lock.yaml). Also has npm (package-lock.json) and yarn (yarn.lock) lock files.

### Testing
- **Run tests**: `npm test` (Jest tests in `__tests__/` directory)
- **Single test file**: `npm test -- url-formatting.test.ts`

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI**: Radix UI components with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI GPT for story analysis, FAL AI for image and video generation
- **Authentication**: JWT-based auth with cookies
- **Styling**: Tailwind CSS with custom animations and gradients

### Application Structure

#### Core Workflow
1. **Home** (`/home`) - Landing page with recent stories showcase (3 most recent)
2. **Story Input** (`/story`) - Users input story text and select AI models (character, scene, video)
3. **Analysis** - OpenAI analyzes story to extract characters and scenes
4. **Visualization** (`/visualize`) - FAL AI generates character and scene images
5. **Video Generation** - Optional: Generate animated video clips from scene images
6. **Gallery** (`/gallery`) - Browse stories with video previews or scene images
7. **Admin Panel** (`/admin`) - Comprehensive admin dashboard with three sections:
   - Model Management: Add/remove AI models
   - User Management: Control user accounts and permissions
   - Story Management: View/delete all user stories with statistics

#### Data Flow Architecture
- **Frontend**: React components with Next.js App Router
- **API Layer**: Next.js API routes handle business logic
- **AI Integration**: 
  - OpenAI for story analysis (characters, scenes, relationships)
  - FAL AI for image generation (characters and scenes)
  - FAL AI for video generation (animated scene clips)
- **Database**: Supabase stores stories, characters, scenes, and generated images
- **Authentication**: Middleware-based route protection with JWT

#### Key Data Models
- **Stories**: Core story data with analysis JSON and model tracking (character, scene, video models)
- **Characters**: Extracted characters with attributes, relationships, audio cues
- **Scenes**: Story scenes with duration, audio elements, character references, and video URLs
- **Models**: Configurable AI models for character/scene/video generation

#### Route Protection
- **Public**: `/home` (landing page)
- **Auth Routes**: `/login`, `/signup` (redirect if authenticated)
- **Protected**: `/story`, `/visualize`, `/gallery` (require authentication)
- **Admin Only**: `/admin`, `/history` (require admin/root role and verification)

### Component Architecture

#### Core Components
- **StoryVisualizerInput**: Main story input form with model selection
- **Storyboard**: User-friendly visual story display with characters, scenes, and videos
- **FullscreenViewer**: Modal component for viewing media with keyboard/click navigation
- **CharacterCard**: Displays character info and generated images (admin view)
- **SceneCard**: Displays scene info and generated images (admin view)
- **Navigation**: App-wide navigation with auth-aware routing
- **AuthContext**: Global authentication state management

#### Service Layer
- **openai-service.ts**: Story analysis via OpenAI API
- **supabase-service.ts**: Database operations and data persistence
- **auth-service.ts**: Authentication and user management
- **supabase-client.ts**: Supabase client configuration

### API Endpoints Structure
- **POST /api/analyze-story**: Analyze story text with OpenAI
- **POST /api/generate-character-image**: Generate character images
- **POST /api/generate-scene-image**: Generate scene images
- **POST /api/generate-scene-video**: Generate animated video clips from scene images
- **GET/POST /api/stories**: CRUD operations for stories
- **GET /api/stories/recent**: Fetch recent stories for home page (limit parameter)
- **GET /api/models**: Fetch available AI models (character, scene, video)
- **POST /api/auth**: Authentication endpoints
- **GET /api/users**: User management (admin only)
- **POST /api/update-story-images**: Update scene video URLs in database

### Database Schema Evolution
The database schema has evolved to support video-focused storytelling:
- Stories now track which AI models were used (character, scene, video)
- Characters include audio cues for voice generation
- Scenes include duration, audio elements, and video URLs
- Migration scripts in `/database/` folder track schema changes
- Video support added in `supabase-migration-video-support-20251002.sql`

### Image and Video Generation Pipeline
1. Story analysis extracts character descriptions
2. Character images generated first using selected character model
3. Scene images generated using scene model + character images as reference
4. **Video Generation (Optional)**: After scene images are ready, user can choose to generate videos
   - Each scene image can be converted to animated video clip
   - Uses selected video model (Stable Video Diffusion, Runway Gen2, Pika Labs)
   - Duration based on scene analysis (default 5 seconds)
   - Videos stored with URLs in database
5. All images and videos stored with URLs in database
6. Fallback to placeholder content if generation fails

### Development Notes
- TypeScript strict mode enabled with path aliases (`@/*`)
- ESLint and TypeScript errors ignored during builds (for development speed)
- Image optimization disabled in Next.js config
- Middleware handles authentication and role-based route protection
- Admin routes (`/admin`, `/history`) require verified admin/root users
- Session storage used for temporary data during visualization process
- Gallery portal shows video previews when available, falls back to scene images
- Video generation is optional and user-initiated after image generation
- Admin panel has 3 tabs: Model Management, User Management, Story Management
- Home page displays 3 most recent stories with video/image previews
- Story Management integrated into admin panel (no separate History route)
- Regular users access Gallery for viewing stories, admins access Story Management in admin panel
- Story detail pages (`/story/[id]`) show user-friendly storyboard layout:
  - Characters section at top with portrait grid
  - Scenes section in middle with landscape grid  
  - Video clips section at bottom (if videos exist)
  - Click any item to open fullscreen viewer with navigation
- Fullscreen viewer supports keyboard navigation (arrows, escape) and click controls
