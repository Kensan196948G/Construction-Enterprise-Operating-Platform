# PXEEventRequest

Payload from agent-bootstrap.sh reporting a boot event.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**event** | [**PXEBootEvent**](PXEBootEvent.md) |  | 
**profile** | **str** |  | 
**fingerprint** | **str** |  | 
**duration_seconds** | **float** |  | [optional] 
**error_message** | **str** |  | [optional] 

## Example

```python
from cdx_client.models.pxe_event_request import PXEEventRequest

# TODO update the JSON string below
json = "{}"
# create an instance of PXEEventRequest from a JSON string
pxe_event_request_instance = PXEEventRequest.from_json(json)
# print the JSON string representation of the object
print(PXEEventRequest.to_json())

# convert the object into a dict
pxe_event_request_dict = pxe_event_request_instance.to_dict()
# create an instance of PXEEventRequest from a dict
pxe_event_request_from_dict = PXEEventRequest.from_dict(pxe_event_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


