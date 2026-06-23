
# PXERollbackResponse

Rollback intent recorded + script command returned for operator execution.

## Properties

Name | Type
------------ | -------------
`recorded` | boolean
`pattern` | [PXERollbackPattern](PXERollbackPattern.md)
`auditId` | string
`scriptName` | string
`command` | string

## Example

```typescript
import type { PXERollbackResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "recorded": null,
  "pattern": null,
  "auditId": null,
  "scriptName": null,
  "command": null,
} satisfies PXERollbackResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PXERollbackResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


