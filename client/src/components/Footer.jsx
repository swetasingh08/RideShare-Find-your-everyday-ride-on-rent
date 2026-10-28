import React from 'react'
import { assets } from '../assets/assets'
import { motion as Motion } from 'motion/react';
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <Motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}

    id='about'
    className='mt-32 border-t border-borderColor bg-white/60 px-6 pt-16 text-sm text-gray-500 md:px-16 lg:px-24 xl:px-32'>

            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}

            className='flex flex-wrap items-start justify-between gap-10 border-b border-borderColor pb-10'>
                <div>
                    <Link to='/' aria-label='RideShare home' className='inline-flex'>
                        <img src={assets.logo} alt='RideShare' className='h-10 w-auto dark:hidden' />
                        <img src={assets.logoDark} alt='' aria-hidden='true' className='hidden h-10 w-auto dark:block' />
                    </Link>

                    <Motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}

                    className='max-w-80 mt-3'>
                        RideShare makes it easy to find and share vehicles, bikes, vans, and more for every journey.
                    </Motion.p>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}

                    className='flex items-center gap-3 mt-6'>
                        <a href="#"> <img src={assets.facebook_logo} className='w-5 h-5' alt="" /> </a>
                        <a href="#"> <img src={assets.instagram_logo} className='w-5 h-5' alt="" /> </a>
                        <a href="#"> <img src={assets.twitter_logo} className='w-5 h-5' alt="" /> </a>
                        <a href="#"> <img src={assets.gmail_logo} className='w-5 h-5' alt="" /> </a>
                    </Motion.div>
                </div>

                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}

                className='grid w-full gap-8 sm:grid-cols-3 md:w-1/2'>

                <div>
                    <h2 className='text-xs font-bold tracking-[0.16em] text-gray-800 uppercase'>Quick Links</h2>
                    <ul className='mt-4 flex flex-col gap-2'>
                        <li><Link to='/'>Home</Link></li>
                        <li><Link to='/cars'>Browse vehicles</Link></li>
                        <li><Link to='/owner/add-car'>List your vehicle</Link></li>
                        <li><Link to='/about'>About Us</Link></li>
                    </ul>
                </div>

                <div>
                    <h2 className='text-xs font-bold tracking-[0.16em] text-gray-800 uppercase'>Resources</h2>
                    <ul className='mt-4 flex flex-col gap-2'>
                        <li><Link to='/help-center'>Help Center</Link></li>
                        <li><Link to='/terms'>Terms of Service</Link></li>
                        <li><Link to='/privacy'>Privacy Policy</Link></li>
                        <li><Link to='/insurance'>Insurance</Link></li>
                    </ul>
                </div>

                <div>
                    <h2 className='text-xs font-bold tracking-[0.16em] text-gray-800 uppercase'>Contact</h2>
                    <ul className='mt-4 flex flex-col gap-2'>
                        <li className='font-medium text-gray-800 dark:text-gray-200'>Team RideShare</li>
                        <li>Kothi Mandhana</li>
                        <li>Kanpur, Uttar Pradesh, India</li>
                        <li>Pin: 209217</li>
                        <li><a href='tel:+1234567890' className='hover:text-primary'>+1 234 567890</a></li>
                        <li><a href='mailto:info@example.com' className='hover:text-primary'>info@example.com</a></li>
                    </ul>
                </div>

                </Motion.div>





            </Motion.div>

            <Motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}

            className='flex flex-col md:flex-row gap-2 items-center justify-between py-5'>
                <p>© {new Date().getFullYear()} Brand. All rights reserved.</p>
                <ul className='flex items-center gap-4'>
                    <li><Link to='/privacy'>Privacy</Link></li>
                    <li>|</li>
                    <li><Link to='/terms'>Terms</Link></li>
                    <li>|</li>
                    <li><a href="#">Cookies</a></li>
                </ul>
            </Motion.div>
        </Motion.div>
  )
}

export default Footer
