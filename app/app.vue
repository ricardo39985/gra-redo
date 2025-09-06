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

                                <v-select v-if="fuel === 'Diesel'" v-model="cc"
                                    :items="[{ title: 'Under 1500cc', value: 'under1500' }, { title: '1501cc - 2000cc', value: '2000' }, { title: '2001cc - 2500cc', value: '2500' }, { title: '2501cc - 3000cc', value: '3000' }, { title: 'Over 3000cc', value: '4000' }]"
                                    label="Engine Capacity (CC)" variant="outlined"></v-select>

                                <v-select v-if="vehicle_type === 'Bike' && fuel !== 'Electric'" v-model="cc"
                                    :items="[{ title: 'Under 175cc', value: 'under175' }, { title: 'Over 175cc', value: 'over175' }]"
                                    label="Engine Capacity (CC)" variant="outlined"></v-select>

                                <v-select v-if="fuel === 'Gasoline' && vehicle_type !== 'Bike'" v-model="cc"
                                    :items="[{ title: '0cc - 1000cc', value: '1000' }, { title: '1001cc - 1500cc', value: '1500' }, { title: '1501cc - 1800cc', value: '1800' }, { title: '1801cc - 2000cc', value: '2000' }, { title: '2001cc - 3000cc', value: '3000' }, { title: 'Over 3000cc', value: '4000' }]"
                                    label="Engine Capacity (CC)" variant="outlined"></v-select>

                                <v-text-field v-if="fuel === 'Electric'" v-model.number="cc"
                                    label="Engine Capacity (KW)" type="number" placeholder="Enter KW"
                                    variant="outlined"></v-text-field>

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

                        <v-card v-if="results" class="mt-8 pa-2" variant="tonal" color="primary" rounded="xl">
                            <v-card-title class="font-weight-bold text-center text-h5">Calculation
                                Results</v-card-title>
                            <v-card-text>
                                <v-list class="bg-transparent" lines="one">
                                    <v-list-item prepend-icon="mdi-receipt-text-outline">
                                        <v-list-item-title>CIF Value</v-list-item-title>
                                        <template v-slot:append>
                                            <span class="font-weight-medium">{{ results.cifValue.toLocaleString('en-US',
                                                { style: 'currency', currency: 'GYD' }) }}</span>
                                        </template>
                                    </v-list-item>
                                    <v-divider class="my-2"></v-divider>
                                    <v-list-item prepend-icon="mdi-percent-outline">
                                        <v-list-item-title>Customs Duty</v-list-item-title>
                                        <template v-slot:append>
                                            <span class="font-weight-medium">{{ results.duty.toLocaleString('en-US', {
                                                style: 'currency', currency: 'GYD'
                                            }) }}</span>
                                        </template>
                                    </v-list-item>
                                    <v-list-item prepend-icon="mdi-percent-outline">
                                        <v-list-item-title>Excise Tax</v-list-item-title>
                                        <template v-slot:append>
                                            <span class="font-weight-medium">{{ results.excise.toLocaleString('en-US',
                                                { style: 'currency', currency: 'GYD' }) }}</span>
                                        </template>
                                    </v-list-item>
                                    <v-list-item prepend-icon="mdi-percent-outline">
                                        <v-list-item-title>VAT (14%)</v-list-item-title>
                                        <template v-slot:append>
                                            <span class="font-weight-medium">{{ results.vat.toLocaleString('en-US', {
                                                style: 'currency', currency: 'GYD'
                                            }) }}</span>
                                        </template>
                                    </v-list-item>
                                </v-list>
                                <div class="d-flex justify-space-between align-center my-4 pa-4">
                                    <span class="text-h6 font-weight-bold">Total Tax Payable</span>
                                    <span class="text-h6 font-weight-bold">{{ results.totalTax.toLocaleString('en-US', {
                                        style: 'currency', currency: 'GYD'
                                    }) }}</span>
                                </div>
                                <div class="d-flex justify-space-between align-center pa-4 bg-primary rounded-lg">
                                    <span class="text-h5 font-weight-bold">Final Cost</span>
                                    <span class="text-h5 font-weight-bold">{{ results.totalPrice.toLocaleString('en-US',
                                        { style: 'currency', currency: 'GYD' }) }}</span>
                                </div>
                            </v-card-text>
                        </v-card>

                        <footer class="text-center text-caption text-medium-emphasis py-8">
                            <p>
                                This calculator is not affiliated with or endorsed by the
                                <a href="https://www.gra.gov.gy/imports/motor-vehicle/" target="_blank" rel="noopener"
                                    class="text-primary">Guyana Revenue
                                    Authority (GRA)</a>.
                                Always verify information on the official site.
                            </p>
                            <p class="mt-2">
                                Built by <a href="https://www.facebook.com/ricardo.persaud.397/" target="_blank"
                                    rel="noopener" class="text-primary">Ricardo
                                    Persaud</a>.
                            </p>
                        </footer>

                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTheme } from 'vuetify'

// Theme toggling
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme() {
    theme.global.name.value = isDark.value ? 'light' : 'dark';
}

// Form state
const cif = ref(null)
const exchange_rate = ref(215) // Set a default exchange rate
const vehicleYear = ref(null)
const cc = ref(null)
const fuel = ref('Gasoline')
const vehicle_type = ref('Car')
const plate = ref('P')

const error = ref(null)
const results = ref(null)
const processingFee = 0 // GYD processing fee

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

