import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import TaskItem from './TaskItem';
import AddTask from './AddTask';
import { Loader2 } from 'lucide-react';

const TaskList = ({ listId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!listId) return;

    const q = query(
      collection(db, 'tasks'),
      where('listId', '==', listId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by createdAt in JavaScript
      tasksData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [listId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddTask listId={listId} />
      
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No tasks yet. Create your first task above!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} listId={listId} />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
