# Habit Tracker with Gamification

A comprehensive habit tracking application built with React and TypeScript, featuring a complete gamification system with achievements and social features.

## 🎯 Features

### Core Habit Tracking
- **Habit Management**: Create, edit, and delete habits
- **Smart Scheduling**: Set specific days for each habit
- **Progress Tracking**: Visual progress indicators and streak counters
- **Categories & Difficulty**: Organize habits by category and difficulty level
- **Habit Templates**: Quick start with pre-built habit templates
- **Statistics Dashboard**: Comprehensive habit analytics

### 🏆 Gamification System

#### Achievement System
- **Level Progression**: Gain levels based on achievement points (100 points per level)
- **Achievement Categories**: 
  - Streak achievements (3, 7, 30, 100+ day streaks)
  - Completion milestones (1, 100, 1000+ completions)
  - Collection achievements (habit diversity)
  - Social achievements (sharing and community)
- **Rarity Tiers**: Common, Rare, Epic, and Legendary achievements
- **Real-time Notifications**: Popup notifications for new achievements
- **Achievement Sharing**: Share your accomplishments with others

#### Social Features
- **Friend System**: Connect with friends using unique friend codes
- **Global Leaderboard**: Compete with other users worldwide
- **Progress Sharing**: Share your stats and motivate others
- **Friend Activity**: See your friends' levels, streaks, and progress
- **Status Indicators**: Online/offline status for friends

### 🎨 User Interface
- **Modern Material-UI Design**: Clean, responsive interface
- **Dark/Light Theme Support**: Toggle between themes
- **Mobile Responsive**: Works seamlessly on all devices
- **Visual Progress Indicators**: Progress bars, badges, and color coding
- **Intuitive Navigation**: Easy access to all features

## 🚀 Getting Started

### Prerequisites
- Node.js (16+ recommended)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd habit-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Available Scripts

### `npm start`
Runs the app in development mode. The page will reload if you make edits.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## 🏗️ Project Structure

```
src/
├── components/
│   ├── AchievementSystem.tsx    # Complete achievement system
│   ├── SocialFeatures.tsx       # Friend system and leaderboards
│   ├── HabitList.tsx           # Main habit management interface
│   ├── HabitStats.tsx          # Statistics and analytics
│   ├── HabitTemplatesDialog.tsx # Pre-built habit templates
│   ├── Layout.tsx              # App layout and navigation
│   └── TodoList.tsx            # Task management
├── contexts/
│   └── ThemeContext.tsx        # Theme management
├── App.tsx                     # Main application component
└── index.tsx                   # Application entry point
```

## 📱 Usage Guide

### Creating Your First Habit
1. Click "Add Habit" button
2. Enter habit name and description
3. Select category and difficulty
4. Choose scheduled days
5. Add any notes or reminders
6. Save and start tracking!

### Earning Achievements
- Complete habits to build streaks
- Reach completion milestones
- Create diverse habit collections
- Share achievements with friends
- Level up your profile

### Connecting with Friends
1. Click the "Social" button
2. Share your friend code or enter a friend's code
3. View the leaderboard to see rankings
4. Share your progress to motivate others

## 🎮 Gamification Features

For detailed information about the gamification system, see [GAMIFICATION_FEATURES.md](./GAMIFICATION_FEATURES.md).

## 🔧 Technologies Used

- **Frontend**: React 18+ with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router
- **Date Handling**: date-fns
- **Storage**: localStorage (ready for backend integration)
- **Build Tool**: Create React App

## 🚧 Future Roadmap

### Backend Integration
- User authentication and accounts
- Real-time friend system
- Cloud data synchronization
- Push notifications

### Advanced Features
- Habit sharing and templates from friends
- Custom achievement creation
- Advanced analytics and insights
- Mobile app development

### Community Features
- Habit challenges and competitions
- Community forums
- Mentor/mentee relationships
- Group habits and accountability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- React community for continuous innovation
- All contributors and testers

---

**Start building better habits today with our gamified tracking system!** 🚀
