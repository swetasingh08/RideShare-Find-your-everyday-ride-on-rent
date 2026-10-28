import React, { useCallback, useEffect, useState } from 'react'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import BookingTrackingPanel from '../../components/BookingTrackingPanel'
import { Link } from 'react-router-dom'
import BookingCoordinationPanel from '../../components/BookingCoordinationPanel'
import OwnerReviewResponse from '../../components/OwnerReviewResponse'

const ManageBookings = () => {

  const { currency, axios } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [trackedBookingId, setTrackedBookingId] = useState(null)

  const fetchOwnerBookings = useCallback(async ()=>{
    try {
      const { data } = await axios.get('/api/bookings/owner')
      data.success ? setBookings(data.bookings) : toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }, [axios])

  const changeBookingStatus = async (bookingId, status, settlement = {})=>{
    try {
      const { data } = await axios.post('/api/bookings/change-status', {bookingId, status, ...settlement})
      if(data.success){
        toast.success(data.message)
        fetchOwnerBookings()
      }else{
        toast.error(data.message)
      }
      
    } catch (error) {
      toast.error(error.message)
    }
  }

  const completeBooking = async booking => {
    const odometer = window.prompt(`Final odometer reading for ${booking.car?.brand || 'vehicle'} (km). Leave blank if unavailable:`, String(booking.startOdometerKm || ''))
    if (odometer === null) return
    if (odometer !== '' && (!Number.isFinite(Number(odometer)) || Number(odometer) < Number(booking.startOdometerKm || 0))) {
      toast.error('Final odometer must be a valid reading greater than the start reading')
      return
    }
    await changeBookingStatus(booking._id, 'completed', { actualReturnDate: new Date().toISOString(), actualReturnOdometerKm: odometer })
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

  useEffect(()=>{
    fetchOwnerBookings()
  },[fetchOwnerBookings])

  return (
    <div className='w-full px-4 pb-14 pt-10 md:px-10'>
      
      <Title title="Manage bookings" subTitle="Review renter requests, confirm trips, and keep every vehicle handover on schedule."/>

      <div className='mt-6 w-full max-w-6xl overflow-hidden rounded-2xl border border-borderColor bg-white shadow-[0_14px_38px_rgba(15,118,110,0.06)]'>

        <table className='w-full border-collapse text-left text-sm text-gray-600'>
          <thead className='bg-light text-gray-500'>
            <tr>
              <th className="p-3 font-medium">Vehicle</th>
              <th className="p-3 font-medium max-md:hidden">Date Range</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium max-md:hidden">Payment</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="5" className='p-0'><div className='p-10 text-center'><div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent'>+</div><p className='mt-4 font-medium text-gray-800'>No booking requests yet</p><p className='mt-1 text-sm text-gray-500'>Once a renter books your vehicle, you can approve, manage, and track the trip here.</p><Link to='/owner/add-car' className='mt-5 inline-flex rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary'>List another vehicle</Link></div></td></tr>}
            {bookings.map((booking, index)=>(
              <tr key={index} className='border-t border-borderColor text-gray-500'>

                <td className='p-3 flex items-center gap-3'>
                  <img src={booking.car.image} alt="" className='h-12 w-12 aspect-square rounded-md object-cover'/>
                  <p className='font-medium max-md:hidden'>{booking.car.brand} {booking.car.model}</p>
                </td>

                <td className='p-3 max-md:hidden'>
                  {booking.pickupDate.split('T')[0]} to {booking.returnDate.split('T')[0]}
                  <p className='mt-1 text-xs text-gray-500'>{booking.handoverOption === 'owner_delivery' ? `Owner delivery · ${currency}${booking.deliveryFee || 0}` : 'Renter pickup · Free'}</p>
                </td>

                <td className='p-3'>{currency}{booking.totalAmount ?? booking.price}</td>

                <td className='p-3 max-md:hidden'>
                  <span className='bg-gray-100 px-3 py-1 rounded-full text-xs'>{booking.paymentStatus || 'not required'}</span>
                  {booking.cancellationRefundStatus && booking.cancellationRefundStatus !== 'not_applicable' && <p className={`mt-2 text-xs ${booking.cancellationRefundStatus === 'processed' ? 'text-green-600' : booking.cancellationRefundStatus === 'failed' ? 'text-red-600' : 'text-amber-700'}`}>Refund: {booking.cancellationRefundStatus.replaceAll('_', ' ')}</p>}
                </td>

                <td className='p-3'>
                  {['pending', 'confirmed', 'active'].includes(booking.status) ? (
                    <select onChange={e=> e.target.value === 'completed' ? completeBooking(booking) : changeBookingStatus(booking._id, e.target.value)} value={booking.status} className='px-2 py-1.5 mt-1 text-gray-500 border border-borderColor rounded-md outline-none'>
                      {booking.status === 'pending' && <option value="pending">Pending</option>}
                      {booking.status === 'pending' && <option value="confirmed">Confirmed</option>}
                      {booking.status === 'confirmed' && <option value="confirmed">Confirmed</option>}
                      {booking.status === 'confirmed' && <option value="active">Trip started</option>}
                      {booking.status === 'active' && <option value="active">Trip active</option>}
                      {booking.status === 'active' && <option value="completed">Mark completed</option>}
                      <option value="cancelled">Cancel request</option>
                      {booking.status === 'pending' && <option value="rejected">Reject request</option>}
                    </select>
                  ): (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${['confirmed', 'active', 'completed'].includes(booking.status) ? 'bg-green-100 text-green-500' : booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-700'}`}>{booking.status.replaceAll('_', ' ')}</span>
                  )}
                  {booking.status === 'active' && <button type="button" onClick={() => completeBooking(booking)} className="mt-2 block text-xs text-primary hover:text-primary-dull">Settle & complete</button>}
                  {['paid', 'partially_refunded', 'refunded'].includes(booking.paymentStatus) && <button type="button" onClick={() => downloadInvoice(booking._id)} className="mt-2 block text-xs text-primary hover:text-primary-dull">Download invoice</button>}
                  {booking.settlementStatus === 'settled' && <p className="mt-2 text-xs text-gray-500">Extra: {currency}{booking.totalAdditionalCharges || 0} · Deposit: {booking.securityDepositStatus?.replaceAll('_', ' ')}</p>}
                  <button type="button" onClick={() => setTrackedBookingId(booking._id)} className="mt-2 block text-xs text-primary hover:text-primary-dull">Track vehicle</button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {bookings.length > 0 && (
        <div className="mt-8 max-w-3xl">
          <h2 className="mb-3 text-lg font-medium text-gray-800">Tracking preview</h2>
          <p className="mb-4 text-sm text-gray-500">Select a booking above when GPS is connected to see its live vehicle location here.</p>
          <BookingTrackingPanel booking={bookings.find((booking) => booking._id === trackedBookingId) || bookings[0]} viewer="owner" />
          <BookingCoordinationPanel booking={bookings.find((booking) => booking._id === trackedBookingId) || bookings[0]} viewer="owner" axios={axios} />
        </div>
      )}

      {bookings.filter(booking => booking.status === 'completed').map(booking => <OwnerReviewResponse key={booking._id} booking={booking} axios={axios} />)}

    </div>
  )
}

export default ManageBookings
