import { useState, useRef } from 'react'

function UploadZone({ onUploadComplete, onNotification }) {
  const [fileItems, setFileItems] = useState([])
  const [dragging, setDragging] = useState(false)
  const [bulkToast, setBulkToast] = useState(null)
  const inputRef = useRef(null)

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFiles = (selectedFiles) => {
    const pdfs = Array.from(selectedFiles).filter(f => f.type === 'application/pdf')
    if (pdfs.length === 0) return

    const newItems = pdfs.map(file => ({
      file,
      id: `${Date.now()}-${file.name}`,
      progress: 0,
      status: 'pending'
    }))

    setFileItems(prev => [...prev, ...newItems])

    // Show bulk toast if more than 3 files
    if (pdfs.length > 3) {
      setBulkToast(`Upload in progress — processing ${pdfs.length} files in background`)
    }

    uploadFiles(newItems, pdfs.length > 3)
  }

  const uploadFiles = (items, isBulk) => {
    items.forEach(item => {
      const formData = new FormData()
      formData.append('files', item.file)

      const xhr = new XMLHttpRequest()

      // Track upload progress for each file individually
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          setFileItems(prev =>
            prev.map(f => f.id === item.id ? { ...f, progress: percent, status: 'uploading' } : f)
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          setFileItems(prev =>
            prev.map(f => f.id === item.id ? { ...f, progress: 100, status: 'complete' } : f)
          )
          if (!isBulk) {
            onUploadComplete()
            onNotification()
          }
        } else {
          setFileItems(prev =>
            prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f)
          )
        }
      }

      xhr.onerror = () => {
        setFileItems(prev =>
          prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f)
        )
      }

      // Update status to uploading
      setFileItems(prev =>
        prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f)
      )

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })

    // For bulk uploads, refresh after all done
    if (isBulk) {
      setTimeout(() => {
        onUploadComplete()
        onNotification()
        setBulkToast(null)
      }, 3000)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const clearCompleted = () => {
    setFileItems(prev => prev.filter(f => f.status !== 'complete'))
  }

  const statusColor = (status) => {
    if (status === 'complete') return 'text-green-600'
    if (status === 'failed') return 'text-red-500'
    if (status === 'uploading') return 'text-blue-600'
    return 'text-gray-400'
  }

  const statusLabel = (status) => {
    if (status === 'complete') return 'Complete'
    if (status === 'failed') return 'Failed'
    if (status === 'uploading') return 'Uploading...'
    return 'Pending'
  }

  return (
    <div className="space-y-6">
      {/* Bulk Toast */}
      {bulkToast && (
        <div className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center justify-between shadow">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span className="text-sm font-medium">{bulkToast}</span>
          </div>
          <button onClick={() => setBulkToast(null)} className="text-white opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-gray-700 font-medium">Drag & drop PDF files here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse — PDF only, max 50MB each</p>
          </div>
        </div>
      </div>

      {/* File Progress List */}
      {fileItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-700">Upload Queue ({fileItems.length})</h3>
            <button onClick={clearCompleted} className="text-xs text-gray-400 hover:text-gray-600">
              Clear completed
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {fileItems.map(item => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{item.file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(item.file.size)}</span>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ml-4 ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      item.status === 'failed' ? 'bg-red-400' :
                      item.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{item.file.type}</span>
                  <span className="text-xs text-gray-400">{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadZone
