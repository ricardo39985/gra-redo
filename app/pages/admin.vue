<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="10" lg="9">

                <!-- Login -->
                <v-card v-if="!authed" class="rounded-2xl p-6">
                    <v-card-title class="text-h6 font-bold">Admin Login</v-card-title>
                    <v-card-text>
                        <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>
                        <v-text-field v-model="password" label="Password" type="password" variant="outlined"
                            class="rounded-xl" @keyup.enter="login" />
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn color="primary" @click="login" :loading="loading" class="rounded-xl">Sign in</v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Dashboard -->
                <div v-else>
                    <!-- Top bar -->
                    <v-card class="rounded-2xl mb-6">
                        <v-toolbar color="transparent" density="comfortable" class="px-4">
                            <v-toolbar-title class="text-2xl font-extrabold">Dashboard</v-toolbar-title>
                            <v-spacer />
                            <v-select v-model="rangeDays" :items="rangeItems" density="compact" variant="outlined"
                                class="mr-3 max-w-[140px] rounded-xl" hide-details />
                            <v-btn-toggle v-model="displayCurrency" mandatory density="compact" variant="outlined"
                                class="mr-3 rounded-xl">
                                <v-btn value="USD" class="text-none px-3">USD</v-btn>
                                <v-btn value="GYD" class="text-none px-3">GYD</v-btn>
                            </v-btn-toggle>
                            <v-btn icon class="mr-1" :loading="loadingData" @click="refresh" variant="text">
                                <v-tooltip activator="parent" location="bottom">Refresh</v-tooltip>
                                <v-icon>mdi-refresh</v-icon>
                            </v-btn>
                            <v-btn icon class="mr-1" :disabled="!recent.length" @click="exportCSV" variant="text">
                                <v-tooltip activator="parent" location="bottom">Export CSV</v-tooltip>
                                <v-icon>mdi-download</v-icon>
                            </v-btn>
                            <v-btn icon class="mr-1" @click="toggleTheme" variant="text">
                                <v-tooltip activator="parent" location="bottom">Toggle theme</v-tooltip>
                                <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
                            </v-btn>
                            <v-btn variant="tonal" class="rounded-xl" @click="logout">Logout</v-btn>
                        </v-toolbar>
                    </v-card>

                    <!-- KPIs -->
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5 kpi">
                                <div class="flex items-center gap-3">
                                    <v-avatar size="36" class="kpi-icon"><v-icon>mdi-chart-line</v-icon></v-avatar>
                                    <div>
                                        <div class="text-xs text-slate-500">Total searches</div>
                                        <div class="text-3xl font-extrabold mt-1 tabular-nums">
                                            <template v-if="!loadingData">{{ overview?.totals.all ?? '—' }}</template>
                                            <v-skeleton-loader v-else type="text" class="w-24 h-7" />
                                        </div>
                                    </div>
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5 kpi">
                                <div class="flex items-center gap-3">
                                    <v-avatar size="36" class="kpi-icon"><v-icon>mdi-calendar-clock</v-icon></v-avatar>
                                    <div>
                                        <div class="text-xs text-slate-500">Searches last 24h</div>
                                        <div class="text-3xl font-extrabold mt-1 tabular-nums">
                                            <template v-if="!loadingData">{{ overview?.totals.last24h ?? '—'
                                            }}</template>
                                            <v-skeleton-loader v-else type="text" class="w-24 h-7" />
                                        </div>
                                    </div>
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5 kpi">
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
                        <v-chart v-else :option="dailyOption" autoresize style="height:300px" />
                    </v-card>

                    <!-- Top vehicles + table -->
                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="section-title flex items-center justify-between">
                            <span>Top vehicle types ({{ Math.min(rangeDays, 90) }}d)</span>
                            <v-select v-model="vehicleLimit" :items="vehicleLimitItems" density="compact" variant="outlined"
                                class="max-w-[110px] rounded-xl" hide-details />
                        </div>
                        <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl mb-6" />
                        </div>
                        <v-chart v-else :option="vehicleOption" autoresize style="height:300px" class="mb-6" />
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
                                    <td class="tabular-nums">{{ r.searches }}</td>
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
                        <v-chart v-else :option="cifOption" autoresize style="height:300px" />
                    </v-card>

                    <!-- Propulsion mix -->
                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="section-title">Propulsion mix (90d)</div>
                        <div v-if="loadingData"><v-skeleton-loader type="image" class="h-[300px] rounded-xl" />
                        </div>
                        <v-chart v-else :option="propulsionOption" autoresize style="height:300px" />
                    </v-card>

                    <!-- Recent searches table -->
                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="section-title">Recent searches</div>
                        <v-data-table :headers="recentHeaders" :items="recent" density="comfortable"
                            :items-per-page="10" class="rounded-xl">
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

// Dynamically import VChart only on the client side to prevent SSR errors.
const VChart = defineAsyncComponent(async () => {
    const { use } = await import('echarts/core')
    const { CanvasRenderer } = await import('echarts/renderers')
    const { BarChart, LineChart, PieChart } = await import('echarts/charts')
    const { GridComponent, TooltipComponent, LegendComponent } = await import('echarts/components')
    const VChartComponent = await import('vue-echarts')
    use([
        CanvasRenderer, BarChart, LineChart, PieChart,
        GridComponent, TooltipComponent, LegendComponent
    ])
    return VChartComponent.default
})

const authed = ref(false)
const loading = ref(false)
const loadingData = ref(false)
const err = ref<string | null>(null)
const password = ref('')

const overview = ref<any>(null)
const topVehicles = ref<any[]>([])
const recent = ref<any[]>([])
const daily = ref<any[]>([])
const cifHist = ref<any[]>([])
const propulsion = ref<any[]>([])

