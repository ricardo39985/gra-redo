<template>
      <NuxtPage v-if="route.path.startsWith('/admin')" />

    <v-app v-else
        class="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 relative overflow-x-hidden">
        <!-- Decorative background (clipped; no horizontal overflow on mobile) -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                class="hidden md:block absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-violet-400 to-sky-300 dark:from-violet-600 dark:to-sky-500">
            </div>
            <div
                class="hidden md:block absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-15 bg-gradient-to-tr from-emerald-300 to-cyan-300 dark:from-emerald-500 dark:to-cyan-500">
            </div>
            <div
                class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.02),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03),transparent_70%)]">
            </div>
        </div>

        <!-- App Bar -->
        <v-app-bar app flat density="compact"
            class="app-bar-gradient backdrop-blur-lg border-b border-slate-900/5 dark:border-white/5">
            <!-- Make title shrinkable & truncatable so it never pushes content sideways -->
            <v-app-bar-title class="font-bold tracking-tight text-lg !p-0 min-w-0 flex-1 overflow-hidden">
                <!-- Desktop title -->
                <span
                    class="hidden sm:inline bg-gradient-to-r from-violet-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent truncate">
                    GRA Tax Calculator
                </span>
                <!-- Mobile title -->
                <span
                    class="inline sm:hidden bg-gradient-to-r from-violet-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent truncate">
                    GRA Calc
                </span>
            </v-app-bar-title>

            <v-spacer></v-spacer>

            <v-btn icon @click="toggleTheme" variant="text"
                class="rounded-full ring-1 ring-black/5 hover:ring-black/10 transition-shadow shrink-0">
                <v-tooltip activator="parent" location="bottom">Toggle theme</v-tooltip>
                <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
            </v-btn>
        </v-app-bar>

        <!-- Disclaimer Dialog -->
        <v-dialog v-model="showDisclaimer" persistent max-width="560">
            <v-card
                class="rounded-2xl shadow-md ring-1 ring-slate-900/5 dark:ring-white/5 bg-slate-50/95 dark:bg-slate-900/95">
                <v-card-title class="text-h6 font-semibold flex items-center gap-2 py-4">
                    <v-icon class="text-violet-500">mdi-information</v-icon>
                    Disclaimer
                </v-card-title>
                <v-card-text class="space-y-4 leading-relaxed text-sm py-0">
                    <p>
                        This calculator provides an estimate for informational purposes only and should not be
                        considered as financial or legal advice.
                    </p>
                    <p>
                        The figures are based on publicly available information from the Guyana Revenue Authority (GRA),
                        but accuracy or timeliness is not guaranteed. This tool is not affiliated with or endorsed by
                        the GRA.
                    </p>
                    <p>
                        The developers are not liable for errors, omissions, or any loss or damage arising from its use.
                        Please verify results with the GRA or a qualified tax professional.
                    </p>
                    <v-checkbox v-model="disclaimerChecked" color="primary" label="I understand and agree"></v-checkbox>
                </v-card-text>
                <v-card-actions class="px-6 pb-6 pt-4">
                    <v-spacer></v-spacer>
                    <v-btn color="primary" :disabled="!disclaimerChecked" @click="acceptDisclaimer"
                        class="rounded-xl px-6 py-3 font-medium">
                        Continue
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-main>
            <v-container class="py-12 md:py-16">
                <v-row justify="center">
                    <v-col cols="12" md="10" lg="8" class="py-0">
                        <!-- Hero -->
                        <div class="text-center mb-10 md:mb-12">
                            <div
                                class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm">
                                <v-icon size="16">mdi-car</v-icon> Motor Vehicle Imports · Guyana
                            </div>
                            <h1 class="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                                Motor Vehicle
                                <span
                                    class="bg-gradient-to-r from-violet-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                                    Tax Calculator
                                </span>
                            </h1>
                            <p
                                class="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                Calculate estimated taxes and total cost when importing a vehicle into Guyana.
                            </p>
                        </div>

                        <!-- Error -->
                        <v-alert v-if="error" type="error" class="mb-8 rounded-xl" closable @click:close="error = null"
                            variant="tonal">
                            {{ error }}
                        </v-alert>

                        <!-- Form Card -->
                        <v-card
                            class="rounded-2xl shadow-md gradient-border bg-slate-50/60 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-white/5">
                            <v-card-text class="p-6 md:p-8">
                                <div class="flex items-center justify-between mb-6">
                                    <div class="text-sm font-medium text-slate-600 dark:text-slate-300">Display Currency
                                    </div>
                                    <v-btn-toggle v-model="displayCurrency" mandatory color="primary" variant="outlined"
                                        density="compact"
                                        class="rounded-full bg-slate-100/50 dark:bg-slate-800/50 p-0.5 ring-1 ring-inset ring-slate-900/5 dark:ring-white/5">
                                        <v-btn value="GYD" class="text-none rounded-full px-4">GYD</v-btn>
                                        <v-btn value="USD" class="text-none rounded-full px-4">USD</v-btn>
                                    </v-btn-toggle>
                                </div>

                                <!-- Propulsion -->
                                <div class="mb-8">
                                    <div class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Propulsion</div>
                                    <v-btn-toggle v-model="fuel" color="primary" variant="outlined" divided
                                        class="w-full rounded-xl ring-1 ring-inset ring-slate-900/5 dark:ring-white/5">
                                        <v-btn value="Gasoline"
                                            class="w-1/3 text-none py-4 font-medium">Gasoline</v-btn>
                                        <v-btn value="Diesel" class="w-1/3 text-none py-4 font-medium"
                                            :disabled="vehicle_type === 'Bike'">Diesel</v-btn>
                                        <v-btn value="Electric" class="w-1/3 text-none py-4 font-medium"
                                            :disabled="vehicle_type === 'Bus'">Electric</v-btn>
                                    </v-btn-toggle>
                                </div>

                                <!-- Inputs grid -->
                                <v-row dense class="-mx-2">
                                    <v-col cols="12" md="6" class="px-2">
                                        <v-select density="compact" v-model="vehicle_type"
                                            :items="['Car', 'SUV', 'Van', 'Bus', 'Single Cab', 'Double Cab', { title: 'Motorcycle', value: 'Bike' }]"
                                            label="Vehicle Type" variant="outlined" class="rounded-xl" />
                                    </v-col>

                                    <v-col cols="6" md="3" class="px-2">
                                        <v-menu v-model="yearMenu" :close-on-content-click="false" location="bottom">
                                            <template #activator="{ props }">
                                                <v-text-field density="compact" v-model="vehicleYear"
                                                    label="Vehicle Year" placeholder="e.g., 2018" variant="outlined"
                                                    class="rounded-xl" readonly v-bind="props" />
                                            </template>
                                            <v-date-picker v-model="dateForYearPicker" :view-mode="yearPickerViewMode"
                                                @update:view-mode="yearPickerViewMode = $event"
                                                @update:year="selectYear" hide-header color="primary"
                                                :max="new Date().toISOString()" />
                                        </v-menu>
                                    </v-col>

                                    <v-col cols="6" md="3" class="px-2" v-if="isPlateApplicable">
                                        <v-select density="compact" v-model="plate" :items="plateItems"
                                            label="Plate Type" variant="outlined" class="rounded-xl" />
                                    </v-col>

                                    <v-col cols="12" md="6" class="px-2">
                                        <v-text-field density="compact" v-if="fuel === 'Electric'" v-model.number="cc"
                                            label="Engine Capacity (KW)" type="number" placeholder="Enter KW"
                                            variant="outlined" class="rounded-xl" />
                                        <v-text-field density="compact" v-else v-model.number="cc"
                                            label="Engine Capacity (CC)" type="number" placeholder="Enter CC"
                                            variant="outlined" class="rounded-xl" />
                                    </v-col>

                                    <v-col cols="12" md="6" class="px-2">
                                        <v-text-field density="compact" v-model.number="cif" label="CIF Value (USD)"
                                            type="number" prefix="$" variant="outlined" class="rounded-xl" />
                                    </v-col>

                                    <v-col cols="12" md="6" class="px-2">
                                        <v-text-field density="compact" v-model.number="exchange_rate"
                                            label="Exchange Rate (GYD to USD)" type="number" prefix="$"
                                            variant="outlined" class="rounded-xl" />
                                    </v-col>
                                </v-row>
                            </v-card-text>

                            <v-card-actions class="p-6 md:p-8 pt-0 gap-4 justify-end">
                                <v-btn size="large" :disabled="!isFormValid" @click="calculateTax" color="primary"
                                    class="flex-grow sm:flex-grow-0 sm:w-48 rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                                    <v-icon class="mr-2">mdi-calculator</v-icon>
                                    Calculate Tax
                                </v-btn>
                                <v-btn size="large" @click="resetForm" variant="tonal"
                                    class="flex-grow sm:flex-grow-0 sm:w-48 rounded-xl h-12 text-base font-semibold shadow-sm hover:shadow-md transition-shadow">
                                    Clear
                                </v-btn>
                            </v-card-actions>
                        </v-card>

                        <!-- Results / Estimate -->
                        <div v-if="results" ref="resultsRef" class="mt-10 md:mt-12">
                            <v-tabs v-model="activeTab" grow
                                class="rounded-xl ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
                                <v-tab value="results" class="text-none font-medium">Results</v-tab>
                                <v-tab value="estimate" class="text-none font-medium">Print Estimate</v-tab>
                            </v-tabs>

                            <v-window v-model="activeTab" class="mt-6">
                                <!-- Results Tab -->
                                <v-window-item value="results">
                                    <v-card
                                        class="pa-0 rounded-2xl shadow-md bg-gradient-to-b from-slate-50/60 to-slate-50/30 dark:from-slate-900/60 dark:to-slate-900/30 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-white/5">
                                        <v-card-title class="font-bold text-center text-h5 py-6">Calculation
                                            Results</v-card-title>
                                        <v-card-text class="pb-6 px-4 md:px-8">
                                            <v-row class="mb-4" justify="center" no-gutters>
                                                <v-col cols="12" md="4" class="p-3">
                                                    <v-sheet
                                                        class="stat-card rounded-2xl p-5 text-center shadow-sm ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
                                                        <div class="stat-title">CIF Value</div>
                                                        <div class="stat-value tabular-nums" ref="cifRef"
                                                            :title="formatCurrency(results.cifValue)">
                                                            {{ formatCurrency(results.cifValue) }}
                                                        </div>
                                                    </v-sheet>
                                                </v-col>
                                                <v-col cols="12" md="4" class="p-3">
                                                    <v-sheet
                                                        class="stat-card rounded-2xl p-5 text-center shadow-sm ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
                                                        <div class="stat-title">Total Tax</div>
                                                        <div class="stat-value tabular-nums" ref="taxRef"
                                                            :title="formatCurrency(results.totalTax)">
                                                            {{ formatCurrency(results.totalTax) }}
                                                        </div>
                                                    </v-sheet>
                                                </v-col>
                                                <v-col cols="12" md="4" class="p-3">
                                                    <v-sheet
                                                        class="stat-card rounded-2xl p-5 text-center shadow-sm ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
                                                        <div class="stat-title">Total Cost</div>
                                                        <div class="stat-value tabular-nums" ref="totalRef"
                                                            :title="formatCurrency(results.totalPrice)">
                                                            {{ formatCurrency(results.totalPrice) }}
                                                        </div>
                                                    </v-sheet>
                                                </v-col>
                                            </v-row>

                                            <v-divider class="my-6 opacity-50"></v-divider>

                                            <v-list class="bg-transparent tax-breakdown" lines="one">
                                                <v-list-item prepend-icon="mdi-percent-outline" class="py-3">
                                                    <v-list-item-title class="font-medium">Customs
                                                        Duty</v-list-item-title>
                                                    <template #append>
                                                        <span class="font-semibold tabular-nums">{{
                                                            formatCurrency(results.duty) }}</span>
                                                    </template>
                                                </v-list-item>
                                                <v-list-item prepend-icon="mdi-percent-outline" class="py-3">
                                                    <v-list-item-title class="font-medium">Excise
                                                        Tax</v-list-item-title>
                                                    <template #append>
                                                        <span class="font-semibold tabular-nums">{{
                                                            formatCurrency(results.excise) }}</span>
                                                    </template>
                                                </v-list-item>
                                                <v-list-item prepend-icon="mdi-percent-outline" class="py-3">
                                                    <v-list-item-title class="font-medium">VAT (14%)</v-list-item-title>
                                                    <template #append>
                                                        <span class="font-semibold tabular-nums">{{
                                                            formatCurrency(results.vat) }}</span>
                                                    </template>
                                                </v-list-item>
                                                <v-divider class="my-3 opacity-50"></v-divider>
                                                <v-list-item prepend-icon="mdi-cog-outline" class="py-3">
                                                    <v-list-item-title class="font-medium">Processing
                                                        Fee</v-list-item-title>
                                                    <template #append>
                                                        <span class="font-semibold tabular-nums">{{
                                                            formatCurrency(results.processingFee) }}</span>
                                                    </template>
                                                </v-list-item>
                                            </v-list>
                                        </v-card-text>
                                    </v-card>
                                </v-window-item>

                                <!-- Estimate Tab -->
                                <v-window-item value="estimate">
                                    <v-card
                                        class="rounded-2xl shadow-md bg-slate-50/60 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-slate-900/5 dark:ring-white/5 p-6 md:p-8">
                                        <v-row dense>
                                            <v-col cols="12" md="5">
                                                <v-form>
                                                    <v-card
                                                        class="mb-6 rounded-xl shadow-sm bg-slate-50/50 dark:bg-slate-900/30 ring-1 ring-inset ring-slate-900/5 dark:ring-white/5"
                                                        variant="tonal">
                                                        <v-card-title class="text-subtitle-1 font-bold py-4">Vehicle
                                                            Details</v-card-title>
                                                        <v-card-text class="pt-0">
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.vehicleYear" label="Year"
                                                                type="number" variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.vehicleMake" label="Make"
                                                                variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.vehicleModel" label="Model"
                                                                variant="outlined" class="rounded-xl" />
                                                        </v-card-text>
                                                    </v-card>

                                                    <v-card
                                                        class="mb-6 rounded-xl shadow-sm bg-slate-50/50 dark:bg-slate-900/30 ring-1 ring-inset ring-slate-900/5 dark:ring-white/5"
                                                        variant="tonal">
                                                        <v-card-title class="text-subtitle-1 font-bold py-4">Customer
                                                            Details</v-card-title>
                                                        <v-card-text class="pt-0">
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.customerFirstName"
                                                                label="First Name" variant="outlined"
                                                                class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.customerLastName"
                                                                label="Last Name" variant="outlined"
                                                                class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.customerEmail" label="Email"
                                                                type="email" variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.customerPhone" label="Phone"
                                                                type="tel" variant="outlined" class="rounded-xl" />
                                                        </v-card-text>
                                                    </v-card>

                                                    <v-card
                                                        class="rounded-xl shadow-sm bg-slate-50/50 dark:bg-slate-900/30 ring-1 ring-inset ring-slate-900/5 dark:ring-white/5"
                                                        variant="tonal">
                                                        <v-card-title class="text-subtitle-1 font-bold py-4">Company
                                                            Details</v-card-title>
                                                        <v-card-text class="pt-0">
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.companyName" label="Name"
                                                                variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.companyAddress" label="Address"
                                                                variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.companyEmail" label="Email"
                                                                type="email" variant="outlined" class="rounded-xl" />
                                                            <v-text-field density="compact"
                                                                v-model="estimateInfo.companyPhone" label="Phone"
                                                                variant="outlined" class="rounded-xl" />
                                                            <v-file-input density="compact" label="Logo"
                                                                accept="image/*" @change="onLogoChange"
                                                                variant="outlined" class="rounded-xl" />
                                                            <v-img v-if="estimateInfo.companyLogo"
                                                                :src="estimateInfo.companyLogo"
                                                                class="mt-3 rounded-lg ring-1 ring-slate-900/5 dark:ring-white/5"
                                                                max-height="100" contain />
                                                        </v-card-text>
                                                    </v-card>
                                                </v-form>
                                            </v-col>

                                            <v-col cols="12" md="7" class="d-flex flex-column">
                                                <v-sheet
                                                    class="flex-grow d-flex rounded-2xl ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm min-h-[600px] overflow-hidden">
                                                    <iframe v-if="pdfPreviewUrl" :src="pdfPreviewSrc"
                                                        class="flex-grow rounded-2xl" style="border: none;"
                                                        height="100%"></iframe>
                                                    <div v-else
                                                        class="flex items-center justify-center flex-grow text-medium-emphasis">
                                                        Preview
                                                        will appear here</div>
                                                </v-sheet>
                                                <div class="text-center mt-6">
                                                    <v-btn size="large" color="primary" prepend-icon="mdi-download"
                                                        class="w-full rounded-xl h-12 font-semibold shadow-md hover:shadow-lg transition-shadow"
                                                        @click="downloadEstimatePdf" :disabled="!pdfPreviewUrl">
                                                        Download PDF
                                                    </v-btn>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-card>
                                </v-window-item>
                            </v-window>
                        </div>

                        <!-- Footer -->
                        <footer
                            class="text-center text-sm text-slate-600 dark:text-slate-300 py-12 mt-12 border-t border-slate-900/5 dark:border-white/5">
                            <p class="leading-relaxed">
                                This calculator is for estimation purposes only and is not affiliated with the
                                <a href="https://www.gra.gov.gy/imports/motor-vehicle/" target="_blank" rel="noopener"
                                    class="text-primary font-medium hover:underline">Guyana Revenue Authority (GRA)</a>.
                                All calculations should be verified with the GRA or a qualified professional.
                            </p>
                            <p class="mt-3">
                                For official information, please visit the
                                <a href="https://www.gra.gov.gy/imports/motor-vehicle/" target="_blank" rel="noopener"
                                    class="text-primary font-medium hover:underline">GRA Motor Vehicle Imports Page</a>.
                            </p>
                            <p class="mt-3">
                                Contact <a href="https://wa.me/5927366642" target="_blank" rel="noopener"
                                    class="text-primary font-medium hover:underline">Ricardo Persaud</a> for feedback or
                                inquiries.
                            </p>
                        </footer>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<style scoped>
