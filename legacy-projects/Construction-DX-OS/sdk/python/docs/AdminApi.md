# cdx_client.AdminApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**device_detail_admin_devices_device_id_get**](AdminApi.md#device_detail_admin_devices_device_id_get) | **GET** /admin/devices/{device_id} | Device Detail
[**device_list_admin_get**](AdminApi.md#device_list_admin_get) | **GET** /admin | Device List
[**iso_builder_cancel_admin_iso_builder_job_id_cancel_post**](AdminApi.md#iso_builder_cancel_admin_iso_builder_job_id_cancel_post) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel
[**iso_builder_detail_admin_iso_builder_job_id_get**](AdminApi.md#iso_builder_detail_admin_iso_builder_job_id_get) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail
[**iso_builder_list_admin_iso_builder_get**](AdminApi.md#iso_builder_list_admin_iso_builder_get) | **GET** /admin/iso-builder | Iso Builder List
[**iso_builder_new_form_admin_iso_builder_new_get**](AdminApi.md#iso_builder_new_form_admin_iso_builder_new_get) | **GET** /admin/iso-builder/new | Iso Builder New Form
[**iso_builder_submit_admin_iso_builder_post**](AdminApi.md#iso_builder_submit_admin_iso_builder_post) | **POST** /admin/iso-builder | Iso Builder Submit
[**pxe_rollback_page_admin_pxe_rollback_get**](AdminApi.md#pxe_rollback_page_admin_pxe_rollback_get) | **GET** /admin/pxe-rollback | Pxe Rollback Page


# **device_detail_admin_devices_device_id_get**
> str device_detail_admin_devices_device_id_get(device_id)

Device Detail

Render the per-device detail page (heartbeats + inventory + policy).

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
    api_instance = cdx_client.AdminApi(api_client)
    device_id = 'device_id_example' # str | 

    try:
        # Device Detail
        api_response = api_instance.device_detail_admin_devices_device_id_get(device_id)
        print("The response of AdminApi->device_detail_admin_devices_device_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->device_detail_admin_devices_device_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **device_id** | **str**|  | 

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **device_list_admin_get**
> str device_list_admin_get()

Device List

Render the device list page with online/offline status badges.

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
    api_instance = cdx_client.AdminApi(api_client)

    try:
        # Device List
        api_response = api_instance.device_list_admin_get()
        print("The response of AdminApi->device_list_admin_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->device_list_admin_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **iso_builder_cancel_admin_iso_builder_job_id_cancel_post**
> object iso_builder_cancel_admin_iso_builder_job_id_cancel_post(job_id)

Iso Builder Cancel

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
    api_instance = cdx_client.AdminApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Iso Builder Cancel
        api_response = api_instance.iso_builder_cancel_admin_iso_builder_job_id_cancel_post(job_id)
        print("The response of AdminApi->iso_builder_cancel_admin_iso_builder_job_id_cancel_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->iso_builder_cancel_admin_iso_builder_job_id_cancel_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **job_id** | **str**|  | 

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
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **iso_builder_detail_admin_iso_builder_job_id_get**
> str iso_builder_detail_admin_iso_builder_job_id_get(job_id)

Iso Builder Detail

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
    api_instance = cdx_client.AdminApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Iso Builder Detail
        api_response = api_instance.iso_builder_detail_admin_iso_builder_job_id_get(job_id)
        print("The response of AdminApi->iso_builder_detail_admin_iso_builder_job_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->iso_builder_detail_admin_iso_builder_job_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **job_id** | **str**|  | 

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **iso_builder_list_admin_iso_builder_get**
> str iso_builder_list_admin_iso_builder_get(profile=profile, status_filter=status_filter)

Iso Builder List

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
    api_instance = cdx_client.AdminApi(api_client)
    profile = 'profile_example' # str |  (optional)
    status_filter = 'status_filter_example' # str |  (optional)

    try:
        # Iso Builder List
        api_response = api_instance.iso_builder_list_admin_iso_builder_get(profile=profile, status_filter=status_filter)
        print("The response of AdminApi->iso_builder_list_admin_iso_builder_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->iso_builder_list_admin_iso_builder_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile** | **str**|  | [optional] 
 **status_filter** | **str**|  | [optional] 

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **iso_builder_new_form_admin_iso_builder_new_get**
> str iso_builder_new_form_admin_iso_builder_new_get()

Iso Builder New Form

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
    api_instance = cdx_client.AdminApi(api_client)

    try:
        # Iso Builder New Form
        api_response = api_instance.iso_builder_new_form_admin_iso_builder_new_get()
        print("The response of AdminApi->iso_builder_new_form_admin_iso_builder_new_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->iso_builder_new_form_admin_iso_builder_new_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **iso_builder_submit_admin_iso_builder_post**
> object iso_builder_submit_admin_iso_builder_post(profile, git_ref, notes=notes)

Iso Builder Submit

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
    api_instance = cdx_client.AdminApi(api_client)
    profile = 'profile_example' # str | 
    git_ref = 'git_ref_example' # str | 
    notes = '' # str |  (optional) (default to '')

    try:
        # Iso Builder Submit
        api_response = api_instance.iso_builder_submit_admin_iso_builder_post(profile, git_ref, notes=notes)
        print("The response of AdminApi->iso_builder_submit_admin_iso_builder_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->iso_builder_submit_admin_iso_builder_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile** | **str**|  | 
 **git_ref** | **str**|  | 
 **notes** | **str**|  | [optional] [default to &#39;&#39;]

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pxe_rollback_page_admin_pxe_rollback_get**
> str pxe_rollback_page_admin_pxe_rollback_get()

Pxe Rollback Page

Render the PXE rollback console (Issue 0042 Phase 4.5).

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
    api_instance = cdx_client.AdminApi(api_client)

    try:
        # Pxe Rollback Page
        api_response = api_instance.pxe_rollback_page_admin_pxe_rollback_get()
        print("The response of AdminApi->pxe_rollback_page_admin_pxe_rollback_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AdminApi->pxe_rollback_page_admin_pxe_rollback_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**str**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/html

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

