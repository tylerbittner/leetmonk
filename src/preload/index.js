import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  loadProblems: () => ipcRenderer.invoke('load-problems'),
  runCode: (args) => ipcRenderer.invoke('run-code', args),
  getProgress: () => ipcRenderer.invoke('get-progress'),
  setProgress: (args) => ipcRenderer.invoke('set-progress', args),
  getEditorState: () => ipcRenderer.invoke('get-editor-state'),
  setEditorState: (args) => ipcRenderer.invoke('set-editor-state', args),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  setTimerState: (data) => ipcRenderer.invoke('set-timer-state', data),
  addSubmission: (args) => ipcRenderer.invoke('add-submission', args),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  getReviewData: () => ipcRenderer.invoke('get-review-data'),
  setReviewItem: (args) => ipcRenderer.invoke('set-review-item', args),
  removeReviewItem: (args) => ipcRenderer.invoke('remove-review-item', args)
})
