import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';

interface MotivationalNotificationProps {
  open: boolean;
  onClose: () => void;
  habitName: string;
  currentStreak: number;
  completionCount: number;
  isNewRecord?: boolean;
}

const MotivationalNotification: React.FC<MotivationalNotificationProps> = ({
  open,
  onClose,
  habitName,
  currentStreak,
  completionCount,
  isNewRecord = false
}) => {
  const [severity, setSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState<React.ReactNode>(<StarIcon />);

  useEffect(() => {
    if (open) {
      const motivationalMessage = getMotivationalMessage();
      setMessage(motivationalMessage.message);
      setSeverity(motivationalMessage.severity);
      setIcon(motivationalMessage.icon);
    }
  }, [open, currentStreak, completionCount, isNewRecord, habitName]);

  const getMotivationalMessage = () => {
    // Special messages for milestones
    if (isNewRecord) {
      return {
        message: `🎉 NEW RECORD! ${currentStreak} days on "${habitName}"! You're unstoppable! 🎉`,
        severity: 'warning' as const,
        icon: <TrophyIcon />
      };
    }

    if (currentStreak >= 100) {
      return {
        message: `🔥 LEGENDARY! ${currentStreak} days of "${habitName}"! You're a habit deity! 🔥`,
        severity: 'error' as const,
        icon: <CelebrationIcon />
      };
    }

    if (currentStreak >= 30) {
      return {
        message: `🏆 AMAZING! ${currentStreak} days of "${habitName}"! You're on fire! 🏆`,
        severity: 'warning' as const,
        icon: <TrophyIcon />
      };
    }

    if (currentStreak >= 7) {
      return {
        message: `🔥 Week streak! ${currentStreak} days of "${habitName}"! Keep it burning! 🔥`,
        severity: 'warning' as const,
        icon: <FireIcon />
      };
    }

    if (currentStreak >= 3) {
      return {
        message: `🌟 ${currentStreak} days of "${habitName}"! Building great momentum! 🌟`,
        severity: 'success' as const,
        icon: <StarIcon />
      };
    }

    if (currentStreak === 1) {
      return {
        message: `✨ Great start with "${habitName}"! First step toward success! ✨`,
        severity: 'info' as const,
        icon: <StarIcon />
      };
    }

    // Encouraging messages for completion milestones
    if (completionCount % 50 === 0 && completionCount > 0) {
      return {
        message: `🎯 ${completionCount} completions of "${habitName}"! You're dedication is inspiring! 🎯`,
        severity: 'success' as const,
        icon: <TrophyIcon />
      };
    }

    if (completionCount % 10 === 0 && completionCount > 0) {
      return {
        message: `🎉 ${completionCount} times you've done "${habitName}"! Consistency pays off! 🎉`,
        severity: 'success' as const,
        icon: <StarIcon />
      };
    }

    // Default completion message
    const encouragingMessages = [
      `💪 "${habitName}" done! Every habit counts toward your success!`,
      `⭐ Another step forward with "${habitName}"! Keep building momentum!`,
      `🚀 "${habitName}" completed! You're creating positive change!`,
      `🌟 Nice work on "${habitName}"! Small steps lead to big results!`,
      `🎯 "${habitName}" checked off! Consistency is your superpower!`,
    ];

    return {
      message: encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)],
      severity: 'success' as const,
      icon: <StarIcon />
    };
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          minWidth: 350,
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {icon}
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {message}
          </Typography>
          {currentStreak > 0 && (
            <Chip
              icon={<FireIcon />}
              label={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`}
              size="small"
              color={currentStreak >= 7 ? 'warning' : 'default'}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default MotivationalNotification;
