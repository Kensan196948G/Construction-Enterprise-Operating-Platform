# IsoBuildJobCreateRequest

Operator-supplied parameters for enqueuing a new ISO build.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | **str** |  | 
**git_ref** | **str** |  | 
**notes** | **str** |  | [optional] 

## Example

```python
from cdx_client.models.iso_build_job_create_request import IsoBuildJobCreateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IsoBuildJobCreateRequest from a JSON string
iso_build_job_create_request_instance = IsoBuildJobCreateRequest.from_json(json)
# print the JSON string representation of the object
print(IsoBuildJobCreateRequest.to_json())

# convert the object into a dict
iso_build_job_create_request_dict = iso_build_job_create_request_instance.to_dict()
# create an instance of IsoBuildJobCreateRequest from a dict
iso_build_job_create_request_from_dict = IsoBuildJobCreateRequest.from_dict(iso_build_job_create_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


