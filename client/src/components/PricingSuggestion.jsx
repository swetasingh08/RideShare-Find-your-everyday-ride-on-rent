import React, { useState } from 'react'
import toast from 'react-hot-toast'

const PricingSuggestion = ({ car, axios, currency }) => {
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadSuggestion = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/pricing/${car._id}`)
      if (!data.success) return toast.error(data.message)
      setSuggestion(data.suggestion)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  return <div className='mt-2'>
    <button type='button' onClick={loadSuggestion} className='text-xs font-medium text-primary hover:text-primary-dull'>{loading ? 'Analyzing demand...' : suggestion ? 'Refresh price suggestion' : 'Suggest smart price'}</button>
    {suggestion && <div className='mt-2 rounded-lg bg-light p-3 text-xs'>
      <div className='flex items-center justify-between gap-2'><span className='font-medium text-gray-700'>Suggested daily price</span><span className='font-semibold text-primary'>{currency}{suggestion.suggestedPrice}</span></div>
      <p className='mt-1 text-gray-600'>{suggestion.recommendation}</p>
      <div className='mt-2 grid grid-cols-3 gap-2 text-gray-500'><span>{suggestion.bookingsLast30Days} bookings<br /><small>last 30 days</small></span><span>{suggestion.utilizationPercent}%<br /><small>utilization</small></span><span>{currency}{suggestion.marketAverage}<br /><small>market avg.</small></span></div>
      <p className={`mt-2 font-medium ${suggestion.changePercent > 0 ? 'text-green-700' : suggestion.changePercent < 0 ? 'text-amber-700' : 'text-gray-500'}`}>{suggestion.changePercent > 0 ? '+' : ''}{suggestion.changePercent}% versus current price</p>
    </div>}
  </div>
}

export default PricingSuggestion
