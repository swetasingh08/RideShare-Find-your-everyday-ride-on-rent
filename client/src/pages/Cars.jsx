import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CarCard from '../components/CarCard'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import LocationMap from '../components/LocationMap'
import { coordinatesFromPosition, geolocationOptions, normalizeCoordinates } from '../utils/coordinates'

const Cars = () => {
  const [searchParams] = useSearchParams()
  const { cars, axios } = useAppContext()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ location: searchParams.get('pickupLocation') || '', category: searchParams.get('category') || '', transmission: '', fuel: '', maxPrice: '' })
  const [dates, setDates] = useState({ pickup: searchParams.get('pickupDate') || '', returnDate: searchParams.get('returnDate') || '' })
  const dropLocation = searchParams.get('dropLocation') || ''
  const [results, setResults] = useState(cars)
  const [checking, setChecking] = useState(false)
  const [availabilityCars, setAvailabilityCars] = useState(null)
  const [locationCars, setLocationCars] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [radius, setRadius] = useState('25')
  const [locating, setLocating] = useState(false)
  const categories = useMemo(() => [...new Set(cars.map(car => car.category).filter(Boolean))], [cars])

  const applyFilters = useCallback((source = availabilityCars || locationCars || cars) => {
    const term = query.trim().toLowerCase()
    const locationTerm = filters.location.trim().toLowerCase()
    const categoryTerm = filters.category.trim().toLowerCase()
    setResults(source.filter(car => {
      const searchable = `${car.brand} ${car.model} ${car.category} ${car.location} ${car.pickupLocality || ''} ${car.pickupAddress || ''} ${car.landmark || ''} ${car.description || ''}`.toLowerCase()
      const carCategory = (car.category || '').toLowerCase()
      const categoryMatches = !categoryTerm || carCategory === categoryTerm || (categoryTerm === 'car' && ['hatchback', 'sedan', 'suv', 'muv', 'luxury'].includes(carCategory))
      return (!term || searchable.includes(term)) && (!locationTerm || searchable.includes(locationTerm)) && categoryMatches && (!filters.transmission || car.transmission === filters.transmission) && (!filters.fuel || car.fuel_type === filters.fuel) && (!filters.maxPrice || Number(car.pricePerDay) <= Number(filters.maxPrice)) && car.isAvaliable
    }))
  }, [availabilityCars, cars, filters, locationCars, query])

  const findNearby = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported by this browser')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async position => {
      const nextLocation = coordinatesFromPosition(position)
      if (!nextLocation) {
        setLocating(false)
        return toast.error('The device returned invalid coordinates')
      }
      setUserLocation(nextLocation)
      try {
        const { data } = await axios.get(`/api/user/cars/nearby?lat=${nextLocation.latitude}&lng=${nextLocation.longitude}&radius=${radius}`)
        if (!data.success) return toast.error(data.message)
        setLocationCars(data.nearbyCars)
        toast.success(`${data.nearbyCars.length} vehicle(s) found within ${radius} km`)
      } catch (error) { toast.error(error.message) } finally { setLocating(false) }
    }, error => { setLocating(false); toast.error(error?.code === 1 ? 'Location permission was not granted' : error?.code === 3 ? 'Location lookup timed out; try again' : 'Could not read the current location') }, geolocationOptions)
  }

  const searchAvailability = useCallback(async e => {
    e.preventDefault()
    if (!dates.pickup || !dates.returnDate) {
      setAvailabilityCars(null)
      return applyFilters(locationCars || cars)
    }
    if (new Date(dates.returnDate) <= new Date(dates.pickup)) return toast.error('Return date must be after pickup date')
    setChecking(true)
    try {
      const { data } = await axios.post('/api/bookings/check-availability', { location: filters.location, pickupDate: dates.pickup, returnDate: dates.returnDate })
      if (data.success) {
        const dateSpecificCars = data.cars || data.availableCars || []
        setAvailabilityCars(dateSpecificCars)
        applyFilters(dateSpecificCars)
      }
    } catch (error) { toast.error(error.message) } finally { setChecking(false) }
  }, [applyFilters, axios, cars, dates, filters.location, locationCars])
  const initialAvailabilityLoaded = useRef(false)
  useEffect(() => {
    if (initialAvailabilityLoaded.current || !dates.pickup || !dates.returnDate) return
    initialAvailabilityLoaded.current = true
    searchAvailability({ preventDefault: () => {} })
  }, [dates.pickup, dates.returnDate, searchAvailability])
  useEffect(() => { applyFilters(availabilityCars || locationCars || cars) }, [applyFilters, availabilityCars, cars, locationCars])
  const reset = () => { setQuery(''); setFilters({ location: '', category: '', transmission: '', fuel: '', maxPrice: '' }); setDates({ pickup: '', returnDate: '' }); setAvailabilityCars(null); setLocationCars(null); setUserLocation(null); setResults(cars) }

  return <div><div className='py-16 px-6 md:px-16 bg-light'><Title title='Find your next ride' subTitle='Search peer-listed vehicles by location, dates, and vehicle preferences.'/><form onSubmit={searchAvailability} className='max-w-6xl mx-auto mt-8 bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3'><div className='lg:col-span-2 flex items-center border border-borderColor rounded-lg px-3'><img src={assets.search_icon} className='w-4 mr-2' alt='' /><input value={query} onChange={e => setQuery(e.target.value)} placeholder='Make, model, or feature' className='w-full py-2 outline-none'/></div><input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder='City, locality, PIN, or address' className='border border-borderColor rounded-lg px-3 py-2' /><input type='date' value={dates.pickup} onChange={e => setDates({ ...dates, pickup: e.target.value })} min={new Date().toISOString().split('T')[0]} className='border border-borderColor rounded-lg px-3 py-2' /><input type='date' value={dates.returnDate} onChange={e => setDates({ ...dates, returnDate: e.target.value })} min={dates.pickup || new Date().toISOString().split('T')[0]} className='border border-borderColor rounded-lg px-3 py-2' /><button className='bg-primary text-white rounded-lg px-4 py-2 font-medium'>{checking ? 'Checking...' : 'Check availability'}</button></form><div className='max-w-6xl mx-auto mt-3 grid grid-cols-2 md:grid-cols-6 gap-3'><select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className='border border-borderColor rounded-lg px-3 py-2 bg-white'><option value=''>All types</option>{categories.map(value => <option key={value}>{value}</option>)}</select><select value={filters.transmission} onChange={e => setFilters({ ...filters, transmission: e.target.value })} className='border border-borderColor rounded-lg px-3 py-2 bg-white'><option value=''>Transmission</option><option>Automatic</option><option>Manual</option><option>Semi-Automatic</option></select><select value={filters.fuel} onChange={e => setFilters({ ...filters, fuel: e.target.value })} className='border border-borderColor rounded-lg px-3 py-2 bg-white'><option value=''>Fuel type</option><option>Electric</option><option>Hybrid</option><option>Petrol</option><option>Diesel</option><option>Gas</option></select><input type='number' value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} placeholder='Max price / day' className='border border-borderColor rounded-lg px-3 py-2 bg-white'/><select value={radius} onChange={e => setRadius(e.target.value)} className='border border-borderColor rounded-lg px-3 py-2 bg-white'><option value='5'>Within 5 km</option><option value='10'>Within 10 km</option><option value='25'>Within 25 km</option><option value='50'>Within 50 km</option></select><button type='button' onClick={findNearby} className='rounded-lg border border-primary px-4 py-2 text-primary'>{locating ? 'Locating...' : 'Use my location'}</button></div><div className='max-w-6xl mx-auto mt-3 flex justify-end'><button type='button' onClick={reset} className='border border-primary text-primary rounded-lg px-4 py-2'>Reset filters</button></div></div><div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-10 pb-16'><p className='text-gray-500'>Showing {results.length} available vehicles{locationCars ? ` near you within ${radius} km` : ''}</p>{dropLocation && <p className='mt-1 text-sm text-gray-500'>Trip destination: {dropLocation}</p>}<div className='mt-4'>{(userLocation || results.some(car => normalizeCoordinates(car.coordinates))) && <LocationMap cars={results} userLocation={userLocation} onSelect={car => { const params = new URLSearchParams({ pickupDate: dates.pickup, returnDate: dates.returnDate, pickupLocation: filters.location, dropLocation }); navigate(`/car-details/${car._id}?${params.toString()}`) }} />}</div><div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6'>{results.map(car => <CarCard key={car._id} car={car} bookingContext={{ pickupDate: dates.pickup, returnDate: dates.returnDate, pickupLocation: filters.location, dropLocation, availabilityChecked: Boolean(availabilityCars) }} />)}{results.length === 0 && <p className='col-span-full py-16 text-center text-gray-500'>No vehicles match these criteria.</p>}</div></div></div>
}
export default Cars
