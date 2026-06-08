<script setup lang="ts">
type WeekKey = 'W11' | 'W12' | 'W13' | 'W14';

interface DashboardProject {
  id: string;
  ecm: string;
  order: string;
  name: string;
  equipGroup: string;
  date: string;
  department: string;
  status: string;
}

interface DashboardData {
  projects: DashboardProject[];
  groupStats: Record<WeekKey, { entrance: number; left: number; finish: number; out: number }> & {
    W_all: { entrance: number; left: number; finish: number; out: number };
  };
  statusData: {
    sap: number;
    pending: number;
    finish: number;
    total: number;
  };
  equipmentData: Array<{
    name: string;
    values: number[];
    total: number;
  }>;
  currentYear: string;
  currentMonth: string;
  timestamp: string;
}

const weeks: WeekKey[] = ['W11', 'W12', 'W13', 'W14'];
const months = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const years = Array.from({ length: 10 }, (_, index) => String(2020 + index));

const searchTerm = ref('');
const activeTab = ref<'dashboard' | 'report'>('dashboard');
const selectedMonth = ref('');
const selectedYear = ref('');
const isApplyingFilters = ref(false);

const { data, pending, error, refresh } = useFetch<DashboardData>('/api/dashboard', {
  server: false,
  watch: false,
});

watch(data, (value) => {
  if (!value) return;
  selectedYear.value = value.currentYear || 'all';
  selectedMonth.value = value.currentMonth || 'all';
}, { immediate: true });

const total = computed(() => data.value?.statusData.total || 0);
const sap = computed(() => data.value?.statusData.sap || 0);
const pendingCount = computed(() => data.value?.statusData.pending || 0);
const finish = computed(() => data.value?.statusData.finish || 0);
const allProjects = computed(() => data.value?.projects || []);
const equipmentItems = computed(() => data.value?.equipmentData || []);
const maxWeekEntrance = computed(() => Math.max(...weeks.map(week => data.value?.groupStats[week].entrance || 0), 1));
const maxEquipmentWeekValue = computed(() => Math.max(...equipmentItems.value.flatMap(item => item.values || []), 1));
const equipmentColors = ['#0284c7', '#ef4444', '#f59e0b', '#16a34a', '#6366f1', '#14b8a6', '#64748b'];
const lastUpdated = computed(() => {
  if (!data.value?.timestamp) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data.value.timestamp));
});

const filteredProjects = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  const projects = allProjects.value;
  if (!term) return projects.slice(0, 25);

  return projects
    .filter(project =>
      [project.ecm, project.order, project.name, project.equipGroup, project.department, project.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
    .slice(0, 25);
});

const statusCards = computed(() => [
  {
    title: 'SAP Comp',
    subtitle: 'บันทึกปิดงานในระบบ',
    value: sap.value,
    percent: percent(sap.value, total.value),
    accent: 'bg-sky-500',
    text: 'text-sky-700',
    soft: 'bg-sky-50',
  },
  {
    title: 'Finish',
    subtitle: 'งานเสร็จแล้ว',
    value: finish.value,
    percent: percent(finish.value, total.value),
    accent: 'bg-emerald-500',
    text: 'text-emerald-700',
    soft: 'bg-emerald-50',
  },
  {
    title: 'Pending',
    subtitle: 'รอดำเนินการ',
    value: pendingCount.value,
    percent: percent(pendingCount.value, total.value),
    accent: 'bg-amber-400',
    text: 'text-amber-700',
    soft: 'bg-amber-50',
  },
]);

function percent(value: number, base: number) {
  if (!base) return '0.0';
  return ((value / base) * 100).toFixed(1);
}

function weekHeight(week: WeekKey) {
  const value = data.value?.groupStats[week].entrance || 0;
  return `${Math.max((value / maxWeekEntrance.value) * 100, value ? 8 : 0)}%`;
}

function equipmentWeekBarHeight(value: number) {
  return `${Math.max((value / maxEquipmentWeekValue.value) * 100, value ? 7 : 0)}%`;
}

function equipmentColor(index: number) {
  return equipmentColors[index % equipmentColors.length];
}

function statusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes('finish') || lower.includes('เสร็จ')) return 'badge-success';
  if (lower.includes('pending') || lower.includes('รอ')) return 'badge-warning';
  if (lower.includes('sap')) return 'badge-info';
  return 'badge-ghost';
}

async function applyFilters() {
  isApplyingFilters.value = true;
  try {
    data.value = await $fetch<DashboardData>('/api/dashboard', {
      query: {
        applyFilters: 'true',
        year: selectedYear.value || 'all',
        month: selectedMonth.value || 'all',
      },
    });
  } finally {
    isApplyingFilters.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#edf3f8] font-sans text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1540px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img src="/LogoEGATE.jpg" alt="EGAT" class="h-11 w-24 shrink-0 rounded-md bg-white object-contain p-1 ring-1 ring-slate-200 sm:h-12 sm:w-28" />
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase text-sky-700">Main W10</p>
            <h1 class="break-words text-xl font-extrabold leading-tight text-slate-950 sm:text-2xl">
              Maintenance Dashboard
            </h1>
          </div>
        </div>

        <div class="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] lg:w-auto lg:grid-cols-[auto_auto]">
          <div class="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span class="block sm:inline">อัปเดตล่าสุด</span>
            <span class="break-words font-bold text-slate-900">{{ lastUpdated }}</span>
          </div>
          <button class="btn btn-outline btn-sm min-h-9 whitespace-normal leading-tight" :disabled="pending" @click="refresh()">
            อ่านข้อมูลใหม่
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1540px] px-3 py-4 sm:px-5">
      <div class="mb-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <button
          class="btn btn-sm min-h-9 whitespace-normal border-slate-200"
          :class="activeTab === 'dashboard' ? 'btn-primary text-white' : 'btn-ghost text-slate-700'"
          @click="activeTab = 'dashboard'"
        >
          แดชบอร์ด
        </button>
        <button
          class="btn btn-sm min-h-9 whitespace-normal border-slate-200"
          :class="activeTab === 'report' ? 'btn-primary text-white' : 'btn-ghost text-slate-700'"
          @click="activeTab = 'report'"
        >
          รายงานการ
        </button>
      </div>

      <div v-if="pending && !data" class="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">
        กำลังอ่านข้อมูลจาก Google Sheet...
      </div>

      <template v-if="activeTab === 'dashboard'">
      <section class="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="dashboard-card rounded-lg p-3 sm:p-4">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="min-h-[150px] rounded-lg bg-slate-950 p-4 text-white">
              <p class="break-words text-sm font-semibold text-slate-300">จำนวน W/O ทั้งหมด</p>
              <p class="mt-2 break-words text-4xl font-extrabold leading-none sm:text-5xl">{{ total.toLocaleString() }}</p>
              <p class="mt-3 break-words text-xs text-slate-400">ข้อมูลจาก Dashboard W10 All info</p>
            </div>

            <div v-for="card in statusCards" :key="card.title" class="min-h-[150px] rounded-lg border border-slate-200 p-4" :class="card.soft">
              <div class="mb-4 h-1.5 rounded-full" :class="card.accent"></div>
              <p class="break-words text-sm font-bold text-slate-600">{{ card.title }}</p>
              <p class="break-words text-xs text-slate-500">{{ card.subtitle }}</p>
              <div class="mt-3 flex min-w-0 items-end justify-between gap-2">
                <p class="break-words text-3xl font-extrabold leading-none" :class="card.text">{{ card.value.toLocaleString() }}</p>
                <p class="shrink-0 rounded bg-white/70 px-2 py-1 text-xs font-bold text-slate-600">{{ card.percent }}%</p>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-panel rounded-lg p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="break-words text-sm font-extrabold text-sky-950">ตัวกรองข้อมูลในชีต</p>
              <p class="break-words text-xs font-semibold text-sky-700">เลือกเดือนและปีให้เห็นชัดก่อนกดใช้ตัวกรอง</p>
            </div>
            <span class="shrink-0 rounded bg-sky-600 px-2 py-1 text-xs font-bold text-white">Filter</span>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <select v-model="selectedMonth" class="select select-sm filter-control w-full">
              <option value="all">ทุกเดือน</option>
              <option v-for="month in months" :key="month" :value="month">
                {{ month }}
              </option>
            </select>
            <select v-model="selectedYear" class="select select-sm filter-control w-full">
              <option value="all">ทุกปี</option>
              <option v-for="year in years" :key="year" :value="year">
                {{ Number(year) + 543 }}
              </option>
            </select>
          </div>
          <button class="btn btn-info btn-sm mt-3 min-h-9 w-full border-sky-700 bg-sky-700 text-white hover:border-sky-800 hover:bg-sky-800 whitespace-normal leading-tight" :disabled="isApplyingFilters || pending" @click="applyFilters">
            ใช้ตัวกรอง
          </button>
        </div>
      </section>

      <div v-if="error" class="alert alert-error mb-4 rounded-lg">
        <span class="break-words">โหลดข้อมูลไม่สำเร็จ: {{ error.message }}</span>
      </div>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div class="dashboard-card rounded-lg p-4 sm:p-5">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="break-words text-lg font-extrabold leading-tight text-slate-950">งานเข้ารายสัปดาห์</h2>
              <p class="break-words text-sm text-slate-500">W11-W14 รวมเข้า {{ (data?.w_all?.entrance || 0).toLocaleString() }}</p>
            </div>
            <span class="badge badge-neutral shrink-0 whitespace-normal">W_All</span>
          </div>

          <div class="grid h-72 grid-cols-4 items-end gap-3 border-b border-l border-slate-200 px-2 pb-2 sm:gap-5 sm:px-4">
            <div v-for="week in weeks" :key="week" class="flex h-full min-w-0 flex-col items-center justify-end gap-2">
              <div class="flex min-h-0 w-full flex-1 items-end">
                <div class="w-full rounded-t-md bg-gradient-to-t from-sky-700 to-cyan-400 transition-all duration-500" :style="{ height: weekHeight(week) }"></div>
              </div>
              <p class="break-words text-center text-sm font-extrabold leading-tight text-slate-950 sm:text-base">{{ (data?.groupStats[week].entrance || 0).toLocaleString() }}</p>
              <p class="text-center text-xs font-bold text-slate-500">{{ week }}</p>
            </div>
          </div>
        </div>

        <div class="dashboard-card rounded-lg p-4 sm:p-5">
          <h2 class="mb-5 break-words text-lg font-extrabold leading-tight text-slate-950">สถานะงานปัจจุบัน</h2>
          <div class="grid gap-5 md:grid-cols-[190px_minmax(0,1fr)]">
            <div class="mx-auto h-48 w-48 rounded-full p-7 shadow-inner" :style="{ background: `conic-gradient(#0284c7 0 ${percent(sap, total)}%, #10b981 ${percent(sap, total)}% ${Number(percent(sap + finish, total))}%, #f59e0b ${Number(percent(sap + finish, total))}% 100%)` }">
              <div class="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
                <div class="min-w-0 px-2">
                  <p class="text-xs font-bold text-slate-500">Total</p>
                  <p class="break-words text-2xl font-extrabold text-slate-950">{{ total.toLocaleString() }}</p>
                </div>
              </div>
            </div>
            <div class="space-y-3 self-center">
              <div v-for="card in statusCards" :key="card.title" class="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-3">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="h-3 w-3 shrink-0 rounded-full" :class="card.accent"></span>
                  <span class="break-words font-bold leading-tight text-slate-700">{{ card.title }}</span>
                </div>
                <span class="shrink-0 text-lg font-extrabold text-slate-950">{{ card.value.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)]">
        <div class="dashboard-card rounded-lg p-3 sm:p-4">
          <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="break-words text-base font-extrabold leading-tight text-slate-950 sm:text-lg">งานเข้าตามกลุ่มงาน</h2>
              <p class="break-words text-xs font-semibold text-slate-500">เปรียบเทียบยอดรวมของแต่ละ Equipment</p>
            </div>
            <span class="shrink-0 rounded bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">Equipment chart</span>
          </div>

          <div class="space-y-4">
            <div class="rounded-md border border-slate-200 bg-slate-50/80 p-3">
              <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <p class="break-words text-xs font-bold text-slate-600">กราฟแท่งแยกตาม W11-W14</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(item, index) in equipmentItems" :key="`legend-${item.name}`" class="inline-flex max-w-[150px] items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                    <span class="h-2.5 w-2.5 shrink-0 rounded" :style="{ backgroundColor: equipmentColor(index) }"></span>
                    <span class="truncate">{{ item.name || '-' }}</span>
                  </span>
                </div>
              </div>

              <div class="h-72 overflow-x-auto rounded bg-white p-3 ring-1 ring-slate-200">
                <div class="grid h-full min-w-[640px] grid-cols-4 gap-4 border-b border-l border-slate-200 px-3 pb-7">
                  <div v-for="(week, weekIndex) in weeks" :key="`equipment-week-${week}`" class="relative flex min-w-0 flex-col justify-end">
                    <div class="flex h-full items-end justify-center gap-1.5">
                      <div
                        v-for="(item, itemIndex) in equipmentItems"
                        :key="`${week}-${item.name}`"
                        class="group relative flex h-full min-w-[12px] flex-1 items-end justify-center"
                        :title="`${item.name || '-'} ${week}: ${(item.values[weekIndex] || 0).toLocaleString()}`"
                      >
                        <div
                          class="w-full rounded-t-sm transition-[height] duration-200"
                          :style="{
                            height: equipmentWeekBarHeight(item.values[weekIndex] || 0),
                            backgroundColor: equipmentColor(itemIndex),
                          }"
                        ></div>
                      </div>
                    </div>
                    <p class="absolute -bottom-6 left-0 right-0 text-center text-xs font-extrabold text-slate-600">{{ week }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-md border border-slate-200">
              <table class="table table-xs w-full min-w-[500px] table-fixed">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="w-[160px] whitespace-normal py-2">Equipment</th>
                    <th class="whitespace-normal px-1 py-2 text-center">W11</th>
                    <th class="whitespace-normal px-1 py-2 text-center">W12</th>
                    <th class="whitespace-normal px-1 py-2 text-center">W13</th>
                    <th class="whitespace-normal px-1 py-2 text-center">W14</th>
                    <th class="whitespace-normal px-1 py-2 text-center">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in equipmentItems" :key="item.name">
                    <td class="break-words py-2 text-xs font-bold leading-tight">{{ item.name || '-' }}</td>
                    <td v-for="(value, index) in item.values" :key="`${item.name}-${index}`" class="px-1 py-2 text-center text-xs font-semibold">{{ value }}</td>
                    <td class="px-1 py-2 text-center text-xs font-extrabold text-sky-700">{{ item.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      </template>

      <section v-else class="dashboard-card rounded-lg p-4 sm:p-5">
        <div>
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <h2 class="break-words text-lg font-extrabold leading-tight text-slate-950">รายการงาน</h2>
              <p class="break-words text-sm text-slate-500">แสดง 25 รายการแรก หรือค้นหาจาก ECM/W/O/รายละเอียด</p>
            </div>
            <input v-model="searchTerm" class="input input-sm search-input w-full lg:w-80" placeholder="ค้นหา ECM, W/O, รายละเอียด..." />
          </div>
          <div class="max-h-[430px] overflow-auto rounded-md border border-slate-200">
            <table class="table table-sm table-pin-rows min-w-[920px] table-fixed">
              <thead>
                <tr>
                  <th class="w-[110px] whitespace-normal">ECM</th>
                  <th class="w-[110px] whitespace-normal">W/O</th>
                  <th class="w-[300px] whitespace-normal">รายละเอียด</th>
                  <th class="w-[190px] whitespace-normal">Equipment</th>
                  <th class="w-[110px] whitespace-normal">วันที่</th>
                  <th class="w-[120px] whitespace-normal">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in filteredProjects" :key="project.id">
                  <td class="break-words font-semibold leading-tight">{{ project.ecm }}</td>
                  <td class="break-words leading-tight">{{ project.order }}</td>
                  <td class="break-words leading-tight">{{ project.name }}</td>
                  <td class="break-words leading-tight">{{ project.equipGroup }}</td>
                  <td class="break-words leading-tight">{{ project.date }}</td>
                  <td>
                    <span class="badge badge-sm h-auto min-h-6 whitespace-normal break-words px-2 py-1 leading-tight" :class="statusBadge(project.status)">
                      {{ project.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
