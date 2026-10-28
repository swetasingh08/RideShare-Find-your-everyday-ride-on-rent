import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';
import NotificationCenter from '../NotificationCenter';
import ThemeToggle from '../ThemeToggle';

const NavbarOwner = () => {

    const {user} = useAppContext()
    const navigate = useNavigate()

  return (
    <div className='sticky top-0 z-40 flex items-center justify-between border-b border-borderColor bg-white/90 px-6 py-4 text-gray-500 shadow-sm backdrop-blur-xl relative transition-all md:px-10'>
      <Link to='/' aria-label='RideShare home' className='shrink-0'>
        <img src={assets.logo} alt='RideShare' className='h-9 w-auto dark:hidden' />
        <img src={assets.logoDark} alt='' aria-hidden='true' className='hidden h-9 w-auto dark:block' />
      </Link>
      <div className='flex items-center gap-3'>
        <NotificationCenter />
        <ThemeToggle />
        {!user?.profileCompleted && <button type="button" onClick={() => navigate('/complete-profile')} className='hidden md:inline text-xs text-primary hover:text-primary-dull'>Complete profile</button>}
        <span className='rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>{user?.name || 'Profile'}</span>
        <p className='hidden text-sm md:block md:text-base'>Welcome back, <span className='font-medium text-gray-800'>{user?.name || "Profile"}</span></p>
      </div>
    </div>
  )
}

export default NavbarOwner
