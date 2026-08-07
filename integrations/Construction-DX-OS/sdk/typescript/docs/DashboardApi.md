# DashboardApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**dashboardApiV1DashboardGet**](DashboardApi.md#dashboardapiv1dashboardget) | **GET** /api/v1/dashboard | Dashboard |



## dashboardApiV1DashboardGet

> DashboardResponse dashboardApiV1DashboardGet()

Dashboard

Aggregate dashboard summary — devices + ISO builds + server health.

### Example

```ts
import {
  Configuration,
  DashboardApi,
} from 'cdx-client';
import type { DashboardApiV1DashboardGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new DashboardApi();

  try {
    const data = await api.dashboardApiV1DashboardGet();
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

[**DashboardResponse**](DashboardResponse.md)

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

