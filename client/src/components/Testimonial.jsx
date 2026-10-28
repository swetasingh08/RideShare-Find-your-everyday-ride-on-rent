import React from 'react'
import Title from './Title'
import { assets } from '../assets/assets';
import { motion as Motion } from 'motion/react';

const Testimonial = () => {

    const testimonials = [
        { name: "Emma Rodriguez",
          location: "Barcelona, Spain",
          image: assets.testimonial_image_1,
          testimonial: "I've rented different vehicles through RideShare, and the experience was exceptional."
        },
        { name: "John Smith",
          location: "Bengaluru, India",
          image: assets.testimonial_image_2,
          testimonial: "RideShare made my trip so much easier. The vehicle was ready at pickup, and the service was fantastic!"
        },
        { name: "Ava Johnson",
          location: "Mumbai, India",
          image: assets.testimonial_image_1,
          testimonial: "I highly recommend RideShare! The selection is amazing and the service is excellent."
        }
    ];

  return (
    <div className="bg-light/60 px-6 py-28 md:px-16 lg:px-24 xl:px-44">

           <Title title="What Our Customers Say" subTitle="Discover why discerning travelers choose StayVenture for their luxury accommodations around the world."/>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-18">
                {testimonials.map((testimonial, index) => (
                    <Motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                    viewport={{ once: true, amount: 0.3 }}

                    key={index} className="rounded-2xl border border-borderColor bg-white p-6 shadow-[0_14px_40px_rgba(15,118,110,0.07)] hover:-translate-y-1 hover:shadow-lg transition-all duration-500">

                        <div className="flex items-center gap-3">
                            <img className="w-12 h-12 rounded-full" src={testimonial.image} alt={testimonial.name} />
                            <div>
                                <p className="text-xl">{testimonial.name}</p>
                                <p className="text-gray-500">{testimonial.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-4">
                            {Array(5).fill(0).map((_, index) => (
                                <img key={index} src={assets.star_icon} alt="star-icon" />
                            ))}
                        </div>
                        <p className="text-gray-500 max-w-90 mt-4 font-light">"{testimonial.testimonial}"</p>
                    </Motion.div>
                ))}
            </div>
        </div>
  )
}

export default Testimonial
