# cdx_client.HealthApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**health_health_get**](HealthApi.md#health_health_get) | **GET** /health | Health
[**health_live_health_live_get**](HealthApi.md#health_live_health_live_get) | **GET** /health/live | Health Live
[**health_ready_health_ready_get**](HealthApi.md#health_ready_health_ready_get) | **GET** /health/ready | Health Ready


# **health_health_get**
> HealthResponse health_health_get()

Health

Legacy combined health endpoint (kept stable; identical to /health/ready).

### Example


```python
import cdx_client
from cdx_client.models.health_response import HealthResponse
from cdx_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = cdx_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with cdx_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = cdx_client.HealthApi(api_client)

    try:
        # Health
        api_response = api_instance.health_health_get()
        print("The response of HealthApi->health_health_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling HealthApi->health_health_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **health_live_health_live_get**
> LivenessResponse health_live_health_live_get()

Health Live

Kubernetes-style liveness probe — process-level vitals only.

### Example


```python
import cdx_client
from cdx_client.models.liveness_response import LivenessResponse
from cdx_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = cdx_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with cdx_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = cdx_client.HealthApi(api_client)

    try:
        # Health Live
        api_response = api_instance.health_live_health_live_get()
        print("The response of HealthApi->health_live_health_live_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling HealthApi->health_live_health_live_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**LivenessResponse**](LivenessResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **health_ready_health_ready_get**
> HealthResponse health_ready_health_ready_get()

Health Ready

Kubernetes-style readiness probe — fails 503 on dependency outage.

### Example


```python
import cdx_client
from cdx_client.models.health_response import HealthResponse
from cdx_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = cdx_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with cdx_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = cdx_client.HealthApi(api_client)

    try:
        # Health Ready
        api_response = api_instance.health_ready_health_ready_get()
        print("The response of HealthApi->health_ready_health_ready_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling HealthApi->health_ready_health_ready_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

