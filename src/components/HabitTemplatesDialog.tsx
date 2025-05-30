import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
} from '@mui/material';
import {
  FitnessCenter,
  MenuBook,
  SelfImprovement,
  Water,
  Bedtime,
  DirectionsWalk,
  Code,
  Close as CloseIcon,
} from '@mui/icons-material';

interface HabitTemplate {
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scheduledDays: number[];
  notes: string;
  icon: React.ReactNode;
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    name: "Drink 8 glasses of water",
    description: "Stay hydrated throughout the day",
    category: "Health & Fitness",
    difficulty: "easy",
    scheduledDays: [1, 2, 3, 4, 5, 6, 0],
    notes: "Keep a water bottle nearby and set reminders",
    icon: <Water />,
  },
  {
    name: "10 minute morning walk",
    description: "Start the day with light exercise",
    category: "Health & Fitness",
    difficulty: "easy",
    scheduledDays: [1, 2, 3, 4, 5, 6, 0],
    notes: "Fresh air and movement to energize your day",
    icon: <DirectionsWalk />,
  },
  {
    name: "Read for 30 minutes",
    description: "Daily reading habit",
    category: "Personal Development",
    difficulty: "medium",
    scheduledDays: [1, 2, 3, 4, 5, 6, 0],
    notes: "Choose books that inspire and educate you",
    icon: <MenuBook />,
  },
  {
    name: "5 minute meditation",
    description: "Daily mindfulness practice",
    category: "Mindfulness",
    difficulty: "easy",
    scheduledDays: [1, 2, 3, 4, 5, 6, 0],
    notes: "Use apps like Headspace or Calm for guidance",
    icon: <SelfImprovement />,
  },
  {
    name: "Sleep by 10 PM",
    description: "Maintain consistent sleep schedule",
    category: "Health & Fitness",
    difficulty: "medium",
    scheduledDays: [0, 1, 2, 3, 4], // Sunday to Thursday
    notes: "Create a bedtime routine and avoid screens 1 hour before",
    icon: <Bedtime />,
  },
  {
    name: "30 minute workout",
    description: "Regular exercise routine",
    category: "Health & Fitness",
    difficulty: "medium",
    scheduledDays: [1, 3, 5], // Monday, Wednesday, Friday
    notes: "Mix cardio and strength training",
    icon: <FitnessCenter />,
  },
  {
    name: "Code for 1 hour",
    description: "Daily programming practice",
    category: "Learning",
    difficulty: "hard",
    scheduledDays: [1, 2, 3, 4, 5], // Weekdays
    notes: "Work on personal projects or learn new technologies",
    icon: <Code />,
  },
];

interface HabitTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: HabitTemplate) => void;
}

const HabitTemplatesDialog: React.FC<HabitTemplatesDialogProps> = ({
  open,
  onClose,
  onSelectTemplate,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'hard': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Choose a Habit Template</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Get started quickly with these popular habit templates. You can customize them after adding.
        </Typography>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
          }}
        >
          {HABIT_TEMPLATES.map((template, index) => (
            <Card 
              key={index}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                }
              }}
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    {template.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {template.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    size="small" 
                    label={template.category} 
                    variant="outlined" 
                  />
                  <Chip 
                    size="small" 
                    label={template.difficulty} 
                    color={getDifficultyColor(template.difficulty) as any}
                  />
                </Box>
                {template.notes && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                    {template.notes}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Use Template
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitTemplatesDialog;
