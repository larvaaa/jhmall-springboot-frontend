<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    totalElements?: number
    pageSize?: number
    pageSizeOptions?: number[]
  }>(),
  {
    totalElements: undefined,
    pageSize: undefined,
    pageSizeOptions: () => [],
  },
)

const emits = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [size: number]
}>()

const visiblePages = computed(() => {
  const total = props.totalPages
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = props.currentPage + 1
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
</script>

<template>
  <div
    class="px-6 py-4 bg-[#f2f3ff]/50 border-t border-[#c2c6d8] grid grid-cols-3 items-center"
  >
    <div></div>
    <div class="flex items-center gap-1 justify-self-center">
      <button
        class="w-10 h-10 flex items-center justify-center border border-[#c2c6d8] rounded-lg hover:bg-[#e6e7f4] text-[#424656] transition-colors disabled:opacity-30"
        :disabled="currentPage === 0"
        @click="emits('page-change', currentPage - 1)"
      >
        <Icon name="mdi:chevron-left" class="w-5 h-5" />
      </button>
      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="px-2 text-sm text-[#424656]">...</span>
        <button
          v-else
          class="w-10 h-10 rounded-lg text-xs font-semibold transition-colors"
          :class="
            currentPage === (p as number) - 1
              ? 'bg-[#0050cb] text-white shadow-sm'
              : 'hover:bg-[#e6e7f4] text-[#424656]'
          "
          @click="emits('page-change', (p as number) - 1)"
        >
          {{ p }}
        </button>
      </template>
      <button
        class="w-10 h-10 flex items-center justify-center border border-[#c2c6d8] rounded-lg hover:bg-[#e6e7f4] text-[#424656] transition-colors disabled:opacity-30"
        :disabled="currentPage === totalPages - 1"
        @click="emits('page-change', currentPage + 1)"
      >
        <Icon name="mdi:chevron-right" class="w-5 h-5" />
      </button>
    </div>
    <div class="flex items-center gap-3 justify-self-end">
      <select
        v-if="pageSizeOptions.length > 0"
        :value="pageSize"
        class="h-8 px-2 rounded-lg border border-[#c2c6d8] text-xs text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] bg-white"
        @change="
          emits(
            'page-size-change',
            Number(($event.target as HTMLSelectElement).value),
          )
        "
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}개씩
        </option>
      </select>
      <span v-if="totalElements != null" class="text-xs text-[#424656]"
        >총 {{ totalElements.toLocaleString() }}건</span
      >
    </div>
  </div>
</template>
