import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const NotificationCenter = () => {
  const { axios } = useAppContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/notifications')
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
      setError('')
    } catch { setError('Notifications are temporarily unavailable') }
    finally { setLoading(false) }
  }, [axios])

  useEffect(() => {
    fetchNotifications()
    const interval = window.setInterval(fetchNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (notification) => {
    if (!notification.read) {
      await axios.post(`/api/notifications/${notification._id}/read`)
      setNotifications(items => items.map(item => item._id === notification._id ? { ...item, read: true } : item))
      setUnreadCount(count => Math.max(0, count - 1))
    }
    if (notification.booking) navigate('/my-bookings')
    setOpen(false)
  }

  const markAllRead = async () => {
    await axios.post('/api/notifications/read-all')
    setNotifications(items => items.map(item => ({ ...item, read: true })))
    setUnreadCount(0)
  }

  return <div className='relative'>
    <button type='button' onClick={() => setOpen(value => !value)} className='relative rounded-xl border border-transparent p-2 text-lg hover:border-borderColor hover:bg-light' aria-label='Notifications'>
      <span aria-hidden='true'>🔔</span>
      {unreadCount > 0 && <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] leading-5 text-white'>{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {open && <div className='absolute right-0 top-12 z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-borderColor bg-white p-3 shadow-xl'>
      <div className='flex items-center justify-between border-b border-borderColor pb-2'>
        <p className='font-semibold text-gray-800'>Notifications</p>
        {unreadCount > 0 && <button type='button' onClick={markAllRead} className='text-xs text-primary'>Mark all read</button>}
      </div>
      <div className='max-h-80 overflow-y-auto'>
        {loading && <p className='py-8 text-center text-sm text-gray-500'>Loading notifications...</p>}
        {!loading && error && <div className='py-6 text-center text-sm text-gray-500'><p>{error}</p><button type='button' onClick={fetchNotifications} className='mt-2 text-primary'>Try again</button></div>}
        {!loading && !error && notifications.length === 0 && <p className='py-8 text-center text-sm text-gray-500'>You are all caught up.</p>}
        {notifications.map(notification => <button type='button' key={notification._id} onClick={() => markRead(notification)} className={`block w-full border-b border-borderColor px-2 py-3 text-left last:border-0 ${notification.read ? 'bg-white' : 'bg-primary/5'}`}>
          <div className='flex items-start gap-2'><span className={`mt-1 h-2 w-2 rounded-full ${notification.read ? 'bg-gray-200' : 'bg-primary'}`} /><span className='min-w-0'><span className='block text-sm font-medium text-gray-800'>{notification.title}</span><span className='mt-1 block text-xs text-gray-500'>{notification.message}</span><span className='mt-1 block text-[10px] text-gray-400'>{new Date(notification.createdAt).toLocaleString()}</span></span></div>
        </button>)}
      </div>
    </div>}
  </div>
}

export default NotificationCenter
