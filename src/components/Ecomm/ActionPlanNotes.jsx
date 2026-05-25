import React, { useState } from 'react';
import { Plus, Trash2, ListTodo, CheckSquare, Square } from 'lucide-react';

const ActionPlanNotes = ({ monthName, notes, onUpdateNotes }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newNote = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };
    
    onUpdateNotes([...notes, newNote]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    onUpdateNotes(
      notes.map(note => 
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  };

  const deleteTask = (id) => {
    onUpdateNotes(notes.filter(note => note.id !== id));
  };

  const completedCount = notes.filter(n => n.completed).length;
  const progress = notes.length === 0 ? 0 : Math.round((completedCount / notes.length) * 100);

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="flex-between">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListTodo size={22} color="var(--primary-color)" /> Action Plan Notes: {monthName}
        </h2>
        
        {notes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {completedCount} of {notes.length} completed
            </div>
            <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder={`Add a new action plan or task for ${monthName}...`}
          className="input-field"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={18} /> Add
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No action plans found for {monthName}. Start adding tasks above!
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                backgroundColor: note.completed ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                opacity: note.completed ? 0.7 : 1
              }}
            >
              <button 
                onClick={() => toggleTask(note.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: note.completed ? 'var(--primary-color)' : 'var(--text-secondary)',
                  padding: 0
                }}
              >
                {note.completed ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>
              
              <span style={{ 
                flex: 1, 
                fontSize: '0.95rem',
                textDecoration: note.completed ? 'line-through' : 'none',
                color: note.completed ? 'var(--text-secondary)' : 'var(--text-primary)'
              }}>
                {note.text}
              </span>
              
              <button 
                onClick={() => deleteTask(note.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--danger-color)',
                  opacity: 0.6,
                  padding: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionPlanNotes;
