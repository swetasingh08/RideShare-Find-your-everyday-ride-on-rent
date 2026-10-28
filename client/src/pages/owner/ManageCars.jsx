import React, { useCallback, useEffect, useState } from 'react'
import { assets} from '../../assets/assets'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import PricingSuggestion from '../../components/PricingSuggestion'

const ManageCars = () => {

  const {isUser, axios, currency} = useAppContext()
  const navigate = useNavigate()

  const [cars, setCars] = useState([])

  const fetchOwnerCars = useCallback(async ()=>{
    try {
      const {data} = await axios.get('/api/owner/cars')
      if(data.success){
        setCars(data.cars)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }, [axios])

  const toggleAvailability = async (carId)=>{
    try {
      const {data} = await axios.post('/api/owner/toggle-car', {carId})
      if(data.success){
        toast.success(data.message)
        fetchOwnerCars()
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteCar = async (carId)=>{
    try {

      const confirm = window.confirm('Are you sure you want to remove this vehicle?')

      if(!confirm) return null

      const {data} = await axios.post('/api/owner/delete-car', {carId})
      if(data.success){
        toast.success(data.message)
        fetchOwnerCars()
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    isUser && fetchOwnerCars()
  },[fetchOwnerCars, isUser])

  return (
    <div className='w-full px-4 pb-14 pt-10 md:px-10'>
      
      <Title title="Manage vehicles" subTitle="View your listed vehicles, control availability, and manage your RideShare fleet."/>

      <div className='mt-6 w-full max-w-6xl overflow-hidden rounded-2xl border border-borderColor bg-white shadow-[0_14px_38px_rgba(15,118,110,0.06)]'>

        <table className='w-full border-collapse text-left text-sm text-gray-600'>
          <thead className='bg-light text-gray-500'>
            <tr>
              <th className="p-3 font-medium">Vehicle</th>
              <th className="p-3 font-medium max-md:hidden">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium max-md:hidden">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 && <tr><td colSpan="5" className='p-0'><div className='p-10 text-center'><div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary'>+</div><p className='mt-4 font-medium text-gray-800'>Your vehicle fleet is empty</p><p className='mt-1 text-sm text-gray-500'>Add your first vehicle to start earning with RideShare.</p><Link to='/owner/add-car' className='mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white'>Add a vehicle</Link></div></td></tr>}
            {cars.map((car, index)=>(
              <tr key={index} className='border-t border-borderColor'>

                <td className='p-3 flex items-center gap-3'>
                  <img src={car.image} alt="" className="h-12 w-12 aspect-square rounded-md object-cover"/>
                  <div className='max-md:hidden'>
                    <p className='font-medium'>{car.brand} {car.model}</p>
                    <p className='text-xs text-gray-500'>{car.seating_capacity} • {car.transmission}</p>
                  </div>
                </td>

                <td className='p-3 max-md:hidden'>{car.category}</td>
                <td className='p-3'><span>{currency}{car.pricePerDay}/day</span><PricingSuggestion car={car} axios={axios} currency={currency}/></td>

                <td className='p-3 max-md:hidden'>
                  <span className={`px-3 py-1 rounded-full text-xs ${car.isAvaliable ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                    {car.isAvaliable ? "Available" : "Unavailable" }
                  </span>
                </td>

                <td className='flex items-center p-3'>

                  <button type='button' onClick={()=> navigate('/owner/add-car', { state: { car } })} className='mr-3 text-primary hover:text-primary-dull' title='Edit vehicle'>Edit</button>

                  <img onClick={()=> toggleAvailability(car._id)} src={car.isAvaliable ? assets.eye_close_icon : assets.eye_icon} alt="" className='cursor-pointer'/>

                  <img onClick={()=> deleteCar(car._id)} src={assets.delete_icon} alt="" className='cursor-pointer'/>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}

export default ManageCars
