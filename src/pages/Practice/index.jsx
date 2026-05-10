import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Target,
  Zap,
  Eye,
  Shuffle,
  BrainCircuit,
  Clock,
  XCircle,
  BookOpen,
  Settings2,
  Layers,
  Hash,
} from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import styles from './Practice.module.css';

const MODES = [
  {
    id: 'smart',
    name: 'Smart Session',
    description: 'Practice less attempted and weak questions first.',
    icon: BrainCircuit,
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)',
    availableFor: ['All Subjects', 'Selected Subjects', 'Single Topic', 'Multiple Topics'],
  },
  {
    id: 'wrong',
    name: 'Wrong Questions',
    description: 'Retry incorrectly answered questions until mastered.',
    icon: XCircle,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    availableFor: ['All Subjects', 'Selected Subjects', 'Single Topic', 'Multiple Topics'],
  },
  {
    id: 'due',
    name: 'Due Today',
    description: 'Daily revision powered by SM-2 spaced repetition.',
    icon: Clock,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    availableFor: ['All Subjects', 'Selected Subjects'],
  },
  {
    id: 'unseen',
    name: 'Unseen First',
    description: 'Attempt questions you have never seen before.',
    icon: Eye,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    availableFor: ['All Subjects', 'Selected Subjects', 'Single Topic'],
  },
  {
    id: 'quick',
    name: 'Quick Mix',
    description: 'Random set of questions from selected scope.',
    icon: Shuffle,
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.1)',
    availableFor: ['All Subjects', 'Selected Subjects', 'Single Topic', 'Multiple Topics'],
  },
];

