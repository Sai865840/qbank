import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  RotateCcw,
  ArrowLeft,
  Award,
  AlertCircle,
  HelpCircle,
  Calendar,
  Repeat,
  Flame,
  Trophy,
} from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import styles from './Results.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const getScoreMessage = (percent) => {
  if (percent >= 90) return { text: 'Excellent!', subtext: 'You nailed it! Keep up the great work.' };
  if (percent >= 70) return { text: 'Great Job!', subtext: 'Solid performance. A little more practice will make it perfect.' };
  if (percent >= 50) return { text: 'Good Effort!', subtext: "You're on the right track. Keep practicing!" };
  return { text: 'Keep Trying!', subtext: "Don't give up. Practice makes progress." };
};

const getScoreColor = (percent) => {
  if (percent >= 70) return '#10B981';
  if (percent >= 50) return '#F59E0B';
  return '#EF4444';
};

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { quizSessions, questions, addToSpacedRevision, isInSpacedRevision, addToWrongQuestions, isWrongQuestion, isFlagged } = useQuiz();

  const session = quizSessions.find(s => s.id === sessionId);
  const [reviewFilter, setReviewFilter] = useState('all');

  const isDueMode = session?.mode === 'due';
  const isEndless = session?.mode === 'endless';
  const isGameOver = session?.gameOver === true;
  const bestStreak = session?.bestStreak || 0;
  const canAddToSpacedRevision = !isDueMode;

  if (!session) {
    return (
      <div className={styles.page}>
        <Card className={styles.emptyState}>
          <HelpCircle className={styles.emptyIcon} size={64} />
          <h2 className={styles.emptyTitle}>Session not found</h2>
          <p className={styles.emptyText}>This quiz session doesn't exist</p>
          <Button onClick={() => navigate('/practice')}>Go to Practice</Button>
        </Card>
      </div>
    );
  }

  const score = session.score || 0;
  const total = session.total || session.questions?.length || 0;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const { text: scoreMessage, subtext: scoreSubtext } = getScoreMessage(percent);
  const scoreColor = getScoreColor(percent);

  const sessionQuestions = session.questions?.length > 0
    ? session.questions.map(id => questions.find(q => q.id === id)).filter(Boolean)
    : questions.slice(0, total);

  const shuffledOptions = session.shuffledOptions || null;

  const reviewItems = sessionQuestions.map((q, idx) => {
    const userAnswer = session.answers?.[idx];
    const originalIdx = shuffledOptions && userAnswer !== null && shuffledOptions[idx] 
      ? shuffledOptions[idx][userAnswer] 
      : userAnswer;
    const isCorrect = originalIdx === q.correct;
    const isSkipped = userAnswer === null || userAnswer === undefined;

    return {
      question: q,
      index: idx,
      userAnswer: originalIdx,
      displayAnswer: userAnswer,
      displayLetter: userAnswer !== null ? OPTION_LETTERS[userAnswer] : null,
      isCorrect,
      isSkipped,
      isFlagged: isFlagged(q.id),
      status: isSkipped ? 'skipped' : isCorrect ? 'correct' : 'incorrect',
    };
  });

  const filteredItems = reviewItems.filter(item => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'correct') return item.isCorrect;
    if (reviewFilter === 'incorrect') return !item.isSkipped && !item.isCorrect;
    if (reviewFilter === 'skipped') return item.isSkipped;
    if (reviewFilter === 'flagged') return item.isFlagged;
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="small" onClick={() => navigate('/practice')}>
            <ArrowLeft size={18} /> Back
          </Button>
          {isEndless && isGameOver ? (
            <span className={styles.modeBadge} style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
              <Flame size={14} style={{ marginRight: 4 }} />
              Game Over
            </span>
          ) : (
            <span className={styles.modeBadge}>
              {session.mode?.charAt(0).toUpperCase() + session.mode?.slice(1)} Mode
            </span>
          )}
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/practice')}>
            <RotateCcw size={18} /> Try Again
          </Button>
        </div>
      </header>

      <div className={styles.scoreSection}>
        {isEndless && isGameOver ? (
          <>
            <Card className={styles.scoreCard} style={{ border: '2px solid #DC2626' }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <Flame size={48} style={{ color: '#DC2626', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626', marginBottom: '0.25rem' }}>
                  Game Over!
                </div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  You got one wrong and the challenge ended.
                </div>
              </div>
            </Card>

            <Card>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
                    <Flame size={18} style={{ color: '#DC2626' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{bestStreak}</div>
                    <div className={styles.statLabel}>Best Streak</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <Target size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{score}/{total}</div>
                    <div className={styles.statLabel}>Correct</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Trophy size={18} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{percent}%</div>
                    <div className={styles.statLabel}>Accuracy</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <Clock size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{formatTime(session.timeTaken)}</div>
                    <div className={styles.statLabel}>Time</div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className={styles.scoreCard}>
              <div className={styles.scoreRing}>
                <svg className={styles.scoreRingSvg}>
                  <circle
                    className={styles.scoreRingBg}
                    cx="45"
                    cy="45"
                    r="40"
                  />
                  <circle
                    className={styles.scoreRingProgress}
                    cx="45"
                    cy="45"
                    r="40"
                    stroke={scoreColor}
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(1 - percent / 100) * (2 * Math.PI * 40)}
                  />
                </svg>
                <div className={styles.scoreValue}>
                  <div className={styles.scorePercent}>{percent}%</div>
                  <div className={styles.scoreLabel}>Score</div>
                </div>
              </div>
              <div className={styles.scoreTextContent}>
                <div className={styles.scoreMessage}>{scoreMessage}</div>
                <div className={styles.scoreSubtext}>{scoreSubtext}</div>
              </div>
            </Card>

            <Card>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <Target size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{score}/{total}</div>
                    <div className={styles.statLabel}>Correct</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <Clock size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{formatTime(session.timeTaken)}</div>
                    <div className={styles.statLabel}>Time</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                    <Award size={18} style={{ color: '#2563EB' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue} style={{ fontSize: '0.85rem' }}>{session.subject}</div>
                    <div className={styles.statLabel}>Subject</div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className={styles.reviewSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Question Review</h2>
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${reviewFilter === 'all' ? styles.active : ''}`}
              onClick={() => setReviewFilter('all')}
            >
              All ({reviewItems.length})
            </button>
            <button
              className={`${styles.filterTab} ${reviewFilter === 'correct' ? styles.active : ''}`}
              onClick={() => setReviewFilter('correct')}
            >
              Correct ({reviewItems.filter(i => i.isCorrect).length})
            </button>
            <button
              className={`${styles.filterTab} ${reviewFilter === 'incorrect' ? styles.active : ''}`}
              onClick={() => setReviewFilter('incorrect')}
            >
              Incorrect ({reviewItems.filter(i => !i.isSkipped && !i.isCorrect).length})
            </button>
            <button
              className={`${styles.filterTab} ${reviewFilter === 'skipped' ? styles.active : ''}`}
              onClick={() => setReviewFilter('skipped')}
            >
              Skipped ({reviewItems.filter(i => i.isSkipped).length})
            </button>
            <button
              className={`${styles.filterTab} ${reviewFilter === 'flagged' ? styles.active : ''}`}
              onClick={() => setReviewFilter('flagged')}
            >
              Flagged ({reviewItems.filter(i => i.isFlagged).length})
            </button>
          </div>
        </div>

        <div className={styles.reviewList}>
          {filteredItems.map((item) => (
            <Card
              key={item.question.id || item.index}
              className={`${styles.reviewItem} ${styles[item.status]}`}
            >
              <div className={styles.reviewHeader}>
                <div className={styles.reviewNumber}>
                  {item.status === 'correct' ? <CheckCircle size={18} /> :
                   item.status === 'skipped' ? <AlertCircle size={18} /> :
                   <XCircle size={18} />}
                </div>
                <div className={styles.reviewContent}>
                  <div className={styles.reviewQuestion}>{item.question.text}</div>
                  <div className={styles.reviewAnswer}>
                    {item.isSkipped ? (
                      <span style={{ color: 'var(--color-warning)' }}>Not answered</span>
                    ) : (
                      <div className={styles.answerRow}>
                        <span>Your answer: <strong>{item.displayLetter}. {item.question.options[item.userAnswer]}</strong></span>
                        {!item.isCorrect && (
                          <span className={styles.correctAnswerText}>
                            Correct: <strong>{OPTION_LETTERS[item.question.correct]}. {item.question.options[item.question.correct]}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.reviewIcon}>
                  {item.isCorrect && <CheckCircle className={styles.correctIcon} size={24} />}
                  {!item.isCorrect && !item.isSkipped && <XCircle className={styles.incorrectIcon} size={24} />}
                  {item.isSkipped && <AlertCircle className={styles.skippedIcon} size={24} />}
                </div>
              </div>

              <div className={styles.reviewActions}>
                {canAddToSpacedRevision && !isInSpacedRevision(item.question.id) && (
                  <button 
                    className={styles.actionBtn}
                    onClick={() => addToSpacedRevision(item.question.id)}
                  >
                    <Calendar size={14} />
                    <span>Add to Spaced Revision</span>
                  </button>
                )}
                {canAddToSpacedRevision && isInSpacedRevision(item.question.id) && (
                  <div className={styles.addedBadge}>
                    <Repeat size={12} />
                    <span>In Revision</span>
                  </div>
                )}
                {(!item.isCorrect || item.isSkipped) && !isWrongQuestion(item.question.id) && (
                  <button 
                    className={`${styles.actionBtn} ${styles.wrongBtn}`}
                    onClick={() => addToWrongQuestions(item.question.id)}
                  >
                    <AlertCircle size={14} />
                    <span>Add to Wrong List</span>
                  </button>
                )}
                {isWrongQuestion(item.question.id) && (
                  <div className={`${styles.addedBadge} ${styles.wrongBadge}`}>
                    <AlertCircle size={12} />
                    <span>In Wrong List</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
