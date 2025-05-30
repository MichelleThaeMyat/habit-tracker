import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';

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
      id={`reminder-tabpanel-${index}`}
      aria-labelledby={`reminder-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reminder-tab-${index}`,
    'aria-controls': `reminder-tabpanel-${index}`,
  };
}

interface HabitChain {
  id: string;
  triggerHabitId: string;
  triggerHabitName: string;
  targetHabitId: string;
  targetHabitName: string;
}

interface Reminder {
  id: string;
  habitId: string;
  habitName: string;
  type: 'browser' | 'email';
  time: string;
  days: number[];
  active: boolean;
  message?: string;
  email?: string;
}

interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

interface SmartRemindersProps {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
}

const SmartReminders: React.FC<SmartRemindersProps> = ({ open, onClose, habits }) => {
  const [tabValue, setTabValue] = useState(0);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [habitChains, setHabitChains] = useState<HabitChain[]>([]);
  const [emailAddress, setEmailAddress] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    habitId: '',
    type: 'browser',
    time: '08:00',
    days: [1, 2, 3, 4, 5],
    active: true,
  });
  const [editingChain, setEditingChain] = useState<HabitChain | null>(null);
  const [newChain, setNewChain] = useState<Partial<HabitChain>>({
    triggerHabitId: '',
    targetHabitId: '',
  });

  const DAYS_OF_WEEK = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  // Load saved reminders from localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders');
    const savedChains = localStorage.getItem('habitChains');
    const savedSettings = localStorage.getItem('reminderSettings');
    
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
    
    if (savedChains) {
      setHabitChains(JSON.parse(savedChains));
    }

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setBrowserNotificationsEnabled(settings.browserNotifications || false);
      setEmailRemindersEnabled(settings.emailReminders || false);
      setEmailAddress(settings.email || '');
    }

    // Check if browser notifications are supported and permissions
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setBrowserNotificationsEnabled(true);
      }
    }
  }, []);

  // Save reminders, chains, and settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('habitChains', JSON.stringify(habitChains));
    localStorage.setItem('reminderSettings', JSON.stringify({
      browserNotifications: browserNotificationsEnabled,
      emailReminders: emailRemindersEnabled,
      email: emailAddress,
    }));
  }, [reminders, habitChains, browserNotificationsEnabled, emailRemindersEnabled, emailAddress]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationsEnabled(true);
        setSnackbarMessage('Browser notifications enabled');
        setSnackbarOpen(true);
      } else {
        setBrowserNotificationsEnabled(false);
        setSnackbarMessage('Browser notification permission denied');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Browser notifications not supported');
      setSnackbarOpen(true);
    }
  };

  const handleBrowserNotificationToggle = () => {
    if (!browserNotificationsEnabled) {
      requestNotificationPermission();
    } else {
      setBrowserNotificationsEnabled(false);
    }
  };

  const handleEmailReminderToggle = () => {
    setEmailRemindersEnabled(!emailRemindersEnabled);
    if (!emailRemindersEnabled && !emailAddress) {
      setSnackbarMessage('Please set your email address');
      setSnackbarOpen(true);
    }
  };

  const addReminder = () => {
    if (!newReminder.habitId) {
      setSnackbarMessage('Please select a habit');
      setSnackbarOpen(true);
      return;
    }

    const selectedHabit = habits.find(h => h.id === newReminder.habitId);
    
    if (!selectedHabit) {
      setSnackbarMessage('Selected habit not found');
      setSnackbarOpen(true);
      return;
    }

    const reminder: Reminder = {
      id: `rem_${Date.now()}`,
      habitId: newReminder.habitId!,
      habitName: selectedHabit.name,
      type: newReminder.type || 'browser',
      time: newReminder.time || '08:00',
      days: newReminder.days || [1, 2, 3, 4, 5],
      active: true,
      message: newReminder.message,
      email: newReminder.type === 'email' ? emailAddress : undefined,
    };

    setReminders([...reminders, reminder]);
    setNewReminder({
      habitId: '',
      type: 'browser',
      time: '08:00',
      days: [1, 2, 3, 4, 5],
      active: true,
    });

    setSnackbarMessage('Reminder created');
    setSnackbarOpen(true);
  };

  const updateReminder = () => {
    if (!editingReminder) return;

    const updatedReminders = reminders.map(reminder => 
      reminder.id === editingReminder.id ? editingReminder : reminder
    );

    setReminders(updatedReminders);
    setEditingReminder(null);
    setSnackbarMessage('Reminder updated');
    setSnackbarOpen(true);
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
    setSnackbarMessage('Reminder deleted');
    setSnackbarOpen(true);
  };

  const addHabitChain = () => {
    if (!newChain.triggerHabitId || !newChain.targetHabitId) {
      setSnackbarMessage('Please select both trigger and target habits');
      setSnackbarOpen(true);
      return;
    }

    if (newChain.triggerHabitId === newChain.targetHabitId) {
      setSnackbarMessage('Trigger and target habits must be different');
      setSnackbarOpen(true);
      return;
    }

    const triggerHabit = habits.find(h => h.id === newChain.triggerHabitId);
    const targetHabit = habits.find(h => h.id === newChain.targetHabitId);
    
    if (!triggerHabit || !targetHabit) {
      setSnackbarMessage('Selected habits not found');
      setSnackbarOpen(true);
      return;
    }

    const chain: HabitChain = {
      id: `chain_${Date.now()}`,
      triggerHabitId: newChain.triggerHabitId,
      triggerHabitName: triggerHabit.name,
      targetHabitId: newChain.targetHabitId,
      targetHabitName: targetHabit.name,
    };

    setHabitChains([...habitChains, chain]);
    setNewChain({
      triggerHabitId: '',
      targetHabitId: '',
    });

    setSnackbarMessage('Habit chain created');
    setSnackbarOpen(true);
  };

  const updateHabitChain = () => {
    if (!editingChain) return;

    const updatedChains = habitChains.map(chain => 
      chain.id === editingChain.id ? editingChain : chain
    );

    setHabitChains(updatedChains);
    setEditingChain(null);
    setSnackbarMessage('Habit chain updated');
    setSnackbarOpen(true);
  };

  const deleteHabitChain = (id: string) => {
    setHabitChains(habitChains.filter(chain => chain.id !== id));
    setSnackbarMessage('Habit chain deleted');
    setSnackbarOpen(true);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { 
          minHeight: '70vh',
          borderRadius: 2
        } 
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Smart Reminders</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="reminder tabs">
            <Tab icon={<NotificationsIcon />} label="Browser Notifications" {...a11yProps(0)} />
            <Tab icon={<EmailIcon />} label="Email Reminders" {...a11yProps(1)} />
            <Tab icon={<ScheduleIcon />} label="Reminder Times" {...a11yProps(2)} />
            <Tab icon={<LinkIcon />} label="Habit Chains" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* Browser Notifications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={browserNotificationsEnabled}
                  onChange={handleBrowserNotificationToggle}
                  color="primary"
                />
              }
              label="Enable browser notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Browser notifications will remind you about your habits directly in your browser,
              even when the application is in the background.
            </Typography>
          </Box>
          
          {browserNotificationsEnabled && (
            <>
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1">Test Browser Notification</Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 1 }}
                  onClick={() => {
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('Habit Tracker Notification Test', {
                        body: 'This is a test notification from your Habit Tracker app',
                        icon: '/logo192.png'
                      });
                    }
                  }}
                >
                  Send Test Notification
                </Button>
              </Box>
            </>
          )}

          {!browserNotificationsEnabled && 'Notification' in window && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Enable browser notifications to get reminded about your habits directly in your browser.
            </Alert>
          )}

          {!('Notification' in window) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your browser doesn't support notifications.
            </Alert>
          )}
        </TabPanel>

        {/* Email Reminders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={emailRemindersEnabled}
                  onChange={handleEmailReminderToggle}
                  color="primary"
                />
              }
              label="Enable email reminders"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Email reminders will be sent to your specified email address to help you remember your habits.
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              disabled={!emailRemindersEnabled}
              type="email"
              variant="outlined"
              helperText={!emailAddress && emailRemindersEnabled ? "Please enter your email address" : ""}
              error={!emailAddress && emailRemindersEnabled}
            />
          </Box>
          
          {emailRemindersEnabled && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Note: This is a frontend demo. In a production environment, this would connect to a backend service to schedule and send email reminders.
            </Alert>
          )}
        </TabPanel>

        {/* Reminder Times Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box mb={3}>
            <Typography variant="subtitle1">Create New Reminder</Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Habit</InputLabel>
                <Select
                  value={newReminder.habitId}
                  label="Select Habit"
                  onChange={(e) => setNewReminder({...newReminder, habitId: e.target.value as string})}
                >
                  {habits.map((habit) => (
                    <MenuItem key={habit.id} value={habit.id}>{habit.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Reminder Type</InputLabel>
                <Select
                  value={newReminder.type}
                  label="Reminder Type"
                  onChange={(e) => setNewReminder({...newReminder, type: e.target.value as 'browser' | 'email'})}
                >
                  <MenuItem value="browser">Browser Notification</MenuItem>
                  <MenuItem value="email" disabled={!emailRemindersEnabled || !emailAddress}>Email Reminder</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Time"
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Days of Week</InputLabel>
                <Select
                  multiple
                  value={newReminder.days}
                  label="Days of Week"
                  onChange={(e) => setNewReminder({...newReminder, days: e.target.value as number[]})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={DAYS_OF_WEEK.find(day => day.value === value)?.label} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Custom Message (Optional)"
                fullWidth
                multiline
                rows={2}
                value={newReminder.message || ''}
                onChange={(e) => setNewReminder({...newReminder, message: e.target.value})}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={addReminder}
                disabled={!newReminder.habitId}
              >
                Add Reminder
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Your Reminders</Typography>
          {reminders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reminders set. Create your first reminder above.
            </Typography>
          ) : (
            <List>
              {reminders.map((reminder) => (
                <ListItem key={reminder.id} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {reminder.habitName}
                        {reminder.active ? (
                          <Chip size="small" color="success" label="Active" />
                        ) : (
                          <Chip size="small" color="default" label="Inactive" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {reminder.type === 'browser' ? 'Browser Notification' : 'Email Reminder'} at {reminder.time}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {reminder.days.map((day) => (
                            <Chip
                              key={day}
                              label={DAYS_OF_WEEK.find(d => d.value === day)?.label}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                        {reminder.message && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Message: {reminder.message}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton edge="end" onClick={() => setEditingReminder(reminder)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton edge="end" onClick={() => deleteReminder(reminder.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Reminder Edit Dialog */}
          <Dialog open={!!editingReminder} onClose={() => setEditingReminder(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editingReminder && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Reminder Type</InputLabel>
                      <Select
                        value={editingReminder.type}
                        label="Reminder Type"
                        onChange={(e) => setEditingReminder({
                          ...editingReminder, 
                          type: e.target.value as 'browser' | 'email'
                        })}
                      >
                        <MenuItem value="browser">Browser Notification</MenuItem>
                        <MenuItem value="email" disabled={!emailRemindersEnabled || !emailAddress}>Email Reminder</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Time"
                      type="time"
                      value={editingReminder.time}
                      onChange={(e) => setEditingReminder({...editingReminder, time: e.target.value})}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Days of Week</InputLabel>
                      <Select
                        multiple
                        value={editingReminder.days}
                        label="Days of Week"
                        onChange={(e) => setEditingReminder({...editingReminder, days: e.target.value as number[]})}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as number[]).map((value) => (
                              <Chip 
                                key={value} 
                                label={DAYS_OF_WEEK.find(day => day.value === value)?.label} 
                                size="small" 
                              />
                            ))}
                          </Box>
                        )}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <MenuItem key={day.value} value={day.value}>
                            {day.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Custom Message (Optional)"
                      fullWidth
                      multiline
                      rows={2}
                      value={editingReminder.message || ''}
                      onChange={(e) => setEditingReminder({...editingReminder, message: e.target.value})}
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editingReminder.active}
                          onChange={(e) => setEditingReminder({...editingReminder, active: e.target.checked})}
                          color="primary"
                        />
                      }
                      label="Active"
                    />
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingReminder(null)}>Cancel</Button>
              <Button onClick={updateReminder} color="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* Habit Chains Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box mb={3}>
            <Typography variant="subtitle1">Create New Habit Chain</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Habit chains let you unlock a target habit only after completing a trigger habit.
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Trigger Habit</InputLabel>
                <Select
                  value={newChain.triggerHabitId}
                  label="Trigger Habit"
                  onChange={(e) => setNewChain({...newChain, triggerHabitId: e.target.value as string})}
                >
                  {habits.map((habit) => (
                    <MenuItem key={habit.id} value={habit.id}>{habit.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Target Habit (to unlock)</InputLabel>
                <Select
                  value={newChain.targetHabitId}
                  label="Target Habit (to unlock)"
                  onChange={(e) => setNewChain({...newChain, targetHabitId: e.target.value as string})}
                >
                  {habits.map((habit) => (
                    <MenuItem 
                      key={habit.id} 
                      value={habit.id}
                      disabled={habit.id === newChain.triggerHabitId}
                    >
                      {habit.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={addHabitChain}
                disabled={!newChain.triggerHabitId || !newChain.targetHabitId || (newChain.triggerHabitId === newChain.targetHabitId)}
              >
                Create Chain
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Your Habit Chains</Typography>
          {habitChains.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No habit chains yet. Create your first chain above.
            </Typography>
          ) : (
            <List>
              {habitChains.map((chain) => (
                <ListItem key={chain.id} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{chain.triggerHabitName}</Typography>
                        <LinkIcon fontSize="small" />
                        <Typography>{chain.targetHabitName}</Typography>
                      </Box>
                    }
                    secondary="Completing the first habit will unlock the second"
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton edge="end" onClick={() => setEditingChain(chain)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton edge="end" onClick={() => deleteHabitChain(chain.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Chain Edit Dialog */}
          <Dialog open={!!editingChain} onClose={() => setEditingChain(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Habit Chain</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editingChain && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Trigger Habit</InputLabel>
                      <Select
                        value={editingChain.triggerHabitId}
                        label="Trigger Habit"
                        onChange={(e) => setEditingChain({
                          ...editingChain,
                          triggerHabitId: e.target.value as string,
                          triggerHabitName: habits.find(h => h.id === e.target.value)?.name || editingChain.triggerHabitName
                        })}
                      >
                        {habits.map((habit) => (
                          <MenuItem 
                            key={habit.id} 
                            value={habit.id}
                            disabled={habit.id === editingChain.targetHabitId}
                          >
                            {habit.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Target Habit (to unlock)</InputLabel>
                      <Select
                        value={editingChain.targetHabitId}
                        label="Target Habit (to unlock)"
                        onChange={(e) => setEditingChain({
                          ...editingChain,
                          targetHabitId: e.target.value as string,
                          targetHabitName: habits.find(h => h.id === e.target.value)?.name || editingChain.targetHabitName
                        })}
                      >
                        {habits.map((habit) => (
                          <MenuItem 
                            key={habit.id} 
                            value={habit.id}
                            disabled={habit.id === editingChain.triggerHabitId}
                          >
                            {habit.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingChain(null)}>Cancel</Button>
              <Button onClick={updateHabitChain} color="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Dialog>
  );
};

export default SmartReminders;
