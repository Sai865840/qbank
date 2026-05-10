# Quizwix - Quiz App Implementation Plan

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router DOM v7 (file-based) |
| Styling | CSS Modules + CSS Variables |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| State | React Context + localStorage |
| Fonts | Nunito (headings), Inter (body) |

## Color Palette
| Role | Color | Hex |
|---|---|---|
| Primary | Royal Blue | `#2563EB` |
| Secondary | Sky Blue | `#38BDF8` |
| Accent | Emerald | `#10B981` |
| Background | Soft White | `#F8FAFC` |
| Card | White | `#FFFFFF` |
| Text | Dark Slate | `#0F172A` |
| Muted Text | Gray | `#64748B` |

## Page Routes
| Route | Page | Highlights |
|---|---|---|
| `/` | Dashboard | Stats cards, activity chart, recent feed |
| `/questions` | Question Bank | Subject/topic cards, CRUD modal, JSON bulk import |
| `/practice` | Practice | 6 mode cards |
| `/quiz/:sessionId` | Quiz Screen | Question display, navigator, timer, flag |
| `/results/:sessionId` | Result Screen | Score ring, stats, question review |
| `/reports` | Reports | Recent tests, subject charts, trends |
| `/settings` | Settings | Grouped settings sections |

## Layout
- **Desktop:** Fixed left sidebar (240px, collapsible to 72px), main content
- **Mobile:** Hamburger drawer + bottom nav bar

## Data Model (localStorage)
```json
{
  "subjects": [{ "id", "name", "color", "icon", "topicCount" }],
  "topics": [{ "id", "subjectId", "name", "questionCount" }],
  "questions": [{ "id", "subjectId", "topicId", "text", "options", "correct", "difficulty", "flagged" }],
  "quizSessions": [{ "id", "date", "subject", "mode", "score", "total", "timeTaken", "answers" }],
  "userSettings": { "theme": "light", "timerDefault": 30, "soundEffects": true }
}
```

## File Structure
```
src/
  styles/
    global.css          # CSS vars, reset, typography
  context/
    QuizContext.jsx     # all app state + localStorage
  data/
    mockData.js         # sample data
  components/
    Layout/
      Sidebar.jsx + .module.css
      MobileNav.jsx + .module.css
    shared/
      Card.jsx + .module.css
      Button.jsx + .module.css
      Badge.jsx + .module.css
      Modal.jsx + .module.css
      Toast.jsx + .module.css
  pages/
    Dashboard/
    QuestionBank/
    Practice/
    Quiz/
    Results/
    Reports/
    Settings/
  App.jsx
  main.jsx
```

## Build Phases
1. **Phase 1 - Foundation:** Global styles, mock data, QuizContext, shared components, layout, routing
2. **Phase 2 - Core Pages:** All 7 pages with full functionality
3. **Phase 3 - Polish:** Framer Motion animations, responsive refinements

## Design Principles
- Modern, clean UI with ample white space
- Consistent color palette and typography
- Intuitive icons and buttons
- Framer Motion for page transitions, card hovers, quiz interactions
- No cluttered layouts or excessive text