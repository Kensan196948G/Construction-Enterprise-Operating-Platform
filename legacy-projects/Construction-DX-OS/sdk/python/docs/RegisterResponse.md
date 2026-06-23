# RegisterResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**device_id** | **str** |  | 
**registered_at** | **datetime** |  | 
**already_registered** | **bool** |  | 

## Example

```python
from cdx_client.models.register_response import RegisterResponse

# TODO update the JSON string below
json = "{}"
# create an instance of RegisterResponse from a JSON string
register_response_instance = RegisterResponse.from_json(json)
# print the JSON string representation of the object
print(RegisterResponse.to_json())

# convert the object into a dict
register_response_dict = register_response_instance.to_dict()
# create an instance of RegisterResponse from a dict
register_response_from_dict = RegisterResponse.from_dict(register_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


