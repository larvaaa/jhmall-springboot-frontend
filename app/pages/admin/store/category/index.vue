<script lang="ts" setup>
interface Category {
  id: number
  name: string
  parentId: number | null
  sortOrder: number
  isUse: boolean
  icon: string
}

const props = defineProps<{
  screenName: string
}>()

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

onMounted(fetchCategories)

const selectedId = ref<number | null>(null)
const isCreating = ref(false)
const isEditing = ref(false)

const isFormEditable = computed(() => isCreating.value || isEditing.value)

const form = reactive({
  name: '',
  sortOrder: 1,
  icon: 'mdi:food',
  isUse: true,
  parentId: null as number | null,
  depth: 0,
})

const errors = reactive<Record<string, string>>({})

// 선택된 카테고리 -> 폼 동기화
watch(selectedId, (id) => {
  if (id === null) return
  const cat = categories.value.find((c) => c.id === id)
  if (!cat) return
  form.name = cat.name
  form.sortOrder = cat.sortOrder
  form.icon = cat.icon
  form.isUse = cat.isUse
  form.parentId = cat.parentId
  isCreating.value = false
  Object.keys(errors).forEach((k) => delete errors[k])
})

const onRowClick = (cat: Category) => {
  selectedId.value = cat.id
  isEditing.value = false
}

const onEditClick = (cat: Category) => {
  selectedId.value = cat.id
  isEditing.value = true
}

const onAddChild = (parent: Category) => {
  isCreating.value = true
  isEditing.value = false
  selectedId.value = null
  form.name = ''
  form.sortOrder = 1
  form.icon = 'mdi:food'
  form.isUse = true
  form.parentId = parent.id
  Object.keys(errors).forEach((k) => delete errors[k])
}

const onAddNew = () => {
  isCreating.value = true
  isEditing.value = false
  selectedId.value = null
  form.name = ''
  form.sortOrder = 1
  form.icon = 'mdi:food'
  form.isUse = true
  form.parentId = null
  Object.keys(errors).forEach((k) => delete errors[k])
}

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = '카테고리명을 입력해주세요.'
  if (!form.sortOrder) errors.sortOrder = '순서를 입력해주세요.'
  return Object.keys(errors).length === 0
}

const onSave = async () => {
  if (!validate()) return
  const body = {
    name: form.name,
    sortOrder: form.sortOrder,
    icon: form.icon,
    isUse: form.isUse,
    parentId: form.parentId,
    depth: form.depth,
  }
  if (isCreating.value) {
    await customFetch('/store-service/category', { method: 'post', body })
  } else {
    await customFetch(`/store-service/category/${selectedId.value}`, {
      method: 'patch',
      body,
    })
  }
  isEditing.value = false
  isCreating.value = false
  await fetchCategories()
}

const onCancel = () => {
  isEditing.value = false
  if (selectedId.value) {
    const cat = categories.value.find((c) => c.id === selectedId.value)
    if (cat) {
      form.name = cat.name
      form.sortOrder = cat.sortOrder
      form.isUse = cat.isUse
    }
  } else {
    form.name = ''
    form.sortOrder = 1
    form.isUse = true
    isCreating.value = false
  }
  Object.keys(errors).forEach((k) => delete errors[k])
}

const showDeleteConfirm = ref(false)
const pendingDeleteCategory = ref<Category | null>(null)

const onDelete = (cat: Category) => {
  pendingDeleteCategory.value = cat
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  const cat = pendingDeleteCategory.value
  if (!cat) return
  await customFetch(`/store-service/category/${cat.id}`, { method: 'delete' })
  if (selectedId.value === cat.id) {
    selectedId.value = null
    isEditing.value = false
  }
  pendingDeleteCategory.value = null
  await fetchCategories()
}

// 자식이 없는 최하위 카테고리 id 집합
const leafIds = computed(() => {
  const parentIdSet = new Set(
    categories.value.filter((c) => c.parentId !== null).map((c) => c.parentId),
  )
  return new Set(
    categories.value.filter((c) => !parentIdSet.has(c.id)).map((c) => c.id),
  )
})

// 부모/자식 구조로 정렬된 카테고리 목록 (재귀적 다단계 지원)
const flattenedCategories = computed(() => {
  const result: { cat: Category; depth: number }[] = []
  const traverse = (parentId: number | null, depth: number) => {
    const children = categories.value.filter((c) => c.parentId === parentId)
    for (const child of children) {
      result.push({ cat: child, depth })
      traverse(child.id, depth + 1)
    }
  }
  traverse(null, 0)
  return result
})

const formTitle = computed(() => {
  if (isCreating.value)
    return form.parentId ? '하위 카테고리 추가' : '카테고리 추가'
  return '카테고리 상세 설정'
})

definePageMeta({ layout: 'admin' })
</script>

