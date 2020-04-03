interface String {
  codeWrap(lang?: string): string
}

String.prototype.codeWrap = function (lang = 'Markdown'): string {
  return '```' + lang + '\n' + this + '\n```'
}
