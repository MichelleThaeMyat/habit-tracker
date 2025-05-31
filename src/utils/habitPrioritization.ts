// Smart Habit Prioritization utilities
export {};

export interface HabitContext {
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  currentStreak: number;
  bestStreak: number;
  scheduledDays: number[];
  completed: boolean;
  weeklyProgress: { [key: string]: boolean };
}

export interface HabitPriorityScore {
  habitId: string;
  priorityScore: number;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// Calculate AI-powered habit priority score (0-100 scale)
export const calculateHabitPriority = (habit: HabitContext): HabitPriorityScore => {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  
  // Input validation
  if (!habit || typeof habit !== 'object') {
    throw new Error('Invalid habit object provided');
  }
  
  // Ensure currentStreak is non-negative
  const currentStreak = Math.max(0, habit.currentStreak || 0);
  const bestStreak = Math.max(0, habit.bestStreak || 0);
  
  // Calculate individual factor scores (each contributes to final 0-100 score)
  let streakScore = 0;
  let categoryScore = 0;
  let urgencyScore = 0;
  let progressScore = 0;
  let difficultyScore = 0;
  
  // 1. Streak-based scoring (0-35% of final score)
  if (currentStreak > 0) {
    let baseStreakScore = Math.min(30, currentStreak * 2); // 0-30 base
    
    // Bonus for habits close to personal records
    if (currentStreak >= bestStreak * 0.8) {
      baseStreakScore += 5; // Up to 35 total
      reasons.push("Close to personal best");
      suggestions.push("You're approaching your personal record!");
    }
    
    streakScore = baseStreakScore;
    reasons.push(`Maintaining ${currentStreak}-day streak`);
    
    if (currentStreak >= 7) {
      suggestions.push("You're on a great streak! Don't break it now.");
    }
  } else {
    // No current streak - moderate priority for restarting
    streakScore = 15;
    reasons.push("Restart momentum");
    suggestions.push("Perfect time to restart this habit!");
  }
  
  // 2. Category-based priorities (0-10% of final score)
  const categoryPriority = {
    'Health & Fitness': 10,
    'Mindfulness': 8,
    'Personal Development': 7,
    'Productivity': 6,
    'Learning': 6,
    'Relationships': 5,
    'Finance': 4,
    'Hobbies': 3,
    'General': 2
  };
  
  categoryScore = categoryPriority[habit.category as keyof typeof categoryPriority] || 2;
  
  // 3. Time-based urgency (0-30% of final score)
  const todayDayOfWeek = new Date().getDay();
  if (habit.scheduledDays.includes(todayDayOfWeek)) {
    urgencyScore = 30;
    reasons.push("Scheduled for today");
  } else {
    urgencyScore = 5; // Still some base urgency
  }
  
  // 4. Weekly completion progress (0-20% of final score)
  // Only count THIS week's progress (not historical data)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
  
  const thisWeekCompletions = Object.entries(habit.weeklyProgress)
    .filter(([dateStr, completed]) => {
      const date = new Date(dateStr);
      return date >= startOfWeek && date <= now && completed;
    }).length;
  
  const possibleCompletions = habit.scheduledDays.length;
  const completionRate = thisWeekCompletions / Math.max(1, possibleCompletions);
  
  if (completionRate < 0.5) {
    progressScore = 20; // High priority for falling behind
    reasons.push("Behind on weekly goal");
    suggestions.push("This habit needs attention this week.");
  } else if (completionRate > 0.8) {
    progressScore = 5; // Lower priority when doing well
    reasons.push("Doing well this week");
  } else {
    progressScore = 12; // Medium priority for average progress
  }
  
  // 5. Difficulty factor (0-5% of final score) - easier habits get higher priority
  const difficultyPoints = { easy: 5, medium: 3, hard: 1 };
  difficultyScore = difficultyPoints[habit.difficulty];
  
  if (habit.difficulty === 'easy') {
    reasons.push("Easy to complete");
  } else if (habit.difficulty === 'hard') {
    reasons.push("Challenging habit");
    suggestions.push("Start with easier habits first, then tackle this one.");
  }
  
  // Calculate final score (0-100) by summing weighted components
  let finalScore = (
    streakScore +           // Max 35 points (35% weight)
    urgencyScore +          // Max 30 points (30% weight)
    progressScore +         // Max 20 points (20% weight)
    categoryScore +         // Max 10 points (10% weight)
    difficultyScore         // Max 5 points (5% weight)
  );                        // Total max: 100 points
  
  // Reduce priority if already completed today
  if (habit.completed) {
    finalScore *= 0.3;
    reasons.push("Already completed today");
  }
  
  // Ensure score stays within 0-100 range
  const score = Math.max(0, Math.min(100, Math.round(finalScore)));
  
    // Determine urgency level based on 0-100 scale
  let urgencyLevel: 'low' | 'medium' | 'high' = 'low';
  if (score >= 70) urgencyLevel = 'high';
  else if (score >= 40) urgencyLevel = 'medium';
  
  // Add urgency-specific suggestions
  if (urgencyLevel === 'high') {
    suggestions.push("High priority - tackle this first!");
  } else if (urgencyLevel === 'medium') {
    suggestions.push("Good candidate for completion today.");
  }
  
  return {
    habitId: habit.name,
    priorityScore: score,
    reason: reasons.join(', '),
    urgencyLevel,
    suggestions
  };
};

// Sort habits by AI priority
export const sortHabitsByPriority = (habits: HabitContext[]): HabitContext[] => {
  const habitPriorities = habits.map(habit => ({
    habit,
    priority: calculateHabitPriority(habit)
  }));
  
  return habitPriorities
    .sort((a, b) => b.priority.priorityScore - a.priority.priorityScore)
    .map(item => item.habit);
};

// Get top priority habits for suggestions
export const getTopPriorityHabits = (habits: HabitContext[], limit: number = 3): HabitPriorityScore[] => {
  return habits
    .map(habit => calculateHabitPriority(habit))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
};

// Generate personalized habit suggestions based on completion patterns
export const generateHabitInsights = (habits: HabitContext[]): string[] => {
  const insights: string[] = [];
  
  // Find habits with longest streaks
  const bestStreak = Math.max(...habits.map(h => h.currentStreak));
  if (bestStreak > 0) {
    const streakHabit = habits.find(h => h.currentStreak === bestStreak);
    insights.push(`🔥 Your strongest habit is "${streakHabit?.name}" with a ${bestStreak}-day streak!`);
  }
  
  // Find habits that need attention
  const strugglingHabits = habits.filter(h => {
    const weeklyCompletions = Object.values(h.weeklyProgress).filter(Boolean).length;
    return weeklyCompletions < 2 && h.scheduledDays.length > 2;
  });
  
  if (strugglingHabits.length > 0) {
    insights.push(`⚠️ ${strugglingHabits.length} habit${strugglingHabits.length > 1 ? 's' : ''} need${strugglingHabits.length === 1 ? 's' : ''} attention this week.`);
  }
  
  // Completion rate insights
  const completedToday = habits.filter(h => h.completed).length;
  const todayScheduled = habits.filter(h => {
    const today = new Date().getDay();
    return h.scheduledDays.includes(today);
  }).length;
  
  if (completedToday === todayScheduled && todayScheduled > 0) {
    insights.push(`🎉 Perfect day! You've completed all ${todayScheduled} habits scheduled for today.`);
  } else if (completedToday > 0) {
    insights.push(`✅ ${completedToday}/${todayScheduled} habits completed today. Keep going!`);
  }
  
  return insights;
};
