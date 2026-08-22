export interface MenuOptionDto {
  id?: number
  name: string
  extraPrice: number
  isUse: boolean
  sortOrder: number
}

export interface MenuOptionGroupDto {
  id?: number
  name: string
  isRequired: boolean
  isMultiSelectedEnabled: boolean
  sortOrder: number
  options: MenuOptionDto[]
}

export interface MenuListItem {
  id: number
  name: string
  price: number
  attachFileId: number | null
  isUse: boolean
  isSoldOut: boolean
  sortOrder: number
}

export interface MenuDetail {
  id: number
  storeId: number
  name: string
  description: string | null
  price: number
  attachFileId: number | null
  isUse: boolean
  isSoldOut: boolean
  sortOrder: number
  optionGroups: MenuOptionGroupDto[]
}

export interface MenuRegisterRequest {
  storeId: number
  name: string
  description: string | null
  price: number
  attachFileId: number | null
  isUse: boolean
  isSoldOut: boolean
  sortOrder: number
  optionGroups: MenuOptionGroupDto[]
}
