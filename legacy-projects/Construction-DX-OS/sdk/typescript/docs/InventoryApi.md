# InventoryApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**ingestInventoryApiV1InventoryPost**](InventoryApi.md#ingestinventoryapiv1inventorypost) | **POST** /api/v1/inventory | Ingest Inventory |



## ingestInventoryApiV1InventoryPost

> InventoryResponse ingestInventoryApiV1InventoryPost()

Ingest Inventory

### Example

```ts
import {
  Configuration,
  InventoryApi,
} from 'cdx-client';
import type { IngestInventoryApiV1InventoryPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new InventoryApi();

  try {
    const data = await api.ingestInventoryApiV1InventoryPost();
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

[**InventoryResponse**](InventoryResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

