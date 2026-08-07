# DashboardResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**devices** | [**DeviceSummary**](DeviceSummary.md) |  | [optional] 
**iso_builds** | [**IsoBuildSummary**](IsoBuildSummary.md) |  | [optional] 
**server** | [**ServerSummary**](ServerSummary.md) |  | [optional] 

## Example

```python
from cdx_client.models.dashboard_response import DashboardResponse

# TODO update the JSON string below
json = "{}"
# create an instance of DashboardResponse from a JSON string
dashboard_response_instance = DashboardResponse.from_json(json)
# print the JSON string representation of the object
print(DashboardResponse.to_json())

# convert the object into a dict
dashboard_response_dict = dashboard_response_instance.to_dict()
# create an instance of DashboardResponse from a dict
dashboard_response_from_dict = DashboardResponse.from_dict(dashboard_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


