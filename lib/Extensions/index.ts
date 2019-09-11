interface String {
  codeWrap(lang?: string): string
}

String.prototype.codeWrap = function(lang: string = 'Markdown'): string {
  return '```' + lang + '\n' + this + '\n```'
}
