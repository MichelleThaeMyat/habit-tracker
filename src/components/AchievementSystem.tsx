import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Badge,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  FlashOn as LightningIcon,
  CheckCircle as CheckIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Diamond as DiamondIcon,
} from '@mui/icons-material';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'streak' | 'completion' | 'milestone' | 'social' | 'special';
  requirement: number;
  progress?: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

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

interface AchievementSystemProps {
  habits: Habit[];
  open: boolean;
  onClose: () => void;
  userProfile: {
    totalPoints: number;
    level: number;
    experiencePoints: number;
    experienceToNextLevel: number;
  };
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Streak Achievements
  {
    id: 'first_streak',
    title: 'Getting Started',
    description: 'Complete a habit for 3 days in a row',
    icon: <FireIcon />,
    type: 'streak',
    requirement: 3,
    rarity: 'common',
    points: 10,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: <StarIcon />,
    type: 'streak',
    requirement: 7,
    rarity: 'common',
    points: 25,
  },
  {
    id: 'habit_master',
    title: 'Habit Master',
    description: 'Achieve a 30-day streak',
    icon: <TrophyIcon />,
    type: 'streak',
    requirement: 30,
    rarity: 'rare',
    points: 100,
  },
  {
    id: 'legendary_streak',
    title: 'Legendary Streak',
    description: 'Maintain a 100-day streak',
    icon: <DiamondIcon />,
    type: 'streak',
    requirement: 100,
    rarity: 'legendary',
    points: 500,
  },
  
  // Completion Achievements
  {
    id: 'first_habit',
    title: 'First Steps',
    description: 'Complete your first habit',
    icon: <CheckIcon />,
    type: 'completion',
    requirement: 1,
    rarity: 'common',
    points: 5,
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 habits total',
    icon: <LightningIcon />,
    type: 'completion',
    requirement: 100,
    rarity: 'rare',
    points: 150,
  },
  {
    id: 'thousand_completions',
    title: 'Habit Virtuoso',
    description: 'Complete 1000 habits total',
    icon: <DiamondIcon />,
    type: 'completion',
    requirement: 1000,
    rarity: 'legendary',
    points: 1000,
  },
  
  // Milestone Achievements
  {
    id: 'habit_collector',
    title: 'Habit Collector',
    description: 'Create 5 different habits',
    icon: <TimelineIcon />,
    type: 'milestone',
    requirement: 5,
    rarity: 'common',
    points: 20,
  },
  {
    id: 'category_master',
    title: 'Category Master',
    description: 'Create habits in 5 different categories',
    icon: <StarIcon />,
    type: 'milestone',
    requirement: 5,
    rarity: 'rare',
    points: 75,
  },
  
  // Social Achievements
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share your first achievement',
    icon: <GroupIcon />,
    type: 'social',
    requirement: 1,
    rarity: 'common',
    points: 15,
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return '#9e9e9e';
    case 'rare': return '#2196f3';
    case 'epic': return '#9c27b0';
    case 'legendary': return '#ff9800';
    default: return '#9e9e9e';
  }
};

const calculateUserProgress = (habits: Habit[]) => {
  const totalCompletions = habits.reduce((sum, habit) => {
    return sum + Object.values(habit.weeklyProgress).filter(Boolean).length;
  }, 0);
  
  const maxStreak = Math.max(...habits.map(h => h.bestStreak), 0);
  const uniqueCategories = new Set(habits.map(h => h.category)).size;
  
  return {
    totalCompletions,
    maxStreak,
    totalHabits: habits.length,
    uniqueCategories,
  };
};

