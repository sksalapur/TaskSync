# TaskSync

A real-time collaborative task management web application built with React 18, Vite, and Firebase.

## Features

- 🔐 **Authentication** - Email/password signup and login with Firebase Authentication
- 📝 **Task Management** - Create, read, update, and delete tasks
- 🤝 **Real-time Collaboration** - Share lists with team members and see updates instantly
- 📊 **Activity Feed** - Track all changes and activities in your lists
- 🎨 **Modern UI** - Clean, responsive design with TailwindCSS
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore + Authentication + Storage)
- **Routing**: React Router DOM v6
- **State Management**: Context API
- **Icons**: lucide-react

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
cd TaskSync
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

4. Enable Authentication (Email/Password) and Firestore Database in your Firebase project

5. Create a `.env` file in the root directory and add your Firebase configuration:
```bash
cp .env.example .env
```

6. Update the `.env` file with your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Firestore Database Structure

### Collections

**users**
```javascript
{
  uid: string,
  name: string,
  email: string,
  photoURL: string,
  createdAt: timestamp
}
```

**lists**
```javascript
{
  id: string,
  title: string,
  owner: string (uid),
  sharedWith: array of userIds,
  createdAt: timestamp
}
```

**tasks**
```javascript
{
  id: string,
  listId: string,
  title: string,
  description: string,
  status: 'pending' | 'completed',
  assignedTo: string (uid),
  createdAt: timestamp
}
```

**activities**
```javascript
{
  id: string,
  listId: string,
  message: string,
  timestamp: timestamp
}
```

## Firestore Security Rules

Add these security rules to your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /lists/{listId} {
      allow read: if request.auth != null && 
        (resource.data.owner == request.auth.uid || 
         request.auth.uid in resource.data.sharedWith);
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.owner;
    }
    
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Features Overview

### Authentication
- Sign up with email and password
- Login with existing credentials
- Persistent sessions
- Secure logout

### Dashboard
- View all your lists
- Create new lists
- Switch between lists
- Real-time updates

### Task Management
- Add new tasks with title and description
- Mark tasks as complete/incomplete
- Edit task details
- Delete tasks
- Real-time synchronization across all users

### Collaboration
- Share lists with team members by email
- View list collaborators
- Real-time updates for all collaborators
- Activity feed showing all changes

### User Interface
- Clean, modern design
- Responsive layout (mobile, tablet, desktop)
- Dark mode support
- Intuitive navigation
- Smooth animations and transitions

## Project Structure

```
TaskSync/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ActivityFeed.jsx
│   │   ├── AddTask.jsx
│   │   ├── CollaboratorsList.jsx
│   │   ├── Navbar.jsx
│   │   ├── ShareList.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TaskItem.jsx
│   │   └── TaskList.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── Settings.jsx
│   │   └── Signup.jsx
│   ├── services/
│   │   └── firebaseConfig.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email support@tasksync.app or open an issue in the repository.

---

Built with ❤️ using React, Vite, and Firebase
