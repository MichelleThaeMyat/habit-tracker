import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Share as ShareIcon,
  Leaderboard as LeaderboardIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface Friend {
  id: string;
  name: string;
  level: number;
  totalPoints: number;
  currentStreak: number;
  avatar?: string;
  lastActive: Date;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  totalPoints: number;
  currentStreak: number;
  completedHabits: number;
  avatar?: string;
  rank: number;
}

interface SocialFeaturesProps {
  open: boolean;
  onClose: () => void;
  userProfile: {
    totalPoints: number;
    level: number;
    experiencePoints: number;
    experienceToNextLevel: number;
  };
  habits: any[];
}

// Mock data for demonstration
const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Alex Chen',
    level: 8,
    totalPoints: 750,
    currentStreak: 12,
    lastActive: new Date(),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    level: 6,
    totalPoints: 520,
    currentStreak: 8,
    lastActive: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    level: 10,
    totalPoints: 980,
    currentStreak: 25,
    lastActive: new Date(Date.now() - 172800000), // 2 days ago
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    level: 15,
    totalPoints: 1450,
    currentStreak: 45,
    completedHabits: 289,
    rank: 1,
  },
  {
    id: '2',
    name: 'David Kim',
    level: 12,
    totalPoints: 1180,
    currentStreak: 32,
    completedHabits: 236,
    rank: 2,
  },
  {
    id: '3',
    name: 'Lisa Garcia',
    level: 11,
    totalPoints: 1050,
    currentStreak: 28,
    completedHabits: 210,
    rank: 3,
  },
  {
    id: '4',
    name: 'Mike Rodriguez',
    level: 10,
    totalPoints: 980,
    currentStreak: 25,
    completedHabits: 196,
    rank: 4,
  },
  {
    id: '5',
    name: 'You',
    level: 5,
    totalPoints: 450,
    currentStreak: 15,
    completedHabits: 90,
    rank: 5,
  },
];

