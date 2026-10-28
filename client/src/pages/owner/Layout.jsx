import React from 'react'
import NavbarOwner from '../../components/owner/NavbarOwner'
import Sidebar from '../../components/owner/Sidebar'
import { Outlet } from 'react-router-dom'

// The role check now lives in App.jsx inside <RequireRole allow={['user']}>.
// This component used to redirect from a useEffect while still rendering the
// outlet, which let deep-linked pages fire protected requests before redirecting.
const Layout = () => {
  return (
    <div className='min-h-screen bg-light/40 text-gray-800 dark:bg-[#0b1220] dark:text-gray-100'>
      <NavbarOwner />
      <div className='flex items-stretch'>
        <Sidebar />
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
