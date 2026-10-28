import React, { useState } from 'react'
import toast from 'react-hot-toast'

const ReviewForm = ({ bookingId, axios, user, existingReview, onSaved }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [location, setLocation] = useState(existingReview?.reviewerLocation || user?.location || '')
  const [saving, setSaving] = useState(false)

  if (existingReview) return <div className='mt-4 rounded-2xl border border-borderColor bg-light p-4'><div className='flex flex-wrap items-center justify-between gap-2'><p className='font-semibold text-gray-800'>Your review</p><p className='text-accent' aria-label={`${existingReview.rating} out of 5 stars`}>{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</p></div><p className='mt-1 text-sm text-gray-600'>{existingReview.comment}</p>{(existingReview.reviewerLocation || user?.location) && <p className='mt-2 text-xs text-gray-500'>📍 {existingReview.reviewerLocation || user.location}</p>}</div>

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const { data } = await axios.post('/api/reviews', { bookingId, rating, comment, location })
      if (!data.success) return toast.error(data.message)
      toast.success('Review published')
      onSaved(data.review)
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  return <form onSubmit={submit} className='mt-5 rounded-2xl border border-borderColor bg-white p-5 shadow-sm'>
    <div className='flex flex-wrap items-start justify-between gap-3'><div><p className='font-semibold text-gray-800'>Rate your RideShare experience</p><p className='mt-1 text-xs text-gray-500'>Your review helps other renters choose with confidence.</p></div><span className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>Verified trip</span></div>
    <div className='mt-4 flex gap-1' aria-label='Rating'>
      {[1, 2, 3, 4, 5].map(value => <button type='button' key={value} onClick={() => setRating(value)} className={`rounded-md px-1 text-3xl leading-none transition-transform hover:scale-110 ${value <= rating ? 'text-accent' : 'text-gray-300'}`} aria-label={`${value} stars`} aria-pressed={value === rating}>★</button>)}
    </div>
    <label className='mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500' htmlFor={`review-location-${bookingId}`}>Your city or area <span className='font-normal normal-case'>(shown with your review)</span></label>
    <input id={`review-location-${bookingId}`} value={location} onChange={event => setLocation(event.target.value)} maxLength={80} placeholder='e.g. Bengaluru, India' className='mt-1 w-full rounded-xl border border-borderColor bg-transparent px-3 py-2 outline-none focus:border-primary' />
    <label className='mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500' htmlFor={`review-comment-${bookingId}`}>Your review</label>
    <textarea id={`review-comment-${bookingId}`} value={comment} onChange={event => setComment(event.target.value)} required minLength={5} maxLength={1000} placeholder='Share your experience with other renters' className='mt-1 min-h-24 w-full rounded-xl border border-borderColor bg-transparent px-3 py-2 outline-none focus:border-primary' />
    <button type='submit' disabled={saving} className='mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50'>{saving ? 'Publishing...' : 'Publish review'}</button>
  </form>
}

export default ReviewForm
