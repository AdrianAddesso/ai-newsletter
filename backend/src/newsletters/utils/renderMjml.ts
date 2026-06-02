import mjml2html from 'mjml'

export async function renderMjml(mjml: string): Promise<string> {
  const { html, errors } = await mjml2html(mjml, {
    validationLevel: 'soft',
  })

  if (errors.length > 0) {
    console.warn('MJML warnings:', errors)
  }

  return html
}