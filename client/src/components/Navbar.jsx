import React, { useState } from 'react'
import { assets, menuLinks } from '../assets/assets'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import {motion as Motion} from 'motion/react'
import {SignedIn, SignedOut, UserButton} from '@clerk/clerk-react'
import NotificationCenter from './NotificationCenter'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {

    const {logout, role, user} = useAppContext()

    const location = useLocation()
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const isActive = path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <Motion.div
    initial={{y: -20, opacity: 0}}
    animate={{y: 0, opacity: 1}}
    transition={{duration: 0.5}}
    className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 text-gray-600 border-b border-borderColor relative bg-white/90 backdrop-blur-xl shadow-sm transition-all ${location.pathname === "/" && "bg-light/90"}`}>

        <Link to='/' aria-label='RideShare home' className='shrink-0'>
            <img src={assets.logo} alt='RideShare' className='h-9 w-auto dark:hidden' />
            <img src={assets.logoDark} alt='' aria-hidden='true' className='hidden h-9 w-auto dark:block' />
        </Link>

        <div className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16 max-sm:border-t border-borderColor right-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all duration-300 z-50 ${location.pathname === "/" ? "bg-light" : "bg-white"} ${open ? "max-sm:translate-x-0" : "max-sm:translate-x-full"}`}>
            {menuLinks.map((link, index)=> (
                <Link key={index} to={link.path} className={`relative py-1 text-sm font-medium transition-colors ${isActive(link.path) ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
                    {link.name}
                    {isActive(link.path) && <span className='absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-primary' />}
                </Link>
            ))}

            <div className='hidden lg:flex items-center text-sm gap-2 border border-borderColor px-3 rounded-full max-w-56'>
                <input type="text" className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" placeholder="Search vehicles"/>
                <img src={assets.search_icon} alt="search" />
            </div>

            <div className='flex max-sm:flex-col items-start sm:items-center gap-6'>

                <ThemeToggle />

                <SignedIn>
                    <NotificationCenter />
                    {user && <span className='rounded-full border border-borderColor bg-light px-2.5 py-1 text-xs font-medium text-gray-700'>{user.name || 'Profile'}</span>}

                    {role && (
                        <div className="flex items-center gap-4">
                            <button onClick={()=> navigate('/dashboard')} className="cursor-pointer">
                                <span className='text-sm font-medium hover:text-primary'>Dashboard</span>
                            </button>
                            {role === 'user' && (
                                <button onClick={()=> navigate('/my-bookings')} className="cursor-pointer">
                                    <span className='text-sm font-medium hover:text-primary'>My bookings</span>
                                </button>
                            )}
                        </div>
                    )}
                </SignedIn>

                <SignedOut>
                    <button onClick={() => navigate('/sign-in')} className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg">Login</button>
                </SignedOut>

                <SignedIn>
                    <div className='flex items-center gap-3'>
                        {!user?.profileCompleted && <button type="button" onClick={() => navigate('/complete-profile')} className="hidden lg:inline text-xs text-primary hover:text-primary-dull">Complete profile</button>}
                        <UserButton afterSignOutUrl='/' />
                        <button onClick={logout} className="cursor-pointer text-sm">Logout</button>
                    </div>
                </SignedIn>

            </div>
        </div>

        <button className='sm:hidden cursor-pointer' aria-label="Menu" onClick={()=> setOpen(!open)}>
            <img src={open ? assets.close_icon : assets.menu_icon} alt="menu" />
        </button>

    </Motion.div>
  )
}

export default Navbar
