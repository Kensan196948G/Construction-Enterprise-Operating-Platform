# cdx_client.DevicesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**register_device_api_v1_devices_register_post**](DevicesApi.md#register_device_api_v1_devices_register_post) | **POST** /api/v1/devices/register | Register Device


# **register_device_api_v1_devices_register_post**
> RegisterResponse register_device_api_v1_devices_register_post(register_request)

Register Device

### Example


```python
import cdx_client
from cdx_client.models.register_request import RegisterRequest
from cdx_client.models.register_response import RegisterResponse
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
    api_instance = cdx_client.DevicesApi(api_client)
    register_request = cdx_client.RegisterRequest() # RegisterRequest | 

    try:
        # Register Device
        api_response = api_instance.register_device_api_v1_devices_register_post(register_request)
        print("The response of DevicesApi->register_device_api_v1_devices_register_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DevicesApi->register_device_api_v1_devices_register_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **register_request** | [**RegisterRequest**](RegisterRequest.md)|  | 

### Return type

[**RegisterResponse**](RegisterResponse.md)

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

