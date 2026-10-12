# RoadWatch AI v5 — Supabase + offline history

Upload all files to the **root** of the existing `AI-ROAD-WATCH` GitHub repository. GitHub Pages URL stays the same.

## Features
- Existing v4 camera, AI vehicle detection, GPS and experimental road direction diagnostics
- Local IndexedDB journeys, safety events and opt-in GPS samples (every 15 seconds during active journeys)
- Supabase email signup/signin/signout
- Opt-in manual cloud sync for journeys and safety events; cloud event history
- Local JSON export and deletion

## Security / limitations
- Browser publishable key in `config.js` is intentional. NEVER place `sb_secret_`, service-role keys or database passwords in the repository.
- RLS must be enabled on both tables with user_id = auth.uid() policies and the composite journey ownership foreign key.
- The app does **not** upload GPS samples to Supabase; there is no `gps_points` table. It saves optional samples locally only.
- Cloud sync is **manual** after sign-in and consent; it is not a background job.
- Browser data may be deleted by iOS. Cloud records are not deleted by the local Delete button.
- Avoid real driving tests until safety functionality is validated. No reliable detection of other wrong-way drivers.
- Sign up may require email confirmation. Supabase's built-in email service may impose limits.

## Test
1. Deploy and hard refresh Safari.
2. Start journey, use camera, end journey, refresh local history.
3. Sign up and confirm email; sign in.
4. Check cloud consent, press Sync now.
5. Confirm rows in Supabase Table Editor and Load cloud history.


## v5.1 Accessible traffic-light voice announcements
Enable spoken colors from the accessibility panel and use Test voice to unlock/check iOS speech. Announces only when exactly one traffic-light detection has the same color for four consecutive inference frames. Does not determine which lane a light controls; speech is informational only and must not be used as a driving instruction. Safari may limit speech while locked or backgrounded.
