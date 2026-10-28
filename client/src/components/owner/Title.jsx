import React from 'react'

const Title = ({ title, subTitle }) => {
  return (
    <>
      <span className='section-kicker mb-2'>Owner workspace</span>
      <h1 className='font-semibold tracking-tight text-3xl md:text-4xl'>{title}</h1>
      <p className='mt-3 max-w-156 text-sm leading-7 text-gray-500/90 dark:text-gray-300 md:text-base'>{subTitle}</p>
    </>
  )
}

export default Title
