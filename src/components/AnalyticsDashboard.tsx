import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CalendarToday as HeatmapIcon,
  Analytics as AnalyticsIcon,
  Assignment as GoalIcon,
  Link as LinkIcon,
  Add as AddIcon,
  DateRange as DateRangeIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { format, addDays, startOfYear, endOfYear } from 'date-fns';
import {
  generateHeatmapData,
  analyzeTrends,
  calculateCorrelations,
  analyzeProductivityPatterns,
  analyzeDependencies,
  createGoal,
  updateGoalProgress,
  type Habit,
  type HeatmapData,
  type TrendData,
  type CorrelationData,
  type ProductivityPattern,
  type DependencyData,
  type Goal,
} from '../utils/analyticsUtils';

interface AnalyticsDashboardProps {
  habits: Habit[];
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ habits, open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('habitGoals');
    return saved ? JSON.parse(saved) : [];
  });
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    habitId: '',
    targetStreak: 7,
    targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  });

  // Calculate analytics data
  const heatmapData = useMemo(() => generateHeatmapData(habits, selectedYear), [habits, selectedYear]);
  const trendData = useMemo(() => analyzeTrends(habits), [habits]);
  const correlationData = useMemo(() => calculateCorrelations(habits), [habits]);
  const productivityPatterns = useMemo(() => analyzeProductivityPatterns(habits), [habits]);
  const dependencyData = useMemo(() => analyzeDependencies(habits), [habits]);

  // Update goals when habits change
  useEffect(() => {
    const updatedGoals = updateGoalProgress(goals, habits);
    setGoals(updatedGoals);
    localStorage.setItem('habitGoals', JSON.stringify(updatedGoals));
  }, [habits]);

  const handleCreateGoal = () => {
    if (!newGoal.habitId) return;
    
    const habit = habits.find(h => h.id === newGoal.habitId);
    if (!habit) return;
    
    const goal = createGoal(
      newGoal.habitId,
      habit.name,
      newGoal.targetStreak,
      new Date(newGoal.targetDate)
    );
    
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('habitGoals', JSON.stringify(updatedGoals));
    
    setGoalDialogOpen(false);
    setNewGoal({
      habitId: '',
      targetStreak: 7,
      targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
    });
  };

  const getHeatmapColor = (level: number) => {
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    return colors[level] || colors[0];
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'declining': return <TrendingDownIcon color="error" />;
      default: return <TrendingFlatIcon color="action" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'improving': return 'success';
      case 'declining': return 'error';
      default: return 'default';
    }
  };

  const renderHeatmap = () => {
    const startDate = startOfYear(new Date(selectedYear, 0, 1));
    const weeks: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];
    
    // Add empty cells for the first week if year doesn't start on Sunday
    const firstDayOfWeek = startDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: 0, level: 0, habits: [] });
    }
    
    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: 0, level: 0, habits: [] });
      }
      weeks.push(currentWeek);
    }

    return (
      <Box sx={{ overflowX: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 800 }}>
          {/* Month labels */}
          <Box sx={{ display: 'flex', gap: 1, pl: 4 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <Box key={i} sx={{ width: 60, textAlign: 'center' }}>
                <Typography variant="caption">
                  {format(new Date(selectedYear, i, 1), 'MMM')}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Heatmap grid */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Day labels */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: 30 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <Box key={day} sx={{ height: 12, display: 'flex', alignItems: 'center' }}>
                  {i % 2 === 1 && (
                    <Typography variant="caption" sx={{ fontSize: 10 }}>
                      {day}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
            
            {/* Weeks */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {weeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {week.map((day, dayIndex) => (
                    <Tooltip
                      key={`${weekIndex}-${dayIndex}`}
                      title={day.date ? `${day.date}: ${day.count} habits completed${day.habits.length > 0 ? ` (${day.habits.join(', ')})` : ''}` : ''}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: day.date ? getHeatmapColor(day.level) : 'transparent',
                          borderRadius: 0.5,
                          cursor: day.date ? 'pointer' : 'default',
                          border: day.date === format(new Date(), 'yyyy-MM-dd') ? '2px solid #0969da' : 'none'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Typography variant="caption">Less</Typography>
            {[0, 1, 2, 3, 4].map(level => (
              <Box
                key={level}
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: getHeatmapColor(level),
                  borderRadius: 0.5
                }}
              />
            ))}
            <Typography variant="caption">More</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon />
        Analytics Dashboard
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable">
            <Tab icon={<HeatmapIcon />} label="Progress Heatmap" />
            <Tab icon={<TimelineIcon />} label="Trends" />
            <Tab icon={<LinkIcon />} label="Correlations" />
            <Tab icon={<ScheduleIcon />} label="Patterns" />
            <Tab icon={<GoalIcon />} label="Goals" />
            <Tab icon={<GroupIcon />} label="Dependencies" />
          </Tabs>

          {/* Progress Heatmap Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">Habit Completion Heatmap</Typography>
              <FormControl size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value as number)}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
            
            <Card>
              <CardContent>
                {renderHeatmap()}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Darker squares indicate days with higher habit completion rates. 
                  Click on any square to see which habits were completed that day.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Trends Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>Habit Trends (Last 8 Weeks)</Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 3 
            }}>
              {trendData.map((trend) => (
                <Card key={trend.habitId}>
                  <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {getTrendIcon(trend.direction)}
                        <Typography variant="h6">{trend.habitName}</Typography>
                        <Chip
                          label={trend.direction}
                          color={getTrendColor(trend.direction) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {Math.abs(trend.changePercentage).toFixed(1)}% change from previous 4 weeks
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Current Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(trend.currentRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={trend.currentRate * 100}
                        color={getTrendColor(trend.direction) as any}
                      />
                      
                      {/* Weekly completion rates chart */}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 2, alignItems: 'end' }}>
                        {trend.weeklyCompletionRates.map((rate, index) => (
                          <Tooltip key={index} title={`Week ${index + 1}: ${(rate * 100).toFixed(1)}%`}>
                            <Box
                              sx={{
                                width: 20,
                                height: Math.max(4, rate * 40),
                                backgroundColor: getTrendColor(trend.direction) === 'success' ? 'success.main' :
                                                getTrendColor(trend.direction) === 'error' ? 'error.main' : 'grey.500',
                                borderRadius: 0.5,
                                opacity: 0.7
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
              ))}
            </Box>
          </TabPanel>

          {/* Correlations Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Habit Correlations</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Discover which habits tend to boost or interfere with each other.
            </Typography>
            
            {correlationData.length === 0 ? (
              <Alert severity="info">
                Not enough data to calculate correlations. Complete habits for at least a week to see patterns.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {correlationData.map((correlation, index) => (
                  <Card key={index} sx={{ 
                    borderLeft: `4px solid ${
                      correlation.correlationScore > 0.5 ? '#4caf50' : 
                      correlation.correlationScore < -0.3 ? '#f44336' : '#ff9800'
                    }`
                  }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="h6">{correlation.habit1Name}</Typography>
                          <LinkIcon />
                          <Typography variant="h6">{correlation.habit2Name}</Typography>
                          <Chip
                            label={`${(correlation.correlationScore * 100).toFixed(0)}%`}
                            color={
                              correlation.correlationScore > 0.5 ? 'success' :
                              correlation.correlationScore < -0.3 ? 'error' : 'warning'
                            }
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {correlation.description}
                        </Typography>
                      </CardContent>
                    </Card>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Productivity Patterns Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Weekly Productivity Patterns</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Discover your most and least productive days of the week.
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 3 
            }}>
              {productivityPatterns.map((pattern) => (
                <Card key={pattern.dayOfWeek}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{pattern.dayName}</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Completion Rate
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pattern.averageCompletionRate * 100}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        color={
                          pattern.averageCompletionRate > 0.8 ? 'success' :
                          pattern.averageCompletionRate > 0.6 ? 'warning' : 'error'
                        }
                      />
                      <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                        {(pattern.averageCompletionRate * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Completions: {pattern.totalCompletions}
                    </Typography>
                    
                    {pattern.bestHabits.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          Best Habits:
                        </Typography>
                        {pattern.bestHabits.slice(0, 2).map((habit, index) => (
                          <Chip key={index} label={habit} size="small" color="success" sx={{ mr: 0.5, mt: 0.5 }} />
                        ))}
                      </Box>
                    )}
                    
                    {pattern.worstHabits.length > 0 && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          Needs Attention:
                        </Typography>
                        {pattern.worstHabits.slice(0, 2).map((habit, index) => (
                          <Chip key={index} label={habit} size="small" color="error" sx={{ mr: 0.5, mt: 0.5 }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>

          {/* Goals Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Habit Goals</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setGoalDialogOpen(true)}
              >
                Add Goal
              </Button>
            </Box>
            
            {goals.length === 0 ? (
              <Alert severity="info">
                No goals set yet. Create your first goal to track specific habit targets!
              </Alert>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: 2 
              }}>
                {goals.map((goal) => (
                  <Card key={goal.id} sx={{ borderLeft: `4px solid ${goal.isCompleted ? '#4caf50' : '#2196f3'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <GoalIcon />
                        <Typography variant="h6">{goal.habitName}</Typography>
                        {goal.isCompleted && (
                          <Chip label="Completed" color="success" size="small" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Target: {goal.targetStreak} day streak by {format(goal.targetDate, 'MMM dd, yyyy')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {goal.currentProgress}/{goal.targetStreak} days
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (goal.currentProgress / goal.targetStreak) * 100)}
                        color={goal.isCompleted ? 'success' : 'primary'}
                      />
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Created on {format(goal.createdAt, 'MMM dd, yyyy')}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Dependencies Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>Habit Dependencies</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Habits grouped by category that tend to succeed or fail together.
            </Typography>
            
            {dependencyData.length === 0 ? (
              <Alert severity="info">
                Not enough data to analyze dependencies. Complete habits for at least a week to see patterns.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {dependencyData.map((dependency, index) => (
                  <Card key={index} sx={{ 
                    borderLeft: `4px solid ${
                      dependency.failureRate > 0.5 ? '#f44336' : 
                      dependency.failureRate > 0.3 ? '#ff9800' : '#4caf50'
                    }`
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <GroupIcon />
                        <Typography variant="h6">{dependency.groupId} Habits</Typography>
                        <Chip
                          label={`${(dependency.failureRate * 100).toFixed(0)}% group failure rate`}
                          color={
                            dependency.failureRate > 0.5 ? 'error' :
                            dependency.failureRate > 0.3 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Average group completion: {(dependency.averageGroupCompletion * 100).toFixed(1)}%
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {dependency.habits.map((habit, idx) => (
                          <Chip
                            key={idx}
                            label={habit}
                            size="small"
                            variant={
                              habit === dependency.strongestLink ? 'filled' :
                              habit === dependency.weakestLink ? 'outlined' : 'filled'
                            }
                            color={
                              habit === dependency.strongestLink ? 'success' :
                              habit === dependency.weakestLink ? 'error' : 'default'
                            }
                          />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography variant="body2">
                          <strong>Strongest:</strong> {dependency.strongestLink}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Weakest:</strong> {dependency.weakestLink}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Goal Creation Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Habit</InputLabel>
              <Select
                value={newGoal.habitId}
                label="Select Habit"
                onChange={(e) => setNewGoal({ ...newGoal, habitId: e.target.value })}
              >
                {habits.map((habit) => (
                  <MenuItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Target Streak (days)"
              type="number"
              value={newGoal.targetStreak}
              onChange={(e) => setNewGoal({ ...newGoal, targetStreak: parseInt(e.target.value) || 7 })}
              inputProps={{ min: 1, max: 365 }}
            />
            
            <TextField
              label="Target Date"
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGoal} variant="contained" disabled={!newGoal.habitId}>
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AnalyticsDashboard;
