# cdx_client.SerialScanApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**confirm_item_api_v1_serial_confirm_item_id_post**](SerialScanApi.md#confirm_item_api_v1_serial_confirm_item_id_post) | **POST** /api/v1/serial/confirm/{item_id} | Confirm Item
[**discard_item_api_v1_serial_queue_item_id_delete**](SerialScanApi.md#discard_item_api_v1_serial_queue_item_id_delete) | **DELETE** /api/v1/serial/queue/{item_id} | Discard Item
[**get_queue_api_v1_serial_queue_get**](SerialScanApi.md#get_queue_api_v1_serial_queue_get) | **GET** /api/v1/serial/queue | Get Queue
[**serial_status_api_v1_serial_status_get**](SerialScanApi.md#serial_status_api_v1_serial_status_get) | **GET** /api/v1/serial/status | Serial Status
[**trigger_scan_api_v1_serial_scan_post**](SerialScanApi.md#trigger_scan_api_v1_serial_scan_post) | **POST** /api/v1/serial/scan | Trigger Scan


# **confirm_item_api_v1_serial_confirm_item_id_post**
> object confirm_item_api_v1_serial_confirm_item_id_post(item_id, confirm_request)

Confirm Item

Confirm OCR result and register serial + hostname in the deploy register.

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.confirm_request import ConfirmRequest
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
    api_instance = cdx_client.SerialScanApi(api_client)
    item_id = 'item_id_example' # str | 
    confirm_request = cdx_client.ConfirmRequest() # ConfirmRequest | 

    try:
        # Confirm Item
        api_response = api_instance.confirm_item_api_v1_serial_confirm_item_id_post(item_id, confirm_request)
        print("The response of SerialScanApi->confirm_item_api_v1_serial_confirm_item_id_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SerialScanApi->confirm_item_api_v1_serial_confirm_item_id_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **item_id** | **str**|  | 
 **confirm_request** | [**ConfirmRequest**](ConfirmRequest.md)|  | 

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **discard_item_api_v1_serial_queue_item_id_delete**
> Dict[str, Optional[str]] discard_item_api_v1_serial_queue_item_id_delete(item_id)

Discard Item

Remove an item from the queue (e.g. duplicate or unreadable scan).

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
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
    api_instance = cdx_client.SerialScanApi(api_client)
    item_id = 'item_id_example' # str | 

    try:
        # Discard Item
        api_response = api_instance.discard_item_api_v1_serial_queue_item_id_delete(item_id)
        print("The response of SerialScanApi->discard_item_api_v1_serial_queue_item_id_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SerialScanApi->discard_item_api_v1_serial_queue_item_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **item_id** | **str**|  | 

### Return type

**Dict[str, Optional[str]]**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_queue_api_v1_serial_queue_get**
> object get_queue_api_v1_serial_queue_get()

Get Queue

Return OCR queue (pending + recently confirmed items).

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
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
    api_instance = cdx_client.SerialScanApi(api_client)

    try:
        # Get Queue
        api_response = api_instance.get_queue_api_v1_serial_queue_get()
        print("The response of SerialScanApi->get_queue_api_v1_serial_queue_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SerialScanApi->get_queue_api_v1_serial_queue_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **serial_status_api_v1_serial_status_get**
> object serial_status_api_v1_serial_status_get()

Serial Status

Return file server mount status and pending image count.

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
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
    api_instance = cdx_client.SerialScanApi(api_client)

    try:
        # Serial Status
        api_response = api_instance.serial_status_api_v1_serial_status_get()
        print("The response of SerialScanApi->serial_status_api_v1_serial_status_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SerialScanApi->serial_status_api_v1_serial_status_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **trigger_scan_api_v1_serial_scan_post**
> object trigger_scan_api_v1_serial_scan_post()

Trigger Scan

Process all pending images in SERIAL_SCAN_PATH via easyocr.

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
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
    api_instance = cdx_client.SerialScanApi(api_client)

    try:
        # Trigger Scan
        api_response = api_instance.trigger_scan_api_v1_serial_scan_post()
        print("The response of SerialScanApi->trigger_scan_api_v1_serial_scan_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SerialScanApi->trigger_scan_api_v1_serial_scan_post: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

