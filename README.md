# Bṛhat Mṛdaṅga Database

The club's member roster, for one or more schools: people, club meetings, attendance, talks, prasadam, team notes and sadhana check-ins.
It runs as a plain website (hosted free on GitHub Pages). Logins and data live in **Firebase**, Google's app backend.
Only Google accounts on the team's access list can sign in. Hare Krsna!

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The app itself: every screen, the design, the logic |
| `app-firebase.js` | Connects the app to Firebase (Google sign-in, database, access check) |
| `firebase-config.js` | Your Firebase project's settings. You fill this in once. |
| `firestore.rules` | Database security rules. Only people on the access list can read or write. |
| `firebase.json` | Only used if you later deploy with the Firebase command-line tool. Safe to ignore. |

---