const SCOPES = ['All Subjects', 'Selected Subjects', 'Single Topic', 'Multiple Topics'];

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function Practice() {
  const { subjects, topics, questions, quizSessions, userSettings, getDueQuestions, wrongQuestions, spacedRevision } = useQuiz();
  const navigate = useNavigate();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionCount, setQuestionCount] = useState(userSettings.questionsPerSession || 10);
  const [scope, setScope] = useState('All Subjects');
  const [selectedMode, setSelectedMode] = useState(null);

  const getFilteredQuestions = () => {
    if (scope === 'All Subjects') return questions;
    if (scope === 'Selected Subjects' && selectedSubject) {
      const topicIds = topics.filter(t => t.subjectId === selectedSubject).map(t => t.id);
      return questions.filter(q => topicIds.includes(q.topicId));
    }
    if (scope === 'Single Topic' && selectedTopic) {
      return questions.filter(q => q.topicId === selectedTopic);
    }
    if (scope === 'Multiple Topics' && selectedTopics.length > 0) {
      return questions.filter(q => selectedTopics.includes(q.topicId));
    }
    return questions;
  };

  const getModeQuestions = (mode) => {
    let filtered = getFilteredQuestions();
    
    switch (mode) {
      case 'smart': {
        const attemptsMap = {};
        const wrongRateMap = {};
        
        quizSessions.forEach(s => {
          s.questions?.forEach((qId, idx) => {
            const q = questions.find(q => q.id === qId);
            if (!q) return;
            
            if (!attemptsMap[qId]) {
              attemptsMap[qId] = 0;
              wrongRateMap[qId] = { wrong: 0, total: 0 };
            }
            attemptsMap[qId]++;
            const isWrong = s.answers?.[idx] !== q.correct;
            wrongRateMap[qId].total++;
            if (isWrong) wrongRateMap[qId].wrong++;
          });
        });
        
        const wrongQuestionIds = new Set(wrongQuestions ? Object.keys(wrongQuestions) : []);
        const dueQuestionIds = new Set(spacedRevision ? Object.keys(spacedRevision) : []);
        
        return [...filtered].sort((a, b) => {
          const aAttempts = attemptsMap[a.id] || 0;
          const bAttempts = attemptsMap[b.id] || 0;
          
          const aIsWrong = wrongQuestionIds.has(a.id);
          const bIsWrong = wrongQuestionIds.has(b.id);
          const aIsDue = dueQuestionIds.has(a.id);
          const bIsDue = dueQuestionIds.has(b.id);
          
          if (aAttempts === 0 && bAttempts > 0) return -1;
          if (bAttempts === 0 && aAttempts > 0) return 1;
          
          if (aIsWrong && !bIsWrong) return -1;
          if (!aIsWrong && bIsWrong) return 1;
          
          if (aIsDue && !bIsDue) return -1;
          if (!aIsDue && bIsDue) return 1;
          
          const aWrongRate = aAttempts > 0 ? wrongRateMap[a.id].wrong / wrongRateMap[a.id].total : 0;
          const bWrongRate = bAttempts > 0 ? wrongRateMap[b.id].wrong / wrongRateMap[b.id].total : 0;
          
          return bWrongRate - aWrongRate;
        });
      }
      case 'wrong': {
        const wrongQuestionIds = new Set(wrongQuestions ? Object.keys(wrongQuestions) : []);
        return filtered.filter(q => wrongQuestionIds.has(q.id));
      }
      case 'due': {
        const dueQuestions = getDueQuestions() || [];
        if (dueQuestions.length === 0) return [];
        return filtered.filter(q => dueQuestions.some(dq => dq && dq.id === q.id));
      }
      case 'unseen': {
        const seenInSessions = new Set();
        const inSpacedRevision = new Set(spacedRevision ? Object.keys(spacedRevision) : []);
        const inWrongQuestions = new Set(wrongQuestions ? Object.keys(wrongQuestions) : []);
        
        quizSessions.forEach(s => s.questions?.forEach(qId => seenInSessions.add(qId)));
        
        return filtered.filter(q => {
          const hasNotSeenInSession = !seenInSessions.has(q.id);
          const hasNotDoneSpacedRevision = !inSpacedRevision.has(q.id);
          const isNotInWrongList = !inWrongQuestions.has(q.id);
          
          return hasNotSeenInSession && hasNotDoneSpacedRevision && isNotInWrongList;
        });
      }
      case 'quick':
        return [...filtered].sort(() => Math.random() - 0.5);
      default:
        return filtered;
    }
  };

  const getAvailableCount = (mode) => getModeQuestions(mode).length;
  const isModeAvailable = (mode) => MODES.find(m => m.id === mode)?.availableFor.includes(scope);

  useEffect(() => {
    if (selectedMode) {
      const available = getAvailableCount(selectedMode);
      if (questionCount > available) {
        setQuestionCount(Math.max(1, available));
      }
    }
  }, [selectedMode, questionCount, getAvailableCount, selectedMode]);

  const startQuiz = (mode) => {
    let quizQuestions = getModeQuestions(mode);
    if (quizQuestions.length === 0) return;

    const count = ['due', 'unseen', 'wrong'].includes(mode) 
      ? Math.min(quizQuestions.length, questionCount) 
      : Math.min(quizQuestions.length, questionCount);
    quizQuestions = quizQuestions.slice(0, count);

    const session = {
      date: new Date().toISOString().split('T')[0],
      subject: scope === 'All Subjects' ? 'Mixed' : scope === 'Single Topic' ? topics.find(t => t.id === selectedTopic)?.name || 'Mixed' : subjects.find(s => s.id === selectedSubject)?.name || 'Mixed',
      mode,
      score: 0,
      total: quizQuestions.length,
      timeTaken: 0,
      questions: quizQuestions.map(q => q.id),
      answers: quizQuestions.map(() => null),
    };

    navigate(`/quiz/${generateSessionId()}`, { state: { session, questions: quizQuestions, mode } });
  };

  const filteredTopics = selectedSubject ? topics.filter(t => t.subjectId === selectedSubject) : topics;
  const availableForScope = (mode) => MODES.find(m => m.id === mode)?.availableFor.includes(scope);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Practice</h1>
        <p className={styles.subtitle}>Configure and start your learning session</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}><Layers size={18} /></div>
              <h2 className={styles.sectionTitle}>Mode Selection</h2>
            </div>
            <div className={styles.modesGrid}>
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const count = getAvailableCount(mode.id);
                const available = availableForScope(mode.id);
                const isSelected = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    className={`${styles.modeCard} ${isSelected ? styles.selected : ''} ${!available ? styles.unavailable : ''}`}
                    onClick={() => { if (available) setSelectedMode(isSelected ? null : mode.id); }}
                    disabled={!available}
                  >
                    <div className={styles.modeHeader}>
                      <div className={styles.modeIcon} style={{ background: mode.bg }}>
                        <Icon size={20} style={{ color: mode.color }} />
                      </div>
                      <div className={styles.modeInfo}>
                        <div className={styles.modeName}>{mode.name}</div>
                        <div className={styles.modeDesc}>{mode.description}</div>
                      </div>
                    </div>
                    <div className={styles.modeFooter}>
                      <span className={styles.modeCount}>{count} available</span>
                      {isSelected && <span className={styles.selectedBadge}>Selected</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}><BookOpen size={18} /></div>
              <h2 className={styles.sectionTitle}>Scope Selection</h2>
            </div>
            <div className={styles.scopeGrid}>
              {SCOPES.map((s) => (
                <button
                  key={s}
                  className={`${styles.scopeChip} ${scope === s ? styles.active : ''}`}
                  onClick={() => { setScope(s); setSelectedMode(null); }}
                >
                  {s}
                </button>
              ))}
            </div>
            
            {(scope === 'Selected Subjects' || scope === 'Single Topic' || scope === 'Multiple Topics') && (
              <div className={styles.scopeOptions}>
                <select 
                  className={styles.filterSelect} 
                  value={selectedSubject} 
                  onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopics([]); setSelectedTopic(''); }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {scope === 'Single Topic' && selectedSubject && (
                  <select 
                    className={styles.filterSelect}
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  >
                    <option value="">Select Topic</option>
                    {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                {scope === 'Multiple Topics' && selectedSubject && (
                  <div className={styles.topicSelect}>
                    <label className={styles.topicLabel}>Select Topics:</label>
                    <div className={styles.topicChips}>
                      {filteredTopics.map(t => (
                        <button
                          key={t.id}
                          className={`${styles.topicChip} ${selectedTopics.includes(t.id) ? styles.active : ''}`}
                          onClick={() => {
                            if (selectedTopics.includes(t.id)) {
                              setSelectedTopics(selectedTopics.filter(id => id !== t.id));
                            } else {
                              setSelectedTopics([...selectedTopics, t.id]);
                            }
                          }}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}><Hash size={18} /></div>
              <h2 className={styles.sectionTitle}>Question Count</h2>
            </div>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={selectedMode ? Math.max(1, getAvailableCount(selectedMode)) : Math.max(1, getFilteredQuestions().length)}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              />
              <div className={styles.sliderValue}>
                <span className={styles.sliderNumber}>{questionCount}</span>
                <span className={styles.sliderLabel}>questions</span>
              </div>
            </div>
            <div className={styles.availability}>
              <span className={styles.availLabel}>Available:</span>
              <span className={styles.availCount}>{selectedMode ? getAvailableCount(selectedMode) : getFilteredQuestions().length} questions</span>
            </div>
          </section>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Session Summary</h3>
            <div className={styles.summaryItems}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Mode</span>
                <span className={styles.summaryValue}>
                  {selectedMode ? MODES.find(m => m.id === selectedMode)?.name : 'Not selected'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Scope</span>
                <span className={styles.summaryValue}>{scope}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Questions</span>
                <span className={styles.summaryValue}>
                  {selectedMode 
                    ? `${Math.min(questionCount, getAvailableCount(selectedMode))} / ${getAvailableCount(selectedMode)}`
                    : questionCount}
                </span>
              </div>
              {selectedSubject && scope !== 'Single Topic' && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Subject</span>
                  <span className={styles.summaryValue}>{subjects.find(s => s.id === selectedSubject)?.name}</span>
                </div>
              )}
              {selectedTopic && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Topic</span>
                  <span className={styles.summaryValue}>{topics.find(t => t.id === selectedTopic)?.name}</span>
                </div>
              )}
              {selectedTopics.length > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Topics</span>
                  <span className={styles.summaryValue}>{selectedTopics.length} selected</span>
                </div>
              )}
            </div>
            <Button
              className={styles.startBtn}
              onClick={() => selectedMode && startQuiz(selectedMode)}
              disabled={!selectedMode || getAvailableCount(selectedMode) === 0 || (scope === 'Single Topic' && !selectedTopic)}
            >
              <Play size={18} /> Start Practice
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}