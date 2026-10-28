import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets} from '../assets/assets'
import Title from '../components/Title'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion as Motion } from 'motion/react'
import BookingTrackingPanel from '../components/BookingTrackingPanel'
import BookingCoordinationPanel from '../components/BookingCoordinationPanel'
import ReviewForm from '../components/ReviewForm'

const MyBookings = () => {

  const { axios, user, currency, fetchCars } = useAppContext()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState({})
  const [loading, setLoading] = useState(true)

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const payAdditionalCharge = async booking => {
    const charge = booking.additionalCharge
    if (!charge?._id) return toast.error('Additional charge details are unavailable')
    try {
      const { data: orderData } = await axios.post('/api/payments/create-charge-order', { chargeId: charge._id })
      if (!orderData.success) throw new Error(orderData.message)
      if (!(await loadRazorpay())) throw new Error('Could not load the payment checkout')
      const result = await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'RideShare',
          description: `Post-trip charges for booking ${booking._id}`,
          order_id: orderData.order.id,
          prefill: { name: user?.name || '', email: user?.email || '' },
          theme: { color: '#15947c' },
          handler: async response => {
            try {
              const { data } = await axios.post('/api/payments/verify-charge', { chargeId: charge._id, ...response })
              data.success ? resolve(data) : reject(new Error(data.message))
            } catch (error) { reject(error) }
          },
          modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
        })
        checkout.open()
      })
      toast.success(result.message)
      fetchMyBookings()
    } catch (error) { toast.error(error.message) }
  }

  const downloadInvoice = async bookingId => {
    try {
      const { data } = await axios.get(`/api/invoices/booking/${bookingId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `rideshare-invoice-${bookingId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) { toast.error(error.message) }
  }

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      const { data } = await axios.post('/api/bookings/cancel', { bookingId })
      if (!data.success) return toast.error(data.message)
      toast.success(data.message)
      await fetchCars()
      fetchMyBookings()
    } catch (error) { toast.error(error.message) }
  }

  const fetchMyBookings = useCallback(async ()=>{
    setLoading(true)
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success){
        setBookings(data.bookings)
        const completed = data.bookings.filter(booking => booking.status === 'completed')
        const reviewEntries = await Promise.all(completed.map(async booking => {
          try {
            const reviewResponse = await axios.get(`/api/reviews/booking/${booking._id}`)
            return [booking._id, reviewResponse.data.review]
          } catch { return [booking._id, null] }
        }))
        setReviews(Object.fromEntries(reviewEntries))
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally { setLoading(false) }
  }, [axios])

  useEffect(()=>{
    user && fetchMyBookings()
  },[fetchMyBookings, user])

  return (
    <Motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}

    className='mx-auto mt-10 max-w-7xl px-5 pb-16 text-sm md:px-10 lg:mt-14'>

      <Title title='My Bookings'
       subTitle='View and manage all your RideShare vehicle bookings'
       align="left"/>

       <div>
        {loading && <p className='mt-12 text-center text-gray-500'>Loading your bookings...</p>}
        {!loading && bookings.length === 0 && <div className='mt-12 rounded-xl border border-dashed border-borderColor p-10 text-center'><p className='font-medium text-gray-800'>No bookings yet</p><p className='mt-2 text-sm text-gray-500'>Your completed and upcoming trips will appear here.</p><button type='button' onClick={() => navigate('/cars')} className='mt-5 rounded-lg bg-primary px-4 py-2 text-sm text-white'>Find a vehicle</button></div>}
        {bookings.map((booking, index)=>(
          <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}

          key={booking._id} className='mt-5 grid grid-cols-1 gap-6 rounded-2xl border border-borderColor bg-white p-6 shadow-[0_14px_38px_rgba(15,118,110,0.06)] first:mt-12 md:grid-cols-4'>
            {/* Vehicle Image + Info */}

            <div className='md:col-span-1'>
              <div className='rounded-md overflow-hidden mb-3'>
                <img src={booking.car.image} alt="" className='w-full h-auto aspect-video object-cover'/>
              </div>
              <p className='text-lg font-medium mt-2'>{booking.car.brand} {booking.car.model}</p>

              <p className='text-gray-500'>{booking.car.year} • {booking.car.category} • {booking.car.location}</p>
            </div>

            {/* Booking Info */}
            <div className='md:col-span-2'>
              <div className='flex items-center gap-2'>
                <p className='px-3 py-1.5 bg-light rounded'>Booking #{index+1}</p>
                <p className={`px-3 py-1 text-xs rounded-full ${['confirmed', 'active', 'completed'].includes(booking.status) ? 'bg-green-400/15 text-green-600' : booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-red-400/15 text-red-600' : 'bg-amber-400/15 text-amber-700'}`}>{booking.status.replaceAll('_', ' ')}</p>
              </div>

              <div className='flex items-start gap-2 mt-3'>
                <img src={assets.calendar_icon_colored} alt="" className='w-4 h-4 mt-1'/>
                <div>
                  <p className='text-gray-500'>Rental Period</p>
                  <p>{booking.pickupDate.split('T')[0]} To {booking.returnDate.split('T')[0]}</p>
                </div>
              </div>

              <div className='flex items-start gap-2 mt-3'>
                <img src={assets.location_icon_colored} alt="" className='w-4 h-4 mt-1'/>
                <div>
                  <p className='text-gray-500'>Pick-up Location</p>
                  <p>{booking.car.location}</p>
                </div>
              </div>

              <div className='mt-3 rounded-xl bg-light p-3 text-sm'>
                <p className='font-medium text-gray-800'>Handover</p>
                <p className='mt-1 text-gray-500'>{booking.handoverOption === 'owner_delivery' ? `Owner delivery · ${currency}${booking.deliveryFee || 0}` : 'Renter pickup · Free'}</p>
              </div>
            </div>

           {/* Price */}
           <div className='md:col-span-1 flex flex-col justify-between gap-6'>
              <div className='text-sm text-gray-500 text-right'>
                <p>Total Price</p>
                <h1 className='text-2xl font-semibold text-primary'>{currency}{booking.totalAmount ?? booking.price}</h1>
                {booking.securityDeposit > 0 && <p className='text-xs'>Includes {currency}{booking.securityDeposit} deposit</p>}
                {booking.paymentStatus && <p className='text-xs capitalize'>Payment: {booking.paymentStatus.replaceAll('_', ' ')}</p>}
                {booking.cancellationRefundStatus && booking.cancellationRefundStatus !== 'not_applicable' && <div className={`mt-2 rounded-xl border px-3 py-2 text-left text-xs ${booking.cancellationRefundStatus === 'processed' ? 'border-green-200 bg-green-50 text-green-700' : booking.cancellationRefundStatus === 'failed' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  <p className='font-semibold'>Cancellation refund</p>
                  <p>{currency}{booking.cancellationRefundAmount || 0} · {booking.cancellationRefundStatus === 'processed' ? 'Processed' : booking.cancellationRefundStatus === 'failed' ? 'Needs support review' : 'Initiated'}</p>
                  {booking.cancellationRefundStatus === 'pending' && <p className='mt-1'>The provider will return it to the original payment method.</p>}
                  {booking.cancellationRefundStatus === 'failed' && <p className='mt-1'>The refund could not be completed automatically. Support will review it.</p>}
                </div>}
                {booking.totalAdditionalCharges > 0 && <p className='text-xs'>Extra charges: {currency}{booking.totalAdditionalCharges} ({booking.extraKmAmount || 0} km charges + {booking.lateReturnAmount || 0} late charges)</p>}
                {booking.depositRefundAmount > 0 && <p className='text-xs text-green-700'>Deposit refund: {currency}{booking.depositRefundAmount} ({booking.securityDepositStatus?.replaceAll('_', ' ')})</p>}
                <p>Booked on {booking.createdAt.split('T')[0]}</p>
              </div>
              <div className='space-y-2'>
                {booking.additionalCharge?.status === 'pending' && <button onClick={() => payAdditionalCharge(booking)} className='w-full bg-primary text-white rounded-lg py-2 hover:bg-primary-dull'>Pay {currency}{booking.additionalCharge.amount} charges</button>}
                {['pending', 'pending_payment', 'confirmed'].includes(booking.status) && <button onClick={() => cancelBooking(booking._id)} className='w-full border border-red-300 text-red-600 rounded-lg py-2 hover:bg-red-50'>{booking.paymentStatus === 'paid' ? 'Cancel & request refund' : 'Cancel booking'}</button>}
                {['paid', 'partially_refunded', 'refunded'].includes(booking.paymentStatus) && <button onClick={() => downloadInvoice(booking._id)} className='w-full border border-borderColor text-primary rounded-lg py-2 hover:bg-light'>Download invoice</button>}
              </div>
           </div>


            <div className="md:col-span-4">
              <BookingTrackingPanel booking={booking} viewer="renter" />
              <BookingCoordinationPanel booking={booking} viewer="renter" axios={axios} />
              {booking.status === 'completed' && <ReviewForm bookingId={booking._id} axios={axios} user={user} existingReview={reviews[booking._id]} onSaved={review => setReviews(current => ({ ...current, [booking._id]: review }))} />}
            </div>
          </Motion.div>
        ))}
       </div>

    </Motion.div>
  )
}

export default MyBookings
