import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Database,
  FolderOpen,
  FileText,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/shared';
import { Modal } from '../../components/shared/Modal';
import { useQuiz } from '../../context/QuizContext';
import styles from './QuestionBank.module.css';

const SUBJECT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const PAGE_SIZE = 15;

const SAMPLE_JSON = `[\n  {\n    "text": "What is 2+2?",\n    "options": ["3", "4", "5", "6"],\n    "correct": 1,\n    "difficulty": "easy",\n    "topicId": "topic-1"\n  }\n]`;

function SubjectModal({ isOpen, onClose, subject, onSave, onDelete }) {
  const [name, setName] = useState(subject?.name || '');
  const [color, setColor] = useState(subject?.color || SUBJECT_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon: 'book' });
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={subject ? 'Edit Subject' : 'Add Subject'} size="small">
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mathematics" autoFocus />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {SUBJECT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: color === c ? '3px solid var(--color-text)' : '3px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          {subject && <Button type="button" variant="danger" onClick={() => { onDelete(subject.id); onClose(); }}>Delete</Button>}
          <div style={{ flex: 1 }} />
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function TopicModal({ isOpen, onClose, topic, subjects, onSave, onDelete }) {
  const [name, setName] = useState(topic?.name || '');
  const [subjectId, setSubjectId] = useState(topic?.subjectId || subjects[0]?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !subjectId) return;
    onSave({ name: name.trim(), subjectId });
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={topic ? 'Edit Topic' : 'Add Topic'} size="small">
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Subject</label>
          <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Topic Name</label>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Algebra" autoFocus />
        </div>
        <div className={styles.modalFooter}>
          {topic && <Button type="button" variant="danger" onClick={() => { onDelete(topic.id); onClose(); }}>Delete</Button>}
          <div style={{ flex: 1 }} />
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function BulkImportModal({ isOpen, onClose, onImport, addToast }) {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_JSON);
    setCopied(true);
    addToast?.('Sample format copied!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(json);
      const questions = Array.isArray(data) ? data : data.questions || [];
      if (questions.length === 0) { setError('No questions found'); return; }
      const valid = questions.filter(q => q.text && q.options && q.options.length >= 2 && q.correct !== undefined);
      if (valid.length === 0) { setError('Questions need text, options, and correct index'); return; }
      onImport(valid);
      setJson('');
      setError('');
      onClose();
    } catch { setError('Invalid JSON'); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import" size="medium">
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label className={styles.label}>Paste JSON Array</label>
          <button className={styles.copyBtn} onClick={handleCopySample}>
            <FileText size={14} />
            {copied ? 'Copied!' : 'Copy Sample'}
          </button>
        </div>
        <textarea className={styles.bulkArea} value={json} onChange={(e) => { setJson(e.target.value); setError(''); }} placeholder={SAMPLE_JSON} />
        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: 8 }}>{error}</p>}
        <p className={styles.bulkHint}>Format: text, options[], correct(index), difficulty, topicId</p>
      </div>
      <div className={styles.modalFooter}>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleImport} disabled={!json.trim()}>Import</Button>
      </div>
    </Modal>
  );
}

