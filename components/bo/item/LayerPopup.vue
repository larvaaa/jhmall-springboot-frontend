<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'
const props = defineProps<{
  modelValue: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})
</script>

<template>
  <Dialog :open="isOpen">
    <div class="fixed inset-0 z-50 bg-black/30" aria-hidden="true">
      <div
        class="fixed inset-0 z-50 flex w-screen items-center justify-center p-4"
      >
        <DialogPanel class="w-[80vw] h-[80vh] rounded bg-white relative p-5">
          <button class="absolute top-5 right-5" @click="isOpen = false">
            <Icon name="mdi:close" class="w-6 h-6 text-black/60" />
          </button>
          <DialogTitle as="h1"><slot name="title"></slot></DialogTitle>

          <slot></slot>

          <!-- <AwesomeButton
            class="w-[100px] absolute right-5 bottom-5"
            size="sm"
            type="opposite"
            @click="isOpen = false"
            >닫기</AwesomeButton
          > -->
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>
