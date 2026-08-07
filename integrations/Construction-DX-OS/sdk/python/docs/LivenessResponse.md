# LivenessResponse

Liveness probe response — process-level vitals only.  Deliberately excludes storage/redis status: a downstream outage must not trigger pod restart. Use ``/health/ready`` (or legacy ``/health``) for deep dependency checks.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **str** |  | [optional] [default to 'ok']
**service** | **str** |  | [optional] [default to 'cdx-server']
**version** | **str** |  | 
**uptime_seconds** | **float** |  | [optional] [default to 0.0]

## Example

```python
from cdx_client.models.liveness_response import LivenessResponse

# TODO update the JSON string below
json = "{}"
# create an instance of LivenessResponse from a JSON string
liveness_response_instance = LivenessResponse.from_json(json)
# print the JSON string representation of the object
print(LivenessResponse.to_json())

# convert the object into a dict
liveness_response_dict = liveness_response_instance.to_dict()
# create an instance of LivenessResponse from a dict
liveness_response_from_dict = LivenessResponse.from_dict(liveness_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


