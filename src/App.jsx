import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuestionBank } from './pages/QuestionBank';
import { AddQuestion } from './pages/QuestionBank/AddQuestion';
import { Practice } from './pages/Practice';
import { Quiz } from './pages/Quiz';
import { Results } from './pages/Results';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import './styles/global.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'questions', element: <QuestionBank /> },
      { path: 'questions/add', element: <AddQuestion /> },
      { path: 'practice', element: <Practice /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: 'quiz/:sessionId',
    element: <Quiz />,
  },
  {
    path: 'results/:sessionId',
    element: <Results />,
  },
]);

function App() {
  return (
    <QuizProvider>
      <RouterProvider router={router} />
    </QuizProvider>
  );
}

export default App;
