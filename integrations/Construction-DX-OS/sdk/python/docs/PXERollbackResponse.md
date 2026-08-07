# PXERollbackResponse

Rollback intent recorded + script command returned for operator execution.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**recorded** | **bool** |  | [optional] [default to True]
**pattern** | [**PXERollbackPattern**](PXERollbackPattern.md) |  | 
**audit_id** | **str** | Request-ID for audit trail correlation. | 
**script_name** | **str** | Script file to execute on the PXE server. | 
**command** | **str** | Exact command to run (with --dry-run for preview). | 

## Example

```python
from cdx_client.models.pxe_rollback_response import PXERollbackResponse

# TODO update the JSON string below
json = "{}"
# create an instance of PXERollbackResponse from a JSON string
pxe_rollback_response_instance = PXERollbackResponse.from_json(json)
# print the JSON string representation of the object
print(PXERollbackResponse.to_json())

# convert the object into a dict
pxe_rollback_response_dict = pxe_rollback_response_instance.to_dict()
# create an instance of PXERollbackResponse from a dict
pxe_rollback_response_from_dict = PXERollbackResponse.from_dict(pxe_rollback_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