.app-bar-gradient {
    background: linear-gradient(90deg, rgb(241 245 249 / 0.8), rgb(241 245 249 / 0.4));
}

:root.dark .app-bar-gradient {
    background: linear-gradient(90deg, rgba(2, 6, 23, 0.80), rgba(2, 6, 23, 0.40));
}

/* Optional gradient border for the main card */
.gradient-border {
    position: relative;
}

.gradient-border::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.8), rgba(56, 189, 248, 0.8), rgba(16, 185, 129, 0.8));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

/* Stat styles */
.stat-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(71 85 105);
    letter-spacing: 0.025em;
}

:root.dark .stat-title {
    color: rgb(203 213 225);
}

.stat-value {
    margin-top: 0.5rem;
    font-size: 1.875rem;
    font-weight: 800;
    line-height: 1.1;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    background-image: linear-gradient(135deg, #7c3aed, #0284c7, #059669);
}

@media (min-width: 768px) {
    .stat-value {
        font-size: 2.5rem;
    }
}

/* Softer corners + taller inputs prevent label clipping */
:deep(.v-field) {
    border-radius: 12px !important;
}

:deep(.v-field--variant-outlined .v-field__input) {
    padding-top: 12px !important;
    padding-bottom: 12px !important;
    min-height: 52px;
    /* avoids cut-off floating labels */
}

:deep(.v-field-label) {
    transform: translateY(1px);
    font-weight: 500;
}

/* Mobile adjustments */
@media (max-width: 640px) {
    :deep(.v-field--variant-outlined .v-field__input) {
        min-height: 48px;
    }

    .stat-value {
        font-size: 1.5rem !important;
    }
}
</style>


<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import { formatCurrency as formatCurrencyUtil } from './utils/currency'
import { calculateGasoline, calculateDiesel } from './utils/tax'
import { createEstimatePdf } from './utils/pdf'
import { fitText } from './utils/dom'
const route = useRoute();

// Theme toggling
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme() {
    theme.global.name.value = isDark.value ? 'light' : 'dark';
}

// Disclaimer dialog
const showDisclaimer = ref(false)
const disclaimerChecked = ref(false)
function acceptDisclaimer() {
    localStorage.setItem('disclaimerAccepted', 'true')
    showDisclaimer.value = false
}

// Form state
const cif = ref(null)
const exchange_rate = ref(208.5) // Set a default exchange rate
const vehicleYear = ref(null)
const cc = ref(null)
const fuel = ref('Gasoline')
const vehicle_type = ref('Car')
const plate = ref('P')

const error = ref(null)
const results = ref(null)
const processingFee = 1000 // GYD processing fee

// Year Picker state
const yearMenu = ref(false)
const yearPickerViewMode = ref('year')
const dateForYearPicker = ref(new Date())

const cifRef = ref(null)
const taxRef = ref(null)
const totalRef = ref(null)
const resultsRef = ref(null)
const activeTab = ref('results')
const pdfPreviewUrl = ref('')
const pdfPreviewSrc = computed(() =>
    pdfPreviewUrl.value
        ? `${pdfPreviewUrl.value}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
        : ''
)
const estimateInfo = reactive({
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    customerFirstName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyLogo: ''
})
const displayCurrency = ref('GYD')

function formatCurrency(val) {
    return formatCurrencyUtil(val, displayCurrency.value, exchange_rate.value)
}
function onLogoChange(e) {
    const file = e?.target?.files?.[0] || (Array.isArray(e) ? e[0] : e)
    if (!file) {
        estimateInfo.companyLogo = ''
        return
    }
    const reader = new FileReader()
    reader.onload = evt => {
        estimateInfo.companyLogo = evt.target.result
        if (results.value) generateEstimatePdf(false)
    }
    reader.readAsDataURL(file)
}

async function generateEstimatePdf(download = false) {
    if (!results.value) return
    const blob = await createEstimatePdf({
        results: results.value,
        estimateInfo,
        vehicleType: vehicle_type.value,
        cc: cc.value,
        fuel: fuel.value,
        exchangeRate: exchange_rate.value,
        displayCurrency: displayCurrency.value,
        formatCurrency
    })
    const oldUrl = pdfPreviewUrl.value
    pdfPreviewUrl.value = URL.createObjectURL(blob)
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    if (download) {
        const link = document.createElement('a')
        link.href = pdfPreviewUrl.value
        const dateStr = new Date().toISOString().slice(0, 10)
        const namePart = [estimateInfo.customerFirstName, estimateInfo.customerLastName]
            .filter(Boolean)
            .join('_')
            .replace(/\s+/g, '_')
        const fileName = namePart
            ? `${namePart}_${dateStr}.pdf`
            : `estimate_${Math.random().toString(36).slice(2, 8)}_${dateStr}.pdf`
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

function downloadEstimatePdf() {
    generateEstimatePdf(true)
}
function updateStatSizes() {
    ;[cifRef.value, taxRef.value, totalRef.value].forEach(fitText)
}

function selectYear(year) {
    vehicleYear.value = year
    yearMenu.value = false
}

watch(results, () => {
    nextTick(() => {
        updateStatSizes()
        if (results.value) generateEstimatePdf(false)
    })
})

watch(displayCurrency, (newVal) => {
    localStorage.setItem('displayCurrency', newVal)
    nextTick(updateStatSizes)
})

watch(estimateInfo, () => {
    localStorage.setItem('estimateInfo', JSON.stringify(estimateInfo))
    if (results.value) generateEstimatePdf(false)
}, { deep: true })

watch(activeTab, val => {
    if (val === 'estimate') {
        estimateInfo.vehicleYear = vehicleYear.value ? String(vehicleYear.value) : estimateInfo.vehicleYear
        if (results.value) generateEstimatePdf(false)
    }
})

watch([fuel, vehicle_type, vehicleYear, plate, cc, cif, exchange_rate], () => {
    const data = {
        fuel: fuel.value,
        vehicle_type: vehicle_type.value,
        vehicleYear: vehicleYear.value,
        plate: plate.value,
        cc: cc.value,
        cif: cif.value,
        exchange_rate: exchange_rate.value
    }
    localStorage.setItem('calcInputs', JSON.stringify(data))
})

watch(vehicleYear, (newVal) => {
    if (newVal) {
        const d = new Date(dateForYearPicker.value)
        d.setFullYear(newVal)
        dateForYearPicker.value = d
    } else {
        dateForYearPicker.value = new Date()
    }
})

watch(yearMenu, (isActive) => {
    if (isActive) {
        yearPickerViewMode.value = 'year'
    }
})

onMounted(() => {
    const savedCurrency = localStorage.getItem('displayCurrency')
    if (savedCurrency) {
        displayCurrency.value = savedCurrency
    }
    window.addEventListener('resize', updateStatSizes)
    const savedEstimate = localStorage.getItem('estimateInfo')
    if (savedEstimate) Object.assign(estimateInfo, JSON.parse(savedEstimate))
    const savedCalc = localStorage.getItem('calcInputs')
    if (savedCalc) {
        const parsed = JSON.parse(savedCalc)
        fuel.value = parsed.fuel ?? fuel.value
        vehicle_type.value = parsed.vehicle_type ?? vehicle_type.value
        vehicleYear.value = parsed.vehicleYear ?? vehicleYear.value
        plate.value = parsed.plate ?? plate.value
        cc.value = parsed.cc ?? cc.value
        cif.value = parsed.cif ?? cif.value
        exchange_rate.value = parsed.exchange_rate ?? exchange_rate.value
    }
    if (!localStorage.getItem('disclaimerAccepted')) {
        showDisclaimer.value = true
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateStatSizes)
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
})

const ageCategory = computed(() => {
    if (!vehicleYear.value) return null;
    return (new Date().getFullYear() - vehicleYear.value) < 4 ? 'under4' : 'over4';
});
const isPlateApplicable = computed(() => {
    return ['Single Cab', 'Double Cab', 'Bus', 'Van', 'SUV'].includes(vehicle_type.value);
});

const plateItems = computed(() => {
    const items = ['P', { title: 'G', value: 'G', disabled: vehicle_type.value === 'Double Cab' }, { title: 'B', value: 'B', disabled: vehicle_type.value !== 'Bus' }];
    return items.filter(item => typeof item === 'string' || !item.disabled);
});

watch(vehicle_type, (newType) => {
    if (newType === 'Bike') {
        plate.value = fuel.value === 'Electric' ? 'E' : 'C';
    } else if (!['Single Cab', 'Double Cab', 'Bus', 'Van', 'SUV'].includes(newType)) {
        plate.value = 'P';
    } else {
        plate.value = 'P';
    }

    if (newType === 'Bus' && fuel.value === 'Electric') {
        fuel.value = 'Gasoline';
    }
    if (newType === 'Bike' && fuel.value === 'Diesel') {
        fuel.value = 'Gasoline';
    }
});

watch(fuel, (newFuel) => {
    if (vehicle_type.value === 'Bike') {
        plate.value = newFuel === 'Electric' ? 'E' : 'C';
    }
});

const isFormValid = computed(() => {
    if (!cif.value || !exchange_rate.value || !vehicleYear.value || !fuel.value || !vehicle_type.value || !plate.value) {
        return false;
    }
    if (fuel.value !== 'Electric' && !cc.value) {
        return false;
    }
    return true;
})

function resetForm() {
    cif.value = null;
    vehicleYear.value = null;
    cc.value = null;
    fuel.value = 'Gasoline';
    vehicle_type.value = 'Car';
    plate.value = 'P';
    error.value = null;
    results.value = null;
}
function calculateTax() {
    error.value = null;
    results.value = null;

    let taxResultsUSD = {};

    if (plate.value === 'G') {
        taxResultsUSD = { duty: 0, excise: 2000, vat: 0, totalTax: 2000, dutyRate: 0, exciseRate: 0, vatRate: 0, exciseType: 'flat', exciseConstUSD: 0, exciseFlatGYD: 2000 * exchange_rate.value };
    } else if (fuel.value === 'Electric') {
        taxResultsUSD = { duty: 0, excise: 0, vat: 0, totalTax: 0, dutyRate: 0, exciseRate: 0, vatRate: 0, exciseType: null, exciseConstUSD: 0, exciseFlatGYD: 0 };
    } else if (fuel.value === 'Gasoline') {
        taxResultsUSD = calculateGasoline({
            cc: cc.value,
            cif: cif.value,
            exchangeRate: exchange_rate.value,
            vehicleType: vehicle_type.value,
            ageCategory: ageCategory.value
        })
    } else if (fuel.value === 'Diesel') {
        taxResultsUSD = calculateDiesel({
            cc: cc.value,
            cif: cif.value,
            exchangeRate: exchange_rate.value,
            ageCategory: ageCategory.value
        })
    }

    // Convert all values to GYD for display
    const cifGyd = cif.value * exchange_rate.value;
    const dutyGyd = taxResultsUSD.duty * exchange_rate.value;
    const exciseGyd = taxResultsUSD.excise * exchange_rate.value;
    const vatGyd = taxResultsUSD.vat * exchange_rate.value;
    const totalTaxGyd = taxResultsUSD.totalTax * exchange_rate.value;

    const totalTaxWithFee = totalTaxGyd + processingFee;

    results.value = {
        cifValue: cifGyd,
        duty: dutyGyd,
        excise: exciseGyd,
        vat: vatGyd,
        processingFee,
        totalTax: totalTaxWithFee,
        totalPrice: cifGyd + totalTaxWithFee,
        formulas: {
            dutyRate: taxResultsUSD.dutyRate,
            exciseRate: taxResultsUSD.exciseRate,
            vatRate: taxResultsUSD.vatRate,
            exciseType: taxResultsUSD.exciseType,
            exciseConstUSD: taxResultsUSD.exciseConstUSD,
            exciseFlatGYD: taxResultsUSD.exciseFlatGYD
        }
    };

    /* === BEGIN: log this calculation (no assumptions; your var names used) === */
    ; (async () => {
        try {
            await $fetch('/api/track.calculate', {
                method: 'POST',
                body: {
                    fuel: fuel.value,
                    vehicle_type: vehicle_type.value,
                    vehicleYear: vehicleYear.value,
                    plate: plate.value,
                    cc: cc.value ?? null,
                    cif: cif.value,                        // USD input as you capture it
                    exchange_rate: exchange_rate.value,    // GYD per USD as in your UI
                    displayCurrency: displayCurrency.value,
                    results: {
                        totalTax: results.value.totalTax,      // GYD (includes processingFee)
                        totalPrice: results.value.totalPrice   // GYD
                    }
                }
            });
        } catch (_e) {
            // swallow errors; never block UI
        }
    })();
    /* === END: log this calculation === */

    nextTick(() => {
        resultsRef.value?.scrollIntoView({ behavior: 'smooth' });
    });
}


useHead({
    title: 'GRA Motor Vehicle Tax Calculator',
    meta: [
        { name: 'description', content: 'Guyana Revenue Authority (GRA) Motor Vehicle Tax Calculator. Calculate taxes for gasoline, diesel, and electric vehicles based on CIF value, engine capacity, and vehicle year.' },
        { name: 'author', content: 'Ricardo Persaud' },
        { name: 'keywords', content: 'GRA, Motor Vehicle Tax, Calculator, Guyana, duty, excise tax, VAT, CIF value, engine capacity, vehicle year, gasoline, diesel, electric car' },
        { name: 'theme-color', content: () => (isDark.value ? '#6366f1' : '#4338ca') },
    ],
    script: [
        {
            innerHTML: `
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "svagn9kbx8");
      `,
            type: 'text/javascript'
        },
    ]
})


</script>
