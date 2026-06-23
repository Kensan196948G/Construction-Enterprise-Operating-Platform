# cdx_client.PolicyApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_policy_api_v1_policy_get**](PolicyApi.md#get_policy_api_v1_policy_get) | **GET** /api/v1/policy | Get Policy


# **get_policy_api_v1_policy_get**
> PolicyResponse get_policy_api_v1_policy_get()

Get Policy

### Example


```python
import cdx_client
from cdx_client.models.policy_response import PolicyResponse
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
    api_instance = cdx_client.PolicyApi(api_client)

    try:
        # Get Policy
        api_response = api_instance.get_policy_api_v1_policy_get()
        print("The response of PolicyApi->get_policy_api_v1_policy_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PolicyApi->get_policy_api_v1_policy_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**PolicyResponse**](PolicyResponse.md)

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

