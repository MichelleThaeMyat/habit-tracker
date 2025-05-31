import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import HabitTemplatesDialog from './HabitTemplatesDialogEnhanced';
import AchievementSystem from './AchievementSystem';
import SocialFeatures from './SocialFeatures';
import DataManagement from './DataManagement';
import SmartReminders from './SmartReminders';
import HabitMastery from './HabitMastery';
import DailyMotivationDashboard from './DailyMotivationDashboard';
import StreakIndicator from './StreakIndicator';
import QuickStats from './QuickStats';
import MotivationalNotification from './MotivationalNotification';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Star as StarIcon, Schedule as ScheduleIcon, LibraryBooks as TemplatesIcon, EmojiEvents as TrophyIcon, Group as GroupIcon, Storage as StorageIcon, Notifications as NotificationsIcon, Psychology as PsychologyIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  calculateHabitPriority, 
  sortHabitsByPriority, 
  getTopPriorityHabits, 
  generateHabitInsights,
  type HabitContext,
  type HabitPriorityScore 
} from '../utils/habitPrioritization';

const HABIT_CATEGORIES = [
  'General', 'Health & Fitness', 'Productivity', 'Personal Development', 
  'Relationships', 'Finance', 'Hobbies', 'Mindfulness', 'Learning'
];

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'success';
    case 'hard': return 'error';
    default: return 'warning';
  }
};

const getCategoryColor = (category: string) => {
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
  const index = category.length % colors.length;
  return colors[index];
};

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
  scheduledDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  notes: string;
  description: string;
}

