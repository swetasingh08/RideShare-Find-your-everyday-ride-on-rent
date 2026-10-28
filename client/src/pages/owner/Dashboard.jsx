import React, { useCallback, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const Dashboard = () => {

  const {axios, isUser, currency, user} = useAppContext()

  const [data, setData] = useState({
    totalCars: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: [],
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dashboardCards = [
    {title: "Total Vehicles", value: data.totalCars, icon: assets.carIconColored},
    {title: "Total Bookings", value: data.totalBookings, icon: assets.listIconColored},
    {title: "Pending", value: data.pendingBookings, icon: assets.cautionIconColored},
    {title: "Confirmed", value: data.completedBookings, icon: assets.listIconColored},
  ]

  const fetchDashboardData = useCallback(async ()=>{
    try {
       const { data } = await axios.get('/api/owner/dashboard')
       if (data.success){
        setData(data.dashboardData)
        setError('')
       }else{
        setError(data.message || 'Dashboard data could not be loaded')
       }
    } catch (error) {
      setError(error.message || 'Dashboard data could not be loaded')
    } finally { setLoading(false) }
  }, [axios])

  useEffect(()=>{
    if(isUser){
      fetchDashboardData()
    }
  },[fetchDashboardData, isUser])

  return (
    <div className='flex-1 px-4 pb-14 pt-10 md:px-10'>
      <Title title={`${user?.name || 'Your'} dashboard`} subTitle="Manage your vehicles, booking requests, and rental activity."/>

      <div className='my-8 grid w-full max-w-6xl gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {dashboardCards.map((card, index)=>(
          <div key={index} className='flex items-center justify-between gap-2 rounded-2xl border border-borderColor bg-white p-5 shadow-[0_14px_38px_rgba(15,118,110,0.06)]'>
            <div>
              <h1 className='text-xs text-gray-500'>{card.title}</h1>
              <p className='text-lg font-semibold'>{loading ? '—' : card.value}</p>
            </div>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10'>
              <img src={card.icon} alt="" className='h-4 w-4'/>
            </div>
          </div>
        ))}
      </div>

      {error && <div className='mb-6 flex max-w-5xl items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'><span>{error}</span><button type='button' onClick={fetchDashboardData} className='font-medium underline'>Try again</button></div>}


      <div className='mb-8 flex w-full max-w-6xl flex-wrap items-stretch gap-6'>
        {/* recent booking  */}
        <div className='w-full max-w-2xl rounded-2xl border border-borderColor bg-white p-5 shadow-[0_14px_38px_rgba(15,118,110,0.06)] md:p-6'>
          <h1 className='text-lg font-medium'>Recent Bookings</h1>
          <p className='text-gray-500'>Latest customer bookings</p>
          {loading ? <p className='mt-6 text-sm text-gray-500'>Loading booking activity...</p> : data.recentBookings.length === 0 ? (
            <div className='mt-6 rounded-lg border border-dashed border-borderColor bg-light p-5'>
              <p className='font-medium text-gray-800'>Your booking activity will appear here</p>
              <p className='mt-1 text-sm text-gray-500'>List a vehicle to start receiving rental requests.</p>
              <Link to='/owner/add-car' className='mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white'>List your first vehicle</Link>
            </div>
          ) : data.recentBookings.map((booking, index)=>(
            <div key={index} className='mt-4 flex items-center justify-between'>

              <div className='flex items-center gap-2'>
                <div className='hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
                  <img src={assets.listIconColored} alt="" className='h-5 w-5'/>
                </div>
                <div>
                  <p>{booking.car?.brand || 'Vehicle'} {booking.car?.model || ''}</p>
                  <p className='text-sm text-gray-500'>{booking.createdAt.split('T')[0]}</p>
                </div>
              </div>

              <div className='flex items-center gap-2 font-medium'>
                <p className='text-sm text-gray-500'>{currency}{booking.price}</p>
                <p className='px-3 py-0.5 border border-borderColor rounded-full text-sm'>{booking.status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* monthly revenue */}
        <div className='mb-6 w-full rounded-2xl border border-borderColor bg-white p-5 shadow-[0_14px_38px_rgba(15,118,110,0.06)] md:max-w-xs md:p-6'>
          <h1 className='text-lg font-medium'>Confirmed Revenue</h1>
          <p className='text-gray-500'>Across all confirmed bookings</p>
          <p className='text-3xl mt-6 font-semibold text-primary'>{loading ? '—' : `${currency}${data.monthlyRevenue}`}</p>
          <p className='mt-2 text-xs text-gray-500'>Earnings from confirmed, active, and completed rentals</p>
        </div>
        
      </div>


    </div>
  )
}

export default Dashboard
