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

// Calculate AI-powered habit priority score
export const calculateHabitPriority = (habit: HabitContext): HabitPriorityScore => {
  let score = 0;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  
  // Base score from difficulty (harder habits get slightly higher priority when not in streak)
  const difficultyMultiplier = { easy: 1, medium: 1.2, hard: 1.5 };
  
  // Streak-based scoring (prioritize maintaining streaks)
  if (habit.currentStreak > 0) {
    const streakBonus = Math.min(30, habit.currentStreak * 2);
    score += streakBonus;
    reasons.push(`Maintaining ${habit.currentStreak}-day streak`);
    
    if (habit.currentStreak >= 7) {
      suggestions.push("You're on a great streak! Don't break it now.");
    }
    
    // Extra priority for habits close to personal records
    if (habit.currentStreak >= habit.bestStreak * 0.8) {
      score += 15;
      reasons.push("Close to personal best");
      suggestions.push("You're approaching your personal record!");
    }
  } else {
    // No current streak - prioritize restarting
    score += 20;
    reasons.push("Restart momentum");
    suggestions.push("Perfect time to restart this habit!");
  }
  
  // Category-based priorities (health habits get higher priority)
  const categoryPriority = {
    'Health & Fitness': 25,
    'Mindfulness': 20,
    'Personal Development': 18,
    'Productivity': 15,
    'Learning': 15,
    'Relationships': 12,
    'Finance': 10,
    'Hobbies': 8,
    'General': 5
  };
  
  const categoryScore = categoryPriority[habit.category as keyof typeof categoryPriority] || 5;
  score += categoryScore;
  
  // Time-based urgency (habits scheduled for today get higher priority)
  const today = new Date().getDay();
  if (habit.scheduledDays.includes(today)) {
    score += 25;
    reasons.push("Scheduled for today");
  }
  
  // Weekly completion rate (prioritize habits that are falling behind)
  const weeklyCompletions = Object.values(habit.weeklyProgress).filter(Boolean).length;
  const possibleCompletions = habit.scheduledDays.length; // Simplified for demo
  const completionRate = weeklyCompletions / Math.max(1, possibleCompletions);
  
  if (completionRate < 0.5) {
    score += 20;
    reasons.push("Behind on weekly goal");
    suggestions.push("This habit needs attention this week.");
  } else if (completionRate > 0.8) {
    score += 10;
    reasons.push("Doing well this week");
  }
  
  // Apply difficulty multiplier
  score *= difficultyMultiplier[habit.difficulty];
  
  // Reduce priority if already completed today
  if (habit.completed) {
    score *= 0.3;
    reasons.push("Already completed today");
  }
  
  // Determine urgency level
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
    priorityScore: Math.round(score),
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
