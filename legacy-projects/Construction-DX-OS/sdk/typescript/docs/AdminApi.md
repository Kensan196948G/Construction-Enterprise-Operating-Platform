# AdminApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**deviceDetailAdminDevicesDeviceIdGet**](AdminApi.md#devicedetailadmindevicesdeviceidget) | **GET** /admin/devices/{device_id} | Device Detail |
| [**deviceListAdminGet**](AdminApi.md#devicelistadminget) | **GET** /admin | Device List |
| [**isoBuilderCancelAdminIsoBuilderJobIdCancelPost**](AdminApi.md#isobuildercanceladminisobuilderjobidcancelpost) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel |
| [**isoBuilderDetailAdminIsoBuilderJobIdGet**](AdminApi.md#isobuilderdetailadminisobuilderjobidget) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail |
| [**isoBuilderListAdminIsoBuilderGet**](AdminApi.md#isobuilderlistadminisobuilderget) | **GET** /admin/iso-builder | Iso Builder List |
| [**isoBuilderNewFormAdminIsoBuilderNewGet**](AdminApi.md#isobuildernewformadminisobuildernewget) | **GET** /admin/iso-builder/new | Iso Builder New Form |
| [**isoBuilderSubmitAdminIsoBuilderPost**](AdminApi.md#isobuildersubmitadminisobuilderpost) | **POST** /admin/iso-builder | Iso Builder Submit |
| [**pxeRollbackPageAdminPxeRollbackGet**](AdminApi.md#pxerollbackpageadminpxerollbackget) | **GET** /admin/pxe-rollback | Pxe Rollback Page |



## deviceDetailAdminDevicesDeviceIdGet

> string deviceDetailAdminDevicesDeviceIdGet(deviceId)

Device Detail

Render the per-device detail page (heartbeats + inventory + policy).

### Example

```ts
import {
  Configuration,
  AdminApi,
} from 'cdx-client';
import type { DeviceDetailAdminDevicesDeviceIdGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    deviceId: deviceId_example,
  } satisfies DeviceDetailAdminDevicesDeviceIdGetRequest;

  try {
    const data = await api.deviceDetailAdminDevicesDeviceIdGet(body);
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
| **deviceId** | `string` |  | [Defaults to `undefined`] |

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


## deviceListAdminGet

> string deviceListAdminGet()

Device List

Render the device list page with online/offline status badges.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from 'cdx-client';
import type { DeviceListAdminGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

  try {
    const data = await api.deviceListAdminGet();
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


## isoBuilderCancelAdminIsoBuilderJobIdCancelPost

> any isoBuilderCancelAdminIsoBuilderJobIdCancelPost(jobId)

Iso Builder Cancel

### Example

```ts
import {
  Configuration,
  AdminApi,
} from 'cdx-client';
import type { IsoBuilderCancelAdminIsoBuilderJobIdCancelPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

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
  AdminApi,
} from 'cdx-client';
import type { IsoBuilderDetailAdminIsoBuilderJobIdGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

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
  AdminApi,
} from 'cdx-client';
import type { IsoBuilderListAdminIsoBuilderGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

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
  AdminApi,
} from 'cdx-client';
import type { IsoBuilderNewFormAdminIsoBuilderNewGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

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
  AdminApi,
} from 'cdx-client';
import type { IsoBuilderSubmitAdminIsoBuilderPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

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


## pxeRollbackPageAdminPxeRollbackGet

> string pxeRollbackPageAdminPxeRollbackGet()

Pxe Rollback Page

Render the PXE rollback console (Issue 0042 Phase 4.5).

### Example

```ts
import {
  Configuration,
  AdminApi,
} from 'cdx-client';
import type { PxeRollbackPageAdminPxeRollbackGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

  try {
    const data = await api.pxeRollbackPageAdminPxeRollbackGet();
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

