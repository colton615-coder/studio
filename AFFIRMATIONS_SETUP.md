# Daily Affirmations Loading Screen - Setup Guide

## Overview
This guide provides complete setup instructions for the Daily Affirmations Loading Screen feature.

## 1. Firestore Data Model

### TypeScript Type Definition
The affirmation type is defined in `src/types/affirmation.ts`:

```typescript
export interface Affirmation {
  id?: string;
  text: string;
  source: string;
}
```

### Collection Structure
- **Collection Name**: `affirmations`
- **Fields**:
  - `text` (string): The affirmation or inspirational quote
  - `source` (string): The source or author of the affirmation

## 2. Adding Your First Affirmation

### Using Firebase Console
1. Open your Firebase Console
2. Navigate to Firestore Database
3. Click "Start collection"
4. Collection ID: `affirmations`
5. Add a document with the following fields:
   - Field: `text`, Type: string, Value: "I am capable of achieving greatness through dedication and perseverance."
   - Field: `source`, Type: string, Value: "Daily Wisdom"

### Using Firebase CLI (Recommended for bulk import)

First, ensure you have the Firebase CLI installed and authenticated:

```bash
npm install -g firebase-tools
firebase login
```

Then, you can add a document using the Firebase Admin SDK or use the following script:

#### Option A: Using Firebase Console Import
Create a JSON file `affirmations.json`:

```json
{
  "affirmations": {
    "affirmation1": {
      "text": "I am capable of achieving greatness through dedication and perseverance.",
      "source": "Daily Wisdom"
    },
    "affirmation2": {
      "text": "Trust in the Lord with all your heart and lean not on your own understanding.",
      "source": "Proverbs 3:5"
    },
    "affirmation3": {
      "text": "Every day is a new opportunity to grow and become better than yesterday.",
      "source": "Life Inspiration"
    },
    "affirmation4": {
      "text": "I can do all things through Christ who strengthens me.",
      "source": "Philippians 4:13"
    },
    "affirmation5": {
      "text": "Your potential is limitless when you believe in yourself.",
      "source": "Motivational Wisdom"
    }
  }
}
```

Then import using Firebase CLI:

```bash
firebase firestore:import affirmations.json
```

#### Option B: Using Node.js Script
Create a file `add-affirmations.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const affirmations = [
  {
    text: "I am capable of achieving greatness through dedication and perseverance.",
    source: "Daily Wisdom"
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding.",
    source: "Proverbs 3:5"
  },
  {
    text: "Every day is a new opportunity to grow and become better than yesterday.",
    source: "Life Inspiration"
  },
  {
    text: "I can do all things through Christ who strengthens me.",
    source: "Philippians 4:13"
  },
  {
    text: "Your potential is limitless when you believe in yourself.",
    source: "Motivational Wisdom"
  }
];

async function addAffirmations() {
  const batch = db.batch();
  const collectionRef = db.collection('affirmations');
  
  affirmations.forEach((affirmation) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, affirmation);
  });
  
  await batch.commit();
  console.log('Affirmations added successfully!');
}

addAffirmations().catch(console.error);
```

Run it:
```bash
node add-affirmations.js
```

#### Option C: Quick Firebase Shell Command
Using Firebase CLI with Node.js:

```bash
firebase firestore:add affirmations '{"text":"I am capable of achieving greatness through dedication and perseverance.","source":"Daily Wisdom"}'
```

## 3. Using the LoadingScreen Component

### Import and Use
The LoadingScreen component is located at `src/app/LoadingScreen.tsx`.

To use it in your application:

```tsx
import LoadingScreen from '@/app/LoadingScreen';

// In your component
function MyApp() {
  const [isLoading, setIsLoading] = useState(true);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return <div>Your app content</div>;
}
```

## 4. How It Works

### Client-Side Caching
- **localStorage Key**: `life-in-sync-daily-affirmation`
- **Cached Data Structure**: 
  ```typescript
  {
    affirmation: Affirmation;
    timestamp: string;
  }
  ```

### Same-Day Logic
1. On app load, the component checks localStorage
2. If a timestamp from today exists, it uses the stored affirmation
3. Otherwise, it fetches a new random affirmation from Firestore
4. The new affirmation is saved to localStorage with the current timestamp

### Never-Fail Fallback
If the initial Firestore fetch fails (e.g., user is offline):
- A hardcoded fallback affirmation is displayed
- The fallback is NOT cached, so the app will try fetching again on next load
- Fallback: "Every day is a new opportunity to grow, learn, and become the best version of yourself."

### Random Selection
The component fetches all documents from the `affirmations` collection and randomly selects one. For better performance with large collections (100+ documents), consider implementing a random field strategy.

## 5. Firestore Security Rules

Add these rules to your `firestore.rules` file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Affirmations: public read access, no write access from client
    match /affirmations/{affirmationId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## 6. Features

✅ **Client-side caching** with localStorage
✅ **Same-day logic** - shows the same affirmation for the entire day
✅ **Random selection** from Firestore collection
✅ **Never-fail fallback** for offline scenarios
✅ **Framer Motion animations** for smooth transitions
✅ **Neumorphic design** using Tailwind CSS tokens
✅ **Fully typed** with TypeScript
✅ **Production-ready** and bulletproof

## 7. Customization

### Styling
The component uses Tailwind CSS with neumorphic design tokens defined in `tailwind.config.ts`. You can customize:
- Colors: Modify the accent colors in globals.css
- Animations: Adjust Framer Motion animation parameters
- Shadows: Update neumorphic shadow utilities in tailwind.config.ts

### Affirmation Categories
To add categories or filters, update the Affirmation type:

```typescript
export interface Affirmation {
  id?: string;
  text: string;
  source: string;
  category?: 'motivation' | 'spiritual' | 'wellness';
}
```

## 8. Troubleshooting

### Affirmation not loading
1. Check Firebase Console - ensure documents exist in the `affirmations` collection
2. Verify Firestore rules allow read access
3. Check browser console for errors
4. Fallback affirmation will display if fetch fails

### Same affirmation showing every load
This is expected behavior - the component caches the affirmation for the entire day. To test with different affirmations:
1. Clear localStorage: `localStorage.removeItem('life-in-sync-daily-affirmation')`
2. Or wait until the next day

### Performance with many affirmations
For collections with 100+ documents, consider implementing a random field approach:
1. Add a `randomIndex` field (number 0-1) to each document
2. Use Firestore queries with `orderBy('randomIndex')` and `limit(1)`
