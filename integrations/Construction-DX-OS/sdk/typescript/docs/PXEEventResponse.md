
# PXEEventResponse

Acknowledgement returned to agent-bootstrap.sh.

## Properties

Name | Type
------------ | -------------
`recorded` | boolean
`event` | [PXEBootEvent](PXEBootEvent.md)

## Example

```typescript
import type { PXEEventResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "recorded": null,
  "event": null,
} satisfies PXEEventResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PXEEventResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


