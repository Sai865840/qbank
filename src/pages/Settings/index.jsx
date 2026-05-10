import { useState, useRef } from 'react';
import {
  Timer,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { Modal } from '../../components/shared/Modal';
import { useQuiz } from '../../context/QuizContext';
import styles from './Settings.module.css';

export function Settings() {
  const { userSettings, updateSettings, subjects, topics, questions, quizSessions, spacedRevision, wrongQuestions } = useQuiz();
  const [localSettings, setLocalSettings] = useState(userSettings);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const fileInputRef = useRef(null);

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(userSettings);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    setLocalSettings(userSettings);
  };

  const handleClearData = (type) => {
    if (type === 'questions') {
      if (confirm('This will delete all questions. This cannot be undone. Continue?')) {
        localStorage.removeItem('quizwix_questions');
        window.location.reload();
      }
    } else if (type === 'sessions') {
      if (confirm('This will delete all quiz history. This cannot be undone. Continue?')) {
        localStorage.removeItem('quizwix_quizSessions');
        window.location.reload();
      }
    } else if (type === 'all') {
      setShowClearModal(true);
    }
  };

  const handleExportData = () => {
    const data = {
      version: '1.0',
      subjects: JSON.parse(localStorage.getItem('quizwix_subjects') || '[]'),
      topics: JSON.parse(localStorage.getItem('quizwix_topics') || '[]'),
      questions: JSON.parse(localStorage.getItem('quizwix_questions') || '[]'),
      quizSessions: JSON.parse(localStorage.getItem('quizwix_quizSessions') || '[]'),
      userSettings: JSON.parse(localStorage.getItem('quizwix_userSettings') || '{}'),
      spacedRevision: JSON.parse(localStorage.getItem('quizwix_spacedRevision') || '{}'),
      wrongQuestions: JSON.parse(localStorage.getItem('quizwix_wrongQuestions') || '{}'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizwix-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        const requiredFields = ['subjects', 'topics', 'questions', 'quizSessions', 'userSettings'];
        for (const field of requiredFields) {
          if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        const preview = {
          subjects: data.subjects?.length || 0,
          topics: data.topics?.length || 0,
          questions: data.questions?.length || 0,
          quizSessions: data.quizSessions?.length || 0,
          spacedRevision: Object.keys(data.spacedRevision || {}).length,
          wrongQuestions: Object.keys(data.wrongQuestions || {}).length,
          version: data.version || 'unknown',
          exportedAt: data.exportedAt || 'unknown',
        };

        setImportPreview(preview);
        setImportData(data);
        setImportError('');
        setShowImportModal(true);
      } catch (err) {
        setImportError('Invalid backup file. Please select a valid Quizwix export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importData) return;
    
    try {
      const data = importData;
      
      if (data.subjects) localStorage.setItem('quizwix_subjects', JSON.stringify(data.subjects));
      if (data.topics) localStorage.setItem('quizwix_topics', JSON.stringify(data.topics));
      if (data.questions) localStorage.setItem('quizwix_questions', JSON.stringify(data.questions));
      if (data.quizSessions) localStorage.setItem('quizwix_quizSessions', JSON.stringify(data.quizSessions));
      if (data.userSettings) localStorage.setItem('quizwix_userSettings', JSON.stringify(data.userSettings));
      if (data.spacedRevision) localStorage.setItem('quizwix_spacedRevision', JSON.stringify(data.spacedRevision));
      if (data.wrongQuestions) localStorage.setItem('quizwix_wrongQuestions', JSON.stringify(data.wrongQuestions));
      
      setShowImportModal(false);
      setImportPreview(null);
      setImportData(null);
      alert('Data imported successfully! Reloading...');
      window.location.reload();
    } catch (err) {
      setImportError('Failed to import data. Please try again.');
    }
  };

  const totalQuestions = questions.length;
  const totalSessions = quizSessions.length;

  const handleExportAndClear = () => {
    handleExportData();
    setTimeout(() => {
      const keysToRemove = [
        'quizwix_subjects',
        'quizwix_topics',
        'quizwix_questions',
        'quizwix_quizSessions',
        'quizwix_userSettings',
        'quizwix_spacedRevision',
        'quizwix_wrongQuestions',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setShowClearModal(false);
      window.location.reload();
    }, 500);
  };

  const handleClearWithoutExport = () => {
    const keysToRemove = [
      'quizwix_subjects',
      'quizwix_topics',
      'quizwix_questions',
      'quizwix_quizSessions',
      'quizwix_userSettings',
      'quizwix_spacedRevision',
      'quizwix_wrongQuestions',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setShowClearModal(false);
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your quiz experience</p>
      </header>

      <div className={styles.sections}>
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
              <Timer size={20} style={{ color: '#2563EB' }} />
            </div>
            <div>
              <div className={styles.sectionTitle}>Quiz Preferences</div>
              <div className={styles.sectionDesc}>Configure default quiz settings</div>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Timer Duration</div>
                <div className={styles.settingDesc}>Default time per question in seconds</div>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={localSettings.timerDefault}
                  onChange={(e) => handleChange('timerDefault', Math.max(5, parseInt(e.target.value) || 30))}
                  min={5}
                  max={120}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Questions Per Session</div>
                <div className={styles.settingDesc}>Default number of questions per quiz</div>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={localSettings.questionsPerSession}
                  onChange={(e) => handleChange('questionsPerSession', Math.max(1, parseInt(e.target.value) || 10))}
                  min={1}
                  max={50}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Show Explanations</div>
                <div className={styles.settingDesc}>Display explanation after answering</div>
              </div>
              <div className={styles.settingControl}>
                <button
                  className={`${styles.toggle} ${localSettings.showExplanations ? styles.active : ''}`}
                  onClick={() => handleChange('showExplanations', !localSettings.showExplanations)}
                  aria-label="Toggle show explanations"
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Sound Effects</div>
                <div className={styles.settingDesc}>Play sounds for correct/incorrect answers</div>
              </div>
              <div className={styles.settingControl}>
                <button
                  className={`${styles.toggle} ${localSettings.soundEffects ? styles.active : ''}`}
                  onClick={() => handleChange('soundEffects', !localSettings.soundEffects)}
                  aria-label="Toggle sound effects"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Download size={20} style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <div className={styles.sectionTitle}>Data Management</div>
              <div className={styles.sectionDesc}>Export or clear your data</div>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Export Data</div>
                <div className={styles.settingDesc}>Download complete backup (subjects, topics, questions, sessions, revision progress)</div>
              </div>
              <div className={styles.settingControl}>
                <Button variant="secondary" onClick={handleExportData}>
                  <Download size={16} /> Export
                </Button>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Import Data</div>
                <div className={styles.settingDesc}>Restore from a backup file</div>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json"
                  style={{ display: 'none' }}
                />
                <Button variant="secondary" onClick={handleImportClick}>
                  <Upload size={16} /> Import
                </Button>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Data Summary</div>
                <div className={styles.settingDesc}>
                  {subjects.length} subjects, {topics.length} topics, {totalQuestions} questions, {totalSessions} sessions, {Object.keys(spacedRevision).length} in revision, {Object.keys(wrongQuestions).length} wrong
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className={`${styles.section} ${styles.dangerZone}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <Trash2 size={20} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div className={styles.sectionTitle}>Danger Zone</div>
              <div className={styles.sectionDesc}>Irreversible actions</div>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.dangerItem}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerLabel}>Clear Questions</div>
                <div className={styles.dangerDesc}>Remove all questions and reset question data</div>
              </div>
              <Button variant="danger" size="small" onClick={() => handleClearData('questions')}>
                Clear
              </Button>
            </div>

            <div className={styles.dangerItem}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerLabel}>Clear Quiz History</div>
                <div className={styles.dangerDesc}>Remove all quiz sessions and history</div>
              </div>
              <Button variant="danger" size="small" onClick={() => handleClearData('sessions')}>
                Clear
              </Button>
            </div>

            <div className={styles.dangerItem}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerLabel}>Clear All Data</div>
                <div className={styles.dangerDesc}>Remove all data including subjects and topics</div>
              </div>
              <Button variant="danger" size="small" onClick={() => handleClearData('all')}>
                Clear All
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {hasChanges && (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleReset}>
            <RefreshCw size={16} /> Reset Changes
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      )}

      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportPreview(null); setImportData(null); setImportError(''); }}
        title="Import Data"
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowImportModal(false); setImportPreview(null); setImportError(''); }}>Cancel</Button>
            <Button onClick={handleImportConfirm}>Import Data</Button>
          </>
        }
      >
        {importError && (
          <div className={styles.importError}>
            <AlertTriangle size={16} />
            <span>{importError}</span>
          </div>
        )}
        {importPreview && (
          <div className={styles.importPreview}>
            <p className={styles.importTitle}>The following data will be imported:</p>
            <div className={styles.importStats}>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.subjects}</span>
                <span className={styles.importStatLabel}>Subjects</span>
              </div>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.topics}</span>
                <span className={styles.importStatLabel}>Topics</span>
              </div>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.questions}</span>
                <span className={styles.importStatLabel}>Questions</span>
              </div>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.quizSessions}</span>
                <span className={styles.importStatLabel}>Sessions</span>
              </div>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.spacedRevision}</span>
                <span className={styles.importStatLabel}>Revision</span>
              </div>
              <div className={styles.importStat}>
                <span className={styles.importStatValue}>{importPreview.wrongQuestions}</span>
                <span className={styles.importStatLabel}>Wrong Q</span>
              </div>
            </div>
            <p className={styles.importWarning}>This will replace all existing data. This action cannot be undone.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Data"
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleExportAndClear}>
              <Download size={14} /> Export & Clear
            </Button>
            <Button variant="danger" onClick={handleClearWithoutExport}>Clear All</Button>
          </>
        }
      >
        <div className={styles.clearContent}>
          <div className={styles.clearIcon}>
            <AlertTriangle size={20} />
          </div>
          <p>Delete ALL data?</p>
          <ul className={styles.clearList}>
            <li>{subjects.length} subjects · {topics.length} topics</li>
            <li>{questions.length} questions · {quizSessions.length} sessions</li>
            <li>{Object.keys(spacedRevision || {}).length} revision · {Object.keys(wrongQuestions || {}).length} wrong</li>
          </ul>
          <p className={styles.clearDanger}>Cannot be undone!</p>
        </div>
      </Modal>
    </div>
  );
}
