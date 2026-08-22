<script lang="ts" setup>
import type { Screen } from '~~/utils/admin-menu-type'
import type { Brand } from '~~/types/admin/brand'

interface BrandPage {
  content: Brand[]
  totalPages: number
  number: number
}

const props = defineProps<{
  screenId: string
  screenName: string
}>()

const emits = defineEmits<{
  setScreen: [value: Brand]
  openTab: [value: Screen]
  closeTab: [value: string]
}>()

const page = ref(0)
const size = 10

const brands = ref<Brand[]>([])
const totalPages = ref(1)
const currentPage = ref(0)

const searchName = ref('')
const searchIsUse = ref<'' | 'true' | 'false'>('')

const fetchBrands = async () => {
  const params: Record<string, unknown> = { page: page.value, size }
  if (searchName.value.trim()) params.name = searchName.value.trim()
  if (searchIsUse.value !== '') params.isUse = searchIsUse.value

  const res = await customFetch<ApiResponse<BrandPage>>(
    '/store-service/brand',
    {
      method: 'get',
      params,
    },
  )
  const data = res.data
  if (data && !Array.isArray(data) && 'content' in data) {
    brands.value = data.content
    totalPages.value = data.totalPages
    currentPage.value = data.number
  } else {
    brands.value = (data as Brand[]) ?? []
    totalPages.value = 1
    currentPage.value = 0
  }
}

onMounted(fetchBrands)

const onSearch = async () => {
  page.value = 0
  await fetchBrands()
}

const onPageChange = async (p: number) => {
  page.value = p
  await fetchBrands()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

const SCREEN_FORM_PATH = '/admin/store/brand/form'
const SCREEN_FORM_NAME = '브랜드 수정'
const SCREEN_FORM_ID = '18'

const handleModBtn = (item: Brand) => {
  const screen: Screen = {
    path: SCREEN_FORM_PATH,
    name: SCREEN_FORM_NAME,
    id: SCREEN_FORM_ID,
    params: {
      brandId: item.id!,
    },
  }
  emits('closeTab', SCREEN_FORM_ID)
  emits('openTab', screen)
}

definePageMeta({ layout: 'admin' })
</script>

<template>
  <!-- 페이지 헤더 -->
  <BoItemScreenHeader
    v-if="props.screenName"
    :show-search="true"
    @search="onSearch"
    >{{ props.screenName }}</BoItemScreenHeader
  >

  <!-- 검색 조건 -->
  <div class="bg-white border border-[#c2c6d8] rounded-xl shadow-sm p-5 mb-4">
    <div class="flex flex-wrap items-end gap-4">
      <!-- 브랜드명 -->
      <div class="flex flex-col gap-1.5 min-w-[200px]">
        <label class="text-xs font-semibold text-[#191b24]">브랜드명</label>
        <input
          v-model="searchName"
          type="text"
          placeholder="브랜드명 입력"
          class="h-10 px-4 rounded-lg border border-[#c2c6d8] text-sm focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] transition-all"
          @keyup.enter="onSearch"
        />
      </div>

      <!-- 상태 -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[#191b24]">상태</label>
        <select
          v-model="searchIsUse"
          class="h-10 px-3 rounded-lg border border-[#c2c6d8] text-sm text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] transition-all bg-white"
        >
          <option value="">전체</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 데이터 테이블 -->
  <div
    class="bg-white border border-[#c2c6d8] rounded-xl shadow-sm overflow-hidden"
  >
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#f2f3ff] border-b border-[#c2c6d8]">
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase w-16"
            >
              No
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase"
            >
              브랜드 로고
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase"
            >
              브랜드명
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase"
            >
              설명
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase"
            >
              등록일
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase"
            >
              상태
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-[#424656] uppercase text-right"
            >
              관리
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#c2c6d8]/30">
          <tr
            v-for="(brand, index) in brands"
            :key="brand.id"
            class="hover:bg-[#f2f3ff]/30 transition-colors group"
          >
            <td class="px-6 py-4 text-sm text-[#424656]">
              {{ currentPage * size + index + 1 }}
            </td>
            <td class="px-6 py-4">
              <div
                class="w-12 h-12 rounded-lg bg-[#e0e3e5] flex items-center justify-center overflow-hidden border border-[#c2c6d8]"
              >
                <img
                  v-if="brand.logoUrl"
                  :src="brand.logoUrl"
                  :alt="`${brand.name} 로고`"
                  class="w-full h-full object-cover"
                />
                <Icon
                  v-else
                  name="mdi:image-outline"
                  class="w-6 h-6 text-[#727687]"
                />
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-[#191b24]">
                {{ brand.name }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-[#424656]">{{ brand.description }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-[#424656]">
              {{ formatDate(brand.createdAt) }}
            </td>
            <td class="px-6 py-4">
              <span
                v-if="brand.isUse"
                class="inline-flex items-center px-2 py-1 rounded-full bg-[#0050cb]/10 text-[#0050cb] text-xs font-semibold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#0050cb] mr-2"></span>
                활성
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-1 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-semibold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] mr-2"></span>
                비활성
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                class="p-2 rounded-lg hover:bg-[#e6e7f4] text-[#424656] group-hover:text-[#0050cb] transition-all"
                @click="handleModBtn(brand)"
              >
                <Icon name="mdi:pencil" class="w-5 h-5" />
              </button>
            </td>
          </tr>
          <tr v-if="brands.length === 0">
            <td
              colspan="7"
              class="px-6 py-12 text-center text-sm text-[#424656]"
            >
              등록된 브랜드가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BoItemPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="onPageChange"
    />
  </div>
</template>
