# IsoBuildSummary


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**total** | **int** |  | [optional] [default to 0]
**running** | **int** |  | [optional] [default to 0]
**succeeded** | **int** |  | [optional] [default to 0]
**failed** | **int** |  | [optional] [default to 0]
**cancelled** | **int** |  | [optional] [default to 0]

## Example

```python
from cdx_client.models.iso_build_summary import IsoBuildSummary

# TODO update the JSON string below
json = "{}"
# create an instance of IsoBuildSummary from a JSON string
iso_build_summary_instance = IsoBuildSummary.from_json(json)
# print the JSON string representation of the object
print(IsoBuildSummary.to_json())

# convert the object into a dict
iso_build_summary_dict = iso_build_summary_instance.to_dict()
# create an instance of IsoBuildSummary from a dict
iso_build_summary_from_dict = IsoBuildSummary.from_dict(iso_build_summary_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


