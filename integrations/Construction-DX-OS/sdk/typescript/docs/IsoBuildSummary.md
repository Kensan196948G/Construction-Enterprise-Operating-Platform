
# IsoBuildSummary


## Properties

Name | Type
------------ | -------------
`total` | number
`running` | number
`succeeded` | number
`failed` | number
`cancelled` | number

## Example

```typescript
import type { IsoBuildSummary } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "total": null,
  "running": null,
  "succeeded": null,
  "failed": null,
  "cancelled": null,
} satisfies IsoBuildSummary

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IsoBuildSummary
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


