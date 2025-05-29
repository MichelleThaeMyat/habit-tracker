import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
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
          return {
            id: habit.id || String(Date.now()),
            name: habit.name || '',
            completed: Boolean(habit.completed),
            createdAt: createdAtDate,
            weeklyProgress: habit.weeklyProgress || {},
            currentStreak: Number(habit.currentStreak) || 0,
            bestStreak: Number(habit.bestStreak) || 0
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
  const [open, setOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');

  const handleOpenDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitName(habit.name);
    } else {
      setEditingHabit(null);
      setHabitName('');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingHabit(null);
    setHabitName('');
  };

  const handleSaveHabit = () => {
    if (habitName.trim()) {
      setHabits(prevHabits => {
        let newHabits;
        if (editingHabit) {
          // Edit existing habit
          newHabits = prevHabits.map(habit =>
            habit.id === editingHabit.id
              ? { ...habit, name: habitName.trim() }
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
            bestStreak: 0
          };
          newHabits = [...prevHabits, newHabit];
        }
        localStorage.setItem('habits', JSON.stringify(newHabits));
          return newHabits;
        });
      handleCloseDialog();
    }
  };

  const handleToggleHabit = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setHabits(prevHabits => {
      const habit = prevHabits.find(h => h.id === id);
      if (!habit) return prevHabits;

      const wasCompleted = habit.weeklyProgress[today];
      const newProgress = { ...habit.weeklyProgress, [today]: !wasCompleted };
      
      // Calculate streaks
      let currentStreak = habit.currentStreak;
      let bestStreak = habit.bestStreak;
      
      if (!wasCompleted) { // If marking as completed
        currentStreak += 1;
        bestStreak = Math.max(currentStreak, bestStreak);
      } else { // If unmarking as completed
        currentStreak = 0;
      }

      const newHabits = prevHabits.map(h =>
        h.id === id ? {
          ...h,
          completed: !wasCompleted,
          weeklyProgress: newProgress,
          currentStreak,
          bestStreak
        } : h
      );
      
      localStorage.setItem('habits', JSON.stringify(newHabits));
      return newHabits;
    });
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prevHabits => {
      const newHabits = prevHabits.filter(habit => habit.id !== id);
      localStorage.setItem('habits', JSON.stringify(newHabits));
      return newHabits;
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Habits</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Habit
        </Button>
      </Box>

      <List>
        {habits.map((habit) => (
          <ListItem
            key={habit.id}
            sx={{
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Checkbox
              checked={habit.completed}
              onChange={() => handleToggleHabit(habit.id)}
            />
            <ListItemText
              primary={habit.name}
              secondary={
                <Box>
                  <Typography variant="body2">{`Created on ${format(habit.createdAt, 'PP')}`}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {Array.from({ length: 7 }).map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() - index);
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayName = format(date, 'EEE');
                      return (
                        <Box key={dateStr} sx={{ textAlign: 'center' }}>
                          <Typography variant="caption">{dayName}</Typography>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: habit.weeklyProgress[dateStr] ? 'success.main' : 'action.disabledBackground',
                              mt: 0.5
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Current Streak: {habit.currentStreak} days | Best Streak: {habit.bestStreak} days
                  </Typography>
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
        ))}
      </List>

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{editingHabit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Habit Name"
            type="text"
            fullWidth
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveHabit} variant="contained">
            {editingHabit ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HabitList;