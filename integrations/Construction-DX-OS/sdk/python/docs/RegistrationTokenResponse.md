# RegistrationTokenResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **str** |  | 
**expires_at** | **datetime** |  | 

## Example

```python
from cdx_client.models.registration_token_response import RegistrationTokenResponse

# TODO update the JSON string below
json = "{}"
# create an instance of RegistrationTokenResponse from a JSON string
registration_token_response_instance = RegistrationTokenResponse.from_json(json)
# print the JSON string representation of the object
print(RegistrationTokenResponse.to_json())

# convert the object into a dict
registration_token_response_dict = registration_token_response_instance.to_dict()
# create an instance of RegistrationTokenResponse from a dict
registration_token_response_from_dict = RegistrationTokenResponse.from_dict(registration_token_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


