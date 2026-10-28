import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const OwnerReviewResponse = ({ booking, axios }) => {
  const [review, setReview] = useState(null)
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios.get(`/api/reviews/booking/${booking._id}`).then(({ data }) => {
      if (data.success && data.review) {
        setReview(data.review)
        setResponse(data.review.ownerResponse || '')
      }
    }).catch(() => {})
  }, [axios, booking._id])

  if (!review) return null

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const { data } = await axios.post(`/api/reviews/${review._id}/response`, { response })
      if (!data.success) return toast.error(data.message)
      setReview(data.review)
      toast.success('Response saved')
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  return <form onSubmit={submit} className='mt-3 rounded-lg border border-borderColor bg-white p-4'>
    <p className='text-sm font-medium text-gray-800'>Renter review from {review.reviewer?.name || 'Renter'} <span className='text-accent'>{'★'.repeat(review.rating)}</span></p>
    {(review.reviewerLocation || review.reviewer?.location) && <p className='mt-1 text-xs text-gray-500'>📍 {review.reviewerLocation || review.reviewer.location}</p>}
    <p className='mt-1 text-sm text-gray-600'>{review.comment}</p>
    <textarea value={response} onChange={event => setResponse(event.target.value)} required minLength={2} maxLength={1000} placeholder='Reply to your renter' className='mt-3 min-h-16 w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary' />
    <button type='submit' disabled={saving} className='mt-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50'>{saving ? 'Saving...' : review.ownerResponse ? 'Update response' : 'Respond to review'}</button>
  </form>
}

export default OwnerReviewResponse
