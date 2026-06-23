
# PXERollbackRequest

Operator-initiated rollback request (from Admin WebUI or CLI).

## Properties

Name | Type
------------ | -------------
`pattern` | [PXERollbackPattern](PXERollbackPattern.md)
`reason` | string
`targetVersion` | string
`profile` | string
`ring` | string
`site` | string
`deviceMac` | string
`backupPxeIp` | string

## Example

```typescript
import type { PXERollbackRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "pattern": null,
  "reason": null,
  "targetVersion": null,
  "profile": null,
  "ring": null,
  "site": null,
  "deviceMac": null,
  "backupPxeIp": null,
} satisfies PXERollbackRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PXERollbackRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


