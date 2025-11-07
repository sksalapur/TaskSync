import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Activity, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const ActivityFeed = ({ listId }) => {
  const [activities, setActivities] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [myActivitiesPage, setMyActivitiesPage] = useState(1);
  const [collaboratorsPage, setCollaboratorsPage] = useState(1);
  const { currentUser } = useAuth();
  
  const ITEMS_PER_PAGE = 5;

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
      
      // Sort by timestamp - newest first
      activitiesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setActivities(activitiesData);
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

  // Pagination for My Activities
  const totalMyActivities = myActivities.length;
  const totalMyPages = Math.ceil(totalMyActivities / ITEMS_PER_PAGE);
  const myStartIndex = (myActivitiesPage - 1) * ITEMS_PER_PAGE;
  const myEndIndex = myStartIndex + ITEMS_PER_PAGE;
  const paginatedMyActivities = myActivities.slice(myStartIndex, myEndIndex);

  // Pagination for Collaborators Activities
  const totalCollaboratorsActivities = othersActivities.length;
  const totalCollaboratorsPages = Math.ceil(totalCollaboratorsActivities / ITEMS_PER_PAGE);
  const collaboratorsStartIndex = (collaboratorsPage - 1) * ITEMS_PER_PAGE;
  const collaboratorsEndIndex = collaboratorsStartIndex + ITEMS_PER_PAGE;
  const paginatedCollaboratorsActivities = othersActivities.slice(collaboratorsStartIndex, collaboratorsEndIndex);

  const handleMyPrevPage = () => {
    if (myActivitiesPage > 1) {
      setMyActivitiesPage(myActivitiesPage - 1);
    }
  };

  const handleMyNextPage = () => {
    if (myActivitiesPage < totalMyPages) {
      setMyActivitiesPage(myActivitiesPage + 1);
    }
  };

  const handleCollaboratorsPrevPage = () => {
    if (collaboratorsPage > 1) {
      setCollaboratorsPage(collaboratorsPage - 1);
    }
  };

  const handleCollaboratorsNextPage = () => {
    if (collaboratorsPage < totalCollaboratorsPages) {
      setCollaboratorsPage(collaboratorsPage + 1);
    }
  };

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
        <div className="p-4 pt-0">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-6">
              {/* My Activities Section */}
              {myActivities.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center justify-between">
                    <span>My Activity</span>
                    <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-normal">
                      {totalMyActivities}
                    </span>
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {paginatedMyActivities.map((activity) => (
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
                  
                  {/* My Activities Pagination */}
                  {totalMyPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {myStartIndex + 1}-{Math.min(myEndIndex, totalMyActivities)} of {totalMyActivities}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleMyPrevPage}
                          disabled={myActivitiesPage === 1}
                          className={`p-1 rounded transition-colors ${
                            myActivitiesPage === 1
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Previous"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {myActivitiesPage}/{totalMyPages}
                        </span>
                        
                        <button
                          onClick={handleMyNextPage}
                          disabled={myActivitiesPage === totalMyPages}
                          className={`p-1 rounded transition-colors ${
                            myActivitiesPage === totalMyPages
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Next"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collaborators Activities Section */}
              {othersActivities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center justify-between">
                    <span>Collaborators</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-normal">
                      {totalCollaboratorsActivities}
                    </span>
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {paginatedCollaboratorsActivities.map((activity) => (
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
                  
                  {/* Collaborators Pagination */}
                  {totalCollaboratorsPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {collaboratorsStartIndex + 1}-{Math.min(collaboratorsEndIndex, totalCollaboratorsActivities)} of {totalCollaboratorsActivities}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCollaboratorsPrevPage}
                          disabled={collaboratorsPage === 1}
                          className={`p-1 rounded transition-colors ${
                            collaboratorsPage === 1
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Previous"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {collaboratorsPage}/{totalCollaboratorsPages}
                        </span>
                        
                        <button
                          onClick={handleCollaboratorsNextPage}
                          disabled={collaboratorsPage === totalCollaboratorsPages}
                          className={`p-1 rounded transition-colors ${
                            collaboratorsPage === totalCollaboratorsPages
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Next"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
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
