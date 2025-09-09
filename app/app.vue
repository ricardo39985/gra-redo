<template>
    <v-app class="bg-surface-variant">
        <v-app-bar app flat class="app-bar-gradient">
            <v-app-bar-title class="font-weight-bold">
                GRA Tax Calculator
            </v-app-bar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="toggleTheme" variant="text">
                <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
            </v-btn>
        </v-app-bar>

        <v-dialog v-model="showDisclaimer" persistent max-width="500">
            <v-card>
                <v-card-title class="text-h6">Disclaimer</v-card-title>
                <v-card-text>
                    <p class="mb-2 text-body-2">
                        This calculator provides an estimate for informational purposes only and should not be
                        considered as financial or legal advice.
                    </p>
                    <p class="mb-2 text-body-2">
                        The figures are based on publicly available information from the Guyana Revenue Authority (GRA)
                        but we cannot guarantee their accuracy or timeliness. This tool is not affiliated with or
                        endorsed by the GRA.
                    </p>
                    <p class="mb-4 text-body-2">
                        The developers of this tool are not liable for any errors, omissions, or for any loss or damage
                        arising from its use. You are solely responsible for verifying the accuracy of the results with
                        the GRA or a qualified tax professional.
                    </p>
                    <v-checkbox v-model="disclaimerChecked" label="I understand and agree"></v-checkbox>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" :disabled="!disclaimerChecked" @click="acceptDisclaimer">Continue</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-main>
            <v-container>
                <v-row justify="center">
                    <v-col cols="12" md="8" lg="6" class="py-8">
                        <div class="text-center mb-8">
                            <h1 class="text-h4 font-weight-bold">Motor Vehicle Tax Calculator</h1>
                            <p class="text-medium-emphasis mt-2">Calculate taxes for vehicles imported into Guyana.</p>
                        </div>

                        <v-alert v-if="error" type="error" class="mb-6" closable @click:close="error = null"
                            variant="tonal">
                            {{ error }}
                        </v-alert>

                        <v-card class="pa-4" rounded="xl">
                            <div class="d-flex justify-end mb-2">
                                <v-btn-toggle v-model="displayCurrency" mandatory color="primary" variant="outlined"
                                    density="compact">
                                    <v-btn value="GYD" class="text-none">GYD</v-btn>
                                    <v-btn value="USD" class="text-none">USD</v-btn>
                                </v-btn-toggle>
                            </div>
                            <v-card-text>
                                <div class="mb-6">
                                    <v-label class="mb-2 font-weight-medium">Propulsion</v-label>
                                    <v-btn-toggle v-model="fuel" color="primary" variant="outlined" divided
                                        class="w-100">
                                        <v-btn value="Gasoline" class="w-33 text-none">Gasoline</v-btn>
                                        <v-btn value="Diesel" class="w-33 text-none"
                                            :disabled="vehicle_type === 'Bike'">Diesel</v-btn>
                                        <v-btn value="Electric" class="w-33 text-none"
                                            :disabled="vehicle_type === 'Bus'">Electric</v-btn>
                                    </v-btn-toggle>
                                </div>

                                <v-select v-model="vehicle_type"
                                    :items="['Car', 'SUV', 'Van', 'Bus', 'Single Cab', 'Double Cab', { title: 'Motorcycle', value: 'Bike' }]"
                                    label="Vehicle Type" variant="outlined"></v-select>

                                <v-text-field v-model.number="vehicleYear" label="Vehicle Year" type="number"
                                    placeholder="e.g., 2018" variant="outlined"></v-text-field>

                                <v-select v-if="isPlateApplicable" v-model="plate" :items="plateItems"
                                    label="Plate Type" variant="outlined"></v-select>

                                <v-text-field v-if="fuel === 'Electric'" v-model.number="cc"
                                    label="Engine Capacity (KW)" type="number" placeholder="Enter KW"
                                    variant="outlined"></v-text-field>

                                <v-text-field v-else v-model.number="cc" label="Engine Capacity (CC)" type="number"
                                    placeholder="Enter CC" variant="outlined"></v-text-field>

                                <v-text-field v-model.number="cif" label="CIF Value (USD)" type="number" prefix="$"
                                    variant="outlined"></v-text-field>

                                <v-text-field v-model.number="exchange_rate" label="Exchange Rate (GYD to USD)"
                                    type="number" prefix="$" variant="outlined"></v-text-field>
                            </v-card-text>
                            <v-card-actions>
                                <v-btn size="large" :disabled="!isFormValid" @click="calculateTax" color="primary"
                                    class="flex-grow-1">
                                    Calculate Tax
                                </v-btn>
                                <v-btn size="large" @click="resetForm" variant="tonal" class="ml-2">
                                    Clear
                                </v-btn>
                            </v-card-actions>
                        </v-card>

                        <div v-if="results" class="mt-8">
                            <v-tabs v-model="activeTab" grow>
                                <v-tab value="results">Results</v-tab>
                                <v-tab value="estimate">Print Estimate</v-tab>
                            </v-tabs>
                            <v-window v-model="activeTab" class="mt-4">
                                <v-window-item value="results">
                                    <v-card class="pa-0 results-card" variant="tonal" color="primary" rounded="xl">
                                        <v-card-title class="font-weight-bold text-center text-h5">Calculation
                                            Results</v-card-title>
                                        <v-card-text>
                                            <v-row class="mb-4" justify="center">
                                                <v-col cols="12" md="4">
                                                    <v-sheet class="stat-card text-center" rounded="lg">
                                                        <div class="stat-title">CIF Value</div>
                                                        <div class="stat-value" ref="cifRef"
                                                            :title="formatCurrency(results.cifValue)">{{
                                                                formatCurrency(results.cifValue) }}</div>
                                                    </v-sheet>
                                                </v-col>
                                                <v-col cols="12" md="4">
                                                    <v-sheet class="stat-card text-center" rounded="lg">
                                                        <div class="stat-title">Total Tax</div>
                                                        <div class="stat-value" ref="taxRef"
                                                            :title="formatCurrency(results.totalTax)">{{
                                                                formatCurrency(results.totalTax) }}</div>
                                                    </v-sheet>
                                                </v-col>
                                                <v-col cols="12" md="4">
                                                    <v-sheet class="stat-card text-center" rounded="lg">
                                                        <div class="stat-title">Total Cost</div>
                                                        <div class="stat-value" ref="totalRef"
                                                            :title="formatCurrency(results.totalPrice)">{{
                                                                formatCurrency(results.totalPrice) }}</div>
                                                    </v-sheet>
                                                </v-col>
                                            </v-row>
                                            <v-divider class="my-4"></v-divider>
                                            <v-list class="bg-transparent tax-breakdown" lines="one">
                                                <v-list-item prepend-icon="mdi-percent-outline">
                                                    <v-list-item-title>Customs Duty</v-list-item-title>
                                                    <template v-slot:append><span class="font-weight-medium">{{
                                                        formatCurrency(results.duty) }}</span></template>
                                                </v-list-item>
                                                <v-list-item prepend-icon="mdi-percent-outline">
                                                    <v-list-item-title>Excise Tax</v-list-item-title>
                                                    <template v-slot:append><span class="font-weight-medium">{{
                                                        formatCurrency(results.excise) }}</span></template>
                                                </v-list-item>
                                                <v-list-item prepend-icon="mdi-percent-outline">
                                                    <v-list-item-title>VAT (14%)</v-list-item-title>
                                                    <template v-slot:append><span class="font-weight-medium">{{
                                                        formatCurrency(results.vat) }}</span></template>
                                                </v-list-item>
                                                <v-divider class="my-2"></v-divider>
                                                <v-list-item prepend-icon="mdi-cog-outline">
                                                    <v-list-item-title>Processing Fee</v-list-item-title>
                                                    <template v-slot:append>
                                                        <span class="font-weight-medium">{{
                                                            formatCurrency(results.processingFee)
                                                            }}</span>
                                                    </template>
                                                </v-list-item>
                                            </v-list>
                                        </v-card-text>
                                    </v-card>
                                </v-window-item>
                                <v-window-item value="estimate">
                                    <v-card class="pa-4" rounded="xl">
                                        <v-row dense>
                                            <v-col cols="12" md="5">
                                                <v-form>
                                                    <v-card class="mb-6" variant="tonal" rounded="lg">
                                                        <v-card-title class="text-subtitle-1 font-weight-bold">Vehicle
                                                            Details</v-card-title>
                                                        <v-card-text>
                                                            <v-text-field v-model="estimateInfo.vehicleYear"
                                                                label="Year" type="number"
                                                                variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.vehicleMake"
                                                                label="Make" variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.vehicleModel"
                                                                label="Model" variant="outlined"></v-text-field>
                                                        </v-card-text>
                                                    </v-card>
                                                    <v-card class="mb-6" variant="tonal" rounded="lg">
                                                        <v-card-title class="text-subtitle-1 font-weight-bold">Customer
                                                            Details</v-card-title>
                                                        <v-card-text>
                                                            <v-text-field v-model="estimateInfo.customerFirstName"
                                                                label="First Name" variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.customerLastName"
                                                                label="Last Name" variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.customerEmail"
                                                                label="Email" type="email"
                                                                variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.customerPhone"
                                                                label="Phone" type="tel"
                                                                variant="outlined"></v-text-field>
                                                        </v-card-text>
                                                    </v-card>
                                                    <v-card variant="tonal" rounded="lg">
                                                        <v-card-title class="text-subtitle-1 font-weight-bold">Company
                                                            Details</v-card-title>
                                                        <v-card-text>
                                                            <v-text-field v-model="estimateInfo.companyName"
                                                                label="Name" variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.companyAddress"
                                                                label="Address" variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.companyEmail"
                                                                label="Email" type="email"
                                                                variant="outlined"></v-text-field>
                                                            <v-text-field v-model="estimateInfo.companyPhone"
                                                                label="Phone" variant="outlined"></v-text-field>
                                                            <v-file-input label="Logo" accept="image/*"
                                                                @change="onLogoChange"
                                                                variant="outlined"></v-file-input>
                                                            <v-img v-if="estimateInfo.companyLogo"
                                                                :src="estimateInfo.companyLogo" class="mt-2"
                                                                max-height="100" contain></v-img>
                                                        </v-card-text>
                                                    </v-card>
                                                </v-form>
                                            </v-col>
                                            <v-col cols="12" md="7" class="d-flex flex-column">
                                                <v-sheet class="flex-grow-1 d-flex" rounded="xl" color="surface"
                                                    style="min-height:600px;">
                                                    <iframe v-if="pdfPreviewUrl" :src="pdfPreviewSrc"
                                                        class="flex-grow-1 rounded-xl" style="border: none;"
                                                        height="100%"></iframe>
                                                    <div v-else
                                                        class="d-flex align-center justify-center flex-grow-1 text-medium-emphasis">
                                                        Preview will
                                                        appear here</div>
                                                </v-sheet>
                                                <div class="text-center mt-4">
                                                    <v-btn size="large" color="primary" prepend-icon="mdi-download"
                                                        class="w-100" @click="downloadEstimatePdf"
                                                        :disabled="!pdfPreviewUrl">Download PDF</v-btn>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-card>
                                </v-window-item>
                            </v-window>
                        </div>

                        <footer class="text-center text-caption text-medium-emphasis py-8">
                            <p>
                                This calculator is for estimation purposes only and is not affiliated with the
                                <a href="https://www.gra.gov.gy/imports/motor-vehicle/" target="_blank" rel="noopener"
                                    class="text-primary">Guyana Revenue
                                    Authority (GRA)</a>.
                                All calculations should be verified with the GRA or a qualified professional.
                            </p>
                            <p class="mt-2">For official information, please visit the <a
                                    href="https://www.gra.gov.gy/imports/motor-vehicle/" target="_blank" rel="noopener"
                                    class="text-primary">GRA Motor Vehicle Imports Page</a>.
                            </p>
                        </footer>

                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import { formatCurrency as formatCurrencyUtil } from './utils/currency'
