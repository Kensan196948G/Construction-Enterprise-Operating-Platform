# PXERollbackRequest

Operator-initiated rollback request (from Admin WebUI or CLI).

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**pattern** | [**PXERollbackPattern**](PXERollbackPattern.md) |  | 
**reason** | **str** | Reason for rollback (audit trail). | 
**target_version** | **str** |  | [optional] 
**profile** | **str** |  | [optional] 
**ring** | **str** |  | [optional] 
**site** | **str** |  | [optional] 
**device_mac** | **str** |  | [optional] 
**backup_pxe_ip** | **str** |  | [optional] 

## Example

```python
from cdx_client.models.pxe_rollback_request import PXERollbackRequest

# TODO update the JSON string below
json = "{}"
# create an instance of PXERollbackRequest from a JSON string
pxe_rollback_request_instance = PXERollbackRequest.from_json(json)
# print the JSON string representation of the object
print(PXERollbackRequest.to_json())

# convert the object into a dict
pxe_rollback_request_dict = pxe_rollback_request_instance.to_dict()
# create an instance of PXERollbackRequest from a dict
pxe_rollback_request_from_dict = PXERollbackRequest.from_dict(pxe_rollback_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


