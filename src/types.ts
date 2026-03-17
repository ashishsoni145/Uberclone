export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'rider' | 'driver';
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  status: 'searching' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  pickup: Location;
  destination: Location;
  price: number;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
