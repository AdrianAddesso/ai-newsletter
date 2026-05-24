const svgNamespace = 'http://www.w3.org/2000/svg'
const keywordTextAttributes = {
  id: 'editable-text',
  class: 'cls-1',
  x: '443.585',
  y: '78.08',
  'text-anchor': 'middle',
  'dominant-baseline': 'middle',
  'font-family': 'system-ui, sans-serif',
  'font-size': '56',
  'font-weight': '700',
} as const

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureKeywordTextNode(document: XMLDocument): Element | null {
  const existingTextNode = document.querySelector('#editable-text')

  if (existingTextNode) {
    return existingTextNode
  }

  const textGroup = document.querySelector('#Text')

  if (!textGroup) {
    return null
  }

  const createdTextNode = document.createElementNS(svgNamespace, 'text')

  Object.entries(keywordTextAttributes).forEach(([attributeName, attributeValue]) => {
    createdTextNode.setAttribute(attributeName, attributeValue)
  })

  while (textGroup.firstChild) {
    textGroup.removeChild(textGroup.firstChild)
  }

  textGroup.appendChild(createdTextNode)
  return createdTextNode
}

function namespaceSvgDocument(document: XMLDocument, suffix: string): void {
  const idMap = new Map<string, string>()
  const classNames = new Set<string>()

  document.querySelectorAll('[id]').forEach((element) => {
    const currentId = element.getAttribute('id')

    if (!currentId) {
      return
    }

    const nextId = `${currentId}-${suffix}`
    idMap.set(currentId, nextId)
    element.setAttribute('id', nextId)
  })

  document.querySelectorAll('[class]').forEach((element) => {
    const classAttribute = element.getAttribute('class')

    if (!classAttribute) {
      return
    }

    const namespacedClasses = classAttribute
      .split(/\s+/)
      .filter(Boolean)
      .map((className) => {
        classNames.add(className)
        return `${className}-${suffix}`
      })

    element.setAttribute('class', namespacedClasses.join(' '))
  })

  document.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      let nextValue = attribute.value

      idMap.forEach((nextId, currentId) => {
        nextValue = nextValue.replaceAll(`url(#${currentId})`, `url(#${nextId})`)

        if (nextValue === `#${currentId}`) {
          nextValue = `#${nextId}`
        }
      })

      if (nextValue !== attribute.value) {
        element.setAttribute(attribute.name, nextValue)
      }
    })
  })

  document.querySelectorAll('style').forEach((styleElement) => {
    const styleContent = styleElement.textContent

    if (!styleContent) {
      return
    }

    let nextStyleContent = styleContent

    classNames.forEach((className) => {
      nextStyleContent = nextStyleContent.replace(
        new RegExp(`\\.${escapeRegExp(className)}(?![a-zA-Z0-9_-])`, 'g'),
        `.${className}-${suffix}`,
      )
    })

    styleElement.textContent = nextStyleContent
  })
}

export function buildKeywordSvgMarkup(
  svgTemplate: string,
  value: string,
  uniqueId: string,
): string {
  const normalizedUniqueId =
    uniqueId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'keyword'

  const parser = new DOMParser()
  const document = parser.parseFromString(svgTemplate, 'image/svg+xml')
  const parserError = document.querySelector('parsererror')

  if (parserError) {
    return svgTemplate
  }

  const editableTextNode = ensureKeywordTextNode(document)

  if (editableTextNode) {
    editableTextNode.textContent = value
  }

  namespaceSvgDocument(document, normalizedUniqueId)

  return new XMLSerializer().serializeToString(document)
}
