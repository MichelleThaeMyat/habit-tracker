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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Alert,
  Paper,
  LinearProgress,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  FitnessCenter as GymIcon,
  DirectionsCar as CommuteIcon,
  Public as AnywhereIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  ContextBundle,
  createContextBundle,
} from '../utils/routineUtils';

interface ContextBundlesProps {
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

interface BundleSuggestion {
  context: ContextBundle['context'];
  habits: string[];
  reason: string;
  confidence: number;
}

const ContextBundles: React.FC<ContextBundlesProps> = ({ open, onClose, habits }) => {
  const [bundles, setBundles] = useState<ContextBundle[]>(() => {
    const saved = localStorage.getItem('contextBundles');
    return saved ? JSON.parse(saved) : [];
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBundle, setNewBundle] = useState({
    name: '',
    context: 'home' as ContextBundle['context'],
    selectedHabits: [] as string[],
    triggerConditions: [] as string[],
    newTriggerCondition: '',
  });
  const [todaysProgress, setTodaysProgress] = useState<{ [bundleId: string]: number }>({});

  // Save bundles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('contextBundles', JSON.stringify(bundles));
  }, [bundles]);

  // Calculate today's progress for each bundle
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const progress: { [bundleId: string]: number } = {};

    bundles.forEach(bundle => {
      if (!bundle.isActive) return;

      const bundleHabits = habits.filter(h => bundle.habits.includes(h.id));
      if (bundleHabits.length === 0) return;

      const completedToday = bundleHabits.filter(h => h.weeklyProgress[today]).length;
      progress[bundle.id] = bundleHabits.length > 0 ? completedToday / bundleHabits.length : 0;
    });

