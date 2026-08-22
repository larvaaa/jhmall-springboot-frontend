<script lang="ts" setup>
import type {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community'
import type { Screen } from '~~/utils/admin-menu-type'
import type { StoreListItem, StorePage } from '~~/types/admin/store'

interface Category {
  id: number
  name: string
}

const props = defineProps<{
  screenId: string
  screenName: string
}>()

const emits = defineEmits<{
  (e: 'openTab', value: Screen): void
  (e: 'closeTab', value: string): void
}>()

// 검색 조건
const searchType = ref<'STORE_NAME' | 'PHONE' | 'BRAND_NAME'>('STORE_NAME')
const searchKeyword = ref('')
const selectedCategories = ref<number[]>([])
const searchBusinessStatus = ref('')
const isCategoryDropdownOpen = ref(false)

// 카테고리 목록
const categories = ref<Category[]>([])

const fetchCategories = async () => {
  const res = await customFetch<ApiResponse<Category[]>>(
    '/store-service/category',
    {
      method: 'get',
    },
  )
  categories.value = res.data ?? []
}

// 그리드 데이터
const rowData = ref<StoreListItem[]>([])
const totalElements = ref(0)

// 그리드 페이지네이션
const gridApi = ref<GridApi | null>(null)
const pageSize = ref(10)
const currentPage = ref(0)
const totalPages = ref(1)

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
}

const onPaginationChanged = () => {
  if (!gridApi.value) return
  currentPage.value = gridApi.value.paginationGetCurrentPage()
  totalPages.value = gridApi.value.paginationGetTotalPages()
}

const onPageChange = (p: number) => {
  gridApi.value?.paginationGoToPage(p)
}

const onPageSizeChange = (size: number) => {
  pageSize.value = size
  gridApi.value?.paginationSetPageSize(size)
}

// 가게 상세 탭
const SCREEN_DETAIL_PATH = '/admin/store/detail'
const SCREEN_DETAIL_NAME = '가게 상세'
const SCREEN_DETAIL_ID = '20'

const openDetail = (item: StoreListItem) => {
  const screen: Screen = {
    path: SCREEN_DETAIL_PATH,
    name: SCREEN_DETAIL_NAME,
    id: SCREEN_DETAIL_ID,
    params: {
      storeId: String(item.id),
    },
  }
  emits('closeTab', SCREEN_DETAIL_ID)
  emits('openTab', screen)
}

const onCellClicked = (event: CellClickedEvent<StoreListItem>) => {
  if (event.colDef.field === 'name' && event.data) {
    openDetail(event.data)
  }
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  OPEN: {
    label: '영업중',
    bg: 'rgba(0,80,203,0.1)',
    text: '#0050cb',
    dot: '#0050cb',
  },
  PREPARING: {
    label: '준비중',
    bg: 'rgba(245,158,11,0.1)',
    text: '#d97706',
    dot: '#d97706',
  },
  CLOSED: {
    label: '영업종료',
    bg: 'rgba(186,26,26,0.1)',
    text: '#ba1a1a',
    dot: '#ba1a1a',
  },
}

