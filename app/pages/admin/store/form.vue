<script lang="ts" setup>
import type {
  CellValueChangedEvent,
  GridApi,
  GridReadyEvent,
  RowSelectionOptions,
} from 'ag-grid-community'
import TimeCellEditor from '~~/components/bo/item/TimeCellEditor.vue'
import BrandList from '~/pages/admin/store/brand/popup.vue'
import type { Brand } from '~~/types/admin/brand'

enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

interface Category {
  id: number
  name: string
  parentId: number | null
  sortOrder: number
  isUse: boolean
  icon: string
}

interface StoreOperationHour {
  dayOfWeek: DayOfWeek
  dayOfWeekLabel: string
  openTime: string
  closeTime: string
  breakStart: string
  breakEnd: string
  isDayOff: boolean
}

const DayOfWeekLabel: Record<DayOfWeek, string> = {
  [DayOfWeek.MON]: '월',
  [DayOfWeek.TUE]: '화',
  [DayOfWeek.WED]: '수',
  [DayOfWeek.THU]: '목',
  [DayOfWeek.FRI]: '금',
  [DayOfWeek.SAT]: '토',
  [DayOfWeek.SUN]: '일',
}

const props = defineProps<{
  screenId: string
  screenName: string
}>()

const emits = defineEmits<{
  // vue3.3+ 부터 추가된 간결한 문법, typescript에서 named tuple 문법
  // tuple: 길이와 각 요소의 타입이 고정된 배열
  closeTab: [value: string]
}>()

// 전화번호 분리 입력
const phoneInput = reactive({ p1: '', p2: '', p3: '' })
const phone2Ref = ref<HTMLInputElement | null>(null)
const phone3Ref = ref<HTMLInputElement | null>(null)

const onPhone2Input = () => {
  if (phoneInput.p2.length >= 4) phone3Ref.value?.focus()
}

// 카테고리 목록
const categories = ref<Category[]>([])

const fetchCategories = async () => {
  const res = await customFetch<Category[]>('/store-service/category', {
    method: 'get',
  })
  categories.value = res.data ?? []
}

onMounted(fetchCategories)

const flattenedCategoryOptions = computed(() => {
  const result: { cat: Category; depth: number }[] = []
  const traverse = (parentId: number | null, depth: number) => {
    const children = categories.value.filter(
      (c) => c.parentId === parentId && c.isUse,
    )
    for (const child of children) {
      result.push({ cat: child, depth })
      traverse(child.id, depth + 1)
    }
  }
  traverse(null, 0)
  return result
})

const removeCategory = (id: number) => {
  form.categoryIds = form.categoryIds.filter((cId) => cId !== id)
}

// 폼 데이터
const form = reactive({
  name: '',
  postalCode: '',
  address: '',
  detailAddress: '',
  categoryIds: [] as number[],
  brandId: '',
  estimatedDeliveryTime: '',
  minOrderPrice: '',
  // storeOperationHour: [] as StoreOperationHour[],
})

// 유효성 검사 에러
const errors = reactive<Record<string, string>>({})

const validate = () => {
  if (!phoneInput.p1 || !phoneInput.p2 || !phoneInput.p3) {
    errors.phone = '전화번호를 입력해주세요.'
  }
  const rules: {
    key: Exclude<keyof typeof form, 'category'>
    label: string
  }[] = [
    { key: 'name', label: '가게명' },
    { key: 'postalCode', label: '우편번호' },
    { key: 'address', label: '주소' },
    { key: 'detailAddress', label: '상세주소' },
    // { key: 'brandId', label: '브랜드' },
    { key: 'estimatedDeliveryTime', label: '예상배달시간' },
    { key: 'minOrderPrice', label: '최소주문금액' },
  ]
  Object.keys(errors).forEach((k) => delete errors[k])
  rules.forEach(({ key, label }) => {
    if (!form[key]) errors[key] = `${label}을(를) 입력해주세요.`
  })
  if (form.categoryIds.length === 0)
    errors.category = '카테고리를 선택해주세요.'
  return Object.keys(errors).length === 0
}

const onRegister = async () => {
  if (!validate()) return
  const selectedBusinessHours = gridApi.value?.getSelectedRows() ?? []
  const phone = `${phoneInput.p1}${phoneInput.p2}${phoneInput.p3}`
  await customFetch('/store-service/store', {
    method: 'post',
    body: { ...form, phone, storeOperationHour: selectedBusinessHours },
  })
  showNotice.value = true
}

// Daum 주소검색 스크립트 로드
useHead({
  script: [
    {
      src: 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js',
    },
  ],
})

const showNotice = ref(false)
const showAddressPopup = ref(false)
const addressContainer = ref<HTMLElement | null>(null)

