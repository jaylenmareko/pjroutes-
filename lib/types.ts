export type JetSize = 'light' | 'midsize' | 'super_midsize' | 'heavy'
export type FlightStatus = 'pending' | 'published' | 'booked'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentMethod = 'card' | 'ach'

export interface Flight {
  id: string
  from_city: string
  from_airport: string
  from_state: string
  to_city: string
  to_airport: string
  to_state: string
  depart_start: string
  depart_end: string
  price: number
  seats: number
  aircraft_type: string
  aircraft_tail: string
  jet_size: JetSize
  has_wifi: boolean
  pets_allowed: boolean
  standup_cabin: boolean
  photos: string[]
  operator_name: string
  operator_email: string
  operator_phone: string
  status: FlightStatus
  created_at: string
}

export interface Booking {
  id: string
  flight_id: string
  passenger_name: string
  passenger_email: string
  passenger_phone: string
  passengers: number
  payment_intent_id: string
  payment_method: PaymentMethod
  amount: number
  status: BookingStatus
  created_at: string
}

export interface RouteAlert {
  id: string
  email: string
  from_city: string
  to_city: string
  created_at: string
}
