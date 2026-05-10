import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Card, Button, Badge } from '../../components/shared';
import { useQuiz } from '../../context/QuizContext';
import styles from './AddQuestion.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function AddQuestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjects, topics, addQuestion, updateQuestion } = useQuiz();

  const editQuestion = location.state?.question;
  const defaultTopicId = location.state?.topicId || '';
  const defaultSubjectId = location.state?.subjectId || '';

  const [text, setText] = useState(editQuestion?.text || '');
  const [options, setOptions] = useState(editQuestion?.options || ['', '', '', '']);
  const [correct, setCorrect] = useState(editQuestion?.correct ?? 0);
  const [difficulty, setDifficulty] = useState(editQuestion?.difficulty || 'easy');
  const [selectedSubject, setSelectedSubject] = useState(editQuestion?.subjectId || defaultSubjectId || subjects[0]?.id || '');
  const [selectedTopic, setSelectedTopic] = useState(editQuestion?.topicId || defaultTopicId || '');
  const [errors, setErrors] = useState({});

  const filteredTopics = topics.filter(t => t.subjectId === selectedSubject);

  const validate = () => {
    const errs = {};
    if (!text.trim()) errs.text = 'Question text is required';
    if (!selectedSubject) errs.subject = 'Select a subject';
    if (!selectedTopic) errs.topic = 'Select a topic';
    if (!options.every(o => o.trim())) errs.options = 'All options required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      text: text.trim(),
      options: options.map(o => o.trim()),
      correct,
      difficulty,
      topicId: selectedTopic,
      subjectId: selectedSubject,
    };

    if (editQuestion) updateQuestion(editQuestion.id, data);
    else addQuestion(data);
    navigate('/questions');
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correct >= newOptions.length) setCorrect(newOptions.length - 1);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button variant="ghost" size="small" onClick={() => navigate('/questions')}>
          <ArrowLeft size={18} /> Back
        </Button>
        <h1 className={styles.title}>{editQuestion ? 'Edit Question' : 'Add New Question'}</h1>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainForm}>
          <Card className={styles.formCard}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Question Details</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Subject & Topic</label>
                <div className={styles.rowTwo}>
                  <select 
                    className={styles.select} 
                    value={selectedSubject} 
                    onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select 
                    className={styles.select} 
                    value={selectedTopic} 
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={!selectedSubject}
                  >
                    <option value="">Select Topic</option>
                    {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                {(errors.subject || errors.topic) && (
                  <div className={styles.errorMsg}>
                    {errors.subject || errors.topic}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Question Text</label>
                <textarea 
                  className={styles.textarea} 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Enter your question here..."
                  rows={4}
                />
                {errors.text && <span className={styles.errorMsg}>{errors.text}</span>}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Answer Options</h3>
                <span className={styles.hint}>Select the correct answer</span>
              </div>
              
              <div className={styles.optionsList}>
                {options.map((opt, idx) => (
                  <div key={idx} className={`${styles.optionRow} ${correct === idx ? styles.correctOption : ''}`}>
                    <button 
                      type="button"
                      className={styles.radioBtn}
                      onClick={() => setCorrect(idx)}
                    >
                      {correct === idx && <div className={styles.radioInner} />}
                    </button>
                    <span className={styles.optionLetter}>{OPTION_LETTERS[idx]}</span>
                    <input 
                      className={styles.optionInput} 
                      value={opt} 
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <button type="button" className={styles.removeBtn} onClick={() => removeOption(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {options.length < 6 && (
                <button type="button" className={styles.addOptionBtn} onClick={addOption}>
                  <Plus size={16} /> Add Option
                </button>
              )}
              {errors.options && <span className={styles.errorMsg}>{errors.options}</span>}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Difficulty Level</h3>
              <div className={styles.difficultyGroup}>
                {DIFFICULTIES.map((d) => (
                  <button 
                    key={d} 
                    type="button" 
                    className={`${styles.difficultyBtn} ${difficulty === d ? styles[d] : ''}`} 
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'easy' && <span className={styles.diffIcon}>E</span>}
                    {d === 'medium' && <span className={styles.diffIcon}>M</span>}
                    {d === 'hard' && <span className={styles.diffIcon}>H</span>}
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate('/questions')}>Cancel</Button>
            <Button onClick={handleSubmit} className={styles.saveBtn}>
              <Save size={18} /> {editQuestion ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.previewCard}>
            <h3 className={styles.previewTitle}>Preview</h3>
            <div className={styles.previewBox}>
              <div className={styles.previewQuestion}>
                {text || 'Your question will appear here...'}
              </div>
              <div className={styles.previewOptions}>
                {options.map((opt, idx) => (
                  <div key={idx} className={`${styles.previewOption} ${correct === idx ? styles.previewCorrect : ''}`}>
                    <span className={styles.previewLetter}>{OPTION_LETTERS[idx]}</span>
                    <span>{opt || `Option ${idx + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.previewMeta}>
              <Badge variant={difficulty === 'easy' ? 'success' : difficulty === 'medium' ? 'warning' : 'error'}>
                {difficulty}
              </Badge>
              {selectedSubject && (
                <Badge variant="primary">{subjects.find(s => s.id === selectedSubject)?.name}</Badge>
              )}
              {selectedTopic && (
                <Badge variant="default">{topics.find(t => t.id === selectedTopic)?.name}</Badge>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}