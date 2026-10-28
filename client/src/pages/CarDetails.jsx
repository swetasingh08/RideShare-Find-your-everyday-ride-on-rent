import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion as Motion } from 'motion/react'
import ReviewList from '../components/ReviewList'
import LocationField from '../components/LocationField'
import LocationMap from '../components/LocationMap'
import { coordinatesFromPosition, geolocationOptions, normalizeCoordinates } from '../utils/coordinates'

const CarDetails = () => {

  const {id} = useParams()
  const [searchParams] = useSearchParams()

  const {cars, axios, pickupDate, setPickupDate, returnDate, setReturnDate, isSignedIn, isUser, user} = useAppContext()

  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [pickupPoint, setPickupPoint] = useState({ label: '', coordinates: null })
  const [dropPoint, setDropPoint] = useState({ label: searchParams.get('dropLocation') || '', coordinates: null })
  const [locationSuggestions, setLocationSuggestions] = useState({ pickup: [], drop: [] })
  const [locationErrors, setLocationErrors] = useState({ pickup: '', drop: '' })
  const [searchingLocation, setSearchingLocation] = useState('')
  const [locatingPoint, setLocatingPoint] = useState('')
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [handoverOption, setHandoverOption] = useState('renter_pickup')
  const initializedCarId = useRef('')
  const currency = import.meta.env.VITE_CURRENCY

  const setPointFromText = (kind, value) => {
    const setter = kind === 'pickup' ? setPickupPoint : setDropPoint
    setter(current => ({ ...current, label: value, coordinates: null }))
    setLocationSuggestions(current => ({ ...current, [kind]: [] }))
    setLocationErrors(current => ({ ...current, [kind]: '' }))
  }

  const selectLocationSuggestion = (kind, location) => {
    const setter = kind === 'pickup' ? setPickupPoint : setDropPoint
    const coordinates = normalizeCoordinates(location)
    if (!coordinates) return
    setter({ label: location.displayName, coordinates })
    setLocationSuggestions(current => ({ ...current, [kind]: [] }))
    setLocationErrors(current => ({ ...current, [kind]: '' }))
  }

  const resolvePoint = async kind => {
    const point = kind === 'pickup' ? pickupPoint : dropPoint
    if (!point.label.trim()) return
    setSearchingLocation(kind)
    try {
      const { data } = await axios.post('/api/locations/geocode', { query: point.label })
      if (!data.success) throw new Error(data.message)
      const location = data.location
      const setter = kind === 'pickup' ? setPickupPoint : setDropPoint
      const locations = Array.isArray(data.locations) && data.locations.length ? data.locations : [location]
      if (locations.length === 1) {
        const coordinates = normalizeCoordinates(locations[0])
        if (!coordinates) throw new Error('The location provider returned invalid coordinates')
        setter({ label: locations[0].displayName, coordinates })
        setLocationSuggestions(current => ({ ...current, [kind]: [] }))
        setLocationErrors(current => ({ ...current, [kind]: '' }))
      } else {
        setLocationSuggestions(current => ({ ...current, [kind]: locations }))
        setLocationErrors(current => ({ ...current, [kind]: 'Select the exact address from the results below' }))
      }
    } catch (error) {
      setLocationErrors(current => ({ ...current, [kind]: error.response?.data?.message || error.message || 'Location could not be found' }))
    } finally { setSearchingLocation('') }
  }

  const handleUseCurrentLocation = kind => {
    if (!navigator.geolocation) return setLocationErrors(current => ({ ...current, [kind]: 'Location is not supported by this browser' }))
    setLocatingPoint(kind)
    navigator.geolocation.getCurrentPosition(async position => {
      const coordinates = coordinatesFromPosition(position)
      if (!coordinates) {
        setLocatingPoint('')
        return setLocationErrors(current => ({ ...current, [kind]: 'The device returned invalid coordinates' }))
      }
      let label = 'Current location'
      try {
        const { data } = await axios.post('/api/locations/reverse-geocode', { coordinates })
        if (data.success) label = data.location.displayName
      } catch { /* coordinates remain usable if address lookup is unavailable */ }
      const setter = kind === 'pickup' ? setPickupPoint : setDropPoint
      setter({ label, coordinates })
      setLocationSuggestions(current => ({ ...current, [kind]: [] }))
      setLocationErrors(current => ({ ...current, [kind]: '' }))
      setLocatingPoint('')
    }, error => {
      setLocatingPoint('')
      const message = error?.code === 1 ? 'Location permission was not granted' : error?.code === 3 ? 'Location lookup timed out; try again' : 'Could not read the current location'
      setLocationErrors(current => ({ ...current, [kind]: message }))
    }, geolocationOptions)
  }

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const openPaymentCheckout = async (bookingId) => {
    const { data: orderData } = await axios.post('/api/payments/create-order', { bookingId })
    if (!orderData.success) throw new Error(orderData.message)
    if (!(await loadRazorpay())) throw new Error('Could not load the payment checkout')

    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'RideShare',
        description: `Vehicle booking ${bookingId}`,
        order_id: orderData.order.id,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#15947c' },
        handler: async (response) => {
          try {
            const { data } = await axios.post('/api/payments/verify', { bookingId, ...response })
            if (!data.success) return reject(new Error(data.message))
            resolve(data)
          } catch (error) { reject(error) }
        },
        modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
      })
      checkout.open()
    })
  }

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if (!isSignedIn) {
      navigate('/sign-in')
      return
    }
    if (!isUser) {
      toast.error('Your account does not have user access')
      return
    }
    if (!user?.profileCompleted) {
      toast.error('Complete your profile before booking')
      navigate('/complete-profile')
      return
    }
    if (!pickupPoint.coordinates) return toast.error('Find or select a valid pickup location')
    if (!dropPoint.coordinates) return toast.error('Find or select a valid drop location')
    if (routeLoading) return toast.error('Wait for the route to finish loading')
    if (!route) return toast.error('A driving route could not be calculated')
    try {
      const {data} = await axios.post('/api/bookings/create', {
        car: id,
        pickupDate,
        returnDate,
        pickupLocation: pickupPoint.label,
        dropLocation: dropPoint.label,
        pickupCoordinates: pickupPoint.coordinates,
        dropCoordinates: dropPoint.coordinates,
        routeDistanceKm: route.distanceKm,
        routeDurationMinutes: route.durationMinutes,
        handoverOption,
      })

      if (data.success){
        if (data.paymentRequired) {
          await openPaymentCheckout(data.bookingId)
          toast.success('Payment successful. Your booking is awaiting owner approval.')
        } else {
          toast.success(data.message)
        }
        navigate('/my-bookings')
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    const selectedCar = cars.find(car => car._id === id)
    setCar(selectedCar)
    setActiveImage(selectedCar?.images?.[0] || selectedCar?.image || '')
    if (selectedCar && initializedCarId.current !== id) {
      initializedCarId.current = id
      const pickupDateFromSearch = searchParams.get('pickupDate')
      const returnDateFromSearch = searchParams.get('returnDate')
      if (pickupDateFromSearch) setPickupDate(pickupDateFromSearch)
      if (returnDateFromSearch) setReturnDate(returnDateFromSearch)
      const pickupCoordinates = normalizeCoordinates(selectedCar.coordinates)
      setPickupPoint({ label: selectedCar.pickupAddress || selectedCar.location || '', coordinates: pickupCoordinates })
      setDropPoint({ label: searchParams.get('dropLocation') || '', coordinates: null })
      setLocationSuggestions({ pickup: [], drop: [] })
      setHandoverOption('renter_pickup')
      if (pickupCoordinates) {
        let active = true
        axios.post('/api/locations/reverse-geocode', { coordinates: pickupCoordinates })
          .then(({ data }) => {
            if (active && data.success && data.location?.displayName) {
              setPickupPoint(current => current.coordinates?.latitude === pickupCoordinates.latitude && current.coordinates?.longitude === pickupCoordinates.longitude
                ? { ...current, label: data.location.displayName }
                : current)
            }
          })
          .catch(() => {})
        return () => { active = false }
      }
    }
  },[cars, id, searchParams, setPickupDate, setReturnDate, axios])

  useEffect(() => {
    let active = true
    if (!pickupPoint.coordinates || !dropPoint.coordinates) {
      setRoute(null)
      setRouteError('')
      setRouteLoading(false)
      return undefined
    }
    setRouteLoading(true)
    setRouteError('')
    axios.post('/api/locations/route', { origin: pickupPoint.coordinates, destination: dropPoint.coordinates })
      .then(({ data }) => {
        if (!active) return
        if (!data.success) throw new Error(data.message)
        setRoute(data.route)
      })
      .catch(error => { if (active) { setRoute(null); setRouteError(error.response?.data?.message || error.message || 'Route lookup failed') } })
      .finally(() => { if (active) setRouteLoading(false) })
    return () => { active = false }
  }, [axios, pickupPoint.coordinates, dropPoint.coordinates])

  useEffect(() => {
    let active = true
    if (!car || !pickupDate || !returnDate || new Date(returnDate) <= new Date(pickupDate)) {
      setQuote(null)
      setQuoteLoading(false)
      return undefined
    }

    setQuoteLoading(true)
    axios.post('/api/bookings/quote', { car: id, pickupDate, returnDate, handoverOption })
      .then(({ data }) => {
        if (!active) return
        if (data.success) setQuote(data.quote)
        else setQuote(null)
      })
      .catch(() => { if (active) setQuote(null) })
      .finally(() => { if (active) setQuoteLoading(false) })

    return () => { active = false }
  }, [axios, car, id, pickupDate, returnDate, handoverOption])

  return car ? (
    <div className='mx-auto mt-10 max-w-7xl px-5 pb-16 md:px-10 lg:mt-14 lg:px-12'>

       <button onClick={()=> navigate(-1)} className='mb-6 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-light hover:text-primary cursor-pointer'>
        <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65'/>
        Back to all vehicles
       </button>

       <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12'>
          {/* Left: Vehicle Image & Details */}
          <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}

          className='lg:col-span-2'>
              <Motion.img
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}

              src={activeImage || car.image} alt={`${car.brand} ${car.model}`} className='w-full h-auto md:max-h-100 object-cover rounded-xl mb-3 shadow-md'/>
              {(car.images?.length > 1) && <div className='grid grid-cols-4 gap-3 mb-6'>{car.images.map((image, index) => <button type='button' key={image} onClick={() => setActiveImage(image)} className={`h-18 rounded-md overflow-hidden border-2 ${activeImage === image ? 'border-primary' : 'border-transparent'}`}><img src={image} alt={`${car.brand} view ${index + 1}`} className='w-full h-full object-cover'/></button>)}</div>}
              <Motion.div className='space-y-6'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div>
                  <div className='flex flex-wrap items-center gap-3'><h1 className='text-3xl font-bold'>{car.brand} {car.model} {car.variant}</h1>{car.verificationStatus === 'verified' && <span className='bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full'>Verified vehicle</span>}</div>
                  <p className='text-gray-500 text-lg'>{car.category} • {car.year}{car.registrationYear ? ` • Registered ${car.registrationYear}` : ''}</p>
                </div>
                <hr className='border-borderColor my-6'/>

                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                  {[
                    {icon: assets.users_icon, text: `${car.seating_capacity} Seats`},
                    {icon: assets.fuel_icon, text: car.fuel_type},
                    {icon: assets.car_icon, text: car.transmission},
                    {icon: assets.location_icon, text: car.location},
                  ].map(({icon, text})=>(
                    <Motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}

                    key={text} className='flex flex-col items-center bg-light p-4 rounded-lg'>
                      <img src={icon} alt="" className='h-5 mb-2'/>
                      {text}
                    </Motion.div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h1 className='text-xl font-medium mb-3'>Description</h1>
                  <p className='text-gray-500'>{car.description}</p>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='border border-borderColor rounded-lg p-4'><h2 className='font-medium mb-2'>Pickup</h2><p className='text-gray-500'>{car.pickupAddress}</p>{car.pickupLocality && <p className='text-gray-500'>{car.pickupLocality}</p>}{car.landmark && <p className='text-gray-500'>Near {car.landmark}</p>}{car.pickupOptions?.length > 0 && <p className='mt-2 text-sm'>{car.pickupOptions.join(' · ')}</p>}</div>
                  <div className='border border-borderColor rounded-lg p-4'><h2 className='font-medium mb-2'>Rental details</h2><p className='text-gray-500'>{car.includedKmPerDay || 0} km/day included</p><p className='text-gray-500'>{currency}{car.extraKmCharge || 0}/extra km</p><p className='text-gray-500'>Deposit {currency}{car.securityDeposit || 0}</p><p className='text-gray-500'>{car.minRentalDays || 1}–{car.maxRentalDays || 30} rental days</p></div>
                </div>

                <div>
                  <h1 className='text-xl font-medium mb-3'>Features</h1>
                  <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    {
                      (car.features?.length ? car.features : ["Bluetooth", "GPS"]).map((item)=>(
                        <li key={item} className='flex items-center text-gray-500'>
                          <img src={assets.check_icon} className='h-4 mr-2' alt="" />
                          {item}
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div><h2 className='text-xl font-medium mb-3'>Rental rules</h2>{car.rentalRules?.length ? <ul className='space-y-2 text-gray-500'>{car.rentalRules.map(rule => <li key={rule}>{rule}</li>)}</ul> : <p className='text-gray-500'>No extra rules listed.</p>}</div>
                  <div><h2 className='text-xl font-medium mb-3'>Vehicle condition</h2><p className='text-gray-500'>{car.condition || 'Good'} condition · {car.odometerKm || 0} km</p>{car.lastServiceDate && <p className='text-gray-500'>Last serviced {car.lastServiceDate.split('T')[0]}</p>}{car.knownIssues && <p className='text-gray-500 mt-2'>Known issues: {car.knownIssues}</p>}</div>
                </div>

                {car.owner && <div className='border border-borderColor rounded-lg p-4'><h2 className='font-medium'>Your host</h2><div className='mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500'><span>{car.owner.name}</span><span>{car.owner.totalTrips || 0} trips</span><span>{car.owner.averageRating ? `Rating ${car.owner.averageRating}` : 'New host'}</span>{car.owner.responseRate ? <span>{car.owner.responseRate}% response rate</span> : null}{car.owner.responseTime ? <span>{car.owner.responseTime}</span> : null}</div></div>}

                <div>
                  <h2 className='mb-3 text-xl font-medium'>Renter reviews</h2>
                  <ReviewList carId={car._id} axios={axios} />
                </div>

              </Motion.div>
          </Motion.div>

          {/* Right: Booking Form */}
          <Motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}

          onSubmit={handleSubmit} className='sticky top-24 h-max space-y-6 rounded-2xl border border-borderColor bg-white p-6 text-gray-500 shadow-[0_18px_50px_rgba(15,118,110,0.1)]'>

            <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>{currency}{car.pricePerDay}<span className='text-base text-gray-400 font-normal'>per day</span></p>
            <p className='text-sm'>Owner confirmation required before the vehicle is rented</p>
            {car.availableFrom && <p className='text-sm'>Available {car.availableFrom.split('T')[0]}{car.availableUntil ? ` to ${car.availableUntil.split('T')[0]}` : ''}</p>}

            {isSignedIn && isUser && <div className='rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm'>
              <p className='font-medium text-gray-800'>Booking as {user?.name || 'Profile'}</p>
              <p className='mt-1 text-xs text-gray-500'>Mobile: {user?.phone || 'Complete your profile to add a mobile number'}</p>
              <button type='button' onClick={() => navigate('/complete-profile')} className='mt-2 text-xs font-medium text-primary hover:text-primary-dull'>Edit profile details</button>
            </div>}

            <hr className='border-borderColor my-6'/>

            <div className='flex flex-col gap-2'>
              <label htmlFor="pickup-date">Pickup Date</label>
              <input value={pickupDate} onChange={(e)=>setPickupDate(e.target.value)}
              type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='pickup-date' min={car.availableFrom?.split('T')[0] || new Date().toISOString().split('T')[0]} max={car.availableUntil?.split('T')[0]}/>
            </div>

            <div className='rounded-lg bg-light p-4 text-sm'>
              <div className='flex justify-between'><span>Rental estimate</span><span>{quoteLoading ? 'Calculating...' : quote ? `${currency}${quote.rentalAmount}` : 'Select dates'}</span></div>
              {quote && quote.discountAmount > 0 && <div className='mt-1 flex justify-between text-green-700'><span>Long-stay discount</span><span>-{currency}{quote.discountAmount}</span></div>}
              {quote && quote.deliveryFee > 0 && <div className='mt-1 flex justify-between'><span>Owner delivery</span><span>{currency}{quote.deliveryFee}</span></div>}
              {quote && quote.securityDeposit > 0 && <div className='mt-1 flex justify-between'><span>Refundable deposit</span><span>{currency}{quote.securityDeposit}</span></div>}
              {quote && <div className='mt-2 flex justify-between border-t border-borderColor pt-2 font-semibold text-gray-800'><span>Total estimate</span><span>{currency}{quote.totalAmount}</span></div>}
              <p className='mt-2 text-xs text-gray-500'>Final availability and pricing are verified securely when you submit.</p>
            </div>

            <div className='flex flex-col gap-2'>
              <label htmlFor="return-date">Return Date</label>
              <input value={returnDate} onChange={(e)=>setReturnDate(e.target.value)}
              type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='return-date' min={pickupDate || new Date().toISOString().split('T')[0]} max={car.availableUntil?.split('T')[0]}/>
            </div>

            <div className='space-y-3 border-t border-borderColor pt-4'>
              <div><h2 className='font-medium text-gray-800'>Vehicle handover</h2><p className='mt-1 text-xs text-gray-500'>Choose who transports the vehicle to the agreed pickup point.</p></div>
              <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-borderColor p-3'><input type='radio' name='handover-option' value='renter_pickup' checked={handoverOption === 'renter_pickup'} onChange={event => setHandoverOption(event.target.value)} className='mt-1'/><span><span className='block font-medium text-gray-800'>I will collect the vehicle</span><span className='text-xs text-gray-500'>Free — collect it from the owner’s pickup point.</span></span></label>
              {car.deliveryAvailable && <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-borderColor p-3'><input type='radio' name='handover-option' value='owner_delivery' checked={handoverOption === 'owner_delivery'} onChange={event => setHandoverOption(event.target.value)} className='mt-1'/><span><span className='block font-medium text-gray-800'>Owner delivers the vehicle</span><span className='text-xs text-gray-500'>Extra {currency}{car.deliveryFee || 0} delivery charge.</span></span></label>}
              {!car.deliveryAvailable && <p className='rounded-lg bg-light px-3 py-2 text-xs text-gray-500'>This owner currently offers renter pickup only.</p>}
            </div>

            <div className='space-y-3 border-t border-borderColor pt-4'>
              <div><h2 className='font-medium text-gray-800'>Trip locations</h2><p className='mt-1 text-xs text-gray-500'>Resolve both points on the map so distance and travel time are calculated accurately.</p></div>
              <LocationField label='Pickup point' value={pickupPoint.label} onChange={value => setPointFromText('pickup', value)} onSearch={() => resolvePoint('pickup')} onSelectSuggestion={location => selectLocationSuggestion('pickup', location)} suggestions={locationSuggestions.pickup} onUseCurrent={() => handleUseCurrentLocation('pickup')} searching={searchingLocation === 'pickup'} locating={locatingPoint === 'pickup'} error={locationErrors.pickup} placeholder='House no, society, street, locality, city, PIN' />
              <LocationField label='Drop point' value={dropPoint.label} onChange={value => setPointFromText('drop', value)} onSearch={() => resolvePoint('drop')} onSelectSuggestion={location => selectLocationSuggestion('drop', location)} suggestions={locationSuggestions.drop} onUseCurrent={() => handleUseCurrentLocation('drop')} searching={searchingLocation === 'drop'} locating={locatingPoint === 'drop'} error={locationErrors.drop} placeholder='House no, society, street, locality, city, PIN' />
              {(pickupPoint.coordinates || dropPoint.coordinates || car.coordinates?.latitude != null) && <LocationMap cars={car.coordinates?.latitude != null ? [car] : []} locationMarkers={[pickupPoint.coordinates && { id: 'pickup', kind: 'pickup', label: `Pickup: ${pickupPoint.label}`, coordinates: pickupPoint.coordinates }, dropPoint.coordinates && { id: 'drop', kind: 'drop', label: `Drop: ${dropPoint.label}`, coordinates: dropPoint.coordinates }].filter(Boolean)} routeCoordinates={route?.coordinates || []} />}
              {(pickupPoint.coordinates || dropPoint.coordinates) && <div className='rounded-lg bg-light p-3 text-[11px] text-gray-500'>{pickupPoint.coordinates && <p><span className='font-medium text-gray-700'>Pickup pin:</span> {pickupPoint.coordinates.latitude.toFixed(6)}, {pickupPoint.coordinates.longitude.toFixed(6)}</p>}{dropPoint.coordinates && <p className={pickupPoint.coordinates ? 'mt-1' : ''}><span className='font-medium text-gray-700'>Drop pin:</span> {dropPoint.coordinates.latitude.toFixed(6)}, {dropPoint.coordinates.longitude.toFixed(6)}</p>}</div>}
              {routeLoading && <p className='text-xs text-gray-500'>Calculating driving route...</p>}
              {routeError && <p className='text-xs text-red-600'>{routeError}</p>}
              {route && <div className='grid grid-cols-2 gap-2 rounded-lg bg-light p-3 text-xs'><div><span className='text-gray-500'>{route.provider === 'straight-line fallback' ? 'Approx. distance' : 'Driving distance'}</span><p className='mt-1 font-semibold text-gray-800'>{route.distanceKm} km</p></div><div><span className='text-gray-500'>Estimated travel time</span><p className='mt-1 font-semibold text-gray-800'>{route.durationMinutes} min</p></div></div>}
            </div>

            <button className='w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl cursor-pointer'>
              {!isSignedIn ? 'Sign in to book' : isUser ? 'Book now' : 'User access required'}
            </button>

            <p className='text-center text-sm'>A secure payment checkout may be required after booking</p>

          </Motion.form>
       </div>

    </div>
  ) : <Loader />
}

export default CarDetails
