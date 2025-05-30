import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

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

interface StreakIndicatorProps {
  habit: Habit;
  compact?: boolean;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ habit, compact = true }) => {
  const { currentStreak, bestStreak } = habit;

  // Determine streak status and styling
  const getStreakStatus = () => {
    if (currentStreak === 0) {
      return {
        icon: <StarIcon />,
        label: 'Start',
        color: 'default' as const,
        tooltip: 'Ready to start your streak!'
      };
    } else if (currentStreak >= 30) {
      return {
        icon: <TrophyIcon />,
        label: `${currentStreak}🔥`,
        color: 'error' as const,
        tooltip: `Amazing ${currentStreak}-day streak! You're legendary!`
      };
    } else if (currentStreak >= 7) {
      return {
        icon: <FireIcon />,
        label: `${currentStreak}🔥`,
        color: 'warning' as const,
        tooltip: `Great ${currentStreak}-day streak! Keep it burning!`
      };
    } else if (currentStreak >= 3) {
      return {
        icon: <FireIcon />,
        label: `${currentStreak}`,
        color: 'success' as const,
        tooltip: `Nice ${currentStreak}-day streak! Building momentum!`
      };
    } else {
      return {
        icon: <FireIcon />,
        label: `${currentStreak}`,
        color: 'primary' as const,
        tooltip: `${currentStreak}-day streak! Keep going!`
      };
    }
  };

  const status = getStreakStatus();

  if (compact) {
    return (
      <Tooltip title={status.tooltip}>
        <Chip
          icon={status.icon}
          label={status.label}
          size="small"
          color={status.color}
          variant={currentStreak > 0 ? 'filled' : 'outlined'}
          sx={{
            '& .MuiChip-icon': {
              color: currentStreak >= 7 ? '#ff6b35' : 'inherit',
              animation: currentStreak >= 7 ? 'flicker 1.5s infinite alternate' : 'none',
            },
            '@keyframes flicker': {
              '0%': { opacity: 1 },
              '100%': { opacity: 0.7 },
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <Chip
        icon={status.icon}
        label={`${currentStreak} Day Streak`}
        color={status.color}
        variant={currentStreak > 0 ? 'filled' : 'outlined'}
        sx={{
          '& .MuiChip-icon': {
            color: currentStreak >= 7 ? '#ff6b35' : 'inherit',
            animation: currentStreak >= 7 ? 'flicker 1.5s infinite alternate' : 'none',
          },
          '@keyframes flicker': {
            '0%': { opacity: 1 },
            '100%': { opacity: 0.7 },
          },
        }}
      />
      
      {bestStreak > currentStreak && (
        <Typography variant="caption" color="text.secondary">
          (Best: {bestStreak})
        </Typography>
      )}
      
      {currentStreak >= 3 && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>
          🔥 On Fire!
        </Typography>
      )}
    </Box>
  );
};

export default StreakIndicator;