const checkAchievements = (habits: Habit[], savedAchievements: Achievement[]): Achievement[] => {
  const progress = calculateUserProgress(habits);
  
  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const existing = savedAchievements.find(a => a.id === def.id);
    let currentProgress = 0;
    let unlocked = existing?.unlocked || false;
    
    switch (def.type) {
      case 'streak':
        currentProgress = progress.maxStreak;
        break;
      case 'completion':
        currentProgress = progress.totalCompletions;
        break;
      case 'milestone':
        if (def.id === 'habit_collector') {
          currentProgress = progress.totalHabits;
        } else if (def.id === 'category_master') {
          currentProgress = progress.uniqueCategories;
        }
        break;
      case 'social':
        currentProgress = existing?.progress || 0;
        break;
    }
    
    if (!unlocked && currentProgress >= def.requirement) {
      unlocked = true;
    }
    
    return {
      ...def,
      progress: currentProgress,
      unlocked,
      unlockedAt: unlocked && !existing?.unlocked ? new Date() : existing?.unlockedAt,
    };
  });
};

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  habits,
  open,
  onClose,
  userProfile,
}) => {
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = React.useState<Achievement[]>([]);
  const [isSharing, setIsSharing] = React.useState(false);

  React.useEffect(() => {
    const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const updatedAchievements = checkAchievements(habits, savedAchievements);
    
    // Check for newly unlocked achievements
    const newUnlocked = updatedAchievements.filter(achievement => 
      achievement.unlocked && 
      !savedAchievements.find((saved: Achievement) => saved.id === achievement.id && saved.unlocked)
    );
    
    if (newUnlocked.length > 0) {
      setNewlyUnlocked(newUnlocked);
    }
    
    setAchievements(updatedAchievements);
    localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
  }, [habits]);

  const shareAchievement = async (achievement: Achievement) => {
    if (isSharing) {
      return; // Prevent multiple simultaneous shares
    }

    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: `Achievement Unlocked: ${achievement.title}`,
          text: `I just unlocked "${achievement.title}" in my habit tracker! ${achievement.description}`,
          url: window.location.href,
        });
      } catch (error) {
        // Check if the error is due to user cancellation
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('canceled'))) {
          // User cancelled the share, don't show an error message
          console.log('Share cancelled by user');
          return;
        }
        // For other errors, fall back to clipboard
        console.warn('Share failed, falling back to clipboard:', error);
        try {
          await navigator.clipboard.writeText(`🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nCheck out my habit tracking progress!`);
          alert('Achievement copied to clipboard!');
        } catch (clipboardError) {
          console.warn('Clipboard write failed:', clipboardError);
          alert('Unable to share or copy achievement');
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fallback to clipboard for browsers that don't support Web Share API
      try {
        const text = `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nCheck out my habit tracking progress!`;
        await navigator.clipboard.writeText(text);
        alert('Achievement copied to clipboard!');
      } catch (error) {
        console.warn('Clipboard write failed:', error);
        alert('Unable to copy achievement to clipboard');
      }
    }
    
    // Mark social achievement as progressed
    const socialAchievement = achievements.find(a => a.id === 'social_butterfly');
    if (socialAchievement && !socialAchievement.unlocked) {
      const updatedAchievements = achievements.map(a => 
        a.id === 'social_butterfly' 
          ? { ...a, progress: 1, unlocked: true, unlockedAt: new Date() }
          : a
      );
      setAchievements(updatedAchievements);
      localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon color="primary" />
          <Typography variant="h6">Achievements</Typography>
          <Chip 
            label={`${unlockedAchievements.length}/${achievements.length}`} 
            color="primary" 
            size="small" 
          />
        </DialogTitle>
        <DialogContent>
          {/* User Level Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <Typography variant="h6">
                    {userProfile.level}
                  </Typography>
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">
                    Level {userProfile.level}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userProfile.totalPoints} points earned
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(userProfile.experiencePoints / userProfile.experienceToNextLevel) * 100}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {userProfile.experiencePoints}/{userProfile.experienceToNextLevel} XP to next level
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Unlocked Achievements */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon /> Unlocked ({unlockedAchievements.length})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
            {unlockedAchievements.map((achievement) => (
              <Card key={achievement.id} sx={{ border: `2px solid ${getRarityColor(achievement.rarity)}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Badge 
                      badgeContent={<CheckIcon sx={{ fontSize: 12 }} />} 
                      color="success"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: getRarityColor(achievement.rarity) }}>
                        {achievement.icon}
                      </Avatar>
                    </Badge>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{achievement.title}</Typography>
                      <Chip 
                        label={achievement.rarity} 
                        size="small" 
                        sx={{ bgcolor: getRarityColor(achievement.rarity), color: 'white' }}
                      />
                    </Box>
                    <Typography variant="h6" color="primary">
                      +{achievement.points}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.description}
                  </Typography>
                  {achievement.unlockedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => shareAchievement(achievement)}>
                    Share
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>

          {/* Locked Achievements */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🔒 In Progress ({lockedAchievements.length})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {lockedAchievements.map((achievement) => (
              <Card key={achievement.id} sx={{ opacity: 0.7 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'grey.400' }}>
                      {achievement.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{achievement.title}</Typography>
                      <Chip label={achievement.rarity} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      +{achievement.points}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.description}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((achievement.progress || 0) / achievement.requirement * 100, 100)}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {achievement.progress || 0}/{achievement.requirement}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Achievement Notification */}
      {newlyUnlocked.length > 0 && (
        <Dialog 
          open={true} 
          onClose={() => setNewlyUnlocked([])}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            🎉 Achievement Unlocked!
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
            {newlyUnlocked.map((achievement, index) => (
              <Box key={achievement.id} sx={{ mb: index < newlyUnlocked.length - 1 ? 2 : 0 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getRarityColor(achievement.rarity), 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2 
                  }}
                >
                  {achievement.icon}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {achievement.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {achievement.description}
                </Typography>
                <Chip 
                  label={`+${achievement.points} points`} 
                  color="success" 
                  sx={{ mt: 1 }}
                />
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button onClick={() => setNewlyUnlocked([])} variant="contained">
              Awesome!
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default AchievementSystem;