export function QuestionBank() {
  const navigate = useNavigate();
  const {
    subjects, topics, questions, quizSessions, addSubject, updateSubject, deleteSubject,
    addTopic, updateTopic, deleteTopic, deleteQuestion, bulkAddQuestions, getTopicsBySubject, addToast,
    getSpacedRevisionData, isInSpacedRevision, getWrongQuestionStreak, isWrongQuestion,
    spacedRevision, wrongQuestions,
  } = useQuiz();

  const [activeTab, setActiveTab] = useState('subjects');
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [page, setPage] = useState(1);
  const [subjectModal, setSubjectModal] = useState({ isOpen: false, subject: null });
  const [topicModal, setTopicModal] = useState({ isOpen: false, topic: null });
  const [bulkModal, setBulkModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const openSubjectModal = (subject = null) => setSubjectModal({ isOpen: true, subject });
  const openTopicModal = (topic = null) => setTopicModal({ isOpen: true, topic });

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const filteredTopics = topics.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubject && t.subjectId !== filterSubject) return false;
    return true;
  });

  const filteredQuestions = questions.filter(q => {
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubject) {
      const topic = topics.find(t => t.id === q.topicId);
      if (topic?.subjectId !== filterSubject) return false;
    }
    if (filterTopic && q.topicId !== filterTopic) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const paginatedQuestions = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaveSubject = (data) => {
    if (subjectModal.subject) updateSubject(subjectModal.subject.id, data);
    else addSubject(data);
  };

  const handleSaveTopic = (data) => {
    if (topicModal.topic) updateTopic(topicModal.topic.id, data);
    else addTopic(data);
  };

  const handleBulkImport = (questionsList) => {
    bulkAddQuestions(questionsList);
  };

  const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || '';
  const getTopicName = (topicId) => topics.find(t => t.id === topicId)?.name || '';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Question Bank</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Button onClick={() => navigate('/questions/add')}><Plus size={18} /> Add Question</Button>
          <Button variant="secondary" onClick={() => openTopicModal()}><Plus size={18} /> Topic</Button>
          <Button variant="secondary" onClick={() => openSubjectModal()}><Plus size={18} /> Subject</Button>
          <Button variant="ghost" onClick={() => setBulkModal(true)}><Upload size={18} /></Button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'subjects' ? styles.active : ''}`} onClick={() => { setActiveTab('subjects'); setSearch(''); }}>Subjects ({subjects.length})</button>
        <button className={`${styles.tab} ${activeTab === 'topics' ? styles.active : ''}`} onClick={() => { setActiveTab('topics'); setSearch(''); }}>Topics ({topics.length})</button>
        <button className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`} onClick={() => { setActiveTab('questions'); setSearch(''); }}>Questions ({questions.length})</button>
      </div>

      {activeTab === 'subjects' && (
        filteredSubjects.length > 0 ? (
          <div className={styles.subjectsGrid}>
            {filteredSubjects.map((subject) => {
              const subjectTopics = getTopicsBySubject(subject.id);
              const questionCount = questions.filter(q => subjectTopics.some(t => t.id === q.topicId)).length;
              return (
                <Card key={subject.id} className={styles.subjectCard} style={{ borderLeftColor: subject.color }}>
                  <button className={styles.deleteBtn} onClick={() => setSubjectToDelete(subject)} title="Delete Subject">
                    <Trash2 size={14} />
                  </button>
                  <div className={styles.subjectHeader}>
                    <div className={styles.subjectIcon} style={{ background: subject.color + '20' }}><FolderOpen size={18} style={{ color: subject.color }} /></div>
                    <div className={styles.subjectName}>{subject.name}</div>
                  </div>
                  <div className={styles.subjectStats}>
                    <span className={styles.statDot}>{subjectTopics.length} topics</span>
                    <span className={styles.statDot}>{questionCount} questions</span>
                  </div>
                  <div className={styles.subjectActions}>
                    <button className={styles.actionBtn} onClick={() => openTopicModal()}><Plus size={12} /> Add Topic</button>
                    <button className={styles.actionBtn} onClick={() => openSubjectModal(subject)}><Edit2 size={12} /> Edit</button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className={styles.emptyState}>
              <Database className={styles.emptyIcon} size={48} />
              <h3 className={styles.emptyTitle}>No subjects yet</h3>
              <p className={styles.emptyText}>Create your first subject to get started</p>
              <Button onClick={() => openSubjectModal()}><Plus size={18} /> Add Subject</Button>
            </div>
          </Card>
        )
      )}

      {activeTab === 'topics' && (
        <>
          <div className={styles.filterRow}>
            <select className={styles.filterSelect} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {filteredTopics.length > 0 ? (
            <div className={styles.topicsGrid}>
              {filteredTopics.map((topic) => {
                const subject = subjects.find(s => s.id === topic.subjectId);
                const topicQuestions = questions.filter(q => q.topicId === topic.id);
                const questionCount = topicQuestions.length;
                
                const seenIds = new Set();
                quizSessions.forEach(s => s.questions?.forEach(qId => seenIds.add(qId)));
                const spacedIds = new Set(spacedRevision ? Object.keys(spacedRevision) : []);
                const wrongIds = new Set(wrongQuestions ? Object.keys(wrongQuestions) : []);
                
                const unseenCount = topicQuestions.filter(q => 
                  !seenIds.has(q.id) && !spacedIds.has(q.id) && !wrongIds.has(q.id)
                ).length;
                const wrongCount = topicQuestions.filter(q => wrongIds.has(q.id)).length;
                const scheduledCount = topicQuestions.filter(q => spacedIds.has(q.id)).length;

                return (
                  <Card key={topic.id} className={styles.topicCard} hoverable>
                    <div className={styles.topicHeader}>
                      <div className={styles.topicColor} style={{ background: subject?.color || '#2563EB' }} />
                      <div className={styles.topicName}>{topic.name}</div>
                    </div>
                    <div className={styles.topicStats}>
                      <div className={styles.topicStat}>
                        <span className={styles.topicStatValue}>{questionCount}</span>
                        <span className={styles.topicStatLabel}>Total</span>
                      </div>
                      <div className={styles.topicStat}>
                        <span className={styles.topicStatValue} style={{ color: '#10B981' }}>{unseenCount}</span>
                        <span className={styles.topicStatLabel}>Unseen</span>
                      </div>
                      <div className={styles.topicStat}>
                        <span className={styles.topicStatValue} style={{ color: '#EF4444' }}>{wrongCount}</span>
                        <span className={styles.topicStatLabel}>Wrong</span>
                      </div>
                      <div className={styles.topicStat}>
                        <span className={styles.topicStatValue} style={{ color: '#8B5CF6' }}>{scheduledCount}</span>
                        <span className={styles.topicStatLabel}>Scheduled</span>
                      </div>
                    </div>
                    <div className={styles.topicMeta}>
                      <Badge variant="default" size="small">{subject?.name}</Badge>
                    </div>
                    <div className={styles.topicActions}>
                      <button className={styles.iconBtn} onClick={async () => { try { await navigator.clipboard.writeText(topic.id); setCopiedId(topic.id); setTimeout(() => setCopiedId(null), 2000); addToast('Topic ID copied!', 'success'); } catch (e) { addToast('Failed to copy', 'error'); } }} title="Copy ID">{copiedId === topic.id ? <Check size={12} /> : <Copy size={12} />}</button>
                      <button className={styles.iconBtn} onClick={() => navigate('/questions/add', { state: { topicId: topic.id, subjectId: topic.subjectId } })} title="Add question"><Plus size={12} /></button>
                      <button className={styles.iconBtn} onClick={() => openTopicModal(topic)} title="Edit"><Edit2 size={12} /></button>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => deleteTopic(topic.id)} title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className={styles.emptyState}>
                <FolderOpen className={styles.emptyIcon} size={48} />
                <h3 className={styles.emptyTitle}>No topics found</h3>
                <p className={styles.emptyText}>Add topics to organize your questions</p>
                <Button onClick={() => openTopicModal()}><Plus size={18} /> Add Topic</Button>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'questions' && (
        <>
          <div className={styles.filterRow}>
            <select className={styles.filterSelect} value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setFilterTopic(''); setPage(1); }}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {filterSubject && (
              <select className={styles.filterSelect} value={filterTopic} onChange={(e) => { setFilterTopic(e.target.value); setPage(1); }}>
                <option value="">All Topics</option>
                {topics.filter(t => t.subjectId === filterSubject).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
          
          {paginatedQuestions.length > 0 ? (
            <>
              <div className={styles.questionList}>
                <div className={styles.questionListHeader}>
                  <span className={styles.colNum}>#</span>
                  <span className={styles.colQuestion}>Question</span>
                  <span className={styles.colMeta}>Subject / Topic</span>
                  <span className={styles.colStatus}>Learning Status</span>
                  <span className={styles.colActions}>Actions</span>
                </div>
                {paginatedQuestions.map((q, idx) => {
                  const revisionData = getSpacedRevisionData(q.id);
                  const isInRevision = isInSpacedRevision(q.id);
                  const wrongStreak = getWrongQuestionStreak(q.id);
                  const isWrong = isWrongQuestion(q.id);
                  
                  return (
                    <div key={q.id} className={styles.questionRow}>
                      <span className={styles.colNum}>{(page - 1) * PAGE_SIZE + idx + 1}</span>
                      <span className={styles.colQuestion}>{q.text}</span>
                      <span className={styles.colMeta}>
                        <Badge variant="primary" size="small">{getTopicName(q.topicId)}</Badge>
                      </span>
                      <span className={styles.colStatus}>
                        {isInRevision && revisionData && (
                          <Badge variant="info" size="small">
                            Due: {revisionData.nextRevision}
                          </Badge>
                        )}
                        {isWrong && (
                          <Badge variant="warning" size="small">
                            {wrongStreak}/5 Streak
                          </Badge>
                        )}
                        {!isInRevision && !isWrong && (
                          <Badge variant="default" size="small">New</Badge>
                        )}
                      </span>
                      <span className={styles.colActions}>
                        <button className={styles.iconBtn} onClick={() => navigate('/questions/add', { state: { question: q } })} title="Edit"><Edit2 size={14} /></button>
                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setQuestionToDelete(q)} title="Delete"><Trash2 size={14} /></button>
                      </span>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) p = page - 2 + i;
                      if (page > totalPages - 2) p = totalPages - 4 + i;
                    }
                    if (p < 1 || p > totalPages) return null;
                    return <button key={p} className={`${styles.pageBtn} ${p === page ? styles.active : ''}`} onClick={() => setPage(p)}>{p}</button>;
                  })}
                  <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                  <span className={styles.pageInfo}>Page {page} of {totalPages} ({filteredQuestions.length})</span>
                </div>
              )}
            </>
          ) : (
            <Card>
              <div className={styles.emptyState}>
                <Search className={styles.emptyIcon} size={48} />
                <h3 className={styles.emptyTitle}>No questions found</h3>
                <p className={styles.emptyText}>Add questions to start practicing</p>
                <Button onClick={() => navigate('/questions/add')}><Plus size={18} /> Add Question</Button>
              </div>
            </Card>
          )}
        </>
      )}

      <SubjectModal
        isOpen={subjectModal.isOpen}
        onClose={() => setSubjectModal({ isOpen: false, subject: null })}
        subject={subjectModal.subject}
        onSave={handleSaveSubject}
        onDelete={deleteSubject}
      />
      <TopicModal
        isOpen={topicModal.isOpen}
        onClose={() => setTopicModal({ isOpen: false, topic: null })}
        topic={topicModal.topic}
        subjects={subjects}
        onSave={handleSaveTopic}
        onDelete={deleteTopic}
      />
      <BulkImportModal isOpen={bulkModal} onClose={() => setBulkModal(false)} onImport={handleBulkImport} addToast={addToast} />
      
      <Modal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        title="Delete Question"
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setQuestionToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { deleteQuestion(questionToDelete.id); setQuestionToDelete(null); }}>Delete</Button>
          </>
        }
      >
        <div className={styles.confirmContent}>
          <div className={styles.confirmIcon}>
            <AlertTriangle size={20} />
          </div>
          <p>Delete this question?</p>
          {questionToDelete && (
            <div className={styles.confirmQuestion}>
              "{questionToDelete.text}"
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        title="Delete Subject"
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubjectToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { deleteSubject(subjectToDelete.id); setSubjectToDelete(null); }}>Delete</Button>
          </>
        }
      >
        <div className={styles.confirmContent}>
          <div className={styles.confirmIcon}>
            <AlertTriangle size={20} />
          </div>
          <p>Delete subject "{subjectToDelete?.name}"?</p>
          <p className={styles.confirmWarning}>All topics and questions under this subject will also be deleted.</p>
        </div>
      </Modal>
    </div>
  );
}