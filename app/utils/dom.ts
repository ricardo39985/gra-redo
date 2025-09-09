export function fitText(el: HTMLElement | null) {
    if (!el || !el.parentElement) return

    el.style.fontSize = ''

    const parent = el.parentElement
    const parentStyle = window.getComputedStyle(parent)
    const availableWidth = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight)

    if (el.scrollWidth > availableWidth) {
        const currentFontSize = parseFloat(window.getComputedStyle(el).fontSize)
        const newFontSize = Math.floor(currentFontSize * (availableWidth / el.scrollWidth))
        const minFontSize = 10
        el.style.fontSize = Math.max(newFontSize, minFontSize) + 'px'
    }
}
