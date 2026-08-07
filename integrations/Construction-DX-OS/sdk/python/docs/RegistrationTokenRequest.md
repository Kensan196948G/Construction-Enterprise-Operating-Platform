# RegistrationTokenRequest

Body for POST /api/v1/devices/registration-tokens.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | **str** |  | 
**fingerprint** | **str** | SHA-256 hex digest of machine-id:MAC | 

## Example

```python
from cdx_client.models.registration_token_request import RegistrationTokenRequest

# TODO update the JSON string below
json = "{}"
# create an instance of RegistrationTokenRequest from a JSON string
registration_token_request_instance = RegistrationTokenRequest.from_json(json)
# print the JSON string representation of the object
print(RegistrationTokenRequest.to_json())

# convert the object into a dict
registration_token_request_dict = registration_token_request_instance.to_dict()
# create an instance of RegistrationTokenRequest from a dict
registration_token_request_from_dict = RegistrationTokenRequest.from_dict(registration_token_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


