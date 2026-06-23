# cdx_client.RegistrationApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_registration_token_api_v1_devices_registration_tokens_post**](RegistrationApi.md#create_registration_token_api_v1_devices_registration_tokens_post) | **POST** /api/v1/devices/registration-tokens | Create Registration Token
[**rotate_device_token_api_v1_auth_rotate_post**](RegistrationApi.md#rotate_device_token_api_v1_auth_rotate_post) | **POST** /api/v1/auth/rotate | Rotate Device Token


# **create_registration_token_api_v1_devices_registration_tokens_post**
> RegistrationTokenResponse create_registration_token_api_v1_devices_registration_tokens_post(registration_token_request)

Create Registration Token

Issue an ephemeral registration token to a bootstrapping device.

Called by ``agent-bootstrap.sh`` during PXE provisioning.  The token is
single-use (consumed on first ``/api/v1/devices/register`` call) and
expires after 24 hours.

### Example


```python
import cdx_client
from cdx_client.models.registration_token_request import RegistrationTokenRequest
from cdx_client.models.registration_token_response import RegistrationTokenResponse
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
    api_instance = cdx_client.RegistrationApi(api_client)
    registration_token_request = cdx_client.RegistrationTokenRequest() # RegistrationTokenRequest | 

    try:
        # Create Registration Token
        api_response = api_instance.create_registration_token_api_v1_devices_registration_tokens_post(registration_token_request)
        print("The response of RegistrationApi->create_registration_token_api_v1_devices_registration_tokens_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling RegistrationApi->create_registration_token_api_v1_devices_registration_tokens_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registration_token_request** | [**RegistrationTokenRequest**](RegistrationTokenRequest.md)|  | 

### Return type

[**RegistrationTokenResponse**](RegistrationTokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **rotate_device_token_api_v1_auth_rotate_post**
> TokenRotateResponse rotate_device_token_api_v1_auth_rotate_post(token_rotate_request)

Rotate Device Token

Rotate a device's long-lived auth token (48-hour TTL).

Gated by HMAC-SHA256 device signature (same scheme as heartbeat/inventory).
The agent calls this endpoint automatically before token expiry.

### Example


```python
import cdx_client
from cdx_client.models.token_rotate_request import TokenRotateRequest
from cdx_client.models.token_rotate_response import TokenRotateResponse
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
    api_instance = cdx_client.RegistrationApi(api_client)
    token_rotate_request = cdx_client.TokenRotateRequest() # TokenRotateRequest | 

    try:
        # Rotate Device Token
        api_response = api_instance.rotate_device_token_api_v1_auth_rotate_post(token_rotate_request)
        print("The response of RegistrationApi->rotate_device_token_api_v1_auth_rotate_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling RegistrationApi->rotate_device_token_api_v1_auth_rotate_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **token_rotate_request** | [**TokenRotateRequest**](TokenRotateRequest.md)|  | 

### Return type

[**TokenRotateResponse**](TokenRotateResponse.md)

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

