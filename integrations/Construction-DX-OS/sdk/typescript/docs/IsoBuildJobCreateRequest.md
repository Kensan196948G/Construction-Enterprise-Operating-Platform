
# IsoBuildJobCreateRequest

Operator-supplied parameters for enqueuing a new ISO build.

## Properties

Name | Type
------------ | -------------
`profile` | string
`gitRef` | string
`notes` | string

## Example

```typescript
import type { IsoBuildJobCreateRequest } from 'cdx-client'

// TODO: Update the object below with actual values
const example = {
  "profile": null,
  "gitRef": null,
  "notes": null,
} satisfies IsoBuildJobCreateRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IsoBuildJobCreateRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


