
# RegisterRequest

Provisioning payload: registers a device and its shared secret.

## Properties

Name | Type
------------ | -------------
`deviceId` | string
`profile` | string
`hostname` | string
`sharedSecret` | string

## Example

```typescript
import type { RegisterRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "profile": null,
  "hostname": null,
  "sharedSecret": null,
} satisfies RegisterRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RegisterRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


