declare module 'dom-to-image-more' {
  interface Options {
    quality?: number
    width?: number
    height?: number
    style?: Partial<CSSStyleDeclaration>
    bgcolor?: string
    useCORS?: boolean
  }

  function toJpeg(node: HTMLElement, options?: Options): Promise<string>
  function toPng(node: HTMLElement, options?: Options): Promise<string>
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>
  function toSvg(node: HTMLElement, options?: Options): Promise<string>

  export default { toJpeg, toPng, toBlob, toSvg }
}