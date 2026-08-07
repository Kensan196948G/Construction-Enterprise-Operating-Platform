# IsoBuildJobListResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[IsoBuildJobResponse]**](IsoBuildJobResponse.md) |  | 
**total** | **int** |  | 

## Example

```python
from cdx_client.models.iso_build_job_list_response import IsoBuildJobListResponse

# TODO update the JSON string below
json = "{}"
# create an instance of IsoBuildJobListResponse from a JSON string
iso_build_job_list_response_instance = IsoBuildJobListResponse.from_json(json)
# print the JSON string representation of the object
print(IsoBuildJobListResponse.to_json())

# convert the object into a dict
iso_build_job_list_response_dict = iso_build_job_list_response_instance.to_dict()
# create an instance of IsoBuildJobListResponse from a dict
iso_build_job_list_response_from_dict = IsoBuildJobListResponse.from_dict(iso_build_job_list_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


