<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="9">
        <!-- Login -->
        <v-card v-if="!authed" class="rounded-2xl p-6">
          <v-card-title class="text-h6 font-bold">Admin Login</v-card-title>
          <v-card-text>
            <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              variant="outlined"
              autocomplete="current-password"
              class="rounded-xl"
              @keyup.enter="login"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="login" :loading="loading" class="rounded-xl" :aria-label="'Sign in'">
              Sign in
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Dashboard -->
        <div v-else>
          <!-- Top bar -->
          <v-card class="rounded-2xl mb-6 overflow-hidden sticky-card" elevation="2">
            <v-toolbar color="transparent" density="comfortable" class="px-4">
              <v-toolbar-title class="text-2xl font-extrabold">Dashboard</v-toolbar-title>
              <v-spacer />

              <v-chip
                v-if="lastLoadedAt"
                size="small"
                class="mr-2"
                variant="tonal"
                prepend-icon="mdi-clock-outline"
              >
                Updated {{ formatRelativeTime(lastLoadedAt) }}
              </v-chip>

              <v-select
                v-model="rangeDays"
                :items="rangeItems"
                density="compact"
                variant="outlined"
                class="mr-3 max-w-[160px] rounded-xl"
                hide-details
                :aria-label="'Select range'"
              />

              <v-btn-toggle
                v-model="displayCurrency"
                mandatory
                density="compact"
                variant="outlined"
                class="mr-3 rounded-xl"
                :aria-label="'Currency toggle'"
              >
                <v-btn value="USD" class="text-none px-3">USD</v-btn>
                <v-btn value="GYD" class="text-none px-3">GYD</v-btn>
              </v-btn-toggle>

              <v-btn icon class="mr-1" :loading="loadingData" @click="refresh" variant="text" :aria-label="'Refresh'">
                <v-tooltip activator="parent" location="bottom">Refresh</v-tooltip>
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
              <v-btn icon class="mr-1" :disabled="!recent.length || loadingData" @click="exportCSV" variant="text" :aria-label="'Export CSV'">
                <v-tooltip activator="parent" location="bottom">Export CSV</v-tooltip>
                <v-icon>mdi-download</v-icon>
              </v-btn>
              <v-btn icon class="mr-1" @click="toggleTheme" variant="text" :aria-label="'Toggle theme'">
                <v-tooltip activator="parent" location="bottom">Toggle theme</v-tooltip>
                <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
              </v-btn>
              <v-btn variant="tonal" class="rounded-xl" @click="logout">Logout</v-btn>
            </v-toolbar>

            <v-progress-linear v-if="loadingData" indeterminate height="2" color="primary" />
          </v-card>

          <!-- KPIs -->
          <v-row dense>
            <v-col cols="12" md="4">
              <v-card class="rounded-2xl p-5 kpi" elevation="2">
                <div class="flex items-center gap-3">
                  <v-avatar size="36" class="kpi-icon"><v-icon>mdi-chart-line</v-icon></v-avatar>
                  <div>
                    <div class="text-xs text-slate-500">Total searches</div>
                    <div class="text-3xl font-extrabold mt-1 tabular-nums">
                      <template v-if="!loadingData">{{ overview?.totals?.all ?? '—' }}</template>
                      <v-skeleton-loader v-else type="text" class="w-24 h-7" />
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="rounded-2xl p-5 kpi" elevation="2">
                <div class="flex items-center gap-3">
                  <v-avatar size="36" class="kpi-icon"><v-icon>mdi-calendar-clock</v-icon></v-avatar>
                  <div>
                    <div class="text-xs text-slate-500">Searches last 24h</div>
                    <div class="text-3xl font-extrabold mt-1 tabular-nums">
                      <template v-if="!loadingData">{{ overview?.totals?.last24h ?? '—' }}</template>
                      <v-skeleton-loader v-else type="text" class="w-24 h-7" />
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="rounded-2xl p-5 kpi" elevation="2">
                <div class="flex items-center gap-3">
                  <v-avatar size="36" class="kpi-icon"><v-icon>mdi-clock-outline</v-icon></v-avatar>
                  <div>
                    <div class="text-xs text-slate-500">Most recent search</div>
                    <div class="text-base font-bold mt-1">
                      <template v-if="!loadingData">
                        {{ overview?.latest ? formatDateTime(overview.latest) : '—' }}
                      </template>
                      <v-skeleton-loader v-else type="text" class="w-40 h-5" />
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Daily searches -->
          <v-card class="rounded-2xl p-5 mt-6">
            <div class="section-title">Daily searches & avg CIF ({{ rangeDays }}d)</div>
            <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl" /></div>
            <div v-else>
              <div v-if="!daily.length" class="py-8 text-center text-medium-emphasis">No data yet</div>
              <v-chart v-else :option="dailyOption" autoresize style="height:300px" />
            </div>
          </v-card>

          <!-- Top vehicles + table -->
          <v-card class="rounded-2xl p-5 mt-6">
            <div class="section-title flex items-center justify-between">
              <span>Top vehicle types ({{ Math.min(rangeDays, 90) }}d)</span>
              <div class="flex items-center gap-3">
                <v-select
                  v-model="vehicleLimit"
                  :items="vehicleLimitItems"
                  density="compact"
                  variant="outlined"
                  class="max-w-[120px] rounded-xl"
                  hide-details
                />
              </div>
            </div>
            <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl mb-6" /></div>
            <div v-else>
              <div v-if="!topVehiclesLimited.length" class="py-8 text-center text-medium-emphasis">No data yet</div>
              <v-chart v-else :option="vehicleOption" autoresize style="height:300px" class="mb-6" />
            </div>

            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Vehicle type</th>
                  <th>Searches</th>
                  <th>Median CIF ({{ displayCurrency }})</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in topVehiclesLimited" :key="r.vehicle_type">
                  <td>{{ r.vehicle_type }}</td>
                  <td class="tabular-nums">{{ r.searches?.toLocaleString?.() ?? r.searches }}</td>
                  <td class="tabular-nums">{{ fmtFromUSD(r.median_cif) }}</td>
                </tr>
                <tr v-if="!topVehiclesLimited.length && !loadingData">
                  <td colspan="3">No data yet</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <!-- CIF distribution -->
          <v-card class="rounded-2xl p-5 mt-6">
            <div class="section-title">CIF ({{ displayCurrency }}) distribution ({{ Math.min(rangeDays, 30) }}d)</div>
            <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl" /></div>
            <div v-else>
              <div v-if="!cifHist.length" class="py-8 text-center text-medium-emphasis">No data yet</div>
              <v-chart v-else :option="cifOption" autoresize style="height:300px" />
            </div>
          </v-card>

          <!-- Propulsion mix -->
          <v-card class="rounded-2xl p-5 mt-6">
            <div class="section-title">Propulsion mix (90d)</div>
            <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl" /></div>
            <div v-else>
              <div v-if="!propulsion.length" class="py-8 text-center text-medium-emphasis">No data yet</div>
              <v-chart v-else :option="propulsionOption" autoresize style="height:300px" />
            </div>
          </v-card>

          <!-- Recent searches table -->
          <v-card class="rounded-2xl p-5 mt-6">
            <div class="section-title flex items-center justify-between">
              <span>Recent searches</span>
              <v-text-field
                v-model="recentQuery"
                placeholder="Filter…"
                density="comfortable"
                variant="outlined"
                hide-details
                class="max-w-[220px] rounded-xl"
                clearable
              />
            </div>
            <v-data-table
              :headers="recentHeaders"
              :items="filteredRecent"
              :items-per-page="10"
              density="comfortable"
              class="rounded-xl"
              fixed-header
              height="520"
            >
              <template #item.created_at="{ item }">
                {{ formatDateTime(item.created_at) }}
              </template>
              <template #item.cif_usd="{ item }">
                <span class="tabular-nums">{{ fmtFromUSD(item.cif_usd, item.exchange_rate) }}</span>
              </template>
              <template #item.total_tax="{ item }">
                <span class="tabular-nums">{{ fmtFromGYD(item.total_tax, item.exchange_rate) }}</span>
              </template>
              <template #item.total_cost="{ item }">
                <span class="tabular-nums">{{ fmtFromGYD(item.total_cost, item.exchange_rate) }}</span>
              </template>
              <template #no-data>
                <div class="py-6 text-center text-medium-emphasis">No data yet</div>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snack.show" :timeout="2500">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import { formatCurrency, usdToGyd } from '../utils/currency'

