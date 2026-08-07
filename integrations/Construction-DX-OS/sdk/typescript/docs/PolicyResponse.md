
# PolicyResponse


## Properties

Name | Type
------------ | -------------
`profile` | string
`updateRing` | string
`heartbeatIntervalSeconds` | number
`inventoryIntervalSeconds` | number
`policyVersion` | number

## Example

```typescript
import type { PolicyResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "profile": null,
  "updateRing": null,
  "heartbeatIntervalSeconds": null,
  "inventoryIntervalSeconds": null,
  "policyVersion": null,
} satisfies PolicyResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PolicyResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


