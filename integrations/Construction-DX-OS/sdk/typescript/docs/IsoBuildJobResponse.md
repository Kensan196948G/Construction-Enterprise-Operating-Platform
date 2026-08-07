
# IsoBuildJobResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`profile` | string
`requestedBy` | string
`status` | string
`gitRef` | string
`startedAt` | Date
`finishedAt` | Date
`isoPath` | string
`isoSha256` | string
`isoSizeBytes` | number
`logPath` | string
`errorMessage` | string
`notes` | string
`createdAt` | Date

## Example

```typescript
import type { IsoBuildJobResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "profile": null,
  "requestedBy": null,
  "status": null,
  "gitRef": null,
  "startedAt": null,
  "finishedAt": null,
  "isoPath": null,
  "isoSha256": null,
  "isoSizeBytes": null,
  "logPath": null,
  "errorMessage": null,
  "notes": null,
  "createdAt": null,
} satisfies IsoBuildJobResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IsoBuildJobResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