// --- Safe storage (SSR friendly) ---
const isClient = typeof window !== 'undefined'
function lsGet(key: string, fallback: string) {
  if (!isClient) return fallback
  try { const v = window.localStorage.getItem(key); return v ?? fallback } catch { return fallback }
}
function lsSet(key: string, value: string) {
  if (!isClient) return
  try { window.localStorage.setItem(key, value) } catch {}
}

// --- Types (non-breaking: just annotations) ---
type Overview = { totals: { all: number; last24h: number }; latest?: string }
type VehicleRow = { vehicle_type: string; searches: number; median_cif: number }
type SearchRow = {
  created_at: string | number | Date
  vehicle_type: string
  propulsion: string
  vehicle_year?: number
  engine_cc?: number
  cif_usd: number
  total_tax: number
  total_cost: number
  exchange_rate?: number
}
type CIFBucket = { min: number; max: number; count: number }
type PropulsionRow = { propulsion: string; count: number }

// Dynamically import VChart only on the client side to prevent SSR errors.
const VChart = defineAsyncComponent(async () => {
  const { use } = await import('echarts/core')
  const { CanvasRenderer } = await import('echarts/renderers')
  const { BarChart, LineChart, PieChart } = await import('echarts/charts')
  const { GridComponent, TooltipComponent, LegendComponent } = await import('echarts/components')
  const VChartComponent = await import('vue-echarts')
  use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])
  return VChartComponent.default
})

