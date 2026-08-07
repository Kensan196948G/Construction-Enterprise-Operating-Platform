# DevicesApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**registerDeviceApiV1DevicesRegisterPost**](DevicesApi.md#registerdeviceapiv1devicesregisterpost) | **POST** /api/v1/devices/register | Register Device |



## registerDeviceApiV1DevicesRegisterPost

> RegisterResponse registerDeviceApiV1DevicesRegisterPost(registerRequest)

Register Device

### Example

```ts
import {
  Configuration,
  DevicesApi,
} from 'cdx-client';
import type { RegisterDeviceApiV1DevicesRegisterPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new DevicesApi();

  const body = {
    // RegisterRequest
    registerRequest: ...,
  } satisfies RegisterDeviceApiV1DevicesRegisterPostRequest;

  try {
    const data = await api.registerDeviceApiV1DevicesRegisterPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **registerRequest** | [RegisterRequest](RegisterRequest.md) |  | |

### Return type

[**RegisterResponse**](RegisterResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

