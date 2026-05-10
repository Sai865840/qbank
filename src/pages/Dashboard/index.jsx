import { Link } from 'react-router-dom';
import {
  BookOpen,
  HelpCircle,
  Target,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getChartData = (sessions) => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date === dateStr);
    last7Days.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      score: daySessions.length > 0
        ? Math.round(daySessions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / daySessions.length)
        : 0,
      count: daySessions.length,
    });
  }
  return last7Days;
};

const getScoreClass = (score, total) => {
  const pct = (score / total) * 100;
  if (pct >= 70) return styles.scoreHigh;
  if (pct >= 40) return styles.scoreMed;
  return styles.scoreLow;
};

export function Dashboard() {
  const { stats, quizSessions, subjects, topics, questions, spacedRevision, wrongQuestions } = useQuiz();
  const recentSessions = quizSessions.slice(0, 5);
  const chartData = getChartData(quizSessions);

  const revisionCount = Object.keys(spacedRevision || {}).length;
  const wrongCount = Object.keys(wrongQuestions || {}).length;

  const statCards = [
    {
      icon: BookOpen,
      color: '#2563EB',
      bg: 'rgba(37, 99, 235, 0.1)',
      value: subjects.length,
      label: 'Subjects',
    },
    {
      icon: HelpCircle,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      value: questions.length,
      label: 'Questions',
    },
    {
      icon: Target,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      value: quizSessions.length > 0 ? `${stats.averageScore}%` : '-',
      label: 'Avg Score',
    },
    {
      icon: Clock,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      value: stats.totalTime > 0 ? formatTime(stats.totalTime) : '-',
      label: 'Total Time',
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back!</h1>
        <p className={styles.subtitle}>Track your progress and keep practicing</p>
      </header>

      <div className={styles.statsGrid}>
        {statCards.map((stat, idx) => (
          <Card key={idx} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: stat.bg }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </Card>
        ))}
        {revisionCount > 0 && (
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Repeat size={24} style={{ color: '#8B5CF6' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{revisionCount}</div>
              <div className={styles.statLabel}>In Revision</div>
            </div>
          </Card>
        )}
        {wrongCount > 0 && (
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle size={24} style={{ color: '#EF4444' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{wrongCount}</div>
              <div className={styles.statLabel}>Wrong List</div>
            </div>
          </Card>
        )}
      </div>

      <div className={styles.contentGrid}>
        <Card className={styles.chartCard}>
          <h2 className={styles.sectionTitle}>Weekly Activity</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div>
          <Card>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            {recentSessions.length > 0 ? (
              <div className={styles.activityList}>
                {recentSessions.map((session) => (
                  <div key={session.id} className={styles.activityItem}>
                    <div
                      className={styles.activityIcon}
                      style={{ background: 'rgba(37, 99, 235, 0.1)' }}
                    >
                      <CheckCircle size={20} style={{ color: '#2563EB' }} />
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>{session.subject}</div>
                      <div className={styles.activityMeta}>
                        {formatDate(session.date)} · {session.mode}
                      </div>
                    </div>
                    <div className={`${styles.activityScore} ${getScoreClass(session.score, session.total)}`}>
                      {session.score}/{session.total}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <TrendingUp className={styles.emptyIcon} size={48} />
                <p className={styles.emptyText}>No activity yet. Start a quiz!</p>
              </div>
            )}
            <Link to="/practice" className={styles.quickStart}>
              <Play size={18} />
              Start Practicing
            </Link>
          </Card>

          {topics.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 10 }}>
                  <BookOpen size={22} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{topics.length} topics</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Across {subjects.length} subjects</div>
                </div>
              </div>
            </Card>
          )}

          {revisionCount > 0 && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 10, borderRadius: 10 }}>
                  <Repeat size={22} style={{ color: '#8B5CF6' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{revisionCount} in spaced revision</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Keep practicing to master!</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