// --- State ---
const authed = ref(false)
const loading = ref(false)
const loadingData = ref(false)
const err = ref<string | null>(null)
const password = ref('')

const overview = ref<Overview | null>(null)
const topVehicles = ref<VehicleRow[]>([])
const recent = ref<SearchRow[]>([])
const daily = ref<any[]>([])
const cifHist = ref<CIFBucket[]>([])
const propulsion = ref<PropulsionRow[]>([])

const snack = ref({ show: false, msg: '' })
const lastLoadedAt = ref<Date | null>(null)

// range selector (server endpoints accept ?days=; if not, they’ll still return defaults)
const rangeDays = ref<number>(Number(lsGet('dash.rangeDays', '30')) || 30)
const rangeItems = [7, 30, 60, 90].map((v) => ({ title: `${v} days`, value: v }))

// currency + theme + filters
const displayCurrency = ref<'USD' | 'GYD'>(lsGet('dash.currency', 'USD') as 'USD' | 'GYD')
const exchangeRate = ref(208.5)
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}
const vehicleLimit = ref(5)
const vehicleLimitItems = [5, 10, 15].map((v) => ({ title: `Top ${v}`, value: v }))
const topVehiclesLimited = computed(() => topVehicles.value.slice(0, vehicleLimit.value))

const recentQuery = ref('')
const filteredRecent = computed(() => {
  const q = recentQuery.value.trim().toLowerCase()
  if (!q) return recent.value
  return recent.value.filter((r) =>
    [r.vehicle_type, r.propulsion, String(r.vehicle_year ?? ''), String(r.engine_cc ?? '')]
      .filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(q))
  )
})

