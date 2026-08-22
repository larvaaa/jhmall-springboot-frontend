<script lang="ts" setup>
import ScreenList from '~/pages/admin/system/screen/index.vue'
import type { Screen } from '~~/utils/admin-menu-type'

const props = defineProps<{
  screenName: string
}>()

selectMenus()

// 메뉴 레벨에 따라서 왼쪽 패딩
const paddingClass = (level: number) => {
  return {
    'pl-[calc(1rem_*_1)]': level === 1,
    'pl-[calc(1rem_*_2)]': level === 2,
    'pl-[calc(1rem_*_3)]': level === 3,
  }
}

const isOpen = ref(false)

const menus = ref<MenuItem[]>([])

const selectedIndex = ref<number>(-1)
const showNotice = ref(false)
const noticeMessage = ref('저장이 완료되었습니다.')
const form = ref<MenuItem>({
  menuName: '',
  parentMenuName: '',
  menuId: '',
  level: undefined,
  parentId: '',
  screenId: '',
  screenName: '',
  sort: undefined,
  useYn: 'Y',
})

async function saveMenu() {
  await customFetch('/admin-service/admin/system/menu', {
    method: 'post',
    body: form.value,
  })

  noticeMessage.value = '저장이 완료되었습니다.'
  showNotice.value = true
  selectMenus()
}

async function deleteMenu() {
  await customFetch('/admin-service/admin/system/menu', {
    method: 'delete',
    body: form.value,
  })

  noticeMessage.value = '삭제가 완료되었습니다.'
  showNotice.value = true
  selectMenus()
}

async function selectMenus() {
  const response = await customFetch<MenuItem[]>(
    '/admin-service/admin/system/menu',
    {
      method: 'get',
    },
  )
  // const response = await $fetch<MenuItem[]>('/admin/system/menu', {
  //   baseURL: 'http://localhost:8000',
  //   method: 'get',
  //   headers: {
  //     authorization: `Bearer ${useUserStore().authState.accessToken}`,
  //   },
  // })

  menus.value = response
}

function removeAddedMenu() {
  const removeIndex = menus.value.findIndex((item) => !item.menuId)
  if (removeIndex > -1) menus.value.splice(removeIndex, 1)
}

function addMenu(parentMenu?: MenuItem) {
  removeAddedMenu()

  const levelOneMenuCount = menus.value.filter(
    (item) => item.level === 1,
  ).length

  const childCount = menus.value.filter(
    (item) => item.parentId === parentMenu?.menuId,
  ).length

  form.value = {
    menuName: '',
    parentMenuName: '',
    menuId: '',
    level: (parentMenu?.level || 0) + 1,
    parentId: parentMenu?.menuId,
    screenId: '',
    screenName: '',
    sort: parentMenu ? childCount + 1 : levelOneMenuCount + 1,
    useYn: 'Y',
  }

  const addIndex =
    menus.value.findIndex((item) => item.menuId === parentMenu?.menuId) + 1 || 0

  menus.value.splice(addIndex, 0, form.value)

  selectedIndex.value = addIndex
}

function clickMenu(menu: MenuItem, index: number) {
  removeAddedMenu()
  selectedIndex.value = menus.value.findIndex(
    (item) => item.menuId === menu.menuId,
  )
  Object.assign(form.value, menu)
}

function openPopup() {
  isOpen.value = true
}

function closePopup() {
  isOpen.value = false
}

function clearScreen() {
  form.value.screenId = ''
  form.value.screenName = ''
}

function setScreen(item: Screen) {
  closePopup()

  form.value.screenId = item.id
  form.value.screenName = item.name
}
</script>

