# cdx_client.HeartbeatApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**ingest_heartbeat_api_v1_heartbeat_post**](HeartbeatApi.md#ingest_heartbeat_api_v1_heartbeat_post) | **POST** /api/v1/heartbeat | Ingest Heartbeat


# **ingest_heartbeat_api_v1_heartbeat_post**
> HeartbeatResponse ingest_heartbeat_api_v1_heartbeat_post()

Ingest Heartbeat

### Example


```python
import cdx_client
from cdx_client.models.heartbeat_response import HeartbeatResponse
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
    api_instance = cdx_client.HeartbeatApi(api_client)

    try:
        # Ingest Heartbeat
        api_response = api_instance.ingest_heartbeat_api_v1_heartbeat_post()
        print("The response of HeartbeatApi->ingest_heartbeat_api_v1_heartbeat_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling HeartbeatApi->ingest_heartbeat_api_v1_heartbeat_post: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**HeartbeatResponse**](HeartbeatResponse.md)

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

