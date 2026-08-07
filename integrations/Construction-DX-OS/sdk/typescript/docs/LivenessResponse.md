
# LivenessResponse

Liveness probe response — process-level vitals only.  Deliberately excludes storage/redis status: a downstream outage must not trigger pod restart. Use ``/health/ready`` (or legacy ``/health``) for deep dependency checks.

## Properties

Name | Type
------------ | -------------
`status` | string
`service` | string
`version` | string
`uptimeSeconds` | number

## Example

```typescript
import type { LivenessResponse } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "status": null,
  "service": null,
  "version": null,
  "uptimeSeconds": null,
} satisfies LivenessResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LivenessResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


