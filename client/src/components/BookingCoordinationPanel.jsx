import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const BookingCoordinationPanel = ({ booking, viewer, axios }) => {
    const isOwner = viewer === "owner";
    const participant = isOwner ? booking.user : booking.owner;
    const [note, setNote] = useState(isOwner ? booking.ownerNote || "" : booking.renterNote || "");
    const [ready, setReady] = useState(isOwner ? Boolean(booking.ownerReady) : Boolean(booking.renterReady));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNote(isOwner ? booking.ownerNote || "" : booking.renterNote || "");
        setReady(isOwner ? Boolean(booking.ownerReady) : Boolean(booking.renterReady));
    }, [booking, isOwner]);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await axios.post('/api/bookings/coordination', { bookingId: booking._id, note, ready });
            data.success ? toast.success(data.message) : toast.error(data.message);
        } catch (error) { toast.error(error.response?.data?.message || error.message); }
        finally { setSaving(false); }
    };

    return <section className="mt-5 rounded-2xl border border-borderColor bg-white p-5 shadow-[0_14px_38px_rgba(15,118,110,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><span className="section-kicker">Trip details</span><h3 className="mt-1 font-semibold text-gray-900">Handover coordination</h3><p className="mt-1 text-xs text-gray-500">Keep pickup details clear for both sides.</p></div>
            {booking.status === 'confirmed' && <div className="rounded-lg bg-accent/10 px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-wide text-gray-500">Handover code</p><p className="font-bold tracking-[0.25em] text-accent">{booking.handoverCode || '------'}</p></div>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-light p-3"><p className="text-xs text-gray-500">Pickup point</p><p className="mt-1 text-sm font-medium text-gray-800">{booking.pickupLocation || booking.car?.pickupAddress || booking.car?.location || 'Pickup details pending'}</p><p className="mt-1 text-xs text-gray-500">{booking.pickupCoordinates ? `${Number(booking.pickupCoordinates.latitude).toFixed(5)}, ${Number(booking.pickupCoordinates.longitude).toFixed(5)}` : 'Coordinates pending'}</p></div>
            <div className="rounded-lg bg-light p-3"><p className="text-xs text-gray-500">Drop point</p><p className="mt-1 text-sm font-medium text-gray-800">{booking.dropLocation || 'Drop details pending'}</p><p className="mt-1 text-xs text-gray-500">{booking.dropCoordinates ? `${Number(booking.dropCoordinates.latitude).toFixed(5)}, ${Number(booking.dropCoordinates.longitude).toFixed(5)}` : 'Coordinates pending'}</p></div>
            <div className="rounded-lg bg-light p-3">
                <p className="text-xs text-gray-500">{isOwner ? 'Renter contact' : 'Vehicle owner contact'}</p>
                <div className="mt-2 flex items-center gap-3">
                    {participant?.image ? <img src={participant.image} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{(participant?.name || (isOwner ? 'R' : 'O')).charAt(0).toUpperCase()}</div>}
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{participant?.name || (isOwner ? 'Renter' : 'Vehicle owner')}</p><p className="truncate text-xs text-gray-500">{participant?.email || 'Email unavailable'}</p>{participant?.phone && <p className="text-xs text-gray-500">{participant.phone}</p>}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {participant?.phone ? <a href={`tel:${participant.phone}`} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dull">Call</a> : <span className="rounded-md border border-borderColor px-3 py-1.5 text-xs text-gray-400">Phone not added</span>}
                    {participant?.email ? <a href={`mailto:${participant.email}`} className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">Message</a> : <span className="rounded-md border border-borderColor px-3 py-1.5 text-xs text-gray-400">Message unavailable</span>}
                </div>
            </div>
        </div>
        {(booking.routeDistanceKm > 0 || booking.routeDurationMinutes > 0) && <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs text-gray-600">Planned route: <span className="font-semibold text-gray-800">{booking.routeDistanceKm} km</span> · <span className="font-semibold text-gray-800">{booking.routeDurationMinutes} min estimated travel time</span></div>}
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder={isOwner ? 'Add pickup instructions, parking details, or documents required...' : 'Tell the owner your arrival time or special pickup needs...'} className="mt-4 w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={ready} onChange={(event) => setReady(event.target.checked)} /> I am ready for handover</label><button type="button" disabled={saving} onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save details'}</button></div>
    </section>;
};

export default BookingCoordinationPanel;
