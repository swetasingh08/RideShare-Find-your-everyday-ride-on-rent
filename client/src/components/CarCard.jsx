import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const CarCard = ({car, bookingContext = {}}) => {

    const currency = import.meta.env.VITE_CURRENCY
    const navigate = useNavigate()
    const dateAvailabilityChecked = Boolean(bookingContext.availabilityChecked)

  const openDetails = () => {
    const params = new URLSearchParams()
    if (bookingContext.pickupDate) params.set('pickupDate', bookingContext.pickupDate)
    if (bookingContext.returnDate) params.set('returnDate', bookingContext.returnDate)
    if (bookingContext.pickupLocation) params.set('pickupLocation', bookingContext.pickupLocation)
    if (bookingContext.dropLocation) params.set('dropLocation', bookingContext.dropLocation)
    navigate(`/car-details/${car._id}${params.toString() ? `?${params.toString()}` : ''}`)
    scrollTo(0,0)
  }

  return (
    <div onClick={openDetails} className='group overflow-hidden rounded-2xl border border-borderColor bg-white shadow-[0_16px_45px_rgba(15,118,110,0.08)] hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_22px_55px_rgba(15,118,110,0.16)] transition-all duration-500 cursor-pointer'>
      
      <div className='relative h-52 overflow-hidden bg-light'>
                <img src={car.image} alt="Vehicle" className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'/>

        {dateAvailabilityChecked
          ? car.availabilityStatus === 'booking_in_progress'
            ? <p className='absolute top-4 left-4 rounded-full bg-accent/95 px-2.5 py-1 text-xs text-white'>Booking in progress</p>
            : car.availabilityStatus === 'already_booked'
              ? <p className='absolute top-4 left-4 rounded-full bg-red-600/95 px-2.5 py-1 text-xs text-white'>Already booked</p>
              : car.isAvaliable && <p className='absolute top-4 left-4 rounded-full bg-primary/90 px-2.5 py-1 text-xs text-white'>Available Now</p>
          : <p className='absolute top-4 left-4 rounded-full bg-slate-700/95 px-2.5 py-1 text-xs text-white'>Check dates</p>}
        {car.verificationStatus === 'verified' && <p className='absolute top-12 left-4 bg-green-600 text-white text-xs px-2.5 py-1 rounded-full'>Verified</p>}

        <div className='absolute bottom-4 right-4 rounded-xl border border-white/20 bg-slate-950/80 px-3 py-2 text-white shadow-lg backdrop-blur-sm'>
            <span className='font-semibold'>{currency}{car.pricePerDay}</span>
            <span className='text-sm text-white/80'> / day</span>
        </div>
      </div>

      <div className='p-5 sm:p-6'>
        <div className='flex justify-between items-start mb-2'>
            <div>
                <h3 className='text-lg font-semibold tracking-tight'>{car.brand} {car.model}</h3>
                <p className='text-muted-foreground text-sm'>{car.category} • {car.year}</p>
            </div>
        </div>

        <div className='mt-5 grid grid-cols-2 gap-2 text-gray-600'>
            <div className='flex items-center rounded-lg bg-light px-2 py-2 text-sm text-muted-foreground'>
                <img src={assets.users_icon} alt="" className='h-4 mr-2'/>
                <span>{car.seating_capacity} Seats</span>
            </div>
            <div className='flex items-center rounded-lg bg-light px-2 py-2 text-sm text-muted-foreground'>
                <img src={assets.fuel_icon} alt="" className='h-4 mr-2'/>
                <span>{car.fuel_type}</span>
            </div>
            <div className='flex items-center rounded-lg bg-light px-2 py-2 text-sm text-muted-foreground'>
                <img src={assets.car_icon} alt="" className='h-4 mr-2'/>
                <span>{car.transmission}</span>
            </div>
            <div className='flex items-center rounded-lg bg-light px-2 py-2 text-sm text-muted-foreground'>
                <img src={assets.location_icon} alt="" className='h-4 mr-2'/>
                <span>{car.location}</span>
            </div>
        </div>
        {car.owner?.name && <p className='mt-4 text-xs text-gray-500'>Listed by {car.owner.name}</p>}

      </div>

    </div>
  )
}

export default CarCard
