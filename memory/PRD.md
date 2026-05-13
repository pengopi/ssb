# SSB Academy — Sekolah Sepak Bola Management App

## Overview
Mobile-first (Expo React Native) management app for Indonesian football schools (SSB) with multi-role workflow: Admin, Pelatih (Coach), Orangtua (Parent).

## Features
- **Auth**: JWT + bcrypt, role-based access (admin/coach/parent), signup as parent/coach
- **Dashboard**: Per-role greeting, live stats (students, sessions, upcoming matches, unpaid SPP), upcoming match feed, recent announcements
- **Students**: List with search, profile detail with 5-dimension SKILL RADAR CHART (Teknik, Fisik, Mental, Taktik, Kerjasama), attendance rate, payment history; coach/admin can add students
- **Schedule**: Training sessions list, coach/admin can create; tap → Attendance screen (H/S/A toggle per student, upsert)
- **Payments (SPP)**: Monthly tracking per student with paid/unpaid status, summary cards; coach/admin can record
- **Announcements**: Feed with create modal (coach/admin)
- **Matches**: Upcoming + finished with scores; coach/admin can schedule + update score
- **Role scoping**: Parents only see their own children's data (students, payments)

## Tech Stack
- **Backend**: FastAPI + Motor (async MongoDB) + bcrypt + PyJWT — all routes under `/api`
- **Frontend**: Expo SDK 54, expo-router (file-based), react-native-svg (radar chart), AsyncStorage (token)
- **Theme**: "Performance Pro" — obsidian #09090B background, Volt Green #CCFF00 accents, condensed sporty typography

## Demo Accounts (auto-seeded)
- Admin: `admin@ssb.id` / `admin123`
- Pelatih: `coach@ssb.id` / `coach123`
- Orangtua: `parent@ssb.id` / `parent123` (2 anak linked: Andi, Budi)
+ 5 sample students, 3 announcements, 2 matches, 1 training session seeded on startup.

## API Endpoints
`/api/auth/{signup,login,me}`, `/api/students`, `/api/sessions`, `/api/attendance`, `/api/payments`, `/api/ratings`, `/api/announcements`, `/api/matches`, `/api/stats`

## Smart Business Enhancement
**Multi-role data scoping** ensures privacy by default — parents only see their own children's grades, attendance, and SPP status, making the app safer for academies handling minors and ready for monetization via per-parent subscription tiers.
