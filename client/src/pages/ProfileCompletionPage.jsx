import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const ProfileCompletionPage = () => {
  const { axios, user, setUser, isLoaded, isSignedIn, isUserLoading } = useAppContext()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', city: '', occupation: '', age: '' })

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      city: user.city || '',
      occupation: user.occupation || '',
      age: user.age || '',
    })
  }, [user])

  if (isLoaded && !isSignedIn) return <Navigate to='/sign-in' replace />
  if (!isLoaded || isUserLoading || !user) return <div className='flex min-h-[70vh] items-center justify-center text-gray-500'>Loading profile...</div>

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    try {
      const { data } = await axios.put('/api/user/profile', form)
      if (!data.success) throw new Error(data.message)
      setUser(data.user)
      toast.success('Your RideShare profile is ready')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12'>
      <section className='surface-card w-full max-w-2xl rounded-3xl p-6 shadow-xl md:p-10'>
        <div className='text-center'>
          <span className='section-kicker'>One quick step</span>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight text-gray-800 md:text-4xl'>Complete your RideShare profile</h1>
          <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500'>
            Clerk confirms your account, but these details help renters and vehicle owners coordinate safely during a booking.
          </p>
        </div>

        <form onSubmit={submit} className='mt-8 grid gap-5 sm:grid-cols-2'>
          <label className='flex flex-col gap-2 text-sm font-medium text-gray-700'>
            Full name
            <input required minLength='2' maxLength='80' value={form.name} onChange={event => update('name', event.target.value)} placeholder='Enter your full name' className='rounded-xl border border-borderColor px-4 py-3 outline-none focus:border-primary' />
          </label>
          <label className='flex flex-col gap-2 text-sm font-medium text-gray-700'>
            Mobile number
            <input required type='tel' value={form.phone} onChange={event => update('phone', event.target.value)} placeholder='+91 98765 43210' className='rounded-xl border border-borderColor px-4 py-3 outline-none focus:border-primary' />
          </label>
          <label className='flex flex-col gap-2 text-sm font-medium text-gray-700'>
            City
            <input required minLength='2' maxLength='80' value={form.city} onChange={event => update('city', event.target.value)} placeholder='e.g. Kanpur' className='rounded-xl border border-borderColor px-4 py-3 outline-none focus:border-primary' />
          </label>
          <label className='flex flex-col gap-2 text-sm font-medium text-gray-700'>
            Occupation
            <input required minLength='2' maxLength='80' value={form.occupation} onChange={event => update('occupation', event.target.value)} placeholder='e.g. Student' className='rounded-xl border border-borderColor px-4 py-3 outline-none focus:border-primary' />
          </label>
          <label className='flex flex-col gap-2 text-sm font-medium text-gray-700 sm:max-w-[calc(50%-0.625rem)]'>
            Age
            <input required type='number' min='18' max='100' value={form.age} onChange={event => update('age', event.target.value)} placeholder='18' className='rounded-xl border border-borderColor px-4 py-3 outline-none focus:border-primary' />
          </label>
          <div className='flex items-end sm:justify-end'>
            <button type='submit' disabled={saving} className='w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'>
              {saving ? 'Saving profile...' : 'Save and continue'}
            </button>
          </div>
        </form>

        <p className='mt-6 text-center text-xs leading-5 text-gray-500'>Your mobile number is used only for booking coordination and contact details shown to the other participant in your trip.</p>
      </section>
    </main>
  )
}

export default ProfileCompletionPage
