// Analytics utility functions for habit data analysis
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, subWeeks, startOfWeek, endOfWeek, differenceInDays, parseISO, startOfYear, endOfYear } from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Date;
  weeklyProgress: { [key: string]: boolean };
  currentStreak: number;
  bestStreak: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scheduledDays: number[];
  notes: string;
  description: string;
}

export interface HeatmapData {
  date: string;
  count: number;
  level: number; // 0-4 for different intensity levels
  habits: string[]; // list of completed habit names
}

export interface TrendData {
  habitId: string;
  habitName: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  weeklyCompletionRates: number[];
  currentRate: number;
  previousRate: number;
}

export interface CorrelationData {
  habit1Id: string;
  habit1Name: string;
  habit2Id: string;
  habit2Name: string;
  correlationScore: number; // -1 to 1
  description: string;
}

export interface ProductivityPattern {
  dayOfWeek: number;
  dayName: string;
  averageCompletionRate: number;
  totalCompletions: number;
  bestHabits: string[];
  worstHabits: string[];
}

export interface Goal {
  id: string;
  habitId: string;
  habitName: string;
  targetStreak: number;
  targetDate: Date;
  currentProgress: number;
  isCompleted: boolean;
  createdAt: Date;
}

export interface DependencyData {
  groupId: string;
  habits: string[];
  failureRate: number;
  averageGroupCompletion: number;
  strongestLink: string;
  weakestLink: string;
}

// Generate heatmap data for a given year
export const generateHeatmapData = (habits: Habit[], year: number): HeatmapData[] => {
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 11, 31));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    
    // Get habits scheduled for this day
    const scheduledHabits = habits.filter(habit => 
      habit.scheduledDays.includes(dayOfWeek) && 
      new Date(habit.createdAt) <= date
    );
    
    // Get completed habits for this day
    const completedHabits = scheduledHabits.filter(habit => 
      habit.weeklyProgress[dateStr] === true
    );

    const count = completedHabits.length;
    const totalScheduled = scheduledHabits.length;
    
    // Calculate intensity level (0-4)
    let level = 0;
    if (totalScheduled > 0) {
      const completionRate = count / totalScheduled;
      if (completionRate >= 1.0) level = 4;
      else if (completionRate >= 0.8) level = 3;
      else if (completionRate >= 0.6) level = 2;
      else if (completionRate >= 0.3) level = 1;
    }

    return {
      date: dateStr,
      count,
      level,
      habits: completedHabits.map(h => h.name)
    };
  });
};

// Analyze trends for each habit over the past 8 weeks
export const analyzeTrends = (habits: Habit[]): TrendData[] => {
  const now = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, 7 - i));
    const weekEnd = endOfWeek(weekStart);
    return { start: weekStart, end: weekEnd };
  });

  return habits.map(habit => {
    const weeklyRates = weeks.map(week => {
      const weekDays = eachDayOfInterval({ start: week.start, end: week.end });
      const scheduledDays = weekDays.filter(day => 
        habit.scheduledDays.includes(day.getDay())
      );
      
      if (scheduledDays.length === 0) return 0;
      
      const completedDays = scheduledDays.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return habit.weeklyProgress[dateStr] === true;
      });
      
      return completedDays.length / scheduledDays.length;
    });

    const currentRate = weeklyRates.slice(-4).reduce((sum, rate) => sum + rate, 0) / 4;
    const previousRate = weeklyRates.slice(0, 4).reduce((sum, rate) => sum + rate, 0) / 4;
    
    const changePercentage = previousRate === 0 ? 0 : ((currentRate - previousRate) / previousRate) * 100;
    
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 10) {
      direction = changePercentage > 0 ? 'improving' : 'declining';
    }

    return {
      habitId: habit.id,
      habitName: habit.name,
      direction,
      changePercentage,
      weeklyCompletionRates: weeklyRates,
      currentRate,
      previousRate
    };
  });
};

