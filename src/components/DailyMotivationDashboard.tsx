import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  CircularProgress,
  Avatar,
  Stack,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Whatshot as StreakIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Timeline as TimelineIcon,
  FlashOn as BoltIcon,
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

interface DailyMotivationDashboardProps {
  habits: Habit[];
}

const DailyMotivationDashboard: React.FC<DailyMotivationDashboardProps> = ({ habits }) => {
  const theme = useTheme();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDayOfWeek = new Date().getDay();

  // Calculate daily statistics
  const habitsScheduledToday = habits.filter(habit => 
    habit.scheduledDays.includes(todayDayOfWeek)
  );
  
  const completedToday = habitsScheduledToday.filter(habit => 
    habit.weeklyProgress[today] === true
  );

  const completionRate = habitsScheduledToday.length > 0 
    ? (completedToday.length / habitsScheduledToday.length) * 100 
    : 0;

  // Calculate streak statistics
  const totalCurrentStreak = habits.reduce((sum, habit) => sum + habit.currentStreak, 0);
  const longestCurrentStreak = Math.max(...habits.map(h => h.currentStreak), 0);
  const longestBestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
  const activeStreaks = habits.filter(h => h.currentStreak > 0).length;

  // Motivational messages based on performance
  const getMotivationalMessage = () => {
    if (completionRate === 100) {
      return {
        title: "🔥 PERFECT DAY! 🔥",
        message: "You're absolutely crushing it today! Every single habit completed!",
        color: 'success.main'
      };
    } else if (completionRate >= 80) {
      return {
        title: "🌟 AMAZING PROGRESS! 🌟",
        message: "You're so close to perfection! Keep pushing forward!",
        color: 'warning.main'
      };
    } else if (completionRate >= 50) {
      return {
        title: "💪 SOLID EFFORT! 💪",
        message: "Great work so far! You're more than halfway there!",
        color: 'info.main'
      };
    } else if (completionRate > 0) {
      return {
        title: "🚀 GOOD START! 🚀",
        message: "Every step counts! Keep building momentum!",
        color: 'primary.main'
      };
    } else {
      return {
        title: "✨ FRESH START! ✨",
        message: "Today is full of possibilities! Let's begin your journey!",
        color: 'text.secondary'
      };
    }
  };

  const motivation = getMotivationalMessage();

  // Get completion animation props
  const getCompletionProps = () => {
    if (completionRate === 100) {
      return {
        variant: 'determinate' as const,
        color: 'success' as const,
        sx: {
          height: 12,
          borderRadius: 6,
          background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.warning.main})`,
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            animation: 'glow 2s ease-in-out infinite alternate',
          },
          '@keyframes glow': {
            '0%': { filter: 'brightness(1)' },
            '100%': { filter: 'brightness(1.3)' },
          },
        }
      };
    }
    return {
      variant: 'determinate' as const,
      color: (completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'primary') as 'success' | 'warning' | 'primary',
      sx: { height: 12, borderRadius: 6 }
    };
  };

  const progressProps = getCompletionProps();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Main Motivation Card */}
      <Card 
        sx={{ 
          mb: 3, 
          background: completionRate === 100 
            ? `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.warning.main}15)`
            : 'background.paper',
          border: completionRate === 100 ? '2px solid' : '1px solid',
          borderColor: completionRate === 100 ? 'success.main' : 'divider',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header with motivation message */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 'bold', 
                color: motivation.color,
                mb: 1,
                textShadow: completionRate === 100 ? '0 0 10px rgba(255,215,0,0.3)' : 'none'
              }}
            >
              {motivation.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {motivation.message}
            </Typography>
          </Box>

          {/* Daily Progress Circle and Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 4 }}>
              <CircularProgress
                variant="determinate"
                value={completionRate}
                size={120}
                thickness={6}
                sx={{
                  color: completionRate === 100 ? 'success.main' : 
                         completionRate >= 80 ? 'warning.main' : 
                         completionRate >= 50 ? 'info.main' : 'primary.main',
                  filter: completionRate === 100 ? 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.4))' : 'none',
                }}
              />
              <Box sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: completionRate === 100 ? 'success.main' : 'text.primary'
                  }}
                >
                  {Math.round(completionRate)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete
                </Typography>
              </Box>
            </Box>

            {/* Today's Stats */}
            <Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="h6">
                    {completedToday.length} / {habitsScheduledToday.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Habits Today
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FireIcon color="error" />
                  <Typography variant="h6">
                    {longestCurrentStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Best Active Streak
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BoltIcon color="warning" />
                  <Typography variant="h6">
                    {activeStreaks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Streaks
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Today's Progress
            </Typography>
            <LinearProgress
              value={completionRate}
              {...progressProps}
            />
          </Box>

          {/* Completion Badges */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {completionRate === 100 && (
              <Chip
                icon={<TrophyIcon />}
                label="PERFECT DAY!"
                color="success"
                variant="filled"
                sx={{ 
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' },
                  }
                }}
              />
            )}
            {longestCurrentStreak >= 7 && (
              <Chip
                icon={<FireIcon />}
                label={`${longestCurrentStreak} Day Streak!`}
                color="error"
                variant="outlined"
              />
            )}
            {activeStreaks >= 3 && (
              <Chip
                icon={<StarIcon />}
                label={`${activeStreaks} Active Streaks`}
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Streak Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Total Streak Power */}
        <Paper 
          sx={{ 
            p: 2, 
            flex: '1 1 250px', 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.error.main}15, #ff980015)`,
            border: '1px solid',
            borderColor: 'error.main'
          }}
        >
          <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
            <StreakIcon />
          </Avatar>
          <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
            {totalCurrentStreak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Streak Power
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Combined days of all your streaks
          </Typography>
        </Paper>

        {/* Best Overall Streak */}
        <Paper 
          sx={{ 
            p: 2, 
            flex: '1 1 250px', 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.primary.main}15)`,
            border: '1px solid',
            borderColor: 'warning.main'
          }}
        >
          <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
            <TrophyIcon />
          </Avatar>
          <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
            {longestBestStreak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personal Best
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your longest streak achievement
          </Typography>
        </Paper>

        {/* Momentum Indicator */}
        <Paper 
          sx={{ 
            p: 2, 
            flex: '1 1 250px', 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.info.main}15)`,
            border: '1px solid',
            borderColor: 'success.main'
          }}
        >
          <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
            <TrendingUpIcon />
          </Avatar>
          <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
            {Math.round(completionRate)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily Momentum
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Today's completion rate
          </Typography>
        </Paper>
      </Box>

      {/* Quick Habit Status */}
      {habitsScheduledToday.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon />
              Today's Habits
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {habitsScheduledToday.map((habit) => (
                <Tooltip 
                  key={habit.id}
                  title={`${habit.name} - ${habit.weeklyProgress[today] ? 'Completed' : 'Pending'}`}
                >
                  <Chip
                    label={habit.name}
                    color={habit.weeklyProgress[today] ? 'success' : 'default'}
                    variant={habit.weeklyProgress[today] ? 'filled' : 'outlined'}
                    icon={habit.weeklyProgress[today] ? <CheckIcon /> : undefined}
                    sx={{
                      '& .MuiChip-label': {
                        textDecoration: habit.weeklyProgress[today] ? 'none' : 'none',
                        opacity: habit.weeklyProgress[today] ? 1 : 0.7,
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DailyMotivationDashboard;
