import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DEFAULT_DATA = {
  subjects: [],
  topics: [],
  questions: [],
  quizSessions: [],
  userSettings: {
    timerDefault: 30,
    questionsPerSession: 10,
    showExplanations: true,
    soundEffects: true,
  },
};

const STORAGE_KEYS = {
  subjects: 'quizwix_subjects',
  topics: 'quizwix_topics',
  questions: 'quizwix_questions',
  quizSessions: 'quizwix_quizSessions',
  userSettings: 'quizwix_userSettings',
  spacedRevision: 'quizwix_spacedRevision',
  wrongQuestions: 'quizwix_wrongQuestions',
};

const SM2_DEFAULTS = {
  initialEaseFactor: 2.5,
  minimumEaseFactor: 1.3,
  initialInterval: 1,
};

function calculateSM2(quality, previousInterval, previousEaseFactor, previousRepetitions) {
  let easeFactor = previousEaseFactor;
  let interval = previousInterval;
  let repetitions = previousRepetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < SM2_DEFAULTS.minimumEaseFactor) {
    easeFactor = SM2_DEFAULTS.minimumEaseFactor;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextRevision: nextDate.toISOString().split('T')[0],
  };
}

const QuizContext = createContext(null);

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export function QuizProvider({ children }) {
  const [subjects, setSubjects] = useState(() => loadFromStorage(STORAGE_KEYS.subjects, DEFAULT_DATA.subjects));
  const [topics, setTopics] = useState(() => loadFromStorage(STORAGE_KEYS.topics, DEFAULT_DATA.topics));
  const [questions, setQuestions] = useState(() => loadFromStorage(STORAGE_KEYS.questions, DEFAULT_DATA.questions));
  const [quizSessions, setQuizSessions] = useState(() => loadFromStorage(STORAGE_KEYS.quizSessions, DEFAULT_DATA.quizSessions));
  const [userSettings, setUserSettings] = useState(() => loadFromStorage(STORAGE_KEYS.userSettings, DEFAULT_DATA.userSettings));
  const [spacedRevision, setSpacedRevision] = useState(() => loadFromStorage(STORAGE_KEYS.spacedRevision, {}));
  const [wrongQuestions, setWrongQuestions] = useState(() => loadFromStorage(STORAGE_KEYS.wrongQuestions, {}));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.subjects, subjects);
  }, [subjects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.topics, topics);
  }, [topics]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.questions, questions);
  }, [questions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.quizSessions, quizSessions);
  }, [quizSessions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.userSettings, userSettings);
  }, [userSettings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.spacedRevision, spacedRevision);
  }, [spacedRevision]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.wrongQuestions, wrongQuestions);
  }, [wrongQuestions]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const addSubject = useCallback((subject) => {
    const newSubject = { ...subject, id: `subj-${Date.now()}`, topicCount: 0 };
    setSubjects(prev => [...prev, newSubject]);
    addToast('Subject added successfully', 'success');
    return newSubject;
  }, [addToast]);

  const updateSubject = useCallback((id, updates) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addToast('Subject updated', 'success');
  }, [addToast]);

  const deleteSubject = useCallback((id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setTopics(prev => prev.filter(t => t.subjectId !== id));
    setQuestions(prev => prev.filter(q => q.subjectId !== id));
    addToast('Subject deleted', 'success');
  }, [addToast]);

  const addTopic = useCallback((topic) => {
    const newTopic = { ...topic, id: `topic-${Date.now()}` };
    setTopics(prev => [...prev, newTopic]);
    setSubjects(prev => prev.map(s =>
      s.id === topic.subjectId ? { ...s, topicCount: s.topicCount + 1 } : s
    ));
    addToast('Topic added', 'success');
    return newTopic;
  }, [addToast]);

  const updateTopic = useCallback((id, updates) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    addToast('Topic updated', 'success');
  }, [addToast]);

  const deleteTopic = useCallback((id) => {
    const topic = topics.find(t => t.id === id);
    setTopics(prev => prev.filter(t => t.id !== id));
    setQuestions(prev => prev.filter(q => q.topicId !== id));
    if (topic) {
      setSubjects(prev => prev.map(s =>
        s.id === topic.subjectId ? { ...s, topicCount: Math.max(0, s.topicCount - 1) } : s
      ));
    }
    addToast('Topic deleted', 'success');
  }, [topics, addToast]);

  const addQuestion = useCallback((question) => {
    const newQuestion = { ...question, id: `q-${Date.now()}`, flagged: false };
    setQuestions(prev => [...prev, newQuestion]);
    setTopics(prev => prev.map(t =>
      t.id === question.topicId ? { ...t, questionCount: t.questionCount + 1 } : t
    ));
    addToast('Question added', 'success');
    return newQuestion;
  }, [addToast]);

  const updateQuestion = useCallback((id, updates) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    addToast('Question updated', 'success');
  }, [addToast]);

  const deleteQuestion = useCallback((id) => {
    const question = questions.find(q => q.id === id);
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (question) {
      setTopics(prev => prev.map(t =>
        t.id === question.topicId ? { ...t, questionCount: Math.max(0, t.questionCount - 1) } : t
      ));
    }
    addToast('Question deleted', 'success');
  }, [questions, addToast]);

  const toggleFlagQuestion = useCallback((id) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, flagged: !q.flagged } : q));
  }, []);

  const bulkAddQuestions = useCallback((newQuestions) => {
    const questionsWithIds = newQuestions.map(q => ({ ...q, id: `q-${Date.now()}-${Math.random()}`, flagged: false }));
    setQuestions(prev => [...prev, ...questionsWithIds]);
    addToast(`${questionsWithIds.length} questions added`, 'success');
    return questionsWithIds;
  }, [addToast]);

  const addQuizSession = useCallback((session) => {
    const newSession = { ...session, id: `session-${Date.now()}` };
    setQuizSessions(prev => [newSession, ...prev]);
    return newSession;
  }, []);

  const updateQuizSession = useCallback((id, updates) => {
    setQuizSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteQuizSession = useCallback((id) => {
    setQuizSessions(prev => prev.filter(s => s.id !== id));
    addToast('Quiz result deleted', 'success');
  }, [addToast]);

  const updateSettings = useCallback((updates) => {
    setUserSettings(prev => ({ ...prev, ...updates }));
    addToast('Settings saved', 'success');
  }, [addToast]);

  const addToSpacedRevision = useCallback((questionId) => {
    if (spacedRevision[questionId]) return false;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextRevision = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    setSpacedRevision(prev => ({
      ...prev,
      [questionId]: {
        nextRevision,
        interval: 1,
        easeFactor: SM2_DEFAULTS.initialEaseFactor,
        reviewCount: 0,
        addedAt: todayStr,
      },
    }));
    addToast('Added to spaced revision', 'success');
    return true;
  }, [spacedRevision, addToast]);

  const updateSpacedRevision = useCallback((questionId, isCorrect) => {
    const revision = spacedRevision[questionId];
    if (!revision) return;

    const quality = isCorrect ? 4 : 1;
    const { interval, easeFactor, repetitions, nextRevision } = calculateSM2(
      quality,
      revision.interval,
      revision.easeFactor,
      revision.reviewCount
    );

    setSpacedRevision(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        nextRevision,
        interval,
        easeFactor,
        reviewCount: repetitions,
      },
    }));
  }, [spacedRevision]);

  const getDueQuestions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return Object.entries(spacedRevision)
      .filter(([_, data]) => data.nextRevision <= today)
      .map(([questionId]) => questions.find(q => q.id === questionId))
      .filter(Boolean);
  }, [spacedRevision, questions]);

  const isInSpacedRevision = useCallback((questionId) => {
    return !!spacedRevision[questionId];
  }, [spacedRevision]);

  const getSpacedRevisionData = useCallback((questionId) => {
    return spacedRevision[questionId] || null;
  }, [spacedRevision]);

  const addToWrongQuestions = useCallback((questionId) => {
    if (wrongQuestions[questionId]) return false;
    
    setWrongQuestions(prev => ({
      ...prev,
      [questionId]: {
        streak: 0,
        addedAt: new Date().toISOString().split('T')[0],
      },
    }));
    addToast('Added to wrong questions', 'success');
    return true;
  }, [wrongQuestions, addToast]);

  const removeFromWrongQuestions = useCallback((questionId) => {
    setWrongQuestions(prev => {
      const newWrong = { ...prev };
      delete newWrong[questionId];
      return newWrong;
    });
  }, []);

  const updateWrongQuestionStreak = useCallback((questionId, isCorrect) => {
    const wrongData = wrongQuestions[questionId];
    if (!wrongData) return;

    if (isCorrect) {
      const newStreak = wrongData.streak + 1;
      if (newStreak >= 5) {
        removeFromWrongQuestions(questionId);
        addToast('Removed from wrong questions!', 'success');
      } else {
        setWrongQuestions(prev => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            streak: newStreak,
          },
        }));
      }
    } else {
      setWrongQuestions(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          streak: 0,
        },
      }));
    }
  }, [wrongQuestions, removeFromWrongQuestions, addToast]);

  const isWrongQuestion = useCallback((questionId) => {
    return !!wrongQuestions[questionId];
  }, [wrongQuestions]);

  const getWrongQuestionStreak = useCallback((questionId) => {
    return wrongQuestions[questionId]?.streak || 0;
  }, [wrongQuestions]);

  const getSubjects = useCallback(() => subjects, [subjects]);
  const getTopics = useCallback(() => topics, [topics]);
  const getQuestions = useCallback(() => questions, [questions]);
  const getQuizSessions = useCallback(() => quizSessions, [quizSessions]);
  const getSettings = useCallback(() => userSettings, [userSettings]);

  const getTopicsBySubject = useCallback((subjectId) =>
    topics.filter(t => t.subjectId === subjectId), [topics]);

  const getQuestionsByTopic = useCallback((topicId) =>
    questions.filter(q => q.topicId === topicId), [questions]);

  const getQuestionsBySubject = useCallback((subjectId) =>
    questions.filter(q => q.subjectId === subjectId), [questions]);

  const getQuizSessionsBySubject = useCallback((subject) =>
    quizSessions.filter(s => s.subject === subject), [quizSessions]);

  const stats = {
    totalQuestions: questions.length,
    totalSubjects: subjects.length,
    totalTopics: topics.length,
    totalSessions: quizSessions.length,
    averageScore: quizSessions.length > 0
      ? Math.round(quizSessions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / quizSessions.length)
      : 0,
    totalTime: quizSessions.reduce((acc, s) => acc + s.timeTaken, 0),
    flaggedCount: questions.filter(q => q.flagged).length,
  };

  const value = {
    subjects,
    topics,
    questions,
    quizSessions,
    userSettings,
    toasts,
    stats,
    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    updateTopic,
    deleteTopic,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleFlagQuestion,
    bulkAddQuestions,
    addQuizSession,
    updateQuizSession,
    deleteQuizSession,
    updateSettings,
    getSubjects,
    getTopics,
    getQuestions,
    getQuizSessions,
    getSettings,
    getTopicsBySubject,
    getQuestionsByTopic,
    getQuestionsBySubject,
    getQuizSessionsBySubject,
    addToSpacedRevision,
    updateSpacedRevision,
    getDueQuestions,
    isInSpacedRevision,
    getSpacedRevisionData,
    addToWrongQuestions,
    removeFromWrongQuestions,
    updateWrongQuestionStreak,
    isWrongQuestion,
    getWrongQuestionStreak,
    wrongQuestions,
    spacedRevision,
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
