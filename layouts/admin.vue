<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

const tabs = ref<MenuItem[]>([
  // {
  //   menuId: '1',
  //   menuName: 'tab1',
  //   level: 2,
  // },
])

// 현재 선택된 탭
const selectedTab = ref(0)

// 탭 열기
const openTab = async (menu: MenuItem) => {
  if (tabs.value.some((tab) => tab.menuId === menu.menuId)) return
  tabs.value.push(menu)
  await nextTick()
  selectedTab.value = tabs.value.length - 1
}

provide('openTab', openTab)

// 탭 변경 이벤트
const changeTab = (index: number) => {
  selectedTab.value = index
}

const menus = ref<MenuItem[]>([
  { menuId: '1', menuName: '상점 관리', parentMenuName: '', level: 1 },
  {
    menuId: '2',
    menuName: '가게 목록',
    parentMenuName: '상점 관리',
    level: 2,
    parentId: '1',
    route: defineAsyncComponent(
      () => import('~/pages/admin/store/index.vue'),
    ),
    screenId: '2',
    screenName: '가게 목록',
  },
  {
    menuId: '3',
    menuName: '가게 등록',
    parentMenuName: '상점 관리',
    level: 2,
    parentId: '1',
    route: defineAsyncComponent(() => import('~/pages/admin/store/form.vue')),
    screenId: '3',
    screenName: '가게 등록',
  },
  { menuId: '10', menuName: '브랜드 관리', parentMenuName: '', level: 1 },
  {
    menuId: '11',
    menuName: '브랜드 목록',
    parentMenuName: '브랜드 관리',
    level: 2,
    parentId: '10',
    route: defineAsyncComponent(
      () => import('~/pages/admin/store/brand/index.vue'),
    ),
    screenId: '11',
    screenName: '브랜드 목록',
  },
  {
    menuId: '12',
    menuName: '브랜드 등록',
    parentMenuName: '브랜드 관리',
    level: 2,
    parentId: '10',
    route: defineAsyncComponent(
      () => import('~/pages/admin/store/brand/form.vue'),
    ),
    screenId: '12',
    screenName: '브랜드 등록',
  },
  // { menuId: '3', menuName: '시스템 관리', level: 1 },
  // {
  //   menuId: '9',
  //   menuName: '메뉴 관리',
  //   level: 2,
  //   parentId: '3',
  // },
  // {
  //   menuId: '11',
  //   menuName: '메뉴 등록',
  //   level: 3,
  //   parentId: '9',
  //   route: defineAsyncComponent(
  //     () => import('~/pages/admin/system/menu/index.vue'),
  //   ),
  // },
  // {
  //   menuId: '12',
  //   menuName: '메뉴 목록',
  //   level: 3,
  //   parentId: '9',
  //   route: defineAsyncComponent(
  //     () => import('~/pages/admin/system/menu/index.vue'),
  //   ),
  // },
  // {
  //   menuId: '10',
  //   menuName: '화면 관리',
  //   level: 2,
  //   parentId: '3',
  // },
  // { menuId: '1', menuName: '상품 관리', level: 1 },
  // {
  //   menuId: '4',
  //   menuName: '상품 목록',
  //   level: 2,
  //   parentId: '1',
  // },
  // {
  //   menuId: '6',
  //   menuName: '상품 상세 목록',
  //   level: 3,
  //   parentId: '4',
  // },
  // {
  //   menuId: '5',
  //   menuName: '상품 등록',
  //   level: 2,
  //   parentId: '1',
  //   route: defineAsyncComponent(() => import('~/pages/admin/store/form.vue')),
  // },
  // {
  //   menuId: '13',
  //   menuName: '브랜드 관리',
  //   level: 2,
  //   parentId: '1',
  // },
  // {
  //   menuId: '14',
  //   menuName: '브랜드 목록',
  //   level: 3,
  //   parentId: '13',
  //   route: defineAsyncComponent(
  //     () => import('~/pages/admin/store/brand/index.vue'),
  //   ),
  // },
  // {
  //   menuId: '15',
  //   menuName: '브랜드 등록',
  //   level: 3,
  //   parentId: '13',
  //   route: defineAsyncComponent(
  //     () => import('~/pages/admin/store/brand/form.vue'),
  //   ),
  // },
])
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <NuxtPage />
    <header class="bg-blue-800 text-white py-4 shadow">
      <div class="container mx-auto px-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">관리자 페이지</h1>
      </div>
    </header>
    <div class="flex flex-1">
      <LayoutAdminSideBar :menus="menus" @open-tab="openTab" />
      <main
        class="flex-1 flex items-center justify-center w-full h-full overflow-auto mt-[30px]"
      >
        <div
          v-if="tabs.length"
          class="w-[calc(100%-50px)] h-[calc(100%-50px)] px-2 py-2 sm:px-0"
        >
          <TabGroup as="div" :selected-index="selectedTab" @change="changeTab">
            <TabList
              class="flex space-x-1 rounded-t-xl p-1 border-[2px] border-slate-400 bg-white"
            >
              <Tab v-for="tab in tabs" v-slot="{ selected }" :key="tab.menuId">
                <button
                  :class="[
                    'w-full rounded-xl py-2.5 mr-[3rem] text-md font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-slate-500 text-white shadow'
                      : 'bg-slate-300 text-blue-700 hover:bg-slate-400',
                  ]"
                >
                  {{ tab.menuName }}
                </button>
              </Tab>
            </TabList>

            <TabPanels class="border-x-[2px] border-b-[2px] border-slate-400">
              <TabPanel
                v-for="tab in tabs"
                :key="tab.menuId"
                :class="[
                  'bg-white p-3',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none',
                ]"
              >
                <component
                  :is="tab.route"
                  :screen-id="tab.screenId"
                  :screen-name="tab.screenName"
                  :tab-index="tabs.indexOf(tab)"
                  :params="tab.params"
                />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 필요시 커스텀 스타일 추가 */
</style>
