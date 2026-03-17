import { useState } from 'react';
import { Search, MapPin, Navigation, Clock, CreditCard, ChevronRight, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function RideBooking() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [searching, setSearching] = useState(false);
  const [rideOptions, setRideOptions] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'confirmed'>('idle');

  const handleSearch = async () => {
    if (!pickup || !destination) return;
    setSearching(true);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find ride options between "${pickup}" and "${destination}". Provide 3 options (UberX, UberXL, UberBlack) with estimated prices and times. Format as JSON array of objects: { type, price, time, description }.`,
        config: {
          tools: [{ googleMaps: {} }],
          // responseMimeType: "application/json" // Not allowed with googleMaps tool
        },
      });

      // Since we can't use responseMimeType with googleMaps, we parse the text
      const text = response.text || '';
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        setRideOptions(JSON.parse(jsonMatch[0]));
      } else {
        // Fallback dummy data if parsing fails
        setRideOptions([
          { type: 'UberX', price: 15.50, time: '5 min', description: 'Affordable, everyday rides' },
          { type: 'UberXL', price: 22.80, time: '8 min', description: 'Extra space for groups' },
          { type: 'UberBlack', price: 35.00, time: '4 min', description: 'Premium rides with top-rated drivers' },
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback
      setRideOptions([
        { type: 'UberX', price: 15.50, time: '5 min', description: 'Affordable, everyday rides' },
        { type: 'UberXL', price: 22.80, time: '8 min', description: 'Extra space for groups' },
        { type: 'UberBlack', price: 35.00, time: '4 min', description: 'Premium rides with top-rated drivers' },
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleBookRide = async () => {
    if (!selectedRide || !auth.currentUser) return;
    setBookingStatus('booking');
    
    try {
      const rideData = {
        riderId: auth.currentUser.uid,
        status: 'searching',
        pickup: { address: pickup },
        destination: { address: destination },
        price: rideOptions.find(r => r.type === selectedRide)?.price || 0,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'rides'), rideData);
      setBookingStatus('confirmed');
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Map Area (Placeholder) */}
      <div className="flex-1 bg-slate-200 relative min-h-[300px]">
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
          <Navigation className="w-12 h-12 animate-pulse" />
          <p className="font-medium">Map View (Grounding Active)</p>
        </div>
        
        {/* Search Overlay */}
        <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-96">
          <div className="bg-white rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400" />
              <input
                type="text"
                placeholder="Pickup location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-black" />
              <input
                type="text"
                placeholder="Where to?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !pickup || !destination}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              {searching ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Clock className="w-5 h-5" />
                </motion.div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search Rides
            </button>
          </div>
        </div>
      </div>

      {/* Ride Options Panel */}
      <div className="w-full md:w-[400px] bg-white border-l border-slate-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Choose a ride</h2>
          
          {rideOptions.length > 0 ? (
            <div className="space-y-3">
              {rideOptions.map((ride) => (
                <button
                  key={ride.type}
                  onClick={() => setSelectedRide(ride.type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    selectedRide === ride.type ? 'border-black bg-slate-50' : 'border-transparent bg-white hover:border-slate-100'
                  }`}
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Car className={`w-10 h-10 ${ride.type === 'UberBlack' ? 'text-black' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <p className="font-bold">{ride.type}</p>
                      <p className="font-bold">${ride.price.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-slate-500">{ride.time} away • {ride.description}</p>
                  </div>
                </button>
              ))}
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium">•••• 4242</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
                
                <button
                  onClick={handleBookRide}
                  disabled={!selectedRide || bookingStatus !== 'idle'}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg disabled:bg-slate-300 transition-all active:scale-[0.98]"
                >
                  {bookingStatus === 'idle' && `Book ${selectedRide || 'Ride'}`}
                  {bookingStatus === 'booking' && 'Requesting...'}
                  {bookingStatus === 'confirmed' && 'Ride Confirmed!'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Enter your trip details to see ride options</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
