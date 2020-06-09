# authie

A small JavaScript OAuth/OpenID Connect client library

## Relevant docs

* [Microsoft identity platform and OAuth 2.0 authorization code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
* [RFC 7636 - Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636#section-4.1)
* [RFC 6819 - OAuth 2.0 Threat Model and Security Considerations](https://tools.ietf.org/html/rfc6819#section-4.4.1.1)
* [DRAFT - OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-14#section-4.13)

## Required DOM APIs

TODO: Check MDN for polyfills too

- Uint8Array
- [atob/btoa](https://npm.im/Base64)
- crypto.getRandomValues
- crypto.subtle.digest
- String.fromCharCode
- URL/URLSearchParams
	- Requires `fetch` also understand URLSearchParams
- [fetch](https://npm.im/unfetch)
- [Promise](https://npm.im/promise-polyfill)
- [TextEncoder](https://www.npmjs.com/package/fast-text-encoding)
