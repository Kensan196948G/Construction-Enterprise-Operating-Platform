# cdx_client.IsoBuildsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post**](IsoBuildsApi.md#cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post) | **POST** /api/v1/iso-builds/{job_id}/cancel | Cancel Iso Build Job
[**create_iso_build_job_api_v1_iso_builds_post**](IsoBuildsApi.md#create_iso_build_job_api_v1_iso_builds_post) | **POST** /api/v1/iso-builds | Create Iso Build Job
[**download_iso_redirect_api_v1_iso_builds_job_id_download_get**](IsoBuildsApi.md#download_iso_redirect_api_v1_iso_builds_job_id_download_get) | **GET** /api/v1/iso-builds/{job_id}/download | Download Iso Redirect
[**get_iso_build_job_api_v1_iso_builds_job_id_get**](IsoBuildsApi.md#get_iso_build_job_api_v1_iso_builds_job_id_get) | **GET** /api/v1/iso-builds/{job_id} | Get Iso Build Job
[**iso_builder_cancel_admin_iso_builder_job_id_cancel_post**](IsoBuildsApi.md#iso_builder_cancel_admin_iso_builder_job_id_cancel_post) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel
[**iso_builder_detail_admin_iso_builder_job_id_get**](IsoBuildsApi.md#iso_builder_detail_admin_iso_builder_job_id_get) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail
[**iso_builder_list_admin_iso_builder_get**](IsoBuildsApi.md#iso_builder_list_admin_iso_builder_get) | **GET** /admin/iso-builder | Iso Builder List
[**iso_builder_new_form_admin_iso_builder_new_get**](IsoBuildsApi.md#iso_builder_new_form_admin_iso_builder_new_get) | **GET** /admin/iso-builder/new | Iso Builder New Form
[**iso_builder_submit_admin_iso_builder_post**](IsoBuildsApi.md#iso_builder_submit_admin_iso_builder_post) | **POST** /admin/iso-builder | Iso Builder Submit
[**list_iso_build_jobs_api_v1_iso_builds_get**](IsoBuildsApi.md#list_iso_build_jobs_api_v1_iso_builds_get) | **GET** /api/v1/iso-builds | List Iso Build Jobs
[**stream_iso_build_log_api_v1_iso_builds_job_id_log_get**](IsoBuildsApi.md#stream_iso_build_log_api_v1_iso_builds_job_id_log_get) | **GET** /api/v1/iso-builds/{job_id}/log | Stream Iso Build Log


# **cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post**
> IsoBuildJobResponse cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post(job_id)

Cancel Iso Build Job

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.iso_build_job_response import IsoBuildJobResponse
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Cancel Iso Build Job
        api_response = api_instance.cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post(job_id)
        print("The response of IsoBuildsApi->cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->cancel_iso_build_job_api_v1_iso_builds_job_id_cancel_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **job_id** | **str**|  | 

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

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

# **create_iso_build_job_api_v1_iso_builds_post**
> IsoBuildJobResponse create_iso_build_job_api_v1_iso_builds_post(iso_build_job_create_request)

Create Iso Build Job

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.iso_build_job_create_request import IsoBuildJobCreateRequest
from cdx_client.models.iso_build_job_response import IsoBuildJobResponse
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    iso_build_job_create_request = cdx_client.IsoBuildJobCreateRequest() # IsoBuildJobCreateRequest | 

    try:
        # Create Iso Build Job
        api_response = api_instance.create_iso_build_job_api_v1_iso_builds_post(iso_build_job_create_request)
        print("The response of IsoBuildsApi->create_iso_build_job_api_v1_iso_builds_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->create_iso_build_job_api_v1_iso_builds_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **iso_build_job_create_request** | [**IsoBuildJobCreateRequest**](IsoBuildJobCreateRequest.md)|  | 

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **download_iso_redirect_api_v1_iso_builds_job_id_download_get**
> object download_iso_redirect_api_v1_iso_builds_job_id_download_get(job_id)

Download Iso Redirect

Redirect to a presigned MinIO URL for downloading the ISO.

Returns 307 Temporary Redirect when MinIO is configured and the job
has succeeded. Returns 409 Conflict for non-terminal jobs, 404 if the
job is unknown, and 503 if MinIO is not configured.

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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Download Iso Redirect
        api_response = api_instance.download_iso_redirect_api_v1_iso_builds_job_id_download_get(job_id)
        print("The response of IsoBuildsApi->download_iso_redirect_api_v1_iso_builds_job_id_download_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->download_iso_redirect_api_v1_iso_builds_job_id_download_get: %s\n" % e)
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

# **get_iso_build_job_api_v1_iso_builds_job_id_get**
> IsoBuildJobResponse get_iso_build_job_api_v1_iso_builds_job_id_get(job_id)

Get Iso Build Job

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.iso_build_job_response import IsoBuildJobResponse
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Get Iso Build Job
        api_response = api_instance.get_iso_build_job_api_v1_iso_builds_job_id_get(job_id)
        print("The response of IsoBuildsApi->get_iso_build_job_api_v1_iso_builds_job_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->get_iso_build_job_api_v1_iso_builds_job_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **job_id** | **str**|  | 

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Iso Builder Cancel
        api_response = api_instance.iso_builder_cancel_admin_iso_builder_job_id_cancel_post(job_id)
        print("The response of IsoBuildsApi->iso_builder_cancel_admin_iso_builder_job_id_cancel_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->iso_builder_cancel_admin_iso_builder_job_id_cancel_post: %s\n" % e)
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Iso Builder Detail
        api_response = api_instance.iso_builder_detail_admin_iso_builder_job_id_get(job_id)
        print("The response of IsoBuildsApi->iso_builder_detail_admin_iso_builder_job_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->iso_builder_detail_admin_iso_builder_job_id_get: %s\n" % e)
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    profile = 'profile_example' # str |  (optional)
    status_filter = 'status_filter_example' # str |  (optional)

    try:
        # Iso Builder List
        api_response = api_instance.iso_builder_list_admin_iso_builder_get(profile=profile, status_filter=status_filter)
        print("The response of IsoBuildsApi->iso_builder_list_admin_iso_builder_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->iso_builder_list_admin_iso_builder_get: %s\n" % e)
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
    api_instance = cdx_client.IsoBuildsApi(api_client)

    try:
        # Iso Builder New Form
        api_response = api_instance.iso_builder_new_form_admin_iso_builder_new_get()
        print("The response of IsoBuildsApi->iso_builder_new_form_admin_iso_builder_new_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->iso_builder_new_form_admin_iso_builder_new_get: %s\n" % e)
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    profile = 'profile_example' # str | 
    git_ref = 'git_ref_example' # str | 
    notes = '' # str |  (optional) (default to '')

    try:
        # Iso Builder Submit
        api_response = api_instance.iso_builder_submit_admin_iso_builder_post(profile, git_ref, notes=notes)
        print("The response of IsoBuildsApi->iso_builder_submit_admin_iso_builder_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->iso_builder_submit_admin_iso_builder_post: %s\n" % e)
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

# **list_iso_build_jobs_api_v1_iso_builds_get**
> IsoBuildJobListResponse list_iso_build_jobs_api_v1_iso_builds_get(profile=profile, status_filter=status_filter, limit=limit, offset=offset)

List Iso Build Jobs

### Example

* Basic Authentication (HTTPBasic):

```python
import cdx_client
from cdx_client.models.iso_build_job_list_response import IsoBuildJobListResponse
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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    profile = 'profile_example' # str |  (optional)
    status_filter = 'status_filter_example' # str |  (optional)
    limit = 20 # int |  (optional) (default to 20)
    offset = 0 # int |  (optional) (default to 0)

    try:
        # List Iso Build Jobs
        api_response = api_instance.list_iso_build_jobs_api_v1_iso_builds_get(profile=profile, status_filter=status_filter, limit=limit, offset=offset)
        print("The response of IsoBuildsApi->list_iso_build_jobs_api_v1_iso_builds_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->list_iso_build_jobs_api_v1_iso_builds_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile** | **str**|  | [optional] 
 **status_filter** | **str**|  | [optional] 
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**IsoBuildJobListResponse**](IsoBuildJobListResponse.md)

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

# **stream_iso_build_log_api_v1_iso_builds_job_id_log_get**
> object stream_iso_build_log_api_v1_iso_builds_job_id_log_get(job_id)

Stream Iso Build Log

Stream build log lines as Server-Sent Events.

Connect with ``EventSource('/api/v1/iso-builds/{id}/log')`` from the browser.
Events emitted:
- ``log``    — a single build log line
- ``status`` — current job status (queued/running/succeeded/failed/cancelled)
- ``ping``   — heartbeat when no new log lines are available
- ``done``   — terminal state reached; client should close the EventSource
- ``error``  — job not found or other error
- ``timeout``— stream exceeded CDX_SSE_TIMEOUT without completion

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
    api_instance = cdx_client.IsoBuildsApi(api_client)
    job_id = 'job_id_example' # str | 

    try:
        # Stream Iso Build Log
        api_response = api_instance.stream_iso_build_log_api_v1_iso_builds_job_id_log_get(job_id)
        print("The response of IsoBuildsApi->stream_iso_build_log_api_v1_iso_builds_job_id_log_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IsoBuildsApi->stream_iso_build_log_api_v1_iso_builds_job_id_log_get: %s\n" % e)
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

