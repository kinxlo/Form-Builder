import { setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  // Some clients/extensions occasionally request the directory itself: GET /_nuxt/
  // Nuxt serves built assets under /_nuxt/* (hashed files), so this exact path 404s.
  // Returning 204 avoids noisy dev logs without affecting real asset requests.
  setResponseStatus(event, 204)
  return ''
})