<template>
  <BoItemScreenHeader :show-search="true" @search="selectMenus">{{
    props.screenName
  }}</BoItemScreenHeader>
  <div class="flex h-[70vh] justify-around">
    <div class="flex-1 border-gray-200 border-2 mr-5 p-5 overflow-auto">
      <button class="w-16 text-lg border-2 rounded-lg" @click="addMenu()">
        추가
      </button>
      <ul>
        <li
          v-for="(menu, index) in menus"
          :key="menu.menuId"
          class="py-2 text-lg relative h-[3rem]"
          :class="[
            paddingClass(menu.level!),
            { 'text-xl text-blue-500 font-medium': index === selectedIndex },
            'hover:text-indigo-400',
          ]"
        >
          <span v-if="!menu.menuId">신규 메뉴</span>
          <a v-else href="#" @click.prevent="clickMenu(menu, index)">
            {{ menu.menuName + ' (' + menu.level + ' lv)' }}
          </a>
          <button
            v-if="menu.menuId"
            class="ml-2 border-2 w-[4rem] rounded-lg absolute right-0"
            @click="addMenu(menu)"
          >
            추가
          </button>
        </li>
      </ul>
    </div>
    <div class="flex-1 border-gray-200 border-2 p-5 relative">
      <form v-if="selectedIndex > -1">
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">메뉴 아이디</span>
          <input
            v-model="form.menuId"
            type="text"
            class="border border-gray-400 p-1 rounded-lg bg-slate-200"
            readonly
          />
        </label>
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">메뉴명</span>
          <input
            v-model="form.menuName"
            type="text"
            class="border border-gray-400 p-1 rounded-lg"
          />
        </label>
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">상위메뉴명</span>
          <input
            v-model="form.parentMenuName"
            type="text"
            class="border border-gray-400 p-1 rounded-lg bg-slate-200"
            readonly
          />
        </label>
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">메뉴레벨</span>
          <input
            v-model="form.level"
            type="text"
            class="border border-gray-400 p-1 rounded-lg bg-slate-200"
            readonly
          />
        </label>
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">메뉴순서</span>
          <input
            v-model="form.sort"
            type="text"
            class="border border-gray-400 p-1 rounded-lg"
        /></label>
        <label class="mb-4 flex items-center"
          ><span class="w-[5rem]">화면 아이디</span>
          <input
            v-model="form.screenId"
            type="text"
            class="border border-gray-400 p-1 rounded-lg bg-slate-200 mr-3"
            disabled
          /><AwesomeButton class="mr-3" size="sm" @click="openPopup"
            >화면 검색</AwesomeButton
          >
          <AwesomeButton size="sm" @click="clearScreen"
            >초기화</AwesomeButton
          ></label
        >
        <label class="block mb-4"
          ><span class="inline-block w-[5rem]">화면명</span>
          <input
            v-model="form.screenName"
            type="text"
            class="border border-gray-400 p-1 rounded-lg bg-slate-200"
            disabled
        /></label>
        <div class="mb-4">
          <span class="inline-block w-[5rem]">사용여부</span>
          <label class="mr-[1rem]"
            ><span class="mr-[0.5rem]">사용</span
            ><input
              v-model="form.useYn"
              type="radio"
              value="Y"
              class="border border-gray-400 p-1 rounded-lg"
            />
          </label>
          <label>
            <span class="mr-[0.5rem]">미사용</span>
            <input
              v-model="form.useYn"
              type="radio"
              value="N"
              class="border border-gray-400 p-1 rounded-lg"
          /></label>
        </div>
      </form>
      <div class="flex justify-around mt-3 mb-5 absolute bottom-2 right-8">
        <button
          class="w-16 text-lg border-blue-500 border bg-blue-200 rounded-lg mr-3"
          @click.prevent="saveMenu"
        >
          저장
        </button>
        <button
          class="w-16 text-lg border-red-500 border bg-red-400 rounded-lg"
          @click.prevent="deleteMenu"
        >
          삭제
        </button>
      </div>
    </div>
    <BoItemLayerPopup v-model="isOpen">
      <template #title>
        <BoItemScreenHeader>화면검색</BoItemScreenHeader>
      </template>
      <template #default>
        <ScreenList :is-popup="true" @set-screen="setScreen"></ScreenList>
      </template>
    </BoItemLayerPopup>
    <BoItemAlertNotice v-model="showNotice" :message="noticeMessage" />
  </div>
</template>
