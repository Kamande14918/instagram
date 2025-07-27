# Instagram Clone - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a React Native Instagram clone built with Expo and Supabase as the backend. The project implements comprehensive social media features including authentication, content sharing, messaging, and social interactions.

## Architecture Guidelines
- Use React Native with Expo for cross-platform development
- Implement Supabase for authentication, database, storage, and real-time features
- Follow React Navigation v6 patterns for navigation
- Use Context API with useReducer for state management
- Implement proper error handling and loading states
- Follow React Native best practices for performance

## Authentication System
- Support email/password, social login (Google, Facebook)
- Implement profile creation and management
- Use Supabase Auth with proper session management
- Include password reset and two-factor authentication
- Handle authentication state across app navigation

## Code Style Guidelines
- Use functional components with hooks
- Implement proper TypeScript types (when applicable)
- Follow consistent naming conventions (camelCase for variables, PascalCase for components)
- Use meaningful component and function names
- Implement proper error boundaries and loading states
- Use consistent styling with StyleSheet.create()

## Security Best Practices
- Store sensitive data securely using Expo SecureStore
- Implement proper input validation
- Use environment variables for API keys
- Follow Supabase security guidelines
- Implement proper image upload and validation

## Performance Considerations
- Implement lazy loading for images and components
- Use FlatList for large data sets
- Optimize image sizes and caching
- Implement proper memory management
- Use React.memo for expensive components

## Database Schema
- Users: profiles, authentication, settings
- Posts: content, metadata, engagement metrics
- Comments: threaded comments system
- Messages: direct messaging functionality
- Stories: temporary content with expiration
- Follows: user relationships and social graph
