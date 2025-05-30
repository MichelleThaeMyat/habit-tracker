// Smart Task Prioritization utilities
export interface TaskContext {
  title: string;
  description: string;
  deadline?: Date;
  energyLevel: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface TimeSlot {
  hour: number;
  period: 'morning' | 'afternoon' | 'evening';
  energyMatch: boolean;
}

// AI-powered priority suggestion based on keywords and context
export const suggestPriority = (title: string, description: string, deadline?: Date): 'low' | 'medium' | 'high' => {
  const text = `${title} ${description}`.toLowerCase();
  
  // High priority keywords
  const highPriorityKeywords = [
    'urgent', 'important', 'critical', 'asap', 'deadline', 'emergency',
    'meeting', 'presentation', 'interview', 'exam', 'project due',
    'pay', 'bill', 'tax', 'appointment', 'doctor', 'medical'
  ];
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'work', 'task', 'assignment', 'study', 'review', 'prepare',
    'call', 'email', 'follow up', 'schedule', 'plan', 'organize'
  ];
  
  // Check for high priority keywords
  if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }
  
  // Check deadline proximity
  if (deadline) {
    const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline <= 1) return 'high';
    if (daysUntilDeadline <= 3) return 'medium';
  }
  
  // Check for medium priority keywords
  if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
};

// Calculate urgency score based on deadline proximity and priority
export const calculateUrgencyScore = (priority: 'low' | 'medium' | 'high', deadline?: Date): number => {
  let baseScore = 0;
  
  // Base score from priority
  switch (priority) {
    case 'high': baseScore = 70; break;
    case 'medium': baseScore = 40; break;
    case 'low': baseScore = 20; break;
  }
  
  // Add deadline proximity bonus
  if (deadline) {
    const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      // Overdue
      baseScore = Math.min(100, baseScore + 50);
    } else if (daysUntilDeadline === 0) {
      // Due today
      baseScore = Math.min(100, baseScore + 40);
    } else if (daysUntilDeadline === 1) {
      // Due tomorrow
      baseScore = Math.min(100, baseScore + 30);
    } else if (daysUntilDeadline <= 3) {
      // Due within 3 days
      baseScore = Math.min(100, baseScore + 20);
    } else if (daysUntilDeadline <= 7) {
      // Due within a week
      baseScore = Math.min(100, baseScore + 10);
    }
  }
  
  return Math.min(100, baseScore);
};

// Suggest optimal time slots based on energy level and task type
export const suggestOptimalTimeSlots = (energyLevel: 'low' | 'medium' | 'high', title: string): string[] => {
  const text = title.toLowerCase();
  const timeSlots: string[] = [];
  
  // Creative/high-focus tasks typically better in morning
  const creativeTasks = ['write', 'design', 'plan', 'strategy', 'create', 'develop', 'code', 'study'];
  const isCreativeTask = creativeTasks.some(keyword => text.includes(keyword));
  
  // Administrative/routine tasks can be done anytime
  const routineTasks = ['email', 'call', 'organize', 'clean', 'sort', 'file', 'update'];
  const isRoutineTask = routineTasks.some(keyword => text.includes(keyword));
  
  switch (energyLevel) {
    case 'high':
      if (isCreativeTask) {
        timeSlots.push('8:00 AM - 10:00 AM', '9:00 AM - 11:00 AM');
      } else {
        timeSlots.push('8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM');
      }
      break;
      
    case 'medium':
      if (isRoutineTask) {
        timeSlots.push('10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '7:00 PM - 9:00 PM');
      } else {
        timeSlots.push('10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM');
      }
      break;
      
    case 'low':
      timeSlots.push('1:00 PM - 2:00 PM', '4:00 PM - 6:00 PM', '7:00 PM - 9:00 PM');
      break;
  }
  
  return timeSlots;
};

// Determine energy level based on task description
export const suggestEnergyLevel = (title: string, description: string): 'low' | 'medium' | 'high' => {
  const text = `${title} ${description}`.toLowerCase();
  
  // High energy tasks
  const highEnergyKeywords = [
    'create', 'design', 'write', 'code', 'develop', 'plan', 'strategy',
    'presentation', 'meeting', 'interview', 'study', 'learn', 'research',
    'exercise', 'workout', 'project', 'brainstorm'
  ];
  
  // Low energy tasks
  const lowEnergyKeywords = [
    'organize', 'clean', 'sort', 'file', 'archive', 'backup', 'review',
    'read', 'watch', 'listen', 'rest', 'relax', 'simple', 'quick'
  ];
  
  if (highEnergyKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }
  
  if (lowEnergyKeywords.some(keyword => text.includes(keyword))) {
    return 'low';
  }
  
  return 'medium';
};

// Check if task is overdue
export const isTaskOverdue = (deadline?: Date): boolean => {
  if (!deadline) return false;
  return deadline.getTime() < Date.now();
};

// Get deadline status for display
export const getDeadlineStatus = (deadline?: Date): { status: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' | 'none', color: string, text: string } => {
  if (!deadline) {
    return { status: 'none', color: 'text-gray-500', text: 'No deadline' };
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'overdue', color: 'text-red-600', text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}` };
  } else if (diffDays === 0) {
    return { status: 'today', color: 'text-orange-600', text: 'Due today' };
  } else if (diffDays === 1) {
    return { status: 'tomorrow', color: 'text-yellow-600', text: 'Due tomorrow' };
  } else if (diffDays <= 7) {
    return { status: 'soon', color: 'text-blue-600', text: `Due in ${diffDays} days` };
  } else {
    return { status: 'later', color: 'text-gray-600', text: `Due in ${diffDays} days` };
  }
};
