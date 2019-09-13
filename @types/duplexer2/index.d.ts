/// <reference types="node" />

declare module 'duplexer2' {
  import { Readable, Duplex, DuplexOptions, Writable } from 'stream'
  import { UrlWithStringQuery } from 'url'
  import { IncomingMessage } from 'http'

  export = duplexer2

  function duplexer2(writable: Writable, readable: Readable, options?: DuplexOptions): Duplex
}
