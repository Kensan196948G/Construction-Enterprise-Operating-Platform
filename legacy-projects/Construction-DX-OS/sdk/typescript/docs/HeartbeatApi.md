# HeartbeatApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**ingestHeartbeatApiV1HeartbeatPost**](HeartbeatApi.md#ingestheartbeatapiv1heartbeatpost) | **POST** /api/v1/heartbeat | Ingest Heartbeat |



## ingestHeartbeatApiV1HeartbeatPost

> HeartbeatResponse ingestHeartbeatApiV1HeartbeatPost()

Ingest Heartbeat

### Example

```ts
import {
  Configuration,
  HeartbeatApi,
} from 'cdx-client';
import type { IngestHeartbeatApiV1HeartbeatPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new HeartbeatApi();

  try {
    const data = await api.ingestHeartbeatApiV1HeartbeatPost();
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

[**HeartbeatResponse**](HeartbeatResponse.md)

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

