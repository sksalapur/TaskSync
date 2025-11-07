import { Users, Crown, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const CollaboratorsList = ({ list }) => {
  if (!list) return null; // Safety check
  
  const collaborators = list.sharedWith || [];
  const { currentUser } = useAuth();
  const [ownerData, setOwnerData] = useState(null);
  const [collaboratorsData, setCollaboratorsData] = useState({});

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (list.owner) {
        try {
          const ownerDoc = await getDoc(doc(db, 'users', list.owner));
          if (ownerDoc.exists()) {
            setOwnerData(ownerDoc.data());
          }
        } catch (error) {
          console.error('Error fetching owner data:', error);
        }
      }
    };

    fetchOwnerData();
  }, [list.owner]);

  useEffect(() => {
    const fetchCollaboratorsData = async () => {
      if (collaborators.length === 0) {
        setCollaboratorsData({});
        return;
      }

      try {
        const collaboratorsMap = {};
        
        // Fetch user data for each collaborator email
        for (const email of collaborators) {
          const usersQuery = query(collection(db, 'users'), where('email', '==', email));
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            collaboratorsMap[email] = userData;
          }
        }
        
        setCollaboratorsData(collaboratorsMap);
      } catch (error) {
        console.error('Error fetching collaborators data:', error);
      }
    };

    fetchCollaboratorsData();
  }, [collaborators.join(',')]);

  const ownerName = ownerData?.name || ownerData?.email || 'Owner';
  const ownerEmail = ownerData?.email || '';
  const isCurrentUserOwner = list.owner === currentUser?.uid;

  const handleRemoveCollaborator = async (email) => {
    if (!isCurrentUserOwner) return;

    try {
      const confirmRemove = window.confirm(`Remove ${collaboratorsData[email]?.name || email} from this list?`);
      if (!confirmRemove) return;

      const listRef = doc(db, 'lists', list.id);
      const updatedSharedWith = list.sharedWith.filter(e => e !== email);
      
      await updateDoc(listRef, {
        sharedWith: updatedSharedWith
      });

      // Log activity
      const userName = currentUser?.displayName || currentUser?.name || 'Someone';
      const removedUserName = collaboratorsData[email]?.name || email;
      
      await addDoc(collection(db, 'activities'), {
        listId: list.id,
        userName: userName,
        userEmail: currentUser?.email,
        action: 'removed',
        details: `${removedUserName} was removed from the list`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator. Please try again.');
    }
  };

  const handleLeaveList = async () => {
    if (!currentUser?.email) return;

    try {
      const confirmLeave = window.confirm('Are you sure you want to leave this list?');
      if (!confirmLeave) return;

      const listRef = doc(db, 'lists', list.id);
      const updatedSharedWith = list.sharedWith.filter(e => e !== currentUser.email);
      
      await updateDoc(listRef, {
        sharedWith: updatedSharedWith
      });

      // Log activity
      const userName = currentUser?.displayName || currentUser?.name || 'Someone';
      
      await addDoc(collection(db, 'activities'), {
        listId: list.id,
        userName: userName,
        userEmail: currentUser?.email,
        action: 'left',
        details: `${userName} left the list`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error leaving list:', error);
      alert('Failed to leave list. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Collaborators</h3>
        </div>
        {!isCurrentUserOwner && collaborators.includes(currentUser?.email) && (
          <button
            onClick={handleLeaveList}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Leave this list"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Show owner first */}
        <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-medium">
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isCurrentUserOwner ? 'You' : ownerName}
              </span>
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" title="Owner" />
            </div>
            {ownerEmail && !isCurrentUserOwner && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{ownerEmail}</span>
            )}
          </div>
        </div>

        {/* Show collaborators */}
        {collaborators.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No other collaborators yet</p>
        ) : (
          collaborators.map((email) => {
            const isCurrentUser = email === currentUser?.email;
            const userData = collaboratorsData[email];
            const displayName = userData?.name || email;
            const displayEmail = email;
            
            return (
              <div key={email} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {isCurrentUser ? 'You' : displayName}
                  </div>
                  {!isCurrentUser && userData?.name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{displayEmail}</div>
                  )}
                </div>
                {/* Show remove button for owner, or leave button for current user */}
                {isCurrentUserOwner ? (
                  <button
                    onClick={() => handleRemoveCollaborator(email)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove collaborator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : isCurrentUser ? (
                  <button
                    onClick={handleLeaveList}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Leave this list"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollaboratorsList;
