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
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

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
    const currency = displayCurrency.value
    const rate = currency === 'USD' ? exchange_rate.value : 1
    const displayValue = val / rate

    return displayValue.toLocaleString('en-US', {
        style: 'currency',
        currency: currency
    })
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
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const drawText = (text, x, y, size = 12, options = {}) => {
        const { align = 'left', font: f = font, color = rgb(0, 0, 0) } = options
        const textWidth = f.widthOfTextAtSize(text, size)
        let drawX = x
        if (align === 'center') drawX = x - textWidth / 2
        if (align === 'right') drawX = x - textWidth
        page.drawText(text, { x: drawX, y, size, font: f, color })
    }
    const wrapText = (text, maxWidth, size) => {
        const words = text.split(' ')
        const lines = []
        let line = ''
        words.forEach(word => {
            const test = line ? `${line} ${word}` : word
            const width = font.widthOfTextAtSize(test, size)
            if (width > maxWidth && line) {
                lines.push(line)
                line = word
            } else {
                line = test
            }
        })
        if (line) lines.push(line)
        return lines
    }
    const margin = 40
    let y = height - margin

    if (estimateInfo.companyLogo) {
        try {
            const base64 = estimateInfo.companyLogo.split(',')[1]
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
            const img = estimateInfo.companyLogo.includes('image/png')
                ? await pdfDoc.embedPng(bytes)
                : await pdfDoc.embedJpg(bytes)
            page.drawImage(img, { x: margin, y: y - 60, width: 60, height: 60 })
        } catch (e) { }
    }

    let infoX = estimateInfo.companyLogo ? margin + 70 : margin
    let infoY = y - 15
    if (estimateInfo.companyName) { drawText(estimateInfo.companyName, infoX, infoY, 12, { font: fontBold }); infoY -= 14 }
    if (estimateInfo.companyAddress) { drawText(estimateInfo.companyAddress, infoX, infoY); infoY -= 14 }
    if (estimateInfo.companyEmail) { drawText(estimateInfo.companyEmail, infoX, infoY); infoY -= 14 }
    if (estimateInfo.companyPhone) { drawText(estimateInfo.companyPhone, infoX, infoY); infoY -= 14 }

    drawText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, width - margin, y - 15, 12, { align: 'right' })

    y -= 80
    drawText('Motor Vehicle Tax Estimate', width / 2, y, 18, { align: 'center', font: fontBold })

    y -= 30
    const hasCustomerInfo = estimateInfo.customerFirstName || estimateInfo.customerLastName || estimateInfo.customerEmail || estimateInfo.customerPhone
    if (hasCustomerInfo) {
        drawText('Customer Details', margin, y, 14, { font: fontBold })
        y -= 18
        const name = [estimateInfo.customerFirstName, estimateInfo.customerLastName].filter(Boolean).join(' ')
        if (name) { drawText(`Name: ${name}`, margin, y); y -= 16 }
        if (estimateInfo.customerEmail) { drawText(`Email: ${estimateInfo.customerEmail}`, margin, y); y -= 16 }
        if (estimateInfo.customerPhone) { drawText(`Phone: ${estimateInfo.customerPhone}`, margin, y); y -= 16 }
        y -= 10
    }

    drawText('Vehicle Details', margin, y, 14, { font: fontBold })
    y -= 18
    const vehicleItems = [
        ['Vehicle Type:', vehicle_type.value],
        ['Vehicle Year:', estimateInfo.vehicleYear || ''],
        ['Vehicle Make:', estimateInfo.vehicleMake || ''],
        ['Vehicle Model:', estimateInfo.vehicleModel || ''],
        ['Engine Capacity:', cc.value ? `${cc.value} ${fuel.value === 'Electric' ? 'KW' : 'CC'}` : ''],
        ['CIF Value:', formatCurrency(results.value.cifValue)],
        ['Exchange Rate:', exchange_rate.value ? String(exchange_rate.value) : '']
    ]
    vehicleItems.forEach(item => {
        if (item[1]) {
            drawText(item[0], margin, y)
            drawText(item[1], width - margin, y, 12, { align: 'right' })
            page.drawLine({
                start: { x: margin, y: y - 4 },
                end: { x: width - margin, y: y - 4 },
                color: rgb(0.8, 0.8, 0.8),
                dashArray: [3]
            })
            y -= 20
        }
    })

    drawText(`Values shown in ${displayCurrency.value}.`, width - margin, y, 10, { align: 'right', color: rgb(0.4, 0.4, 0.4) })

    y -= 30
    const glanceHeight = 60
    const boxWidth = (width - margin * 2 - 20) / 3
    const boxY = y - glanceHeight
    const glanceData = [
        { label: 'CIF', value: formatCurrency(results.value.cifValue), color: rgb(0.25, 0.5, 0.95) },
        { label: 'Taxes', value: formatCurrency(results.value.totalTax), color: rgb(0.85, 0.2, 0.2) },
        { label: 'Total', value: formatCurrency(results.value.totalPrice), color: rgb(0.0, 0.5, 0.3) }
    ]
    glanceData.forEach((g, i) => {
        const x = margin + i * (boxWidth + 10)
        page.drawRectangle({ x, y: boxY, width: boxWidth, height: glanceHeight, color: rgb(0.95, 0.95, 0.95), borderColor: g.color, borderWidth: 1 })
        drawText(g.label, x + boxWidth / 2, boxY + glanceHeight - 18, 12, { align: 'center', font: fontBold, color: g.color })
        drawText(g.value, x + boxWidth / 2, boxY + 20, 14, { align: 'center', font: fontBold, color: g.color })
    })

    y = boxY - 40
    drawText('Taxes & Costs', margin, y, 14, { font: fontBold })
    y -= 18
    const costItems = [
        ['CIF Value:', formatCurrency(results.value.cifValue)],
        ['Customs Duty:', formatCurrency(results.value.duty)],
        ['Excise Tax:', formatCurrency(results.value.excise)],
        ['VAT:', formatCurrency(results.value.vat)],
        ['Processing Fee:', formatCurrency(results.value.processingFee)],
        ['Total Tax Payable:', formatCurrency(results.value.totalTax)],
        ['Final Cost:', formatCurrency(results.value.totalPrice)]
    ]
    costItems.forEach((item, idx) => {
        let f = idx >= 5 ? fontBold : font
        let color = idx === 6 ? rgb(0.0, 0.5, 0.3) : rgb(0, 0, 0)
        drawText(item[0], margin, y, 12, { font: f, color })
        drawText(item[1], width - margin, y, 12, { align: 'right', font: f, color })
        page.drawLine({
            start: { x: margin, y: y - 4 },
            end: { x: width - margin, y: y - 4 },
            color: rgb(0.8, 0.8, 0.8),
            dashArray: [3]
        })
        y -= 20
    })

    y -= 10
    const formulaLines = []
    const formulas = results.value.formulas
    if (results.value.duty > 0 && formulas?.dutyRate) {
        formulaLines.push({
            title: 'Customs Duty',
            formula: `(CIF × Duty Rate) = ${formatCurrency(results.value.cifValue)} × ${(formulas.dutyRate * 100).toFixed(2)}% = ${formatCurrency(results.value.duty)}`
        })
    }
    if (results.value.excise > 0 && formulas?.exciseType) {
        if (formulas.exciseType === 'rate') {
            const base = results.value.cifValue + results.value.duty
            formulaLines.push({
                title: 'Excise Tax',
                formula: `((CIF + Duty) × Excise Rate) = ${formatCurrency(base)} × ${(formulas.exciseRate * 100).toFixed(2)}% = ${formatCurrency(results.value.excise)}`
            })
        } else if (formulas.exciseType === 'compound') {
            const constVal = formulas.exciseConstUSD * exchange_rate.value
            const base = results.value.cifValue + constVal
            const constStr = `US$${formulas.exciseConstUSD.toLocaleString()}`
            formulaLines.push({
                title: 'Excise Tax',
                formula: `((CIF + ${constStr}) × Excise Rate + ${constStr}) = ${formatCurrency(base)} × ${(formulas.exciseRate * 100).toFixed(2)}% + ${formatCurrency(constVal)} = ${formatCurrency(results.value.excise)}`
            })
        } else if (formulas.exciseType === 'flat') {
            const flat = displayCurrency.value === 'USD' ? formulas.exciseFlatGYD / exchange_rate.value : formulas.exciseFlatGYD
            const flatConstStr = `GY$${formulas.exciseFlatGYD.toLocaleString()}`
            formulaLines.push({
                title: 'Excise Tax',
                formula: `(Flat Amount ${flatConstStr}) = ${formatCurrency(flat)}`
            })
        }
    }
    if (results.value.vat > 0 && formulas?.vatRate) {
        const base = results.value.cifValue + results.value.duty + results.value.excise
        formulaLines.push({
            title: 'VAT',
            formula: `((CIF + Duty + Excise) × VAT Rate) = ${formatCurrency(base)} × ${(formulas.vatRate * 100).toFixed(2)}% = ${formatCurrency(results.value.vat)}`
        })
    }
    const formulaColor = rgb(0.5, 0.5, 0.5)
    formulaLines.forEach(({ title, formula }) => {
        drawText(title, margin, y, 10, { font: fontBold, color: formulaColor })
        const lines = wrapText(formula, width - margin * 2, 10)
        lines.forEach((line, i) => {
            drawText(line, margin, y - (i + 1) * 12, 10, { color: formulaColor })
        })
        y -= (lines.length + 1) * 12 + 4
    })

    const disclaimer = 'This calculator provides an estimate for informational purposes only and should not be considered as financial or legal advice. The figures are based on publicly available information from the Guyana Revenue Authority (GRA) but we cannot guarantee their accuracy or timeliness. This tool is not affiliated with or endorsed by the GRA. The developers of this tool are not liable for any errors, omissions, or for any loss or damage arising from its use. You are solely responsible for verifying the accuracy of the results with the GRA or a qualified tax professional.';
    const disclaimerLines = wrapText(disclaimer, width - margin * 2, 10)
    const graWebsite = 'Official Source: https://www.gra.gov.gy/imports/motor-vehicle/';

    // Calculate Y position for the top of the footer, assuming it's at the bottom of the page.
    let footerTopY = margin + (disclaimerLines.length - 1) * 12;

    // If the content (y) would overlap with the footer, position footer below content.
    if (y < footerTopY + 20) { // 20px padding
        footerTopY = y - 30; // 30px space below content
    }

    // Draw disclaimer text, from top to bottom.
    let currentY = footerTopY;
    disclaimerLines.forEach((line) => {
        drawText(line, width / 2, currentY, 10, { align: 'center', color: rgb(0.4, 0.4, 0.4) });
        currentY -= 12;
    });

    // Draw GRA website link below disclaimer.
    drawText(graWebsite, width / 2, currentY, 10, { align: 'center', color: rgb(0.4, 0.4, 0.4) });

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
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

