# PxeApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**recordPxeEventApiV1PxeEventsPost**](PxeApi.md#recordpxeeventapiv1pxeeventspost) | **POST** /api/v1/pxe/events | Record Pxe Event |
| [**requestPxeRollbackApiV1PxeRollbackPost**](PxeApi.md#requestpxerollbackapiv1pxerollbackpost) | **POST** /api/v1/pxe/rollback | Request Pxe Rollback |



## recordPxeEventApiV1PxeEventsPost

> PXEEventResponse recordPxeEventApiV1PxeEventsPost(pXEEventRequest)

Record Pxe Event

Record a PXE boot lifecycle event and update Prometheus metrics.  Called by agent-bootstrap.sh at bootstrap_complete and bootstrap_failed. The token_issued event is recorded automatically when the registration token endpoint issues a token.

### Example

```ts
import {
  Configuration,
  PxeApi,
} from 'cdx-client';
import type { RecordPxeEventApiV1PxeEventsPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new PxeApi();

  const body = {
    // PXEEventRequest
    pXEEventRequest: ...,
  } satisfies RecordPxeEventApiV1PxeEventsPostRequest;

  try {
    const data = await api.recordPxeEventApiV1PxeEventsPost(body);
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
| **pXEEventRequest** | [PXEEventRequest](PXEEventRequest.md) |  | |

### Return type

[**PXEEventResponse**](PXEEventResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## requestPxeRollbackApiV1PxeRollbackPost

> PXERollbackResponse requestPxeRollbackApiV1PxeRollbackPost(pXERollbackRequest)

Request Pxe Rollback

Record a PXE rollback intent and return the script command to execute.  The operator must SSH to the PXE server and run the returned command. Dry-run preview: append --dry-run to the returned command.

### Example

```ts
import {
  Configuration,
  PxeApi,
} from 'cdx-client';
import type { RequestPxeRollbackApiV1PxeRollbackPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new PxeApi(config);

  const body = {
    // PXERollbackRequest
    pXERollbackRequest: ...,
  } satisfies RequestPxeRollbackApiV1PxeRollbackPostRequest;

  try {
    const data = await api.requestPxeRollbackApiV1PxeRollbackPost(body);
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
| **pXERollbackRequest** | [PXERollbackRequest](PXERollbackRequest.md) |  | |

### Return type

[**PXERollbackResponse**](PXERollbackResponse.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

