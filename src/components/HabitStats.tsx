import React from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { format } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Date;
  weeklyProgress: {
    [key: string]: boolean;
  };
  currentStreak: number;
  bestStreak: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scheduledDays: number[];
  notes: string;
  description: string;
}

interface HabitStatsProps {
  habits: Habit[];
}

const HabitStats: React.FC<HabitStatsProps> = ({ habits }) => {
  // Calculate statistics
  const totalHabits = habits.length;
  const todayDayOfWeek = new Date().getDay();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const habitsScheduledToday = habits.filter(habit => 
    habit.scheduledDays.includes(todayDayOfWeek)
  );
  
  const completedToday = habitsScheduledToday.filter(habit => 
    habit.weeklyProgress[today]
  ).length;
  
  const todayCompletionRate = habitsScheduledToday.length > 0 
    ? (completedToday / habitsScheduledToday.length) * 100 
    : 0;
  
  const totalStreaks = habits.reduce((sum, habit) => sum + habit.currentStreak, 0);
  const averageStreak = totalHabits > 0 ? Math.round(totalStreaks / totalHabits) : 0;
  const longestStreak = Math.max(...habits.map(h => h.bestStreak), 0);

  if (totalHabits === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 25%' } }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {totalHabits}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Habits
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 25%' } }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {completedToday}/{habitsScheduledToday.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed Today
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={todayCompletionRate} 
            sx={{ mt: 1 }}
            color="success"
          />
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 25%' } }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {averageStreak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average Streak
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 25%' } }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main">
            {longestStreak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Best Streak
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default HabitStats;