// Calculate correlations between habits
export const calculateCorrelations = (habits: Habit[]): CorrelationData[] => {
  const correlations: CorrelationData[] = [];
  
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const habit1 = habits[i];
      const habit2 = habits[j];
      
      // Get common dates where both habits were scheduled
      const allDates = new Set([
        ...Object.keys(habit1.weeklyProgress),
        ...Object.keys(habit2.weeklyProgress)
      ]);
      
      const commonDates = Array.from(allDates).filter(dateStr => {
        const date = parseISO(dateStr);
        const dayOfWeek = date.getDay();
        return habit1.scheduledDays.includes(dayOfWeek) && 
               habit2.scheduledDays.includes(dayOfWeek);
      });
      
      if (commonDates.length < 7) continue; // Need at least a week of data
      
      // Calculate correlation coefficient
      const pairs = commonDates.map(dateStr => [
        habit1.weeklyProgress[dateStr] ? 1 : 0,
        habit2.weeklyProgress[dateStr] ? 1 : 0
      ]);
      
      const correlation = calculatePearsonCorrelation(pairs);
      
      let description = '';
      if (correlation > 0.7) {
        description = 'Strong positive correlation - these habits boost each other';
      } else if (correlation > 0.4) {
        description = 'Moderate positive correlation - often completed together';
      } else if (correlation < -0.4) {
        description = 'Negative correlation - one may interfere with the other';
      } else {
        description = 'Weak correlation - habits are mostly independent';
      }
      
      if (Math.abs(correlation) > 0.3) { // Only include meaningful correlations
        correlations.push({
          habit1Id: habit1.id,
          habit1Name: habit1.name,
          habit2Id: habit2.id,
          habit2Name: habit2.name,
          correlationScore: correlation,
          description
        });
      }
    }
  }
  
  return correlations.sort((a, b) => Math.abs(b.correlationScore) - Math.abs(a.correlationScore));
};

// Analyze productivity patterns by day of week
export const analyzeProductivityPatterns = (habits: Habit[]): ProductivityPattern[] => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return daysOfWeek.map((dayName, dayOfWeek) => {
    const relevantHabits = habits.filter(habit => 
      habit.scheduledDays.includes(dayOfWeek)
    );
    
    if (relevantHabits.length === 0) {
      return {
        dayOfWeek,
        dayName,
        averageCompletionRate: 0,
        totalCompletions: 0,
        bestHabits: [],
        worstHabits: []
      };
    }
    
    // Get all dates for this day of week
    const allDates = new Set<string>();
    relevantHabits.forEach(habit => {
      Object.keys(habit.weeklyProgress).forEach(dateStr => {
        const date = parseISO(dateStr);
        if (date.getDay() === dayOfWeek) {
          allDates.add(dateStr);
        }
      });
    });
    
    const dates = Array.from(allDates);
    let totalCompletions = 0;
    let totalPossible = 0;
    
    const habitCompletions = new Map<string, { completed: number; total: number }>();
    
    dates.forEach(dateStr => {
      relevantHabits.forEach(habit => {
        const key = habit.name;
        if (!habitCompletions.has(key)) {
          habitCompletions.set(key, { completed: 0, total: 0 });
        }
        
        const data = habitCompletions.get(key)!;
        data.total++;
        totalPossible++;
        
        if (habit.weeklyProgress[dateStr]) {
          data.completed++;
          totalCompletions++;
        }
      });
    });
    
    const averageCompletionRate = totalPossible > 0 ? totalCompletions / totalPossible : 0;
    
    // Find best and worst performing habits for this day
    const habitRates = Array.from(habitCompletions.entries()).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? data.completed / data.total : 0,
      total: data.total
    })).filter(h => h.total >= 3); // Need at least 3 data points
    
    habitRates.sort((a, b) => b.rate - a.rate);
    
    return {
      dayOfWeek,
      dayName,
      averageCompletionRate,
      totalCompletions,
      bestHabits: habitRates.slice(0, 3).map(h => h.name),
      worstHabits: habitRates.slice(-3).reverse().map(h => h.name)
    };
  });
};

