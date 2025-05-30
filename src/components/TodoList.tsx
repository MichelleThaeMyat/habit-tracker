import React, { useState } from 'react';
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
  Stack,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Whatshot as FireIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Repeat as RepeatIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import StreakIndicator from './StreakIndicator';
import MotivationalNotification from './MotivationalNotification';
import { checkTaskAchievements } from '../utils/taskAchievements';
import { 
  suggestPriority, 
  calculateUrgencyScore, 
  suggestOptimalTimeSlots, 
  suggestEnergyLevel,
  getDeadlineStatus,
  isTaskOverdue
} from '../utils/smartPrioritization';

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
  completionHistory: { [key: string]: boolean }; // Date string -> completion status
  lastCompletedDate?: string;
  momentumScore: number; // 0-100 indicating recent completion consistency
  deadline?: Date; // Optional deadline for the task
  suggestedPriority?: 'low' | 'medium' | 'high'; // AI-suggested priority
  energyLevel: 'low' | 'medium' | 'high'; // Energy required to complete task
  optimalTimeSlots: string[]; // Suggested time slots based on energy and patterns
  urgencyScore: number; // 0-100 based on deadline proximity and importance
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos).map((todo: any) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      priority: todo.priority,
      createdAt: new Date(todo.createdAt),
      isRecurring: todo.isRecurring || false,
      currentStreak: todo.currentStreak || 0,
      bestStreak: todo.bestStreak || 0,
      completionHistory: todo.completionHistory || {},
      lastCompletedDate: todo.lastCompletedDate,
      momentumScore: todo.momentumScore || 0,
      deadline: todo.deadline ? new Date(todo.deadline) : undefined,
      suggestedPriority: todo.suggestedPriority,
      energyLevel: todo.energyLevel || 'medium',
      optimalTimeSlots: todo.optimalTimeSlots || [],
      urgencyScore: todo.urgencyScore || 0,
    })) : [];
  });
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [isRecurring, setIsRecurring] = useState(false);
  const [deadline, setDeadline] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    habitName: string;
    currentStreak: number;
    completionCount: number;
    isNewRecord: boolean;
  } | null>(null);

  const handleOpenDialog = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo);
      setTitle(todo.title);
      setDescription(todo.description);
      setPriority(todo.priority);
      setIsRecurring(todo.isRecurring);
      setDeadline(todo.deadline ? todo.deadline.toISOString().split('T')[0] : '');
      setEnergyLevel(todo.energyLevel);
    } else {
      setEditingTodo(null);
      setTitle('');
      setDescription('');
      setPriority('low');
      setIsRecurring(false);
      setDeadline('');
      setEnergyLevel('medium');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setPriority('low');
    setIsRecurring(false);
    setDeadline('');
    setEnergyLevel('medium');
  };

  const handleSaveTodo = () => {
    const updateTodos = (newTodos: Todo[]) => {
      setTodos(newTodos);
      localStorage.setItem('todos', JSON.stringify(newTodos));
    };
    if (title.trim()) {
      if (editingTodo) {
        const updatedTodos = todos.map((todo: Todo) =>
          todo.id === editingTodo.id
            ? { 
                ...todo, 
                title, 
                description, 
                priority,
                isRecurring,
                deadline: deadline ? new Date(deadline) : undefined,
                energyLevel,
                suggestedPriority: suggestPriority(title, description, deadline ? new Date(deadline) : undefined),
                optimalTimeSlots: suggestOptimalTimeSlots(energyLevel, title),
                urgencyScore: calculateUrgencyScore(priority, deadline ? new Date(deadline) : undefined),
              }
            : todo
        );
        updateTodos(updatedTodos);
        
        // Check for task achievements after editing
        checkTaskAchievements(updatedTodos);
      } else {
        const deadlineDate = deadline ? new Date(deadline) : undefined;
        const newTodo: Todo = {
          id: Date.now().toString(),
          title,
          description,
          completed: false,
          priority,
          createdAt: new Date(),
          isRecurring,
          currentStreak: 0,
          bestStreak: 0,
          completionHistory: {},
          momentumScore: 0,
          deadline: deadlineDate,
          suggestedPriority: suggestPriority(title, description, deadlineDate),
          energyLevel,
          optimalTimeSlots: suggestOptimalTimeSlots(energyLevel, title),
          urgencyScore: calculateUrgencyScore(priority, deadlineDate),
        };
        updateTodos([...todos, newTodo]);
        
        // Check for task achievements after adding new task
        checkTaskAchievements([...todos, newTodo]);
      }
      handleCloseDialog();
    }
  };

  // Utility functions for streak and momentum calculation
  const getDateString = (date: Date = new Date()) => {
    return date.toISOString().split('T')[0];
  };

  const calculateStreak = (completionHistory: { [key: string]: boolean }, lastCompletedDate?: string): number => {
    if (!lastCompletedDate) return 0;
    
    const today = getDateString();
    const yesterday = getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    // If last completion wasn't today or yesterday, streak is broken
    if (lastCompletedDate !== today && lastCompletedDate !== yesterday) {
      return 0;
    }
    
    let streak = 0;
    let currentDate = new Date(lastCompletedDate);
    
    // Count consecutive days working backwards
    while (true) {
      const dateStr = getDateString(currentDate);
      if (completionHistory[dateStr]) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateMomentumScore = (completionHistory: { [key: string]: boolean }): number => {
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = getDateString(date);
      last7Days.push(completionHistory[dateStr] || false);
    }
    
    // Calculate momentum based on recent completions with recency weighting
    let score = 0;
    last7Days.forEach((completed, index) => {
      if (completed) {
        // More recent completions have higher weight
        score += (8 - index) * 10;
      }
    });
    
    return Math.min(100, score);
  };

  const handleToggleTodo = (id: string) => {
    const today = getDateString();
    
    setTodos(prevTodos => {
      const newTodos = prevTodos.map((todo: Todo) => {
        if (todo.id === id) {
          const isNowCompleted = !todo.completed;
          const updatedHistory = { ...todo.completionHistory };
          
          if (isNowCompleted) {
            updatedHistory[today] = true;
            
            // Calculate new streak
            const newStreak = calculateStreak(updatedHistory, today);
            const newBestStreak = Math.max(todo.bestStreak, newStreak);
            const newMomentumScore = calculateMomentumScore(updatedHistory);
            const completionCount = Object.values(updatedHistory).filter(Boolean).length;
            
            // Trigger notification for recurring tasks with streaks
            if (todo.isRecurring && newStreak > 0) {
              setNotificationData({
                habitName: todo.title,
                currentStreak: newStreak,
                completionCount,
                isNewRecord: newStreak > todo.bestStreak,
              });
              setNotificationOpen(true);
            }
            
            return {
              ...todo,
              completed: true,
              completionHistory: updatedHistory,
              lastCompletedDate: today,
              currentStreak: newStreak,
              bestStreak: newBestStreak,
              momentumScore: newMomentumScore,
            };
          } else {
            // Mark as incomplete
            updatedHistory[today] = false;
            
            return {
              ...todo,
              completed: false,
              completionHistory: updatedHistory,
              currentStreak: calculateStreak(updatedHistory, todo.lastCompletedDate),
              momentumScore: calculateMomentumScore(updatedHistory),
            };
          }
        }
        return todo;
      });
      
      localStorage.setItem('todos', JSON.stringify(newTodos));
      
      // Check for task achievements
      checkTaskAchievements(newTodos);
      
      return newTodos;
    });
  };

  const handleDeleteTodo = (id: string) => {
    const newTodos = todos.filter((todo: Todo) => todo.id !== id);
    setTodos(newTodos);
    localStorage.setItem('todos', JSON.stringify(newTodos));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  // Smart Prioritization Helper Functions
  const getUrgencyColor = (urgencyScore: number) => {
    if (urgencyScore >= 80) return 'error';
    if (urgencyScore >= 60) return 'warning';
    if (urgencyScore >= 40) return 'info';
    return 'default';
  };

  const getUrgencyLabel = (urgencyScore: number) => {
    if (urgencyScore >= 80) return '🚨 Critical';
    if (urgencyScore >= 60) return '⚠️ High';
    if (urgencyScore >= 40) return '📋 Medium';
    return '📝 Low';
  };

  const getEnergyIcon = (energyLevel: string) => {
    switch (energyLevel) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '😴';
      default: return '⚡';
    }
  };

  const renderDeadlineChip = (todo: Todo) => {
    if (!todo.deadline) return null;
    
    const deadlineStatus = getDeadlineStatus(todo.deadline);
    return (
      <Chip
        label={deadlineStatus.text}
        size="small"
        sx={{ 
          color: deadlineStatus.color,
          borderColor: deadlineStatus.color,
        }}
        variant="outlined"
      />
    );
  };

  const renderUrgencyIndicator = (todo: Todo) => {
    return (
      <Tooltip title={`Urgency Score: ${todo.urgencyScore}/100`}>
        <Chip
          label={getUrgencyLabel(todo.urgencyScore)}
          size="small"
          color={getUrgencyColor(todo.urgencyScore)}
          variant="outlined"
        />
      </Tooltip>
    );
  };

  const renderOptimalTimeSlots = (todo: Todo) => {
    if (todo.optimalTimeSlots.length === 0) return null;
    
    return (
      <Tooltip title={`Optimal times: ${todo.optimalTimeSlots.join(', ')}`}>
        <Chip
          icon={<span>{getEnergyIcon(todo.energyLevel)}</span>}
          label={`${todo.energyLevel} energy`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Tooltip>
    );
  };

  const renderSmartPrioritizationInfo = (todo: Todo) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        {renderDeadlineChip(todo)}
        {renderUrgencyIndicator(todo)}
        {renderOptimalTimeSlots(todo)}
        {todo.suggestedPriority && todo.suggestedPriority !== todo.priority && (
          <Tooltip title={`AI suggests: ${todo.suggestedPriority} priority`}>
            <Chip
              label={`AI: ${todo.suggestedPriority}`}
              size="small"
              color="secondary"
              variant="outlined"
              icon={<span>🤖</span>}
            />
          </Tooltip>
        )}
      </Box>
    );
  };

  const getMomentumColor = (score: number) => {
    if (score >= 80) return 'error'; // Hot streak - red/orange
    if (score >= 60) return 'warning'; // Good momentum - yellow/orange
    if (score >= 40) return 'success'; // Building momentum - green
    if (score >= 20) return 'info'; // Some momentum - blue
    return 'default'; // Low momentum - gray
  };

  const getMomentumLabel = (score: number) => {
    if (score >= 80) return '🔥 Hot Streak';
    if (score >= 60) return '⚡ High Momentum';
    if (score >= 40) return '📈 Building';
    if (score >= 20) return '💫 Starting';
    return '😴 Dormant';
  };

  const renderMomentumIndicator = (todo: Todo) => {
    if (!todo.isRecurring) return null;
    
    return (
      <Tooltip title={`Momentum Score: ${todo.momentumScore}/100 - Based on completion consistency over the last 7 days`}>
        <Chip
          icon={<TrendingUpIcon />}
          label={getMomentumLabel(todo.momentumScore)}
          size="small"
          color={getMomentumColor(todo.momentumScore)}
          sx={{ 
            ml: 1,
            animation: todo.momentumScore >= 80 ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 },
            },
          }}
        />
      </Tooltip>
    );
  };

  const renderTaskStreakInfo = (todo: Todo) => {
    if (!todo.isRecurring) return null;
    
    // Create a habit-like object for StreakIndicator
    const habitLikeObject = {
      id: todo.id,
      name: todo.title,
      completed: todo.completed,
      createdAt: todo.createdAt,
      weeklyProgress: todo.completionHistory,
      currentStreak: todo.currentStreak,
      bestStreak: todo.bestStreak,
      category: 'task',
      difficulty: (todo.priority === 'high' ? 'hard' : todo.priority === 'medium' ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
      scheduledDays: [0, 1, 2, 3, 4, 5, 6], // Daily for tasks
      notes: todo.description,
      description: todo.description,
    };
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <StreakIndicator habit={habitLikeObject} compact={true} />
        {renderMomentumIndicator(todo)}
        {todo.currentStreak >= 7 && (
          <Chip
            icon={<TrophyIcon />}
            label="Streak Master!"
            size="small"
            color="warning"
            sx={{
              animation: 'sparkle 1.5s infinite alternate',
              '@keyframes sparkle': {
                '0%': { transform: 'scale(1)' },
                '100%': { transform: 'scale(1.05)' },
              },
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Task
        </Button>
      </Box>

      <List>
        {todos
          .sort((a, b) => {
            // Sort by completion status first (incomplete tasks first)
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            // Then by urgency score (highest urgency first)
            return b.urgencyScore - a.urgencyScore;
          })
          .map((todo) => (
          <ListItem
            key={todo.id}
            sx={{
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)}
            />
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.title}
                  </Typography>
                  <Chip
                    icon={<FlagIcon />}
                    label={todo.priority}
                    size="small"
                    color={getPriorityColor(todo.priority)}
                  />
                  {todo.isRecurring && (
                    <Chip
                      icon={<RepeatIcon />}
                      label="Recurring"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography 
                    variant="body2"
                    sx={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.description}
                  </Typography>
                  {renderTaskStreakInfo(todo)}
                  {renderSmartPrioritizationInfo(todo)}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleOpenDialog(todo)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Task Title"
              type="text"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Priority
              </Typography>
              <Stack direction="row" spacing={1}>
                {['low', 'medium', 'high'].map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    onClick={() => setPriority(p as 'low' | 'medium' | 'high')}
                    color={p === priority ? getPriorityColor(p) : 'default'}
                    variant={p === priority ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Recurring Task
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Track daily streaks and momentum for this task
                    </Typography>
                  </Box>
                }
              />
            </Box>
            
            {/* Smart Task Prioritization Fields */}
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Optional: Set a deadline for urgency calculation"
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Energy Level Required
              </Typography>
              <Stack direction="row" spacing={1}>
                {['low', 'medium', 'high'].map((energy) => (
                  <Chip
                    key={energy}
                    label={`${energy} energy`}
                    onClick={() => setEnergyLevel(energy as 'low' | 'medium' | 'high')}
                    color={energy === energyLevel ? 'primary' : 'default'}
                    variant={energy === energyLevel ? 'filled' : 'outlined'}
                    icon={
                      energy === 'low' ? <span>😴</span> :
                      energy === 'medium' ? <span>⚡</span> :
                      <span>🔥</span>
                    }
                  />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Helps suggest optimal time slots based on your energy patterns
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveTodo} variant="contained">
            {editingTodo ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Motivational Notification */}
      {notificationData && (
        <MotivationalNotification
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          habitName={notificationData.habitName}
          currentStreak={notificationData.currentStreak}
          completionCount={notificationData.completionCount}
          isNewRecord={notificationData.isNewRecord}
        />
      )}
    </Box>
  );
};

export default TodoList;