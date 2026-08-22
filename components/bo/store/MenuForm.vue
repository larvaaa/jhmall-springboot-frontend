<script lang="ts" setup>
import type {
  MenuDetail,
  MenuOptionDto,
  MenuOptionGroupDto,
  MenuRegisterRequest,
} from '~~/types/admin/menu'

const props = defineProps<{
  storeId: number
  menuId?: number | null
}>()

const emits = defineEmits<{
  saved: []
}>()

let groupTempIdSeq = 1
let optionTempIdSeq = 1

interface OptionForm extends MenuOptionDto {
  tempId: number
}

interface OptionGroupForm extends Omit<MenuOptionGroupDto, 'options'> {
  tempId: number
  options: OptionForm[]
}

function blankForm() {
  return {
    id: undefined as number | undefined,
    name: '',
    description: '' as string,
    price: '' as number | string,
    isSoldOut: false,
    isUse: true,
  }
}

const form = reactive(blankForm())
const optionGroups = ref<OptionGroupForm[]>([])
const selectedGroupIndex = ref<number | null>(null)
const isLoading = ref(false)

function toOptionGroupForm(g: MenuOptionGroupDto): OptionGroupForm {
  return {
    ...g,
    tempId: groupTempIdSeq++,
    options: g.options.map((o) => ({ ...o, tempId: optionTempIdSeq++ })),
  }
}

async function fetchMenu(id: number) {
  isLoading.value = true
  try {
    const res = await customFetch<ApiResponse<MenuDetail>>(
      `/store-service/menu/${id}`,
      { method: 'get' },
    )
    const detail = res.data
    if (!detail) return
    form.id = detail.id
    form.name = detail.name
    form.description = detail.description ?? ''
    form.price = detail.price
    form.isSoldOut = detail.isSoldOut
    form.isUse = detail.isUse
    optionGroups.value = detail.optionGroups.map(toOptionGroupForm)
    selectedGroupIndex.value = null
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  Object.assign(form, blankForm())
  optionGroups.value = []
  selectedGroupIndex.value = null
}

watch(
  () => props.menuId,
  (id) => {
    if (id) fetchMenu(id)
    else resetForm()
  },
  { immediate: true },
)

const formTitle = computed(() =>
  form.id ? `메뉴 수정 (${form.name || '이름없음'})` : '신규 메뉴 등록',
)

const selectedGroup = computed(() =>
  selectedGroupIndex.value !== null
    ? optionGroups.value[selectedGroupIndex.value]
    : null,
)

function addGroup() {
  optionGroups.value.push({
    tempId: groupTempIdSeq++,
    name: '',
    isRequired: false,
    isMultiSelectedEnabled: false,
    sortOrder: optionGroups.value.length,
    options: [],
  })
  selectedGroupIndex.value = optionGroups.value.length - 1
}

function selectGroup(index: number) {
  selectedGroupIndex.value = index
}

const showRemoveGroupConfirm = ref(false)
const pendingRemoveGroupIndex = ref<number | null>(null)

function removeGroup(index: number) {
  pendingRemoveGroupIndex.value = index
  showRemoveGroupConfirm.value = true
}

function confirmRemoveGroup() {
  const index = pendingRemoveGroupIndex.value
  if (index === null) return
  optionGroups.value.splice(index, 1)
  if (selectedGroupIndex.value === index) selectedGroupIndex.value = null
  else if (
    selectedGroupIndex.value !== null &&
    selectedGroupIndex.value > index
  )
    selectedGroupIndex.value--
  pendingRemoveGroupIndex.value = null
}

function moveGroup(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= optionGroups.value.length) return
  const arr = optionGroups.value
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
  if (selectedGroupIndex.value === index) selectedGroupIndex.value = target
  else if (selectedGroupIndex.value === target) selectedGroupIndex.value = index
}

