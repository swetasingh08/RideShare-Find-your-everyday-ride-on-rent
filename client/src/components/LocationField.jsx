import React from 'react'

const LocationField = ({ label, value, onChange, onSearch, onUseCurrent, onSelectSuggestion, suggestions = [], searching, locating, error, placeholder }) => (
  <div className='rounded-2xl border border-borderColor bg-white p-4 shadow-sm'>
    <label className='text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500'>{label}</label>
    <div className='mt-2 flex gap-2'>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className='min-w-0 flex-1 rounded-xl border border-borderColor bg-light/50 px-3 py-2.5 text-sm outline-none focus:border-primary' required />
      <button type='button' onClick={onSearch} disabled={searching || !value.trim()} className='rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50'>{searching ? 'Searching...' : 'Find'}</button>
    </div>
    <p className='mt-2 text-[11px] text-gray-500'>Enter house number, society/building, street, locality, city, and PIN for the most accurate pin.</p>
    {suggestions.length > 0 && <div className='mt-3 space-y-2' role='listbox' aria-label={`${label} search results`}>
      <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>Choose the exact result</p>
      {suggestions.map((suggestion, index) => <button type='button' key={`${suggestion.latitude}-${suggestion.longitude}-${index}`} onClick={() => onSelectSuggestion?.(suggestion)} className='block w-full rounded-xl border border-borderColor bg-light/60 px-3 py-2 text-left text-xs hover:border-primary hover:bg-primary/5'>
        <span className='block font-medium text-gray-800'>{suggestion.displayName}</span>
        <span className='mt-1 block text-[10px] text-gray-500'>{Number(suggestion.latitude).toFixed(6)}, {Number(suggestion.longitude).toFixed(6)}</span>
      </button>)}
    </div>}
    <div className='mt-2 flex flex-wrap gap-3'>
      <button type='button' onClick={onUseCurrent} disabled={locating} className='text-xs font-medium text-primary disabled:opacity-50'>{locating ? 'Locating...' : 'Use my current location'}</button>
      {error && <span className='text-xs text-red-600'>{error}</span>}
    </div>
  </div>
)

export default LocationField