const searchAddress = async () => {
  showAddressPopup.value = true
  await nextTick()
  new (window as any).daum.Postcode({
    oncomplete: (data: {
      zonecode: string
      address: string
      addressType: string
      bname: string
      buildingName: string
    }) => {
      form.postalCode = data.zonecode
      let fullAddress = data.address
      if (data.addressType === 'R') {
        if (data.bname) fullAddress += ` (${data.bname})`
        if (data.buildingName) fullAddress += `, ${data.buildingName}`
      }
      form.address = fullAddress
      showAddressPopup.value = false
    },
    width: '100%',
    height: '100%',
  }).embed(addressContainer.value)
}

// 그리드 API
const gridApi = ref<GridApi | null>(null)

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
}

// 셀 수정 시 해당 로우 자동 체크
const onCellValueChanged = (params: CellValueChangedEvent) => {
  params.node.setSelected(true)
}

const timeFormatter = (params: { value: string }) => {
  const v = params.value
  if (!v) return v
  if (v.includes(':')) return v
  if (v.length >= 4) return `${v.slice(0, 2)}:${v.slice(2, 4)}`
  return v
}

const rowSelection = ref<RowSelectionOptions>({
  mode: 'multiRow',
  checkboxes: true,
  headerCheckbox: true,
  enableClickSelection: false,
})

const timeColBase = {
  editable: true,
  cellEditor: TimeCellEditor,
  cellEditorPopup: true,
  cellEditorPopupPosition: 'under' as const,
  valueFormatter: timeFormatter,
}

// 컬럼 속성 정의
const columns = ref([
  { headerName: '요일', field: 'dayOfWeekLabel' },
  { headerName: '오픈시간', field: 'openTime', ...timeColBase },
  { headerName: '마감시간', field: 'closeTime', ...timeColBase },
  { headerName: '휴게 시작시간', field: 'breakStart', ...timeColBase },
  { headerName: '휴게 종료시간', field: 'breakEnd', ...timeColBase },
  {
    headerName: '정기휴무일여부',
    field: 'isDayOff',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['Y', 'N'] },
  },
])

// 기본 컬럼 속성 (모든 컬럼에 공통 적용)
const defaultColDef = ref({
  sortable: true,
  filter: false,
  flex: 1,
})

// 그리드에 표시될 데이터 (시간은 "hhmm" 형식)
const storeOperationHour = ref<StoreOperationHour[]>([
  {
    dayOfWeek: DayOfWeek.MON,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.MON],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.TUE,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.TUE],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.WED,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.WED],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.THU,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.THU],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.FRI,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.FRI],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.SAT,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.SAT],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
  {
    dayOfWeek: DayOfWeek.SUN,
    dayOfWeekLabel: DayOfWeekLabel[DayOfWeek.SUN],
    openTime: '00:00',
    closeTime: '00:00',
    breakStart: '00:00',
    breakEnd: '00:00',
    isDayOff: false,
  },
])

function openBrandSearchPopup() {
  isBrandPopVisible.value = true
}

function closeBrandSearchPopup() {
  isBrandPopVisible.value = false
}

const isBrandPopVisible = ref(false)
const brand = ref<Brand | null>(null)

function setBrand(b: Brand) {
  brand.value = b
  form.brandId = brand.value.id
  closeBrandSearchPopup()
}

function close() {
  emits('closeTab', props.screenId)
}