function fitText(el) {
    if (!el || !el.parentElement) return

    // Reset to stylesheet value to get a baseline
    el.style.fontSize = ''

    const parent = el.parentElement
    const parentStyle = window.getComputedStyle(parent)
    const availableWidth = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight)

    // Only resize if the text is actually overflowing
    if (el.scrollWidth > availableWidth) {
        const currentFontSize = parseFloat(window.getComputedStyle(el).fontSize)
        // Calculate the new font size based on the ratio of available width to text width.
        const newFontSize = Math.floor(currentFontSize * (availableWidth / el.scrollWidth))
        const minFontSize = 10 // px
        el.style.fontSize = Math.max(newFontSize, minFontSize) + 'px'
    }
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

function calculateGasoline() {
    let duty = 0, excise = 0, vat = 0, totalTax = 0;
    let dutyRate = 0, exciseRate = 0, vatRate = 0, exciseType = null, exciseConstUSD = 0, exciseFlatGYD = 0;

    if (vehicle_type.value === 'Bike') {
        dutyRate = 0.20;
        if (cc.value > 175) {
            exciseRate = 0.10;
        }
        exciseType = 'rate';
        vatRate = 0.14;
        duty = dutyRate * cif.value;
        excise = exciseRate * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = duty + excise + vat;
    } else if (ageCategory.value === 'under4') {
        vatRate = 0.14;
        if (cc.value <= 1500) {
            dutyRate = 0.35;
            exciseRate = 0;
        } else if (cc.value <= 2000) {
            dutyRate = 0.45;
            exciseRate = 0.10;
        } else if (cc.value <= 3000) {
            dutyRate = 0.45;
            exciseRate = 1.10;
        } else {
            dutyRate = 0.45;
            exciseRate = 1.40;
        }
        exciseType = 'rate';
        duty = dutyRate * cif.value;
        excise = exciseRate * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = duty + excise + vat;
    } else { // over4
        dutyRate = 0;
        vatRate = 0;
        if (cc.value <= 1000) {
            exciseType = 'flat';
            exciseFlatGYD = 800000;
            excise = exciseFlatGYD / exchange_rate.value;
            totalTax = excise;
        } else if (cc.value <= 1500) {
            exciseType = 'flat';
            exciseFlatGYD = 800000;
            excise = exciseFlatGYD / exchange_rate.value;
            totalTax = excise;
        } else if (cc.value <= 1800) {
            exciseType = 'compound';
            exciseConstUSD = 6000;
            exciseRate = 0.30;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else if (cc.value <= 2000) {
            exciseType = 'compound';
            exciseConstUSD = 6500;
            exciseRate = 0.30;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else if (cc.value <= 3000) {
            exciseType = 'compound';
            exciseConstUSD = 13500;
            exciseRate = 0.70;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else {
            exciseType = 'compound';
            exciseConstUSD = 14500;
            exciseRate = 1.00;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        }
    }
    return { duty, excise, vat, totalTax, dutyRate, exciseRate, vatRate, exciseType, exciseConstUSD, exciseFlatGYD };
}

function calculateDiesel() {
    let duty = 0, excise = 0, vat = 0, totalTax = 0;
    let dutyRate = 0, exciseRate = 0, vatRate = 0, exciseType = null, exciseConstUSD = 0, exciseFlatGYD = 0;

    if (ageCategory.value === 'under4') {
        vatRate = 0.14;
        if (cc.value <= 1500) {
            dutyRate = 0.35;
            exciseRate = 0;
        } else if (cc.value <= 2000) {
            dutyRate = 0.45;
            exciseRate = 0.10;
        } else if (cc.value <= 2500) {
            dutyRate = 0.45;
            exciseRate = 1.10;
        } else {
            dutyRate = 0.45;
            exciseRate = 1.10;
        }
        exciseType = 'rate';
        duty = dutyRate * cif.value;
        excise = (exciseRate || 0) * (duty + cif.value);
        vat = (cif.value + duty + excise) * vatRate;
        totalTax = duty + excise + vat;
    } else { // over4
        dutyRate = 0;
        vatRate = 0;
        if (cc.value <= 1500) {
            exciseType = 'flat';
            exciseFlatGYD = 800000;
            excise = exciseFlatGYD / exchange_rate.value;
            totalTax = excise;
        } else if (cc.value <= 2000) {
            exciseType = 'compound';
            exciseConstUSD = 15400;
            exciseRate = 0.30;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else if (cc.value <= 2500) {
            exciseType = 'compound';
            exciseConstUSD = 15400;
            exciseRate = 0.70;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else if (cc.value <= 3000) {
            exciseType = 'compound';
            exciseConstUSD = 15500;
            exciseRate = 0.70;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        } else {
            exciseType = 'compound';
            exciseConstUSD = 17200;
            exciseRate = 1.00;
            excise = (cif.value + exciseConstUSD) * exciseRate + exciseConstUSD;
            totalTax = excise;
        }
        duty = 0;
        vat = 0;
    }
    return { duty, excise, vat, totalTax, dutyRate, exciseRate, vatRate, exciseType, exciseConstUSD, exciseFlatGYD };
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
        taxResultsUSD = calculateGasoline();
    } else if (fuel.value === 'Diesel') {
        taxResultsUSD = calculateDiesel();
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