// --- Utils ---
function formatDateTime(v: string | number | Date) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return String(v)
  }
}
function formatRelativeTime(d: Date) {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
function fmtFromUSD(valUsd: number, rate?: number) {
  const r = rate ?? exchangeRate.value
  return formatCurrency(usdToGyd(valUsd, r), displayCurrency.value, r)
}
function fmtFromGYD(valGyd: number, rate?: number) {
  const r = rate ?? exchangeRate.value
  return formatCurrency(valGyd, displayCurrency.value, r)
}

const recentHeaders = computed(() => [
  { title: 'When', key: 'created_at', sortable: true },
  { title: 'Type', key: 'vehicle_type' },
  { title: 'Fuel', key: 'propulsion' },
  { title: 'Year', key: 'vehicle_year', align: 'end' },
  { title: 'CC/KW', key: 'engine_cc', align: 'end' },
  { title: `CIF (${displayCurrency.value})`, key: 'cif_usd', align: 'end' },
  { title: `Total tax (${displayCurrency.value})`, key: 'total_tax', align: 'end' },
  { title: `Total cost (${displayCurrency.value})`, key: 'total_cost', align: 'end' }
])

// Theme-aware chart colors
const chartTextColor = computed(() => (isDark.value ? '#e5e7eb' : '#334155'))
const chartAxisLine = computed(() => (isDark.value ? '#475569' : '#cbd5e1'))
const chartGridLine = computed(() => (isDark.value ? '#334155' : '#e2e8f0'))

function cssVar(name: string) {
  if (!isClient) return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
const themeColors = computed(() => ({
  primary: cssVar('--v-theme-primary') || '#6366F1',
  info: cssVar('--v-theme-info') || '#0ea5e9',
  success: cssVar('--v-theme-success') || '#22c55e',
  warning: cssVar('--v-theme-warning') || '#eab308'
}))

// ----- ECharts options -----
const dailyOption = computed(() => {
  const count = daily.value.map((r: any) => r.count)
  const avgData = daily.value.map((r: any) =>
    displayCurrency.value === 'USD' ? r.avg_cif : r.avg_cif * exchangeRate.value
  )
  return {
    color: [themeColors.value.primary, themeColors.value.info],
    grid: { left: 48, right: 64, top: 24, bottom: 36, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: { textStyle: { color: chartTextColor.value } },
    xAxis: {
      type: 'category',
      data: daily.value.map((r: any) => r.date),
      axisLabel: { color: chartTextColor.value }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Searches',
        axisLabel: { color: chartTextColor.value },
        axisLine: { lineStyle: { color: chartAxisLine.value } },
        splitLine: { lineStyle: { color: chartGridLine.value } }
      },
      {
        type: 'value',
        name: `Avg CIF (${displayCurrency.value})`,
        axisLabel: {
          color: chartTextColor.value,
          formatter: (v: number) =>
            displayCurrency.value === 'USD' ? `$${v.toLocaleString()}` : `GY$${v.toLocaleString()}`
        },
        axisLine: { lineStyle: { color: chartAxisLine.value } },
        splitLine: { show: false }
      }
    ],
    series: [
      { name: 'Searches', type: 'bar', data: count, barMaxWidth: 24 },
      { name: `Avg CIF (${displayCurrency.value})`, type: 'line', yAxisIndex: 1, smooth: true, data: avgData }
    ]
  }
})

const vehicleOption = computed(() => ({
  color: [themeColors.value.primary],
  grid: { left: 120, right: 24, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'value',
    axisLabel: { color: chartTextColor.value },
    axisLine: { lineStyle: { color: chartAxisLine.value } },
    splitLine: { lineStyle: { color: chartGridLine.value } }
  },
  yAxis: { type: 'category', data: topVehiclesLimited.value.map((r: any) => r.vehicle_type), axisLabel: { color: chartTextColor.value } },
  series: [{ type: 'bar', data: topVehiclesLimited.value.map((r: any) => r.searches), barMaxWidth: 24 }]
}))

const cifOption = computed(() => ({
  color: [themeColors.value.primary],
  grid: { left: 48, right: 24, top: 10, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: cifHist.value.map((b: CIFBucket) => {
      const min = displayCurrency.value === 'USD' ? b.min : b.min * exchangeRate.value
      const max = displayCurrency.value === 'USD' ? b.max : b.max * exchangeRate.value
      const prefix = displayCurrency.value === 'USD' ? '$' : 'GY$'
      return `${prefix}${Math.round(min).toLocaleString()}–${prefix}${Math.round(max).toLocaleString()}`
    }),
    axisLabel: { color: chartTextColor.value },
    axisLine: { lineStyle: { color: chartAxisLine.value } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: chartTextColor.value },
    axisLine: { lineStyle: { color: chartAxisLine.value } },
    splitLine: { lineStyle: { color: chartGridLine.value } }
  },
  series: [{ type: 'bar', data: cifHist.value.map((b: CIFBucket) => b.count), barMaxWidth: 24 }]
}))

const propulsionOption = computed(() => ({
  tooltip: { trigger: 'item', valueFormatter: (v: any) => Number(v).toLocaleString() },
  legend: { orient: 'vertical', left: 'left', textStyle: { color: chartTextColor.value } },
  series: [
    {
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: propulsion.value.map((r: PropulsionRow) => ({ name: r.propulsion, value: r.count }))
    }
  ]
}))

// ----- Auth + data -----
async function check() {
  const r = await $fetch<{ ok: boolean }>('/api/admin/me').catch(() => ({ ok: false }))
  authed.value = !!r.ok
  if (authed.value) await load()
}
async function login() {
  loading.value = true
  err.value = null
  const r = await $fetch<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: { password: password.value } }).catch(() => ({ ok: false }))
  loading.value = false
  if (!r.ok) {
    err.value = 'Invalid password'
    return
  }
  password.value = ''
  authed.value = true
  await load()
}
async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
  authed.value = false
  snack.value = { show: true, msg: 'Logged out' }
}

