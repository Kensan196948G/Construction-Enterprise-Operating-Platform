
# DeviceSummary


## Properties

Name | Type
------------ | -------------
`total` | number
`online` | number
`offline` | number
`warning` | number

## Example

```typescript
import type { DeviceSummary } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "total": null,
  "online": null,
  "offline": null,
  "warning": null,
} satisfies DeviceSummary

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeviceSummary
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


