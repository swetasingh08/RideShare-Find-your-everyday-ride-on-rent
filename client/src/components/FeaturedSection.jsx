import React from 'react'
import Title from './Title'
import { assets } from '../assets/assets'
import CarCard from './CarCard'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { motion as Motion } from 'motion/react'

const FeaturedSection = () => {

    const navigate = useNavigate()
    const {cars} = useAppContext()

  return (
    <Motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1, ease: "easeOut" }}
    className='flex flex-col items-center bg-white/40 px-6 py-24 md:px-16 lg:px-24 xl:px-32 dark:bg-slate-950/20'>

        <Motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        >
            <Title title='Featured Vehicles' subTitle='Explore our selection of premium vehicles available for your next adventure.'/>
        </Motion.div>

        <Motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className='mt-16 grid w-full max-w-6xl grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3'>
        {
            cars.slice(0,6).map((car)=> (
                <Motion.div key={car._id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut"  }}
                >
                    <CarCard car={car}/>
                </Motion.div>
            ))
        }
        </Motion.div>

        <Motion.button
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        onClick={()=> {
            navigate('/cars'); scrollTo(0,0)
        }}
         className='mt-16 flex items-center justify-center gap-2 rounded-xl border border-borderColor bg-white/70 px-6 py-3 font-medium hover:-translate-y-0.5 hover:border-primary hover:bg-light cursor-pointer'>
            Explore all vehicles <img src={assets.arrow_icon} alt="arrow" />
        </Motion.button>

    </Motion.div>
  )
}

export default FeaturedSection
