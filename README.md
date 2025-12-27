# CalorieCam AI

An AI-powered nutrition tracking application that analyzes food images using Google's Gemini AI to provide detailed nutritional information including calories, macronutrients, and digestion metrics.

## Features

- **AI-Powered Food Analysis**: Capture food images and get instant nutritional analysis using Google Gemini 2.0 Flash
- **Comprehensive Nutrition Data**: Get detailed information including:
  - Calories and macronutrients (carbs, protein, fat, fiber)
  - Micronutrients (sodium, vitamin C)
  - Total weight estimation
  - Digestion time and calories required for digestion
- **User Profiles**: Set and track daily calorie and protein budgets
- **Analysis History**: View and manage your past food analyses
- **Progress Tracking**: Visual progress indicators for calorie and protein budgets
- **Authentication**: Secure user authentication with Supabase
- **Dark Mode**: Theme switching support

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Backend**: Supabase (PostgreSQL database, authentication)
- **AI**: Google Generative AI (Gemini 2.0 Flash)
- **Image Storage**: Cloudinary (compressed image storage with organized folder structure)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Error Tracking**: Sentry
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Google AI API key (Gemini)
- A Cloudinary account (for image storage)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CalorieCam-AI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Set up the database:
Run the SQL migrations in your Supabase project:
- `src/utils/supabase/migrations/20240320000000_create_analysis_logs.sql`
- `src/utils/supabase/migrations/20240330000000_create_user_profiles.sql`

You can run these migrations through the Supabase SQL Editor or using the Supabase CLI.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `GOOGLE_AI_API_KEY` | Your Google AI API key for Gemini | Yes |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Yes |

## Database Schema

### `analysis_logs` Table
Stores food analysis results with the following fields:
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `dish_name`: Name of the dish
- `total_weight_g`: Estimated weight in grams
- `total_digestion_time_m`: Estimated digestion time in minutes
- `total_calories_to_digest_kcal`: Calories required for digestion
- `image_url`: URL to the captured image
- `macros`: JSONB containing macronutrient data
- `micros`: JSONB containing micronutrient data
- `notes`: Array of notes and assumptions
- `created_at`: Timestamp

### `user_profiles` Table
Stores user profile and goal information:
- `id`: UUID primary key (references auth.users)
- `height_cm`: User height in centimeters
- `weight_kg`: User weight in kilograms
- `daily_calories_budget`: Daily calorie target
- `daily_protein_target_g`: Daily protein target in grams
- `activity_level`: Activity level (sedentary, light, moderate, active, very_active)
- `goal`: User goal (lose_weight, maintain, gain_muscle)
- `created_at`: Timestamp
- `updated_at`: Timestamp

Both tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth-pages)/      # Authentication pages (sign-in, sign-up, etc.)
│   ├── camera/            # Camera capture page
│   ├── protected/         # Protected routes (profile, analysis history)
│   └── actions/           # Server actions
├── components/            # React components
│   ├── camera/           # Camera and analysis components
│   ├── profile/          # Profile management components
│   ├── tutorial/        # Tutorial/onboarding components
│   └── ui/              # Reusable UI components (shadcn/ui)
├── contexts/            # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Core libraries and utilities
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    └── supabase/       # Supabase client utilities and migrations
```

## Key Features

### AI Food Analysis
The app uses Google's Gemini 2.0 Flash model to analyze food images. The AI identifies dishes, estimates portion sizes, and calculates comprehensive nutritional information including:
- Macronutrients (calories, carbs, protein, fat, fiber)
- Micronutrients (sodium, vitamin C)
- Digestion metrics (time and calories required)

### Budget Tracking
Users can set daily calorie and protein targets in their profile. The app tracks progress throughout the day with visual progress indicators.

### Analysis History
All food analyses are saved to the database, allowing users to review their nutrition history and track patterns over time.

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server

## Security

- Row Level Security (RLS) enabled on all database tables
- Secure authentication via Supabase
- Environment variables for sensitive API keys
- Server-side API key validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
