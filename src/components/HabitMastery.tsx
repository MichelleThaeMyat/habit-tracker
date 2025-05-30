import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  Diamond as DiamondIcon,
  AutoAwesome as MagicIcon,
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

interface HabitMasteryProps {
  habit: Habit;
  compact?: boolean;
}

const getMasteryLevel = (completions: number, streak: number) => {
  const totalScore = completions + (streak * 2); // Streaks are worth more
  
  if (totalScore >= 200) return { level: 'Legendary', icon: <DiamondIcon />, color: '#ff9800' };
  if (totalScore >= 100) return { level: 'Expert', icon: <TrophyIcon />, color: '#9c27b0' };
  if (totalScore >= 50) return { level: 'Advanced', icon: <StarIcon />, color: '#2196f3' };
  if (totalScore >= 20) return { level: 'Proficient', icon: <FireIcon />, color: '#4caf50' };
  if (totalScore >= 5) return { level: 'Beginner', icon: <MagicIcon />, color: '#ff5722' };
  return { level: 'Novice', icon: <StarIcon />, color: '#9e9e9e' };
};

const getMasteryProgress = (completions: number, streak: number) => {
  const totalScore = completions + (streak * 2);
  
  if (totalScore >= 200) return { current: totalScore, next: 200, progress: 100 };
  if (totalScore >= 100) return { current: totalScore, next: 200, progress: ((totalScore - 100) / 100) * 100 };
  if (totalScore >= 50) return { current: totalScore, next: 100, progress: ((totalScore - 50) / 50) * 100 };
  if (totalScore >= 20) return { current: totalScore, next: 50, progress: ((totalScore - 20) / 30) * 100 };
  if (totalScore >= 5) return { current: totalScore, next: 20, progress: ((totalScore - 5) / 15) * 100 };
  return { current: totalScore, next: 5, progress: (totalScore / 5) * 100 };
};

const HabitMastery: React.FC<HabitMasteryProps> = ({ habit, compact = false }) => {
  const completions = Object.values(habit.weeklyProgress).filter(Boolean).length;
  const mastery = getMasteryLevel(completions, habit.bestStreak);
  const progress = getMasteryProgress(completions, habit.bestStreak);
  
  if (compact) {
    return (
      <Tooltip 
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Mastery Level: {mastery.level}
            </Typography>
            <Typography variant="caption">
              {completions} completions • {habit.bestStreak} best streak
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Progress: {progress.current}/{progress.next} points
            </Typography>
          </Box>
        }
      >
        <Chip 
          icon={mastery.icon}
          label={mastery.level}
          size="small"
          sx={{ 
            bgcolor: mastery.color, 
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Chip 
          icon={mastery.icon}
          label={`${mastery.level} Mastery`}
          sx={{ 
            bgcolor: mastery.color, 
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {progress.current}/{progress.next} points
        </Typography>
      </Box>
      
      {mastery.level !== 'Legendary' && (
        <LinearProgress 
          variant="determinate" 
          value={Math.min(progress.progress, 100)}
          sx={{ 
            height: 6,
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: mastery.color,
            }
          }}
        />
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {completions} completions
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {habit.bestStreak} best streak
        </Typography>
      </Box>
    </Box>
  );
};

export default HabitMastery;
