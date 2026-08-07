# SerialScanApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**confirmItemApiV1SerialConfirmItemIdPost**](SerialScanApi.md#confirmitemapiv1serialconfirmitemidpost) | **POST** /api/v1/serial/confirm/{item_id} | Confirm Item |
| [**discardItemApiV1SerialQueueItemIdDelete**](SerialScanApi.md#discarditemapiv1serialqueueitemiddelete) | **DELETE** /api/v1/serial/queue/{item_id} | Discard Item |
| [**getQueueApiV1SerialQueueGet**](SerialScanApi.md#getqueueapiv1serialqueueget) | **GET** /api/v1/serial/queue | Get Queue |
| [**serialStatusApiV1SerialStatusGet**](SerialScanApi.md#serialstatusapiv1serialstatusget) | **GET** /api/v1/serial/status | Serial Status |
| [**triggerScanApiV1SerialScanPost**](SerialScanApi.md#triggerscanapiv1serialscanpost) | **POST** /api/v1/serial/scan | Trigger Scan |



## confirmItemApiV1SerialConfirmItemIdPost

> object confirmItemApiV1SerialConfirmItemIdPost(itemId, confirmRequest)

Confirm Item

Confirm OCR result and register serial + hostname in the deploy register.

### Example

```ts
import {
  Configuration,
  SerialScanApi,
} from 'cdx-client';
import type { ConfirmItemApiV1SerialConfirmItemIdPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new SerialScanApi(config);

  const body = {
    // string
    itemId: itemId_example,
    // ConfirmRequest
    confirmRequest: ...,
  } satisfies ConfirmItemApiV1SerialConfirmItemIdPostRequest;

  try {
    const data = await api.confirmItemApiV1SerialConfirmItemIdPost(body);
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
| **itemId** | `string` |  | [Defaults to `undefined`] |
| **confirmRequest** | [ConfirmRequest](ConfirmRequest.md) |  | |

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## discardItemApiV1SerialQueueItemIdDelete

> { [key: string]: string | null; } discardItemApiV1SerialQueueItemIdDelete(itemId)

Discard Item

Remove an item from the queue (e.g. duplicate or unreadable scan).

### Example

```ts
import {
  Configuration,
  SerialScanApi,
} from 'cdx-client';
import type { DiscardItemApiV1SerialQueueItemIdDeleteRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new SerialScanApi(config);

  const body = {
    // string
    itemId: itemId_example,
  } satisfies DiscardItemApiV1SerialQueueItemIdDeleteRequest;

  try {
    const data = await api.discardItemApiV1SerialQueueItemIdDelete(body);
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
| **itemId** | `string` |  | [Defaults to `undefined`] |

### Return type

**{ [key: string]: string | null; }**

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


## getQueueApiV1SerialQueueGet

> object getQueueApiV1SerialQueueGet()

Get Queue

Return OCR queue (pending + recently confirmed items).

### Example

```ts
import {
  Configuration,
  SerialScanApi,
} from 'cdx-client';
import type { GetQueueApiV1SerialQueueGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new SerialScanApi(config);

  try {
    const data = await api.getQueueApiV1SerialQueueGet();
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

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## serialStatusApiV1SerialStatusGet

> object serialStatusApiV1SerialStatusGet()

Serial Status

Return file server mount status and pending image count.

### Example

```ts
import {
  Configuration,
  SerialScanApi,
} from 'cdx-client';
import type { SerialStatusApiV1SerialStatusGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new SerialScanApi(config);

  try {
    const data = await api.serialStatusApiV1SerialStatusGet();
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

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## triggerScanApiV1SerialScanPost

> object triggerScanApiV1SerialScanPost()

Trigger Scan

Process all pending images in SERIAL_SCAN_PATH via easyocr.

### Example

```ts
import {
  Configuration,
  SerialScanApi,
} from 'cdx-client';
import type { TriggerScanApiV1SerialScanPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new SerialScanApi(config);

  try {
    const data = await api.triggerScanApiV1SerialScanPost();
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

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

