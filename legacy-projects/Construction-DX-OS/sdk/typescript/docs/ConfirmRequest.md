
# ConfirmRequest


## Properties

Name | Type
------------ | -------------
`serialNumber` | string
`hostname` | string
`profile` | string
`location` | string
`notes` | string

## Example

```typescript
import type { ConfirmRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "serialNumber": null,
  "hostname": null,
  "profile": null,
  "location": null,
  "notes": null,
} satisfies ConfirmRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ConfirmRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


