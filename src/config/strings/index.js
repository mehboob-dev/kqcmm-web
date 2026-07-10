import en from './en.json'
import hinglish from './hinglish.json'
import urdu from './urdu.json'

const all = { en, hinglish, urdu }
const cache = {}

export function loadStrings(lang) {
  if (cache[lang]) return Promise.resolve(cache[lang])
  const data = all[lang] || all.en
  cache[lang] = data
  return Promise.resolve(data)
}

export function getCachedStrings(lang) {
  return cache[lang] || all[lang] || all.en
}
