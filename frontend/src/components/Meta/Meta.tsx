import { useEffect } from 'react'

export interface MetaProps {
  title: string
  description: string
}

export function Meta({ title, description }: MetaProps) {
  useEffect(() => {
    document.title = title

    setMeta('og:title', title)
    setMeta('og:description', description)
    setMeta('og:type', 'website')
    setMeta('og:url', window.location.href)

    setMeta('twitter:card', 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
  }, [title, description])

  return null
}

function setMeta(name: string, content: string) {
  const attribute = name.startsWith('og:') ? 'property' : 'name'
  let el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }

  el.setAttribute('content', content)
}
