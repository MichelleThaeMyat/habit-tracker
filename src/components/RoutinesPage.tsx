import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Badge,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Timeline as RoutineIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Stop as StopIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  FitnessCenter as GymIcon,
  Brightness6 as MorningIcon,
  Brightness2 as EveningIcon,
  Computer as WorkRoutineIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, differenceInMinutes } from 'date-fns';
import {
  Routine,
  RoutineHabit,
  RoutineCompletion,
  RoutineTemplate,
  ROUTINE_TEMPLATES,
  createRoutine,
  createRoutineFromTemplate,
  startRoutineSession,
  completeRoutineHabit,
  skipRoutineHabit,
  finishRoutineSession,
  getRoutineStats,
  getOptimalRoutineTime,
} from '../utils/routineUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const RoutinesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [habits, setHabits] = useState(() => {
    try {
      const savedHabits = localStorage.getItem('habits');
      return savedHabits ? JSON.parse(savedHabits) : [];
    } catch {
      return [];
    }
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('habitRoutines');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSession, setActiveSession] = useState<{
    routine: Routine;
    session: RoutineCompletion;
    currentHabitIndex: number;
  } | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(null);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    type: 'custom' as Routine['type'],
    context: 'home' as Routine['context'],
  });

  // Save routines to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('habitRoutines', JSON.stringify(routines));
  }, [routines]);

  const handleCreateRoutine = () => {
    if (!newRoutine.name.trim()) return;

    let routine: Routine;
    if (selectedTemplate) {
      routine = createRoutineFromTemplate(selectedTemplate, newRoutine.name);
      routine.description = newRoutine.description || routine.description;
      routine.context = newRoutine.context;
    } else {
      routine = createRoutine(
        newRoutine.name,
        newRoutine.type,
        newRoutine.context,
        newRoutine.description
      );
    }

    setRoutines(prev => [...prev, routine]);
    setCreateDialogOpen(false);
    setSelectedTemplate(null);
    setNewRoutine({
      name: '',
      description: '',
      type: 'custom',
      context: 'home',
    });
  };

  const handleStartRoutine = (routine: Routine) => {
    const session = startRoutineSession(routine);
    setActiveSession({
      routine,
      session,
      currentHabitIndex: 0,
    });
    setTabValue(1); // Switch to active session tab
  };

  const handleCompleteHabit = (habitId: string, duration: number) => {
    if (!activeSession) return;

    const updatedSession = completeRoutineHabit(activeSession.session, habitId, duration);
    setActiveSession({
      ...activeSession,
      session: updatedSession,
      currentHabitIndex: activeSession.currentHabitIndex + 1,
    });
  };

  const handleSkipHabit = (habitId: string, reason?: string) => {
    if (!activeSession) return;

    const updatedSession = skipRoutineHabit(activeSession.session, habitId, reason);
    setActiveSession({
      ...activeSession,
      session: updatedSession,
      currentHabitIndex: activeSession.currentHabitIndex + 1,
    });
  };

  const handleFinishSession = (mood?: RoutineCompletion['mood']) => {
    if (!activeSession) return;

    const completedSession = finishRoutineSession(
      activeSession.session,
      activeSession.routine.habits.length,
      mood
    );

    // Update routine with completed session
    const updatedRoutines = routines.map(r => {
      if (r.id === activeSession.routine.id) {
        return {
          ...r,
          completionHistory: {
            ...r.completionHistory,
            [completedSession.date]: completedSession,
          },
        };
      }
      return r;
    });

    setRoutines(updatedRoutines);
    setActiveSession(null);
    setTabValue(0); // Switch back to routines list
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(prev => prev.filter(r => r.id !== routineId));
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setNewRoutine({
      name: routine.name,
      description: routine.description,
      type: routine.type,
      context: routine.context,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEditedRoutine = () => {
    if (!editingRoutine || !newRoutine.name.trim()) return;

    const updatedRoutine: Routine = {
      ...editingRoutine,
      name: newRoutine.name.trim(),
      description: newRoutine.description,
      type: newRoutine.type,
      context: newRoutine.context,
    };

    setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? updatedRoutine : r));
    setEditDialogOpen(false);
    setEditingRoutine(null);
    setNewRoutine({
      name: '',
      description: '',
      type: 'custom',
      context: 'home',
    });
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'home': return <HomeIcon />;
      case 'work': return <WorkIcon />;
      case 'gym': return <GymIcon />;
      default: return <RoutineIcon />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'morning': return <MorningIcon />;
      case 'evening': return <EveningIcon />;
      case 'work': return <WorkRoutineIcon />;
      case 'workout': return <GymIcon />;
      default: return <RoutineIcon />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Routine Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create, manage, and execute your daily routines for maximum productivity.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<RoutineIcon />} label="My Routines" />
            <Tab 
              icon={
                <Badge badgeContent={activeSession ? 1 : 0} color="primary">
                  <PlayIcon />
                </Badge>
              } 
              label="Active Session" 
            />
            <Tab icon={<StarIcon />} label="Templates" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">My Routines</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Routine
            </Button>
          </Box>

          {routines.length === 0 ? (
            <Alert severity="info">
              No routines created yet. Start by creating a routine from a template or build your own custom routine.
            </Alert>
          ) : (
            routines.map(routine => {
              const stats = getRoutineStats(routine);
              const optimalTime = getOptimalRoutineTime(routine);

              return (
                <Card key={routine.id} sx={{ mb: 2, position: 'relative' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getTypeIcon(routine.type)}
                      <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                        {routine.name}
                      </Typography>
                      <Chip
                        icon={getContextIcon(routine.context)}
                        label={routine.context}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Switch
                        checked={routine.isActive}
                        onChange={(e) => {
                          const updatedRoutines = routines.map(r =>
                            r.id === routine.id ? { ...r, isActive: e.target.checked } : r
                          );
                          setRoutines(updatedRoutines);
                        }}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {routine.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<TimeIcon />}
                        label={`${routine.estimatedDuration}min`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<ScheduleIcon />}
                        label={`Best: ${optimalTime}`}
                        size="small"
                        variant="outlined"
                      />
                      {stats.currentStreak > 0 && (
                        <Chip
                          icon={<TrendingUpIcon />}
                          label={`${stats.currentStreak} day streak`}
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>

                    {stats.totalSessions > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Completion Rate: {(stats.averageCompletionRate * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={stats.averageCompletionRate * 100}
                          color={stats.averageCompletionRate >= 0.8 ? 'success' : stats.averageCompletionRate >= 0.6 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {routine.habits.length} habits • {stats.totalSessions} sessions completed
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayIcon />}
                        onClick={() => handleStartRoutine(routine)}
                        disabled={!routine.isActive}
                        size="small"
                      >
                        Start
                      </Button>
                      <IconButton
                        onClick={() => handleEditRoutine(routine)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteRoutine(routine.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {!activeSession ? (
            <Alert severity="info">
              No active routine session. Start a routine from the Routines tab to begin.
            </Alert>
          ) : (
            <Box>
              <Typography variant="h5" gutterBottom>
                Active Session: {activeSession.routine.name}
              </Typography>
              
              {/* Progress Overview */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Session Progress</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(activeSession.currentHabitIndex / activeSession.routine.habits.length) * 100}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">
                      Habit {activeSession.currentHabitIndex + 1} of {activeSession.routine.habits.length}
                    </Typography>
                    <Typography variant="body2">
                      {Math.round((activeSession.currentHabitIndex / activeSession.routine.habits.length) * 100)}% Complete
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<TimeIcon />}
                      label={`Started at ${activeSession.session.startTime}`}
                      variant="outlined"
                    />
                    <Chip
                      icon={<CheckIcon />}
                      label={`${activeSession.session.completedHabits.length} completed`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CancelIcon />}
                      label={`${activeSession.session.skippedHabits.length} skipped`}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Current Habit */}
              {activeSession.currentHabitIndex < activeSession.routine.habits.length ? (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current: {activeSession.routine.habits[activeSession.currentHabitIndex].name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {activeSession.routine.habits[activeSession.currentHabitIndex].description}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Estimated time: {activeSession.routine.habits[activeSession.currentHabitIndex].estimatedDuration} minutes
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Completion criteria: {activeSession.routine.habits[activeSession.currentHabitIndex].completionCriteria}
                    </Typography>
                    {activeSession.routine.habits[activeSession.currentHabitIndex].isOptional && (
                      <Chip label="Optional" size="small" color="info" sx={{ mt: 1 }} />
                    )}

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleCompleteHabit(activeSession.routine.habits[activeSession.currentHabitIndex].id, activeSession.routine.habits[activeSession.currentHabitIndex].estimatedDuration)}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => handleSkipHabit(activeSession.routine.habits[activeSession.currentHabitIndex].id, 'Skipped by user')}
                      >
                        Skip
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                /* Session Complete */
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      🎉 Session Complete!
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      How are you feeling after completing this routine?
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      {[
                        { mood: 'great', emoji: '😊', label: 'Great' },
                        { mood: 'good', emoji: '🙂', label: 'Good' },
                        { mood: 'okay', emoji: '😐', label: 'Okay' },
                        { mood: 'tired', emoji: '😴', label: 'Tired' },
                        { mood: 'stressed', emoji: '😰', label: 'Stressed' }
                      ].map(({ mood, emoji, label }) => (
                        <Button
                          key={mood}
                          variant="outlined"
                          onClick={() => handleFinishSession(mood as RoutineCompletion['mood'])}
                          sx={{ display: 'flex', flexDirection: 'column', p: 2, minWidth: 80 }}
                        >
                          <Typography variant="h6">{emoji}</Typography>
                          <Typography variant="caption">{label}</Typography>
                        </Button>
                      ))}
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={() => handleFinishSession()}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Finish Session
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Session Summary */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Summary
                  </Typography>
                  <List dense>
                    {activeSession.routine.habits.map((habit, index) => {
                      const isCompleted = activeSession.session.completedHabits.includes(habit.id);
                      const isSkipped = activeSession.session.skippedHabits.includes(habit.id);
                      const isCurrent = index === activeSession.currentHabitIndex && activeSession.currentHabitIndex < activeSession.routine.habits.length;
                      
                      return (
                        <ListItem key={habit.id} sx={{ opacity: isCurrent ? 1 : (isCompleted || isSkipped) ? 0.7 : 0.5 }}>
                          <ListItemIcon>
                            {isCompleted ? (
                              <CheckIcon color="success" />
                            ) : isSkipped ? (
                              <CancelIcon color="warning" />
                            ) : isCurrent ? (
                              <PlayIcon color="primary" />
                            ) : (
                              <TimeIcon color="disabled" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={habit.name}
                            secondary={`${habit.estimatedDuration}min${habit.isOptional ? ' (optional)' : ''}`}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveSession(null)}
                      startIcon={<StopIcon />}
                    >
                      Stop Session
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Routine Templates</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Start with a proven routine template and customize it to your needs.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2 }}>
            {ROUTINE_TEMPLATES.map(template => (
              <Card key={template.id} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getTypeIcon(template.type)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {template.name}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {template.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<TimeIcon />}
                      label={`${template.estimatedDuration}min`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={template.difficulty}
                      size="small"
                      color={
                        template.difficulty === 'beginner' ? 'success' :
                        template.difficulty === 'intermediate' ? 'warning' : 'error'
                      }
                    />
                    <Chip
                      icon={getContextIcon(template.context)}
                      label={template.context}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" gutterBottom>
                    {template.habits.length} habits included
                  </Typography>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">View Habits</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {template.habits.map((habit, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={habit.name}
                              secondary={`${habit.estimatedDuration}min${habit.isOptional ? ' (optional)' : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setNewRoutine({
                        name: template.name,
                        description: template.description,
                        type: template.type,
                        context: template.context,
                      });
                      setCreateDialogOpen(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Create Routine Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedTemplate ? `Create from ${selectedTemplate.name}` : 'Create New Routine'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Routine Name"
                value={newRoutine.name}
                onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Description"
                value={newRoutine.description}
                onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newRoutine.type}
                  label="Type"
                  onChange={(e) => setNewRoutine({ ...newRoutine, type: e.target.value as Routine['type'] })}
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                  <MenuItem value="workout">Workout</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Context</InputLabel>
                <Select
                  value={newRoutine.context}
                  label="Context"
                  onChange={(e) => setNewRoutine({ ...newRoutine, context: e.target.value as Routine['context'] })}
                >
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="gym">Gym</MenuItem>
                  <MenuItem value="anywhere">Anywhere</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRoutine} variant="contained" disabled={!newRoutine.name.trim()}>
              Create Routine
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Routine Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Routine
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Routine Name"
                value={newRoutine.name}
                onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                fullWidth
              />

              <TextField
                label="Description"
                value={newRoutine.description}
                onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newRoutine.type}
                  label="Type"
                  onChange={(e) => setNewRoutine({ ...newRoutine, type: e.target.value as Routine['type'] })}
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                  <MenuItem value="workout">Workout</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Context</InputLabel>
                <Select
                  value={newRoutine.context}
                  label="Context"
                  onChange={(e) => setNewRoutine({ ...newRoutine, context: e.target.value as Routine['context'] })}
                >
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="gym">Gym</MenuItem>
                  <MenuItem value="anywhere">Anywhere</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditedRoutine} variant="contained" disabled={!newRoutine.name.trim()}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default RoutinesPage;
