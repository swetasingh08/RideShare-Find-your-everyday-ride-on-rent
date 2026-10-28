import React, { useMemo, useState } from 'react'
import Title from '../../components/owner/Title'
import { cityList } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import LocationMap from '../../components/LocationMap'
import { coordinatesFromPosition, geolocationOptions, normalizeCoordinates } from '../../utils/coordinates'

const steps = ['Vehicle', 'Photos', 'Location', 'Pricing', 'Availability', 'Rules', 'Verification', 'Review']
const features = ['AC', 'Power Windows', 'Bluetooth', 'Android Auto', 'Apple CarPlay', 'GPS', 'Rear Camera', 'Parking Sensors', 'Sunroof', 'Cruise Control', 'Airbags', 'ABS', 'Child Seat']
const rules = ['No smoking', 'No pets', 'No commercial use', 'No racing', 'No sub-renting']
const initial = { brand:'', model:'', variant:'', year:'', registrationYear:'', category:'', seating_capacity:'', transmission:'', fuel_type:'', evRangeKm:'', chargingType:'', description:'', location:'', pickupLocality:'', pickupAddress:'', landmark:'', coordinates:{ latitude:'', longitude:'' }, pickupOptions:[], pricePerHour:'', pricePerDay:'', weeklyDiscount:'', monthlyDiscount:'', securityDeposit:'', includedKmPerDay:'', extraKmCharge:'', lateReturnCharge:'', deliveryAvailable:false, deliveryFee:'', minRentalDays:1, maxRentalDays:30, availableFrom:'', availableUntil:'', pickupTime:'10:00', returnTime:'10:00', instantBooking:false, approvalRequired:true, minDriverAge:21, minDrivingExperience:2, requiredDocuments:['Driving License','Government ID'], rentalRules:[], features:[], odometerKm:'', condition:'Good', lastServiceDate:'', nextServiceDue:'', knownIssues:'', registrationNumber:'', vin:'', insuranceProvider:'', insuranceExpiry:'', pucExpiry:'' }

