# IsoBuildsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cancelIsoBuildJobApiV1IsoBuildsJobIdCancelPost**](IsoBuildsApi.md#cancelisobuildjobapiv1isobuildsjobidcancelpost) | **POST** /api/v1/iso-builds/{job_id}/cancel | Cancel Iso Build Job |
| [**createIsoBuildJobApiV1IsoBuildsPost**](IsoBuildsApi.md#createisobuildjobapiv1isobuildspost) | **POST** /api/v1/iso-builds | Create Iso Build Job |
| [**downloadIsoRedirectApiV1IsoBuildsJobIdDownloadGet**](IsoBuildsApi.md#downloadisoredirectapiv1isobuildsjobiddownloadget) | **GET** /api/v1/iso-builds/{job_id}/download | Download Iso Redirect |
| [**getIsoBuildJobApiV1IsoBuildsJobIdGet**](IsoBuildsApi.md#getisobuildjobapiv1isobuildsjobidget) | **GET** /api/v1/iso-builds/{job_id} | Get Iso Build Job |
| [**isoBuilderCancelAdminIsoBuilderJobIdCancelPost**](IsoBuildsApi.md#isobuildercanceladminisobuilderjobidcancelpost) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel |
| [**isoBuilderDetailAdminIsoBuilderJobIdGet**](IsoBuildsApi.md#isobuilderdetailadminisobuilderjobidget) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail |
| [**isoBuilderListAdminIsoBuilderGet**](IsoBuildsApi.md#isobuilderlistadminisobuilderget) | **GET** /admin/iso-builder | Iso Builder List |
| [**isoBuilderNewFormAdminIsoBuilderNewGet**](IsoBuildsApi.md#isobuildernewformadminisobuildernewget) | **GET** /admin/iso-builder/new | Iso Builder New Form |
| [**isoBuilderSubmitAdminIsoBuilderPost**](IsoBuildsApi.md#isobuildersubmitadminisobuilderpost) | **POST** /admin/iso-builder | Iso Builder Submit |
| [**listIsoBuildJobsApiV1IsoBuildsGet**](IsoBuildsApi.md#listisobuildjobsapiv1isobuildsget) | **GET** /api/v1/iso-builds | List Iso Build Jobs |
| [**streamIsoBuildLogApiV1IsoBuildsJobIdLogGet**](IsoBuildsApi.md#streamisobuildlogapiv1isobuildsjobidlogget) | **GET** /api/v1/iso-builds/{job_id}/log | Stream Iso Build Log |



## cancelIsoBuildJobApiV1IsoBuildsJobIdCancelPost

> IsoBuildJobResponse cancelIsoBuildJobApiV1IsoBuildsJobIdCancelPost(jobId)

Cancel Iso Build Job

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { CancelIsoBuildJobApiV1IsoBuildsJobIdCancelPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies CancelIsoBuildJobApiV1IsoBuildsJobIdCancelPostRequest;

  try {
    const data = await api.cancelIsoBuildJobApiV1IsoBuildsJobIdCancelPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createIsoBuildJobApiV1IsoBuildsPost

> IsoBuildJobResponse createIsoBuildJobApiV1IsoBuildsPost(isoBuildJobCreateRequest)

Create Iso Build Job

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { CreateIsoBuildJobApiV1IsoBuildsPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // IsoBuildJobCreateRequest
    isoBuildJobCreateRequest: ...,
  } satisfies CreateIsoBuildJobApiV1IsoBuildsPostRequest;

  try {
    const data = await api.createIsoBuildJobApiV1IsoBuildsPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **isoBuildJobCreateRequest** | [IsoBuildJobCreateRequest](IsoBuildJobCreateRequest.md) |  | |

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## downloadIsoRedirectApiV1IsoBuildsJobIdDownloadGet

> any downloadIsoRedirectApiV1IsoBuildsJobIdDownloadGet(jobId)

Download Iso Redirect

Redirect to a presigned MinIO URL for downloading the ISO.  Returns 307 Temporary Redirect when MinIO is configured and the job has succeeded. Returns 409 Conflict for non-terminal jobs, 404 if the job is unknown, and 503 if MinIO is not configured.

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { DownloadIsoRedirectApiV1IsoBuildsJobIdDownloadGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies DownloadIsoRedirectApiV1IsoBuildsJobIdDownloadGetRequest;

  try {
    const data = await api.downloadIsoRedirectApiV1IsoBuildsJobIdDownloadGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getIsoBuildJobApiV1IsoBuildsJobIdGet

> IsoBuildJobResponse getIsoBuildJobApiV1IsoBuildsJobIdGet(jobId)

Get Iso Build Job

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { GetIsoBuildJobApiV1IsoBuildsJobIdGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies GetIsoBuildJobApiV1IsoBuildsJobIdGetRequest;

  try {
    const data = await api.getIsoBuildJobApiV1IsoBuildsJobIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**IsoBuildJobResponse**](IsoBuildJobResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## isoBuilderCancelAdminIsoBuilderJobIdCancelPost

> any isoBuilderCancelAdminIsoBuilderJobIdCancelPost(jobId)

Iso Builder Cancel

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { IsoBuilderCancelAdminIsoBuilderJobIdCancelPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies IsoBuilderCancelAdminIsoBuilderJobIdCancelPostRequest;

  try {
    const data = await api.isoBuilderCancelAdminIsoBuilderJobIdCancelPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## isoBuilderDetailAdminIsoBuilderJobIdGet

> string isoBuilderDetailAdminIsoBuilderJobIdGet(jobId)

Iso Builder Detail

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { IsoBuilderDetailAdminIsoBuilderJobIdGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies IsoBuilderDetailAdminIsoBuilderJobIdGetRequest;

  try {
    const data = await api.isoBuilderDetailAdminIsoBuilderJobIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/html`, `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## isoBuilderListAdminIsoBuilderGet

> string isoBuilderListAdminIsoBuilderGet(profile, statusFilter)

Iso Builder List

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { IsoBuilderListAdminIsoBuilderGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string (optional)
    profile: profile_example,
    // string (optional)
    statusFilter: statusFilter_example,
  } satisfies IsoBuilderListAdminIsoBuilderGetRequest;

  try {
    const data = await api.isoBuilderListAdminIsoBuilderGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profile** | `string` |  | [Optional] [Defaults to `undefined`] |
| **statusFilter** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/html`, `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## isoBuilderNewFormAdminIsoBuilderNewGet

> string isoBuilderNewFormAdminIsoBuilderNewGet()

Iso Builder New Form

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { IsoBuilderNewFormAdminIsoBuilderNewGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  try {
    const data = await api.isoBuilderNewFormAdminIsoBuilderNewGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

**string**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/html`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## isoBuilderSubmitAdminIsoBuilderPost

> any isoBuilderSubmitAdminIsoBuilderPost(profile, gitRef, notes)

Iso Builder Submit

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { IsoBuilderSubmitAdminIsoBuilderPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    profile: profile_example,
    // string
    gitRef: gitRef_example,
    // string (optional)
    notes: notes_example,
  } satisfies IsoBuilderSubmitAdminIsoBuilderPostRequest;

  try {
    const data = await api.isoBuilderSubmitAdminIsoBuilderPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profile** | `string` |  | [Defaults to `undefined`] |
| **gitRef** | `string` |  | [Defaults to `undefined`] |
| **notes** | `string` |  | [Optional] [Defaults to `&#39;&#39;`] |

### Return type

**any**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: `application/x-www-form-urlencoded`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listIsoBuildJobsApiV1IsoBuildsGet

> IsoBuildJobListResponse listIsoBuildJobsApiV1IsoBuildsGet(profile, statusFilter, limit, offset)

List Iso Build Jobs

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { ListIsoBuildJobsApiV1IsoBuildsGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // 'admin' | 'standard' | 'field' | 'kiosk' | 'admin-support' (optional)
    profile: profile_example,
    // 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' (optional)
    statusFilter: statusFilter_example,
    // number (optional)
    limit: 56,
    // number (optional)
    offset: 56,
  } satisfies ListIsoBuildJobsApiV1IsoBuildsGetRequest;

  try {
    const data = await api.listIsoBuildJobsApiV1IsoBuildsGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profile** | `admin`, `standard`, `field`, `kiosk`, `admin-support` |  | [Optional] [Defaults to `undefined`] [Enum: admin, standard, field, kiosk, admin-support] |
| **statusFilter** | `queued`, `running`, `succeeded`, `failed`, `cancelled` |  | [Optional] [Defaults to `undefined`] [Enum: queued, running, succeeded, failed, cancelled] |
| **limit** | `number` |  | [Optional] [Defaults to `20`] |
| **offset** | `number` |  | [Optional] [Defaults to `0`] |

### Return type

[**IsoBuildJobListResponse**](IsoBuildJobListResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streamIsoBuildLogApiV1IsoBuildsJobIdLogGet

> any streamIsoBuildLogApiV1IsoBuildsJobIdLogGet(jobId)

Stream Iso Build Log

Stream build log lines as Server-Sent Events.  Connect with &#x60;&#x60;EventSource(\&#39;/api/v1/iso-builds/{id}/log\&#39;)&#x60;&#x60; from the browser. Events emitted: - &#x60;&#x60;log&#x60;&#x60;    — a single build log line - &#x60;&#x60;status&#x60;&#x60; — current job status (queued/running/succeeded/failed/cancelled) - &#x60;&#x60;ping&#x60;&#x60;   — heartbeat when no new log lines are available - &#x60;&#x60;done&#x60;&#x60;   — terminal state reached; client should close the EventSource - &#x60;&#x60;error&#x60;&#x60;  — job not found or other error - &#x60;&#x60;timeout&#x60;&#x60;— stream exceeded CDX_SSE_TIMEOUT without completion

### Example

```ts
import {
  Configuration,
  IsoBuildsApi,
} from 'cdx-client';
import type { StreamIsoBuildLogApiV1IsoBuildsJobIdLogGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new IsoBuildsApi(config);

  const body = {
    // string
    jobId: jobId_example,
  } satisfies StreamIsoBuildLogApiV1IsoBuildsJobIdLogGetRequest;

  try {
    const data = await api.streamIsoBuildLogApiV1IsoBuildsJobIdLogGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **jobId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