const snack = ref({ show: false, msg: '' })

// range selector (server endpoints accept ?days=; if not, they’ll still return defaults)
const rangeDays = ref(30)
const rangeItems = [30, 60, 90].map(v => ({ title: `${v} days`, value: v }))

// currency + theme + filters
const displayCurrency = ref<'USD' | 'GYD'>('USD')
const exchangeRate = ref(208.5)
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme() {
    theme.global.name.value = isDark.value ? 'light' : 'dark'
}
const vehicleLimit = ref(5)
const vehicleLimitItems = [5, 10, 15].map(v => ({ title: `Top ${v}`, value: v }))
const topVehiclesLimited = computed(() => topVehicles.value.slice(0, vehicleLimit.value))

function formatDateTime(v: string | number | Date) { return new Date(v).toLocaleString() }
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
    { title: `Total cost (${displayCurrency.value})`, key: 'total_cost', align: 'end' },
])

// ----- ECharts options -----
const dailyOption = computed(() => {
    const avgData = daily.value.map((r: any) =>
        displayCurrency.value === 'USD' ? r.avg_cif : r.avg_cif * exchangeRate.value
    )
    return {
        grid: { left: 48, right: 64, top: 24, bottom: 36, containLabel: true },
        tooltip: {
            trigger: 'axis',
            valueFormatter: (v: any) => typeof v === 'number' ? v.toLocaleString() : v
        },
        legend: {},
        xAxis: { type: 'category', data: daily.value.map((r: any) => r.date) },
        yAxis: [
            { type: 'value', name: 'Searches' },
            {
                type: 'value',
                name: `Avg CIF (${displayCurrency.value})`,
                axisLabel: {
                    formatter: (v: number) =>
                        displayCurrency.value === 'USD'
                            ? `$${v.toLocaleString()}`
                            : `GY$${v.toLocaleString()}`
                }
            }
        ],
        series: [
            { name: 'Searches', type: 'bar', data: daily.value.map((r: any) => r.count), barMaxWidth: 24 },
            { name: `Avg CIF (${displayCurrency.value})`, type: 'line', yAxisIndex: 1, smooth: true, data: avgData }
        ]
    }
})

const vehicleOption = computed(() => ({
    grid: { left: 120, right: 24, top: 10, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: topVehiclesLimited.value.map((r: any) => r.vehicle_type) },
    series: [{ type: 'bar', data: topVehiclesLimited.value.map((r: any) => r.searches), barMaxWidth: 24 }]
}))

const cifOption = computed(() => ({
    grid: { left: 48, right: 24, top: 10, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
        type: 'category',
        data: cifHist.value.map((b: any) => {
            const min = displayCurrency.value === 'USD' ? b.min : b.min * exchangeRate.value
            const max = displayCurrency.value === 'USD' ? b.max : b.max * exchangeRate.value
            const prefix = displayCurrency.value === 'USD' ? '$' : 'GY$'
            return `${prefix}${Math.round(min).toLocaleString()}–${prefix}${Math.round(max).toLocaleString()}`
        })
    },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: cifHist.value.map((b: any) => b.count), barMaxWidth: 24 }]
}))

const propulsionOption = computed(() => ({
    tooltip: { trigger: 'item', valueFormatter: (v: any) => v.toLocaleString() },
    legend: { orient: 'vertical', left: 'left' },
    series: [{ type: 'pie', radius: '70%', data: propulsion.value.map((r: any) => ({ name: r.propulsion, value: r.count })) }]
}))

// ----- Auth + data -----
async function check() {
    const r = await $fetch<{ ok: boolean }>('/api/admin/me').catch(() => ({ ok: false }))
    authed.value = !!r.ok
    if (authed.value) await load()
}
async function login() {
    loading.value = true; err.value = null
    const r = await $fetch<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: { password: password.value } }).catch(() => ({ ok: false }))
    loading.value = false
    if (!r.ok) { err.value = 'Invalid password'; return }
    password.value = ''
    authed.value = true
    await load()
}
async function logout() {
    await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => { })
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
            $fetch(`/api/admin/propulsion-breakdown?days=90`).catch(() => ({ rows: [] })),
        ])
        overview.value = ov
        topVehicles.value = (tv as any).rows ?? []
        recent.value = (rc as any).rows ?? []
        daily.value = (dl as any).rows ?? []
        cifHist.value = (hist as any).buckets ?? []
        propulsion.value = (prop as any).rows ?? []
        exchangeRate.value = (rc as any).rows?.[0]?.exchange_rate ?? exchangeRate.value
    } finally {
        loadingData.value = false
    }
}
function refresh() { load() }

function exportCSV() {
    const rows = recent.value
    if (!rows.length) return
    const header = ['When', 'Type', 'Fuel', 'Year', 'CC/KW', 'CIF (USD)', 'Total tax (GYD)', 'Total cost (GYD)']
    const csv = [
        header.join(','),
        ...rows.map(r => [
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
watch(rangeDays, () => authed.value && load())
</script>

<style scoped>
.tabular-nums {
    font-variant-numeric: tabular-nums;
}

/* replaces @apply text-h6 font-bold mb-3 */
.section-title {
    font-weight: 700;
    /* font-bold */
    margin-bottom: 0.75rem;
    /* mb-3 */
    font-size: 1.25rem;
    /* ~ text-xl */
    line-height: 1.75rem;
}

@media (min-width: 768px) {
    .section-title {
        font-size: 1.5rem;
        /* ~ text-2xl */
        line-height: 2rem;
    }
}

.kpi .kpi-icon {
    background: rgba(99, 102, 241, .12);
    color: rgb(99, 102, 241);
}
</style>
