// Routine and habit bundling utility functions
import { format, addMinutes, parseISO } from 'date-fns';

export interface RoutineHabit {
  id: string;
  habitId?: string; // Reference to existing habit, optional for routine-specific actions
  name: string;
  description: string;
  estimatedDuration: number; // in minutes
  order: number;
  isOptional: boolean;
  triggerType: 'time' | 'completion' | 'context';
  triggerValue?: string; // time (HH:mm), previous habit ID, or context
  completionCriteria: string;
  notes?: string;
}

export interface HabitStack {
  id: string;
  name: string;
  description: string;
  triggerHabit: string; // "After I [trigger habit]"
  stackedHabit: string; // "I will [stacked habit]"
  location?: string;
  timeWindow: number; // minutes after trigger
  isActive: boolean;
  completionCount: number;
  createdAt: Date;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  type: 'morning' | 'evening' | 'workout' | 'work' | 'custom';
  context: 'home' | 'work' | 'gym' | 'anywhere';
  habits: RoutineHabit[];
  estimatedDuration: number; // total duration in minutes
  optimalStartTime?: string; // HH:mm format
  isTemplate: boolean;
  isActive: boolean;
  completionHistory: { [date: string]: RoutineCompletion };
  tags: string[];
  createdAt: Date;
  lastModified: Date;
}