    setTodaysProgress(progress);
  }, [bundles, habits]);

  // Generate smart bundle suggestions
  const generateBundleSuggestions = (): BundleSuggestion[] => {
    const suggestions: BundleSuggestion[] = [];

    // Group habits by likely context based on names and categories
    const contextGroups: { [context: string]: string[] } = {
      home: [],
      work: [],
      gym: [],
      commute: [],
      anywhere: [],
    };

    habits.forEach(habit => {
      const name = habit.name.toLowerCase();
      const category = habit.category.toLowerCase();

      // Home context indicators
      if (
        name.includes('morning') || name.includes('evening') || name.includes('breakfast') ||
        name.includes('cook') || name.includes('clean') || name.includes('bed') ||
        category.includes('home') || category.includes('personal')
      ) {
        contextGroups.home.push(habit.id);
      }
      // Work context indicators
      else if (
        name.includes('work') || name.includes('office') || name.includes('meeting') ||
        name.includes('email') || name.includes('project') || name.includes('professional') ||
        category.includes('work') || category.includes('productivity') || category.includes('career')
      ) {
        contextGroups.work.push(habit.id);
      }
      // Gym context indicators
      else if (
        name.includes('gym') || name.includes('workout') || name.includes('exercise') ||
        name.includes('lift') || name.includes('run') || name.includes('cardio') ||
        category.includes('fitness') || category.includes('exercise') || category.includes('gym')
      ) {
        contextGroups.gym.push(habit.id);
      }
      // Commute context indicators
      else if (
        name.includes('commute') || name.includes('drive') || name.includes('train') ||
        name.includes('podcast') || name.includes('audiobook') || name.includes('travel')
      ) {
        contextGroups.commute.push(habit.id);
      }
      // Default to anywhere
      else {
        contextGroups.anywhere.push(habit.id);
      }
    });

    // Create suggestions for contexts with multiple habits
    Object.entries(contextGroups).forEach(([context, habitIds]) => {
      if (habitIds.length >= 2) {
        // Check if these habits are often completed together
        const dates = Object.keys(habits[0]?.weeklyProgress || {}).slice(-30);
        let togetherCount = 0;
        let totalDays = 0;

        dates.forEach(date => {
          const contextHabits = habits.filter(h => habitIds.includes(h.id));
          const completedHabits = contextHabits.filter(h => h.weeklyProgress[date]);
          
          if (contextHabits.length > 0) {
            totalDays++;
            if (completedHabits.length >= Math.ceil(contextHabits.length * 0.5)) {
              togetherCount++;
            }
          }
        });

        const correlation = totalDays > 0 ? togetherCount / totalDays : 0;

        if (correlation >= 0.3 && habitIds.length >= 2) {
          let reason = '';
          switch (context) {
            case 'home':
              reason = 'These habits are typically done at home and can be bundled together';
              break;
            case 'work':
              reason = 'These work-related habits can boost your professional productivity';
              break;
            case 'gym':
              reason = 'These fitness habits complement each other in your workout routine';
              break;
            case 'commute':
              reason = 'These habits can be done during travel time';
              break;
            default:
              reason = 'These habits can be done anywhere and support each other';
          }

          suggestions.push({
            context: context as ContextBundle['context'],
            habits: habitIds,
            reason,
            confidence: correlation,
          });
        }
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  };

  const handleCreateBundle = () => {
    if (!newBundle.name.trim() || newBundle.selectedHabits.length === 0) return;

    const bundle = createContextBundle(
      newBundle.name,
      newBundle.context,
      newBundle.selectedHabits,
      newBundle.triggerConditions
    );

    setBundles(prev => [...prev, bundle]);
    setCreateDialogOpen(false);
    setNewBundle({
      name: '',
      context: 'home',
      selectedHabits: [],
      triggerConditions: [],
      newTriggerCondition: '',
    });
  };

  const handleAddTriggerCondition = () => {
    if (!newBundle.newTriggerCondition.trim()) return;
    
    setNewBundle(prev => ({
      ...prev,
      triggerConditions: [...prev.triggerConditions, prev.newTriggerCondition],
      newTriggerCondition: '',
    }));
  };

  const handleRemoveTriggerCondition = (index: number) => {
    setNewBundle(prev => ({
      ...prev,
      triggerConditions: prev.triggerConditions.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteBundle = (bundleId: string) => {
    setBundles(prev => prev.filter(b => b.id !== bundleId));
  };

  const handleToggleBundle = (bundleId: string, isActive: boolean) => {
    setBundles(prev => prev.map(b => 
      b.id === bundleId ? { ...b, isActive } : b
    ));
  };

  const createBundleFromSuggestion = (suggestion: BundleSuggestion) => {
    const contextName = suggestion.context.charAt(0).toUpperCase() + suggestion.context.slice(1);
    setNewBundle({
      name: `${contextName} Bundle`,
      context: suggestion.context,
      selectedHabits: suggestion.habits,
      triggerConditions: [],
      newTriggerCondition: '',
    });
    setCreateDialogOpen(true);
  };

  const getBundleStats = (bundle: ContextBundle) => {
    const dates = Object.keys(bundle.completionHistory).slice(-30);
    const totalDays = dates.length;
    const completionRates = dates.map(date => bundle.completionHistory[date] || 0);
    const avgCompletion = completionRates.length > 0 
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length 
      : 0;

    // Calculate streak
    let currentStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const completionRate = bundle.completionHistory[dates[i]] || 0;
      if (completionRate >= 0.8) { // 80% completion threshold
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalDays,
      avgCompletion,
      currentStreak,
    };
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'home': return <HomeIcon />;
      case 'work': return <WorkIcon />;
      case 'gym': return <GymIcon />;
      case 'commute': return <CommuteIcon />;
      case 'anywhere': return <AnywhereIcon />;
      default: return <GroupIcon />;
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case 'home': return '#4caf50';
      case 'work': return '#2196f3';
      case 'gym': return '#ff9800';
      case 'commute': return '#9c27b0';
      case 'anywhere': return '#607d8b';
      default: return '#9e9e9e';
    }
  };

  const suggestions = generateBundleSuggestions();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Context-Based Bundles
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Today's Bundle Progress */}
        <Card sx={{ mb: 3, bgcolor: 'success.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Today's Bundle Progress</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              {bundles.filter(b => b.isActive).map(bundle => (
                <Paper key={bundle.id} sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    {getContextIcon(bundle.context)}
                    <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      {bundle.name}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(todaysProgress[bundle.id] || 0) * 100}
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                    color={(todaysProgress[bundle.id] || 0) >= 0.8 ? 'success' : 'primary'}
                  />
                  <Typography variant="body2">
                    {Math.round((todaysProgress[bundle.id] || 0) * 100)}% complete
                  </Typography>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Create New Bundle Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Your Context Bundles</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Bundle
          </Button>
        </Box>

        {/* Existing Bundles */}
        {bundles.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No context bundles created yet. Create bundles to group habits by location or situation!
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2, mb: 3 }}>
            {bundles.map(bundle => {
              const bundleHabits = habits.filter(h => bundle.habits.includes(h.id));
              const stats = getBundleStats(bundle);
              const todayProgress = todaysProgress[bundle.id] || 0;

              return (
                <Card key={bundle.id} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: getContextColor(bundle.context),
                          mr: 1 
                        }}>
                          {getContextIcon(bundle.context)}
                        </Box>
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          {bundle.name}
                        </Typography>
                        <Switch
                          checked={bundle.isActive}
                          onChange={(e) => handleToggleBundle(bundle.id, e.target.checked)}
                          size="small"
                        />
                      </Box>

                      <Chip
                        label={bundle.context}
                        size="small"
                        sx={{ 
                          mb: 2,
                          bgcolor: getContextColor(bundle.context),
                          color: 'white',
                        }}
                      />

                      {/* Today's Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Today's Progress: {Math.round(todayProgress * 100)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={todayProgress * 100}
                          color={todayProgress >= 0.8 ? 'success' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      {/* Bundle Stats */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<GroupIcon />}
                          label={`${bundleHabits.length} habits`}
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
                        <Chip
                          label={`${Math.round(stats.avgCompletion * 100)}% avg`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Habits in Bundle */}
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">View Habits</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {bundleHabits.map(habit => {
                              const today = format(new Date(), 'yyyy-MM-dd');
                              const isCompletedToday = habit.weeklyProgress[today];
                              
                              return (
                                <ListItem key={habit.id}>
                                  <ListItemIcon>
                                    {isCompletedToday ? (
                                      <CheckIcon color="success" />
                                    ) : (
                                      <ScheduleIcon color="disabled" />
                                    )}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={habit.name}
                                    secondary={habit.category}
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      {/* Trigger Conditions */}
                      {bundle.triggerConditions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Triggered by:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {bundle.triggerConditions.map((condition, index) => (
                              <Chip
                                key={index}
                                label={condition}
                                size="small"
                                icon={<NotificationIcon />}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <IconButton
                          onClick={() => handleDeleteBundle(bundle.id)}
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
              💡 Smart Bundle Suggestions
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Based on your habit patterns, these context-based bundles might help:
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2 }}>
              {suggestions.map((suggestion, index) => {
                const suggestionHabits = habits.filter(h => suggestion.habits.includes(h.id));

                return (
                  <Card key={index} sx={{ border: '1px dashed', borderColor: 'primary.main' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getContextIcon(suggestion.context)}
                          <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                            {suggestion.context.charAt(0).toUpperCase() + suggestion.context.slice(1)} Bundle
                          </Typography>
                          <Chip
                            label={`${Math.round(suggestion.confidence * 100)}% match`}
                            size="small"
                            color="primary"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {suggestion.reason}
                        </Typography>

                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Suggested habits:
                        </Typography>
                        <List dense>
                          {suggestionHabits.map(habit => (
                            <ListItem key={habit.id} sx={{ py: 0 }}>
                              <ListItemText 
                                primary={habit.name}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => createBundleFromSuggestion(suggestion)}
                          sx={{ mt: 1 }}
                          fullWidth
                        >
                          Create This Bundle
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Create Bundle Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Context Bundle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Bundle Name"
              value={newBundle.name}
              onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
              placeholder="e.g., Morning Home Routine, Work Productivity Bundle"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Context</InputLabel>
              <Select
                value={newBundle.context}
                label="Context"
                onChange={(e) => setNewBundle({ ...newBundle, context: e.target.value as ContextBundle['context'] })}
              >
                <MenuItem value="home">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon />
                    Home
                  </Box>
                </MenuItem>
                <MenuItem value="work">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon />
                    Work
                  </Box>
                </MenuItem>
                <MenuItem value="gym">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GymIcon />
                    Gym
                  </Box>
                </MenuItem>
                <MenuItem value="commute">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CommuteIcon />
                    Commute
                  </Box>
                </MenuItem>
                <MenuItem value="anywhere">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnywhereIcon />
                    Anywhere
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Select Habits for Bundle
              </Typography>
              <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                {habits.map(habit => (
                  <FormControlLabel
                    key={habit.id}
                    control={
                      <Checkbox
                        checked={newBundle.selectedHabits.includes(habit.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewBundle(prev => ({
                              ...prev,
                              selectedHabits: [...prev.selectedHabits, habit.id]
                            }));
                          } else {
                            setNewBundle(prev => ({
                              ...prev,
                              selectedHabits: prev.selectedHabits.filter(id => id !== habit.id)
                            }));
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{habit.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {habit.category}
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'block', mb: 1 }}
                  />
                ))}
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Trigger Conditions (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Add conditions that remind you to complete this bundle
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Add trigger condition"
                  value={newBundle.newTriggerCondition}
                  onChange={(e) => setNewBundle({ ...newBundle, newTriggerCondition: e.target.value })}
                  placeholder="e.g., Arriving at gym, After coffee, 6 PM alarm"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddTriggerCondition}
                  disabled={!newBundle.newTriggerCondition.trim()}
                >
                  Add
                </Button>
              </Box>

              {newBundle.triggerConditions.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {newBundle.triggerConditions.map((condition, index) => (
                    <Chip
                      key={index}
                      label={condition}
                      onDelete={() => handleRemoveTriggerCondition(index)}
                      size="small"
                      icon={<NotificationIcon />}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateBundle} 
            variant="contained" 
            disabled={!newBundle.name.trim() || newBundle.selectedHabits.length === 0}
          >
            Create Bundle
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ContextBundles;
