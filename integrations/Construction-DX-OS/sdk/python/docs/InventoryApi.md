# cdx_client.InventoryApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**ingest_inventory_api_v1_inventory_post**](InventoryApi.md#ingest_inventory_api_v1_inventory_post) | **POST** /api/v1/inventory | Ingest Inventory


# **ingest_inventory_api_v1_inventory_post**
> InventoryResponse ingest_inventory_api_v1_inventory_post()

Ingest Inventory

### Example


```python
import cdx_client
from cdx_client.models.inventory_response import InventoryResponse
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
    api_instance = cdx_client.InventoryApi(api_client)

    try:
        # Ingest Inventory
        api_response = api_instance.ingest_inventory_api_v1_inventory_post()
        print("The response of InventoryApi->ingest_inventory_api_v1_inventory_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling InventoryApi->ingest_inventory_api_v1_inventory_post: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**InventoryResponse**](InventoryResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