const AddCar = () => {
  const { axios, currency } = useAppContext()
  const { state } = useLocation()
  const navigate = useNavigate()
  const editingCar = state?.car
  const [step, setStep] = useState(0)
  const [images, setImages] = useState([])
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [car, setCar] = useState(editingCar ? { ...initial, ...editingCar, coordinates: editingCar.coordinates || initial.coordinates, instantBooking: false, approvalRequired: true } : initial)
  const previewImages = useMemo(() => images.map(file => URL.createObjectURL(file)), [images])
  const update = (key, value) => setCar(current => ({ ...current, [key]: value }))
  const toggle = (key, value) => update(key, car[key].includes(value) ? car[key].filter(item => item !== value) : [...car[key], value])
  const hasValidCoordinates = value => Boolean(normalizeCoordinates(value))
  const next = () => {
    if (step === 0 && (!car.brand || !car.model || !car.variant || !car.year || !car.registrationYear || !car.category || !car.transmission || !car.fuel_type || !car.seating_capacity)) return toast.error('Complete the required vehicle details')
    if (step === 1 && !editingCar && (images.length < 4 || images.length > 10)) return toast.error('Add 4 to 10 vehicle photos')
    if (step === 2 && (!car.location || !car.pickupAddress)) return toast.error('Add a pickup city and address')
    if (step === 2 && !hasValidCoordinates(car.coordinates)) return toast.error('Add valid pickup coordinates or click the map to place the pickup pin')
    if (step === 3 && !car.pricePerDay) return toast.error('Set a daily price')
    setStep(value => Math.min(value + 1, steps.length - 1))
  }
  const resolvePickupAddress = coordinates => {
    axios.post('/api/locations/reverse-geocode', { coordinates })
      .then(({ data }) => {
        if (!data.success || !data.location) return
        update('pickupAddress', data.location.displayName || '')
        const address = data.location.address || {}
        update('pickupLocality', address.neighbourhood || address.suburb || address.residential || '')
        const city = address.city || address.town || address.village || ''
        if (cityList.includes(city)) update('location', city)
      })
      .catch(() => {})
  }
  const captureCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported by this browser')
    navigator.geolocation.getCurrentPosition(
      position => {
        const coordinates = coordinatesFromPosition(position)
        if (!coordinates) return toast.error('The device returned invalid coordinates')
        update('coordinates', coordinates)
        resolvePickupAddress(coordinates)
      },
      error => toast.error(error?.code === 1 ? 'Location permission was not granted' : 'Could not read the current location'),
      geolocationOptions,
    )
  }
  const submit = async () => {
    if (!editingCar && (images.length < 4 || images.length > 10)) return toast.error('Add 4 to 10 vehicle photos')
    if (!car.description.trim()) return toast.error('Tell renters about your vehicle before publishing')
    setIsLoading(true)
    try {
      const formData = new FormData()
      images.forEach(file => formData.append('images', file))
      documents.forEach(file => formData.append('documents', file))
      formData.append('documentTypes', 'RC,Insurance,PUC,Government ID,Driving License')
      formData.append('carData', JSON.stringify(car))
      if (editingCar) formData.append('carId', editingCar._id)
      const { data } = await axios.post(editingCar ? '/api/owner/update-car' : '/api/owner/add-car', formData)
      if (!data.success) return toast.error(data.message)
      toast.success(editingCar ? 'Vehicle updated and sent for verification' : 'Vehicle submitted for verification')
      navigate('/owner/manage-cars')
    } catch (error) { toast.error(error.message) } finally { setIsLoading(false) }
  }
  const field = (label, key, type='text', extra={}) => <label className='flex flex-col gap-1 text-sm text-gray-600'>{label}<input type={type} value={car[key] ?? ''} onChange={e => update(key, e.target.value)} className='border border-borderColor rounded-md px-3 py-2 outline-none focus:border-primary' {...extra}/></label>

  return <div className='flex-1 px-4 pb-14 py-10 md:px-10'>
    <Title title={editingCar ? 'Edit vehicle listing' : 'List your vehicle'} subTitle='Create a trusted peer-to-peer listing. Documents stay private until an admin verifies them.'/>
    <div className='mt-6 max-w-5xl'><div className='flex flex-wrap gap-2 rounded-2xl border border-borderColor bg-white p-3 shadow-sm'>{steps.map((name, index) => <button type='button' key={name} onClick={() => index <= step && setStep(index)} className={`rounded-xl px-3 py-2 text-sm ${index === step ? 'bg-primary text-white shadow-md' : index < step ? 'bg-primary/10 text-primary' : 'bg-light text-gray-400'}`}>{index + 1}. {name}</button>)}</div>
      <div className='mt-6 max-w-3xl'>
        {step === 0 && <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>{field('Make / brand','brand')}{field('Model','model')}{field('Variant','variant')}{field('Manufacturing year','year','number')}{field('Registration year','registrationYear','number')}<label className='flex flex-col gap-1'>Vehicle type<select value={car.category} onChange={e=>update('category',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option value=''>Select</option>{['Hatchback','Sedan','SUV','MUV','Luxury','Van','Scooter','Motorcycle','Three-wheeler','Bicycle'].map(x=><option key={x}>{x}</option>)}</select></label>{field('Seating capacity','seating_capacity','number')}<label className='flex flex-col gap-1'>Transmission<select value={car.transmission} onChange={e=>update('transmission',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option value=''>Select</option>{['Manual','Automatic','AMT','CVT','DCT'].map(x=><option key={x}>{x}</option>)}</select></label><label className='flex flex-col gap-1'>Fuel type<select value={car.fuel_type} onChange={e=>update('fuel_type',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option value=''>Select</option>{['Petrol','Diesel','CNG','Electric','Hybrid'].map(x=><option key={x}>{x}</option>)}</select></label>{car.fuel_type === 'Electric' && <>{field('Approx. range (km)','evRangeKm','number')}<label className='flex flex-col gap-1'>Charging type<select value={car.chargingType} onChange={e=>update('chargingType',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option value=''>Select</option><option>Fast Charging</option><option>AC Charging</option><option>Both</option></select></label></>}</div>}
        {step === 1 && <div><label className='block font-medium mb-2'>Vehicle photos</label><input type='file' accept='image/*' multiple onChange={e=>setImages([...e.target.files])}/><p className='text-sm text-gray-500 mt-2'>Select 4–10 files together. On Windows, hold Ctrl while clicking each photo, then choose Open.</p><p className={`mt-2 text-sm font-medium ${images.length >= 4 && images.length <= 10 ? 'text-green-600' : 'text-accent'}`}>{images.length} of 4–10 photos selected</p><div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>{previewImages.map((url, index)=><img key={url} src={url} className='h-24 w-full object-cover rounded-md' alt={`Vehicle preview ${index + 1}`}/>)}</div>{editingCar?.images?.length > 0 && images.length === 0 && <p className='mt-3 text-sm text-gray-500'>Current gallery has {editingCar.images.length} photos. Upload a new set only to replace it.</p>}</div>}
        {step === 2 && <div className='grid grid-cols-1 md:grid-cols-2 gap-4'><label className='flex flex-col gap-1'>Pickup city<select value={car.location} onChange={e=>update('location',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option value=''>Select</option>{cityList.map(city=><option key={city}>{city}</option>)}</select></label>{field('Locality / area','pickupLocality')}{field('Full pickup address (house no, society, street)','pickupAddress','text',{placeholder:'House 12, Green Society, Main Road'})}{field('Nearby landmark','landmark')}<label className='flex flex-col gap-1'>Pickup options<select multiple value={car.pickupOptions} onChange={e=>update('pickupOptions',[...e.target.selectedOptions].map(x=>x.value))} className='border border-borderColor rounded-md px-3 py-2 h-30'>{['Owner location','Airport pickup','Railway station','Home delivery','Custom location'].map(x=><option key={x}>{x}</option>)}</select></label><div className='border border-borderColor rounded-md p-3'><p className='font-medium'>GPS pickup coordinates</p><p className='mt-1 text-xs text-gray-500'>Use your current location for a fresh GPS pin, or click the map to place the exact pickup point.</p><button type='button' onClick={captureCurrentLocation} className='mt-2 text-primary'>Use my current location</button><div className='grid grid-cols-2 gap-2 mt-2'><input placeholder='Latitude' value={car.coordinates.latitude} onChange={e=>update('coordinates',{...car.coordinates,latitude:e.target.value})} className='border border-borderColor rounded px-2 py-1'/><input placeholder='Longitude' value={car.coordinates.longitude} onChange={e=>update('coordinates',{...car.coordinates,longitude:e.target.value})} className='border border-borderColor rounded px-2 py-1'/></div></div>{<div className='md:col-span-2'><LocationMap locationMarkers={[hasValidCoordinates(car.coordinates) && { id: 'pickup', kind: 'pickup', label: 'Vehicle pickup point', coordinates: { latitude: Number(car.coordinates.latitude), longitude: Number(car.coordinates.longitude) } }].filter(Boolean)} onMapClick={coordinates => { update('coordinates', coordinates); resolvePickupAddress(coordinates) }} /><p className='mt-1 text-xs text-gray-500'>Click anywhere on the map to move the pickup pin.</p></div>}</div>}
        {step === 3 && <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>{field(`Hourly price (${currency})`,'pricePerHour','number')}{field(`Daily price (${currency})`,'pricePerDay','number')}{field('Weekly discount (%)','weeklyDiscount','number')}{field('Monthly discount (%)','monthlyDiscount','number')}{field(`Security deposit (${currency})`,'securityDeposit','number')}{field('Included km / day','includedKmPerDay','number')}{field(`Extra km charge (${currency})`,'extraKmCharge','number')}{field(`Late return / hour (${currency})`,'lateReturnCharge','number')}{field('Minimum rental days','minRentalDays','number')}{field('Maximum rental days','maxRentalDays','number')}</div>}
        {step === 4 && <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{field('Available from','availableFrom','date')}{field('Available until','availableUntil','date')}{field('Pickup time','pickupTime','time')}{field('Return time','returnTime','time')}<div className='md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4'><p className='font-medium text-primary'>Owner approval is required</p><p className='mt-1 text-sm text-gray-500'>Every renter request stays pending until you approve it. The vehicle will not be rented or activated before approval.</p></div><div className='md:col-span-2 rounded-xl border border-borderColor bg-light p-4'><label className='flex items-center gap-2 text-sm font-medium'><input type='checkbox' checked={car.deliveryAvailable} onChange={e=>update('deliveryAvailable',e.target.checked)}/> I can deliver this vehicle to the renter</label>{car.deliveryAvailable && <label className='mt-3 flex max-w-xs flex-col gap-1 text-sm text-gray-600'>Owner delivery fee ({currency})<input type='number' min='0' value={car.deliveryFee ?? ''} onChange={e=>update('deliveryFee',e.target.value)} className='rounded-md border border-borderColor px-3 py-2 outline-none focus:border-primary'/></label>}<p className='mt-2 text-sm text-gray-500'>Renter pickup is free. If you offer delivery, this fee is added to the booking total.</p></div></div>}
        {step === 5 && <div className='space-y-6'><div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{field('Minimum driver age','minDriverAge','number')}{field('Minimum driving experience (years)','minDrivingExperience','number')}{field('Odometer reading (km)','odometerKm','number')}<label className='flex flex-col gap-1'>Condition<select value={car.condition} onChange={e=>update('condition',e.target.value)} className='border border-borderColor rounded-md px-3 py-2'><option>Excellent</option><option>Good</option><option>Fair</option></select></label>{field('Last service date','lastServiceDate','date')}{field('Next service due','nextServiceDue','date')}</div><label className='flex flex-col gap-1'>Known issues<textarea value={car.knownIssues} onChange={e=>update('knownIssues',e.target.value)} className='border border-borderColor rounded-md px-3 py-2' /></label><div><p className='font-medium mb-2'>Vehicle features</p><div className='flex flex-wrap gap-3'>{features.map(item=><label key={item} className='flex gap-1'><input type='checkbox' checked={car.features.includes(item)} onChange={()=>toggle('features',item)}/>{item}</label>)}</div></div><div><p className='font-medium mb-2'>Rental rules</p><div className='flex flex-wrap gap-3'>{rules.map(item=><label key={item} className='flex gap-1'><input type='checkbox' checked={car.rentalRules.includes(item)} onChange={()=>toggle('rentalRules',item)}/>{item}</label>)}</div></div></div>}
        {step === 6 && <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{field('Registration number','registrationNumber')}{field('VIN / chassis number','vin')}{field('Insurance provider','insuranceProvider')}{field('Insurance expiry','insuranceExpiry','date')}{field('PUC expiry','pucExpiry','date')}<label className='flex flex-col gap-1'>RC, insurance, PUC, government ID, driving licence<input type='file' multiple accept='.pdf,image/*' onChange={e=>setDocuments([...e.target.files])} className='border border-borderColor rounded-md p-2'/><span className='text-xs text-gray-500'>{documents.length} document(s) selected. Admins only can review these.</span></label></div>}
        {step === 7 && <div className='border border-borderColor rounded-lg p-5 space-y-3'><div className='flex justify-between'><div><h2 className='text-xl font-semibold'>{car.brand} {car.model} {car.variant}</h2><p className='text-gray-500'>{car.location}{car.pickupLocality ? `, ${car.pickupLocality}` : ''}</p></div><span className='bg-yellow-100 text-yellow-700 h-max px-3 py-1 rounded-full text-sm'>Pending verification</span></div><div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'><p>{car.seating_capacity} seats</p><p>{car.transmission}</p><p>{car.fuel_type}</p><p>{currency}{car.pricePerDay}/day</p><p>{car.includedKmPerDay || 0} km included</p><p>Owner approval required</p><p>Deposit {currency}{car.securityDeposit || 0}</p><p>{images.length || editingCar?.images?.length || 0} photos</p></div><label className='flex flex-col gap-1'>Tell renters about your vehicle<textarea required value={car.description} onChange={e=>update('description',e.target.value)} placeholder='Well-maintained vehicle available for city and outstation trips...' className='border border-borderColor rounded-md px-3 py-2'/></label><p className='text-sm text-gray-500'>Publishing submits this listing for admin verification. Renters will only see the verification badge, not private documents.</p></div>}
      </div>
      <div className='mt-8 flex justify-between'><button type='button' onClick={()=>setStep(value=>Math.max(0,value-1))} disabled={step===0} className='border border-borderColor px-4 py-2 rounded-md disabled:opacity-40'>Back</button>{step < steps.length - 1 ? <button type='button' onClick={next} className='bg-primary text-white px-5 py-2 rounded-md'>Continue</button> : <button type='button' onClick={submit} disabled={isLoading} className='bg-primary text-white px-5 py-2 rounded-md disabled:opacity-50'>{isLoading ? 'Publishing...' : editingCar ? 'Save changes' : 'Publish vehicle'}</button>}</div>
    </div>
  </div>
}
export default AddCar
