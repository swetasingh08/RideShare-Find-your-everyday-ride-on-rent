import React from 'react'
import { Link } from 'react-router-dom'

const team = [
  'Sweta Singh',
  'Tanya Khatter',
  'Shreya Tripathi',
  'Ujala Saroj',
  'Srashti Rathore',
]

const AboutUs = () => {
  return (
    <main className='mx-auto w-full max-w-6xl px-5 pb-20 pt-12 md:px-10 lg:pt-16'>
      <section className='relative overflow-hidden rounded-3xl border border-borderColor bg-primary px-6 py-12 text-center text-white shadow-[0_20px_60px_rgba(15,118,110,0.18)] md:px-12 md:py-16'>
        <div className='pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl' />
        <span className='relative text-xs font-bold uppercase tracking-[0.2em] text-white/80'>The team behind RideShare</span>
        <h1 className='relative mt-4 text-4xl font-semibold tracking-tight md:text-6xl'>Built with purpose, shared with pride.</h1>
        <p className='relative mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg'>
          RideShare is our B.Tech 4th-year mini-project prototype, created to explore how technology can make vehicle discovery, rental coordination, and everyday travel simpler.
        </p>
      </section>

      <section className='mt-14 grid gap-5 md:grid-cols-3'>
        <article className='surface-card rounded-2xl p-6 md:col-span-2'>
          <span className='section-kicker'>Our project</span>
          <h2 className='mt-3 text-2xl font-semibold text-gray-800'>A practical idea for connected mobility</h2>
          <p className='mt-4 text-sm leading-7 text-gray-600'>
            RideShare is designed as a peer-to-peer vehicle rental experience where renters can discover suitable rides and owners can manage listings, availability, booking requests, handovers, and trip activity from one place.
          </p>
          <p className='mt-3 text-sm leading-7 text-gray-600'>
            As a prototype, the project brings together user experience design, secure account flows, location-aware discovery, booking logic, payment integration, and helpful rental assistance in one academic application.
          </p>
        </article>
        <article className='rounded-2xl border border-accent/20 bg-accent/10 p-6'>
          <span className='text-xs font-bold uppercase tracking-[0.16em] text-accent'>Our focus</span>
          <h2 className='mt-3 text-2xl font-semibold text-gray-800'>Learn. Build. Improve.</h2>
          <p className='mt-4 text-sm leading-7 text-gray-600'>
            We are learning how thoughtful design and reliable engineering can work together to solve a real-world mobility problem.
          </p>
        </article>
      </section>

      <section className='mt-14'>
        <div className='text-center'>
          <span className='section-kicker'>Our team</span>
          <h2 className='mt-3 text-3xl font-semibold tracking-tight text-gray-800'>Meet the five minds behind the prototype</h2>
          <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-500'>
            We are B.Tech 4th-year students at Maharana Institute of Professional Studies, working together as a project team.
          </p>
        </div>

        <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          {team.map((name) => (
            <article key={name} className='surface-card rounded-2xl p-5 text-center transition-transform hover:-translate-y-1'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-white shadow-lg shadow-primary/15'>
                {name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </div>
              <h3 className='mt-4 font-semibold text-gray-800'>{name}</h3>
              <p className='mt-1 text-xs leading-5 text-gray-500'>B.Tech 4th Year<br />Project Team</p>
            </article>
          ))}
        </div>
      </section>

      <section className='mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center md:p-8'>
        <h2 className='text-2xl font-semibold text-gray-800'>Thank you for exploring our work</h2>
        <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600'>
          This prototype represents our curiosity, teamwork, and effort to turn a mobility idea into a useful digital experience. We welcome feedback as we continue learning and improving.
        </p>
        <Link to='/cars' className='mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dull'>Explore vehicles</Link>
      </section>
    </main>
  )
}

export default AboutUs
