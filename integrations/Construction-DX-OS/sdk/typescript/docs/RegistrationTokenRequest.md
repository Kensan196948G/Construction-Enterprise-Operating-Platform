
# RegistrationTokenRequest

Body for POST /api/v1/devices/registration-tokens.

## Properties

Name | Type
------------ | -------------
`profile` | string
`fingerprint` | string

## Example

```typescript
import type { RegistrationTokenRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "profile": null,
  "fingerprint": null,
} satisfies RegistrationTokenRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RegistrationTokenRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


