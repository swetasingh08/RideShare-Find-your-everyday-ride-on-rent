import React from 'react'

const Title = ({ title, subTitle, align }) => {
  return (
    <div className={`flex flex-col justify-center items-center text-center ${align === "left" && " md:items-start md:text-left"}`}>
      <span className='section-kicker mb-3'>RideShare experience</span>
      <h1 className='font-semibold tracking-tight text-4xl md:text-[42px]'>{title}</h1>
      <p className='mt-3 max-w-156 text-sm leading-7 text-gray-500/90 dark:text-gray-300 md:text-base'>{subTitle}</p>
    </div>
  )
}

export default Title
