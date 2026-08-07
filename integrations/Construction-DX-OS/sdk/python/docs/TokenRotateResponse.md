# TokenRotateResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **str** |  | 
**expires_at** | **datetime** |  | 

## Example

```python
from cdx_client.models.token_rotate_response import TokenRotateResponse

# TODO update the JSON string below
json = "{}"
# create an instance of TokenRotateResponse from a JSON string
token_rotate_response_instance = TokenRotateResponse.from_json(json)
# print the JSON string representation of the object
print(TokenRotateResponse.to_json())

# convert the object into a dict
token_rotate_response_dict = token_rotate_response_instance.to_dict()
# create an instance of TokenRotateResponse from a dict
token_rotate_response_from_dict = TokenRotateResponse.from_dict(token_rotate_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


