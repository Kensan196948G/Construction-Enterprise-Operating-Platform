# cdx_client.PxeApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**record_pxe_event_api_v1_pxe_events_post**](PxeApi.md#record_pxe_event_api_v1_pxe_events_post) | **POST** /api/v1/pxe/events | Record Pxe Event
[**request_pxe_rollback_api_v1_pxe_rollback_post**](PxeApi.md#request_pxe_rollback_api_v1_pxe_rollback_post) | **POST** /api/v1/pxe/rollback | Request Pxe Rollback


# **record_pxe_event_api_v1_pxe_events_post**
> PXEEventResponse record_pxe_event_api_v1_pxe_events_post(pxe_event_request)

Record Pxe Event

Record a PXE boot lifecycle event and update Prometheus metrics.

Called by agent-bootstrap.sh at bootstrap_complete and bootstrap_failed.
The token_issued event is recorded automatically when the registration
token endpoint issues a token.

### Example


```python
import cdx_client
from cdx_client.models.pxe_event_request import PXEEventRequest
from cdx_client.models.pxe_event_response import PXEEventResponse
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
    api_instance = cdx_client.PxeApi(api_client)
    pxe_event_request = cdx_client.PXEEventRequest() # PXEEventRequest | 

    try:
        # Record Pxe Event
        api_response = api_instance.record_pxe_event_api_v1_pxe_events_post(pxe_event_request)
        print("The response of PxeApi->record_pxe_event_api_v1_pxe_events_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PxeApi->record_pxe_event_api_v1_pxe_events_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pxe_event_request** | [**PXEEventRequest**](PXEEventRequest.md)|  | 

### Return type

[**PXEEventResponse**](PXEEventResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **request_pxe_rollback_api_v1_pxe_rollback_post**
> PXERollbackResponse request_pxe_rollback_api_v1_pxe_rollback_post(pxe_rollback_request)

Request Pxe Rollback

Record a PXE rollback intent and return the script command to execute.

The operator must SSH to the PXE server and run the returned command.
Dry-run preview: append --dry-run to the returned command.

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.pxe_rollback_request import PXERollbackRequest
from cdx_client.models.pxe_rollback_response import PXERollbackResponse
from cdx_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = cdx_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = cdx_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with cdx_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = cdx_client.PxeApi(api_client)
    pxe_rollback_request = cdx_client.PXERollbackRequest() # PXERollbackRequest | 

    try:
        # Request Pxe Rollback
        api_response = api_instance.request_pxe_rollback_api_v1_pxe_rollback_post(pxe_rollback_request)
        print("The response of PxeApi->request_pxe_rollback_api_v1_pxe_rollback_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PxeApi->request_pxe_rollback_api_v1_pxe_rollback_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pxe_rollback_request** | [**PXERollbackRequest**](PXERollbackRequest.md)|  | 

### Return type

[**PXERollbackResponse**](PXERollbackResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**202** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

