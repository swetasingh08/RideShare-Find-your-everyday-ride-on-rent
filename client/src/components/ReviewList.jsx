import React, { useEffect, useState } from 'react'

const ReviewList = ({ carId, axios }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    axios.get(`/api/reviews/car/${carId}`).then(({ data }) => {
      if (!active) return
      if (data.success) setReviews(data.reviews)
      else setError(data.message || 'Reviews could not be loaded')
    }).catch(() => { if (active) setError('Reviews are temporarily unavailable') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [axios, carId])

  if (loading) return <p className='text-sm text-gray-500'>Loading reviews...</p>
  if (error) return <p className='text-sm text-red-600'>{error}</p>
  if (!reviews.length) return <p className='text-sm text-gray-500'>No reviews yet. Be the first to review this vehicle.</p>

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
  const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return <div>
    <div className='mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-light p-4'>
      <div className='min-w-20 text-center'>
        <p className='text-3xl font-semibold text-gray-800'>{average.toFixed(1)}</p>
        <p className='text-accent' aria-label={`${average.toFixed(1)} average rating`}>{'★'.repeat(Math.round(average))}{'☆'.repeat(5 - Math.round(average))}</p>
      </div>
      <div>
        <p className='font-semibold text-gray-800'>Renter ratings</p>
        <p className='mt-1 text-sm text-gray-500'>{reviews.length} verified {reviews.length === 1 ? 'trip' : 'trips'}</p>
      </div>
    </div>

    <div className='space-y-4'>{reviews.map(review => {
      const reviewerName = review.reviewer?.name || 'Renter'
      const initials = reviewerName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
      const reviewDate = review.createdAt ? dateFormatter.format(new Date(review.createdAt)) : ''
      const location = review.reviewerLocation || review.reviewer?.location

      return <article key={review._id} className='rounded-2xl border border-borderColor bg-white p-4 shadow-sm'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            {review.reviewer?.image ? <img src={review.reviewer.image} alt='' className='h-10 w-10 rounded-full object-cover' /> : <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>{initials}</span>}
            <div className='min-w-0'>
              <p className='truncate font-semibold text-gray-800'>{reviewerName}</p>
              <p className='truncate text-xs text-gray-500'>{location || 'Location not shared'}{reviewDate && ` · ${reviewDate}`}</p>
            </div>
          </div>
          <p className='shrink-0 text-accent' aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
        </div>
        <span className='mt-3 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'>✓ Verified trip</span>
        <p className='mt-3 text-sm leading-6 text-gray-600'>{review.comment}</p>
        {review.ownerResponse && <div className='mt-3 rounded-xl bg-light p-3 text-sm'><p className='font-semibold text-gray-700'>Owner response</p><p className='mt-1 text-gray-600'>{review.ownerResponse}</p></div>}
      </article>
    })}</div>
  </div>
}

export default ReviewList
