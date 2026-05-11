import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Check,
  X,
  Clock,
  LayoutGrid,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  LogOut,
  Star
} from 'lucide-react';
import { Button, Modal } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import styles from './Quiz.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addQuizSession, userSettings, updateSpacedRevision, isInSpacedRevision, updateWrongQuestionStreak, isWrongQuestion, toggleFlagQuestion, isFlagged } = useQuiz();

  const [quizQuestions] = useState(() => location.state?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => 
    location.state?.session?.answers || (location.state?.questions || []).map(() => null)
  );
  
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const [shuffledOptions] = useState(() => {
    const saved = location.state?.session?.shuffledOptions;
    if (saved) return saved;
    return quizQuestions.map((_, idx) => shuffleArray(Array.from({ length: quizQuestions[idx]?.options?.length || 0 }, (_, i) => i)));
  });
  
  const [viewedQuestions, setViewedQuestions] = useState(() => {
    const initial = {};
    const saved = location.state?.session?.answers;
    (location.state?.questions || []).forEach((_, idx) => {
      initial[idx] = saved?.[idx] !== undefined && saved?.[idx] !== null;
    });
    // Mark first question as viewed
    if (location.state?.questions?.length > 0) initial[0] = true;
    return initial;
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  
  const timerRef = useRef(null);
  const submitFnRef = useRef(null);

  const session = location.state?.session;
  const mode = location.state?.mode || 'practice';
  const isPractice = mode === 'practice';
  const isTimed = mode === 'timed' || mode === 'quiz';
  const isDueMode = mode === 'due';

  // Navigation Guard
  useEffect(() => {
    if (!session && !location.state?.session) {
      navigate('/practice');
    }
  }, [session, location.state, navigate]);

  // Timer Initialization
  useEffect(() => {
    if (isTimed && session?.total) {
      const timerDuration = mode === 'timed' 
        ? session.total * 15 
        : (userSettings.timerDefault || 30) * session.total;
      setTimeLeft(timerDuration);
    }
  }, [isTimed, session?.total, mode, userSettings.timerDefault]);

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    const score = quizQuestions.reduce((acc, q, idx) => {
      const answer = answers[idx];
      const originalIdx = answer !== null ? shuffledOptions[idx][answer] : null;
      return acc + (originalIdx === q.correct ? 1 : 0);
    }, 0);
    const finalSession = {
      ...session,
      score,
      total: quizQuestions.length,
      timeTaken: isTimed ? (userSettings.timerDefault || 30) * session.total - (timeLeft || 0) : 0,
      answers: answers,
      shuffledOptions,
    };
    const savedSession = addQuizSession(finalSession);
    navigate(`/results/${savedSession.id}`);
  }, [quizQuestions, answers, session, timeLeft, isTimed, userSettings.timerDefault, addQuizSession, navigate, shuffledOptions]);

  useEffect(() => {
    submitFnRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer Countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitFnRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  const handleNext = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setShowFeedback(false);
      setViewedQuestions(prev => ({ ...prev, [nextIdx]: true }));
    }
  }, [currentIndex, quizQuestions.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setShowFeedback(false);
      setViewedQuestions(prev => ({ ...prev, [prevIdx]: true }));
    }
  };

  const handleAnswerSelect = useCallback((optionIndex) => {
    if (showFeedback && isPractice) return;
    
    const currentQ = quizQuestions[currentIndex];
    const originalIdx = shuffledOptions[currentIndex][optionIndex];
    const isCorrect = currentQ && originalIdx === currentQ.correct;
    
    if (isDueMode && isInSpacedRevision(currentQ.id)) {
      updateSpacedRevision(currentQ.id, isCorrect);
    }
    
    if (!isDueMode && isWrongQuestion(currentQ.id)) {
      updateWrongQuestionStreak(currentQ.id, isCorrect);
    }
    
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = optionIndex;
      return newAnswers;
    });
    
    if (isPractice) {
      setShowFeedback(true);
      setTimeout(() => {
        handleNext();
      }, 800);
    } else {
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  }, [currentIndex, showFeedback, isPractice, handleNext, isDueMode, quizQuestions, isInSpacedRevision, updateSpacedRevision, isWrongQuestion, updateWrongQuestionStreak]);

  const currentQuestion = quizQuestions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const answeredCount = answers.filter(a => a !== null).length;
  const skippedCount = Object.keys(viewedQuestions).filter(k => 
    viewedQuestions[k] && answers[parseInt(k)] === null && parseInt(k) !== currentIndex
  ).length;
  const unseenCount = quizQuestions.length - Object.keys(viewedQuestions).length;
  const leftCount = quizQuestions.length - answeredCount;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => (answeredCount / quizQuestions.length) * 100;

  const getQuestionStatus = (idx) => {
    if (answers[idx] !== null) return 'answered';
    if (idx === currentIndex) return 'current';
    if (viewedQuestions[idx]) return 'skipped';
    return 'unseen';
  };

  if (!session || quizQuestions.length === 0) return null;

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.quitBtn} onClick={() => setShowQuitModal(true)} title="Quit Quiz">
            <LogOut size={20} />
          </button>
          
          <div className={styles.headerCenter}>
            <div className={styles.brandInfo}>
              <span className={styles.modeBadge}>{mode}</span>
              <span className={styles.subjectName}>{session?.subject || 'Quiz Session'}</span>
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${getProgressPercent()}%` }} />
              </div>
              <span className={styles.progressText}>
                {currentIndex + 1} / {quizQuestions.length}
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            {isTimed && timeLeft !== null && (
              <div className={`${styles.timer} ${timeLeft < 60 ? styles.warning : ''}`}>
                <Clock size={18} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className={styles.main}>
        <div className={styles.quizContent}>
          {/* Question Card */}
          <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>Question {currentIndex + 1}</span>
              {isPractice && showFeedback && (() => {
                const originalIdx = currentAnswer !== null ? shuffledOptions[currentIndex][currentAnswer] : null;
                const isCorrect = originalIdx === currentQuestion.correct;
                return (
                  <div className={`${styles.resultBadge} ${isCorrect ? styles.correctBadge : styles.incorrectBadge}`}>
                    {isCorrect ? (
                      <><Check size={16} /> <span>Correct</span></>
                    ) : (
                      <><X size={16} /> <span>Incorrect</span></>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className={styles.questionTitleRow}>
              <h2 className={styles.questionText}>
                {currentQuestion?.text}
              </h2>
              <button 
                className={`${styles.flagBtn} ${isFlagged(currentQuestion.id) ? styles.flagged : ''}`}
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                title={isFlagged(currentQuestion.id) ? "Remove flag" : "Flag question"}
              >
                <Star size={18} fill={isFlagged(currentQuestion.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Options Grid */}
          <div className={styles.options}>
            {shuffledOptions[currentIndex]?.map((originalIdx, displayIdx) => {
              const option = currentQuestion.options[originalIdx];
              const isSelected = currentAnswer === displayIdx;
              const isCorrect = originalIdx === currentQuestion.correct;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={originalIdx}
                  className={`${styles.option} ${isSelected ? styles.selected : ''} ${showCorrect ? styles.correct : ''} ${showIncorrect ? styles.incorrect : ''}`}
                  onClick={() => handleAnswerSelect(displayIdx)}
                  disabled={showFeedback && !isPractice}
                >
                  <span className={styles.optionLetter}>{OPTION_LETTERS[displayIdx]}</span>
                  <span className={styles.optionText}>{option}</span>
                  {showCorrect && <Check size={20} className={styles.optionIcon} />}
                  {showIncorrect && <X size={20} className={styles.optionIcon} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - Navigator */}
        <aside className={styles.sidebar}>
          <div className={styles.matrixCard}>
            <div className={styles.matrixTitle}>
              <LayoutGrid size={18} />
              <span>Navigator</span>
            </div>
            <div className={styles.matrixGrid}>
              {quizQuestions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                return (
                  <button
                    key={idx}
                    className={`${styles.matrixItem} ${styles[status]}`}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowFeedback(false);
                      if (!viewedQuestions[idx]) {
                        setViewedQuestions(prev => ({ ...prev, [idx]: true }));
                      }
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={styles.legendLeft}>
                  <span className={`${styles.legendDot} ${styles.legendAnswered}`} />
                  <span className={styles.legendLabel}>Answered</span>
                </div>
                <span className={styles.legendCount}>{answeredCount}</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendLeft}>
                  <span className={`${styles.legendDot} ${styles.legendSkipped}`} />
                  <span className={styles.legendLabel}>Skipped</span>
                </div>
                <span className={styles.legendCount}>{skippedCount}</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendLeft}>
                  <span className={`${styles.legendDot} ${styles.legendUnseen}`} />
                  <span className={styles.legendLabel}>Unseen</span>
                </div>
                <span className={styles.legendCount}>{unseenCount}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Bar */}
      <footer className={styles.bottomBar}>
        <div className={styles.bottomContent}>
          <div className={styles.bottomStats}>
            <div className={styles.bottomStat}>
              <span className={styles.bottomStatValue}>{quizQuestions.length}</span>
              <span className={styles.bottomStatLabel}>Total</span>
            </div>
            <div className={styles.bottomStat}>
              <span className={`${styles.bottomStatValue} ${styles.attempted}`}>{answeredCount}</span>
              <span className={styles.bottomStatLabel}>Attempted</span>
            </div>
            <div className={styles.bottomStat}>
              <span className={`${styles.bottomStatValue} ${styles.left}`}>{leftCount}</span>
              <span className={styles.bottomStatLabel}>Left</span>
            </div>
          </div>

          <div className={styles.navActions}>
            <button
              className={`${styles.navBtn} ${styles.prevBtn}`}
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>
            
            {currentIndex === quizQuestions.length - 1 ? (
              <button className={`${styles.navBtn} ${styles.submitBtn}`} onClick={() => setShowSubmitModal(true)}>
                <span>Submit Quiz</span>
                <Send size={18} />
              </button>
            ) : (
              <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNext}>
                <span>Next Question</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Confirmation Modals */}
      <Modal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        showCloseButton={false}
        size="small"
      >
        <div className={styles.confirmContent}>
          <div className={styles.confirmIcon}>
            <AlertTriangle size={32} />
          </div>
          <h3 className={styles.confirmTitle}>Exit Quiz?</h3>
          <p className={styles.confirmText}>Are you sure you want to exit? Your current progress will not be saved.</p>
          
          <div className={styles.modalStats}>
            <div className={styles.modalStatCard}>
              <span className={styles.modalStatVal} style={{ color: 'var(--color-primary)' }}>{answeredCount}</span>
              <span className={styles.modalStatLab}>Answered</span>
            </div>
            <div className={styles.modalStatCard}>
              <span className={styles.modalStatVal} style={{ color: 'var(--color-muted)' }}>{leftCount}</span>
              <span className={styles.modalStatLab}>Remaining</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Button variant="secondary" onClick={() => setShowQuitModal(false)} fullWidth>
              Continue
            </Button>
            <Button variant="danger" onClick={() => navigate('/practice')} fullWidth>
              Exit Anyway
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        showCloseButton={false}
        size="small"
      >
        <div className={styles.confirmContent}>
          <div className={styles.confirmIcon} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }}>
            <Check size={32} />
          </div>
          <h3 className={styles.confirmTitle}>Finish Quiz</h3>
          <p className={styles.confirmText}>Ready to see your results? You've answered {answeredCount} out of {quizQuestions.length} questions.</p>
          
          {leftCount > 0 && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#854d0e', fontSize: '0.85rem' }}>
              Warning: {leftCount} questions are still unanswered.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)} fullWidth>
              Go Back
            </Button>
            <Button onClick={handleSubmit} fullWidth>
              Submit Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}