const columnDefs: ColDef<StoreListItem>[] = [
  {
    headerName: '번호',
    valueGetter: (params) => params.node!.rowIndex + 1,
    width: 80,
    cellStyle: { color: '#727687', fontSize: '13px', textAlign: 'center' },
  },
  {
    headerName: '가게명',
    field: 'name',
    flex: 2,
    minWidth: 200,
    cellRenderer: (params: any) => {
      const imageUrl = params.data?.imageUrl
      const name = params.value ?? ''
      const img = imageUrl
        ? `<img src="${imageUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;" />`
        : `<span style="font-size:18px;color:#727687;">🏪</span>`
      return `
        <div style="display:flex;align-items:center;gap:12px;height:100%;cursor:pointer;">
          <div style="width:44px;height:44px;border-radius:6px;border:1px solid #c2c6d8;background:#e6e7f4;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;">
            ${img}
          </div>
          <span style="font-size:13px;font-weight:600;color:#0050cb;text-decoration:underline;text-decoration-color:transparent;">${name}</span>
        </div>`
    },
  },
  {
    headerName: '전화번호',
    field: 'phone',
    width: 150,
    cellStyle: { fontSize: '13px', color: '#424656' },
  },
  {
    headerName: '브랜드',
    field: 'brandName',
    flex: 1,
    minWidth: 120,
    cellStyle: { fontSize: '13px', color: '#424656' },
  },
  {
    headerName: '카테고리',
    field: 'categoryNames',
    flex: 1,
    minWidth: 100,
    cellStyle: { fontSize: '13px', color: '#424656' },
  },
  {
    headerName: '최소주문금액',
    field: 'minOrderPrice',
    flex: 1,
    minWidth: 130,
    valueFormatter: (params: ValueFormatterParams) =>
      params.value != null ? params.value.toLocaleString() + '원' : '-',
    cellStyle: { fontSize: '13px', color: '#424656' },
  },
  {
    headerName: '상태',
    field: 'businessStatus',
    width: 120,
    cellRenderer: (params: any) => {
      const cfg = statusConfig[params.value]
      if (!cfg) return params.value ?? '-'
      return `
        <div style="display:flex;align-items:center;height:100%;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:9999px;background:${cfg.bg};color:${cfg.text};font-size:11px;font-weight:600;">
            <span style="width:6px;height:6px;border-radius:50%;background:${cfg.dot};flex-shrink:0;"></span>
            ${cfg.label}
          </span>
        </div>`
    },
  },
]

const defaultColDef: ColDef = {
  sortable: true,
  filter: false,
  resizable: true,
}

const fetchStores = async () => {
  const params: Record<string, unknown> = {
    searchType: searchType.value,
  }
  if (searchKeyword.value.trim())
    params.searchKeyword = searchKeyword.value.trim()
  if (selectedCategories.value.length > 0)
    params.categoryIds = selectedCategories.value.join(',')
  if (searchBusinessStatus.value)
    params.businessStatus = searchBusinessStatus.value

  const res = await customFetch<ApiResponse<StorePage>>(
    '/store-service/store',
    {
      method: 'get',
      params,
    },
  )
  const data = res.data
  if (data && !Array.isArray(data) && 'content' in data) {
    rowData.value = data.content
    totalElements.value = data.totalElements
  } else {
    rowData.value = (data as StoreListItem[]) ?? []
    totalElements.value = rowData.value.length
  }
}

const onSearch = async () => {
  await fetchStores()
  isCategoryDropdownOpen.value = false
}

const onReset = () => {
  searchType.value = 'STORE_NAME'
  searchKeyword.value = ''
  selectedCategories.value = []
  searchBusinessStatus.value = ''
  fetchStores()
}

const toggleCategory = (id: number) => {
  const idx = selectedCategories.value.indexOf(id)
  if (idx === -1) selectedCategories.value.push(id)
  else selectedCategories.value.splice(idx, 1)
}

const categoryLabel = computed(() => {
  if (selectedCategories.value.length === 0) return '전체 카테고리 (다중 선택)'
  const names = categories.value
    .filter((c) => selectedCategories.value.includes(c.id))
    .map((c) => c.name)
  return names.join(', ')
})

onMounted(async () => {
  await fetchCategories()
  await fetchStores()
})

definePageMeta({ layout: 'admin' })
</script>

