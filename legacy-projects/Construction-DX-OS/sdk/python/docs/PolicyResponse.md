# PolicyResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | **str** |  | 
**update_ring** | **str** |  | 
**heartbeat_interval_seconds** | **int** |  | 
**inventory_interval_seconds** | **int** |  | 
**policy_version** | **int** |  | 

## Example

```python
from cdx_client.models.policy_response import PolicyResponse

# TODO update the JSON string below
json = "{}"
# create an instance of PolicyResponse from a JSON string
policy_response_instance = PolicyResponse.from_json(json)
# print the JSON string representation of the object
print(PolicyResponse.to_json())

# convert the object into a dict
policy_response_dict = policy_response_instance.to_dict()
# create an instance of PolicyResponse from a dict
policy_response_from_dict = PolicyResponse.from_dict(policy_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


