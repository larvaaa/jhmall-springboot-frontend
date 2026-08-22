<script lang="ts" setup>
import type { Brand } from '~~/types/admin/brand'

interface BrandPage {
  content: Brand[]
  totalPages: number
  number: number
}

// const props = defineProps<{}>()

const emits = defineEmits<{
  (e: 'setBrand', data: Brand): void
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

  const res = await customFetch<BrandPage | Brand[]>('/store-service/brand', {
    method: 'get',
    params,
  })
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

const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = currentPage.value + 1
  const pages: (number | '...')[] = []
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total)
  }
  return pages
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

const handleSelBtn = (item: Brand) => {
  emits('setBrand', item)
}

definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="flex-col">
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
      class="bg-white border border-[#c2c6d8] rounded-xl shadow-sm overflow-auto h-[50vh]"
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
                선택
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
                <div class="text-sm text-[#424656]">
                  {{ brand.description }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-[#424656]">
                {{ formatDate(brand.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="brand.isUse"
                  class="inline-flex items-center px-2 py-1 rounded-full bg-[#0050cb]/10 text-[#0050cb] text-xs font-semibold"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-[#0050cb] mr-2"
                  ></span>
                  활성
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-1 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-semibold"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] mr-2"
                  ></span>
                  비활성
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="p-2 rounded-lg hover:bg-[#e6e7f4] text-[#424656] group-hover:text-[#0050cb] transition-all"
                  @click="handleSelBtn(brand)"
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
    </div>
    <!-- 페이지네이션 -->
    <div
      class="px-6 py-4 bg-[#f2f3ff]/50 flex items-center justify-center border-t border-[#c2c6d8]"
    >
      <div class="flex items-center gap-1">
        <button
          class="w-10 h-10 flex items-center justify-center border border-[#c2c6d8] rounded-lg hover:bg-[#e6e7f4] text-[#424656] transition-colors disabled:opacity-30"
          :disabled="currentPage === 0"
          @click="onPageChange(currentPage - 1)"
        >
          <Icon name="mdi:chevron-left" class="w-5 h-5" />
        </button>
        <template v-for="p in visiblePages" :key="p">
          <span v-if="p === '...'" class="px-2 text-sm text-[#424656]"
            >...</span
          >
          <button
            v-else
            class="w-10 h-10 rounded-lg text-xs font-semibold transition-colors"
            :class="
              currentPage === (p as number) - 1
                ? 'bg-[#0050cb] text-white shadow-sm'
                : 'hover:bg-[#e6e7f4] text-[#424656]'
            "
            @click="onPageChange((p as number) - 1)"
          >
            {{ p }}
          </button>
        </template>
        <button
          class="w-10 h-10 flex items-center justify-center border border-[#c2c6d8] rounded-lg hover:bg-[#e6e7f4] text-[#424656] transition-colors disabled:opacity-30"
          :disabled="currentPage === totalPages - 1"
          @click="onPageChange(currentPage + 1)"
        >
          <Icon name="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