<template>
  <!-- 페이지 헤더 -->
  <BoItemScreenHeader
    v-if="props.screenName"
    :show-search="true"
    :show-reset="true"
    @search="onSearch"
    @reset="onReset"
    >{{ props.screenName }}</BoItemScreenHeader
  >

  <!-- 검색 필터 -->
  <div class="bg-white border border-[#c2c6d8] rounded-xl shadow-sm p-5 mb-4">
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 items-end gap-4">
      <!-- 검색 -->
      <div class="flex flex-col gap-1.5 lg:col-span-2">
        <label class="text-xs font-semibold text-[#424656]">검색</label>
        <div class="flex gap-2">
          <select
            v-model="searchType"
            class="w-[130px] h-10 px-3 rounded-lg border border-[#c2c6d8] text-sm text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] bg-white"
          >
            <option value="STORE_NAME">가게명</option>
            <option value="PHONE">전화번호</option>
            <option value="BRAND_NAME">브랜드명</option>
          </select>
          <div class="relative flex-1">
            <Icon
              name="mdi:magnify"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727687]"
            />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="검색어를 입력하세요..."
              class="w-full h-10 pl-9 pr-3 rounded-lg border border-[#c2c6d8] text-sm focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] transition-all"
              @keyup.enter="onSearch"
            />
          </div>
        </div>
      </div>

      <!-- 카테고리 (다중 선택) -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[#424656]">카테고리</label>
        <div class="relative">
          <button
            type="button"
            class="w-full h-10 px-3 rounded-lg border border-[#c2c6d8] text-sm text-[#191b24] flex items-center justify-between bg-white hover:border-[#0050cb] transition-colors"
            @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
          >
            <span class="truncate text-left">{{ categoryLabel }}</span>
            <Icon
              name="mdi:chevron-down"
              class="w-4 h-4 text-[#727687] flex-shrink-0 ml-1"
            />
          </button>
          <div
            v-if="isCategoryDropdownOpen"
            class="absolute z-20 mt-1 w-full bg-white border border-[#c2c6d8] rounded-lg shadow-lg"
          >
            <div class="p-2 space-y-0.5">
              <label
                v-for="cat in categories"
                :key="cat.id"
                class="flex items-center gap-2 px-2 py-1.5 hover:bg-[#f2f3ff] rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="selectedCategories.includes(cat.id)"
                  class="rounded border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]"
                  @change="toggleCategory(cat.id)"
                />
                <span class="text-sm text-[#191b24]">{{ cat.name }}</span>
              </label>
              <p
                v-if="categories.length === 0"
                class="text-xs text-[#727687] px-2 py-1"
              >
                카테고리 없음
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 영업 상태 -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[#424656]">영업 상태</label>
        <select
          v-model="searchBusinessStatus"
          class="h-10 px-3 rounded-lg border border-[#c2c6d8] text-sm text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] bg-white"
        >
          <option value="">전체 상태</option>
          <option value="OPEN">영업중</option>
          <option value="PREPARING">준비중</option>
          <option value="CLOSED">영업종료</option>
        </select>
      </div>

      <!-- 버튼 -->
      <!-- <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 h-10 rounded-lg bg-[#0066ff] hover:bg-[#0050cb] text-white text-xs font-semibold transition-all"
          @click="onSearch"
        >
          조회
        </button>
        <button
          type="button"
          class="flex-1 h-10 rounded-lg border border-[#c2c6d8] text-[#5c5f61] text-xs font-semibold hover:bg-[#ecedfa] transition-all"
          @click="onReset"
        >
          초기화
        </button>
      </div> -->
    </div>
  </div>

  <!-- AG Grid 테이블 -->
  <div
    class="bg-white border border-[#c2c6d8] rounded-xl shadow-sm overflow-hidden"
  >
    <BoItemAgGrid
      class="store-grid"
      :column-defs="columnDefs"
      :row-data="rowData"
      :default-col-def="defaultColDef"
      :row-height="72"
      :pagination="true"
      :pagination-page-size="pageSize"
      style="width: 100%; height: 560px"
      @grid-ready="onGridReady"
      @pagination-changed="onPaginationChanged"
      @cell-clicked="onCellClicked"
    />
    <BoItemPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :page-size="pageSize"
      :page-size-options="[10, 30, 50]"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    />
  </div>
</template>

<style scoped>
.store-grid :deep(.ag-paging-panel) {
  display: none;
}
</style>
