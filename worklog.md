---
Task ID: 1
Agent: main
Task: Fix broken web (PWA cache) + add phone and address to registration form

Work Log:
- Audited all files from the problematic commit (7d60d10) and subsequent fixes
- Found root cause: PWA Service Worker was serving stale cached broken JS files
- Rewrote use-pwa-register.ts to forcefully unregister ALL existing service workers before re-registering (nuclear cache bust)
- Added phone number and address fields (street, city, zip) as required fields in the registration form
- Updated signUp() in use-auth.ts to accept phone and address parameters and store them in Firestore
- Updated RegisterData type in types.ts with phone and address fields
- Added translation keys in both es.ts and en.ts for new form labels, placeholders, and validation errors
- Build passes cleanly with no errors
- Pushed to GitHub (commit daa223a)

Stage Summary:
- The web should now load correctly because the PWA hook unregisters stale cached workers before registering the new one
- Registration form now requires phone number and full address (street, city, zip code)
- All data is saved to the user's Firestore document on signup
- Files changed: use-pwa-register.ts, use-auth.ts, types.ts, register-form.tsx, es.ts, en.ts