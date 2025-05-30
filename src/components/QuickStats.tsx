import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Stack,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  CheckCircle as CheckIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Habit {
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

interface QuickStatsProps {
  habits: Habit[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ habits }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDayOfWeek = new Date().getDay();

  // Calculate quick stats
  const habitsScheduledToday = habits.filter(habit => 
    habit.scheduledDays.includes(todayDayOfWeek)
  );
  
  const completedToday = habitsScheduledToday.filter(habit => 
    habit.weeklyProgress[today] === true
  );

  const longestCurrentStreak = Math.max(...habits.map(h => h.currentStreak), 0);
  const activeStreaks = habits.filter(h => h.currentStreak > 0).length;
  const completionRate = habitsScheduledToday.length > 0 
    ? Math.round((completedToday.length / habitsScheduledToday.length) * 100)
    : 0;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      {/* Today's Progress */}
      <Tooltip title={`${completedToday.length} of ${habitsScheduledToday.length} habits completed today`}>
        <Chip
          icon={<CheckIcon />}
          label={`${completedToday.length}/${habitsScheduledToday.length}`}
          color={completionRate === 100 ? 'success' : completionRate >= 50 ? 'warning' : 'default'}
          variant={completionRate > 0 ? 'filled' : 'outlined'}
          size="small"
        />
      </Tooltip>

      {/* Best Active Streak */}
      {longestCurrentStreak > 0 && (
        <Tooltip title={`Your longest active streak is ${longestCurrentStreak} days`}>
          <Chip
            icon={<FireIcon />}
            label={`${longestCurrentStreak} day${longestCurrentStreak !== 1 ? 's' : ''}`}
            color={longestCurrentStreak >= 7 ? 'error' : 'warning'}
            variant="filled"
            size="small"
            sx={{
              '& .MuiChip-icon': {
                animation: longestCurrentStreak >= 7 ? 'glow 2s ease-in-out infinite alternate' : 'none',
              },
              '@keyframes glow': {
                '0%': { filter: 'brightness(1)' },
                '100%': { filter: 'brightness(1.3)' },
              },
            }}
          />
        </Tooltip>
      )}

      {/* Active Streaks Count */}
      {activeStreaks > 1 && (
        <Tooltip title={`You have ${activeStreaks} active streaks going!`}>
          <Chip
            icon={<TrophyIcon />}
            label={`${activeStreaks} streaks`}
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Tooltip>
      )}

      {/* Completion Rate */}
      {completionRate === 100 && habitsScheduledToday.length > 0 && (
        <Tooltip title="Perfect day! All habits completed!">
          <Chip
            icon={<TrendingIcon />}
            label="PERFECT!"
            color="success"
            variant="filled"
            size="small"
            sx={{
              fontWeight: 'bold',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
};

export default QuickStats;
