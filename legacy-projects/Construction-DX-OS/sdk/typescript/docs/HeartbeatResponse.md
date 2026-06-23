
# HeartbeatResponse


## Properties

Name | Type
------------ | -------------
`accepted` | boolean
`duplicate` | boolean
`receivedAt` | Date

## Example

```typescript
import type { HeartbeatResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "accepted": null,
  "duplicate": null,
  "receivedAt": null,
} satisfies HeartbeatResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as HeartbeatResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


