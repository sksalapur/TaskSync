import { useState } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, Trash2, Edit2, Save, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const TaskItem = ({ task, listId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const { currentUser } = useAuth();
  
  // Use name from Firestore or fallback to displayName
  const userName = currentUser?.name || currentUser?.displayName || 'Someone';
  
  // Get subtasks from task or initialize empty array
  const subtasks = task.subtasks || [];

  const toggleStatus = async () => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      await updateDoc(taskRef, {
        status: newStatus
      });

      await addDoc(collection(db, 'activities'), {
        listId: listId,
        message: `${userName} marked "${task.title}" as ${newStatus}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', task.id));

      await addDoc(collection(db, 'activities'), {
        listId: listId,
        message: `${userName} deleted "${task.title}"`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;

    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        title: editTitle,
        description: editDescription
      });

      await addDoc(collection(db, 'activities'), {
        listId: listId,
        message: `${userName} edited "${task.title}"`,
        timestamp: new Date().toISOString()
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsEditing(false);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newSubtaskItem = {
        id: Date.now().toString(),
        title: newSubtask.trim(),
        completed: false
      };
      
      await updateDoc(taskRef, {
        subtasks: [...subtasks, newSubtaskItem]
      });

      await addDoc(collection(db, 'activities'), {
        listId: listId,
        message: `${userName} added subtask "${newSubtask.trim()}" to "${task.title}"`,
        timestamp: new Date().toISOString()
      });

      setNewSubtask('');
      setShowSubtaskInput(false);
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const updatedSubtasks = subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      
      await updateDoc(taskRef, {
        subtasks: updatedSubtasks
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
      
      await updateDoc(taskRef, {
        subtasks: updatedSubtasks
      });

      await addDoc(collection(db, 'activities'), {
        listId: listId,
        message: `${userName} removed a subtask from "${task.title}"`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const completedSubtasksCount = subtasks.filter(st => st.completed).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${
      task.status === 'completed' ? 'border-green-500' : 'border-primary-500'
    }`}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Task title"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Task description"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button onClick={toggleStatus} className="mt-1">
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-primary-500" />
              )}
            </button>
            
            <div className="flex-1">
              <h3 className={`font-medium ${
                task.status === 'completed' 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-sm mt-1 ${
                  task.status === 'completed' 
                    ? 'line-through text-gray-400 dark:text-gray-500' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {task.description}
                </p>
              )}
              
              {/* Subtasks progress indicator */}
              {subtasks.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {showSubtasks ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="font-medium">
                      {completedSubtasksCount}/{subtasks.length} subtasks
                    </span>
                  </button>
                  <div className="flex-1 max-w-xs h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${subtasks.length > 0 ? (completedSubtasksCount / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtasks list */}
              {showSubtasks && subtasks.length > 0 && (
                <div className="mt-3 ml-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleSubtask(subtask.id)}
                        className="flex-shrink-0"
                      >
                        {subtask.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400 hover:text-primary-500" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${
                        subtask.completed 
                          ? 'line-through text-gray-400 dark:text-gray-500' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subtask input */}
              {showSubtaskInput && (
                <div className="mt-3 ml-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSubtask();
                      if (e.key === 'Escape') {
                        setShowSubtaskInput(false);
                        setNewSubtask('');
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Subtask title"
                    autoFocus
                  />
                  <button
                    onClick={addSubtask}
                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title="Add"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSubtaskInput(false);
                      setNewSubtask('');
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add subtask button */}
              {!showSubtaskInput && task.status !== 'completed' && (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  <Plus className="w-3 h-3" />
                  Add subtask
                </button>
              )}
              
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
