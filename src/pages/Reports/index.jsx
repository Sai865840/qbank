import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  Award,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import styles from './Reports.module.css';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getScoreClass = (score, total) => {
  const pct = (score / total) * 100;
  if (pct >= 70) return styles.scoreHigh;
  if (pct >= 40) return styles.scoreMed;
  return styles.scoreLow;
};

export function Reports() {
  const navigate = useNavigate();
  const { stats, quizSessions, subjects, questions, topics, spacedRevision, wrongQuestions } = useQuiz();

  const [timeRange, setTimeRange] = useState('7');

  const recentSessions = quizSessions.slice(0, 10);

  const getLastNDays = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const lastDays = getLastNDays(parseInt(timeRange));

  const activityData = lastDays.map(date => {
    const daySessions = quizSessions.filter(s => s.date === date);
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      sessions: daySessions.length,
      avgScore: daySessions.length > 0
        ? Math.round(daySessions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / daySessions.length)
        : null,
    };
  });

  const subjectData = subjects.map(subject => {
    const subjectSessions = quizSessions.filter(s => s.subject === subject.name);
    const totalScore = subjectSessions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0);
    return {
      name: subject.name,
      value: subjectSessions.length > 0 ? Math.round(totalScore / subjectSessions.length) : 0,
      sessions: subjectSessions.length,
      color: subject.color,
    };
  }).filter(s => s.sessions > 0);

  const learningProgressData = [
    { name: 'Total Questions', count: questions.length, color: '#2563EB' },
    { name: 'In Revision', count: Object.keys(spacedRevision || {}).length, color: '#8B5CF6' },
    { name: 'Wrong List', count: Object.keys(wrongQuestions || {}).length, color: '#EF4444' },
    { name: 'Topics', count: topics.length, color: '#10B981' },
  ];

  const modeData = [
    { name: 'Smart', key: 'smart' },
    { name: 'Wrong', key: 'wrong' },
    { name: 'Due Today', key: 'due' },
    { name: 'Unseen', key: 'unseen' },
    { name: 'Quick Mix', key: 'quick' },
  ].map(mode => ({
    name: mode.name,
    count: quizSessions.filter(s => s.mode === mode.key).length,
  })).filter(m => m.count > 0);

  const getTrend = () => {
    if (recentSessions.length < 2) return { direction: 'neutral', value: 0 };

    const half = Math.floor(recentSessions.length / 2);
    const recentHalf = recentSessions.slice(0, half);
    const olderHalf = recentSessions.slice(half);

    const recentAvg = recentHalf.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / olderHalf.length;
    const diff = recentAvg - olderAvg;

    return {
      direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'neutral',
      value: Math.abs(Math.round(diff)),
    };
  };

  const trend = getTrend();

  const statCards = [
    {
      icon: Award,
      color: '#2563EB',
      bg: 'rgba(37, 99, 235, 0.1)',
      value: stats.totalSessions,
      label: 'Total Quizzes',
    },
    {
      icon: Target,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      value: `${stats.averageScore}%`,
      label: 'Average Score',
      trend,
    },
    {
      icon: Clock,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      value: formatTime(stats.totalTime),
      label: 'Total Time',
    },
    {
      icon: CheckCircle,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      value: stats.totalQuestions,
      label: 'Questions Practiced',
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>Track your learning progress and performance</p>
      </header>

      <div className={styles.statsRow}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: stat.bg }}>
                <Icon size={22} style={{ color: stat.color }} />
              </div>
              <div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
              {stat.trend && (
                <div className={`${styles.trendBadge} ${styles[`trend${stat.trend.direction.charAt(0).toUpperCase() + stat.trend.direction.slice(1)}`]}`}>
                  {stat.trend.direction === 'up' && <TrendingUp size={12} />}
                  {stat.trend.direction === 'down' && <TrendingDown size={12} />}
                  {stat.trend.direction === 'neutral' && <Minus size={12} />}
                  {stat.trend.value > 0 ? `${stat.trend.value}%` : 'Same'}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Activity Over Time</h3>
            <select
              className={styles.filterSelect}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: '#2563EB', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Performance by Subject</h3>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value, name, props) => [`${value}%`, props.payload.name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Learning Progress</h3>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {learningProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Quizzes by Mode</h3>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Quiz Sessions</h3>
        </div>
        {recentSessions.length > 0 ? (
          <Card noPadding>
            <div style={{ padding: 16 }}>
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className={styles.recentItem}
                  onClick={() => navigate(`/results/${session.id}`)}
                >
                  <div
                    className={styles.recentIcon}
                    style={{ background: 'rgba(37, 99, 235, 0.1)' }}
                  >
                    <BarChart3 size={22} style={{ color: '#2563EB' }} />
                  </div>
                  <div className={styles.recentContent}>
                    <div className={styles.recentSubject}>{session.subject}</div>
                    <div className={styles.recentMeta}>
                      {formatDate(session.date)} · {session.mode} · {formatTime(session.timeTaken)}
                    </div>
                  </div>
                  <div className={`${styles.recentScore} ${getScoreClass(session.score, session.total)}`}>
                    {Math.round((session.score / session.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div className={styles.emptyState}>
              <BarChart3 className={styles.emptyIcon} size={64} />
              <h3 className={styles.emptyTitle}>No quiz history yet</h3>
              <p className={styles.emptyText}>Complete quizzes to see your progress here</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
