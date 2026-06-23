# HealthApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**healthHealthGet**](HealthApi.md#healthhealthget) | **GET** /health | Health |
| [**healthLiveHealthLiveGet**](HealthApi.md#healthlivehealthliveget) | **GET** /health/live | Health Live |
| [**healthReadyHealthReadyGet**](HealthApi.md#healthreadyhealthreadyget) | **GET** /health/ready | Health Ready |



## healthHealthGet

> HealthResponse healthHealthGet()

Health

Legacy combined health endpoint (kept stable; identical to /health/ready).

### Example

```ts
import {
  Configuration,
  HealthApi,
} from 'cdx-client';
import type { HealthHealthGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new HealthApi();

  try {
    const data = await api.healthHealthGet();
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

[**HealthResponse**](HealthResponse.md)

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


## healthLiveHealthLiveGet

> LivenessResponse healthLiveHealthLiveGet()

Health Live

Kubernetes-style liveness probe — process-level vitals only.

### Example

```ts
import {
  Configuration,
  HealthApi,
} from 'cdx-client';
import type { HealthLiveHealthLiveGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new HealthApi();

  try {
    const data = await api.healthLiveHealthLiveGet();
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

[**LivenessResponse**](LivenessResponse.md)

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


## healthReadyHealthReadyGet

> HealthResponse healthReadyHealthReadyGet()

Health Ready

Kubernetes-style readiness probe — fails 503 on dependency outage.

### Example

```ts
import {
  Configuration,
  HealthApi,
} from 'cdx-client';
import type { HealthReadyHealthReadyGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new HealthApi();

  try {
    const data = await api.healthReadyHealthReadyGet();
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

[**HealthResponse**](HealthResponse.md)

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

