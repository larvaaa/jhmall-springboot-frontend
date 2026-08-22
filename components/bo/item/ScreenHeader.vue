<script setup lang="ts">
withDefaults(
  defineProps<{
    showSearch?: boolean
    showSave?: boolean
    showReset?: boolean
  }>(),
  {
    showSearch: false,
    showSave: false,
    showReset: false,
  },
)

// vue3.3+ 부터 추가된 간결한 문법
const emits = defineEmits<{
  search: []
  save: []
  reset: []
}>()
</script>

<template>
  <div class="p-2 flex items-center justify-between w-full">
    <p class="font-bold text-xl text-slate-600 flex items-center gap-2">
      <Icon name="mdi:checkbox-blank-circle" class="w-3 h-3" />
      <span><slot></slot></span>
    </p>
    <div
      v-if="showSearch || showSave || showReset"
      class="flex items-center gap-2"
    >
      <button
        v-if="showSearch"
        type="button"
        class="px-3 py-1.5 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 flex items-center gap-1"
        @click="emits('search')"
      >
        <Icon name="mdi:magnify" class="w-4 h-4" />
        조회
      </button>
      <button
        v-if="showSearch"
        type="button"
        class="px-3 py-1.5 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 flex items-center gap-1"
        @click="emits('reset')"
      >
        초기화
      </button>
      <button
        v-if="showSave"
        type="button"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
        @click="emits('save')"
      >
        저장
      </button>
    </div>
  </div>
</template>
