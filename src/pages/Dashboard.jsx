import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, or, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import ShareList from '../components/ShareList';
import CollaboratorsList from '../components/CollaboratorsList';
import ActivityFeed from '../components/ActivityFeed';
import { Plus, List as ListIcon, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!currentUser) return;

    // Query for lists where user is owner OR user's email is in sharedWith array
    const q = query(
      collection(db, 'lists'),
      or(
        where('owner', '==', currentUser.uid),
        where('sharedWith', 'array-contains', currentUser.email)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listsData = [];
      snapshot.forEach((doc) => {
        listsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by createdAt in JavaScript instead of Firestore
      listsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setLists(listsData);
      
      // Update selectedList if it was removed or if we need to select a default
      if (selectedList) {
        const stillExists = listsData.find(l => l.id === selectedList.id);
        if (!stillExists) {
          // Selected list was deleted or user was removed
          setSelectedList(listsData.length > 0 ? listsData[0] : null);
        }
      } else if (listsData.length > 0) {
        // No list selected, select first one
        setSelectedList(listsData[0]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (id && lists.length > 0) {
      const list = lists.find(l => l.id === id);
      if (list) setSelectedList(list);
    }
  }, [id, lists]);

  const createNewList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const userName = currentUser?.name || currentUser?.displayName || 'Someone';
      
      const docRef = await addDoc(collection(db, 'lists'), {
        title: newListTitle,
        owner: currentUser.uid,
        sharedWith: [],
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'activities'), {
        listId: docRef.id,
        message: `${userName} created the list`,
        timestamp: new Date().toISOString()
      });

      setNewListTitle('');
      setShowNewListModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const deleteList = async (listId, listTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${listTitle}"? This will delete all tasks and activities in this list.`)) {
      return;
    }

    try {
      // Delete all tasks in the list
      const tasksQuery = query(collection(db, 'tasks'), where('listId', '==', listId));
      const tasksSnapshot = await getDocs(tasksQuery);
      const deleteTaskPromises = tasksSnapshot.docs.map(taskDoc => deleteDoc(taskDoc.ref));
      await Promise.all(deleteTaskPromises);

      // Delete all activities in the list
      const activitiesQuery = query(collection(db, 'activities'), where('listId', '==', listId));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const deleteActivityPromises = activitiesSnapshot.docs.map(activityDoc => deleteDoc(activityDoc.ref));
      await Promise.all(deleteActivityPromises);

      // Delete the list itself
      await deleteDoc(doc(db, 'lists', listId));

      // Clear selection if deleted list was selected
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list. Please try again.');
    }
  };

  const startEditingList = (list) => {
    setEditingListId(list.id);
    setEditingTitle(list.title);
  };

  const cancelEditingList = () => {
    setEditingListId(null);
    setEditingTitle('');
  };

  const saveListTitle = async (listId) => {
    if (!editingTitle.trim()) {
      alert('List title cannot be empty');
      return;
    }

    try {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, {
        title: editingTitle.trim()
      });

      // Log activity
      const userName = currentUser?.displayName || currentUser?.name || 'Someone';
      
      await addDoc(collection(db, 'activities'), {
        listId: listId,
        userName: userName,
        userEmail: currentUser?.email,
        action: 'renamed',
        details: `${userName} renamed the list to "${editingTitle.trim()}"`,
        timestamp: new Date()
      });

      setEditingListId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating list title:', error);
      alert('Failed to update list title. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <button
                onClick={() => setShowNewListModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New List
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">My Lists</h2>
                  {lists.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No lists yet</p>
                  ) : (
                    <div className="space-y-2">
                      {lists.map((list) => (
                        <div
                          key={list.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            selectedList?.id === list.id
                              ? 'bg-primary-100 dark:bg-primary-900'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedList(list)}
                            className={`flex-1 flex items-center gap-2 text-left ${
                              selectedList?.id === list.id
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <ListIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{list.title}</span>
                          </button>
                          {list.owner === currentUser.uid && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteList(list.id, list.title);
                              }}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete list"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedList ? (
                <>
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-center mb-6">
                        {editingListId === selectedList.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="List title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveListTitle(selectedList.id);
                                if (e.key === 'Escape') cancelEditingList();
                              }}
                            />
                            <button
                              onClick={() => saveListTitle(selectedList.id)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEditingList}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedList.title}</h2>
                            {selectedList.owner === currentUser.uid && (
                              <button
                                onClick={() => startEditingList(selectedList)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit list name"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                        <ShareList list={selectedList} />
                      </div>
                      <TaskList listId={selectedList.id} />
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <CollaboratorsList list={selectedList} />
                    <ActivityFeed listId={selectedList.id} />
                  </div>
                </>
              ) : (
                <div className="lg:col-span-3 flex items-center justify-center h-96">
                  <div className="text-center">
                    <ListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No list selected</h3>
                    <p className="text-gray-500 dark:text-gray-400">Create a new list to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New List</h3>
            <form onSubmit={createNewList} className="space-y-4">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="List title"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewListModal(false);
                    setNewListTitle('');
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
