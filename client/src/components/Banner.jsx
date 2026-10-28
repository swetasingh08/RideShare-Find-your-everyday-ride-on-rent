import React from 'react'
import { assets } from '../assets/assets'
import { motion as Motion } from 'motion/react'

const Banner = () => {
  return (
    <Motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className='mx-3 flex max-w-6xl flex-col items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] via-[#118b80] to-[#58b7a1] px-8 pt-10 shadow-[0_24px_60px_rgba(15,118,110,0.2)] md:mx-auto md:flex-row md:items-start md:pl-14'>

        <div className='max-w-xl text-white'>
            <span className='text-xs font-semibold uppercase tracking-[0.2em] text-white/70'>For every kind of ride</span>
            <h2 className='mt-3 text-3xl font-semibold tracking-tight md:text-4xl'>Make every ride count.</h2>
            <p className='mt-3 text-lg text-white/90'>Share your car, bike, scooter, or van and turn it into a simple source of income.</p>
            <p className='max-w-130 text-white/80'>List in minutes, connect with verified renters, and manage bookings, payments, and trips in one trusted place.</p>

            <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='mt-5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg hover:-translate-y-0.5 hover:bg-slate-50 cursor-pointer'>List your vehicle</Motion.button>
        </div>

            <Motion.img
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        src={assets.ride_collage} alt='Compact car, scooter, motorcycle, bicycle, and practical van' className='mt-8 w-full max-w-[520px] md:mt-0 md:w-[52%]'/>

    </Motion.div>
  )
}

export default Banner
