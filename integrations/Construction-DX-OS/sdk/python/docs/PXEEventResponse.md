# PXEEventResponse

Acknowledgement returned to agent-bootstrap.sh.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**recorded** | **bool** |  | [optional] [default to True]
**event** | [**PXEBootEvent**](PXEBootEvent.md) |  | 

## Example

```python
from cdx_client.models.pxe_event_response import PXEEventResponse

# TODO update the JSON string below
json = "{}"
# create an instance of PXEEventResponse from a JSON string
pxe_event_response_instance = PXEEventResponse.from_json(json)
# print the JSON string representation of the object
print(PXEEventResponse.to_json())

# convert the object into a dict
pxe_event_response_dict = pxe_event_response_instance.to_dict()
# create an instance of PXEEventResponse from a dict
pxe_event_response_from_dict = PXEEventResponse.from_dict(pxe_event_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