definePageMeta({ layout: 'admin' })
</script>
<template>
  <BoItemScreenHeader
    v-if="props.screenName"
    :show-save="true"
    @save="onRegister"
    >{{ props.screenName }}</BoItemScreenHeader
  >
  <form class="flex flex-col gap-4">
    <!-- grid 영역 start -->
    <div class="grid grid-cols-2 gap-5 border-stone-300 p-2 border">
      <div class="flex flex-col">
        <div class="flex flex-row justify-center items-center">
          <label class="text-start basis-1/6 text-gray-700 mb-1" for="name"
            >가게명</label
          >
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="basis-5/6 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            :class="{ 'border-red-400': errors.name }"
            placeholder="가게명을 입력하세요"
          />
        </div>
        <p v-if="errors.name" class="text-red-500 text-xs mt-1 ml-[16.67%]">
          {{ errors.name }}
        </p>
      </div>
      <div class="flex flex-col">
        <div class="flex flex-row items-center">
          <label class="text-start basis-1/6 text-gray-700 mb-1" for="phone1"
            >전화번호</label
          >
          <div class="basis-5/6 flex items-center gap-1">
            <input
              id="phone1"
              v-model="phoneInput.p1"
              type="text"
              inputmode="numeric"
              maxlength="4"
              class="w-20 border rounded px-2 py-2 text-center focus:outline-none focus:ring focus:border-blue-300"
              :class="{ 'border-red-400': errors.phone }"
              placeholder="010"
            />
            <span class="text-gray-400">-</span>
            <input
              ref="phone2Ref"
              v-model="phoneInput.p2"
              type="text"
              inputmode="numeric"
              maxlength="4"
              class="w-20 border rounded px-2 py-2 text-center focus:outline-none focus:ring focus:border-blue-300"
              :class="{ 'border-red-400': errors.phone }"
              placeholder="0000"
              @input="onPhone2Input"
            />
            <span class="text-gray-400">-</span>
            <input
              ref="phone3Ref"
              v-model="phoneInput.p3"
              type="text"
              inputmode="numeric"
              maxlength="4"
              class="w-20 border rounded px-2 py-2 text-center focus:outline-none focus:ring focus:border-blue-300"
              :class="{ 'border-red-400': errors.phone }"
              placeholder="0000"
            />
          </div>
        </div>
        <p v-if="errors.phone" class="text-red-500 text-xs mt-1 ml-[16.67%]">
          {{ errors.phone }}
        </p>
      </div>
      <div class="flex flex-col">
        <div class="flex flex-row items-center">
          <label class="text-start basis-1/6 text-gray-700 mb-1" for="address"
            >주소</label
          >
          <span class="basis-5/6 flex flex-row items-center gap-5">
            <textarea
              id="address"
              v-model="form.address"
              class="basis-5/6 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              :class="{ 'border-red-400': errors.address }"
              rows="3"
              placeholder="주소를 입력하세요"
            ></textarea>
            <span class="basis-1/6">
              <input
                v-model="form.postalCode"
                class="border mb-3 px-3"
                :class="{ 'border-red-400': errors.postalCode }"
                readonly
                type="text"
                placeholder="우편번호"
              />
              <BoItemSearchButton
                variant="secondary"
                size="sm"
                @click="searchAddress"
                >주소 검색</BoItemSearchButton
              >
            </span>
          </span>
        </div>
        <p v-if="errors.address" class="text-red-500 text-xs mt-1 ml-[16.67%]">
          {{ errors.address }}
        </p>
        <p
          v-if="errors.postalCode"
          class="text-red-500 text-xs mt-1 ml-[16.67%]"
        >
          {{ errors.postalCode }}
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex flex-row items-center w-full">
          <label class="basis-1/6 text-gray-700 mb-1" for="address_detail"
            >상세주소</label
          >
          <textarea
            id="address_detail"
            v-model="form.detailAddress"
            class="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 basis-5/6"
            :class="{ 'border-red-400': errors.detailAddress }"
            rows="3"
            placeholder="상세주소를 입력하세요"
          ></textarea>
        </div>
        <p
          v-if="errors.detailAddress"
          class="text-red-500 text-xs mt-1 ml-[16.67%]"
        >
          {{ errors.detailAddress }}
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex flex-row items-start w-full">
          <label class="basis-1/6 text-gray-700 mt-2">카테고리</label>
          <div class="basis-5/6 relative">
            <HeadlessCombobox v-model="form.categoryIds" :multiple="true">
              <div class="relative">
                <div
                  class="border rounded px-3 py-2 min-h-[42px] flex flex-wrap gap-1 items-center pr-10"
                  :class="
                    errors.category ? 'border-red-400' : 'border-gray-300'
                  "
                >
                  <span
                    v-if="form.categoryIds.length === 0"
                    class="text-gray-400 text-sm"
                    >카테고리 선택...</span
                  >
                  <span
                    v-for="id in form.categoryIds"
                    :key="id"
                    class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full"
                  >
                    {{ categories.find((c) => c.id === id)?.name }}
                    <button
                      type="button"
                      class="hover:text-blue-900"
                      @click.stop="removeCategory(id)"
                    >
                      <Icon name="mdi:close" class="w-3 h-3" />
                    </button>
                  </span>
                </div>
                <HeadlessComboboxButton
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <Icon name="mdi:chevron-down" class="w-5 h-5" />
                </HeadlessComboboxButton>
              </div>
              <HeadlessComboboxOptions
                class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto"
              >
                <HeadlessComboboxOption
                  v-for="{ cat, depth } in flattenedCategoryOptions"
                  :key="cat.id"
                  :value="cat.id"
                  v-slot="{ active, selected }"
                >
                  <div
                    class="flex items-center gap-2 py-2 pr-4 text-sm cursor-pointer select-none"
                    :class="active ? 'bg-blue-50' : ''"
                    :style="{ paddingLeft: `${16 + depth * 16}px` }"
                  >
                    <Icon
                      :name="
                        selected
                          ? 'mdi:checkbox-marked'
                          : 'mdi:checkbox-blank-outline'
                      "
                      class="w-4 h-4 shrink-0"
                      :class="selected ? 'text-blue-600' : 'text-gray-400'"
                    />
                    <Icon
                      v-if="depth > 0"
                      name="mdi:subdirectory-arrow-right"
                      class="w-3 h-3 text-gray-400 shrink-0"
                    />
                    <span
                      :class="
                        selected
                          ? 'text-blue-700 font-semibold'
                          : 'text-gray-700'
                      "
                    >
                      {{ cat.name }}
                    </span>
                  </div>
                </HeadlessComboboxOption>
              </HeadlessComboboxOptions>
            </HeadlessCombobox>
          </div>
        </div>
        <p v-if="errors.category" class="text-red-500 text-xs mt-1 ml-[16.67%]">
          {{ errors.category }}
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex flex-row items-center w-full">
          <label class="basis-1/6 text-gray-700 mb-1" for="brand">브랜드</label>
          <span class="basis-5/6 flex flex-row items-center gap-5">
            <input
              id="brand"
              :value="brand?.name"
              type="text"
              readonly
              class="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 basis-5/6"
              :class="{ 'border-red-400': errors.brandId }"
            />
            <BoItemSearchButton
              variant="secondary"
              size="sm"
              @click="openBrandSearchPopup"
              >브랜드 검색</BoItemSearchButton
            >
          </span>
        </div>
        <p v-if="errors.brandId" class="text-red-500 text-xs mt-1 ml-[16.67%]">
          {{ errors.brandId }}
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex flex-row items-center w-full">
          <label class="basis-1/6 text-gray-700 mb-1" for="time"
            >예상배달시간 (분)</label
          >
          <input
            id="time"
            v-model="form.estimatedDeliveryTime"
            class="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 basis-5/6"
            :class="{ 'border-red-400': errors.estimatedDeliveryTime }"
          />
        </div>
        <p
          v-if="errors.estimatedDeliveryTime"
          class="text-red-500 text-xs mt-1 ml-[16.67%]"
        >
          {{ errors.estimatedDeliveryTime }}
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex flex-row items-center w-full">
          <label class="basis-1/6 text-gray-700 mb-1" for="price"
            >최소주문금액 (원)</label
          >
          <input
            id="price"
            v-model="form.minOrderPrice"
            class="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 basis-5/6"
            :class="{ 'border-red-400': errors.minOrderPrice }"
          />
        </div>
        <p
          v-if="errors.minOrderPrice"
          class="text-red-500 text-xs mt-1 ml-[16.67%]"
        >
          {{ errors.minOrderPrice }}
        </p>
      </div>
    </div>
    <!-- grid 영역 end -->
    <!-- 영업시간 테이블 영역 시작 -->
    <div class="flex items-center gap-2 mt-2">
      <Icon
        name="mdi:checkbox-blank-circle"
        class="w-2.5 h-2.5 text-slate-600"
      />
      <span class="font-bold text-slate-600">영업시간</span>
    </div>
    <div>
      <BoItemAgGrid
        class="mb-10 w-full"
        dom-layout="autoHeight"
        :column-defs="columns"
        :row-data="storeOperationHour"
        :default-col-def="defaultColDef"
        :row-selection="rowSelection"
        :stop-editing-when-cells-lose-focus="true"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
      ></BoItemAgGrid>
    </div>
    <!-- 영업시간 테이블 영역 끝 -->
  </form>

  <BoItemAlertNotice
    v-model="showNotice"
    message="등록이 완료되었습니다."
    @confirm="close"
  />

  <!-- 브랜드 검색 팝업 -->
  <BoItemLayerPopup v-model="isBrandPopVisible">
    <template #title>
      <BoItemScreenHeader>브랜드 검색</BoItemScreenHeader>
    </template>
    <template #default>
      <BrandList @set-brand="setBrand"></BrandList>
    </template>
  </BoItemLayerPopup>
  <!-- 브랜드 검색 팝업 -->

  <!-- 주소 검색 팝업 -->
  <Teleport to="body">
    <div
      v-if="showAddressPopup"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showAddressPopup = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl flex flex-col overflow-hidden w-[500px]"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b">
          <span class="font-semibold text-gray-700">주소 검색</span>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 text-xl leading-none"
            @click="showAddressPopup = false"
          >
            ✕
          </button>
        </div>
        <div ref="addressContainer" class="w-full h-[480px]"></div>
      </div>
    </div>
  </Teleport>
</template>
