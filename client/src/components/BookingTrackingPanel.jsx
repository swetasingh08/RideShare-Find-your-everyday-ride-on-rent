import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import LocationMap from "./LocationMap";
import { useAuth } from "@clerk/clerk-react";
import { coordinatesFromPosition, geolocationOptions } from "../utils/coordinates";

const statusSteps = ["Booking placed", "Owner confirmation", "Vehicle handover", "Trip in progress"];
const distanceKm = (first, second) => {
    const toRadians = value => value * Math.PI / 180;
    const dLatitude = toRadians(second.latitude - first.latitude);
    const dLongitude = toRadians(second.longitude - first.longitude);
    const a = Math.sin(dLatitude / 2) ** 2 + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(dLongitude / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const BookingTrackingPanel = ({ booking, viewer }) => {
    const { axios } = useAppContext();
    const { getToken } = useAuth();
    const [tracking, setTracking] = useState(null);
    const [trackingMessage, setTrackingMessage] = useState('');
    const lastLocationSentAt = useRef(0);
    const lastLocationSent = useRef(null);
    const confirmed = booking.status === "confirmed";
    const activeStep = booking.status === "completed" ? 4 : booking.status === "active" ? 3 : confirmed ? 2 : 1;
    const isOwner = viewer === "owner";
    const participant = isOwner ? booking.user : booking.owner;

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        let fallbackInterval = null;
        const fetchTracking = async () => {
            try {
                const { data } = await axios.get(`/api/tracking/${booking._id}`);
                if (!active) return;
                setTracking(data.tracking);
                setTrackingMessage(data.message || '');
            } catch { if (active) setTrackingMessage('Tracking is temporarily unavailable') }
        };
        const startPollingFallback = () => {
            if (!active || fallbackInterval) return;
            fetchTracking();
            fallbackInterval = window.setInterval(fetchTracking, 10000);
        };
        const consumeStream = async () => {
            try {
                if (!['confirmed', 'active'].includes(booking.status)) return fetchTracking();
                const token = await getToken();
                if (!token || !window.fetch || !window.ReadableStream) return startPollingFallback();
                const baseUrl = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
                const response = await fetch(`${baseUrl}/api/tracking/${booking._id}/stream`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
                if (!response.ok || !response.body) throw new Error('Tracking stream unavailable');
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (active) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop() || '';
                    events.forEach(eventBlock => {
                        const dataLine = eventBlock.split('\n').find(line => line.startsWith('data:'));
                        if (!dataLine || !active) return;
                        try {
                            const data = JSON.parse(dataLine.slice(5).trim());
                            if (data.success) { setTracking(data.tracking); setTrackingMessage(data.message || ''); }
                            else setTrackingMessage(data.message || 'Tracking is temporarily unavailable');
                        } catch { setTrackingMessage('Tracking update could not be read'); }
                    });
                }
                if (active) startPollingFallback();
            } catch {
                if (active && !controller.signal.aborted) startPollingFallback();
            }
        };
        consumeStream();
        return () => { active = false; controller.abort(); if (fallbackInterval) window.clearInterval(fallbackInterval); };
    }, [axios, booking._id, booking.status, getToken]);

    useEffect(() => {
        if (!isOwner || booking.status !== 'active' || !navigator.geolocation) return undefined;
        let mounted = true;
        const watchId = navigator.geolocation.watchPosition(async position => {
            const coordinates = coordinatesFromPosition(position);
            if (!coordinates) return;
            const elapsed = Date.now() - lastLocationSentAt.current;
            const previous = lastLocationSent.current;
            const movedKm = previous ? distanceKm(previous, coordinates) : Infinity;
            if (elapsed < 15000 && movedKm < 0.02) return;
            try {
                await axios.post(`/api/tracking/${booking._id}/location`, { coordinates });
                lastLocationSentAt.current = Date.now();
                lastLocationSent.current = coordinates;
                if (mounted) setTrackingMessage('Live vehicle location is connected');
            } catch {
                if (mounted) setTrackingMessage('Live GPS is unavailable; showing the route preview');
            }
        }, () => {
            if (mounted) setTrackingMessage('Live GPS permission was not granted; showing the route preview');
        }, geolocationOptions);
        return () => { mounted = false; navigator.geolocation.clearWatch(watchId); };
    }, [axios, booking._id, booking.status, isOwner]);

    const current = tracking?.currentCoordinates;
    const destination = tracking?.destinationCoordinates;
    const route = tracking?.routeCoordinates?.length > 1 ? tracking.routeCoordinates.map(point => Array.isArray(point) ? [point[0], point[1]] : [point.latitude, point.longitude]) : current && destination ? [[current.latitude, current.longitude], [destination.latitude, destination.longitude]] : [];

    return (
        <section className="mt-5 overflow-hidden rounded-2xl border border-borderColor bg-white shadow-[0_14px_38px_rgba(15,118,110,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderColor px-5 py-4">
                <div>
                    <span className="section-kicker">Live journey</span><h3 className="mt-1 font-semibold text-gray-900">Trip tracking</h3>
                    <p className="mt-1 text-xs text-gray-500">{tracking?.isSimulated ? 'Route preview is active until the owner device shares GPS.' : 'Live location updates from the owner device.'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${confirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {confirmed ? "Ready for tracking" : "Waiting for confirmation"}
                </span>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_1fr]">
                <div className="relative min-h-64 overflow-hidden rounded-lg border border-primary/30 bg-[#eef7f4] p-2">
                    {current ? <LocationMap cars={[{ _id: booking.car?._id || booking._id, brand: booking.car?.brand || 'Vehicle', model: booking.car?.model || '', coordinates: current, distanceKm: tracking.distanceKm }]} userLocation={destination} userLabel="Trip destination" routeCoordinates={route} /> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full border-8 border-white bg-primary text-2xl text-white shadow-lg">+</div><p className="mt-3 font-medium text-gray-800">{trackingMessage || 'Tracking will appear when the trip starts'}</p><p className="mt-1 max-w-xs text-xs text-gray-500">The owner must start the trip before live GPS or the route preview becomes active.</p></div>}
                    <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-2 text-xs text-gray-600 shadow-sm">Last updated: {tracking?.lastUpdatedAt ? new Date(tracking.lastUpdatedAt).toLocaleTimeString() : 'waiting for location'}</div>
                </div>

                <div className="flex flex-col justify-between gap-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-light p-3"><p className="text-xs text-gray-500">Estimated arrival</p><p className="mt-1 font-semibold text-gray-900">{tracking ? `${tracking.etaMinutes} min` : '-- min'}</p></div>
                        <div className="rounded-lg bg-light p-3"><p className="text-xs text-gray-500">Distance away</p><p className="mt-1 font-semibold text-gray-900">{tracking ? `${tracking.distanceKm} km` : '-- km'}</p></div>
                    </div>
                    <div>
                        <p className="mb-3 text-sm font-medium text-gray-800">Trip progress</p>
                        <div className="space-y-3">
                            {statusSteps.map((step, index) => (
                                <div key={step} className="flex items-center gap-3 text-sm">
                                    <span className={`h-2.5 w-2.5 rounded-full ${index <= activeStep ? "bg-primary" : "bg-gray-200"}`} />
                                    <span className={index <= activeStep ? "text-gray-800" : "text-gray-400"}>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled className="rounded-lg border border-borderColor px-3 py-2 text-xs text-gray-400" title="Available when GPS is connected">Share trip</button>
                        {participant?.email ? <a href={`mailto:${participant.email}`} className="rounded-lg border border-primary px-3 py-2 text-xs text-primary hover:bg-primary/10">Message {isOwner ? "renter" : "owner"}</a> : <button type="button" disabled className="rounded-lg border border-borderColor px-3 py-2 text-xs text-gray-400">Contact unavailable</button>}
                        {participant?.phone && <a href={`tel:${participant.phone}`} className="rounded-lg border border-primary px-3 py-2 text-xs text-primary hover:bg-primary/10">Call</a>}
                        <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">Safety support</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingTrackingPanel;