function calculateGasoline() {
    let dutyRate = 0, exciseRate = 0, vatRate = 0;
    let duty = 0, excise = 0, vat = 0, totalTax = 0;

    if (vehicle_type.value === 'Bike') {
        dutyRate = 0.20;
        vatRate = 0.14;
        if (cc.value > 175) {
            exciseRate = 0.10;
        }
        duty = dutyRate * cif.value;
        excise = exciseRate * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = (duty + excise + vat) * exchange_rate.value;
    } else if (ageCategory.value === 'under4') {
        vatRate = 0.14;
        if (cc.value <= 1500) {
            dutyRate = 0.35;
        } else if (cc.value <= 2000) {
            dutyRate = vehicle_type.value === 'Single Cab' ? 0 : 0.45;
            exciseRate = vehicle_type.value === 'Single Cab' ? 0 : 0.10;
        } else if (cc.value <= 3000) {
            dutyRate = (vehicle_type.value === 'Single Cab' || vehicle_type.value === 'Double Cab') ? 0 : 0.45;
            exciseRate = vehicle_type.value === 'Double Cab' ? 0.75 : (vehicle_type.value === 'Single Cab' ? 0 : 1.10);
        } else { // 4000
            dutyRate = 0.45;
            exciseRate = 1.40;
        }
        duty = dutyRate * cif.value;
        excise = exciseRate * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = (duty + excise + vat) * exchange_rate.value;
    } else { // over4
        duty = 0;
        vat = 0;
        if (cc.value <= 1500) {
            excise = 800000; // This is in GYD
            totalTax = excise;
        } else {
            if (cc.value <= 1800) { excise = (cif.value + 6000) * 0.30 + 6000; }
            else if (cc.value <= 2000) { excise = (cif.value + 6500) * 0.30 + 6500; }
            else if (cc.value <= 3000) { excise = (cif.value + 13500) * 0.70 + 13500; }
            else { excise = (cif.value + 14500) * 1.00 + 14500; }
            totalTax = excise * exchange_rate.value;
        }
    }
    return { duty, excise, vat, totalTax };
}

function calculateDiesel() {
    let dutyRate = 0, exciseRate = 0, vatRate = 0;
    let duty = 0, excise = 0, vat = 0, totalTax = 0;

    if (ageCategory.value === 'under4') {
        vatRate = 0.14;
        if (cc.value <= 1500) {
            dutyRate = 0.35;
        } else if (cc.value <= 2000) {
            dutyRate = (vehicle_type.value === 'Single Cab' || vehicle_type.value === 'Double Cab') ? 0 : 0.45;
            exciseRate = (vehicle_type.value === 'Single Cab' || vehicle_type.value === 'Double Cab') ? 0 : 0.10;
        } else if (cc.value <= 3000) {
            dutyRate = 0.45;
            exciseRate = vehicle_type.value === 'Double Cab' ? 0.75 : (vehicle_type.value === 'Single Cab' ? 0 : 1.10);
        } else { // 4000
            dutyRate = 0.45;
            exciseRate = 1.10;
        }
        duty = dutyRate * cif.value;
        excise = exciseRate * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = (duty + excise + vat) * exchange_rate.value;
    } else { // over4
        duty = 0;
        vat = 0;
        if (cc.value <= 1500) {
            excise = 800000; // GYD
            totalTax = excise;
        } else {
            if (cc.value <= 2000) { excise = (cif.value + 15400) * 0.30 + 15400; }
            else if (cc.value <= 2500) { excise = (cif.value + 15400) * 0.70 + 15400; }
            else if (cc.value <= 3000) { excise = (cif.value + 15500) * 0.70 + 15500; }
            else { excise = (cif.value + 17200) * 1.00 + 17200; }
            totalTax = excise * exchange_rate.value;
        }
    }
    return { duty, excise, vat, totalTax };
}

function calculateTax() {
    error.value = null;
    results.value = null;

    let duty = 0, excise = 0, vat = 0, totalTax = 0;

    if (plate.value === 'G') {
        excise = 2000 * exchange_rate.value;
        totalTax = excise;
    } else if (fuel.value === 'Electric') {
        // No taxes
    } else if (fuel.value === 'Gasoline') {
        const res = calculateGasoline();
        duty = res.duty;
        excise = res.excise;
        vat = res.vat;
        totalTax = res.totalTax;
    } else if (fuel.value === 'Diesel') {
        const res = calculateDiesel();
        duty = res.duty;
        excise = res.excise;
        vat = res.vat;
        totalTax = res.totalTax;
    }

    const cifGyd = cif.value * exchange_rate.value;

    let dutyGyd = 0, exciseGyd = 0, vatGyd = 0;

    if (ageCategory.value === 'under4' && plate.value !== 'G' && fuel.value !== 'Electric') {
        dutyGyd = duty * exchange_rate.value;
        exciseGyd = excise * exchange_rate.value;
        vatGyd = vat * exchange_rate.value;
    } else if (ageCategory.value === 'over4' && plate.value !== 'G') {
        // For older cars, `totalTax` is already in GYD and represents excise tax only.
        exciseGyd = totalTax;
    } else if (plate.value === 'G') {
        exciseGyd = totalTax;
    }

    const totalTaxWithFee = totalTax + processingFee;

    results.value = {
        cifValue: cifGyd,
        duty: dutyGyd, // Already in GYD or 0
        excise: exciseGyd, // Already in GYD or 0
        vat: vatGyd, // Already in GYD or 0
        processingFee,
        totalTax: totalTaxWithFee,
        totalPrice: cifGyd + totalTaxWithFee,
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
</style>
