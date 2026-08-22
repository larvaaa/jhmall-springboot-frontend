export interface StoreListItem {
  id: string
  name: string
  imageUrl: string | null
  phone: string
  brandName: string
  categoryNames: string
  minOrderPrice: number
  businessStatus: 'OPEN' | 'CLOSED' | 'PREPARING'
}

export interface StorePage {
  content: StoreListItem[]
  totalElements: number
  totalPages: number
  number: number
}

export interface StoreOperationHourDto {
  id: number
  store_id: number
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  openTime: string
  closeTime: string
  breakStart: string
  breakEnd: string
  isDayOff: boolean
}

export interface StoreDetail {
  id: number
  name: string
  brandId: number | null
  brandName: string | null
  postalCode: string
  address: string
  detailAddress: string
  phone: string
  minOrderPrice: number
  estimatedDeliveryTime: number
  businessStatus: 'OPEN' | 'CLOSED' | 'PREPARING'
  description: string | null
  isUse: boolean
  operationHours: StoreOperationHourDto[]
  categoryIds: number[]
}
