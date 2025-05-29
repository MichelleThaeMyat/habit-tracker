import React, { useState } from 'react';
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
  Chip,
  Stack,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos).map((todo: Todo) => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    })) : [];
  });
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');

  const handleOpenDialog = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo);
      setTitle(todo.title);
      setDescription(todo.description);
      setPriority(todo.priority);
    } else {
      setEditingTodo(null);
      setTitle('');
      setDescription('');
      setPriority('low');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setPriority('low');
  };

  const handleSaveTodo = () => {
    const updateTodos = (newTodos: Todo[]) => {
      setTodos(newTodos);
      localStorage.setItem('todos', JSON.stringify(newTodos));
    };
    if (title.trim()) {
      if (editingTodo) {
        updateTodos(todos.map((todo: Todo) =>
          todo.id === editingTodo.id
            ? { ...todo, title, description, priority }
            : todo
        ));
      } else {
        const newTodo: Todo = {
          id: Date.now().toString(),
          title,
          description,
          completed: false,
          priority,
          createdAt: new Date(),
        };
        updateTodos([...todos, newTodo]);
      }
      handleCloseDialog();
    }
  };

  const handleToggleTodo = (id: string) => {
    const newTodos = todos.map((todo: Todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    localStorage.setItem('todos', JSON.stringify(newTodos));
  };

  const handleDeleteTodo = (id: string) => {
    const newTodos = todos.filter((todo: Todo) => todo.id !== id);
    setTodos(newTodos);
    localStorage.setItem('todos', JSON.stringify(newTodos));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Task
        </Button>
      </Box>

      <List>
        {todos.map((todo) => (
          <ListItem
            key={todo.id}
            sx={{
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)}
            />
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.title}
                  </Typography>
                  <Chip
                    icon={<FlagIcon />}
                    label={todo.priority}
                    size="small"
                    color={getPriorityColor(todo.priority)}
                  />
                </Box>
              }
              secondary={todo.description}
              sx={{
                '& .MuiListItemText-secondary': {
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? 'text.secondary' : 'text.primary',
                },
              }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleOpenDialog(todo)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Task Title"
              type="text"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Priority
              </Typography>
              <Stack direction="row" spacing={1}>
                {['low', 'medium', 'high'].map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    onClick={() => setPriority(p as 'low' | 'medium' | 'high')}
                    color={p === priority ? getPriorityColor(p) : 'default'}
                    variant={p === priority ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveTodo} variant="contained">
            {editingTodo ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TodoList;