import React from 'react'
import { Link } from 'react-router-dom'

const content = {
  help: {
    eyebrow: 'Support when you need it',
    title: 'Help Center',
    intro: 'Find quick answers about booking, payments, locations, vehicle handovers, and sharing your ride on RideShare.',
    sections: [
      { title: 'Booking a vehicle', body: 'Choose your dates, resolve the pickup and drop locations on the map, and submit a booking request. The vehicle owner must approve the request before the trip can become confirmed.' },
      { title: 'Payments and refunds', body: 'When online payment is enabled, the booking amount is paid securely during checkout. If an owner rejects a paid request or you cancel within the allowed period, the refund is initiated to the original payment method.' },
      { title: 'Locations and live tracking', body: 'Use the location search or your current location to set accurate pickup and drop points. Live tracking becomes available after the owner starts the trip and valid coordinates are connected.' },
      { title: 'Vehicle owners', body: 'List a car, bike, scooter, van, or another eligible vehicle with accurate details and documents. You can review booking requests, approve or reject them, coordinate handover, and respond to renter reviews.' },
    ],
    cta: 'Still need help? Email info@example.com and include your booking number so our support team can investigate quickly.',
  },
  terms: {
    eyebrow: 'The rules of the road',
    title: 'Terms of Service',
    intro: 'These terms explain how RideShare connects renters and vehicle owners and what each participant is responsible for.',
    sections: [
      { title: 'Using RideShare', body: 'You must provide accurate account, identity, contact, and payment information. Keep your credentials private and use the service only for lawful personal or business transportation needs.' },
      { title: 'Booking and owner approval', body: 'A booking request is not a confirmed rental until the vehicle owner approves it. A pending request may reserve the selected dates to prevent double booking. RideShare may cancel a request when a vehicle, account, payment, or safety requirement is not valid.' },
      { title: 'Payments, cancellations, and refunds', body: 'Prices, deposits, additional charges, cancellation rules, and refund timing are shown in the booking flow where applicable. Refunds are returned through the original payment provider and may take additional provider processing time.' },
      { title: 'Renter and owner responsibilities', body: 'Renters must meet eligibility requirements, use vehicles carefully, follow the rental rules, and return vehicles on time. Owners must provide accurate vehicle information, maintain a safe vehicle, disclose known issues, and honor approved bookings.' },
      { title: 'Reviews and communication', body: 'Reviews must describe a genuine completed trip and must not contain abusive, misleading, private, or unlawful content. RideShare may moderate content and suspend accounts that misuse the platform.' },
    ],
    cta: 'By using RideShare, you agree to follow these terms and any booking-specific rules shown before confirmation.',
  },
  privacy: {
    eyebrow: 'Your information, handled carefully',
    title: 'Privacy Policy',
    intro: 'This policy describes the information RideShare uses to provide safer bookings, accurate locations, payments, and support.',
    sections: [
      { title: 'Information we collect', body: 'We may collect your name, email, phone number, profile image, account identifiers, booking details, payment references, vehicle information, messages, reviews, and support requests.' },
      { title: 'Location information', body: 'With your permission, RideShare may use device location to find nearby vehicles, resolve pickup and drop points, calculate routes, and support live trip tracking. You can control device location permission in your browser or device settings.' },
      { title: 'How we use information', body: 'We use information to create accounts, process bookings and refunds, verify vehicles and users, prevent fraud and double bookings, send notifications, provide customer support, and improve the service.' },
      { title: 'Sharing and retention', body: 'Relevant booking details are shared with the renter or owner involved in that trip. Payment providers, identity services, hosting providers, and support vendors receive only the information needed to perform their services. We retain information for as long as necessary for these purposes and legal obligations.' },
      { title: 'Your choices', body: 'You may request access, correction, or deletion of eligible personal information and can opt out of optional communications. Some records must be retained to complete transactions, prevent abuse, or meet legal requirements.' },
    ],
    cta: 'For privacy questions or requests, contact info@example.com from the email address associated with your account.',
  },
  insurance: {
    eyebrow: 'Confidence for every journey',
    title: 'Insurance',
    intro: 'RideShare helps owners and renters understand the protection responsibilities connected with a shared vehicle booking.',
    sections: [
      { title: 'Vehicle and owner requirements', body: 'Owners must maintain legally required insurance, registration, permits, and safety documents for every listed vehicle. Vehicle information and document status must remain accurate throughout the listing.' },
      { title: 'Before the trip', body: 'Renters should review the vehicle condition, insurance information, rental rules, handover notes, and any required documents before starting the trip. Record visible damage with photos and notify the owner promptly.' },
      { title: 'During the trip', body: 'Coverage can depend on the vehicle, location, driver eligibility, policy terms, and the way the vehicle is used. Follow the approved booking, traffic laws, and vehicle restrictions. Commercial use, racing, intoxicated driving, and unauthorized drivers may not be covered.' },
      { title: 'Incidents and claims', body: 'In an accident, first contact emergency services when necessary, then notify the owner and RideShare support as soon as it is safe. Share accurate details, photographs, police or incident records, and other documents requested by the relevant insurer.' },
      { title: 'Important note', body: 'This page is a plain-language overview and does not replace an insurance policy, certificate, or local legal requirement. The applicable insurer and policy documents control coverage, deductibles, exclusions, and claim decisions.' },
    ],
    cta: 'Need help with an incident? Contact support immediately at info@example.com and include your booking number.',
  },
}

const ResourcePage = ({ type }) => {
  const page = content[type] || content.help

  return <main className='mx-auto w-full max-w-6xl px-5 pb-20 pt-12 md:px-10 lg:pt-16'>
    <div className='mx-auto max-w-3xl text-center'>
      <span className='section-kicker'>{page.eyebrow}</span>
      <h1 className='mt-3 text-4xl font-semibold tracking-tight md:text-5xl'>{page.title}</h1>
      <p className='mt-4 text-base leading-7 text-gray-500 md:text-lg'>{page.intro}</p>
      <p className='mt-3 text-xs text-gray-400'>Last updated October 27, 2026</p>
    </div>

    <div className='mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2'>
      {page.sections.map(section => <article key={section.title} className='surface-card rounded-2xl p-6'>
        <h2 className='text-lg font-semibold text-gray-800'>{section.title}</h2>
        <p className='mt-3 text-sm leading-7 text-gray-600'>{section.body}</p>
      </article>)}
    </div>

    <div className='mx-auto mt-8 flex max-w-4xl flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between'>
      <p className='max-w-2xl text-sm leading-6 text-gray-700'>{page.cta}</p>
      <Link to='/cars' className='inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dull'>Browse vehicles</Link>
    </div>
  </main>
}

export default ResourcePage
