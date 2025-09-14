export default defineNuxtPlugin(() => {
  // only run in real browsers, not dev / localhost
  if (process.env.NODE_ENV === 'development') return

  const host = window.location.hostname
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local')
  if (isLocal) return

  const { public: { clarityId } } = useRuntimeConfig()
  if (!clarityId) return

  // prefer external src (better for CSP than inline)
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.clarity.ms/tag/${clarityId}`
  document.head.appendChild(s)
})
function useRuntimeConfig(): { public: { clarityId: any } } {
    throw new Error("Function not implemented.")
}

function defineNuxtPlugin(arg0: () => void) {
    throw new Error("Function not implemented.")
}

