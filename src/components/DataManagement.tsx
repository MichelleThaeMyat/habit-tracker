import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  GetApp as ExportIcon,
  Publish as ImportIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FileCopy as CopyIcon,
  Backup as BackupIcon,
  Storage as StorageIcon,
  LibraryBooks as TemplateIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

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
  archived?: boolean;
  archivedAt?: Date;
}

interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scheduledDays: number[];
  notes: string;
  tags: string[];
  createdBy: string;
  downloads: number;
  rating: number;
}

interface DataManagementProps {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  onHabitsUpdate: (habits: Habit[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({
  open,
  onClose,
  habits,
  onHabitsUpdate,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [selectedHabitForTemplate, setSelectedHabitForTemplate] = useState<string>('');
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [cloudProvider, setCloudProvider] = useState<'google' | 'dropbox' | 'icloud'>('google');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Load archived habits on component mount
  React.useEffect(() => {
    const savedArchived = localStorage.getItem('archivedHabits');
    if (savedArchived) {
      try {
        const parsed = JSON.parse(savedArchived).map((habit: any) => ({
          ...habit,
          createdAt: new Date(habit.createdAt),
          archivedAt: habit.archivedAt ? new Date(habit.archivedAt) : undefined,
        }));
        setArchivedHabits(parsed);
      } catch (error) {
        console.error('Error loading archived habits:', error);
      }
    }
  }, []);

  // Export functionality
  const exportData = (fileFormat: 'json' | 'csv') => {
    setIsLoading(true);
    try {
      const allData = {
        habits,
        archivedHabits,
        achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
        friends: JSON.parse(localStorage.getItem('friends') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      if (fileFormat === 'json') {
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `habit-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else if (fileFormat === 'csv') {
        const csvContent = convertToCSV(habits);
        const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
        const exportFileDefaultName = `habits-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }

      showSnackbar('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Failed to export data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToCSV = (habits: Habit[]): string => {
    const headers = ['Name', 'Category', 'Difficulty', 'Current Streak', 'Best Streak', 'Created Date', 'Completed Today', 'Notes'];
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const rows = habits.map(habit => [
      habit.name,
      habit.category,
      habit.difficulty,
      habit.currentStreak,
      habit.bestStreak,
      format(habit.createdAt, 'yyyy-MM-dd'),
      habit.weeklyProgress[today] ? 'Yes' : 'No',
      habit.notes || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  // Import functionality
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const importedData = JSON.parse(content);
          
          // Validate imported data structure
          if (importedData.habits && Array.isArray(importedData.habits)) {
            const processedHabits = importedData.habits.map((habit: any) => ({
              ...habit,
              id: habit.id || String(Date.now() + Math.random()),
              createdAt: new Date(habit.createdAt),
            }));
            
            onHabitsUpdate([...habits, ...processedHabits]);
            
            // Import archived habits if present
            if (importedData.archivedHabits) {
              const processedArchived = importedData.archivedHabits.map((habit: any) => ({
                ...habit,
                createdAt: new Date(habit.createdAt),
                archivedAt: habit.archivedAt ? new Date(habit.archivedAt) : new Date(),
              }));
              setArchivedHabits(prev => [...prev, ...processedArchived]);
              localStorage.setItem('archivedHabits', JSON.stringify([...archivedHabits, ...processedArchived]));
            }
            
            // Import other data
            if (importedData.achievements) {
              localStorage.setItem('achievements', JSON.stringify(importedData.achievements));
            }
            if (importedData.friends) {
              localStorage.setItem('friends', JSON.stringify(importedData.friends));
            }
            
            showSnackbar('Data imported successfully!', 'success');
          } else {
            throw new Error('Invalid data format');
          }
        } else if (file.name.endsWith('.csv')) {
          const csvHabits = parseCSV(content);
          onHabitsUpdate([...habits, ...csvHabits]);
          showSnackbar('CSV imported successfully!', 'success');
        }
      } catch (error) {
        console.error('Import error:', error);
        showSnackbar('Failed to import data. Please check file format.', 'error');
      } finally {
        setIsLoading(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (csvContent: string): Habit[] => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        return {
          id: String(Date.now() + index),
          name: values[0] || `Imported Habit ${index + 1}`,
          category: values[1] || 'General',
          difficulty: (values[2] as 'easy' | 'medium' | 'hard') || 'medium',
          currentStreak: parseInt(values[3]) || 0,
          bestStreak: parseInt(values[4]) || 0,
          createdAt: values[5] ? new Date(values[5]) : new Date(),
          notes: values[7] || '',
          completed: false,
          weeklyProgress: {},
          scheduledDays: [1, 2, 3, 4, 5, 6, 0],
          description: '',
        };
      });
  };

  // Cloud backup functionality
  const backupToCloud = async () => {
    setIsLoading(true);
    try {
      const backupData = {
        habits,
        archivedHabits,
        achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
        friends: JSON.parse(localStorage.getItem('friends') || '[]'),
        backupDate: new Date().toISOString(),
        version: '1.0',
      };

      // Simulate cloud backup (in real implementation, this would use actual cloud APIs)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store backup info locally
      const backupInfo = {
        date: new Date().toISOString(),
        provider: cloudProvider,
        size: JSON.stringify(backupData).length,
      };
      
      localStorage.setItem('lastCloudBackup', JSON.stringify(backupInfo));
      showSnackbar(`Data backed up to ${cloudProvider.charAt(0).toUpperCase() + cloudProvider.slice(1)} successfully!`, 'success');
    } catch (error) {
      console.error('Cloud backup error:', error);
      showSnackbar('Failed to backup to cloud', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromCloud = async () => {
    setIsLoading(true);
    try {
      // Simulate cloud restore (in real implementation, this would fetch from actual cloud APIs)
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSnackbar(`Data restored from ${cloudProvider.charAt(0).toUpperCase() + cloudProvider.slice(1)} successfully!`, 'success');
    } catch (error) {
      console.error('Cloud restore error:', error);
      showSnackbar('Failed to restore from cloud', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Template sharing functionality
  const createTemplate = () => {
    const selectedHabit = habits.find(h => h.id === selectedHabitForTemplate);
    if (!selectedHabit || !templateName.trim()) return;

    const newTemplate: HabitTemplate = {
      id: String(Date.now()),
      name: templateName.trim(),
      description: templateDescription.trim(),
      category: selectedHabit.category,
      difficulty: selectedHabit.difficulty,
      scheduledDays: selectedHabit.scheduledDays,
      notes: selectedHabit.notes,
      tags: templateTags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdBy: 'You',
      downloads: 0,
      rating: 5,
    };

    // Save to local templates
    const existingTemplates = JSON.parse(localStorage.getItem('sharedTemplates') || '[]');
    localStorage.setItem('sharedTemplates', JSON.stringify([...existingTemplates, newTemplate]));

    // Reset form
    setTemplateName('');
    setTemplateDescription('');
    setTemplateTags('');
    setSelectedHabitForTemplate('');

    showSnackbar('Template created and shared successfully!', 'success');
  };

  // Archive functionality
  const archiveHabit = (habitId: string) => {
    const habitToArchive = habits.find(h => h.id === habitId);
    if (!habitToArchive) return;

    const archivedHabit = {
      ...habitToArchive,
      archived: true,
      archivedAt: new Date(),
    };

    // Remove from active habits
    const updatedHabits = habits.filter(h => h.id !== habitId);
    onHabitsUpdate(updatedHabits);

    // Add to archived habits
    const updatedArchived = [...archivedHabits, archivedHabit];
    setArchivedHabits(updatedArchived);
    localStorage.setItem('archivedHabits', JSON.stringify(updatedArchived));

    showSnackbar('Habit archived successfully!', 'success');
  };

  const restoreHabit = (habitId: string) => {
    const habitToRestore = archivedHabits.find(h => h.id === habitId);
    if (!habitToRestore) return;

    const restoredHabit = {
      ...habitToRestore,
      archived: false,
      archivedAt: undefined,
    };

    // Remove from archived habits
    const updatedArchived = archivedHabits.filter(h => h.id !== habitId);
    setArchivedHabits(updatedArchived);
    localStorage.setItem('archivedHabits', JSON.stringify(updatedArchived));

    // Add back to active habits
    onHabitsUpdate([...habits, restoredHabit]);

    showSnackbar('Habit restored successfully!', 'success');
  };

  const permanentDeleteHabit = (habitId: string) => {
    const updatedArchived = archivedHabits.filter(h => h.id !== habitId);
    setArchivedHabits(updatedArchived);
    localStorage.setItem('archivedHabits', JSON.stringify(updatedArchived));
    showSnackbar('Habit permanently deleted!', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getLastBackupInfo = () => {
    const lastBackup = localStorage.getItem('lastCloudBackup');
    if (lastBackup) {
      try {
        return JSON.parse(lastBackup);
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon color="primary" />
              <Typography variant="h6">Data Management</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab icon={<ExportIcon />} label="Import/Export" />
            <Tab icon={<BackupIcon />} label="Cloud Backup" />
            <Tab icon={<TemplateIcon />} label="Templates" />
            <Tab icon={<ArchiveIcon />} label="Archive" />
          </Tabs>

          {/* Import/Export Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Import/Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Export your habit data for backup or import data from another device.
              </Typography>

              <Stack spacing={3}>
                {/* Export Section */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Export Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download your habits, achievements, and settings.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<ExportIcon />}
                        onClick={() => exportData('json')}
                        disabled={isLoading}
                      >
                        Export as JSON
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={() => exportData('csv')}
                        disabled={isLoading}
                      >
                        Export as CSV
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Import Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Import habits and data from a backup file.
                    </Typography>
                    <input
                      accept=".json,.csv"
                      style={{ display: 'none' }}
                      id="import-file"
                      type="file"
                      onChange={importData}
                    />
                    <label htmlFor="import-file">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<ImportIcon />}
                        disabled={isLoading}
                      >
                        Choose File to Import
                      </Button>
                    </label>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}

          {/* Cloud Backup Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cloud Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Backup your data to cloud storage for safekeeping and cross-device sync.
              </Typography>

              <Stack spacing={3}>
                {/* Cloud Provider Selection */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cloud Provider
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Provider</InputLabel>
                      <Select
                        value={cloudProvider}
                        label="Select Provider"
                        onChange={(e) => setCloudProvider(e.target.value as any)}
                      >
                        <MenuItem value="google">Google Drive</MenuItem>
                        <MenuItem value="dropbox">Dropbox</MenuItem>
                        <MenuItem value="icloud">iCloud</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {getLastBackupInfo() && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Last backup: {format(new Date(getLastBackupInfo().date), 'PPp')} 
                        to {getLastBackupInfo().provider}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                        onClick={backupToCloud}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Backing up...' : 'Backup to Cloud'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={isLoading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                        onClick={restoreFromCloud}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Restoring...' : 'Restore from Cloud'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}

          {/* Templates Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Share Habit Templates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create templates from your habits to share with others.
              </Typography>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Create New Template
                  </Typography>
                  
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Select Habit</InputLabel>
                      <Select
                        value={selectedHabitForTemplate}
                        label="Select Habit"
                        onChange={(e) => setSelectedHabitForTemplate(e.target.value)}
                      >
                        {habits.map((habit) => (
                          <MenuItem key={habit.id} value={habit.id}>
                            {habit.name} ({habit.category})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Template Name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      fullWidth
                    />

                    <TextField
                      label="Description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                    />

                    <TextField
                      label="Tags (comma separated)"
                      value={templateTags}
                      onChange={(e) => setTemplateTags(e.target.value)}
                      placeholder="fitness, morning routine, productivity"
                      fullWidth
                    />

                    <Button
                      variant="contained"
                      startIcon={<ShareIcon />}
                      onClick={createTemplate}
                      disabled={!selectedHabitForTemplate || !templateName.trim()}
                    >
                      Create & Share Template
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Archive Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Archive & Restore Habits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Archive old habits to keep your list clean, or restore archived habits.
              </Typography>

              <Stack spacing={3}>
                {/* Active Habits for Archiving */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Active Habits ({habits.length})
                    </Typography>
                    {habits.length > 0 ? (
                      <List>
                        {habits.map((habit) => (
                          <ListItem key={habit.id}>
                            <ListItemText
                              primary={habit.name}
                              secondary={`${habit.category} • Created ${format(habit.createdAt, 'PP')}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => archiveHabit(habit.id)}
                                color="warning"
                              >
                                <ArchiveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No active habits to archive.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Archived Habits */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Archived Habits ({archivedHabits.length})
                    </Typography>
                    {archivedHabits.length > 0 ? (
                      <List>
                        {archivedHabits.map((habit) => (
                          <ListItem key={habit.id}>
                            <ListItemText
                              primary={habit.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" component="div">
                                    {habit.category} • Archived {habit.archivedAt ? format(habit.archivedAt, 'PP') : 'Unknown date'}
                                  </Typography>
                                  <Chip size="small" label="Archived" color="warning" variant="outlined" />
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => restoreHabit(habit.id)}
                                color="success"
                                sx={{ mr: 1 }}
                              >
                                <RestoreIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => permanentDeleteHabit(habit.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No archived habits.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DataManagement;
