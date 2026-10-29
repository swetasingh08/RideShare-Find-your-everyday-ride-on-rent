import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import CarDetails from './pages/CarDetails'
import Cars from './pages/Cars'
import MyBookings from './pages/MyBookings'
import Footer from './components/Footer'
import Layout from './pages/owner/Layout'
import Dashboard from './pages/owner/Dashboard'
import AddCar from './pages/owner/AddCar'
import ManageCars from './pages/owner/ManageCars'
import ManageBookings from './pages/owner/ManageBookings'
import AdminUsers from './pages/admin/AdminUsers'
import SignInPage from './pages/SignInPage'
import RequireRole from './components/RequireRole'
import DashboardRedirect from './components/DashboardRedirect'
import AccessRequestPage from './pages/AccessRequestPage'
import ResourcePage from './pages/ResourcePage'
import AboutUs from './pages/AboutUs'
import ProfileCompletionPage from './pages/ProfileCompletionPage'
import { Toaster } from 'react-hot-toast'
import AIChatbot from './components/AIChatbot'
import { UserProfile } from '@clerk/clerk-react'

const App = () => {

  const location = useLocation()
  const isOwnerPath = location.pathname.startsWith('/owner')
  const isAdminPath = location.pathname.startsWith('/admin')

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  return (
    <>
     <Toaster />
     <AIChatbot />

      {!isOwnerPath && <Navbar/>}

    <Routes>
      {/* Public */}
      <Route path='/' element={<Home/>}/>
      <Route path='/car-details/:id' element={<CarDetails/>}/>
      <Route path='/cars' element={<Cars/>}/>
      <Route path='/dashboard' element={<DashboardRedirect/>}/>
      <Route path='/help-center' element={<ResourcePage type='help' />}/>
      <Route path='/terms' element={<ResourcePage type='terms' />}/>
      <Route path='/privacy' element={<ResourcePage type='privacy' />}/>
      <Route path='/insurance' element={<ResourcePage type='insurance' />}/>
      <Route path='/about' element={<AboutUs />}/>
      <Route path='/complete-profile' element={<ProfileCompletionPage />}/>

      {/* Every user can book vehicles and see their booking history. */}
      <Route path='/my-bookings' element={
        <RequireRole allow={['user']}><MyBookings/></RequireRole>
      }/>

      {/* Users can list vehicles and manage bookings for their own vehicles. */}
      <Route path='/owner' element={
        <RequireRole allow={['user']}><Layout /></RequireRole>
      }>
        <Route index element={<Dashboard />}/>
        <Route path="add-car" element={<AddCar />}/>
        <Route path="manage-cars" element={<ManageCars />}/>
        <Route path="manage-bookings" element={<ManageBookings />}/>
      </Route>

      {/* Admin only - this is the panel that invites and manages users. */}
      <Route path='/admin' element={
        <RequireRole allow={['admin']}>
          <AdminUsers />
        </RequireRole>
      }/>

      {/* Clerk-owned routes. Needed so deep links to sign-in, the account portal
          and accepted invitations resolve instead of falling through to 404. */}
      <Route path='/sign-in/*' element={<SignInPage />} />
      <Route path='/request-access' element={<AccessRequestPage />} />
      {/* Access is invitation-only. Do not let Clerk's public sign-up flow
          create an organization and silently make the new person an admin. */}
      <Route path='/sign-up/*' element={<Navigate to="/request-access" replace />} />
      <Route path='/user-profile/*' element={<UserProfile routing="path" path="/user-profile" />} />
      <Route path='*' element={<Home/>}/>
    </Routes>

    {!isOwnerPath && !isAdminPath && <Footer />}

    </>
  )
}

export default App
