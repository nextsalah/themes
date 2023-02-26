import type { IField } from  "./field";

export type ParseResult<T> = 
| { parsed: T; hasError: false; error?: undefined }
| { parsed?: undefined; hasError: true; error?: unknown }

export type customTemplatesType = { [key: string]:   string | number | boolean | null | undefined }

export function iscustomTemplatesType(o: any): o is customTemplatesType {
  if (typeof o !== 'object') return false
  if (o === null) return false
  return true
}

export  type allThemesType ={ value: string; name: string;}


export interface configType {
  name: string
  description: string
  version: string
  authors: { name: string; github_profile: string }[]
}

export function isconfigType(o: any): o is configType {
  if (typeof o.name !== 'string') return false
  if (typeof o.description !== 'string') return false
  if (typeof o.version !== 'string') return false
  if (!Array.isArray(o.authors)) return false
  if (o.authors.length === 0) return false
  for (const author of o.authors) {
    if (typeof author.name !== 'string') return false
    if (typeof author.github_profile !== 'string') return false
  }
  return true
}

export type templatesType = IField[];
export type defaultTemplatesType = { [key: string]: string | number | boolean | null | undefined };

export function isTemplatesType(o: any): o is templatesType {
  if (!Array.isArray(o)) return false
  if (o.length === 0) return false
  for (const input of o) {
    if (
      !input.hasOwnProperty('type') ||
      !input.hasOwnProperty('name') ||
      !input.hasOwnProperty('attributes')
    ) {
      return false;
    }
    if (typeof input.type !== 'string') return false
    if (typeof input.name !== 'string') return false
    if (typeof input.attributes !== 'object') return false
  }

  return true
}