export interface RoutineCompletion {
  date: string;
  startTime: string;
  endTime?: string;
  completedHabits: string[];
  skippedHabits: string[];
  totalDuration: number;
  completionRate: number;
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'poor';
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  type: 'morning' | 'evening' | 'workout' | 'work' | 'custom';
  context: 'home' | 'work' | 'gym' | 'anywhere';
  habits: Omit<RoutineHabit, 'id'>[];
  estimatedDuration: number;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface ContextBundle {
  id: string;
  name: string;
  context: 'home' | 'work' | 'gym' | 'commute' | 'anywhere';
  habits: string[]; // habit IDs
  triggerConditions: string[];
  isActive: boolean;
  completionHistory: { [date: string]: number }; // completion count per day
}

// Pre-defined routine templates
export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning_energizer',
    name: 'Morning Energizer',
    description: 'Start your day with energy and focus',
    type: 'morning',
    context: 'home',
    estimatedDuration: 30,
    difficulty: 'beginner',
    category: 'wellness',
    tags: ['energy', 'mindfulness', 'health'],
    habits: [
      {
        name: 'Wake up at consistent time',
        description: 'Get out of bed within 5 minutes of alarm',
        estimatedDuration: 5,
        order: 1,
        isOptional: false,
        triggerType: 'time',
        completionCriteria: 'Feet on the floor'
      },
      {
        name: 'Drink water',
        description: 'Hydrate with 16-20oz of water',
        estimatedDuration: 2,
        order: 2,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Glass of water consumed'
      },
      {
        name: 'Light stretching',
        description: '5-minute gentle stretching routine',
        estimatedDuration: 5,
        order: 3,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: '5 minutes of movement'
      },
      {
        name: 'Mindfulness moment',
        description: '3 minutes of deep breathing or meditation',
        estimatedDuration: 3,
        order: 4,
        isOptional: true,
        triggerType: 'completion',
        completionCriteria: '3 minutes of focused breathing'
      },
      {
        name: 'Set daily intention',
        description: 'Write down top 3 priorities for the day',
        estimatedDuration: 5,
        order: 5,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Priorities written down'
      },
      {
        name: 'Healthy breakfast',
        description: 'Nutritious meal to fuel your day',
        estimatedDuration: 10,
        order: 6,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Breakfast consumed'
      }
    ]
  },
  {
    id: 'evening_winddown',
    name: 'Evening Wind-Down',
    description: 'Prepare your mind and body for restful sleep',
    type: 'evening',
    context: 'home',
    estimatedDuration: 45,
    difficulty: 'beginner',
    category: 'wellness',
    tags: ['sleep', 'relaxation', 'reflection'],
    habits: [
      {
        name: 'Digital sunset',
        description: 'Turn off screens 1 hour before bed',
        estimatedDuration: 5,
        order: 1,
        isOptional: false,
        triggerType: 'time',
        triggerValue: '21:00',
        completionCriteria: 'All screens off'
      },
      {
        name: 'Tidy up space',
        description: '10-minute quick cleanup of living area',
        estimatedDuration: 10,
        order: 2,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Space organized'
      },
      {
        name: 'Prepare for tomorrow',
        description: 'Set out clothes and prep essentials',
        estimatedDuration: 5,
        order: 3,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Tomorrow prepared'
      },
      {
        name: 'Gratitude journal',
        description: 'Write 3 things you are grateful for',
        estimatedDuration: 5,
        order: 4,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: '3 gratitudes written'
      },
      {
        name: 'Reading',
        description: '15-20 minutes of relaxing reading',
        estimatedDuration: 20,
        order: 5,
        isOptional: true,
        triggerType: 'completion',
        completionCriteria: 'Read for specified time'
      }
    ]
  },
  {
    id: 'focused_work_session',
    name: 'Focused Work Session',
    description: 'Deep work routine for maximum productivity',
    type: 'work',
    context: 'work',
    estimatedDuration: 120,
    difficulty: 'intermediate',
    category: 'productivity',
    tags: ['focus', 'deep work', 'productivity'],
    habits: [
      {
        name: 'Environment setup',
        description: 'Clear desk, close distracting apps, gather materials',
        estimatedDuration: 5,
        order: 1,
        isOptional: false,
        triggerType: 'context',
        triggerValue: 'work',
        completionCriteria: 'Workspace optimized'
      },
      {
        name: 'Define session goals',
        description: 'Write specific outcomes for this work session',
        estimatedDuration: 5,
        order: 2,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Goals clearly defined'
      },
      {
        name: 'Deep work block 1',
        description: '25-minute focused work period',
        estimatedDuration: 25,
        order: 3,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: '25 minutes of focused work'
      },
      {
        name: 'Short break',
        description: '5-minute movement or breathing break',
        estimatedDuration: 5,
        order: 4,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Break taken'
      },
      {
        name: 'Deep work block 2',
        description: '25-minute focused work period',
        estimatedDuration: 25,
        order: 5,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: '25 minutes of focused work'
      },
      {
        name: 'Long break',
        description: '15-minute break with movement',
        estimatedDuration: 15,
        order: 6,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Break with movement'
      },
      {
        name: 'Deep work block 3',
        description: '25-minute focused work period',
        estimatedDuration: 25,
        order: 7,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: '25 minutes of focused work'
      },
      {
        name: 'Session review',
        description: 'Review accomplishments and plan next steps',
        estimatedDuration: 5,
        order: 8,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Session reviewed'
      }
    ]
  },
  {
    id: 'quick_workout',
    name: 'Quick Energy Workout',
    description: '20-minute energizing workout routine',
    type: 'workout',
    context: 'anywhere',
    estimatedDuration: 20,
    difficulty: 'beginner',
    category: 'fitness',
    tags: ['exercise', 'energy', 'strength'],
    habits: [
      {
        name: 'Warm-up',
        description: '3 minutes of light movement and stretching',
        estimatedDuration: 3,
        order: 1,
        isOptional: false,
        triggerType: 'context',
        triggerValue: 'workout_space',
        completionCriteria: 'Body warmed up'
      },
      {
        name: 'Bodyweight exercises',
        description: '12 minutes of squats, push-ups, planks',
        estimatedDuration: 12,
        order: 2,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Exercises completed'
      },
      {
        name: 'Cool-down stretch',
        description: '5 minutes of stretching and deep breathing',
        estimatedDuration: 5,
        order: 3,
        isOptional: false,
        triggerType: 'completion',
        completionCriteria: 'Stretching completed'
      }
    ]
  }
];

// Utility functions for routine management
export const createRoutine = (
  name: string,
  type: Routine['type'],
  context: Routine['context'],
  description?: string
): Routine => {
  return {
    id: `routine_${Date.now()}`,
    name,
    description: description || '',
    type,
    context,
    habits: [],
    estimatedDuration: 0,
    isTemplate: false,
    isActive: true,
    completionHistory: {},
    tags: [],
    createdAt: new Date(),
    lastModified: new Date()
  };
};

export const createRoutineFromTemplate = (template: RoutineTemplate, customName?: string): Routine => {
  const routine = createRoutine(
    customName || template.name,
    template.type,
    template.context,
    template.description
  );

  routine.habits = template.habits.map((habit, index) => ({
    ...habit,
    id: `habit_${Date.now()}_${index}`
  }));

  routine.estimatedDuration = template.estimatedDuration;
  routine.tags = [...template.tags];

  return routine;
};

export const createHabitStack = (
  name: string,
  description: string,
  triggerHabit: string,
  stackedHabit: string,
  timeWindow: number = 30
): HabitStack => {
  return {
    id: `stack_${Date.now()}`,
    name,
    description,
    triggerHabit,
    stackedHabit,
    timeWindow,
    isActive: true,
    completionCount: 0,
    createdAt: new Date()
  };
};

