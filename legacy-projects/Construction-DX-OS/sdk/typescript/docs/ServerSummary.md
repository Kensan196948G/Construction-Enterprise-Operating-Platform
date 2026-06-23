
# ServerSummary


## Properties

Name | Type
------------ | -------------
`storage` | string
`redis` | string
`uptimeSeconds` | number

## Example

```typescript
import type { ServerSummary } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "storage": null,
  "redis": null,
  "uptimeSeconds": null,
} satisfies ServerSummary

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ServerSummary
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


