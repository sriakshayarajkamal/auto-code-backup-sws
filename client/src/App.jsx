import { useState, useEffect } from 'react'
import UploadZone from './components/UploadZone'
import FileList from './components/FileList'
import NotificationBell from './components/NotificationBell'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [notifications, setNotifications] = useState([])
  const [files, setFiles] = useState([])

  // Fetch notifications from backend on load
  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data)
  }

  // Fetch uploaded files from backend
  const fetchFiles = async () => {
    const res = await fetch('/api/files')
    const data = await res.json()
    setFiles(data)
  }

  useEffect(() => {
    fetchNotifications()
    fetchFiles()

    // Connect to SSE stream for real-time notifications
    const eventSource = new EventSource('/api/notifications/stream')
    eventSource.addEventListener('notification', (e) => {
      const newNotif = JSON.parse(e.data)
      setNotifications(prev => [newNotif, ...prev])
      fetchFiles()
    })

    return () => eventSource.close()
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-semibold tracking-wide">SWS Document Management</h1>
        </div>
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onUpdate={fetchNotifications}
        />
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Documents
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Documents ({files.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'upload' ? (
          <UploadZone onUploadComplete={fetchFiles} onNotification={fetchNotifications} />
        ) : (
          <FileList files={files} onRefresh={fetchFiles} />
        )}
      </main>
    </div>
  )
}

export default App
