# DeviceSummary


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**total** | **int** |  | [optional] [default to 0]
**online** | **int** |  | [optional] [default to 0]
**offline** | **int** |  | [optional] [default to 0]
**warning** | **int** |  | [optional] [default to 0]

## Example

```python
from cdx_client.models.device_summary import DeviceSummary

# TODO update the JSON string below
json = "{}"
# create an instance of DeviceSummary from a JSON string
device_summary_instance = DeviceSummary.from_json(json)
# print the JSON string representation of the object
print(DeviceSummary.to_json())

# convert the object into a dict
device_summary_dict = device_summary_instance.to_dict()
# create an instance of DeviceSummary from a dict
device_summary_from_dict = DeviceSummary.from_dict(device_summary_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


