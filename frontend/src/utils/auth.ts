export const saveToken = (token: string) => {
  localStorage.setItem('taskmanager_token', token)
}

export const getToken = () => localStorage.getItem('taskmanager_token')

export const clearToken = () => localStorage.removeItem('taskmanager_token')
