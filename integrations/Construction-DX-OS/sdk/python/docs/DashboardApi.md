# cdx_client.DashboardApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**dashboard_api_v1_dashboard_get**](DashboardApi.md#dashboard_api_v1_dashboard_get) | **GET** /api/v1/dashboard | Dashboard


# **dashboard_api_v1_dashboard_get**
> DashboardResponse dashboard_api_v1_dashboard_get()

Dashboard

Aggregate dashboard summary — devices + ISO builds + server health.

### Example


```python
import cdx_client
from cdx_client.models.dashboard_response import DashboardResponse
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
    api_instance = cdx_client.DashboardApi(api_client)

    try:
        # Dashboard
        api_response = api_instance.dashboard_api_v1_dashboard_get()
        print("The response of DashboardApi->dashboard_api_v1_dashboard_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DashboardApi->dashboard_api_v1_dashboard_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**DashboardResponse**](DashboardResponse.md)

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

