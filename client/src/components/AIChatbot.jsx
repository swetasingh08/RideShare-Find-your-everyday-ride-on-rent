import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const welcomeMessage = { role: 'assistant', text: 'Tell me what you need, for example: “Find me an automatic SUV under ₹2,000 near Bengaluru.”' }

const AIChatbot = () => {
  const { axios } = useAppContext()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const sessionId = useMemo(() => {
    const key = 'rideshare-ai-session-v2'
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(key, created)
    return created
  }, [])
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('rideshare-ai-messages-v2') || '[]')
      return saved.length ? saved : [welcomeMessage]
    } catch { return [welcomeMessage] }
  })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    axios.get(`/api/ai/history?sessionId=${encodeURIComponent(sessionId)}`)
      .then(({ data }) => {
        if (!active || !data.success || !data.messages?.length) return
        setMessages(data.messages)
      })
      .catch(() => {})
    return () => { active = false }
  }, [axios, sessionId])

  useEffect(() => {
    if (messages.length) window.localStorage.setItem('rideshare-ai-messages-v2', JSON.stringify(messages.slice(-40)))
  }, [messages])

  const clearConversation = async () => {
    setMessages([welcomeMessage])
    setVehicles([])
    window.localStorage.removeItem('rideshare-ai-messages-v2')
    try { await axios.delete(`/api/ai/history?sessionId=${encodeURIComponent(sessionId)}`) } catch { /* guest history is already cleared locally */ }
  }

  const send = async (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text || loading) return
    setMessage('')
    setVehicles([])
    setMessages(items => [...items, { role: 'user', text }])
    setLoading(true)
    try {
      const { data } = await axios.post('/api/ai/chat', { message: text, sessionId, history: messages.slice(-8) })
      if (!data.success) throw new Error(data.message)
      setMessages(items => [...items, { role: 'assistant', text: data.reply }])
      setVehicles(data.vehicles || [])
    } catch {
      setMessages(items => [...items, { role: 'assistant', text: 'I am temporarily unavailable. Try the vehicle filters on the Cars page while I reconnect.' }])
    } finally { setLoading(false) }
  }

  return <div className='fixed bottom-5 right-5 z-[70]'>
    {open && <div className='mb-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-borderColor bg-white shadow-2xl'>
      <div className='flex items-center justify-between bg-primary px-4 py-3 text-white'><div><p className='font-semibold'>RideShare assistant</p><p className='text-xs text-white/80'>Natural-language vehicle search</p></div><div className='flex items-center gap-2'><button type='button' onClick={clearConversation} className='text-xs text-white/80 hover:text-white'>Clear</button><button type='button' onClick={() => setOpen(false)} aria-label='Close assistant'>×</button></div></div>
      <div className='max-h-72 space-y-3 overflow-y-auto p-3'>{messages.map((item, index) => <div key={`${item.role}-${index}`} className={`rounded-lg px-3 py-2 text-sm ${item.role === 'user' ? 'ml-8 bg-primary text-white' : 'mr-4 bg-light text-gray-700'}`}>{item.text}</div>)}{loading && <div className='mr-4 rounded-lg bg-light px-3 py-2 text-sm text-gray-500'>Searching vehicles...</div>}</div>
      {vehicles.length > 0 && <div className='border-t border-borderColor p-3'><p className='mb-2 text-xs font-medium text-gray-500'>Recommended vehicles</p><div className='space-y-2'>{vehicles.slice(0, 3).map(car => <Link key={car._id} to={`/car-details/${car._id}`} onClick={() => setOpen(false)} className='flex items-center gap-2 rounded-lg border border-borderColor p-2 hover:border-primary'><img src={car.image} alt='' className='h-10 w-12 rounded object-cover'/><span className='min-w-0'><span className='block truncate text-xs font-medium'>{car.brand} {car.model}</span><span className='block text-xs text-gray-500'>₹{car.pricePerDay}/day</span></span></Link>)}</div></div>}
      <form onSubmit={send} className='flex gap-2 border-t border-borderColor p-3'><input value={message} onChange={event => setMessage(event.target.value)} placeholder='Ask about vehicles...' className='min-w-0 flex-1 rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary'/><button type='submit' className='rounded-lg bg-primary px-3 py-2 text-sm text-white'>Send</button></form>
    </div>}
    <button type='button' onClick={() => setOpen(value => !value)} className='ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-xl' aria-label='Open rental assistant'>✦</button>
  </div>
}

export default AIChatbot