async function load() {
  loadingData.value = true
  try {
    const qs = `?days=${rangeDays.value}`
    const [ov, tv, rc, dl, hist, prop] = await Promise.all([
      $fetch('/api/admin/overview'),
      $fetch(`/api/admin/top-vehicles${qs}`).catch(() => ({ rows: [] })),
      $fetch('/api/admin/recent'),
      $fetch(`/api/admin/daily-events${qs}`).catch(() => ({ rows: [] })),
      $fetch(`/api/admin/cif-histogram${qs}`).catch(() => ({ buckets: [] })),
      $fetch(`/api/admin/propulsion-breakdown?days=90`).catch(() => ({ rows: [] }))
    ])
    overview.value = ov as Overview
    topVehicles.value = (tv as any).rows ?? []
    recent.value = (rc as any).rows ?? []
    daily.value = (dl as any).rows ?? []
    cifHist.value = (hist as any).buckets ?? []
    propulsion.value = (prop as any).rows ?? []
    // Prefer latest exchange rate observed in recent rows
    const ex = (rc as any).rows?.[0]?.exchange_rate
    if (ex && typeof ex === 'number') exchangeRate.value = ex
    lastLoadedAt.value = new Date()
  } catch (e) {
    console.error(e)
    snack.value = { show: true, msg: 'Failed to load data' }
  } finally {
    loadingData.value = false
  }
}
function refresh() {
  load()
}

function exportCSV() {
  const rows = recent.value
  if (!rows.length) return
  const header = ['When', 'Type', 'Fuel', 'Year', 'CC/KW', 'CIF (USD)', 'Total tax (GYD)', 'Total cost (GYD)']
  const csv = [
    header.join(','),
    ...rows.map((r) => [
      `"${formatDateTime(r.created_at)}"`,
      r.vehicle_type,
      r.propulsion,
      r.vehicle_year ?? '',
      r.engine_cc ?? '',
      r.cif_usd ?? '',
      r.total_tax ?? '',
      r.total_cost ?? ''
    ].join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `searches_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(check)
// Rehydrate prefs on client in case SSR used fallbacks
onMounted(() => {
  rangeDays.value = Number(lsGet('dash.rangeDays', String(rangeDays.value))) || rangeDays.value
  displayCurrency.value = (lsGet('dash.currency', displayCurrency.value as string) as 'USD' | 'GYD')
})
watch(rangeDays, (v) => {
  lsSet('dash.rangeDays', String(v))
  authed.value && load()
})
watch(displayCurrency, (v) => lsSet('dash.currency', v))
</script>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* replaces @apply text-h6 font-bold mb-3 */
.section-title {
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
}
@media (min-width: 768px) {
  .section-title {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}

.kpi .kpi-icon {
  background: rgba(99, 102, 241, 0.12);
  color: rgb(99, 102, 241);
}

/* Subtle card hover for tables */
:deep(.v-data-table) tbody tr:hover {
  background-color: rgba(148, 163, 184, 0.08);
}
.sticky-card{ position: sticky; top: 12px; z-index: 5; }
</style>
