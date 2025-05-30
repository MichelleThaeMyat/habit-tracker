// Task Achievement Utilities
import { Achievement } from '../components/AchievementSystem';

interface Todo {
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
}

export const checkTaskAchievements = (todos: Todo[]): void => {
  const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
  const recurringTasks = todos.filter(todo => todo.isRecurring);
  
  // Calculate task-specific progress
  const maxTaskStreak = Math.max(...recurringTasks.map(t => t.currentStreak), 0);
  const maxMomentumScore = Math.max(...recurringTasks.map(t => t.momentumScore), 0);
  const recurringTaskCount = recurringTasks.length;
  
  // Task achievements to check
  const taskAchievements = [
    'task_streak_starter',
    'task_week_warrior', 
    'task_momentum_master',
    'task_consistency_king',
    'recurring_task_creator'
  ];
  
  let hasNewAchievements = false;
  
  const updatedAchievements = savedAchievements.map((achievement: Achievement) => {
    if (!taskAchievements.includes(achievement.id) || achievement.unlocked) {
      return achievement;
    }
    
    let shouldUnlock = false;
    let newProgress = achievement.progress || 0;
    
    switch (achievement.id) {
      case 'task_streak_starter':
      case 'task_week_warrior':
      case 'task_consistency_king':
        newProgress = maxTaskStreak;
        shouldUnlock = maxTaskStreak >= achievement.requirement;
        break;
        
      case 'task_momentum_master':
        newProgress = maxMomentumScore;
        shouldUnlock = maxMomentumScore >= achievement.requirement;
        break;
        
      case 'recurring_task_creator':
        newProgress = recurringTaskCount;
        shouldUnlock = recurringTaskCount >= achievement.requirement;
        break;
    }
    
    if (shouldUnlock && !achievement.unlocked) {
      hasNewAchievements = true;
      return {
        ...achievement,
        progress: newProgress,
        unlocked: true,
        unlockedAt: new Date()
      };
    }
    
    return {
      ...achievement,
      progress: newProgress
    };
  });
  
  // Add new task achievements if they don't exist
  const existingIds = savedAchievements.map((a: Achievement) => a.id);
  const newTaskAchievements = [
    {
      id: 'task_streak_starter',
      title: 'Task Streak Starter',
      description: 'Build a 3-day streak on a recurring task',
      icon: '🔥',
      type: 'streak',
      requirement: 3,
      rarity: 'common',
      points: 15,
      progress: maxTaskStreak,
      unlocked: maxTaskStreak >= 3,
      unlockedAt: maxTaskStreak >= 3 ? new Date() : undefined
    },
    {
      id: 'task_week_warrior',
      title: 'Task Week Warrior', 
      description: 'Maintain a 7-day task streak',
      icon: '⭐',
      type: 'streak',
      requirement: 7,
      rarity: 'common',
      points: 30,
      progress: maxTaskStreak,
      unlocked: maxTaskStreak >= 7,
      unlockedAt: maxTaskStreak >= 7 ? new Date() : undefined
    },
    {
      id: 'task_momentum_master',
      title: 'Momentum Master',
      description: 'Achieve 80+ momentum score on a task',
      icon: '⚡',
      type: 'milestone', 
      requirement: 80,
      rarity: 'rare',
      points: 75,
      progress: maxMomentumScore,
      unlocked: maxMomentumScore >= 80,
      unlockedAt: maxMomentumScore >= 80 ? new Date() : undefined
    },
    {
      id: 'task_consistency_king',
      title: 'Consistency King',
      description: 'Maintain a 30-day task streak',
      icon: '🏆',
      type: 'streak',
      requirement: 30,
      rarity: 'epic', 
      points: 200,
      progress: maxTaskStreak,
      unlocked: maxTaskStreak >= 30,
      unlockedAt: maxTaskStreak >= 30 ? new Date() : undefined
    },
    {
      id: 'recurring_task_creator',
      title: 'Recurring Task Creator',
      description: 'Create your first recurring task',
      icon: '📋',
      type: 'milestone',
      requirement: 1,
      rarity: 'common',
      points: 10,
      progress: recurringTaskCount,
      unlocked: recurringTaskCount >= 1,
      unlockedAt: recurringTaskCount >= 1 ? new Date() : undefined
    }
  ];
  
  // Add new achievements that don't exist
  newTaskAchievements.forEach(newAchievement => {
    if (!existingIds.includes(newAchievement.id)) {
      updatedAchievements.push(newAchievement);
      if (newAchievement.unlocked) {
        hasNewAchievements = true;
      }
    }
  });
  
  if (hasNewAchievements) {
    localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
  }
};
