# InventoryResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accepted** | **bool** |  | 
**duplicate** | **bool** |  | 
**received_at** | **datetime** |  | 

## Example

```python
from cdx_client.models.inventory_response import InventoryResponse

# TODO update the JSON string below
json = "{}"
# create an instance of InventoryResponse from a JSON string
inventory_response_instance = InventoryResponse.from_json(json)
# print the JSON string representation of the object
print(InventoryResponse.to_json())

# convert the object into a dict
inventory_response_dict = inventory_response_instance.to_dict()
# create an instance of InventoryResponse from a dict
inventory_response_from_dict = InventoryResponse.from_dict(inventory_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


