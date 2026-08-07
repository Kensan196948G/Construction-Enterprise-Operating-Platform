
# DashboardResponse


## Properties

Name | Type
------------ | -------------
`devices` | [DeviceSummary](DeviceSummary.md)
`isoBuilds` | [IsoBuildSummary](IsoBuildSummary.md)
`server` | [ServerSummary](ServerSummary.md)

## Example

```typescript
import type { DashboardResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "devices": null,
  "isoBuilds": null,
  "server": null,
} satisfies DashboardResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DashboardResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


