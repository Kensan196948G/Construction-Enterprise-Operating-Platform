
# PXEEventRequest

Payload from agent-bootstrap.sh reporting a boot event.

## Properties

Name | Type
------------ | -------------
`event` | [PXEBootEvent](PXEBootEvent.md)
`profile` | string
`fingerprint` | string
`durationSeconds` | number
`errorMessage` | string

## Example

```typescript
import type { PXEEventRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "event": null,
  "profile": null,
  "fingerprint": null,
  "durationSeconds": null,
  "errorMessage": null,
} satisfies PXEEventRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PXEEventRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