const HabitList: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const rawHabits = JSON.parse(savedHabits);
        if (!Array.isArray(rawHabits)) {
          throw new Error('Saved habits data is not an array');
        }
        const parsedHabits = rawHabits.map((habit: any) => {
          if (!habit || typeof habit !== 'object') {
            throw new Error('Invalid habit data structure');
          }
          const createdAtDate = new Date(habit.createdAt);
          if (isNaN(createdAtDate.getTime())) {
            throw new Error('Invalid date format in habit data');
          }
          
          // Check if habit is completed today (daily reset functionality)
          const today = format(new Date(), 'yyyy-MM-dd');
          const isCompletedToday = habit.weeklyProgress?.[today] || false;
          
          return {
            id: habit.id || String(Date.now()),
            name: habit.name || '',
            completed: isCompletedToday, // Set based on today's completion, not persistent status
            createdAt: createdAtDate,
            weeklyProgress: habit.weeklyProgress || {},
            currentStreak: Number(habit.currentStreak) || 0,
            bestStreak: Number(habit.bestStreak) || 0,
            category: habit.category || 'General',
            difficulty: habit.difficulty || 'medium',
            scheduledDays: habit.scheduledDays || [1, 2, 3, 4, 5, 6, 0], // Default to all days
            notes: habit.notes || '',
            description: habit.description || ''
          };
        });
        setHabits(parsedHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('habits');
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Daily reset effect - checks every minute for date changes
  useEffect(() => {
    const checkForDateChange = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastCheckedDate = localStorage.getItem('lastCheckedDate');
      
      if (lastCheckedDate !== today) {
        // Date has changed, update all habits' completion status
        setHabits(prevHabits => {
          const updatedHabits = prevHabits.map(habit => ({
            ...habit,
            completed: habit.weeklyProgress?.[today] || false
          }));
          localStorage.setItem('habits', JSON.stringify(updatedHabits));
          return updatedHabits;
        });
        
        // Update the last checked date
        localStorage.setItem('lastCheckedDate', today);
      }
    };

    // Check immediately
    checkForDateChange();
    
    // Set up interval to check every minute
    const intervalId = setInterval(checkForDateChange, 60000);
    
    return () => clearInterval(intervalId);
  }, [habits]);
  const [open, setOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('General');
  const [habitDifficulty, setHabitDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [habitScheduledDays, setHabitScheduledDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [habitNotes, setHabitNotes] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'streak' | 'difficulty' | 'priority'>('created');
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [socialFeaturesOpen, setSocialFeaturesOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  
  // AI Prioritization state
  const [aiPrioritizationEnabled, setAiPrioritizationEnabled] = useState(() => {
    const saved = localStorage.getItem('aiPrioritizationEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [priorityInsights, setPriorityInsights] = useState<string[]>([]);
  const [topPriorityHabits, setTopPriorityHabits] = useState<HabitPriorityScore[]>([]);
  
  // Motivational notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    habitName: string;
    currentStreak: number;
    completionCount: number;
    isNewRecord: boolean;
  } | null>(null);

  // Calculate user profile for achievements
  const calculateUserProfile = () => {
    const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const totalPoints = savedAchievements.reduce((sum: number, achievement: any) => 
      achievement.unlocked ? sum + achievement.points : sum, 0
    );
    
    // Level calculation: every 100 points = 1 level
    const level = Math.floor(totalPoints / 100) + 1;
    const experiencePoints = totalPoints % 100;
    const experienceToNextLevel = 100;
    
    return {
      totalPoints,
      level,
      experiencePoints,
      experienceToNextLevel,
    };
  };

  const userProfile = calculateUserProfile();

  // Effect to update AI prioritization when enabled/disabled
  useEffect(() => {
    localStorage.setItem('aiPrioritizationEnabled', JSON.stringify(aiPrioritizationEnabled));
    
    if (aiPrioritizationEnabled && habits.length > 0) {
      // Convert habits to HabitContext format
      const habitContexts: HabitContext[] = habits.map(habit => ({
        name: habit.name,
        description: habit.description,
        category: habit.category,
        difficulty: habit.difficulty,
        currentStreak: habit.currentStreak,
        bestStreak: habit.bestStreak,
        scheduledDays: habit.scheduledDays,
        completed: habit.completed,
        weeklyProgress: habit.weeklyProgress
      }));
      
      // Generate insights and priority recommendations
      const insights = generateHabitInsights(habitContexts);
      setPriorityInsights(insights);
      
      const topPriorities = getTopPriorityHabits(habitContexts, 3);
      setTopPriorityHabits(topPriorities);
    } else {
      setPriorityInsights([]);
      setTopPriorityHabits([]);
    }
  }, [aiPrioritizationEnabled, habits]);

  // Toggle AI prioritization
  const handleToggleAiPrioritization = () => {
    setAiPrioritizationEnabled(!aiPrioritizationEnabled);
  };

  const handleOpenDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitName(habit.name);
      setHabitCategory(habit.category);
      setHabitDifficulty(habit.difficulty);
      setHabitScheduledDays(habit.scheduledDays);
      setHabitNotes(habit.notes);
      setHabitDescription(habit.description);
    } else {
      setEditingHabit(null);
      setHabitName('');
      setHabitCategory('General');
      setHabitDifficulty('medium');
      setHabitScheduledDays([1, 2, 3, 4, 5, 6, 0]);
      setHabitNotes('');
      setHabitDescription('');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingHabit(null);
    setHabitName('');
    setHabitCategory('General');
    setHabitDifficulty('medium');
    setHabitScheduledDays([1, 2, 3, 4, 5, 6, 0]);
    setHabitNotes('');
    setHabitDescription('');
  };

  const handleSaveHabit = () => {
    if (habitName.trim()) {
      setHabits(prevHabits => {
        let newHabits;
        if (editingHabit) {
          // Edit existing habit
          newHabits = prevHabits.map(habit =>
            habit.id === editingHabit.id
              ? { 
                  ...habit, 
                  name: habitName.trim(),
                  category: habitCategory,
                  difficulty: habitDifficulty,
                  scheduledDays: habitScheduledDays,
                  notes: habitNotes,
                  description: habitDescription
                }
              : habit
          );
        } else {
          // Add new habit
          const newHabit: Habit = {
            id: Date.now().toString(),
            name: habitName.trim(),
            completed: false,
            createdAt: new Date(),
            weeklyProgress: {},
            currentStreak: 0,
            bestStreak: 0,
            category: habitCategory,
            difficulty: habitDifficulty,
            scheduledDays: habitScheduledDays,
            notes: habitNotes,
            description: habitDescription
          };
          newHabits = [...prevHabits, newHabit];
        }
        localStorage.setItem('habits', JSON.stringify(newHabits));
          return newHabits;
        });
      handleCloseDialog();
    }
  };

  const toggleHabitCompletion = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setHabits(prevHabits => {
      const updatedHabits = prevHabits.map(habit => {
        if (habit.id === id) {
          // Update weekly progress for today
          const updatedWeeklyProgress = { ...habit.weeklyProgress };
          const isCurrentlyCompletedToday = updatedWeeklyProgress[today] || false;
          const isNowCompleted = !isCurrentlyCompletedToday;
          
          // Update today's completion status
          updatedWeeklyProgress[today] = isNowCompleted;
          
          // Calculate current streak based on consecutive completed days
          let currentStreak = 0;
          if (isNowCompleted) {
            // Count consecutive days backward from today
            let checkDate = new Date();
            while (true) {
              const checkDateStr = format(checkDate, 'yyyy-MM-dd');
              const dayOfWeek = checkDate.getDay();
              
              // Only count days this habit is scheduled for
              if (habit.scheduledDays.includes(dayOfWeek) && updatedWeeklyProgress[checkDateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else if (habit.scheduledDays.includes(dayOfWeek)) {
                // If it's a scheduled day but not completed, break the streak
                break;
              } else {
                // If it's not a scheduled day, skip to the previous day
                checkDate.setDate(checkDate.getDate() - 1);
              }
              
              // Stop if we've gone back too far (prevent infinite loop)
              if (currentStreak > 365) break;
            }
          }
          
          // Update best streak if current streak is higher
          const bestStreak = Math.max(habit.bestStreak, currentStreak);
          
          // Trigger motivational notification for habit completion
          if (isNowCompleted) {
            const completionCount = Object.values(updatedWeeklyProgress).filter(Boolean).length;
            const isNewRecord = currentStreak > habit.bestStreak;
            
            setNotificationData({
              habitName: habit.name,
              currentStreak,
              completionCount,
              isNewRecord
            });
            setNotificationOpen(true);
          }
          
          return {
            ...habit,
            completed: isNowCompleted, // This now represents today's completion status
            weeklyProgress: updatedWeeklyProgress,
            currentStreak,
            bestStreak
          };
        }
        return habit;
      });
      
      // Check for habit chains - handle when a habit is completed
      if (updatedHabits.find(h => h.id === id)?.completed) {
        // Get any habit chains where this habit is the trigger
        const savedChains = localStorage.getItem('habitChains');
        if (savedChains) {
          try {
            const chains = JSON.parse(savedChains);
            chains.forEach((chain: any) => {
              if (chain.triggerHabitId === id) {
                // Notify about the unlocked habit
                if ('Notification' in window && Notification.permission === 'granted') {
                  const targetHabit = updatedHabits.find(h => h.id === chain.targetHabitId);
                  if (targetHabit) {
                    new Notification('Habit Unlocked!', {
                      body: `You completed "${chain.triggerHabitName}" and unlocked "${targetHabit.name}"!`,
                      icon: '/logo192.png'
                    });
                  }
                }
              }
            });
          } catch (error) {
            console.error('Error processing habit chains:', error);
          }
        }
      }
      
      localStorage.setItem('habits', JSON.stringify(updatedHabits));
      return updatedHabits;
    });
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prevHabits => {
      const newHabits = prevHabits.filter(habit => habit.id !== id);
      localStorage.setItem('habits', JSON.stringify(newHabits));
      return newHabits;
    });
  };

  const handleSelectTemplate = (template: any) => {
    setHabitName(template.name);
    setHabitCategory(template.category);
    setHabitDifficulty(template.difficulty);
    setHabitScheduledDays(template.scheduledDays);
    setHabitNotes(template.notes);
    setHabitDescription(template.description);
    setTemplatesOpen(false);
    setOpen(true);
  };

  // Filter and sort habits
  const filteredAndSortedHabits = habits
    .filter(habit => filterCategory === 'All' || habit.category === filterCategory)
    .sort((a, b) => {
      // If AI prioritization is enabled and sorting by priority, use AI sorting
      if (aiPrioritizationEnabled && sortBy === 'priority') {
        const habitContexts: HabitContext[] = [a, b].map(habit => ({
          name: habit.name,
          description: habit.description,
          category: habit.category,
          difficulty: habit.difficulty,
          currentStreak: habit.currentStreak,
          bestStreak: habit.bestStreak,
          scheduledDays: habit.scheduledDays,
          completed: habit.completed,
          weeklyProgress: habit.weeklyProgress
        }));
        
        const priorityA = calculateHabitPriority(habitContexts[0]);
        const priorityB = calculateHabitPriority(habitContexts[1]);
        return priorityB.priorityScore - priorityA.priorityScore;
      }
      
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'streak':
          return b.currentStreak - a.currentStreak;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        default:
          return 0;
      }
    });

  // Process reminders and notifications
  useEffect(() => {
    // Check if browser notifications are supported and enabled
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    // Load reminder settings
    const reminderSettings = localStorage.getItem('reminderSettings');
    let browserNotificationsEnabled = false;
    
    if (reminderSettings) {
      try {
        const settings = JSON.parse(reminderSettings);
        browserNotificationsEnabled = settings.browserNotifications || false;
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      }
    }
    
    if (!browserNotificationsEnabled) {
      return;
    }
    
    // Load reminders
    const savedReminders = localStorage.getItem('reminders');
    if (!savedReminders) {
      return;
    }
    
    try {
      const reminders = JSON.parse(savedReminders);
      
      // Set up notification checking interval (every minute)
      const checkInterval = setInterval(() => {
        const now = new Date();
        const currentDay = now.getDay(); // 0-6, Sunday is 0
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        
        reminders.forEach((reminder: any) => {
          if (!reminder.active || reminder.type !== 'browser') {
            return;
          }
          
          // Check if reminder is scheduled for current day
          if (!reminder.days.includes(currentDay)) {
            return;
          }
          
          // Check if it's time for the reminder
          if (reminder.time === currentTime) {
            const habit = habits.find(h => h.id === reminder.habitId);
            
            if (habit && !habit.completed) {
              const message = reminder.message || `Time to complete your habit: ${habit.name}`;
              
              new Notification('Habit Reminder', {
                body: message,
                icon: '/logo192.png'
              });
            }
          }
        });
      }, 60000); // Check every minute
      
      return () => clearInterval(checkInterval);
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }, [habits]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 8 }}>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Your Habits
              </Typography>
              <QuickStats habits={habits} />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 2 }}
              >
                New Habit
              </Button>
              <Button
                variant="outlined"
                startIcon={<TemplatesIcon />}
                onClick={() => setTemplatesOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Templates
              </Button>
              <Tooltip title="Achievements">
                <Button
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    border: userProfile.level > 1 ? '2px solid gold' : undefined,
                    color: userProfile.level > 1 ? 'warning.main' : undefined
                  }}
                  onClick={() => setAchievementsOpen(true)}
                >
                  <TrophyIcon />
                  <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                    {userProfile.level}
                  </Box>
                </Button>
              </Tooltip>
              <Tooltip title="Social Features">
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                  onClick={() => setSocialFeaturesOpen(true)}
                >
                  <GroupIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Data Management">
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                  onClick={() => setDataManagementOpen(true)}
                >
                  <StorageIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Smart Reminders">
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                  onClick={() => setRemindersOpen(true)}
                >
                  <NotificationsIcon />
                </Button>
              </Tooltip>
              <Tooltip title={aiPrioritizationEnabled ? "Disable AI Prioritization" : "Enable AI Prioritization"}>
                <Button
                  variant={aiPrioritizationEnabled ? "contained" : "outlined"}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: aiPrioritizationEnabled ? 'primary.main' : 'transparent',
                    color: aiPrioritizationEnabled ? 'primary.contrastText' : 'primary.main'
                  }}
                  onClick={handleToggleAiPrioritization}
                >
                  <PsychologyIcon />
                  <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                    AI
                  </Box>
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Daily Motivation Dashboard */}
          <DailyMotivationDashboard habits={habits} />

          {/* AI Prioritization Insights */}
          {aiPrioritizationEnabled && (
            <Box sx={{ mb: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PsychologyIcon color="primary" />
                <Typography variant="h6" component="h3">
                  AI-Powered Insights
                </Typography>
              </Box>
              
              {priorityInsights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Personal Insights:
                  </Typography>
                  {priorityInsights.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                      {insight}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {topPriorityHabits.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon fontSize="small" />
                    Recommended Priority Order:
                  </Typography>
                  {topPriorityHabits.map((priority, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2, 
                      mb: 1, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      border: priority.urgencyLevel === 'high' ? '2px solid' : '1px solid',
                      borderColor: priority.urgencyLevel === 'high' ? 'error.main' : 
                                  priority.urgencyLevel === 'medium' ? 'warning.main' : 'success.main'
                    }}>
                      <Box sx={{ 
                        minWidth: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: priority.urgencyLevel === 'high' ? 'error.main' : 
                                priority.urgencyLevel === 'medium' ? 'warning.main' : 'success.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {priority.habitId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Score: {priority.priorityScore} • {priority.reason}
                        </Typography>
                        {priority.suggestions.length > 0 && (
                          <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
                            💡 {priority.suggestions[0]}
                          </Typography>
                        )}
                      </Box>
                      <Chip 
                        size="small" 
                        label={priority.urgencyLevel.toUpperCase()} 
                        color={priority.urgencyLevel === 'high' ? 'error' : 
                              priority.urgencyLevel === 'medium' ? 'warning' : 'success'}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Filter and Sort Controls */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {HABIT_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'streak' | 'difficulty' | 'priority')}
              >
                <MenuItem value="created">Created Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="streak">Current Streak</MenuItem>
                <MenuItem value="difficulty">Difficulty</MenuItem>
                {aiPrioritizationEnabled && (
                  <MenuItem value="priority">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PsychologyIcon fontSize="small" />
                      AI Priority
                    </Box>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary">
              {filteredAndSortedHabits.length} habit{filteredAndSortedHabits.length !== 1 ? 's' : ''}
              {filterCategory !== 'All' && ` in ${filterCategory}`}
            </Typography>
          </Box>

          <List>
            {filteredAndSortedHabits.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {habits.length === 0 
                    ? "No habits yet! Create your first habit to get started." 
                    : `No habits found in ${filterCategory === 'All' ? 'any category' : filterCategory}.`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {habits.length === 0 
                    ? "Start building positive habits today!"
                    : "Try changing your filter or create a new habit."
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Your First Habit
                </Button>
              </Box>
            ) : (
              filteredAndSortedHabits.map((habit) => {
              const todayDayOfWeek = new Date().getDay();
              const isScheduledToday = habit.scheduledDays.includes(todayDayOfWeek);
              
              // Calculate AI priority if enabled
              let aiPriority: HabitPriorityScore | null = null;
              if (aiPrioritizationEnabled) {
                const habitContext: HabitContext = {
                  name: habit.name,
                  description: habit.description,
                  category: habit.category,
                  difficulty: habit.difficulty,
                  currentStreak: habit.currentStreak,
                  bestStreak: habit.bestStreak,
                  scheduledDays: habit.scheduledDays,
                  completed: habit.completed,
                  weeklyProgress: habit.weeklyProgress
                };
                aiPriority = calculateHabitPriority(habitContext);
              }
              
              return (
                <ListItem
                  key={habit.id}
                  sx={{
                    bgcolor: 'background.paper',
                    mb: 1,
                    borderRadius: 1,
                    boxShadow: 1,
                    opacity: isScheduledToday ? 1 : 0.6,
                    borderLeft: aiPrioritizationEnabled && aiPriority ? `4px solid ${
                      aiPriority.urgencyLevel === 'high' ? '#f44336' :
                      aiPriority.urgencyLevel === 'medium' ? '#ff9800' : '#4caf50'
                    }` : 'none'
                  }}
                >
                  <Tooltip title={isScheduledToday ? "Click to mark complete" : "Not scheduled for today"}>
                    <Checkbox
                      checked={habit.completed}
                      onChange={() => toggleHabitCompletion(habit.id)}
                      disabled={!isScheduledToday}
                    />
                  </Tooltip>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          sx={{
                            textDecoration: habit.completed ? 'line-through' : 'none',
                            color: habit.completed ? 'text.secondary' : 'text.primary',
                            fontWeight: 'medium',
                          }}
                        >
                          {habit.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={habit.category}
                          color={getCategoryColor(habit.category) as any}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          icon={<StarIcon />}
                          label={habit.difficulty}
                          color={getDifficultyColor(habit.difficulty) as any}
                        />
                        <HabitMastery habit={habit} compact={true} />
                        <StreakIndicator habit={habit} compact={true} />
                        {aiPrioritizationEnabled && aiPriority && (
                          <Chip
                            size="small"
                            icon={<PsychologyIcon />}
                            label={`Priority: ${aiPriority.priorityScore}`}
                            color={aiPriority.urgencyLevel === 'high' ? 'error' : 
                                  aiPriority.urgencyLevel === 'medium' ? 'warning' : 'success'}
                            variant="filled"
                          />
                        )}
                        {!isScheduledToday && (
                          <Chip
                            size="small"
                            icon={<ScheduleIcon />}
                            label="Not today"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {habit.description && (
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            {habit.description}
                          </Typography>
                        )}
                        <Typography variant="body2" component="div">{`Created on ${format(habit.createdAt, 'PP')}`}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {Array.from({ length: 7 }).map((_, index) => {
                            const date = new Date();
                            date.setDate(date.getDate() - index);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const dayName = format(date, 'EEE');
                            const dayOfWeek = date.getDay();
                            const isScheduled = habit.scheduledDays.includes(dayOfWeek);
                            return (
                              <Box key={dateStr} sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" component="div">{dayName}</Typography>
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: !isScheduled 
                                      ? 'action.disabled'
                                      : habit.weeklyProgress[dateStr] 
                                        ? 'success.main' 
                                        : 'action.disabledBackground',
                                    mt: 0.5,
                                    border: !isScheduled ? '1px dashed' : 'none',
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                        <Typography variant="caption" component="div" sx={{ display: 'block', mt: 1 }}>
                          Current Streak: {habit.currentStreak} days | Best Streak: {habit.bestStreak} days
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ display: 'block' }}>
                          Scheduled: {habit.scheduledDays.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ')}
                        </Typography>
                        {aiPrioritizationEnabled && aiPriority && (
                          <Typography variant="caption" component="div" sx={{ 
                            display: 'block', 
                            mt: 0.5, 
                            p: 1, 
                            bgcolor: 'action.hover', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: aiPriority.urgencyLevel === 'high' ? 'error.main' : 
                                        aiPriority.urgencyLevel === 'medium' ? 'warning.main' : 'success.main'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <PsychologyIcon fontSize="small" />
                              <strong>AI Priority: {aiPriority.priorityScore}/100 ({aiPriority.urgencyLevel.toUpperCase()})</strong>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {aiPriority.reason}
                            </Typography>
                            {aiPriority.suggestions.length > 0 && (
                              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
                                💡 {aiPriority.suggestions[0]}
                              </Typography>
                            )}
                          </Typography>
                        )}
                        {habit.notes && (
                          <Typography variant="caption" component="div" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            Notes: {habit.notes}
                          </Typography>
                        )}
                        <HabitMastery habit={habit} compact={false} />
                        <StreakIndicator habit={habit} compact={false} />
                      </Box>
                    }
                    sx={{
                      '& .MuiListItemText-primary': {
                        textDecoration: habit.completed ? 'line-through' : 'none',
                        color: habit.completed ? 'text.secondary' : 'text.primary',
                      },
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(habit)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            }))}
          </List>

          <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>{editingHabit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  autoFocus
                  label="Habit Name"
                  type="text"
                  fullWidth
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  required
                />
                
                <TextField
                  label="Description"
                  type="text"
                  fullWidth
                  multiline
                  rows={2}
                  value={habitDescription}
                  onChange={(e) => setHabitDescription(e.target.value)}
                  placeholder="What is this habit about?"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={habitCategory}
                      label="Category"
                      onChange={(e) => setHabitCategory(e.target.value)}
                    >
                      {HABIT_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={habitDifficulty}
                      label="Difficulty"
                      onChange={(e) => setHabitDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Scheduled Days
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {DAYS_OF_WEEK.map((day) => (
                      <Chip
                        key={day.value}
                        label={day.label}
                        onClick={() => {
                          if (habitScheduledDays.includes(day.value)) {
                            setHabitScheduledDays(habitScheduledDays.filter(d => d !== day.value));
                          } else {
                            setHabitScheduledDays([...habitScheduledDays, day.value]);
                          }
                        }}
                        color={habitScheduledDays.includes(day.value) ? 'primary' : 'default'}
                        variant={habitScheduledDays.includes(day.value) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Select the days when you want to perform this habit
                  </Typography>
                </Box>

                <Divider />

                <TextField
                  label="Notes"
                  type="text"
                  fullWidth
                  multiline
                  rows={3}
                  value={habitNotes}
                  onChange={(e) => setHabitNotes(e.target.value)}
                  placeholder="Any additional notes, tips, or reminders for this habit..."
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSaveHabit} variant="contained" disabled={!habitName.trim()}>
                {editingHabit ? 'Save Changes' : 'Add Habit'}
              </Button>
            </DialogActions>
          </Dialog>

          <HabitTemplatesDialog 
            open={templatesOpen} 
            onClose={() => setTemplatesOpen(false)} 
            onSelectTemplate={handleSelectTemplate}
          />

          <AchievementSystem
            habits={habits}
            open={achievementsOpen}
            onClose={() => setAchievementsOpen(false)}
            userProfile={userProfile}
          />

          <SocialFeatures
            habits={habits}
            open={socialFeaturesOpen}
            onClose={() => setSocialFeaturesOpen(false)}
            userProfile={userProfile}
          />

          <DataManagement
            habits={habits}
            open={dataManagementOpen}
            onClose={() => setDataManagementOpen(false)}
            onHabitsUpdate={setHabits}
          />

          {/* Smart Reminders Dialog */}
          <SmartReminders
            open={remindersOpen}
            onClose={() => setRemindersOpen(false)}
            habits={habits}
          />

          {/* Motivational Notification */}
          {notificationData && (
            <MotivationalNotification
              open={notificationOpen}
              onClose={() => {
                setNotificationOpen(false);
                setNotificationData(null);
              }}
              habitName={notificationData.habitName}
              currentStreak={notificationData.currentStreak}
              completionCount={notificationData.completionCount}
              isNewRecord={notificationData.isNewRecord}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default HabitList;