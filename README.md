# Quizwix

A modern quiz application for practice and learning. Built with React, Vite, and a beautiful UI with smooth animations.

## Features

- **Subject-based organization** - Organize questions by subjects (Mathematics, Science, History, Geography)
- **Topic management** - Create and manage topics within each subject
- **Multiple quiz modes** - Practice, Quiz, Timed, and Challenge modes
- **Question bank** - Add, edit, and manage questions with multiple difficulty levels
- **Progress tracking** - View quiz history and track performance over time
- **Analytics dashboard** - Visual reports with charts showing your progress
- **Customizable settings** - Configure timer defaults, sound effects, and more

## Tech Stack

- **React 19** with Vite
- **React Router DOM** for routing
- **Framer Motion** for animations
- **Lucide React** for icons
- **Recharts** for data visualization
- **CSS Modules** with CSS Variables for styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Sidebar, MobileNav
│   └── shared/         # Button, Card, Modal, Badge, Toast
├── context/            # Global state (QuizContext)
├── data/              # Mock data and types
├── pages/             # Page components
│   ├── Dashboard/     # Stats and activity
│   ├── QuestionBank/  # Question management
│   ├── Practice/      # Quiz mode selection
│   ├── Quiz/          # Quiz interface
│   ├── Results/       # Quiz results
│   ├── Reports/       # Analytics and charts
│   └── Settings/      # App settings
├── styles/            # Global styles
├── App.jsx            # Main app with routes
└── main.jsx           # Entry point
```

## Design

- Clean, modern interface with ample white space
- Responsive layout (desktop sidebar + mobile navigation)
- Smooth animations for interactions and transitions
- Consistent color palette with Royal Blue as primary

## License

MIT