function addOption() {
  selectedGroup.value?.options.push({
    tempId: optionTempIdSeq++,
    name: '',
    extraPrice: 0,
    isUse: true,
    sortOrder: selectedGroup.value.options.length,
  })
}

function removeOption(optIndex: number) {
  selectedGroup.value?.options.splice(optIndex, 1)
}

function moveOption(optIndex: number, direction: -1 | 1) {
  const group = selectedGroup.value
  if (!group) return
  const target = optIndex + direction
  if (target < 0 || target >= group.options.length) return
  ;[group.options[optIndex], group.options[target]] = [
    group.options[target],
    group.options[optIndex],
  ]
}

const estimatedPrice = computed(() => {
  const base = Number(form.price) || 0
  const parts = [`기본가 ${base.toLocaleString()}원`]
  let sum = base
  optionGroups.value.forEach((g) => {
    const opt = g.options.find((o) => Number(o.extraPrice) > 0)
    if (opt) {
      const extra = Number(opt.extraPrice) || 0
      sum += extra
      parts.push(
        `${g.name || '옵션그룹'}(${opt.name || '옵션'}) ${extra.toLocaleString()}원`,
      )
    }
  })
  return {
    text: `${parts.join(' + ')} = ${sum.toLocaleString()}원`,
    show: optionGroups.value.length > 0,
  }
})

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = '메뉴명을 입력해주세요.'
  if (!form.price || Number(form.price) <= 0)
    errors.price = '가격을 입력해주세요.'
  for (const g of optionGroups.value) {
    if (!g.name.trim()) {
      errors.optionGroups = '옵션그룹명을 입력해주세요.'
      break
    }
    if (g.options.length === 0) {
      errors.optionGroups = `옵션그룹 '${g.name}'에 옵션을 1개 이상 추가해주세요.`
      break
    }
    for (const o of g.options) {
      if (!o.name.trim()) {
        errors.optionGroups = `옵션그룹 '${g.name}'의 옵션명을 입력해주세요.`
        break
      }
    }
  }
  return Object.keys(errors).length === 0
}

const showSavedNotice = ref(false)

async function onSave() {
  if (!validate()) return

  const body: MenuRegisterRequest = {
    storeId: props.storeId,
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    attachFileId: null,
    isUse: form.isUse,
    isSoldOut: form.isSoldOut,
    sortOrder: 0,
    optionGroups: optionGroups.value.map((g, gIndex) => ({
      id: g.id,
      name: g.name,
      isRequired: g.isRequired,
      isMultiSelectedEnabled: g.isMultiSelectedEnabled,
      sortOrder: gIndex,
      options: g.options.map((o, oIndex) => ({
        id: o.id,
        name: o.name,
        extraPrice: Number(o.extraPrice) || 0,
        isUse: o.isUse,
        sortOrder: oIndex,
      })),
    })),
  }

  if (form.id) {
    await customFetch(`/store-service/menu/${form.id}`, {
      method: 'patch',
      body,
    })
  } else {
    await customFetch('/store-service/menu', { method: 'post', body })
    resetForm()
  }
  showSavedNotice.value = true
  emits('saved')
}

