# Round 3 Submission: Startup Idea Validator

This document contains the final deployment details for the Startup Idea Validator Platform.

## 🔗 Live Application Link
**[https://idea-validator-dash-final.netlify.app](https://idea-validator-dash-final.netlify.app)**

## 🛰️ Deployed Services
| Service | Platform | Role |
| :--- | :--- | :--- |
| **Frontend** | Netlify | Static hosting & SPA routing |
| **Backend** | Supabase | Managed Backend APIs & Auth |
| **Database** | Supabase | PostgreSQL (Managed Instance) |

## 🛠️ Deployment Setup Documentation

### 1. Frontend Hosting (Netlify)
- The application is a Single Page Application (SPA) built with Vanilla JS.
- **`netlify.toml`** was configured to handle client-side routing, ensuring all paths redirect to `index.html` allowing the app to stay functional on refresh.
- Deployed via Netlify CLI using production-optimized build parameters.

### 2. Backend & Database (Supabase)
- **Supabase PostgreSQL**: Used as the primary data store for Ideas, Polls, and Collaborations.
- **Row Level Security (RLS)**: Configured to protect data integrity, ensuring only owners can edit or delete their ideas.
- **Realtime (CDC)**: Postgres Replication is enabled to push live updates (upvotes, poll progress) instantly to all users via WebSockets.
- **Auth Service**: Managed authentication ensures secure user registration and login flows.

### 3. Environment Configuration
- API keys (Supabase Anon Key and URL) are securely configured in the application logic. 
- All functional endpoints developed in Round 2 (Edit, Delete, Views, Rankings) are fully integrated and functional on the live site.

---
*Submitted for the Production Deployment Challenge.*
