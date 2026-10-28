import React, { useState } from 'react'
import { motion as Motion } from 'motion/react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Hero = () => {

    const [pickupLocation, setPickupLocation] = useState('')
    const [vehicleType, setVehicleType] = useState('All vehicles')
    const [service, setService] = useState('Rent a vehicle')

    const {pickupDate, setPickupDate, returnDate, setReturnDate, navigate} = useAppContext()

    const handleSearch = (e)=>{
        e.preventDefault()
        const params = new URLSearchParams()
        if (pickupLocation.trim()) params.set('pickupLocation', pickupLocation.trim())
        if (pickupDate) params.set('pickupDate', pickupDate)
        if (returnDate) params.set('returnDate', returnDate)
        const categoryMap = { Cars: 'car', Scooters: 'Scooter', Motorcycles: 'Motorcycle', Vans: 'Van' }
        if (categoryMap[vehicleType]) params.set('category', categoryMap[vehicleType])
        navigate(`/cars?${params.toString()}`)
    }

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className='relative flex min-h-[calc(100vh-72px)] flex-col items-center justify-center overflow-hidden bg-light px-5 py-20 text-center dark:bg-dark'
    >
      <div className='pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl' />

      <Motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className='relative max-w-4xl text-4xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-6xl'
      >
        Find your everyday ride, <span className='text-primary'>your way</span>
      </Motion.h1>
      <p className='mt-4 max-w-2xl text-base leading-7 text-gray-500 dark:text-gray-300'>
        Search cars, scooters, bikes, vans, and more by city, locality, neighbourhood, or PIN.
      </p>

      <Motion.form
        initial={{ scale: 0.95, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        onSubmit={handleSearch}
        className='relative mt-8 w-full max-w-4xl rounded-3xl border border-white/60 bg-white/95 p-5 text-left shadow-[0px_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95'
      >
        <div className='flex flex-wrap gap-2 border-b border-borderColor pb-4'>
          {['Rent a vehicle', 'Outstation', 'Hourly'].map((item) => (
            <button type='button' key={item} onClick={() => setService(item)} className={`rounded-full px-4 py-2 text-sm transition ${service === item ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-light dark:text-gray-300 dark:hover:bg-slate-800'}`}>
              {item}
            </button>
          ))}
        </div>

        <div className='mt-5 grid gap-4 md:grid-cols-[1.4fr_0.8fr]'>
          <div className='flex flex-col items-start gap-2 rounded-2xl border border-borderColor bg-light/60 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-slate-800/70'>
            <label htmlFor='hero-pickup' className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
              <img src={assets.location_icon_colored} alt='' className='h-4 w-4' />
              Pickup area
            </label>
            <input id='hero-pickup' value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder='City, locality, society, or PIN' className='w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-white' />
            <p className='text-xs text-gray-400'>Try any city, locality, neighbourhood, or PIN</p>
          </div>

          <div className='flex flex-col items-start gap-2 rounded-2xl border border-borderColor bg-light/60 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-slate-800/70'>
            <label htmlFor='hero-vehicle-type' className='text-xs font-semibold uppercase tracking-wide text-gray-400'>Vehicle type</label>
            <select id='hero-vehicle-type' value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className='w-full bg-transparent text-gray-900 outline-none dark:text-white dark:[color-scheme:dark]'>
              {['All vehicles', 'Cars', 'Scooters', 'Motorcycles', 'Vans'].map((type) => <option key={type} value={type} className='bg-white text-gray-900 dark:bg-slate-900 dark:text-white'>{type}</option>)}
            </select>
            <p className='text-xs text-gray-400'>Choose from nearby available rides</p>
          </div>

          <div className='flex flex-col items-start gap-2 rounded-2xl border border-borderColor bg-light/60 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-slate-800/70'>
            <label htmlFor='pickup-date' className='text-xs font-semibold uppercase tracking-wide text-gray-400'>Start date</label>
            <input value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} type='date' id='pickup-date' min={new Date().toISOString().split('T')[0]} className='w-full bg-transparent text-sm text-gray-600 outline-none dark:text-gray-200 dark:[color-scheme:dark]' required />
          </div>

          <div className='flex flex-col items-start gap-2 rounded-2xl border border-borderColor bg-light/60 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-slate-800/70'>
            <label htmlFor='return-date' className='text-xs font-semibold uppercase tracking-wide text-gray-400'>Return date</label>
            <input value={returnDate} onChange={(e) => setReturnDate(e.target.value)} type='date' id='return-date' min={pickupDate || new Date().toISOString().split('T')[0]} className='w-full bg-transparent text-sm text-gray-600 outline-none dark:text-gray-200 dark:[color-scheme:dark]' required />
          </div>
        </div>

        <div className='mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-borderColor pt-5'>
          <div className='flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-300'>
            <span className='rounded-full bg-light px-3 py-2 dark:bg-slate-800'>Any city or PIN</span>
            <span className='rounded-full bg-light px-3 py-2 dark:bg-slate-800'>Verified partners</span>
            <span className='rounded-full bg-light px-3 py-2 dark:bg-slate-800'>Live trip tracking</span>
          </div>
          <button className='flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-medium text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dull' type='submit'>
            <img src={assets.search_icon} alt='' className='brightness-300' />
            Browse available rides
          </button>
        </div>
        <p className='mt-3 text-xs text-gray-400'>Choose the exact pickup and drop address on the booking page after selecting a vehicle.</p>
      </Motion.form>
    </Motion.div>
  )
}

export default Hero
