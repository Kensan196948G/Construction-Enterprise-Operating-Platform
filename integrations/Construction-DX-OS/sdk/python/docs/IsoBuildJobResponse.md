# IsoBuildJobResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**profile** | **str** |  | 
**requested_by** | **str** |  | 
**status** | **str** |  | 
**git_ref** | **str** |  | 
**started_at** | **datetime** |  | 
**finished_at** | **datetime** |  | 
**iso_path** | **str** |  | 
**iso_sha256** | **str** |  | 
**iso_size_bytes** | **int** |  | 
**log_path** | **str** |  | 
**error_message** | **str** |  | 
**notes** | **str** |  | 
**created_at** | **datetime** |  | 

## Example

```python
from cdx_client.models.iso_build_job_response import IsoBuildJobResponse

# TODO update the JSON string below
json = "{}"
# create an instance of IsoBuildJobResponse from a JSON string
iso_build_job_response_instance = IsoBuildJobResponse.from_json(json)
# print the JSON string representation of the object
print(IsoBuildJobResponse.to_json())

# convert the object into a dict
iso_build_job_response_dict = iso_build_job_response_instance.to_dict()
# create an instance of IsoBuildJobResponse from a dict
iso_build_job_response_from_dict = IsoBuildJobResponse.from_dict(iso_build_job_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


