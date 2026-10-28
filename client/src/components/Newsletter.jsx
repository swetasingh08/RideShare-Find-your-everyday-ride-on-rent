import React from 'react'
import { motion as Motion } from 'motion/react';

const Newsletter = () => {
  return (
    <Motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    viewport={{ once: true, amount: 0.3 }}

    className="mx-4 my-16 mb-32 flex flex-col items-center justify-center rounded-3xl border border-borderColor bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,118,110,0.07)] md:mx-auto md:max-w-5xl">

            <Motion.h1
            initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2, duration: 0.5 }}

            className="md:text-4xl text-2xl font-semibold">Never Miss a Deal!</Motion.h1>

            <Motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}

            className="pb-8 text-gray-500/80 md:text-lg">
                Subscribe to get the latest offers, new arrivals, and exclusive discounts
            </Motion.p>
            <Motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}

            className="flex h-12 w-full max-w-2xl items-center justify-between md:h-13">
                <input
                    className="h-full w-full rounded-l-xl border border-borderColor border-r-0 bg-light px-4 text-gray-700 outline-none rounded-r-none"
                    type="text"
                    placeholder="Enter your email id"
                    required
                />
                <button type="submit" className="h-full rounded-r-xl bg-primary px-8 text-white shadow-md hover:bg-primary-dull cursor-pointer md:px-12">
                    Subscribe
                </button>
            </Motion.form>
        </Motion.div>
  )
}

export default Newsletter