import { calculateGasoline, calculateDiesel } from './utils/tax'
import { createEstimatePdf } from './utils/pdf'
import { fitText } from './utils/dom'

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

const cifRef = ref(null)
const taxRef = ref(null)
const totalRef = ref(null)
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

onMounted(() => {
    const savedCurrency = localStorage.getItem('displayCurrency')
    if (savedCurrency) {
        displayCurrency.value = savedCurrency
    }
})

onMounted(() => {
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
}

useHead({
    title: 'GRA Motor Vehicle Tax Calculator',
    meta: [
        { name: 'description', content: 'Guyana Revenue Authority (GRA) Motor Vehicle Tax Calculator. Calculate taxes for gasoline, diesel, and electric vehicles based on CIF value, engine capacity, and vehicle year.' },
        { name: 'author', content: 'Ricardo Persaud' },
        { name: 'keywords', content: 'GRA, Motor Vehicle Tax, Calculator, Guyana, duty, excise tax, VAT, CIF value, engine capacity, vehicle year, gasoline, diesel, electric car' },
        { name: 'theme-color', content: () => isDark.value ? '#6366f1' : '#4338ca' },
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

<style>
.app-bar-gradient {
    background: linear-gradient(to right, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary))) !important;
}

.results-card {
    background: linear-gradient(to right, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.1)) !important;
}

.stat-card {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
    color: #fff;
    padding: 1.5rem;
    border-radius: 1rem;
}

.stat-title {
    font-size: 1rem;
    opacity: 0.9;
}

.stat-value {
    font-weight: 700;
    font-size: clamp(1rem, 5vw, 2.5rem);
    white-space: nowrap;
    overflow: hidden;
}

.tax-breakdown .v-list-item-title,
.tax-breakdown .v-list-item .v-icon,
.tax-breakdown .v-list-item span {
    color: rgba(var(--v-theme-on-surface), 0.87) !important;
}
</style>