export const createContextBundle = (
  name: string,
  context: ContextBundle['context'],
  habits: string[],
  triggerConditions: string[] = []
): ContextBundle => {
  return {
    id: `bundle_${Date.now()}`,
    name,
    context,
    habits,
    triggerConditions,
    isActive: true,
    completionHistory: {}
  };
};

export const startRoutineSession = (routine: Routine): RoutineCompletion => {
  const now = new Date();
  return {
    date: format(now, 'yyyy-MM-dd'),
    startTime: format(now, 'HH:mm'),
    completedHabits: [],
    skippedHabits: [],
    totalDuration: 0,
    completionRate: 0
  };
};

export const completeRoutineHabit = (
  session: RoutineCompletion,
  habitId: string,
  duration: number
): RoutineCompletion => {
  return {
    ...session,
    completedHabits: [...session.completedHabits, habitId],
    totalDuration: session.totalDuration + duration
  };
};

export const skipRoutineHabit = (
  session: RoutineCompletion,
  habitId: string,
  reason?: string
): RoutineCompletion => {
  return {
    ...session,
    skippedHabits: [...session.skippedHabits, habitId],
    notes: session.notes ? `${session.notes}\nSkipped ${habitId}: ${reason}` : `Skipped ${habitId}: ${reason}`
  };
};

export const finishRoutineSession = (
  session: RoutineCompletion,
  totalHabits: number,
  mood?: RoutineCompletion['mood']
): RoutineCompletion => {
  const completionRate = session.completedHabits.length / totalHabits;
  return {
    ...session,
    endTime: format(new Date(), 'HH:mm'),
    completionRate,
    mood
  };
};

export const getRoutineStats = (routine: Routine) => {
  const completions = Object.values(routine.completionHistory);
  if (completions.length === 0) {
    return {
      totalSessions: 0,
      averageCompletionRate: 0,
      averageDuration: 0,
      currentStreak: 0,
      bestStreak: 0,
      mostSkippedHabit: null,
      averageMood: null
    };
  }

  const totalSessions = completions.length;
  const averageCompletionRate = completions.reduce((sum, c) => sum + c.completionRate, 0) / totalSessions;
  const averageDuration = completions.reduce((sum, c) => sum + c.totalDuration, 0) / totalSessions;

  // Calculate streaks
  const sortedDates = Object.keys(routine.completionHistory).sort();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const completion = routine.completionHistory[sortedDates[i]];
    if (completion.completionRate >= 0.8) { // 80% completion threshold
      tempStreak++;
      if (i === sortedDates.length - 1) currentStreak = tempStreak;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  // Find most skipped habit
  const skippedHabits = new Map<string, number>();
  completions.forEach(session => {
    session.skippedHabits.forEach(habitId => {
      skippedHabits.set(habitId, (skippedHabits.get(habitId) || 0) + 1);
    });
  });

  const mostSkippedHabit = skippedHabits.size > 0 
    ? Array.from(skippedHabits.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Calculate average mood
  const moodValues = { great: 4, good: 3, okay: 2, poor: 1 };
  const moods = completions.filter(c => c.mood).map(c => moodValues[c.mood!]);
  const averageMood = moods.length > 0 ? moods.reduce((sum, m) => sum + m, 0) / moods.length : null;

  return {
    totalSessions,
    averageCompletionRate,
    averageDuration,
    currentStreak,
    bestStreak,
    mostSkippedHabit,
    averageMood
  };
};

export const getOptimalRoutineTime = (routine: Routine): string => {
  const completions = Object.values(routine.completionHistory);
  if (completions.length === 0) return routine.optimalStartTime || '08:00';

  // Find the time that leads to highest completion rates
  const timePerformance = new Map<string, { total: number; successRate: number }>();
  
  completions.forEach(session => {
    const hour = session.startTime.split(':')[0];
    if (!timePerformance.has(hour)) {
      timePerformance.set(hour, { total: 0, successRate: 0 });
    }
    const data = timePerformance.get(hour)!;
    data.total++;
    data.successRate += session.completionRate >= 0.8 ? 1 : 0;
  });

  // Calculate success rates
  let bestTime = '08:00';
  let bestRate = 0;

  timePerformance.forEach((data, hour) => {
    const rate = data.successRate / data.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestTime = `${hour}:00`;
    }
  });

  return bestTime;
};
