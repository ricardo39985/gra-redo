import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PdfOptions {
    results: any
    estimateInfo: any
    vehicleType: string
    cc: number | null
    fuel: string
    exchangeRate: number
    displayCurrency: string
    formatCurrency: (val: number) => string
}

export async function createEstimatePdf({
    results,
    estimateInfo,
    vehicleType,
    cc,
    fuel,
    exchangeRate,
    displayCurrency,
    formatCurrency
}: PdfOptions): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const drawText = (text: string, x: number, y: number, size = 12, options: any = {}) => {
        const { align = 'left', font: f = font, color = rgb(0, 0, 0) } = options
        const textWidth = f.widthOfTextAtSize(text, size)
        let drawX = x
        if (align === 'center') drawX = x - textWidth / 2
        if (align === 'right') drawX = x - textWidth
        page.drawText(text, { x: drawX, y, size, font: f, color })
    }

    const wrapText = (text: string, maxWidth: number, size: number) => {
        const words = text.split(' ')
        const lines: string[] = []
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
    const vehicleItems: [string, string][] = [
        ['Vehicle Type:', vehicleType],
        ['Vehicle Year:', estimateInfo.vehicleYear || ''],
        ['Vehicle Make:', estimateInfo.vehicleMake || ''],
        ['Vehicle Model:', estimateInfo.vehicleModel || ''],
        ['Engine Capacity:', cc ? `${cc} ${fuel === 'Electric' ? 'KW' : 'CC'}` : ''],
        ['CIF Value:', formatCurrency(results.cifValue)],
        ['Exchange Rate:', exchangeRate ? String(exchangeRate) : '']
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

    drawText(`Values shown in ${displayCurrency}.`, width - margin, y, 10, { align: 'right', color: rgb(0.4, 0.4, 0.4) })

    y -= 30
    const glanceHeight = 60
    const boxWidth = (width - margin * 2 - 20) / 3
    const boxY = y - glanceHeight
    const glanceData = [
        { label: 'CIF', value: formatCurrency(results.cifValue), color: rgb(0.25, 0.5, 0.95) },
        { label: 'Taxes', value: formatCurrency(results.totalTax), color: rgb(0.85, 0.2, 0.2) },
        { label: 'Total', value: formatCurrency(results.totalPrice), color: rgb(0.0, 0.5, 0.3) }
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
    const costItems: [string, string][] = [
        ['CIF Value:', formatCurrency(results.cifValue)],
        ['Customs Duty:', formatCurrency(results.duty)],
        ['Excise Tax:', formatCurrency(results.excise)],
        ['VAT:', formatCurrency(results.vat)],
        ['Processing Fee:', formatCurrency(results.processingFee)],
        ['Total Tax Payable:', formatCurrency(results.totalTax)],
        ['Final Cost:', formatCurrency(results.totalPrice)]
    ]
    costItems.forEach((item, idx) => {
        const f = idx >= 5 ? fontBold : font
        const color = idx === 6 ? rgb(0.0, 0.5, 0.3) : rgb(0, 0, 0)
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
    const formulaLines: { title: string; formula: string }[] = []
    const formulas = results.formulas
    if (results.duty > 0 && formulas?.dutyRate) {
        formulaLines.push({
            title: 'Customs Duty',
            formula: `(CIF × Duty Rate) = ${formatCurrency(results.cifValue)} × ${(formulas.dutyRate * 100).toFixed(2)}% = ${formatCurrency(results.duty)}`
        })
    }
    if (results.excise > 0 && formulas?.exciseType) {
        if (formulas.exciseType === 'rate') {
            const base = results.cifValue + results.duty
            formulaLines.push({
                title: 'Excise Tax',
                formula: `((CIF + Duty) × Excise Rate) = ${formatCurrency(base)} × ${(formulas.exciseRate * 100).toFixed(2)}% =${formatCurrency(results.excise)}`
            })
        } else if (formulas.exciseType === 'compound') {
            const constVal = formulas.exciseConstUSD * exchangeRate
            const base = results.cifValue + constVal
            const constStr = `US$${formulas.exciseConstUSD.toLocaleString()}`
            formulaLines.push({
                title: 'Excise Tax',
                formula: `((CIF + ${constStr}) × Excise Rate + ${constStr}) = ${formatCurrency(base)} × ${(formulas.exciseRate * 100).toFixed(2)}% + ${formatCurrency(constVal)} = ${formatCurrency(results.excise)}`
            })
        } else if (formulas.exciseType === 'flat') {
            const flat = displayCurrency === 'USD' ? formulas.exciseFlatGYD / exchangeRate : formulas.exciseFlatGYD
            const flatConstStr = `GY$${formulas.exciseFlatGYD.toLocaleString()}`
            formulaLines.push({
                title: 'Excise Tax',
                formula: `(Flat Amount ${flatConstStr}) = ${formatCurrency(flat)}`
            })
        }
    }
    if (results.vat > 0 && formulas?.vatRate) {
        const base = results.cifValue + results.duty + results.excise
        formulaLines.push({
            title: 'VAT',
            formula: `((CIF + Duty + Excise) × VAT Rate) = ${formatCurrency(base)} × ${(formulas.vatRate * 100).toFixed(2)}% = ${formatCurrency(results.vat)}`
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

    const disclaimer = 'This calculator provides an estimate for informational purposes only and should not be considered as financial or legal advice. The figures are based on publicly available information from the Guyana Revenue Authority (GRA) but we cannot guarantee their accuracy or timeliness. This tool is not affiliated with or endorsed by the GRA. The developers of this tool are not liable for any errors, omissions, or for any loss or damage arising from its use. You are solely responsible for verifying the accuracy of the results with the GRA or a qualified tax professional.'
    const disclaimerLines = wrapText(disclaimer, width - margin * 2, 10)
    const graWebsite = 'Official Source: https://www.gra.gov.gy/imports/motor-vehicle/'

    let footerTopY = margin + (disclaimerLines.length - 1) * 12
    if (y < footerTopY + 20) {
        footerTopY = y - 30
    }

    let currentY = footerTopY
    disclaimerLines.forEach((line) => {
        drawText(line, width / 2, currentY, 10, { align: 'center', color: rgb(0.4, 0.4, 0.4) })
        currentY -= 12
    })
    drawText(graWebsite, width / 2, currentY, 10, { align: 'center', color: rgb(0.4, 0.4, 0.4) })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
}
