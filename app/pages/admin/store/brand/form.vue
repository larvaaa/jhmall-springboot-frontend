<script lang="ts" setup>
import type { Brand } from '~~/types/admin/brand'

const props = defineProps<{
  params?: Record<string, string>
  tabIndex: number
  screenId: string
  screenName?: string
}>()

const emits = defineEmits<{
  (e: 'closeTab', value: string): void
}>()

let form = reactive({
  id: '',
  name: '',
  description: '',
  isUse: true,
  attachFile: null as File | null,
})

if (props.params?.brandId) {
  // TODO: 브랜드 조회후 form에 세팅
  const { data: brand } = await customUseFetch<ApiResponse<Brand>>(
    `/store-service/brand/${props.params?.brandId}`,
  )
  if (brand.value) {
    form = { ...brand.value.data }
  }
}

const errors = reactive<Record<string, string>>({})
const logoPreviewUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showNotice = ref(false)

const onLogoClick = () => {
  fileInputRef.value?.click()
}

const onLogoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  form.attachFile = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

const onLogoRemove = () => {
  form.attachFile = null
  logoPreviewUrl.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = '브랜드명을 입력해주세요.'
  return Object.keys(errors).length === 0
}

const onSave = async () => {
  if (!validate()) return
  const body = new FormData()
  body.append('id', form.id)
  body.append('name', form.name)
  body.append('description', form.description)
  body.append('isUse', String(form.isUse))
  if (form.attachFile) body.append('logo', form.attachFile)

  if (form.id) {
    await customFetch(`/store-service/brand/${form.id}`, {
      method: 'patch',
      body,
    })
  } else {
    await customFetch('/store-service/brand', { method: 'post', body })
  }
  showNotice.value = true
}

const onCancel = () => {
  emits('closeTab', props.screenId)
}

const formType = computed(() => {
  return props.params?.brandId ? '수정' : '등록'
})

definePageMeta({ layout: 'admin' })
</script>

<template>
  <BoItemScreenHeader v-if="props.screenName" :show-save="false">{{
    props.screenName
  }}</BoItemScreenHeader>

  <!-- 폼 -->
  <form class="p-6 space-y-6" @submit.prevent="onSave">
    <!-- 브랜드명 -->
    <div class="space-y-2">
      <label
        class="block text-xs font-semibold text-[#191b24]"
        for="brand-name"
      >
        브랜드명 <span class="text-[#ba1a1a]">*</span>
      </label>
      <input
        id="brand-name"
        v-model="form.name"
        type="text"
        placeholder="브랜드 이름을 입력하세요"
        class="w-full h-10 px-4 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1"
        :class="
          errors.name
            ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]'
            : 'border-[#c2c6d8] focus:border-[#0050cb] focus:ring-[#0050cb]'
        "
      />
      <p v-if="errors.name" class="text-xs text-[#ba1a1a]">
        {{ errors.name }}
      </p>
    </div>

    <!-- 브랜드 로고 -->
    <div class="space-y-2">
      <label class="block text-xs font-semibold text-[#191b24]">
        브랜드 로고
      </label>
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-1 px-6 h-10 rounded-lg bg-[#0066ff] hover:bg-[#0050cb] text-white text-xs font-semibold transition-all"
          @click="onLogoClick"
        >
          로고 업로드
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onLogoChange"
        />
      </div>

      <!-- 이미지 미리보기 -->
      <div
        v-if="logoPreviewUrl"
        class="relative w-32 h-32 mt-3 rounded-lg border border-[#c2c6d8] overflow-hidden"
      >
        <img
          :src="logoPreviewUrl"
          alt="로고 미리보기"
          class="w-full h-full object-cover"
        />
        <button
          type="button"
          class="absolute top-1 right-1 bg-[#ba1a1a] text-white rounded-full p-0.5 opacity-80 hover:opacity-100 transition-opacity"
          @click="onLogoRemove"
        >
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 브랜드 설명 -->
    <div class="space-y-2">
      <label
        class="block text-xs font-semibold text-[#191b24]"
        for="brand-description"
      >
        브랜드 설명
      </label>
      <textarea
        id="brand-description"
        v-model="form.description"
        rows="4"
        placeholder="브랜드에 대한 상세 설명을 입력하세요"
        class="w-full px-4 py-2 rounded-lg border border-[#c2c6d8] text-sm transition-all focus:outline-none focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] resize-none"
      ></textarea>
    </div>

    <!-- 활성화 상태 -->
    <div
      class="flex items-center justify-between p-4 bg-[#faf8ff] border border-[#c2c6d8] rounded-lg"
    >
      <div>
        <p class="text-xs font-semibold text-[#191b24]">활성화 상태</p>
        <p class="text-[13px] text-[#5c5f61] mt-0.5">
          브랜드를 등록 즉시 노출할지 설정합니다.
        </p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input v-model="form.isUse" type="checkbox" class="sr-only peer" />
        <div
          class="w-11 h-6 bg-[#e0e3e5] rounded-full peer peer-checked:bg-[#0066ff] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"
        ></div>
      </label>
    </div>

    <!-- 버튼 -->
    <div class="flex justify-end gap-4 pt-2">
      <button
        type="button"
        class="px-8 h-11 rounded-lg border border-[#c2c6d8] text-[#5c5f61] text-xs font-semibold hover:bg-[#ecedfa] transition-all"
        @click="onCancel"
      >
        취소
      </button>
      <button
        type="submit"
        class="px-8 h-11 rounded-lg bg-[#0050cb] hover:brightness-90 text-white text-xs font-semibold transition-all active:scale-95"
      >
        저장하기
      </button>
    </div>
  </form>

  <BoItemAlertNotice
    v-model="showNotice"
    :message="`브랜드가 ${formType} 되었습니다.`"
    @confirm="onCancel"
  />
</template>
