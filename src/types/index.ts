export type PetSize = 'small' | 'medium' | 'large'
export type ServiceType = 'grooming' | 'vet'

export type AppointmentStatus = 'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED'

export interface GroomingPackage {
  id: string
  name: string
  description: string
  prices: Record<PetSize, number>
  duration: string
  includes: string[]
}

export interface GroomingAddon {
  id: string
  name: string
  price: number
  description: string
}

export interface Unit {
  id: string
  name: string
  address: string
  phone: string
  hours: string
}

export interface Professional {
  id: string
  name: string
  role: string
  unitIds: string[]
}

export interface BookingData {
  serviceType: ServiceType
  package: string | null
  addons: string[]
  unitId: string | null
  professional: string | null
  petSize: PetSize | null
  petName: string
  petBreed: string
  tutorName: string
  phone: string
  email: string
  date: Date | null
  time: string | null
  notes: string
}

export interface AppointmentPayload extends Omit<BookingData, 'date'> {
  date: string        // ISO string
  totalPrice: number
  isVip?: boolean
}
