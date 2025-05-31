import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { format, parseISO, isToday, startOfDay } from 'date-fns';
import {
  HabitStack,
  createHabitStack,
} from '../utils/routineUtils';

interface HabitStackingProps {
  open: boolean;
  onClose: () => void;
  habits: Array<{ 
    id: string; 
    name: string; 
    category: string;
    weeklyProgress: { [key: string]: boolean };
    currentStreak: number;
  }>;
}

interface StackSuggestion {
  triggerHabit: string;
  stackedHabit: string;
  reason: string;
  confidence: number;
}

const HabitStacking: React.FC<HabitStackingProps> = ({ open, onClose, habits }) => {
  const [stacks, setStacks] = useState<HabitStack[]>(() => {
    const saved = localStorage.getItem('habitStacks');
    return saved ? JSON.parse(saved) : [];
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newStack, setNewStack] = useState({
    name: '',
    description: '',
    triggerHabit: '',
    stackedHabit: '',
    location: '',
    timeWindow: 30,
  });
  const [todaysActivity, setTodaysActivity] = useState<{
    triggeredStacks: string[];
    completedStacks: string[];
    missedStacks: string[];
  }>({
    triggeredStacks: [],
    completedStacks: [],
    missedStacks: [],
  });

  // Save stacks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('habitStacks', JSON.stringify(stacks));
  }, [stacks]);

  // Check today's stack activity
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const triggeredStacks: string[] = [];
    const completedStacks: string[] = [];
    const missedStacks: string[] = [];

    stacks.forEach(stack => {
      if (!stack.isActive) return;

      const triggerHabit = habits.find(h => h.id === stack.triggerHabit);
      const stackedHabit = habits.find(h => h.id === stack.stackedHabit);

      if (triggerHabit && stackedHabit) {
        const triggerCompleted = triggerHabit.weeklyProgress[today];
        const stackedCompleted = stackedHabit.weeklyProgress[today];

        if (triggerCompleted) {
          triggeredStacks.push(stack.id);
          if (stackedCompleted) {
            completedStacks.push(stack.id);
          } else {
            missedStacks.push(stack.id);
          }
        }
      }
    });

    setTodaysActivity({ triggeredStacks, completedStacks, missedStacks });
  }, [stacks, habits]);

  // Generate smart stacking suggestions
  const generateStackSuggestions = (): StackSuggestion[] => {
    const suggestions: StackSuggestion[] = [];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Look for habits that are often completed together
    for (let i = 0; i < habits.length; i++) {
      for (let j = 0; j < habits.length; j++) {
        if (i === j) continue;

        const habit1 = habits[i];
        const habit2 = habits[j];

        // Skip if already stacked
        const existingStack = stacks.find(s => 
          s.triggerHabit === habit1.id && s.stackedHabit === habit2.id
        );
        if (existingStack) continue;

        // Calculate correlation over last 30 days
        const dates = Object.keys(habit1.weeklyProgress).slice(-30);
        let bothCompleted = 0;
        let triggerCompleted = 0;

        dates.forEach(date => {
          const h1Completed = habit1.weeklyProgress[date];
          const h2Completed = habit2.weeklyProgress[date];

          if (h1Completed) {
            triggerCompleted++;
            if (h2Completed) {
              bothCompleted++;
            }
          }
        });

        if (triggerCompleted >= 5) { // Need at least 5 trigger completions
          const correlation = bothCompleted / triggerCompleted;
          
          if (correlation >= 0.7) {
            let reason = '';
            let confidence = correlation;

            if (habit1.category === habit2.category) {
              reason = `Both habits are in the ${habit1.category} category`;
              confidence *= 1.2;
            } else if (
              (habit1.category === 'health' && habit2.category === 'fitness') ||
              (habit1.category === 'fitness' && habit2.category === 'health')
            ) {
              reason = 'These health and fitness habits complement each other';
              confidence *= 1.1;
            } else if (
              habit1.name.toLowerCase().includes('morning') && 
              habit2.name.toLowerCase().includes('morning')
            ) {
              reason = 'Both habits are part of your morning routine';
              confidence *= 1.15;
            } else {
              reason = `You complete these habits together ${(correlation * 100).toFixed(0)}% of the time`;
            }

            suggestions.push({
              triggerHabit: habit1.id,
              stackedHabit: habit2.id,
              reason,
              confidence: Math.min(confidence, 1),
            });
          }
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  };

  const handleCreateStack = () => {
    if (!newStack.name.trim() || !newStack.triggerHabit || !newStack.stackedHabit) return;

    const stack = createHabitStack(
      newStack.name,
      newStack.description,
      newStack.triggerHabit,
      newStack.stackedHabit,
      newStack.timeWindow
    );

    if (newStack.location) {
      stack.location = newStack.location;
    }

    setStacks(prev => [...prev, stack]);
    setCreateDialogOpen(false);
    setNewStack({
      name: '',
      description: '',
      triggerHabit: '',
      stackedHabit: '',
      location: '',
      timeWindow: 30,
    });
  };

  const handleDeleteStack = (stackId: string) => {
    setStacks(prev => prev.filter(s => s.id !== stackId));
  };

  const handleToggleStack = (stackId: string, isActive: boolean) => {
    setStacks(prev => prev.map(s => 
      s.id === stackId ? { ...s, isActive } : s
    ));
  };

  const createStackFromSuggestion = (suggestion: StackSuggestion) => {
    const triggerHabit = habits.find(h => h.id === suggestion.triggerHabit);
    const stackedHabit = habits.find(h => h.id === suggestion.stackedHabit);

    if (triggerHabit && stackedHabit) {
      setNewStack({
        name: `After ${triggerHabit.name}, do ${stackedHabit.name}`,
        description: suggestion.reason,
        triggerHabit: suggestion.triggerHabit,
        stackedHabit: suggestion.stackedHabit,
        location: '',
        timeWindow: 30,
      });
      setCreateDialogOpen(true);
    }
  };

  const getStackSuccessRate = (stack: HabitStack): number => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const triggerHabit = habits.find(h => h.id === stack.triggerHabit);
    const stackedHabit = habits.find(h => h.id === stack.stackedHabit);

    if (!triggerHabit || !stackedHabit) return 0;

    // Look at last 30 days
    const dates = Object.keys(triggerHabit.weeklyProgress).slice(-30);
    let triggerCount = 0;
    let successCount = 0;

    dates.forEach(date => {
      const triggerCompleted = triggerHabit.weeklyProgress[date];
      const stackedCompleted = stackedHabit.weeklyProgress[date];

      if (triggerCompleted) {
        triggerCount++;
        if (stackedCompleted) {
          successCount++;
        }
      }
    });

    return triggerCount > 0 ? successCount / triggerCount : 0;
  };

  const suggestions = generateStackSuggestions();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon />
          Habit Stacking
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Today's Stack Activity */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Today's Stack Activity</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<NotificationIcon />}
                label={`${todaysActivity.triggeredStacks.length} triggered`}
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<CheckIcon />}
                label={`${todaysActivity.completedStacks.length} completed`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<CancelIcon />}
                label={`${todaysActivity.missedStacks.length} missed`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Create New Stack Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Your Habit Stacks</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Stack
          </Button>
        </Box>

        {/* Existing Stacks */}
        {stacks.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No habit stacks created yet. Create your first stack to start building powerful habit chains!
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            {stacks.map(stack => {
              const triggerHabit = habits.find(h => h.id === stack.triggerHabit);
              const stackedHabit = habits.find(h => h.id === stack.stackedHabit);
              const successRate = getStackSuccessRate(stack);
              const isTriggeredToday = todaysActivity.triggeredStacks.includes(stack.id);
              const isCompletedToday = todaysActivity.completedStacks.includes(stack.id);
              const isMissedToday = todaysActivity.missedStacks.includes(stack.id);

              return (
                <Card key={stack.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LinkIcon sx={{ mr: 1 }} />
                      <Typography variant="h6" sx={{ flex: 1 }}>
                        {stack.name}
                      </Typography>
                      <Switch
                        checked={stack.isActive}
                        onChange={(e) => handleToggleStack(stack.id, e.target.checked)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stack.description}
                    </Typography>

                    {triggerHabit && stackedHabit && (
                      <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>After I:</strong> {triggerHabit.name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>I will:</strong> {stackedHabit.name}
                        </Typography>
                        {stack.location && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Location:</strong> {stack.location}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Time window:</strong> {stack.timeWindow} minutes
                        </Typography>
                      </Paper>
                    )}

                    {/* Success Rate */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Success Rate: {(successRate * 100).toFixed(0)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={successRate * 100}
                        color={successRate >= 0.8 ? 'success' : successRate >= 0.6 ? 'warning' : 'error'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    {/* Today's Status */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {isTriggeredToday && (
                        <Chip
                          icon={<NotificationIcon />}
                          label="Triggered today"
                          color="info"
                          size="small"
                        />
                      )}
                      {isCompletedToday && (
                        <Chip
                          icon={<CheckIcon />}
                          label="Completed today"
                          color="success"
                          size="small"
                        />
                      )}
                      {isMissedToday && (
                        <Chip
                          icon={<CancelIcon />}
                          label="Missed today"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={() => handleDeleteStack(stack.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              💡 Smart Stacking Suggestions
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Based on your habit patterns, these stacks might work well for you:
            </Typography>

            {suggestions.map((suggestion, index) => {
              const triggerHabit = habits.find(h => h.id === suggestion.triggerHabit);
              const stackedHabit = habits.find(h => h.id === suggestion.stackedHabit);

              if (!triggerHabit || !stackedHabit) return null;

              return (
                <Card key={index} sx={{ mb: 2, border: '1px dashed', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        After "{triggerHabit.name}", do "{stackedHabit.name}"
                      </Typography>
                      <Chip
                        label={`${(suggestion.confidence * 100).toFixed(0)}% confidence`}
                        size="small"
                        color="primary"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {suggestion.reason}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => createStackFromSuggestion(suggestion)}
                      sx={{ mt: 1 }}
                    >
                      Create This Stack
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Create Stack Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Habit Stack</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Stack Name"
              value={newStack.name}
              onChange={(e) => setNewStack({ ...newStack, name: e.target.value })}
              placeholder="e.g., After morning coffee, meditate"
              fullWidth
            />

            <TextField
              label="Description"
              value={newStack.description}
              onChange={(e) => setNewStack({ ...newStack, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Trigger Habit (After I...)</InputLabel>
              <Select
                value={newStack.triggerHabit}
                label="Trigger Habit (After I...)"
                onChange={(e) => setNewStack({ ...newStack, triggerHabit: e.target.value })}
              >
                {habits.map(habit => (
                  <MenuItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Stacked Habit (I will...)</InputLabel>
              <Select
                value={newStack.stackedHabit}
                label="Stacked Habit (I will...)"
                onChange={(e) => setNewStack({ ...newStack, stackedHabit: e.target.value })}
              >
                {habits.filter(h => h.id !== newStack.triggerHabit).map(habit => (
                  <MenuItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Location (Optional)"
              value={newStack.location}
              onChange={(e) => setNewStack({ ...newStack, location: e.target.value })}
              placeholder="e.g., Kitchen, Gym, Office"
              fullWidth
            />

            <TextField
              label="Time Window (minutes)"
              type="number"
              value={newStack.timeWindow}
              onChange={(e) => setNewStack({ ...newStack, timeWindow: parseInt(e.target.value) || 30 })}
              inputProps={{ min: 5, max: 120 }}
              helperText="How long after the trigger habit should the stacked habit be completed?"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateStack} 
            variant="contained" 
            disabled={!newStack.name.trim() || !newStack.triggerHabit || !newStack.stackedHabit}
          >
            Create Stack
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default HabitStacking;