// Identify habit dependencies (habits that tend to fail together)
export const analyzeDependencies = (habits: Habit[]): DependencyData[] => {
  // Group habits by category first
  const categoryGroups = new Map<string, Habit[]>();
  habits.forEach(habit => {
    if (!categoryGroups.has(habit.category)) {
      categoryGroups.set(habit.category, []);
    }
    categoryGroups.get(habit.category)!.push(habit);
  });
  
  const dependencies: DependencyData[] = [];
  
  categoryGroups.forEach((groupHabits, category) => {
    if (groupHabits.length < 2) return;
    
    // Get all dates where at least one habit in the group was scheduled
    const allDates = new Set<string>();
    groupHabits.forEach(habit => {
      Object.keys(habit.weeklyProgress).forEach(dateStr => {
        const date = parseISO(dateStr);
        const dayOfWeek = date.getDay();
        if (habit.scheduledDays.includes(dayOfWeek)) {
          allDates.add(dateStr);
        }
      });
    });
    
    const dates = Array.from(allDates);
    let groupFailures = 0;
    let totalGroupDays = 0;
    let totalCompletions = 0;
    let totalPossible = 0;
    
    const habitPerformance = new Map<string, { completed: number; total: number }>();
    
    dates.forEach(dateStr => {
      const date = parseISO(dateStr);
      const dayOfWeek = date.getDay();
      
      const scheduledToday = groupHabits.filter(habit => 
        habit.scheduledDays.includes(dayOfWeek)
      );
      
      if (scheduledToday.length === 0) return;
      
      const completedToday = scheduledToday.filter(habit => 
        habit.weeklyProgress[dateStr] === true
      );
      
      totalGroupDays++;
      totalPossible += scheduledToday.length;
      totalCompletions += completedToday.length;
      
      // Check if this was a group failure day (< 50% completion)
      if (completedToday.length / scheduledToday.length < 0.5) {
        groupFailures++;
      }
      
      // Track individual habit performance
      scheduledToday.forEach(habit => {
        if (!habitPerformance.has(habit.name)) {
          habitPerformance.set(habit.name, { completed: 0, total: 0 });
        }
        const perf = habitPerformance.get(habit.name)!;
        perf.total++;
        if (habit.weeklyProgress[dateStr]) {
          perf.completed++;
        }
      });
    });
    
    if (totalGroupDays < 7) return; // Need at least a week of data
    
    const failureRate = groupFailures / totalGroupDays;
    const averageGroupCompletion = totalPossible > 0 ? totalCompletions / totalPossible : 0;
    
    // Find strongest and weakest links
    const performances = Array.from(habitPerformance.entries()).map(([name, perf]) => ({
      name,
      rate: perf.total > 0 ? perf.completed / perf.total : 0
    }));
    
    performances.sort((a, b) => b.rate - a.rate);
    
    if (performances.length >= 2) {
      dependencies.push({
        groupId: category,
        habits: groupHabits.map(h => h.name),
        failureRate,
        averageGroupCompletion,
        strongestLink: performances[0].name,
        weakestLink: performances[performances.length - 1].name
      });
    }
  });
  
  return dependencies.sort((a, b) => b.failureRate - a.failureRate);
};

// Helper function to calculate Pearson correlation coefficient
function calculatePearsonCorrelation(pairs: number[][]): number {
  const n = pairs.length;
  if (n === 0) return 0;
  
  const sumX = pairs.reduce((sum, pair) => sum + pair[0], 0);
  const sumY = pairs.reduce((sum, pair) => sum + pair[1], 0);
  const sumXY = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);
  const sumX2 = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
  const sumY2 = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Goal management functions
export const createGoal = (habitId: string, habitName: string, targetStreak: number, targetDate: Date): Goal => {
  return {
    id: `goal_${Date.now()}`,
    habitId,
    habitName,
    targetStreak,
    targetDate,
    currentProgress: 0,
    isCompleted: false,
    createdAt: new Date()
  };
};

export const updateGoalProgress = (goals: Goal[], habits: Habit[]): Goal[] => {
  return goals.map(goal => {
    const habit = habits.find(h => h.id === goal.habitId);
    if (!habit) return goal;
    
    const currentProgress = habit.currentStreak;
    const isCompleted = currentProgress >= goal.targetStreak || new Date() > goal.targetDate;
    
    return {
      ...goal,
      currentProgress,
      isCompleted
    };
  });
};
