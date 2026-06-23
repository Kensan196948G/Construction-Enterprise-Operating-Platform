# PolicyApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getPolicyApiV1PolicyGet**](PolicyApi.md#getpolicyapiv1policyget) | **GET** /api/v1/policy | Get Policy |



## getPolicyApiV1PolicyGet

> PolicyResponse getPolicyApiV1PolicyGet()

Get Policy

### Example

```ts
import {
  Configuration,
  PolicyApi,
} from 'cdx-client';
import type { GetPolicyApiV1PolicyGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new PolicyApi();

  try {
    const data = await api.getPolicyApiV1PolicyGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**PolicyResponse**](PolicyResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

