import React, { useState } from 'react'
import { assets, ownerMenuLinks } from '../../assets/assets'
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Sidebar = () => {

    const {user, axios, fetchUser} = useAppContext()
    const location = useLocation()
    const [image, setImage] = useState('')

    const updateImage = async ()=>{
        try {
          const formData = new FormData()
          formData.append('image', image)

          const {data} = await axios.post('/api/owner/update-image', formData)

          if(data.success){
            fetchUser()
            toast.success(data.message)
            setImage('')
          }else{
            toast.error(data.message)
          }
        } catch (error) {
          toast.error(error.message)
        }
    }

  return (
    <div className='relative min-h-screen w-full max-w-13 flex-col items-center border-r border-borderColor bg-white py-8 text-sm md:flex md:max-w-60'>

        <div className='group relative'>
            <label htmlFor="image">
                {image || user?.image ? <img src={image ? URL.createObjectURL(image) : user.image} alt={user?.name || 'Profile'} className='h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto object-cover'/> : <div className='flex h-9 w-9 md:h-14 md:w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white mx-auto'>{(user?.name || 'Profile').charAt(0).toUpperCase()}</div>}
                <input type="file" id='image' accept="image/*" hidden onChange={e=> setImage(e.target.files[0])}/>

                <div className='absolute hidden top-0 right-0 left-0 bottom-0 bg-black/10 rounded-full group-hover:flex items-center justify-center cursor-pointer'>
                    <img src={assets.edit_icon} alt="" />
                </div>
            </label>
        </div>
        {image && (
            <button className='absolute top-0 right-0 flex p-2 gap-1 bg-primary/10 text-primary cursor-pointer' onClick={updateImage}>Save <img src={assets.check_icon} width={13} alt="" /></button>
        )}
        <p className='mt-3 text-base font-semibold max-md:hidden'>{user?.name}</p>
      
      <div className='w-full'>
        {ownerMenuLinks.map((link, index)=>(
            <NavLink key={index} to={link.path} className={`relative mx-2 flex items-center gap-2 rounded-xl py-3 pl-3 first:mt-6 transition-colors ${link.path === location.pathname ? 'bg-primary/10 font-medium text-primary shadow-sm' : 'text-gray-600 hover:bg-light hover:text-primary'}`}>
                <img src={link.path === location.pathname ? link.coloredIcon : link.icon} alt="vehicle icon" />
                <span className='max-md:hidden'>{link.name}</span>
                <div className={`${link.path === location.pathname && 'bg-primary'} w-1.5 h-8 rounded-l right-0 absolute`}></div>
            </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
