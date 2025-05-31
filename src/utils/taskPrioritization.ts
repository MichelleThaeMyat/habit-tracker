// AI-powered Task Prioritization utilities
export {};

export interface TaskContext {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRecurring: boolean;
  currentStreak: number;
  bestStreak: number;
  completionHistory: { [key: string]: boolean };
  lastCompletedDate?: string;
  momentumScore: number;
  deadline?: Date;
  suggestedPriority?: 'low' | 'medium' | 'high';
  energyLevel: 'low' | 'medium' | 'high';
  optimalTimeSlots: string[];
  urgencyScore: number;
}

export interface TaskPriorityScore {
  taskId: string;
  priorityScore: number;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// Calculate AI-powered task priority score (0-100 scale)
export const calculateTaskPriority = (task: TaskContext): TaskPriorityScore => {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  
  // Calculate individual factor scores (0-100 each)
  let deadlineScore = 0;
  let priorityScore = 0;
  let streakScore = 0;
  let momentumScore = 0;
  let energyScore = 0;
  
  // 1. Deadline urgency (0-40 points) - Most important factor
  if (task.deadline) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(task.deadline.getFullYear(), task.deadline.getMonth(), task.deadline.getDate());
    const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      deadlineScore = 40; // Overdue - maximum urgency
      reasons.push(`Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`);
      suggestions.push("This task is overdue! Complete it as soon as possible.");
    } else if (diffDays === 0) {
      deadlineScore = 35; // Due today
      reasons.push("Due today");
      suggestions.push("Due today - high priority!");
    } else if (diffDays === 1) {
      deadlineScore = 25; // Due tomorrow
      reasons.push("Due tomorrow");
      suggestions.push("Due tomorrow - don't delay!");
    } else if (diffDays <= 3) {
      deadlineScore = 15; // Due soon
      reasons.push(`Due in ${diffDays} days`);
      suggestions.push("Due soon - plan accordingly.");
    } else if (diffDays <= 7) {
      deadlineScore = 8; // Due this week
      reasons.push(`Due in ${diffDays} days`);
    } else {
      deadlineScore = 3; // Due later
      reasons.push(`Due in ${diffDays} days`);
    }
  } else {
    deadlineScore = 5; // No deadline - low urgency
  }
  
  // 2. Manual priority level (0-25 points)
  const manualPriorityPoints = { low: 5, medium: 15, high: 25 };
  priorityScore = manualPriorityPoints[task.priority];
  reasons.push(`${task.priority} priority`);
  
  // 3. Streak maintenance for recurring tasks (0-20 points)
  if (task.isRecurring) {
    if (task.currentStreak > 0) {
      streakScore = Math.min(15, task.currentStreak * 1.5);
      reasons.push(`Maintaining ${task.currentStreak}-day streak`);
      
      if (task.currentStreak >= 7) {
        suggestions.push("Great streak! Keep the momentum going.");
      }
      
      // Bonus for tasks close to personal records
      if (task.currentStreak >= task.bestStreak * 0.8) {
        streakScore += 5;
        reasons.push("Close to personal best");
        suggestions.push("You're approaching your personal record!");
      }
    } else {
      streakScore = 10; // Moderate priority for restarting
      reasons.push("Restart streak opportunity");
      suggestions.push("Perfect time to restart this habit!");
    }
  } else {
    streakScore = 0; // Non-recurring tasks don't get streak bonuses
  }
  
  // 4. Momentum score (0-10 points)
  if (task.momentumScore > 0) {
    momentumScore = task.momentumScore * 0.1; // Scale to 0-10
    if (task.momentumScore >= 80) {
      reasons.push("High momentum");
      suggestions.push("You're on fire! Keep going!");
    } else if (task.momentumScore >= 60) {
      reasons.push("Good momentum");
    }
  }
  
  // 5. Energy level consideration (0-5 points)
  const currentHour = new Date().getHours();
  if (task.energyLevel === 'high' && currentHour >= 8 && currentHour <= 11) {
    energyScore = 5; // High energy tasks prioritized in morning
    reasons.push("Peak energy time");
  } else if (task.energyLevel === 'medium' && (currentHour >= 14 && currentHour <= 16)) {
    energyScore = 3; // Medium energy tasks in afternoon
  } else if (task.energyLevel === 'low' && currentHour >= 19) {
    energyScore = 2; // Low energy tasks in evening
  } else {
    energyScore = 1; // Base energy score
  }
  
  // Calculate weighted final score (0-100)
  let finalScore = (
    deadlineScore * 0.40 +      // 40% weight on deadline urgency
    priorityScore * 0.25 +      // 25% weight on manual priority
    streakScore * 0.20 +        // 20% weight on streak maintenance
    momentumScore * 0.10 +      // 10% weight on momentum
    energyScore * 0.05          // 5% weight on energy timing
  );
  
  // Reduce priority if already completed
  if (task.completed) {
    finalScore *= 0.2;
    reasons.push("Already completed");
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
    taskId: task.id,
    priorityScore: score,
    reason: reasons.join(', '),
    urgencyLevel,
    suggestions
  };
};

// Sort tasks by AI priority
export const sortTasksByPriority = (tasks: TaskContext[]): TaskContext[] => {
  const taskPriorities = tasks.map(task => ({
    task,
    priority: calculateTaskPriority(task)
  }));
  
  return taskPriorities
    .sort((a, b) => b.priority.priorityScore - a.priority.priorityScore)
    .map(item => item.task);
};

// Get top priority tasks for suggestions
export const getTopPriorityTasks = (tasks: TaskContext[], limit: number = 3): TaskPriorityScore[] => {
  return tasks
    .map(task => calculateTaskPriority(task))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
};

// Generate personalized task insights based on completion patterns
export const generateTaskInsights = (tasks: TaskContext[]): string[] => {
  const insights: string[] = [];
  
  // Find overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.deadline || task.completed) return false;
    return task.deadline.getTime() < Date.now();
  });
  
  if (overdueTasks.length > 0) {
    insights.push(`⚠️ ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue - immediate attention needed!`);
  }
  
  // Find tasks due today
  const today = new Date();
  const todayTasks = tasks.filter(task => {
    if (!task.deadline || task.completed) return false;
    const taskDate = new Date(task.deadline.getFullYear(), task.deadline.getMonth(), task.deadline.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return taskDate.getTime() === todayDate.getTime();
  });
  
  if (todayTasks.length > 0) {
    insights.push(`📅 ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today.`);
  }
  
  // Find recurring tasks with streaks
  const recurringTasks = tasks.filter(task => task.isRecurring && task.currentStreak > 0);
  if (recurringTasks.length > 0) {
    const bestStreak = Math.max(...recurringTasks.map(t => t.currentStreak));
    const streakTask = recurringTasks.find(t => t.currentStreak === bestStreak);
    insights.push(`🔥 Your strongest task streak is "${streakTask?.title}" with ${bestStreak} days!`);
  }
  
  // High momentum tasks
  const highMomentumTasks = tasks.filter(task => task.momentumScore >= 80);
  if (highMomentumTasks.length > 0) {
    insights.push(`🚀 ${highMomentumTasks.length} task${highMomentumTasks.length > 1 ? 's' : ''} with high momentum - keep the energy going!`);
  }
  
  // Completion rate insights
  const completedToday = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.completionHistory[today] || false;
  }).length;
  
  if (completedToday > 0) {
    insights.push(`✅ ${completedToday} task${completedToday > 1 ? 's' : ''} completed today. Great progress!`);
  }
  
  return insights;
};
