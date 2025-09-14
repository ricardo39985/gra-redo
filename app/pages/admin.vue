<template>
    <v-container class="py-12">
        <v-row justify="center">
            <v-col cols="12" md="8" lg="7">
                <!-- Login -->
                <v-card v-if="!authed" class="rounded-2xl p-6">
                    <v-card-title class="text-h6 font-bold">Admin Login</v-card-title>
                    <v-card-text>
                        <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>
                        <v-text-field v-model="password" label="Password" type="password" variant="outlined"
                            class="rounded-xl" />
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn color="primary" @click="login" :loading="loading" class="rounded-xl">Sign in</v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Dashboard -->
                <div v-else>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-extrabold">Dashboard</h2>
                        <v-btn variant="tonal" @click="logout" class="rounded-xl">Logout</v-btn>
                    </div>

                    <v-row>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5">
                                <div class="text-sm text-slate-500">Total events</div>
                                <div class="text-3xl font-extrabold mt-2">{{ overview?.totals.all ?? '—' }}</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5">
                                <div class="text-sm text-slate-500">Last 24h</div>
                                <div class="text-3xl font-extrabold mt-2">{{ overview?.totals.last24h ?? '—' }}</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card class="rounded-2xl p-5">
                                <div class="text-sm text-slate-500">Latest event</div>
                                <div class="text-lg font-bold mt-2">{{ overview?.latest ? new
                                    Date(overview.latest).toLocaleString() : '—' }}</div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="text-h6 font-bold mb-3">Daily events (30d)</div>
                        <v-chart :option="dailyOption" autoresize style="height:300px" />
                    </v-card>

                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="text-h6 font-bold mb-3">Top vehicle types (90d)</div>
                        <v-chart :option="vehicleOption" autoresize style="height:300px" class="mb-6" />
                        <v-table density="comfortable">
                            <thead>
                                <tr>
                                    <th>Vehicle type</th>
                                    <th>Searches</th>
                                    <th>Median CIF (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in topVehicles" :key="r.vehicle_type">
                                    <td>{{ r.vehicle_type }}</td>
                                    <td class="tabular-nums">{{ r.searches }}</td>
                                    <td class="tabular-nums">{{ fmtUSD(r.median_cif) }}</td>
                                </tr>
                                <tr v-if="!topVehicles.length">
                                    <td colspan="3">No data yet</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>

                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="text-h6 font-bold mb-3">CIF (USD) distribution (30d)</div>
                        <v-chart :option="cifOption" autoresize style="height:300px" />
                    </v-card>

                    <v-card class="rounded-2xl p-5 mt-6">
                        <div class="text-h6 font-bold mb-3">Recent events</div>
                        <v-table density="comfortable">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Type</th>
                                    <th>Fuel</th>
                                    <th>Year</th>
                                    <th>CC/KW</th>
                                    <th>CIF (USD)</th>
                                    <th>Total tax (GYD)</th>
                                    <th>Total cost (GYD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in recent" :key="r.created_at + r.cif_usd">
                                    <td>{{ new Date(r.created_at).toLocaleString() }}</td>
                                    <td>{{ r.vehicle_type }}</td>
                                    <td class="capitalize">{{ r.propulsion }}</td>
                                    <td class="tabular-nums">{{ r.vehicle_year }}</td>
                                    <td class="tabular-nums">{{ r.engine_cc ?? '—' }}</td>
                                    <td class="tabular-nums">{{ fmtUSD(r.cif_usd) }}</td>
                                    <td class="tabular-nums">{{ fmtGYD(r.total_tax) }}</td>
                                    <td class="tabular-nums">{{ fmtGYD(r.total_cost) }}</td>
                                </tr>
                                <tr v-if="!recent.length">
                                    <td colspan="8">No data yet</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const authed = ref(false);
const loading = ref(false);
const err = ref<string | null>(null);
const password = ref('');

const overview = ref<any>(null);
const topVehicles = ref<any[]>([]);
const recent = ref<any[]>([]);
const daily = ref<any[]>([]);
const cifHist = ref<any[]>([]);

function fmtUSD(n: number) { return n == null ? '—' : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}` }
function fmtGYD(n: number) { return n == null ? '—' : `GYD ${Number(n).toLocaleString()}` }

const dailyOption = computed(() => ({
    xAxis: { type: 'category', data: daily.value.map((r: any) => r.date) },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'line', areaStyle: {}, data: daily.value.map((r: any) => r.count) }]
}));

const vehicleOption = computed(() => ({
    xAxis: { type: 'category', data: topVehicles.value.map((r: any) => r.vehicle_type) },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'bar', data: topVehicles.value.map((r: any) => r.searches) }]
}));

const cifOption = computed(() => ({
    xAxis: { type: 'category', data: cifHist.value.map((b: any) => `$${Math.round(b.min)}-$${Math.round(b.max)}`) },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'bar', data: cifHist.value.map((b: any) => b.count) }]
}));

async function check() {
    const r = await $fetch<{ ok: boolean }>('/api/admin/me');
    authed.value = !!r.ok;
    if (authed.value) await load();
}
async function login() {
    loading.value = true; err.value = null;
    const r = await $fetch<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: { password: password.value } }).catch(() => ({ ok: false }));
    loading.value = false;
    if (!r.ok) { err.value = 'Invalid password'; return; }
    password.value = '';
    authed.value = true;
    await load();
}
async function logout() {
    await $fetch('/api/admin/logout', { method: 'POST' });
    authed.value = false;
}
async function load() {
    const [ov, tv, rc, dl, hist] = await Promise.all([
        $fetch('/api/admin/overview'),
        $fetch('/api/admin/top-vehicles').catch(() => ({ ok: false, rows: [] })),
        $fetch('/api/admin/recent'),
        $fetch('/api/admin/daily-events').catch(() => ({ rows: [] })),
        $fetch('/api/admin/cif-histogram').catch(() => ({ buckets: [] }))
    ]);
    overview.value = ov;
    topVehicles.value = (tv as any).rows ?? [];
    recent.value = (rc as any).rows ?? [];
    daily.value = (dl as any).rows ?? [];
    cifHist.value = (hist as any).buckets ?? [];
}
onMounted(check);
</script>

<style scoped>
.tabular-nums {
    font-variant-numeric: tabular-nums;
}

.capitalize {
    text-transform: capitalize;
}
</style>