<template>
  <BoItemScreenHeader v-if="props.screenName" @save="onAddNew">{{
    props.screenName
  }}</BoItemScreenHeader>

  <div class="flex flex-row gap-5 mt-2 w-full">
    <!-- 좌측: 카테고리 목록 -->
    <div
      class="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-5 flex flex-col h-[70vh]"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-semibold text-gray-800">
          등록된 카테고리
          <span class="text-blue-600 text-sm ml-2"
            >{{ categories.length }}개</span
          >
        </h3>
        <BoItemSearchButton
          variant="primary"
          size="sm"
          icon="mdi:plus"
          @click="onAddNew"
        >
          카테고리 등록
        </BoItemSearchButton>
      </div>
      <div class="flex-1 overflow-auto border border-gray-200 rounded-md">
        <table class="w-full text-left border-collapse min-w-[500px]">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-600 w-12 text-center"
              >
                번호
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600">
                카테고리명
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600">
                상태
              </th>
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-600 text-center"
              >
                추가
              </th>
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-600 text-center"
              >
                삭제
              </th>
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-600 text-center"
              >
                관리
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
            <tr
              v-for="({ cat, depth }, index) in flattenedCategories"
              :key="cat.id"
              class="hover:bg-gray-50 transition-colors cursor-pointer"
              :class="{
                'bg-blue-50/50 border-l-4 border-l-blue-600':
                  selectedId === cat.id,
                'opacity-75': !cat.isUse,
              }"
              @click="onRowClick(cat)"
            >
              <td class="px-4 py-3 text-center text-gray-400 text-xs">
                {{ index + 1 }}
              </td>
              <td
                class="px-4 py-3 font-medium"
                :style="{ paddingLeft: `${16 + depth * 20}px` }"
              >
                <span v-if="depth > 0" class="inline-flex items-center gap-1">
                  <Icon
                    name="mdi:subdirectory-arrow-right"
                    class="w-4 h-4 text-gray-400"
                  />
                  {{ cat.name }}
                </span>
                <span v-else>{{ cat.name }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  :class="
                    cat.isUse
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  "
                >
                  {{ cat.isUse ? '활성' : '비활성' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="하위 카테고리 추가"
                  @click.stop="onAddChild(cat)"
                >
                  <Icon name="mdi:plus" class="w-5 h-5" />
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="leafIds.has(cat.id)"
                  type="button"
                  class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="삭제"
                  @click.stop="onDelete(cat)"
                >
                  <Icon name="mdi:delete-outline" class="w-5 h-5" />
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  @click.stop="onEditClick(cat)"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 우측: 상세 설정 폼 -->
    <div class="flex-1 min-w-0 flex flex-col gap-4 h-[70vh]">
      <div
        class="bg-white border border-gray-200 rounded-lg p-5 flex-1 overflow-auto shadow-sm"
      >
        <div
          class="flex justify-between items-center mb-5 border-b border-gray-200 pb-4"
        >
          <h3 class="text-base font-semibold text-gray-800">{{ formTitle }}</h3>
        </div>
        <form class="space-y-6" @submit.prevent>
          <!-- 카테고리명 -->
          <div class="space-y-3">
            <label class="text-xs font-semibold text-gray-700 block">
              카테고리명 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              :readonly="!isFormEditable"
              class="w-full h-10 px-3 border rounded text-sm transition-colors"
              :class="{
                'border-red-400': errors.name,
                'border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500':
                  !errors.name && isFormEditable,
                'border-gray-200 bg-gray-50 text-gray-500 cursor-default':
                  !isFormEditable,
              }"
              placeholder="카테고리명 입력"
            />
            <p v-if="errors.name" class="text-red-500 text-xs">
              {{ errors.name }}
            </p>
            <p v-else class="text-xs text-gray-400">
              사용자에게 표시될 이름을 입력하세요. (최대 10자)
            </p>
          </div>

          <!-- 순서 -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-700 block">
              순서 <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="form.sortOrder"
                type="number"
                min="1"
                :readonly="!isFormEditable"
                class="w-24 h-10 px-3 border rounded text-sm transition-colors"
                :class="{
                  'border-red-400': errors.sortOrder,
                  'border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500':
                    !errors.sortOrder && isFormEditable,
                  'border-gray-200 bg-gray-50 text-gray-500 cursor-default':
                    !isFormEditable,
                }"
              />
            </div>
            <p v-if="errors.sortOrder" class="text-red-500 text-xs">
              {{ errors.sortOrder }}
            </p>
          </div>

          <!-- 아이콘 -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-700 block">
              아이콘 이미지 <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-4">
              <div
                class="w-20 h-20 rounded bg-red-50 border border-gray-200 flex items-center justify-center relative overflow-hidden"
                :class="
                  isFormEditable ? 'group cursor-pointer' : 'cursor-default'
                "
              >
                <Icon :name="form.icon" class="w-8 h-8 text-red-500" />
                <div
                  v-if="isFormEditable"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="mdi:upload" class="w-6 h-6 text-white" />
                </div>
              </div>
              <div v-if="isFormEditable" class="flex-1">
                <button
                  type="button"
                  class="w-full h-8 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  라이브러리에서 선택
                </button>
              </div>
            </div>
          </div>

          <!-- 활성화 상태 -->
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-xs font-semibold text-gray-700 block"
                  >활성화 상태</label
                >
                <p class="text-xs text-gray-400 mt-1">
                  비활성화 시 앱에서 숨김 처리됩니다.
                </p>
              </div>
              <label
                class="relative inline-flex items-center"
                :class="
                  isFormEditable
                    ? 'cursor-pointer'
                    : 'cursor-default opacity-60'
                "
              >
                <input
                  v-model="form.isUse"
                  type="checkbox"
                  class="sr-only peer"
                  :disabled="!isFormEditable"
                />
                <div
                  class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>
          </div>
        </form>
      </div>

      <!-- 버튼 -->
      <div v-if="isFormEditable" class="flex gap-5">
        <button
          type="button"
          class="flex-1 h-12 bg-white text-gray-700 font-semibold text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          @click="onCancel"
        >
          취소
        </button>
        <button
          type="button"
          class="flex-1 h-12 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          @click="onSave"
        >
          저장하기
        </button>
      </div>
    </div>
  </div>

  <BoItemAlertConfirm
    v-model="showDeleteConfirm"
    title="카테고리 삭제"
    :message="`'${pendingDeleteCategory?.name}' 카테고리를 삭제하시겠습니까?`"
    confirm-text="삭제"
    @confirm="confirmDelete"
  />
</template>
