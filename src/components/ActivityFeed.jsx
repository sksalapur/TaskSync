import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

const ActivityFeed = ({ listId }) => {
  const [activities, setActivities] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!listId) return;

    const q = query(
      collection(db, 'activities'),
      where('listId', '==', listId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData = [];
      snapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by timestamp in JavaScript and limit to 10
      activitiesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedActivities = activitiesData.slice(0, 10);
      
      setActivities(limitedActivities);
    });

    return () => unsubscribe();
  }, [listId]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const formatMessage = (message) => {
    if (!message || !currentUser) return message || '';
    
    const userName = currentUser?.name || currentUser?.displayName || 'User';
    const userEmail = currentUser?.email;
    
    // Replace user's own name with "you" or "You"
    let formattedMessage = message;
    
    // Check if message starts with user's name
    if (userName && message.startsWith(userName)) {
      formattedMessage = message.replace(userName, 'You');
    }
    
    // Replace user's email with "you"
    if (userEmail && message.includes(userEmail)) {
      formattedMessage = formattedMessage.replace(userEmail, 'you');
    }
    
    return formattedMessage;
  };

  // Categorize activities by user
  const categorizeActivities = () => {
    const userName = currentUser?.name || currentUser?.displayName || 'User';
    
    const myActivities = [];
    const othersActivities = [];
    
    activities.forEach(activity => {
      // Support both old 'message' format and new 'details' format
      const activityText = activity.message || activity.details || '';
      if (activityText && userName && (activityText.startsWith(userName) || activityText.startsWith('You'))) {
        myActivities.push(activity);
      } else {
        othersActivities.push(activity);
      }
    });
    
    return { myActivities, othersActivities };
  };

  const { myActivities, othersActivities } = categorizeActivities();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
            {activities.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {myActivities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    My Activity
                  </h4>
                  <div className="space-y-3">
                    {myActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            {formatMessage(activity.message || activity.details || 'Activity')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {othersActivities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Collaborators
                  </h4>
                  <div className="space-y-3">
                    {othersActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 mt-2 rounded-full bg-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            {formatMessage(activity.message || activity.details || 'Activity')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