const SocialFeatures: React.FC<SocialFeaturesProps> = ({
  open,
  onClose,
  userProfile,
  habits,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [leaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const generateFriendCode = () => {
    return `HT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  };

  const [userFriendCode] = useState(generateFriendCode());

  const handleAddFriend = () => {
    if (friendCode.trim()) {
      // In a real app, this would make an API call
      const newFriend: Friend = {
        id: Date.now().toString(),
        name: `Friend ${Math.floor(Math.random() * 1000)}`,
        level: Math.floor(Math.random() * 10) + 1,
        totalPoints: Math.floor(Math.random() * 1000),
        currentStreak: Math.floor(Math.random() * 30),
        lastActive: new Date(),
      };
      setFriends([...friends, newFriend]);
      setFriendCode('');
      setAddFriendOpen(false);
      setSnackbarMessage('Friend added successfully!');
      setSnackbarOpen(true);
    }
  };

  const copyFriendCode = () => {
    navigator.clipboard.writeText(userFriendCode);
    setSnackbarMessage('Friend code copied to clipboard!');
    setSnackbarOpen(true);
  };

  const shareProgress = async () => {
    if (isSharing) {
      return; // Prevent multiple simultaneous shares
    }

    const completedHabits = habits.reduce((sum, habit) => 
      sum + Object.values(habit.weeklyProgress || {}).filter(Boolean).length, 0
    );
    
    const shareText = `🏆 Check out my habit tracking progress!\n\n` +
      `📊 Level: ${userProfile.level}\n` +
      `⭐ Points: ${userProfile.totalPoints}\n` +
      `✅ Completed Habits: ${completedHabits}\n\n` +
      `Join me in building better habits! 💪`;

    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: 'My Habit Tracker Progress',
          text: shareText,
          url: window.location.href,
        });
        setSnackbarMessage('Progress shared successfully!');
        setSnackbarOpen(true);
      } catch (error) {
        // Check if the error is due to user cancellation
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('canceled'))) {
          // User cancelled the share, don't show an error message or log it
          console.log('Share cancelled by user');
          return;
        }
        // For other errors, fall back to clipboard
        console.warn('Share failed, falling back to clipboard:', error);
        try {
          await navigator.clipboard.writeText(shareText);
          setSnackbarMessage('Progress copied to clipboard!');
          setSnackbarOpen(true);
        } catch (clipboardError) {
          console.warn('Clipboard write failed:', clipboardError);
          setSnackbarMessage('Unable to share or copy progress');
          setSnackbarOpen(true);
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareText);
        setSnackbarMessage('Progress copied to clipboard!');
        setSnackbarOpen(true);
      } catch (error) {
        console.warn('Clipboard write failed:', error);
        setSnackbarMessage('Unable to copy to clipboard');
        setSnackbarOpen(true);
      }
    }
  };

  const removeFriend = (friendId: string) => {
    setFriends(friends.filter(f => f.id !== friendId));
    setSnackbarMessage('Friend removed');
    setSnackbarOpen(true);
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver  
      case 3: return '#CD7F32'; // Bronze
      default: return '#9e9e9e'; // Gray
    }
  };

  const getStatusColor = (lastActive: Date) => {
    const now = new Date();
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'success';
    if (diffHours < 72) return 'warning';
    return 'error';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon color="primary" />
            <Typography variant="h6">Social Features</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab icon={<GroupIcon />} label="Friends" />
            <Tab icon={<LeaderboardIcon />} label="Leaderboard" />
            <Tab icon={<ShareIcon />} label="Share" />
          </Tabs>

          {/* Friends Tab */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Your Friends ({friends.length})</Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddFriendOpen(true)}
                >
                  Add Friend
                </Button>
              </Box>

              {/* Your Friend Code */}
              <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Friend Code
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={userFriendCode} 
                      size="medium" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', py: 1 }}
                    />
                    <Tooltip title="Copy code">
                      <IconButton onClick={copyFriendCode}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Share this code with friends so they can add you!
                  </Typography>
                </CardContent>
              </Card>

              {/* Friends List */}
              <List>
                {friends.map((friend) => (
                  <ListItem key={friend.id} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                    <ListItemAvatar>
                      <Badge
                        color={getStatusColor(friend.lastActive)}
                        variant="dot"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar>{friend.name.charAt(0)}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="div">
                            Level {friend.level} • {friend.totalPoints} points
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <FireIcon sx={{ fontSize: 16, color: 'orange' }} />
                            <Typography variant="caption" component="span">
                              {friend.currentStreak} day streak
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeFriend(friend.id)}
                      >
                        Remove
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {friends.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No friends yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add friends to see their progress and motivate each other!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddFriendOpen(true)}
                  >
                    Add Your First Friend
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Leaderboard Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Global Leaderboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                See how you rank against other habit trackers worldwide!
              </Typography>

              <List>
                {leaderboard.map((entry) => (
                  <ListItem 
                    key={entry.id} 
                    sx={{ 
                      bgcolor: entry.name === 'You' ? 'primary.50' : 'background.paper',
                      mb: 1, 
                      borderRadius: 1,
                      border: entry.name === 'You' ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={entry.rank}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: getRankBadgeColor(entry.rank),
                            color: entry.rank <= 3 ? 'black' : 'white',
                          }
                        }}
                      >
                        <Avatar sx={{ bgcolor: entry.name === 'You' ? 'primary.main' : 'grey.500' }}>
                          {entry.rank <= 3 ? <TrophyIcon /> : entry.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" component="span" sx={{ fontWeight: entry.name === 'You' ? 'bold' : 'normal' }}>
                            {entry.name}
                          </Typography>
                          {entry.name === 'You' && <Chip label="You" size="small" color="primary" />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" component="div">
                            Level {entry.level} • {entry.totalPoints} points
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <FireIcon sx={{ fontSize: 16, color: 'orange' }} />
                              <Typography variant="caption" component="span">
                                {entry.currentStreak} streak
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                              <Typography variant="caption" component="span">
                                {entry.completedHabits} habits
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Share Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Share Your Progress
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Inspire others by sharing your habit tracking journey!
              </Typography>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Current Stats
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {userProfile.level}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Level
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {userProfile.totalPoints}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Points
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {habits.reduce((sum, habit) => 
                          sum + Object.values(habit.weeklyProgress || {}).filter(Boolean).length, 0
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={shareProgress}
                    disabled={isSharing}
                    fullWidth
                  >
                    {isSharing ? 'Sharing...' : 'Share Progress'}
                  </Button>
                </CardActions>
              </Card>

              <Alert severity="info">
                Sharing your progress helps motivate others and builds a supportive community of habit builders!
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Friend Dialog */}
      <Dialog open={addFriendOpen} onClose={() => setAddFriendOpen(false)}>
        <DialogTitle>Add Friend</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your friend's code to add them to your friend list.
          </Typography>
          <TextField
            autoFocus
            label="Friend Code"
            type="text"
            fullWidth
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            placeholder="HT-XXXXXXXX"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFriendOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFriend} variant="contained" disabled={!friendCode.trim()}>
            Add Friend
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default SocialFeatures;
