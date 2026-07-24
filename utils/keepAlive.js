// Pings the server every 14 minutes to prevent Render free tier sleep
export function keepAlive(url) {
  if (process.env.NODE_ENV !== "production") return

  setInterval(async () => {
    try {
      const res = await fetch(url)
      console.log(`✅ Keep alive ping: ${res.status}`)
    } catch (err) {
      console.error("❌ Keep alive failed:", err.message)
    }
  }, 14 * 60 * 1000) // every 14 minutes
}