defineExpose({ onSave })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="flex justify-between items-center border-b border-gray-200 pb-4"
    >
      <h3 class="text-base font-semibold text-gray-800">{{ formTitle }}</h3>
    </div>

    <!-- 기본정보 -->
    <div
      class="grid grid-cols-2 gap-x-5 gap-y-4 bg-white border border-gray-200 rounded-lg p-5"
    >
      <div class="col-span-2 space-y-1.5">
        <label class="text-xs font-semibold text-gray-700 block"
          >메뉴명 <span class="text-red-500">*</span></label
        >
        <input
          v-model="form.name"
          type="text"
          class="w-full h-10 px-3 border rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          :class="errors.name ? 'border-red-400' : 'border-gray-300'"
          placeholder="메뉴명을 입력하세요"
        />
        <p v-if="errors.name" class="text-red-500 text-xs">{{ errors.name }}</p>
      </div>
      <div class="col-span-2 space-y-1.5">
        <label class="text-xs font-semibold text-gray-700 block">설명</label>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="메뉴 설명을 입력하세요"
        ></textarea>
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-gray-700 block"
          >가격 <span class="text-red-500">*</span></label
        >
        <div class="relative">
          <input
            v-model="form.price"
            type="number"
            min="0"
            class="w-full h-10 pl-3 pr-8 border rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            :class="errors.price ? 'border-red-400' : 'border-gray-300'"
            placeholder="0"
          />
          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
            >원</span
          >
        </div>
        <p v-if="errors.price" class="text-red-500 text-xs">
          {{ errors.price }}
        </p>
      </div>
      <div class="flex flex-col justify-end gap-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-gray-700">품절여부</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.isSoldOut"
              type="checkbox"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"
            ></div>
          </label>
        </div>
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-gray-700">사용여부</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.isUse" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
            ></div>
          </label>
        </div>
      </div>
    </div>

    <!-- 옵션그룹 master-detail -->
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Icon
            name="mdi:checkbox-blank-circle"
            class="w-2.5 h-2.5 text-slate-600"
          />
          <span class="font-bold text-slate-600 text-sm">옵션그룹</span>
        </div>
        <p v-if="errors.optionGroups" class="text-red-500 text-xs">
          {{ errors.optionGroups }}
        </p>
      </div>

      <div class="grid grid-cols-[220px_1fr] gap-4">
        <!-- 좌: 그룹 목록 -->
        <div class="border border-gray-200 rounded-md flex flex-col">
          <button
            type="button"
            class="flex items-center justify-center gap-1 h-9 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-200 transition-colors"
            @click="addGroup"
          >
            <Icon name="mdi:plus" class="w-4 h-4" />
            그룹 추가
          </button>
          <div class="max-h-72 overflow-y-auto divide-y divide-gray-100">
            <p
              v-if="optionGroups.length === 0"
              class="text-xs text-gray-400 text-center py-6 px-2"
            >
              등록된 옵션그룹이 없습니다.
            </p>
            <div
              v-for="(g, index) in optionGroups"
              :key="g.tempId"
              class="flex items-center gap-1 px-2 py-2 cursor-pointer transition-colors"
              :class="
                selectedGroupIndex === index
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              "
              @click="selectGroup(index)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ g.name || '(이름없음)' }}
                </p>
                <p class="text-[10px] text-gray-400">
                  {{ g.isMultiSelectedEnabled ? '다중선택' : '단일선택' }}
                  <span v-if="g.isRequired" class="text-red-500 ml-1"
                    >필수</span
                  >
                </p>
              </div>
              <button
                type="button"
                class="p-1 text-gray-300 hover:text-gray-600"
                title="위로"
                @click.stop="moveGroup(index, -1)"
              >
                <Icon name="mdi:arrow-up" class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1 text-gray-300 hover:text-gray-600"
                title="아래로"
                @click.stop="moveGroup(index, 1)"
              >
                <Icon name="mdi:arrow-down" class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1 text-gray-300 hover:text-red-500"
                title="삭제"
                @click.stop="removeGroup(index)"
              >
                <Icon name="mdi:delete-outline" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 우: 선택된 그룹 상세 -->
        <div class="border border-gray-200 rounded-md p-4">
          <div
            v-if="!selectedGroup"
            class="flex items-center justify-center h-full min-h-[180px]"
          >
            <p class="text-sm text-gray-400">
              왼쪽에서 옵션그룹을 선택하거나 추가하세요.
            </p>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1 space-y-1">
                <label class="text-xs font-semibold text-gray-700 block"
                  >그룹명 <span class="text-red-500">*</span></label
                >
                <input
                  v-model="selectedGroup.name"
                  type="text"
                  class="w-full h-9 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="예: 사이즈"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700 block"
                  >필수선택</label
                >
                <div class="flex items-center gap-3 h-9">
                  <label class="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      v-model="selectedGroup.isRequired"
                      type="radio"
                      :value="true"
                    />
                    필수
                  </label>
                  <label class="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      v-model="selectedGroup.isRequired"
                      type="radio"
                      :value="false"
                    />
                    선택
                  </label>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700 block"
                  >선택방식</label
                >
                <div class="flex items-center gap-3 h-9">
                  <label class="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      v-model="selectedGroup.isMultiSelectedEnabled"
                      type="radio"
                      :value="false"
                    />
                    단일선택
                  </label>
                  <label class="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      v-model="selectedGroup.isMultiSelectedEnabled"
                      type="radio"
                      :value="true"
                    />
                    다중선택
                  </label>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-3">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-semibold text-gray-700">옵션</span>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  @click="addOption"
                >
                  <Icon name="mdi:plus" class="w-3.5 h-3.5" />
                  옵션 추가
                </button>
              </div>
              <div
                class="border border-gray-200 rounded-md max-h-56 overflow-y-auto"
              >
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr class="text-xs text-gray-600">
                      <th class="text-left font-semibold px-3 py-2">옵션명</th>
                      <th class="text-left font-semibold px-3 py-2 w-28">
                        추가금액
                      </th>
                      <th class="text-center font-semibold px-3 py-2 w-14">
                        사용
                      </th>
                      <th class="text-center font-semibold px-3 py-2 w-16">
                        정렬
                      </th>
                      <th class="text-center font-semibold px-3 py-2 w-10">
                        삭제
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-if="selectedGroup.options.length === 0">
                      <td
                        colspan="5"
                        class="text-center text-xs text-gray-400 py-4"
                      >
                        등록된 옵션이 없습니다.
                      </td>
                    </tr>
                    <tr
                      v-for="(o, optIndex) in selectedGroup.options"
                      :key="o.tempId"
                    >
                      <td class="px-3 py-1.5">
                        <input
                          v-model="o.name"
                          type="text"
                          class="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                          placeholder="예: 라지"
                        />
                      </td>
                      <td class="px-3 py-1.5">
                        <input
                          v-model="o.extraPrice"
                          type="number"
                          min="0"
                          class="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td class="px-3 py-1.5 text-center">
                        <input v-model="o.isUse" type="checkbox" />
                      </td>
                      <td class="px-3 py-1.5">
                        <div class="flex justify-center gap-0.5">
                          <button
                            type="button"
                            class="p-0.5 text-gray-300 hover:text-gray-600"
                            @click="moveOption(optIndex, -1)"
                          >
                            <Icon name="mdi:arrow-up" class="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            class="p-0.5 text-gray-300 hover:text-gray-600"
                            @click="moveOption(optIndex, 1)"
                          >
                            <Icon name="mdi:arrow-down" class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td class="px-3 py-1.5 text-center">
                        <button
                          type="button"
                          class="p-1 text-gray-300 hover:text-red-500"
                          @click="removeOption(optIndex)"
                        >
                          <Icon name="mdi:delete-outline" class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 예상 판매가 미리보기 -->
    <!-- <div
      v-if="estimatedPrice.show"
      class="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3"
    >
      <Icon
        name="mdi:calculator-variant-outline"
        class="w-4 h-4 text-blue-600 shrink-0"
      />
      <span class="text-sm text-blue-700 font-medium">{{
        estimatedPrice.text
      }}</span>
    </div> -->

    <BoItemAlertConfirm
      v-model="showRemoveGroupConfirm"
      title="옵션그룹 삭제"
      message="옵션그룹을 삭제하면 하위 옵션도 함께 삭제됩니다."
      sub-message="삭제하시겠습니까?"
      confirm-text="삭제"
      @confirm="confirmRemoveGroup"
    />

    <BoItemAlertNotice
      v-model="showSavedNotice"
      message="저장이 완료되었습니다."
    />
  </div>
</template>
