// Enhanced exercise schema with comprehensive metadata for 10x better experience
export type Exercise = {
  id: string; // e.g., 'push-ups'
  name: string;
  asset: ExerciseAsset;
  instructions: {
    summary: string;
    keyPoints: string[];
  };
  defaultType: 'time' | 'reps';
  defaultDuration?: number; // e.g., 60 (in seconds)
  defaultReps?: number;     // e.g., 10
  defaultSets?: number;     // e.g., 3
  // New enhanced metadata
  muscleGroups: {
    primary: string[];
    secondary: string[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  category: 'strength' | 'cardio' | 'flexibility' | 'warmup' | 'cooldown' | 'rest';
};


// The Asset schema remains the same.
export type ExerciseAsset = {
  type: 'gif' | 'api' | 'initials';
  value: string; // e.g., 'push-ups.gif' OR 'pushups exercise' OR 'PU'
};

// The library is now a Record of string to the new Exercise type.
// I have populated all the new fields for every existing exercise with sensible defaults.
export const exerciseLibrary: Record<string, Exercise> = {
  'jumping-jacks': {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    asset: { type: 'api', value: 'jumping jacks' },
    instructions: {
      summary: 'A full-body cardio exercise that involves jumping to a position with the legs spread wide and the hands touching overhead.',
      keyPoints: [
        'Stand with feet together and arms at your sides.',
        'In one motion, jump your feet out and raise your arms above your head.',
        'Land softly on the balls of your feet.',
        'Immediately reverse the motion to return to the starting position.'
      ]
    },
    defaultType: 'time',
    defaultDuration: 45,
    muscleGroups: {
      primary: ['Full Body', 'Cardiovascular'],
      secondary: ['Shoulders', 'Calves']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'warmup',
  },
  'push-ups': {
    id: 'push-ups',
    name: 'Push-ups',
    asset: { type: 'api', value: 'push-up fitness' },
    instructions: {
      summary: 'A classic bodyweight exercise that strengthens the chest, shoulders, and triceps.',
      keyPoints: [
        'Start in a high plank position with hands shoulder-width apart.',
        'Keep your back straight and core engaged throughout.',
        'Lower your body until your chest is just above the floor.',
        'Push back up to the starting position with explosive force.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 10,
    defaultSets: 3,
    muscleGroups: {
      primary: ['Chest', 'Triceps'],
      secondary: ['Shoulders', 'Core']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'strength',
  },
  'arm-circles': {
    id: 'arm-circles',
    name: 'Arm Circles',
    asset: { type: 'api', value: 'arm circle exercise' },
    instructions: {
      summary: 'A simple warm-up exercise to increase mobility in the shoulder joints.',
      keyPoints: [
        'Extend your arms straight out to your sides, parallel to the floor.',
        'Make small, controlled circles with your hands.',
        'Keep your arms straight and your movements controlled.',
        'Reverse direction halfway through the set.'
      ]
    },
    defaultType: 'time',
    defaultDuration: 30,
    muscleGroups: {
      primary: ['Shoulders'],
      secondary: ['Upper Back']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'warmup',
  },
  'dynamic-chest-stretch': {
    id: 'dynamic-chest-stretch',
    name: 'Dynamic Chest Stretch',
    asset: { type: 'api', value: 'chest stretch' },
    instructions: {
      summary: 'A dynamic stretch to warm up the chest and shoulder muscles.',
      keyPoints: [
        'Stand with your feet shoulder-width apart.',
        'Swing both arms open wide, feeling a stretch in your chest.',
        'Swing them closed, crossing them in front of your body.',
        'Maintain a rhythmic, controlled motion.'
      ]
    },
    defaultType: 'time',
    defaultDuration: 30,
    muscleGroups: {
      primary: ['Chest', 'Shoulders'],
      secondary: ['Upper Back']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'warmup',
  },
  'scapular-retractions': {
    id: 'scapular-retractions',
    name: 'Scapular Retractions',
    asset: { type: 'initials', value: 'SR' },
    instructions: {
      summary: 'An exercise to activate and strengthen the muscles of the upper back.',
      keyPoints: [
        'Stand or sit with a straight back, arms relaxed.',
        'Without bending your arms, squeeze your shoulder blades together.',
        'Imagine you are trying to hold a pencil between them.',
        'Hold the squeeze for a moment, then release.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 15,
    defaultSets: 2,
    muscleGroups: {
      primary: ['Upper Back', 'Rhomboids'],
      secondary: ['Rear Delts']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'warmup',
  },
  squats: {
    id: 'squats',
    name: 'Squats',
    asset: { type: 'api', value: 'squat workout' },
    instructions: {
      summary: 'A fundamental compound exercise that targets the thighs, hips, and glutes.',
      keyPoints: [
        'Stand with feet shoulder-width apart, toes pointing slightly out.',
        'Keep your chest up and back straight as you lower your hips.',
        'Lower as if sitting back in a chair, aiming for thighs parallel to the floor.',
        'Push through your heels to return to the starting position.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 12,
    defaultSets: 3,
    muscleGroups: {
      primary: ['Quadriceps', 'Glutes'],
      secondary: ['Hamstrings', 'Core']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)', 'Optional: Barbell, Dumbbells'],
    category: 'strength',
  },
  lunges: {
    id: 'lunges',
    name: 'Lunges',
    asset: { type: 'api', value: 'lunge workout' },
    instructions: {
      summary: 'A unilateral exercise that strengthens the legs and improves balance.',
      keyPoints: [
        'Step forward with one leg, lowering your hips until both knees are at a 90-degree angle.',
        'Ensure your front knee is directly above your ankle.',
        'Keep your back straight and core engaged.',
        'Push off your front foot to return to the start and alternate legs.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 10, // Per leg
    defaultSets: 3,
    muscleGroups: {
      primary: ['Quadriceps', 'Glutes'],
      secondary: ['Hamstrings', 'Calves', 'Core']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)', 'Optional: Dumbbells'],
    category: 'strength',
  },
  plank: {
    id: 'plank',
    name: 'Plank',
    asset: { type: 'api', value: 'plank exercise' },
    instructions: {
      summary: 'An isometric core exercise that involves maintaining a position similar to a push-up.',
      keyPoints: [
        'Hold a push-up position, either on your hands or forearms.',
        'Your body should form a straight line from your head to your heels.',
        'Engage your core and glutes to prevent your hips from sagging.',
        'Breathe steadily throughout the hold.'
      ]
    },
    defaultType: 'time',
    defaultDuration: 60,
    muscleGroups: {
      primary: ['Core', 'Abs'],
      secondary: ['Shoulders', 'Glutes']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'strength',
  },
  crunches: {
    id: 'crunches',
    name: 'Crunches',
    asset: { type: 'api', value: 'crunches ab workout' },
    instructions: {
      summary: 'A classic abdominal exercise that targets the rectus abdominis muscle.',
      keyPoints: [
        'Lie on your back with your knees bent and feet flat on the floor.',
        'Place your hands behind your head, without pulling on your neck.',
        'Lift your head and shoulders off the floor, using your abs.',
        'Lower back down with control, not just dropping.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 20,
    defaultSets: 3,
    muscleGroups: {
      primary: ['Abs', 'Core'],
      secondary: ['Hip Flexors']
    },
    difficulty: 'beginner',
    equipment: ['None (Bodyweight)'],
    category: 'strength',
  },
  burpees: {
    id: 'burpees',
    name: 'Burpees',
    asset: { type: 'api', value: 'burpee exercise' },
    instructions: {
      summary: 'A full-body, high-intensity exercise that combines a squat, push-up, and jump.',
      keyPoints: [
        'From standing, drop into a squat and place your hands on the floor.',
        'Kick your feet back to a plank and perform a push-up.',
        'Jump your feet back to the squat position.',
        'Explode up into a jump, clapping your hands overhead.'
      ]
    },
    defaultType: 'reps',
    defaultReps: 10,
    defaultSets: 3,
    muscleGroups: {
      primary: ['Full Body', 'Cardiovascular'],
      secondary: ['Chest', 'Legs', 'Core']
    },
    difficulty: 'advanced',
    equipment: ['None (Bodyweight)'],
    category: 'cardio',
  },
  rest: {
    id: 'rest',
    name: 'Rest',
    asset: { type: 'initials', value: 'R' },
    instructions: {
      summary: 'Recovery is a crucial part of your workout. Use this time to regulate your breathing and prepare for the next exercise.',
      keyPoints: [
        'Breathe deeply and slowly.',
        'Take a sip of water if needed.',
        'Mentally prepare for the next movement.',
        'Stay loose, but ready.'
      ]
    },
    defaultType: 'time',
    defaultDuration: 60,
    muscleGroups: {
      primary: ['Recovery'],
      secondary: []
    },
    difficulty: 'beginner',
    equipment: ['None'],
    category: 'rest',
  },
};
